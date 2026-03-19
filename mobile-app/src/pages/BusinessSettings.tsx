import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut, apiPost, getAppBaseUrl } from "@/lib/api";
import { ArrowLeft, Save, Building2, CreditCard, Bell, Link2, Copy, ExternalLink, Check, Globe, Facebook, Instagram, Twitter, Download, QrCode, Palette, MapPin, Truck, UserCog, Send, MessageSquare, Phone, Mail, Warehouse, Sparkles, Trash2, Plus, ChevronDown, Square, Eye, Package, Wrench, Briefcase, ShoppingBag, Settings, CheckCircle, GraduationCap, BarChart3, Sprout } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BranchManagement from "@/components/BranchManagement";
import StoreManagement from "@/components/StoreManagement";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Nigerian States for tax compliance
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// VAT Constants
const VAT_RATE = 0.075; // 7.5%
const VAT_THRESHOLD = 100000000; // ₦100 million annual turnover

// VAT Exempt Product Categories
const VAT_EXEMPT_PRODUCT_CATEGORIES = [
  { value: 'basic_food', label: 'Basic Food Items', description: 'Fruits, vegetables, grains, tubers (unprocessed)' },
  { value: 'agricultural', label: 'Agricultural Products', description: 'Farm produce, livestock, fishery' },
  { value: 'baby_products', label: 'Baby Products', description: 'Baby food, diapers, infant formula' },
  { value: 'books', label: 'Books & Educational Materials', description: 'Textbooks, newspapers, journals' },
  { value: 'medical_products', label: 'Medical & Pharmaceutical', description: 'Medicine, medical equipment' },
  { value: 'export_goods', label: 'Export Goods', description: 'Products exported outside Nigeria' },
];

// VAT Taxable Product Categories
const VAT_TAXABLE_PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics & Appliances', description: 'Phones, computers, home appliances' },
  { value: 'clothing', label: 'Clothing & Fashion', description: 'Apparel, footwear, accessories' },
  { value: 'processed_food', label: 'Processed Food & Beverages', description: 'Packaged food, drinks, snacks' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty', description: 'Skincare, makeup, perfumes' },
  { value: 'furniture', label: 'Furniture & Home Decor', description: 'Household items, decor' },
  { value: 'auto_parts', label: 'Auto Parts & Accessories', description: 'Vehicle parts, accessories' },
  { value: 'building_materials', label: 'Building Materials', description: 'Construction materials' },
  { value: 'general_retail', label: 'General Retail', description: 'Other retail goods' },
];

// VAT Exempt Service Categories
const VAT_EXEMPT_SERVICE_CATEGORIES = [
  { value: 'medical_services', label: 'Medical & Healthcare', description: 'Hospitals, clinics, medical consultations' },
  { value: 'education_services', label: 'Educational Services', description: 'Schools, universities, training' },
  { value: 'financial_services', label: 'Financial Services', description: 'Banking, insurance, pension' },
  { value: 'export_services', label: 'Export Services', description: 'Services rendered outside Nigeria' },
];

