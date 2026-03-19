import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  Edit,
  RefreshCw,
  Navigation,
  XCircle,
  AlertCircle
} from "lucide-react";

interface DeliveryOrder {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  dropoff_address: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  rider_name?: string;
  rider_phone?: string;
  rider_photo_url?: string;
  delivery_fee?: number;
  estimated_delivery_time?: string;
  created_at: string;
  current_latitude?: number;
  current_longitude?: number;
  location_updated_at?: string;
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

export default function DeliveryOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrderDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await apiGet(`business/delivery/orders/${id}/`);
      
      if (response.success) {
        setOrder(response.delivery);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load delivery order",
          variant: "destructive"
        });
        navigate('/delivery-orders');
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery order",
        variant: "destructive"
      });
      navigate('/delivery-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

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

  const callRider = () => {
    if (order?.rider_phone) {
      window.location.href = `tel:${order.rider_phone}`;
    }
  };

  const callPickup = () => {
    if (order?.pickup_contact_phone) {
      window.location.href = `tel:${order.pickup_contact_phone}`;
    }
  };

  const callDropoff = () => {
    if (order?.dropoff_contact_phone) {
      window.location.href = `tel:${order.dropoff_contact_phone}`;
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Delivery Details</h1>
                <p className="text-muted-foreground">{order.delivery_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadOrderDetails} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/delivery-orders/${order.id}/edit`)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold">{order.delivery_number}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tracking: {order.tracking_code}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {order.estimated_delivery_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>ETA: {formatDate(order.estimated_delivery_time)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  Pickup Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{order.pickup_address}</p>
                    <p className="text-sm text-muted-foreground">Pickup Location</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.pickup_contact_name}</p>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={callPickup}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{order.dropoff_address}</p>
                    <p className="text-sm text-muted-foreground">Delivery Location</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.dropoff_contact_name}</p>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={callDropoff}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Location */}
            {order.current_latitude && order.current_longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-green-500" />
                    Live Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Live tracking available</p>
                      <p className="text-sm">
                        Last updated: {order.location_updated_at ? 
                          formatDate(order.location_updated_at) : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rider Information */}
            {order.rider_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Rider Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {order.rider_photo_url ? (
                      <img 
                        src={order.rider_photo_url} 
                        alt={order.rider_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{order.rider_name}</p>
                      <p className="text-sm text-muted-foreground">Delivery Rider</p>
                    </div>
                  </div>
                  
                  {order.rider_phone && (
                    <Button variant="outline" className="w-full" onClick={callRider}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Rider
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivery Fee</span>
                  <span className="text-sm font-medium">
                    {order.delivery_fee ? formatCurrency(order.delivery_fee) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{formatDate(order.created_at)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tracking Code</span>
                  <span className="text-sm font-mono">{order.tracking_code}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
