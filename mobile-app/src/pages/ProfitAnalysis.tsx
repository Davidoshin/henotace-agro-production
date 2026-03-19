import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner, { TableSkeleton, ButtonSpinner, PageSpinner } from '@/components/ui/LoadingSpinner';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  Package,
  ArrowLeft,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { getBaseUrl } from '@/lib/api';

interface ProductProfit {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  opening_quantity: number;
  restock_quantity: number;
  closing_quantity: number;
  quantity_sold: number;
  selling_price: number;
  cost_price: number;
  revenue: number;
  cost: number;
  profit: number;
  profit_margin: number;
}

interface Branch {
  id: number;
  name: string;
}

interface Store {
  id: number;
  name: string;
  branch_id: number;
  branch_name: string;
}

interface AnalyticsData {
  success: boolean;
  date_range: {
    start_date: string;
    end_date: string;
    is_single_day: boolean;
  };
  available_branches: Branch[];
  available_stores: Store[];
  summary: {
    total_products: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
  };
  products: ProductProfit[];
}

export default function ProfitAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get local date string helper
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Filters - default to today in local timezone
  const [startDate, setStartDate] = useState(() => getLocalDateString());
  const [endDate, setEndDate] = useState(() => getLocalDateString());
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/business-login');
        return;
      }

      // Try to load cached data first for instant display
      const cacheKey = `profit_analysis_cache_${startDate}_${endDate}_${selectedBranch}_${selectedStore}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData);
          const cacheAge = Date.now() - (cached.timestamp || 0);
          // Use cache if less than 2 minutes old
          if (cacheAge < 120000) {
            setData(cached.data);
          }
        } catch (e) {
          console.log('Cache parse error, fetching fresh data');
        }
      }

      let url = `${getBaseUrl()}business/analytics/product-profit/?start_date=${startDate}&end_date=${endDate}`;
      if (selectedBranch && selectedBranch !== 'all') {
        url += `&branch_id=${selectedBranch}`;
      }
      if (selectedStore && selectedStore !== 'all') {
        url += `&store_id=${selectedStore}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
      
      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('Cache storage failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on filter changes (inline filtering)
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedBranch, selectedStore]);

  // Reset store when branch changes
  useEffect(() => {
    setSelectedStore('all');
  }, [selectedBranch]);

  // Get filtered stores based on selected branch
  const filteredStores = data?.available_stores?.filter(store => 
    selectedBranch === 'all' || store.branch_id.toString() === selectedBranch
  ) || [];

  // Filter products by search term (client-side filtering)
  const filteredProducts = data?.products?.filter(product => {
    if (!productSearch.trim()) return true;
    const searchLower = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.barcode || '').toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  }) || [];
  const exportToExcel = async () => {
    if (!data?.products) return;
    
    setExporting(true);
    try {
      // Create CSV content
      const headers = ['Product', 'SKU', 'Category', 'Opening Qty', 'Restock', 'Closing Qty', 'Qty Sold', 'Selling Price', 'Cost Price', 'Revenue', 'Cost', 'Profit', 'Margin %'];
      const rows = data.products.map(p => [
        p.name,
        p.sku,
        p.category,
        p.opening_quantity,
        p.restock_quantity || 0,
        p.closing_quantity,
        p.quantity_sold,
        p.selling_price.toFixed(2),
        p.cost_price.toFixed(2),
        p.revenue.toFixed(2),
        p.cost.toFixed(2),
        p.profit.toFixed(2),
        p.profit_margin.toFixed(1)
      ]);
      
      // Add summary row
      rows.push([]);
      rows.push(['SUMMARY', '', '', '', '', '', '', '', '', 
        data.summary.total_revenue.toFixed(2),
        data.summary.total_cost.toFixed(2),
        data.summary.total_profit.toFixed(2),
        data.summary.profit_margin.toFixed(1)
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `profit-analysis-${startDate}-to-${endDate}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!data?.products) return;
    
    setExporting(true);
    try {
      // Use browser print for PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Profit Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 12px; color: #666; }
            .summary-value { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f0f0f0; }
            .profit-positive { color: green; }
            .profit-negative { color: red; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Profit Analysis Report</h1>
          <button class="no-print" onclick="window.print()" style="margin:10px 0 20px 0;padding:10px 20px;cursor:pointer;">Print / Save as PDF</button>
          <p>Date Range: ${startDate} to ${endDate}</p>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Revenue</div>
                <div class="summary-value">₦${data.summary.total_revenue.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Cost</div>
                <div class="summary-value">₦${data.summary.total_cost.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Profit</div>
                <div class="summary-value ${data.summary.total_profit >= 0 ? 'profit-positive' : 'profit-negative'}">₦${data.summary.total_profit.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Profit Margin</div>
                <div class="summary-value">${data.summary.profit_margin.toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Opening Qty</th>
                <th>Restock</th>
                <th>Closing Qty</th>
                <th>Sold</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${data.products.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${p.opening_quantity}</td>
                  <td>${p.restock_quantity || 0}</td>
                  <td>${p.closing_quantity}</td>
                  <td>${p.quantity_sold}</td>
                  <td>₦${p.revenue.toLocaleString()}</td>
                  <td>₦${p.cost.toLocaleString()}</td>
                  <td class="${p.profit >= 0 ? 'profit-positive' : 'profit-negative'}">₦${p.profit.toLocaleString()}</td>
                  <td>${p.profit_margin.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Account / Profit Analysis</h1>
            <p className="text-muted-foreground">Track product-level profitability</p>
          </div>
        </div>
          
          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/business-admin-dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={exportToExcel} disabled={exporting || !data?.products?.length}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="flex">
              <Button className="w-full sm:w-auto" variant="outline" onClick={exportToPDF} disabled={exporting || !data?.products?.length}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {data?.available_branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Store/Warehouse</Label>
                <Select 
                  value={selectedStore} 
                  onValueChange={setSelectedStore}
                  disabled={filteredStores.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredStores.length === 0 ? "No stores available" : "All Stores"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {filteredStores.map(store => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name} {selectedBranch === 'all' ? `(${store.branch_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product Search</Label>
                <Input 
                  type="text" 
                  placeholder="Search by name, SKU, or barcode..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            {loading && (
              <div className="flex items-center justify-center mt-4 text-muted-foreground">
                <ButtonSpinner className="mr-2" />
                <span className="text-sm">Updating results...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:pt-6 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full shrink-0">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-sm md:text-xl font-bold truncate">₦{data.summary.total_revenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:pt-6 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full shrink-0">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-sm md:text-xl font-bold truncate">₦{data.summary.total_cost.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:pt-6 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`p-2 md:p-3 rounded-full shrink-0 ${data.summary.total_profit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {data.summary.total_profit >= 0 
                      ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      : <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Profit</p>
                    <p className={`text-sm md:text-xl font-bold truncate ${data.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{data.summary.total_profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:pt-6 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full shrink-0">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Profit Margin</p>
                    <p className="text-sm md:text-xl font-bold">{data.summary.profit_margin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Breakdown</CardTitle>
            <CardDescription>
              {data?.date_range?.is_single_day 
                ? `Products sold on ${data.date_range.start_date}`
                : `Products sold from ${data?.date_range?.start_date} to ${data?.date_range?.end_date}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <PageSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : !data?.products?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No product data found for the selected date range.</p>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden">
                  <Table containerClassName="max-h-[500px] overflow-y-auto overflow-x-auto" className="relative">
                    <TableHeader className="sticky top-0 z-20">
                      <TableRow className="bg-muted/50">
                        <TableHead className="sticky top-0 z-20 min-w-[150px] md:min-w-[200px] font-semibold bg-muted/50">Product</TableHead>
                        <TableHead className="sticky top-0 z-20 text-center min-w-[80px] md:min-w-[100px] font-semibold bg-muted/50">Opening Qty</TableHead>
                        <TableHead className="sticky top-0 z-20 text-center min-w-[60px] md:min-w-[80px] font-semibold bg-muted/50">Restock</TableHead>
                        <TableHead className="sticky top-0 z-20 text-center min-w-[80px] md:min-w-[100px] font-semibold bg-muted/50">Closing Qty</TableHead>
                        <TableHead className="sticky top-0 z-20 text-center min-w-[60px] md:min-w-[80px] font-semibold bg-muted/50">Sold</TableHead>
                        <TableHead className="sticky top-0 z-20 text-right min-w-[90px] md:min-w-[120px] font-semibold bg-muted/50">Revenue</TableHead>
                        <TableHead className="sticky top-0 z-20 text-right min-w-[90px] md:min-w-[120px] font-semibold bg-muted/50">Cost</TableHead>
                        <TableHead className="sticky top-0 z-20 text-right min-w-[90px] md:min-w-[120px] font-semibold bg-muted/50">Profit</TableHead>
                        <TableHead className="sticky top-0 z-20 text-right min-w-[60px] md:min-w-[80px] font-semibold bg-muted/50">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {productSearch ? `No products found matching "${productSearch}"` : 'No products found'}
                          </TableCell>
                        </TableRow>
                      ) : filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="min-w-[150px] md:min-w-[200px]">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center min-w-[80px] md:min-w-[100px]">{product.opening_quantity}</TableCell>
                          <TableCell className="text-center min-w-[60px] md:min-w-[80px] text-blue-600">{product.restock_quantity || 0}</TableCell>
                          <TableCell className="text-center min-w-[80px] md:min-w-[100px]">{product.closing_quantity}</TableCell>
                          <TableCell className="text-center min-w-[60px] md:min-w-[80px] font-medium">{product.quantity_sold}</TableCell>
                          <TableCell className="text-right min-w-[90px] md:min-w-[120px]">₦{product.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right min-w-[90px] md:min-w-[120px]">₦{product.cost.toLocaleString()}</TableCell>
                          <TableCell className={`text-right min-w-[90px] md:min-w-[120px] font-semibold ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₦{product.profit.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right min-w-[60px] md:min-w-[80px]">
                            <Badge variant={product.profit_margin >= 20 ? 'default' : product.profit_margin >= 0 ? 'secondary' : 'destructive'}>
                              {product.profit_margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
