import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
} from "lucide-react";
import AgroPageLayout from "@/components/agro/AgroPageLayout";

/* ─── helpers ─── */
const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type PeriodKey = "monthly" | "quarterly" | "annual" | "all" | "custom";

interface AccountData {
  period: string;
  start_date: string | null;
  end_date: string;
  total_revenue: number;
  total_paid_sales: number;
  outstanding_sales: number;
  total_expenses: number;
  net_profit: number;
  supplier_total_owed: number;
  supplier_total_paid: number;
  expense_by_category: Array<{ category: string; total: number }>;
  monthly_revenue: Array<{ month: string | null; total: number }>;
  monthly_expenses: Array<{ month: string | null; total: number }>;
}

const PERIOD_OPTIONS: { label: string; value: PeriodKey }[] = [
  { label: "This Month", value: "monthly" },
  { label: "This Quarter", value: "quarterly" },
  { label: "This Year", value: "annual" },
  { label: "All Time", value: "all" },
  { label: "Custom Range", value: "custom" },
];

export default function AgroAccountPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountData | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async (p: PeriodKey, sd?: string, ed?: string) => {
    setLoading(true);
    try {
      let url = `agro/account/summary/?period=${p}`;
      if (p === "custom" && sd && ed) {
        url = `agro/account/summary/?start_date=${sd}&end_date=${ed}`;
      }
      const res = await apiGet(url);
      setData(res?.account || null);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, []);

  const handlePeriodChange = (p: PeriodKey) => {
    setPeriod(p);
    if (p !== "custom") {
      fetchData(p);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      fetchData("custom", startDate, endDate);
    }
  };

  const maxExpenseCategory = data?.expense_by_category?.[0]?.total || 1;

  return (
    <AgroPageLayout title="Account" description="Track your farm's financial health — revenue, expenses, supplier debts, and net profit.">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-card border border-border text-foreground hover:bg-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === "custom" && (
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 rounded-xl border border-border bg-card">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              className="h-9 w-40 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              className="h-9 w-40 cursor-pointer"
            />
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9" onClick={handleCustomApply}>
            <Filter className="h-3.5 w-3.5 mr-1" /> Apply
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading account data...</p>
        </div>
      ) : !data ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No data available.</p>
        </div>
      ) : (
        <div className="space-y-5 max-w-lg mx-auto">
          {/* ═══ Summary Cards ═══ */}
          <div className="grid grid-cols-2 gap-3">
            {/* Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white">
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Revenue
              </div>
              <p className="text-xl font-bold">{fmt(data.total_revenue)}</p>
              {data.outstanding_sales > 0 && (
                <p className="text-[10px] text-emerald-200 mt-1">
                  {fmt(data.outstanding_sales)} outstanding
                </p>
              )}
            </div>

            {/* Expenses */}
            <div className="rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 p-4 text-white">
              <div className="flex items-center gap-1.5 text-red-100 text-xs mb-1">
                <TrendingDown className="h-3.5 w-3.5" /> Expenses
              </div>
              <p className="text-xl font-bold">{fmt(data.total_expenses)}</p>
            </div>

            {/* Net Profit */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" /> Net Profit
              </div>
              <p className={`text-xl font-bold ${data.net_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {data.net_profit >= 0 ? "+" : ""}{fmt(data.net_profit)}
              </p>
            </div>

            {/* Supplier Debts */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Truck className="h-3.5 w-3.5" /> Owed to Suppliers
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {fmt(data.supplier_total_owed)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {fmt(data.supplier_total_paid)} paid
              </p>
            </div>
          </div>

          {/* ═══ Profit Summary Banner ═══ */}
          <div
            className={`rounded-2xl p-4 text-center ${
              data.net_profit >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">
              After all expenses & supplier obligations
            </p>
            <p
              className={`text-2xl font-bold ${
                data.net_profit - data.supplier_total_owed >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {fmt(data.net_profit - data.supplier_total_owed)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              True Net Position
            </p>
          </div>

          {/* ═══ Expense Breakdown ═══ */}
          {data.expense_by_category.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Expense Breakdown</h3>
              <div className="space-y-3">
                {data.expense_by_category.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{cat.category}</span>
                      <span className="text-xs font-medium text-foreground">{fmt(cat.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                        style={{ width: `${Math.max((cat.total / maxExpenseCategory) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Monthly Trend ═══ */}
          {(data.monthly_revenue.length > 0 || data.monthly_expenses.length > 0) && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Monthly Trend</h3>
              <div className="space-y-2">
                {(() => {
                  const months = new Map<string, { revenue: number; expenses: number }>();
                  data.monthly_revenue.forEach((r) => {
                    if (r.month) {
                      const key = r.month.slice(0, 7);
                      const entry = months.get(key) || { revenue: 0, expenses: 0 };
                      entry.revenue = r.total;
                      months.set(key, entry);
                    }
                  });
                  data.monthly_expenses.forEach((e) => {
                    if (e.month) {
                      const key = e.month.slice(0, 7);
                      const entry = months.get(key) || { revenue: 0, expenses: 0 };
                      entry.expenses = e.total;
                      months.set(key, entry);
                    }
                  });

                  return Array.from(months.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-6)
                    .map(([monthKey, vals]) => {
                      const label = new Date(monthKey + "-01").toLocaleDateString("en-NG", {
                        month: "short",
                        year: "2-digit",
                      });
                      const profit = vals.revenue - vals.expenses;
                      return (
                        <div
                          key={monthKey}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="text-xs font-medium text-foreground w-16">{label}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <ArrowDownLeft className="h-3 w-3" /> {fmt(vals.revenue)}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <ArrowUpRight className="h-3 w-3" /> {fmt(vals.expenses)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 ${
                                profit >= 0
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {profit >= 0 ? "+" : ""}
                              {fmt(profit)}
                            </Badge>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </AgroPageLayout>
  );
}
