import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Search,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  BarChart3,
  CreditCard,
  Truck,
  RotateCcw,
  Receipt,
  History,
  Wallet,
  FileText,
  Bell,
  HelpCircle,
  Shield,
  Zap,
  Gift,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Tag,
  Percent,
  ClipboardList,
  Store,
  Layers,
  Globe,
  Target,
  LineChart
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  category: string;
  isNew?: boolean;
  isHot?: boolean;
}

const AllServicesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // Load recently used from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recently_used_services');
    if (stored) {
      setRecentlyUsed(JSON.parse(stored));
    }
  }, []);

  // Save to recently used
  const handleServiceClick = (service: ServiceItem) => {
    const updated = [service.id, ...recentlyUsed.filter(id => id !== service.id)].slice(0, 4);
    setRecentlyUsed(updated);
    localStorage.setItem('recently_used_services', JSON.stringify(updated));
    navigate(service.path);
  };

  // All services grouped by category
  const allServices: ServiceItem[] = [
    // Operations
    { id: 'staff', name: 'Manage Staff', icon: <Users className="h-6 w-6" />, path: '/business/staff', category: 'Operations' },
    { id: 'customers', name: 'Customers', icon: <Users className="h-6 w-6 text-green-600" />, path: '/business/customers', category: 'Operations' },
    { id: 'products', name: 'Products', icon: <Package className="h-6 w-6 text-purple-600" />, path: '/business/products', category: 'Operations' },
    { id: 'sales', name: 'Sales', icon: <ShoppingCart className="h-6 w-6 text-orange-600" />, path: '/business/sales-details', category: 'Operations' },
    { id: 'orders', name: 'Orders', icon: <ClipboardList className="h-6 w-6 text-amber-600" />, path: '/business/orders', category: 'Operations', isNew: true },
    { id: 'suppliers', name: 'Suppliers', icon: <Truck className="h-6 w-6 text-amber-600" />, path: '/business/suppliers', category: 'Operations' },
    { id: 'stock-history', name: 'Stock History', icon: <History className="h-6 w-6 text-purple-600" />, path: '/business/stock-history', category: 'Operations' },
    
    // Finance
    { id: 'account', name: 'Account', icon: <TrendingUp className="h-6 w-6 text-emerald-600" />, path: '/business/profit-analysis', category: 'Finance' },
    { id: 'expenses', name: 'Expenses', icon: <Receipt className="h-6 w-6 text-blue-600" />, path: '/business/expenses', category: 'Finance' },
    { id: 'credit', name: 'Credit', icon: <CreditCard className="h-6 w-6 text-red-600" />, path: '/business/credit', category: 'Finance' },
    { id: 'reports', name: 'Reports', icon: <BarChart3 className="h-6 w-6 text-cyan-600" />, path: '/business/reports', category: 'Finance' },
    { id: 'wallet', name: 'Wallet', icon: <Wallet className="h-6 w-6 text-green-600" />, path: '/business/wallet', category: 'Finance' },
    { id: 'projections', name: 'Projections', icon: <LineChart className="h-6 w-6 text-indigo-600" />, path: '/business/financial-projections', category: 'Finance', isNew: true },
    
    // Logistics
    { id: 'deliveries', name: 'Deliveries', icon: <Truck className="h-6 w-6 text-cyan-600" />, path: '/business/deliveries', category: 'Logistics' },
    { id: 'shipping', name: 'Shipping', icon: <Truck className="h-6 w-6 text-blue-600" />, path: '/shipping-management', category: 'Logistics', isNew: true },
    { id: 'returns', name: 'Returned', icon: <RotateCcw className="h-6 w-6 text-indigo-600" />, path: '/business/returns', category: 'Logistics' },
    { id: 'branches', name: 'Branches', icon: <Building2 className="h-6 w-6 text-gray-600" />, path: '/business/settings?tab=branches', category: 'Logistics' },
    
    // Marketing
    { id: 'flash-sales', name: 'Flash Sales', icon: <Zap className="h-6 w-6 text-orange-500" />, path: '/business/products?tab=flash-sales', category: 'Marketing', isHot: true },
    { id: 'discounts', name: 'Discounts', icon: <Percent className="h-6 w-6 text-green-500" />, path: '/business/products?tab=discounts', category: 'Marketing' },
    { id: 'loyalty', name: 'Loyalty Program', icon: <Gift className="h-6 w-6 text-pink-500" />, path: '/business/loyalty', category: 'Marketing' },
    { id: 'store', name: 'Online Store', icon: <Store className="h-6 w-6 text-blue-500" />, path: '/business/settings?tab=appearance', category: 'Marketing' },
    
    // Professional Services
    { id: 'professional-services', name: 'Pro Services', icon: <Briefcase className="h-6 w-6 text-purple-600" />, path: '/business/professional-services', category: 'Services' },
    
    // Planning & Goals
    { id: 'goals', name: 'Goals', icon: <Target className="h-6 w-6 text-emerald-600" />, path: '/business/goals', category: 'Planning', isNew: true },
    
    // Settings & More
    { id: 'settings', name: 'Settings', icon: <Settings className="h-6 w-6 text-gray-600" />, path: '/business/settings', category: 'Settings' },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="h-6 w-6 text-yellow-600" />, path: '/business/notifications', category: 'Settings' },
    { id: 'security', name: 'Security', icon: <Shield className="h-6 w-6 text-red-500" />, path: '/business/settings?tab=security', category: 'Settings' },
    { id: 'help', name: 'Help & Support', icon: <HelpCircle className="h-6 w-6 text-blue-500" />, path: '/business/help', category: 'Settings' },
    { id: 'my-tax', name: 'My Tax', icon: <FileText className="h-6 w-6 text-emerald-600" />, path: '/business/my-tax', category: 'Settings' },
  ];

  // Filter services by search
  const filteredServices = searchQuery.trim() 
    ? allServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allServices;

  // Group by category
  const categories = [...new Set(filteredServices.map(s => s.category))];

  // Get recently used services
  const recentServices = recentlyUsed
    .map(id => allServices.find(s => s.id === id))
    .filter(Boolean) as ServiceItem[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">All Services</h1>
          <div className="flex-1 ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Recently Used */}
        {recentServices.length > 0 && !searchQuery.trim() && (
          <div>
            <h2 className="text-base font-semibold text-muted-foreground mb-4">Recently Used</h2>
            <div className="grid grid-cols-4 gap-4">
              {recentServices.map((service) => (
                <Button
                  key={service.id}
                  variant="ghost"
                  className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-muted transition-colors relative group"
                  onClick={() => handleServiceClick(service)}
                >
                  {service.isHot && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">HOT</span>
                  )}
                  {service.isNew && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span>
                  )}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-background [&>svg]:group-hover:text-foreground">
                    {service.icon}
                  </div>
                  <span className="text-sm font-medium text-center line-clamp-2 group-hover:text-foreground">{service.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Services by Category */}
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-base font-semibold text-muted-foreground mb-4">{category}</h2>
            <div className="grid grid-cols-4 gap-4">
              {filteredServices
                .filter(s => s.category === category)
                .map((service) => (
                  <Button
                    key={service.id}
                    variant="ghost"
                    className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-muted transition-colors relative group"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.isHot && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">HOT</span>
                    )}
                    {service.isNew && (
                      <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span>
                    )}
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-background [&>svg]:group-hover:text-foreground">
                      {service.icon}
                    </div>
                    <span className="text-sm font-medium text-center line-clamp-2 group-hover:text-foreground">{service.name}</span>
                  </Button>
                ))}
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No services found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllServicesPage;
