import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  CreditCard,
  Navigation,
  Plane,
  Ship,
  Globe
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
}

export default function ShipmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    sender_name: "",
    sender_phone: "",
    product_name: "",
    quantity: 1,
    weight: "",
    dimensions: "",
    package_type: "package",
    special_instructions: "",
    pickup_address: "",
    dropoff_address: "",
    shipping_fee: 0,
    estimated_delivery: "",
    origin: "",
    destination: "",
    departure_time: "",
    mode_of_movement: "land_shipping",
    payment_mode: "prepaid",
    carrier: "dhl"
  });

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`business/shipments/${id}/`);
      
      if (response.success) {
        const shipmentData = response.shipment;
        setShipment(shipmentData);
        setFormData({
          customer_name: shipmentData.customer_name || "",
          customer_phone: shipmentData.customer_phone || "",
          customer_email: shipmentData.customer_email || "",
          sender_name: shipmentData.sender_name || "",
          sender_phone: shipmentData.sender_phone || "",
          product_name: shipmentData.product_name || "",
          quantity: shipmentData.quantity || 1,
          weight: shipmentData.weight || "",
          dimensions: shipmentData.dimensions || "",
          package_type: shipmentData.package_type || "package",
          special_instructions: shipmentData.special_instructions || "",
          pickup_address: shipmentData.pickup_address || "",
          dropoff_address: shipmentData.dropoff_address || "",
          shipping_fee: shipmentData.shipping_fee || 0,
          estimated_delivery: shipmentData.estimated_delivery ? 
            new Date(shipmentData.estimated_delivery).toISOString().slice(0, 16) : "",
          origin: shipmentData.origin || "",
          destination: shipmentData.destination || "",
          departure_time: shipmentData.departure_time ? 
            new Date(shipmentData.departure_time).toISOString().slice(0, 16) : "",
          mode_of_movement: shipmentData.mode_of_movement || "land_shipping",
          payment_mode: shipmentData.payment_mode || "prepaid",
          carrier: shipmentData.carrier || "dhl"
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment) return;

    try {
      setSaving(true);
      
      const submitData = {
        ...formData,
        estimated_delivery: formData.estimated_delivery ? new Date(formData.estimated_delivery).toISOString() : null,
        departure_time: formData.departure_time ? new Date(formData.departure_time).toISOString() : null,
      };

      const response = await apiPut(`business/shipments/${shipment.id}/`, submitData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Shipment updated successfully",
        });
        navigate(`/shipments/${shipment.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update shipment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/shipments/${shipment.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shipment
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Shipment</h1>
            <p className="text-sm text-muted-foreground">{shipment.shipment_number}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone *</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                  placeholder="Enter customer phone"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer_email">Customer Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleInputChange("customer_email", e.target.value)}
                placeholder="Enter customer email"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sender Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sender Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sender_name">Sender Name</Label>
                <Input
                  id="sender_name"
                  value={formData.sender_name}
                  onChange={(e) => handleInputChange("sender_name", e.target.value)}
                  placeholder="Enter sender name"
                />
              </div>
              <div>
                <Label htmlFor="sender_phone">Sender Phone</Label>
                <Input
                  id="sender_phone"
                  value={formData.sender_phone}
                  onChange={(e) => handleInputChange("sender_phone", e.target.value)}
                  placeholder="Enter sender phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="e.g., 2.5kg"
                />
              </div>
              <div>
                <Label htmlFor="package_type">Package Type</Label>
                <Select value={formData.package_type} onValueChange={(value) => handleInputChange("package_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="envelope">Envelope</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="crate">Crate</SelectItem>
                    <SelectItem value="pallet">Pallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => handleInputChange("dimensions", e.target.value)}
                placeholder="e.g., 30x20x15 cm"
              />
            </div>

            <div>
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => handleInputChange("special_instructions", e.target.value)}
                placeholder="Any special handling instructions"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin *</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  placeholder="Enter origin city/address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange("destination", e.target.value)}
                  placeholder="Enter destination city/address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departure_time">Departure Time</Label>
                <Input
                  id="departure_time"
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) => handleInputChange("departure_time", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                <Input
                  id="estimated_delivery"
                  type="datetime-local"
                  value={formData.estimated_delivery}
                  onChange={(e) => handleInputChange("estimated_delivery", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mode_of_movement">Mode of Movement</Label>
                <Select value={formData.mode_of_movement} onValueChange={(value) => handleInputChange("mode_of_movement", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="land_shipping">Land Shipping</SelectItem>
                    <SelectItem value="air_freight">Air Freight</SelectItem>
                    <SelectItem value="sea_transport">Sea Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Select value={formData.payment_mode} onValueChange={(value) => handleInputChange("payment_mode", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={formData.carrier} onValueChange={(value) => handleInputChange("carrier", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="aramex">Aramex</SelectItem>
                    <SelectItem value="local">Local Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickup_address">Pickup Address *</Label>
              <Textarea
                id="pickup_address"
                value={formData.pickup_address}
                onChange={(e) => handleInputChange("pickup_address", e.target.value)}
                placeholder="Enter complete pickup address"
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="dropoff_address">Delivery Address *</Label>
              <Textarea
                id="dropoff_address"
                value={formData.dropoff_address}
                onChange={(e) => handleInputChange("dropoff_address", e.target.value)}
                placeholder="Enter complete delivery address"
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="shipping_fee">Shipping Fee (₦)</Label>
              <Input
                id="shipping_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.shipping_fee}
                onChange={(e) => handleInputChange("shipping_fee", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/shipments/${shipment.id}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
