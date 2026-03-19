import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, Settings, DollarSign, MapPin, Clock, Calculator, 
  TrendingUp, Package, RefreshCw, Eye, Edit, CheckCircle,
  XCircle, AlertCircle, ArrowRight
} from 'lucide-react';

interface DeliveryConfig {
  id: number;
  name: string;
  active_provider: string;
  active_provider_display: string;
  kwik_configured: boolean;
  kwik_is_sandbox: boolean;
  kwik_api_key?: string;
  kwik_api_secret?: string;
  base_delivery_fee: number;
  price_per_km: number;
  min_delivery_fee: number;
  max_delivery_fee: number;
  max_delivery_radius_km: number;
  markup_type: string;
  platform_markup_percent: number;
  platform_markup_fixed: number;
  minutes_per_km: number;
  pickup_buffer_minutes: number;
  traffic_multiplier: number;
  is_active: boolean;
  updated_at: string;
}

interface PricingBreakdown {
  distance_km: number;
  base_fee: number;
  distance_fee: number;
  subtotal: number;
  markup_type: string;
  markup_value: number;
  markup_amount: number;
  final_total: number;
  platform_revenue: number;
  provider_cost: number;
}

interface DeliveryOrder {
  id: number;
  tracking_code: string;
  status: string;
  business: { id: number; name: string };
  pickup_address: string;
  dropoff_address: string;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  delivery_fee: number;
  distance_km: number;
  estimated_delivery_minutes: number;
  rider_name: string;
  provider_name: string;
  created_at: string;
}

interface DashboardStats {
  total_deliveries: number;
  recent_deliveries: number;
  total_revenue: number;
  monthly_revenue: number;
  avg_delivery_fee: number;
  avg_distance_km: number;
  delivery_enabled_businesses: number;
  total_businesses: number;
  adoption_rate: number;
  status_counts: Record<string, number>;
  daily_deliveries: Array<{ date: string; count: number; revenue: number }>;
  top_businesses: Array<{ id: number; name: string; delivery_count: number; total_revenue: number }>;
}

