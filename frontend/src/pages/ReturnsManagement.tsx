import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, getBaseUrl } from "@/lib/api";
import { 
  ArrowLeft, 
  RotateCcw, 
  Search, 
  Package, 
  DollarSign, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2
} from "lucide-react";

const BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
}

interface Sale {
  id: number;
  receipt_number: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
}

interface SaleItem {
  id: number;
  product_name: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReturnRecord {
  id: number;
  sale_id: number;
  receipt_number: string;
  customer_name: string;
  product_name: string;
  quantity_returned: number;
  refund_amount: number;
  reason: string;
  status: string;
  created_at: string;
  processed_by?: string;
}

function ReturnsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [returnForm, setReturnForm] = useState({
    sale_item_id: "",
    quantity: 1,
    reason: "",
    refund_type: "full" // full, partial, store_credit
  });
  const [stats, setStats] = useState({
    total_returns: 0,
    total_refunded: 0,
    pending_returns: 0,
    returns_today: 0
  });

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
    loadBranches();
  }, []);

  // Load returns when branch changes (including initial load)
  useEffect(() => {
    loadReturns();
  }, [selectedBranch]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      let url = 'business/returns/';
      if (selectedBranch && selectedBranch !== 'all') {
        url += `?branch_id=${selectedBranch}`;
      }
      const response = await apiGet(url);
      if (response.returns) {
        setReturns(response.returns);
      }
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchSales = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Query",
        description: "Please enter a receipt number, customer name, or product name",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiGet(`business/sales/?search=${encodeURIComponent(searchQuery)}`);
      if (response.results || response.sales) {
        setSales(response.results || response.sales || []);
        if ((response.results || response.sales || []).length === 0) {
          toast({
            title: "No Sales Found",
            description: "No sales match your search query",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search sales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSale = async (sale: Sale) => {
    // Load full sale details with items
    try {
      const response = await apiGet(`business/sales/${sale.id}/`);
      if (response.items || response.sale_items) {
        setSelectedSale({
          ...sale,
          items: response.items || response.sale_items || []
        });
        setShowReturnDialog(true);
      } else {
        setSelectedSale(sale);
        setShowReturnDialog(true);
      }
    } catch (error) {
      // Use sale as-is if can't load details
      setSelectedSale(sale);
      setShowReturnDialog(true);
    }
  };

  const processReturn = async () => {
    if (!selectedSale || !returnForm.sale_item_id || !returnForm.reason) {
      toast({
        title: "Missing Information",
        description: "Please select an item and provide a reason for return",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await apiPost('business/returns/', {
        sale_id: selectedSale.id,
        sale_item_id: parseInt(returnForm.sale_item_id),
        quantity: returnForm.quantity,
        reason: returnForm.reason,
        refund_type: returnForm.refund_type
      });

      if (response.success || response.id) {
        toast({
          title: "Return Processed",
          description: `Return processed successfully. ${response.refund_amount ? `Refund: ₦${response.refund_amount.toLocaleString()}` : ''}`,
        });
        setShowReturnDialog(false);
        setSelectedSale(null);
        setReturnForm({ sale_item_id: "", quantity: 1, reason: "", refund_type: "full" });
        setSales([]);
        setSearchQuery("");
        loadReturns();
      } else {
        toast({
          title: "Error",
          description: response.error || response.message || "Failed to process return",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Returns Management</h1>
            <p className="text-muted-foreground">Process product returns and refunds</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Returns</p>
                  <p className="text-xl font-bold">{stats.total_returns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Refunded</p>
                  <p className="text-xl font-bold">₦{stats.total_refunded.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{stats.pending_returns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-xl font-bold">{stats.returns_today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branch Filter */}
        {branches.length > 1 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-1 whitespace-nowrap">
                  <Building2 className="w-4 h-4" />
                  Filter by Branch:
                </Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[200px]">
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
            </CardContent>
          </Card>
        )}

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Sale to Return
            </CardTitle>
            <CardDescription>
              Search by receipt number, customer name, or product name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter receipt number, customer name, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchSales()}
                className="flex-1"
              />
              <Button onClick={searchSales} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Search Results */}
            {sales.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Search Results</h4>
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectSale(sale)}
                  >
                    <div>
                      <p className="font-medium">{sale.receipt_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.customer_name || 'Walk-in Customer'} • {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₦{sale.total_amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{sale.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Return History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading returns...</p>
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RotateCcw className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No returns processed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {returns.map((ret) => (
                  <div key={ret.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{ret.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ret.receipt_number} • Qty: {ret.quantity_returned}
                        </p>
                        <p className="text-xs text-muted-foreground">{ret.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-₦{ret.refund_amount?.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ret.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Dialog */}
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Process Return</DialogTitle>
              <DialogDescription>
                {selectedSale && (
                  <span>Receipt: {selectedSale.receipt_number} • ₦{selectedSale.total_amount?.toLocaleString()}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Select Item */}
              <div>
                <Label>Select Item to Return</Label>
                <Select 
                  value={returnForm.sale_item_id} 
                  onValueChange={(value) => setReturnForm({...returnForm, sale_item_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSale?.items?.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.product_name} (Qty: {item.quantity}) - ₦{item.total_price?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <Label>Quantity to Return</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedSale?.items?.find(i => i.id.toString() === returnForm.sale_item_id)?.quantity || 1}
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({...returnForm, quantity: parseInt(e.target.value) || 1})}
                />
              </div>

              {/* Refund Type */}
              <div>
                <Label>Refund Type</Label>
                <Select 
                  value={returnForm.refund_type} 
                  onValueChange={(value) => setReturnForm({...returnForm, refund_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div>
                <Label>Reason for Return</Label>
                <Textarea
                  placeholder="Enter reason for return..."
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                Cancel
              </Button>
              <Button onClick={processReturn} disabled={processing}>
                {processing ? "Processing..." : "Process Return"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ReturnsManagement;
