import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import {
  ArrowLeft,
  Save,
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  RefreshCw,
  XCircle,
  AlertCircle
} from "lucide-react";

interface DeliveryOrder {
  id: number;
  delivery_number: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  dropoff_address: string;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  rider_name?: string;
  rider_phone?: string;
  delivery_fee?: number;
  estimated_delivery_time?: string;
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rider_assigned', label: 'Rider Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

export default function DeliveryOrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!order) return;

    try {
      setSaving(true);
      const response = await apiPut(`business/delivery/orders/${order.id}/`, {
        status: order.status,
        pickup_address: order.pickup_address,
        pickup_contact_name: order.pickup_contact_name,
        pickup_contact_phone: order.pickup_contact_phone,
        dropoff_address: order.dropoff_address,
        dropoff_contact_name: order.dropoff_contact_name,
        dropoff_contact_phone: order.dropoff_contact_phone,
        rider_name: order.rider_name,
        rider_phone: order.rider_phone,
        delivery_fee: order.delivery_fee,
        estimated_delivery_time: order.estimated_delivery_time,
        notes: order.notes,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Delivery order updated successfully",
        });
        navigate(`/delivery-orders/${order.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update delivery order",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery order",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit Delivery Order</h1>
              <p className="text-xs text-muted-foreground">{order.delivery_number}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>
              Update the basic details and status of this delivery order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={order.status} onValueChange={(value) => setOrder({...order, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delivery_fee">Delivery Fee (₦)</Label>
              <Input
                id="delivery_fee"
                type="number"
                value={order.delivery_fee || ''}
                onChange={(e) => setOrder({...order, delivery_fee: parseFloat(e.target.value) || undefined})}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="estimated_delivery_time">Estimated Delivery Time</Label>
              <Input
                id="estimated_delivery_time"
                type="datetime-local"
                value={order.estimated_delivery_time ? 
                  new Date(order.estimated_delivery_time).toISOString().slice(0, 16) : ''
                }
                onChange={(e) => setOrder({...order, estimated_delivery_time: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pickup Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Pickup Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickup_address">Pickup Address</Label>
              <Textarea
                id="pickup_address"
                value={order.pickup_address}
                onChange={(e) => setOrder({...order, pickup_address: e.target.value})}
                placeholder="Enter pickup address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="pickup_contact_name">Contact Name</Label>
              <Input
                id="pickup_contact_name"
                value={order.pickup_contact_name}
                onChange={(e) => setOrder({...order, pickup_contact_name: e.target.value})}
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <Label htmlFor="pickup_contact_phone">Contact Phone</Label>
              <Input
                id="pickup_contact_phone"
                value={order.pickup_contact_phone}
                onChange={(e) => setOrder({...order, pickup_contact_phone: e.target.value})}
                placeholder="Enter contact phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dropoff_address">Delivery Address</Label>
              <Textarea
                id="dropoff_address"
                value={order.dropoff_address}
                onChange={(e) => setOrder({...order, dropoff_address: e.target.value})}
                placeholder="Enter delivery address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="dropoff_contact_name">Recipient Name</Label>
              <Input
                id="dropoff_contact_name"
                value={order.dropoff_contact_name}
                onChange={(e) => setOrder({...order, dropoff_contact_name: e.target.value})}
                placeholder="Enter recipient name"
              />
            </div>

            <div>
              <Label htmlFor="dropoff_contact_phone">Recipient Phone</Label>
              <Input
                id="dropoff_contact_phone"
                value={order.dropoff_contact_phone}
                onChange={(e) => setOrder({...order, dropoff_contact_phone: e.target.value})}
                placeholder="Enter recipient phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rider Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Rider Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rider_name">Rider Name</Label>
              <Input
                id="rider_name"
                value={order.rider_name || ''}
                onChange={(e) => setOrder({...order, rider_name: e.target.value})}
                placeholder="Enter rider name"
              />
            </div>

            <div>
              <Label htmlFor="rider_phone">Rider Phone</Label>
              <Input
                id="rider_phone"
                value={order.rider_phone || ''}
                onChange={(e) => setOrder({...order, rider_phone: e.target.value})}
                placeholder="Enter rider phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={order.notes || ''}
              onChange={(e) => setOrder({...order, notes: e.target.value})}
              placeholder="Add any additional notes about this delivery"
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
