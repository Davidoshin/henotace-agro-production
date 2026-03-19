import { useCallback } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import AgroReportHeader from "@/components/agro/AgroReportHeader";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AgroSuppliersPage() {
  const mapCards = useCallback((r: any) => [
    { label: "Total Suppliers", value: String(r.total_count || 0) },
    { label: "Total Committed", value: fmt(r.total_amount || 0), color: "#2563eb" },
    { label: "Total Paid", value: fmt(r.total_paid || 0), color: "#16a34a" },
    { label: "Outstanding", value: fmt(r.total_outstanding || 0), color: "#dc2626" },
  ], []);

  const mapExportRows = useCallback((r: any) =>
    (r.items || []).map((s: any) => [
      s.name, s.type || "", String(s.total_amount), String(s.amount_paid), String(s.amount_owed),
    ]), []);

  return (
    <AgroCrudPage
      title="Suppliers"
      description="Manage your seed, equipment, chemical, and services suppliers."
      endpoint="agro/suppliers/"
      responseKey="suppliers"
      itemTitleKey="name"
      editable
      headerComponent={
        <AgroReportHeader
          title="Suppliers Report"
          subtitle="Overview of supplier commitments and payments"
          endpoint="agro/report/suppliers/"
          mapCards={mapCards}
          mapExportRows={mapExportRows}
          exportHeaders={["Supplier", "Type", "Total Amount", "Amount Paid", "Amount Owed"]}
          exportFilename="suppliers-report"
          showDateFilter={false}
        />
      }
      fields={[
        { name: "name", label: "Supplier Name", placeholder: "e.g. Agro Dealers Ltd", required: true },
        { name: "supplier_type", label: "Supplier Type", type: "select", options: [
          { label: "Seed Supplier", value: "seed" },
          { label: "Fertilizer / Chemical", value: "chemical" },
          { label: "Equipment / Tools", value: "equipment" },
          { label: "Feed Supplier", value: "feed" },
          { label: "Transport / Logistics", value: "transport" },
          { label: "Labour / Services", value: "labour" },
          { label: "General", value: "general" },
        ]},
        { name: "contact_person", label: "Contact Person", placeholder: "Full name" },
        { name: "phone", label: "Phone Number", placeholder: "+234..." },
        { name: "email", label: "Email", placeholder: "supplier@example.com" },
        { name: "address", label: "Address", placeholder: "Location / Address" },
        { name: "total_amount", label: "Total Owed (₦)", type: "number", placeholder: "500,000" },
        { name: "amount_paid", label: "Amount Paid (₦)", type: "number", placeholder: "200,000" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Payment terms, specialties, delivery schedule..." },
      ]}
      displayFields={[
        { key: "supplier_type", label: "Type" },
        { key: "phone", label: "Phone" },
        { key: "total_amount", label: "Total (₦)", format: fmtMoney },
        { key: "amount_paid", label: "Paid (₦)", format: fmtMoney },
        { key: "amount_owed", label: "Owed (₦)", format: fmtMoney },
      ]}
    />
  );
}
