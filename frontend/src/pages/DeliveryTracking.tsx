import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck,
  Store,
  User,
  ArrowLeft,
  Search,
  RefreshCw
} from "lucide-react";

interface DeliveryStatus {
  delivery_number: string;
  status: string;
  tracking_code: string;
  tracking_url?: string;
  dropoff_address: string;
  rider?: {
    name: string;
    phone?: string;
    vehicle?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  estimated_delivery?: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'rider_assigned', label: 'Rider Assigned', icon: User },
  { key: 'picked_up', label: 'Picked Up', icon: Store },
  { key: 'in_transit', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const getStatusIndex = (status: string) => {
  const index = STATUS_STEPS.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-green-500';
    case 'in_transit': return 'bg-blue-500';
    case 'picked_up': return 'bg-purple-500';
    case 'rider_assigned': return 'bg-indigo-500';
    case 'confirmed': return 'bg-cyan-500';
    case 'cancelled': return 'bg-red-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-yellow-500';
  }
};

export default function DeliveryTracking() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchCode, setSearchCode] = useState(trackingCode || "");
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load delivery status
  const loadDeliveryStatus = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      setLoading(true);
      const response = await apiGet(`delivery/track/${code}/`);
      
      if (response.success) {
        setDelivery(response.delivery);
      } else {
        toast({
          title: "Not Found",
          description: "Delivery not found. Please check your tracking code.",
          variant: "destructive"
        });
        setDelivery(null);
      }
    } catch (error) {
      console.error("Error loading delivery:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (trackingCode) {
      loadDeliveryStatus(trackingCode);
    }
  }, [trackingCode]);

  // Auto-refresh every 30 seconds if delivery is in progress
  useEffect(() => {
    if (!autoRefresh || !delivery || ['delivered', 'cancelled', 'failed'].includes(delivery.status)) {
      return;
    }

    const interval = setInterval(() => {
      loadDeliveryStatus(delivery.tracking_code);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, delivery]);

  const handleSearch = () => {
    if (searchCode.trim()) {
      navigate(`/track/${searchCode.trim()}`);
      loadDeliveryStatus(searchCode.trim());
    }
  };

  const currentStatusIndex = delivery ? getStatusIndex(delivery.status) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Track Delivery</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search Box */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter tracking code (e.g., KWK-ABC123)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading || !searchCode.trim()}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Status */}
        {delivery && (
          <>
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {delivery.delivery_number}
                    </CardTitle>
                    <CardDescription>
                      Tracking: {delivery.tracking_code}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(delivery.status)}>
                    {delivery.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="mb-6">
                  <div className="flex justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />
                    <div 
                      className="absolute top-4 left-0 h-1 bg-primary transition-all duration-500"
                      style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />
                    
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                            ${isCurrent ? 'ring-4 ring-primary/30' : ''}
                          `}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-primary font-medium' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivering to</p>
                      <p className="font-medium">{delivery.dropoff_address}</p>
                    </div>
                  </div>
                  
                  {delivery.estimated_delivery && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated delivery</p>
                        <p className="font-medium">
                          {new Date(delivery.estimated_delivery).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rider Card */}
            {delivery.rider && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Your Rider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{delivery.rider.name}</p>
                      {delivery.rider.vehicle && (
                        <p className="text-sm text-muted-foreground">{delivery.rider.vehicle}</p>
                      )}
                    </div>
                    {delivery.rider.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${delivery.rider.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map placeholder */}
            {delivery.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p>Location: {delivery.location.latitude.toFixed(4)}, {delivery.location.longitude.toFixed(4)}</p>
                      <p className="text-sm">Map integration coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Auto-refresh toggle */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => loadDeliveryStatus(delivery.tracking_code)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <span>•</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
            </div>
          </>
        )}

        {/* No tracking code state */}
        {!trackingCode && !delivery && (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Track Your Delivery</h2>
              <p className="text-muted-foreground">
                Enter your tracking code above to see delivery status
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
