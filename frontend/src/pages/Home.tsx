import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowRight,
  BarChart3,
  Sun,
  Moon,
  Menu,
  Sprout,
  Tractor,
  Leaf,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Users,
  MapPin,
  Truck,
  Shield,
  CheckCircle2,
  ChevronRight,
  Star,
  Phone,
  Mail,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark"
      );
    }
    return false;
  });

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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const features = [
    {
      icon: Sprout,
      title: "Farm Management",
      description:
        "Register farms, plots and growing zones. Track each location's size, soil type, and primary produce across seasons.",
    },
    {
      icon: Leaf,
      title: "Produce Tracking",
      description:
        "Monitor harvests with real-time stock levels. Know exactly what's available, what's sold, and what's coming next.",
    },
    {
      icon: Warehouse,
      title: "Input & Equipment Stock",
      description:
        "Track fertilizers, seeds, chemicals, tools and equipment. Get low-stock alerts before your next planting cycle.",
    },
    {
      icon: Truck,
      title: "Supplier Management",
      description:
        "Manage seed suppliers, equipment dealers, and chemical vendors. Track what they supplied and payment status.",
    },
    {
      icon: DollarSign,
      title: "Farm Expenses",
      description:
        "Record every cost — labour hire, fuelling, equipment rental, transport, chemical spraying and more. Categorized automatically.",
    },
    {
      icon: ShoppingCart,
      title: "Agri Sales",
      description:
        "Record produce sales to buyers. Stock reduces automatically. Track payments, outstanding balances, and transport details.",
    },
  ];

  const stats = [
    { value: "500+", label: "Farms Managed" },
    { value: "₦2B+", label: "Produce Sold" },
    { value: "98%", label: "Accuracy Rate" },
    { value: "24/7", label: "Always Available" },
  ];

  const testimonials = [
    {
      name: "Ibrahim Musa",
      role: "Farm Owner, Kaduna",
      text: "HENOTACE AGRO changed how I run my 3 farms. I can track expenses, sales and produce from my phone. No more paper records.",
      rating: 5,
    },
    {
      name: "Aisha Bello",
      role: "Poultry Farmer, Abuja",
      text: "The supplier management and expense tracking saves me hours every week. I now know my exact profit margin per cycle.",
      rating: 5,
    },
    {
      name: "Chukwuemeka Obi",
      role: "Rice Farmer, Benue",
      text: "Recording sales and watching stock reduce automatically is brilliant. My buyers get proper receipts too.",
      rating: 5,
    },
  ];

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "flex flex-col gap-4" : "hidden md:flex items-center gap-6"}>
      <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
        Features
      </a>
      <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
        How It Works
      </a>
      <a href="#testimonials" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
        Testimonials
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ========= NAVBAR ========= */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                HENOTACE<span className="text-emerald-600"> AGRO</span>
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5 leading-tight">Farm Management Platform</span>
            </div>
          </div>

          <NavLinks />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              className="hidden sm:inline-flex border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              onClick={() => navigate("/agro-login")}
            >
              Sign In
            </Button>
            <Button
              className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col gap-6 mt-8">
                  <NavLinks mobile />
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button variant="outline" className="w-full border-emerald-200 text-emerald-700" onClick={() => navigate("/agro-login")}>
                      Sign In
                    </Button>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/signup")}>
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* ========= HERO ========= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-gray-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/30 to-lime-200/20 dark:from-emerald-800/10 dark:to-lime-800/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-200/30 to-emerald-200/20 dark:from-green-800/10 dark:to-emerald-800/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
              Run Your Farm{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
                Like a Business
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Track farms, produce, expenses, suppliers &amp; sales — all from one dashboard.
              Know your exact profit per harvest cycle. No accountant needed.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6 rounded-xl shadow-xl shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30 hover:-translate-y-0.5"
                onClick={() => navigate("/signup")}
              >
                Start Managing Your Farm
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                onClick={() => navigate("/agro-login")}
              >
                I Have an Account
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" /> Bank-level security
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-500" /> Works across Nigeria
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========= STATS ========= */}
      <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= FEATURES ========= */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything Your Farm Needs
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">
              Six powerful modules designed specifically for agricultural operations in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                      <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========= HOW IT WORKS ========= */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Your Account", description: "Sign up free, name your farm business, and you're in. Takes less than 2 minutes.", icon: Users },
              { step: "02", title: "Set Up Your Farm", description: "Add your farms/plots, register produce items, and set up suppliers. The dashboard organizes everything.", icon: Sprout },
              { step: "03", title: "Track Everything", description: "Record expenses, log sales, monitor stock levels, and see your profit in real-time from any device.", icon: BarChart3 },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 text-white text-xl font-bold mb-6 shadow-lg shadow-emerald-600/20">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= DASHBOARD PREVIEW ========= */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Your Farm at a Glance</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">A powerful dashboard built around how modern farmers actually work.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400 font-mono">dashboard.henotaceagro.com</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Farm Costs", value: "₦2,450,000", color: "text-red-600" },
                    { label: "Harvest Revenue", value: "₦5,800,000", color: "text-emerald-600" },
                    { label: "Net Profit", value: "₦3,350,000", color: "text-blue-600" },
                    { label: "Active Farms", value: "4", color: "text-purple-600" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                      <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Record Expense", "Record Sale", "View Produce", "Manage Suppliers", "Farm Inputs", "View Farms"].map((action) => (
                    <div key={action} className="rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 text-center hover:border-emerald-200 dark:hover:border-emerald-800 cursor-default transition-colors">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========= TESTIMONIALS ========= */}
      <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Trusted by Farmers Across Nigeria</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-gray-100 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========= CTA ========= */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-green-700 px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Farm?</h2>
              <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-10">
                Join hundreds of farmers already using HENOTACE AGRO to track expenses, manage produce, and grow their profit margins.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl font-semibold" onClick={() => navigate("/signup")}>
                  Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl border-white/30 text-white hover:bg-white/10" onClick={() => navigate("/agro-login")}>
                  Sign In to Your Farm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========= FOOTER ========= */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Sprout className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">HENOTACE<span className="text-emerald-600"> AGRO</span></span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
                The complete farm management platform for modern farmers. Track everything from planting to profit.
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> hello@henotaceai.ng</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> +2349138478465</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-emerald-600 transition-colors">Testimonials</a></li>
                <li><button onClick={() => navigate("/terms")} className="hover:text-emerald-600 transition-colors">Terms &amp; Conditions</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Account</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><button onClick={() => navigate("/agro-login")} className="hover:text-emerald-600 transition-colors">Sign In</button></li>
                <li><button onClick={() => navigate("/signup")} className="hover:text-emerald-600 transition-colors">Create Account</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} HENOTACE AGRO. All rights reserved. Powered by Henotace AI.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
