import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarDays,
  Sprout,
  Leaf,
  Warehouse,
  Truck,
  DollarSign,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Menu,
  Calculator,
  Users,
  HardHat,
  Landmark,
} from "lucide-react";
import { useState } from "react";
import { secureLogout } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/agro-dashboard", icon: LayoutDashboard },
  { label: "Farms", path: "/agro/farms", icon: Sprout },
  { label: "Harvests", path: "/agro/harvests", icon: CalendarDays },
  { label: "Produce", path: "/agro/produce", icon: Leaf },
  { label: "Inputs", path: "/agro/inputs", icon: Warehouse },
  { label: "Suppliers", path: "/agro/suppliers", icon: Truck },
  { label: "Expenses", path: "/agro/expenses", icon: DollarSign },
  { label: "Sales", path: "/agro/sales", icon: ShoppingCart },
  { label: "Customers", path: "/agro/customers", icon: Users },
  { label: "Staff", path: "/agro/staff", icon: HardHat },
  { label: "Tax", path: "/agro/tax", icon: Landmark },
  { label: "Account", path: "/agro/account", icon: Calculator },
];

/* Bottom tab bar items (mobile) — OPay style */
const BOTTOM_TABS = [
  { label: "Home", path: "/agro-dashboard", icon: LayoutDashboard },
  { label: "Farms", path: "/agro/farms", icon: Sprout },
  { label: "Harvests", path: "/agro/harvests", icon: CalendarDays },
  { label: "Sales", path: "/agro/sales", icon: ShoppingCart },
  { label: "Expenses", path: "/agro/expenses", icon: DollarSign },
  { label: "More", path: "/agro/services", icon: Menu },
];

interface AgroPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AgroPageLayout({ children, title, description }: AgroPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = localStorage.getItem("user_first_name") || "Farmer";
  const businessName = localStorage.getItem("business_name") || "My Farm";

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    try {
      await secureLogout();
    } catch {
      // clear manually
    }
    localStorage.clear();
    navigate("/agro-login");
  };

  const SideNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 lg:pb-0">
      {/* ─── Top header ─── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-4">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <Sprout className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    HENOTACE<span className="text-emerald-600"> FARMS</span>
                  </span>
                </div>
                <SideNav onNavigate={() => setMobileOpen(false)} />
                <div className="pt-6 border-t mt-6">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full transition-colors mb-1"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/agro-dashboard")}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
                <Sprout className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {businessName}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">HENOTACE FARMS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 hidden sm:inline-flex">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <div className="h-5 w-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* ─── Sidebar (desktop) ─── */}
        <aside className="hidden lg:block w-[240px] shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
          <SideNav />
          <div className="pt-6 border-t mt-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => navigate("/agro-dashboard")}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>

          {children}
        </main>
      </div>

      {/* ─── Bottom Tab Bar (mobile only, OPay style) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
