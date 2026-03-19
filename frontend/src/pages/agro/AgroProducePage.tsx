import AgroCrudPage from "@/components/agro/AgroCrudPage";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtStock = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : n.toLocaleString("en-NG");
};

export default function AgroProducePage() {
  return (
    <AgroCrudPage
      title="Produce"
      description="Track harvested produce, stock levels, and pricing across your farms."
      endpoint="agro/produce/"
      responseKey="produce"
      itemTitleKey="name"
      editable
      fields={[
        { name: "name", label: "Produce Name", placeholder: "e.g. Maize, Rice, Tomatoes", required: true },
        { name: "produce_type", label: "Variety / Grade", placeholder: "e.g. Grade A, Yellow" },
        { name: "measurement_unit", label: "Measurement Unit", type: "select", options: [
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
        { name: "quantity_in_stock", label: "Current Stock", type: "number", placeholder: "1,000", required: true },
        { name: "unit_price", label: "Unit Price (₦)", type: "number", placeholder: "45,000" },
        { name: "supplier_name", label: "Supplier Name", placeholder: "e.g. Agro Dealers Ltd" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Storage location, quality notes..." },
      ]}
      displayFields={[
        { key: "produce_type", label: "Variety" },
        { key: "quantity_in_stock", label: "Stock", format: fmtStock },
        { key: "measurement_unit", label: "Unit" },
        { key: "unit_price", label: "Unit Price", format: fmtMoney },
        { key: "supplier_name", label: "Supplier" },
      ]}
    />
  );
}
