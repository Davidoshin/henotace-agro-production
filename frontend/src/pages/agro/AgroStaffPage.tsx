import AgroCrudPage from "@/components/agro/AgroCrudPage";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AgroStaffPage() {
  return (
    <AgroCrudPage
      title="Farm Staff"
      description="Manage your farm workers — roles, duties, salaries, and farm assignments."
      endpoint="agro/staff/"
      responseKey="staff"
      itemTitleKey="name"
      editable
      fields={[
        { name: "first_name", label: "First Name", placeholder: "e.g. Emeka", required: true },
        { name: "last_name", label: "Last Name", placeholder: "e.g. Nwankwo" },
        { name: "phone", label: "Phone", placeholder: "+234..." },
        { name: "email", label: "Email", placeholder: "staff@example.com" },
        { name: "role", label: "Role", type: "select", options: [
          { label: "Farm Manager", value: "farm_manager" },
          { label: "Supervisor", value: "supervisor" },
          { label: "Field Worker", value: "field_worker" },
          { label: "Driver", value: "driver" },
          { label: "Security", value: "security" },
          { label: "Accountant", value: "accountant" },
          { label: "Veterinarian", value: "veterinarian" },
          { label: "Agronomist", value: "agronomist" },
          { label: "Store Keeper", value: "store_keeper" },
          { label: "Casual Worker", value: "casual" },
          { label: "Other", value: "other" },
        ]},
        {
          name: "farm_id",
          label: "Assigned Farm",
          type: "async-select",
          asyncEndpoint: "agro/farms/",
          asyncResponseKey: "farms",
          asyncLabelKey: "name",
          asyncValueKey: "id",
        },
        { name: "duties", label: "Duties", type: "textarea", placeholder: "Specific responsibilities..." },
        { name: "salary", label: "Salary (₦)", type: "number", placeholder: "50,000" },
        { name: "salary_period", label: "Salary Period", type: "select", options: [
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
          { label: "Seasonal", value: "seasonal" },
          { label: "Per Task", value: "per_task" },
        ]},
        { name: "hire_date", label: "Hire Date", type: "date" },
        { name: "id_number", label: "ID Number (NIN/BVN)", placeholder: "Optional" },
        { name: "emergency_contact", label: "Emergency Contact", placeholder: "Name — Phone" },
        { name: "address", label: "Address", type: "textarea", placeholder: "Staff address..." },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes..." },
        // ─── Permissions ───
        { name: "can_sell", label: "🛒 Can Record Sales", type: "checkbox" },
        { name: "can_manage_inventory", label: "📦 Can Manage Inventory", type: "checkbox" },
        { name: "can_manage_farms", label: "🌱 Can Manage Farms", type: "checkbox" },
        { name: "can_do_accounting", label: "📊 Can Do Accounting", type: "checkbox" },
        { name: "can_manage_staff", label: "👥 Can Manage Staff", type: "checkbox" },
      ]}
      displayFields={[
        { key: "role", label: "Role" },
        { key: "phone", label: "Phone" },
        { key: "farm_name", label: "Farm" },
        { key: "salary", label: "Salary", format: fmtMoney },
        { key: "salary_period", label: "Period" },
        { key: "hire_date", label: "Hired" },
      ]}
    />
  );
}
