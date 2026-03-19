import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { ArrowLeft, Printer, Download, Calendar, Filter, Package, Building2, Search, Check, ChevronsUpDown, X, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SaleItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: number;
  sale_number: string;
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
  staff: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
    code: string;
  } | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: SaleItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
}

export default function SalesDetails() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  // Filters - use URL params if provided, default to today (local date)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getLocalDateString();
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || today);
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || today);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 100; // Increased for better performance
  
  // API summary stats (accurate totals from server)
  const [apiSummary, setApiSummary] = useState<{
    total_revenue: number;
  } | null>(null);
  
  // Product search popover state
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  
  // Date filter dropdown state (for mobile)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  
  // Thermal printer state
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const serialPortRef = useRef<any>(null);
  const writerRef = useRef<any>(null);

  // Connect to thermal printer
  const connectPrinter = async () => {
    try {
      if (!('serial' in navigator)) {
        toast({
          title: "Not Supported",
          description: "Web Serial API is not supported in this browser. Use Chrome or Edge.",
          variant: "destructive"
        });
        return false;
      }

      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
          { usbVendorId: 0x067B, usbProductId: 0x2303 }, // Prolific
          { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // CH340
        ]
      });

      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      
      const writer = port.writable.getWriter();
      writerRef.current = writer;
      
      // Initialize printer
      await writer.write(new Uint8Array([0x1B, 0x40])); // ESC @
      
      setPrinterConnected(true);
      toast({
        title: "Printer Connected",
        description: "Thermal printer is ready to print receipts",
      });
      return true;
    } catch (error: any) {
      console.error('Printer connection error:', error);
      if (error.name !== 'NotFoundError') {
        toast({
          title: "Connection Failed",
          description: error.message || "Could not connect to printer",
          variant: "destructive"
        });
      }
      return false;
    }
  };

  // Print to thermal printer
  const printToThermal = async (sale: Sale) => {
    if (!writerRef.current) {
      const connected = await connectPrinter();
      if (!connected) return false;
    }

    try {
      setIsPrinting(true);
      const writer = writerRef.current;
      const encoder = new TextEncoder();
      const businessName = localStorage.getItem('business_name') || 'SALES RECEIPT';

      // ESC/POS commands
      const ESC = 0x1B;
      const GS = 0x1D;
      const centerOn = new Uint8Array([ESC, 0x61, 0x01]);
      const centerOff = new Uint8Array([ESC, 0x61, 0x00]);
      const boldOn = new Uint8Array([ESC, 0x45, 0x01]);
      const boldOff = new Uint8Array([ESC, 0x45, 0x00]);
      const doubleHeight = new Uint8Array([GS, 0x21, 0x11]);
      const normalSize = new Uint8Array([GS, 0x21, 0x00]);

      // Header
      await writer.write(centerOn);
      await writer.write(doubleHeight);
      await writer.write(boldOn);
      await writer.write(encoder.encode(businessName + '\n'));
      await writer.write(normalSize);
      await writer.write(boldOff);
      await writer.write(encoder.encode('--------------------------------\n'));
      await writer.write(centerOff);

      // Receipt info
      const date = new Date(sale.created_at);
      await writer.write(encoder.encode(`Receipt: ${sale.sale_number}\n`));
      await writer.write(encoder.encode(`Date: ${date.toLocaleDateString()}\n`));
      await writer.write(encoder.encode(`Time: ${date.toLocaleTimeString()}\n`));
      await writer.write(encoder.encode(`Customer: ${sale.customer?.name || 'Walk-in'}\n`));
      if (sale.staff) {
        await writer.write(encoder.encode(`Staff: ${sale.staff.name}\n`));
      }
      await writer.write(encoder.encode('--------------------------------\n'));

      // Items
      for (const item of sale.items) {
        const name = item.product.name.substring(0, 20);
        const qty = `x${item.quantity}`;
        const price = `N${item.total_price.toLocaleString()}`;
        await writer.write(encoder.encode(`${name}\n`));
        await writer.write(encoder.encode(`  ${qty}  ${item.product.sku || ''}  ${price}\n`));
      }

      await writer.write(encoder.encode('--------------------------------\n'));

      // Totals
      await writer.write(encoder.encode(`Subtotal:        N${sale.total_amount.toLocaleString()}\n`));
      if (sale.discount_amount > 0) {
        await writer.write(encoder.encode(`Discount:       -N${sale.discount_amount.toLocaleString()}\n`));
      }
      await writer.write(boldOn);
      await writer.write(encoder.encode(`TOTAL:           N${sale.final_amount.toLocaleString()}\n`));
      await writer.write(boldOff);
      await writer.write(encoder.encode(`Payment: ${sale.payment_method}\n`));
      await writer.write(encoder.encode('--------------------------------\n'));

      // Footer
      await writer.write(centerOn);
      await writer.write(encoder.encode('Thank you for your purchase!\n\n\n'));
      await writer.write(centerOff);

      // Cut paper
      await writer.write(new Uint8Array([GS, 0x56, 0x00]));

      toast({
        title: "Receipt Printed",
        description: "Receipt sent to thermal printer",
      });
      return true;
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error.message || "Could not print receipt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadStaff();
    loadBranches();
  }, []);

  // Load sales when any filter changes (dates, branch, product, staff)
  useEffect(() => {
    loadSales();
  }, [selectedBranch, startDate, endDate, selectedProduct, selectedStaff]);

  // Apply client-side filters for additional filtering on loaded data
  useEffect(() => {
    applyFilters();
  }, [sales]);

  const loadBranches = async () => {
    try {
      const data = await apiGet('business/branches/');
      if (data.success && data.branches) {
        setBranches(data.branches);
      }
    } catch (e: any) {
      console.error("Failed to load branches:", e);
    }
  };

  const loadSales = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        
        // Try to load cached data first for instant display
        const cacheKey = `sales_cache_${startDate}_${endDate}_${selectedBranch}_${selectedProduct}_${selectedStaff}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData);
            const cacheAge = Date.now() - (cached.timestamp || 0);
            // Use cache if less than 2 minutes old
            if (cacheAge < 120000) {
              setSales(cached.sales || []);
              setApiSummary(cached.summary || null);
              if (cached.pagination) {
                setCurrentPage(cached.pagination.page || 1);
                setTotalPages(cached.pagination.total_pages || 1);
                setTotalSales(cached.pagination.total_count || 0);
              }
            }
          } catch (e) {
            console.log('Cache parse error, fetching fresh data');
          }
        }
      }
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', PAGE_SIZE.toString());
      
      // Always pass date filters to API for server-side filtering
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (selectedBranch && selectedBranch !== "all") {
        params.append('branch_id', selectedBranch);
      }
      
      // Pass product filter to backend if selected
      if (selectedProduct && selectedProduct !== "all") {
        params.append('product_id', selectedProduct);
      }
      
      // Pass staff filter to backend if selected
      if (selectedStaff && selectedStaff !== "all") {
        params.append('staff_id', selectedStaff);
      }
      
      const data = await apiGet(`business/sales/?${params.toString()}`);
      
      if (append) {
        setSales(prev => [...prev, ...(data.sales || [])]);
      } else {
        setSales(data.sales || []);
      }
      
      // Update pagination state
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
        setTotalSales(data.pagination.total_count || data.pagination.total);
        
        // Auto-load remaining pages for complete data (up to 10 pages = 1000 sales)
        if (!append && data.pagination.total_pages > 1 && data.pagination.total_pages <= 10) {
          // Load remaining pages in background
          for (let p = 2; p <= data.pagination.total_pages; p++) {
            const moreParams = new URLSearchParams(params);
            moreParams.set('page', p.toString());
            const moreData = await apiGet(`business/sales/?${moreParams.toString()}`);
            if (moreData.sales) {
              setSales(prev => [...prev, ...moreData.sales]);
            }
          }
        }
      }
      
      // Store API summary stats (accurate totals from server)
      if (data.summary && !append) {
        setApiSummary(data.summary);
      }
      
      // Cache the data for quick return visits
      if (!append && data.sales) {
        const cacheKey = `sales_cache_${startDate}_${endDate}_${selectedBranch}_${selectedProduct}_${selectedStaff}`;
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            sales: data.sales,
            summary: data.summary,
            pagination: data.pagination,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.log('Cache storage failed, continuing without cache');
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load sales", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreSales = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadSales(currentPage + 1, true);
    }
  };

  const loadProducts = async () => {
    try {
      // Load products with pagination for dropdown
      const data = await apiGet("business/products/?page_size=100");
      setProducts(data.products || []);
    } catch (e: any) {
      console.error("Failed to load products:", e);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await apiGet("business/staff/");
      setStaff(data.staff || []);
    } catch (e: any) {
      console.error("Failed to load staff:", e);
    }
  };

  const applyFilters = () => {
    // Server-side filtering handles most filters now
    // This just sets filtered sales to the loaded sales
    setFilteredSales([...sales]);
  };

  // Print receipt - tries thermal printer first, then browser print
  const printReceipt = async (sale: Sale) => {
    // Try thermal printer first
    if (printerConnected) {
      await printToThermal(sale);
      return;
    }
    
    // Try to connect to thermal printer
    if ('serial' in navigator) {
      const connected = await connectPrinter();
      if (connected) {
        await printToThermal(sale);
        return;
      }
    }
    
    // Fallback to browser print
    browserPrint(sale);
  };

  // Browser print fallback
  const browserPrint = (sale: Sale) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const businessName = localStorage.getItem('business_name') || 'SALES RECEIPT';
      const businessSlug = localStorage.getItem('business_slug');
      const storeUrl = businessSlug ? `/store/${businessSlug}` : null;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${sale.sale_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h2 { margin: 0; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .items { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; margin: 8px 0; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            .qr-section { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; }
            .qr-section img { width: 80px; height: 80px; }
            .shop-online { font-size: 11px; color: #666; margin-top: 5px; }
            @media print { body { margin: 0; } .print-hide { display: none; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>${businessName}</h2>
              <p>Receipt #: ${sale.sale_number}</p>
            </div>
            
            <div class="info">
              <div class="info-row">
                <span>Date:</span>
                <span>${new Date(sale.created_at).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span>Customer:</span>
                <span>${sale.customer?.name || 'Walk-in Customer'}</span>
              </div>
              ${sale.staff ? `<div class="info-row"><span>Staff:</span><span>${sale.staff.name}</span></div>` : ''}
              <div class="info-row">
                <span>Payment:</span>
                <span>${sale.payment_method}</span>
              </div>
            </div>
            
            <div class="items">
              <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                <strong>ITEMS</strong>
              </div>
              ${sale.items.map(item => `
                <div class="item">
                  <span>${item.product.name} (x${item.quantity})</span>
                  <span>N${item.total_price.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="totals">
              <div class="info-row">
                <span>Subtotal:</span>
                <span>N${sale.total_amount.toLocaleString()}</span>
              </div>
              ${sale.discount_amount > 0 ? `
                <div class="info-row" style="color: green;">
                  <span>Discount:</span>
                  <span>-N${sale.discount_amount.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="total-row">
                <span>TOTAL:</span>
                <span>N${sale.final_amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              ${storeUrl ? `
              <div class="qr-section">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(storeUrl)}" alt="Store QR Code" />
                <p class="shop-online">Shop with us online!</p>
              </div>
              ` : ''}
              <p style="margin-top: 10px; font-size: 10px;">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Sale Number', 'Date', 'Customer', 'Staff', 'Product', 'Quantity', 'Unit Price', 'Total', 'Payment Method', 'Status'],
      ...filteredSales.flatMap(sale => 
        sale.items.map(item => [
          sale.sale_number,
          new Date(sale.created_at).toLocaleString(),
          sale.customer?.name || 'Walk-in',
          sale.staff?.name || 'N/A',
          item.product.name,
          item.quantity,
          item.unit_price,
          item.total_price,
          sale.payment_method,
          sale.payment_status
        ])
      )
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Sales report exported successfully" });
  };

  // Calculate totals - when a product is filtered, only count that product's amounts
  const calculateTotals = () => {
    if (selectedProduct && selectedProduct !== "all") {
      // Filter to only count the selected product's amounts
      let revenue = 0;
      let items = 0;
      let cost = 0;
      
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          if (item.product.id.toString() === selectedProduct) {
            revenue += item.total_price;
            items += item.quantity;
            cost += item.quantity * (item.unit_price * 0.7); // Approximate cost as 70% of price
          }
        });
      });
      
      return { revenue, items, cost, profit: revenue - cost };
    } else {
      // No product filter - count all items
      const revenue = filteredSales.reduce((sum, sale) => sum + sale.final_amount, 0);
      const items = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0), 0);
      const cost = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((s, i) => s + (i.quantity * (i.unit_price * 0.7)), 0), 0);
      return { revenue, items, cost, profit: revenue - cost };
    }
  };
  
  const totals = calculateTotals();
  const totalRevenue = totals.revenue;
  const totalItems = totals.items;
  const totalCost = totals.cost;
  const totalProfit = totals.profit;
  
  // Use API summary for accurate total count and revenue
  // Items and profit are estimated from loaded data
  const useApiSummary = apiSummary && (!selectedProduct || selectedProduct === "all");
  const displayTotalSales = totalSales || filteredSales.length;
  const displayRevenue = useApiSummary ? apiSummary.total_revenue : totalRevenue;
  const displayItems = totalItems; // From loaded data
  const displayProfit = totalProfit; // Estimated from loaded data

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Sales Report</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Product-level breakdown</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={printerConnected ? "default" : "outline"} 
            size="sm"
            onClick={connectPrinter}
            className={printerConnected ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">{printerConnected ? 'Connected' : 'Printer'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards - 2 per row on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold">{displayTotalSales}</div>
            {displayTotalSales > filteredSales.length && (
              <p className="text-xs text-muted-foreground">Showing {filteredSales.length} of {displayTotalSales}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              ₦{displayRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold">
              {displayItems.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Est. Profit</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className={`text-lg md:text-2xl font-bold ${displayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₦{displayProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter sales by date range, product, staff, or branch</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: 2x2 grid with Date dropdown, Desktop: 5 columns */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Filter with collapsible dropdown on mobile */}
            <div className="col-span-1 lg:col-span-2">
              {/* Mobile: Show button that toggles date range */}
              <div className="lg:hidden">
                <Label>Date</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {startDate || endDate ? (
                      <span className="text-sm">
                        {startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate}
                      </span>
                    ) : (
                      "Select Date Range"
                    )}
                  </span>
                  {dateDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 opacity-50" />
                  ) : (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  )}
                </Button>
                {/* Date inputs - shown when dropdown is open */}
                {dateDropdownOpen && (
                  <div className="mt-2 p-3 border rounded-md bg-muted/30 space-y-3">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Desktop: Show both date inputs inline */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Product</Label>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedProduct !== "all" 
                      ? products.find(p => p.id.toString() === selectedProduct)?.name || "All Products"
                      : "All Products"
                    }
                    {selectedProduct !== "all" ? (
                      <X 
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct("all");
                          setProductSearchValue("");
                        }}
                      />
                    ) : (
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search products..." 
                      value={productSearchValue}
                      onValueChange={setProductSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedProduct("all");
                            setProductSearchOpen(false);
                            setProductSearchValue("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProduct === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Products
                        </CommandItem>
                        {products.map(p => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setSelectedProduct(p.id.toString());
                              setProductSearchOpen(false);
                              setProductSearchValue("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProduct === p.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Staff</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Branch
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name} {b.is_main_branch && '(Main)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List with Product Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>Click on any sale to view details and print receipt</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {filteredSales.length} transactions
                {selectedProduct && selectedProduct !== "all" && (
                  <span className="ml-1 text-primary">(filtered by product)</span>
                )}
              </p>
              <p className="text-xl font-bold text-primary">
                ₦{totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sales found</div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredSales.map(sale => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{sale.sale_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          Customer: <span className="font-medium">{sale.customer?.name || 'Walk-in'}</span>
                        </p>
                        {sale.staff && (
                          <p className="text-sm">
                            Staff: <span className="font-medium">{sale.staff.name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">₦{sale.final_amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{sale.payment_method}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => printReceipt(sale)}
                          disabled={isPrinting}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {isPrinting ? 'Printing...' : (printerConnected ? 'Print to Thermal' : 'Print Receipt')}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Product Breakdown */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Products Sold
                      </h4>
                      <div className="space-y-2">
                        {sale.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                            <span>
                              <span className="font-medium">{item.product.name}</span>
                              <span className="text-muted-foreground ml-2">({item.product.sku})</span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              <span className="ml-4 font-medium">₦{item.total_price.toLocaleString()}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Load More / Pagination Controls */}
          {currentPage < totalPages && (
            <div className="flex flex-col items-center mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                Showing {sales.length} of {totalSales} sales
              </p>
              <Button 
                variant="outline" 
                onClick={loadMoreSales}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Loading more...
                  </>
                ) : (
                  'Load More Sales'
                )}
              </Button>
            </div>
          )}
          
          {/* Show total when all loaded */}
          {currentPage >= totalPages && sales.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing all {sales.length} sales
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
