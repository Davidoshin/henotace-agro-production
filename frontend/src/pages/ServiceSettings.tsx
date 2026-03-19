import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import { 
  ArrowLeft, Save, Wrench, Globe, Phone, Mail, MessageSquare, 
  MapPin, Palette, Users, Star, Briefcase, Clock, Calendar,
  ExternalLink, Copy, Check, Download, QrCode, Plus, Trash2,
  Image, Video, Layout, Menu, Type, AlignLeft, AlignCenter, AlignRight,
  Columns, Monitor, Play, GripVertical, Search, X
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Menu item interface
interface MenuItem {
  id: string;
  label: string;
  link: string;
  enabled: boolean;
}

// Service item interface
interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

// Section configuration for search
interface SettingsSection {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'header', title: 'Header & Navigation', description: 'Logo, header style, and menu items', keywords: ['header', 'navigation', 'logo', 'menu', 'nav'] },
  { id: 'hero', title: 'Hero Section', description: 'Hero layout, images, video, and content', keywords: ['hero', 'banner', 'slider', 'video', 'image', 'headline', 'background'] },
  { id: 'content', title: 'Page Content', description: 'Tagline and about section', keywords: ['content', 'tagline', 'about', 'description', 'text'] },
  { id: 'contact', title: 'Contact Information', description: 'Phone, email, WhatsApp, and address', keywords: ['contact', 'phone', 'email', 'whatsapp', 'address', 'location'] },
  { id: 'appearance', title: 'Appearance', description: 'Colors and visual styling', keywords: ['appearance', 'color', 'theme', 'style', 'primary', 'secondary', 'accent'] },
  { id: 'features', title: 'Feature Toggles', description: 'Show/hide page sections', keywords: ['feature', 'toggle', 'show', 'hide', 'pricing', 'team', 'testimonials', 'portfolio', 'inquiry', 'booking'] },
  { id: 'aboutStats', title: 'About & Stats', description: 'About section media and statistics', keywords: ['about', 'stats', 'statistics', 'clients', 'projects', 'experience', 'satisfaction'] },
  { id: 'hours', title: 'Working Hours', description: 'Business operating hours', keywords: ['hours', 'working', 'schedule', 'open', 'close', 'time', 'availability'] },
  { id: 'testimonials', title: 'Testimonials', description: 'Client testimonials and reviews', keywords: ['testimonials', 'reviews', 'client', 'feedback', 'rating'] },
  { id: 'footer', title: 'Footer Settings', description: 'Footer layout and links', keywords: ['footer', 'links', 'bottom', 'newsletter', 'columns'] },
];

