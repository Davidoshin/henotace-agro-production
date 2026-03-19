import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Leaf,
  MoreHorizontal,
  Package,
  ShoppingCart,
  Sprout,
  Truck,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  HardHat,
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tx = {
  id: number;
  type: "sale" | "expense";
  title: string;
  amount: number;
  date: string | null;
  status?: string;
};

/* ─── component ─── */
export default function AgroProductionDashboard() {
  const navigate = useNavigate();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    farms: 0,
    produce: 0,
    inputItems: 0,
    suppliers: 0,
    outstandingSales: 0,
  });
  const [recentTxns, setRecentTxns] = useState<Tx[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        /* summary */
        const sRes = await apiGet("agro/dashboard/summary/");
        const s = sRes?.summary || {};
        setSummary({
          totalRevenue: Number(s.total_sales || 0),
          totalExpenses: Number(s.total_expenses || 0),
          farms: Number(s.farms || 0),
          produce: Number(s.produce || 0),
          inputItems: Number(s.input_items || 0),
          suppliers: Number(s.suppliers || 0),
          outstandingSales: Number(s.outstanding_sales || 0),
        });

        /* recent transactions = sales + expenses merged & sorted */
        const [salesRes, expensesRes] = await Promise.all([
          apiGet("agro/sales/").catch(() => ({ sales: [] })),
          apiGet("agro/expenses/").catch(() => ({ expenses: [] })),
        ]);

        const sales: Tx[] = ((salesRes as any)?.sales || []).slice(0, 10).map((s: any) => ({
          id: s.id,
          type: "sale" as const,
          title: s.buyer_name || s.produce_name || "Sale",
          amount: Number(s.total_amount || 0),
          date: s.sale_date,
          status: s.payment_status,
        }));

        const expenses: Tx[] = ((expensesRes as any)?.expenses || []).slice(0, 10).map((e: any) => ({
          id: e.id,
          type: "expense" as const,
          title: e.title || e.category_name || "Expense",
          amount: Number(e.amount || 0),
          date: e.expense_date,
          status: e.payment_status,
        }));

        const merged = [...sales, ...expenses]
          .sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          })
          .slice(0, 8);

        setRecentTxns(merged);
      } catch {
        /* fallback to empty */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /* ─── Quick action buttons (Sales / Suppliers / Expenses) ─── */
  const quickActions = [
    { label: "Sales", icon: ShoppingCart, route: "/agro/sales", color: "bg-emerald-500" },
    { label: "Suppliers", icon: Truck, route: "/agro/suppliers", color: "bg-blue-500" },
    { label: "Expenses", icon: Wallet, route: "/agro/expenses", color: "bg-orange-500" },
  ];

  /* ─── Services grid ─── */
  const services = [
    { label: "Produce", icon: Leaf, route: "/agro/produce", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Inputs", icon: Package, route: "/agro/inputs", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Farms", icon: Sprout, route: "/agro/farms", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Account", icon: Calendar, route: "/agro/account", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Customers", icon: Users, route: "/agro/customers", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Credit", icon: CreditCard, route: "/agro/customers", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Staff", icon: HardHat, route: "/agro/staff", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "More", icon: MoreHorizontal, route: "/agro/services", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
  ];

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto pb-8">
      {/* ═══ Desktop: two-column grid ═══ */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 space-y-5 lg:space-y-0">

        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-5">
          {/* BALANCE CARD */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white p-5 lg:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-medium">
                <DollarSign className="h-3.5 w-3.5" /> Harvest Revenue
              </div>
              <button onClick={() => navigate("/agro/sales")} className="flex items-center gap-1 text-xs text-emerald-100 hover:text-white transition-colors">
                Transaction History <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl lg:text-4xl font-bold tracking-tight">
                {loading ? "..." : balanceHidden ? "₦••••••" : fmt(summary.totalRevenue)}
              </span>
              <button onClick={() => setBalanceHidden(!balanceHidden)} className="text-emerald-200 hover:text-white transition-colors">
                {balanceHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button onClick={() => navigate("/agro/produce")} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium transition-colors">
              <Calendar className="h-3.5 w-3.5" /> Upcoming Harvests
            </button>
            <button onClick={() => navigate("/agro/expenses")} className="mt-4 w-full flex items-center justify-between bg-emerald-700/60 hover:bg-emerald-700/80 rounded-xl px-4 py-2.5 transition-colors">
              <span className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100">Monthly Farm Costs:</span>
                <span className="font-semibold text-white">{loading ? "..." : fmt(summary.totalExpenses)}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-emerald-200" />
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => navigate(item.route)} className="flex flex-col items-center gap-2 group">
                  <div className={`h-14 w-14 rounded-2xl ${item.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* MANAGE MY FARM */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Manage My Farm</h3>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 rounded-2xl border border-border bg-card p-5">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => navigate(item.route)} className="flex flex-col items-center gap-2 group">
                  <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="text-[11px] lg:text-xs font-medium text-foreground text-center leading-tight whitespace-pre-line">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* FARM OVERVIEW + OUTSTANDING — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <button onClick={() => navigate("/agro/farms")} className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors text-left">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <Sprout className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Farm Overview</p>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : `${summary.farms} farm${summary.farms !== 1 ? "s" : ""} • ${summary.produce} produce • ${summary.suppliers} supplier${summary.suppliers !== 1 ? "s" : ""}`}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {summary.outstandingSales > 0 && (
              <button onClick={() => navigate("/agro/sales")} className="w-full flex items-center justify-between rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-left hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Outstanding Payments</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Unpaid sales to collect</p>
                </div>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{fmt(summary.outstandingSales)}</span>
              </button>
            )}
          </div>

          {/* RECENT TRANSACTIONS — mobile only */}
          {recentTxns.length > 0 && (
            <div className="space-y-3 lg:hidden">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Recent Transactions</h3>
              {recentTxns.slice(0, 6).map((tx) => (
                <button key={`m-${tx.type}-${tx.id}`} className="w-full flex items-center gap-3 bg-card hover:bg-accent/50 border border-border rounded-xl px-4 py-3 transition-colors text-left" onClick={() => navigate(tx.type === "sale" ? "/agro/sales" : "/agro/expenses")}>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "sale" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                    {tx.type === "sale" ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{tx.type === "sale" ? `Sale to ${tx.title}` : tx.title}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === "sale" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {tx.type === "sale" ? "+" : "-"}{fmt(tx.amount)}
                    </p>
                    {tx.status && <p className="text-[10px] text-muted-foreground capitalize">{tx.status}</p>}
                  </div>
                </button>
              ))}
              {recentTxns.length > 6 && (
                <button onClick={() => navigate("/agro/sales")} className="w-full text-center py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 border border-border rounded-xl hover:bg-accent/50 transition-colors">
                  View All Transactions →
                </button>
              )}
            </div>
          )}
        </div>{/* end left column */}

        {/* ─── RIGHT COLUMN (desktop only) — Transactions ─── */}
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Transactions</h3>
            {recentTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTxns.slice(0, 6).map((tx) => (
                  <button key={`d-${tx.type}-${tx.id}`} className="w-full flex items-center gap-3 hover:bg-accent/50 rounded-xl px-3 py-2.5 transition-colors text-left" onClick={() => navigate(tx.type === "sale" ? "/agro/sales" : "/agro/expenses")}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "sale" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                      {tx.type === "sale" ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{tx.type === "sale" ? `Sale to ${tx.title}` : tx.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${tx.type === "sale" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.type === "sale" ? "+" : "-"}{fmt(tx.amount)}
                      </p>
                      {tx.status && <p className="text-[10px] text-muted-foreground capitalize">{tx.status}</p>}
                    </div>
                  </button>
                ))}
                {recentTxns.length > 6 && (
                  <button onClick={() => navigate("/agro/sales")} className="w-full text-center py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 rounded-xl hover:bg-accent/50 transition-colors">
                    View All Transactions →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>{/* end right column */}

      </div>{/* end 2-col grid */}
    </div>
  );
}
