import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, isUpgradeRequiredError, getUpgradeErrorMessage } from "@/lib/api";
import { 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Edit2, 
  Trash2, 
  Users, 
  Star, 
  Building2,
  Crown,
  AlertCircle
} from "lucide-react";
import { ButtonSpinner, PageSpinner } from "@/components/ui/LoadingSpinner";
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
import { Switch } from "@/components/ui/switch";

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_main_branch: boolean;
  is_active: boolean;
  manager: {
    id: number;
    name: string;
    employee_id: string;
  } | null;
  staff_count: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface Staff {
  id: number;
  name: string;
  employee_id: string;
  position: string | null;
  branch_id: number | null;
  branch_name: string | null;
}

export default function BranchManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [canAddBranch, setCanAddBranch] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    is_main_branch: false,
    manager_id: "",
  });

  useEffect(() => {
    loadBranches();
    loadStaff();
  }, []);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('business/branches/');
      if (data.success) {
        setBranches(data.branches || []);
        setCanAddBranch(data.can_add_branch);
        setSubscriptionPlan(data.subscription_plan || 'free');
        setUpgradeMessage(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load branches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await apiGet('business/staff/');
      if (data.success || data.staff) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
    }
  };

  const createDefaultBranch = async () => {
    try {
      setIsSubmitting(true);
      const data = await apiPost('business/branches/create-default/', {});
      if (data.success) {
        toast({
          title: "Success",
          description: "Default branch created successfully"
        });
        loadBranches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create default branch",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBranch = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Branch name and code are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiPost('business/branches/', formData);
      if (data.success) {
        toast({
          title: "Success",
          description: "Branch created successfully"
        });
        setShowAddDialog(false);
        resetForm();
        loadBranches();
      }
    } catch (error: any) {
      if (isUpgradeRequiredError(error) || error.upgrade_required) {
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
          description: error.message || "Failed to create branch",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    if (!selectedBranch) return;

    try {
      setIsSubmitting(true);
      const data = await apiPut(`business/branches/${selectedBranch.id}/`, formData);
      if (data.success) {
        toast({
          title: "Success",
          description: "Branch updated successfully"
        });
        setShowEditDialog(false);
        resetForm();
        loadBranches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update branch",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;

    try {
      setIsSubmitting(true);
      const data = await apiDelete(`business/branches/${selectedBranch.id}/`);
      if (data.success) {
        toast({
          title: "Success",
          description: "Branch deleted successfully"
        });
        setShowDeleteDialog(false);
        setSelectedBranch(null);
        loadBranches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete branch",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStaff = async (staffId: number) => {
    if (!selectedBranch) return;

    try {
      const data = await apiPost(`business/branches/${selectedBranch.id}/assign-staff/`, {
        staff_id: staffId
      });
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Staff assigned successfully"
        });
        loadBranches();
        loadStaff();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign staff",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      is_main_branch: branch.is_main_branch,
      manager_id: branch.manager?.id?.toString() || "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDeleteDialog(true);
  };

  const openStaffDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowStaffDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      is_main_branch: false,
      manager_id: "",
    });
    setSelectedBranch(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PageSpinner />
      </div>
    );
  }

  // No branches - show setup
  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Management
          </CardTitle>
          <CardDescription>
            Set up branches to track sales and staff by location
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Branches Set Up</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Create your first branch to start tracking sales by location. 
            We'll create a "Main" branch for you to get started.
          </p>
          <Button onClick={createDefaultBranch} disabled={isSubmitting}>
            {isSubmitting ? (
              <ButtonSpinner className="mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Main Branch
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Branch Management
              </CardTitle>
              <CardDescription>
                Manage your business locations and assign staff
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={subscriptionPlan === 'free' ? 'secondary' : 'default'}>
                {subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan
              </Badge>
              {canAddBranch ? (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/manage-account?view=upgrade')}
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  Upgrade to Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {!canAddBranch && upgradeMessage && (
          <CardContent className="pt-0">
            <div 
              className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              onClick={() => navigate('/manage-account?view=upgrade')}
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">{upgradeMessage}</span>
              <span className="text-sm font-medium text-amber-600 ml-auto">Upgrade Now →</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Branch List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className={`relative ${!branch.is_active ? 'opacity-60' : ''}`}>
            {branch.is_main_branch && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-amber-500">
                  <Star className="h-3 w-3 mr-1" />
                  Main
                </Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {branch.name}
              </CardTitle>
              <CardDescription>Code: {branch.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {branch.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{branch.phone}</span>
                </div>
              )}
              {branch.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{branch.email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm pt-2 border-t">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {branch.staff_count} staff member{branch.staff_count !== 1 ? 's' : ''}
                </span>
              </div>

              {branch.manager && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Manager: </span>
                  <span className="font-medium">{branch.manager.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(branch)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openStaffDialog(branch)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Staff
                </Button>
                {!branch.is_main_branch && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openDeleteDialog(branch)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch/location for your business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Ikeja Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Branch Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., IKJ"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Branch address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="branch@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Branch Manager (Optional)</Label>
              <Select 
                value={formData.manager_id || "none"} 
                onValueChange={(value) => setFormData({...formData, manager_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} ({s.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_main"
                checked={formData.is_main_branch}
                onCheckedChange={(checked) => setFormData({...formData, is_main_branch: checked})}
              />
              <Label htmlFor="is_main">Set as main branch (headquarters)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBranch} disabled={isSubmitting}>
              {isSubmitting && <ButtonSpinner className="mr-2" />}
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Branch Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Branch Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Branch Manager</Label>
              <Select 
                value={formData.manager_id || "none"} 
                onValueChange={(value) => setFormData({...formData, manager_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} ({s.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_main"
                checked={formData.is_main_branch}
                onCheckedChange={(checked) => setFormData({...formData, is_main_branch: checked})}
              />
              <Label htmlFor="edit_is_main">Set as main branch (headquarters)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBranch} disabled={isSubmitting}>
              {isSubmitting && <ButtonSpinner className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBranch?.name}"? 
              This action cannot be undone. Branches with sales history cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <ButtonSpinner /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Assignment Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Staff - {selectedBranch?.name}</DialogTitle>
            <DialogDescription>
              Assign or reassign staff members to this branch
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {staff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No staff members found</p>
              </div>
            ) : (
              staff.map((s) => (
                <div 
                  key={s.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.employee_id} {s.position && `• ${s.position}`}
                    </p>
                    {s.branch_name && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Current: {s.branch_name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={s.branch_id === selectedBranch?.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAssignStaff(s.id)}
                    disabled={s.branch_id === selectedBranch?.id}
                  >
                    {s.branch_id === selectedBranch?.id ? "Assigned" : "Assign"}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStaffDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
