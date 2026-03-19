import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPut, apiDelete, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, DollarSign, CreditCard, Users, TrendingUp, Search, 
  Filter, MoreVertical, CheckCircle, XCircle, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Calendar, Wallet, ShoppingCart,
  BarChart3, Eye, Settings, LogOut, ChevronRight, ChevronDown, ChevronUp, Activity, Menu, X, Plus, Truck, UserCog, Bell, Key, Briefcase, AlertTriangle, Sparkles, Shield, Sun, Moon, Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminDeliveryManagement from './AdminDeliveryManagement';
import AdminStaffManagement from './AdminStaffManagement';
import AdminProfessionalServices from './AdminProfessionalServices';
import AdminCustomerErrors from './AdminCustomerErrors';
import SecurityCentre from './SecurityCentre';

type AdminView = 'dashboard' | 'businesses' | 'subscriptions' | 'payments' | 'wallets' | 'analytics' | 'delivery' | 'staff' | 'pro-services' | 'customer-errors' | 'ai-credits' | 'settings' | 'security';


interface PlatformSettings {
  bank_name: string;
  account_number: string;
  account_name: string;
  flutterwave_public_key: string;
  flutterwave_secret_key: string;
  flutterwave_is_live: boolean;
  platform_fee_per_transaction: number;
  suspension_threshold: number;
}

interface Business {
  id: number;
  name: string;
  owner_email: string;
  owner_name: string;
  slug: string;
  subscription_status: string;
  subscription_plan: string;
  total_revenue: number;
  total_sales: number;
  created_at: string;
  is_active: boolean;
  wallet_balance: number;
}

interface DashboardStats {
  total_businesses: number;
  active_businesses: number;
  total_revenue: number;
  revenue_today: number;
  revenue_this_month: number;
  total_subscriptions: number;
  active_subscriptions: number;
  pending_payouts: number;
  total_wallet_balance: number;
}

interface WalletInfo {
  id: number | string;
  business_name: string;
  business_id: number | null;
  balance: number;
  total_revenue?: number;
  total_withdrawn?: number;
  owner_email: string;
  is_active: boolean;
  is_platform_wallet?: boolean;
}

