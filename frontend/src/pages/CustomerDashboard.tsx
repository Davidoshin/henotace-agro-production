import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { jsPDF } from "jspdf";
import { 
  Wallet, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Gift,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  Trash2,
  Store,
  Download,
  FileImage,
  FileText,
  History,
  Eye,
  EyeOff,
  ChevronRight,
  Truck,
  MapPin,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Navigation,
  ExternalLink,
  CloudDownload,
  Zap,
  Star,
  Search,
  Building2,
  ClipboardList,
  AlertCircle
} from "lucide-react";
import CustomerDeliveryTracking from "@/components/delivery/CustomerDeliveryTracking";

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  loyalty_points: number;
  discount_percentage: number;
  total_purchases: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  selling_price: number;
  current_stock: number;
  category: string;
  parent_category?: string;
  image_url?: string;
  is_digital?: boolean;
  digital_download_url?: string | null;
  digital_access_instructions?: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_digital?: boolean;
  digital_file_url?: string | null;
  digital_access_instructions?: string | null;
}

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balance_after: number;
  created_at: string;
  sale_items?: SaleItem[];
  sale_number?: string;
  payment_method?: string;
}

interface Purchase {
  id: number;
  sale_number: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: SaleItem[];
}

interface CreditRecord {
  id: number;
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid';
  approval_status?: 'pending_approval' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  description: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_main_branch: boolean;
}

