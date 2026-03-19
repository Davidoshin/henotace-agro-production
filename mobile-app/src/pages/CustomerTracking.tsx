import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import {
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  User,
  Phone,
  RefreshCw,
  AlertCircle,
  XCircle
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
  product_name?: string;
  quantity?: number;
  weight?: string;
  dimensions?: string;
  special_instructions?: string;
  rider_name?: string;
  rider_phone?: string;
  shipping_fee?: number;
  estimated_delivery?: string;
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

export default function CustomerTracking() {
  const navigate = useNavigate();
  const { trackingCode: urlTrackingCode } = useParams();
  const { toast } = useToast();
  
  const [trackingCode, setTrackingCode] = useState(urlTrackingCode || "");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-track if tracking code is in URL
  useEffect(() => {
    if (urlTrackingCode) {
      trackShipment();
    }
  }, [urlTrackingCode]);

  const trackShipment = async () => {
    if (!trackingCode.trim()) {
      setError("Please enter a tracking code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await apiGet(`delivery/track/${trackingCode.trim()}/`);
      
      if (response.success) {
        setShipment(response.delivery);
        toast({
          title: "Tracking Found",
          description: "Shipment details loaded successfully",
        });
      } else {
        setError(response.error || "Tracking code not found");
        setShipment(null);
      }
    } catch (error) {
      console.error("Error tracking shipment:", error);
      setError("Failed to track shipment. Please try again.");
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
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
    if (shipment?.rider_phone) {
      window.location.href = `tel:${shipment.rider_phone}`;
    }
  };

  const callCustomer = () => {
    if (shipment?.customer_phone) {
      window.location.href = `tel:${shipment.customer_phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Package className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Track Your Shipment</h1>
            <p className="text-xs text-muted-foreground">
              Enter your tracking code to see real-time status
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Tracking Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Tracking Code</CardTitle>
            <CardDescription>
              Find your shipment by entering the tracking code provided by the seller
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter tracking code (e.g., TRK-123456789)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && trackShipment()}
                  className="pl-10"
                />
              </div>
              <Button onClick={trackShipment} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipment Details */}
        {shipment && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold">{shipment.shipment_number}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tracking: {shipment.tracking_code}
                    </p>
                  </div>
                  {getStatusBadge(shipment.status)}
                </div>

                {shipment.estimated_delivery && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Est. Delivery: {formatDate(shipment.estimated_delivery)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{shipment.dropoff_address}</p>
                    <p className="text-sm text-muted-foreground">Delivery Location</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{shipment.customer_name}</p>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                  </div>
                  {shipment.customer_phone && (
                    <Button variant="outline" size="sm" onClick={callCustomer}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shipment.product_name && (
                  <div>
                    <p className="font-medium">{shipment.product_name}</p>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {shipment.quantity && (
                    <div>
                      <p className="font-medium">{shipment.quantity}</p>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                    </div>
                  )}
                  {shipment.shipping_fee && (
                    <div>
                      <p className="font-medium">{formatCurrency(shipment.shipping_fee)}</p>
                      <p className="text-sm text-muted-foreground">Shipping Fee</p>
                    </div>
                  )}
                </div>
                
                {shipment.weight && (
                  <div>
                    <p className="font-medium">{shipment.weight}</p>
                    <p className="text-sm text-muted-foreground">Weight</p>
                  </div>
                )}
                
                {shipment.dimensions && (
                  <div>
                    <p className="font-medium">{shipment.dimensions}</p>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                  </div>
                )}
                
                {shipment.special_instructions && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Instructions:</p>
                    <p className="text-sm">{shipment.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rider Information */}
            {shipment.rider_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Rider Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{shipment.rider_name}</p>
                      <p className="text-sm text-muted-foreground">Delivery Rider</p>
                    </div>
                  </div>
                  
                  {shipment.rider_phone && (
                    <Button variant="outline" className="w-full" onClick={callRider}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Rider
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Live Location */}
            {shipment.current_latitude && shipment.current_longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Live Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Live tracking available</p>
                      <p className="text-sm">
                        Last updated: {shipment.location_updated_at ? 
                          formatDate(shipment.location_updated_at) : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>
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
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{formatDate(shipment.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tracking Code</span>
                  <span className="text-sm font-mono">{shipment.tracking_code}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