export default function AdminDeliveryManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<DeliveryConfig | null>(null);
  const [editConfig, setEditConfig] = useState<Partial<DeliveryConfig>>({});
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Dashboard state
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  
  // Pricing calculator
  const [calcDistance, setCalcDistance] = useState<number>(10);
  const [calcResult, setCalcResult] = useState<PricingBreakdown | null>(null);
  const [pricingTable, setPricingTable] = useState<any[]>([]);
  
  // Deliveries list
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  
  // Selected delivery detail
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Pending deliveries for approval
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [pendingPagination, setPendingPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useEffect(() => {
    loadConfig();
    loadDashboard();
    loadPricingTable();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await apiGet('admin/delivery/config/') as any;
      if (data.success) {
        setConfig(data.config);
        setEditConfig(data.config);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load delivery config', variant: 'destructive' });
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await apiGet('admin/delivery/dashboard/') as any;
      if (data.success) {
        setDashboard(data.dashboard);
      }
    } catch (error: any) {
      console.error('Dashboard error:', error);
    }
  };

  const loadPricingTable = async () => {
    try {
      const data = await apiGet('admin/delivery/pricing-table/') as any;
      if (data.success) {
        setPricingTable(data.pricing_table);
      }
    } catch (error: any) {
      console.error('Pricing table error:', error);
    }
  };

  const loadDeliveries = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (deliveryFilter.status && deliveryFilter.status !== 'all') params.append('status', deliveryFilter.status);
      if (deliveryFilter.search) params.append('search', deliveryFilter.search);
      
      const data = await apiGet(`admin/delivery/orders/?${params}`) as any;
      if (data.success) {
        setDeliveries(data.deliveries);
        setPagination(data.pagination);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load deliveries', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = async () => {
    try {
      const data = await apiPost('admin/delivery/calculate/', { distance_km: calcDistance }) as any;
      if (data.success) {
        setCalcResult(data.breakdown);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to calculate price', variant: 'destructive' });
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const data = await apiPut('admin/delivery/config/update/', editConfig) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Configuration saved' });
        loadConfig();
        loadPricingTable();
        setConfigDialogOpen(false);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const viewDeliveryDetail = async (deliveryId: number) => {
    try {
      const data = await apiGet(`admin/delivery/orders/${deliveryId}/`) as any;
      if (data.success) {
        setSelectedDelivery(data.delivery);
        setDetailDialogOpen(true);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load delivery details', variant: 'destructive' });
    }
  };

  const updateDeliveryStatus = async (deliveryId: number, newStatus: string) => {
    try {
      const data = await apiPost(`admin/delivery/orders/${deliveryId}/status/`, { 
        status: newStatus,
        notes: 'Status updated from admin panel'
      }) as any;
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        loadDeliveries(pagination.page);
        if (selectedDelivery?.id === deliveryId) {
          viewDeliveryDetail(deliveryId);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Load pending deliveries awaiting platform approval
  const loadPendingDeliveries = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await apiGet(`admin/delivery/pending/?page=${page}`) as any;
      if (data.success) {
        setPendingDeliveries(data.deliveries || []);
        setPendingPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load pending deliveries', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Approve delivery and charge platform fee
  const approveDelivery = async (deliveryId: number) => {
    setApprovingId(deliveryId);
    try {
      const data = await apiPost(`admin/delivery/pending/${deliveryId}/approve/`, {}) as any;
      if (data.success) {
        toast({ 
          title: 'Delivery Approved', 
          description: data.message || 'Platform fee has been added to pending delivery fees' 
        });
        loadPendingDeliveries(pendingPagination.page);
        loadDashboard();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to approve delivery', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      rider_assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
            Delivery Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure delivery pricing, view orders, and track platform revenue
          </p>
        </div>
        <Button size="sm" onClick={() => { loadConfig(); loadDashboard(); loadPricingTable(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card className="p-2 mb-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto bg-transparent">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">Dashboard</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm py-2" onClick={() => loadPendingDeliveries()}>Pending</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm py-2">Pricing</TabsTrigger>
            <TabsTrigger value="config" className="text-xs sm:text-sm py-2">Configuration</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm py-2 col-span-2 sm:col-span-1" onClick={() => loadDeliveries()}>Orders</TabsTrigger>
          </TabsList>
        </Card>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboard ? (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.total_deliveries}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.recent_deliveries} in last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{dashboard.total_revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      ₦{dashboard.monthly_revenue.toLocaleString()} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Delivery Fee</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{dashboard.avg_delivery_fee.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg. {dashboard.avg_distance_km.toFixed(1)}km distance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Business Adoption</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.adoption_rate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.delivery_enabled_businesses} of {dashboard.total_businesses} businesses
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(dashboard.status_counts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          {getStatusBadge(status)}
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Businesses by Delivery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.top_businesses.slice(0, 5).map((biz, idx) => (
                        <div key={biz.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            {biz.name}
                          </span>
                          <span className="font-medium">{biz.delivery_count} orders</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
          )}
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing Calculator
                </CardTitle>
                <CardDescription>
                  Calculate delivery fee for any distance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="calcDistance">Distance (km)</Label>
                    <Input
                      id="calcDistance"
                      type="number"
                      value={calcDistance}
                      onChange={(e) => setCalcDistance(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={calculatePrice}>Calculate</Button>
                  </div>
                </div>

                {calcResult && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base Fee</span>
                      <span>₦{calcResult.base_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Distance Fee ({calcResult.distance_km}km)</span>
                      <span>₦{calcResult.distance_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span>Subtotal</span>
                      <span>₦{calcResult.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-primary">
                      <span>Platform Markup ({calcResult.markup_type === 'percentage' ? `${calcResult.markup_value}%` : `₦${calcResult.markup_value}`})</span>
                      <span>+₦{calcResult.markup_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Fee</span>
                      <span>₦{calcResult.final_total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Platform Revenue</span>
                      <span className="text-green-600">₦{calcResult.platform_revenue.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Config Summary */}
            {config && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Current Pricing Config
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Base Fee</span>
                      <p className="font-medium">₦{config.base_delivery_fee}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Per Km Rate</span>
                      <p className="font-medium">₦{config.price_per_km}/km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Markup Type</span>
                      <p className="font-medium capitalize">{config.markup_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Markup Value</span>
                      <p className="font-medium">
                        {config.markup_type === 'percentage' 
                          ? `${config.platform_markup_percent}%`
                          : `₦${config.platform_markup_fixed}`
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Fee</span>
                      <p className="font-medium">₦{config.min_delivery_fee}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Fee</span>
                      <p className="font-medium">₦{config.max_delivery_fee}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Distance</span>
                      <p className="font-medium">{config.max_delivery_radius_km}km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provider</span>
                      <p className="font-medium">{config.active_provider_display}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setConfigDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Table</CardTitle>
              <CardDescription>Delivery fees for common distances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Distance</th>
                      <th className="text-right py-2">Delivery Fee</th>
                      <th className="text-right py-2">Platform Revenue</th>
                      <th className="text-right py-2">Provider Cost</th>
                      <th className="text-right py-2">Est. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingTable.map((row) => (
                      <tr key={row.distance_km} className="border-b">
                        <td className="py-2">{row.distance_km}km</td>
                        <td className="text-right py-2 font-medium">₦{row.delivery_fee.toLocaleString()}</td>
                        <td className="text-right py-2 text-green-600">₦{row.platform_revenue.toLocaleString()}</td>
                        <td className="text-right py-2 text-muted-foreground">₦{row.provider_cost.toLocaleString()}</td>
                        <td className="text-right py-2">{row.estimated_minutes} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          {config && (
            <div className="space-y-4">
              {/* Pricing Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pricing Configuration</CardTitle>
                  <CardDescription>Set base fees and per-km rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Base Delivery Fee (₦)</Label>
                      <Input
                        type="number"
                        value={editConfig.base_delivery_fee || ''}
                        onChange={(e) => setEditConfig({...editConfig, base_delivery_fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Price Per Km (₦)</Label>
                      <Input
                        type="number"
                        value={editConfig.price_per_km || ''}
                        onChange={(e) => setEditConfig({...editConfig, price_per_km: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Minimum Fee (₦)</Label>
                      <Input
                        type="number"
                        value={editConfig.min_delivery_fee || ''}
                        onChange={(e) => setEditConfig({...editConfig, min_delivery_fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Maximum Fee (₦)</Label>
                      <Input
                        type="number"
                        value={editConfig.max_delivery_fee || ''}
                        onChange={(e) => setEditConfig({...editConfig, max_delivery_fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm">Max Delivery Distance (km)</Label>
                      <Input
                        type="number"
                        value={editConfig.max_delivery_radius_km || ''}
                        onChange={(e) => setEditConfig({...editConfig, max_delivery_radius_km: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Markup */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Platform Markup (Your Revenue)
                  </CardTitle>
                  <CardDescription>Choose percentage or fixed amount markup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Markup Type</Label>
                    <Select
                      value={editConfig.markup_type || 'percentage'}
                      onValueChange={(value) => setEditConfig({...editConfig, markup_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editConfig.markup_type === 'percentage' ? (
                    <div>
                      <Label>Markup Percentage (%)</Label>
                      <Input
                        type="number"
                        value={editConfig.platform_markup_percent || ''}
                        onChange={(e) => setEditConfig({...editConfig, platform_markup_percent: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Example: 10% of ₦1,500 = ₦150 platform fee
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label>Fixed Markup (₦)</Label>
                      <Input
                        type="number"
                        value={editConfig.platform_markup_fixed || ''}
                        onChange={(e) => setEditConfig({...editConfig, platform_markup_fixed: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Example: ₦100 flat fee added to every delivery
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Estimation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Estimation
                  </CardTitle>
                  <CardDescription>Configure delivery time calculations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Minutes Per Km</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editConfig.minutes_per_km || ''}
                        onChange={(e) => setEditConfig({...editConfig, minutes_per_km: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pickup Buffer (min)</Label>
                      <Input
                        type="number"
                        value={editConfig.pickup_buffer_minutes || ''}
                        onChange={(e) => setEditConfig({...editConfig, pickup_buffer_minutes: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm">Traffic Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editConfig.traffic_multiplier || ''}
                        onChange={(e) => setEditConfig({...editConfig, traffic_multiplier: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        1.3 = 30% extra time for traffic
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Provider
                  </CardTitle>
                  <CardDescription>Configure delivery provider (Kwik API)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Active Provider</Label>
                    <Select
                      value={editConfig.active_provider || 'platform'}
                      onValueChange={(value) => setEditConfig({...editConfig, active_provider: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform">Platform Calculator (Haversine)</SelectItem>
                        <SelectItem value="kwik">Kwik Delivery API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editConfig.active_provider === 'kwik' && (
                    <>
                      <div>
                        <Label>Kwik API Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter Kwik API Key"
                          onChange={(e) => setEditConfig(prev => ({...prev, kwik_api_key: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label>Kwik API Secret</Label>
                        <Input
                          type="password"
                          placeholder="Enter Kwik API Secret"
                          onChange={(e) => setEditConfig(prev => ({...prev, kwik_api_secret: e.target.value}))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="kwikSandbox"
                          checked={editConfig.kwik_is_sandbox}
                          onChange={(e) => setEditConfig({...editConfig, kwik_is_sandbox: e.target.checked})}
                        />
                        <Label htmlFor="kwikSandbox">Use Sandbox Mode</Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-center sm:justify-end pt-2">
                <Button onClick={saveConfig} disabled={isLoading} size="lg" className="w-full sm:w-auto">
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Pending Deliveries Tab - For Platform Approval */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Delivery Approvals
              </CardTitle>
              <CardDescription>
                Deliveries completed by riders awaiting platform approval. Approving a delivery will charge the platform fee to the business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending deliveries awaiting approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDeliveries.map((delivery) => (
                    <Card key={delivery.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-100 text-amber-800">
                                {delivery.tracking_code}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(delivery.completed_at || delivery.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">{delivery.business?.name || 'Unknown Business'}</p>
                              <p className="text-muted-foreground">
                                {delivery.dropoff_contact_name} • {delivery.dropoff_contact_phone}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{delivery.distance_km?.toFixed(1) || 0} km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>₦{(delivery.delivery_fee || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>Platform Fee: ₦{(delivery.platform_fee || config?.platform_markup_fixed || 200).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                From: {delivery.pickup_address?.substring(0, 50)}...
                              </span>
                              <span className="flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                To: {delivery.dropoff_address?.substring(0, 50)}...
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewDeliveryDetail(delivery.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveDelivery(delivery.id)}
                              disabled={approvingId === delivery.id}
                            >
                              {approvingId === delivery.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Pagination */}
                  {pendingPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingPagination.page === 1}
                        onClick={() => loadPendingDeliveries(pendingPagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm">
                        Page {pendingPagination.page} of {pendingPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingPagination.page >= pendingPagination.totalPages}
                        onClick={() => loadPendingDeliveries(pendingPagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by tracking code, customer, address..."
                    value={deliveryFilter.search}
                    onChange={(e) => setDeliveryFilter({...deliveryFilter, search: e.target.value})}
                  />
                </div>
                <Select
                  value={deliveryFilter.status}
                  onValueChange={(value) => setDeliveryFilter({...deliveryFilter, status: value})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="rider_assigned">Rider Assigned</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => loadDeliveries()}>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Tracking</th>
                      <th className="text-left py-2">Business</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-right py-2">Fee</th>
                      <th className="text-right py-2">Distance</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-mono text-xs">{delivery.tracking_code}</td>
                        <td className="py-2">{delivery.business?.name || 'N/A'}</td>
                        <td className="py-2">{delivery.dropoff_contact_name}</td>
                        <td className="py-2">{getStatusBadge(delivery.status)}</td>
                        <td className="py-2 text-right">₦{delivery.delivery_fee?.toLocaleString()}</td>
                        <td className="py-2 text-right">{delivery.distance_km?.toFixed(1)}km</td>
                        <td className="py-2">{new Date(delivery.created_at).toLocaleDateString()}</td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => viewDeliveryDetail(delivery.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => loadDeliveries(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadDeliveries(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Delivery Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Pricing Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Pricing Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Delivery Fee (₦)</Label>
                  <Input
                    type="number"
                    value={editConfig.base_delivery_fee || ''}
                    onChange={(e) => setEditConfig({...editConfig, base_delivery_fee: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Km (₦)</Label>
                  <Input
                    type="number"
                    value={editConfig.price_per_km || ''}
                    onChange={(e) => setEditConfig({...editConfig, price_per_km: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Fee (₦)</Label>
                  <Input
                    type="number"
                    value={editConfig.min_delivery_fee || ''}
                    onChange={(e) => setEditConfig({...editConfig, min_delivery_fee: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Fee (₦)</Label>
                  <Input
                    type="number"
                    value={editConfig.max_delivery_fee || ''}
                    onChange={(e) => setEditConfig({...editConfig, max_delivery_fee: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            {/* Markup Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Platform Markup</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Markup Type</Label>
                  <Select
                    value={editConfig.markup_type || 'percentage'}
                    onValueChange={(value) => setEditConfig({...editConfig, markup_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editConfig.markup_type === 'percentage' ? (
                  <div className="space-y-2">
                    <Label>Markup Percentage (%)</Label>
                    <Input
                      type="number"
                      value={editConfig.platform_markup_percent || ''}
                      onChange={(e) => setEditConfig({...editConfig, platform_markup_percent: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fixed Markup (₦)</Label>
                    <Input
                      type="number"
                      value={editConfig.platform_markup_fixed || ''}
                      onChange={(e) => setEditConfig({...editConfig, platform_markup_fixed: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Distance & Time Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Distance & Time</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Delivery Radius (km)</Label>
                  <Input
                    type="number"
                    value={editConfig.max_delivery_radius_km || ''}
                    onChange={(e) => setEditConfig({...editConfig, max_delivery_radius_km: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minutes Per Km</Label>
                  <Input
                    type="number"
                    value={editConfig.minutes_per_km || ''}
                    onChange={(e) => setEditConfig({...editConfig, minutes_per_km: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Code</p>
                  <p className="font-mono font-bold">{selectedDelivery.tracking_code}</p>
                </div>
                {getStatusBadge(selectedDelivery.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="text-sm">{selectedDelivery.pickup?.address}</p>
                  <p className="text-xs text-muted-foreground">{selectedDelivery.pickup?.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dropoff</p>
                  <p className="text-sm">{selectedDelivery.dropoff?.address}</p>
                  <p className="text-xs text-muted-foreground">{selectedDelivery.dropoff?.contact_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-y">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Fee</p>
                  <p className="font-bold">₦{selectedDelivery.delivery_fee?.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-bold">{selectedDelivery.distance_km?.toFixed(1)}km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Est. Time</p>
                  <p className="font-bold">{selectedDelivery.estimated_delivery_minutes} min</p>
                </div>
              </div>

              {selectedDelivery.rider && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Rider Info</p>
                  <div className="text-sm">
                    <p><strong>{selectedDelivery.rider.name}</strong></p>
                    <p className="text-muted-foreground">{selectedDelivery.rider.phone}</p>
                    <p className="text-muted-foreground">{selectedDelivery.rider.vehicle_type} - {selectedDelivery.rider.plate_number}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'confirmed', 'rider_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedDelivery.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedDelivery.id, status)}
                      disabled={selectedDelivery.status === status}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* History */}
              {selectedDelivery.history?.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Status History</p>
                  <div className="space-y-2">
                    {selectedDelivery.history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        {getStatusBadge(h.status)}
                        {h.message && <span className="text-muted-foreground">- {h.message}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