interface CustomerNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pending orders state
  const [pendingOrders, setPendingOrders] = useState<Array<{
    id: number;
    sale_number: string;
    total_amount: number;
    discount_amount: number;
    tax_amount: number;
    final_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    notes: string;
    items: Array<{
      id: number;
      product_id: number;
      product_name: string;
      product_image: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>>([]);
  const [showPayOrderDialog, setShowPayOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof pendingOrders[0] | null>(null);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'wallet' | 'gateway' | 'bank_transfer'>('wallet');
  const [orderPaymentReference, setOrderPaymentReference] = useState("");
  
  const [showFundWalletDialog, setShowFundWalletDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const PLATFORM_FEE = 50; // Platform fee for bank transfers
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gateway' | 'credit' | 'bank_transfer' | 'pay_on_delivery'>('wallet');
  const [showCreditPaymentDialog, setShowCreditPaymentDialog] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditRecord | null>(null);
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<'wallet' | 'gateway'>('wallet');
  const [manualPaymentReference, setManualPaymentReference] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  
  // Delivery states
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<{
    quote_id: string;
    delivery_fee: number;
    distance_km: number;
    estimated_minutes: number;
    free_delivery: boolean;
  } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  
  // Branch state for multi-branch businesses
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  // Store cart info (for items from public store)
  const [storeCartBusiness, setStoreCartBusiness] = useState<{id: number; name: string; slug: string; logo?: string; branch?: {id: number; name: string; address?: string; phone?: string}; manual_payment_bank_name?: string; manual_payment_account_number?: string; manual_payment_account_name?: string; preferred_payment_gateway?: string; bank_transfer_enabled?: boolean; pay_on_delivery_enabled?: boolean; buy_on_credit_enabled?: boolean} | null>(null);

  // Store feature flags
  const [storeFeatures, setStoreFeatures] = useState<{
    flash_sales_enabled: boolean;
    top_sellers_enabled: boolean;
    top_sellers_count: number;
    business_slug: string | null;
  }>({
    flash_sales_enabled: false,
    top_sellers_enabled: false,
    top_sellers_count: 8,
    business_slug: null
  });

  // Flash sales and top sellers products
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [topSellerProducts, setTopSellerProducts] = useState<Product[]>([]);
  const [flashSaleTimeLeft, setFlashSaleTimeLeft] = useState<{hours: number; minutes: number; seconds: number} | null>(null);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<number | null>(null);
  
  // Fund wallet payment method
  const [fundWalletMethod, setFundWalletMethod] = useState<'gateway' | 'bank_transfer'>('gateway');
  const [fundWalletReference, setFundWalletReference] = useState("");
  
  // Purchase success dialog state
  const [showPurchaseSuccessDialog, setShowPurchaseSuccessDialog] = useState(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState<{
    sale_id?: number;
    sale_number?: string;
    total_amount?: number;
    items?: Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      is_digital?: boolean;
      digital_download_url?: string | null;
      digital_access_instructions?: string | null;
    }>;
    has_digital_products?: boolean;
    delivery_tracking_code?: string | null;
    is_order?: boolean;  // True for pay_on_delivery, bank_transfer, credit (not completed sales)
    payment_method?: string;
    payment_status?: string;
    message?: string;
  } | null>(null);
  
  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSaleId, setReviewSaleId] = useState<number | null>(null);
  const [reviewSaleItemId, setReviewSaleItemId] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load branches for multi-branch support
  const loadBranches = async (storeCartBranchId?: number | null) => {
    try {
      const response = await apiGet("business/customer/branches/");
      if (response.success && response.branches) {
        setBranches(response.branches);
        
        // Priority 1: Use store cart branch if provided (from caller)
        if (storeCartBranchId) {
          // Verify the branch exists in the response
          const branchExists = response.branches.some((b: Branch) => b.id === storeCartBranchId);
          if (branchExists) {
            setSelectedBranchId(storeCartBranchId);
            return; // Don't override with default
          }
        }
        
        // Priority 2: Check localStorage for store cart branch
        const savedBusinessInfo = localStorage.getItem('store_cart_business_info');
        if (savedBusinessInfo) {
          try {
            const businessInfo = JSON.parse(savedBusinessInfo);
            if (businessInfo.branch?.id) {
              // Verify the branch exists in the response
              const branchExists = response.branches.some((b: Branch) => b.id === businessInfo.branch.id);
              if (branchExists) {
                setSelectedBranchId(businessInfo.branch.id);
                return; // Don't override with default
              }
            }
          } catch (e) {
            console.error('Error parsing store cart business info:', e);
          }
        }
        
        // Priority 3: Only set default branch if no store cart branch exists
        if (!selectedBranchId && response.branches.length > 0) {
          const mainBranch = response.branches.find((b: Branch) => b.is_main_branch);
          if (mainBranch) {
            setSelectedBranchId(mainBranch.id);
          } else {
            setSelectedBranchId(response.branches[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load branches:", error);
    }
  };

  useEffect(() => {
    loadCustomerProfile();
    loadTransactions();
    loadPurchases();
    loadPendingOrders();
    loadCreditRecords();
    loadNotifications();
    
    // Load cart from public store if available - PROCESS THIS FIRST before loadBranches
    const savedCart = localStorage.getItem('store_cart');
    const savedBusinessInfo = localStorage.getItem('store_cart_business_info');
    let storeCartBranchId: number | null = null;
    
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        // Convert store cart format to dashboard cart format
        const dashboardCart: CartItem[] = cartItems.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          description: item.product.description || '',
          selling_price: parseFloat(item.product.selling_price),
          current_stock: item.product.stock || item.product.current_stock || 100,
          category: item.product.category?.name || item.product.category || '',
          image_url: item.product.image || item.product.image_url,
          quantity: item.quantity
        }));
        setCart(dashboardCart);
        
        // Load business info and set branch from store
        if (savedBusinessInfo) {
          const businessInfo = JSON.parse(savedBusinessInfo);
          setStoreCartBusiness(businessInfo);
          // IMPORTANT: Extract branch ID from store cart to pass to loadBranches
          if (businessInfo.branch?.id) {
            storeCartBranchId = businessInfo.branch.id;
            setSelectedBranchId(businessInfo.branch.id);
          }
        }
        
        // Show toast about loaded cart
        if (cartItems.length > 0) {
          toast({
            title: "Cart Restored",
            description: `${cartItems.length} item(s) from your shopping cart are ready for checkout.`,
            duration: 5000
          });
          // Switch to overview tab to show cart
          setActiveTab("overview");
        }
      } catch (e) {
        console.error('Error loading store cart:', e);
      }
    }
    
    // Load branches AFTER processing store cart, passing the branch ID if available
    loadBranches(storeCartBranchId);
    
    // Check if redirected after successful deposit or purchase
    const urlParams = new URLSearchParams(window.location.search);
    const depositVerified = urlParams.get('deposit_verified');
    const purchaseVerified = urlParams.get('purchase_verified');
    const tab = urlParams.get('tab');
    
    if (depositVerified === 'true') {
      toast({ 
        title: "Success", 
        description: "Wallet funded successfully!",
        duration: 3000
      });
      // Reload data
      loadCustomerProfile();
      loadTransactions();
      // Clean up URL
      window.history.replaceState({}, '', '/customer-dashboard?tab=wallet');
    }
    
    if (purchaseVerified === 'true') {
      toast({ 
        title: "Success", 
        description: "Purchase completed successfully!",
        duration: 3000
      });
      // Clear store cart from localStorage after successful purchase
      localStorage.removeItem('store_cart');
      localStorage.removeItem('store_cart_business');
      localStorage.removeItem('store_cart_business_info');
      setStoreCartBusiness(null);
      setCart([]);
      // Reload data
      loadCustomerProfile();
      loadProducts(selectedBranchId);
      loadTransactions();
      // Clean up URL
      window.history.replaceState({}, '', '/customer-dashboard?tab=overview');
    }
    
    // Set active tab if specified
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const loadCustomerProfile = async () => {
    try {
      const response = await apiGet("business/customer/profile/");
      if (response.success) {
        setProfile(response.profile);
        
        // If no storeCartBusiness set, use business_payment_settings from profile
        // This ensures payment options are correctly shown based on business preference
        if (!storeCartBusiness && response.business_payment_settings) {
          const settings = response.business_payment_settings;
          setStoreCartBusiness({
            id: 0,
            name: '',
            slug: '',
            preferred_payment_gateway: settings.preferred_payment_gateway,
            manual_payment_bank_name: settings.manual_payment_bank_name,
            manual_payment_account_number: settings.manual_payment_account_number,
            manual_payment_account_name: settings.manual_payment_account_name,
            bank_transfer_enabled: settings.bank_transfer_enabled,
            pay_on_delivery_enabled: settings.pay_on_delivery_enabled,
            buy_on_credit_enabled: settings.buy_on_credit_enabled,
          });
        }
        
        // Load store features from response
        if (response.store_features) {
          setStoreFeatures(response.store_features);
          
          // Fetch flash sales if enabled
          if (response.store_features.flash_sales_enabled && response.store_features.business_slug) {
            loadFlashSales(response.store_features.business_slug);
          }
          
          // Fetch top sellers if enabled
          if (response.store_features.top_sellers_enabled && response.store_features.business_slug) {
            loadTopSellers(response.store_features.business_slug);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };
  
  const loadFlashSales = async (slug: string) => {
    try {
      const response = await apiGet(`public/business/${slug}/flash-sales/`);
      if (response.products) {
        setFlashSaleProducts(response.products);
        // Set countdown end time from the first product's end time
        if (response.products.length > 0 && response.products[0].flash_sale_end) {
          const endTime = new Date(response.products[0].flash_sale_end).getTime();
          setFlashSaleEndTime(endTime);
        } else {
          setFlashSaleEndTime(null);
        }
      }
    } catch (error) {
      console.error("Failed to load flash sales:", error);
    }
  };
  
  const loadTopSellers = async (slug: string) => {
    try {
      const response = await apiGet(`public/business/${slug}/top-sellers/`);
      if (response.products) {
        setTopSellerProducts(response.products);
      }
    } catch (error) {
      console.error("Failed to load top sellers:", error);
    }
  };

  const loadProducts = async (branchId?: number | null) => {
    try {
      const params = new URLSearchParams();
      if (branchId) {
        params.append('branch_id', branchId.toString());
      }
      const url = `business/customer/products/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiGet(url);
      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  // Load products when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      loadProducts(selectedBranchId);
    } else {
      loadProducts();
    }
  }, [selectedBranchId]);

  // Flash sale countdown timer - uses real end time from API
  useEffect(() => {
    if (!flashSaleEndTime) {
      setFlashSaleTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = flashSaleEndTime - now;
      if (diff > 0) {
        setFlashSaleTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      } else {
        setFlashSaleTimeLeft(null);
        setFlashSaleEndTime(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSaleEndTime]);

  // Wallet balance polling - refresh every 15 seconds when on wallet tab or after funding
  const [walletPollingEnabled, setWalletPollingEnabled] = useState(false);
  
  useEffect(() => {
    // Enable polling when on wallet tab
    if (activeTab === 'wallet') {
      setWalletPollingEnabled(true);
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (!walletPollingEnabled) return;
    
    const pollWallet = async () => {
      try {
        const response = await apiGet("business/customer/profile/");
        if (response.success && response.profile) {
          // Update wallet balance without full profile refresh to avoid flickering
          setProfile(prev => prev ? { ...prev, wallet_balance: response.profile.wallet_balance } : prev);
        }
      } catch (error) {
        console.error("Wallet poll error:", error);
      }
    };
    
    // Poll every 15 seconds
    const interval = setInterval(pollWallet, 15000);
    
    // Stop polling after 5 minutes (20 polls)
    const timeout = setTimeout(() => {
      setWalletPollingEnabled(false);
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [walletPollingEnabled]);

  // Notification functions
  const loadNotifications = async () => {
    try {
      const response = await apiGet("business/customer/notifications/?limit=100");
      if (response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      await apiPost(`business/customer/notifications/${notificationId}/read/`, {});
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiPost("business/customer/notifications/read-all/", {});
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiGet("business/customer/wallet/transactions/");
      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const loadCreditRecords = async () => {
    try {
      const response = await apiGet("business/customer/credit/");
      if (response.success) {
        setCreditRecords(response.credits || []);
      }
    } catch (error) {
      console.error("Failed to load credit records:", error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await apiGet("business/customer/purchases/");
      if (response.success) {
        setPurchases(response.purchases || []);
      }
    } catch (error) {
      console.error("Failed to load purchases:", error);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const response = await apiGet("business/customer/orders/");
      if (response.success) {
        setPendingOrders(response.orders || []);
      }
    } catch (error) {
      console.error("Failed to load pending orders:", error);
    }
  };

  const handlePayOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      const response = await apiPost(`business/customer/orders/${selectedOrder.id}/pay/`, {
        payment_method: orderPaymentMethod,
        manual_payment_reference: orderPaymentReference,
        callback_url: `${window.location.origin}/customer-dashboard?order_payment=success`
      });
      
      if (response.success) {
        if (response.authorization_url) {
          // Redirect to payment gateway
          window.location.href = response.authorization_url;
        } else {
          toast({ title: "Success", description: response.message || "Order paid successfully!" });
          setShowPayOrderDialog(false);
          setSelectedOrder(null);
          setOrderPaymentReference("");
          loadPendingOrders();
          loadPurchases();
          loadCustomerProfile();
        }
      } else {
        toast({ title: "Error", description: response.error || "Payment failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Payment failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await apiPost(`business/customer/orders/${orderId}/cancel/`, {});
      
      if (response.success) {
        toast({ title: "Success", description: "Order cancelled successfully" });
        loadPendingOrders();
      } else {
        toast({ title: "Error", description: response.error || "Failed to cancel order", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (transaction: Transaction | Purchase, format: 'image' | 'pdf' = 'image') => {
    // Get business info from store cart business or from the page context
    const businessName = storeCartBusiness?.name || "Business";
    
    // Create receipt content
    const receiptDate = new Date(transaction.created_at);
    const receiptNumber = 'sale_number' in transaction 
      ? transaction.sale_number 
      : `RCP-${transaction.id.toString().padStart(8, '0')}`;
    
    // Get items - from Purchase or Transaction with sale_items
    const items: SaleItem[] = 'items' in transaction 
      ? transaction.items 
      : ('sale_items' in transaction && transaction.sale_items) 
        ? transaction.sale_items 
        : [];
    
    // Get amount
    const amount = 'final_amount' in transaction ? transaction.final_amount : transaction.amount;
    const isPurchase = 'payment_method' in transaction || ('type' in transaction && transaction.type === 'debit');
    
    // Calculate canvas height based on items
    const baseHeight = 400;
    const itemHeight = 25;
    const canvasHeight = baseHeight + (items.length * itemHeight) + (items.length > 0 ? 80 : 0);
    
    // Create canvas for drawing receipt
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: "Error", description: "Could not generate receipt", variant: "destructive" });
      return;
    }
    
    // Set canvas dimensions
    const width = 400;
    canvas.width = width;
    canvas.height = canvasHeight;
    
    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, canvasHeight);
    
    // Draw border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, width - 30, canvasHeight - 30);
    
    // Header
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(businessName, width / 2, 55);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Purchase Receipt', width / 2, 75);
    
    // Dashed line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.lineTo(width - 30, 90);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Receipt number and date
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(receiptNumber, width / 2, 115);
    
    ctx.font = '11px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(
      `${receiptDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })} at ${receiptDate.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`,
      width / 2,
      133
    );
    
    let yPos = 160;
    
    // Items section (if available)
    if (items.length > 0) {
      // Items header
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(30, yPos - 5, width - 60, 25);
      
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('ITEM', 40, yPos + 12);
      ctx.textAlign = 'center';
      ctx.fillText('QTY', width / 2, yPos + 12);
      ctx.textAlign = 'right';
      ctx.fillText('PRICE', width - 40, yPos + 12);
      
      yPos += 30;
      
      // Items list
      ctx.font = '11px Arial';
      items.forEach((item) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#333333';
        // Truncate product name if too long
        let productName = item.product_name;
        ctx.font = '11px Arial';
        while (ctx.measureText(productName).width > 150 && productName.length > 3) {
          productName = productName.slice(0, -4) + '...';
        }
        ctx.fillText(productName, 40, yPos);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666666';
        ctx.fillText(`${item.quantity}`, width / 2, yPos);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#333333';
        ctx.fillText(`₦${item.total_price.toLocaleString()}`, width - 40, yPos);
        
        yPos += itemHeight;
      });
      
      // Subtotal line
      ctx.strokeStyle = '#eeeeee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, yPos + 5);
      ctx.lineTo(width - 30, yPos + 5);
      ctx.stroke();
      
      yPos += 25;
    }
    
    // Total amount box
    ctx.fillStyle = isPurchase ? '#ffe6e6' : '#e6ffe6';
    ctx.fillRect(30, yPos, width - 60, 50);
    
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL AMOUNT', width / 2, yPos + 18);
    
    ctx.fillStyle = isPurchase ? '#ef4444' : '#22c55e';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`₦${amount.toLocaleString()}`, width / 2, yPos + 42);
    
    yPos += 70;
    
    // Payment method (if available)
    const paymentMethod = 'payment_method' in transaction ? transaction.payment_method : 
      ('sale_items' in transaction && transaction.payment_method) ? transaction.payment_method : 'wallet';
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.fillText('Payment Method:', 40, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), width - 40, yPos);
    
    yPos += 25;
    
    // Transaction ID
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.fillText('Transaction ID:', 40, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`#${transaction.id}`, width - 40, yPos);
    
    // Dashed line before footer
    yPos += 30;
    ctx.strokeStyle = '#cccccc';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, yPos);
    ctx.lineTo(width - 30, yPos);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Footer
    yPos += 25;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.fillText('Thank you for your purchase!', width / 2, yPos);
    ctx.font = '9px Arial';
    ctx.fillText(`Generated on ${new Date().toLocaleString('en-NG')}`, width / 2, yPos + 18);
    
    if (format === 'image') {
      // Download as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${receiptNumber}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Receipt Downloaded",
            description: "Your receipt has been saved as an image."
          });
        }
      }, 'image/png');
    } else {
      // Download as proper PDF using jsPDF
      try {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [width, canvasHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, canvasHeight);
        pdf.save(`receipt-${receiptNumber}.pdf`);
        
        toast({
          title: "Receipt Downloaded",
          description: "Your receipt has been saved as PDF."
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: "Error",
          description: "Could not generate PDF. Try downloading as image.",
          variant: "destructive"
        });
      }
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updateCartQuantity(product.id, 1);
    } else {
      if (product.current_stock <= 0) {
        toast({ title: "Error", description: "Product is out of stock", variant: "destructive" });
      } else {
        setCart([...cart, { ...product, quantity: 1 }]);
      }
    }
    toast({ title: "Added to cart", description: `${product.name} added to cart` });
    // Switch to overview tab and scroll to cart
    setActiveTab("overview");
    setTimeout(() => {
      const cartElement = document.querySelector('[data-cart-section]');
      if (cartElement) {
        cartElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const updateCartQuantity = (productId: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0.1, item.quantity + change);
        if (newQuantity > item.current_stock) {
          toast({ title: "Error", description: "Quantity exceeds available stock", variant: "destructive" });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const setDirectCartQuantity = (productId: number, quantity: string) => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    
    setCart(cart.map(item => {
      if (item.id === productId) {
        if (qty > item.current_stock) {
          toast({ title: "Error", description: "Quantity exceeds available stock", variant: "destructive" });
          return item;
        }
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const discountAmount = profile ? (cartTotal * profile.discount_percentage) / 100 : 0;
  const finalTotal = cartTotal - discountAmount;

  const handleFundWallet = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
        return;
      }

      console.log('[FUND_WALLET] Initiating wallet funding:', { amount, method: fundWalletMethod });
      
      // Check if bank transfer method
      if (fundWalletMethod === 'bank_transfer') {
        if (!fundWalletReference.trim()) {
          toast({ title: "Error", description: "Please enter your payment reference number", variant: "destructive" });
          return;
        }
        
        // Submit bank transfer request
        const response = await apiPost("business/customer/wallet/fund/bank-transfer/", { 
          amount,
          reference: fundWalletReference.trim()
        });
        
        if (response.success) {
          toast({ title: "Success", description: "Bank transfer submitted. Your wallet will be credited once verified.", variant: "default" });
          setShowFundWalletDialog(false);
          setFundAmount("");
          setFundWalletReference("");
          setFundWalletMethod('gateway');
          // Enable wallet polling to check for updates
          setWalletPollingEnabled(true);
        } else {
          toast({ title: "Error", description: response.error || "Failed to submit transfer", variant: "destructive" });
        }
        return;
      }
      
      // Initiate Flutterwave payment (gateway method)
      const response = await apiPost("business/customer/wallet/fund/initiate/", { amount });
      console.log('[FUND_WALLET] Response received:', response);
      
      if (response.success && response.payment_link) {
        console.log('[FUND_WALLET] Redirecting to payment link:', response.payment_link);
        // Redirect to Flutterwave payment page
        window.location.href = response.payment_link;
      } else {
        console.error('[FUND_WALLET] Payment initialization failed:', response);
        toast({ title: "Error", description: response.error || "Failed to initialize payment", variant: "destructive" });
      }
    } catch (error) {
      console.error('[FUND_WALLET] Error:', error);
      toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Get delivery quote
  const getDeliveryQuote = async () => {
    if (!deliveryAddress.trim()) {
      toast({ title: "Error", description: "Please enter a delivery address", variant: "destructive" });
      return;
    }

    try {
      setLoadingQuote(true);
      
      const businessId = storeCartBusiness?.id || profile?.id;
      const branchId = storeCartBusiness?.branch?.id || selectedBranchId;
      
      const response = await apiPost("delivery/quote/", {
        business_id: businessId,
        branch_id: branchId,
        delivery_address: deliveryAddress,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
      });

      if (response.success) {
        setDeliveryQuote(response.quote);
        if (response.quote.free_delivery) {
          toast({ title: "🎉 Free Delivery!", description: "Your order qualifies for free delivery" });
        }
      } else {
        toast({ title: "Error", description: response.error || "Failed to get delivery quote", variant: "destructive" });
        setDeliveryQuote(null);
      }
    } catch (error) {
      console.error('[DELIVERY_QUOTE] Error:', error);
      toast({ title: "Error", description: "Failed to get delivery quote", variant: "destructive" });
      setDeliveryQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      if (cart.length === 0) {
        toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
        return;
      }

      // Validate delivery address if delivery is selected
      if (fulfillmentMethod === 'delivery' && !deliveryAddress.trim()) {
        toast({ title: "Error", description: "Please enter a delivery address", variant: "destructive" });
        return;
      }

      const payload: any = {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        payment_method: paymentMethod,
        use_loyalty_discount: true,
        branch_id: storeCartBusiness?.branch?.id || selectedBranchId || null,
        fulfillment_method: fulfillmentMethod,
        customer_note: customerNote.trim() || null
      };

      // Add manual payment reference if bank transfer
      if (paymentMethod === 'bank_transfer') {
        payload.manual_payment_reference = manualPaymentReference;
      }

      // Add delivery data if delivery is selected
      if (fulfillmentMethod === 'delivery') {
        payload.delivery = {
          address: deliveryAddress,
          instructions: deliveryInstructions,
          contact_name: profile?.name,
          contact_phone: profile?.phone,
          quote_id: deliveryQuote?.quote_id,
          delivery_fee: deliveryQuote?.delivery_fee || 0,
          distance_km: deliveryQuote?.distance_km
        };
      }

      console.log('[CHECKOUT] Initiating purchase:', payload);
      const response = await apiPost("business/customer/purchase/", payload);
      console.log('[CHECKOUT] Response received:', response);
      
      if (response.success) {
        // Check if payment gateway requires redirect
        if (response.requires_redirect && response.payment_link) {
          console.log('[CHECKOUT] Redirecting to payment gateway:', response.payment_link);
          // Redirect to payment gateway
          window.location.href = response.payment_link;
          return;
        }
        
        // For wallet/credit/bank_transfer payments
        console.log('[CHECKOUT] Purchase completed without redirect');
        console.log('[CHECKOUT] Full response:', response);
        
        // Get digital product info from backend response (authoritative source)
        const saleItems = response.sale?.items || [];
        const hasDigitalProducts = response.sale?.has_digital_products || saleItems.some((item: any) => item.is_digital);
        
        // Build purchase success data - prefer backend response for digital info
        const purchaseItems = saleItems.length > 0 
          ? saleItems.map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              is_digital: item.is_digital,
              digital_download_url: item.digital_download_url,
              digital_access_instructions: item.digital_access_instructions
            }))
          : cart.map(item => ({
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.selling_price,
              total_price: item.selling_price * item.quantity,
              is_digital: item.is_digital,
              digital_download_url: item.digital_download_url,
              digital_access_instructions: item.digital_access_instructions
            }));
        
        console.log('[CHECKOUT] Purchase items:', purchaseItems);
        console.log('[CHECKOUT] Has digital products:', hasDigitalProducts);
        
        setPurchaseSuccessData({
          sale_id: response.sale?.id || response.sale_id,
          sale_number: response.sale?.sale_number || response.sale_number,
          total_amount: response.sale?.final_amount || cartTotal,
          items: purchaseItems,
          has_digital_products: hasDigitalProducts,
          delivery_tracking_code: response.delivery?.tracking_code || null,
          is_order: response.is_order || false,
          payment_method: response.payment_method || paymentMethod,
          payment_status: response.payment_status,
          message: response.message
        });
        
        // Clear cart and states first
        setCart([]);
        // Clear store cart from localStorage
        localStorage.removeItem('store_cart');
        localStorage.removeItem('store_cart_business');
        localStorage.removeItem('store_cart_business_info');
        setStoreCartBusiness(null);
        setShowCheckoutDialog(false);
        setManualPaymentReference(""); // Reset manual payment reference
        
        // Reset delivery states
        setFulfillmentMethod('pickup');
        setDeliveryAddress("");
        setDeliveryInstructions("");
        setDeliveryQuote(null);
        
        // Show congratulations dialog
        setShowPurchaseSuccessDialog(true);
        
        loadCustomerProfile();
        loadProducts(selectedBranchId);
        loadTransactions();
        loadPendingOrders(); // Reload pending orders
        if (paymentMethod === 'credit') {
          loadCreditRecords();
        }
      } else {
        console.error('[CHECKOUT] Purchase failed:', response);
        toast({ title: "Error", description: response.error || "Purchase failed", variant: "destructive" });
      }
    } catch (error) {
      console.error('[CHECKOUT] Error:', error);
      toast({ title: "Error", description: "Purchase failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePayCredit = async () => {
    if (!selectedCredit) return;
    
    try {
      setLoading(true);
      const response = await apiPost(`business/customer/credit/${selectedCredit.id}/pay/`, { 
        amount: selectedCredit.balance,
        payment_method: creditPaymentMethod 
      });
      
      if (response.success) {
        // Check if payment gateway requires redirect
        if (response.requires_redirect && response.payment_link) {
          console.log('[CREDIT_PAYMENT] Redirecting to payment gateway:', response.payment_link);
          window.location.href = response.payment_link;
          return;
        }
        
        // For wallet payments
        toast({ title: "Success", description: "Credit payment successful" });
        setShowCreditPaymentDialog(false);
        setSelectedCredit(null);
        loadCreditRecords();
        loadCustomerProfile();
        loadTransactions();
      } else {
        toast({ title: "Error", description: response.error || "Payment failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Payment failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handle submitting a product review
  const handleSubmitReview = async () => {
    if (!reviewProductId || !reviewSaleId) {
      toast({ title: "Error", description: "Missing review information", variant: "destructive" });
      return;
    }
    
    try {
      setSubmittingReview(true);
      const response = await apiPost("business/customer/reviews/", {
        sale_id: reviewSaleId,
        sale_item_id: reviewSaleItemId,
        product_id: reviewProductId,
        rating: reviewRating,
        comment: reviewComment.trim() || null
      });
      
      if (response.success) {
        toast({ title: "Thank you!", description: "Your review has been submitted" });
        setShowReviewDialog(false);
        setReviewProductId(null);
        setReviewProductName("");
        setReviewRating(5);
        setReviewComment("");
        setReviewSaleId(null);
        setReviewSaleItemId(null);
      } else {
        toast({ title: "Error", description: response.error || "Failed to submit review", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Open review dialog for a product
  const openReviewDialog = (productId: number, productName: string, saleId: number, saleItemId?: number) => {
    setReviewProductId(productId);
    setReviewProductName(productName);
    setReviewSaleId(saleId);
    setReviewSaleItemId(saleItemId || null);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewDialog(true);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-6xl">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 sm:p-8">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          {/* Top row: Customer name and Cart */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm opacity-80">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile.name}</h1>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="relative shadow-lg flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-0">
                  <ShoppingCart className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cart</span>
                  {cart.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  My Cart ({cart.length} items)
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-1">Add products from the Products tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {storeCartBusiness && (
                      <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 mb-4">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">From: <strong>{storeCartBusiness.name}</strong></span>
                      </div>
                    )}
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">₦{item.selling_price.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => updateCartQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => updateCartQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{(item.selling_price * item.quantity).toLocaleString()}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <SheetFooter className="mt-4 flex-col gap-3">
                  <div className="w-full flex justify-between items-center py-3 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold">₦{cartTotal.toLocaleString()}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setShowCheckoutDialog(true);
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
          </div>
          
          {/* Wallet Section - below name and cart row */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 sm:flex-initial sm:min-w-[280px] md:min-w-[320px]">
              <Wallet className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-lg sm:text-xl flex-1 sm:flex-initial">
                {showBalance ? `₦${(profile.wallet_balance || 0).toLocaleString()}` : '₦••••••'}
              </span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 w-8 p-0 bg-white/30 hover:bg-white/40 text-white border-0 rounded-lg flex-shrink-0"
                onClick={() => setShowFundWalletDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation & Store Info Section */}
      <div className="space-y-4">
        {/* Branch Selector - Show for multi-branch businesses, but NOT when cart came from public store */}
        {branches.length > 1 && !storeCartBusiness && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Select Store Location:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <Button
                    key={branch.id}
                    variant={selectedBranchId === branch.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBranchId(branch.id)}
                    className="shrink-0"
                  >
                    {branch.name}
                    {branch.is_main_branch && (
                      <Badge variant="secondary" className="ml-1 text-xs">Main</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            {selectedBranchId && (
              <p className="text-xs text-muted-foreground mt-2">
                {branches.find(b => b.id === selectedBranchId)?.address || 'Products from selected location'}
              </p>
            )}
          </Card>
        )}
        
        {/* Show store cart branch info (read-only) */}
        {storeCartBusiness?.branch && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Shopping from: <strong>{storeCartBusiness.branch.name}</strong></span>
            </div>
            {storeCartBusiness.branch.address && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {storeCartBusiness.branch.address}
              </p>
            )}
          </Card>
        )}
        
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-2 focus:border-primary/50"
          />
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Search Results - show when searching (on top of everything) */}
      {searchQuery && (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search Results for "{searchQuery}"
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const filteredProducts = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category?.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (filteredProducts.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products found matching "{searchQuery}"</p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="border-2 rounded-xl p-3 hover:shadow-lg hover:border-primary/30 transition-all"
                    >
                      <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <h4 className="font-semibold text-xs mb-1 line-clamp-2 min-h-[2rem]">{product.name}</h4>
                      <p className="text-sm font-bold text-primary mb-2">₦{product.selling_price.toLocaleString()}</p>
                      <Button 
                        size="sm" 
                        className="w-full text-xs rounded-lg" 
                        onClick={() => addToCart(product)}
                        disabled={product.current_stock <= 0}
                      >
                        {product.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            <button 
              onClick={() => setActiveTab('products')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-center">Products</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors relative"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-center">Orders</span>
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('purchases')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-center">Purchases</span>
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-center">Wallet</span>
            </button>
            <button 
              onClick={() => setActiveTab('deliveries')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-center">Deliveries</span>
            </button>
            <button 
              onClick={() => navigate('/customer-tracking')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Package className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-xs font-medium text-center">Track</span>
            </button>
            <button 
              onClick={() => setActiveTab('credit')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-center">Credit</span>
            </button>
            <button 
              onClick={() => setShowFundWalletDialog(true)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Plus className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="text-xs font-medium text-center">Top Up</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Flash Sales Section - if enabled and on overview tab */}
      {storeFeatures.flash_sales_enabled && flashSaleProducts.length > 0 && !searchQuery && activeTab === 'overview' && (
        <Card className="border-2 border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Zap className="w-5 h-5" />
                Flash Sales
              </CardTitle>
              {flashSaleTimeLeft && (
                <Badge variant="destructive" className="animate-pulse">
                  {String(flashSaleTimeLeft.hours).padStart(2, '0')}:
                  {String(flashSaleTimeLeft.minutes).padStart(2, '0')}:
                  {String(flashSaleTimeLeft.seconds).padStart(2, '0')}
                </Badge>
              )}
            </div>
            <CardDescription>Limited time offers - grab them before they're gone!</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                {flashSaleProducts.slice(0, 8).map((product: any) => {
                  const price = parseFloat(product.flash_sale_price || product.selling_price || 0);
                  const imageUrl = product.image_url || product.image;
                  return (
                  <div 
                    key={product.id} 
                    className="flex-shrink-0 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 bg-white dark:bg-background hover:shadow-lg transition-all" 
                    style={{ width: '140px' }}
                  >
                    <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <h4 className="font-semibold text-xs mb-1 line-clamp-2 min-h-[2rem]">{product.name}</h4>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">₦{price.toLocaleString()}</p>
                    <Button 
                      size="sm" 
                      className="w-full text-xs mt-2 h-7 bg-red-600 hover:bg-red-700" 
                      onClick={() => addToCart({...product, selling_price: price, image_url: imageUrl})}
                    >
                      Add
                    </Button>
                  </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Sellers Section - if enabled and on overview tab */}
      {storeFeatures.top_sellers_enabled && topSellerProducts.length > 0 && !searchQuery && activeTab === 'overview' && (
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Top Sellers
            </CardTitle>
            <CardDescription>Most popular products from this store</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                {topSellerProducts.slice(0, storeFeatures.top_sellers_count).map((product: any) => {
                  const price = parseFloat(product.selling_price || 0);
                  const imageUrl = product.image_url || product.image;
                  return (
                  <div 
                    key={product.id} 
                    className="flex-shrink-0 border-2 rounded-xl p-3 hover:shadow-lg hover:border-amber-300 transition-all" 
                    style={{ width: '140px' }}
                  >
                    <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                      <Badge className="absolute top-1 right-1 bg-amber-500 text-xs px-1">
                        <Star className="w-3 h-3" />
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-xs mb-1 line-clamp-2 min-h-[2rem]">{product.name}</h4>
                    <p className="text-sm font-bold text-primary">₦{price.toLocaleString()}</p>
                    <Button 
                      size="sm" 
                      className="w-full text-xs mt-2 h-7" 
                      onClick={() => addToCart({...product, selling_price: price, image_url: imageUrl})}
                    >
                      Add
                    </Button>
                  </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Hidden when searching */}
      {!searchQuery && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Access Products */}
          {(() => {
            const filteredProducts = products.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 12);
            
            if (filteredProducts.length > 0) {
              return (
                <Card className="border-2 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Quick Add Products
                    </CardTitle>
                    <CardDescription>Popular items - add to cart quickly</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="relative">
                      {/* Horizontal scrollable container */}
                      <div 
                        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                        style={{ 
                          scrollbarWidth: 'thin',
                          scrollBehavior: 'smooth'
                        }}
                      >
                        <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                          {filteredProducts.map(product => (
                            <div 
                              key={product.id} 
                              className="flex-shrink-0 border-2 rounded-xl p-3 hover:shadow-lg hover:border-primary/30 transition-all" 
                              style={{ width: '160px' }}
                            >
                              <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <h4 className="font-semibold text-xs mb-1 line-clamp-2 min-h-[2rem]">{product.name}</h4>
                              <p className="text-sm font-bold text-primary mb-2">₦{product.selling_price.toLocaleString()}</p>
                              <Button 
                                size="sm" 
                                className="w-full text-xs rounded-lg" 
                                onClick={() => addToCart(product)}
                                disabled={product.current_stock <= 0}
                              >
                                {product.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Scroll indicator if more than 3 products */}
                      {filteredProducts.length > 3 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-background via-background/80 to-transparent pl-8 pr-2 pointer-events-none">
                          <div className="text-muted-foreground text-sm animate-pulse">→</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Cart Preview */}
          {cart.length > 0 && (
            <Card data-cart-section className="border-2 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
                      <CardDescription>Review your items and proceed to checkout</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCart([])}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">₦{item.selling_price.toLocaleString()} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => updateCartQuantity(item.id, -0.5)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => setDirectCartQuantity(item.id, e.target.value)}
                          className="w-14 h-8 text-center text-sm rounded-lg"
                        />
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => updateCartQuantity(item.id, 0.5)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <p className="font-bold w-20 text-right">₦{(item.selling_price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t-2 border-dashed pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₦{cartTotal.toLocaleString()}</span>
                    </div>
                    {profile.discount_percentage > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({profile.discount_percentage}%):</span>
                        <span>-₦{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total:</span>
                      <span className="text-primary">₦{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full rounded-xl h-12 text-base font-semibold" size="lg" onClick={() => setShowCheckoutDialog(true)}>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {(() => {
            // Filter products by search query
            const filteredProducts = products.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            // Group products by their parent category
            const categoryGroups = filteredProducts.reduce((acc, product) => {
              const parentCategory = product.parent_category || product.category || 'Uncategorized';
              if (!acc[parentCategory]) acc[parentCategory] = [];
              acc[parentCategory].push(product);
              return acc;
            }, {} as Record<string, typeof filteredProducts>);

            // Sort categories: fish first, then turkey/chicken, then alphabetically
            const sortedCategories = Object.entries(categoryGroups).sort(([a], [b]) => {
              const aLower = a.toLowerCase();
              const bLower = b.toLowerCase();
              
              // Fish categories first
              const aIsFish = aLower.includes('fish') || aLower.includes('seafood');
              const bIsFish = bLower.includes('fish') || bLower.includes('seafood');
              if (aIsFish && !bIsFish) return -1;
              if (!aIsFish && bIsFish) return 1;
              
              // Turkey/Chicken categories second
              const aIsPoultry = aLower.includes('turkey') || aLower.includes('chicken') || aLower.includes('poultry');
              const bIsPoultry = bLower.includes('turkey') || bLower.includes('chicken') || bLower.includes('poultry');
              if (aIsPoultry && !bIsPoultry) return -1;
              if (!aIsPoultry && bIsPoultry) return 1;
              
              // Rest alphabetically
              return a.localeCompare(b);
            });

            return sortedCategories.map(([category, categoryProducts]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>{categoryProducts.length} products available</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative">
                    {/* Horizontal scrollable container */}
                    <div 
                      className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                      style={{ 
                        scrollbarWidth: 'thin',
                        scrollBehavior: 'smooth'
                      }}
                    >
                      <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                        {categoryProducts.map(product => (
                          <Card 
                            key={product.id} 
                            className="flex-shrink-0 hover:shadow-lg transition-shadow cursor-pointer" 
                            style={{ width: '180px' }}
                          >
                            <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="h-10 w-10 text-gray-400" />
                              )}
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                                {product.name}
                              </h3>
                              <p className="text-lg font-bold text-primary mb-2">
                                ₦{product.selling_price.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground mb-3">
                                {product.current_stock > 0 ? `${product.current_stock} in stock` : 'Out of stock'}
                              </p>
                              <Button 
                                size="sm"
                                className="w-full" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                disabled={product.current_stock <= 0}
                                variant={product.current_stock <= 0 ? 'secondary' : 'default'}
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                {product.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    {/* Scroll indicators if more than 3 products */}
                    {categoryProducts.length > 3 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-background via-background/80 to-transparent pl-8 pr-2 pointer-events-none">
                        <div className="text-muted-foreground text-sm animate-pulse">→</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
          
          {products.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab - Pending Orders (Pay on Delivery, etc.) */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Pending Orders
              </CardTitle>
              <CardDescription>Orders awaiting payment (Pay on Delivery, Bank Transfer pending)</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending orders</p>
                  <p className="text-sm">Orders placed with Pay on Delivery will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <Card key={order.id} className="border-2 border-amber-200 dark:border-amber-800">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{order.sale_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={order.payment_status === 'pay_on_delivery' ? 'outline' : 'secondary'} 
                                   className={order.payment_status === 'pay_on_delivery' 
                                     ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                                     : ''}>
                              {order.payment_status === 'pay_on_delivery' ? '💰 Pay on Delivery' : 
                               order.payment_status === 'awaiting_approval' ? '🏦 Awaiting Confirmation' : 
                               order.payment_status}
                            </Badge>
                            <p className="text-lg font-bold mt-1">₦{order.final_amount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="space-y-2 border-t pt-3">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>₦{item.total_price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        
                        {order.notes && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                            <p className="text-muted-foreground">Note: {order.notes}</p>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button 
                            className="flex-1"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowPayOrderDialog(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                handleCancelOrder(order.id);
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab - All Purchase History */}
        <TabsContent value="purchases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Purchase History
              </CardTitle>
              <CardDescription>All your completed purchases (including gateway payments)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchases.map(purchase => (
                  <Card key={purchase.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{purchase.sale_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(purchase.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={purchase.payment_method === 'wallet' ? 'default' : 'secondary'}>
                            {purchase.payment_method}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => downloadReceipt(purchase, 'image')}>
                                <FileImage className="h-4 w-4 mr-2" />
                                Download as Image
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadReceipt(purchase, 'pdf')}>
                                <FileText className="h-4 w-4 mr-2" />
                                Download as PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-3 text-sm border-t pt-3">
                        {purchase.items.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-2">
                                {item.product_name} × {item.quantity}
                                {item.is_digital && (
                                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                                    <CloudDownload className="h-3 w-3 mr-1" />
                                    Digital
                                  </Badge>
                                )}
                              </span>
                              <span>₦{item.total_price.toLocaleString()}</span>
                            </div>
                            {/* Digital Product Download Section */}
                            {item.is_digital && (item.digital_file_url || item.digital_access_instructions) && (
                              <div className="bg-muted/50 rounded-lg p-3 space-y-2 ml-4">
                                {item.digital_file_url && (
                                  <a 
                                    href={item.digital_file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Access Your Digital Product
                                  </a>
                                )}
                                {item.digital_access_instructions && (
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                    {item.digital_access_instructions}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between font-bold mt-3 pt-3 border-t">
                        <span>Total</span>
                        <span className="text-primary">₦{purchase.final_amount.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {purchases.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No purchases yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Wallet Balance</CardTitle>
                  <CardDescription>Manage your wallet and view transactions</CardDescription>
                </div>
                <Button onClick={() => setShowFundWalletDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Fund Wallet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                <p className="text-4xl font-bold">₦{profile.wallet_balance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: ₦{transaction.balance_after.toLocaleString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadReceipt(transaction, 'image')}>
                            <FileImage className="h-4 w-4 mr-2" />
                            Download as Image (PNG)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadReceipt(transaction, 'pdf')}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download as PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-6">
          <CustomerDeliveryTracking embedded />
        </TabsContent>

        {/* Credit Tab */}
        <TabsContent value="credit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Records</CardTitle>
              <CardDescription>View and manage your credit purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditRecords.map(credit => (
                  <Card key={credit.id} className={credit.approval_status === 'rejected' ? 'border-red-200 bg-red-50/50' : credit.approval_status === 'pending_approval' ? 'border-yellow-200 bg-yellow-50/50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">{credit.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(credit.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* Approval Status Badge */}
                          {credit.approval_status === 'pending_approval' && (
                            <div className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              AWAITING APPROVAL
                            </div>
                          )}
                          {credit.approval_status === 'rejected' && (
                            <div className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              REJECTED
                            </div>
                          )}
                          {credit.approval_status === 'approved' && (
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              credit.status === 'paid' ? 'bg-green-100 text-green-700' :
                              credit.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {credit.status.toUpperCase()}
                            </div>
                          )}
                          {/* Legacy records without approval_status */}
                          {!credit.approval_status && (
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              credit.status === 'paid' ? 'bg-green-100 text-green-700' :
                              credit.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {credit.status.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Rejection Reason */}
                      {credit.approval_status === 'rejected' && credit.rejection_reason && (
                        <div className="mb-4 p-3 bg-red-100 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Reason:</strong> {credit.rejection_reason}
                          </p>
                        </div>
                      )}
                      
                      {/* Pending Approval Message */}
                      {credit.approval_status === 'pending_approval' && (
                        <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            Your credit purchase is awaiting approval from the business owner. You will be notified once approved.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-bold">₦{credit.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount Paid</p>
                          <p className="font-bold text-green-600">₦{credit.amount_paid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className="font-bold text-red-600">₦{credit.balance.toLocaleString()}</p>
                        </div>
                      </div>
                      {/* Only show pay button if approved and has balance */}
                      {credit.approval_status !== 'pending_approval' && credit.approval_status !== 'rejected' && credit.balance > 0 && (
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            setSelectedCredit(credit);
                            setShowCreditPaymentDialog(true);
                            setCreditPaymentMethod('wallet');
                          }}
                          disabled={loading}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay ₦{credit.balance.toLocaleString()}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {creditRecords.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No credit records</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>View all your notifications</CardDescription>
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                    Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">You'll see updates about your orders, credit approvals, and more here</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        !notification.read 
                          ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <span className="text-xs text-primary">New</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      )}

      {/* Fund Wallet Dialog */}
      <Dialog open={showFundWalletDialog} onOpenChange={setShowFundWalletDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>Choose how you want to add funds to your wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={fundWalletMethod === 'gateway' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setFundWalletMethod('gateway')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card/Bank
                </Button>
                {storeCartBusiness?.bank_transfer_enabled && (
                  <Button
                    variant={fundWalletMethod === 'bank_transfer' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setFundWalletMethod('bank_transfer')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Button>
                )}
              </div>
            </div>
            
            {/* Bank Transfer Details */}
            {fundWalletMethod === 'bank_transfer' && storeCartBusiness?.bank_transfer_enabled && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-sm">Transfer to:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Bank:</span> {storeCartBusiness.manual_payment_bank_name}</p>
                  <p><span className="text-muted-foreground">Account:</span> {storeCartBusiness.manual_payment_account_number}</p>
                  <p><span className="text-muted-foreground">Name:</span> {storeCartBusiness.manual_payment_account_name}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {/* Show total with fee for bank transfer */}
              {fundWalletMethod === 'bank_transfer' && fundAmount && parseFloat(fundAmount) > 0 && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount to credit:</span>
                    <span className="font-medium">₦{parseFloat(fundAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing fee:</span>
                    <span className="font-medium">₦{PLATFORM_FEE.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-blue-200 dark:border-blue-700">
                    <span>Total to pay:</span>
                    <span className="text-primary">₦{(parseFloat(fundAmount) + PLATFORM_FEE).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reference Number for Bank Transfer */}
            {fundWalletMethod === 'bank_transfer' && (
              <div>
                <Label>Payment Reference Number</Label>
                <Input
                  type="text"
                  value={fundWalletReference}
                  onChange={(e) => setFundWalletReference(e.target.value)}
                  placeholder="Enter your bank transfer reference"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the reference number from your bank transfer receipt
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundWalletDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleFundWallet} 
              disabled={loading || !fundAmount || (fundWalletMethod === 'bank_transfer' && !fundWalletReference)}
            >
              {loading ? "Processing..." : fundWalletMethod === 'bank_transfer' ? "Submit Transfer" : "Fund Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Choose fulfillment and payment method</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Fulfillment Method Selection */}
            <div className="space-y-2">
              <Label>How would you like to receive your order?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={fulfillmentMethod === 'pickup' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => {
                    setFulfillmentMethod('pickup');
                    setDeliveryQuote(null);
                  }}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Pickup
                </Button>
                <Button
                  variant={fulfillmentMethod === 'delivery' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setFulfillmentMethod('delivery')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Delivery
                </Button>
              </div>
            </div>

            {/* Show pickup branch if pickup selected */}
            {fulfillmentMethod === 'pickup' && (storeCartBusiness?.branch || (selectedBranchId && branches.length > 1)) && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pickup Location
                </p>
                {storeCartBusiness?.branch ? (
                  <>
                    <p className="font-semibold">{storeCartBusiness.branch.name}</p>
                    {storeCartBusiness.branch.address && (
                      <p className="text-sm text-muted-foreground">{storeCartBusiness.branch.address}</p>
                    )}
                    {storeCartBusiness.branch.phone && (
                      <p className="text-sm text-muted-foreground">Tel: {storeCartBusiness.branch.phone}</p>
                    )}
                  </>
                ) : (
                  (() => {
                    const branch = branches.find(b => b.id === selectedBranchId);
                    return branch ? (
                      <>
                        <p className="font-semibold">{branch.name}</p>
                        {branch.address && (
                          <p className="text-sm text-muted-foreground">{branch.address}</p>
                        )}
                        {branch.phone && (
                          <p className="text-sm text-muted-foreground">Tel: {branch.phone}</p>
                        )}
                      </>
                    ) : null;
                  })()
                )}
              </div>
            )}

            {/* Delivery Details */}
            {fulfillmentMethod === 'delivery' && (
              <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Details
                </p>
                <div className="space-y-2">
                  <Label htmlFor="delivery-address">Delivery Address *</Label>
                  <Textarea
                    id="delivery-address"
                    placeholder="Enter your full delivery address"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setDeliveryQuote(null); // Reset quote when address changes
                    }}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-instructions">Delivery Instructions (optional)</Label>
                  <Input
                    id="delivery-instructions"
                    placeholder="e.g., Call when at gate, leave at door"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                  />
                </div>
                
                {/* Get Quote Button */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={getDeliveryQuote}
                  disabled={loadingQuote || !deliveryAddress.trim()}
                >
                  {loadingQuote ? "Getting Quote..." : "Get Delivery Quote"}
                </Button>

                {/* Delivery Quote Display */}
                {deliveryQuote && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Fee:</span>
                      {deliveryQuote.free_delivery ? (
                        <Badge variant="secondary" className="bg-green-500 text-white">FREE</Badge>
                      ) : (
                        <span className="font-semibold">₦{deliveryQuote.delivery_fee.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Est. Time:
                      </span>
                      <span>{deliveryQuote.estimated_minutes} mins</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Distance:</span>
                      <span>{deliveryQuote.distance_km.toFixed(1)} km</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid gap-2">
                <Button
                  variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setPaymentMethod('wallet')}
                  disabled={profile.wallet_balance < (finalTotal + (deliveryQuote?.delivery_fee || 0))}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet (₦{profile.wallet_balance.toLocaleString()})
                  {profile.wallet_balance < (finalTotal + (deliveryQuote?.delivery_fee || 0)) && (
                    <span className="ml-auto text-xs text-red-500">Insufficient balance</span>
                  )}
                </Button>
                
                {/* Payment Gateway - always show unless business ONLY accepts bank transfers */}
                <Button
                  variant={paymentMethod === 'gateway' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setPaymentMethod('gateway')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Gateway
                </Button>
                
                {/* Buy on Credit - show if business has it enabled (default true if not set) */}
                {(storeCartBusiness?.buy_on_credit_enabled !== false) && (
                  <Button
                    variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Buy on Credit
                  </Button>
                )}
                
                {/* Bank Account - show if business has bank transfer enabled and account configured */}
                {storeCartBusiness?.bank_transfer_enabled && storeCartBusiness?.manual_payment_account_number && (
                  <Button
                    variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setPaymentMethod('bank_transfer')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Button>
                )}
                
                {/* Pay on Delivery - 5th option, show if business has pay on delivery enabled */}
                {storeCartBusiness?.pay_on_delivery_enabled && (
                  <Button
                    variant={paymentMethod === 'pay_on_delivery' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setPaymentMethod('pay_on_delivery')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Pay on Delivery
                  </Button>
                )}
              </div>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank_transfer' && storeCartBusiness?.bank_transfer_enabled && storeCartBusiness?.manual_payment_account_number && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Transfer to the following account:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <span className="font-medium">{storeCartBusiness.manual_payment_bank_name || 'OPay/Moniepoint'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <span className="font-medium">{storeCartBusiness.manual_payment_account_number}</span>
                  </div>
                  {storeCartBusiness.manual_payment_account_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Name:</span>
                      <span className="font-medium">{storeCartBusiness.manual_payment_account_name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Payment Reference (optional)</Label>
                  <Input
                    placeholder="Enter your transfer reference"
                    value={manualPaymentReference}
                    onChange={(e) => setManualPaymentReference(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your order will be pending until the business owner verifies your payment
                  </p>
                </div>
              </div>
            )}

            {/* Pay on Delivery Info */}
            {paymentMethod === 'pay_on_delivery' && storeCartBusiness?.pay_on_delivery_enabled && (
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Pay on Delivery
                  </p>
                </div>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p>Your order will be created with a pending payment status.</p>
                  <p>You will receive an order ID that you can use to:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Pay when the goods are delivered to you</li>
                    <li>Bring the order to the store and pay in person</li>
                    <li>Pay via bank transfer or payment gateway later</li>
                  </ul>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  You can download your order details after checkout
                </p>
              </div>
            )}

            {/* Customer Note / Special Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="E.g. Please cut the meat into smaller pieces, wrap items separately, include extra packaging, etc."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Add any specific instructions for how you want your order prepared or handled
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
                {profile.discount_percentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({profile.discount_percentage}%):</span>
                    <span>-₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {fulfillmentMethod === 'delivery' && deliveryQuote && !deliveryQuote.free_delivery && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>₦{deliveryQuote.delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Processing Fee:</span>
                    <span>₦50</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₦{(
                    finalTotal + 
                    (fulfillmentMethod === 'delivery' && deliveryQuote && !deliveryQuote.free_delivery ? deliveryQuote.delivery_fee : 0) +
                    (paymentMethod === 'bank_transfer' ? 50 : 0)
                  ).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCheckout} 
              disabled={
                loading || 
                (paymentMethod === 'wallet' && profile.wallet_balance < (finalTotal + (deliveryQuote?.delivery_fee || 0))) ||
                (fulfillmentMethod === 'delivery' && (!deliveryAddress.trim() || !deliveryQuote))
              }
            >
              {loading ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Payment Dialog */}
      <Dialog open={showCreditPaymentDialog} onOpenChange={setShowCreditPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Credit</DialogTitle>
            <DialogDescription asChild>
              <div>
                {selectedCredit && (
                  <div className="space-y-2 mt-2">
                    <span className="block">{selectedCredit.description}</span>
                    <span className="block font-semibold">Amount Due: ₦{selectedCredit.balance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid gap-2">
                <Button
                  variant={creditPaymentMethod === 'wallet' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setCreditPaymentMethod('wallet')}
                  disabled={!profile || profile.wallet_balance < (selectedCredit?.balance || 0)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet (₦{profile?.wallet_balance.toLocaleString() || '0'})
                  {profile && selectedCredit && profile.wallet_balance < selectedCredit.balance && (
                    <span className="ml-auto text-xs text-red-500">Insufficient balance</span>
                  )}
                </Button>
                <Button
                  variant={creditPaymentMethod === 'gateway' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setCreditPaymentMethod('gateway')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Card/Bank
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreditPaymentDialog(false);
              setSelectedCredit(null);
            }}>Cancel</Button>
            <Button 
              onClick={handlePayCredit} 
              disabled={loading || (creditPaymentMethod === 'wallet' && (!profile || !selectedCredit || profile.wallet_balance < selectedCredit.balance))}
            >
              {loading ? "Processing..." : `Pay ₦${selectedCredit?.balance.toLocaleString() || '0'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pay Order Dialog */}
      <Dialog open={showPayOrderDialog} onOpenChange={setShowPayOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay for Order
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {selectedOrder && (
                  <div className="space-y-2 mt-2">
                    <span className="block font-medium">Order: {selectedOrder.sale_number}</span>
                    <span className="block text-lg font-bold">Amount: ₦{selectedOrder.final_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Items Summary */}
            {selectedOrder && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>₦{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <div className="grid gap-2">
                <Button
                  variant={orderPaymentMethod === 'wallet' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setOrderPaymentMethod('wallet')}
                  disabled={!profile || profile.wallet_balance < (selectedOrder?.final_amount || 0)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet (₦{profile?.wallet_balance.toLocaleString() || '0'})
                  {profile && selectedOrder && profile.wallet_balance < selectedOrder.final_amount && (
                    <span className="ml-auto text-xs text-red-500">Insufficient</span>
                  )}
                </Button>
                <Button
                  variant={orderPaymentMethod === 'gateway' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setOrderPaymentMethod('gateway')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Card/Bank
                </Button>
                
                {storeCartBusiness?.bank_transfer_enabled && storeCartBusiness?.manual_payment_account_number && (
                  <Button
                    variant={orderPaymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setOrderPaymentMethod('bank_transfer')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Button>
                )}
              </div>
            </div>
            
            {/* Bank Transfer Details */}
            {orderPaymentMethod === 'bank_transfer' && storeCartBusiness && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Bank Transfer Details</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Bank:</span> {storeCartBusiness.manual_payment_bank_name}</p>
                  <p><span className="text-muted-foreground">Account:</span> {storeCartBusiness.manual_payment_account_number}</p>
                  <p><span className="text-muted-foreground">Name:</span> {storeCartBusiness.manual_payment_account_name}</p>
                </div>
                <div className="pt-2">
                  <Label className="text-xs">Payment Reference (optional)</Label>
                  <Input
                    placeholder="Enter your transfer reference"
                    value={orderPaymentReference}
                    onChange={(e) => setOrderPaymentReference(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPayOrderDialog(false);
              setSelectedOrder(null);
              setOrderPaymentReference("");
            }}>Cancel</Button>
            <Button 
              onClick={handlePayOrder} 
              disabled={loading || (orderPaymentMethod === 'wallet' && (!profile || !selectedOrder || profile.wallet_balance < selectedOrder.final_amount))}
            >
              {loading ? "Processing..." : `Pay ₦${selectedOrder?.final_amount.toLocaleString() || '0'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Purchase Success/Congratulations Dialog */}
      <Dialog open={showPurchaseSuccessDialog} onOpenChange={setShowPurchaseSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              {purchaseSuccessData?.is_order ? 'Order Placed! 📦' : 'Congratulations! 🎉'}
            </DialogTitle>
            <DialogDescription>
              {purchaseSuccessData?.message || (purchaseSuccessData?.is_order 
                ? 'Your order has been placed successfully!' 
                : 'Your purchase was successful!')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {purchaseSuccessData?.sale_number && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-semibold">{purchaseSuccessData.sale_number}</p>
              </div>
            )}
            
            {purchaseSuccessData?.total_amount && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-500">
                  {purchaseSuccessData?.is_order ? 'Amount to Pay' : 'Total Paid'}
                </p>
                <p className="font-semibold text-lg">₦{purchaseSuccessData.total_amount.toLocaleString()}</p>
              </div>
            )}
            
            {/* Show payment method info for orders */}
            {purchaseSuccessData?.is_order && purchaseSuccessData?.payment_method === 'pay_on_delivery' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">💰 Pay on Delivery</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Payment will be collected when you receive your order. Please have the exact amount ready.
                </p>
              </div>
            )}
            
            {purchaseSuccessData?.is_order && purchaseSuccessData?.payment_method === 'bank_transfer' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">🏦 Bank Transfer Pending</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Please complete your bank transfer. Your order will be processed once payment is confirmed.
                </p>
              </div>
            )}
            
            {purchaseSuccessData?.is_order && purchaseSuccessData?.payment_method === 'credit' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">📝 Credit Request Pending</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Your credit request has been submitted. You will be notified once the business approves it.
                </p>
              </div>
            )}
            
            {purchaseSuccessData?.delivery_tracking_code && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Delivery Tracking</p>
                <p className="font-semibold">{purchaseSuccessData.delivery_tracking_code}</p>
              </div>
            )}
            
            {/* Digital Products Section */}
            {purchaseSuccessData?.has_digital_products && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <CloudDownload className="h-5 w-5" />
                  Your Digital Products
                </h4>
                {purchaseSuccessData.items?.filter(item => item.is_digital).map((item, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg space-y-2">
                    <p className="font-medium">{item.product_name}</p>
                    
                    {item.digital_download_url && (
                      <a 
                        href={item.digital_download_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full justify-center"
                      >
                        <Download className="h-4 w-4" />
                        Download Now
                      </a>
                    )}
                    
                    {item.digital_access_instructions && (
                      <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                        <p className="text-gray-500 text-xs mb-1">Access Instructions:</p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.digital_access_instructions}</p>
                      </div>
                    )}
                    
                    {!item.digital_download_url && !item.digital_access_instructions && (
                      <p className="text-sm text-purple-600">Check your email or contact the seller for access details.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Items Purchased */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-500">Items Purchased</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {purchaseSuccessData?.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm py-1">
                    <span className="flex items-center gap-2">
                      {item.is_digital && <Zap className="h-3 w-3 text-purple-500" />}
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>₦{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            {purchaseSuccessData?.items && purchaseSuccessData.items.length > 0 && purchaseSuccessData.sale_id && (
              <Button 
                variant="outline"
                onClick={() => {
                  const firstItem = purchaseSuccessData.items![0];
                  openReviewDialog(
                    firstItem.product_id, 
                    firstItem.product_name, 
                    purchaseSuccessData.sale_id!
                  );
                  setShowPurchaseSuccessDialog(false);
                }}
                className="w-full sm:w-auto"
              >
                <Star className="h-4 w-4 mr-2" />
                Leave a Review
              </Button>
            )}
            
            {/* View Orders button for pay_on_delivery orders */}
            {purchaseSuccessData?.is_order && (
              <Button 
                variant="outline"
                onClick={() => {
                  setShowPurchaseSuccessDialog(false);
                  setActiveTab('orders');
                }}
                className="w-full sm:w-auto"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
            )}
            
            <Button 
              onClick={() => setShowPurchaseSuccessDialog(false)}
              className="w-full sm:w-auto"
            >
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Leave a Review
            </DialogTitle>
            <DialogDescription>
              Share your experience with <span className="font-medium">{reviewProductName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {reviewRating === 1 && "Poor"}
                {reviewRating === 2 && "Fair"}
                {reviewRating === 3 && "Good"}
                {reviewRating === 4 && "Very Good"}
                {reviewRating === 5 && "Excellent!"}
              </p>
            </div>
            
            {/* Review Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment">Your Review (Optional)</Label>
              <Textarea
                id="review-comment"
                placeholder="Tell others what you thought about this product..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
