import { useCallback } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import AgroReportHeader from "@/components/agro/AgroReportHeader";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG")}`;
};

const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AgroExpensesPage() {
  const mapCards = useCallback((r: any) => [
    { label: "Total Expenses", value: String(r.total_count || 0) },
    { label: "Total Amount", value: fmt(r.total_amount || 0), color: "#dc2626" },
    { label: "Categories", value: String((r.by_category || []).length) },
    { label: "Top Category", value: (r.by_category || [])[0]?.category || "—" },
  ], []);

  const mapExportRows = useCallback((r: any) =>
    (r.items || []).map((e: any) => [
      e.title, e.category || "", String(e.amount), e.status || "", e.date || "",
    ]), []);

  return (
    <AgroCrudPage
      title="Expenses"
      description="Record all farm costs — labour, fuel, equipment hire, chemicals, transport, and more."
      endpoint="agro/expenses/"
      responseKey="expenses"
      itemTitleKey="description"
      editable
      headerComponent={
        <AgroReportHeader
          title="Expenses Report"
          subtitle="Track all farm expenditure"
          endpoint="agro/report/expenses/"
          mapCards={mapCards}
          mapExportRows={mapExportRows}
          exportHeaders={["Title", "Category", "Amount", "Status", "Date"]}
          exportFilename="expenses-report"
        />
      }
      fields={[
        { name: "title", label: "Expense Title", placeholder: "e.g. Tractor hire for ploughing", required: true },
        { name: "farm_id", label: "Farm", type: "async-select", asyncEndpoint: "agro/farms/", asyncResponseKey: "farms", asyncLabelKey: "name", asyncValueKey: "id", required: true },
        { name: "produce_id", label: "Produce (Optional)", type: "async-select", asyncEndpoint: "agro/produce/", asyncResponseKey: "produce", asyncLabelKey: "name", asyncValueKey: "id" },
        {
          name: "category_id",
          label: "Category",
          type: "async-select",
          asyncEndpoint: "agro/expense-categories/",
          asyncResponseKey: "categories",
          asyncLabelKey: "name",
          asyncValueKey: "id",
        },
        { name: "supplier_id", label: "Supplier", type: "async-select", asyncEndpoint: "agro/suppliers/", asyncResponseKey: "suppliers", asyncLabelKey: "name", asyncValueKey: "id" },
        { name: "amount", label: "Amount (₦)", type: "number", placeholder: "150,000", required: true },
        { name: "quantity", label: "Quantity", type: "number", placeholder: "1" },
        { name: "unit", label: "Unit", placeholder: "e.g. kg, litre, hour" },
        { name: "asset_type", label: "Asset Type", type: "select", options: [
          { label: "Variable/Consumable", value: "variable" },
          { label: "Fixed Asset", value: "fixed" },
          { label: "Service Expense", value: "service" },
        ]},
        { name: "depreciation_years", label: "Depreciation Years", type: "number", placeholder: "5" },
        { name: "payment_status", label: "Payment Status", type: "select", options: [
          { label: "Paid", value: "paid" },
          { label: "Pending", value: "pending" },
          { label: "Partial", value: "partial" },
        ]},
        { name: "expense_date", label: "Date", type: "date" },
        { name: "vendor_name", label: "Vendor / Payee", placeholder: "Who was paid?" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional details, receipt reference..." },
      ]}
      displayFields={[
        { key: "farm_name", label: "Farm" },
        { key: "produce_name", label: "Produce" },
        { key: "category_name", label: "Category" },
        { key: "supplier_name", label: "Supplier" },
        { key: "amount", label: "Amount", format: fmtMoney },
        { key: "asset_type", label: "Asset Type" },
        { key: "depreciation_years", label: "Depreciation Years" },
        { key: "payment_status", label: "Status" },
        { key: "expense_date", label: "Date" },
      ]}
    />
  );
}
