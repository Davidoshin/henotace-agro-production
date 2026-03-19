import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/lib/api";
import { 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  Star,
  Facebook,
  Instagram,
  Twitter,
  Clock,
  ChevronRight,
  Briefcase,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Quote,
  Menu,
  X,
  LogIn,
  Sun,
  Moon,
  Heart,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  tagline?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  currency: string;
  about_us?: string;
  owner_profile_image?: string;
  hero_image?: string;
  working_hours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  store_appearance?: {
    primary_color?: string;
    secondary_color?: string;
    navbar_color?: string;
    footer_color?: string;
    text_color?: string;
  };
  show_pricing?: boolean;
  show_team?: boolean;
  show_testimonials?: boolean;
  show_portfolio?: boolean;
  show_inquiry_form?: boolean;
  show_booking?: boolean;
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
  // Header & Navigation
  header_style?: string;
  logo_position?: string;
  show_logo?: boolean;
  menu_items?: Array<{ id: string; label: string; link: string; enabled: boolean }>;
  // Hero Section
  hero_layout?: string;
  hero_content_type?: string;
  hero_text_position?: string;
  hero_images?: string[];
  hero_video_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  hero_overlay_opacity?: number;
  hero_text_align?: string;
  hero_min_height?: string;
  // About Section
  about_image?: string;
  about_media_type?: string;
  about_video_url?: string;
  about_images?: string[];
  about_features?: Array<{ title: string; description: string; icon: string }>;
  show_open_hours_badge?: boolean;
  // Stats Section
  show_stats?: boolean;
  stats?: {
    clients: number;
    clients_label: string;
    projects: number;
    projects_label: string;
    experience: number;
    experience_label: string;
    satisfaction: number;
    satisfaction_label: string;
  };
  // Footer Section
  footer_columns?: number;
  footer_about?: string;
  footer_links_title?: string;
  footer_links?: Array<{ label: string; url: string }>;
  footer_services_title?: string;
  footer_contact_title?: string;
  show_newsletter?: boolean;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price: string;
  duration?: string;
  image?: string;
  category__name?: string;
}

interface Testimonial {
  id: number;
  client_name: string;
  content: string;
  rating: number;
  image?: string;
  role?: string;
}

interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  image: string;
  category?: string;
  client_name?: string;
  project_url?: string;
  completion_date?: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  category?: string;
  published_at?: string;
  views: number;
}

const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

// Helper to format URLs
const formatUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Format currency
const formatCurrency = (amount: number | string, currency: string = 'NGN') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numAmount);
};

// Animated counter component
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{count}{suffix}</span>;
};

