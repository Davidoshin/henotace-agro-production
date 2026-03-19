import AgroCrudPage from "@/components/agro/AgroCrudPage";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AgroCustomersPage() {
  return (
    <AgroCrudPage
      title="Customers"
      description="Manage your farm customers. Track credits and purchases."
      endpoint="agro/customers/"
      responseKey="customers"
      itemTitleKey="name"
      editable
      fields={[
        { name: "first_name", label: "First Name", placeholder: "e.g. Chinedu", required: true },
        { name: "last_name", label: "Last Name", placeholder: "e.g. Okeke" },
        { name: "email", label: "Email", placeholder: "customer@example.com" },
        { name: "phone", label: "Phone", placeholder: "+234..." },
        { name: "address", label: "Address", type: "textarea", placeholder: "Customer address..." },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Any notes about this customer..." },
      ]}
      displayFields={[
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "credit_balance", label: "Credit Balance", format: fmtMoney },
      ]}
    />
  );
}
