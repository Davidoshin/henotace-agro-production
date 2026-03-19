import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Users, Mail, Phone, Calendar, Briefcase, Clock, DollarSign, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, isUpgradeRequiredError, getUpgradeErrorMessage } from "@/lib/api";

interface Staff {
  id: number;
  employee_id: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  department: string;
  position: string;
  employment_type: string;
  hire_date: string | null;
  permissions: {
    can_manage_sales: boolean;
    can_manage_inventory: boolean;
    can_manage_staff: boolean;
    can_view_reports: boolean;
    can_manage_branches: boolean;
  };
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [canManageStaff, setCanManageStaff] = useState<boolean | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const defaultDepartments = [
    "Operations",
    "Finance",
    "Sales / Customer Relations",
    "Leadership"
  ];

  const defaultPositions = [
    "Store Manager",
    "Operations Manager",
    "Logistics Staff",
    "Warehouse Staff",
    "Sales Rep.",
    "Bookkeeper",
    "Accountant",
    "Administrative Assistant",
    "Sales Lead",
    "Supervisor",
    "Customer Service Rep.",
    "Managing Director",
    "CEO"
  ];

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    department: "",
    position: "",
    employment_type: "full_time",
    hire_date: "",
    can_manage_sales: false,
    can_manage_inventory: false,
    can_manage_staff: false,
    can_view_reports: false,
    can_manage_branches: false,
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          const allowed = !!data?.staff?.can_manage_staff;
          setCanManageStaff(allowed);
          if (!allowed) {
            toast({ title: "Access denied", description: "You don't have permission to manage staff", variant: "destructive" });
            navigate('/business-staff-dashboard');
          }
        })
        .catch(() => {
          setCanManageStaff(false);
          toast({ title: "Access denied", description: "You don't have permission to manage staff", variant: "destructive" });
          navigate('/business-staff-dashboard');
        });
    } else {
      setCanManageStaff(true);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (!canManageStaff) return;
    loadStaff();
    if (searchParams.get('action') === 'add') {
      setShowAddDialog(true);
    }
  }, [searchParams, canManageStaff]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await apiGet("business/staff/");
      setStaff(data.staff || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load staff", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingStaff) {
        await apiPut(`business/staff/${editingStaff.id}/`, formData);
        toast({ title: "Success", description: "Staff updated successfully" });
      } else {
        // Auto-generate password from last name if not provided
        const submitData = {
          ...formData,
          password: formData.password || formData.last_name || "changeme123"
        };
        await apiPost("business/staff/", submitData);
        toast({ 
          title: "Success", 
          description: `Staff added successfully. Default password: ${submitData.password}`,
          duration: 5000
        });
      }
      setShowAddDialog(false);
      setEditingStaff(null);
      resetForm();
      await loadStaff();
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
        toast({ title: "Error", description: e.message || "Failed to save staff", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await apiDelete(`business/staff/${id}/`);
      toast({ title: "Success", description: "Staff removed successfully" });
      await loadStaff();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to remove staff", variant: "destructive" });
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      email: staffMember.user.email,
      first_name: staffMember.user.first_name,
      last_name: staffMember.user.last_name,
      password: "",
      department: staffMember.department || "",
      position: staffMember.position || "",
      employment_type: staffMember.employment_type || "full_time",
      hire_date: staffMember.hire_date || "",
      can_manage_sales: staffMember.permissions.can_manage_sales,
      can_manage_inventory: staffMember.permissions.can_manage_inventory,
      can_manage_staff: staffMember.permissions.can_manage_staff,
      can_view_reports: staffMember.permissions.can_view_reports,
      can_manage_branches: staffMember.permissions.can_manage_branches || false,
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      department: "",
      position: "",
      employment_type: "full_time",
      hire_date: "",
      can_manage_sales: false,
      can_manage_inventory: false,
      can_manage_staff: false,
      can_view_reports: false,
      can_manage_branches: false,
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
            <h1 className="text-2xl md:text-3xl font-bold">Staff Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your business staff members</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => navigate('/business/hr-payroll')} className="w-full sm:w-auto">
            <Clock className="w-4 h-4 mr-2" />
            HR & Payroll
          </Button>
          <Button onClick={() => { resetForm(); setEditingStaff(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No staff members yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first staff member</p>
            <Button onClick={() => { resetForm(); setEditingStaff(null); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{member.user.first_name} {member.user.last_name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{member.position || "Staff Member"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{member.user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(member.user.email, "Email")}
                  >
                    {copiedField === `email-${member.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{member.department || "No department"}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm group">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>ID: {member.employee_id}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(member.employee_id, "Employee ID")}
                  >
                    {copiedField === `id-${member.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold mb-2">Permissions:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {member.permissions.can_manage_sales && <span className="text-green-600">✓ Sales</span>}
                    {member.permissions.can_manage_inventory && <span className="text-green-600">✓ Inventory</span>}
                    {member.permissions.can_manage_staff && <span className="text-green-600">✓ Staff</span>}
                    {member.permissions.can_view_reports && <span className="text-green-600">✓ Reports</span>}
                    {member.permissions.can_manage_branches && <span className="text-green-600">✓ Branches</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add New Staff"}</DialogTitle>
            <DialogDescription>
              {editingStaff ? "Update staff member information" : "Add a new staff member to your business"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingStaff} />
            </div>
            {!editingStaff && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Auto-generated credentials:</strong><br />
                  • Staff ID will be generated automatically<br />
                  • Default password will be the staff's last name<br />
                  • Staff can change password from their account settings
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultPositions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hire Date</Label>
                <Input type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sales" className="font-normal">Manage Sales</Label>
                  <Switch id="sales" checked={formData.can_manage_sales} onCheckedChange={(checked) => setFormData({...formData, can_manage_sales: checked})} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inventory" className="font-normal">Manage Inventory</Label>
                  <Switch id="inventory" checked={formData.can_manage_inventory} onCheckedChange={(checked) => setFormData({...formData, can_manage_inventory: checked})} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff" className="font-normal">Manage Staff</Label>
                  <Switch id="staff" checked={formData.can_manage_staff} onCheckedChange={(checked) => setFormData({...formData, can_manage_staff: checked})} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reports" className="font-normal">View Reports</Label>
                  <Switch id="reports" checked={formData.can_view_reports} onCheckedChange={(checked) => setFormData({...formData, can_view_reports: checked})} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="branches" className="font-normal">Manage Branches</Label>
                    <p className="text-xs text-muted-foreground">Can view all branches and filter dashboard</p>
                  </div>
                  <Switch id="branches" checked={formData.can_manage_branches} onCheckedChange={(checked) => setFormData({...formData, can_manage_branches: checked})} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingStaff(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingStaff ? "Update" : "Add"} Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
