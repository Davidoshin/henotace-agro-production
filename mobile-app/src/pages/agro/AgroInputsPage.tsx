import { useCallback } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import AgroReportHeader from "@/components/agro/AgroReportHeader";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG")}`;
};

const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AgroInputsPage() {
  const mapCards = useCallback((r: any) => [
    { label: "Total Items", value: String(r.total_count || 0) },
    { label: "Total Value", value: fmt(r.total_value || 0), color: "#2563eb" },
  ], []);

  const mapExportRows = useCallback((r: any) =>
    (r.items || []).map((i: any) => [
      i.name, i.type || "", String(i.quantity), i.unit, String(i.unit_cost), String(i.total_value),
    ]), []);

  return (
    <AgroCrudPage
      title="Inputs & Equipment"
      description="Track farm inputs — fertilizers, seeds, chemicals, tools, and equipment stock levels."
      endpoint="agro/inputs/"
      responseKey="inputs"
      itemTitleKey="name"
      headerComponent={
        <AgroReportHeader
          title="Inputs Report"
          subtitle="Inventory valuation and stock overview"
          endpoint="agro/report/inputs/"
          mapCards={mapCards}
          mapExportRows={mapExportRows}
          exportHeaders={["Item", "Type", "Quantity", "Unit", "Unit Cost", "Total Value"]}
          exportFilename="inputs-report"
          showDateFilter={false}
        />
      }
      fields={[
        { name: "name", label: "Item Name", placeholder: "e.g. NPK Fertilizer, Sprayer", required: true },
        { name: "item_type", label: "Item Type", type: "select", options: [
          { label: "Fertilizer", value: "fertilizer" },
          { label: "Seed", value: "seed" },
          { label: "Chemical / Pesticide", value: "chemical" },
          { label: "Tool / Equipment", value: "tool" },
          { label: "Feed", value: "feed" },
          { label: "Other", value: "other" },
        ]},
        { name: "unit", label: "Unit", type: "select", options: [
          { label: "Bags", value: "bag" },
          { label: "Litres", value: "litre" },
          { label: "Kilograms", value: "kg" },
          { label: "Pieces", value: "piece" },
          { label: "Cartons", value: "carton" },
          { label: "Bottles", value: "bottle" },
        ]},
        { name: "quantity", label: "Quantity in Stock", type: "number", placeholder: "50" },
        { name: "unit_cost", label: "Unit Cost (₦)", type: "number", placeholder: "3500" },
        { name: "reorder_level", label: "Low Stock Alert Level", type: "number", placeholder: "10" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Where stored, expiry date, usage instructions..." },
      ]}
      displayFields={[
        { key: "item_type", label: "Type" },
        { key: "quantity", label: "Stock" },
        { key: "unit", label: "Unit" },
        { key: "unit_cost", label: "Unit Cost", format: fmtMoney },
        { key: "reorder_level", label: "Alert Level" },
      ]}
    />
  );
}
