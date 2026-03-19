import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, UserPlus, Building2, Search, RefreshCw, Eye, Edit, Trash2,
  UserCheck, Shield, Phone, Mail, Calendar, ChevronRight, ArrowRightLeft,
  Briefcase, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface PlatformStaff {
  id: number;
  staff_id: string;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  status: string;
  department: string;
  phone: string;
  hire_date: string;
  can_manage_businesses: boolean;
  can_approve_withdrawals: boolean;
  can_manage_subscriptions: boolean;
  can_view_reports: boolean;
  can_manage_delivery: boolean;
  active_assignments: number;
  issues_resolved_count: number;
  created_at: string;
}

interface BusinessAssignment {
  id: number;
  staff_id: number;
  staff_code: string;
  staff_name: string;
  staff_role: string;
  business_id: number;
  business_name: string;
  business_slug: string;
  status: string;
  assigned_at: string;
  last_contact_date: string | null;
  issues_count: number;
  notes: string;
}

interface UnassignedBusiness {
  id: number;
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
}

interface StaffStats {
  total_staff: number;
  active_staff: number;
  brm_count: number;
  total_businesses: number;
  assigned_businesses: number;
  unassigned_businesses: number;
  assignment_rate: number;
}

export default function AdminStaffManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('staff');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [staffList, setStaffList] = useState<PlatformStaff[]>([]);
  const [assignments, setAssignments] = useState<BusinessAssignment[]>([]);
  const [unassignedBusinesses, setUnassignedBusinesses] = useState<UnassignedBusiness[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  
  // Filter states
  const [staffFilter, setStaffFilter] = useState({ role: 'all', status: 'active', search: '' });
  const [assignmentFilter, setAssignmentFilter] = useState({ staff_id: '', status: 'active' });
  
  // Dialog states
  const [createStaffDialog, setCreateStaffDialog] = useState(false);
  const [editStaffDialog, setEditStaffDialog] = useState(false);
  const [assignBusinessDialog, setAssignBusinessDialog] = useState(false);
  const [staffDetailDialog, setStaffDetailDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  
  // Selected items
  const [selectedStaff, setSelectedStaff] = useState<PlatformStaff | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<BusinessAssignment | null>(null);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  
  // Form states
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'brm',
    department: '',
    phone: '',
    can_manage_businesses: true,
    can_approve_withdrawals: false,
    can_manage_subscriptions: false,
    can_view_reports: true,
    can_manage_delivery: false,
  });
  
  const [transferStaffId, setTransferStaffId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStaff(),
        loadStats(),
        loadAssignments(),
        loadUnassignedBusinesses(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const params = new URLSearchParams();
      if (staffFilter.role && staffFilter.role !== 'all') params.append('role', staffFilter.role);
      if (staffFilter.status) params.append('status', staffFilter.status);
      if (staffFilter.search) params.append('search', staffFilter.search);
      
      const data = await apiGet(`admin/staff/?${params}`) as any;
      if (data.success) {
        setStaffList(data.staff);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiGet('admin/staff/stats/') as any;
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (assignmentFilter.staff_id) params.append('staff_id', assignmentFilter.staff_id);
      if (assignmentFilter.status) params.append('status', assignmentFilter.status);
      
      const data = await apiGet(`admin/assignments/?${params}`) as any;
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadUnassignedBusinesses = async () => {
    try {
      const data = await apiGet('admin/businesses/unassigned/') as any;
      if (data.success) {
        setUnassignedBusinesses(data.businesses);
      }
    } catch (error) {
      console.error('Error loading unassigned businesses:', error);
    }
  };

  const createStaff = async () => {
    // Password confirmation validation
    if (newStaff.password !== newStaff.confirmPassword) {
      toast({ 
        title: 'Error', 
        description: 'Passwords do not match',
        variant: 'destructive' 
      });
      return;
    }
    
    if (newStaff.password.length < 6) {
      toast({ 
        title: 'Error', 
        description: 'Password must be at least 6 characters',
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...staffData } = newStaff;
      const data = await apiPost('admin/staff/create/', staffData) as any;
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setCreateStaffDialog(false);
        setNewStaff({
          email: '',
          password: '',
          confirmPassword: '',
          first_name: '',
          last_name: '',
          role: 'brm',
          department: '',
          phone: '',
          can_manage_businesses: true,
          can_approve_withdrawals: false,
          can_manage_subscriptions: false,
          can_view_reports: true,
          can_manage_delivery: false,
        });
        loadStaff();
        loadStats();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to create staff',
        variant: 'destructive' 
      });
    }
  };

  const updateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const data = await apiPut(`admin/staff/${selectedStaff.id}/update/`, selectedStaff) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Staff updated successfully' });
        setEditStaffDialog(false);
        loadStaff();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to update staff',
        variant: 'destructive' 
      });
    }
  };

  const deleteStaff = async (staffId: number) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;
    
    try {
      const data = await apiDelete(`admin/staff/${staffId}/delete/`) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Staff deactivated successfully' });
        loadStaff();
        loadStats();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to deactivate staff',
        variant: 'destructive' 
      });
    }
  };

  const assignBusinesses = async () => {
    if (!selectedStaff || selectedBusinessIds.length === 0) return;
    
    try {
      const data = await apiPost('admin/assignments/bulk-assign/', {
        staff_id: selectedStaff.id,
        business_ids: selectedBusinessIds,
      }) as any;
      
      if (data.success) {
        toast({ 
          title: 'Success', 
          description: `Assigned ${data.assigned} businesses` 
        });
        setAssignBusinessDialog(false);
        setSelectedBusinessIds([]);
        loadAssignments();
        loadUnassignedBusinesses();
        loadStaff();
        loadStats();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to assign businesses',
        variant: 'destructive' 
      });
    }
  };

  const unassignBusiness = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to unassign this business?')) return;
    
    try {
      const data = await apiDelete(`admin/assignments/${assignmentId}/unassign/`) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Business unassigned successfully' });
        loadAssignments();
        loadUnassignedBusinesses();
        loadStats();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to unassign business',
        variant: 'destructive' 
      });
    }
  };

  const transferBusiness = async () => {
    if (!selectedAssignment || !transferStaffId) return;
    
    try {
      const data = await apiPost(`admin/assignments/${selectedAssignment.id}/transfer/`, {
        new_staff_id: parseInt(transferStaffId),
      }) as any;
      
      if (data.success) {
        toast({ title: 'Success', description: 'Business transferred successfully' });
        setTransferDialog(false);
        setTransferStaffId('');
        setSelectedAssignment(null);
        loadAssignments();
        loadStaff();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to transfer business',
        variant: 'destructive' 
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      brm: 'bg-blue-100 text-blue-800',
      support: 'bg-green-100 text-green-800',
      operations: 'bg-purple-100 text-purple-800',
      finance: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    if (status === 'inactive') return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    if (status === 'suspended') return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    return <Badge>{status}</Badge>;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Staff Management
          </h2>
          <p className="text-muted-foreground">Manage platform staff and business assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateStaffDialog(true)} size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Staff"
            value={stats.total_staff}
            subtitle={`${stats.active_staff} active`}
            icon={Users}
          />
          <StatCard
            title="BRM Staff"
            value={stats.brm_count}
            subtitle="Business managers"
            icon={UserCheck}
          />
          <StatCard
            title="Assigned Businesses"
            value={stats.assigned_businesses}
            subtitle={`of ${stats.total_businesses} total`}
            icon={Building2}
          />
          <StatCard
            title="Assignment Rate"
            value={`${stats.assignment_rate}%`}
            subtitle={`${stats.unassigned_businesses} unassigned`}
            icon={CheckCircle}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned Businesses</TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or staff ID..."
                    value={staffFilter.search}
                    onChange={(e) => {
                      setStaffFilter({...staffFilter, search: e.target.value});
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && loadStaff()}
                    className="pl-10"
                  />
                </div>
                <Select value={staffFilter.role} onValueChange={(v) => setStaffFilter({...staffFilter, role: v})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="brm">BRM</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={staffFilter.status} onValueChange={(v) => setStaffFilter({...staffFilter, status: v})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadStaff} variant="secondary">Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Staff</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Contact</th>
                      <th className="text-center p-4 font-medium">Businesses</th>
                      <th className="text-center p-4 font-medium">Status</th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                          <td className="p-4"><Skeleton className="h-8 w-24 mx-auto" /></td>
                        </tr>
                      ))
                    ) : staffList.length > 0 ? (
                      staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-muted/30">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{staff.full_name}</p>
                              <p className="text-sm text-muted-foreground">{staff.staff_id}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleBadgeColor(staff.role)}>
                              {staff.role_display}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {staff.email}
                              </p>
                              {staff.phone && (
                                <p className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="w-3 h-3" /> {staff.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{staff.active_assignments}</span>
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(staff.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setStaffDetailDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setEditStaffDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setAssignBusinessDialog(true);
                                }}
                              >
                                <Building2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => deleteStaff(staff.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No staff members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Select 
                  value={assignmentFilter.staff_id} 
                  onValueChange={(v) => setAssignmentFilter({...assignmentFilter, staff_id: v})}
                >
                  <SelectTrigger className="w-60">
                    <SelectValue placeholder="Filter by staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.full_name} ({s.staff_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadAssignments} variant="secondary">Filter</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Business</th>
                      <th className="text-left p-4 font-medium">Assigned To</th>
                      <th className="text-left p-4 font-medium">Assigned Date</th>
                      <th className="text-left p-4 font-medium">Last Contact</th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assignments.length > 0 ? (
                      assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/30">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{a.business_name}</p>
                              <p className="text-sm text-muted-foreground">{a.business_slug}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{a.staff_name}</p>
                              <p className="text-sm text-muted-foreground">{a.staff_code} - {a.staff_role}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(a.assigned_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm">
                            {a.last_contact_date 
                              ? new Date(a.last_contact_date).toLocaleDateString()
                              : <span className="text-muted-foreground">Never</span>
                            }
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setTransferDialog(true);
                                }}
                                title="Transfer to another staff"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => unassignBusiness(a.id)}
                                title="Unassign"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No assignments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unassigned Businesses Tab */}
        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Unassigned Businesses
              </CardTitle>
              <CardDescription>
                These businesses don't have a BRM assigned. Select and assign to staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedBusinesses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedBusinessIds.length} selected
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedBusinessIds(unassignedBusinesses.map(b => b.id))}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedBusinessIds([])}
                      >
                        Clear
                      </Button>
                      <Select 
                        onValueChange={(staffId) => {
                          const staff = staffList.find(s => s.id.toString() === staffId);
                          if (staff && selectedBusinessIds.length > 0) {
                            setSelectedStaff(staff);
                            assignBusinesses();
                          }
                        }}
                      >
                        <SelectTrigger className="w-48" disabled={selectedBusinessIds.length === 0}>
                          <SelectValue placeholder="Assign to staff..." />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.filter(s => s.can_manage_businesses).map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.full_name} ({s.staff_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg divide-y">
                    {unassignedBusinesses.map((business) => (
                      <div key={business.id} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                        <Checkbox
                          checked={selectedBusinessIds.includes(business.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBusinessIds([...selectedBusinessIds, business.id]);
                            } else {
                              setSelectedBusinessIds(selectedBusinessIds.filter(id => id !== business.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {business.owner_name} • {business.owner_email}
                          </p>
                        </div>
                        <Badge variant={business.is_active ? 'default' : 'secondary'}>
                          {business.subscription_plan || 'Free'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(business.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>All businesses are assigned!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Staff Dialog */}
      <Dialog open={createStaffDialog} onOpenChange={setCreateStaffDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Staff Member
            </DialogTitle>
            <DialogDescription>
              Create a new platform staff account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={newStaff.first_name}
                  onChange={(e) => setNewStaff({...newStaff, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newStaff.last_name}
                  onChange={(e) => setNewStaff({...newStaff, last_name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={newStaff.confirmPassword}
                  onChange={(e) => setNewStaff({...newStaff, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={newStaff.role} 
                  onValueChange={(v) => setNewStaff({...newStaff, role: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brm">Business Relationship Manager</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={newStaff.department}
                onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={newStaff.can_manage_businesses}
                    onCheckedChange={(c) => setNewStaff({...newStaff, can_manage_businesses: !!c})}
                  />
                  <span className="text-sm">Can manage assigned businesses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={newStaff.can_manage_subscriptions}
                    onCheckedChange={(c) => setNewStaff({...newStaff, can_manage_subscriptions: !!c})}
                  />
                  <span className="text-sm">Can manage subscriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={newStaff.can_approve_withdrawals}
                    onCheckedChange={(c) => setNewStaff({...newStaff, can_approve_withdrawals: !!c})}
                  />
                  <span className="text-sm">Can approve withdrawals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={newStaff.can_view_reports}
                    onCheckedChange={(c) => setNewStaff({...newStaff, can_view_reports: !!c})}
                  />
                  <span className="text-sm">Can view reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={newStaff.can_manage_delivery}
                    onCheckedChange={(c) => setNewStaff({...newStaff, can_manage_delivery: !!c})}
                  />
                  <span className="text-sm">Can manage delivery</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createStaff}>Create Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editStaffDialog} onOpenChange={setEditStaffDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={selectedStaff.first_name}
                    onChange={(e) => setSelectedStaff({...selectedStaff, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={selectedStaff.last_name}
                    onChange={(e) => setSelectedStaff({...selectedStaff, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={selectedStaff.role} 
                    onValueChange={(v) => setSelectedStaff({...selectedStaff, role: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brm">Business Relationship Manager</SelectItem>
                      <SelectItem value="support">Customer Support</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={selectedStaff.status} 
                    onValueChange={(v) => setSelectedStaff({...selectedStaff, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedStaff.phone || ''}
                  onChange={(e) => setSelectedStaff({...selectedStaff, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-3 pt-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedStaff.can_manage_businesses}
                      onCheckedChange={(c) => setSelectedStaff({...selectedStaff, can_manage_businesses: !!c})}
                    />
                    <span className="text-sm">Can manage assigned businesses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedStaff.can_manage_subscriptions}
                      onCheckedChange={(c) => setSelectedStaff({...selectedStaff, can_manage_subscriptions: !!c})}
                    />
                    <span className="text-sm">Can manage subscriptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedStaff.can_approve_withdrawals}
                      onCheckedChange={(c) => setSelectedStaff({...selectedStaff, can_approve_withdrawals: !!c})}
                    />
                    <span className="text-sm">Can approve withdrawals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedStaff.can_view_reports}
                      onCheckedChange={(c) => setSelectedStaff({...selectedStaff, can_view_reports: !!c})}
                    />
                    <span className="text-sm">Can view reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedStaff.can_manage_delivery}
                      onCheckedChange={(c) => setSelectedStaff({...selectedStaff, can_manage_delivery: !!c})}
                    />
                    <span className="text-sm">Can manage delivery</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateStaff}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Business Dialog */}
      <Dialog open={assignBusinessDialog} onOpenChange={setAssignBusinessDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Businesses to {selectedStaff?.full_name}</DialogTitle>
            <DialogDescription>
              Select businesses to assign to this staff member
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {unassignedBusinesses.length > 0 ? (
              <div className="space-y-2">
                {unassignedBusinesses.map((business) => (
                  <div key={business.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={selectedBusinessIds.includes(business.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBusinessIds([...selectedBusinessIds, business.id]);
                        } else {
                          setSelectedBusinessIds(selectedBusinessIds.filter(id => id !== business.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{business.name}</p>
                      <p className="text-sm text-muted-foreground">{business.owner_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No unassigned businesses available
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignBusinessDialog(false);
              setSelectedBusinessIds([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={assignBusinesses}
              disabled={selectedBusinessIds.length === 0}
            >
              Assign {selectedBusinessIds.length} Businesses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Business</DialogTitle>
            <DialogDescription>
              Transfer "{selectedAssignment?.business_name}" to another staff member
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select New Staff</Label>
            <Select value={transferStaffId} onValueChange={setTransferStaffId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select staff member..." />
              </SelectTrigger>
              <SelectContent>
                {staffList
                  .filter(s => s.id !== selectedAssignment?.staff_id && s.can_manage_businesses)
                  .map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.full_name} ({s.staff_id})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTransferDialog(false);
              setTransferStaffId('');
            }}>
              Cancel
            </Button>
            <Button onClick={transferBusiness} disabled={!transferStaffId}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Detail Dialog */}
      <Dialog open={staffDetailDialog} onOpenChange={setStaffDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedStaff.full_name}</h3>
                  <p className="text-muted-foreground">{selectedStaff.staff_id}</p>
                  <Badge className={getRoleBadgeColor(selectedStaff.role)}>
                    {selectedStaff.role_display}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedStaff.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedStaff.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {selectedStaff.hire_date 
                      ? new Date(selectedStaff.hire_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                  <p className="font-medium">{selectedStaff.active_assignments}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issues Resolved</p>
                  <p className="font-medium">{selectedStaff.issues_resolved_count}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.can_manage_businesses && (
                    <Badge variant="outline">Manage Businesses</Badge>
                  )}
                  {selectedStaff.can_manage_subscriptions && (
                    <Badge variant="outline">Manage Subscriptions</Badge>
                  )}
                  {selectedStaff.can_approve_withdrawals && (
                    <Badge variant="outline">Approve Withdrawals</Badge>
                  )}
                  {selectedStaff.can_view_reports && (
                    <Badge variant="outline">View Reports</Badge>
                  )}
                  {selectedStaff.can_manage_delivery && (
                    <Badge variant="outline">Manage Delivery</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
