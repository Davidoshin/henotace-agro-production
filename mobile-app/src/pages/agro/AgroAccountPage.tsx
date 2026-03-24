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
  farm_id: number | null;
  farm_name: string | null;
  total_revenue: number;
  total_paid_sales: number;
  outstanding_sales: number;
  total_expenses: number;
  fixed_expenses_total: number;
  variable_expenses_total: number;
  net_profit: number;
  supplier_total_owed: number;
  supplier_total_paid: number;
  produce_items: number;
  input_items: number;
  suppliers_count: number;
  expense_by_category: Array<{ category: string; total: number }>;
  expense_by_asset_type: Array<{ asset_type: string; label: string; total: number }>;
  monthly_revenue: Array<{ month: string | null; total: number }>;
  monthly_expenses: Array<{ month: string | null; total: number }>;
  farm_breakdown: Array<{
    farm_id: number;
    farm_name: string;
    produce_items: number;
    input_items: number;
    suppliers: number;
    sales_count: number;
    expense_count: number;
    total_revenue: number;
    total_paid_sales: number;
    outstanding_sales: number;
    total_expenses: number;
    input_value: number;
    supplier_total_paid: number;
    supplier_total_owed: number;
    net_profit: number;
    true_net_position: number;
  }>;
}

interface FarmOption {
  id: number;
  name: string;
}

interface BreakdownRow {
  label: string;
  amount: number;
  type: string;
  note: string;
}

const PERIOD_OPTIONS: { label: string; value: PeriodKey }[] = [
  { label: "This Month", value: "monthly" },
  { label: "This Quarter", value: "quarterly" },
  { label: "This Year", value: "annual" },
  { label: "All Time", value: "all" },
  { label: "Custom Range", value: "custom" },
];

const PERIOD_LABELS: Record<PeriodKey, string> = {
  monthly: "This Month",
  quarterly: "This Quarter",
  annual: "This Year",
  all: "All Time",
  custom: "Custom Range",
};

