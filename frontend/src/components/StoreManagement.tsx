import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { 
  Plus, 
  MapPin, 
  Edit2, 
  Trash2, 
  Package, 
  Warehouse,
  AlertCircle,
  ArrowRightLeft,
  Store as StoreIcon,
  BoxIcon,
  Building2
} from "lucide-react";
import { PageSpinner, ButtonSpinner } from "@/components/ui/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Store {
  id: number;
  name: string;
  code: string;
  store_type: string;
  address: string | null;
  is_primary: boolean;
  is_active: boolean;
  allow_direct_sales: boolean;
  branch: {
    id: number;
    name: string;
    code: string;
    is_main_branch: boolean;
  };
  manager: {
    id: number;
    name: string;
    employee_id: string;
  } | null;
  stock_items_count: number;
  total_stock_units: number;
  max_capacity_units: number | null;
  created_at: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
}

interface StoreTransfer {
  id: number;
  transfer_number: string;
  transfer_type: string;
  source: { type: string; id: number; name: string } | null;
  destination: { type: string; id: number; name: string } | null;
  product: { id: number; name: string; sku: string };
  quantity: number;
  status: string;
  notes: string | null;
  initiated_by: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  unit: string;
}

export default function StoreManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for store
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    branch_id: "",
    store_type: "warehouse",
    address: "",
    max_capacity_units: "",
    allow_direct_sales: false,
  });
  
  // Form state for transfer
  const [transferData, setTransferData] = useState({
    transfer_type: "store_to_branch",
    from_store_id: "",
    from_branch_id: "",
    to_store_id: "",
    to_branch_id: "",
    product_id: "",
    quantity: "",
    notes: "",
    auto_complete: true,
  });
  
  useEffect(() => {
    fetchStores();
    fetchTransfers();
    fetchProducts();
  }, []);
  
  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const response = await apiGet("business/stores/");
      if (response.success) {
        setStores(response.stores || []);
        setBranches(response.branches || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTransfers = async () => {
    try {
      const response = await apiGet("business/store-transfers/");
      if (response.success) {
        setTransfers(response.transfers || []);
      }
    } catch (error) {
      console.error("Failed to load transfers:", error);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const response = await apiGet("business/products/?page_size=500");
      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };
  
  const handleAddStore = async () => {
    if (!formData.name || !formData.branch_id) {
      toast({
        title: "Validation Error",
        description: "Store name and branch are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await apiPost("business/stores/", {
        name: formData.name,
        code: formData.code || undefined,
        branch_id: parseInt(formData.branch_id),
        store_type: formData.store_type,
        address: formData.address || undefined,
        max_capacity_units: formData.max_capacity_units ? parseInt(formData.max_capacity_units) : undefined,
        allow_direct_sales: formData.allow_direct_sales,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Store created successfully",
        });
        setShowAddDialog(false);
        resetForm();
        fetchStores();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create store",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditStore = async () => {
    if (!selectedStore || !formData.name) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await apiPut(`business/stores/${selectedStore.id}/`, {
        name: formData.name,
        code: formData.code || undefined,
        store_type: formData.store_type,
        address: formData.address || undefined,
        max_capacity_units: formData.max_capacity_units ? parseInt(formData.max_capacity_units) : undefined,
        allow_direct_sales: formData.allow_direct_sales,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Store updated successfully",
        });
        setShowEditDialog(false);
        setSelectedStore(null);
        resetForm();
        fetchStores();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update store",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteStore = async () => {
    if (!selectedStore) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiDelete(`business/stores/${selectedStore.id}/`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Store deactivated successfully",
        });
        setShowDeleteDialog(false);
        setSelectedStore(null);
        fetchStores();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete store",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCreateTransfer = async () => {
    if (!transferData.product_id || !transferData.quantity) {
      toast({
        title: "Validation Error",
        description: "Product and quantity are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        transfer_type: transferData.transfer_type,
        product_id: parseInt(transferData.product_id),
        quantity: parseFloat(transferData.quantity),
        notes: transferData.notes || undefined,
        auto_complete: transferData.auto_complete,
      };
      
      if (transferData.transfer_type === "store_to_store") {
        payload.from_store_id = parseInt(transferData.from_store_id);
        payload.to_store_id = parseInt(transferData.to_store_id);
      } else if (transferData.transfer_type === "store_to_branch") {
        payload.from_store_id = parseInt(transferData.from_store_id);
        payload.to_branch_id = parseInt(transferData.to_branch_id);
      } else if (transferData.transfer_type === "branch_to_store") {
        payload.from_branch_id = parseInt(transferData.from_branch_id);
        payload.to_store_id = parseInt(transferData.to_store_id);
      }
      
      const response = await apiPost("business/store-transfers/", payload);
      
      if (response.success) {
        toast({
          title: "Success",
          description: transferData.auto_complete 
            ? "Transfer completed successfully" 
            : "Transfer created successfully",
        });
        setShowTransferDialog(false);
        resetTransferForm();
        fetchTransfers();
        fetchStores();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      branch_id: "",
      store_type: "warehouse",
      address: "",
      max_capacity_units: "",
      allow_direct_sales: false,
    });
  };
  
  const resetTransferForm = () => {
    setTransferData({
      transfer_type: "store_to_branch",
      from_store_id: "",
      from_branch_id: "",
      to_store_id: "",
      to_branch_id: "",
      product_id: "",
      quantity: "",
      notes: "",
      auto_complete: true,
    });
  };
  
  const openEditDialog = (store: Store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      code: store.code,
      branch_id: store.branch.id.toString(),
      store_type: store.store_type,
      address: store.address || "",
      max_capacity_units: store.max_capacity_units?.toString() || "",
      allow_direct_sales: store.allow_direct_sales || false,
    });
    setShowEditDialog(true);
  };
  
  const getStoreTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      warehouse: "Warehouse",
      retail: "Retail Store",
      outlet: "Outlet",
      storage: "Storage",
    };
    return types[type] || type;
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <PageSpinner message="Loading stores..." />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Store Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your warehouses and stores for inventory control
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowTransferDialog(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Transfer Stock</span>
            <span className="sm:hidden">Transfer</span>
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Store</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="stores" className="w-full">
        <TabsList>
          <TabsTrigger value="stores">
            <Warehouse className="h-4 w-4 mr-2" />
            Stores ({stores.length})
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stores" className="mt-4">
          {stores.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Stores Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create stores/warehouses to manage inventory at different locations
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <Card key={store.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {store.store_type === "warehouse" ? (
                          <Warehouse className="h-5 w-5 text-primary" />
                        ) : (
                          <StoreIcon className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{store.name}</CardTitle>
                          <CardDescription>{store.code}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(store)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStore(store);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{getStoreTypeLabel(store.store_type)}</Badge>
                      {store.is_primary && (
                        <Badge className="bg-yellow-500">Primary</Badge>
                      )}
                      {store.allow_direct_sales ? (
                        <Badge className="bg-green-500">Sales Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Storage Only</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>Branch: {store.branch.name}</span>
                      </div>
                      
                      {store.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{store.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BoxIcon className="h-4 w-4" />
                        <span>{store.stock_items_count} products • {store.total_stock_units} units</span>
                      </div>
                    </div>
                    
                    {store.manager && (
                      <div className="text-sm text-muted-foreground">
                        Manager: {store.manager.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transfers" className="mt-4">
          {transfers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transfers Yet</h3>
                <p className="text-muted-foreground">
                  Transfer stock between stores and branches to manage inventory
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Transfer #</th>
                      <th className="text-left p-3 font-medium">From</th>
                      <th className="text-left p-3 font-medium">To</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-left p-3 font-medium">Quantity</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr key={transfer.id} className="border-t">
                        <td className="p-3 font-mono text-sm">{transfer.transfer_number}</td>
                        <td className="p-3">
                          {transfer.source ? (
                            <span className="text-sm">
                              {transfer.source.name}
                              <span className="text-muted-foreground ml-1">
                                ({transfer.source.type})
                              </span>
                            </span>
                          ) : "-"}
                        </td>
                        <td className="p-3">
                          {transfer.destination ? (
                            <span className="text-sm">
                              {transfer.destination.name}
                              <span className="text-muted-foreground ml-1">
                                ({transfer.destination.type})
                              </span>
                            </span>
                          ) : "-"}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{transfer.product.name}</div>
                          <div className="text-xs text-muted-foreground">{transfer.product.sku}</div>
                        </td>
                        <td className="p-3">{transfer.quantity}</td>
                        <td className="p-3">{getStatusBadge(transfer.status)}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Store Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>
              Create a new warehouse or store for inventory management
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input
                placeholder="e.g., Main Warehouse, Downtown Store"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Store Code</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select
                value={formData.branch_id}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name} {branch.is_main_branch && "(Main)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Store Type</Label>
              <Select
                value={formData.store_type}
                onValueChange={(value) => setFormData({ ...formData, store_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="retail">Retail Store</SelectItem>
                  <SelectItem value="outlet">Outlet</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                placeholder="Store address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Max Capacity (units)</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={formData.max_capacity_units}
                onChange={(e) => setFormData({ ...formData, max_capacity_units: e.target.value })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Direct Sales</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, products in this store will be available for sale in POS and Public Store URL.
                  By default, only products in the main branch inventory are available for sale.
                </p>
              </div>
              <Switch
                checked={formData.allow_direct_sales}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_direct_sales: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStore} disabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner className="mr-2" /> : null}
              Create Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Store Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>
              Update store details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Store Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Store Type</Label>
              <Select
                value={formData.store_type}
                onValueChange={(value) => setFormData({ ...formData, store_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="retail">Retail Store</SelectItem>
                  <SelectItem value="outlet">Outlet</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Direct Sales</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, products in this store will be available for sale in POS and Public Store URL.
                </p>
              </div>
              <Switch
                checked={formData.allow_direct_sales}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_direct_sales: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStore} disabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner className="mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Store Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this store? 
              This will hide it from the list but keep the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} disabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Transfer Stock Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
            <DialogDescription>
              Move stock between stores and branches
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <Select
                value={transferData.transfer_type}
                onValueChange={(value) => setTransferData({ 
                  ...transferData, 
                  transfer_type: value,
                  from_store_id: "",
                  from_branch_id: "",
                  to_store_id: "",
                  to_branch_id: "",
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store_to_branch">Store → Branch</SelectItem>
                  <SelectItem value="branch_to_store">Branch → Store</SelectItem>
                  <SelectItem value="store_to_store">Store → Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Source Selection */}
            {(transferData.transfer_type === "store_to_branch" || transferData.transfer_type === "store_to_store") && (
              <div className="space-y-2">
                <Label>From Store *</Label>
                <Select
                  value={transferData.from_store_id}
                  onValueChange={(value) => setTransferData({ ...transferData, from_store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name} ({store.branch.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {transferData.transfer_type === "branch_to_store" && (
              <div className="space-y-2">
                <Label>From Branch *</Label>
                <Select
                  value={transferData.from_branch_id}
                  onValueChange={(value) => setTransferData({ ...transferData, from_branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name} {branch.is_main_branch && "(Main)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Destination Selection */}
            {transferData.transfer_type === "store_to_branch" && (
              <div className="space-y-2">
                <Label>To Branch *</Label>
                <Select
                  value={transferData.to_branch_id}
                  onValueChange={(value) => setTransferData({ ...transferData, to_branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name} {branch.is_main_branch && "(Main)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(transferData.transfer_type === "branch_to_store" || transferData.transfer_type === "store_to_store") && (
              <div className="space-y-2">
                <Label>To Store *</Label>
                <Select
                  value={transferData.to_store_id}
                  onValueChange={(value) => setTransferData({ ...transferData, to_store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name} ({store.branch.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select
                value={transferData.product_id}
                onValueChange={(value) => setTransferData({ ...transferData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.sku}) - {product.current_stock} {product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional transfer notes"
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransfer} disabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner className="mr-2" /> : null}
              Complete Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
