import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Search,
  Clock,
  BarChart3,
  Building2,
  Users,
  FileText,
  Calendar,
  Settings,
  Wrench,
  Globe,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  Briefcase,
  ClipboardList,
  TrendingUp,
  PieChart,
  Target,
  Link as LinkIcon,
  Share2,
  QrCode,
  Palette,
  ImageIcon,
  FileImage,
  Video,
  Megaphone,
  Gift,
  Tag,
  DollarSign,
  HelpCircle,
  BookOpen,
  UserPlus,
  LineChart,
  ScrollText,
  Truck
} from "lucide-react";

interface ServiceOption {
  id: string;
  icon: any;
  label: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
  category: string;
}

export default function ServiceMoreOptions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // Load recently used from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recently_used_service_options');
    if (stored) {
      setRecentlyUsed(JSON.parse(stored));
    }
  }, []);

  // All service options as a flat array for easier filtering
  const allServiceOptions: ServiceOption[] = [
    // Core Service Management
    { 
      id: 'my-services',
      icon: Wrench, 
      label: "My Services", 
      description: "Manage your service offerings",
      path: "/business/services",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      category: "Service Management"
    },
    { 
      id: 'service-requests',
      icon: ClipboardList, 
      label: "Service Requests", 
      description: "View and manage client requests",
      path: "/business/service-requests",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      category: "Service Management"
    },
    { 
      id: 'bookings',
      icon: Calendar, 
      label: "Bookings", 
      description: "Manage appointments and bookings",
      path: "/business/bookings",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      category: "Service Management"
    },
    { 
      id: 'inquiries',
      icon: MessageSquare, 
      label: "Inquiries", 
      description: "Respond to client inquiries",
      path: "/business/inquiries",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      category: "Service Management"
    },
    { 
      id: 'client-messages',
      icon: Mail, 
      label: "Client Messages", 
      description: "View and reply to client messages",
      path: "/business/client-messages",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      category: "Service Management"
    },
    // Team & Clients
    { 
      id: 'team-members',
      icon: Users, 
      label: "Team Members", 
      description: "Manage your team profile",
      path: "/business/team-members",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      category: "Team & Clients"
    },
    { 
      id: 'leads',
      icon: UserPlus, 
      label: "Leads", 
      description: "Manage leads & campaigns",
      path: "/business/leads",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      category: "Team & Clients"
    },
    { 
      id: 'reviews',
      icon: Star, 
      label: "Testimonials", 
      description: "Manage client reviews",
      path: "/business/testimonials",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      category: "Team & Clients"
    },
    { 
      id: 'portfolio',
      icon: Award, 
      label: "Portfolio", 
      description: "Showcase your work",
      path: "/business/portfolio",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      category: "Team & Clients"
    },
    { 
      id: 'blog',
      icon: BookOpen, 
      label: "Blog", 
      description: "Create blog posts",
      path: "/business/blog",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      category: "Team & Clients"
    },
    // Website & Branding
    { 
      id: 'service-website',
      icon: Globe, 
      label: "Service Website", 
      description: "Customize your public page",
      path: "/service-settings",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      category: "Website & Branding"
    },
    { 
      id: 'appearance',
      icon: Palette, 
      label: "Appearance", 
      description: "Colors, fonts & layout",
      path: "/service-settings#appearance",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      category: "Website & Branding"
    },
    { 
      id: 'share-links',
      icon: Share2, 
      label: "Share Links", 
      description: "Share your service page",
      path: "/service-settings#share",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      category: "Website & Branding"
    },
    { 
      id: 'qr-code',
      icon: QrCode, 
      label: "QR Code", 
      description: "Generate QR for your page",
      path: "/service-settings#qr",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      category: "Website & Branding"
    },
    // Analytics & Reports
    { 
      id: 'analytics',
      icon: BarChart3, 
      label: "Analytics", 
      description: "View business insights",
      path: "/business/analytics",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      category: "Analytics & Reports"
    },
    { 
      id: 'revenue-reports',
      icon: TrendingUp, 
      label: "Revenue Reports", 
      description: "Track your earnings",
      path: "/business/reports/revenue",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      category: "Analytics & Reports"
    },
    { 
      id: 'service-stats',
      icon: PieChart, 
      label: "Service Stats", 
      description: "Service performance metrics",
      path: "/business/reports/services",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      category: "Analytics & Reports"
    },
    // Planning & Goals
    { 
      id: 'goals',
      icon: Target, 
      label: "Goals", 
      description: "Track targets & milestones",
      path: "/business/goals",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      category: "Planning & Goals"
    },
    { 
      id: 'projections',
      icon: LineChart, 
      label: "Projections", 
      description: "Financial forecasts & projections",
      path: "/business/financial-projections",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      category: "Planning & Goals"
    },
    { 
      id: 'proposals',
      icon: ScrollText, 
      label: "Proposals", 
      description: "Create & manage business proposals",
      path: "/business/proposals",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      category: "Service Management"
    },
    { 
      id: 'shipping',
      icon: Truck, 
      label: "Shipping", 
      description: "Manage shipments and tracking",
      path: "/shipping-management",
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      category: "Service Management"
    },
    // Communication
    { 
      id: 'notifications',
      icon: Bell, 
      label: "Notifications", 
      description: "Manage notification settings",
      path: "/business/notifications",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      category: "Communication"
    },
    { 
      id: 'email-templates',
      icon: Mail, 
      label: "Email Templates", 
      description: "Customize email messages",
      path: "/business/email-templates",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      category: "Communication"
    },
    { 
      id: 'announcements',
      icon: Megaphone, 
      label: "Announcements", 
      description: "Send updates to clients",
      path: "/business/announcements",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      category: "Communication"
    },
    // Settings
    { 
      id: 'business-settings',
      icon: Building2, 
      label: "Business Settings", 
      description: "General business info",
      path: "/business-settings",
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
      category: "Settings"
    },
    { 
      id: 'preferences',
      icon: Settings, 
      label: "Preferences", 
      description: "App preferences",
      path: "/settings",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      category: "Settings"
    },
    { 
      id: 'help-support',
      icon: HelpCircle, 
      label: "Help & Support", 
      description: "Get assistance",
      path: "/help",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      category: "Settings"
    },
  ];

  // Save to recently used and navigate
  const handleOptionClick = (option: ServiceOption) => {
    const updated = [option.id, ...recentlyUsed.filter(id => id !== option.id)].slice(0, 4);
    setRecentlyUsed(updated);
    localStorage.setItem('recently_used_service_options', JSON.stringify(updated));
    navigate(option.path);
  };

  // Filter by search query
  const filteredOptions = searchQuery.trim()
    ? allServiceOptions.filter(o => 
        o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allServiceOptions;

  // Group by category
  const categories = [...new Set(filteredOptions.map(o => o.category))];
  
  // Get recently used options
  const recentOptions = recentlyUsed
    .map(id => allServiceOptions.find(o => o.id === id))
    .filter(Boolean) as ServiceOption[];

  // Create category sections
  const serviceOptions = categories.map(category => ({
    category,
    items: filteredOptions.filter(o => o.category === category)
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Search */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">More Options</h1>
        </div>
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
      </div>

      {/* Options Grid */}
      <div className="p-4 space-y-6">
        {/* Recently Used Section */}
        {recentOptions.length > 0 && !searchQuery.trim() && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {recentOptions.map((item) => (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOptionClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{item.label}</h3>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredOptions.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No options found for "{searchQuery}"</p>
          </div>
        )}

        {/* Category Sections */}
        {serviceOptions.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              {section.category}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {section.items.map((item) => (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOptionClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{item.label}</h3>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
