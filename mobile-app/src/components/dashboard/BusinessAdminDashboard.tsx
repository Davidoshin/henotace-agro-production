import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DelayedLoadingOverlay } from "@/components/ui/LoadingSpinner";
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp,
  Calendar,
  Settings,
  BarChart3,
  CreditCard,
  X,
  Eye,
  EyeOff,
  Search,
  Truck,
  ChevronRight,
  Home,
  HeadphonesIcon,
  Gift,
  Bot,
  Send,
  Clock,
  Wallet,
  LogOut,
  Menu,
  RotateCcw,
  MapPin,
  Receipt,
  History,
  MoreHorizontal,
  Sparkles,
  Palette,
  Briefcase,
  Wrench,
  Globe,
  RefreshCw,
  LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ServiceDashboard from "./ServiceDashboard";

const getYouTubeVideoId = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:shorts\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match?.[1] || null;
};

const trainingVideos = [
  {
    title: "How to manage your business easily",
    url: "https://www.youtube.com/watch?v=ElMu156Wicg&t=10s",
  },
  {
    title: "How to restock your products easily",
    url: "https://www.youtube.com/watch?v=xmMyoXdAYCw&t=2s",
  },
  {
    title: "How to track customers credit and manage suppliers",
    url: "https://www.youtube.com/watch?v=hlcEycFuvHg",
  },
  {
    title: "How to add products in bulk",
    url: "https://www.youtube.com/shorts/8ARD02rc5bA",
  },
  {
    title: "How to track what you sold in a day",
    url: "https://www.youtube.com/shorts/WtMWZVL8szo",
  },
  {
    title: "How to add new branches",
    url: "https://www.youtube.com/shorts/zJbOCyf1Thg",
  },
]
  .map((video) => ({ ...video, id: getYouTubeVideoId(video.url) }))
  .filter((video): video is { title: string; url: string; id: string } => !!video.id);

interface BusinessStats {
  total_staff?: number;
  total_customers?: number;
  total_products?: number;
  total_sales?: number;
  sales_today?: number;
  revenue_today?: number;
  revenue_month?: number;
}

interface CreditOverview {
  total_credit: number;
  total_paid: number;
  total_outstanding: number;
  pending_count: number;
  overdue_count: number;
}

interface CreditRecord {
  id: number;
  customer_name: string;
  customer_email: string;
  amount: number;
  amount_paid: number;
  balance: number;
  description: string;
  due_date: string;
  status: string;
  created_at: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
  is_active: boolean;
}

// Cache keys for dashboard data
const DASHBOARD_CACHE_KEY = 'dashboard_cache';
const DASHBOARD_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Helper to get cached dashboard data
const getCachedDashboard = (): { data: any; timestamp: number } | null => {
  try {
    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is still valid (within 5 minutes)
      if (Date.now() - parsed.timestamp < DASHBOARD_CACHE_EXPIRY) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse dashboard cache:', e);
  }
  return null;
};

// Helper to set dashboard cache
const setCachedDashboard = (data: any) => {
  try {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache dashboard data:', e);
  }
};

