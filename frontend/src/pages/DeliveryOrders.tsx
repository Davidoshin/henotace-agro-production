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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <Truck className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Delivery Orders</h1>
                <p className="text-muted-foreground">
                  {orders.length} total orders
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/delivery-orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking code, customer, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
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
              
              <Button variant="outline" onClick={loadDeliveryOrders} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Orders</CardTitle>
            <CardDescription>
              Manage and track all your delivery orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching orders" : "No delivery orders"}
                </h3>
                <p className="text-muted-foreground mb-4">
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
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Order Details</th>
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Fee</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{order.delivery_number}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {order.tracking_code}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            {order.customer_name && (
                              <div className="font-medium">{order.customer_name}</div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {order.dropoff_address}
                            </div>
                            {order.customer_phone && (
                              <div className="text-sm">
                                <a href={`tel:${order.customer_phone}`} className="text-primary">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {order.customer_phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-4">
                          {order.delivery_fee ? formatCurrency(order.delivery_fee) : 'N/A'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
