import { useCallback, useState } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import AgroReceiptModal, { ReceiptButton } from "@/components/agro/AgroReceiptModal";
import AgroReportHeader from "@/components/agro/AgroReportHeader";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AgroSalesPage() {
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const mapCards = useCallback((r: any) => [
    { label: "Total Sales", value: String(r.total_sales || 0) },
    { label: "Total Revenue", value: fmt(r.total_revenue || 0), color: "#16a34a" },
    { label: "Items Sold", value: String(r.items_sold || 0) },
    { label: "Est. Profit", value: fmt(r.est_profit || 0), color: "#16a34a" },
  ], []);

  const mapExportRows = useCallback((r: any) =>
    (r.sales || []).map((s: any) => [
      s.buyer_name, s.produce_name || "", String(s.quantity), s.unit,
      String(s.unit_price), String(s.total_amount), String(s.amount_paid),
      s.payment_method, s.payment_status, s.sale_date || "",
    ]), []);

  return (
    <>
      <AgroCrudPage
        title="Agri Sales"
        description="Record produce sales, track buyer payments, and let stock reduce automatically."
        endpoint="agro/sales/"
        responseKey="sales"
        itemTitleKey="buyer_name"
        editable
        headerComponent={
          <AgroReportHeader
            title="Sales Report"
            subtitle="Product-level breakdown"
            endpoint="agro/sales/report/"
            mapCards={mapCards}
            mapExportRows={mapExportRows}
            exportHeaders={["Buyer", "Produce", "Qty", "Unit", "Unit Price", "Total", "Paid", "Method", "Status", "Date"]}
            exportFilename="sales-report"
          />
        }
        onSuccess={(response, isEdit) => {
          if (!isEdit && response?.sale?.id) {
            setReceiptSaleId(response.sale.id);
            setShowSuccess(true);
            setReceiptOpen(true);
          }
        }}
        extraActions={(item) => (
          <ReceiptButton onClick={() => {
            setReceiptSaleId(item.id);
            setShowSuccess(false);
            setReceiptOpen(true);
          }} />
        )}
      preparePayload={(payload) => {
        // Remove display-only total_price
        delete payload.total_price;
        // Auto-compute amount_paid based on payment method
        const qty = Number((payload.quantity || "0").replace(/,/g, ""));
        const price = Number((payload.unit_price || "0").replace(/,/g, ""));
        const total = qty * price;
        if (payload.payment_method === "credit") {
          payload.amount_paid = "0";
          // Link credit_customer as customer_id
          if (payload.credit_customer) {
            payload.customer_id = payload.credit_customer;
          }
        } else {
          payload.amount_paid = String(total);
        }
        delete payload.credit_customer;
        return payload;
      }}
      fields={[
        { name: "buyer_name", label: "Buyer Name", placeholder: "e.g. Fresh Foods Hub", required: true },
        { name: "buyer_phone", label: "Buyer Phone", placeholder: "+234..." },
        {
          name: "produce_id",
          label: "Produce",
          type: "async-select",
          asyncEndpoint: "agro/produce/",
          asyncResponseKey: "produce",
          asyncLabelKey: "name",
          asyncValueKey: "id",
          autoPopulate: { unit: "measurement_unit", unit_price: "unit_price" },
        },
        {
          name: "farm_id",
          label: "Farm",
          type: "async-select",
          asyncEndpoint: "agro/farms/",
          asyncResponseKey: "farms",
          asyncLabelKey: "name",
          asyncValueKey: "id",
        },
        { name: "quantity", label: "Quantity Sold", type: "number", placeholder: "30", required: true },
        { name: "unit", label: "Unit", type: "select", options: [
          { label: "Kilograms (kg)", value: "kg" },
          { label: "Ton", value: "ton" },
          { label: "100kg Bag", value: "bag_100kg" },
          { label: "50kg Bag", value: "bag_50kg" },
          { label: "20kg Bag", value: "bag_20kg" },
          { label: "Basket", value: "basket" },
          { label: "Bundle", value: "bundle" },
          { label: "Pick-up Load", value: "pickup_load" },
          { label: "Lorry Load", value: "lorry_load" },
          { label: "Trailer Load", value: "trailer_load" },
          { label: "Unit", value: "unit" },
        ]},
        { name: "unit_price", label: "Unit Price (₦)", type: "number", placeholder: "45,000", required: true },
        {
          name: "total_price",
          label: "Total Price (₦)",
          type: "number",
          readOnly: true,
          excludeFromPayload: true,
          computed: (data: Record<string, string>) => {
            const qty = Number((data.quantity || "0").replace(/,/g, ""));
            const price = Number((data.unit_price || "0").replace(/,/g, ""));
            const total = qty * price;
            if (!total) return "";
            const parts = total.toFixed(2).split(".");
            const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return `${intPart}.${parts[1]}`;
          },
        },
        { name: "payment_method", label: "Payment Method", type: "select", options: [
          { label: "Cash", value: "cash" },
          { label: "Bank Transfer", value: "bank_transfer" },
          { label: "Mobile Money", value: "mobile" },
          { label: "Credit / On Account", value: "credit" },
          { label: "POS", value: "pos" },
        ]},
        {
          name: "credit_customer",
          label: "Credit Customer",
          type: "async-select",
          asyncEndpoint: "agro/buyers/",
          asyncResponseKey: "buyers",
          asyncLabelKey: "name",
          asyncValueKey: "id",
          visibleWhen: { field: "payment_method", values: ["credit"] },
          autoPopulate: { buyer_name: "name", buyer_phone: "phone" },
          excludeFromPayload: true,
        },
        { name: "transport_mode", label: "Transport Mode", type: "select", options: [
          { label: "Buyer Pickup", value: "buyer_pickup" },
          { label: "Truck Delivery", value: "truck" },
          { label: "Van / Pickup", value: "van" },
          { label: "Motorcycle", value: "motorcycle" },
          { label: "Other", value: "other" },
        ]},
        { name: "sale_date", label: "Sale Date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Delivery terms, payment balance, destination..." },
      ]}
      displayFields={[
        { key: "produce_name", label: "Produce" },
        { key: "farm_name", label: "Farm" },
        { key: "quantity", label: "Qty" },
        { key: "unit", label: "Unit" },
        { key: "total_amount", label: "Total", format: fmtMoney },
        { key: "amount_paid", label: "Paid", format: fmtMoney },
        { key: "payment_method", label: "Method", format: (v: any) => {
          const map: Record<string, string> = { cash: "Cash", bank_transfer: "Transfer", mobile: "Mobile", credit: "Credit", pos: "POS" };
          return map[v] || String(v || "—");
        }},
        { key: "payment_status", label: "Status", format: (v: any) => {
          const map: Record<string, string> = { paid: "✅ Paid", partial: "⏳ Partial", pending: "⏳ Pending", credit: "🔴 Credit" };
          return map[v] || String(v || "—");
        }},
        { key: "customer_name", label: "Customer" },
      ]}
    />
    <AgroReceiptModal
      saleId={receiptSaleId}
      open={receiptOpen}
      onClose={() => { setReceiptOpen(false); setReceiptSaleId(null); }}
      showSuccess={showSuccess}
    />
    </>
  );
}
