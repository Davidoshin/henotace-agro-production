import AgroCrudPage from "@/components/agro/AgroCrudPage";

export default function AgroFarmsPage() {
  return (
    <AgroCrudPage
      title="Farms"
      description="Register farms, plots, and growing locations for your agro operations."
      endpoint="agro/farms/"
      responseKey="farms"
      itemTitleKey="name"
      fields={[
        { name: "name", label: "Farm Name", placeholder: "e.g. North Field", required: true },
        { name: "location", label: "Location", placeholder: "e.g. Kaduna, Nigeria" },
        { name: "size_value", label: "Size", type: "number", placeholder: "25" },
        { name: "size_unit", label: "Size Unit", type: "select", options: [
          { label: "Acres", value: "acre" },
          { label: "Hectares", value: "hectare" },
          { label: "Plots", value: "plot" },
          { label: "Square Meters", value: "sqm" },
        ]},
        { name: "primary_produce", label: "Primary Produce", placeholder: "e.g. Maize, Cassava" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Soil condition, irrigation notes, seasonal info..." },
      ]}
      displayFields={[
        { key: "location", label: "Location" },
        { key: "size_value", label: "Size" },
        { key: "size_unit", label: "Unit" },
        { key: "primary_produce", label: "Primary Produce" },
      ]}
    />
  );
}
