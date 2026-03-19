import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut, getAppBaseUrl } from "@/lib/api";
import { 
  ArrowLeft, Save, Wrench, Globe, Phone, Mail, MessageSquare, 
  MapPin, Palette, Users, Star, Briefcase, Clock, Calendar,
  ExternalLink, Copy, Check, Download, QrCode, Plus, Trash2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Service item interface
interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

export default function ServiceSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);
  
  // Collapsible states
  const [contentOpen, setContentOpen] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  
  // Dynamic services list
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  
  const [settings, setSettings] = useState({
    // Business type
    business_category: "service_based",
    product_based_enabled: false,
    service_based_enabled: true,
    
    // Service page content
    service_tagline: "",
    service_about: "",
    
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
    
    // Public URL
    public_url: "",
    
    // Services list
    services_list: [] as ServiceItem[],
  });

  useEffect(() => {
    fetchSettings();
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
          services_list: response.settings.services_list || [],
        }));
        // Also set services list state
        if (response.settings.services_list) {
          setServicesList(response.settings.services_list);
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
        services_list: servicesList
      };
      const response = await apiPut('business/service-settings/', dataToSave);
      if (response.success) {
        toast({
          title: "Success",
          description: "Service settings saved successfully"
        });
      }
    } catch (error) {
      console.error('Failed to save service settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
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

  // Service list helpers
  const addService = () => {
    const newService: ServiceItem = {
      id: `service-${Date.now()}`,
      title: "",
      description: ""
    };
    setServicesList([...servicesList, newService]);
  };

  const updateService = (id: string, field: keyof ServiceItem, value: string) => {
    setServicesList(servicesList.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const removeService = (id: string) => {
    setServicesList(servicesList.filter(s => s.id !== id));
  };

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
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

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
                    {getAppBaseUrl()}{settings.public_url}
                  </code>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${getAppBaseUrl()}${settings.public_url}`);
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
                      onClick={() => window.open(`${getAppBaseUrl()}${settings.public_url}`, '_blank')}
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
                    value={`${getAppBaseUrl()}${settings.public_url}`}
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

      <div className="space-y-4">
        {/* Page Content */}
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

        {/* Services List - Dynamic Collapsibles */}
        <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <h4 className="font-medium">Your Services</h4>
                <p className="text-sm text-muted-foreground">Add and manage your service offerings ({servicesList.length})</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add the services you offer. Each service will be displayed on your public service website.
                </p>
                
                {/* Services List */}
                <div className="space-y-3">
                  {servicesList.map((service, index) => (
                    <Collapsible key={service.id} defaultOpen={!service.title}>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="flex items-center bg-muted/30">
                          <CollapsibleTrigger className="flex items-center justify-between flex-1 p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {service.title || `Service ${index + 1}`}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <button
                            type="button"
                            onClick={() => removeService(service.id)}
                            className="p-2 mr-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <CollapsibleContent>
                          <div className="p-4 space-y-3 border-t bg-background">
                            <div>
                              <Label>Service Title</Label>
                              <Input
                                value={service.title}
                                onChange={(e) => updateService(service.id, 'title', e.target.value)}
                                placeholder="e.g., Web Design, Consulting, Repairs..."
                              />
                            </div>
                            <div>
                              <Label>Service Description</Label>
                              <Textarea
                                value={service.description}
                                onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                placeholder="Describe this service, what's included, pricing info..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>

                {/* Add Service Button */}
                <Button
                  variant="outline"
                  onClick={addService}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Contact Information */}
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

        {/* Appearance */}
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

        {/* Features */}
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

        {/* Working Hours */}
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