export default function ServiceSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Collapsible states
  const [headerOpen, setHeaderOpen] = useState(false);
  const [heroOpen, setHeroOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [aboutStatsOpen, setAboutStatsOpen] = useState(false);
  const [testimonialsOpen, setTestimonialsOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  
  // Testimonials state
  interface Testimonial {
    id: string;
    client_name: string;
    client_title: string;
    client_company: string;
    client_photo: string | null;
    content: string;
    rating: number;
    is_featured: boolean;
  }
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    client_title: '',
    client_company: '',
    content: '',
    rating: 5,
    is_featured: false
  });
  
  // Menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 'home', label: 'Home', link: '#home', enabled: true },
    { id: 'services', label: 'Services', link: '#services', enabled: true },
    { id: 'about', label: 'About', link: '#about', enabled: true },
    { id: 'blog', label: 'Blog', link: '#blog', enabled: false },
    { id: 'testimonials', label: 'Testimonials', link: '#testimonials', enabled: true },
    { id: 'contact', label: 'Contact', link: '#contact', enabled: true },
  ]);
  
  const [settings, setSettings] = useState({
    // Business type
    business_category: "service_based",
    product_based_enabled: false,
    service_based_enabled: true,
    
    // Service page content
    service_tagline: "",
    service_about: "",
    logo: "",
    
    // Header & Navigation
    service_header_style: "default",
    service_logo_position: "left",
    service_show_logo: true,
    service_menu_items: [] as MenuItem[],
    
    // Hero Section
    service_hero_layout: "full_width",      // full_width or two_columns
    service_hero_content_type: "text_only", // text_only, image_text, video, slider
    service_hero_images: [] as string[],    // For slider or single image
    service_hero_video_url: "",
    service_hero_title: "",
    service_hero_subtitle: "",
    service_hero_cta_text: "Get Started",
    service_hero_cta_link: "#contact",
    service_hero_overlay_opacity: 50,
    service_hero_text_align: "center",
    service_hero_min_height: "100vh",
    service_hero_text_position: "left",     // For two columns: left or right
    
    // Contact information
    service_phone: "",
    service_email: "",
    service_whatsapp: "",
    service_address: "",
    
    // Display settings
    service_primary_color: "#8b5cf6",
    service_secondary_color: "#1f2937",
    service_accent_color: "#10b981",
    
    // Feature toggles
    service_show_pricing: true,
    service_show_team: true,
    service_show_testimonials: true,
    service_show_portfolio: true,
    service_inquiry_form_enabled: true,
    service_booking_enabled: false,
    
    // About & Stats Settings
    service_about_image: "",
    service_about_media_type: "image",  // image, video, slider
    service_about_video_url: "",
    service_about_images: [] as string[],
    service_about_features: [] as Array<{ title: string; description: string; icon: string }>,
    service_show_open_hours_badge: true,
    service_show_stats: true,
    service_stats_clients: 100,
    service_stats_clients_label: "Happy Clients",
    service_stats_projects: 50,
    service_stats_projects_label: "Projects Completed",
    service_stats_experience: 5,
    service_stats_experience_label: "Experience",
    service_stats_satisfaction: 98,
    service_stats_satisfaction_label: "Satisfaction Rate",
    
    // Working hours
    service_working_hours: {
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: false },
      saturday: { open: "10:00", close: "14:00", closed: false },
      sunday: { open: "", close: "", closed: true },
    },
    
    // Footer Settings
    service_footer_columns: 3,  // 3 or 4 columns
    service_footer_about: "",   // About text in footer
    service_footer_links_title: "Quick Links",
    service_footer_links: [] as Array<{ label: string; url: string }>,
    service_footer_services_title: "Our Services",
    service_footer_contact_title: "Contact Us",
    service_show_newsletter: false,
    
    // Public URL
    public_url: "",
  });

  // Fetch testimonials
  const fetchTestimonials = async () => {
    try {
      const response = await apiGet('business/testimonials/');
      if (response.success && response.testimonials) {
        setTestimonials(response.testimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTestimonials();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/service-settings/');
      if (response.success && response.settings) {
        setSettings(prev => ({
          ...prev,
          ...response.settings,
          service_working_hours: response.settings.service_working_hours || prev.service_working_hours,
        }));
        // Set menu items
        if (response.settings.service_menu_items && response.settings.service_menu_items.length > 0) {
          setMenuItems(response.settings.service_menu_items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch service settings:', error);
      toast({
        title: "Error",
        description: "Failed to load service settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const dataToSave = {
        ...settings,
        service_menu_items: menuItems
      };
      const response = await apiPut('business/service-settings/', dataToSave);
      if (response.success) {
        toast({
          title: "Success",
          description: "Service settings saved successfully"
        });
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Failed to save service settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkingHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      service_working_hours: {
        ...prev.service_working_hours,
        [day]: {
          ...(prev.service_working_hours as any)[day],
          [field]: value
        }
      }
    }));
  };

  // Menu item helpers
  const updateMenuItem = (id: string, field: keyof MenuItem, value: string | boolean) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      label: 'New Page',
      link: '#',
      enabled: true
    };
    setMenuItems([...menuItems, newItem]);
  };

  const removeMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `service-qrcode-${settings.public_url?.split('/').pop() || 'business'}.png`;
      link.href = pngFile;
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Testimonial helpers
  const addTestimonial = async () => {
    if (!newTestimonial.client_name || !newTestimonial.content) {
      toast({
        title: "Error",
        description: "Client name and testimonial content are required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await apiPost('business/testimonials/', newTestimonial);
      if (response.success) {
        toast({
          title: "Success",
          description: "Testimonial added successfully"
        });
        setNewTestimonial({
          client_name: '',
          client_title: '',
          client_company: '',
          content: '',
          rating: 5,
          is_featured: false
        });
        fetchTestimonials();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add testimonial",
        variant: "destructive"
      });
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await apiDelete(`business/testimonials/${id}/`);
      toast({
        title: "Success",
        description: "Testimonial deleted"
      });
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive"
      });
    }
  };

  // Footer link helpers
  const addFooterLink = () => {
    setSettings(prev => ({
      ...prev,
      service_footer_links: [...prev.service_footer_links, { label: '', url: '' }]
    }));
  };

  const removeFooterLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      service_footer_links: prev.service_footer_links.filter((_, i) => i !== index)
    }));
  };

  const updateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
    setSettings(prev => ({
      ...prev,
      service_footer_links: prev.service_footer_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Filter sections based on search query
  const isSectionVisible = (sectionId: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const section = SETTINGS_SECTIONS.find(s => s.id === sectionId);
    if (!section) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query) ||
      section.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8 text-purple-500" />
            Service Website Settings
          </h1>
          <p className="text-muted-foreground">Configure your public service website</p>
        </div>
      </div>

      {/* Public URL Card with QR Code */}
      {settings.public_url && (
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium mb-2 block">Your Service Website URL</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <code className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded border text-sm w-full sm:w-auto overflow-x-auto whitespace-nowrap max-w-full block">
                    {window.location.origin}{settings.public_url}
                  </code>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${settings.public_url}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast({ title: "Copied!", description: "URL copied to clipboard" });
                      }}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(settings.public_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* QR Code Section */}
              {settings.public_url && (
                <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <QRCodeSVG
                    ref={qrRef}
                    value={`${window.location.origin}${settings.public_url}`}
                    size={96}
                    level="M"
                    includeMargin={true}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download QR
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search settings (e.g., logo, color, contact, hours...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Header & Logo Settings */}
        {isSectionVisible('header') && (
        <Collapsible open={headerOpen} onOpenChange={setHeaderOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <h4 className="font-medium">Header & Navigation</h4>
                <p className="text-sm text-muted-foreground">Logo, header style, and menu items</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${headerOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Logo Settings */}
                <div className="space-y-4">
                  <h5 className="font-medium flex items-center gap-2">
                    <Image className="w-4 h-4" /> Logo Settings
                  </h5>
                  
                  {/* Logo Upload */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="font-semibold">Business Logo</Label>
                    <p className="text-xs text-muted-foreground mb-3">Recommended: 200x200px, PNG or SVG</p>
                    <div className="flex items-center gap-4">
                      {settings.logo ? (
                        <div className="relative">
                          <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain rounded border" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => setSettings({...settings, logo: ''})}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="w-20 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'logo');
                                try {
                                  const response = await apiPost('business/upload-image/', formData) as any;
                                  if (response.success) {
                                    setSettings({...settings, logo: response.url});
                                    toast({ title: "Success", description: "Logo uploaded successfully" });
                                  }
                                } catch (err) {
                                  toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Show Logo</p>
                      <p className="text-xs text-muted-foreground">Display logo in header</p>
                    </div>
                    <Switch
                      checked={settings.service_show_logo}
                      onCheckedChange={(checked) => setSettings({...settings, service_show_logo: checked})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Logo Position</Label>
                      <Select 
                        value={settings.service_logo_position} 
                        onValueChange={(value) => setSettings({...settings, service_logo_position: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Header Style</Label>
                      <Select 
                        value={settings.service_header_style} 
                        onValueChange={(value) => setSettings({...settings, service_header_style: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-4">
                  <h5 className="font-medium flex items-center gap-2">
                    <Menu className="w-4 h-4" /> Menu Items
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Customize which pages appear in your navigation menu
                  </p>
                  
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => updateMenuItem(item.id, 'enabled', checked)}
                        />
                        <Input
                          value={item.label}
                          onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                          placeholder="Menu Label"
                          className="flex-1"
                        />
                        <Input
                          value={item.link}
                          onChange={(e) => updateMenuItem(item.id, 'link', e.target.value)}
                          placeholder="#section or /page"
                          className="w-32"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMenuItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" onClick={addMenuItem} className="w-full border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Menu Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Hero Section Settings */}
        {isSectionVisible('hero') && (
        <Collapsible open={heroOpen} onOpenChange={setHeroOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <h4 className="font-medium">Hero Section</h4>
                <p className="text-sm text-muted-foreground">Full-width banner, slider, video, or two columns</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${heroOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Step 1: Hero Layout */}
                <div>
                  <Label className="text-base font-semibold">1. Choose Layout</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select how your hero section should be structured</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSettings({...settings, service_hero_layout: 'full_width'})}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_layout === 'full_width' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Monitor className="w-8 h-8" />
                      <span className="font-medium">Full Width</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Content spans the entire screen width
                      </span>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, service_hero_layout: 'two_columns'})}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_layout === 'two_columns' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Columns className="w-8 h-8" />
                      <span className="font-medium">Two Columns</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Text on one side, media on the other
                      </span>
                    </button>
                  </div>
                </div>

                {/* Step 2: Content Type - depends on layout */}
                <div>
                  <Label className="text-base font-semibold">2. Content Type</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    {settings.service_hero_layout === 'full_width' 
                      ? 'Choose what appears in your full-width hero'
                      : 'Choose what appears in the media column'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSettings({...settings, service_hero_content_type: 'text_only'})}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_content_type === 'text_only' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Type className="w-5 h-5" />
                      <span className="text-xs font-medium">Text Only</span>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, service_hero_content_type: 'image_text'})}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_content_type === 'image_text' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Image className="w-5 h-5" />
                      <span className="text-xs font-medium">Image</span>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, service_hero_content_type: 'slider'})}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_content_type === 'slider' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Play className="w-5 h-5" />
                      <span className="text-xs font-medium">Slider</span>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, service_hero_content_type: 'video'})}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.service_hero_content_type === 'video' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="text-xs font-medium">Video</span>
                    </button>
                  </div>
                </div>

                {/* Conditional: Image Upload for image_text */}
                {settings.service_hero_content_type === 'image_text' && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="font-semibold">Hero Image</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Recommended: {settings.service_hero_layout === 'full_width' ? '1920x1080px' : '800x600px'}
                    </p>
                    <div className="flex items-center gap-4">
                      {settings.service_hero_images?.[0] ? (
                        <div className="relative">
                          <img 
                            src={settings.service_hero_images[0]} 
                            alt="Hero" 
                            className="w-32 h-20 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => setSettings({...settings, service_hero_images: []})}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="w-32 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'hero');
                                try {
                                  const response = await apiPost('business/upload-image/', formData) as any;
                                  if (response.success) {
                                    setSettings({...settings, service_hero_images: [response.url]});
                                    toast({ title: "Success", description: "Hero image uploaded" });
                                  }
                                } catch (err) {
                                  toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Conditional: Slider Images */}
                {settings.service_hero_content_type === 'slider' && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="font-semibold">Slider Images</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Recommended: {settings.service_hero_layout === 'full_width' ? '1920x1080px' : '800x600px'} • Add multiple images for the slider
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {(settings.service_hero_images || []).map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img} 
                            alt={`Slide ${index + 1}`} 
                            className="w-32 h-20 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => {
                              const newImages = [...(settings.service_hero_images || [])];
                              newImages.splice(index, 1);
                              setSettings({...settings, service_hero_images: newImages});
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <label className="w-32 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add Slide</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('image', file);
                              formData.append('type', 'hero_slide');
                              try {
                                const response = await apiPost('business/upload-image/', formData) as any;
                                if (response.success) {
                                  setSettings({
                                    ...settings, 
                                    service_hero_images: [...(settings.service_hero_images || []), response.url]
                                  });
                                  toast({ title: "Success", description: "Slide image uploaded" });
                                }
                              } catch (err) {
                                toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Conditional: Video URL */}
                {settings.service_hero_content_type === 'video' && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="font-semibold">YouTube Video URL</Label>
                    <Input
                      value={settings.service_hero_video_url}
                      onChange={(e) => setSettings({...settings, service_hero_video_url: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Paste a YouTube video URL. The video will autoplay muted in the background.</p>
                  </div>
                )}

                {/* Two Columns: Text Position */}
                {settings.service_hero_layout === 'two_columns' && settings.service_hero_content_type !== 'text_only' && (
                  <div>
                    <Label>Text Position</Label>
                    <p className="text-xs text-muted-foreground mb-2">Choose which side the text appears on</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSettings({...settings, service_hero_text_position: 'left'})}
                        className={`flex-1 p-3 rounded border-2 transition-all flex items-center justify-center gap-2 ${
                          settings.service_hero_text_position === 'left' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <Type className="w-4 h-4" />
                        <span className="text-sm">Text Left</span>
                      </button>
                      <button
                        onClick={() => setSettings({...settings, service_hero_text_position: 'right'})}
                        className={`flex-1 p-3 rounded border-2 transition-all flex items-center justify-center gap-2 ${
                          settings.service_hero_text_position === 'right' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <span className="text-sm">Text Right</span>
                        <Type className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Hero Text - always shown */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h5 className="font-semibold flex items-center gap-2">
                    <Type className="w-4 h-4" /> Hero Text
                  </h5>
                  <div>
                    <Label>Main Title</Label>
                    <Input
                      value={settings.service_hero_title}
                      onChange={(e) => setSettings({...settings, service_hero_title: e.target.value})}
                      placeholder="Your main headline"
                    />
                  </div>
                  <div>
                    <Label>Subtitle / Supporting Text</Label>
                    <Textarea
                      value={settings.service_hero_subtitle}
                      onChange={(e) => setSettings({...settings, service_hero_subtitle: e.target.value})}
                      placeholder="A brief description under the headline"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={settings.service_hero_cta_text}
                        onChange={(e) => setSettings({...settings, service_hero_cta_text: e.target.value})}
                        placeholder="Get Started"
                      />
                    </div>
                    <div>
                      <Label>CTA Button Link</Label>
                      <Input
                        value={settings.service_hero_cta_link}
                        onChange={(e) => setSettings({...settings, service_hero_cta_link: e.target.value})}
                        placeholder="#contact"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Alignment - only for full_width text_only/image_text/slider/video */}
                {settings.service_hero_layout === 'full_width' && (
                  <div>
                    <Label>Text Alignment</Label>
                    <div className="flex gap-2 mt-2">
                      {[
                        { value: 'left', icon: AlignLeft },
                        { value: 'center', icon: AlignCenter },
                        { value: 'right', icon: AlignRight },
                      ].map((align) => (
                        <button
                          key={align.value}
                          onClick={() => setSettings({...settings, service_hero_text_align: align.value})}
                          className={`p-2 rounded border-2 transition-all ${
                            settings.service_hero_text_align === align.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                        >
                          <align.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overlay Opacity - only when image/slider/video */}
                {settings.service_hero_content_type !== 'text_only' && (
                  <div>
                    <Label>Image/Video Overlay Darkness: {settings.service_hero_overlay_opacity}%</Label>
                    <Slider
                      value={[settings.service_hero_overlay_opacity]}
                      onValueChange={([value]) => setSettings({...settings, service_hero_overlay_opacity: value})}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values make the overlay darker, improving text visibility
                    </p>
                  </div>
                )}

                {/* Hero Height */}
                <div>
                  <Label>Hero Section Height</Label>
                  <Select 
                    value={settings.service_hero_min_height} 
                    onValueChange={(value) => setSettings({...settings, service_hero_min_height: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50vh">Half Screen (50%)</SelectItem>
                      <SelectItem value="75vh">Three Quarter (75%)</SelectItem>
                      <SelectItem value="100vh">Full Screen (100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Page Content */}
        {isSectionVisible('content') && (
        <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <h4 className="font-medium">Page Content</h4>
                <p className="text-sm text-muted-foreground">Tagline and about section</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${contentOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="tagline">Tagline / Slogan</Label>
                  <Input
                    id="tagline"
                    value={settings.service_tagline || ''}
                    onChange={(e) => setSettings({...settings, service_tagline: e.target.value})}
                    placeholder="e.g., Your trusted partner for quality services"
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground mt-1">A short, catchy phrase about your services</p>
                </div>
                <div>
                  <Label htmlFor="about">About Your Business</Label>
                  <Textarea
                    id="about"
                    value={settings.service_about || ''}
                    onChange={(e) => setSettings({...settings, service_about: e.target.value})}
                    placeholder="Describe your business, your expertise, and why clients should choose you..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Contact Information */}
        {isSectionVisible('contact') && (
        <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <h4 className="font-medium">Contact Information</h4>
                <p className="text-sm text-muted-foreground">How clients can reach you</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={settings.service_phone || ''}
                      onChange={(e) => setSettings({...settings, service_phone: e.target.value})}
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.service_email || ''}
                      onChange={(e) => setSettings({...settings, service_email: e.target.value})}
                      placeholder="services@yourbusiness.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp Number
                    </Label>
                    <Input
                      id="whatsapp"
                      value={settings.service_whatsapp || ''}
                      onChange={(e) => setSettings({...settings, service_whatsapp: e.target.value})}
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Business Address
                    </Label>
                    <Input
                      id="address"
                      value={settings.service_address || ''}
                      onChange={(e) => setSettings({...settings, service_address: e.target.value})}
                      placeholder="Your business location"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Appearance */}
        {isSectionVisible('appearance') && (
        <Collapsible open={appearanceOpen} onOpenChange={setAppearanceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-pink-500" />
              <div className="text-left">
                <h4 className="font-medium">Appearance</h4>
                <p className="text-sm text-muted-foreground">Colors and styling</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        value={settings.service_primary_color || '#8b5cf6'}
                        onChange={(e) => setSettings({...settings, service_primary_color: e.target.value})}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.service_primary_color || '#8b5cf6'}
                        onChange={(e) => setSettings({...settings, service_primary_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        value={settings.service_secondary_color || '#1f2937'}
                        onChange={(e) => setSettings({...settings, service_secondary_color: e.target.value})}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.service_secondary_color || '#1f2937'}
                        onChange={(e) => setSettings({...settings, service_secondary_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        value={settings.service_accent_color || '#10b981'}
                        onChange={(e) => setSettings({...settings, service_accent_color: e.target.value})}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.service_accent_color || '#10b981'}
                        onChange={(e) => setSettings({...settings, service_accent_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="border rounded-lg p-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: settings.service_primary_color || '#8b5cf6' }}>
                      Primary Button
                    </div>
                    <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: settings.service_secondary_color || '#1f2937' }}>
                      Secondary
                    </div>
                    <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: settings.service_accent_color || '#10b981' }}>
                      Accent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Features */}
        {isSectionVisible('features') && (
        <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <h4 className="font-medium">Page Features</h4>
                <p className="text-sm text-muted-foreground">Toggle sections on/off</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <div>
                        <p className="font-medium text-sm">Show Pricing</p>
                        <p className="text-xs text-muted-foreground">Display service prices</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_show_pricing}
                      onCheckedChange={(checked) => setSettings({...settings, service_show_pricing: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Show Team</p>
                        <p className="text-xs text-muted-foreground">Display team members</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_show_team}
                      onCheckedChange={(checked) => setSettings({...settings, service_show_team: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-sm">Show Testimonials</p>
                        <p className="text-xs text-muted-foreground">Display client reviews</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_show_testimonials}
                      onCheckedChange={(checked) => setSettings({...settings, service_show_testimonials: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Show Portfolio</p>
                        <p className="text-xs text-muted-foreground">Display past work</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_show_portfolio}
                      onCheckedChange={(checked) => setSettings({...settings, service_show_portfolio: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Inquiry Form</p>
                        <p className="text-xs text-muted-foreground">Allow client inquiries</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_inquiry_form_enabled}
                      onCheckedChange={(checked) => setSettings({...settings, service_inquiry_form_enabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">Online Booking</p>
                        <p className="text-xs text-muted-foreground">Allow appointment booking</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.service_booking_enabled}
                      onCheckedChange={(checked) => setSettings({...settings, service_booking_enabled: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* About & Stats Section */}
        {isSectionVisible('aboutStats') && (
        <Collapsible open={aboutStatsOpen} onOpenChange={setAboutStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <h4 className="font-medium">About & Stats</h4>
                <p className="text-sm text-muted-foreground">Customize about section and statistics</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${aboutStatsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* About Section Media */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h5 className="font-medium text-sm mb-1">About Section Media</h5>
                  <p className="text-xs text-muted-foreground mb-3">
                    This image/video appears on the left side of the "Why Choose Us" section
                  </p>
                  
                  {/* Media Type Selection */}
                  <div>
                    <Label className="mb-2 block">Media Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSettings({...settings, service_about_media_type: 'image'})}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          (settings.service_about_media_type || 'image') === 'image'
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <Image className="w-5 h-5" />
                        <span className="text-xs font-medium">Image</span>
                      </button>
                      <button
                        onClick={() => setSettings({...settings, service_about_media_type: 'video'})}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          settings.service_about_media_type === 'video' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span className="text-xs font-medium">Video</span>
                      </button>
                      <button
                        onClick={() => setSettings({...settings, service_about_media_type: 'slider'})}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          settings.service_about_media_type === 'slider' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <Play className="w-5 h-5" />
                        <span className="text-xs font-medium">Slider</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  {(settings.service_about_media_type || 'image') === 'image' && (
                    <div className="flex items-center gap-4">
                      {settings.service_about_image ? (
                        <div className="relative">
                          <img src={settings.service_about_image} alt="About" className="w-32 h-32 object-cover rounded" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => setSettings({...settings, service_about_image: ''})}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="w-32 h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'about');
                                try {
                                  const response = await apiPost('business/upload-image/', formData) as any;
                                  if (response.success) {
                                    setSettings({...settings, service_about_image: response.url});
                                    toast({ title: "Success", description: "About image uploaded" });
                                  }
                                } catch (err) {
                                  toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  
                  {/* Video URL */}
                  {settings.service_about_media_type === 'video' && (
                    <div>
                      <Label>YouTube Video URL</Label>
                      <Input
                        value={settings.service_about_video_url || ''}
                        onChange={(e) => setSettings({...settings, service_about_video_url: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  {/* Slider Images */}
                  {settings.service_about_media_type === 'slider' && (
                    <div>
                      <Label className="mb-2 block">Slider Images</Label>
                      <div className="flex flex-wrap gap-3">
                        {(settings.service_about_images || []).map((img: string, index: number) => (
                          <div key={index} className="relative">
                            <img src={img} alt={`Slide ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => {
                                const newImages = [...(settings.service_about_images || [])];
                                newImages.splice(index, 1);
                                setSettings({...settings, service_about_images: newImages});
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <label className="w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'about_slide');
                                try {
                                  const response = await apiPost('business/upload-image/', formData) as any;
                                  if (response.success) {
                                    setSettings({
                                      ...settings,
                                      service_about_images: [...(settings.service_about_images || []), response.url]
                                    });
                                    toast({ title: "Success", description: "Slide added" });
                                  }
                                } catch (err) {
                                  toast({ title: "Error", description: "Failed to upload", variant: "destructive" });
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Open Hours Badge Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Show Open Hours Badge</p>
                      <p className="text-xs text-muted-foreground">Display "Open Today" badge in hero</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.service_show_open_hours_badge}
                    onCheckedChange={(checked) => setSettings({...settings, service_show_open_hours_badge: checked})}
                  />
                </div>

                {/* Stats Section Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <div>
                      <p className="font-medium text-sm">Show Stats Section</p>
                      <p className="text-xs text-muted-foreground">Display statistics below hero</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.service_show_stats}
                    onCheckedChange={(checked) => setSettings({...settings, service_show_stats: checked})}
                  />
                </div>

                {/* Stats Values */}
                {settings.service_show_stats && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-sm mb-3">Statistics Values</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Clients */}
                      <div className="space-y-2">
                        <Label>Clients Count</Label>
                        <Input
                          type="number"
                          value={settings.service_stats_clients}
                          onChange={(e) => setSettings({...settings, service_stats_clients: parseInt(e.target.value) || 0})}
                          placeholder="100"
                        />
                        <Input
                          value={settings.service_stats_clients_label}
                          onChange={(e) => setSettings({...settings, service_stats_clients_label: e.target.value})}
                          placeholder="Happy Clients"
                          className="mt-1"
                        />
                      </div>
                      {/* Projects */}
                      <div className="space-y-2">
                        <Label>Projects Count</Label>
                        <Input
                          type="number"
                          value={settings.service_stats_projects}
                          onChange={(e) => setSettings({...settings, service_stats_projects: parseInt(e.target.value) || 0})}
                          placeholder="50"
                        />
                        <Input
                          value={settings.service_stats_projects_label}
                          onChange={(e) => setSettings({...settings, service_stats_projects_label: e.target.value})}
                          placeholder="Projects Completed"
                          className="mt-1"
                        />
                      </div>
                      {/* Experience */}
                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          value={settings.service_stats_experience}
                          onChange={(e) => setSettings({...settings, service_stats_experience: parseInt(e.target.value) || 0})}
                          placeholder="5"
                        />
                        <Input
                          value={settings.service_stats_experience_label}
                          onChange={(e) => setSettings({...settings, service_stats_experience_label: e.target.value})}
                          placeholder="Experience"
                          className="mt-1"
                        />
                      </div>
                      {/* Satisfaction */}
                      <div className="space-y-2">
                        <Label>Satisfaction Rate (%)</Label>
                        <Input
                          type="number"
                          value={settings.service_stats_satisfaction}
                          onChange={(e) => setSettings({...settings, service_stats_satisfaction: parseInt(e.target.value) || 0})}
                          placeholder="98"
                          max={100}
                        />
                        <Input
                          value={settings.service_stats_satisfaction_label}
                          onChange={(e) => setSettings({...settings, service_stats_satisfaction_label: e.target.value})}
                          placeholder="Satisfaction Rate"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* About Features */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-sm">Why Choose Us Features</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFeatures = [...(settings.service_about_features || []), { title: '', description: '', icon: 'check' }];
                        setSettings({...settings, service_about_features: newFeatures});
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Feature
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Customize the "Why Choose Us" section features. Leave empty to use defaults.
                  </p>
                  {(settings.service_about_features || []).map((feature, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Select
                            value={feature.icon}
                            onValueChange={(value) => {
                              const updated = [...settings.service_about_features];
                              updated[index] = { ...updated[index], icon: value };
                              setSettings({...settings, service_about_features: updated});
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Icon" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="check">✓ Check</SelectItem>
                              <SelectItem value="trending">📈 Trending</SelectItem>
                              <SelectItem value="users">👥 Users</SelectItem>
                              <SelectItem value="star">⭐ Star</SelectItem>
                              <SelectItem value="award">🏆 Award</SelectItem>
                              <SelectItem value="clock">🕐 Clock</SelectItem>
                              <SelectItem value="heart">❤️ Heart</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={feature.title}
                            onChange={(e) => {
                              const updated = [...settings.service_about_features];
                              updated[index] = { ...updated[index], title: e.target.value };
                              setSettings({...settings, service_about_features: updated});
                            }}
                            placeholder="Feature title"
                            className="flex-1"
                          />
                        </div>
                        <Input
                          value={feature.description}
                          onChange={(e) => {
                            const updated = [...settings.service_about_features];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setSettings({...settings, service_about_features: updated});
                          }}
                          placeholder="Feature description"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          const updated = settings.service_about_features.filter((_, i) => i !== index);
                          setSettings({...settings, service_about_features: updated});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(settings.service_about_features?.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No custom features added. Default features will be shown.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Working Hours */}
        {isSectionVisible('hours') && (
        <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <h4 className="font-medium">Working Hours</h4>
                <p className="text-sm text-muted-foreground">Set your availability</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                {days.map((day) => {
                  const hours = (settings.service_working_hours as any)[day] || { open: "09:00", close: "17:00", closed: false };
                  return (
                    <div key={day} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-24 capitalize font-medium">{day}</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {hours.closed ? 'Closed' : 'Open'}
                        </span>
                      </div>
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Testimonials Section */}
        {isSectionVisible('testimonials') && (
        <Collapsible open={testimonialsOpen} onOpenChange={setTestimonialsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              <div className="text-left">
                <h4 className="font-medium">Testimonials</h4>
                <p className="text-sm text-muted-foreground">Manage client reviews and testimonials</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${testimonialsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Add New Testimonial */}
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h5 className="font-medium mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Testimonial
                  </h5>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Client Name *</Label>
                        <Input 
                          value={newTestimonial.client_name}
                          onChange={(e) => setNewTestimonial({...newTestimonial, client_name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Job Title / Role</Label>
                        <Input 
                          value={newTestimonial.client_title}
                          onChange={(e) => setNewTestimonial({...newTestimonial, client_title: e.target.value})}
                          placeholder="CEO"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input 
                        value={newTestimonial.client_company}
                        onChange={(e) => setNewTestimonial({...newTestimonial, client_company: e.target.value})}
                        placeholder="ABC Company"
                      />
                    </div>
                    <div>
                      <Label>Testimonial Content *</Label>
                      <Textarea 
                        value={newTestimonial.content}
                        onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
                        placeholder="Write the client's testimonial here..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>Rating</Label>
                        <Select
                          value={String(newTestimonial.rating)}
                          onValueChange={(value) => setNewTestimonial({...newTestimonial, rating: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map(n => (
                              <SelectItem key={n} value={String(n)}>
                                {'⭐'.repeat(n)} ({n} star{n !== 1 ? 's' : ''})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={newTestimonial.is_featured}
                          onCheckedChange={(checked) => setNewTestimonial({...newTestimonial, is_featured: checked})}
                        />
                        <Label>Featured</Label>
                      </div>
                    </div>
                    <Button onClick={addTestimonial} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>
                </div>

                {/* Existing Testimonials */}
                <div className="space-y-3">
                  <h5 className="font-medium">Existing Testimonials ({testimonials.length})</h5>
                  {testimonials.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No testimonials yet. Add your first client testimonial above.
                    </p>
                  ) : (
                    testimonials.map((testimonial) => (
                      <div key={testimonial.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {testimonial.client_photo ? (
                            <img src={testimonial.client_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold">{testimonial.client_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{testimonial.client_name}</p>
                            {testimonial.is_featured && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded">Featured</span>
                            )}
                          </div>
                          {testimonial.client_title && (
                            <p className="text-xs text-muted-foreground">
                              {testimonial.client_title}{testimonial.client_company && ` at ${testimonial.client_company}`}
                            </p>
                          )}
                          <p className="text-sm mt-1 line-clamp-2">"{testimonial.content}"</p>
                          <div className="flex items-center gap-1 mt-1">
                            {'⭐'.repeat(testimonial.rating)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                          onClick={() => deleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* Footer Settings */}
        {isSectionVisible('footer') && (
        <Collapsible open={footerOpen} onOpenChange={setFooterOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <h4 className="font-medium">Footer Settings</h4>
                <p className="text-sm text-muted-foreground">Customize your page footer</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${footerOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Footer Columns */}
                <div>
                  <Label>Number of Columns (Desktop)</Label>
                  <p className="text-xs text-muted-foreground mb-2">On mobile, footer will always show 1 column</p>
                  <div className="flex gap-2">
                    {[3, 4].map(num => (
                      <Button
                        key={num}
                        variant={settings.service_footer_columns === num ? "default" : "outline"}
                        onClick={() => setSettings({...settings, service_footer_columns: num})}
                        className="flex-1"
                      >
                        <Columns className="w-4 h-4 mr-2" />
                        {num} Columns
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Footer About Text */}
                <div>
                  <Label>Footer About Text</Label>
                  <Textarea
                    value={settings.service_footer_about}
                    onChange={(e) => setSettings({...settings, service_footer_about: e.target.value})}
                    placeholder="Brief description for footer..."
                    rows={3}
                  />
                </div>

                {/* Section Titles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Quick Links Title</Label>
                    <Input
                      value={settings.service_footer_links_title}
                      onChange={(e) => setSettings({...settings, service_footer_links_title: e.target.value})}
                      placeholder="Quick Links"
                    />
                  </div>
                  <div>
                    <Label>Services Title</Label>
                    <Input
                      value={settings.service_footer_services_title}
                      onChange={(e) => setSettings({...settings, service_footer_services_title: e.target.value})}
                      placeholder="Our Services"
                    />
                  </div>
                  <div>
                    <Label>Contact Title</Label>
                    <Input
                      value={settings.service_footer_contact_title}
                      onChange={(e) => setSettings({...settings, service_footer_contact_title: e.target.value})}
                      placeholder="Contact Us"
                    />
                  </div>
                </div>

                {/* Custom Footer Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Quick Links</Label>
                    <Button variant="outline" size="sm" onClick={addFooterLink}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {settings.service_footer_links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={link.label}
                          onChange={(e) => updateFooterLink(index, 'label', e.target.value)}
                          placeholder="Link Label"
                          className="flex-1"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                          placeholder="URL (e.g., #about)"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => removeFooterLink(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {settings.service_footer_links.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No custom links. Default navigation links will be shown.
                      </p>
                    )}
                  </div>
                </div>

                {/* Newsletter Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Show Newsletter Signup</p>
                    <p className="text-xs text-muted-foreground">Add email signup form to footer</p>
                  </div>
                  <Switch
                    checked={settings.service_show_newsletter}
                    onCheckedChange={(checked) => setSettings({...settings, service_show_newsletter: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        )}

        {/* No Results Message */}
        {SETTINGS_SECTIONS.every(section => !isSectionVisible(section.id)) && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No settings found matching "{searchQuery}"</p>
            <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full mt-6"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Service Settings"}
        </Button>
      </div>
    </div>
  );
}