export default function PublicServicesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const [blogPage, setBlogPage] = useState(1);
  const BLOG_POSTS_PER_PAGE = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Slider state for hero section
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  
  // Testimonial slider state
  const [testimonialSlideIndex, setTestimonialSlideIndex] = useState(0);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(`theme_${slug}`);
    return saved ? saved === 'dark' : true; // Default to dark
  });
  
  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem(`theme_${slug}`, newMode ? 'dark' : 'light');
  };
  
  // Inquiry form state
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Stats data - use business stats if available, fallback to computed values
  const stats = business?.stats || {
    clients: services.length > 0 ? 100 : 50,
    clients_label: 'Happy Clients',
    projects: services.length * 20,
    projects_label: 'Projects Completed',
    experience: 5,
    experience_label: 'Experience',
    satisfaction: 98,
    satisfaction_label: 'Satisfaction Rate'
  };

  // Fetch business info
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Business not found");
          } else {
            setError("Failed to load business");
          }
          return;
        }
        
        const data = await response.json();
        if (data.success && data.business) {
          setBusiness({
            id: parseInt(data.business.id),
            name: data.business.name,
            slug: data.business.slug,
            tagline: data.business.tagline,
            description: data.business.about,
            address: data.business.address,
            phone: data.business.phone,
            email: data.business.email,
            logo: data.business.logo,
            hero_image: data.business.banner_image,
            currency: 'NGN',
            show_pricing: data.business.show_pricing,
            show_team: data.business.show_team,
            show_testimonials: data.business.show_testimonials,
            show_portfolio: data.business.show_portfolio,
            show_inquiry_form: data.business.inquiry_form_enabled,
            store_appearance: {
              primary_color: data.business.primary_color || '#3b82f6',
              secondary_color: data.business.secondary_color || '#1e293b',
              navbar_color: data.business.secondary_color || '#0f172a',
              footer_color: data.business.secondary_color || '#0f172a',
              text_color: '#ffffff',
            },
            working_hours: data.business.working_hours,
            social_media: data.business.social_media,
            // Header & Navigation
            header_style: data.business.header_style || 'default',
            logo_position: data.business.logo_position || 'left',
            show_logo: data.business.show_logo !== false,
            menu_items: data.business.menu_items || [
              { id: 'home', label: 'Home', link: '#home', enabled: true },
              { id: 'services', label: 'Services', link: '#services', enabled: true },
              { id: 'about', label: 'About', link: '#about', enabled: true },
              { id: 'testimonials', label: 'Testimonials', link: '#testimonials', enabled: true },
              { id: 'contact', label: 'Contact', link: '#contact', enabled: true },
              { id: 'blog', label: 'Blog', link: '#blog', enabled: true },
            ],
            // Hero Section
            hero_layout: data.business.hero_layout || 'full_width',
            hero_content_type: data.business.hero_content_type || 'text_only',
            hero_text_position: data.business.hero_text_position || 'left',
            hero_images: data.business.hero_images || [],
            hero_video_url: data.business.hero_video_url,
            hero_title: data.business.hero_title || data.business.tagline,
            hero_subtitle: data.business.hero_subtitle || data.business.about,
            hero_cta_text: data.business.hero_cta_text || 'Get Started',
            hero_cta_link: data.business.hero_cta_link || '#contact',
            hero_overlay_opacity: data.business.hero_overlay_opacity ?? 50,
            hero_text_align: data.business.hero_text_align || 'center',
            hero_min_height: data.business.hero_min_height || '100vh',
            // About Section
            about_image: data.business.about_image,
            about_media_type: data.business.about_media_type || 'image',
            about_video_url: data.business.about_video_url,
            about_images: data.business.about_images || [],
            about_features: data.business.about_features,
            show_open_hours_badge: data.business.show_open_hours_badge,
            // Stats Section
            show_stats: data.business.show_stats,
            stats: data.business.stats,
            // Footer Section
            footer_columns: data.business.footer_columns || 4,
            footer_about: data.business.footer_about,
            footer_links_title: data.business.footer_links_title,
            footer_links: data.business.footer_links || [],
            footer_services_title: data.business.footer_services_title,
            footer_contact_title: data.business.footer_contact_title,
            show_newsletter: data.business.show_newsletter,
            // Analytics & Ads
            google_analytics_id: data.business.google_analytics_id,
            google_analytics_enabled: data.business.google_analytics_enabled,
            google_ads_id: data.business.google_ads_id,
            google_ads_conversion_id: data.business.google_ads_conversion_id,
            google_ads_enabled: data.business.google_ads_enabled,
            facebook_pixel_id: data.business.facebook_pixel_id,
            facebook_pixel_enabled: data.business.facebook_pixel_enabled,
            tiktok_pixel_id: data.business.tiktok_pixel_id,
            tiktok_pixel_enabled: data.business.tiktok_pixel_enabled,
          });
          
          // Extract all services
          const allServices: Service[] = [];
          if (data.categories) {
            data.categories.forEach((cat: any) => {
              cat.services?.forEach((svc: any) => {
                allServices.push({
                  id: parseInt(svc.id),
                  name: svc.name,
                  description: svc.short_description,
                  price: svc.base_price || '0',
                  duration: svc.duration ? `${svc.duration} ${svc.duration_unit || 'hrs'}` : undefined,
                  image: svc.image,
                  category__name: cat.name,
                });
              });
            });
          }
          
          if (data.uncategorized_services) {
            data.uncategorized_services.forEach((svc: any) => {
              allServices.push({
                id: parseInt(svc.id),
                name: svc.name,
                description: svc.short_description,
                price: svc.base_price || '0',
                duration: svc.duration ? `${svc.duration} ${svc.duration_unit || 'hrs'}` : undefined,
                image: svc.image,
              });
            });
          }
          
          setServices(allServices);
          
          // Set testimonials if show_testimonials is enabled
          if (data.business.show_testimonials) {
            // Map backend fields to frontend interface
            const mappedTestimonials = (data.testimonials || []).map((t: any) => ({
              id: t.id,
              client_name: t.client_name,
              content: t.content,
              rating: t.rating || 5,
              image: t.client_photo || t.image,
              role: t.client_title || t.role,
            }));
            setTestimonials(mappedTestimonials);
          }
          
          // Set portfolio items if show_portfolio is enabled
          if (data.business.show_portfolio) {
            setPortfolioItems(data.portfolio || []);
          }
          
          // Set blog posts
          setBlogPosts(data.blog_posts || []);
        } else {
          setError("Business not found");
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError("Failed to connect to server");
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
          page_title: '${business.name} - Services',
          page_location: window.location.href
        });
      `;
      document.head.appendChild(gaConfigScript);
    }

    // Google Ads Conversion Tracking
    if (business.google_ads_enabled && business.google_ads_id) {
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

    return () => {
      cleanupScripts();
    };
  }, [business]);

  // Auto-advance hero slider
  useEffect(() => {
    if (business?.hero_content_type === 'slider' && (business.hero_images?.length || 0) > 1) {
      const interval = setInterval(() => {
        setHeroSlideIndex((prev) => (prev + 1) % (business.hero_images?.length || 1));
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [business?.hero_content_type, business?.hero_images?.length]);

  // Auto-advance testimonial slider
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setTestimonialSlideIndex((prev) => (prev + 1) % testimonials.length);
      }, 6000); // Change testimonial every 6 seconds
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  // Handle blog post URL parameter
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && blogPosts.length > 0) {
      const post = blogPosts.find(p => p.id.toString() === postId || p.slug === postId);
      if (post) {
        setSelectedBlogPost(post);
        setShowBlogModal(true);
      }
    }
  }, [searchParams, blogPosts]);

  // Open blog post with URL update
  const openBlogPost = (post: BlogPost) => {
    setSelectedBlogPost(post);
    setShowBlogModal(true);
    // Update URL to include post parameter
    setSearchParams({ post: post.slug || post.id.toString() });
  };

  // Close blog post and remove URL parameter
  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedBlogPost(null);
    // Remove post parameter from URL
    searchParams.delete('post');
    setSearchParams(searchParams);
  };

  // Filter services
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit inquiry
  const handleSubmitInquiry = async () => {
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/inquiry/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm)
      });

      if (response.ok) {
        toast({
          title: "Inquiry Sent!",
          description: "We'll get back to you soon.",
        });
        setShowInquiryForm(false);
        setInquiryForm({ name: '', email: '', phone: '', service: '', message: '' });
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get current day's hours
  const getCurrentDayHours = () => {
    if (!business?.working_hours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    return business.working_hours[today as keyof typeof business.working_hours];
  };

  const todayHours = getCurrentDayHours();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-[600px] w-full mb-8 bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 bg-slate-800" />
            <Skeleton className="h-48 bg-slate-800" />
            <Skeleton className="h-48 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <Store className="h-16 w-16 mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">{error || "Business not found"}</h2>
            <p className="text-slate-400 mb-4">
              The business you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appearance = business.store_appearance || {};
  const primaryColor = appearance.primary_color || '#3b82f6';
  
  // Get enabled menu items
  const enabledMenuItems = (business.menu_items || []).filter(item => item.enabled);
  
  // Hero section helpers
  const heroTextAlign = business.hero_text_align || 'center';
  const heroMinHeight = business.hero_min_height || '100vh';
  const heroOverlay = business.hero_overlay_opacity ?? 50;
  
  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}` : null;
  };

  // Theme-aware colors
  const bgColor = isDarkMode ? (appearance.secondary_color || '#0f172a') : '#ffffff';
  const textColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const textLight = isDarkMode ? 'text-slate-300' : 'text-slate-700';
  const borderColor = isDarkMode ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDarkMode ? 'bg-slate-800/50' : 'bg-white';
  const cardBorder = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const inputBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-slate-700' : 'border-slate-300';
  const hoverBg = isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <div className={`min-h-screen ${textColor}`} style={{ backgroundColor: bgColor }}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b ${borderColor}`} style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#0f172a'}ee` : 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center h-16 ${
            business.header_style === 'centered' ? 'justify-center' : 'justify-between'
          }`}>
            {/* Logo & Name */}
            <div className={`flex items-center gap-3 ${
              business.logo_position === 'center' ? 'absolute left-1/2 -translate-x-1/2' : ''
            }`}>
              {business.show_logo !== false && (
                business.logo ? (
                  <img 
                    src={business.logo} 
                    alt={business.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                )
              )}
              <span className={`font-bold text-lg hidden sm:block ${textColor}`}>{business.name}</span>
            </div>

            {/* Nav Links - Desktop (dynamic from settings) */}
            <div className="hidden md:flex items-center gap-8">
              {enabledMenuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    if (item.link.startsWith('#')) {
                      document.getElementById(item.link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = item.link;
                    }
                  }}
                  className={`text-sm ${textLight} hover:${textColor} transition-colors`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA + Theme Toggle + Mobile Menu Button */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${textLight} ${hoverBg} transition-colors`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Login Button - Desktop */}
              <button 
                onClick={() => navigate(`/services/${slug}/login`)}
                className={`hidden md:flex items-center gap-1 text-sm ${textLight} hover:${textColor} transition-colors`}
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              {/* Get Started Button - routes to contact */}
              <Button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 hidden md:flex text-white"
              >
                {business.hero_cta_text || 'Get Started'}
              </Button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 ${textLight}`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className={`md:hidden py-4 border-t ${borderColor}`}>
              <div className="flex flex-col gap-2">
                {enabledMenuItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      if (item.link.startsWith('#')) {
                        document.getElementById(item.link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.href = item.link;
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left px-4 py-3 ${textLight} ${hoverBg} rounded-lg transition-colors`}
                  >
                    {item.label}
                  </button>
                ))}
                {/* Divider */}
                <div className={`border-t ${borderColor} my-2`} />
                {/* Login Button */}
                <button 
                  onClick={() => {
                    navigate(`/services/${slug}/login`);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 ${textLight} ${hoverBg} rounded-lg transition-colors flex items-center gap-2`}
                >
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </button>
                {/* Get Started CTA */}
                {business.show_inquiry_form && (
                  <Button 
                    onClick={() => {
                      navigate(`/services/${slug}/login`);
                      setMobileMenuOpen(false);
                    }}
                    style={{ backgroundColor: primaryColor }}
                    className="mx-4 mt-2 text-white"
                  >
                    {business.hero_cta_text || 'Get Started'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Dynamic Layout */}
      <section id="home" className="relative flex items-center pt-16" style={{ minHeight: heroMinHeight }}>
        {/* Background for Full Width with Image/Video/Slider */}
        {business.hero_layout === 'full_width' && business.hero_content_type !== 'text_only' && (
          <div className="absolute inset-0">
            {business.hero_content_type === 'video' && business.hero_video_url ? (
              <>
                <iframe
                  src={getYouTubeEmbedUrl(business.hero_video_url) || ''}
                  className="w-full h-full object-cover"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                />
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${heroOverlay / 100})` }}
                />
              </>
            ) : business.hero_content_type === 'slider' && (business.hero_images?.length || 0) > 0 ? (
              <>
                {/* Animated slider with crossfade effect */}
                <div className="relative w-full h-full">
                  {business.hero_images?.map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Hero ${index + 1}`} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === heroSlideIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                </div>
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${heroOverlay / 100})` }}
                />
                {/* Slider dots indicator */}
                {(business.hero_images?.length || 0) > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {business.hero_images?.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setHeroSlideIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === heroSlideIndex 
                            ? 'bg-white scale-110' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : business.hero_content_type === 'image_text' && (business.hero_images?.length || 0) > 0 ? (
              <>
                <img 
                  src={business.hero_images?.[0]} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${heroOverlay / 100})` }}
                />
              </>
            ) : business.hero_image ? (
              <>
                <img 
                  src={business.hero_image} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${heroOverlay / 100})` }}
                />
              </>
            ) : null}
          </div>
        )}

        {/* Background gradient for text_only or two_columns */}
        {(business.hero_layout !== 'full_width' || business.hero_content_type === 'text_only') && (
          <div className="absolute inset-0">
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${appearance.secondary_color || '#0f172a'} 0%, ${primaryColor}22 100%)` }}>
              <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColor}15` }} />
              <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: `${appearance.secondary_color}30` }} />
            </div>
          </div>
        )}

        {/* Content based on layout */}
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full ${
          business.hero_layout === 'two_columns' ? 'grid md:grid-cols-2 gap-12 items-center' : 'flex flex-col items-center'
        }`}>
          {/* Text Column - order depends on text_position for two_columns */}
          <div className={`${business.hero_layout === 'two_columns' ? (business.hero_text_position === 'right' ? 'order-2' : 'order-1') : 'w-full'} ${
            heroTextAlign === 'center' && business.hero_layout !== 'two_columns' ? 'text-center' : 
            heroTextAlign === 'right' && business.hero_layout !== 'two_columns' ? 'text-right' : 
            heroTextAlign === 'left' && business.hero_layout !== 'two_columns' ? 'text-left' : ''
          }`}>
            {/* Badge - conditionally shown based on show_open_hours_badge */}
            {business.show_open_hours_badge !== false && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-300">
                {todayHours && !todayHours.closed 
                  ? `Open Today: ${todayHours.open} - ${todayHours.close}`
                  : 'Available for Inquiries'
                }
              </span>
            </div>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {business.hero_title || business.tagline || `Professional ${business.name} Services`}
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
              {business.hero_subtitle || business.description || `We deliver exceptional results with our expert team. Your satisfaction is our top priority.`}
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-wrap gap-4 ${
              heroTextAlign === 'center' ? 'justify-center' : 
              heroTextAlign === 'right' ? 'justify-end' : ''
            }`}>
              <Button 
                size="lg"
                onClick={() => {
                  const ctaLink = business.hero_cta_link || '#services';
                  if (ctaLink.startsWith('#')) {
                    document.getElementById(ctaLink.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = ctaLink;
                  }
                }}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 gap-2 text-white"
              >
                {business.hero_cta_text || 'View Services'}
                <ChevronRight className="h-5 w-5" />
              </Button>
              {business.show_inquiry_form && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setShowInquiryForm(true)}
                  className={`gap-2 ${isDarkMode ? 'bg-white text-slate-900 border-white hover:bg-slate-100 hover:text-slate-900' : 'border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white'}`}
                >
                  <MessageSquare className="h-5 w-5" />
                  Contact Us
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <div className={`flex items-center gap-6 mt-12 flex-wrap ${
              heroTextAlign === 'center' && business.hero_layout !== 'two_columns' ? 'justify-center' : 
              heroTextAlign === 'right' && business.hero_layout !== 'two_columns' ? 'justify-end' : ''
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className={`text-sm ${textMuted}`}>Verified Business</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className={`text-sm ${textMuted}`}>5.0 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                <span className={`text-sm ${textMuted}`}>Top Rated</span>
              </div>
            </div>
          </div>

          {/* Media Column for Two Columns Layout */}
          {business.hero_layout === 'two_columns' && business.hero_content_type !== 'text_only' && (
            <div className={`${business.hero_text_position === 'right' ? 'order-1' : 'order-2'} relative`}>
              {business.hero_content_type === 'video' && business.hero_video_url ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src={getYouTubeEmbedUrl(business.hero_video_url) || ''}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : business.hero_content_type === 'slider' && (business.hero_images?.length || 0) > 0 ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl relative">
                  {/* Animated slider with crossfade effect */}
                  {business.hero_images?.map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Hero ${index + 1}`} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === heroSlideIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                  {/* Slider dots indicator */}
                  {(business.hero_images?.length || 0) > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {business.hero_images?.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setHeroSlideIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            index === heroSlideIndex 
                              ? 'bg-white scale-110' 
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (business.hero_images?.length || 0) > 0 ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={business.hero_images?.[0]} 
                    alt="Hero" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Scroll indicator - Click to scroll to services */}
        <button 
          onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Scroll to services"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-pulse" />
          </div>
        </button>
      </section>

      {/* Stats Section */}
      {(business?.show_stats !== false) && (
      <section className={`py-16 border-y ${borderColor}`} style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#1e293b'}90` : '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.clients} suffix="+" />
              </div>
              <p className={textMuted}>{stats.clients_label || 'Happy Clients'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.projects} suffix="+" />
              </div>
              <p className={textMuted}>{stats.projects_label || 'Projects Completed'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.experience} suffix=" Yrs" />
              </div>
              <p className={textMuted}>{stats.experience_label || 'Experience'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.satisfaction} suffix="%" />
              </div>
              <p className={textMuted}>{stats.satisfaction_label || 'Satisfaction Rate'}</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className={`mb-4 ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
              Our Services
            </Badge>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${textColor}`}>
              What We Offer
            </h2>
            <p className={textMuted}>
              Explore our range of professional services designed to meet your needs
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-12 h-12 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
              />
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>No services found</h3>
              <p className={textMuted}>
                {searchQuery ? "Try a different search term" : "No services available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={`overflow-hidden group transition-all duration-300 hover:transform hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'}`}
                >
                  {service.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-slate-900/60' : 'from-white/60'} to-transparent`} />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className={`font-semibold text-lg ${textColor} mb-2`}>{service.name}</h3>
                    {service.description && (
                      <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'} text-sm mb-4 line-clamp-2`}>
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {business.show_pricing && parseFloat(service.price) > 0 ? (
                          <p className="font-bold text-lg" style={{ color: primaryColor }}>
                            {formatCurrency(service.price, business.currency)}
                          </p>
                        ) : business.show_pricing ? (
                          <p className={`font-bold text-lg ${textMuted}`}>Price Varies</p>
                        ) : null}
                        {service.duration && (
                          <p className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            <Clock className="h-3 w-3" />
                            {service.duration}
                          </p>
                        )}
                      </div>
                      {business.show_inquiry_form && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setInquiryForm({...inquiryForm, service: service.name});
                            setShowInquiryForm(true);
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="hover:opacity-90 text-white"
                        >
                          Inquire
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20" style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#1e293b'}50` : '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Media side - supports image, video, or slider */}
            <div className="relative">
              <div className={`aspect-square rounded-2xl overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
                {business.about_media_type === 'video' && business.about_video_url ? (
                  <iframe
                    src={getYouTubeEmbedUrl(business.about_video_url) || ''}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : business.about_media_type === 'slider' && (business.about_images?.length || 0) > 0 ? (
                  <img 
                    src={business.about_images?.[0]} 
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : business.about_image ? (
                  <img 
                    src={business.about_image} 
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : business.logo ? (
                  <img 
                    src={business.logo} 
                    alt={business.name}
                    className="w-3/4 h-3/4 object-contain"
                  />
                ) : (
                  <Briefcase className="w-32 h-32 text-slate-600" />
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-xl" style={{ backgroundColor: primaryColor + '20' }} />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl" style={{ backgroundColor: primaryColor + '30' }} />
            </div>

            {/* Content side */}
            <div>
              <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">
                About Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose {business.name}?
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                {business.description || `We are committed to delivering exceptional services that exceed expectations. With years of experience and a dedicated team, we ensure quality results for every project.`}
              </p>

              {/* Features */}
              <div className="space-y-4">
                {(business.about_features && business.about_features.length > 0) ? (
                  business.about_features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                        {feature.icon === 'trending' ? (
                          <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : feature.icon === 'users' ? (
                          <Users className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : feature.icon === 'star' ? (
                          <Star className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : feature.icon === 'award' ? (
                          <Award className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : feature.icon === 'clock' ? (
                          <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : feature.icon === 'heart' ? (
                          <Heart className="h-4 w-4" style={{ color: primaryColor }} />
                        ) : (
                          <CheckCircle className="h-4 w-4" style={{ color: primaryColor }} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                        <CheckCircle className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Professional Team</h4>
                        <p className="text-sm text-slate-400">Expert professionals dedicated to your success</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                        <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Quality Results</h4>
                        <p className="text-sm text-slate-400">Consistently delivering outstanding outcomes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                        <Users className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Customer Focused</h4>
                        <p className="text-sm text-slate-400">Your satisfaction is our top priority</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      {business.show_portfolio && portfolioItems.length > 0 && (
        <section id="portfolio" className="py-20" style={{ backgroundColor: appearance.secondary_color || '#0f172a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">
                Our Work
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Portfolio
              </h2>
              <p className="text-slate-400">
                Check out some of our recent projects and success stories
              </p>
            </div>

            {/* Portfolio Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="bg-slate-800/50 border-slate-700 overflow-hidden group cursor-pointer hover:border-slate-600 transition-all">
                  <div className="aspect-video relative overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <Award className="h-12 w-12 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        {item.category && (
                          <Badge className="mb-2" style={{ backgroundColor: primaryColor }}>
                            {item.category}
                          </Badge>
                        )}
                        <h3 className="text-white font-semibold">{item.title}</h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      {item.client_name && <span>Client: {item.client_name}</span>}
                      {item.completion_date && <span>{new Date(item.completion_date).toLocaleDateString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section - Sliding Carousel */}
      {business.show_testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-20" style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#1e293b'}40` : '#f8fafc' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className={`mb-4 ${cardBorder} ${textMuted}`}>
                Testimonials
              </Badge>
              <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${textColor}`}>
                What Our Clients Say
              </h2>
              <p className={textMuted}>
                Hear from our satisfied clients about their experience
              </p>
            </div>

            {/* Testimonial Slider */}
            <div className="relative max-w-4xl mx-auto">
              {/* Main testimonial display */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${testimonialSlideIndex * 100}%)` }}
                >
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                      <div className={`${cardBg} ${cardBorder} rounded-2xl p-8 md:p-12 text-center`}>
                        {/* Quote icon */}
                        <Quote className="h-12 w-12 mx-auto mb-6" style={{ color: primaryColor, opacity: 0.5 }} />
                        
                        {/* Testimonial content */}
                        <p className={`text-lg md:text-xl ${textColor} mb-8 italic leading-relaxed`}>
                          "{testimonial.content}"
                        </p>
                        
                        {/* Star rating */}
                        <div className="flex items-center justify-center gap-1 mb-6">
                          {[...Array(testimonial.rating || 5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                        
                        {/* Client info */}
                        <div className="flex flex-col items-center">
                          {testimonial.image ? (
                            <img 
                              src={testimonial.image} 
                              alt={testimonial.client_name} 
                              className="w-16 h-16 rounded-full object-cover mb-4 ring-4 ring-opacity-30"
                              style={{ ['--tw-ring-color' as any]: primaryColor }}
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white text-xl font-bold"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {testimonial.client_name.charAt(0)}
                            </div>
                          )}
                          <p className={`font-semibold text-lg ${textColor}`}>{testimonial.client_name}</p>
                          {testimonial.role && (
                            <p className={`text-sm ${textMuted}`}>{testimonial.role}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows */}
              {testimonials.length > 1 && (
                <>
                  <button
                    onClick={() => setTestimonialSlideIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 w-12 h-12 rounded-full ${cardBg} ${cardBorder} flex items-center justify-center ${textMuted} hover:text-white transition-colors shadow-lg`}
                    aria-label="Previous testimonial"
                  >
                    <ChevronRight className="h-6 w-6 rotate-180" />
                  </button>
                  <button
                    onClick={() => setTestimonialSlideIndex((prev) => (prev + 1) % testimonials.length)}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 w-12 h-12 rounded-full ${cardBg} ${cardBorder} flex items-center justify-center ${textMuted} hover:text-white transition-colors shadow-lg`}
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialSlideIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === testimonialSlideIndex 
                          ? 'scale-110' 
                          : `${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'} hover:bg-slate-500`
                      }`}
                      style={index === testimonialSlideIndex ? { backgroundColor: primaryColor } : {}}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Blog Section - Horizontal Card layout */}
      {blogPosts.length > 0 && (
        <section id="blog" className="py-20" style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#1e293b'}50` : '#f8fafc' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className={`mb-4 ${cardBorder} ${textMuted}`}>
                Blog
              </Badge>
              <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${textColor}`}>
                Latest Articles
              </h2>
              <p className={textMuted}>
                Stay updated with our latest insights and news
              </p>
            </div>

            {/* Blog List - Horizontal cards: image left, text right */}
            <div className="space-y-6">
              {blogPosts.slice(0, 6).map((post) => (
                <Card 
                  key={post.id} 
                  className={`${cardBg} ${cardBorder} overflow-hidden group ${hoverBg} transition-all duration-300 hover:shadow-lg cursor-pointer`}
                  onClick={() => openBlogPost(post)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image - Left side on desktop */}
                    {post.featured_image && (
                      <div className="relative w-full md:w-80 lg:w-96 flex-shrink-0">
                        <div className="aspect-[16/10] md:aspect-auto md:h-full overflow-hidden">
                          <img 
                            src={post.featured_image} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        {post.category && (
                          <Badge 
                            className="absolute top-3 left-3 text-white" 
                            style={{ backgroundColor: primaryColor }}
                          >
                            {post.category}
                          </Badge>
                        )}
                      </div>
                    )}
                    {/* Content - Right side on desktop */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                      <h3 className={`font-semibold text-lg md:text-xl ${textColor} mb-3 group-hover:underline line-clamp-2`}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className={`${textMuted} text-sm md:text-base mb-4 line-clamp-3`}>
                          {post.excerpt}
                        </p>
                      )}
                      <div className={`flex items-center gap-4 text-xs md:text-sm ${textMuted} mt-auto`}>
                        <span>
                          {post.published_at 
                            ? new Date(post.published_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })
                            : ''}
                        </span>
                        {post.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views} views
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* See All Button - Always show if more than 3 posts for mobile users */}
            {blogPosts.length > 3 && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  className={`${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  onClick={() => setShowAllBlogs(true)}
                >
                  See All Articles ({blogPosts.length})
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Blog Detail Modal */}
      <Dialog open={showBlogModal} onOpenChange={(open) => !open && closeBlogModal()}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedBlogPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  {selectedBlogPost.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedBlogPost.featured_image && (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <img 
                      src={selectedBlogPost.featured_image} 
                      alt={selectedBlogPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {selectedBlogPost.category && (
                    <Badge style={{ backgroundColor: primaryColor }}>
                      {selectedBlogPost.category}
                    </Badge>
                  )}
                  <span>
                    {selectedBlogPost.published_at 
                      ? new Date(selectedBlogPost.published_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : ''}
                  </span>
                </div>
                <div 
                  className="prose prose-invert max-w-none text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedBlogPost.content || selectedBlogPost.excerpt || '' }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* All Blogs Modal with Pagination */}
      <Dialog open={showAllBlogs} onOpenChange={setShowAllBlogs}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              All Articles
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Blog Grid in Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .slice((blogPage - 1) * BLOG_POSTS_PER_PAGE, blogPage * BLOG_POSTS_PER_PAGE)
                .map((post) => (
                  <Card 
                    key={post.id} 
                    className="bg-slate-800/50 border-slate-700 overflow-hidden group hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => {
                      setShowAllBlogs(false);
                      openBlogPost(post);
                    }}
                  >
                    <div className="flex gap-4 p-4">
                      {post.featured_image && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={post.featured_image} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <span className="text-xs text-slate-500">
                          {post.published_at 
                            ? new Date(post.published_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>

            {/* Pagination */}
            {blogPosts.length > BLOG_POSTS_PER_PAGE && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={blogPage === 1}
                  onClick={() => setBlogPage(p => Math.max(1, p - 1))}
                  className="border-slate-600 text-slate-300"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-slate-400 text-sm">
                  Page {blogPage} of {Math.ceil(blogPosts.length / BLOG_POSTS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={blogPage >= Math.ceil(blogPosts.length / BLOG_POSTS_PER_PAGE)}
                  onClick={() => setBlogPage(p => p + 1)}
                  className="border-slate-600 text-slate-300"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="py-20" style={{ background: isDarkMode ? `linear-gradient(to right, ${appearance.secondary_color || '#1e293b'}, ${appearance.secondary_color || '#0f172a'}dd)` : `linear-gradient(to right, ${primaryColor}10, ${primaryColor}05)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${textColor}`}>
            Ready to Get Started?
          </h2>
          <p className={`${textMuted} text-lg mb-8`}>
            Let's discuss how we can help you achieve your goals
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {business.show_inquiry_form && (
              <Button 
                size="lg"
                onClick={() => setShowInquiryForm(true)}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 gap-2 text-white"
              >
                Contact Us
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            {business.phone && (
              <Button 
                size="lg"
                variant="outline"
                onClick={() => window.location.href = `tel:${business.phone}`}
                className={`${isDarkMode ? 'bg-white text-slate-900 border-white hover:bg-slate-100 hover:text-slate-900' : 'border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white'} gap-2`}
              >
                <Phone className="h-5 w-5" />
                Call Now
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20" style={{ backgroundColor: isDarkMode ? `${appearance.secondary_color || '#1e293b'}50` : '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <Badge variant="outline" className={`mb-4 ${cardBorder} ${textMuted}`}>
                Contact
              </Badge>
              <h2 className={`text-3xl font-bold mb-6 ${textColor}`}>Get in Touch</h2>
              <p className={`${textMuted} mb-8`}>
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-4">
                {business.phone && (
                  <a 
                    href={`tel:${business.phone}`}
                    className={`flex items-center gap-4 p-4 rounded-lg ${cardBg} ${hoverBg} transition-colors`}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className={`text-sm ${textMuted}`}>Phone</p>
                      <p className={`font-semibold ${textColor}`}>{business.phone}</p>
                    </div>
                  </a>
                )}
                {business.email && (
                  <a 
                    href={`mailto:${business.email}`}
                    className={`flex items-center gap-4 p-4 rounded-lg ${cardBg} ${hoverBg} transition-colors`}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className={`text-sm ${textMuted}`}>Email</p>
                      <p className={`font-semibold ${textColor}`}>{business.email}</p>
                    </div>
                  </a>
                )}
                {business.address && (
                  <div className={`flex items-center gap-4 p-4 rounded-lg ${cardBg}`}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className={`text-sm ${textMuted}`}>Address</p>
                      <p className={`font-semibold ${textColor}`}>{business.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              {business.working_hours && (
                <div className="mt-8">
                  <h4 className={`font-semibold mb-4 flex items-center gap-2 ${textColor}`}>
                    <Clock className="h-4 w-4" />
                    Working Hours
                  </h4>
                  <div className="space-y-2 text-sm">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const hours = business.working_hours?.[day as keyof typeof business.working_hours];
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                      return (
                        <div 
                          key={day} 
                          className={`flex justify-between py-2 px-3 rounded ${isToday ? (isDarkMode ? 'bg-slate-800' : 'bg-slate-100') : ''}`}
                        >
                          <span className={`capitalize ${isToday ? `font-semibold ${textColor}` : textMuted}`}>
                            {day}
                          </span>
                          <span className={hours?.closed ? 'text-red-400' : isToday ? textColor : textMuted}>
                            {hours?.closed ? 'Closed' : hours ? `${hours.open} - ${hours.close}` : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Contact Form */}
            {business.show_inquiry_form && (
              <div className={`${cardBg} rounded-2xl p-6 sm:p-8 ${cardBorder} border`}>
                <h3 className={`font-semibold text-xl mb-6 ${textColor}`}>Send us a Message</h3>
                <div className="space-y-4">
                  <div>
                    <Label className={textMuted}>Name *</Label>
                    <Input
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      placeholder="Your name"
                      className={`${inputBg} ${inputBorder} mt-1 ${textColor}`}
                    />
                  </div>
                  <div>
                    <Label className={textMuted}>Email *</Label>
                    <Input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      placeholder="your@email.com"
                      className={`${inputBg} ${inputBorder} mt-1 ${textColor}`}
                    />
                  </div>
                  <div>
                    <Label className={textMuted}>Phone</Label>
                    <Input
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      placeholder="Your phone number"
                      className={`${inputBg} ${inputBorder} mt-1 ${textColor}`}
                    />
                  </div>
                  {services.length > 0 && (
                    <div>
                      <Label className={textMuted}>Service Interested In</Label>
                      <Select
                        value={inquiryForm.service}
                        onValueChange={(value) => setInquiryForm({...inquiryForm, service: value})}
                      >
                        <SelectTrigger className={`${inputBg} ${inputBorder} mt-1 ${textColor}`}>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent className={`${cardBg} ${cardBorder}`}>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.name} className={`${hoverBg}`}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className={textMuted}>Message *</Label>
                    <Textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                      placeholder="Tell us about your needs..."
                      rows={4}
                      className={`${inputBg} ${inputBorder} mt-1 ${textColor}`}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmitInquiry}
                    disabled={submitting}
                    className="w-full text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer - Multi-column layout */}
      <footer className={`py-16 border-t ${borderColor}`} style={{ backgroundColor: isDarkMode ? (appearance.secondary_color || '#0f172a') : '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Grid - responsive columns */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${business.footer_columns || 4} gap-8 lg:gap-12`}>
            {/* Column 1: About */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: primaryColor }}>
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className={`font-bold text-lg ${textColor}`}>{business.name}</span>
              </div>
              <p className={`text-sm ${textMuted} mb-4`}>
                {business.footer_about || business.tagline || 'Professional services tailored to meet your needs. We are committed to delivering excellence in everything we do.'}
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {business.social_media?.facebook && (
                  <a 
                    href={formatUrl(business.social_media.facebook)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg ${cardBg} flex items-center justify-center ${textMuted} hover:text-white transition-colors`}
                    style={{ ['--hover-bg' as any]: primaryColor }}
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {business.social_media?.instagram && (
                  <a 
                    href={formatUrl(business.social_media.instagram)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg ${cardBg} flex items-center justify-center ${textMuted} hover:text-white transition-colors`}
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {business.social_media?.twitter && (
                  <a 
                    href={formatUrl(business.social_media.twitter)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg ${cardBg} flex items-center justify-center ${textMuted} hover:text-white transition-colors`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {business.social_media?.tiktok && (
                  <a 
                    href={formatUrl(business.social_media.tiktok)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg ${cardBg} flex items-center justify-center ${textMuted} hover:text-white transition-colors`}
                  >
                    <TikTokIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className={`font-semibold ${textColor} mb-4`}>{business.footer_links_title || 'Quick Links'}</h4>
              <ul className="space-y-2">
                {(business.footer_links && business.footer_links.length > 0) ? (
                  business.footer_links.map((link, idx) => (
                    <li key={idx}>
                      <a 
                        href={link.url} 
                        className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}
                      >
                        <ChevronRight className="w-3 h-3" />
                        {link.label}
                      </a>
                    </li>
                  ))
                ) : (
                  <>
                    <li><a href="#home" className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}><ChevronRight className="w-3 h-3" />Home</a></li>
                    <li><a href="#services" className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}><ChevronRight className="w-3 h-3" />Services</a></li>
                    <li><a href="#about" className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}><ChevronRight className="w-3 h-3" />About Us</a></li>
                    <li><a href="#testimonials" className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}><ChevronRight className="w-3 h-3" />Testimonials</a></li>
                    <li><a href="#contact" className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}><ChevronRight className="w-3 h-3" />Contact</a></li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h4 className={`font-semibold ${textColor} mb-4`}>{business.footer_services_title || 'Our Services'}</h4>
              <ul className="space-y-2">
                {services.slice(0, 5).map((service) => (
                  <li key={service.id}>
                    <a 
                      href="#services" 
                      className={`text-sm ${textMuted} hover:text-white transition-colors flex items-center gap-2`}
                    >
                      <ChevronRight className="w-3 h-3" />
                      {service.name}
                    </a>
                  </li>
                ))}
                {services.length > 5 && (
                  <li>
                    <a href="#services" className={`text-sm hover:text-white transition-colors flex items-center gap-2`} style={{ color: primaryColor }}>
                      <ChevronRight className="w-3 h-3" />
                      View All Services
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div>
              <h4 className={`font-semibold ${textColor} mb-4`}>{business.footer_contact_title || 'Contact Us'}</h4>
              <ul className="space-y-3">
                {business.address && (
                  <li className={`flex items-start gap-3 text-sm ${textMuted}`}>
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                    <span>{business.address}</span>
                  </li>
                )}
                {business.phone && (
                  <li>
                    <a href={`tel:${business.phone}`} className={`flex items-center gap-3 text-sm ${textMuted} hover:text-white transition-colors`}>
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                      <span>{business.phone}</span>
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    <a href={`mailto:${business.email}`} className={`flex items-center gap-3 text-sm ${textMuted} hover:text-white transition-colors`}>
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                      <span>{business.email}</span>
                    </a>
                  </li>
                )}
              </ul>
              
              {/* Newsletter Signup */}
              {business.show_newsletter && (
                <div className="mt-6">
                  <p className={`text-sm ${textMuted} mb-2`}>Subscribe to our newsletter</p>
                  <div className="flex gap-2">
                    <Input 
                      type="email" 
                      placeholder="Your email" 
                      className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} flex-1 h-9 text-sm`}
                    />
                    <Button size="sm" style={{ backgroundColor: primaryColor }} className="h-9">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bottom */}
          <div className={`mt-12 pt-8 border-t ${borderColor} flex flex-col md:flex-row justify-between items-center gap-4`}>
            <p className={`text-sm ${textMuted}`}>
              © {new Date().getFullYear()} {business.name}. All rights reserved.
            </p>
            <p className={`text-sm ${textMuted}`}>
              Powered by <a href="https://business.henotaceai.ng" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: primaryColor }}>HenotaceAI</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Inquiry Form Dialog */}
      <Dialog open={showInquiryForm} onOpenChange={setShowInquiryForm}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Send Inquiry</DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill out the form below and we'll get back to you soon.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={inquiryForm.name}
                onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                placeholder="Your name"
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                placeholder="your@email.com"
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={inquiryForm.phone}
                onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                placeholder="Your phone number"
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
            {services.length > 0 && (
              <div>
                <Label className="text-slate-300">Service Interested In</Label>
                <Select
                  value={inquiryForm.service}
                  onValueChange={(value) => setInquiryForm({...inquiryForm, service: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.name} className="focus:bg-slate-700">
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-slate-300">Message *</Label>
              <Textarea
                value={inquiryForm.message}
                onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                placeholder="Tell us about your needs..."
                rows={4}
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInquiryForm(false)} className="border-slate-700 hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitInquiry}
              disabled={submitting}
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? "Sending..." : "Send Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
