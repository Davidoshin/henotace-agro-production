import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import {
  ArrowLeft,
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
  RefreshCw,
  Copy
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

export default function ShippingManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await apiGet('business/shipments/');
      
      if (response.success) {
        setShipments(response.shipments || []);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load shipments",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading shipments:", error);
      toast({
        title: "Error",
        description: "Failed to load shipments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    
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

  const copyTrackingCode = (trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    toast({
      title: "Copied!",
      description: "Tracking code copied to clipboard",
    });
  };

  const createShipment = async (shipmentData: any) => {
    try {
      const response = await apiPost('business/shipments/', shipmentData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Shipment created successfully",
        });
        setShowCreateForm(false);
        loadShipments();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create shipment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Truck className="h-5 w-5" />
          </Button>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Shipping Management</h1>
              <p className="text-muted-foreground">Manage your shipments and tracking codes</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Shipment
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Shipment Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipment</CardTitle>
              <CardDescription>
                Create a new shipment and generate tracking code for customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const shipmentData = {
                  customer_name: formData.get('customer_name'),
                  customer_phone: formData.get('customer_phone'),
                  customer_email: formData.get('customer_email'),
                  pickup_address: formData.get('pickup_address'),
                  dropoff_address: formData.get('dropoff_address'),
                  sender_name: formData.get('sender_name'),
                  sender_phone: formData.get('sender_phone'),
                  sender_email: formData.get('sender_email'),
                  product_name: formData.get('product_name'),
                  quantity: parseInt(formData.get('quantity') as string),
                  weight: formData.get('weight'),
                  dimensions: formData.get('dimensions'),
                  package_type: formData.get('package_type'),
                  special_instructions: formData.get('special_instructions'),
                  shipping_fee: parseFloat(formData.get('shipping_fee') as string) || 0,
                  estimated_delivery: formData.get('estimated_delivery'),
                  origin: formData.get('origin'),
                  destination: formData.get('destination'),
                  departure_time: formData.get('departure_time'),
                  mode_of_movement: formData.get('mode_of_movement'),
                  payment_mode: formData.get('payment_mode'),
                  carrier: formData.get('carrier'),
                };
                createShipment(shipmentData);
              }}>
                <div className="space-y-6">
                  {/* Sender Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sender Information</h3>
                    <div>
                      <Label htmlFor="sender_name">Sender Name *</Label>
                      <Input
                        id="sender_name"
                        name="sender_name"
                        placeholder="Enter sender name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sender_phone">Sender Phone *</Label>
                      <Input
                        id="sender_phone"
                        name="sender_phone"
                        placeholder="Enter sender phone"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sender_email">Sender Email</Label>
                      <Input
                        id="sender_email"
                        name="sender_email"
                        type="email"
                        placeholder="Enter sender email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickup_address">Pickup Address *</Label>
                      <Textarea
                        id="pickup_address"
                        name="pickup_address"
                        placeholder="Enter pickup address"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Customer Information</h3>
                    <div>
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        name="customer_name"
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Customer Phone *</Label>
                      <Input
                        id="customer_phone"
                        name="customer_phone"
                        placeholder="Enter customer phone"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_email">Customer Email</Label>
                      <Input
                        id="customer_email"
                        name="customer_email"
                        type="email"
                        placeholder="Enter customer email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dropoff_address">Delivery Address *</Label>
                      <Textarea
                        id="dropoff_address"
                        name="dropoff_address"
                        placeholder="Enter delivery address"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Shipping Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Shipping Details</h3>
                    <div>
                      <Label htmlFor="origin">Origin</Label>
                      <Input
                        id="origin"
                        name="origin"
                        placeholder="Enter origin city/country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        name="destination"
                        placeholder="Enter destination city/country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departure_time">Departure Time</Label>
                      <Input
                        id="departure_time"
                        name="departure_time"
                        type="datetime-local"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mode_of_movement">Mode of Movement</Label>
                      <Select name="mode_of_movement">
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode of transport" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="air_freight">Air Freight</SelectItem>
                          <SelectItem value="sea_transport">Sea Transport</SelectItem>
                          <SelectItem value="land_shipping">Land Shipping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_mode">Payment Mode</Label>
                      <Select name="payment_mode">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="brics">BRICS</SelectItem>
                          <SelectItem value="bacs">BACS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="carrier">Carrier</Label>
                      <Select name="carrier">
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dhl">DHL</SelectItem>
                          <SelectItem value="usps">USPS</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="ups">UPS</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Product Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Product Information</h3>
                    <div>
                      <Label htmlFor="product_name">Product Name</Label>
                      <Input
                        id="product_name"
                        name="product_name"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        name="weight"
                        placeholder="e.g., 2.5 kg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        name="dimensions"
                        placeholder="e.g., 30x20x15 cm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="package_type">Package Type</Label>
                      <Select name="package_type">
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="parcel">Parcel</SelectItem>
                          <SelectItem value="package">Package</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="envelope">Envelope</SelectItem>
                          <SelectItem value="fragile">Fragile</SelectItem>
                          <SelectItem value="perishable">Perishable</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shipping_fee">Shipping Fee (₦)</Label>
                      <Input
                        id="shipping_fee"
                        name="shipping_fee"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                      <Input
                        id="estimated_delivery"
                        name="estimated_delivery"
                        type="datetime-local"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="special_instructions">Special Instructions</Label>
                    <Textarea
                      id="special_instructions"
                      name="special_instructions"
                      placeholder="Any special handling instructions"
                      rows={3}
                    />
                  </div>
                
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      Create Shipment
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking code, customer, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background"
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
                
                <Button variant="outline" size="sm" onClick={loadShipments} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <CardDescription>
              Manage and track all your shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredShipments.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching shipments" : "No shipments"}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Create your first shipment to get started"
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Shipment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShipments.map((shipment) => (
                  <Card key={shipment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{shipment.shipment_number}</span>
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                              {shipment.tracking_code}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTrackingCode(shipment.tracking_code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </span>
                          </div>
                          {getStatusBadge(shipment.status)}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-2">
                        <div>
                          <p className="font-medium">{shipment.customer_name}</p>
                          <p>{shipment.dropoff_address}</p>
                          {shipment.customer_phone && (
                            <a href={`tel:${shipment.customer_phone}`} className="text-primary">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {shipment.customer_phone}
                            </a>
                          )}
                        </div>
                        
                        {shipment.product_name && (
                          <div>
                            <p className="text-xs text-muted-foreground">Product: {shipment.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Quantity: {shipment.quantity} | Weight: {shipment.weight} | Dimensions: {shipment.dimensions}
                            </p>
                          </div>
                        )}
                        
                        {shipment.special_instructions && (
                          <div>
                            <p className="text-xs text-muted-foreground">Special Instructions:</p>
                            <p className="text-xs">{shipment.special_instructions}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(shipment.created_at)}
                          </div>
                          <div className="flex gap-1">
                            {shipment.shipping_fee && (
                              <span className="text-sm font-medium">
                                {formatCurrency(shipment.shipping_fee)}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/shipments/${shipment.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
