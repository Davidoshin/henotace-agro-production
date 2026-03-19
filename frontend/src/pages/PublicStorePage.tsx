import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StoreAuth from "@/components/store/StoreAuth";
import { getBaseUrl } from "@/lib/api";
import { 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  ShoppingCart,
  Package,
  User,
  LogIn,
  LogOut,
  Wallet,
  Star,
  Facebook,
  Instagram,
  Twitter,
  HelpCircle,
  Truck,
  RotateCcw,
  Info,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  X,
  ChevronDown
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface Business {
  id: number;
  name: string;
  slug: string;
  business_type?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  currency: string;
  categories: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
  featured_products: Array<Product>;
  total_products: number;
  // Public store info
  about_us?: string;
  owner_profile_image?: string;
  faqs?: string;
  shipping_info?: string;
  returns_policy?: string;
  // Bank account for manual payments
  manual_payment_bank_name?: string;
  manual_payment_account_number?: string;
  manual_payment_account_name?: string;
  // Payment options
  preferred_payment_gateway?: string;
  bank_transfer_enabled?: boolean;
  pay_on_delivery_enabled?: boolean;
  buy_on_credit_enabled?: boolean;
  // Social media
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  // Store appearance
  store_appearance?: {
    primary_color?: string;
    secondary_color?: string;
    navbar_color?: string;
    footer_color?: string;
    text_color?: string;
    font_size?: string;
    button_style?: string;
  };
  // Store features
  hero_slider_enabled?: boolean;
  hero_slider_images?: Array<{ url: string; alt: string; link: string }>;
  flash_sales_enabled?: boolean;
  top_sellers_enabled?: boolean;
  top_sellers_count?: number;
  show_pos_button?: boolean;
  // Analytics & Ads
  google_analytics_id?: string;
  google_analytics_enabled?: boolean;
  google_ads_id?: string;
  google_ads_conversion_id?: string;
  google_ads_enabled?: boolean;
  facebook_pixel_id?: string;
  facebook_pixel_enabled?: boolean;
  tiktok_pixel_id?: string;
  tiktok_pixel_enabled?: boolean;
  // Branches for pickup location
  branches?: Array<{
    id: number;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    is_main_branch: boolean;
  }>;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  selling_price: string;
  current_stock: number;
  image?: string;
  unit: string;
  category__name?: string;
  category__id?: number;
}

interface PaginatedProducts {
  products: Product[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  business: {
    name: string;
    slug: string;
    currency: string;
  };
}

interface CustomerInfo {
  id: number;
  customer_code: string;
  name: string;
  wallet_balance: number;
  loyalty_points: number;
  discount_percentage?: number;
}

interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface FlashSaleProduct {
  id: number;
  name: string;
  description?: string;
  original_price: string;
  flash_sale_price: string;
  discount_percentage: number;
  flash_sale_end: string;
  current_stock: number;
  image?: string;
  unit: string;
  category_name?: string;
}

interface TopSellerProduct {
  id: number;
  name: string;
  description?: string;
  selling_price: string;
  current_stock: number;
  image?: string;
  unit: string;
  category_name?: string;
  total_sold: number;
}

// Use centralized API base URL that handles environment correctly
const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

// Helper to format URLs - adds https:// if missing
const formatUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Flash Sale Countdown Component - Jumia Style
const FlashSaleCountdown = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, end - now);
      
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 sm:gap-1">
        <span className="bg-black text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono font-bold">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-white text-[10px] sm:text-xs">h</span>
        <span className="text-white text-[10px] sm:text-xs font-bold">:</span>
        <span className="bg-black text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono font-bold">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-white text-[10px] sm:text-xs">m</span>
        <span className="text-white text-[10px] sm:text-xs font-bold">:</span>
        <span className="bg-black text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono font-bold">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-white text-[10px] sm:text-xs">s</span>
      </div>
    </div>
  );
};