// VAT Taxable Service Categories
const VAT_TAXABLE_SERVICE_CATEGORIES = [
  { value: 'professional', label: 'Professional Services', description: 'Legal, accounting, consulting' },
  { value: 'hospitality', label: 'Hospitality & Events', description: 'Hotels, restaurants, event planning' },
  { value: 'telecom', label: 'Telecommunications', description: 'Phone, internet services' },
  { value: 'transport', label: 'Transportation & Logistics', description: 'Shipping, delivery, logistics' },
  { value: 'construction', label: 'Construction Services', description: 'Building, renovation' },
  { value: 'technology', label: 'Technology & IT Services', description: 'Software, IT support, web services' },
  { value: 'real_estate', label: 'Real Estate Services', description: 'Property management, rentals' },
  { value: 'beauty_services', label: 'Beauty & Spa Services', description: 'Salon, spa, grooming' },
  { value: 'cleaning', label: 'Cleaning & Maintenance', description: 'Janitorial, facility maintenance' },
  { value: 'general_services', label: 'General Services', description: 'Other taxable services' },
];

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function BusinessSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [qrDownloadCooldown, setQrDownloadCooldown] = useState(false);
  const [qrDownloadCount, setQrDownloadCount] = useState(0);
  const QR_DOWNLOAD_LIMIT = 5; // Max downloads per session
  const QR_COOLDOWN_MS = 10000; // 10 seconds between downloads
  
  // Get tab from URL params
  const initialTab = searchParams.get('tab') || 'business-type';
  const initialSection = searchParams.get('section');
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Business Type Settings (like traditional/online school toggle)
  const [businessTypeSettings, setBusinessTypeSettings] = useState({
    business_category: "product_based",
    product_based_enabled: true,
    service_based_enabled: false,
  });
  
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    slug: "",
    business_type: "",
    registration_type: "business_name", // business_name or registered_company
    registration_number: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
  });

  const [publicStoreInfo, setPublicStoreInfo] = useState({
    about_us: "",
    faqs: "",
    shipping_info: "",
    returns_policy: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    tiktok_url: "",
  });

  const [paymentSettings, setPaymentSettings] = useState({
    preferred_payment_gateway: "flutterwave",
    paystack_public_key: "",
    paystack_secret_key: "",
    flutterwave_public_key: "",
    flutterwave_secret_key: "",
    opay_merchant_id: "",
    opay_public_key: "",
    opay_secret_key: "",
    moniepoint_merchant_id: "",
    moniepoint_api_key: "",
    moniepoint_secret_key: "",
    // Stripe for international payments
    stripe_publishable_key: "",
    stripe_secret_key: "",
    stripe_test_publishable_key: "",
    stripe_test_secret_key: "",
    stripe_webhook_secret: "",
    stripe_is_live: false,
  });

  const [bankAccountSettings, setBankAccountSettings] = useState({
    manual_payment_bank_name: "",
    manual_payment_account_number: "",
    manual_payment_account_name: "",
    bank_transfer_enabled: false,
    pay_on_delivery_enabled: false,
    buy_on_credit_enabled: true,
  });

  const [deliverySettings, setDeliverySettings] = useState({
    delivery_enabled: false,
    free_delivery_threshold: "",
    delivery_radius_km: 50,
    shipping_enabled: false,
  });

  // Custom Domain Settings (Grow plan and above)
  const [customDomainSettings, setCustomDomainSettings] = useState({
    custom_domain: "",
    custom_domain_verified: false,
    custom_domain_ssl_issued: false,
  });
  
  // State of residence & Owner Salary for PAYE
  const [taxSettings, setTaxSettings] = useState({
    state_of_residence: "",
    owner_annual_salary: "",
  });
  
  // VAT Settings
  const [vatSettings, setVatSettings] = useState({
    vat_business_type: "", // 'product' or 'service'
    vat_product_category: "",
    vat_service_category: "",
    is_vat_registered: false,
    vat_number: "",
  });

  const [agroSettings, setAgroSettings] = useState({
    agro_harvest_season_name: "",
    agro_harvest_start_month: "",
    agro_harvest_end_month: "",
    agro_farmlands: [] as Array<{ name: string; location: string; size: string; crop: string }>,
  });
  
  // Analytics Settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    google_analytics_id: "",
    google_analytics_enabled: false,
    google_ads_id: "",
    google_ads_conversion_id: "",
    google_ads_enabled: false,
    facebook_pixel_id: "",
    facebook_pixel_enabled: false,
    facebook_access_token: "",
    facebook_test_event_code: "",
    tiktok_pixel_id: "",
    tiktok_pixel_enabled: false,
  });
  
  // Tax section collapsible states
  const [payeOpen, setPayeOpen] = useState(false);
  const [vatOpen, setVatOpen] = useState(false);
  const [agroOpen, setAgroOpen] = useState(true);
  
  // Collapsible states for Product-based business sections
  const [storeUrlOpen, setStoreUrlOpen] = useState(false);
  const [publicInfoOpen, setPublicInfoOpen] = useState(false);
  const [storeAppearanceOpen, setStoreAppearanceOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);

  const [storeAppearance, setStoreAppearance] = useState({
    primary_color: "#3b82f6",
    secondary_color: "#1f2937",
    navbar_color: "#111827",
    footer_color: "#111827",
    text_color: "#ffffff",
    font_size: "medium",
    button_style: "rounded",
  });

  const [storeFeatures, setStoreFeatures] = useState({
    hero_slider_enabled: false,
    hero_slider_images: [] as { url: string; alt: string; link: string }[],
    flash_sales_enabled: false,
    top_sellers_enabled: false,
    top_sellers_count: 8,
    show_pos_button: true,
  });

  // Collapsible state for Store Appearance sections
  const [openSections, setOpenSections] = useState({
    colors: true,
    buttonStyle: false,
    preview: false,
    presets: false,
    storeFeatures: true,
    preferredGateway: true,
    bankTransfer: false,
  });

  // Analytics tab collapsible states
  const [googleAnalyticsOpen, setGoogleAnalyticsOpen] = useState(true);
  const [googleAdsOpen, setGoogleAdsOpen] = useState(false);
  const [facebookPixelOpen, setFacebookPixelOpen] = useState(false);
  const [tiktokPixelOpen, setTiktokPixelOpen] = useState(false);
  const [canAccessSettings, setCanAccessSettings] = useState<boolean | null>(null);

  // BRM Support State
  const [brmManager, setBrmManager] = useState<any>(null);
  const [hasManager, setHasManager] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    message: '',
    type: 'general',
    priority: 'normal',
  });
  const [sendingComplaint, setSendingComplaint] = useState(false);

  // Support tab collapsible states
  const [professionalServicesOpen, setProfessionalServicesOpen] = useState(true);
  const [customDomainOpen, setCustomDomainOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);
  const [brmOpen, setBrmOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      setCanAccessSettings(false);
      toast({ title: 'Access denied', description: 'Staff cannot access account settings', variant: 'destructive' });
      navigate('/business-staff-dashboard');
    } else {
      setCanAccessSettings(true);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (!canAccessSettings) return;
    loadBusinessSettings();
    loadBRMInfo();
  }, [canAccessSettings]);

  const loadBRMInfo = async () => {
    try {
      const [managerData, complaintsData] = await Promise.all([
        apiGet('business/my-manager/'),
        apiGet('business/complaints/'),
      ]);
      
      if (managerData.success) {
        setHasManager(managerData.has_manager);
        setBrmManager(managerData.manager);
      }
      
      if (complaintsData.success) {
        setComplaints(complaintsData.complaints || []);
      }
    } catch (error) {
      console.error('Error loading BRM info:', error);
    }
  };

  const handleSendComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject and message',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSendingComplaint(true);
      const result = await apiPost('business/complaints/send/', newComplaint) as any;
      
      if (result.success) {
        toast({
          title: 'Message Sent',
          description: `Your message has been sent to ${result.manager_name}`,
        });
        setNewComplaint({ subject: '', message: '', type: 'general', priority: 'normal' });
        loadBRMInfo(); // Refresh complaints list
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSendingComplaint(false);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      setIsLoading(true);
      // Use the business/update endpoint for both GET and PUT
      const data = await apiGet('business/update/');
      if (data.success && data.business) {
        setBusiness(data.business);
        setBusinessInfo({
          name: data.business.name || "",
          slug: data.business.slug || "",
          business_type: data.business.business_type || "",
          registration_type: data.business.registration_type || "business_name",
          registration_number: data.business.registration_number || "",
          tax_id: data.business.tax_id || "",
          address: data.business.address || "",
          phone: data.business.phone || "",
          email: data.business.email || "",
        });
        setPublicStoreInfo({
          about_us: data.business.about_us || "",
          faqs: data.business.faqs || "",
          shipping_info: data.business.shipping_info || "",
          returns_policy: data.business.returns_policy || "",
          facebook_url: data.business.facebook_url || "",
          instagram_url: data.business.instagram_url || "",
          twitter_url: data.business.twitter_url || "",
          tiktok_url: data.business.tiktok_url || "",
        });
        setPaymentSettings({
          preferred_payment_gateway: data.business.preferred_payment_gateway || "flutterwave",
          paystack_public_key: data.business.paystack_public_key || "",
          paystack_secret_key: data.business.paystack_secret_key || "",
          flutterwave_public_key: data.business.flutterwave_public_key || "",
          flutterwave_secret_key: data.business.flutterwave_secret_key || "",
          opay_merchant_id: data.business.opay_merchant_id || "",
          opay_public_key: data.business.opay_public_key || "",
          opay_secret_key: data.business.opay_secret_key || "",
          moniepoint_merchant_id: data.business.moniepoint_merchant_id || "",
          moniepoint_api_key: data.business.moniepoint_api_key || "",
          moniepoint_secret_key: data.business.moniepoint_secret_key || "",
          // Stripe for international payments
          stripe_publishable_key: data.business.stripe_publishable_key || "",
          stripe_secret_key: data.business.stripe_secret_key || "",
          stripe_test_publishable_key: data.business.stripe_test_publishable_key || "",
          stripe_test_secret_key: data.business.stripe_test_secret_key || "",
          stripe_webhook_secret: data.business.stripe_webhook_secret || "",
          stripe_is_live: data.business.stripe_is_live || false,
        });
        setDeliverySettings({
          delivery_enabled: data.business.delivery_enabled || false,
          free_delivery_threshold: data.business.free_delivery_threshold || "",
          delivery_radius_km: data.business.delivery_radius_km || 50,
          shipping_enabled: data.business.shipping_enabled || false,
        });
        setBankAccountSettings({
          manual_payment_bank_name: data.business.manual_payment_bank_name || "",
          manual_payment_account_number: data.business.manual_payment_account_number || "",
          manual_payment_account_name: data.business.manual_payment_account_name || "",
          bank_transfer_enabled: data.business.bank_transfer_enabled ?? (data.business.manual_payment_account_number ? true : false),
          pay_on_delivery_enabled: data.business.pay_on_delivery_enabled ?? false,
          buy_on_credit_enabled: data.business.buy_on_credit_enabled ?? true,
        });
        setStoreAppearance({
          primary_color: data.business.primary_color || "#3b82f6",
          secondary_color: data.business.secondary_color || "#1f2937",
          navbar_color: data.business.navbar_color || "#111827",
          footer_color: data.business.footer_color || "#111827",
          text_color: data.business.text_color || "#ffffff",
          font_size: data.business.font_size || "medium",
          button_style: data.business.button_style || "rounded",
        });
        setStoreFeatures({
          hero_slider_enabled: data.business.hero_slider_enabled ?? false,
          hero_slider_images: data.business.hero_slider_images || [],
          flash_sales_enabled: data.business.flash_sales_enabled ?? false,
          top_sellers_enabled: data.business.top_sellers_enabled ?? false,
          top_sellers_count: data.business.top_sellers_count || 8,
          show_pos_button: data.business.show_pos_button ?? true,
        });
        // Business Type Settings
        setBusinessTypeSettings({
          business_category: data.business.business_category || "product_based",
          product_based_enabled: data.business.product_based_enabled ?? true,
          service_based_enabled: data.business.service_based_enabled ?? false,
        });
        // Custom Domain Settings
        setCustomDomainSettings({
          custom_domain: data.business.custom_domain || "",
          custom_domain_verified: data.business.custom_domain_verified ?? false,
          custom_domain_ssl_issued: data.business.custom_domain_ssl_issued ?? false,
        });
        // Tax Settings
        setTaxSettings({
          state_of_residence: data.business.state_of_residence || "",
          owner_annual_salary: data.business.owner_annual_salary ? String(data.business.owner_annual_salary) : "",
        });
        // VAT Settings
        setVatSettings({
          vat_business_type: data.business.vat_business_type || "",
          vat_product_category: data.business.vat_product_category || "",
          vat_service_category: data.business.vat_service_category || "",
          is_vat_registered: data.business.is_vat_registered ?? false,
          vat_number: data.business.vat_number || "",
        });
        setAgroSettings({
          agro_harvest_season_name: data.business.agro_harvest_season_name || "",
          agro_harvest_start_month: data.business.agro_harvest_start_month ? String(data.business.agro_harvest_start_month) : "",
          agro_harvest_end_month: data.business.agro_harvest_end_month ? String(data.business.agro_harvest_end_month) : "",
          agro_farmlands: Array.isArray(data.business.agro_farmlands) ? data.business.agro_farmlands : [],
        });
        // Analytics Settings
        setAnalyticsSettings({
          google_analytics_id: data.business.google_analytics_id || "",
          google_analytics_enabled: data.business.google_analytics_enabled ?? false,
          google_ads_id: data.business.google_ads_id || "",
          google_ads_conversion_id: data.business.google_ads_conversion_id || "",
          google_ads_enabled: data.business.google_ads_enabled ?? false,
          facebook_pixel_id: data.business.facebook_pixel_id || "",
          facebook_pixel_enabled: data.business.facebook_pixel_enabled ?? false,
          facebook_access_token: data.business.facebook_access_token || "",
          facebook_test_event_code: data.business.facebook_test_event_code || "",
          tiktok_pixel_id: data.business.tiktok_pixel_id || "",
          tiktok_pixel_enabled: data.business.tiktok_pixel_enabled ?? false,
        });
        // Cache business data for AgroProductionDashboard to reuse (avoids extra API call)
        try {
          localStorage.setItem('_businessDataCache', JSON.stringify({ ts: Date.now(), data: data.business }));
        } catch {}
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL params for opening specific sections
  useEffect(() => {
    if (initialSection === 'tax-compliance') {
      setPayeOpen(true);
      setVatOpen(true);
    }
  }, [initialSection]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await apiPut('business/update/', {
        ...businessInfo,
        ...publicStoreInfo,
        ...paymentSettings,
        ...bankAccountSettings,
        ...storeAppearance,
        ...storeFeatures,
        ...businessTypeSettings,
        ...customDomainSettings,
        ...taxSettings,
        ...vatSettings,
        ...agroSettings,
        ...analyticsSettings,
        ...deliverySettings,
      });
      
      if (response.success) {
        if (response.business) {
          localStorage.setItem('business_name', response.business.name || '');
          localStorage.setItem('business_slug', response.business.slug || '');
          localStorage.setItem('business_category', response.business.business_category || businessTypeSettings.business_category || '');
          localStorage.setItem('business_type', (response.business as any)?.business_type || localStorage.getItem('business_type') || '');
        }
        toast({
          title: "Success",
          description: response.business?.slug 
            ? `Settings saved! Your store URL is: /store/${response.business.slug}`
            : "Settings saved successfully"
        });
        // Reload settings to confirm save
        await loadBusinessSettings();
        if ((response.business?.business_category || businessTypeSettings.business_category) === 'agro_production') {
          navigate('/business-admin-dashboard', { replace: true });
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to save settings",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Business Settings</h1>
            <p className="text-muted-foreground">Configure your business and payment settings</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-2 h-auto p-2 border rounded-lg bg-muted/50 mb-4">
            <TabsTrigger value="business-type" className="text-xs sm:text-sm">
              <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
              Business Type
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs sm:text-sm">
              <Building2 className="w-4 h-4 mr-1 sm:mr-2" />
              Business Info
            </TabsTrigger>
            <TabsTrigger value="branches" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="stores" className="text-xs sm:text-sm">
              <Warehouse className="w-4 h-4 mr-1 sm:mr-2" />
              Stores
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
              Analytics & Ads
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs sm:text-sm">
              <UserCog className="w-4 h-4 mr-1 sm:mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Business Type Tab - Toggle between Product-based and Service-based */}
          <TabsContent value="business-type">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Business Type Configuration
                </CardTitle>
                <CardDescription>
                  Select your business type. You can only choose one type at a time, but you can switch between them anytime.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product-Based Business Option */}
                <div 
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30'
                      : 'border-border hover:border-blue-300'
                  }`}
                  onClick={() => setBusinessTypeSettings({
                    product_based_enabled: true,
                    service_based_enabled: false,
                    business_category: "product_based"
                  })}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled
                        ? 'bg-blue-500' : 'bg-muted'
                    }`}>
                      <Package className={`w-6 h-6 ${
                        businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled
                          ? 'text-white' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg mb-1">Product-Based Business</h3>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled
                            ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground'
                        }`}>
                          {businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Sell physical or digital products. This activates inventory management, 
                        product catalog, POS system, and the public store for customers to browse and buy products.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          📦 Product Catalog
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          🛒 POS System
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          📊 Inventory
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          🏪 Public Store
                        </span>
                      </div>
                    </div>
                  </div>
                  {businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled && (
                    <div className="mt-4 p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-sm flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Your public store URL: <code className="bg-background px-2 py-0.5 rounded">/store/{businessInfo.slug || 'your-business'}</code>
                      </p>
                    </div>
                  )}
                </div>

                {/* Agro Production Business Option */}
                <div
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    businessTypeSettings.business_category === 'agro_production'
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/30 dark:to-lime-950/30'
                      : 'border-border hover:border-emerald-300'
                  }`}
                  onClick={() => setBusinessTypeSettings({
                    product_based_enabled: true,
                    service_based_enabled: false,
                    business_category: 'agro_production'
                  })}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${businessTypeSettings.business_category === 'agro_production' ? 'bg-emerald-500' : 'bg-muted'}`}>
                      <Package className={`w-6 h-6 ${businessTypeSettings.business_category === 'agro_production' ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg mb-1">Agro Production</h3>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          businessTypeSettings.business_category === 'agro_production'
                            ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'
                        }`}>
                          {businessTypeSettings.business_category === 'agro_production' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        For farms and agricultural operations. Track farm inputs, labour, equipment, harvest sales, and monthly/annual P&L.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">🌾 Farm Inputs</span>
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">🚜 Equipment & Labour</span>
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">📦 Harvest Sales</span>
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">📈 Monthly/Annual P&L</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service-Based Business Option */}
                <div 
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30'
                      : 'border-border hover:border-purple-300'
                  }`}
                  onClick={() => setBusinessTypeSettings({
                    product_based_enabled: false,
                    service_based_enabled: true,
                    business_category: "service_based"
                  })}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled
                        ? 'bg-purple-500' : 'bg-muted'
                    }`}>
                      <Wrench className={`w-6 h-6 ${
                        businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled
                          ? 'text-white' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg mb-1">Service-Based Business</h3>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled
                            ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
                        }`}>
                          {businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Offer services (consulting, repairs, training, etc.). This activates 
                        service catalog, team showcase, testimonials, and a dedicated service website you can share with clients.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          🔧 Service Catalog
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          👥 Team Showcase
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          ⭐ Testimonials
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          📧 Inquiry Form
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          🌐 Public Website
                        </span>
                      </div>
                    </div>
                  </div>
                  {businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg">
                        <p className="text-sm flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          Your service website URL: <code className="bg-background px-2 py-0.5 rounded">/services/{businessInfo.slug || 'your-business'}</code>
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/service-settings')}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Service Website Settings
                      </Button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Current Configuration</h4>
                  <div className="flex flex-wrap gap-2">
                    {businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled && (
                      <span className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium">
                        📦 Product-Based Business
                      </span>
                    )}
                    {businessTypeSettings.business_category === 'agro_production' && (
                      <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm font-medium">
                        🌾 Agro Production
                      </span>
                    )}
                    {businessTypeSettings.service_based_enabled && !businessTypeSettings.product_based_enabled && (
                      <span className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-medium">
                        🔧 Service-Based Business
                      </span>
                    )}
                    {!businessTypeSettings.product_based_enabled && !businessTypeSettings.service_based_enabled && (
                      <span className="px-3 py-1.5 bg-gray-500 text-white rounded-full text-sm font-medium">
                        ⚠️ No business type selected - Please select one
                      </span>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Business Type Settings"}
                </Button>

                {/* Product-Based Business Settings - Collapsibles */}
                {businessTypeSettings.product_based_enabled && businessTypeSettings.business_category !== 'agro_production' && (
                  <div className="mt-8 space-y-4">
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        Product Store Settings
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure your online store settings for product-based business
                      </p>
                    </div>

                    {/* Store URL Collapsible */}
                    <Collapsible open={storeUrlOpen} onOpenChange={setStoreUrlOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Link2 className="w-5 h-5 text-blue-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Store URL & QR Code</h4>
                            <p className="text-sm text-muted-foreground">Your public store URL and QR code</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${storeUrlOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <Card>
                          <CardContent className="pt-6 space-y-6">
                            {/* Current Store URL */}
                            <div className="bg-muted/50 p-6 rounded-lg border">
                              <Label className="text-sm font-medium mb-2 block">Your Store URL</Label>
                              {businessInfo.slug ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={`${getAppBaseUrl()}/store/${businessInfo.slug}`}
                                    readOnly
                                    className="flex-1 bg-background font-mono"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${getAppBaseUrl()}/store/${businessInfo.slug}`);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                      toast({
                                        title: "Copied!",
                                        description: "Store URL copied to clipboard"
                                      });
                                    }}
                                  >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => window.open(`/store/${businessInfo.slug}`, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No store URL yet. Set your custom URL in Business Info tab.
                                </p>
                              )}
                            </div>

                            {/* QR Code Section */}
                            {businessInfo.slug && (
                              <div className="bg-muted/50 p-6 rounded-lg border">
                                <div className="flex items-start gap-2 mb-4">
                                  <QrCode className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <h4 className="font-medium">Store QR Code</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Print this QR code and place it in your store.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                  <div className="bg-white p-4 rounded-lg shadow-sm border" id="qr-code-container-business-type">
                                    <QRCodeSVG
                                      value={`${getAppBaseUrl()}/store/${businessInfo.slug}`}
                                      size={150}
                                      level="H"
                                      includeMargin={true}
                                      bgColor="#ffffff"
                                      fgColor="#000000"
                                    />
                                    <p className="text-center text-xs text-gray-500 mt-2 font-mono">
                                      {businessInfo.slug}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(`/store/${businessInfo.slug}`, '_blank')}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Store
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Public Store Info Collapsible */}
                    <Collapsible open={publicInfoOpen} onOpenChange={setPublicInfoOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-green-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Public Store Info</h4>
                            <p className="text-sm text-muted-foreground">About, FAQs, shipping, and returns</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${publicInfoOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <Card>
                          <CardContent className="pt-6 space-y-6">
                            <div>
                              <Label htmlFor="about_us_collapsed">About Us</Label>
                              <Textarea
                                id="about_us_collapsed"
                                value={publicStoreInfo.about_us}
                                onChange={(e) => setPublicStoreInfo({...publicStoreInfo, about_us: e.target.value})}
                                placeholder="Tell customers about your business..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="shipping_info_collapsed">Shipping Info</Label>
                              <Textarea
                                id="shipping_info_collapsed"
                                value={publicStoreInfo.shipping_info}
                                onChange={(e) => setPublicStoreInfo({...publicStoreInfo, shipping_info: e.target.value})}
                                placeholder="Your shipping policies..."
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="returns_policy_collapsed">Returns Policy</Label>
                              <Textarea
                                id="returns_policy_collapsed"
                                value={publicStoreInfo.returns_policy}
                                onChange={(e) => setPublicStoreInfo({...publicStoreInfo, returns_policy: e.target.value})}
                                placeholder="Your return and refund policies..."
                                rows={2}
                              />
                            </div>
                            <Button onClick={handleSave} disabled={isLoading} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save Public Info
                            </Button>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Store Appearance Collapsible */}
                    <Collapsible open={storeAppearanceOpen} onOpenChange={setStoreAppearanceOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Palette className="w-5 h-5 text-purple-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Store Appearance</h4>
                            <p className="text-sm text-muted-foreground">Colors, fonts, visual style and store features</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${storeAppearanceOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <Card>
                          <CardContent className="pt-6 space-y-6">
                            {/* Colors Section */}
                            <div>
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Colors
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="primary_color">Primary Color</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="color"
                                      id="primary_color"
                                      value={storeAppearance.primary_color}
                                      onChange={(e) => setStoreAppearance({...storeAppearance, primary_color: e.target.value})}
                                      className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={storeAppearance.primary_color}
                                      onChange={(e) => setStoreAppearance({...storeAppearance, primary_color: e.target.value})}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="secondary_color">Secondary Color</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="color"
                                      id="secondary_color"
                                      value={storeAppearance.secondary_color}
                                      onChange={(e) => setStoreAppearance({...storeAppearance, secondary_color: e.target.value})}
                                      className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={storeAppearance.secondary_color}
                                      onChange={(e) => setStoreAppearance({...storeAppearance, secondary_color: e.target.value})}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Button Style Section */}
                            <div>
                              <h5 className="font-medium mb-3">Button Style</h5>
                              <Select
                                value={storeAppearance.button_style}
                                onValueChange={(value) => setStoreAppearance({...storeAppearance, button_style: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="rounded">Rounded</SelectItem>
                                  <SelectItem value="square">Square</SelectItem>
                                  <SelectItem value="pill">Pill</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Store Features Section */}
                            <div className="border-t pt-4">
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Store Features
                              </h5>
                              <div className="space-y-4">
                                {/* Hero Slider */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <Label className="font-medium">Hero Slider</Label>
                                    <p className="text-xs text-muted-foreground">Display a rotating image carousel on your store homepage</p>
                                  </div>
                                  <Switch
                                    checked={storeFeatures.hero_slider_enabled}
                                    onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, hero_slider_enabled: checked})}
                                  />
                                </div>

                                {/* Slider Images Upload - show only when slider is enabled */}
                                {storeFeatures.hero_slider_enabled && (
                                  <div className="ml-4 p-4 border rounded-lg bg-background">
                                    <Label className="block mb-2 font-medium">Banner Slides</Label>
                                    <p className="text-xs text-muted-foreground mb-3">
                                      Recommended size: 1920×600 pixels (3.2:1 ratio). Max 5MB per image.
                                    </p>
                                    <div className="space-y-3">
                                      {storeFeatures.hero_slider_images.map((image: { url: string; alt: string; link: string }, index: number) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                          <div className="flex items-start gap-3">
                                            {image.url && (
                                              <img src={image.url} alt={image.alt || `Slide ${index + 1}`} className="w-24 h-16 object-cover rounded" />
                                            )}
                                            <div className="flex-1 space-y-2">
                                              {/* File Upload Option */}
                                              <div className="flex gap-2 items-center">
                                                <Input
                                                  type="file"
                                                  accept="image/*"
                                                  className="text-sm flex-1"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    
                                                    // Validate size (5MB max)
                                                    if (file.size > 5 * 1024 * 1024) {
                                                      toast({ title: "Error", description: "File too large. Maximum size is 5MB", variant: "destructive" });
                                                      return;
                                                    }
                                                    
                                                    // Upload file
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    
                                                    try {
                                                      const data = await apiPost('business/image-upload/', formData);
                                                      if (data.success && data.url) {
                                                        const newImages = [...storeFeatures.hero_slider_images];
                                                        newImages[index] = { ...newImages[index], url: data.url };
                                                        setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                                        toast({ title: "Success", description: "Image uploaded successfully" });
                                                      } else {
                                                        toast({ title: "Error", description: data.error || "Failed to upload image", variant: "destructive" });
                                                      }
                                                    } catch (error) {
                                                      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                                                    }
                                                  }}
                                                />
                                                <span className="text-xs text-muted-foreground">or</span>
                                              </div>
                                              {/* URL Input Option */}
                                              <Input
                                                value={image.url || ''}
                                                onChange={(e) => {
                                                  const newImages = [...storeFeatures.hero_slider_images];
                                                  newImages[index] = { ...newImages[index], url: e.target.value };
                                                  setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                                }}
                                                placeholder="Paste image URL (https://...)"
                                                className="text-sm"
                                              />
                                              <div className="flex gap-2">
                                                <Input
                                                  value={image.alt || ''}
                                                  onChange={(e) => {
                                                    const newImages = [...storeFeatures.hero_slider_images];
                                                    newImages[index] = { ...newImages[index], alt: e.target.value };
                                                    setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                                  }}
                                                  placeholder="Alt text (e.g., Sale Banner)"
                                                  className="text-sm flex-1"
                                                />
                                                <Input
                                                  value={image.link || ''}
                                                  onChange={(e) => {
                                                    const newImages = [...storeFeatures.hero_slider_images];
                                                    newImages[index] = { ...newImages[index], link: e.target.value };
                                                    setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                                  }}
                                                  placeholder="Link URL (optional)"
                                                  className="text-sm flex-1"
                                                />
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const newImages = storeFeatures.hero_slider_images.filter((_: { url: string; alt: string; link: string }, i: number) => i !== index);
                                                setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                              }}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                      {storeFeatures.hero_slider_images.length < 5 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setStoreFeatures({
                                              ...storeFeatures,
                                              hero_slider_images: [...storeFeatures.hero_slider_images, { url: '', alt: '', link: '' }]
                                            });
                                          }}
                                          className="w-full"
                                        >
                                          <Plus className="w-4 h-4 mr-2" /> Add Banner Slide
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Flash Sales */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <Label className="font-medium">Flash Sales</Label>
                                    <p className="text-xs text-muted-foreground">Enable flash sale features with countdown timers</p>
                                  </div>
                                  <Switch
                                    checked={storeFeatures.flash_sales_enabled}
                                    onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, flash_sales_enabled: checked})}
                                  />
                                </div>

                                {/* Top Sellers */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <Label className="font-medium">Top Sellers Section</Label>
                                    <p className="text-xs text-muted-foreground">Show your best-selling products on the homepage</p>
                                  </div>
                                  <Switch
                                    checked={storeFeatures.top_sellers_enabled}
                                    onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, top_sellers_enabled: checked})}
                                  />
                                </div>
                                {storeFeatures.top_sellers_enabled && (
                                  <div className="ml-4">
                                    <Label>Number of Top Sellers to Show</Label>
                                    <Input
                                      type="number"
                                      min="4"
                                      max="20"
                                      value={storeFeatures.top_sellers_count}
                                      onChange={(e) => setStoreFeatures({...storeFeatures, top_sellers_count: parseInt(e.target.value) || 8})}
                                      className="w-24"
                                    />
                                  </div>
                                )}

                                {/* POS Quick Buy Button */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <Label className="font-medium">POS Quick Buy Button</Label>
                                    <p className="text-xs text-muted-foreground">Show a "Buy Now" quick purchase button for POS mode</p>
                                  </div>
                                  <Switch
                                    checked={storeFeatures.show_pos_button}
                                    onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, show_pos_button: checked})}
                                  />
                                </div>
                              </div>
                            </div>

                            <Button onClick={handleSave} disabled={isLoading} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save Appearance & Features
                            </Button>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Delivery Settings Collapsible */}
                    <Collapsible open={deliveryOpen} onOpenChange={setDeliveryOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-orange-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Delivery Settings</h4>
                            <p className="text-sm text-muted-foreground">Delivery options and zones</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${deliveryOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <Card>
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Enable Delivery</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to select delivery</p>
                              </div>
                              <Switch
                                checked={deliverySettings.delivery_enabled}
                                onCheckedChange={(checked) => setDeliverySettings({...deliverySettings, delivery_enabled: checked})}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Enable Shipping</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to track shipments</p>
                              </div>
                              <Switch
                                checked={deliverySettings.shipping_enabled}
                                onCheckedChange={(checked) => setDeliverySettings({...deliverySettings, shipping_enabled: checked})}
                              />
                            </div>
                            {deliverySettings.delivery_enabled && (
                              <>
                                <div>
                                  <Label>Free Delivery Threshold (₦)</Label>
                                  <Input
                                    type="number"
                                    value={deliverySettings.free_delivery_threshold}
                                    onChange={(e) => setDeliverySettings({...deliverySettings, free_delivery_threshold: e.target.value})}
                                    placeholder="e.g., 10000"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">Orders above this amount get free delivery</p>
                                </div>
                                <div>
                                  <Label>Delivery Radius (km)</Label>
                                  <Input
                                    type="number"
                                    value={deliverySettings.delivery_radius_km}
                                    onChange={(e) => setDeliverySettings({...deliverySettings, delivery_radius_km: parseInt(e.target.value) || 50})}
                                    placeholder="e.g., 50"
                                  />
                                </div>
                              </>
                            )}
                            {deliverySettings.shipping_enabled && (
                              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <p className="text-sm flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                  Your tracking URL: <code className="bg-background px-2 py-0.5 rounded">/track/{'{tracking-code}'}</code>
                                </p>
                              </div>
                            )}
                            <Button onClick={handleSave} disabled={isLoading} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save Delivery Settings
                            </Button>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Branches Collapsible */}
                    <Collapsible open={branchesOpen} onOpenChange={setBranchesOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-red-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Branches</h4>
                            <p className="text-sm text-muted-foreground">Manage your business branches</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${branchesOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <BranchManagement />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Stores Collapsible */}
                    <Collapsible open={storesOpen} onOpenChange={setStoresOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Warehouse className="w-5 h-5 text-indigo-500" />
                          <div className="text-left">
                            <h4 className="font-medium">Stores / Warehouses</h4>
                            <p className="text-sm text-muted-foreground">Manage inventory locations</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${storesOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <StoreManagement />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Quick Access</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('branches')}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Open Branches
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('stores')}>
                      <Warehouse className="w-4 h-4 mr-2" />
                      Open Stores / Create Store
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Registration Type</Label>
                    <Select
                      value={businessInfo.registration_type}
                      onValueChange={(value) => setBusinessInfo({...businessInfo, registration_type: value, registration_number: ""})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select registration type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_name">Business Name</SelectItem>
                        <SelectItem value="registered_company">Registered Company (RC)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {businessInfo.registration_type === "registered_company" 
                        ? "For CAC registered companies with RC number" 
                        : "For businesses registered with CAC Business Name"}
                    </p>
                  </div>
                  <div>
                    <Label>
                      {businessInfo.registration_type === "registered_company" 
                        ? "RC Number" 
                        : "Business Name Registration Number"}
                    </Label>
                    <Input
                      value={businessInfo.registration_number}
                      onChange={(e) => setBusinessInfo({...businessInfo, registration_number: e.target.value})}
                      placeholder={businessInfo.registration_type === "registered_company" 
                        ? "e.g., RC 1234567" 
                        : "e.g., BN 1234567"}
                    />
                  </div>
                </div>
                <div>
                  <Label>TIN (Tax Identification Number)</Label>
                  <Input
                    value={businessInfo.tax_id}
                    onChange={(e) => setBusinessInfo({...businessInfo, tax_id: e.target.value})}
                    placeholder="Enter your TIN from FIRS"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Tax Identification Number issued by FIRS. Required for tax compliance.
                  </p>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Business Signature for Proposals/Documents */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Document Signature
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your signature to appear on proposals, invoices, and other business documents.
                  </p>
                  
                  <div className="space-y-4">
                    {business?.business_signature && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">Current Signature:</p>
                        <img 
                          src={business.business_signature} 
                          alt="Business Signature" 
                          className="max-h-20 max-w-xs bg-white p-2 rounded border"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label>Upload Signature</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Upload a PNG or transparent image of your signature. Recommended size: 300×100 pixels.
                      </p>
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Validate size (2MB max)
                          if (file.size > 2 * 1024 * 1024) {
                            toast({ title: "Error", description: "File too large. Maximum size is 2MB", variant: "destructive" });
                            return;
                          }
                          
                          // Upload file
                          const formData = new FormData();
                          formData.append('signature', file);
                          
                          try {
                            const data = await apiPost('business/upload-signature/', formData);
                            if (data.success) {
                              toast({ title: "Success", description: "Signature uploaded successfully" });
                              // Reload business settings to get the new signature URL
                              loadBusinessSettings();
                            } else {
                              toast({ title: "Error", description: data.error || "Failed to upload signature", variant: "destructive" });
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to upload signature", variant: "destructive" });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Compliance Settings */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Tax Compliance Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your tax settings for Personal Income Tax and VAT compliance.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Personal Income Tax Section */}
                    <Collapsible open={payeOpen} onOpenChange={setPayeOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold">Personal Income Tax</h4>
                            <p className="text-sm text-muted-foreground">Direct Assessment - Due March 31st, {new Date().getFullYear()} (for {new Date().getFullYear() - 1})</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${payeOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="state_of_residence">State of Residence</Label>
                            <Select
                              value={taxSettings.state_of_residence}
                              onValueChange={(value) => setTaxSettings({...taxSettings, state_of_residence: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your state" />
                              </SelectTrigger>
                              <SelectContent>
                                {NIGERIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your Personal Income Tax will be paid to the State Inland Revenue Service of this state.
                            </p>
                          </div>

                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* VAT Section */}
                    <Collapsible open={vatOpen} onOpenChange={setVatOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold">VAT (Value Added Tax)</h4>
                            <p className="text-sm text-muted-foreground">7.5% tax on goods and services</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${vatOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 px-4">
                        <div className="space-y-4">
                          {/* Business Type Selection */}
                          <div>
                            <Label>What does your business primarily sell?</Label>
                            <Select
                              value={vatSettings.vat_business_type}
                              onValueChange={(value) => setVatSettings({...vatSettings, vat_business_type: value, vat_product_category: '', vat_service_category: ''})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Products (Physical goods)
                                  </div>
                                </SelectItem>
                                <SelectItem value="service">
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Services (Professional services)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Product Category Selection */}
                          {vatSettings.vat_business_type === 'product' && (
                            <div>
                              <Label>Product Category</Label>
                              <Select
                                value={vatSettings.vat_product_category}
                                onValueChange={(value) => setVatSettings({...vatSettings, vat_product_category: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your product category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/30">VAT Exempt Categories</div>
                                  {VAT_EXEMPT_PRODUCT_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      <div>
                                        <span className="font-medium">{cat.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">- {cat.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/30 mt-2">VAT Taxable Categories</div>
                                  {VAT_TAXABLE_PRODUCT_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      <div>
                                        <span className="font-medium">{cat.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">- {cat.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Show VAT status based on category */}
                              {vatSettings.vat_product_category && (
                                <div className={`mt-3 p-3 rounded-lg border ${
                                  VAT_EXEMPT_PRODUCT_CATEGORIES.some(c => c.value === vatSettings.vat_product_category)
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                                }`}>
                                  {VAT_EXEMPT_PRODUCT_CATEGORIES.some(c => c.value === vatSettings.vat_product_category) ? (
                                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                      <Check className="h-4 w-4" />
                                      <span><strong>VAT Exempt:</strong> Your products are exempt from VAT collection.</span>
                                    </p>
                                  ) : (
                                    <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      <span><strong>VAT Applicable:</strong> 7.5% VAT will be added to products when you exceed ₦100M annual revenue.</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Service Category Selection */}
                          {vatSettings.vat_business_type === 'service' && (
                            <div>
                              <Label>Service Category</Label>
                              <Select
                                value={vatSettings.vat_service_category}
                                onValueChange={(value) => setVatSettings({...vatSettings, vat_service_category: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your service category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/30">VAT Exempt Services</div>
                                  {VAT_EXEMPT_SERVICE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      <div>
                                        <span className="font-medium">{cat.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">- {cat.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/30 mt-2">VAT Taxable Services</div>
                                  {VAT_TAXABLE_SERVICE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      <div>
                                        <span className="font-medium">{cat.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">- {cat.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Show VAT status based on category */}
                              {vatSettings.vat_service_category && (
                                <div className={`mt-3 p-3 rounded-lg border ${
                                  VAT_EXEMPT_SERVICE_CATEGORIES.some(c => c.value === vatSettings.vat_service_category)
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                                }`}>
                                  {VAT_EXEMPT_SERVICE_CATEGORIES.some(c => c.value === vatSettings.vat_service_category) ? (
                                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                      <Check className="h-4 w-4" />
                                      <span><strong>VAT Exempt:</strong> Your services are exempt from VAT collection.</span>
                                    </p>
                                  ) : (
                                    <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      <span><strong>VAT Applicable:</strong> 7.5% VAT will be added to services when you exceed ₦100M annual revenue.</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* VAT Registration Info */}
                          {vatSettings.vat_business_type && (vatSettings.vat_product_category || vatSettings.vat_service_category) && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">VAT Threshold Information</h5>
                              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• VAT registration is mandatory when annual turnover exceeds <strong>₦100,000,000</strong></li>
                                <li>• VAT rate: <strong>7.5%</strong> on taxable goods/services</li>
                                <li>• VAT is collected from customers and remitted monthly to FIRS by the 21st</li>
                                <li>• Example: ₦500 product + ₦37.50 VAT = ₦537.50 total</li>
                                <li>• For online payments, a ₦50 transaction fee may apply: ₦500 + ₦37.50 + ₦50 = ₦587.50</li>
                              </ul>
                            </div>
                          )}

                          {/* VAT Registration Status */}
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label>VAT Registered?</Label>
                              <p className="text-xs text-muted-foreground">Toggle if you are already registered for VAT with FIRS</p>
                            </div>
                            <Switch
                              checked={vatSettings.is_vat_registered}
                              onCheckedChange={(checked) => setVatSettings({...vatSettings, is_vat_registered: checked})}
                            />
                          </div>

                          {vatSettings.is_vat_registered && (
                            <div>
                              <Label>VAT Registration Number</Label>
                              <Input
                                value={vatSettings.vat_number}
                                onChange={(e) => setVatSettings({...vatSettings, vat_number: e.target.value})}
                                placeholder="Enter your VAT number"
                              />
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                {businessTypeSettings.business_category === 'agro_production' && (
                  <div className="border-t pt-6 mt-6">
                    <Collapsible open={agroOpen} onOpenChange={setAgroOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                        <div className="text-left">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sprout className="h-5 w-5 text-emerald-600" />
                            Agro Production Settings
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Set up harvest season and farmlands for your farm operations.
                          </p>
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${agroOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Harvest Season Name</Label>
                          <Input
                            placeholder="e.g., Rainy Season 2026"
                            value={agroSettings.agro_harvest_season_name}
                            onChange={(e) => setAgroSettings({ ...agroSettings, agro_harvest_season_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Start Month</Label>
                          <Select
                            value={agroSettings.agro_harvest_start_month || "none"}
                            onValueChange={(value) => setAgroSettings({ ...agroSettings, agro_harvest_start_month: value === "none" ? "" : value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not set</SelectItem>
                              {MONTH_OPTIONS.map((month) => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>End Month</Label>
                          <Select
                            value={agroSettings.agro_harvest_end_month || "none"}
                            onValueChange={(value) => setAgroSettings({ ...agroSettings, agro_harvest_end_month: value === "none" ? "" : value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not set</SelectItem>
                              {MONTH_OPTIONS.map((month) => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Farmlands / Plots</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAgroSettings({
                              ...agroSettings,
                              agro_farmlands: [...agroSettings.agro_farmlands, { name: "", location: "", size: "", crop: "" }],
                            })}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Farmland
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {agroSettings.agro_farmlands.length === 0 && (
                            <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/40">
                              No farmlands added yet.
                            </div>
                          )}

                          {agroSettings.agro_farmlands.map((farm, index) => (
                            <div key={index} className="border rounded-md p-3 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  placeholder="Farmland name (e.g., Plot A)"
                                  value={farm.name}
                                  onChange={(e) => {
                                    const updated = [...agroSettings.agro_farmlands];
                                    updated[index] = { ...updated[index], name: e.target.value };
                                    setAgroSettings({ ...agroSettings, agro_farmlands: updated });
                                  }}
                                />
                                <Input
                                  placeholder="Location"
                                  value={farm.location}
                                  onChange={(e) => {
                                    const updated = [...agroSettings.agro_farmlands];
                                    updated[index] = { ...updated[index], location: e.target.value };
                                    setAgroSettings({ ...agroSettings, agro_farmlands: updated });
                                  }}
                                />
                                <Input
                                  placeholder="Size (e.g., 2 hectares)"
                                  value={farm.size}
                                  onChange={(e) => {
                                    const updated = [...agroSettings.agro_farmlands];
                                    updated[index] = { ...updated[index], size: e.target.value };
                                    setAgroSettings({ ...agroSettings, agro_farmlands: updated });
                                  }}
                                />
                                <Input
                                  placeholder="Main crop"
                                  value={farm.crop}
                                  onChange={(e) => {
                                    const updated = [...agroSettings.agro_farmlands];
                                    updated[index] = { ...updated[index], crop: e.target.value };
                                    setAgroSettings({ ...agroSettings, agro_farmlands: updated });
                                  }}
                                />
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const updated = agroSettings.agro_farmlands.filter((_, i) => i !== index);
                                    setAgroSettings({ ...agroSettings, agro_farmlands: updated });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Configuration</CardTitle>
                <CardDescription>Configure your payment gateways (Paystack, Flutterwave, Stripe) and bank account for manual payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preferred Payment Gateway - Collapsible */}
                <Collapsible 
                  open={openSections.preferredGateway} 
                  onOpenChange={(open) => setOpenSections({...openSections, preferredGateway: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">Preferred Payment Gateway</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.preferredGateway ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 space-y-6">
                    <div>
                      <Label>Select Gateway</Label>
                      <select
                        className="w-full p-2 border rounded bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
                        value={paymentSettings.preferred_payment_gateway}
                        onChange={(e) => setPaymentSettings({...paymentSettings, preferred_payment_gateway: e.target.value})}
                      >
                        <option value="flutterwave" className="bg-background text-foreground dark:bg-slate-800">Flutterwave (Nigeria)</option>
                        <option value="paystack" className="bg-background text-foreground dark:bg-slate-800">Paystack (Nigeria)</option>
                        <option value="stripe" className="bg-background text-foreground dark:bg-slate-800">Stripe (International)</option>
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Customers will pay through the selected payment gateway with automatic verification.
                      </p>
                    </div>

                {/* Paystack Configuration */}
                <div className="space-y-4 border p-4 rounded">
                  <h3 className="font-semibold">Paystack</h3>
                  <div>
                    <Label>Public Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.paystack_public_key}
                      onChange={(e) => setPaymentSettings({...paymentSettings, paystack_public_key: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.paystack_secret_key}
                      onChange={(e) => setPaymentSettings({...paymentSettings, paystack_secret_key: e.target.value})}
                    />
                  </div>
                </div>

                {/* Flutterwave Configuration */}
                <div className="space-y-4 border p-4 rounded">
                  <h3 className="font-semibold">Flutterwave</h3>
                  <div>
                    <Label>Public Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.flutterwave_public_key}
                      onChange={(e) => setPaymentSettings({...paymentSettings, flutterwave_public_key: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.flutterwave_secret_key}
                      onChange={(e) => setPaymentSettings({...paymentSettings, flutterwave_secret_key: e.target.value})}
                    />
                  </div>
                </div>

                {/* Stripe Configuration (International) */}
                <div className="space-y-4 border p-4 rounded bg-purple-50 dark:bg-purple-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <span>Stripe</span>
                        <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">International</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">Accept payments in USD, EUR, GBP and other international currencies</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Live Mode</Label>
                      <Switch
                        checked={paymentSettings.stripe_is_live}
                        onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, stripe_is_live: checked})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test Keys */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Test Keys</h4>
                      <div>
                        <Label>Test Publishable Key</Label>
                        <Input
                          type="password"
                          placeholder="pk_test_..."
                          value={paymentSettings.stripe_test_publishable_key}
                          onChange={(e) => setPaymentSettings({...paymentSettings, stripe_test_publishable_key: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Test Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="sk_test_..."
                          value={paymentSettings.stripe_test_secret_key}
                          onChange={(e) => setPaymentSettings({...paymentSettings, stripe_test_secret_key: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Live Keys */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Live Keys</h4>
                      <div>
                        <Label>Live Publishable Key</Label>
                        <Input
                          type="password"
                          placeholder="pk_live_..."
                          value={paymentSettings.stripe_publishable_key}
                          onChange={(e) => setPaymentSettings({...paymentSettings, stripe_publishable_key: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Live Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="sk_live_..."
                          value={paymentSettings.stripe_secret_key}
                          onChange={(e) => setPaymentSettings({...paymentSettings, stripe_secret_key: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Webhook Secret (Optional)</Label>
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      value={paymentSettings.stripe_webhook_secret}
                      onChange={(e) => setPaymentSettings({...paymentSettings, stripe_webhook_secret: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get this from your Stripe Dashboard → Webhooks. Used to verify webhook events.
                    </p>
                  </div>
                </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Bank Transfer - Collapsible */}
                <Collapsible 
                  open={openSections.bankTransfer} 
                  onOpenChange={(open) => setOpenSections({...openSections, bankTransfer: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">Bank Transfer (Manual Payments)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.bankTransfer ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 bg-blue-50 dark:bg-blue-950 rounded-b-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <p className="text-sm text-muted-foreground">
                          Allow customers to pay via bank transfer (requires manual verification)
                        </p>
                        <Switch
                          checked={bankAccountSettings.bank_transfer_enabled}
                          onCheckedChange={(checked) => setBankAccountSettings({...bankAccountSettings, bank_transfer_enabled: checked})}
                        />
                      </div>
                      {bankAccountSettings.bank_transfer_enabled && (
                        <div className="space-y-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Add your OPay, Moniepoint, or other bank account details for manual payment verification. 
                            Customers can pay via bank transfer and you will approve their payments.
                          </p>
                          <div>
                            <Label>Bank Name</Label>
                            <Input
                              placeholder="e.g., OPay, Moniepoint, GTBank"
                              value={bankAccountSettings.manual_payment_bank_name}
                              onChange={(e) => setBankAccountSettings({...bankAccountSettings, manual_payment_bank_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Account Number</Label>
                            <Input
                              placeholder="10-digit account number"
                              maxLength={10}
                              value={bankAccountSettings.manual_payment_account_number}
                              onChange={(e) => setBankAccountSettings({...bankAccountSettings, manual_payment_account_number: e.target.value.replace(/\D/g, '')})}
                            />
                          </div>
                          <div>
                            <Label>Account Name</Label>
                            <Input
                              placeholder="e.g., John Doe Business"
                              value={bankAccountSettings.manual_payment_account_name}
                              onChange={(e) => setBankAccountSettings({...bankAccountSettings, manual_payment_account_name: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Pay on Delivery Section */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <div>
                          <p className="text-sm font-medium">Pay on Delivery</p>
                          <p className="text-xs text-muted-foreground">
                            Allow customers to pay when they receive their order (cash or card on delivery)
                          </p>
                        </div>
                        <Switch
                          checked={bankAccountSettings.pay_on_delivery_enabled}
                          onCheckedChange={(checked) => setBankAccountSettings({...bankAccountSettings, pay_on_delivery_enabled: checked})}
                        />
                      </div>
                      
                      {/* Buy on Credit Section */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <div>
                          <p className="text-sm font-medium">Buy on Credit</p>
                          <p className="text-xs text-muted-foreground">
                            Allow customers to purchase items on credit and pay later
                          </p>
                        </div>
                        <Switch
                          checked={bankAccountSettings.buy_on_credit_enabled}
                          onCheckedChange={(checked) => setBankAccountSettings({...bankAccountSettings, buy_on_credit_enabled: checked})}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Store Appearance
                </CardTitle>
                <CardDescription>
                  Customize the colors and styling of your public store page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Settings */}
                <Collapsible 
                  open={openSections.colors} 
                  onOpenChange={(open) => setOpenSections({...openSections, colors: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span className="font-medium">Color Settings</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.colors ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Primary Color */}
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Primary Color (Buttons & Links)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={storeAppearance.primary_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, primary_color: e.target.value})}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={storeAppearance.primary_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, primary_color: e.target.value})}
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Used for buttons, links, and accent elements</p>
                      </div>

                      {/* Secondary Color */}
                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary_color"
                            type="color"
                            value={storeAppearance.secondary_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, secondary_color: e.target.value})}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={storeAppearance.secondary_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, secondary_color: e.target.value})}
                            placeholder="#1f2937"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Used for secondary elements and backgrounds</p>
                      </div>

                      {/* Navbar Color */}
                      <div className="space-y-2">
                        <Label htmlFor="navbar_color">Navbar Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="navbar_color"
                            type="color"
                            value={storeAppearance.navbar_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, navbar_color: e.target.value})}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={storeAppearance.navbar_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, navbar_color: e.target.value})}
                            placeholder="#111827"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Top navigation bar background</p>
                      </div>

                      {/* Footer Color */}
                      <div className="space-y-2">
                        <Label htmlFor="footer_color">Footer Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="footer_color"
                            type="color"
                            value={storeAppearance.footer_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, footer_color: e.target.value})}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={storeAppearance.footer_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, footer_color: e.target.value})}
                            placeholder="#111827"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Footer section background</p>
                      </div>

                      {/* Text Color */}
                      <div className="space-y-2">
                        <Label htmlFor="text_color">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text_color"
                            type="color"
                            value={storeAppearance.text_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, text_color: e.target.value})}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={storeAppearance.text_color}
                            onChange={(e) => setStoreAppearance({...storeAppearance, text_color: e.target.value})}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Main text color on dark backgrounds</p>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-2">
                        <Label htmlFor="font_size">Font Size</Label>
                        <select
                          id="font_size"
                          value={storeAppearance.font_size}
                          onChange={(e) => setStoreAppearance({...storeAppearance, font_size: e.target.value})}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium (Default)</option>
                          <option value="large">Large</option>
                        </select>
                        <p className="text-xs text-muted-foreground">Base font size for your store</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Button Style */}
                <Collapsible 
                  open={openSections.buttonStyle} 
                  onOpenChange={(open) => setOpenSections({...openSections, buttonStyle: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      <span className="font-medium">Button Style</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.buttonStyle ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <Label className="block mb-3">Choose Button Shape</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="button_style"
                          value="rounded"
                          checked={storeAppearance.button_style === "rounded"}
                          onChange={(e) => setStoreAppearance({...storeAppearance, button_style: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Rounded</span>
                        <Button size="sm" className="rounded-lg ml-2" style={{ backgroundColor: storeAppearance.primary_color }}>
                          Preview
                        </Button>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="button_style"
                          value="pill"
                          checked={storeAppearance.button_style === "pill"}
                          onChange={(e) => setStoreAppearance({...storeAppearance, button_style: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Pill</span>
                        <Button size="sm" className="rounded-full ml-2" style={{ backgroundColor: storeAppearance.primary_color }}>
                          Preview
                        </Button>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="button_style"
                          value="square"
                          checked={storeAppearance.button_style === "square"}
                          onChange={(e) => setStoreAppearance({...storeAppearance, button_style: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Square</span>
                        <Button size="sm" className="rounded-none ml-2" style={{ backgroundColor: storeAppearance.primary_color }}>
                          Preview
                        </Button>
                      </label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Preview Section */}
                <Collapsible 
                  open={openSections.preview} 
                  onOpenChange={(open) => setOpenSections({...openSections, preview: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">Live Preview</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.preview ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="border-t">
                      <div className="p-4 text-center" style={{ backgroundColor: storeAppearance.navbar_color }}>
                        <span style={{ color: storeAppearance.text_color }} className="font-semibold">Navbar Preview</span>
                      </div>
                      <div className="p-6 bg-white">
                        <h3 className="font-bold mb-2">Content Area</h3>
                        <p className="text-gray-600 mb-4">This is how your store content will look.</p>
                        <Button 
                          className={
                            storeAppearance.button_style === "pill" ? "rounded-full" : 
                            storeAppearance.button_style === "square" ? "rounded-none" : "rounded-lg"
                          }
                          style={{ backgroundColor: storeAppearance.primary_color }}
                        >
                          Sample Button
                        </Button>
                      </div>
                      <div className="p-4 text-center" style={{ backgroundColor: storeAppearance.footer_color }}>
                        <span style={{ color: storeAppearance.text_color }} className="text-sm">Footer Preview</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Preset Themes */}
                <Collapsible 
                  open={openSections.presets} 
                  onOpenChange={(open) => setOpenSections({...openSections, presets: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span className="font-medium">Quick Presets</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.presets ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#3b82f6",
                          secondary_color: "#1f2937",
                          navbar_color: "#111827",
                          footer_color: "#111827",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "rounded",
                        })}
                      >
                        🔵 Blue (Default)
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#10b981",
                          secondary_color: "#064e3b",
                          navbar_color: "#022c22",
                          footer_color: "#022c22",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "rounded",
                        })}
                      >
                        🟢 Green
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#8b5cf6",
                          secondary_color: "#4c1d95",
                          navbar_color: "#2e1065",
                          footer_color: "#2e1065",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "pill",
                        })}
                      >
                        🟣 Purple
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#f97316",
                          secondary_color: "#7c2d12",
                          navbar_color: "#431407",
                          footer_color: "#431407",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "rounded",
                        })}
                      >
                        🟠 Orange
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#ec4899",
                          secondary_color: "#831843",
                          navbar_color: "#500724",
                          footer_color: "#500724",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "pill",
                        })}
                      >
                        🩷 Pink
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStoreAppearance({
                          primary_color: "#000000",
                          secondary_color: "#171717",
                          navbar_color: "#000000",
                          footer_color: "#000000",
                          text_color: "#ffffff",
                          font_size: "medium",
                          button_style: "square",
                        })}
                      >
                        ⬛ Dark
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Store Features Section */}
                <Collapsible 
                  open={openSections.storeFeatures} 
                  onOpenChange={(open) => setOpenSections({...openSections, storeFeatures: open})}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">Store Features</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSections.storeFeatures ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground mb-4 pt-2">
                      Enable or disable special features on your public store page
                    </p>

                    <div className="space-y-6">
                      {/* Hero Slider Toggle */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Hero Image Slider</Label>
                          <p className="text-sm text-muted-foreground">
                          Display a rotating banner slider at the top of your store
                        </p>
                      </div>
                      <Switch
                        checked={storeFeatures.hero_slider_enabled}
                        onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, hero_slider_enabled: checked})}
                      />
                    </div>

                    {/* Slider Images Upload - show only when slider is enabled */}
                    {storeFeatures.hero_slider_enabled && (
                      <div className="ml-4 p-4 border rounded-lg bg-background">
                        <Label className="block mb-3">Slider Images (Max 5MB each)</Label>
                        <div className="space-y-3">
                          {storeFeatures.hero_slider_images.map((image: { url: string; alt: string; link: string }, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                              {image.url && (
                                <img src={image.url} alt={image.alt || `Slide ${index + 1}`} className="w-20 h-12 object-cover rounded" />
                              )}
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={image.url}
                                  onChange={(e) => {
                                    const newImages = [...storeFeatures.hero_slider_images];
                                    newImages[index] = { ...newImages[index], url: e.target.value };
                                    setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                  }}
                                  placeholder="Image URL"
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Input
                                    value={image.alt}
                                    onChange={(e) => {
                                      const newImages = [...storeFeatures.hero_slider_images];
                                      newImages[index] = { ...newImages[index], alt: e.target.value };
                                      setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                    }}
                                    placeholder="Alt text"
                                    className="text-sm flex-1"
                                  />
                                  <Input
                                    value={image.link}
                                    onChange={(e) => {
                                      const newImages = [...storeFeatures.hero_slider_images];
                                      newImages[index] = { ...newImages[index], link: e.target.value };
                                      setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                    }}
                                    placeholder="Link URL (optional)"
                                    className="text-sm flex-1"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newImages = storeFeatures.hero_slider_images.filter((_: { url: string; alt: string; link: string }, i: number) => i !== index);
                                  setStoreFeatures({...storeFeatures, hero_slider_images: newImages});
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {storeFeatures.hero_slider_images.length < 5 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setStoreFeatures({
                                  ...storeFeatures,
                                  hero_slider_images: [...storeFeatures.hero_slider_images, { url: '', alt: '', link: '' }]
                                });
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Slide
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Add up to 5 banner images. Use image hosting services or your media URLs.
                        </p>
                      </div>
                    )}

                    {/* Flash Sales Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Flash Sales Section</Label>
                        <p className="text-sm text-muted-foreground">
                          Show a dedicated flash sales section with countdown timers
                        </p>
                      </div>
                      <Switch
                        checked={storeFeatures.flash_sales_enabled}
                        onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, flash_sales_enabled: checked})}
                      />
                    </div>

                    {/* Top Sellers Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Top Sellers Section</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your best-selling products prominently
                        </p>
                      </div>
                      <Switch
                        checked={storeFeatures.top_sellers_enabled}
                        onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, top_sellers_enabled: checked})}
                      />
                    </div>

                    {/* Top Sellers Count - show only when enabled */}
                    {storeFeatures.top_sellers_enabled && (
                      <div className="ml-4 p-4 border rounded-lg bg-background">
                        <Label>Number of Top Sellers to Display</Label>
                        <select
                          value={storeFeatures.top_sellers_count}
                          onChange={(e) => setStoreFeatures({...storeFeatures, top_sellers_count: parseInt(e.target.value)})}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
                        >
                          <option value={4}>4 Products</option>
                          <option value={8}>8 Products (Default)</option>
                          <option value={12}>12 Products</option>
                          <option value={16}>16 Products</option>
                          <option value={20}>20 Products</option>
                        </select>
                      </div>
                    )}

                    {/* Show POS Button Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Show POS Quick Buy Button</Label>
                        <p className="text-sm text-muted-foreground">
                          Display a quick purchase button for customers on product cards
                        </p>
                      </div>
                      <Switch
                        checked={storeFeatures.show_pos_button}
                        onCheckedChange={(checked) => setStoreFeatures({...storeFeatures, show_pos_button: checked})}
                      />
                    </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
                <CardDescription>
                  Enable delivery for your online customers - We handle everything!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Delivery Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    🚀 Platform-Powered Delivery
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    We handle all delivery logistics for you! No API keys or complex setup needed. 
                    Just enable delivery and your customers can start ordering.
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>✓ Automatic distance & time calculation</li>
                    <li>✓ Real-time delivery tracking for customers</li>
                    <li>✓ Multiple delivery partners (Kwik, Gokada, etc.)</li>
                    <li>✓ No setup required - just toggle ON!</li>
                  </ul>
                </div>

                {/* Enable Delivery Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Enable Delivery</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to choose delivery when ordering online
                    </p>
                  </div>
                  <Button
                    variant={deliverySettings.delivery_enabled ? "default" : "outline"}
                    size="lg"
                    onClick={() => setDeliverySettings({
                      ...deliverySettings,
                      delivery_enabled: !deliverySettings.delivery_enabled
                    })}
                    className={deliverySettings.delivery_enabled ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {deliverySettings.delivery_enabled ? "✓ Enabled" : "Enable"}
                  </Button>
                </div>

                {deliverySettings.delivery_enabled && (
                  <>
                    {/* Business-specific Settings */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Your Delivery Options</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="free_delivery_threshold">Free Delivery Above (₦)</Label>
                          <Input
                            id="free_delivery_threshold"
                            type="number"
                            placeholder="e.g., 20000"
                            value={deliverySettings.free_delivery_threshold}
                            onChange={(e) => setDeliverySettings({
                              ...deliverySettings,
                              free_delivery_threshold: e.target.value
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Orders above this amount get free delivery (leave empty to disable)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery_radius_km">Maximum Delivery Distance (km)</Label>
                          <Input
                            id="delivery_radius_km"
                            type="number"
                            placeholder="50"
                            value={deliverySettings.delivery_radius_km}
                            onChange={(e) => setDeliverySettings({
                              ...deliverySettings,
                              delivery_radius_km: parseFloat(e.target.value) || 50
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum distance for delivery from your store
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        💰 How Delivery Pricing Works
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Delivery fees are automatically calculated based on:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Distance from your store to customer location</li>
                          <li>Current traffic conditions (when available)</li>
                          <li>Package size and handling requirements</li>
                        </ul>
                        <p className="pt-2 text-xs">
                          <strong>Note:</strong> A small platform fee is included in delivery charges to maintain the service.
                        </p>
                      </div>
                    </div>

                    {/* How it Works */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-medium">How Delivery Works</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <span className="text-lg">1</span>
                          </div>
                          <p className="text-sm font-medium">Customer Orders</p>
                          <p className="text-xs text-muted-foreground">Selects delivery at checkout</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <span className="text-lg">2</span>
                          </div>
                          <p className="text-sm font-medium">Fee Calculated</p>
                          <p className="text-xs text-muted-foreground">Based on distance & traffic</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <span className="text-lg">3</span>
                          </div>
                          <p className="text-sm font-medium">Rider Dispatched</p>
                          <p className="text-xs text-muted-foreground">Picks up from your store</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <span className="text-lg">4</span>
                          </div>
                          <p className="text-sm font-medium">Live Tracking</p>
                          <p className="text-xs text-muted-foreground">Customer tracks in real-time</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches">
            <BranchManagement />
          </TabsContent>

          {/* Stores/Warehouses Tab */}
          <TabsContent value="stores">
            <StoreManagement />
          </TabsContent>

          {/* Analytics & Ads Tab */}
          <TabsContent value="analytics">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Analytics & Advertising
                  </CardTitle>
                  <CardDescription>
                    Connect your analytics and advertising platforms to track visitors, measure conversions, and run targeted ad campaigns.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Google Analytics 4 */}
              <Collapsible open={googleAnalyticsOpen} onOpenChange={setGoogleAnalyticsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
                            </svg>
                          </div>
                          <div>
                            <CardTitle className="text-lg">Google Analytics 4</CardTitle>
                            <CardDescription>Track visitors, page views, and user behavior</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analyticsSettings.google_analytics_enabled && (
                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${googleAnalyticsOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Enable Google Analytics</Label>
                          <p className="text-xs text-muted-foreground">Inject GA4 tracking code on your public pages</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.google_analytics_enabled}
                          onCheckedChange={(checked) => setAnalyticsSettings(prev => ({ ...prev, google_analytics_enabled: checked }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ga4_id">Measurement ID</Label>
                        <Input
                          id="ga4_id"
                          placeholder="G-XXXXXXXXXX"
                          value={analyticsSettings.google_analytics_id}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Find this in Google Analytics: Admin → Data Streams → Select stream → Measurement ID
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Google Ads */}
              <Collapsible open={googleAdsOpen} onOpenChange={setGoogleAdsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3.464 16.107l4-6.928c.39-.676.132-1.54-.577-1.93l-.927-.535c-.39-.225-.85-.289-1.289-.18-.439.11-.813.4-1.04.812l-3.08 5.333a3.5 3.5 0 0 0 1.282 4.78 3.5 3.5 0 0 0 4.78-1.28l.577-1c-.676-.39-.866-1.253-.577-1.929l-1.149 1.99a1.5 1.5 0 0 1-2.05.55 1.5 1.5 0 0 1-.55-2.05v-.633zM20.535 7.893l-4-6.928c-.227-.39-.586-.67-1.025-.78-.44-.11-.9-.046-1.29.18l-.927.535c-.709.39-.967 1.254-.577 1.93l4 6.928c.39.676 1.254.866 1.93.577l.927-.535c.71-.39.967-1.254.577-1.93v.023zm-5 8.66a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                            </svg>
                          </div>
                          <div>
                            <CardTitle className="text-lg">Google Ads</CardTitle>
                            <CardDescription>Track ad conversions and optimize campaigns</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analyticsSettings.google_ads_enabled && (
                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${googleAdsOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Enable Google Ads Tracking</Label>
                          <p className="text-xs text-muted-foreground">Track conversions from your Google Ads campaigns</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.google_ads_enabled}
                          onCheckedChange={(checked) => setAnalyticsSettings(prev => ({ ...prev, google_ads_enabled: checked }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gads_id">Google Ads ID</Label>
                        <Input
                          id="gads_id"
                          placeholder="AW-XXXXXXXXX"
                          value={analyticsSettings.google_ads_id}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, google_ads_id: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your Google Ads account ID (starts with AW-)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gads_conversion">Conversion ID (Optional)</Label>
                        <Input
                          id="gads_conversion"
                          placeholder="XXXXXXX"
                          value={analyticsSettings.google_ads_conversion_id}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, google_ads_conversion_id: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          For specific conversion tracking (e.g., purchases)
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Facebook/Meta Pixel */}
              <Collapsible open={facebookPixelOpen} onOpenChange={setFacebookPixelOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                            <Facebook className="w-6 h-6 text-[#1877F2]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Facebook/Meta Pixel</CardTitle>
                            <CardDescription>Track Facebook and Instagram ad conversions</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analyticsSettings.facebook_pixel_enabled && (
                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${facebookPixelOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Enable Meta Pixel</Label>
                          <p className="text-xs text-muted-foreground">Track visitors from Facebook & Instagram ads</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.facebook_pixel_enabled}
                          onCheckedChange={(checked) => setAnalyticsSettings(prev => ({ ...prev, facebook_pixel_enabled: checked }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fb_pixel">Pixel ID</Label>
                        <Input
                          id="fb_pixel"
                          placeholder="XXXXXXXXXXXXXXX"
                          value={analyticsSettings.facebook_pixel_id}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Find this in Meta Events Manager → Data Sources → Select Pixel
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fb_token">Conversions API Access Token (Optional)</Label>
                        <Input
                          id="fb_token"
                          type="password"
                          placeholder="EAAxxxxxx..."
                          value={analyticsSettings.facebook_access_token}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, facebook_access_token: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          For server-side event tracking (more accurate than pixel alone)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fb_test">Test Event Code (Optional)</Label>
                        <Input
                          id="fb_test"
                          placeholder="TEST12345"
                          value={analyticsSettings.facebook_test_event_code}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, facebook_test_event_code: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          For testing events in Meta Events Manager
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* TikTok Pixel */}
              <Collapsible open={tiktokPixelOpen} onOpenChange={setTiktokPixelOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
                            <TikTokIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                            <CardDescription>Track TikTok ad conversions</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analyticsSettings.tiktok_pixel_enabled && (
                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${tiktokPixelOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Enable TikTok Pixel</Label>
                          <p className="text-xs text-muted-foreground">Track visitors from TikTok ads</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.tiktok_pixel_enabled}
                          onCheckedChange={(checked) => setAnalyticsSettings(prev => ({ ...prev, tiktok_pixel_enabled: checked }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_pixel">TikTok Pixel ID</Label>
                        <Input
                          id="tiktok_pixel"
                          placeholder="XXXXXXXXXXXXXXX"
                          value={analyticsSettings.tiktok_pixel_id}
                          onChange={(e) => setAnalyticsSettings(prev => ({ ...prev, tiktok_pixel_id: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Find this in TikTok Ads Manager → Assets → Events → Web Events
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Help Card */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">How Analytics Tracking Works</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        When enabled, tracking codes are automatically injected into your public store and service pages. 
                        This allows you to:
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                        <li>• Track page views and visitor behavior</li>
                        <li>• Measure add-to-cart and checkout events</li>
                        <li>• Build retargeting audiences for ads</li>
                        <li>• Calculate ROI and optimize ad spend</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Tab - Business Relationship Manager */}
          <TabsContent value="support">
            <div className="space-y-4">
              {/* Request Professional Services Card */}
              <Collapsible open={professionalServicesOpen} onOpenChange={setProfessionalServicesOpen}>
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Request Professional Services
                          </CardTitle>
                          <CardDescription>
                            Need custom website design, app development, or business customization? Our team can help!
                          </CardDescription>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${professionalServicesOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Get professional assistance with:
                          </p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Website Design & Development</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Mobile App Development</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Custom Business Software</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Platform Customization</li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => navigate('/business/professional-services')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Services
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Custom Domain Card */}
              <Collapsible open={customDomainOpen} onOpenChange={setCustomDomainOpen}>
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-600" />
                            Custom Domain
                          </CardTitle>
                          <CardDescription>
                            Use your own domain name for your business portal (e.g., shop.yourbusiness.com)
                          </CardDescription>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${customDomainOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                          <h4 className="font-medium mb-2">How Custom Domains Work</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Instead of using <span className="font-mono text-blue-600">business.henotaceai.ng/your-store</span>, 
                            customers can access your business at your own domain like <span className="font-mono text-blue-600">shop.yourbusiness.com</span>.
                          </p>
                          <ul className="text-sm space-y-2 text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> Professional branding with your own domain</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> Free SSL certificate for secure connections</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> Easy setup - just update your DNS records</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> Available on Grow plan and above</li>
                          </ul>
                        </div>
                        
                        {business?.custom_domain ? (
                          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-800 dark:text-green-200">Custom Domain Active</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Your business is accessible at: <span className="font-mono font-medium">{business.custom_domain}</span>
                            </p>
                            {business.custom_domain_verified ? (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Domain verified and active</p>
                            ) : (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">⏳ Domain verification pending</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Ready to use your own domain?</p>
                              <p className="text-xs text-muted-foreground">Request a custom domain setup from our team</p>
                            </div>
                            <Button 
                              onClick={() => navigate('/business/professional-services?service=custom_domain')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Request Custom Domain
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Henotace Academy Card */}
              <Collapsible open={academyOpen} onOpenChange={setAcademyOpen}>
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                            Henotace Academy
                          </CardTitle>
                          <CardDescription>
                            Learn how to use all the features of your business management platform
                          </CardDescription>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform ${academyOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Interactive courses covering:
                          </p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Inventory & Product Management</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sales & Point of Sale System</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Tax Compliance & Invoicing</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Team & Branch Management</li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => navigate('/business/academy')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Start Learning
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* BRM Info Card */}
              <Collapsible open={brmOpen} onOpenChange={setBrmOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5" />
                            Your Business Relationship Manager
                          </CardTitle>
                          <CardDescription>
                            Your dedicated point of contact for any questions or issues
                          </CardDescription>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${brmOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                  {hasManager && brmManager ? (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-6 rounded-lg border">
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full">
                          <UserCog className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{brmManager.name}</h3>
                          <p className="text-sm text-muted-foreground">{brmManager.role}</p>
                          {brmManager.department && (
                            <p className="text-sm text-muted-foreground">{brmManager.department}</p>
                          )}
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <a href={`mailto:${brmManager.email}`} className="text-blue-600 hover:underline">
                                {brmManager.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <a href={`tel:${brmManager.phone}`} className="text-blue-600 hover:underline">
                                {brmManager.phone}
                              </a>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-4">
                            Assigned since: {new Date(brmManager.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <UserCog className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No Business Relationship Manager assigned yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        A dedicated manager will be assigned to your account soon
                      </p>
                    </div>
                  )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Send Message Card */}
              <Collapsible open={contactSupportOpen} onOpenChange={setContactSupportOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Contact Support
                          </CardTitle>
                          <CardDescription>
                            Send a message, report an issue, or request assistance
                          </CardDescription>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${contactSupportOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            className="w-full p-2 border rounded-md bg-background"
                            value={newComplaint.type}
                            onChange={(e) => setNewComplaint({...newComplaint, type: e.target.value})}
                          >
                            <option value="general">General Inquiry</option>
                            <option value="billing">Billing Issue</option>
                            <option value="technical">Technical Support</option>
                            <option value="feature_request">Feature Request</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <select
                            className="w-full p-2 border rounded-md bg-background"
                            value={newComplaint.priority}
                            onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          placeholder="Brief description of your inquiry"
                          value={newComplaint.subject}
                          onChange={(e) => setNewComplaint({...newComplaint, subject: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Describe your issue or question in detail..."
                      value={newComplaint.message}
                      onChange={(e) => setNewComplaint({...newComplaint, message: e.target.value})}
                      rows={5}
                    />
                      </div>
                      
                      <Button 
                        onClick={handleSendComplaint} 
                        disabled={sendingComplaint || !hasManager}
                        className="w-full"
                      >
                        {sendingComplaint ? (
                          <>Sending...</>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                      
                      {!hasManager && (
                        <p className="text-sm text-center text-muted-foreground">
                          A Business Relationship Manager needs to be assigned before you can send messages
                        </p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Previous Messages */}
              {complaints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Previous Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complaints.map((complaint) => (
                        <div key={complaint.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{complaint.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                            {complaint.content}
                          </p>
                          {complaint.follow_up_date && (
                            <p className="text-xs text-orange-600 mt-2">
                              Follow-up scheduled: {new Date(complaint.follow_up_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

