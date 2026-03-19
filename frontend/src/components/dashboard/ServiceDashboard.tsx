import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  Briefcase, 
  Users, 
  Calendar,
  Clock,
  Plus,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  EyeOff,
  Settings,
  Receipt,
  CreditCard,
  Calculator,
  UserPlus,
  FolderPlus,
  CalendarPlus,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Wrench,
  Bell,
  LayoutGrid,
  BarChart3,
  Target,
  Package,
  ArrowLeftRight,
  Store
} from "lucide-react";

interface ServiceDashboardProps {
  businessData: any;
  onSwitchDashboard: () => void;
}

interface Project {
  id: number;
  name: string;
  client_name: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  due_date: string;
  budget?: number;
  description?: string;
}

interface DashboardStats {
  monthly_revenue: number;
  revenue_change: number;
  active_projects: number;
  total_clients: number;
  clients_change: number;
  scheduled_meetings: number;
  pending_invoices: number;
  total_expenses: number;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  client_name?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface ScheduleItem {
  id: number;
  title: string;
  date: string;
  time: string;
  client_name?: string;
  type: 'meeting' | 'deadline' | 'task';
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  icon?: string;
}

interface PendingBankTransfer {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  transfer_reference: string;
  transfer_notes: string;
  submitted_at: string;
  created_at: string;
}

export default function ServiceDashboard({ businessData, onSwitchDashboard }: ServiceDashboardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    monthly_revenue: 0,
    revenue_change: 0,
    active_projects: 0,
    total_clients: 0,
    clients_change: 0,
    scheduled_meetings: 0,
    pending_invoices: 0,
    total_expenses: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingBankTransfer[]>([]);
  const [approvingTransfer, setApprovingTransfer] = useState<number | null>(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter projects and clients based on search query
  const filteredProjects = projects.filter(p => 
    !searchQuery || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Initialize with proper check to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch service dashboard stats
      const [statsRes, projectsRes, transactionsRes, scheduleRes, activityRes] = await Promise.all([
        apiGet('business/service-dashboard/stats/').catch(() => ({ success: false })),
        apiGet('business/service-dashboard/projects/').catch(() => ({ success: false, projects: [] })),
        apiGet('business/service-dashboard/transactions/').catch(() => ({ success: false, transactions: [] })),
        apiGet('business/service-dashboard/schedule/').catch(() => ({ success: false, items: [] })),
        apiGet('business/service-dashboard/activity/').catch(() => ({ success: false, activities: [] })),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats || statsRes);
      }
      
      if (projectsRes.success) {
        setProjects(projectsRes.projects || []);
      }
      
      if (transactionsRes.success) {
        setTransactions(transactionsRes.transactions || []);
      }
      
      if (scheduleRes.success) {
        setScheduleItems(scheduleRes.items || []);
      }
      
      if (activityRes.success) {
        setRecentActivity(activityRes.activities || []);
      }
      
      // Fetch pending bank transfers
      const pendingRes = await apiGet('business/invoice-payments/pending/').catch(() => ({ success: false, pending_invoices: [] }));
      if (pendingRes.success) {
        setPendingTransfers(pendingRes.pending_invoices || []);
      }

    } catch (error) {
      console.error('Error fetching service dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTransfer = async (invoiceId: number) => {
    try {
      setApprovingTransfer(invoiceId);
      const response = await apiPost(`business/invoice-payments/${invoiceId}/approve/`, {});
      
      if (response.success) {
        toast({
          title: "Payment Approved",
          description: "The bank transfer has been approved and the invoice is marked as paid.",
        });
        // Remove from pending list
        setPendingTransfers(prev => prev.filter(t => t.id !== invoiceId));
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to approve payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApprovingTransfer(null);
    }
  };

  const handleRejectTransfer = async (invoiceId: number) => {
    try {
      setApprovingTransfer(invoiceId);
      const response = await apiPost(`business/invoice-payments/${invoiceId}/reject/`, {
        reason: "Payment rejected by business owner"
      });
      
      if (response.success) {
        toast({
          title: "Payment Rejected",
          description: "The bank transfer has been rejected.",
        });
        // Remove from pending list
        setPendingTransfers(prev => prev.filter(t => t.id !== invoiceId));
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to reject payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApprovingTransfer(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'on_hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'in_progress': return <CheckCircle2 className="w-3 h-3" />;
      case 'on_hold': return <PauseCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Mobile Dashboard Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold">{businessData?.name || 'Service Dashboard'}</h1>
              <p className="text-xs text-muted-foreground">Service-based Business</p>
            </div>
            {/* Switch to Product Dashboard - One-click button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchDashboard}
              className="h-8 gap-1.5 text-xs flex items-center"
              title="Switch to Product Dashboard"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Service Mode</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                <Store className="h-3 w-3" />
              </Badge>
            </Button>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="p-4 space-y-4">
          {/* Revenue Card - Like Product Dashboard */}
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white/80">Monthly Revenue</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setShowRevenue(!showRevenue)}
                    >
                      {showRevenue ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-2xl font-bold">
                    {showRevenue ? formatCurrency(stats.monthly_revenue) : '****'}
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => navigate('/business/invoices')}
                >
                  Transactions <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {/* Active Projects Row */}
              <div 
                className="flex items-center justify-between mt-4 pt-3 border-t border-white/20 cursor-pointer"
                onClick={() => navigate('/business/projects')}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">Active Projects</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{stats.active_projects}</span>
                  <ChevronRight className="h-4 w-4 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card 
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 cursor-pointer"
            onClick={() => navigate('/business/schedule')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Schedule</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-purple-500">{stats.scheduled_meetings}</p>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                      pending
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tasks to complete</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Invoices</CardTitle>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary text-xs"
                  onClick={() => navigate('/business/invoices')}
                >
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.client_name || tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Bank Transfers */}
          {pendingTransfers.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base text-amber-500">Pending Approvals</CardTitle>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                      {pendingTransfers.length}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">Bank transfers awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-[200px]">
                  {pendingTransfers.map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{transfer.client_name}</p>
                          <Badge variant="outline" className="text-xs">{transfer.invoice_number}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Ref: {transfer.transfer_reference}
                        </p>
                        <p className="text-sm font-bold text-emerald-500 mt-1">
                          {formatCurrency(transfer.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 px-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={() => handleRejectTransfer(transfer.id)}
                          disabled={approvingTransfer === transfer.id}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => handleApproveTransfer(transfer.id)}
                          disabled={approvingTransfer === transfer.id}
                        >
                          {approvingTransfer === transfer.id ? "..." : "Approve"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Manage Business Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Manage Business</h3>
            <div className="grid grid-cols-4 gap-3">
              {/* Row 1 */}
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/staff')}
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs">Staff</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/clients')}
              >
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-xs">Clients</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/services')}
              >
                <Wrench className="h-5 w-5 text-orange-500" />
                <span className="text-xs">Services</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/invoices')}
              >
                <FileText className="h-5 w-5 text-emerald-500" />
                <span className="text-xs">Invoices</span>
              </Button>

              {/* Row 2 */}
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/analytics')}
              >
                <BarChart3 className="h-5 w-5 text-cyan-500" />
                <span className="text-xs">Analytics</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/service-expenses')}
              >
                <Receipt className="h-5 w-5 text-red-500" />
                <span className="text-xs">Expenses</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/business/tax')}
              >
                <Calculator className="h-5 w-5 text-amber-500" />
                <span className="text-xs">My Tax</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-col h-auto py-3 gap-1"
                onClick={() => navigate('/service-more-options')}
              >
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
                <span className="text-xs">More</span>
              </Button>
            </div>
          </div>

          {/* Active Projects Preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Projects</CardTitle>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary text-xs"
                  onClick={() => navigate('/business/projects')}
                >
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredProjects.filter(p => p.status === 'pending' || p.status === 'in_progress').length > 0 ? (
                filteredProjects.filter(p => p.status === 'pending' || p.status === 'in_progress').slice(0, 3).map((project) => (
                  <div key={project.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client_name}</p>
                      </div>
                      <Badge className={`text-[10px] ${getStatusColor(project.status)}`}>
                        {project.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.status === 'completed' ? 100 : project.progress}%</span>
                      </div>
                      <Progress value={project.status === 'completed' ? 100 : project.progress} className="h-1.5" />
                    </div>
                    {project.due_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {new Date(project.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active projects</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate('/business/projects/new')}
                  >
                    Create your first project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Desktop Dashboard Layout (ServHub Style)
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{businessData?.name || 'ServHub'}</h1>
                  <p className="text-xs text-muted-foreground">Service Dashboard</p>
                </div>
              </div>
              {/* Dashboard Mode Switcher - One-click button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchDashboard}
                className="h-8 gap-1.5 text-xs flex items-center ml-4"
                title="Switch to Product Dashboard"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Service Mode</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                  <Store className="h-3 w-3" />
                </Badge>
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search projects, clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/business/projects/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Monthly Revenue */}
          <Card 
            className="bg-card border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/business/invoices')}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 -ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRevenue(!showRevenue);
                      }}
                    >
                      {showRevenue ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <h3 className="text-2xl font-bold">
                      {showRevenue ? formatCurrency(stats.monthly_revenue) : '****'}
                    </h3>
                  </div>
                  {stats.revenue_change !== 0 && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${stats.revenue_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stats.revenue_change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stats.revenue_change > 0 ? '+' : ''}{stats.revenue_change}% from last month
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card 
            className="bg-card border-l-4 border-l-cyan-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/business/projects')}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                  <h3 className="text-2xl font-bold">{stats.active_projects}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {projects.filter(p => p.status === 'pending' || p.status === 'in_progress').length > 0 
                      ? `${projects.filter(p => new Date(p.due_date) <= new Date(Date.now() + 7*24*60*60*1000)).length} due this week`
                      : 'No projects due soon'
                    }
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Clients */}
          <Card 
            className="bg-card border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/business/clients')}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Clients</p>
                  <h3 className="text-2xl font-bold">{stats.total_clients}</h3>
                  {stats.clients_change !== 0 && (
                    <p className={`text-xs mt-1 ${stats.clients_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stats.clients_change > 0 ? '+' : ''}{stats.clients_change} new this month
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card 
            className="bg-card border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/business/schedule')}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Schedule</p>
                  <h3 className="text-2xl font-bold">{stats.scheduled_meetings}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Meetings this week</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Active Projects Section - 8 columns */}
          <div className="col-span-8">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-primary"
                    onClick={() => navigate('/business/projects')}
                  >
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-40" />
                    ))}
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProjects.slice(0, 4).map((project) => (
                      <Card 
                        key={project.id} 
                        className="bg-muted/30 border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/business/projects/${project.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">{project.client_name}</p>
                            </div>
                            <Badge className={`${getStatusColor(project.status)} border`}>
                              {project.status === 'on_hold' ? 'On Hold' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{project.status === 'completed' ? 100 : project.progress}%</span>
                            </div>
                            <Progress value={project.status === 'completed' ? 100 : project.progress} className="h-2" />
                          </div>
                          
                          {project.due_date && (
                            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg mb-2">{searchQuery ? 'No projects found' : 'No projects yet'}</p>
                    <p className="text-sm mb-4">{searchQuery ? `No results for "${searchQuery}"` : 'Create your first project to get started'}</p>
                    {!searchQuery && (
                      <Button onClick={() => navigate('/business/projects/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 4 columns */}
          <div className="col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-foreground"
                  onClick={() => navigate('/business/projects/new')}
                >
                  <FolderPlus className="h-5 w-5 text-cyan-500" />
                  <span className="text-xs">New Project</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-foreground"
                  onClick={() => navigate('/business/clients/new')}
                >
                  <UserPlus className="h-5 w-5 text-orange-500" />
                  <span className="text-xs">Add Client</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-foreground"
                  onClick={() => navigate('/business/invoices/new')}
                >
                  <FileText className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs">Create Invoice</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-foreground"
                  onClick={() => navigate('/business/schedule/new')}
                >
                  <CalendarPlus className="h-5 w-5 text-purple-500" />
                  <span className="text-xs">Schedule Meeting</span>
                </Button>
              </CardContent>
              {/* See more button */}
              <div className="px-6 pb-4">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate('/service-more-options')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  See more
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px] pr-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Transactions & Schedule */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate('/business/invoices')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.client_name || tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate('/business/schedule')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : scheduleItems.length > 0 ? (
                <div className="space-y-3">
                  {scheduleItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          {item.type === 'meeting' ? (
                            <Users className="h-5 w-5 text-purple-500" />
                          ) : item.type === 'deadline' ? (
                            <AlertCircle className="h-5 w-5 text-purple-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.client_name || item.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.time}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming events</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate('/business/schedule/new')}
                  >
                    Schedule something
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