export default function BusinessAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize from cache for instant loading
  const cachedData = getCachedDashboard();
  const [stats, setStats] = useState<BusinessStats>(cachedData?.data?.stats || {});
  const [isLoading, setIsLoading] = useState(!cachedData); // Only show loading if no cache
  const [apiDataLoaded, setApiDataLoaded] = useState(false); // Track if fresh API data was loaded
  const [businessData, setBusinessData] = useState<any>(cachedData?.data?.businessData || null);
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(cachedData?.data?.creditOverview || null);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>(cachedData?.data?.creditRecords || []);
  const [showCreditCustomers, setShowCreditCustomers] = useState(false);
  const [creditSearchName, setCreditSearchName] = useState("");
  const [creditStartDate, setCreditStartDate] = useState("");
  const [creditEndDate, setCreditEndDate] = useState("");
  const [showRevenue, setShowRevenue] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>(cachedData?.data?.recentSales || []);
  const [showAIManager, setShowAIManager] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [activeTrainingVideoId, setActiveTrainingVideoId] = useState<string>(
    trainingVideos[0]?.id || ""
  );
  
  // Dashboard view mode state (service-based or product-based)
  const [dashboardViewMode, setDashboardViewMode] = useState<'product' | 'service'>(() => {
    // Default from localStorage or fallback to signup selection
    const saved = localStorage.getItem('dashboard_view_mode');
    if (saved === 'service' || saved === 'product') return saved;
    return 'product'; // Will be updated when businessData loads
  });
  
  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [canManageBranches, setCanManageBranches] = useState(false);
  
  // Staff-specific state
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [salaryInfo, setSalaryInfo] = useState<any>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  
  // Check if current user is staff or business owner
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('user_role');
  const isBusinessOwner = userRole === 'business_owner' || userRole === 'business_admin';
  const [isStaff, setIsStaff] = useState(userRole === 'business_staff' || userRole === 'staff');

  // Load branches and check permissions
  useEffect(() => {
    const loadBranches = async () => {
      try {
        if (isStaff && !canManageBranches) {
          return;
        }
        const data = await apiGet('business/branches/');
        if (data.success && data.branches) {
          setBranches(data.branches);
          // If only one branch, auto-select it
          if (data.branches.length === 1) {
            setSelectedBranch(data.branches[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      }
    };

    const checkBranchPermission = async () => {
      // Business owners can always manage branches
      if (isBusinessOwner) {
        setCanManageBranches(true);
        return;
      }
      
      // Check staff permissions
      try {
        const data = await apiGet('business/staff/me/');
        if (data.success && data.staff) {
          setCanManageBranches(data.staff.can_manage_branches || false);
          setStaffProfile(data.staff);
        }
      } catch (error) {
        console.error('Failed to check permissions:', error);
      }
    };

    checkBranchPermission().finally(loadBranches);
  }, [isBusinessOwner, isStaff, canManageBranches]);

  // Handle branch selection change
  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    // Store in localStorage for persistence
    localStorage.setItem('dashboard_selected_branch', branchId);
  };

  useEffect(() => {
    // Restore selected branch from localStorage
    const savedBranch = localStorage.getItem('dashboard_selected_branch');
    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only show loading spinner if we don't have cached data
      if (!cachedData) {
        setIsLoading(true);
      }
      
      // Store dashboard result at function scope for caching
      let dashboardResult: any = null;
      
      try {
        // Build query params with branch filter
        const branchParam = selectedBranch !== 'all' ? `?branch_id=${selectedBranch}` : '';
        const salesBranchParam = selectedBranch !== 'all' ? `&branch_id=${selectedBranch}` : '';
        
        // Fetch dashboard data first (most important) - this will trigger token refresh if needed
        try {
          dashboardResult = await apiGet(`business/dashboard/${branchParam}`);
          const dashboard = dashboardResult.dashboard || {};
          setStats({
            total_staff: dashboard.staff?.count || 0,
            total_customers: dashboard.customers?.count || 0,
            total_products: dashboard.inventory?.total_products || 0,
            total_sales: dashboard.all_time?.total_sales || 0,
            sales_today: dashboard.today?.sales_count || 0,
            revenue_today: dashboard.today?.revenue || 0,
            revenue_month: dashboard.this_month?.revenue || 0
          });
          setApiDataLoaded(true); // Mark that fresh API data was loaded successfully
          setBusinessData(dashboardResult.business || {});
          
          // Set default dashboard view mode based on business type (only if not already set)
          const business = dashboardResult.business || {};
          const savedMode = localStorage.getItem('dashboard_view_mode');
          if (!savedMode) {
            // Default to service-based if that's enabled, otherwise product-based
            const defaultMode = business.service_based_enabled && !business.product_based_enabled ? 'service' : 'product';
            setDashboardViewMode(defaultMode);
            localStorage.setItem('dashboard_view_mode', defaultMode);
          }
          
          // Set recent sales from dashboard if available
          if (dashboard.recent_sales) {
            setRecentSales(dashboard.recent_sales.slice(0, 3));
          }
        } catch (dashboardError: any) {
          console.warn('Dashboard API error:', dashboardError);
          // If it's an auth error, the apiCall will handle redirect
          if (dashboardError.status === 401 || dashboardError.status === 403) {
            // Auth error - apiCall should have handled token refresh or redirect
            throw dashboardError;
          }
          // For other errors, only reset stats if we didn't already load fresh data
          // This prevents cache data from being overwritten by error fallback
          if (!apiDataLoaded) {
            setStats({
              total_staff: 0,
              total_customers: 0,
              total_products: 0,
              total_sales: 0,
              sales_today: 0,
              revenue_today: 0,
              revenue_month: 0
            });
          }
        }
        
        // Fetch additional data in parallel (after dashboard succeeds)
        const [salesResult, creditResult] = await Promise.allSettled([
          apiGet(`business/sales/?limit=3${salesBranchParam}`),
          apiGet('business/credits/overview/')
        ]);

        // Process sales data (fallback if not in dashboard)
        if (salesResult.status === 'fulfilled') {
          const salesData = salesResult.value;
          if (salesData?.results || salesData?.sales) {
            // Only update if we don't have recent sales from dashboard
            setRecentSales(prev => prev.length === 0 
              ? (salesData.results || salesData.sales || []).slice(0, 3)
              : prev
            );
          }
        } else {
          console.warn('Recent sales not available:', salesResult.reason);
        }

        // Process credit data
        if (creditResult.status === 'fulfilled') {
          const creditData = creditResult.value;
          if (creditData.success) {
            setCreditOverview(creditData.overview);
            setCreditRecords(creditData.credits || []);
            
            // Cache all dashboard data for faster subsequent loads
            // Use the actual data from API responses, not state variables
            setCachedDashboard({
              stats: {
                total_staff: dashboardResult?.dashboard?.staff?.count || 0,
                total_customers: dashboardResult?.dashboard?.customers?.count || 0,
                total_products: dashboardResult?.dashboard?.inventory?.total_products || 0,
                total_sales: dashboardResult?.dashboard?.all_time?.total_sales || 0,
                sales_today: dashboardResult?.dashboard?.today?.sales_count || 0,
                revenue_today: dashboardResult?.dashboard?.today?.revenue || 0,
                revenue_month: dashboardResult?.dashboard?.this_month?.revenue || 0
              },
              businessData: dashboardResult?.business || null,
              recentSales: dashboardResult?.dashboard?.recent_sales?.slice(0, 3) || [],
              creditOverview: creditData.overview,
              creditRecords: creditData.credits || []
            });
          }
        } else {
          console.warn('Credit overview not available:', creditResult.reason);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        // Don't show toast for auth errors as user will be redirected
        if (error.status !== 401 && error.status !== 403) {
          toast({
            title: 'Error',
            description: 'Failed to load dashboard data',
            variant: 'destructive'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, selectedBranch]);

  // Fetch AI credits when AI Manager opens
  useEffect(() => {
    if (showAIManager && aiCredits === null) {
      const fetchAICredits = async () => {
        try {
          const data = await apiGet('business/ai-manager/credits/');
          if (data.success) {
            setAiCredits(data.free_remaining);
          }
        } catch (error) {
          console.warn('Could not fetch AI credits:', error);
        }
      };
      fetchAICredits();
    }
  }, [showAIManager, aiCredits]);

  // Load staff profile if user is staff
  useEffect(() => {
    if (isStaff) {
      // Fetch staff profile
      const fetchStaffProfile = async () => {
        try {
          const data = await apiGet('business/staff/me/');
          if (data.id) {
            setStaffProfile(data);
          }
        } catch (error) {
          console.warn('Could not fetch staff profile:', error);
        }
      };
      fetchStaffProfile();
    }
  }, [isStaff]);

  // Clock In handler for staff
  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      const response = await apiPost('business/attendance/clock-in/', {});
      if (response.success || response.id) {
        toast({
          title: 'Clocked In',
          description: 'You have successfully clocked in',
        });
        setStaffMenuOpen(false);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to clock in',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clock in',
        variant: 'destructive'
      });
    } finally {
      setClockingIn(false);
    }
  };

  // Clock Out handler for staff
  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      const response = await apiPost('business/attendance/clock-out/', {});
      if (response.success || response.id) {
        toast({
          title: 'Clocked Out',
          description: 'You have successfully clocked out',
        });
        setStaffMenuOpen(false);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to clock out',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clock out',
        variant: 'destructive'
      });
    } finally {
      setClockingOut(false);
    }
  };

  // Logout handler for staff
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const statCards = [
    {
      title: "Revenue Today",
      value: `₦${((stats.revenue_today || 0) / 1000).toFixed(1)}K`,
      icon: DollarSign,
      description: "Today's earnings",
      color: "text-green-600"
    },
    {
      title: "Sales Today",
      value: stats.sales_today || 0,
      icon: ShoppingCart,
      description: "Today's transactions",
      color: "text-orange-600"
    },
    {
      title: "Monthly Revenue",
      value: `₦${((stats.revenue_month || 0) / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      description: "This month",
      color: "text-blue-600"
    },
    {
      title: "Total Products",
      value: stats.total_products || 0,
      icon: Package,
      description: "Products in inventory",
      color: "text-purple-600"
    },
    {
      title: "Total Staff",
      value: stats.total_staff || 0,
      icon: Users,
      description: "Active employees",
      color: "text-blue-600"
    },
    {
      title: "Total Customers",
      value: stats.total_customers || 0,
      icon: Users,
      description: "Registered customers",
      color: "text-green-600"
    }
  ];

  // Filter credit records
  const filteredCreditRecords = creditRecords.filter(credit => {
    const matchesName = !creditSearchName || 
      credit.customer_name.toLowerCase().includes(creditSearchName.toLowerCase()) ||
      credit.customer_email.toLowerCase().includes(creditSearchName.toLowerCase());
    
    const matchesDateRange = (!creditStartDate || new Date(credit.created_at) >= new Date(creditStartDate)) &&
                             (!creditEndDate || new Date(credit.created_at) <= new Date(creditEndDate));
    
    return matchesName && matchesDateRange;
  });

  // AI Manager send function
  const handleAISend = async (message: string) => {
    if (!message.trim()) return;
    
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: message }]);
    setAiLoading(true);

    try {
      // Prepare context with business data
      const context = {
        business_name: businessData?.name,
        revenue_today: stats.revenue_today,
        revenue_month: stats.revenue_month,
        total_sales: stats.total_sales,
        total_products: stats.total_products,
        total_staff: stats.total_staff,
        total_customers: stats.total_customers,
        credit_overview: creditOverview,
        recent_sales: recentSales.slice(0, 5)
      };

      const data = await apiPost('business/ai-manager/chat/', {
        message,
        context
      });
      
      if (data.success) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        if (data.free_remaining !== undefined) {
          setAiCredits(data.free_remaining);
        }
      } else if (data.redirect_to || data.error?.includes('100 free')) {
        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ You've used all 100 free AI messages this month.\n\nTo continue using the AI Manager, you can get more credits from your API Dashboard.\n\n[Go to API Dashboard →]` 
        }]);
        toast({
          title: "Free Messages Exhausted",
          description: "Get more credits from your API Dashboard to continue.",
          variant: "destructive"
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('AI Manager error:', error);
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle dashboard mode switch
  const handleSwitchDashboard = () => {
    const newMode = dashboardViewMode === 'product' ? 'service' : 'product';
    setDashboardViewMode(newMode);
    localStorage.setItem('dashboard_view_mode', newMode);
    toast({
      title: `Switched to ${newMode === 'service' ? 'Service' : 'Product'}-Based Dashboard`,
      description: newMode === 'service' 
        ? 'Now viewing service-based dashboard' 
        : 'Now viewing product-based dashboard',
    });
  };

  // If service mode is selected, render the ServiceDashboard
  if (dashboardViewMode === 'service' && !isLoading) {
    return (
      <ServiceDashboard 
        businessData={businessData}
        onSwitchDashboard={handleSwitchDashboard}
      />
    );
  }

  // Show delayed fullscreen loader if loading takes more than 10 seconds
  // But keep loading inline first for faster perceived performance

  return (
    <div className="max-w-7xl mx-auto">
      {/* Delayed loading overlay for slow dashboard loads (shows after 10 seconds) */}
      <DelayedLoadingOverlay 
        isLoading={isLoading} 
        delay={10000}
        message="Loading dashboard..."
      />

      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{businessData?.name || "Business Dashboard"}</h1>
                {/* Dashboard View Mode Toggle - Always visible for business owners */}
                {businessData && isBusinessOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwitchDashboard}
                    className="h-8 gap-1.5 text-xs flex items-center"
                    title="Switch to Service-Based Dashboard"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Product Mode</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      <Package className="h-3 w-3" />
                    </Badge>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                {businessData?.name ? "Manage your business operations" : "Set up your business to get started"}
              </p>
            </div>
          
            {/* Branch Selector - Only visible to business owner or staff with can_manage_branches */}
            {canManageBranches && branches.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Viewing:</span>
              </div>
              <Select value={selectedBranch} onValueChange={handleBranchChange}>
                <SelectTrigger className="w-[180px] sm:w-[200px]">
                  <SelectValue placeholder="All Branches">
                    {selectedBranch === 'all' ? (
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        All Branches
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {branches.find(b => b.id.toString() === selectedBranch)?.name || 'Select Branch'}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>All Branches</span>
                    </div>
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{branch.name}</span>
                        {branch.is_main_branch && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">HQ</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Show selected branch info on mobile */}
        {canManageBranches && branches.length > 1 && selectedBranch !== 'all' && (
          <div className="mt-2 sm:hidden">
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {branches.find(b => b.id.toString() === selectedBranch)?.name}
              {branches.find(b => b.id.toString() === selectedBranch)?.is_main_branch && ' (HQ)'}
            </Badge>
          </div>
        )}
      </div>

      {/* POS Quick Access Button */}
      {businessData?.show_pos_button !== false && (
        <div className="mb-6">
          <Button
            onClick={() => navigate('/pos')}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5" />
            Open POS to Start Selling
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Mobile & Tablet Stats Cards - OPay Style */}
      <div className="lg:hidden space-y-4 mb-8">
        {/* Revenue Today Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-90">Revenue Today</span>
                  <button 
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    {showRevenue ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-2xl font-bold">
                  {showRevenue ? `₦${(stats.revenue_today || 0).toLocaleString()}` : '₦••••••'}
                </p>
              </div>
              <button 
                onClick={() => navigate('/business/reports?view=sales')}
                className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition"
              >
                Sales Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Total Products Quick Link */}
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span className="text-sm">Total Products</span>
              </div>
              <button 
                onClick={() => navigate('/business/products')}
                className="flex items-center gap-1 text-sm font-semibold"
              >
                {stats.total_products || 0} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Recent Sales
              </h3>
              <Button 
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/business/sales');
                }}
                className="text-sm text-primary font-medium flex items-center gap-1 h-auto py-1 px-2"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale, index) => (
                  <div 
                    key={sale.id || index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        sale.payment_status === 'completed' || sale.payment_status === 'paid'
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {sale.customer_name || sale.customer?.name || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-NG', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        sale.payment_status === 'completed' || sale.payment_status === 'paid'
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        +₦{(sale.final_amount || sale.total_amount || sale.total || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {sale.payment_method || 'Cash'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent sales</p>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate('/pos')}
                  className="mt-2"
                >
                  Make a sale →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Stats Grid - First (No Revenue Today - only on mobile) */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-green-500"
          onClick={() => navigate('/business/sales-details')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sales_today || 0}</div>
            <p className="text-xs text-muted-foreground">Today's transactions</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500"
          onClick={() => navigate('/business/products')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500"
          onClick={() => navigate('/business/customers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-500"
          onClick={() => navigate('/business/stock-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock History</CardTitle>
            <History className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">View stock movements</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Manage Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Main Features */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/staff')}
            >
              <Users className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Staff</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/credit')}
            >
              <CreditCard className="h-7 w-7 text-green-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Credit</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/products')}
            >
              <Package className="h-7 w-7 text-purple-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Products</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/sales-details')}
            >
              <ShoppingCart className="h-7 w-7 text-orange-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Sales</span>
            </Button>
          </div>
          
          {/* Row 2: Secondary Features + More */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/profit-analysis')}
            >
              <TrendingUp className="h-7 w-7 text-emerald-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Account</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/returns')}
            >
              <RotateCcw className="h-7 w-7 text-indigo-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Returned</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/shipping-management')}
            >
              <Truck className="h-7 w-7 text-blue-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">Shipping</span>
            </Button>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              onClick={() => navigate('/business/all-services')}
            >
              <MoreHorizontal className="h-7 w-7 text-gray-600" />
              <span className="text-sm font-medium text-center text-foreground group-hover:text-foreground">More</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pro Services Banner - OPay Style */}
      <div 
        className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow border border-purple-100 dark:border-purple-900"
        onClick={() => navigate('/business/professional-services')}
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/50 rounded-full p-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Need Professional Services?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Graphics, Branding, CAC, Tax & more</p>
          </div>
        </div>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-4">
          Request
        </Button>
      </div>

      {/* Dashboard Training Playlist */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Dashboard Training Playlist</CardTitle>
          <CardDescription>Select a video to learn how to use the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="w-full aspect-video overflow-hidden rounded-lg border">
              <iframe
                className="h-full w-full"
                src={
                  activeTrainingVideoId
                    ? `https://www.youtube.com/embed/${activeTrainingVideoId}?rel=0&playlist=${trainingVideos
                        .map((video) => video.id)
                        .join(',')}`
                    : ""
                }
                title="Henotace Training Playlist"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="space-y-2">
              {trainingVideos.map((video, index) => (
                <button
                  key={`${video.id}-${index}`}
                  type="button"
                  onClick={() => setActiveTrainingVideoId(video.id || "")}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                    video.id === activeTrainingVideoId
                      ? "bg-purple-50 border-purple-300 text-purple-900 dark:bg-purple-900/20 dark:border-purple-700"
                      : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium">{video.title}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Section - Hidden on mobile */}
      <Card className="mb-8 hidden md:block">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>Manage your suppliers and track deliveries</CardDescription>
            </div>
            <Button onClick={() => navigate('/business/suppliers')} className="gap-2">
              <Truck className="h-4 w-4" />
              View All Suppliers
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Keep track of your suppliers, their contact information, products supplied, and payment status.
          </p>
        </CardContent>
      </Card>

      {/* Welcome Message - Hidden on mobile */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Welcome to Henotace Business</CardTitle>
          <CardDescription>Your AI-powered business management platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Get started by managing your staff, products, sales, and more. Use the navigation menu to access different sections of your business management system.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/business/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom spacing for mobile nav */}
      <div className="md:hidden h-20"></div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => navigate('/business-admin-dashboard')}
            className="flex flex-col items-center justify-center gap-1 text-primary"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate('/manage-account?tab=support')}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition"
          >
            <HeadphonesIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Support</span>
          </button>
          <button
            onClick={() => navigate('/manage-account?tab=referrals')}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition"
          >
            <Gift className="h-5 w-5" />
            <span className="text-[10px] font-medium">Referrals</span>
          </button>
          <button
            onClick={() => setShowAIManager(true)}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition"
          >
            <Bot className="h-5 w-5" />
            <span className="text-[10px] font-medium">AI Manager</span>
          </button>
        </div>
      </div>

      {/* Desktop Floating AI Manager Button */}
      {!showAIManager && (
        <button
          onClick={() => setShowAIManager(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-50 items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-all duration-200"
        >
          <Bot className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background text-[10px] font-bold flex items-center justify-center text-white">
            {aiCredits !== null ? (aiCredits > 99 ? '99+' : aiCredits) : '!'}
          </span>
        </button>
      )}

      {/* AI Manager Chat Modal */}
      {showAIManager && (
        <>
          {/* Mobile: Full screen from bottom */}
          <div className="md:hidden fixed inset-0 bg-black/50 z-[60] flex items-end justify-center">
            <div className="bg-background w-full h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Hi there! 👋</h3>
                    <p className="text-xs opacity-90">How may I help you today?</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20" onClick={() => setShowAIManager(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Credits Info */}
              <div className="px-4 py-2 bg-muted/50 text-xs text-center text-muted-foreground">
                {aiCredits !== null ? `${aiCredits}/100 free messages left this month` : '100 free messages/month'}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      I can help you with business decisions, analyze metrics, and provide advice.
                    </p>
                    <div className="space-y-2">
                      {[
                        "How is my business doing?",
                        "Analyze my sales trend",
                        "Who are my top customers?",
                        "Suggest ways to increase revenue"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted transition text-sm"
                          onClick={() => handleAISend(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAISend(aiInput);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Send us a message..."
                    className="flex-1"
                    disabled={aiLoading}
                  />
                  <Button type="submit" size="icon" disabled={!aiInput.trim() || aiLoading} className="bg-primary">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Desktop: Widget style from bottom-right */}
          <div className="hidden md:block fixed bottom-6 right-6 z-[60] w-[380px] h-[550px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 bg-primary text-primary-foreground rounded-t-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Bot className="h-6 w-6" />
                    </div>
                    <span className="font-semibold">AI Manager</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 h-8 w-8" onClick={() => setShowAIManager(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold">Hi there! 👋</h3>
                <p className="text-sm opacity-90">How may I help you today?</p>
              </div>

              {/* Credits Badge */}
              <div className="px-4 py-2 bg-muted/50 text-xs text-center text-muted-foreground border-b">
                {aiCredits !== null ? `${aiCredits}/100 free messages left this month` : '100 free messages/month'}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="space-y-2">
                    {[
                      "How is my business doing?",
                      "Analyze my sales trend",
                      "Who are my top customers?",
                      "Suggest ways to increase revenue"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="w-full text-left p-3 rounded-xl border hover:bg-muted hover:border-primary transition text-sm flex items-center justify-between group"
                        onClick={() => handleAISend(suggestion)}
                      >
                        <span>{suggestion}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-background">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAISend(aiInput);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 rounded-full"
                    disabled={aiLoading}
                  />
                  <Button type="submit" size="icon" disabled={!aiInput.trim() || aiLoading} className="rounded-full bg-primary h-10 w-10">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}