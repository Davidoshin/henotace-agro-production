import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import {
  Calculator,
  Download,
  Loader2,
  Printer,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Receipt,
  Wallet,
  PieChart,
} from "lucide-react";
import AgroPageLayout from "@/components/agro/AgroPageLayout";

/* ─── helpers ─── */
const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (v: number) => `${(v || 0).toFixed(1)}%`;

interface TaxData {
  year: number;
  tier: string;
  annual_revenue: number;
  annual_expenses: number;
  supplier_costs: number;
  total_costs: number;
  gross_profit: number;
  net_profit: number;
  cit_rate: number;
  cit_amount: number;
  tet_rate: number;
  tet_amount: number;
  vat_rate: number;
  vat_taxable_amount: number;
  vat_amount: number;
  wht_rate: number;
  wht_amount: number;
  total_estimated_tax: number;
  effective_rate: number;
  monthly_revenue: { month: string | null; total: number }[];
  monthly_expenses: { month: string | null; total: number }[];
}

export default function AgroTaxDashboard() {
  const [loading, setLoading] = useState(true);
  const [tax, setTax] = useState<TaxData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGet("agro/tax/dashboard/");
        setTax(res?.tax || null);
      } catch {
        setTax(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = () => {
    if (!tax) return;
    const win = window.open("", "_blank", "width=800,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Tax Dashboard — ${tax.year}</title>
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#1a1a1a;max-width:800px;margin:0 auto}
        h1{font-size:22px;margin:0 0 4px}p.sub{font-size:13px;color:#666;margin:0 0 20px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
        .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px}
        .card p.label{font-size:11px;color:#666;margin:0 0 4px}
        .card p.value{font-size:20px;font-weight:700;margin:0}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        th{background:#f9fafb;font-weight:600}
        .total{font-weight:700;font-size:15px;border-top:2px solid #333}
        @media print{body{padding:12px}}
      </style></head><body>
      <h1>🧮 Tax Dashboard — ${tax.year}</h1>
      <p class="sub">Real-time tax calculation for your agro business · Tier: ${tax.tier}</p>
      <div class="grid">
        <div class="card"><p class="label">Annual Revenue</p><p class="value" style="color:#16a34a">${fmt(tax.annual_revenue)}</p></div>
        <div class="card"><p class="label">Total Expenses</p><p class="value" style="color:#dc2626">${fmt(tax.total_costs)}</p></div>
        <div class="card"><p class="label">Net Profit</p><p class="value" style="color:${tax.net_profit >= 0 ? '#16a34a' : '#dc2626'}">${fmt(tax.net_profit)}</p></div>
        <div class="card"><p class="label">Total Estimated Tax</p><p class="value" style="color:#7c3aed">${fmt(tax.total_estimated_tax)}</p></div>
      </div>
      <table>
        <thead><tr><th>Tax Type</th><th>Rate</th><th>Taxable Amount</th><th>Tax Amount</th></tr></thead>
        <tbody>
          <tr><td>Companies Income Tax (CIT)</td><td>${pct(tax.cit_rate * 100)}</td><td>${fmt(tax.net_profit)}</td><td>${fmt(tax.cit_amount)}</td></tr>
          <tr><td>Tertiary Education Tax (TET)</td><td>${pct(tax.tet_rate * 100)}</td><td>${fmt(tax.net_profit)}</td><td>${fmt(tax.tet_amount)}</td></tr>
          <tr><td>VAT (on processed goods)</td><td>${pct(tax.vat_rate * 100)}</td><td>${fmt(tax.vat_taxable_amount)}</td><td>${fmt(tax.vat_amount)}</td></tr>
          <tr><td>Withholding Tax (WHT)</td><td>${pct(tax.wht_rate * 100)}</td><td>${fmt(tax.supplier_costs)}</td><td>${fmt(tax.wht_amount)}</td></tr>
          <tr class="total"><td>Total Estimated Tax</td><td></td><td></td><td>${fmt(tax.total_estimated_tax)}</td></tr>
        </tbody>
      </table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleExport = () => {
    if (!tax) return;
    const rows = [
      ["Tax Type", "Rate", "Taxable Amount", "Tax Amount"],
      ["CIT", `${(tax.cit_rate * 100).toFixed(1)}%`, String(tax.net_profit), String(tax.cit_amount)],
      ["TET", `${(tax.tet_rate * 100).toFixed(1)}%`, String(tax.net_profit), String(tax.tet_amount)],
      ["VAT", `${(tax.vat_rate * 100).toFixed(1)}%`, String(tax.vat_taxable_amount), String(tax.vat_amount)],
      ["WHT", `${(tax.wht_rate * 100).toFixed(1)}%`, String(tax.supplier_costs), String(tax.wht_amount)],
      ["TOTAL", "", "", String(tax.total_estimated_tax)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${tax.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AgroPageLayout title="Tax Dashboard" description="Real-time tax calculation for your farm business.">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-3" />
          <span className="text-muted-foreground">Calculating taxes...</span>
        </div>
      ) : !tax ? (
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Could not load tax data.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title & actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Tax Summary — {tax.year}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-xs">
                    {tax.tier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Effective rate: {pct(tax.effective_rate)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Annual Revenue</span>
              </div>
              <p className="text-lg font-bold text-emerald-600">{fmt(tax.annual_revenue)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Total Costs</span>
              </div>
              <p className="text-lg font-bold text-red-600">{fmt(tax.total_costs)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Net Profit</span>
              </div>
              <p className={`text-lg font-bold ${tax.net_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmt(tax.net_profit)}
              </p>
            </Card>
            <Card className="p-4 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-muted-foreground">Estimated Tax</span>
              </div>
              <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{fmt(tax.total_estimated_tax)}</p>
            </Card>
          </div>

          {/* Tax breakdown table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-violet-600" /> Tax Breakdown
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on Nigerian tax laws & agricultural exemptions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/30 border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Tax Type</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Rate</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Taxable</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">Companies Income Tax (CIT)</p>
                        <p className="text-xs text-muted-foreground">Applies to taxable profit</p>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 font-mono">{pct(tax.cit_rate * 100)}</td>
                    <td className="text-right px-5 py-3">{fmt(tax.net_profit)}</td>
                    <td className="text-right px-5 py-3 font-semibold">{fmt(tax.cit_amount)}</td>
                  </tr>
                  <tr className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">Tertiary Education Tax (TET)</p>
                        <p className="text-xs text-muted-foreground">2.5% of assessable profit</p>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 font-mono">{pct(tax.tet_rate * 100)}</td>
                    <td className="text-right px-5 py-3">{fmt(tax.net_profit)}</td>
                    <td className="text-right px-5 py-3 font-semibold">{fmt(tax.tet_amount)}</td>
                  </tr>
                  <tr className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">Value Added Tax (VAT)</p>
                        <p className="text-xs text-muted-foreground">7.5% on ~20% of revenue (processed goods)</p>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 font-mono">{pct(tax.vat_rate * 100)}</td>
                    <td className="text-right px-5 py-3">{fmt(tax.vat_taxable_amount)}</td>
                    <td className="text-right px-5 py-3 font-semibold">{fmt(tax.vat_amount)}</td>
                  </tr>
                  <tr className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">Withholding Tax (WHT)</p>
                        <p className="text-xs text-muted-foreground">5% on supplier/contractor payments</p>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 font-mono">{pct(tax.wht_rate * 100)}</td>
                    <td className="text-right px-5 py-3">{fmt(tax.supplier_costs)}</td>
                    <td className="text-right px-5 py-3 font-semibold">{fmt(tax.wht_amount)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-violet-50 dark:bg-violet-950/20 border-t-2 border-violet-300 dark:border-violet-800">
                    <td colSpan={3} className="px-5 py-3 font-bold text-violet-800 dark:text-violet-300">
                      Total Estimated Tax Liability
                    </td>
                    <td className="text-right px-5 py-3 font-bold text-lg text-violet-700 dark:text-violet-400">
                      {fmt(tax.total_estimated_tax)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Profit/Loss summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" /> Income Statement
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-semibold text-emerald-600">{fmt(tax.annual_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Farm Expenses</span>
                  <span className="font-semibold text-red-600">-{fmt(tax.annual_expenses)}</span>
                </div>
                <div className="border-t border-dashed border-border my-2" />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Gross Profit</span>
                  <span className={`font-bold ${tax.gross_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(tax.gross_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier Costs</span>
                  <span className="font-semibold text-red-600">-{fmt(tax.supplier_costs)}</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Net Profit (Before Tax)</span>
                  <span className={`font-bold text-lg ${tax.net_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(tax.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Less: Estimated Tax</span>
                  <span className="font-semibold text-violet-600">-{fmt(tax.total_estimated_tax)}</span>
                </div>
                <div className="border-t-2 border-border my-2" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Net Profit (After Tax)</span>
                  <span className={`font-bold text-lg ${(tax.net_profit - tax.total_estimated_tax) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(tax.net_profit - tax.total_estimated_tax)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-violet-600" /> Tax Tips
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Agricultural Exemptions</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Raw agricultural produce is VAT-exempt under Schedule 1 of the VAT Act. Only processed goods attract VAT.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Building2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Pioneer Status</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Agro businesses may qualify for tax holiday under S.11 CITA. Apply through NIPC for up to 5 years.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Keep Records</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Maintain proper books of account. All expenses must be supported with receipts for tax deduction claims.</p>
                  </div>
                </div>
                {tax.net_profit > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                    <Calculator className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-violet-800 dark:text-violet-300">Set Aside Tax Funds</p>
                      <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">Consider setting aside <strong>{fmt(tax.total_estimated_tax / 12)}/month</strong> for your annual tax obligations.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AgroPageLayout>
  );
}