export default function PublicStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  // Auth state
  const [showAuth, setShowAuth] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  
  // Flash sales and top sellers state
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellerProduct[]>([]);
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
  
  // See All modal state
  const [showAllFlashSales, setShowAllFlashSales] = useState(false);
  const [showAllTopSellers, setShowAllTopSellers] = useState(false);
  
  // Cart state - initialize from localStorage if available
  const [cart, setCart] = useState<Array<{product: Product; quantity: number}>>(() => {
    try {
      const savedCart = localStorage.getItem('store_cart');
      const savedBusinessSlug = localStorage.getItem('store_cart_business');
      // Only restore cart if it's for the same business
      if (savedCart && savedBusinessSlug === slug) {
        return JSON.parse(savedCart);
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    return [];
  });
  // Selected branch for pickup/delivery
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    try {
      const savedBranch = localStorage.getItem('store_cart_branch');
      return savedBranch ? parseInt(savedBranch) : null;
    } catch {
      return null;
    }
  });
  const [showCart, setShowCart] = useState(false);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0 && slug) {
      localStorage.setItem('store_cart', JSON.stringify(cart));
      localStorage.setItem('store_cart_business', slug);
    } else if (cart.length === 0) {
      // Clear cart from localStorage when empty
      localStorage.removeItem('store_cart');
      localStorage.removeItem('store_cart_business');
      localStorage.removeItem('store_cart_branch');
    }
  }, [cart, slug]);

  // Save selected branch to localStorage
  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('store_cart_branch', selectedBranchId.toString());
    }
  }, [selectedBranchId]);

  // Auto-select main branch when business data loads
  useEffect(() => {
    if (business?.branches && business.branches.length > 0 && !selectedBranchId) {
      const mainBranch = business.branches.find(b => b.is_main_branch);
      setSelectedBranchId(mainBranch ? mainBranch.id : business.branches[0].id);
    }
  }, [business?.branches, selectedBranchId]);

  const { toast } = useToast();

  // Analytics tracking helper functions
  const trackAnalyticsEvent = (eventName: string, eventData: Record<string, any>) => {
    if (!business) return;

    // Google Analytics 4 event
    if (business.google_analytics_enabled && business.google_analytics_id && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventData);
    }

    // Google Ads conversion (for purchase events)
    if (business.google_ads_enabled && business.google_ads_id && eventName === 'purchase' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: business.google_ads_conversion_id 
          ? `${business.google_ads_id}/${business.google_ads_conversion_id}`
          : business.google_ads_id,
        value: eventData.value,
        currency: eventData.currency || 'NGN',
        transaction_id: eventData.transaction_id,
      });
    }

    // Facebook Pixel event
    if (business.facebook_pixel_enabled && business.facebook_pixel_id && (window as any).fbq) {
      const fbEventName = eventName === 'add_to_cart' ? 'AddToCart'
        : eventName === 'view_item' ? 'ViewContent'
        : eventName === 'begin_checkout' ? 'InitiateCheckout'
        : eventName === 'purchase' ? 'Purchase'
        : eventName;
      
      (window as any).fbq('track', fbEventName, {
        content_ids: eventData.items?.map((i: any) => i.item_id) || [eventData.item_id],
        content_type: 'product',
        value: eventData.value,
        currency: eventData.currency || 'NGN',
      });
    }

    // TikTok Pixel event
    if (business.tiktok_pixel_enabled && business.tiktok_pixel_id && (window as any).ttq) {
      const ttEventName = eventName === 'add_to_cart' ? 'AddToCart'
        : eventName === 'view_item' ? 'ViewContent'
        : eventName === 'begin_checkout' ? 'InitiateCheckout'
        : eventName === 'purchase' ? 'CompletePayment'
        : eventName;
      
      (window as any).ttq.track(ttEventName, {
        contents: eventData.items?.map((i: any) => ({ 
          content_id: i.item_id, 
          content_name: i.item_name,
          quantity: i.quantity,
          price: i.price 
        })) || [{ content_id: eventData.item_id }],
        value: eventData.value,
        currency: eventData.currency || 'NGN',
      });
    }
  };

  // Add to cart function
  const addToCart = (product: Product) => {
    // Track add to cart event
    trackAnalyticsEvent('add_to_cart', {
      item_id: product.id,
      item_name: product.name,
      value: parseFloat(product.selling_price),
      currency: business?.currency || 'NGN',
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: parseFloat(product.selling_price),
        quantity: 1,
      }],
    });

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        toast({
          title: "Cart Updated",
          description: `${product.name} quantity increased`,
        });
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
      return [...prev, { product, quantity: 1 }];
    });
    // Auto-open cart sheet on mobile for better UX
    setShowCart(true);
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  // Get cart total
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.product.selling_price) * item.quantity), 0);
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (!customer) {
      // Need to login first
      setShowAuth(true);
      return;
    }

    // Track begin_checkout event
    trackAnalyticsEvent('begin_checkout', {
      value: getCartTotal(),
      currency: business?.currency || 'NGN',
      items: cart.map(item => ({
        item_id: item.product.id,
        item_name: item.product.name,
        price: parseFloat(item.product.selling_price),
        quantity: item.quantity,
      })),
    });

    // Navigate to customer dashboard with cart - save business info for checkout
    localStorage.setItem('store_cart', JSON.stringify(cart));
    localStorage.setItem('store_cart_business', slug || '');
    if (business) {
      // Find selected branch info
      const selectedBranch = business.branches?.find(b => b.id === selectedBranchId);
      localStorage.setItem('store_cart_business_info', JSON.stringify({
        id: business.id,
        name: business.name,
        slug: business.slug,
        logo: business.logo || business.owner_profile_image,
        branch: selectedBranch || null,
        manual_payment_bank_name: business.manual_payment_bank_name,
        manual_payment_account_number: business.manual_payment_account_number,
        manual_payment_account_name: business.manual_payment_account_name,
        preferred_payment_gateway: business.preferred_payment_gateway,
        bank_transfer_enabled: business.bank_transfer_enabled,
        pay_on_delivery_enabled: business.pay_on_delivery_enabled,
        buy_on_credit_enabled: business.buy_on_credit_enabled
      }));
    }
    if (selectedBranchId) {
      localStorage.setItem('store_cart_branch', selectedBranchId.toString());
    }
    navigate('/customer-dashboard');
  };

  // Scroll functions for horizontal product list
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      // Update slider value based on scroll position
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setSliderValue((scrollLeft / maxScroll) * 100);
      }
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Handle touch swipe on product container
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || !scrollContainerRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX - currentX;
    scrollContainerRef.current.scrollLeft += diff;
    setTouchStartX(currentX);
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  // Check scroll buttons when products change
  useEffect(() => {
    checkScrollButtons();
    // Add scroll event listener
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      // Also check on resize
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [products]);

  // Check for existing login on mount
  useEffect(() => {
    const storedCustomer = localStorage.getItem('customer');
    const storedUser = localStorage.getItem('user');
    const storedBusiness = localStorage.getItem('current_business');
    
    if (storedCustomer && storedUser && storedBusiness) {
      try {
        const parsedBusiness = JSON.parse(storedBusiness);
        // Only restore if it's for this business
        if (parsedBusiness.slug === slug) {
          setCustomer(JSON.parse(storedCustomer));
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Clear invalid data
        localStorage.removeItem('customer');
        localStorage.removeItem('user');
        localStorage.removeItem('current_business');
      }
    }
  }, [slug]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('customer');
    localStorage.removeItem('user');
    localStorage.removeItem('current_business');
    setCustomer(null);
    setUser(null);
  };

  const handleAuthSuccess = (data: any) => {
    setUser(data.user);
    setCustomer(data.customer);
    setShowAuth(false);
    // Redirect to customer dashboard after successful login
    navigate('/customer-dashboard');
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Fetch business info
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/public/business/${slug}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("This business page does not exist or is no longer available.");
          } else {
            setError("Unable to load business information. Please try again later.");
          }
          return;
        }
        
        const data: Business = await response.json();
        setBusiness(data);
        setProducts(data.featured_products || []);
      } catch (err) {
        console.error("Error fetching business:", err);
        setError("Unable to connect to the server. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  // Inject analytics tracking scripts when business data is loaded
  useEffect(() => {
    if (!business) return;

    // Clean up previously injected scripts
    const cleanupScripts = () => {
      document.querySelectorAll('[data-analytics-script]').forEach(el => el.remove());
    };
    cleanupScripts();

    // Google Analytics 4
    if (business.google_analytics_enabled && business.google_analytics_id) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${business.google_analytics_id}`;
      gaScript.setAttribute('data-analytics-script', 'ga4');
      document.head.appendChild(gaScript);

      const gaConfigScript = document.createElement('script');
      gaConfigScript.setAttribute('data-analytics-script', 'ga4-config');
      gaConfigScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${business.google_analytics_id}', {
          page_title: '${business.name} - Online Store',
          page_location: window.location.href
        });
      `;
      document.head.appendChild(gaConfigScript);
    }

    // Google Ads Conversion Tracking
    if (business.google_ads_enabled && business.google_ads_id) {
      // Google Ads uses same gtag, just need to configure
      const gadsScript = document.createElement('script');
      gadsScript.setAttribute('data-analytics-script', 'gads');
      gadsScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('config', '${business.google_ads_id}');
      `;
      document.head.appendChild(gadsScript);
    }

    // Meta (Facebook) Pixel
    if (business.facebook_pixel_enabled && business.facebook_pixel_id) {
      const fbScript = document.createElement('script');
      fbScript.setAttribute('data-analytics-script', 'fb-pixel');
      fbScript.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${business.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Add noscript fallback
      const fbNoscript = document.createElement('noscript');
      fbNoscript.setAttribute('data-analytics-script', 'fb-pixel-noscript');
      fbNoscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${business.facebook_pixel_id}&ev=PageView&noscript=1"/>`;
      document.body.appendChild(fbNoscript);
    }

    // TikTok Pixel
    if (business.tiktok_pixel_enabled && business.tiktok_pixel_id) {
      const ttScript = document.createElement('script');
      ttScript.setAttribute('data-analytics-script', 'tiktok-pixel');
      ttScript.textContent = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${business.tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
    }

    // Cleanup on unmount
    return () => {
      cleanupScripts();
    };
  }, [business]);

  // Fetch flash sales
  useEffect(() => {
    const fetchFlashSales = async () => {
      if (!slug || !business?.flash_sales_enabled) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/business/${slug}/flash-sales/`);
        if (response.ok) {
          const data = await response.json();
          if (data.enabled && data.products) {
            setFlashSaleProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Error fetching flash sales:", err);
      }
    };
    
    if (business?.flash_sales_enabled) {
      fetchFlashSales();
    }
  }, [slug, business?.flash_sales_enabled]);

  // Fetch top sellers
  useEffect(() => {
    const fetchTopSellers = async () => {
      if (!slug || !business?.top_sellers_enabled) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/business/${slug}/top-sellers/`);
        if (response.ok) {
          const data = await response.json();
          if (data.enabled && data.products) {
            setTopSellers(data.products);
          }
        }
      } catch (err) {
        console.error("Error fetching top sellers:", err);
      }
    };
    
    if (business?.top_sellers_enabled) {
      fetchTopSellers();
    }
  }, [slug, business?.top_sellers_enabled]);

  // Slider auto-advance
  useEffect(() => {
    if (!business?.hero_slider_enabled || !business?.hero_slider_images?.length) return;
    
    const interval = setInterval(() => {
      setCurrentSliderIndex((prev) => 
        (prev + 1) % (business.hero_slider_images?.length || 1)
      );
    }, 5000); // Auto-advance every 5 seconds
    
    return () => clearInterval(interval);
  }, [business?.hero_slider_enabled, business?.hero_slider_images?.length]);

  // Fetch products with filters (including branch filter)
  const fetchProducts = async (pageNum = 1, category?: number | null, search?: string, branchId?: number | null) => {
    if (!slug) return;
    
    try {
      setProductsLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        page_size: '12',
      });
      
      if (category) {
        params.append('category', category.toString());
      }
      if (search) {
        params.append('search', search);
      }
      // Add branch filter if selected
      if (branchId) {
        params.append('branch_id', branchId.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/api/public/business/${slug}/products/?${params}`);
      
      if (response.ok) {
        const data: PaginatedProducts = await response.json();
        setProducts(data.products);
        setTotalPages(data.pagination.total_pages);
        setPage(data.pagination.page);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Reload products when branch changes
  useEffect(() => {
    if (business && selectedBranchId) {
      fetchProducts(1, selectedCategory, searchQuery, selectedBranchId);
      // Clear cart when switching branches (products might have different stock)
      if (cart.length > 0) {
        setCart([]);
      }
    }
  }, [selectedBranchId]);

  // Handle search
  const handleSearch = () => {
    fetchProducts(1, selectedCategory, searchQuery, selectedBranchId);
  };

  // Handle category filter
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchProducts(1, categoryId, searchQuery, selectedBranchId);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage, selectedCategory, searchQuery, selectedBranchId);
  };

  // Format price
  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    if (currency === 'NGN') {
      return `₦${numPrice.toLocaleString()}`;
    }
    return `${currency} ${numPrice.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
          
          {/* Products skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <Store className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Store Not Found</CardTitle>
            <CardDescription>
              {error || "This business page does not exist."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth screen
  if (showAuth) {
    return (
      <StoreAuth
        businessName={business.name}
        businessSlug={business.slug}
        businessLogo={business.logo}
        onSuccess={handleAuthSuccess}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar - Jumia-style Header */}
      <div className="bg-primary text-primary-foreground fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {/* Row 1: Logo, Search (desktop), and Icons */}
          <div className="flex items-center justify-between py-2 gap-2 sm:gap-4">
            {/* Logo/Name */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              {(business.logo || business.owner_profile_image) ? (
                <img 
                  src={business.logo || business.owner_profile_image} 
                  alt={business.name}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-primary-foreground/20"
                />
              ) : (
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
              <span className="text-sm sm:text-base font-bold truncate max-w-[100px] sm:max-w-[180px]">{business.name}</span>
            </div>
            
            {/* Search Bar - Desktop Only (between logo and icons like Jumia) */}
            <div className="hidden sm:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products, brands and categories"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    if (value.trim()) {
                      fetchProducts(1, selectedCategory, value, selectedBranchId);
                    }
                  }}
                  className="pl-9 pr-4 h-10 bg-white text-gray-900 border-0 rounded-lg w-full"
                />
              </div>
            </div>
            
            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Help - WhatsApp */}
              {business.phone && (
                <a
                  href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-primary-foreground/10 rounded-full"
                  title="Chat on WhatsApp"
                >
                  <HelpCircle className="h-5 w-5" />
                </a>
              )}
              
              {/* Cart Button - Always show */}
              <Sheet open={showCart} onOpenChange={setShowCart}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 px-2 relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Shopping Cart</SheetTitle>
                      <SheetDescription>
                        {cart.length === 0 ? 'Your cart is empty' : `${cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart`}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex-1 overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Add products to your cart</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map(item => (
                            <div key={item.product.id} className="flex gap-3 border-b pb-4">
                              {item.product.image ? (
                                <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                                <p className="text-primary font-bold text-sm mt-1">
                                  {formatPrice(item.product.selling_price, business.currency)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.current_stock}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-red-500 ml-auto"
                                    onClick={() => removeFromCart(item.product.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        {/* Show selected branch info (read-only - selected from main store page) */}
                        {business.branches && business.branches.length > 1 && selectedBranchId && (
                          <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              Pickup Location
                            </p>
                            <p className="font-medium">
                              {business.branches.find(b => b.id === selectedBranchId)?.name}
                            </p>
                            {business.branches.find(b => b.id === selectedBranchId)?.address && (
                              <p className="text-muted-foreground text-xs mt-1">
                                {business.branches.find(b => b.id === selectedBranchId)?.address}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(getCartTotal(), business.currency)}</span>
                        </div>
                        <Button className="w-full" size="lg" onClick={proceedToCheckout}>
                          {customer ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>

            {customer ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 px-2 sm:px-3">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{customer.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Code: {customer.customer_code}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/customer-dashboard')}
                    className="cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </span>
                    <span className="font-medium">{formatCurrency(customer.wallet_balance, business.currency)}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Points
                    </span>
                    <span className="font-medium">{customer.loyalty_points}</span>
                  </DropdownMenuItem>
                  {customer.discount_percentage && customer.discount_percentage > 0 && (
                    <DropdownMenuItem className="flex justify-between text-green-600">
                      <span>Your Discount</span>
                      <span className="font-medium">{customer.discount_percentage}%</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAuth(true)}
                className="text-primary-foreground hover:bg-primary-foreground/10 px-2 sm:px-3"
              >
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
          
          {/* Row 2: Search Bar - Mobile Only */}
          <div className="sm:hidden pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products, brands and categories"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (value.trim()) {
                    fetchProducts(1, selectedCategory, value, selectedBranchId);
                  }
                }}
                className="pl-9 pr-4 h-10 bg-white text-gray-900 border-0 rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Only show hero sections when NOT searching */}
      {!searchQuery.trim() && (
        <>
          {/* Hero Image Slider - Replaces the old business header when enabled */}
          {business.hero_slider_enabled && business.hero_slider_images && business.hero_slider_images.length > 0 && (
            <div className="relative w-full overflow-hidden bg-gray-900 mt-24 sm:mt-16">
              <div className="max-w-7xl mx-auto">
                {/* Slider Container */}
                <div className="relative aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1]">
                  {business.hero_slider_images.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        index === currentSliderIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {slide.link ? (
                        <a href={slide.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                          <img
                            src={slide.url}
                            alt={slide.alt || `Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <img
                          src={slide.url}
                          alt={slide.alt || `Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Navigation Arrows */}
                  {business.hero_slider_images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentSliderIndex((prev) => 
                          prev === 0 ? business.hero_slider_images!.length - 1 : prev - 1
                        )}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                      <button
                        onClick={() => setCurrentSliderIndex((prev) => 
                          (prev + 1) % business.hero_slider_images!.length
                        )}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Dots Indicator */}
                  {business.hero_slider_images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {business.hero_slider_images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSliderIndex(index)}
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                            index === currentSliderIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Flash Sales Section - Jumia Style */}
          {business.flash_sales_enabled && flashSaleProducts.length > 0 && (
            <div className="bg-gradient-to-r from-red-600 to-red-500">
              {/* Flash Sales Header */}
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-400 rounded-full p-1">
                    <span className="text-base">⚡</span>
                  </div>
                  <span className="text-white font-bold text-sm sm:text-base">Flash Sales</span>
                </div>
                
                {/* Time Left - Jumia Style */}
                <div className="flex items-center gap-1 sm:gap-2 text-white">
                  <span className="text-xs hidden sm:inline">Time Left:</span>
                  {flashSaleProducts[0]?.flash_sale_end && (
                    <FlashSaleCountdown endTime={flashSaleProducts[0].flash_sale_end} />
                  )}
                </div>
                
                {/* See All Link */}
                <button 
                  onClick={() => setShowAllFlashSales(true)}
                  className="text-white text-xs sm:text-sm flex items-center gap-0.5 hover:underline"
                >
                  See All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              {/* Flash Sale Products - Horizontal Scroll */}
              <div className="bg-white py-3">
                <div className="max-w-7xl mx-auto px-3 sm:px-4">
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                    <div className="flex gap-2 sm:gap-3 pb-2" style={{ width: 'max-content' }}>
                      {flashSaleProducts.map((product) => (
                        <Card key={product.id} className="flex-shrink-0 w-[130px] sm:w-[170px] border shadow-sm hover:shadow-md transition-shadow">
                          <div className="relative aspect-square bg-gray-50">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                              -{product.discount_percentage}%
                            </div>
                          </div>
                          <CardContent className="p-2">
                            <h3 className="font-medium text-xs line-clamp-2 h-8">{product.name}</h3>
                            <div className="mt-1">
                              <span className="text-red-500 font-bold text-xs sm:text-sm">
                                {formatPrice(product.flash_sale_price, business.currency)}
                              </span>
                              <span className="text-gray-400 text-[10px] sm:text-xs line-through ml-1 block">
                                {formatPrice(product.original_price, business.currency)}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full mt-2 h-7 text-[10px] sm:text-xs bg-orange-500 hover:bg-orange-600"
                              onClick={() => {
                                const productForCart: Product = {
                                  id: product.id,
                                  name: product.name,
                                  description: product.description,
                                  selling_price: product.flash_sale_price,
                                  current_stock: product.current_stock,
                                  image: product.image,
                                  unit: product.unit,
                                };
                                addToCart(productForCart);
                              }}
                              disabled={product.current_stock < 1}
                            >
                              {product.current_stock < 1 ? 'Sold Out' : 'Add to Cart'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Sellers Section - Horizontal Scroll */}
          {business.top_sellers_enabled && topSellers.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 py-4">
              <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">🔥</span>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">Top Sellers</h2>
                  </div>
                  <button 
                    onClick={() => setShowAllTopSellers(true)}
                    className="text-primary text-xs sm:text-sm flex items-center gap-0.5 hover:underline"
                  >
                    See All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                
                {/* Top Sellers - Horizontal Scroll */}
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="flex gap-2 sm:gap-3 pb-2" style={{ width: 'max-content' }}>
                    {topSellers.map((product, index) => (
                      <Card key={product.id} className="flex-shrink-0 w-[130px] sm:w-[170px] bg-white border shadow-sm hover:shadow-md transition-shadow relative">
                        {index < 3 && (
                          <div className="absolute top-1 left-1 z-10">
                            <span className="text-sm sm:text-base">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                          </div>
                        )}
                        <div className="aspect-square bg-gray-50 relative">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2">
                          <h3 className="font-medium text-xs line-clamp-2 h-8">{product.name}</h3>
                          <p className="text-primary font-bold text-xs sm:text-sm mt-1">
                            {formatPrice(product.selling_price, business.currency)}
                          </p>
                          {product.total_sold > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-500">{product.total_sold} sold</p>
                          )}
                          <Button 
                            size="sm" 
                            className="w-full mt-2 h-7 text-[10px] sm:text-xs"
                            onClick={() => {
                              const productForCart: Product = {
                                id: product.id,
                                name: product.name,
                                description: product.description,
                                selling_price: product.selling_price,
                                current_stock: product.current_stock,
                                image: product.image,
                                unit: product.unit,
                              };
                              addToCart(productForCart);
                            }}
                            disabled={product.current_stock < 1}
                          >
                            {product.current_stock < 1 ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full box-border">
        {/* Category Filters - Horizontal Scroll on Mobile */}
        {business.categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 mx-auto">
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
              <div className="flex gap-2 min-w-max pb-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategorySelect(null)}
                  className="shrink-0"
                >
                  All
                </Button>
                {business.categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategorySelect(category.id)}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {productsLoading ? (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent -mx-2 sm:mx-0 px-2 sm:px-0" style={{ scrollbarWidth: 'thin', scrollBehavior: 'smooth' }}>
              <div className="flex gap-3 sm:gap-4 pb-4" style={{ width: 'max-content' }}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="flex-shrink-0 w-[180px] sm:w-[220px]">
                    <Skeleton className="h-36 sm:h-44 w-full" />
                    <CardContent className="p-3 sm:p-4">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Package className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No products found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filters"
                  : "This store hasn't added any products yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-3 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </button>
            )}
            
            {/* Horizontal scrollable container */}
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4 -mx-2 sm:mx-0 px-2 sm:px-0"
              style={{ 
                scrollbarWidth: 'thin',
                scrollBehavior: 'smooth',
                touchAction: 'pan-x'
              }}
              onScroll={checkScrollButtons}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="flex-shrink-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer w-[180px] sm:w-[220px]"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-36 sm:h-44 object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-36 sm:h-44 bg-gray-100 flex items-center justify-center">
                        <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base min-h-[2.5rem] sm:min-h-[3rem]">{product.name}</h3>
                      {product.category__name && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {product.category__name}
                        </Badge>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base sm:text-lg font-bold text-primary">
                          {formatPrice(product.selling_price, business.currency)}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 block mt-1">
                        {product.current_stock > 0 ? `${product.current_stock} in stock` : 'Out of stock'}
                      </span>
                      <Button 
                        size="sm" 
                        className="w-full mt-2 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.current_stock <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {product.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-3 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 sm:mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 sm:px-4 text-xs sm:text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Store Info Section - About Us, FAQs, Shipping, Returns */}
        {(business.about_us || business.faqs || business.shipping_info || business.returns_policy) && (
          <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 px-1">
            {/* About Us */}
            {business.about_us && (
              <Card className="w-full mx-auto overflow-hidden">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>About Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 whitespace-pre-wrap text-xs sm:text-sm break-words leading-relaxed">{business.about_us}</p>
                </CardContent>
              </Card>
            )}

            {/* FAQs - Collapsible */}
            {business.faqs && (
              <Card className="w-full mx-auto overflow-hidden">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    FAQs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {business.faqs.split('\n\n').map((faq, index) => {
                      // Try to parse Q: and A: format, or just show as is
                      const lines = faq.trim().split('\n');
                      const question = lines[0]?.replace(/^Q:\s*/i, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
                      const answer = lines.slice(1).join('\n').replace(/^A:\s*/i, '').trim();
                      
                      if (!question) return null;
                      
                      return (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-left text-xs sm:text-sm font-medium py-2 sm:py-3">
                            {question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 text-xs sm:text-sm">
                            {answer || question}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Shipping & Returns - Stacked on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {business.shipping_info && (
                <Card className="w-full overflow-hidden">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      Shipping Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 whitespace-pre-wrap text-xs sm:text-sm break-words leading-relaxed">{business.shipping_info}</p>
                  </CardContent>
                </Card>
              )}

              {business.returns_policy && (
                <Card className="w-full overflow-hidden">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      Returns & Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 whitespace-pre-wrap text-xs sm:text-sm break-words leading-relaxed">{business.returns_policy}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Company Info */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {(business.logo || business.owner_profile_image) ? (
                  <img 
                    src={business.logo || business.owner_profile_image} 
                    alt={business.name}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-white">{business.name}</h3>
              </div>
              {business.about_us && (
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-3">
                  {business.about_us}
                </p>
              )}
              {/* Social Media Links */}
              {business.social_media && (business.social_media.facebook || business.social_media.instagram || business.social_media.twitter || business.social_media.tiktok) && (
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {business.social_media.facebook && (
                    <a 
                      href={formatUrl(business.social_media.facebook)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {business.social_media.instagram && (
                    <a 
                      href={formatUrl(business.social_media.instagram)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {business.social_media.twitter && (
                    <a 
                      href={formatUrl(business.social_media.twitter)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-sky-500 transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {business.social_media.tiktok && (
                    <a 
                      href={formatUrl(business.social_media.tiktok)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-black transition-colors"
                    >
                      <TikTokIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links / Support */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
              <ul className="space-y-3">
                {business.faqs && (
                  <li>
                    <button 
                      onClick={() => {/* TODO: Show FAQ modal */}}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                      FAQs
                    </button>
                  </li>
                )}
                {business.shipping_info && (
                  <li>
                    <button 
                      onClick={() => {/* TODO: Show Shipping modal */}}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Truck className="h-4 w-4" />
                      Shipping Information
                    </button>
                  </li>
                )}
                {business.returns_policy && (
                  <li>
                    <button 
                      onClick={() => {/* TODO: Show Returns modal */}}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Returns & Refunds
                    </button>
                  </li>
                )}
                {business.about_us && (
                  <li>
                    <button 
                      onClick={() => {/* TODO: Show About modal */}}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Info className="h-4 w-4" />
                      About Us
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact Us</h4>
              <ul className="space-y-3">
                {business.phone && (
                  <li>
                    <a 
                      href={`tel:${business.phone}`} 
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.phone}</span>
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    <a 
                      href={`mailto:${business.email}`} 
                      className="text-sm text-gray-400 hover:text-white flex items-start gap-2 transition-colors"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-all">{business.email}</span>
                    </a>
                  </li>
                )}
                {business.address && (
                  <li className="text-sm text-gray-400 flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{business.address}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Newsletter / Customer Account */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Account</h4>
              {customer ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Welcome back, <span className="text-white font-medium">{customer.name}</span>!
                  </p>
                  <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Wallet Balance</span>
                      <span className="text-white font-medium">{formatCurrency(customer.wallet_balance, business.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Loyalty Points</span>
                      <span className="text-white font-medium">{customer.loyalty_points}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Create an account to track orders and earn rewards.
                  </p>
                  <Button 
                    onClick={() => setShowAuth(true)}
                    className="w-full"
                    variant="secondary"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In / Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                © {new Date().getFullYear()} {business.name}. All rights reserved.
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Powered by <Link to="/" className="text-primary hover:text-primary/80 transition-colors">Henotace Business</Link>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* See All Flash Sales Modal */}
      <Sheet open={showAllFlashSales} onOpenChange={setShowAllFlashSales}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="bg-red-500 rounded-full p-1">
                <span className="text-base">⚡</span>
              </div>
              Flash Sales
            </SheetTitle>
            <SheetDescription>
              Limited time offers - grab them before they're gone!
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pb-4">
            {flashSaleProducts.map((product) => (
              <Card key={product.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-gray-50">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                    -{product.discount_percentage}%
                  </div>
                </div>
                <CardContent className="p-2">
                  <h3 className="font-medium text-xs line-clamp-2 h-8">{product.name}</h3>
                  <div className="mt-1">
                    <span className="text-red-500 font-bold text-xs sm:text-sm">
                      {formatPrice(product.flash_sale_price, business.currency)}
                    </span>
                    <span className="text-gray-400 text-[10px] sm:text-xs line-through ml-1 block">
                      {formatPrice(product.original_price, business.currency)}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 h-7 text-[10px] sm:text-xs bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      const productForCart: Product = {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        selling_price: product.flash_sale_price,
                        current_stock: product.current_stock,
                        image: product.image,
                        unit: product.unit,
                      };
                      addToCart(productForCart);
                    }}
                    disabled={product.current_stock < 1}
                  >
                    {product.current_stock < 1 ? 'Sold Out' : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {flashSaleProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No flash sale products available at the moment.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* See All Top Sellers Modal */}
      <Sheet open={showAllTopSellers} onOpenChange={setShowAllTopSellers}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              Top Sellers
            </SheetTitle>
            <SheetDescription>
              Our best selling products loved by customers
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pb-4">
            {topSellers.map((product, index) => (
              <Card key={product.id} className="border shadow-sm hover:shadow-md transition-shadow relative">
                {index < 3 && (
                  <div className="absolute top-1 left-1 z-10">
                    <span className="text-sm sm:text-base">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                  </div>
                )}
                <div className="aspect-square bg-gray-50 relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <h3 className="font-medium text-xs line-clamp-2 h-8">{product.name}</h3>
                  <div className="mt-1">
                    <span className="font-bold text-xs sm:text-sm text-primary">
                      {formatPrice(product.selling_price, business.currency)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {product.total_sold} sold
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 h-7 text-[10px] sm:text-xs"
                    onClick={() => {
                      const productForCart: Product = {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        selling_price: product.selling_price,
                        current_stock: product.current_stock,
                        image: product.image,
                        unit: product.unit,
                      };
                      addToCart(productForCart);
                    }}
                    disabled={product.current_stock < 1}
                  >
                    {product.current_stock < 1 ? 'Sold Out' : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {topSellers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No top sellers available at the moment.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
