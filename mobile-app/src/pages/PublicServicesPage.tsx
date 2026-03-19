import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  LogIn,
  Menu,
  X
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
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Inquiry form state
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Stats data
  const stats = {
    clients: services.length > 0 ? 100 : 50,
    projects: services.length * 20,
    experience: 5,
    satisfaction: 98
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
            hero_image: data.business.hero_image,
            currency: 'NGN',
            show_pricing: data.business.show_pricing,
            show_team: data.business.show_team,
            show_testimonials: data.business.show_testimonials,
            show_inquiry_form: data.business.show_contact_form,
            store_appearance: {
              primary_color: data.business.primary_color || '#3b82f6',
              secondary_color: data.business.secondary_color || '#1e293b',
              navbar_color: data.business.secondary_color || '#0f172a',
              footer_color: data.business.secondary_color || '#0f172a',
              text_color: '#ffffff',
            },
            working_hours: data.business.working_hours,
            social_media: data.business.social_media,
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
          
          // Set sample testimonials if show_testimonials is enabled
          if (data.business.show_testimonials) {
            setTestimonials(data.testimonials || [
              { id: 1, client_name: "John D.", content: "Excellent service! Highly professional and delivered on time.", rating: 5, role: "Business Owner" },
              { id: 2, client_name: "Sarah M.", content: "Outstanding quality and attention to detail. Will definitely use again.", rating: 5, role: "Marketing Director" },
              { id: 3, client_name: "Michael K.", content: "Great communication throughout the project. Very satisfied with the results.", rating: 5, role: "Entrepreneur" },
            ]);
          }
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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              {business.logo ? (
                <img 
                  src={business.logo} 
                  alt={business.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="font-bold text-lg hidden sm:block">{business.name}</span>
            </div>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Services
              </button>
              <button 
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Testimonials
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Contact
              </button>
              <button 
                onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Blog
              </button>
            </div>

            {/* Login + Get Started Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/services/${slug}/login`)}
                className="hidden md:flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              <Button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 hidden md:flex"
              >
                Get Started
              </Button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex items-center pt-16">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0">
          {business.hero_image ? (
            <>
              <img 
                src={business.hero_image} 
                alt="Hero" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/70" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Abstract shapes */}
              <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
          )}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-300">
                {todayHours && !todayHours.closed 
                  ? `Open Today: ${todayHours.open} - ${todayHours.close}`
                  : 'Available for Inquiries'
                }
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {business.tagline || `Professional ${business.name} Services`}
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
              {business.description || `We deliver exceptional results with our expert team. Your satisfaction is our top priority.`}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 gap-2"
              >
                View Services
                <ChevronRight className="h-5 w-5" />
              </Button>
              {business.show_inquiry_form && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setShowInquiryForm(true)}
                  className="border-slate-600 text-white hover:bg-slate-800 gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Contact Us
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 mt-12">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-slate-400">Verified Business</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-slate-400">5.0 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-slate-400">Top Rated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.clients} suffix="+" />
              </div>
              <p className="text-slate-400">Happy Clients</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.projects} suffix="+" />
              </div>
              <p className="text-slate-400">Projects Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.experience} suffix=" Yrs" />
              </div>
              <p className="text-slate-400">Experience</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                <AnimatedCounter value={stats.satisfaction} suffix="%" />
              </div>
              <p className="text-slate-400">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">
              Our Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What We Offer
            </h2>
            <p className="text-slate-400">
              Explore our range of professional services designed to meet your needs
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              />
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No services found</h3>
              <p className="text-slate-400">
                {searchQuery ? "Try a different search term" : "No services available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className="bg-slate-800/50 border-slate-700 overflow-hidden group hover:border-slate-600 transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  {service.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-white mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {business.show_pricing && parseFloat(service.price) > 0 && (
                          <p className="font-bold text-lg" style={{ color: primaryColor }}>
                            {formatCurrency(service.price, business.currency)}
                          </p>
                        )}
                        {service.duration && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
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
                          className="hover:opacity-90"
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
      <section id="about" className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image/Logo side */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                {business.logo ? (
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {business.show_testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">
                Testimonials
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                What Our Clients Say
              </h2>
              <p className="text-slate-400">
                Hear from our satisfied clients about their experience
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-slate-700 mb-3" />
                  <p className="text-slate-300 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.image ? (
                      <img src={testimonial.image} alt={testimonial.client_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-semibold">{testimonial.client_name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{testimonial.client_name}</p>
                      {testimonial.role && (
                        <p className="text-xs text-slate-500">{testimonial.role}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Let's discuss how we can help you achieve your goals
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {business.show_inquiry_form && (
              <Button 
                size="lg"
                onClick={() => setShowInquiryForm(true)}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 gap-2"
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
                className="border-slate-600 text-white hover:bg-slate-800 gap-2"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">
                Contact
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-slate-400 mb-8">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-4">
                {business.phone && (
                  <a 
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-semibold">{business.phone}</p>
                    </div>
                  </a>
                )}
                {business.email && (
                  <a 
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold">{business.email}</p>
                    </div>
                  </a>
                )}
                {business.address && (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Address</p>
                      <p className="font-semibold">{business.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              {business.working_hours && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
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
                          className={`flex justify-between py-2 px-3 rounded ${isToday ? 'bg-slate-800' : ''}`}
                        >
                          <span className={`capitalize ${isToday ? 'font-semibold' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          <span className={hours?.closed ? 'text-red-400' : isToday ? 'text-white' : 'text-slate-400'}>
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
              <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8">
                <h3 className="font-semibold text-xl mb-6">Send us a Message</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Name *</Label>
                    <Input
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      placeholder="Your name"
                      className="bg-slate-900 border-slate-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Email *</Label>
                    <Input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      placeholder="your@email.com"
                      className="bg-slate-900 border-slate-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Phone</Label>
                    <Input
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      placeholder="Your phone number"
                      className="bg-slate-900 border-slate-700 mt-1"
                    />
                  </div>
                  {services.length > 0 && (
                    <div>
                      <Label className="text-slate-400">Service Interested In</Label>
                      <Select
                        value={inquiryForm.service}
                        onValueChange={(value) => setInquiryForm({...inquiryForm, service: value})}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
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
                    <Label className="text-slate-400">Message *</Label>
                    <Textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                      placeholder="Tell us about your needs..."
                      rows={4}
                      className="bg-slate-900 border-slate-700 mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleSubmitInquiry}
                    disabled={submitting}
                    className="w-full"
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

      {/* Footer */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo & Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-slate-600" />
                  </div>
                )}
                <span className="font-bold">{business.name}</span>
              </div>
              <p className="text-sm text-slate-500">
                {business.tagline || 'Professional Services'}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {business.social_media?.facebook && (
                <a 
                  href={formatUrl(business.social_media.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {business.social_media?.instagram && (
                <a 
                  href={formatUrl(business.social_media.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {business.social_media?.twitter && (
                <a 
                  href={formatUrl(business.social_media.twitter)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {business.social_media?.tiktok && (
                <a 
                  href={formatUrl(business.social_media.tiktok)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {business.name}. All rights reserved. 
              <span className="mx-2">•</span>
              Powered by <span className="text-slate-400">HenotaceAI</span>
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
