import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiCall } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  Bell,
  Wallet,
  User,
  Mail,
  Shield,
  Palette,
  UsersRound,
  ChevronDown,
  CheckCircle,
  XCircle,
  Briefcase,
  Store,
  FileText,
  Calendar,
  UserPlus,
  PieChart,
  Zap
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiGet, getBaseUrl } from "@/lib/api";
import LoginForm from "@/components/auth/LoginForm";
import { PageSpinner } from "@/components/ui/LoadingSpinner";
import NotificationPopup from "@/components/notifications/NotificationPopup";

// Get base URL for image paths (without /api suffix)
const BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

// Lazy load heavy dashboard components
const CustomerDashboard = lazy(() => import("@/pages/CustomerDashboard"));
const BusinessAdminDashboard = lazy(() => import("./BusinessAdminDashboard"));
const AgroProductionDashboard = lazy(() => import("./AgroProductionDashboard"));

// Loading fallback component
const DashboardLoader = () => (
  <div className="flex items-center justify-center h-64">
    <PageSpinner message="Loading dashboard..." />
  </div>
);

interface User {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_image?: string;
}

interface ActionableNotification {
  id: number;
  title: string;
  message: string;
  action_type: string;
  action_data: any;
  notification_type?: string;
  requires_action?: boolean;
  action_taken?: boolean;
  is_read?: boolean;
  created_at?: string;
}

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActionableNotification | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [dashboardViewMode, setDashboardViewMode] = useState<'product' | 'service'>(() => {
    return (localStorage.getItem('dashboard_view_mode') as 'product' | 'service') || 'product';
  });
  const [staffPermissions, setStaffPermissions] = useState<{
    can_manage_sales: boolean;
    can_manage_inventory: boolean;
    can_manage_staff: boolean;
    can_view_reports: boolean;
    can_manage_branches?: boolean;
  } | null>(null);
  const { toast } = useToast();
  const businessCategory = (localStorage.getItem('business_category') || localStorage.getItem('business_type') || '').toLowerCase();
  const currentPath = location.pathname;
  const isAgroProduction = currentPath === '/agro-dashboard' || ['agro_production', 'agro_production_farming', 'agro', 'farm', 'farming'].includes(businessCategory);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (showToastForNew = false) => {
    try {
      const response = await apiCall('business/notifications/');
      if (response?.success && response?.notifications) {
        const newNotifications = response.notifications;
        
        // Check if there are new unread notifications
        const unreadCount = newNotifications.filter((n: any) => !n.is_read).length;
        
        // Show toast for new notifications (only if we had previous data and count increased)
        if (showToastForNew && lastNotificationCount > 0 && unreadCount > lastNotificationCount) {
          const newCount = unreadCount - lastNotificationCount;
          const latestNotification = newNotifications.find((n: any) => !n.is_read);
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`${newCount} New Notification${newCount > 1 ? 's' : ''}`, {
                body: latestNotification?.title || 'You have new notifications',
                icon: '/favicon.png',
                tag: 'henotace-notification'
              });
            } catch {}
          }
          
          // Also show in-app toast
          toast({
            title: `${newCount} New Notification${newCount > 1 ? 's' : ''}`,
            description: latestNotification?.title || 'You have new notifications',
            duration: 5000,
          });
        }
        
        setLastNotificationCount(unreadCount);
        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [lastNotificationCount, toast]);

  useEffect(() => {
    if (user && userRole) {
      loadNotifications(false); // Initial load without toast
        // Refresh notifications every 45 seconds; skip when tab is hidden to reduce server load
        const interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            loadNotifications(true);
          }
        }, 45000);
      return () => clearInterval(interval);
    }
  }, [user, userRole, loadNotifications]);

  useEffect(() => {
    if (userRole === 'business_staff' || userRole === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          if (data?.staff) {
            setStaffPermissions({
              can_manage_sales: !!data.staff.can_manage_sales,
              can_manage_inventory: !!data.staff.can_manage_inventory,
              can_manage_staff: !!data.staff.can_manage_staff,
              can_view_reports: !!data.staff.can_view_reports,
              can_manage_branches: !!data.staff.can_manage_branches,
            });
          }
        })
        .catch(() => setStaffPermissions(null));
    } else {
      setStaffPermissions(null);
    }
  }, [userRole]);
  
  const appTitle = 'Henotace Business';

  useEffect(() => {
    // Check if user is already logged in
    const accessToken = localStorage.getItem('accessToken');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserData = localStorage.getItem('userData');

    if (accessToken && storedUserRole && storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        const role = storedUserRole;
        
        // Validate role - only business roles
        const validRoles = ['business_owner', 'business_admin', 'business_staff', 'customer', 'admin', 'staff'];
        if (!validRoles.includes(role)) {
          console.warn(`Invalid role detected: ${role}. User email: ${userData?.email || 'unknown'}`);
        }
        
        // Set initial user data from localStorage
        setUser(userData);
        setUserRole(role);
        
        // Fetch fresh user data from API to get latest profile_image
        apiGet('profile/').then((freshUserData: any) => {
          if (freshUserData) {
            console.log('Fresh user data fetched:', freshUserData);
            // Profile image should already be a full URL from backend, but ensure it
            if (freshUserData.profile_image && !freshUserData.profile_image.startsWith('http')) {
              freshUserData.profile_image = `${BASE_URL}${freshUserData.profile_image}`;
            }
            setUser(freshUserData);
            // Update localStorage with fresh data
            localStorage.setItem('userData', JSON.stringify(freshUserData));
            
            // For business users, use the admin's profile_image as the logo
            if (role === 'business_owner' || role === 'business_admin' || role === 'admin') {
              if (freshUserData.profile_image) {
                let logoUrl = freshUserData.profile_image;
                if (!logoUrl.startsWith('http')) {
                  logoUrl = `${BASE_URL}${logoUrl}`;
                }
                setBusinessLogo(logoUrl);
              }
            }
          }
        }).catch((error) => {
          console.warn('Failed to fetch fresh user data:', error);
          // Continue with localStorage data if API call fails
          // Still try to set business logo from localStorage data
          if ((role === 'business_owner' || role === 'business_admin' || role === 'admin') && userData?.profile_image) {
            let logoUrl = userData.profile_image;
            if (!logoUrl.startsWith('http')) {
              logoUrl = `${BASE_URL}${logoUrl}`;
            }
            setBusinessLogo(logoUrl);
          }
        });
        
        // Redirect business users to appropriate dashboard ONLY on initial login
        // Don't redirect if user is on a business sub-page like /business/sales, /business/products, etc.
        // or any other valid business route
        if (typeof window !== 'undefined') {
          const currentPath = location.pathname;
          
          // List of valid business routes that should NOT trigger redirect
          const validBusinessRoutes = [
            '/business-admin-dashboard',
            '/business-staff-dashboard',
            '/agro-dashboard',
            '/customer-dashboard',
            '/pos',
            '/staff-attendance',
            '/sales-management',
          ];
          
          // Check if current path is a business sub-page or a valid route
          const isBusinessSubPage = currentPath.startsWith('/business/') || currentPath.startsWith('/agro/');
          const isValidRoute = validBusinessRoutes.includes(currentPath);
          
          // Only redirect from login pages or root, not from valid business pages
          const shouldRedirect = !isBusinessSubPage && !isValidRoute;
          
          if (shouldRedirect) {
            if (role === 'business_owner' || role === 'business_admin' || role === 'admin') {
              navigate(isAgroProduction ? '/agro-dashboard' : '/business-admin-dashboard', { replace: true });
              return;
            } else if (role === 'business_staff' || role === 'staff') {
              navigate(isAgroProduction ? '/agro-dashboard' : '/business-staff-dashboard', { replace: true });
              return;
            } else if (role === 'customer') {
              navigate('/customer-dashboard', { replace: true });
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, [location.pathname, navigate]);

  // Listen for profile updates (e.g., when profile image is uploaded)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          
          // Update business logo if user is an admin
          if ((userRole === 'business_owner' || userRole === 'business_admin' || userRole === 'admin') && userData?.profile_image) {
            let logoUrl = userData.profile_image;
            if (!logoUrl.startsWith('http')) {
              logoUrl = `${BASE_URL}${logoUrl}`;
            }
            setBusinessLogo(logoUrl);
          }
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (from same tab)
    window.addEventListener('profile-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleStorageChange);
    };
  }, [userRole]);

  // Toggle dashboard view mode
  const toggleViewMode = (mode: 'product' | 'service') => {
    setDashboardViewMode(mode);
    localStorage.setItem('dashboard_view_mode', mode);
    localStorage.setItem('dashboardViewMode', mode); // Also save with alternate key for ManageAccount
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('dashboardViewModeChanged', { detail: { mode } }));
    // Force a hard navigation to ensure the dashboard re-renders
    const targetPath = mode === 'service' ? '/business/services-dashboard' : '/business-admin-dashboard';
    // Use window.location for a hard navigation to ensure component remounts
    window.location.href = targetPath;
  };

  const handleLoginSuccess = (userData: User, role: string) => {
    // Update state immediately
    setUser(userData);
    setUserRole(role);
    // Ensure localStorage is updated (should already be done by LoginForm, but ensure it)
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    localStorage.setItem('userRole', role);
    // Force a re-check to ensure dashboard is shown
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setUser(null);
    setUserRole(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Handle notification action (approve/reject)
  const handleNotificationAction = async (action: 'approve' | 'reject') => {
    if (!selectedNotification) return;
    
    setActionLoading(true);
    try {
      const response = await apiCall(`business/notifications/${selectedNotification.id}/action/`, {
        method: 'POST',
        body: JSON.stringify({
          action: action,
          notes: actionNotes
        })
      });
      
      if (response?.success) {
        toast({
          title: action === 'approve' ? "Payment Approved" : "Payment Rejected",
          description: response.message || `Payment has been ${action}d successfully`,
        });
        setActionDialogOpen(false);
        setSelectedNotification(null);
        setActionNotes("");
        loadNotifications();
      } else {
        toast({
          title: "Action Failed",
          description: response?.error || `Failed to ${action} payment`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to handle notification action:', error);
      toast({
        title: "Action Failed",
        description: `Failed to ${action} payment. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle redirect for unauthenticated customer dashboard access
  useEffect(() => {
    if (!isLoading && !user && !userRole && location.pathname === '/customer-dashboard') {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, userRole, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !userRole) {
    // If user is not logged in and trying to access customer dashboard, show loading while redirecting
    if (location.pathname === '/customer-dashboard') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    // For business dashboards, show the LoginForm
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu">
                  <MenuIcon className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="space-y-2 mt-6">
                  {/* Business sidebar menu - Manage Account is under avatar dropdown */}
                  {/* Show Business Settings for business owners and admins */}
                  {(userRole === 'business_owner' || userRole === 'business_admin' || userRole === 'admin') && (
                    <Button variant="ghost" className="w-full justify-start" onClick={()=> navigate('/business/settings')}>
                      <Building2 className="w-4 h-4 mr-2" /> Business Settings
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Center: title */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm shadow-lg overflow-hidden relative">
                  {!logoError ? (
                    <img 
                      src="/light-mode-logo.jpg" 
                      alt={`${appTitle} Logo`} 
                      className="w-full h-full object-contain p-1"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary-foreground" />
                  )}
                </div>
                <h1 className="text-xl font-bold text-card-foreground">{appTitle}</h1>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2">
              {/* Notifications Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-auto p-1"
                      onClick={async () => {
                        try {
                          await apiCall('business/notifications/mark-all-read/', { method: 'POST' });
                          loadNotifications();
                        } catch (error) {
                          console.error('Failed to mark all as read:', error);
                        }
                      }}
                    >
                      Mark all read
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={`flex flex-col items-start py-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 ${!notification.is_read ? 'bg-purple-50 hover:bg-purple-100 focus:bg-purple-100' : ''}`}
                          onClick={async () => {
                            try {
                              // Check if notification requires action and action hasn't been taken
                              if (notification.requires_action && !notification.action_taken) {
                                setSelectedNotification(notification);
                                setActionDialogOpen(true);
                              } else {
                                await apiCall(`business/notifications/${notification.id}/read/`, { method: 'POST' });
                                loadNotifications();
                              }
                            } catch (error) {
                              console.error('Failed to handle notification:', error);
                            }
                          }}
                        >
                          <div className="flex items-start w-full gap-2">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{notification.title}</span>
                              <span className="text-xs text-gray-600 block">{notification.message}</span>
                            </div>
                            {notification.requires_action && !notification.action_taken && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Action needed
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="justify-center text-purple-600 cursor-pointer"
                    onClick={() => navigate('/manage-account?view=notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={businessLogo || user?.profile_image || undefined} 
                        alt={user?.first_name || user?.email || 'User'}
                        onError={(e) => {
                          console.log('Avatar image failed to load:', businessLogo || user?.profile_image);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="text-xs font-semibold bg-purple-100 text-purple-700">
                        {(user?.first_name || user?.email || '?').toString().slice(0,1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.first_name} {user?.last_name}</span>
                      <span className="text-xs font-normal text-gray-500">{userRole?.replace('_', ' ')}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userRole === 'business_owner' || userRole === 'business_admin' || userRole === 'admin' ? (
                    // Business Owner/Admin menu - changes based on view mode
                    <>
                      <DropdownMenuGroup>
                        {isAgroProduction ? (
                          <>
                            <DropdownMenuItem onClick={() => navigate('/agro-dashboard')}>
                              <Briefcase className="w-4 h-4 mr-2" /> Agro Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/agro/expenses')}>
                              <DollarSign className="w-4 h-4 mr-2" /> Farm Input Costs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/agro/sales')}>
                              <ShoppingCart className="w-4 h-4 mr-2" /> Harvest Sales
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/agro/produce')}>
                              <Package className="w-4 h-4 mr-2" /> Produce Management
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/agro/inputs')}>
                              <BarChart3 className="w-4 h-4 mr-2" /> Inputs & Equipment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/agro/suppliers')}>
                              <FileText className="w-4 h-4 mr-2" /> Agro Suppliers
                            </DropdownMenuItem>
                          </>
                        ) : dashboardViewMode === 'product' ? (
                          // Product-based business menu
                          <>
                            <DropdownMenuItem onClick={() => navigate('/pos')}>
                              <ShoppingCart className="w-4 h-4 mr-2" /> Manage Sales
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/shipping-management')}>
                              <Package className="w-4 h-4 mr-2" /> Shipping Management
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { navigate('/business-admin-dashboard'); setTimeout(() => { const creditSection = document.querySelector('[data-credit-section]'); if (creditSection) { creditSection.scrollIntoView({ behavior: 'smooth' }); const button = creditSection.querySelector('button'); if (button) button.click(); } }, 100); }}>
                              <CreditCard className="w-4 h-4 mr-2" /> Manage Credit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/staff')}>
                              <Users className="w-4 h-4 mr-2" /> Manage Staffs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/suppliers')}>
                              <Truck className="w-4 h-4 mr-2" /> Manage Suppliers
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/reports')}>
                              <DollarSign className="w-4 h-4 mr-2" /> Manage Revenue
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/expenses')}>
                              <BarChart3 className="w-4 h-4 mr-2" /> Expense Tracker
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/customers')}>
                              <Users className="w-4 h-4 mr-2" /> Manage Customer
                            </DropdownMenuItem>
                          </>
                        ) : (
                          // Service-based business menu
                          <>
                            <DropdownMenuItem onClick={() => navigate('/business/invoices')}>
                              <FileText className="w-4 h-4 mr-2" /> Manage Invoices
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/clients')}>
                              <UserPlus className="w-4 h-4 mr-2" /> Manage Clients
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/services')}>
                              <Briefcase className="w-4 h-4 mr-2" /> Manage Services
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/shipping-management')}>
                              <Package className="w-4 h-4 mr-2" /> Shipping Management
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/bookings')}>
                              <Calendar className="w-4 h-4 mr-2" /> Bookings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/staff')}>
                              <Users className="w-4 h-4 mr-2" /> Manage Staffs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/reports/revenue')}>
                              <DollarSign className="w-4 h-4 mr-2" /> Manage Revenue
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/service-expenses')}>
                              <BarChart3 className="w-4 h-4 mr-2" /> Expense Tracker
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/business/analytics')}>
                              <PieChart className="w-4 h-4 mr-2" /> Analytics
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuGroup>
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
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=upgrade')}>
                                <Zap className="w-4 h-4 mr-2 text-amber-500" />
                                <span>Upgrade</span>
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
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : userRole === 'business_staff' || userRole === 'staff' ? (
                    // Business Staff menu
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => navigate('/staff-attendance')}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Clock In/Out
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/staff-attendance')}>
                          <DollarSign className="w-4 h-4 mr-2" /> Salary
                        </DropdownMenuItem>
                        {staffPermissions?.can_manage_sales && (
                          <DropdownMenuItem onClick={() => navigate(isAgroProduction ? '/agro/sales' : '/pos')}>
                            <ShoppingCart className="w-4 h-4 mr-2" /> {isAgroProduction ? 'Agri Sales' : 'Point of Sale'}
                          </DropdownMenuItem>
                        )}
                        {staffPermissions?.can_manage_sales && (
                          <DropdownMenuItem onClick={() => navigate(isAgroProduction ? '/agro/produce' : '/business/sales')}>
                            <FileText className="w-4 h-4 mr-2" /> {isAgroProduction ? 'Produce' : 'Sales'}
                          </DropdownMenuItem>
                        )}
                        {staffPermissions?.can_view_reports && (
                          <DropdownMenuItem onClick={() => navigate('/business/reports')}>
                            <BarChart3 className="w-4 h-4 mr-2" /> Reports
                          </DropdownMenuItem>
                        )}
                        {staffPermissions?.can_manage_staff && (
                          <DropdownMenuItem onClick={() => navigate('/business/staff')}>
                            <Users className="w-4 h-4 mr-2" /> Manage Staffs
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : userRole === 'customer' ? (
                    // Customer menu
                    <>
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
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=profile')}>
                                <User className="w-4 h-4 mr-2" />
                                <span>Profile</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=security')}>
                                <Shield className="w-4 h-4 mr-2" />
                                <span>Security & Privacy</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=theme')}>
                                <Palette className="w-4 h-4 mr-2" />
                                <span>Theme</span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    // Default menu for any other role
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Settings className="w-4 h-4 mr-2" />
                            <span>Manage Account</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=profile')}>
                                <User className="w-4 h-4 mr-2" />
                                <span>Profile</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=security')}>
                                <Shield className="w-4 h-4 mr-2" />
                                <span>Security & Privacy</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/manage-account?view=theme')}>
                                <Palette className="w-4 h-4 mr-2" />
                                <span>Theme</span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<DashboardLoader />}>
          {userRole === 'business_owner' || userRole === 'business_admin' || userRole === 'admin' || userRole === 'business_staff' || userRole === 'staff' ? (
            isAgroProduction ? <AgroProductionDashboard /> : <BusinessAdminDashboard />
          ) : userRole === 'customer' ? (
            <CustomerDashboard />
          ) : (
            // Fallback: if role is unknown, show helpful error message
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Access Restricted</h2>
                <p className="text-muted-foreground">
                  {userRole && userRole !== 'null' && userRole !== 'undefined' ? (
                    <>
                      Your current role: <strong>{userRole}</strong> is not recognized.
                      <br />Please contact support if you believe this is an error.
                    </>
                  ) : (
                    <>
                      No valid role detected. Please log in using the appropriate login page.
                    </>
                  )}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleLogout} variant="outline">Clear Session</Button>
                  <Button onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}>Go to Login</Button>
                </div>
              </div>
            </div>
          )}
        </Suspense>
      </main>

      {/* Payment Approval Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setActionDialogOpen(false);
          setSelectedNotification(null);
          setActionNotes("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedNotification?.action_type === 'approve_payment' ? 'Approve Payment' : 'Action Required'}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification?.message}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {selectedNotification?.action_data?.customer_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedNotification.action_data.customer_name}</span>
                </div>
              )}
              {selectedNotification?.action_data?.sale_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order #:</span>
                  <span className="font-medium">{selectedNotification.action_data.sale_number}</span>
                </div>
              )}
              {selectedNotification?.action_data?.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-green-600">₦{selectedNotification.action_data.amount?.toLocaleString()}</span>
                </div>
              )}
              {selectedNotification?.action_data?.payment_reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium font-mono text-xs">{selectedNotification.action_data.payment_reference}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedNotification?.created_at ? new Date(selectedNotification.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes for this action..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleNotificationAction('reject')}
              disabled={actionLoading}
              className="flex-1"
            >
              {actionLoading ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={() => handleNotificationAction('approve')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Popup Notifications for Goals & Tax Reminders */}
      {(userRole === 'business_owner' || userRole === 'business_admin' || userRole === 'admin') && (
        <NotificationPopup />
      )}
    </div>
  );
};

export default DashboardLayout;
