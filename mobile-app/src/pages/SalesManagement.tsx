import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiGet, getAppBaseUrl } from "@/lib/api";
import { ArrowLeft, Search, Calendar, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  created_at: string;
  customer?: { name: string };
  staff?: { id: number; name: string; employee_id: string };
  branch?: { id: number; name: string; code: string };
  final_amount?: number;
  total_amount?: number;
  payment_status: string;
  payment_method: string;
  has_returns?: boolean;
  items?: SaleItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
}

export default function SalesManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [canAccessSales, setCanAccessSales] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const checkScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = 200;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const load = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', PAGE_SIZE.toString());
      
      const data = await apiGet(`business/sales/?${params.toString()}`);
      const salesData = data.sales || [];
      
      if (append) {
        setSales(prev => [...prev, ...salesData]);
        setFilteredSales(prev => [...prev, ...salesData]);
      } else {
        setSales(salesData);
        setFilteredSales(salesData);
      }
      
      // Update pagination state
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
        setTotalSales(data.pagination.total);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load sales', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      load(currentPage + 1, true);
    }
  };

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

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          const allowed = !!data?.staff?.can_manage_sales || !!data?.staff?.can_view_reports;
          setCanAccessSales(allowed);
          if (!allowed) {
            toast({ title: 'Access denied', description: "You don't have permission to access sales", variant: 'destructive' });
            navigate('/business-staff-dashboard');
          }
        })
        .catch(() => {
          setCanAccessSales(false);
          toast({ title: 'Access denied', description: "You don't have permission to access sales", variant: 'destructive' });
          navigate('/business-staff-dashboard');
        });
    } else {
      setCanAccessSales(true);
    }
  }, [navigate, toast]);

  useEffect(() => { 
    if (canAccessSales) {
      load(); 
      loadBranches();
    }
  }, [canAccessSales]);

  // Check scroll state when data loads
  useEffect(() => {
    setTimeout(checkScroll, 100);
  }, [filteredSales]);

  // Apply filters
  useEffect(() => {
    let filtered = [...sales];

    // Search filter - search by product name, customer name, or staff name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        // Check customer name
        if (s.customer?.name?.toLowerCase().includes(query)) return true;
        // Check staff name
        if (s.staff?.name?.toLowerCase().includes(query)) return true;
        // Check product names in items
        if (s.items?.some(item => item.product?.name?.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    // Category filter (payment method)
    if (categoryFilter !== "all") {
      filtered = filtered.filter(s => s.payment_method === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "returned") {
        filtered = filtered.filter(s => s.has_returns === true);
      } else {
        filtered = filtered.filter(s => s.payment_status === statusFilter);
      }
    }

    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter(s => s.branch?.id?.toString() === branchFilter);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => new Date(s.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => new Date(s.created_at) <= end);
    }

    setFilteredSales(filtered);
  }, [sales, searchQuery, categoryFilter, statusFilter, branchFilter, startDate, endDate]);

  const openReceipt = (id: number) => {
    window.open(`${getAppBaseUrl()}/business/receipt/${id}`, '_blank');
  };

  const getStatusBadge = (sale: Sale) => {
    if (sale.has_returns) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Returned</span>;
    }
    
    const status = sale.payment_status;
    const statusStyles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700',
      'paid': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'failed': 'bg-red-100 text-red-700',
      'refunded': 'bg-purple-100 text-purple-700',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">All sales and transactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-4">
          {/* Row 1: Search, Category, Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, customer, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="paystack">Paystack</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Successful</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            {/* Branch Filter - only show if multiple branches exist */}
            {branches.length > 1 && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name} {branch.is_main_branch && "(HQ)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Row 2: Date Range (responsive - full width on mobile) */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            {(startDate || endDate || categoryFilter !== 'all' || statusFilter !== 'all' || branchFilter !== 'all' || searchQuery) && (
              <Button 
                variant="outline" 
                size="sm"
                className="self-end"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setBranchFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredSales.length} of {sales.length} transactions
          </div>
        </div>

        {/* Table with horizontal scroll controls */}
        <div className="bg-card rounded-lg shadow">
          {/* Scroll controls at top */}
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">Swipe or use arrows to scroll →</span>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => scrollTable('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => scrollTable('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={tableContainerRef}
            className="overflow-x-auto"
            onScroll={checkScroll}
            onLoad={checkScroll}
          >
            <table className="w-full min-w-[1000px]">
              <thead className="bg-muted/50 border-b sticky top-0">
                <tr>
                  <th className="p-3 text-left font-medium">Products</th>
                  <th className="p-3 text-left font-medium">Staff</th>
                  {branches.length > 1 && <th className="p-3 text-left font-medium">Branch</th>}
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 text-center font-medium">Status</th>
                  <th className="p-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={branches.length > 1 ? 8 : 7} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      Loading...
                    </div>
                  </td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan={branches.length > 1 ? 8 : 7} className="p-8 text-muted-foreground text-center">
                    {sales.length === 0 ? 'No sales yet' : 'No transactions match your filters'}
                  </td></tr>
                ) : (
                  filteredSales.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 max-w-[200px]">
                        <div className="space-y-0.5">
                          {s.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm truncate">
                              {item.product?.name} <span className="text-muted-foreground">x{item.quantity}</span>
                            </div>
                          ))}
                          {(s.items?.length || 0) > 2 && (
                            <div className="text-xs text-muted-foreground">+{(s.items?.length || 0) - 2} more</div>
                          )}
                          {!s.items?.length && <span className="text-muted-foreground text-sm">-</span>}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{s.staff?.name || <span className="text-muted-foreground">-</span>}</td>
                      {branches.length > 1 && (
                        <td className="p-3 text-sm">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                            <Building2 className="h-3 w-3" />
                            {s.branch?.name || 'Main'}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-sm whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 text-sm">{s.customer?.name || 'Walk-in'}</td>
                      <td className="p-3 text-right font-medium">
                        ₦{parseFloat(String(s.final_amount || s.total_amount || 0)).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(s)}</td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline" onClick={() => openReceipt(s.id)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Load More / Pagination Controls */}
          {currentPage < totalPages && (
            <div className="flex flex-col items-center mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                Showing {sales.length} of {totalSales} sales
              </p>
              <Button 
                variant="outline" 
                onClick={loadMore}
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
        </div>
      </div>
    </div>
  );
}