export default function AgroAccountPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountData | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [farmId, setFarmId] = useState("all");

  const fetchData = async (p: PeriodKey, sd?: string, ed?: string, selectedFarmId?: string) => {
    setLoading(true);
    try {
      let url = `agro/account/summary/?period=${p}`;
      if (p === "custom" && sd && ed) {
        url = `agro/account/summary/?start_date=${sd}&end_date=${ed}`;
      }
      const activeFarmId = selectedFarmId ?? farmId;
      if (activeFarmId && activeFarmId !== "all") {
        url += `${url.includes("?") ? "&" : "?"}farm_id=${activeFarmId}`;
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
    fetchData(period, undefined, undefined, farmId);
  }, []);

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const res = await apiGet("agro/farms/");
        setFarms(res?.farms || []);
      } catch {
        setFarms([]);
      }
    };
    loadFarms();
  }, []);

  const handlePeriodChange = (p: PeriodKey) => {
    setPeriod(p);
    if (p !== "custom") {
      fetchData(p, undefined, undefined, farmId);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      fetchData("custom", startDate, endDate, farmId);
    }
  };

  const handleFarmChange = (value: string) => {
    setFarmId(value);
    if (period === "custom") {
      if (startDate && endDate) {
        fetchData("custom", startDate, endDate, value);
      }
      return;
    }
    fetchData(period, undefined, undefined, value);
  };

  const maxExpenseCategory = data?.expense_by_category?.[0]?.total || 1;
  const activePeriodLabel = period === "custom" && startDate && endDate
    ? `${startDate} to ${endDate}`
    : PERIOD_LABELS[period];
  const breakdownRows: BreakdownRow[] = data
    ? [
        { label: "Revenue", amount: data.total_revenue, type: "Income", note: `Total sales revenue for ${activePeriodLabel.toLowerCase()}` },
        { label: "Paid Sales", amount: data.total_paid_sales, type: "Cash In", note: "Sales payments already collected" },
        { label: "Outstanding Sales", amount: data.outstanding_sales, type: "Receivable", note: "Sales still owed by buyers" },
        { label: "Direct Expenses", amount: data.total_expenses, type: "Expense", note: "Recorded operating and farm expenses" },
        { label: "Fixed Asset Costs", amount: data.fixed_expenses_total || 0, type: "Expense", note: "Equipment and long-life asset costs" },
        { label: "Variable Running Costs", amount: data.variable_expenses_total || 0, type: "Expense", note: "Seasonal and day-to-day running costs" },
        { label: "Supplier Payments", amount: data.supplier_total_paid, type: "Cash Out", note: "Payments already made to suppliers" },
        { label: "Supplier Debt", amount: data.supplier_total_owed, type: "Payable", note: "Outstanding amount still owed to suppliers" },
        { label: "Farm Resources Value", amount: data.farm_breakdown.reduce((sum, farm) => sum + (farm.input_value || 0), 0), type: "Stock Value", note: "Current value of inputs and farm resources" },
        { label: "Net Profit", amount: data.net_profit, type: "Result", note: "Revenue minus direct expenses" },
        { label: "True Net Position", amount: data.net_profit - data.supplier_total_owed, type: "Result", note: "Net profit after supplier debt" },
      ]
    : [];

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

      <div className="mb-4 rounded-xl border border-border bg-card p-3">
        <label className="text-xs font-medium text-muted-foreground">Farm Filter</label>
        <select
          value={farmId}
          onChange={(e) => handleFarmChange(e.target.value)}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Farms</option>
          {farms.map((farm) => (
            <option key={farm.id} value={String(farm.id)}>{farm.name}</option>
          ))}
        </select>
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
        <div className="space-y-5 max-w-7xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Accounting Scope</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{data.farm_name || "All Farms"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {activePeriodLabel} • {data.produce_items} produce • {data.input_items} inputs • {data.suppliers_count} suppliers
            </p>
          </div>

          {/* ═══ Summary Cards ═══ */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white">
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Revenue
              </div>
              <p className="text-xl font-bold">{fmt(data.total_revenue)}</p>
              <p className="mt-1 text-[10px] text-emerald-100">{activePeriodLabel}</p>
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
              <p className="mt-1 text-[10px] text-red-100">{activePeriodLabel}</p>
            </div>

            {/* Net Profit */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" /> Net Profit
              </div>
              <p className={`text-xl font-bold ${data.net_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {data.net_profit >= 0 ? "+" : ""}{fmt(data.net_profit)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{activePeriodLabel}</p>
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
            <div className={`rounded-2xl border p-4 ${data.net_profit - data.supplier_total_owed >= 0 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"}`}>
              <p className="text-xs text-muted-foreground mb-1">True Net Position</p>
              <p className={`text-xl font-bold ${data.net_profit - data.supplier_total_owed >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {fmt(data.net_profit - data.supplier_total_owed)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">After expenses and supplier obligations</p>
            </div>
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

          {data.expense_by_asset_type.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Fixed Asset vs Variable Cost Breakdown</h3>
                <p className="text-xs text-muted-foreground">This separates long-term farm asset spend from day-to-day running cost.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.expense_by_asset_type.map((item) => (
                  <div key={item.asset_type} className="rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{fmt(item.total)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {data.total_expenses > 0 ? `${((item.total / data.total_expenses) * 100).toFixed(1)}% of total expenses` : "0.0% of total expenses"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">Accounting Spreadsheet Breakdown</h3>
              <p className="text-xs text-muted-foreground">This shows what makes up the account position: expenses, suppliers, farm resources, and sales.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Line Item</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map((row) => (
                    <tr key={row.label} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{row.label}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.type}</td>
                      <td className={`px-3 py-2 font-semibold ${row.amount >= 0 ? "text-foreground" : "text-red-600 dark:text-red-400"}`}>{fmt(row.amount)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.expense_by_category.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Expense Composition Sheet</h3>
                <p className="text-xs text-muted-foreground">Detailed expense lines grouped by recorded expense category.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expense_by_category.map((category) => {
                      const share = data.total_expenses > 0 ? (category.total / data.total_expenses) * 100 : 0;
                      return (
                        <tr key={category.category} className="border-b border-border/70 last:border-0">
                          <td className="px-3 py-2 font-medium text-foreground">{category.category}</td>
                          <td className="px-3 py-2 text-red-600 dark:text-red-400">{fmt(category.total)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{share.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

          {data.farm_breakdown.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Farm Breakdown</h3>
              <div className="space-y-3">
                {data.farm_breakdown.map((farm) => (
                  <div key={farm.farm_id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{farm.farm_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {farm.sales_count} sales • {farm.expense_count} expenses • {farm.suppliers} suppliers
                        </p>
                      </div>
                      <div className={`text-sm font-semibold ${farm.true_net_position >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {farm.true_net_position >= 0 ? "+" : ""}{fmt(farm.true_net_position)}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(farm.total_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">{fmt(farm.total_expenses)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outstanding Sales</p>
                        <p className="font-semibold text-amber-600 dark:text-amber-400">{fmt(farm.outstanding_sales)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Supplier Debt</p>
                        <p className="font-semibold text-amber-600 dark:text-amber-400">{fmt(farm.supplier_total_owed)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Input Value</p>
                        <p className="font-semibold text-foreground">{fmt(farm.input_value)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Profit/Loss</p>
                        <p className={`font-semibold ${farm.net_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {farm.net_profit >= 0 ? "+" : ""}{fmt(farm.net_profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.farm_breakdown.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Farm Accounting Sheet</h3>
                <p className="text-xs text-muted-foreground">Spreadsheet view of revenue, expenses, supplier obligations, and resource value by farm.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Farm</th>
                      <th className="px-3 py-2 font-medium">Revenue</th>
                      <th className="px-3 py-2 font-medium">Expenses</th>
                      <th className="px-3 py-2 font-medium">Supplier Debt</th>
                      <th className="px-3 py-2 font-medium">Paid Sales</th>
                      <th className="px-3 py-2 font-medium">Outstanding Sales</th>
                      <th className="px-3 py-2 font-medium">Farm Resources</th>
                      <th className="px-3 py-2 font-medium">True Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.farm_breakdown.map((farm) => (
                      <tr key={farm.farm_id} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{farm.farm_name}</td>
                        <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">{fmt(farm.total_revenue)}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400">{fmt(farm.total_expenses)}</td>
                        <td className="px-3 py-2 text-amber-600 dark:text-amber-400">{fmt(farm.supplier_total_owed)}</td>
                        <td className="px-3 py-2 text-foreground">{fmt(farm.total_paid_sales)}</td>
                        <td className="px-3 py-2 text-amber-600 dark:text-amber-400">{fmt(farm.outstanding_sales)}</td>
                        <td className="px-3 py-2 text-foreground">{fmt(farm.input_value)}</td>
                        <td className={`px-3 py-2 font-semibold ${farm.true_net_position >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{fmt(farm.true_net_position)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AgroPageLayout>
  );
}
