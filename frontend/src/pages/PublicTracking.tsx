import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
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
  XCircle,
  ArrowLeft,
  Share2,
  Download,
  Copy
} from "lucide-react";
import { useRef } from "react";

interface Shipment {
  id: number;
  shipment_number: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  customer_name?: string;
  customer_phone?: string;
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

function PublicTracking() {
  const navigate = useNavigate();
  const { trackingCode: urlTrackingCode } = useParams();
  const { toast } = useToast();
  
  const [trackingCode, setTrackingCode] = useState(urlTrackingCode || "");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef<any>(null);

  // Auto-track if tracking code is in URL
  useEffect(() => {
    if (urlTrackingCode) {
      trackShipment();
    }
  }, [urlTrackingCode]);

  // Generate shareable tracking URL
  const getTrackingUrl = () => {
    return `${window.location.origin}/shipment-track/${trackingCode}`;
  };

  // Share tracking information
  const shareTracking = async () => {
    const url = getTrackingUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Track Shipment ${shipment?.shipment_number}`,
          text: `Track your shipment ${shipment?.tracking_code} from ${shipment?.origin} to ${shipment?.destination}`,
          url: url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Tracking link copied to clipboard"
      });
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `shipment-qrcode-${trackingCode}.png`;
      link.href = pngFile;
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  };

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

  const refreshTracking = async () => {
    await trackShipment();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Shipment Tracking</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* QR Code Section */}
        {shipment && (
          <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <QRCodeSVG
                    ref={qrRef}
                    value={getTrackingUrl()}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="white"
                    fgColor="#1e40af"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{shipment.tracking_code}</h2>
                  <p className="text-lg opacity-90 mb-4">Scan to Track Shipment</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={shareTracking}
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      onClick={downloadQRCode}
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Track Your Shipment</CardTitle>
            <CardDescription>
              Enter your tracking code to see real-time status
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
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button onClick={trackShipment} disabled={loading} className="h-12 px-6">
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
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
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-6 w-6 text-blue-600" />
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
                    <span>Estimated Delivery: {formatDate(shipment.estimated_delivery)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Route */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Origin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{shipment.origin || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Origin</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    Route
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {shipment.mode_of_movement === 'air_freight' && <Truck className="h-6 w-6 text-blue-500" />}
                      {shipment.mode_of_movement === 'sea_transport' && <Truck className="h-6 w-6 text-blue-500" />}
                      {shipment.mode_of_movement === 'land_shipping' && <Truck className="h-6 w-6 text-blue-500" />}
                      {!shipment.mode_of_movement && <Truck className="h-6 w-6 text-gray-400" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {shipment.mode_of_movement === 'air_freight' && 'Air Freight'}
                      {shipment.mode_of_movement === 'sea_transport' && 'Sea Transport'}
                      {shipment.mode_of_movement === 'land_shipping' && 'Land Shipping'}
                      {!shipment.mode_of_movement && 'Standard Shipping'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{shipment.carrier || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-500" />
                    Destination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{shipment.destination || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Destination</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sender & Recipient Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Sender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-lg">{shipment.sender_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Sender Name</p>
                  </div>
                  <div>
                    <p className="font-medium">{shipment.sender_phone || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Sender Phone</p>
                  </div>
                  <div>
                    <p className="font-medium">{shipment.pickup_address || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Pickup Address</p>
                  </div>
                  {shipment.departure_time && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Departure: {formatDate(shipment.departure_time)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-green-500" />
                    Recipient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-lg">{shipment.customer_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                  </div>
                  <div>
                    <p className="font-medium">{shipment.customer_phone || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                  <div>
                    <p className="font-medium">{shipment.dropoff_address || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                  </div>
                  {shipment.customer_phone && (
                    <Button variant="outline" size="sm" onClick={callCustomer} className="w-full mt-2">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Recipient
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Product & Payment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {shipment.package_type && (
                      <div>
                        <p className="font-medium capitalize">{shipment.package_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">Package Type</p>
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
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium">{shipment.special_instructions}</p>
                      <p className="text-sm text-muted-foreground">Special Instructions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment & Carrier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shipment.payment_mode && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium capitalize">{shipment.payment_mode}</p>
                        <p className="text-sm text-muted-foreground">Payment Mode</p>
                      </div>
                    </div>
                  )}
                  
                  {shipment.shipping_fee !== undefined && shipment.shipping_fee > 0 && (
                    <div>
                      <p className="font-medium text-lg">₦{shipment.shipping_fee.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Shipping Fee</p>
                    </div>
                  )}
                  
                  {shipment.carrier && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{shipment.carrier.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">Carrier</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rider Information */}
            {shipment.rider_name && (
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{shipment.rider_name}</p>
                        <p className="text-sm text-muted-foreground">Delivery Rider</p>
                        {shipment.rider_phone && (
                          <p className="text-sm text-purple-600">{shipment.rider_phone}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={callRider}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Rider
                    </Button>
                  </div>
                  
                  {shipment.current_latitude && shipment.current_longitude && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        Last known location: {shipment.location_updated_at ? formatDate(shipment.location_updated_at) : 'Unknown'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={refreshTracking} variant="outline" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                  <Button onClick={() => navigator.clipboard.writeText(getTrackingUrl())} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Tracking Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicTracking;
