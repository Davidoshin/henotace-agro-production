import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { Download, Loader2, Printer } from "lucide-react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().split("T")[0];

interface ReportCard {
  label: string;
  value: string;
  color?: string;
}

interface AgroReportHeaderProps {
  /** The report title (e.g. "Sales Report") */
  title: string;
  /** Sub-description shown under the title */
  subtitle: string;
  /** API endpoint to fetch report data from */
  endpoint: string;
  /** Map the raw API report to summary cards */
  mapCards: (report: any) => ReportCard[];
  /** Map the raw API report to CSV/table rows for export */
  mapExportRows: (report: any) => string[][];
  /** CSV column headers for export */
  exportHeaders: string[];
  /** The filename prefix for downloads */
  exportFilename: string;
  /** Whether to show date filters (default true) */
  showDateFilter?: boolean;
}

export default function AgroReportHeader({
  title,
  subtitle,
  endpoint,
  mapCards,
  mapExportRows,
  exportHeaders,
  exportFilename,
  showDateFilter = true,
}: AgroReportHeaderProps) {
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [cards, setCards] = useState<ReportCard[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = showDateFilter ? `?start_date=${startDate}&end_date=${endDate}` : "";
      const res = await apiGet(`${endpoint}${params}`);
      const r = res?.report || {};
      setReport(r);
      setCards(mapCards(r));
    } catch {
      setReport(null);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, startDate, endDate, mapCards, showDateFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ─── Export to CSV ─── */
  const handleExport = () => {
    if (!report) return;
    const rows = mapExportRows(report);
    const csv = [exportHeaders.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Print ─── */
  const handlePrint = () => {
    if (!report) return;
    const rows = mapExportRows(report);
    const tableRows = rows
      .map((r) => `<tr>${r.map((c) => `<td style="padding:4px 8px;border:1px solid #ddd;font-size:12px">${c}</td>`).join("")}</tr>`)
      .join("");
    const cardHtml = cards
      .map((c) => `<div style="flex:1;min-width:140px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="font-size:11px;color:#666;margin:0 0 4px">${c.label}</p><p style="font-size:18px;font-weight:700;margin:0;color:${c.color || '#111'}">${c.value}</p></div>`)
      .join("");

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#1a1a1a}
      h1{font-size:22px;margin:0 0 4px}p.sub{font-size:13px;color:#666;margin:0 0 16px}
      .cards{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:12px;border:1px solid #ddd}
      @media print{body{padding:12px}}</style></head><body>
      <h1>${title}</h1><p class="sub">${subtitle} · ${startDate} to ${endDate}</p>
      <div class="cards">${cardHtml}</div>
      <table><thead><tr>${exportHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Title row with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!report}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mr-2" />
          <span className="text-sm text-muted-foreground">Loading report...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <Card key={i} className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className="text-lg lg:text-xl font-bold" style={{ color: card.color || "inherit" }}>
                {card.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Date filters */}
      {showDateFilter && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-1">📊 Filters</p>
          <p className="text-xs text-muted-foreground mb-3">Filter by date range</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
