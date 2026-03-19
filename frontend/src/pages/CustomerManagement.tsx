import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Users, Mail, Copy, Check, Link as LinkIcon, Wallet, CreditCard, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, isUpgradeRequiredError, getUpgradeErrorMessage } from "@/lib/api";

interface CreditRecord {
  id: number;
  amount: number;
  balance: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface Customer {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  phone?: string;
  address?: string;
  wallet_balance?: number;
  loyalty_points: number;
  discount_percentage: number;
  created_at: string;
  outstanding_credit?: number;
  credit_records?: CreditRecord[];
}

export default function CustomerManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [signupLink, setSignupLink] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    discount_percentage: 0,
  });

  useEffect(() => {
    loadCustomers();
    generateSignupLink();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiGet("business/customers/");
      setCustomers(data.customers || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSignupLink = async () => {
    try {
      const data = await apiGet("business/customers/signup-link/");
      setSignupLink(data.signup_link || "");
    } catch (e: any) {
      console.error("Failed to generate signup link:", e);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingCustomer) {
        await apiPut(`business/customers/${editingCustomer.id}/`, formData);
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        await apiPost("business/customers/", formData);
        toast({ title: "Success", description: "Customer created successfully" });
      }
      setShowAddDialog(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (e: any) {
      if (isUpgradeRequiredError(e)) {
        toast({ 
          title: "Plan Limit Reached", 
          description: (
            <div>
              {getUpgradeErrorMessage(e)}{" "}
              <a href="/manage-account?tab=subscription" className="underline font-medium text-primary hover:text-primary/80">
                Upgrade now
              </a>
            </div>
          ),
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({ title: "Error", description: e.message || "Failed to save customer", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await apiDelete(`business/customers/${id}/`);
      toast({ title: "Success", description: "Customer deleted successfully" });
      loadCustomers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete customer", variant: "destructive" });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.user.email,
      first_name: customer.user.first_name,
      last_name: customer.user.last_name,
      phone: customer.phone || "",
      address: customer.address || "",
      discount_percentage: customer.discount_percentage || 0,
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      address: "",
      discount_percentage: 0,
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast({ title: "Copied!", description: `${fieldName} copied to clipboard` });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your business customers</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => { resetForm(); setEditingCustomer(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers by name, email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Signup Link Card */}
      {signupLink && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Signup Link</CardTitle>
            <CardDescription>Share this link with customers to allow them to create their own accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={signupLink} readOnly className="flex-1" />
              <Button onClick={() => copyToClipboard(signupLink, "Signup link")}>
                {copiedField === "signup-link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first customer</p>
            <Button onClick={() => { resetForm(); setEditingCustomer(null); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers
            .filter((customer) => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              const fullName = `${customer.user.first_name} ${customer.user.last_name}`.toLowerCase();
              const email = customer.user.email?.toLowerCase() || '';
              const phone = customer.phone?.toLowerCase() || '';
              return fullName.includes(query) || email.includes(query) || phone.includes(query);
            })
            .map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{customer.user.first_name} {customer.user.last_name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{customer.user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(customer.user.email, "Email")}
                  >
                    {copiedField === `email-${customer.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">📱</span>
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span>Wallet: ₦{(customer.wallet_balance || 0).toLocaleString()}</span>
                </div>
                
                {/* Outstanding Credit */}
                {(customer.outstanding_credit || 0) > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <CreditCard className="w-4 h-4" />
                    <span>Credit Due: ₦{(customer.outstanding_credit || 0).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Credit Records */}
                {customer.credit_records && customer.credit_records.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Unpaid Credits
                    </p>
                    <div className="space-y-1.5">
                      {customer.credit_records.map((credit) => (
                        <div key={credit.id} className="flex justify-between items-center text-xs bg-muted/50 rounded px-2 py-1">
                          <span>₦{credit.balance.toLocaleString()} due</span>
                          <Badge variant={credit.status === 'overdue' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                            {credit.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Loyalty Points</p>
                      <p className="font-semibold">{customer.loyalty_points}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Discount</p>
                      <p className="font-semibold">{customer.discount_percentage}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update customer information" : "Add a new customer to your business"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingCustomer} />
            </div>
            <div>
              <Label>Phone (Optional)</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <Label>Address (Optional)</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <Label>Discount Percentage (%)</Label>
              <Input type="number" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.email || !formData.first_name || !formData.last_name}>
              {loading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

