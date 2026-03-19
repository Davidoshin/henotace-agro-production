import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Sprout,
  Leaf,
  Warehouse,
  Truck,
  DollarSign,
  ShoppingCart,
  Calculator,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  Package,
  TrendingUp,
  FileText,
  Clock,
  HardHat,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import AgroPageLayout from "@/components/agro/AgroPageLayout";

/* ─── service definition ─── */
interface ServiceItem {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
  color: string;
  bg: string;
  badge?: string;
}

interface ServiceCategory {
  title: string;
  items: ServiceItem[];
}

const STORAGE_KEY = "agro_recently_used";

const ALL_CATEGORIES: ServiceCategory[] = [
  {
    title: "Operations",
    items: [
      { key: "farms", label: "Farms", icon: Sprout, route: "/agro/farms", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
      { key: "produce", label: "Produce", icon: Leaf, route: "/agro/produce", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
      { key: "inputs", label: "Inputs", icon: Warehouse, route: "/agro/inputs", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
      { key: "sales", label: "Sales", icon: ShoppingCart, route: "/agro/sales", color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
      { key: "customers", label: "Customers", icon: Users, route: "/agro/customers", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
      { key: "suppliers", label: "Suppliers", icon: Truck, route: "/agro/suppliers", color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
      { key: "staff", label: "Staff", icon: HardHat, route: "/agro/staff", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    ],
  },
  {
    title: "Finance",
    items: [
      { key: "account", label: "Account", icon: Calculator, route: "/agro/account", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
      { key: "expenses", label: "Expenses", icon: DollarSign, route: "/agro/expenses", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
      { key: "credit", label: "Credit", icon: CreditCard, route: "/agro/customers", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
      { key: "reports", label: "Reports", icon: BarChart3, route: "/agro/account", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
      { key: "tax", label: "Tax", icon: Landmark, route: "/agro/tax", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
      { key: "projections", label: "Projections", icon: TrendingUp, route: "/agro/account", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30", badge: "Soon" },
    ],
  },
  {
    title: "Records",
    items: [
      { key: "stock-history", label: "Stock\nHistory", icon: Package, route: "/agro/produce", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
      { key: "invoices", label: "Invoices", icon: FileText, route: "/agro/sales", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30", badge: "Soon" },
    ],
  },
  {
    title: "Settings",
    items: [
      { key: "settings", label: "Settings", icon: Settings, route: "/agro-dashboard", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", badge: "Soon" },
      { key: "notifications", label: "Notifications", icon: Bell, route: "/agro-dashboard", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", badge: "Soon" },
      { key: "security", label: "Security", icon: Shield, route: "/agro-dashboard", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", badge: "Soon" },
      { key: "help", label: "Help &\nSupport", icon: HelpCircle, route: "/agro-dashboard", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    ],
  },
];

/* Flatten for search */
const ALL_ITEMS: ServiceItem[] = ALL_CATEGORIES.flatMap((c) => c.items);

export default function AgroServicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [recentKeys, setRecentKeys] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setRecentKeys(stored);
    } catch { /* ignore */ }
  }, []);

  const trackAndNavigate = useCallback(
    (item: ServiceItem) => {
      // Update recently used
      const updated = [item.key, ...recentKeys.filter((k) => k !== item.key)].slice(0, 6);
      setRecentKeys(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      navigate(item.route);
    },
    [recentKeys, navigate],
  );

  const recentItems = recentKeys
    .map((key) => ALL_ITEMS.find((i) => i.key === key))
    .filter(Boolean) as ServiceItem[];

  const filteredCategories = search.trim()
    ? [
        {
          title: "Search Results",
          items: ALL_ITEMS.filter((i) =>
            i.label.toLowerCase().replace(/\n/g, " ").includes(search.toLowerCase()),
          ),
        },
      ]
    : ALL_CATEGORIES;

  const ServiceButton = ({ item }: { item: ServiceItem }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={() => trackAndNavigate(item)}
        className="flex flex-col items-center gap-2 group min-w-[72px]"
      >
        <div className="relative">
          <div
            className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}
          >
            <Icon className={`h-5 w-5 ${item.color}`} />
          </div>
          {item.badge && (
            <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {item.badge}
            </span>
          )}
        </div>
        <span className="text-[11px] lg:text-xs font-medium text-foreground text-center leading-tight whitespace-pre-line">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <AgroPageLayout title="All Services" description="Browse all features available to your farm.">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Recently Used */}
        {!search.trim() && recentItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recently Used
              </h3>
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
              {recentItems.map((item) => (
                <ServiceButton key={`recent-${item.key}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {filteredCategories.map((cat) => (
          <div key={cat.title}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {cat.title}
            </h3>
            {cat.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No matching services</p>
            ) : (
              <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 rounded-2xl border border-border bg-card p-5">
                {cat.items.map((item) => (
                  <ServiceButton key={item.key} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AgroPageLayout>
  );
}
