import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import LoadingSpinner, { CardGridSkeleton, TableSkeleton } from "@/components/ui/LoadingSpinner";
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  History
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Branch {
  id: number;
  name: string;
  stores: StoreInfo[];
}

interface StoreInfo {
  id: number;
  name: string;
  code: string;
}

interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  opening_stock: number;
  total_restocked: number;
  total_sold: number;
  total_adjusted: number;
  closing_stock: number;
}

interface DailyHistory {
  date: string;
  opening_quantity: number;
  quantity_restocked: number;
  quantity_sold: number;
  quantity_adjusted: number;
  closing_quantity: number;
  current_stock: number;
  movements: Movement[];
  calculated?: boolean;
}

interface Movement {
  type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  time: string | null;
}

interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
}

export default function StockHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Detail view
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [productHistory, setProductHistory] = useState<DailyHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBranches();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [startDate, endDate, selectedBranchId, selectedStoreId]);

  const loadBranches = async () => {
    try {
      const data = await apiGet("business/branches-stores/");
      setBranches(data.branches || []);
    } catch (error) {
      console.error("Failed to load branches:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Try to load cached data first for instant display
      const cacheKey = `stock_history_cache_${startDate}_${endDate}_${selectedBranchId}_${selectedStoreId}_${searchTerm}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData);
          const cacheAge = Date.now() - (cached.timestamp || 0);
          // Use cache if less than 2 minutes old
          if (cacheAge < 120000) {
            setProducts(cached.products || []);
          }
        } catch (e) {
          console.log('Cache parse error, fetching fresh data');
        }
      }
      
      let url = `business/stock-history/?start_date=${startDate}&end_date=${endDate}`;
      if (selectedBranchId) url += `&branch_id=${selectedBranchId}`;
      
      // Handle store filter options
      if (selectedStoreId === "no_store") {
        url += `&exclude_stores=true`;
      } else if (selectedStoreId) {
        url += `&store_id=${selectedStoreId}`;
      }
      
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      
      const data = await apiGet(url);
      setProducts(data.products || []);
      
      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          products: data.products || [],
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('Cache storage failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load stock history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductHistory = async (product: ProductSummary) => {
    try {
      setLoadingHistory(true);
      setSelectedProduct({
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        current_stock: product.current_stock,
      });
      
      let url = `business/stock-history/${product.id}/?start_date=${startDate}&end_date=${endDate}`;
      if (selectedBranchId) url += `&branch_id=${selectedBranchId}`;
      
      // Handle store filter options
      if (selectedStoreId === "no_store") {
        url += `&exclude_stores=true`;
      } else if (selectedStoreId) {
        url += `&store_id=${selectedStoreId}`;
      }
      
      const data = await apiGet(url);
      setProductHistory(data.history || []);
      setExpandedDays(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load product history",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleDayExpanded = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const availableStores = selectedBranchId 
    ? branches.find(b => b.id === parseInt(selectedBranchId))?.stores || []
    : [];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary calculations
  const totalRestocked = products.reduce((sum, p) => sum + p.total_restocked, 0);
  const totalSold = products.reduce((sum, p) => sum + p.total_sold, 0);
  const totalCurrentStock = products.reduce((sum, p) => sum + p.current_stock, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => selectedProduct ? setSelectedProduct(null) : navigate('/business-admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {selectedProduct ? 'Back to Products' : 'Back to Dashboard'}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">
              {selectedProduct ? `${selectedProduct.name} - Stock History` : 'Stock History'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {selectedProduct 
              ? `View day-by-day stock movements for ${selectedProduct.name}`
              : 'Track daily stock movements: opening, restocks, sales, and closing quantities'
            }
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-filter">Branch</Label>
                <select
                  id="branch-filter"
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setSelectedStoreId("");
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedBranchId && (
                <div className="space-y-2">
                  <Label htmlFor="store-filter">Store</Label>
                  <select
                    id="store-filter"
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">All (Branch + Stores)</option>
                    <option value="no_store">Branch Only (Exclude Stores)</option>
                    {availableStores.map((store) => (
                      <option key={store.id} value={store.id.toString()}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!selectedProduct && (
                <div className="space-y-2">
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Product name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Detail View */}
        {selectedProduct ? (
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>{selectedProduct.name}</CardTitle>
                    <CardDescription>
                      SKU: {selectedProduct.sku} • Unit: {selectedProduct.unit}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                    <div className="text-3xl font-bold text-primary">
                      {selectedProduct.current_stock.toLocaleString()} {selectedProduct.unit}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Daily History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Stock Movements</CardTitle>
                <CardDescription>
                  From {formatDate(startDate)} to {formatDate(endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : productHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stock history found for this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Date</TableHead>
                          <TableHead className="text-right">Opening</TableHead>
                          <TableHead className="text-right text-green-600">Restocked</TableHead>
                          <TableHead className="text-right text-red-600">Sold</TableHead>
                          <TableHead className="text-right">Adjusted</TableHead>
                          <TableHead className="text-right">Closing</TableHead>
                          <TableHead className="text-center">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productHistory.map((day) => (
                          <>
                            <TableRow 
                              key={day.date} 
                              className={`cursor-pointer hover:bg-muted/50 ${day.calculated ? 'bg-yellow-50/50' : ''}`}
                              onClick={() => day.movements.length > 0 && toggleDayExpanded(day.date)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {formatDate(day.date)}
                                  {day.calculated && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                      Calculated
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{day.opening_quantity.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {day.quantity_restocked > 0 && '+'}
                                {day.quantity_restocked.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-medium">
                                {day.quantity_sold > 0 && '-'}
                                {day.quantity_sold.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {day.quantity_adjusted !== 0 && (
                                  <span className={day.quantity_adjusted > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {day.quantity_adjusted > 0 ? '+' : ''}{day.quantity_adjusted.toLocaleString()}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">{day.closing_quantity.toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                {day.movements.length > 0 ? (
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    {expandedDays.has(day.date) ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                            {expandedDays.has(day.date) && day.movements.length > 0 && (
                              <TableRow key={`${day.date}-details`}>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">Movement Details:</div>
                                    {day.movements.map((movement, idx) => (
                                      <div key={idx} className="flex items-center gap-3 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          movement.type === 'restock' ? 'bg-green-100 text-green-800' :
                                          movement.type === 'sale' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {movement.type}
                                        </span>
                                        <span className="font-medium">
                                          {movement.type === 'sale' ? '-' : '+'}{movement.quantity}
                                        </span>
                                        {movement.reference && (
                                          <span className="text-muted-foreground">
                                            Ref: {movement.reference}
                                          </span>
                                        )}
                                        {movement.notes && (
                                          <span className="text-muted-foreground italic">
                                            {movement.notes}
                                          </span>
                                        )}
                                        {movement.time && (
                                          <span className="text-xs text-muted-foreground ml-auto">
                                            {new Date(movement.time).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Total Restocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +{totalRestocked.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Total Sold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    -{totalSold.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Current Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalCurrentStock.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total across all products</p>
                </CardContent>
              </Card>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Products Stock Summary
                </CardTitle>
                <CardDescription>
                  Click on a product to see detailed day-by-day history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Opening Stock</TableHead>
                          <TableHead className="text-right text-green-600">Restocked</TableHead>
                          <TableHead className="text-right text-red-600">Sold</TableHead>
                          <TableHead className="text-right">Current Stock</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow 
                            key={product.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => loadProductHistory(product)}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {product.sku} • {product.unit}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{product.opening_stock.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {product.total_restocked > 0 && '+'}
                              {product.total_restocked.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {product.total_sold > 0 && '-'}
                              {product.total_sold.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {product.current_stock.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadProductHistory(product);
                                }}
                              >
                                <History className="h-4 w-4 mr-1" />
                                View History
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
