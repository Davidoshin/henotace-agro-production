import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, Package, MapPin, Phone, User, Clock, 
  CheckCircle, RefreshCw, Navigation, ChevronRight,
  PackageCheck, Timer, CircleDot, Star, ThumbsUp
} from 'lucide-react';

interface CustomerDelivery {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  sale_number?: string;
  pickup_address: string;
  dropoff_address: string;
  delivery_fee: number;
  distance_km: number;
  rider?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  estimated_delivery?: string;
  created_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
}

interface DeliveryTrackingDetail {
  id: number;
  delivery_number: string;
  tracking_code?: string;
  tracking_url?: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  rider?: {
    name: string;
    phone: string;
    vehicle?: string;
    plate_number?: string;
    photo_url?: string;
    rating?: number;
  };
  delivery_fee: number;
  estimated_delivery?: string;
  actual_delivery?: string;
  location?: {
    latitude: number;
    longitude: number;
    updated_at?: string;
  };
  proof_of_delivery?: {
    signature_url?: string;
    photo_url?: string;
    received_by?: string;
  };
  customer_confirmed?: boolean;
  customer_confirmed_at?: string;
  can_confirm?: boolean;
  created_at: string;
  history?: Array<{
    status: string;
    message: string;
    created_at: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  rider_assigned: 'bg-purple-100 text-purple-800 border-purple-300',
  picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  in_transit: 'On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  confirmed: <CheckCircle className="h-5 w-5" />,
  rider_assigned: <User className="h-5 w-5" />,
  picked_up: <Package className="h-5 w-5" />,
  in_transit: <Truck className="h-5 w-5" />,
  delivered: <PackageCheck className="h-5 w-5" />,
};

const STATUS_ORDER = ['pending', 'confirmed', 'rider_assigned', 'picked_up', 'in_transit', 'delivered'];

interface CustomerDeliveryTrackingProps {
  onClose?: () => void;
  embedded?: boolean;
}

export default function CustomerDeliveryTracking({ onClose, embedded = false }: CustomerDeliveryTrackingProps) {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<CustomerDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryTrackingDetail | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Confirm delivery dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<number | null>(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  // Auto-refresh for active deliveries
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadDeliveries();
      if (selectedDelivery) {
        loadTrackingDetail(selectedDelivery.id);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDelivery?.id]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const response = await apiGet('delivery/my-orders/') as any;
      if (response.success) {
        const deliveryList = response.deliveries || [];
        setDeliveries(deliveryList);
        // Enable auto-refresh if there are active deliveries
        const hasActive = deliveryList.some((d: CustomerDelivery) => 
          ['rider_assigned', 'picked_up', 'in_transit'].includes(d.status)
        );
        setAutoRefresh(hasActive);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load deliveries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingDetail = async (deliveryId: number) => {
    try {
      const response = await apiGet(`delivery/${deliveryId}/status/`) as any;
      if (response.success) {
        // Map API response to expected format
        const delivery = response.delivery;
        setSelectedDelivery({
          ...delivery,
          history: delivery.history || []
        });
        setTrackingDialogOpen(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load tracking details', variant: 'destructive' });
    }
  };

  const openConfirmDialog = (deliveryId: number) => {
    setConfirmingDeliveryId(deliveryId);
    setReceivedBy('');
    setFeedback('');
    setRating(5);
    setConfirmDialogOpen(true);
  };

  const confirmDelivery = async () => {
    if (!confirmingDeliveryId) return;
    
    setConfirming(true);
    try {
      const response = await apiPost(`delivery/${confirmingDeliveryId}/confirm/`, {
        received_by: receivedBy || undefined,
        feedback: feedback || undefined,
        rating
      }) as any;
      
      if (response.success) {
        toast({ title: 'Success', description: response.message });
        setConfirmDialogOpen(false);
        setTrackingDialogOpen(false);
        loadDeliveries();
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to confirm delivery', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to confirm delivery', variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const getStatusStep = (status: string): number => {
    return STATUS_ORDER.indexOf(status);
  };

  const activeDeliveries = deliveries.filter(d => !['delivered', 'cancelled', 'failed'].includes(d.status));
  const completedDeliveries = deliveries.filter(d => ['delivered', 'cancelled', 'failed'].includes(d.status));

  const renderDeliveryCard = (delivery: CustomerDelivery, showFullDetail = false) => (
    <Card 
      key={delivery.id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        ['in_transit', 'picked_up'].includes(delivery.status) 
          ? 'border-2 border-cyan-500 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20' 
          : ''
      }`}
      onClick={() => loadTrackingDetail(delivery.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge className={STATUS_COLORS[delivery.status]}>
                <span className="flex items-center gap-1">
                  {STATUS_ICONS[delivery.status]}
                  {STATUS_LABELS[delivery.status]}
                </span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {delivery.tracking_code}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Progress Steps */}
        {['in_transit', 'picked_up', 'rider_assigned'].includes(delivery.status) && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              {STATUS_ORDER.map((step, index) => {
                const currentStep = getStatusStep(delivery.status);
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-2 w-2 rounded-full ${
                      isCompleted 
                        ? isCurrent ? 'bg-cyan-500 animate-pulse ring-4 ring-cyan-200' : 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                    {index < STATUS_ORDER.length - 1 && (
                      <div className={`h-0.5 flex-1 ${
                        index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Order</span>
              <span>Pickup</span>
              <span>Delivered</span>
            </div>
          </div>
        )}

        {/* Rider Info */}
        {delivery.rider && ['rider_assigned', 'picked_up', 'in_transit'].includes(delivery.status) && (
          <div className="flex items-center gap-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-3">
            <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{delivery.rider.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{delivery.rider.vehicle} Rider</p>
            </div>
            <a 
              href={`tel:${delivery.rider.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        )}

        {/* Destination */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm line-clamp-2">{delivery.dropoff_address}</p>
          </div>
        </div>

        {/* Estimated Time */}
        {delivery.status === 'in_transit' && delivery.estimated_delivery && (
          <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Timer className="h-4 w-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-800 dark:text-cyan-400">
              Estimated arrival: {delivery.estimated_delivery}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const content = (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Deliveries
          </h2>
          <p className="text-sm text-muted-foreground">Track your delivery orders</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadDeliveries}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && deliveries.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">No Deliveries Yet</h3>
            <p className="text-sm text-muted-foreground">
              When you place an order with delivery, it will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Deliveries */}
          {activeDeliveries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-cyan-500 animate-pulse" />
                <h3 className="font-medium">Active Deliveries</h3>
                <Badge variant="secondary">{activeDeliveries.length}</Badge>
              </div>
              {activeDeliveries.map((delivery) => renderDeliveryCard(delivery, true))}
            </div>
          )}

          {/* Completed Deliveries */}
          {completedDeliveries.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Past Deliveries
              </h3>
              {completedDeliveries.slice(0, 5).map((delivery) => (
                <Card key={delivery.id} className="cursor-pointer" onClick={() => loadTrackingDetail(delivery.id)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className={STATUS_COLORS[delivery.status]} variant="secondary">
                          {STATUS_LABELS[delivery.status]}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{delivery.tracking_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₦{delivery.delivery_fee.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tracking Detail Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Track Delivery
            </DialogTitle>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Status */}
              <div className="text-center py-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${STATUS_COLORS[selectedDelivery.status]}`}>
                  {STATUS_ICONS[selectedDelivery.status]}
                  <span className="font-medium">{STATUS_LABELS[selectedDelivery.status]}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{selectedDelivery.tracking_code}</p>
              </div>

              {/* Progress Timeline */}
              <div className="relative">
                {STATUS_ORDER.map((step, index) => {
                  const currentStep = getStatusStep(selectedDelivery.status);
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  
                  return (
                    <div key={step} className="flex items-start gap-3 pb-4 relative">
                      {/* Line */}
                      {index < STATUS_ORDER.length - 1 && (
                        <div className={`absolute left-[11px] top-6 w-0.5 h-full ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                      {/* Dot */}
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted 
                          ? isCurrent ? 'bg-cyan-500 ring-4 ring-cyan-200' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <div className="h-2 w-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? '' : 'text-muted-foreground'}`}>
                          {STATUS_LABELS[step]}
                        </p>
                        {(selectedDelivery.history || []).filter(h => h.status === step).map((h, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rider Card - Prominent Contact Info */}
              {selectedDelivery.rider && (
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center text-white">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-lg">{selectedDelivery.rider.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedDelivery.rider.vehicle} • {selectedDelivery.rider.plate_number || 'No plate'}
                        </p>
                      </div>
                    </div>
                    {/* Prominent Phone Number */}
                    <a 
                      href={`tel:${selectedDelivery.rider.phone}`}
                      className="flex items-center justify-center gap-3 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      <span className="text-lg">{selectedDelivery.rider.phone}</span>
                    </a>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Tap to call the delivery rider
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Location Card */}
              {selectedDelivery.location && (
                <Card className="bg-cyan-50 dark:bg-cyan-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="h-5 w-5 text-cyan-600" />
                      <span className="font-medium">Live Location</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {selectedDelivery.location.updated_at ? new Date(selectedDelivery.location.updated_at).toLocaleTimeString() : 'Just now'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => {
                        window.open(
                          `https://maps.google.com/?q=${selectedDelivery.location!.latitude},${selectedDelivery.location!.longitude}`,
                          '_blank'
                        );
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Open in Maps
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Addresses */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="h-3 w-3 rounded-full bg-green-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm">{selectedDelivery.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="h-3 w-3 rounded-full bg-red-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="text-sm">{selectedDelivery.dropoff_address}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="flex justify-center py-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">₦{selectedDelivery.delivery_fee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Delivery Fee</p>
                </div>
              </div>

              {/* Waiting for Pickup - Show message */}
              {!selectedDelivery.can_confirm && !selectedDelivery.customer_confirmed && 
               ['pending', 'confirmed', 'rider_assigned'].includes(selectedDelivery.status) && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                        Waiting for Pickup
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        You can confirm receipt once the rider picks up your order
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Delivery Button */}
              {selectedDelivery.can_confirm && (
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => openConfirmDialog(selectedDelivery.id)}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    Confirm I Received My Order
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Tap to confirm you have received your delivery
                  </p>
                </div>
              )}

              {/* Already Confirmed */}
              {selectedDelivery.customer_confirmed && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Delivery Confirmed</span>
                  </div>
                  {selectedDelivery.customer_confirmed_at && (
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Confirmed on {new Date(selectedDelivery.customer_confirmed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              Confirm Delivery
            </DialogTitle>
            <DialogDescription>
              Please confirm that you have received your package
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Received by (optional)</Label>
              <Input 
                placeholder="Your name or who received it"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rate the delivery (1-5 stars)</Label>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Feedback (optional)</Label>
              <Textarea 
                placeholder="How was your delivery experience?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelivery} 
              disabled={confirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {confirming ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Confirm Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {content}
    </div>
  );
}
