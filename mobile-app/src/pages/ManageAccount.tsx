import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  CreditCard, Gift, Settings, User, Shield, Users, RefreshCw, ExternalLink, Eye, EyeOff, Building2, MessageSquare, Download, Mail, CheckCircle2, Lock, Fingerprint, KeyRound, Smartphone, Copy, Check, DollarSign, TrendingUp, Share2, ChevronRight, Menu, Wallet, Crown, Zap, Star, ArrowUpCircle, ChevronDown, Sun, Moon, Palette, HelpCircle, Phone, Trash2, AlertTriangle, FileDown, Bell
} from "lucide-react";
import { ButtonSpinner, PageSpinner } from "@/components/ui/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import ProfileLite from "@/components/account/ProfileLite";
import TwoFAManagement from "@/components/account/TwoFAManagement";
import TelegramIntegration from "@/components/account/TelegramIntegration";
import PaymentMethodDialog from "@/components/payment/PaymentMethodDialog";
import { apiGet, apiPost, getBaseUrl } from "@/lib/api";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { AICreditsUpgrade } from "@/components/account/AICreditsUpgrade";

type View = "ai-credits" | "wallet" | "referrals" | "profile" | "twofa" | "community" | "institution" | "telegram" | "export" | "verification" | "security" | "upgrade" | "theme" | "support" | "delete-account";

const getDevDashboardUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8080/developer/dashboard';
  }
  return 'https://henotaceai.ng/developer/dashboard';
};

const getMonthlyLimit = (plan?: string) => {
  switch (plan) {
    case 'pro':
    case 'family':
      return 1000;
    case 'enterprise':
      return 3000;
    default:
      return 100;
  }
};

