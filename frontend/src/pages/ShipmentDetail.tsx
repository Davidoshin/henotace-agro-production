import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  User,
  Phone,
  RefreshCw,
  Edit,
  Copy,
  Calendar,
  CreditCard,
  Navigation,
  Plane,
  Ship,
  Globe,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Shipment {
  id: number;
  shipment_number: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  sender_name?: string;
  sender_phone?: string;
  product_name?: string;
  quantity?: number;
  weight?: string;
  dimensions?: string;
  package_type?: string;
  special_instructions?: string;
  rider_name?: string;
  rider_phone?: string;
  shipping_fee?: number;
  estimated_delivery?: string;
  origin?: string;
  destination?: string;
  departure_time?: string;
  mode_of_movement?: string;
  payment_mode?: string;
  carrier?: string;
  created_at: string;
  updated_at: string;
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`business/shipments/${id}/`);
      
      if (response.success) {
        setShipment(response.shipment);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load shipment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading shipment:", error);
      toast({
        title: "Error",
        description: "Failed to load shipment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!shipment) return;
    
    try {
      setStatusLoading(true);
      const response = await apiPut(`business/shipments/${shipment.id}/`, {
        status: newStatus
      });
      
      if (response.success) {
        setShipment({ ...shipment, status: newStatus });
        toast({
          title: "Status Updated",
          description: `Shipment status changed to ${newStatus.replace('_', ' ')}`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const copyTrackingCode = () => {
    if (shipment?.tracking_code) {
      navigator.clipboard.writeText(shipment.tracking_code);
      toast({
        title: "Copied",
        description: "Tracking code copied to clipboard"
      });
    }
  };

  const callCustomer = () => {
    if (shipment?.customer_phone) {
      window.location.href = `tel:${shipment.customer_phone}`;
    }
  };

  const callRider = () => {
    if (shipment?.rider_phone) {
      window.location.href = `tel:${shipment.rider_phone}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Shipment Not Found</h2>
          <Button onClick={() => navigate("/shipping-management")}>
            Back to Shipments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate("/shipping-management")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shipments
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{shipment.shipment_number}</h1>
            <p className="text-sm text-muted-foreground">Tracking: {shipment.tracking_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={copyTrackingCode}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Tracking Code
          </Button>
          <Button 
            onClick={() => navigate(`/shipments/${shipment.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Shipment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Shipment Status
                </CardTitle>
                {getStatusBadge(shipment.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created: {formatDate(shipment.created_at)}</span>
                </div>
                
                {shipment.estimated_delivery && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Estimated Delivery: {formatDate(shipment.estimated_delivery)}</span>
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <Button
                        key={status}
                        variant={shipment.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(status)}
                        disabled={statusLoading || shipment.status === status}
                        className="flex items-center gap-1"
                      >
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Route */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-600">{shipment.origin || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Origin</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  {shipment.mode_of_movement === 'air_freight' && <Plane className="h-6 w-6 text-blue-600 mx-auto mb-2" />}
                  {shipment.mode_of_movement === 'sea_transport' && <Ship className="h-6 w-6 text-blue-600 mx-auto mb-2" />}
                  {shipment.mode_of_movement === 'land_shipping' && <Truck className="h-6 w-6 text-blue-600 mx-auto mb-2" />}
                  {!shipment.mode_of_movement && <Truck className="h-6 w-6 text-gray-400 mx-auto mb-2" />}
                  <p className="font-semibold text-blue-600">
                    {shipment.mode_of_movement === 'air_freight' && 'Air Freight'}
                    {shipment.mode_of_movement === 'sea_transport' && 'Sea Transport'}
                    {shipment.mode_of_movement === 'land_shipping' && 'Land Shipping'}
                    {!shipment.mode_of_movement && 'Standard'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shipment.carrier ? `via ${shipment.carrier}` : 'Transport Mode'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <MapPin className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-600">{shipment.destination || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Destination</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  Pickup Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{shipment.pickup_address}</p>
                {shipment.departure_time && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Departure: {formatDate(shipment.departure_time)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{shipment.dropoff_address}</p>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shipment.product_name && (
                  <div>
                    <p className="font-medium">{shipment.product_name}</p>
                    <p className="text-sm text-muted-foreground">Product</p>
                  </div>
                )}
                {shipment.quantity && (
                  <div>
                    <p className="font-medium">{shipment.quantity}</p>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                  </div>
                )}
                {shipment.weight && (
                  <div>
                    <p className="font-medium">{shipment.weight}</p>
                    <p className="text-sm text-muted-foreground">Weight</p>
                  </div>
                )}
                {shipment.package_type && (
                  <div>
                    <p className="font-medium capitalize">{shipment.package_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">Package Type</p>
                  </div>
                )}
              </div>
              
              {shipment.dimensions && (
                <div>
                  <p className="font-medium">{shipment.dimensions}</p>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                </div>
              )}
              
              {shipment.special_instructions && (
                <div className="pt-4 border-t">
                  <p className="font-medium">Special Instructions:</p>
                  <p className="text-sm text-muted-foreground mt-1">{shipment.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sender & Recipient */}
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sender</p>
                <p className="font-medium">{shipment.sender_name || 'N/A'}</p>
                {shipment.sender_phone && (
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {shipment.sender_phone}
                  </Button>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                <p className="font-medium">{shipment.customer_name || 'N/A'}</p>
                {shipment.customer_phone && (
                  <Button variant="ghost" size="sm" onClick={callCustomer} className="p-0 h-auto text-blue-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {shipment.customer_phone}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rider Information */}
          {shipment.rider_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  Rider Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{shipment.rider_name}</p>
                  {shipment.rider_phone && (
                    <Button variant="outline" size="sm" onClick={callRider} className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Rider
                    </Button>
                  )}
                  {shipment.current_latitude && shipment.current_longitude && (
                    <p className="text-xs text-muted-foreground">
                      Last location: {shipment.location_updated_at ? formatDate(shipment.location_updated_at) : 'Unknown'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.payment_mode && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Mode</p>
                  <p className="font-medium capitalize">{shipment.payment_mode}</p>
                </div>
              )}
              
              {shipment.shipping_fee !== undefined && shipment.shipping_fee > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Fee</p>
                  <p className="font-medium text-lg">₦{shipment.shipping_fee.toLocaleString()}</p>
                </div>
              )}
              
              {shipment.carrier && (
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium">{shipment.carrier.toUpperCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
