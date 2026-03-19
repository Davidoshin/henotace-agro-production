import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { 
  ArrowLeft, 
  ClipboardList, 
  Package, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  XCircle,
  Clock,
  Truck,
  CreditCard,
  RefreshCw,
  Building2
} from "lucide-react";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  branch_name: string | null;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  manual_payment_reference: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function BusinessOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiGet("business/orders/");
      if (response.success) {
        setOrders(response.orders || []);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      const response = await apiPost(`business/orders/${selectedOrder.id}/cancel/`, {});
      
      if (response.success) {
        toast({ title: "Success", description: "Order cancelled successfully" });
        setShowCancelDialog(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        toast({ title: "Error", description: response.error || "Failed to cancel order", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pay_on_delivery':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pay on Delivery</Badge>;
      case 'awaiting_approval':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Awaiting Approval</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pay_on_delivery': return 'Pay on Delivery';
      case 'bank_transfer': return 'Bank Transfer';
      case 'wallet': return 'Wallet';
      case 'gateway': return 'Payment Gateway';
      case 'credit': return 'Credit';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Pending Orders
              </h1>
              <p className="text-sm text-muted-foreground">
                View pending orders. Customers will pay when goods are delivered.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Orders Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pay on Delivery</p>
                  <p className="text-2xl font-bold">{orders.filter(o => o.payment_status === 'pay_on_delivery').length}</p>
                </div>
                <Truck className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₦{orders.reduce((sum, o) => sum + o.final_amount, 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No pending orders</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All orders have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-lg">{order.sale_number}</span>
                        {getPaymentStatusBadge(order.payment_status)}
                        <Badge variant="outline">{getPaymentMethodLabel(order.payment_method)}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customer_name}
                        </span>
                        {order.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {order.customer_phone}
                          </span>
                        )}
                        {order.branch_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {order.branch_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Items Preview */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Items: </span>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={item.id}>
                            {item.product_name} (×{item.quantity})
                            {idx < Math.min(order.items.length - 1, 2) ? ', ' : ''}
                          </span>
                        ))}
                        {order.items.length > 3 && <span className="text-muted-foreground"> +{order.items.length - 3} more</span>}
                      </div>
                      
                      {order.notes && (
                        <p className="text-sm text-muted-foreground italic">Note: {order.notes}</p>
                      )}
                    </div>
                    
                    {/* Amount & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">₦{order.final_amount.toLocaleString()}</p>
                        {order.discount_amount > 0 && (
                          <p className="text-sm text-green-600">Discount: -₦{order.discount_amount.toLocaleString()}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowCancelDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject Order
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order?
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-semibold">{selectedOrder.sale_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg">₦{selectedOrder.final_amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ The customer will be notified that their order has been cancelled.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={loading}>
              {loading ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