export default function BusinessPlatformAdmin() {
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [view, setView] = useState<AdminView>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Wallet credit dialog
  const [walletCreditDialog, setWalletCreditDialog] = useState(false);
  const [selectedWalletBusiness, setSelectedWalletBusiness] = useState<Business | WalletInfo | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  
  // Subscription management dialog
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [selectedSubBusiness, setSelectedSubBusiness] = useState<Business | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState('30');
  const [isSubLoading, setIsSubLoading] = useState(false);
  
  // Pending bank transfers for approval
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [verifyingTransferId, setVerifyingTransferId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  // Admin notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved ? saved === 'dark' : false; // Default to light
  });

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('admin_theme', newMode ? 'dark' : 'light');
    
    // Apply theme to document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // AI Credits management
  const [aiCreditsPurchases, setAiCreditsPurchases] = useState<any[]>([]);
  const [aiCreditsStats, setAiCreditsStats] = useState<any>(null);
  const [aiCreditsSearch, setAiCreditsSearch] = useState('');
  const [aiCreditsStatusFilter, setAiCreditsStatusFilter] = useState('all');
  const [addCreditsDialog, setAddCreditsDialog] = useState(false);
  const [selectedBusinessForCredits, setSelectedBusinessForCredits] = useState<any>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [businessSearchResults, setBusinessSearchResults] = useState<any[]>([]);
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    bank_name: '',
    account_number: '',
    account_name: '',
    flutterwave_public_key: '',
    flutterwave_secret_key: '',
    flutterwave_is_live: false,
    platform_fee_per_transaction: 50,
    suspension_threshold: 20
  });
  
  // Collapsible sections for settings
  const [bankAccountOpen, setBankAccountOpen] = useState(true);
  const [flutterwaveOpen, setFlutterwaveOpen] = useState(true);
  const [feeSettingsOpen, setFeeSettingsOpen] = useState(true);
  
  // Analytics tab state within Analytics view
  const [analyticsTab, setAnalyticsTab] = useState<'metrics' | 'settings'>('metrics');
  
  // Platform analytics settings
  const [platformAnalytics, setPlatformAnalytics] = useState({
    google_analytics_id: '',
    google_analytics_enabled: false,
    gtm_container_id: '',
    gtm_enabled: false,
    facebook_pixel_id: '',
    facebook_pixel_enabled: false,
    facebook_conversions_api_token: '',
    tiktok_pixel_id: '',
    tiktok_pixel_enabled: false,
    custom_head_scripts: '',
    custom_body_scripts: ''
  });
  const [isSavingAnalytics, setIsSavingAnalytics] = useState(false);
  
  // Wallet search
  const [walletSearchQuery, setWalletSearchQuery] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Collapsible sections for wallet view
  const [pendingVerificationOpen, setPendingVerificationOpen] = useState(true);
  const [allBusinessesOpen, setAllBusinessesOpen] = useState(true);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profileData = await apiGet('profile/') as any;
        if (profileData) {
          const isStaff = profileData.is_staff === true || profileData.is_staff === 'true';
          const isSuperuser = profileData.is_superuser === true || profileData.is_superuser === 'true';
          setIsAuthorized(isStaff || isSuperuser);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  // Load dashboard stats
  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/business-platform/stats/') as any;
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e: any) {
      toast({ title: 'Failed to load stats', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load all businesses
  const loadBusinesses = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/business-platform/businesses/') as any;
      setBusinesses(data.businesses || []);
    } catch (e: any) {
      toast({ title: 'Failed to load businesses', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load subscriptions
  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/business-platform/subscriptions/') as any;
      setSubscriptions(data.subscriptions || []);
    } catch (e: any) {
      toast({ title: 'Failed to load subscriptions', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load payments
  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/business-platform/payments/') as any;
      setPayments(data.payments || []);
    } catch (e: any) {
      toast({ title: 'Failed to load payments', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load wallets
  const loadWallets = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/business-platform/wallets/') as any;
      setWallets(data.wallets || []);
    } catch (e: any) {
      toast({ title: 'Failed to load wallets', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending bank transfers for approval
  const loadPendingTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const data = await apiGet('admin/business-platform/pending-transfers/') as any;
      setPendingTransfers(data.transfers || []);
      setPendingTransfersCount(data.transfers?.length || 0);
    } catch (e: any) {
      console.error('Failed to load pending transfers:', e);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  // Load AI Credits purchases and stats
  const loadAiCreditsPurchases = async () => {
    setIsLoading(true);
    try {
      const [purchasesRes, statsRes] = await Promise.all([
        apiGet('ai-credits/admin/purchases/') as any,
        apiGet('ai-credits/admin/stats/') as any
      ]);
      setAiCreditsPurchases(purchasesRes.purchases || []);
      setAiCreditsStats(statsRes.stats || null);
    } catch (e: any) {
      console.error('Failed to load AI credits:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Search businesses for AI Credits
  const searchBusinessesForCredits = async (query: string) => {
    if (!query || query.length < 2) {
      setBusinessSearchResults([]);
      return;
    }
    try {
      const data = await apiGet(`admin/business-platform/businesses/?search=${encodeURIComponent(query)}`) as any;
      setBusinessSearchResults(data.businesses || []);
    } catch (e: any) {
      console.error('Failed to search businesses:', e);
    }
  };

  // Add credits to business
  const handleAddCredits = async () => {
    if (!selectedBusinessForCredits || !creditsToAdd) {
      toast({ title: 'Error', description: 'Please select a business and enter credits amount', variant: 'destructive' });
      return;
    }
    setIsAddingCredits(true);
    try {
      await apiPost('ai-credits/admin/add-to-business/', {
        business_id: selectedBusinessForCredits.id,
        credits: parseInt(creditsToAdd),
        reason: creditsReason || 'Admin credit addition'
      });
      toast({ title: 'Success', description: `Added ${creditsToAdd} credits to ${selectedBusinessForCredits.name}` });
      setAddCreditsDialog(false);
      setSelectedBusinessForCredits(null);
      setCreditsToAdd('');
      setCreditsReason('');
      setBusinessSearchQuery('');
      setBusinessSearchResults([]);
      loadAiCreditsPurchases();
    } catch (e: any) {
      toast({ title: 'Failed to add credits', description: e?.message, variant: 'destructive' });
    } finally {
      setIsAddingCredits(false);
    }
  };

  // Approve AI credit purchase
  const handleApproveAiPurchase = async (purchaseId: number) => {
    try {
      await apiPost(`ai-credits/admin/approve/${purchaseId}/`, {});
      toast({ title: 'Success', description: 'Purchase approved and credits added' });
      loadAiCreditsPurchases();
    } catch (e: any) {
      toast({ title: 'Failed to approve purchase', description: e?.message, variant: 'destructive' });
    }
  };

  // Reject AI credit purchase
  const handleRejectAiPurchase = async (purchaseId: number) => {
    try {
      await apiPost(`ai-credits/admin/reject/${purchaseId}/`, { reason: 'Rejected by admin' });
      toast({ title: 'Purchase Rejected', description: 'User will be notified' });
      loadAiCreditsPurchases();
    } catch (e: any) {
      toast({ title: 'Failed to reject purchase', description: e?.message, variant: 'destructive' });
    }
  };

  // Load admin notifications
  const loadNotifications = async () => {
    try {
      const data = await apiGet('admin/business-platform/notifications/') as any;
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotificationCount(data.unread_count || 0);
      }
    } catch (e: any) {
      console.error('Failed to load notifications:', e);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: number) => {
    try {
      await apiPost(`admin/business-platform/notifications/${notificationId}/read/`, {});
      loadNotifications();
    } catch (e: any) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await apiPost('admin/business-platform/notifications/mark-all-read/', {});
      loadNotifications();
      toast({ title: 'Success', description: 'All notifications marked as read' });
    } catch (e: any) {
      toast({ title: 'Error', description: 'Failed to mark notifications as read', variant: 'destructive' });
    }
  };

  // Load platform settings
  const loadPlatformSettings = async () => {
    try {
      const data = await apiGet('admin/business-platform/settings/') as any;
      if (data) {
        setPlatformSettings({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
          flutterwave_public_key: data.flutterwave_public_key || '',
          flutterwave_secret_key: data.flutterwave_secret_key || '',
          flutterwave_is_live: data.flutterwave_is_live || false,
          platform_fee_per_transaction: data.platform_fee_per_transaction || 50,
          suspension_threshold: data.suspension_threshold || 20
        });
      }
    } catch (e: any) {
      console.error('Failed to load platform settings:', e);
    }
  };

  // Save platform settings
  const savePlatformSettings = async () => {
    setIsSavingSettings(true);
    try {
      await apiPost('admin/business-platform/settings/', platformSettings);
      toast({ title: 'Success', description: 'Platform settings saved successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Load platform analytics settings
  const loadPlatformAnalytics = async () => {
    try {
      const data = await apiGet('admin/business-platform/analytics/') as any;
      if (data) {
        setPlatformAnalytics({
          google_analytics_id: data.google_analytics_id || '',
          google_analytics_enabled: data.google_analytics_enabled || false,
          gtm_container_id: data.gtm_container_id || '',
          gtm_enabled: data.gtm_enabled || false,
          facebook_pixel_id: data.facebook_pixel_id || '',
          facebook_pixel_enabled: data.facebook_pixel_enabled || false,
          facebook_conversions_api_token: data.facebook_conversions_api_token || '',
          tiktok_pixel_id: data.tiktok_pixel_id || '',
          tiktok_pixel_enabled: data.tiktok_pixel_enabled || false,
          custom_head_scripts: data.custom_head_scripts || '',
          custom_body_scripts: data.custom_body_scripts || ''
        });
      }
    } catch (e: any) {
      console.error('Failed to load platform analytics:', e);
    }
  };

  // Save platform analytics settings
  const savePlatformAnalytics = async () => {
    setIsSavingAnalytics(true);
    try {
      await apiPost('admin/business-platform/analytics/', platformAnalytics);
      toast({ title: 'Success', description: 'Analytics settings saved successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save analytics settings', variant: 'destructive' });
    } finally {
      setIsSavingAnalytics(false);
    }
  };

  // Approve bank transfer
  const handleApproveTransfer = async (transactionId: number) => {
    setVerifyingTransferId(transactionId);
    try {
      await apiPost('admin/business-platform/verify-transfer/', {
        transaction_id: transactionId,
        approved: true
      });
      toast({ title: 'Success', description: 'Transfer approved and wallet credited' });
      loadPendingTransfers();
      loadWallets();
    } catch (e: any) {
      toast({ title: 'Failed to approve transfer', description: e?.message, variant: 'destructive' });
    } finally {
      setVerifyingTransferId(null);
    }
  };

  // Reject bank transfer
  const handleRejectTransfer = async () => {
    if (!selectedTransfer) return;
    setVerifyingTransferId(selectedTransfer.id);
    try {
      await apiPost('admin/business-platform/verify-transfer/', {
        transaction_id: selectedTransfer.id,
        approved: false,
        rejection_reason: rejectReason || 'Transfer rejected by admin'
      });
      toast({ title: 'Transfer Rejected', description: 'Business owner will be notified' });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedTransfer(null);
      loadPendingTransfers();
    } catch (e: any) {
      toast({ title: 'Failed to reject transfer', description: e?.message, variant: 'destructive' });
    } finally {
      setVerifyingTransferId(null);
    }
  };

  // Credit wallet
  const handleCreditWallet = async () => {
    if (!selectedWalletBusiness || !creditAmount) {
      toast({ title: 'Error', description: 'Please enter amount', variant: 'destructive' });
      return;
    }
    setIsCreditLoading(true);
    try {
      const businessId = 'business_id' in selectedWalletBusiness ? selectedWalletBusiness.business_id : selectedWalletBusiness.id;
      await apiPost('admin/business-platform/wallets/credit/', {
        business_id: businessId,
        amount: parseFloat(creditAmount),
        description: creditDescription || 'Admin cash deposit'
      });
      toast({ title: 'Success', description: 'Wallet credited successfully' });
      setWalletCreditDialog(false);
      setCreditAmount('');
      setCreditDescription('');
      setSelectedWalletBusiness(null);
      loadWallets();
      loadDashboardStats();
    } catch (e: any) {
      toast({ title: 'Failed to credit wallet', description: e?.message, variant: 'destructive' });
    } finally {
      setIsCreditLoading(false);
    }
  };

  // Manage subscription
  const handleUpdateSubscription = async () => {
    if (!selectedSubBusiness || !newPlan) {
      toast({ title: 'Error', description: 'Please select a plan', variant: 'destructive' });
      return;
    }
    setIsSubLoading(true);
    try {
      await apiPost('admin/business-platform/subscriptions/update/', {
        business_id: selectedSubBusiness.id,
        plan: newPlan,
        days: parseInt(subscriptionDays)
      });
      toast({ title: 'Success', description: 'Subscription updated successfully' });
      setSubscriptionDialog(false);
      setNewPlan('');
      setSubscriptionDays('30');
      setSelectedSubBusiness(null);
      loadSubscriptions();
      loadBusinesses();
    } catch (e: any) {
      toast({ title: 'Failed to update subscription', description: e?.message, variant: 'destructive' });
    } finally {
      setIsSubLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = '/admin-login';
  };

  // Toggle business status
  const toggleBusinessStatus = async (businessId: number, newStatus: boolean) => {
    try {
      await apiPut(`admin/business-platform/businesses/${businessId}/`, { is_active: newStatus });
      toast({ title: `Business ${newStatus ? 'activated' : 'deactivated'}` });
      loadBusinesses();
    } catch (e: any) {
      toast({ title: 'Failed to update business', description: e?.message, variant: 'destructive' });
    }
  };

  // Delete business (and owner account by default)
  const handleDeleteBusiness = async (business: Business) => {
    const confirmed = window.confirm(
      `Delete ${business.name}? This will permanently remove the business account from the platform.`
    );

    if (!confirmed) return;

    try {
      await apiDelete(`admin/business-platform/businesses/${business.id}/?delete_owner=false`);
      toast({ title: 'Business deleted', description: `${business.name} has been removed.` });
      if (selectedBusiness?.id === business.id) {
        setSelectedBusiness(null);
      }
      loadBusinesses();
      loadDashboardStats();
    } catch (e: any) {
      toast({ title: 'Failed to delete business', description: e?.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadPendingTransfers(); // Load pending transfers for notification badge
    loadNotifications(); // Load admin notifications
    
    // Refresh notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      loadNotifications();
      loadPendingTransfers();
    }, 30000);
    
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    if (view === 'businesses') loadBusinesses();
    else if (view === 'subscriptions') loadSubscriptions();
    else if (view === 'payments') loadPayments();
    else if (view === 'wallets') {
      loadWallets();
      loadPendingTransfers();
    }
    else if (view === 'settings') loadPlatformSettings();
    else if (view === 'analytics') loadPlatformAnalytics();
    else if (view === 'ai-credits') loadAiCreditsPurchases();
  }, [view]);

  // Filter businesses
  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owner_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && b.is_active) ||
      (statusFilter === 'inactive' && !b.is_active);
    return matchesSearch && matchesStatus;
  });

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp }: any) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {trend}
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'wallets', label: 'Wallets', icon: Wallet, badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'staff', label: 'Staff', icon: UserCog },
    { id: 'security', label: 'Security Centre', icon: Shield },
    { id: 'pro-services', label: 'Pro Services', icon: Briefcase },
    { id: 'customer-errors', label: 'Customer Errors', icon: AlertTriangle },
    { id: 'ai-credits', label: 'AI Credits', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Business Admin
        </h1>
      </div>
      
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id as AdminView);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              view === item.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {item.badge && (
              <Badge variant="destructive" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t space-y-2 flex-shrink-0">
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <ChevronRight className="w-5 h-5" />
          Back to Dashboard
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="font-bold">Business Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          {/* Notification Bell with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {(pendingTransfersCount + unreadNotificationCount) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingTransfersCount + unreadNotificationCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Notifications</h4>
                {unreadNotificationCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-64">
                {/* Pending Transfers Alert */}
                {pendingTransfersCount > 0 && (
                  <div 
                    className="p-3 border-b bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    onClick={() => setView('wallets')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pending Transfers</p>
                        <p className="text-xs text-muted-foreground">{pendingTransfersCount} bank transfer(s) awaiting approval</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.data?.action_url) {
                          window.location.href = notif.data.action_url;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${notif.type === 'billing' ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                          {notif.type === 'billing' ? <DollarSign className="w-4 h-4 text-green-600" /> : <Bell className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
                      </div>
                    </div>
                  ))
                ) : pendingTransfersCount === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : null}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
          </SheetContent>
        </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r flex-col">
        <SidebarContent />
      </aside>
      
      {/* Desktop Top Bar with Notification */}
      <div className="hidden lg:flex fixed top-0 left-64 right-0 z-30 bg-card border-b px-6 py-3 items-center justify-end">
        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="mr-2"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {(pendingTransfersCount + unreadNotificationCount) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {pendingTransfersCount + unreadNotificationCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              {unreadNotificationCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {/* Pending Transfers Alert */}
              {pendingTransfersCount > 0 && (
                <div 
                  className="p-4 border-b bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  onClick={() => setView('wallets')}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pending Bank Transfers</p>
                      <p className="text-sm text-muted-foreground">{pendingTransfersCount} transfer(s) awaiting verification</p>
                      <Button variant="link" size="sm" className="h-auto p-0 mt-1">View transfers →</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {notifications.length > 0 ? (
                notifications.slice(0, 15).map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (notif.data?.action_url) {
                        setView('wallets');
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${notif.type === 'billing' ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                        {notif.type === 'billing' ? <DollarSign className="w-4 h-4 text-green-600" /> : <Bell className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
                    </div>
                  </div>
                ))
              ) : pendingTransfersCount === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : null}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-20 p-4 lg:p-8">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Platform Overview</h2>
                <p className="text-muted-foreground">Monitor and manage all businesses</p>
              </div>
              <Button onClick={loadDashboardStats} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Stats Grid */}
            {isLoading && !stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Businesses"
                    value={stats.total_businesses}
                    subtitle={`${stats.active_businesses} active`}
                    icon={Building2}
                  />
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.total_revenue)}
                    subtitle="All time"
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                  />
                  <StatCard
                    title="Revenue Today"
                    value={formatCurrency(stats.revenue_today)}
                    icon={TrendingUp}
                    trend="+8.2%"
                    trendUp={true}
                  />
                  <StatCard
                    title="Monthly Revenue"
                    value={formatCurrency(stats.revenue_this_month)}
                    icon={Calendar}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Active Subscriptions"
                    value={stats.active_subscriptions}
                    subtitle={`of ${stats.total_subscriptions} total`}
                    icon={CreditCard}
                  />
                  <StatCard
                    title="Pending Payouts"
                    value={formatCurrency(stats.pending_payouts)}
                    icon={Clock}
                  />
                  <StatCard
                    title="Total Wallet Balance"
                    value={formatCurrency(stats.total_wallet_balance)}
                    icon={Wallet}
                  />
                </div>
              </>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setView('businesses')}
                  >
                    <Building2 className="w-6 h-6" />
                    <span>View Businesses</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setView('subscriptions')}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Manage Subscriptions</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setView('payments')}
                  >
                    <DollarSign className="w-6 h-6" />
                    <span>View Payments</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setView('analytics')}
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Businesses View */}
        {view === 'businesses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Businesses</h2>
                <p className="text-muted-foreground">Manage all registered businesses</p>
              </div>
              <Button onClick={loadBusinesses} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Businesses Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Business</th>
                        <th className="text-left p-4 font-medium">Owner</th>
                        <th className="text-left p-4 font-medium">Subscription</th>
                        <th className="text-right p-4 font-medium">Revenue</th>
                        <th className="text-center p-4 font-medium">Status</th>
                        <th className="text-center p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isLoading ? (
                        [1, 2, 3].map(i => (
                          <tr key={i}>
                            <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                            <td className="p-4"><Skeleton className="h-8 w-8 mx-auto" /></td>
                          </tr>
                        ))
                      ) : filteredBusinesses.length > 0 ? (
                        filteredBusinesses.map((business) => (
                          <tr key={business.id} className="hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{business.name}</p>
                                  <p className="text-xs text-muted-foreground">{business.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm">{business.owner_name}</p>
                              <p className="text-xs text-muted-foreground">{business.owner_email}</p>
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                business.subscription_status === 'active' ? 'default' : 'secondary'
                              }>
                                {business.subscription_plan || 'Free'}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-medium">{formatCurrency(business.total_revenue)}</p>
                              <p className="text-xs text-muted-foreground">{business.total_sales} sales</p>
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant={business.is_active ? 'default' : 'destructive'}>
                                {business.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedBusiness(business)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleBusinessStatus(business.id, !business.is_active)}
                                  >
                                    {business.is_active ? (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedSubBusiness(business);
                                    setSubscriptionDialog(true);
                                  }}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Manage Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedWalletBusiness(business);
                                    setWalletCreditDialog(true);
                                  }}>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Credit Wallet
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteBusiness(business)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No businesses found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscriptions View */}
        {view === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Subscriptions</h2>
                <p className="text-muted-foreground">Monitor business subscriptions</p>
              </div>
              <Button onClick={loadSubscriptions} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Business</th>
                        <th className="text-left p-4 font-medium">Plan</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Start Date</th>
                        <th className="text-left p-4 font-medium">End Date</th>
                        <th className="text-center p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isLoading ? (
                        [1, 2, 3].map(i => (
                          <tr key={i}>
                            <td className="p-4" colSpan={6}><Skeleton className="h-4 w-full" /></td>
                          </tr>
                        ))
                      ) : subscriptions.length > 0 ? (
                        subscriptions.map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-muted/30">
                            <td className="p-4">{sub.business_name}</td>
                            <td className="p-4">
                              <Badge>{sub.plan_name}</Badge>
                            </td>
                            <td className="p-4">{formatCurrency(sub.amount)}</td>
                            <td className="p-4">{new Date(sub.start_date).toLocaleDateString()}</td>
                            <td className="p-4">{new Date(sub.end_date).toLocaleDateString()}</td>
                            <td className="p-4 text-center">
                              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                {sub.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No subscriptions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments View */}
        {view === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Payments</h2>
                <p className="text-muted-foreground">View all payment transactions</p>
              </div>
              <Button onClick={loadPayments} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Reference</th>
                        <th className="text-left p-4 font-medium">Business</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-center p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isLoading ? (
                        [1, 2, 3].map(i => (
                          <tr key={i}>
                            <td className="p-4" colSpan={6}><Skeleton className="h-4 w-full" /></td>
                          </tr>
                        ))
                      ) : payments.length > 0 ? (
                        payments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-muted/30">
                            <td className="p-4 font-mono text-sm">{payment.reference}</td>
                            <td className="p-4">{payment.business_name}</td>
                            <td className="p-4">{formatCurrency(payment.amount)}</td>
                            <td className="p-4">
                              <Badge variant="outline">{payment.type}</Badge>
                            </td>
                            <td className="p-4">{new Date(payment.created_at).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <Badge variant={
                                payment.status === 'completed' ? 'default' : 
                                payment.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No payments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wallets View */}
        {view === 'wallets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Wallets</h2>
                <p className="text-muted-foreground">Manage business wallet balances</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { loadWallets(); loadPendingTransfers(); }} variant="outline" size="sm">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isLoadingTransfers ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => {
                  setSelectedWalletBusiness(null);
                  setCreditAmount('');
                  setCreditDescription('');
                  setWalletCreditDialog(true);
                }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Credit Wallet
                </Button>
              </div>
            </div>

            {/* Search Bar for Wallets */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search business wallets by name or email..."
                value={walletSearchQuery}
                onChange={(e) => setWalletSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Pending Bank Transfers for Approval - ALWAYS SHOW */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader 
                className="bg-orange-50 dark:bg-orange-900/20 cursor-pointer"
                onClick={() => setPendingVerificationOpen(!pendingVerificationOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Pending Verification
                    {pendingTransfers.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                        {pendingTransfers.length} awaiting approval
                      </Badge>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {pendingVerificationOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>Review and approve bank transfer deposits from businesses</CardDescription>
              </CardHeader>
              {pendingVerificationOpen && (
              <CardContent className="p-0">
                {isLoadingTransfers ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading pending transfers...</p>
                  </div>
                ) : pendingTransfers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Business</th>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Amount</th>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Reference</th>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Date</th>
                          <th className="text-center p-4 font-medium whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pendingTransfers.map((transfer) => (
                          <tr key={transfer.id} className="hover:bg-muted/30">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{transfer.business_name}</p>
                                <p className="text-xs text-muted-foreground">{transfer.owner_email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-green-600">{formatCurrency(parseFloat(transfer.amount))}</td>
                            <td className="p-4 font-mono text-sm">{transfer.reference || transfer.bank_transfer_reference || 'N/A'}</td>
                            <td className="p-4 text-sm">{transfer.created_at ? new Date(transfer.created_at).toLocaleString() : 'N/A'}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveTransfer(transfer.id)}
                                  disabled={verifyingTransferId === transfer.id}
                                >
                                  {verifyingTransferId === transfer.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedTransfer(transfer);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={verifyingTransferId === transfer.id}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No pending transfers</p>
                    <p className="text-sm text-muted-foreground mt-1">All bank transfer deposits have been processed</p>
                  </div>
                )}
              </CardContent>
              )}
            </Card>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Business</th>
                          <th className="text-left p-4 font-medium whitespace-nowrap">Owner</th>
                          <th className="text-right p-4 font-medium whitespace-nowrap">Balance</th>
                          <th className="text-center p-4 font-medium whitespace-nowrap">Status</th>
                          <th className="text-center p-4 font-medium whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {isLoading ? (
                          [1, 2, 3].map(i => (
                            <tr key={i}>
                              <td className="p-4" colSpan={5}><Skeleton className="h-4 w-full" /></td>
                            </tr>
                          ))
                        ) : wallets.filter(w => 
                            walletSearchQuery === '' || 
                            w.business_name.toLowerCase().includes(walletSearchQuery.toLowerCase()) ||
                            w.owner_email.toLowerCase().includes(walletSearchQuery.toLowerCase())
                          ).length > 0 ? (
                          wallets.filter(w => 
                            walletSearchQuery === '' || 
                            w.business_name.toLowerCase().includes(walletSearchQuery.toLowerCase()) ||
                            w.owner_email.toLowerCase().includes(walletSearchQuery.toLowerCase())
                          ).map((wallet) => (
                            <tr key={wallet.id} className={`hover:bg-muted/30 ${wallet.is_platform_wallet ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' : ''}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wallet.is_platform_wallet ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-primary/10'}`}>
                                    <Wallet className={`w-5 h-5 ${wallet.is_platform_wallet ? 'text-white' : 'text-primary'}`} />
                                  </div>
                                  <div>
                                    <span className={`font-medium ${wallet.is_platform_wallet ? 'text-purple-700 dark:text-purple-300' : ''}`}>
                                      {wallet.business_name}
                                    </span>
                                    {wallet.is_platform_wallet && (
                                      <div className="text-xs text-muted-foreground">
                                        Total Revenue: {formatCurrency(wallet.total_revenue || 0)} | Withdrawn: {formatCurrency(wallet.total_withdrawn || 0)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{wallet.owner_email}</td>
                              <td className={`p-4 text-right font-semibold ${wallet.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(wallet.balance)}
                              </td>
                              <td className="p-4 text-center">
                                <Badge variant={wallet.is_platform_wallet ? 'default' : wallet.is_active ? 'default' : 'secondary'} 
                                       className={wallet.is_platform_wallet ? 'bg-gradient-to-r from-purple-500 to-blue-500' : ''}>
                                  {wallet.is_platform_wallet ? 'Platform' : wallet.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                {!wallet.is_platform_wallet && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWalletBusiness(wallet);
                                      setCreditAmount('');
                                      setCreditDescription('');
                                    setWalletCreditDialog(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Credit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center">
                            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">
                              {walletSearchQuery ? 'No wallets match your search' : 'No wallets with balance found'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {walletSearchQuery ? 'Try a different search term' : 'Credit a business wallet to see it here'}
                            </p>
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* All Businesses for Wallet Credit */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setAllBusinessesOpen(!allBusinessesOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>All Businesses</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {allBusinessesOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>Select a business to credit their wallet</CardDescription>
              </CardHeader>
              {allBusinessesOpen && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.slice(0, 12).map((business) => (
                    <div 
                      key={business.id}
                      className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedWalletBusiness(business);
                        setCreditAmount('');
                        setCreditDescription('');
                        setWalletCreditDialog(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-muted-foreground">{business.owner_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(business.wallet_balance)}
                          </p>
                          <p className="text-xs text-muted-foreground">Balance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {businesses.length === 0 && (
                  <Button onClick={loadBusinesses} variant="outline" className="w-full">
                    Load Businesses
                  </Button>
                )}
              </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Analytics</h2>
                <p className="text-muted-foreground">Platform performance insights and tracking</p>
              </div>
            </div>

            {/* Analytics Tabs */}
            <Tabs value={analyticsTab} onValueChange={(v) => setAnalyticsTab(v as 'metrics' | 'settings')}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="metrics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Analytics & Ads
                </TabsTrigger>
              </TabsList>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-6 mt-6">
                <div className="flex justify-end">
                  <Button onClick={loadDashboardStats} variant="outline" size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Analytics Stats */}
                {stats && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Total Businesses"
                        value={stats.total_businesses}
                        subtitle={`${stats.active_businesses} active`}
                        icon={Building2}
                      />
                      <StatCard
                        title="Active Subscriptions"
                        value={stats.active_subscriptions}
                        subtitle={`of ${stats.total_subscriptions} total`}
                        icon={CreditCard}
                      />
                      <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats.total_revenue)}
                        subtitle="All time"
                        icon={DollarSign}
                      />
                      <StatCard
                        title="Total Wallet Balance"
                        value={formatCurrency(stats.total_wallet_balance)}
                        subtitle="Across all businesses"
                        icon={Wallet}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Today's Revenue</p>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue_today)}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">This Month</p>
                              <p className="text-2xl font-bold">{formatCurrency(stats.revenue_this_month)}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-primary" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Pending Payouts</p>
                              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_payouts)}</p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Business Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Active Rate</span>
                            <span className="font-semibold">
                              {stats.total_businesses > 0 
                                ? ((stats.active_businesses / stats.total_businesses) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${stats.total_businesses > 0 
                                  ? (stats.active_businesses / stats.total_businesses) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-muted-foreground">Subscription Rate</span>
                            <span className="font-semibold">
                              {stats.total_businesses > 0 
                                ? ((stats.active_subscriptions / stats.total_businesses) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${stats.total_businesses > 0 
                                  ? (stats.active_subscriptions / stats.total_businesses) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                              <p className="text-2xl font-bold">{stats.active_businesses}</p>
                              <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                              <p className="text-2xl font-bold">{stats.total_businesses - stats.active_businesses}</p>
                              <p className="text-xs text-muted-foreground">Inactive</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Analytics & Ads Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Analytics & Ads Configuration</CardTitle>
                    <CardDescription>
                      Configure tracking codes for platform-wide analytics. These will be injected into all public pages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Google Analytics */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-semibold">Google Analytics</Label>
                          <p className="text-sm text-muted-foreground">Track visitor behavior with GA4</p>
                        </div>
                        <Switch
                          checked={platformAnalytics.google_analytics_enabled}
                          onCheckedChange={(checked) => setPlatformAnalytics({...platformAnalytics, google_analytics_enabled: checked})}
                        />
                      </div>
                      {platformAnalytics.google_analytics_enabled && (
                        <div className="space-y-2 pt-2">
                          <Label>Measurement ID</Label>
                          <Input
                            placeholder="G-XXXXXXXXXX"
                            value={platformAnalytics.google_analytics_id}
                            onChange={(e) => setPlatformAnalytics({...platformAnalytics, google_analytics_id: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">Find this in GA4 Admin → Data Streams</p>
                        </div>
                      )}
                    </div>

                    {/* Google Tag Manager */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-semibold">Google Tag Manager</Label>
                          <p className="text-sm text-muted-foreground">Manage all tags in one place</p>
                        </div>
                        <Switch
                          checked={platformAnalytics.gtm_enabled}
                          onCheckedChange={(checked) => setPlatformAnalytics({...platformAnalytics, gtm_enabled: checked})}
                        />
                      </div>
                      {platformAnalytics.gtm_enabled && (
                        <div className="space-y-2 pt-2">
                          <Label>Container ID</Label>
                          <Input
                            placeholder="GTM-XXXXXXX"
                            value={platformAnalytics.gtm_container_id}
                            onChange={(e) => setPlatformAnalytics({...platformAnalytics, gtm_container_id: e.target.value})}
                          />
                        </div>
                      )}
                    </div>

                    {/* Facebook Pixel */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-semibold">Facebook Pixel</Label>
                          <p className="text-sm text-muted-foreground">Track conversions for Meta Ads</p>
                        </div>
                        <Switch
                          checked={platformAnalytics.facebook_pixel_enabled}
                          onCheckedChange={(checked) => setPlatformAnalytics({...platformAnalytics, facebook_pixel_enabled: checked})}
                        />
                      </div>
                      {platformAnalytics.facebook_pixel_enabled && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>Pixel ID</Label>
                            <Input
                              placeholder="Your Facebook Pixel ID"
                              value={platformAnalytics.facebook_pixel_id}
                              onChange={(e) => setPlatformAnalytics({...platformAnalytics, facebook_pixel_id: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Conversions API Token (Optional)</Label>
                            <Input
                              type="password"
                              placeholder="For server-side tracking"
                              value={platformAnalytics.facebook_conversions_api_token}
                              onChange={(e) => setPlatformAnalytics({...platformAnalytics, facebook_conversions_api_token: e.target.value})}
                            />
                            <p className="text-xs text-muted-foreground">Enhanced tracking accuracy for iOS 14.5+</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TikTok Pixel */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-semibold">TikTok Pixel</Label>
                          <p className="text-sm text-muted-foreground">Track conversions for TikTok Ads</p>
                        </div>
                        <Switch
                          checked={platformAnalytics.tiktok_pixel_enabled}
                          onCheckedChange={(checked) => setPlatformAnalytics({...platformAnalytics, tiktok_pixel_enabled: checked})}
                        />
                      </div>
                      {platformAnalytics.tiktok_pixel_enabled && (
                        <div className="space-y-2 pt-2">
                          <Label>Pixel ID</Label>
                          <Input
                            placeholder="Your TikTok Pixel ID"
                            value={platformAnalytics.tiktok_pixel_id}
                            onChange={(e) => setPlatformAnalytics({...platformAnalytics, tiktok_pixel_id: e.target.value})}
                          />
                        </div>
                      )}
                    </div>

                    {/* Custom Scripts */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Custom Scripts</Label>
                        <p className="text-sm text-muted-foreground">Add custom tracking or third-party scripts</p>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Head Scripts</Label>
                          <Textarea
                            placeholder="<!-- Scripts to inject in <head> -->"
                            value={platformAnalytics.custom_head_scripts}
                            onChange={(e) => setPlatformAnalytics({...platformAnalytics, custom_head_scripts: e.target.value})}
                            className="font-mono text-sm min-h-[100px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Body Scripts</Label>
                          <Textarea
                            placeholder="<!-- Scripts to inject at end of <body> -->"
                            value={platformAnalytics.custom_body_scripts}
                            onChange={(e) => setPlatformAnalytics({...platformAnalytics, custom_body_scripts: e.target.value})}
                            className="font-mono text-sm min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={savePlatformAnalytics} disabled={isSavingAnalytics}>
                        {isSavingAnalytics ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Analytics Settings'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Delivery View */}
        {view === 'delivery' && (
          <AdminDeliveryManagement />
        )}

        {/* Staff View */}
        {view === 'staff' && (
          <AdminStaffManagement />
        )}

        {/* Security Centre View */}
        {view === 'security' && (
          <SecurityCentre canCreateTeams={true} isSOCDashboard={false} />
        )}

        {/* Pro Services View */}
        {view === 'pro-services' && (
          <AdminProfessionalServices />
        )}

        {/* AI Credits View */}
        {view === 'ai-credits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  AI Credits Management
                </h2>
                <p className="text-muted-foreground">Manage AI credits for businesses and users</p>
              </div>
              <Dialog open={addCreditsDialog} onOpenChange={setAddCreditsDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Credits to Business
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add AI Credits to Business</DialogTitle>
                    <DialogDescription>
                      Add credits to a business's AI credit pool
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Search Business</Label>
                      <Input
                        placeholder="Search by business name or owner email..."
                        value={businessSearchQuery}
                        onChange={(e) => {
                          setBusinessSearchQuery(e.target.value);
                          searchBusinessesForCredits(e.target.value);
                        }}
                      />
                      {businessSearchResults.length > 0 && (
                        <div className="border rounded-md max-h-40 overflow-y-auto">
                          {businessSearchResults.map((b: any) => (
                            <div
                              key={b.id}
                              className={`p-2 hover:bg-muted cursor-pointer ${
                                selectedBusinessForCredits?.id === b.id ? 'bg-primary/10' : ''
                              }`}
                              onClick={() => {
                                setSelectedBusinessForCredits(b);
                                setBusinessSearchQuery(b.name);
                                setBusinessSearchResults([]);
                              }}
                            >
                              <p className="font-medium">{b.name}</p>
                              <p className="text-xs text-muted-foreground">{b.owner_email}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedBusinessForCredits && (
                        <Badge variant="outline" className="mt-2">
                          Selected: {selectedBusinessForCredits.name}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Credits</Label>
                      <Input
                        type="number"
                        placeholder="Enter credits amount..."
                        value={creditsToAdd}
                        onChange={(e) => setCreditsToAdd(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason (Optional)</Label>
                      <Input
                        placeholder="e.g., Annual bonus, promo..."
                        value={creditsReason}
                        onChange={(e) => setCreditsReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddCreditsDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCredits} disabled={isAddingCredits || !selectedBusinessForCredits || !creditsToAdd}>
                      {isAddingCredits ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Add Credits
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* AI Credits Stats */}
            {aiCreditsStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Credits Purchased"
                  value={aiCreditsStats.total_credits_purchased?.toLocaleString() || '0'}
                  icon={Sparkles}
                />
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(aiCreditsStats.total_revenue || 0)}
                  icon={DollarSign}
                />
                <StatCard
                  title="Pending Purchases"
                  value={aiCreditsStats.pending_count || '0'}
                  icon={Clock}
                />
                <StatCard
                  title="Active AI Users"
                  value={aiCreditsStats.active_users || '0'}
                  icon={Users}
                />
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, business, or transaction..."
                  className="pl-10"
                  value={aiCreditsSearch}
                  onChange={(e) => setAiCreditsSearch(e.target.value)}
                />
              </div>
              <Select value={aiCreditsStatusFilter} onValueChange={setAiCreditsStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadAiCreditsPurchases}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* AI Credits Purchases List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Credit Purchases</CardTitle>
                <CardDescription>Manage and approve AI credit purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : aiCreditsPurchases
                    .filter((p: any) => {
                      const matchesSearch = aiCreditsSearch === '' ||
                        p.user_email?.toLowerCase().includes(aiCreditsSearch.toLowerCase()) ||
                        p.business_name?.toLowerCase().includes(aiCreditsSearch.toLowerCase()) ||
                        p.reference?.toLowerCase().includes(aiCreditsSearch.toLowerCase());
                      const matchesStatus = aiCreditsStatusFilter === 'all' || p.status === aiCreditsStatusFilter;
                      return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No AI credit purchases found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiCreditsPurchases
                      .filter((p: any) => {
                        const matchesSearch = aiCreditsSearch === '' ||
                          p.user_email?.toLowerCase().includes(aiCreditsSearch.toLowerCase()) ||
                          p.business_name?.toLowerCase().includes(aiCreditsSearch.toLowerCase()) ||
                          p.reference?.toLowerCase().includes(aiCreditsSearch.toLowerCase());
                        const matchesStatus = aiCreditsStatusFilter === 'all' || p.status === aiCreditsStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((purchase: any) => (
                        <div
                          key={purchase.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{purchase.user_name || purchase.user_email}</h4>
                              <Badge variant={
                                purchase.status === 'completed' ? 'default' :
                                purchase.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {purchase.status}
                              </Badge>
                              {purchase.is_business_purchase && (
                                <Badge variant="outline">Business Pool</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {purchase.business_name || 'Individual'} • {purchase.plan_name || `${purchase.credits_amount} credits`}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {purchase.credits_amount?.toLocaleString()} credits
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(purchase.amount || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(purchase.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {purchase.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleApproveAiPurchase(purchase.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => handleRejectAiPurchase(purchase.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer Errors View */}
        {view === 'customer-errors' && (
          <AdminCustomerErrors />
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Platform Settings</h2>
                <p className="text-muted-foreground">Configure platform bank account, payment keys, and fee settings</p>
              </div>
            </div>

            {/* Platform Bank Account Settings */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setBankAccountOpen(!bankAccountOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Platform Bank Account
                  </CardTitle>
                  <Button variant="ghost" size="icon">
                    {bankAccountOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
                <CardDescription>
                  Bank account details displayed to businesses for manual wallet deposits
                </CardDescription>
              </CardHeader>
              {bankAccountOpen && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        placeholder="e.g., GTBank"
                        value={platformSettings.bank_name}
                        onChange={(e) => setPlatformSettings({...platformSettings, bank_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        placeholder="e.g., 0123456789"
                        value={platformSettings.account_number}
                        onChange={(e) => setPlatformSettings({...platformSettings, account_number: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        placeholder="e.g., Henotace Business Ltd"
                        value={platformSettings.account_name}
                        onChange={(e) => setPlatformSettings({...platformSettings, account_name: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Platform Flutterwave Keys */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setFlutterwaveOpen(!flutterwaveOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Platform Flutterwave Keys
                  </CardTitle>
                  <Button variant="ghost" size="icon">
                    {flutterwaveOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
                <CardDescription>
                  Flutterwave API keys for subscription payments, platform fees, and wallet funding
                </CardDescription>
              </CardHeader>
              {flutterwaveOpen && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="flutterwave_public_key">Public Key</Label>
                      <Input
                        id="flutterwave_public_key"
                        placeholder="FLWPUBK-xxxxxx"
                        value={platformSettings.flutterwave_public_key}
                        onChange={(e) => setPlatformSettings({...platformSettings, flutterwave_public_key: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">Used for initiating payments on the frontend</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flutterwave_secret_key">Secret Key</Label>
                      <Input
                        id="flutterwave_secret_key"
                        type="password"
                        placeholder="FLWSECK-xxxxxx"
                        value={platformSettings.flutterwave_secret_key}
                        onChange={(e) => setPlatformSettings({...platformSettings, flutterwave_secret_key: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">Used for verifying payments on the backend</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="flutterwave_is_live"
                        checked={platformSettings.flutterwave_is_live}
                        onChange={(e) => setPlatformSettings({...platformSettings, flutterwave_is_live: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="flutterwave_is_live" className="cursor-pointer">
                        Use Live Keys
                      </Label>
                    </div>
                    <Badge variant={platformSettings.flutterwave_is_live ? 'default' : 'secondary'}>
                      {platformSettings.flutterwave_is_live ? 'LIVE MODE' : 'TEST MODE'}
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Platform Fee Settings */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setFeeSettingsOpen(!feeSettingsOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Platform Fee Settings
                  </CardTitle>
                  <Button variant="ghost" size="icon">
                    {feeSettingsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
                <CardDescription>
                  Configure platform fees for bank transfer transactions
                </CardDescription>
              </CardHeader>
              {feeSettingsOpen && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fee_per_transaction">Fee Per Transaction (₦)</Label>
                      <Input
                        id="fee_per_transaction"
                        type="number"
                        placeholder="50"
                        value={platformSettings.platform_fee_per_transaction}
                        onChange={(e) => setPlatformSettings({...platformSettings, platform_fee_per_transaction: parseFloat(e.target.value) || 0})}
                      />
                      <p className="text-xs text-muted-foreground">Amount charged per verified bank transfer</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suspension_threshold">Suspension Threshold (Count)</Label>
                      <Input
                        id="suspension_threshold"
                        type="number"
                        placeholder="20"
                        value={platformSettings.suspension_threshold}
                        onChange={(e) => setPlatformSettings({...platformSettings, suspension_threshold: parseInt(e.target.value) || 0})}
                      />
                      <p className="text-xs text-muted-foreground">Number of unpaid transactions before suspension</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={savePlatformSettings} disabled={isSavingSettings}>
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Business Details Dialog */}
        <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {selectedBusiness?.name}
              </DialogTitle>
              <DialogDescription>
                Business details and management
              </DialogDescription>
            </DialogHeader>
            {selectedBusiness && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedBusiness.owner_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBusiness.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store URL</p>
                    <p className="font-medium">/store/{selectedBusiness.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedBusiness.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="font-medium text-lg">{selectedBusiness.total_sales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription</p>
                    <Badge>{selectedBusiness.subscription_plan || 'Free'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="font-medium">{formatCurrency(selectedBusiness.wallet_balance)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant={selectedBusiness.is_active ? 'destructive' : 'default'}
                    onClick={() => {
                      toggleBusinessStatus(selectedBusiness.id, !selectedBusiness.is_active);
                      setSelectedBusiness(null);
                    }}
                  >
                    {selectedBusiness.is_active ? 'Deactivate Business' : 'Activate Business'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedSubBusiness(selectedBusiness);
                      setSubscriptionDialog(true);
                      setSelectedBusiness(null);
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedWalletBusiness(selectedBusiness);
                      setWalletCreditDialog(true);
                      setSelectedBusiness(null);
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Credit Wallet
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBusiness(selectedBusiness)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Business
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Wallet Credit Dialog */}
        <Dialog open={walletCreditDialog} onOpenChange={setWalletCreditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Credit Business Wallet
              </DialogTitle>
              <DialogDescription>
                Add funds to a business wallet (e.g., when they pay cash)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!selectedWalletBusiness ? (
                <div className="space-y-2">
                  <Label>Select Business</Label>
                  <Select onValueChange={(value) => {
                    const business = businesses.find(b => b.id.toString() === value);
                    if (business) setSelectedWalletBusiness(business);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a business..." />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id.toString()}>
                          {business.name} - {business.owner_email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {businesses.length === 0 && (
                    <Button variant="link" size="sm" onClick={loadBusinesses}>
                      Load businesses
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {(selectedWalletBusiness as WalletInfo).business_name || (selectedWalletBusiness as Business).name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Balance: {formatCurrency(
                      'balance' in selectedWalletBusiness 
                        ? (selectedWalletBusiness as WalletInfo).balance 
                        : (selectedWalletBusiness as Business).wallet_balance
                    )}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Cash payment for subscription"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setWalletCreditDialog(false);
                setSelectedWalletBusiness(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreditWallet} 
                disabled={isCreditLoading || !selectedWalletBusiness || !creditAmount}
              >
                {isCreditLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Credit Wallet
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Management Dialog */}
        <Dialog open={subscriptionDialog} onOpenChange={setSubscriptionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Manage Subscription
              </DialogTitle>
              <DialogDescription>
                Update subscription plan for {selectedSubBusiness?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSubBusiness && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedSubBusiness.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Plan: <Badge>{selectedSubBusiness.subscription_plan || 'Free'}</Badge>
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>New Plan</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Select value={subscriptionDays} onValueChange={setSubscriptionDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days (Trial)</SelectItem>
                    <SelectItem value="30">30 Days (1 Month)</SelectItem>
                    <SelectItem value="90">90 Days (3 Months)</SelectItem>
                    <SelectItem value="180">180 Days (6 Months)</SelectItem>
                    <SelectItem value="365">365 Days (1 Year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSubscriptionDialog(false);
                setSelectedSubBusiness(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateSubscription} 
                disabled={isSubLoading || !newPlan}
              >
                {isSubLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Subscription'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Bank Transfer Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Reject Bank Transfer
              </DialogTitle>
              <DialogDescription>
                Reject the bank transfer from {selectedTransfer?.business_name}. 
                The business owner will be notified of the rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTransfer && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedTransfer.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: <span className="font-semibold text-green-600">{formatCurrency(selectedTransfer.amount)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Reference: <code className="bg-background px-1 rounded">{selectedTransfer.bank_transfer_reference || selectedTransfer.reference}</code>
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Reason for Rejection (Optional)</Label>
                <Input
                  placeholder="e.g., Transfer not found, Amount mismatch..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowRejectDialog(false);
                setSelectedTransfer(null);
                setRejectReason('');
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectTransfer}
                disabled={verifyingTransferId === selectedTransfer?.id}
              >
                {verifyingTransferId === selectedTransfer?.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Transfer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
