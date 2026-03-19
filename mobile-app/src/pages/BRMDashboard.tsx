import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, LogOut, Users, DollarSign, ShoppingCart, 
  MessageSquare, AlertCircle, Calendar, Search, 
  Phone, Mail, ExternalLink, Plus, CheckCircle,
  TrendingUp, Clock, Eye, FileText, AlertTriangle, XCircle,
  RefreshCw, User, Bell, Wallet, UserCog, Shield, Palette, 
  UsersRound, Settings, ChevronDown
} from 'lucide-react';
import { getBaseUrl } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface Business {
  assignment_id: number;
  business_id: number;
  business_name: string;
  business_slug: string;
  owner_name: string;
  owner_email: string;
  subscription_plan: string;
  is_active: boolean;
  total_revenue: number;
  total_orders: number;
  wallet_balance: number;
  assigned_at: string;
  last_contact_date: string | null;
  issues_count: number;
}

interface Note {
  id: number;
  business_name: string;
  note_type: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
}

interface FollowUp {
  id: number;
  business_name: string;
  title: string;
  follow_up_date: string;
}

interface IssueNote {
  id: number;
  title: string;
  content: string;
  business_id: number;
  business_name: string;
  staff_name: string;
  is_important: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface Staff {
  id: number;
  staff_id: string;
  name: string;
  role: string;
}

interface Stats {
  total_businesses: number;
  total_revenue: number;
  total_orders: number;
  issues_resolved: number;
}

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.replace(/^\//, '')}`;
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/brm-login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

export default function BRMDashboard() {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessDetailDialog, setBusinessDetailDialog] = useState(false);
  const [businessDetail, setBusinessDetail] = useState<any>(null);
  const [addNoteDialog, setAddNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    note_type: 'general',
    title: '',
    content: '',
    is_important: false,
    follow_up_date: '',
  });
  
  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Issue management state (notes with note_type='issue')
  const [issueNotes, setIssueNotes] = useState<IssueNote[]>([]);
  const [selectedIssueNote, setSelectedIssueNote] = useState<IssueNote | null>(null);
  const [resolveIssueDialog, setResolveIssueDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('all');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await apiCall('business/notifications/?limit=10');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: number) => {
    try {
      await apiCall(`business/notifications/${notificationId}/read/`, { method: 'POST' });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await apiCall('business/notifications/mark-all-read/', { method: 'POST' });
      loadNotifications();
      toast({ title: 'Success', description: 'All notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('accessToken');
    const brmStaff = localStorage.getItem('brmStaff');
    
    if (!token || !brmStaff) {
      navigate('/brm-login');
      return;
    }
    
    loadDashboard();
    loadNotifications();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiCall('brm/dashboard/');
      
      if (data.success) {
        setStaff(data.staff);
        setStats(data.stats);
        setBusinesses(data.businesses);
        setRecentNotes(data.recent_notes);
        setFollowUps(data.follow_ups);
      }
      
      // Also load issue notes
      await loadIssueNotes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadIssueNotes = async () => {
    try {
      const resolvedParam = issueStatusFilter === 'resolved' ? '?resolved=true' : 
                           issueStatusFilter === 'open' ? '?resolved=false' : '';
      const data = await apiCall(`brm/issue-notes/${resolvedParam}`);
      
      if (data.success) {
        setIssueNotes(data.notes || []);
      }
    } catch (error: any) {
      console.error('Failed to load issue notes:', error);
    }
  };

  const handleResolveIssueNote = async () => {
    if (!selectedIssueNote) return;
    
    try {
      const data = await apiCall(`brm/notes/${selectedIssueNote.id}/resolve/`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes: resolutionNotes }),
      });
      
      if (data.success) {
        toast({ title: 'Success', description: 'Issue resolved successfully' });
        setResolveIssueDialog(false);
        setSelectedIssueNote(null);
        setResolutionNotes('');
        await loadIssueNotes();
        // Also refresh dashboard to update "Issues Resolved" count
        loadDashboard();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve issue',
        variant: 'destructive',
      });
    }
  };

