import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, isUpgradeRequiredError, getUpgradeErrorMessage } from "@/lib/api";
import { Plus, Edit, Trash2, Search, Truck, Phone, Mail, MapPin, ArrowLeft, DollarSign, Building2, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  products_supplied?: string;
  total_supplied?: number;
  total_paid?: number;
  balance_owed?: number;
  last_delivery_date?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit: string;
  cost_price: number;
}

interface SupplyItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Branch {
  id: number;
  name: string;
  code?: string;
  stores: StoreInfo[];
}

interface StoreInfo {
  id: number;
  name: string;
  code: string;
  store_type: string;
  allow_direct_sales: boolean;
}

export default function SupplierManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [initialAmountOwed, setInitialAmountOwed] = useState("");
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Amount owed dialog state
  const [showAmountOwedDialog, setShowAmountOwedDialog] = useState(false);
  const [amountOwed, setAmountOwed] = useState("");
  const [amountOwedDate, setAmountOwedDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountOwedNotes, setAmountOwedNotes] = useState("");

    // Submission loading guards (prevent duplicate clicks)
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isSubmittingAmountOwed, setIsSubmittingAmountOwed] = useState(false);

  // Branch/Store selection for supply destination
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [availableStores, setAvailableStores] = useState<StoreInfo[]>([]);

  const stripAmountFormatting = (value: string) => value.replace(/,/g, "").trim();

  const parseAmount = (value: string) => {
    const parsed = Number(stripAmountFormatting(value));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const firstDotIndex = cleaned.indexOf(".");
    const normalized = firstDotIndex === -1
      ? cleaned
      : `${cleaned.slice(0, firstDotIndex + 1)}${cleaned.slice(firstDotIndex + 1).replace(/\./g, "")}`;

    const [integerPart = "", decimalPart] = normalized.split(".");
    const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart.slice(0, 2)}`
      : formattedInteger;
  };

  const formatAmountOnBlur = (value: string) => {
    const raw = stripAmountFormatting(value);
    if (!raw) return "";
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return "";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadBranchesAndStores();
  }, []);
  
  const loadBranchesAndStores = async () => {
    try {
      const data = await apiGet("business/branches-stores/");
      setBranches(data.branches || []);
    } catch (error: any) {
      console.error("Failed to load branches/stores:", error);
    }
  };
  
  // Update available stores when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find(b => b.id === parseInt(selectedBranchId));
      setAvailableStores(branch?.stores || []);
      setSelectedStoreId(""); // Reset store when branch changes
    } else {
      setAvailableStores([]);
      setSelectedStoreId("");
    }
  }, [selectedBranchId, branches]);
  
  const loadProducts = async () => {
    try {
      const data = await apiGet("business/products/");
      setProducts(data.products || []);
    } catch (error: any) {
      console.error("Failed to load products:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await apiGet("business/suppliers/");
      setSuppliers(data.suppliers || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplierData = {
        ...formData,
        products_supplied: supplyItems.map(item => item.product_name).join(", "),
      };
      
      let supplierId;
      if (editingSupplier) {
        await apiPut(`business/suppliers/${editingSupplier.id}/`, supplierData);
        supplierId = editingSupplier.id;
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        const result = await apiPost("business/suppliers/", supplierData);
        supplierId = result.supplier?.id;
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      
      // If there are supply items, record the supply
      if (supplyItems.length > 0 && supplierId) {
        const supplyData: any = {
          supply_date: new Date().toISOString().split('T')[0],
          items: supplyItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
          })),
          payment_status: 'pending',
          amount_paid: 0,
          notes: `Initial supply: ${supplyItems.map(i => i.product_name).join(", ")}`,
        };
        
        // Add branch/store destination if selected
        if (selectedBranchId) {
          supplyData.branch_id = parseInt(selectedBranchId);
        }
        if (selectedStoreId) {
          supplyData.store_id = parseInt(selectedStoreId);
        }
        
        const supplyResult = await apiPost(`business/suppliers/${supplierId}/record-supply/`, supplyData);
        
        toast({
          title: "Supply Recorded",
          description: supplyResult.message || "Stock added successfully",
        });
      }

      // If initial amount owed is provided, record debt-only supply
      if (!editingSupplier && supplierId && parseAmount(initialAmountOwed) > 0) {
        const amountOwedResult = await apiPost(`business/suppliers/${supplierId}/record-supply/`, {
          supply_date: new Date().toISOString().split('T')[0],
          amount_owed: parseAmount(initialAmountOwed),
          payment_status: 'pending',
          amount_paid: 0,
          notes: "Opening balance (amount owed)",
        });

        toast({
          title: "Amount Owed Added",
          description: amountOwedResult.message || "Amount owed recorded successfully",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error: any) {
      if (isUpgradeRequiredError(error)) {
        toast({ 
          title: "Plan Limit Reached", 
          description: (
            <div>
              {getUpgradeErrorMessage(error)}{" "}
              <a href="/manage-account?tab=subscription" className="underline font-medium text-primary hover:text-primary/80">
                Upgrade now
              </a>
            </div>
          ),
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save supplier",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setSupplyItems([]);
    setProductSearch("");
    setInitialAmountOwed("");
    setIsDialogOpen(true);
  };
  
  const addProductToSupply = (product: Product) => {
    const existing = supplyItems.find(item => item.product_id === product.id);
    if (!existing) {
      setSupplyItems([...supplyItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit: product.unit,
        unit_price: product.cost_price,
        total_price: product.cost_price,
      }]);
    }
    setProductSearch("");
    setShowProductDropdown(false);
  };
  
  const removeProductFromSupply = (productId: number) => {
    setSupplyItems(supplyItems.filter(item => item.product_id !== productId));
  };
  
  const updateSupplyItem = (productId: number, field: 'quantity' | 'unit_price', value: number) => {
    setSupplyItems(supplyItems.map(item => {
      if (item.product_id === productId) {
        const updated = { ...item, [field]: value };
        updated.total_price = updated.quantity * updated.unit_price;
        return updated;
      }
      return item;
    }));
  };
  
  const getTotalAmount = () => {
    return supplyItems.reduce((sum, item) => sum + item.total_price, 0);
  };
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    
    try {
      await apiDelete(`business/suppliers/${id}/`);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      loadSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
    setSupplyItems([]);
    setProductSearch("");
    setInitialAmountOwed("");
    setEditingSupplier(null);
    setSelectedBranchId("");
    setSelectedStoreId("");
  };

  const handlePayment = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber("");
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const submitPayment = async () => {
    if (!selectedSupplier || !paymentAmount || !paymentDate) {
      toast({
        title: "Error",
        description: "Please enter payment amount and date",
        variant: "destructive",
      });
      return;
    }

      setIsSubmittingPayment(true);
      try {
      await apiPost(`business/suppliers/${selectedSupplier.id}/payment/`, {
        amount: parseAmount(paymentAmount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference_number: referenceNumber || undefined,
        notes: paymentNotes || undefined,
      });
      
      toast({
        title: "Success",
        description: `Payment of ₦${parseAmount(paymentAmount).toLocaleString()} recorded successfully`,
      });
      
      setShowPaymentDialog(false);
      setSelectedSupplier(null);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setReferenceNumber("");
      setPaymentNotes("");
      loadSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
      } finally {
        setIsSubmittingPayment(false);
      }
  };

  const handleAmountOwed = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setAmountOwed("");
    setAmountOwedDate(new Date().toISOString().split('T')[0]);
    setAmountOwedNotes("");
    setShowAmountOwedDialog(true);
  };

  const submitAmountOwed = async () => {
    if (!selectedSupplier || !amountOwed || !amountOwedDate) {
      toast({
        title: "Error",
        description: "Please enter amount owed and date",
        variant: "destructive",
      });
      return;
    }

      setIsSubmittingAmountOwed(true);
      try {
      await apiPost(`business/suppliers/${selectedSupplier.id}/record-supply/`, {
        supply_date: amountOwedDate,
        amount_owed: parseAmount(amountOwed),
        payment_status: 'pending',
        amount_paid: 0,
        notes: amountOwedNotes || "Amount owed recorded",
      });

      toast({
        title: "Success",
        description: `Amount owed of ₦${parseAmount(amountOwed).toLocaleString()} recorded successfully`,
      });

      setShowAmountOwedDialog(false);
      setSelectedSupplier(null);
      setAmountOwed("");
      setAmountOwedNotes("");
      loadSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record amount owed",
        variant: "destructive",
      });
      } finally {
        setIsSubmittingAmountOwed(false);
      }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.products_supplied?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmountOwed = suppliers.reduce((sum, supplier) => sum + (supplier.balance_owed || 0), 0);
  const totalSupplied = suppliers.reduce((sum, supplier) => sum + (supplier.total_supplied || 0), 0);
  const totalPaid = suppliers.reduce((sum, supplier) => sum + (supplier.total_paid || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/business-admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Supplier Management</h1>
          <p className="text-muted-foreground">Manage your suppliers and track deliveries</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Supplied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalSupplied.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Amount Owed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₦{totalAmountOwed.toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1">Outstanding balance to suppliers</p>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </DialogTitle>
                <DialogDescription>
                  {editingSupplier ? "Update supplier information" : "Add a new supplier to your business"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter supplier name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                </div>
                
                {/* Stock Destination - Branch/Store Selection - Always visible */}
                {branches.length > 0 && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-primary" />
                      Stock Destination
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select where the supplied products will be added. If no selection is made, stock will be added to the main business inventory.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <select
                          id="branch"
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="">Main Business Stock</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {availableStores.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="store" className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            Store/Warehouse
                          </Label>
                          <select
                            id="store"
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          >
                            <option value="">Add to Branch Stock</option>
                            {availableStores.map((store) => (
                              <option key={store.id} value={store.id.toString()}>
                                {store.name} ({store.store_type}) {store.allow_direct_sales ? '• POS Enabled' : ''}
                              </option>
                            ))}
                          </select>
                          {selectedStoreId && (
                            <p className="text-xs text-muted-foreground">
                              {availableStores.find(s => s.id === parseInt(selectedStoreId))?.allow_direct_sales 
                                ? "✓ This store is enabled for direct sales (POS)" 
                                : "This store is not enabled for direct sales"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Products Supplied</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search products (e.g., Kote, Titus, Chicken)..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.slice(0, 10).map((product) => (
                          <div
                            key={product.id}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => addProductToSupply(product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.sku} • {product.unit} • ₦{product.cost_price.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {supplyItems.length > 0 && (
                    <div className="mt-4 space-y-3 border rounded-lg p-4">
                      <div className="font-medium text-sm">Selected Products:</div>
                      {supplyItems.map((item) => (
                        <div key={item.product_id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-xs text-muted-foreground">{item.unit}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductFromSupply(item.product_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateSupplyItem(item.product_id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price (₦)</Label>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={formatAmountInput(item.unit_price.toString())}
                                onChange={(e) => updateSupplyItem(item.product_id, 'unit_price', parseAmount(e.target.value))}
                                onBlur={(e) => updateSupplyItem(item.product_id, 'unit_price', parseAmount(formatAmountOnBlur(e.target.value)))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Total (₦)</Label>
                              <div className="h-8 flex items-center font-semibold text-primary">
                                ₦{item.total_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="font-semibold">Total Amount Owed:</span>
                        <span className="text-xl font-bold text-primary">₦{getTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {!editingSupplier && (
                  <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                    <div className="text-sm font-medium">Initial Amount Owed (Optional)</div>
                    <p className="text-xs text-muted-foreground">
                      Use this to add a previous debt for this supplier, even if no products were supplied yet.
                    </p>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={initialAmountOwed}
                      onChange={(e) => setInitialAmountOwed(formatAmountInput(e.target.value))}
                      onBlur={(e) => setInitialAmountOwed(formatAmountOnBlur(e.target.value))}
                      placeholder="Enter amount owed"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter supplier address"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? "Update Supplier" : "Add Supplier"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, contact, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search" : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      {supplier.contact_person && (
                        <CardDescription className="mt-1">
                          Contact: {supplier.contact_person}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.products_supplied && (
                    <div className="text-sm">
                      <span className="font-medium">Products:</span>{" "}
                      <span className="text-muted-foreground">{supplier.products_supplied}</span>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {supplier.email}
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {supplier.phone}
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                  
                  {(supplier.total_supplied !== undefined || supplier.balance_owed !== undefined) && (
                    <div className="pt-3 border-t space-y-2">
                      {supplier.total_supplied !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Supplied:</span>
                          <span className="font-medium">₦{supplier.total_supplied.toLocaleString()}</span>
                        </div>
                      )}
                      {supplier.total_paid !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="font-medium text-green-600">₦{supplier.total_paid.toLocaleString()}</span>
                        </div>
                      )}
                      {supplier.balance_owed !== undefined && supplier.balance_owed > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance Owed:</span>
                          <span className="font-medium text-red-600">₦{supplier.balance_owed.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {supplier.last_delivery_date && (
                    <div className="text-xs text-muted-foreground pt-2">
                      Last delivery: {new Date(supplier.last_delivery_date).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2 mt-3">
                    <Button
                      className="w-full"
                      onClick={() => handleAmountOwed(supplier)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Amount Owed
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handlePayment(supplier)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {selectedSupplier?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Balance Owed</Label>
                <div className="text-2xl font-bold text-red-600">
                  ₦{selectedSupplier?.balance_owed?.toLocaleString() || 0}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount (₦) *</Label>
                <Input
                  id="payment-amount"
                  type="text"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(formatAmountInput(e.target.value))}
                  onBlur={(e) => setPaymentAmount(formatAmountOnBlur(e.target.value))}
                  placeholder="Enter payment amount"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card/POS</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Check</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              
              {(paymentMethod === 'bank_transfer' || paymentMethod === 'card' || paymentMethod === 'check') && (
                <div className="space-y-2">
                  <Label htmlFor="reference-number">Reference Number</Label>
                  <Input
                    id="reference-number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transaction reference or check number"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes (Optional)</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  Cancel
                </Button>
                  <Button onClick={submitPayment} disabled={isSubmittingPayment}>
                    {isSubmittingPayment ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Amount Owed Dialog */}
        <Dialog open={showAmountOwedDialog} onOpenChange={setShowAmountOwedDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Amount Owed</DialogTitle>
              <DialogDescription>
                Add a debt for {selectedSupplier?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount-owed">Amount Owed (₦) *</Label>
                <Input
                  id="amount-owed"
                  type="text"
                  inputMode="decimal"
                  value={amountOwed}
                  onChange={(e) => setAmountOwed(formatAmountInput(e.target.value))}
                  onBlur={(e) => setAmountOwed(formatAmountOnBlur(e.target.value))}
                  placeholder="Enter amount owed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-owed-date">Date *</Label>
                <Input
                  id="amount-owed-date"
                  type="date"
                  value={amountOwedDate}
                  onChange={(e) => setAmountOwedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-owed-notes">Notes (Optional)</Label>
                <Textarea
                  id="amount-owed-notes"
                  value={amountOwedNotes}
                  onChange={(e) => setAmountOwedNotes(e.target.value)}
                  placeholder="Add any notes about this debt"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAmountOwedDialog(false)}
                >
                  Cancel
                </Button>
                  <Button onClick={submitAmountOwed} disabled={isSubmittingAmountOwed}>
                    {isSubmittingAmountOwed ? "Saving..." : "Save Amount Owed"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
