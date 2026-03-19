import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import {
  Plus,
  Search,
  Filter,
  Truck,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Eye,
  Edit,
  RefreshCw
} from "lucide-react";

interface DeliveryOrder {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  customer_name?: string;
  customer_phone?: string;
  rider_name?: string;
  rider_phone?: string;
  delivery_fee?: number;
  estimated_delivery_time?: string;
  created_at: string;
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-500", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "bg-blue-500", label: "Confirmed" },
  rider_assigned: { icon: User, color: "bg-purple-500", label: "Rider Assigned" },
  picked_up: { icon: Package, color: "bg-orange-500", label: "Picked Up" },
  in_transit: { icon: Truck, color: "bg-blue-600", label: "In Transit" },
  delivered: { icon: CheckCircle, color: "bg-green-500", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-red-500", label: "Cancelled" },
  failed: { icon: AlertCircle, color: "bg-red-600", label: "Failed" },
};

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDeliveryOrders = async () => {
    try {
      setLoading(true);
      const response = await apiGet('business/delivery/orders/');
      
      if (response.success) {
        setOrders(response.orders || []);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load delivery orders",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading delivery orders:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <Truck className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Delivery Orders</h1>
              <p className="text-xs text-muted-foreground">
                {orders.length} total orders
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/delivery-orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking code, customer, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rider_assigned">Rider Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
                
                <Button variant="outline" size="sm" onClick={loadDeliveryOrders} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching orders" : "No delivery orders"}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Create your first delivery order to get started"
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => navigate('/delivery-orders/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{order.delivery_number}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-mono text-muted-foreground">{order.tracking_code}</span>
                      </div>
                      {order.customer_name && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Customer: {order.customer_name}
                          {order.customer_phone && (
                            <span className="ml-2">
                              <a href={`tel:${order.customer_phone}`} className="text-primary">
                                <Phone className="h-3 w-3 inline" />
                              </a>
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Delivery to:</p>
                        <p className="text-xs">{order.dropoff_address}</p>
                      </div>
                    </div>

                    {order.rider_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">
                          Rider: {order.rider_name}
                          {order.rider_phone && (
                            <a href={`tel:${order.rider_phone}`} className="text-primary ml-1">
                              <Phone className="h-3 w-3 inline" />
                            </a>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {order.delivery_fee && (
                          <span>{formatCurrency(order.delivery_fee)}</span>
                        )}
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/delivery-orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/delivery-orders/${order.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
