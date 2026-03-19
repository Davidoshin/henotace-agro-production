import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, Package, MapPin, Phone, User, Clock, 
  CheckCircle, XCircle, RefreshCw, Navigation,
  AlertCircle, ArrowRight, Eye
} from 'lucide-react';

interface Delivery {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  sale_number?: string;
  customer_name: string;
  customer_phone: string;
  dropoff_address: string;
  delivery_fee: number;
  rider_name?: string;
  estimated_delivery?: string;
  created_at: string;
}

interface DeliveryDetail {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  sale_number?: string;
  pickup: {
    address: string;
    contact_name: string;
    contact_phone: string;
    latitude?: number;
    longitude?: number;
  };
  dropoff: {
    address: string;
    contact_name: string;
    contact_phone: string;
    latitude?: number;
    longitude?: number;
  };
  rider?: {
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
  };
  delivery_fee: number;
  distance_km: number;
  estimated_minutes?: number;
  timestamps: {
    created: string;
    picked_up?: string;
    delivered?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
  history: Array<{
    status: string;
    message: string;
    notes?: string;
    created_at: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  rider_assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  picked_up: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  in_transit: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  failed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export default function BusinessDeliveryManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Assign rider dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningDeliveryId, setAssigningDeliveryId] = useState<number | null>(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Update status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, [activeTab]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab === 'all' ? '' : activeTab === 'active' 
        ? 'rider_assigned,picked_up,in_transit' 
        : activeTab;
      const response = await apiGet(`business/delivery/orders/${statusFilter ? `?status=${statusFilter}` : ''}`) as any;
      if (response.success) {
        setDeliveries(response.deliveries || []);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load deliveries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryDetail = async (deliveryId: number) => {
    try {
      const response = await apiGet(`business/delivery/orders/${deliveryId}/`) as any;
      if (response.success) {
        setSelectedDelivery(response.delivery);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load delivery details', variant: 'destructive' });
    }
  };

  const openAssignDialog = (deliveryId: number) => {
    setAssigningDeliveryId(deliveryId);
    setRiderName('');
    setRiderPhone('');
    setVehicleType('motorcycle');
    setVehiclePlate('');
    setAssignDialogOpen(true);
  };

  const assignRider = async () => {
    if (!assigningDeliveryId || !riderName || !riderPhone) {
      toast({ title: 'Error', description: 'Rider name and phone are required', variant: 'destructive' });
      return;
    }

    setAssigning(true);
    try {
      const response = await apiPost(`business/delivery/orders/${assigningDeliveryId}/assign-rider/`, {
        rider_name: riderName,
        rider_phone: riderPhone,
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate
      }) as any;

      if (response.success) {
        toast({ title: 'Success', description: response.message });
        setAssignDialogOpen(false);
        loadDeliveries();
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to assign rider', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to assign rider', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const openStatusDialog = (deliveryId: number, currentStatus: string) => {
    setUpdatingDeliveryId(deliveryId);
    setNewStatus(currentStatus);
    setStatusNotes('');
    setStatusDialogOpen(true);
  };

  const updateStatus = async () => {
    if (!updatingDeliveryId || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await apiPost(`business/delivery/orders/${updatingDeliveryId}/status/`, {
        status: newStatus,
        notes: statusNotes
      }) as any;

      if (response.success) {
        toast({ title: 'Success', description: response.message });
        setStatusDialogOpen(false);
        loadDeliveries();
        // Refresh detail if open
        if (selectedDelivery?.id === updatingDeliveryId) {
          loadDeliveryDetail(updatingDeliveryId);
        }
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'rider_assigned',
      rider_assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered'
    };
    return flow[current] || null;
  };

  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const activeCount = deliveries.filter(d => ['rider_assigned', 'picked_up', 'in_transit'].includes(d.status)).length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your delivery orders and assign riders
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadDeliveries}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card className="p-2">
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto bg-transparent">
            <TabsTrigger value="pending" className="text-xs py-2 relative">
              Pending
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs py-2 relative">
              Active
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs py-2">Completed</TabsTrigger>
            <TabsTrigger value="all" className="text-xs py-2">All</TabsTrigger>
          </TabsList>
        </Card>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No deliveries found</p>
              </CardContent>
            </Card>
          ) : (
            deliveries.map((delivery) => (
              <Card key={delivery.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{delivery.delivery_number}</span>
                          <Badge className={STATUS_COLORS[delivery.status] || 'bg-gray-100'}>
                            {STATUS_LABELS[delivery.status] || delivery.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(delivery.created_at).toLocaleDateString()} • ₦{delivery.delivery_fee.toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => loadDeliveryDetail(delivery.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{delivery.customer_name}</span>
                      <a href={`tel:${delivery.customer_phone}`} className="text-blue-600">
                        <Phone className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2">{delivery.dropoff_address}</span>
                    </div>

                    {/* Rider Info (if assigned) */}
                    {delivery.rider_name && (
                      <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                        <Truck className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{delivery.rider_name}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {delivery.status === 'pending' && (
                        <>
                          <Button size="sm" className="flex-1" onClick={() => openAssignDialog(delivery.id)}>
                            <User className="h-4 w-4 mr-1" />
                            Assign Rider
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openStatusDialog(delivery.id, 'confirmed')}>
                            Confirm
                          </Button>
                        </>
                      )}
                      {delivery.status === 'confirmed' && !delivery.rider_name && (
                        <Button size="sm" className="flex-1" onClick={() => openAssignDialog(delivery.id)}>
                          <User className="h-4 w-4 mr-1" />
                          Assign Rider
                        </Button>
                      )}
                      {['rider_assigned', 'picked_up', 'in_transit'].includes(delivery.status) && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            const next = getNextStatus(delivery.status);
                            if (next) openStatusDialog(delivery.id, next);
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          {delivery.status === 'rider_assigned' && 'Mark Picked Up'}
                          {delivery.status === 'picked_up' && 'Start Transit'}
                          {delivery.status === 'in_transit' && 'Mark Delivered'}
                        </Button>
                      )}
                      {delivery.status === 'delivered' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Rider Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider</DialogTitle>
            <DialogDescription>Enter the rider details for this delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rider Name *</Label>
              <Input 
                placeholder="Enter rider name" 
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input 
                placeholder="08012345678" 
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plate Number</Label>
              <Input 
                placeholder="LAG-123XY" 
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={assignRider} disabled={assigning}>
              {assigning ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <User className="h-4 w-4 mr-1" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rider_assigned">Rider Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea 
                placeholder="Add any notes about this status update"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateStatus} disabled={updatingStatus}>
              {updatingStatus ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={`${STATUS_COLORS[selectedDelivery.status]} text-sm px-3 py-1`}>
                  {STATUS_LABELS[selectedDelivery.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedDelivery.tracking_code}</span>
              </div>

              {/* Pickup */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Pickup Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-1">
                  <p className="text-sm font-medium">{selectedDelivery.pickup.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.pickup.address}</p>
                  <a href={`tel:${selectedDelivery.pickup.contact_phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedDelivery.pickup.contact_phone}
                  </a>
                </CardContent>
              </Card>

              {/* Dropoff */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Delivery Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-1">
                  <p className="text-sm font-medium">{selectedDelivery.dropoff.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.dropoff.address}</p>
                  <a href={`tel:${selectedDelivery.dropoff.contact_phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedDelivery.dropoff.contact_phone}
                  </a>
                </CardContent>
              </Card>

              {/* Rider */}
              {selectedDelivery.rider && (
                <Card className="bg-purple-50 dark:bg-purple-900/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Rider Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{selectedDelivery.rider.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <a href={`tel:${selectedDelivery.rider.phone}`} className="font-medium text-blue-600 block">
                          {selectedDelivery.rider.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span>
                        <p className="font-medium capitalize">{selectedDelivery.rider.vehicle}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plate:</span>
                        <p className="font-medium">{selectedDelivery.rider.plate || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Info */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">₦{selectedDelivery.delivery_fee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Fee</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedDelivery.distance_km.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedDelivery.estimated_minutes || '-'}</p>
                  <p className="text-xs text-muted-foreground">mins</p>
                </div>
              </div>

              {/* Timeline */}
              {selectedDelivery.history.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
                  <div className="space-y-2">
                    {selectedDelivery.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                        <div className="flex-1">
                          <p className="font-medium">{STATUS_LABELS[h.status] || h.status}</p>
                          <p className="text-xs text-muted-foreground">{h.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString()}
                          </p>
                        </div>
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