  const handleReopenIssueNote = async (noteId: number) => {
    try {
      const data = await apiCall(`brm/notes/${noteId}/reopen/`, {
        method: 'POST',
      });
      
      if (data.success) {
        toast({ title: 'Success', description: 'Issue reopened' });
        await loadIssueNotes();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reopen issue',
        variant: 'destructive',
      });
    }
  };

  const loadBusinessDetail = async (businessId: number) => {
    try {
      const data = await apiCall(`brm/business/${businessId}/`);
      if (data.success) {
        setBusinessDetail(data);
        setBusinessDetailDialog(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load business details',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = async () => {
    if (!selectedBusiness) return;
    
    try {
      const data = await apiCall(`brm/business/${selectedBusiness.business_id}/note/`, {
        method: 'POST',
        body: JSON.stringify(newNote),
      });
      
      if (data.success) {
        toast({ title: 'Success', description: 'Note added successfully' });
        setAddNoteDialog(false);
        setNewNote({
          note_type: 'general',
          title: '',
          content: '',
          is_important: false,
          follow_up_date: '',
        });
        loadDashboard();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/brm-login');
  };

  const filteredBusinesses = businesses.filter(b => 
    b.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Henotace Staff Portal</h1>
                <p className="text-sm text-gray-500">
                  Welcome, {staff?.name} • {staff?.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-auto p-1" onClick={markAllNotificationsRead}>
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start py-3 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <span className="font-medium">{notification.title}</span>
                          <span className="text-xs text-gray-500">{notification.message}</span>
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-purple-600" onClick={() => navigate('/notifications')}>
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Avatar with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={staff?.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {staff?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{staff?.name}</span>
                      <span className="text-xs font-normal text-gray-500">{staff?.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Settings className="w-4 h-4 mr-2" />
                        <span>Manage Account</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=wallet')}>
                            <Wallet className="w-4 h-4 mr-2" />
                            <span>Wallet</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=referrals')}>
                            <UsersRound className="w-4 h-4 mr-2" />
                            <span>Referrals</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=profile')}>
                            <User className="w-4 h-4 mr-2" />
                            <span>Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=verification')}>
                            <Mail className="w-4 h-4 mr-2" />
                            <span>Email Verification</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=security')}>
                            <Shield className="w-4 h-4 mr-2" />
                            <span>Security & Privacy</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=theme')}>
                            <Palette className="w-4 h-4 mr-2" />
                            <span>Theme</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/manage-account?view=community')}>
                            <UsersRound className="w-4 h-4 mr-2" />
                            <span>Community</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-500">My Businesses</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats?.total_businesses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats?.total_orders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-500">Issues Resolved</p>
                  <p className="text-xl sm:text-2xl font-bold">{issueNotes.filter(n => n.is_resolved).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-ups Alert */}
        {followUps.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                Follow-ups Due ({followUps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {followUps.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{f.title}</p>
                      <p className="text-sm text-gray-500">{f.business_name}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(f.follow_up_date)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="businesses">
              <Building2 className="w-4 h-4 mr-2" />
              Businesses ({businesses.length})
            </TabsTrigger>
            <TabsTrigger value="issues">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Issues ({issueNotes.filter(i => !i.is_resolved).length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="w-4 h-4 mr-2" />
              Recent Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assigned Businesses</CardTitle>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search businesses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredBusinesses.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No businesses assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBusinesses.map(business => (
                      <div 
                        key={business.assignment_id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{business.business_name}</h3>
                              <Badge variant={business.is_active ? 'default' : 'secondary'}>
                                {business.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {business.subscription_plan}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-sm text-gray-500">Owner</p>
                                <p className="font-medium">{business.owner_name}</p>
                                <p className="text-xs text-gray-400">{business.owner_email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Revenue</p>
                                <p className="font-medium text-green-600">{formatCurrency(business.total_revenue)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Orders</p>
                                <p className="font-medium">{business.total_orders}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Wallet Balance</p>
                                <p className="font-medium">{formatCurrency(business.wallet_balance)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Assigned: {formatDate(business.assigned_at)}
                              </span>
                              {business.last_contact_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last Contact: {formatDate(business.last_contact_date)}
                                </span>
                              )}
                              {business.issues_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {business.issues_count} issues
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              size="sm" 
                              onClick={() => loadBusinessDetail(business.business_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedBusiness(business);
                                setAddNoteDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Note
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Business Issues</CardTitle>
                    <CardDescription>Track and resolve issues reported about businesses</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={issueStatusFilter}
                      onValueChange={(value) => {
                        setIssueStatusFilter(value);
                        loadIssueNotes();
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Issues</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadIssueNotes}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {issueNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No issues found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {issueNotes.map(note => (
                      <div
                        key={note.id}
                        className={`p-4 border rounded-lg ${
                          note.is_resolved ? 'bg-green-50 border-green-200' :
                          note.is_important ? 'bg-red-50 border-red-200' :
                          'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{note.title}</h4>
                              <Badge
                                variant={note.is_resolved ? 'secondary' : 'destructive'}
                              >
                                {note.is_resolved ? 'Resolved' : 'Open'}
                              </Badge>
                              {note.is_important && (
                                <Badge variant="destructive">Important</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                <Building2 className="w-3 h-3 inline mr-1" />
                                {note.business_name}
                              </span>
                              <span>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(note.created_at).toLocaleDateString()}
                              </span>
                              <span>
                                <User className="w-3 h-3 inline mr-1" />
                                By: {note.staff_name}
                              </span>
                            </div>
                            {note.resolution_notes && (
                              <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                                <strong>Resolution:</strong> {note.resolution_notes}
                                {note.resolved_at && (
                                  <span className="ml-2 text-gray-500">
                                    ({new Date(note.resolved_at).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!note.is_resolved ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedIssueNote(note);
                                  setResolveIssueDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReopenIssueNote(note.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notes</CardTitle>
                <CardDescription>Your latest interactions with businesses</CardDescription>
              </CardHeader>
              <CardContent>
                {recentNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentNotes.map(note => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{note.title}</h4>
                              {note.is_important && (
                                <Badge variant="destructive">Important</Badge>
                              )}
                              <Badge variant="outline" className="capitalize">
                                {note.note_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-purple-600 mt-1">{note.business_name}</p>
                            <p className="text-sm text-gray-600 mt-2">{note.content}</p>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Business Detail Dialog */}
      <Dialog open={businessDetailDialog} onOpenChange={setBusinessDetailDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{businessDetail?.business?.name || 'Business Details'}</DialogTitle>
          </DialogHeader>
          {businessDetail && (
            <div className="space-y-4">
              {/* Business Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Owner</Label>
                  <p className="font-medium text-sm">{businessDetail.business.owner_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium text-sm truncate">{businessDetail.business.owner_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="font-medium text-sm">{businessDetail.business.owner_phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Subscription</Label>
                  <Badge className="capitalize text-xs">{businessDetail.business.subscription_plan}</Badge>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="text-lg font-bold">{businessDetail.stats?.product_count || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="text-lg font-bold">{businessDetail.stats?.total_sales || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{(businessDetail.stats?.total_revenue || 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              {businessDetail.recent_sales?.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Recent Sales</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {businessDetail.recent_sales.slice(0, 5).map((sale: any) => (
                      <div key={sale.id} className="flex justify-between items-center border p-2 rounded text-sm">
                        <span className="truncate max-w-[120px]">{sale.customer || 'Walk-in'}</span>
                        <span className="font-medium">{formatCurrency(sale.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {businessDetail.notes?.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Notes</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {businessDetail.notes.map((note: any) => (
                      <div key={note.id} className="border p-2 rounded">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{note.title}</span>
                          <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={addNoteDialog} onOpenChange={setAddNoteDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note for {selectedBusiness?.business_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select 
                value={newNote.note_type} 
                onValueChange={(v) => setNewNote({...newNote, note_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="resolution">Resolution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="Brief title for the note"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                placeholder="Detailed note content..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Follow-up Date (Optional)</Label>
              <Input
                type="date"
                value={newNote.follow_up_date}
                onChange={(e) => setNewNote({...newNote, follow_up_date: e.target.value})}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_important"
                checked={newNote.is_important}
                onChange={(e) => setNewNote({...newNote, is_important: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="is_important">Mark as important</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleAddNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={resolveIssueDialog} onOpenChange={setResolveIssueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
              Provide resolution notes for: {selectedIssueNote?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Describe how this issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
            {selectedIssueNote && (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                <p><strong>Business:</strong> {selectedIssueNote.business_name}</p>
                <p><strong>Issue:</strong> {selectedIssueNote.content}</p>
                <p><strong>Reported By:</strong> {selectedIssueNote.staff_name}</p>
                <p><strong>Date:</strong> {new Date(selectedIssueNote.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResolveIssueDialog(false);
              setSelectedIssueNote(null);
              setResolutionNotes('');
            }}>Cancel</Button>
            <Button onClick={handleResolveIssueNote} disabled={!resolutionNotes.trim()}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