export default function ManageAccount(){
  // Check URL params for view (supports both 'view' and 'tab' params)
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const viewParam = (urlParams.get('view') || urlParams.get('tab')) as View;
  
  // Get role to determine default view - wallet for business users, profile for others
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const brmStaffCheck = typeof window !== 'undefined' ? localStorage.getItem('brmStaff') : null;
  const isBusinessUser = storedRole === 'business_owner' || storedRole === 'business_admin' || storedRole === 'admin' || !!brmStaffCheck;
  const defaultView = isBusinessUser ? 'wallet' : 'profile';
  const initialView = viewParam || defaultView;
  
  // Get dashboard view mode from localStorage (product or service)
  const storedViewMode = typeof window !== 'undefined' ? (localStorage.getItem('dashboard_view_mode') || localStorage.getItem('dashboardViewMode')) : null;
  const [dashboardViewMode, setDashboardViewMode] = useState<'product' | 'service'>(
    (storedViewMode as 'product' | 'service') || 'product'
  );
  
  // Listen for dashboard view mode changes
  useEffect(() => {
    const handleViewModeChange = (e: CustomEvent<{ mode: 'product' | 'service' }>) => {
      setDashboardViewMode(e.detail.mode);
    };
    
    window.addEventListener('dashboardViewModeChanged', handleViewModeChange as EventListener);
    return () => {
      window.removeEventListener('dashboardViewModeChanged', handleViewModeChange as EventListener);
    };
  }, []);
  
  const [activeView, setActiveView] = useState<View>(initialView);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false); // Delayed spinner
  const [user, setUser] = useState<any>(null);
  
  // Only show spinner after 3 seconds of loading
  useEffect(() => {
    if (loading) {
      const spinnerTimeout = setTimeout(() => setShowSpinner(true), 3000);
      return () => clearTimeout(spinnerTimeout);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);
  
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isStudent = role === 'student' || role === 'cbt_student';
  
  // Check if user is BRM (Business Relationship Manager) - Henotace staff
  const brmStaffStr = typeof window !== 'undefined' ? localStorage.getItem('brmStaff') : null;
  let brmStaff = null;
  try {
    brmStaff = brmStaffStr ? JSON.parse(brmStaffStr) : null;
  } catch (e) {
    console.error('Error parsing brmStaff:', e);
  }
  const isBRM = !!brmStaff;
  
  // Check if user is school admin - check both role and user.role
  // Also check userData from localStorage as fallback
  const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  let userData = null;
  try {
    userData = userDataStr ? JSON.parse(userDataStr) : null;
  } catch (e) {
    console.error('Error parsing userData:', e);
  }
  const isSchoolAdmin = role === 'school_admin' || user?.role === 'school_admin' || userData?.role === 'school_admin';
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[ManageAccount] Role check:', { role, userRole: user?.role, userDataRole: userData?.role, isSchoolAdmin, isBRM });
  }

  // Update activeView when URL params change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = (params.get('view') || params.get('tab')) as View;
    if (view) {
      setActiveView(view);
    }
  }, []);

  // Listen for URL changes (for navigation from other pages)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = (params.get('view') || params.get('tab')) as View;
      if (view) {
        setActiveView(view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { isFetching } = useQuery({
    queryKey: ['cbt-profile'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return null;
      }
      try {
        // Add cache-busting timestamp to ensure fresh data in both prod and local
        const timestamp = Date.now();
        const endpoint = `profile/?_t=${timestamp}`;
        const data = await apiGet(endpoint) as any;
        setUser(data);
        // Update localStorage to keep dashboard in sync
        if (data) {
          localStorage.setItem('userData', JSON.stringify(data));
        }
        return data;
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        setLoading(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 60000, // Cache for 1 minute for faster returns
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for better UX
    retry: 1, // Only retry once
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  // Add a timeout fallback - don't wait forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ManageAccount: Loading timeout, showing page anyway');
        setLoading(false);
      }
    }, 15000); // 15 second max wait
    return () => clearTimeout(timeout);
  }, [loading]);

  // Try to use cached user data immediately while fetching fresh data
  const cachedUser = user || userData;

  // Only show full page spinner after 3 seconds AND if we have no cached data
  if (loading && isFetching && showSpinner && !cachedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading account settings...</p>
        </div>
      </div>
    );
  }

  // Use cached user data while fresh data loads in background
  const displayUser = user || userData;

  // Check if user is a business owner or admin
  const isBusinessOwner = role === 'business_owner' || role === 'business_admin' || role === 'admin' || 
    displayUser?.role === 'business_owner' || displayUser?.role === 'business_admin' || displayUser?.role === 'admin';

  // BRM staff also need wallet and referrals (they earn 10% commission)
  const showWalletAndReferrals = isBusinessOwner || isBRM;

  // Navigation items configuration - conditional based on role
  const navItems = [
    ...(showWalletAndReferrals ? [
      { id: 'wallet' as View, label: 'Wallet', icon: Wallet },
      { id: 'upgrade' as View, label: 'Upgrade Plan', icon: Crown, isSubItem: true },
      { id: 'referrals' as View, label: 'Referrals', icon: Gift },
    ] : []),
    { id: 'profile' as View, label: 'Profile', icon: User },
    { id: 'verification' as View, label: 'Email Verification', icon: Mail },
    { id: 'security' as View, label: 'Security & Privacy', icon: Lock },
    { id: 'theme' as View, label: 'Theme', icon: Palette },
    ...(isBusinessOwner && !isBRM ? [
      { id: 'support' as View, label: 'Customer Service', icon: HelpCircle },
      { id: 'delete-account' as View, label: 'Delete Account', icon: Trash2 },
    ] : []),
    { id: 'ai-credits' as View, label: 'AI Credits', icon: Zap },
    { id: 'community' as View, label: 'Community', icon: Users },
    ...(isBusinessOwner ? [
      { id: 'export' as View, label: 'Export Data', icon: Download },
    ] : []),
  ];

  // Add conditional nav items
  const allNavItems = [
    ...navItems,
    ...(role === 'cbt_institution' || isSchoolAdmin ? [
      { id: 'telegram' as View, label: 'Telegram Integration', icon: MessageSquare },
      { id: 'export' as View, label: 'Export Data', icon: Download },
    ] : []),
  ];

  return (
    <div className="px-5 md:px-8 lg:px-6 py-4 lg:flex lg:gap-6 max-w-6xl mx-auto">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block lg:w-72 lg:shrink-0">
        <div className="mb-4">
          <Button variant="outline" onClick={()=>history.back()}>← Back</Button>
        </div>
        <Card className="p-2">
          <div className="space-y-1">
            {allNavItems.map((item) => (
              <Button 
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"} 
                className={`w-full justify-start ${(item as any).isSubItem ? 'ml-4 text-sm' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="w-4 h-4 mr-2" /> {item.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Mobile Navigation - Collapsible Accordion */}
      <div className="lg:hidden mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" onClick={()=>history.back()}>← Back</Button>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="menu" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                <span className="font-medium">
                  {allNavItems.find(item => item.id === activeView)?.label || 'Menu'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-2">
              <div className="space-y-1">
                {allNavItems.map((item) => (
                  <Button 
                    key={item.id}
                    variant={activeView === item.id ? "default" : "ghost"} 
                    className={`w-full justify-start ${(item as any).isSubItem ? 'ml-4 text-sm' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <item.icon className="w-4 h-4 mr-2" /> {item.label}
                    {activeView === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Content */}
      <div className="flex-1 lg:mt-0">
        {activeView === 'ai-credits' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">AI Credits</h1>
              <p className="text-muted-foreground">Manage your AI credits for all AI-powered features</p>
            </div>
            <AICreditsUpgrade standalone={true} />
          </div>
        )}

        {activeView === 'wallet' && showWalletAndReferrals && (
          <WalletSection user={user} isBRM={isBRM} brmStaff={brmStaff} />
        )}

        {activeView === 'upgrade' && showWalletAndReferrals && (
          <UpgradePlanSection user={user} businessType={dashboardViewMode} />
        )}

        {activeView === 'referrals' && showWalletAndReferrals && (
          <ReferralsSection user={user} isBRM={isBRM} brmStaff={brmStaff} />
        )}

        {activeView === 'profile' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your profile, socials, password, and image.</p>
            </div>
            <ProfileLite user={user} onProfileUpdate={(u)=> setUser(u)} />
            
            {/* Institution Info for Students */}
            {isStudent && <StudentInstitutionInfo />}
          </div>
        )}

        {activeView === 'twofa' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Two-Factor Authentication</h1>
              <p className="text-muted-foreground">Enhance your account security by enabling 2FA.</p>
            </div>
            <TwoFAManagement />
          </div>
        )}

        {activeView === 'security' && (
          <SecurityPrivacySection user={user} onUserUpdate={(u) => setUser(u)} isBusinessOwner={isBusinessOwner} />
        )}

        {activeView === 'community' && (
          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Join our community to learn and share with others.</p>
              <Button onClick={()=> window.open('https://t.me/+aWTG842F67Y2M2Rk','_blank')}>Open Community</Button>
            </CardContent>
          </Card>
        )}

        {activeView === 'theme' && (
          <ThemeSection />
        )}

        {activeView === 'support' && isBusinessOwner && (
          <CustomerServiceSection />
        )}

        {activeView === 'delete-account' && isBusinessOwner && (
          <DeleteAccountSection user={user} />
        )}

        {activeView === 'verification' && (
          <VerificationSection user={user} onUserUpdate={(u) => setUser(u)} />
        )}

        {activeView === 'telegram' && (
          <TelegramIntegration />
        )}

        {activeView === 'export' && (
          isBusinessOwner ? <BusinessDataExportSection /> : <InstitutionDataExportSection />
        )}
      </div>
    </div>
  );
}

function InstitutionDataExportSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Export Data</h1>
        <p className="text-muted-foreground">Export all your institution data in JSON format for backup or migration to another platform.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Institution Data Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will export all data related to your institution including:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>School information</li>
            <li>Classes and students</li>
            <li>Teachers and staff</li>
            <li>Parents</li>
            <li>Fee structures and payments</li>
            <li>Assignments and exams</li>
            <li>Attendance records</li>
            <li>Report cards</li>
            <li>Payroll data</li>
            <li>Timetables and lesson notes</li>
            <li>Digital resources</li>
            <li>Messages and announcements</li>
          </ul>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              The exported data will be in JSON format and can be used to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
              <li>Create backups of your institution data</li>
              <li>Import into another platform</li>
              <li>Analyze your data offline</li>
            </ul>
            <Button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('accessToken');
                  if (!token) {
                    alert('Authentication required');
                    return;
                  }
                  const baseUrl = getBaseUrl();
                  const response = await fetch(`${baseUrl}school/admin/export-data/`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                  });
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to export data');
                  }
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const contentDisposition = response.headers.get('Content-Disposition');
                  let filename = 'institution_data.json';
                  if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                      filename = filenameMatch[1];
                    }
                  }
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error: any) {
                  alert(error?.message || 'Failed to export data');
                }
              }}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" /> Export All Institution Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessDataExportSection() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sections = [
    { key: 'categories', label: 'Categories', description: 'Product categories and setup taxonomy' },
    { key: 'products', label: 'Products & Inventory', description: 'Products, SKUs, barcodes, stock levels, pricing' },
    { key: 'customers', label: 'Customers', description: 'Customer profiles and account balances' },
    { key: 'suppliers', label: 'Suppliers', description: 'Supplier profiles and contact details' },
    { key: 'sales', label: 'Sales & Receipts', description: 'Sales transactions and line items' },
    { key: 'purchase_orders', label: 'Purchase Orders', description: 'Purchase orders and ordered items' },
    { key: 'staff', label: 'Staff', description: 'Business staff records and permissions' },
    { key: 'budgets', label: 'Budgets', description: 'Budget plans and category allocations' },
    { key: 'wallet_transactions', label: 'Wallet Transactions', description: 'Wallet debit/credit history and references' },
    { key: 'referral_earnings', label: 'Referral Earnings', description: 'Referral income history and status' },
  ];

  const [selectedSections, setSelectedSections] = useState<string[]>(sections.map(s => s.key));

  const toggleSection = (key: string) => {
    setSelectedSections(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      setError('Select at least one data category to export.');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const sectionsParam = encodeURIComponent(selectedSections.join(','));
      const response = await fetch(`${getBaseUrl()}business/export-data/?sections=${sectionsParam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Export completed. Your selected business data has been downloaded.');
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Export Data</h1>
        <p className="text-muted-foreground">Export specific business data categories for migration, backup, or analytics.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Business Data Export Table
          </CardTitle>
          <CardDescription>
            Choose the categories you want to export. The file is generated in JSON format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Export</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Main Data</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.key} className="border-t">
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedSections.includes(section.key)}
                        onChange={() => toggleSection(section.key)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium align-top">{section.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">{section.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setSelectedSections(sections.map(s => s.key))}>
              Select All
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelectedSections([])}>
              Clear All
            </Button>
            <Button onClick={handleExport} disabled={exporting || selectedSections.length === 0}>
              {exporting ? <><ButtonSpinner className="mr-2" />Exporting...</> : <><Download className="w-4 h-4 mr-2" />Export Selected Data</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Institution Info Component for Students
function StudentInstitutionInfo() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const { data: institution, isLoading } = useQuery({
    queryKey: ['student-institution'],
    queryFn: async () => {
      if (!token) return null;
      const data = await apiGet('cbt/student/me/') as any;
      return data?.student?.institution || null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!institution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Institution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-muted-foreground mb-2">No Institution Assigned</p>
            <p className="text-xs text-muted-foreground">Ask your institution admin to link your account.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          My Institution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Institution Name</Label>
          <p className="text-lg font-semibold mt-1">{(institution as any).name || 'Unnamed Institution'}</p>
        </div>
        {(institution as any).code && (
          <div>
            <Label className="text-sm text-muted-foreground">Institution Code</Label>
            <p className="text-sm font-mono mt-1">{(institution as any).code}</p>
          </div>
        )}
        {(institution as any).admin_email && (
          <div>
            <Label className="text-sm text-muted-foreground">Admin Email</Label>
            <p className="text-sm mt-1">{(institution as any).admin_email}</p>
          </div>
        )}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            This is your linked institution. Contact your institution admin if you need to make changes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Verification Section Component (Email Only)
function VerificationSection({ user, onUserUpdate }: { user: any; onUserUpdate: (u: any) => void }) {
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sendEmailOtp = async () => {
    setSendingEmailOtp(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const payload: Record<string, any> = { email: user?.email };
      if (user?.id) payload.user_id = user.id;
      const response = await fetch(`${getBaseUrl()}otp/send-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setEmailOtpSent(true);
        setMessage({ type: 'success', text: 'Verification code sent to your email!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send verification code' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const verifyEmail = async () => {
    if (!emailOtp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }
    setVerifyingEmail(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const payload: Record<string, any> = { email: user?.email, otp_code: emailOtp };
      if (user?.id) payload.user_id = user.id;
      const response = await fetch(`${getBaseUrl()}otp/verify-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Email verified successfully!' });
        onUserUpdate({ ...user, email_verified: true });
        setEmailOtp('');
        setEmailOtpSent(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Email Verification</h1>
        <p className="text-muted-foreground">Verify your email address to secure your account.</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email_verified ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Email Verified</p>
                <p className="text-sm text-green-600 dark:text-green-500">{user?.email}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <p className="text-lg font-medium mt-1">{user?.email || 'No email set'}</p>
              </div>
              
              {!emailOtpSent ? (
                <Button onClick={sendEmailOtp} disabled={sendingEmailOtp || !user?.email}>
                  {sendingEmailOtp ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  {sendingEmailOtp ? 'Sending...' : 'Send Verification Code'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="emailOtp">Enter verification code</Label>
                    <Input
                      id="emailOtp"
                      type="text"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={verifyEmail} disabled={verifyingEmail || !emailOtp.trim()}>
                      {verifyingEmail ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                    </Button>
                    <Button variant="outline" onClick={sendEmailOtp} disabled={sendingEmailOtp}>
                      Resend Code
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Security & Privacy Section Component
function SecurityPrivacySection({ user, onUserUpdate, isBusinessOwner }: { user: any; onUserUpdate: (u: any) => void; isBusinessOwner: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [sendingResetOtp, setSendingResetOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Login preferences
  const [require2FALogin, setRequire2FALogin] = useState(user?.require_2fa_login || false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if biometrics is supported
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        // Check if running on native platform
        if (Capacitor.isNativePlatform()) {
          // Use native biometric plugin
          const result = await NativeBiometric.isAvailable();
          setBiometricsSupported(result.isAvailable);
          // Check if already enrolled for this user
          const enrolled = localStorage.getItem('biometrics_enrolled') === 'true';
          const enrolledEmail = localStorage.getItem('biometrics_email');
          setBiometricsEnabled(enrolled && enrolledEmail === user?.email);
        } else if (window.PublicKeyCredential) {
          // Fallback to WebAuthn for web
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricsSupported(available);
          const enrolled = localStorage.getItem('biometrics_enrolled') === 'true';
          const enrolledEmail = localStorage.getItem('biometrics_email');
          setBiometricsEnabled(enrolled && enrolledEmail === user?.email);
        } else {
          setBiometricsSupported(false);
        }
      } catch (error) {
        console.error('Biometrics check error:', error);
        setBiometricsSupported(false);
      }
    };
    checkBiometrics();
  }, [user?.email]);

  // Update require2FALogin when user data is loaded/updated
  useEffect(() => {
    if (user?.require_2fa_login !== undefined) {
      setRequire2FALogin(user.require_2fa_login);
    }
  }, [user?.require_2fa_login]);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (!newPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendPasswordResetOtp = async () => {
    if (!user?.email) {
      setResetPasswordMessage({ type: 'error', text: 'No email found on your account' });
      return;
    }

    setSendingResetOtp(true);
    setResetPasswordMessage(null);

    try {
      const response = await fetch(`${getBaseUrl()}otp/send-password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (response.ok) {
        setShowResetFlow(true);
        setResetOtpSent(true);
        setResetPasswordMessage({ type: 'success', text: data.message || 'A reset code has been sent to your email' });
      } else {
        setResetPasswordMessage({ type: 'error', text: data.error || 'Failed to send reset code' });
      }
    } catch (error: any) {
      setResetPasswordMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setSendingResetOtp(false);
    }
  };

  const handleResetPasswordWithOtp = async () => {
    if (!user?.email) {
      setResetPasswordMessage({ type: 'error', text: 'No email found on your account' });
      return;
    }
    if (!resetOtpCode.trim() || resetOtpCode.trim().length !== 6) {
      setResetPasswordMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP code' });
      return;
    }
    if (!resetNewPassword.trim()) {
      setResetPasswordMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setResettingPassword(true);
    setResetPasswordMessage(null);

    try {
      const response = await fetch(`${getBaseUrl()}otp/verify-password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          otp_code: resetOtpCode.trim(),
          new_password: resetNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetPasswordMessage({ type: 'success', text: data.message || 'Password reset successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setResetOtpCode('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setResetOtpSent(false);
        setShowResetFlow(false);
      } else {
        setResetPasswordMessage({ type: 'error', text: data.error || 'Failed to reset password' });
      }
    } catch (error: any) {
      setResetPasswordMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggle2FALogin = async (enabled: boolean) => {
    setSavingPreferences(true);
    setPreferencesMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}auth/security-preferences/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          require_2fa_login: enabled
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRequire2FALogin(enabled);
        onUserUpdate({ ...user, require_2fa_login: enabled });
        setPreferencesMessage({ type: 'success', text: enabled ? '2FA login requirement enabled' : '2FA login requirement disabled' });
      } else {
        setPreferencesMessage({ type: 'error', text: data.error || 'Failed to update preferences' });
      }
    } catch (error: any) {
      setPreferencesMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setSavingPreferences(false);
    }
  };

  // Biometrics password prompt
  const [showBiometricsPasswordPrompt, setShowBiometricsPasswordPrompt] = useState(false);
  const [biometricsPassword, setBiometricsPassword] = useState('');
  const [biometricsPasswordError, setBiometricsPasswordError] = useState('');

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      // Show password prompt first
      setShowBiometricsPasswordPrompt(true);
      setBiometricsPassword('');
      setBiometricsPasswordError('');
    } else {
      // Disable biometrics - clear native credentials if on native platform
      try {
        if (Capacitor.isNativePlatform()) {
          await NativeBiometric.deleteCredentials({
            server: 'henotace-business-app',
          });
        }
      } catch (error) {
        console.log('Error deleting native credentials:', error);
      }
      localStorage.removeItem('biometrics_credential_id');
      localStorage.removeItem('biometrics_enrolled');
      localStorage.removeItem('biometrics_email');
      localStorage.removeItem('biometrics_token');
      setBiometricsEnabled(false);
      setPreferencesMessage({ type: 'success', text: 'Biometric login disabled' });
    }
  };

  const handleConfirmBiometricsEnrollment = async () => {
    if (!biometricsPassword) {
      setBiometricsPasswordError('Please enter your password');
      return;
    }

    // Verify password by attempting login
    try {
      const response = await fetch(`${getBaseUrl()}auth/verify-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ password: biometricsPassword })
      });

      if (!response.ok) {
        setBiometricsPasswordError('Invalid password. Please try again.');
        return;
      }

      // Password verified, now enroll biometrics
      if (Capacitor.isNativePlatform()) {
        // Use native biometric for mobile app
        try {
          // Verify user's identity first
          await NativeBiometric.verifyIdentity({
            reason: 'Confirm your identity to enable biometric login',
            title: 'Enable Biometric Login',
            subtitle: 'Henotace Business',
            description: 'Use your fingerprint or face to sign in quickly',
          });

          // Store credentials securely using native keychain/keystore
          await NativeBiometric.setCredentials({
            username: user?.email || '',
            password: biometricsPassword,
            server: 'henotace-business-app',
          });

          // Mark as enrolled
          localStorage.setItem('biometrics_enrolled', 'true');
          localStorage.setItem('biometrics_email', user?.email || '');
          setBiometricsEnabled(true);
          setShowBiometricsPasswordPrompt(false);
          setBiometricsPassword('');
          setPreferencesMessage({ type: 'success', text: 'Biometric login enabled! You can now use fingerprint/Face ID to sign in.' });
        } catch (error: any) {
          console.error('Native biometrics enrollment error:', error);
          setBiometricsPasswordError(error.message || 'Failed to enable biometrics. Please try again.');
        }
      } else {
        // Fallback to WebAuthn for web
        if (!window.PublicKeyCredential) {
          setPreferencesMessage({ type: 'error', text: 'Biometrics not supported on this device' });
          setShowBiometricsPasswordPrompt(false);
          return;
        }

        // Create credential options
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
          challenge: challenge,
          rp: {
            name: "HenotaceAI Business",
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(user?.id?.toString() || 'user'),
            name: user?.email || 'user@example.com',
            displayName: user?.first_name || user?.email || 'User'
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        };

        const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });

        if (credential) {
          // Store credential ID and password for future authentication
          const credentialId = btoa(String.fromCharCode(...new Uint8Array((credential as PublicKeyCredential).rawId)));
          localStorage.setItem('biometrics_credential_id', credentialId);
          localStorage.setItem('biometrics_enrolled', 'true');
          localStorage.setItem('biometrics_email', user?.email || '');
          localStorage.setItem('biometrics_token', btoa(biometricsPassword)); // Store encoded password
          setBiometricsEnabled(true);
          setShowBiometricsPasswordPrompt(false);
          setBiometricsPassword('');
          setPreferencesMessage({ type: 'success', text: 'Biometric login enabled! You can now use fingerprint/Face ID to sign in.' });
        }
      }
    } catch (error: any) {
      console.error('Biometrics enrollment error:', error);
      setBiometricsPasswordError('Failed to verify password. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Security & Privacy</h1>
        <p className="text-muted-foreground">Manage your account security settings and login preferences.</p>
      </div>

      {/* Collapsible Security Sections */}
      <Accordion type="multiple" defaultValue={["password"]} className="w-full space-y-4">
        {/* Change Password Section */}
        <AccordionItem value="password" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Change Password</div>
                <p className="text-sm text-muted-foreground font-normal">Update your password to keep your account secure</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-2">
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full sm:w-auto">
                {changingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                {changingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>

              <div className="border-t pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Forgot your current password? Reset with OTP sent to your email.</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendPasswordResetOtp}
                    disabled={sendingResetOtp || !user?.email}
                    className="w-full sm:w-auto"
                  >
                    {sendingResetOtp ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    {sendingResetOtp ? 'Sending OTP...' : resetOtpSent ? 'Resend Reset OTP' : 'Reset Password with OTP'}
                  </Button>
                </div>

                {resetPasswordMessage && (
                  <div className={`p-3 rounded-lg text-sm ${resetPasswordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                    {resetPasswordMessage.text}
                  </div>
                )}

                {showResetFlow && (
                  <div className="space-y-3 border rounded-lg p-3">
                    <div className="space-y-2">
                      <Label htmlFor="resetOtpCode">OTP Code</Label>
                      <Input
                        id="resetOtpCode"
                        type="text"
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value)}
                        placeholder="Enter 6-digit OTP code"
                        maxLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resetNewPassword">New Password</Label>
                      <Input
                        id="resetNewPassword"
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resetConfirmPassword">Confirm New Password</Label>
                      <Input
                        id="resetConfirmPassword"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleResetPasswordWithOtp}
                      disabled={resettingPassword}
                      className="w-full sm:w-auto"
                    >
                      {resettingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                      {resettingPassword ? 'Resetting Password...' : 'Confirm Password Reset'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Login Preferences Section */}
        <AccordionItem value="login" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Login Preferences</div>
                <p className="text-sm text-muted-foreground font-normal">Configure how you sign in to your account</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-2">
              {preferencesMessage && (
                <div className={`p-3 rounded-lg text-sm ${preferencesMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                  {preferencesMessage.text}
                </div>
              )}

              {/* 2FA Login Requirement */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Require 2FA for Login</div>
                    <p className="text-sm text-muted-foreground">
                      Need to enter a 2FA code every time you log in
                    </p>
                    {!user?.two_factor_enabled && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Set up 2FA first before enabling this
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={require2FALogin}
                  onCheckedChange={handleToggle2FALogin}
                  disabled={savingPreferences || !user?.two_factor_enabled}
                />
              </div>

              {/* Biometric Login */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Biometric Login</div>
                    <p className="text-sm text-muted-foreground">
                      Use fingerprint or Face ID to sign in
                    </p>
                    {!biometricsSupported && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Not available on this device
                      </p>
                    )}
                    {biometricsSupported && biometricsEnabled && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Set up and ready to use
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={biometricsEnabled}
                  onCheckedChange={handleToggleBiometrics}
                  disabled={!biometricsSupported}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Two-Factor Authentication Section */}
        <AccordionItem value="2fa" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Two-Factor Authentication (2FA)</div>
                <p className="text-sm text-muted-foreground font-normal">Add extra security with authenticator app</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="pt-2">
              <TwoFAManagement />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Notification Preferences Section */}
        <AccordionItem value="notifications" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Notification Preferences</div>
                <p className="text-sm text-muted-foreground font-normal">Manage your notification settings and email preferences</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="pt-2 space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which notifications you receive. Toggle "Email" to also receive these notifications via email.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">In-App</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Switch />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Payment Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {isBusinessOwner 
                        ? 'Receive alerts for payments and transactions' 
                        : 'Receive alerts for your own payments and transactions'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">In-App</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Switch />
                    </div>
                  </div>
                </div>
                
                {/* Order Updates and Stock Alerts - Only for Business Owners */}
                {isBusinessOwner && (
                  <>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">In-App</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <Switch />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Stock Alerts</p>
                        <p className="text-sm text-muted-foreground">Receive low stock and inventory alerts</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">In-App</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {isBusinessOwner && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Email notifications are recommended for stock alerts to ensure you never miss important inventory updates.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Biometrics Password Prompt Dialog */}
      <Dialog open={showBiometricsPasswordPrompt} onOpenChange={setShowBiometricsPasswordPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              Enable Biometric Login
            </DialogTitle>
            <DialogDescription>
              Enter your password to enable biometric login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="biometrics-password">Password</Label>
              <Input
                id="biometrics-password"
                type="password"
                placeholder="Enter your password"
                value={biometricsPassword}
                onChange={(e) => {
                  setBiometricsPassword(e.target.value);
                  setBiometricsPasswordError('');
                }}
              />
              {biometricsPasswordError && (
                <p className="text-sm text-destructive">{biometricsPasswordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBiometricsPasswordPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBiometricsEnrollment}>
              Enable Biometrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wallet Section Component for Business Owners and BRM Staff
function WalletSection({ user, isBRM, brmStaff }: { user: any; isBRM?: boolean; brmStaff?: any }) {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<{
    wallet_balance: number;
    transactions: Array<{
      id: number;
      type: string;
      amount: number;
      description: string;
      reference: string;
      created_at: string;
    }>;
    pending_platform_fees?: number;
    pending_platform_fee_count?: number;
    bank_transfer_suspended?: boolean;
    fee_per_transaction?: number;
    suspension_threshold_count?: number;
    approaching_suspension?: boolean;
    // Delivery fee tracking
    delivery_enabled?: boolean;
    pending_delivery_fees?: number;
    pending_delivery_fee_count?: number;
    delivery_suspended?: boolean;
    delivery_fee_per_transaction?: number;
    delivery_approaching_suspension?: boolean;
    cashback?: {
      available_balance: number;
      total_earned: number;
      total_withdrawn: number;
      transactions_this_month: number;
      fees_paid_this_month: number;
      threshold: number;
      transactions_to_threshold: number;
      is_eligible: boolean;
      potential_cashback: number;
      percentage: number;
      already_credited_this_month: boolean;
      month_name: string;
    };
  } | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showCashbackDialog, setShowCashbackDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('brmToken');
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Use BRM wallet endpoint for BRM staff, business wallet for business owners
      const walletEndpoint = isBRM ? 'brm/wallet/' : 'business/wallet/';
      const response = await fetch(`${getBaseUrl()}${walletEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData?.error || 'Failed to load wallet data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount < 1000) {
      setError('Minimum amount to fund is ₦1,000');
      return;
    }

    setFunding(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}business/wallet/deposit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          callback_url: `${window.location.origin}/manage-account?view=wallet&payment=complete`
        })
      });

      const data = await response.json();
      
      if (response.ok && data.payment_link) {
        // Redirect to Flutterwave payment page
        window.location.href = data.payment_link;
      } else {
        setError(data.error || 'Failed to initiate deposit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate deposit');
    } finally {
      setFunding(false);
    }
  };

  const handleWithdrawCashback = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const availableCashback = walletData?.cashback?.available_balance || 0;
    if (amount > availableCashback) {
      setError(`Maximum available: ₦${availableCashback.toLocaleString()}`);
      return;
    }

    setWithdrawing(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}business/wallet/cashback/withdraw/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Successfully withdrew ₦${amount.toLocaleString()} cashback to wallet`);
        setShowCashbackDialog(false);
        setWithdrawAmount('');
        fetchWalletData();
      } else {
        setError(data.error || 'Failed to withdraw cashback');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw cashback');
    } finally {
      setWithdrawing(false);
    }
  };

  // Handle payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const txRef = params.get('tx_ref') || params.get('reference');
    
    if (payment === 'complete' && txRef) {
      // Verify the payment
      const verifyPayment = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${getBaseUrl()}business/wallet/deposit/verify/?reference=${txRef}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          if (response.ok) {
            setSuccess('Wallet funded successfully!');
            fetchWalletData();
          } else {
            setError(data.error || 'Payment verification failed');
          }
        } catch (err: any) {
          setError('Payment verification failed');
        }
      };
      
      verifyPayment();
      // Clean URL
      window.history.replaceState({}, '', '/manage-account?view=wallet');
    }
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'referral_earning': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'plan_payment': return <Crown className="w-5 h-5 text-amber-500" />;
      case 'withdrawal': return <ArrowUpCircle className="w-5 h-5 text-red-500 rotate-180" />;
      case 'cashback': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'cashback_withdrawal': return <Gift className="w-5 h-5 text-green-500" />;
      case 'platform_fee': return <DollarSign className="w-5 h-5 text-orange-500" />;
      default: return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'referral_earning':
      case 'cashback':
      case 'cashback_withdrawal':
        return 'text-green-600 dark:text-green-400';
      case 'plan_payment':
      case 'withdrawal':
      case 'platform_fee':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your business wallet and fund your account</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <PageSpinner />
              <p className="text-sm text-muted-foreground">Loading wallet...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your business wallet and fund your account</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-800/50 rounded-full">
                <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  ₦{(walletData?.wallet_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowFundDialog(true)}
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Fund Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cashback Card - Only for non-BRM users */}
      {!isBRM && walletData?.cashback && (
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                    <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cashback Balance</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                      ₦{(walletData.cashback.available_balance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total earned: ₦{(walletData.cashback.total_earned || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {walletData.cashback.available_balance > 0 && (
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setShowCashbackDialog(true)}
                  >
                    <ArrowUpCircle className="w-5 h-5 mr-2" />
                    Withdraw to Wallet
                  </Button>
                )}
              </div>
              
              {/* Cashback Progress */}
              <div className="border-t pt-4 mt-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Progress to {walletData.cashback.percentage}% Cashback ({walletData.cashback.month_name})
                  </span>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {walletData.cashback.transactions_this_month.toLocaleString()} / {walletData.cashback.threshold.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3">
                  <div 
                    className="bg-purple-600 dark:bg-purple-400 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (walletData.cashback.transactions_this_month / walletData.cashback.threshold) * 100)}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {walletData.cashback.transactions_to_threshold > 0 
                      ? `${walletData.cashback.transactions_to_threshold.toLocaleString()} more transactions to unlock cashback`
                      : walletData.cashback.already_credited_this_month 
                        ? '✓ Cashback credited this month!'
                        : '🎉 Eligible for cashback!'}
                  </p>
                  {walletData.cashback.potential_cashback > 0 && (
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      Potential: ₦{walletData.cashback.potential_cashback.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Fee Alert - Only show if there are pending fees */}
      {!isBRM && walletData && (walletData.pending_platform_fee_count || 0) > 0 && (
        <Card className={`border-2 ${
          walletData.bank_transfer_suspended 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600' 
            : walletData.approaching_suspension 
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
        }`}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  walletData.bank_transfer_suspended 
                    ? 'bg-red-100 dark:bg-red-800/50' 
                    : walletData.approaching_suspension 
                      ? 'bg-amber-100 dark:bg-amber-800/50'
                      : 'bg-blue-100 dark:bg-blue-800/50'
                }`}>
                  <AlertTriangle className={`w-6 h-6 ${
                    walletData.bank_transfer_suspended 
                      ? 'text-red-600 dark:text-red-400' 
                      : walletData.approaching_suspension 
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    walletData.bank_transfer_suspended 
                      ? 'text-red-700 dark:text-red-300' 
                      : walletData.approaching_suspension 
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {walletData.bank_transfer_suspended 
                      ? 'Bank Transfer Deposits Suspended' 
                      : walletData.approaching_suspension 
                        ? 'Approaching Suspension Limit'
                        : 'Pending Platform Fees'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {walletData.pending_platform_fee_count} transaction{walletData.pending_platform_fee_count !== 1 ? 's' : ''} × ₦{(walletData.fee_per_transaction || 50).toLocaleString()} = 
                    <span className="font-semibold ml-1">₦{(walletData.pending_platform_fees || 0).toLocaleString()}</span>
                  </p>
                  {walletData.bank_transfer_suspended ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Clear your pending fees to restore bank transfer deposits
                    </p>
                  ) : walletData.approaching_suspension ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Fund your wallet to avoid suspension ({walletData.pending_platform_fee_count}/{walletData.suspension_threshold_count} limit)
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* Pay from Wallet button - show if balance is sufficient */}
                {walletData.wallet_balance >= (walletData.pending_platform_fees || 0) && (
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        const response = await apiPost('business/wallet/pay-fees/', { fee_type: 'platform' });
                        if (response.success) {
                          setSuccess(response.message);
                          fetchWalletData();
                        } else {
                          setError(response.error || 'Failed to pay fees');
                        }
                      } catch (err: any) {
                        setError(err.error || 'Failed to pay fees');
                      }
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay from Wallet
                  </Button>
                )}
                {/* Fund wallet button - show if balance is insufficient */}
                {walletData.wallet_balance < (walletData.pending_platform_fees || 0) && (
                  <Button 
                    variant={walletData.bank_transfer_suspended ? 'destructive' : 'default'}
                    onClick={() => {
                      setFundAmount((walletData.pending_platform_fees || 0).toString());
                      setShowFundDialog(true);
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Fund ₦{(walletData.pending_platform_fees || 0).toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Delivery Fees Section - Similar to Pending Platform Fees */}
      {walletData && walletData.delivery_enabled && (walletData.pending_delivery_fees || 0) > 0 && (
        <Card className={`${
          walletData.delivery_suspended 
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
            : walletData.delivery_approaching_suspension 
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
              : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
        }`}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  walletData.delivery_suspended 
                    ? 'bg-red-100 dark:bg-red-800/50' 
                    : walletData.delivery_approaching_suspension 
                      ? 'bg-amber-100 dark:bg-amber-800/50'
                      : 'bg-purple-100 dark:bg-purple-800/50'
                }`}>
                  <AlertTriangle className={`w-6 h-6 ${
                    walletData.delivery_suspended 
                      ? 'text-red-600 dark:text-red-400' 
                      : walletData.delivery_approaching_suspension 
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    walletData.delivery_suspended 
                      ? 'text-red-700 dark:text-red-300' 
                      : walletData.delivery_approaching_suspension 
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-purple-700 dark:text-purple-300'
                  }`}>
                    {walletData.delivery_suspended 
                      ? 'Delivery Service Suspended' 
                      : walletData.delivery_approaching_suspension 
                        ? 'Delivery Suspension Warning'
                        : 'Pending Delivery Fees'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {walletData.pending_delivery_fee_count} delivery{walletData.pending_delivery_fee_count !== 1 ? 's' : ''} × ₦{(walletData.delivery_fee_per_transaction || 200).toLocaleString()} = 
                    <span className="font-semibold ml-1">₦{(walletData.pending_delivery_fees || 0).toLocaleString()}</span>
                  </p>
                  {walletData.delivery_suspended ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Clear your pending fees to restore delivery services
                    </p>
                  ) : walletData.delivery_approaching_suspension ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Fund your wallet to avoid delivery suspension ({walletData.pending_delivery_fee_count}/20 limit)
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* Pay from Wallet button - show if balance is sufficient */}
                {walletData.wallet_balance >= (walletData.pending_delivery_fees || 0) && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        const response = await apiPost('business/wallet/pay-fees/', { fee_type: 'delivery' });
                        if (response.success) {
                          setSuccess(response.message);
                          fetchWalletData();
                        } else {
                          setError(response.error || 'Failed to pay fees');
                        }
                      } catch (err: any) {
                        setError(err.error || 'Failed to pay fees');
                      }
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay from Wallet
                  </Button>
                )}
                {/* Fund wallet button - show if balance is insufficient */}
                {walletData.wallet_balance < (walletData.pending_delivery_fees || 0) && (
                  <Button 
                    variant={walletData.delivery_suspended ? 'destructive' : 'outline'}
                    className={walletData.delivery_suspended ? '' : 'border-purple-400 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30'}
                    onClick={() => {
                      setFundAmount((walletData.pending_delivery_fees || 0).toString());
                      setShowFundDialog(true);
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Fund ₦{(walletData.pending_delivery_fees || 0).toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Quick Actions */}
      <div className={`grid gap-4 ${isBRM ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
        {!isBRM && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/manage-account?view=upgrade'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Upgrade Plan</h3>
                  <p className="text-sm text-muted-foreground">Use wallet balance to upgrade</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/manage-account?view=referrals'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Earn Referrals</h3>
                <p className="text-sm text-muted-foreground">Get 10% when referrals upgrade</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {walletData?.transactions && walletData.transactions.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {walletData.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-right font-semibold ${getTransactionColor(tx.type)}`}>
                    {tx.type === 'plan_payment' || tx.type === 'withdrawal' ? '-' : '+'}
                    ₦{Math.abs(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Fund your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Amount Selection Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Fund Your Wallet
            </DialogTitle>
            <DialogDescription>
              Select the amount you want to add to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (min ₦1,000)"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="1000"
              />
            </div>
            
            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 25000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setFundAmount(amount.toString())}
                >
                  ₦{amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFundDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (parseFloat(fundAmount) >= 1000) {
                  setShowFundDialog(false);
                  setShowPaymentMethodDialog(true);
                }
              }} 
              disabled={!fundAmount || parseFloat(fundAmount) < 1000}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Choose Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selection Dialog */}
      <PaymentMethodDialog
        open={showPaymentMethodDialog}
        onOpenChange={setShowPaymentMethodDialog}
        amount={parseFloat(fundAmount) || 0}
        purpose="Wallet Funding"
        onPaymentSuccess={() => {
          fetchWalletData();
          setFundAmount('');
          setSuccess('Payment submitted successfully!');
        }}
      />

      {/* Cashback Withdrawal Dialog */}
      <Dialog open={showCashbackDialog} onOpenChange={setShowCashbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Withdraw Cashback
            </DialogTitle>
            <DialogDescription>
              Transfer cashback to your wallet for use in transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Available Cashback</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                ₦{(walletData?.cashback?.available_balance || 0).toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Amount to Withdraw (₦)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={walletData?.cashback?.available_balance || 0}
              />
            </div>
            
            {/* Quick amount buttons */}
            {(walletData?.cashback?.available_balance || 0) > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount(((walletData?.cashback?.available_balance || 0) / 2).toString())}
                >
                  50% (₦{((walletData?.cashback?.available_balance || 0) / 2).toLocaleString()})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount((walletData?.cashback?.available_balance || 0).toString())}
                >
                  All (₦{(walletData?.cashback?.available_balance || 0).toLocaleString()})
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCashbackDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleWithdrawCashback}
              disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (walletData?.cashback?.available_balance || 0)}
            >
              {withdrawing ? 'Processing...' : 'Withdraw to Wallet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Upgrade Plan Section Component
function UpgradePlanSection({ user, businessType = 'product' }: { user: any; businessType?: 'product' | 'service' }) {
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<{
    plans: {
      [key: string]: {
        name: string;
        price: number;
        price_monthly: number;
        price_yearly: number;
        price_quarterly: number;
        price_biyearly: number;
        yearly_savings: number;
        quarterly_savings: number;
        biyearly_savings: number;
        features: string[];
      };
    };
    current_plan: string;
    business_type: string;
    billing_cycle: string;
    expires_at: string | null;
    wallet_balance: number;
  } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'biyearly' | 'yearly'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const getBillingAmount = (plan: { price: number; price_monthly: number; price_yearly: number; price_quarterly: number; price_biyearly: number; }) => {
    if (billingCycle === 'yearly') {
      return plan.price_yearly || plan.price_monthly * 12 * 0.8;
    }
    if (billingCycle === 'quarterly') {
      return plan.price_quarterly || plan.price_monthly * 4;
    }
    if (billingCycle === 'biyearly') {
      return plan.price_biyearly || plan.price_monthly * 6;
    }
    return plan.price_monthly || plan.price;
  };
  const getBillingSuffix = () => {
    if (billingCycle === 'yearly') return '/year';
    if (billingCycle === 'quarterly') return '/4 months';
    if (billingCycle === 'biyearly') return '/6 months';
    return '/month';
  };
  const getBillingLabel = () => {
    if (billingCycle === 'biyearly') return 'Bi-yearly';
    if (billingCycle === 'quarterly') return 'Quarterly';
    if (billingCycle === 'yearly') return 'Yearly';
    return 'Monthly';
  };

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }
        const response = await fetch(`${getBaseUrl()}business/subscription/plans/?business_type=${businessType}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        } else {
          setError('Failed to load subscription plans');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [businessType]);

  const handleUpgrade = async (planKey: string) => {
    setSelectedPlan(planKey);
    setShowPaymentDialog(true);
  };

  const confirmUpgrade = async (paymentMethod: 'wallet' | 'external') => {
    if (!selectedPlan) return;
    
    setUpgrading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}business/subscription/upgrade/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billing_cycle: billingCycle,
          payment_method: paymentMethod
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        setSubscriptionData(prev => prev ? {
          ...prev,
          current_plan: selectedPlan,
          billing_cycle: billingCycle,
          expires_at: data.subscription?.expires_at,
          wallet_balance: data.wallet_balance
        } : null);
        setShowPaymentDialog(false);
      } else {
        setError(data.error || 'Failed to upgrade subscription');
        if (data.shortfall) {
          setError(`Insufficient wallet balance. You need ₦${data.shortfall.toLocaleString()} more. Please fund your wallet first.`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return <Zap className="w-6 h-6" />;
      case 'professional': return <Star className="w-6 h-6" />;
      case 'enterprise': return <Crown className="w-6 h-6" />;
      default: return <ArrowUpCircle className="w-6 h-6" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'professional': return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      case 'enterprise': return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
      default: return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Upgrade Plan</h1>
          <p className="text-muted-foreground">Choose a plan that fits your business needs</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <PageSpinner />
              <p className="text-sm text-muted-foreground">Loading subscription plans...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Upgrade Plan</h1>
        <p className="text-muted-foreground">Choose a plan that fits your business needs</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-bold capitalize">{subscriptionData?.current_plan || 'Free'}</p>
                {subscriptionData?.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(subscriptionData.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₦{(subscriptionData?.wallet_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycle Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold">Billing Cycle</h3>
              <p className="text-sm text-muted-foreground">Save 20% with yearly billing</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'quarterly' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setBillingCycle('biyearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'biyearly' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Bi-yearly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {subscriptionData?.plans && Object.entries(subscriptionData.plans).map(([key, plan]) => {
          // Plan hierarchy for comparison
          const planOrder: Record<string, number> = { 'free': 0, 'starter': 1, 'grow': 2, 'basic': 3, 'professional': 4, 'enterprise': 5 };
          const currentPlanLevel = planOrder[subscriptionData.current_plan] || 0;
          const thisPlanLevel = planOrder[key] || 0;
          const isCurrentPlan = subscriptionData.current_plan === key;
          const isLowerPlan = thisPlanLevel < currentPlanLevel;
          const isDisabled = isCurrentPlan || isLowerPlan;
          
          const getButtonText = () => {
            if (isCurrentPlan) return 'Current Plan';
            if (isLowerPlan) return 'Lower Plan';
            return 'Upgrade Now';
          };
          
          return (
          <Card 
            key={key} 
            className={`relative overflow-hidden transition-all ${
              isCurrentPlan 
                ? 'ring-2 ring-primary' 
                : 'hover:shadow-lg'
            } ${getPlanColor(key)}`}
          >
            {isCurrentPlan && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                Current
              </div>
            )}
            {billingCycle === 'yearly' && !isCurrentPlan && plan.yearly_savings > 0 && (
              <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-lg">
                Save ₦{plan.yearly_savings.toLocaleString()}
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto p-3 rounded-full mb-2 ${
                key === 'basic' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                key === 'professional' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' :
                'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
              }`}>
                {getPlanIcon(key)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                {billingCycle === 'yearly' ? (
                  <>
                    <span className="text-3xl font-bold">₦{getBillingAmount(plan).toLocaleString()}</span>
                    <span className="text-muted-foreground">{getBillingSuffix()}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="line-through">₦{(plan.price_monthly * 12).toLocaleString()}</span>
                      <span className="ml-1 text-green-600 dark:text-green-400">20% off</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">₦{getBillingAmount(plan).toLocaleString()}</span>
                    <span className="text-muted-foreground">{getBillingSuffix()}</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={isDisabled ? "outline" : "default"}
                disabled={isDisabled}
                onClick={() => handleUpgrade(key)}
              >
                {getButtonText()}
              </Button>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Upgrade to {selectedPlan && subscriptionData?.plans[selectedPlan]?.name}
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay for your subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPlan && subscriptionData?.plans[selectedPlan] && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Plan:</p>
                  <p className="font-medium">{subscriptionData.plans[selectedPlan].name}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Billing:</p>
                  <p className="font-medium">{getBillingLabel()}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Amount to pay:</p>
                  <p className="text-2xl font-bold">
                    ₦{getBillingAmount(subscriptionData.plans[selectedPlan]).toLocaleString()}
                  </p>
                </div>
                {billingCycle === 'yearly' && subscriptionData.plans[selectedPlan].yearly_savings > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 text-right mt-1">
                    You save ₦{subscriptionData.plans[selectedPlan].yearly_savings.toLocaleString()} with yearly billing!
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                className="w-full justify-start gap-3 h-auto py-4" 
                variant="outline"
                onClick={() => confirmUpgrade('wallet')}
                disabled={upgrading}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Pay from Wallet</div>
                  <p className="text-sm text-muted-foreground">
                    Balance: ₦{(subscriptionData?.wallet_balance || 0).toLocaleString()}
                  </p>
                </div>
              </Button>
              
              {/* TODO: Add external payment option later */}
              {/* <Button 
                className="w-full justify-start gap-3 h-auto py-4" 
                variant="outline"
                onClick={() => confirmUpgrade('external')}
                disabled={upgrading}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Pay with Card/Bank</div>
                  <p className="text-sm text-muted-foreground">Pay via Flutterwave</p>
                </div>
              </Button> */}
            </div>
            
            {upgrading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ButtonSpinner />
                Processing payment...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={upgrading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Referrals Section Component for Business Owners and BRM Staff
function ReferralsSection({ user, isBRM, brmStaff }: { user: any; isBRM?: boolean; brmStaff?: any }) {
  const [referralData, setReferralData] = useState<{
    referral_code: string;
    referral_link: string;
    referral_credits: number;
    total_referrals: number;
    total_earnings: number;
    pending_earnings: number;
    wallet_balance?: number;
    is_business_owner?: boolean;
    recent_referrals: Array<{
      email: string;
      name: string;
      joined_at: string;
      status: string;
      has_upgraded: boolean;
      earnings: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        // For BRM users, use the brmStaff data passed as props
        if (isBRM && brmStaff) {
          console.log('[ReferralsSection] BRM Staff data:', brmStaff);
          console.log('[ReferralsSection] BRM referral_code:', brmStaff.referral_code);
          setReferralData({
            referral_code: brmStaff.referral_code || '',
            referral_link: `https://business.henotaceai.ng/signup?ref=${brmStaff.referral_code || ''}`,
            referral_credits: 0,
            total_referrals: brmStaff.total_referrals || 0,
            total_earnings: parseFloat(brmStaff.total_referral_earnings) || 0,
            pending_earnings: parseFloat(brmStaff.pending_referral_earnings) || 0,
            wallet_balance: parseFloat(brmStaff.wallet_balance) || 0,
            is_business_owner: false,
            recent_referrals: [],
          });
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('accessToken') || localStorage.getItem('brmToken');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Use BRM wallet endpoint for BRM staff (includes referral info), referral-data for business owners
        const referralEndpoint = isBRM ? 'brm/wallet/' : 'referral-data/';
        const response = await fetch(`${getBaseUrl()}${referralEndpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform BRM wallet response to match referral data format
          if (isBRM && data.wallet) {
            setReferralData({
              referral_code: data.referral_code,
              referral_link: data.referral_link,
              referral_credits: 0,
              total_referrals: data.wallet.total_referrals || 0,
              total_earnings: data.wallet.total_earnings || 0,
              pending_earnings: data.wallet.pending_earnings || 0,
              wallet_balance: data.wallet.balance || 0,
              is_business_owner: false,
              recent_referrals: [],
            });
          } else {
            setReferralData(data);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData?.error || 'Failed to load referral data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [isBRM, brmStaff]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareReferralLink = async () => {
    if (!referralData?.referral_link) return;
    
    const shareData = {
      title: 'Join HenotaceAI Business',
      text: `Join HenotaceAI Business using my referral link and we both benefit! Sign up and upgrade to a paid plan to get started.`,
      url: referralData.referral_link
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        copyToClipboard(referralData.referral_link);
      }
    } catch (err) {
      copyToClipboard(referralData.referral_link);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Referrals</h1>
          <p className="text-muted-foreground">Earn rewards by referring friends</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <PageSpinner />
              <p className="text-sm text-muted-foreground">Loading referral data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Referrals</h1>
          <p className="text-muted-foreground">Earn rewards by referring friends</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Referrals</h1>
        <p className="text-muted-foreground">Share your unique link and earn 10% of each referred user's payment when they upgrade. Earnings go directly to your wallet!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData?.total_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₦{(referralData?.total_earnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Earnings</p>
                <p className="text-2xl font-bold">₦{(referralData?.pending_earnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">₦{(referralData?.wallet_balance || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends. When they sign up and upgrade to a paid plan, you'll earn 10% of their payment!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Referral Code</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                {referralData?.referral_code || 'Loading...'}
              </code>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralData?.referral_code || '')}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Referral Link</Label>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={referralData?.referral_link || ''} 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralData?.referral_link || '')}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Share Button */}
          <Button onClick={shareReferralLink} className="w-full sm:w-auto">
            <Share2 className="w-4 h-4 mr-2" />
            Share Referral Link
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">1. Share Your Link</h3>
              <p className="text-sm text-muted-foreground">Share your unique referral link with friends, family, or your network</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">2. They Sign Up & Upgrade</h3>
              <p className="text-sm text-muted-foreground">When they create an account and upgrade to a paid plan</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">3. You Earn 10%</h3>
              <p className="text-sm text-muted-foreground">You automatically receive 10% of their payment as a reward!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      {referralData?.recent_referrals && referralData.recent_referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>People who signed up using your referral link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralData.recent_referrals.map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{referral.name || referral.email}</p>
                      <p className="text-sm text-muted-foreground">Joined {referral.joined_at}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={referral.has_upgraded ? "default" : "secondary"}>
                      {referral.has_upgraded ? 'Upgraded' : 'Free'}
                    </Badge>
                    {referral.has_upgraded && referral.earnings > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        +₦{referral.earnings.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for No Referrals */}
      {(!referralData?.recent_referrals || referralData.recent_referrals.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="font-semibold mb-1">No Referrals Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start sharing your referral link to earn rewards!
                </p>
              </div>
              <Button onClick={shareReferralLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Theme Section Component
function ThemeSection() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    }
    return 'system';
  });

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const root = document.documentElement;
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Theme</h1>
        <p className="text-muted-foreground">Choose your preferred appearance for the application.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Select how you'd like the application to look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Light Theme */}
            <div
              onClick={() => applyTheme('light')}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Light</p>
                  <p className="text-sm text-muted-foreground">Bright and clean</p>
                </div>
                {theme === 'light' && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>

            {/* Dark Theme */}
            <div
              onClick={() => applyTheme('dark')}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-slate-800 rounded-full">
                  <Moon className="w-6 h-6 text-slate-200" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Dark</p>
                  <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                </div>
                {theme === 'dark' && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>

            {/* System Theme */}
            <div
              onClick={() => applyTheme('system')}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-slate-800 rounded-full">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-medium">System</p>
                  <p className="text-sm text-muted-foreground">Match device</p>
                </div>
                {theme === 'system' && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Customer Service Section Component
function CustomerServiceSection() {
  const faqs = [
    {
      question: "How do I upgrade my subscription plan?",
      answer: "Go to 'Upgrade Plan' in your account settings. Choose the plan that suits your business needs and pay using your wallet balance. You can fund your wallet first if needed."
    },
    {
      question: "How does the referral program work?",
      answer: "Share your unique referral link with other business owners. When they sign up and upgrade to a paid plan, you earn 10% of their subscription payment as a reward in your wallet."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept payments via Flutterwave which supports card payments, bank transfers, and mobile money. Fund your wallet first, then use it to pay for subscriptions."
    },
    {
      question: "How do I add staff to my business?",
      answer: "Go to Staff Management in your dashboard. Click 'Add Staff' and fill in their details. Note that the number of staff you can add depends on your subscription plan."
    },
    {
      question: "Can I export my business data?",
      answer: "Yes! You can export your data including products, customers, sales records, and more. Go to your dashboard and look for export options in the relevant sections."
    },
    {
      question: "How do I enable two-factor authentication?",
      answer: "Go to 'Security & Privacy' in your account settings and enable 2FA. You can use an authenticator app or biometric authentication for added security."
    },
    {
      question: "What happens when I reach my plan limits?",
      answer: "When you reach the limits of your current plan (e.g., max products or staff), you'll be prompted to upgrade to a higher plan to continue adding more."
    },
    {
      question: "How do I change my business information?",
      answer: "Go to Business Settings in your dashboard. You can update your business name, address, logo, and other details there."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Customer Service</h1>
        <p className="text-muted-foreground">Find answers to common questions or contact our support team.</p>
      </div>

      {/* Contact Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-3">For pressing issues and detailed inquiries</p>
                <a 
                  href="mailto:hello@henotaceai.ng" 
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  hello@henotaceai.ng
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">WhatsApp Support</h3>
                <p className="text-sm text-muted-foreground mb-3">Quick responses for urgent matters</p>
                <a 
                  href="https://wa.me/2349160581674" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                  +234 916 058 1674
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Still need help */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is available to assist you with any questions or issues.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:hello@henotaceai.ng', '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://wa.me/2349160581674', '_blank')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Account Section Component (Business Owners Only)
function DeleteAccountSection({ user }: { user: any }) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}business/export-data/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `business-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExportSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (!password) {
      setError('Please enter your password to confirm');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getBaseUrl()}business/delete-account/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, confirm_text: confirmText })
      });

      if (response.ok) {
        // Clear all local storage and redirect to home
        localStorage.clear();
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Delete Account</h1>
        <p className="text-muted-foreground">Export your data or permanently delete your account</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {exportSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Data exported successfully! Check your downloads folder.
        </div>
      )}

      {/* Export Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download all your business data before deleting your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will export all data related to your business including:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Business information and settings</li>
            <li>Products and inventory</li>
            <li>Customers and their transaction history</li>
            <li>Sales records and receipts</li>
            <li>Staff accounts and attendance</li>
            <li>Suppliers and purchase orders</li>
            <li>Payroll data</li>
            <li>Categories and business analytics</li>
            <li>Wallet transactions</li>
          </ul>
          <div className="pt-4">
            <Button 
              onClick={handleExportData}
              disabled={exporting}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {exporting ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data (JSON)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Once you delete your account, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              What happens when you delete your account:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
              <li>Your business profile will be permanently deleted</li>
              <li>All products, customers, and sales data will be erased</li>
              <li>Staff accounts linked to your business will be removed</li>
              <li>Your wallet balance will be forfeited</li>
              <li>Subscription will be cancelled immediately</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <div className="pt-2">
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently
            </DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Recommendation:</strong> Export your data first before deleting your account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Type <span className="font-mono font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Enter your password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your account password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setConfirmText('');
                setPassword('');
                setError(null);
              }}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== 'DELETE MY ACCOUNT' || !password}
              className="w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}