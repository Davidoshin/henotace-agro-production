import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Search,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  MapPin,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  History,
  Sparkles,
  Receipt,
  Wallet,
  Clock
} from "lucide-react";

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
  category: string;
}

const ALL_SERVICES: ServiceItem[] = [
  // Core Business
  { id: 'staff', label: 'Manage Staff', icon: Users, route: '/business/staff', color: 'text-primary', category: 'Core Business' },
  { id: 'customers', label: 'Customers', icon: Users, route: '/business/customers', color: 'text-green-600', category: 'Core Business' },
  { id: 'products', label: 'Products', icon: Package, route: '/business/products', color: 'text-purple-600', category: 'Core Business' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, route: '/business/sales-details', color: 'text-orange-600', category: 'Core Business' },
  
  // Finance & Accounting
  { id: 'account', label: 'Account', icon: TrendingUp, route: '/business/profit-analysis', color: 'text-emerald-600', category: 'Finance & Accounting' },
  { id: 'expenses', label: 'Expenses', icon: TrendingUp, route: '/business/expenses', color: 'text-blue-600', category: 'Finance & Accounting' },
  { id: 'credit', label: 'Credit Management', icon: CreditCard, route: '/business/customers', color: 'text-red-600', category: 'Finance & Accounting' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, route: '/business/wallet', color: 'text-indigo-600', category: 'Finance & Accounting' },
  
  // Inventory & Stock
  { id: 'stock-history', label: 'Stock History', icon: History, route: '/business/stock-history', color: 'text-purple-600', category: 'Inventory & Stock' },
  { id: 'suppliers', label: 'Suppliers', icon: Truck, route: '/business/suppliers', color: 'text-amber-600', category: 'Inventory & Stock' },
  { id: 'returns', label: 'Returns', icon: RotateCcw, route: '/business/returns', color: 'text-indigo-600', category: 'Inventory & Stock' },
  
  // Operations
  { id: 'deliveries', label: 'Deliveries', icon: MapPin, route: '/business/deliveries', color: 'text-cyan-600', category: 'Operations' },
  
  // Logistics
  { id: 'shipping', label: 'Shipping', icon: Truck, route: '/shipping-management', color: 'text-blue-600', category: 'Logistics' },
  { id: 'tracking', label: 'Order Tracking', icon: MapPin, route: '/business/order-tracking', color: 'text-green-600', category: 'Logistics' },
  { id: 'dispatch', label: 'Dispatch', icon: Truck, route: '/business/dispatch', color: 'text-orange-600', category: 'Logistics' },
  
  // Reports & Analytics
  { id: 'reports', label: 'Reports', icon: BarChart3, route: '/business/reports', color: 'text-cyan-600', category: 'Reports & Analytics' },
  
  // Professional Services
  { id: 'pro-services', label: 'Pro Services', icon: Sparkles, route: '/business/professional-services', color: 'text-pink-600', category: 'Professional Services' },
  
  // Settings
  { id: 'settings', label: 'Settings', icon: Settings, route: '/business/settings', color: 'text-gray-600', category: 'Settings' },
];

// Storage key for recently used services
const RECENTLY_USED_KEY = 'henotace_recently_used_services';
const MAX_RECENT = 4;

export default function AllServices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  useEffect(() => {
    // Load recently used from localStorage
    const saved = localStorage.getItem(RECENTLY_USED_KEY);
    if (saved) {
      try {
        setRecentlyUsed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recently used services:', e);
      }
    }
  }, []);

  const handleServiceClick = (service: ServiceItem) => {
    // Update recently used
    const updated = [service.id, ...recentlyUsed.filter(id => id !== service.id)].slice(0, MAX_RECENT);
    setRecentlyUsed(updated);
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
    
    // Navigate to the service
    navigate(service.route);
  };

  // Filter services based on search
  const filteredServices = searchQuery
    ? ALL_SERVICES.filter(s => 
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_SERVICES;

  // Group services by category
  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceItem[]>);

  // Get recently used services
  const recentServices = recentlyUsed
    .map(id => ALL_SERVICES.find(s => s.id === id))
    .filter((s): s is ServiceItem => s !== undefined);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/business-admin-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">All Services</h1>
          </div>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Recently Used Section */}
        {!searchQuery && recentServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-muted-foreground">Recently Used</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {recentServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group border"
                    onClick={() => handleServiceClick(service)}
                  >
                    <IconComponent className={`h-7 w-7 ${service.color}`} />
                    <span className="text-xs font-medium text-center text-foreground group-hover:text-foreground line-clamp-2">
                      {service.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categorized Services */}
        {Object.entries(groupedServices).map(([category, services]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-4">{category}</h2>
            <div className="grid grid-cols-4 gap-3">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group border"
                    onClick={() => handleServiceClick(service)}
                  >
                    <IconComponent className={`h-7 w-7 ${service.color}`} />
                    <span className="text-xs font-medium text-center text-foreground group-hover:text-foreground line-clamp-2">
                      {service.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        {/* No results */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No services found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-20" />
    </div>
  );
}
