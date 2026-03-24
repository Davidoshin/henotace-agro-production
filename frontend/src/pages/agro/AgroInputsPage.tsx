import { useCallback, useMemo, useState } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import AgroReportHeader from "@/components/agro/AgroReportHeader";
import { apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG")}`;
};

const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AgroInputsPage() {
  const { toast } = useToast();
  const [inputItems, setInputItems] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [restockData, setRestockData] = useState({
    input_id: "",
    quantity_added: "",
    service_cost: "",
    notes: "",
  });

  const selectedInput = useMemo(
    () => inputItems.find((item) => String(item.id) === restockData.input_id),
    [inputItems, restockData.input_id]
  );

  const mapCards = useCallback((r: any) => [
    { label: "Total Items", value: String(r.total_count || 0) },
    { label: "Total Value", value: fmt(r.total_value || 0), color: "#2563eb" },
  ], []);

  const mapExportRows = useCallback((r: any) =>
    (r.items || []).map((i: any) => [
      i.name, i.type || "", String(i.quantity), i.unit, String(i.unit_cost), String(i.total_value),
    ]), []);

  const handleRestock = async () => {
    if (restocking) return;
    if (!restockData.input_id || !restockData.quantity_added) {
      toast({
        title: "Restock details missing",
        description: "Select a farm resource and enter the quantity to add.",
        variant: "destructive",
      });
      return;
    }

    setRestocking(true);
    try {
      await apiPost(`agro/inputs/${restockData.input_id}/restock/`, {
        quantity_added: restockData.quantity_added,
        service_cost: restockData.service_cost,
        notes: restockData.notes,
      });
      toast({ title: "Resources restocked", description: "Farm resource stock has been updated." });
      setRestockData({ input_id: "", quantity_added: "", service_cost: "", notes: "" });
      setRestockOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (error: any) {
      toast({
        title: "Restock failed",
        description: error?.message || "Could not restock this farm resource.",
        variant: "destructive",
      });
    } finally {
      setRestocking(false);
    }
  };

  return (
    <AgroCrudPage
      key={refreshKey}
      title="Farm Resources"
      description="Track farm resources — equipment, chemicals, tools, and supplies stock levels."
      endpoint="agro/inputs/"
      responseKey="inputs"
      itemTitleKey="name"
      onItemsLoaded={setInputItems}
      headerActions={
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <RotateCcw className="mr-1 h-4 w-4" /> Restock Farm Resources
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restock Farm Resources</DialogTitle>
              <DialogDescription>Add more stock to an existing farm resource item.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="restock-input-item">Farm Resource</Label>
                <select
                  id="restock-input-item"
                  value={restockData.input_id}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, input_id: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select resource</option>
                  {inputItems.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}{item.farm_name ? ` • ${item.farm_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInput && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Current stock: {selectedInput.quantity ?? selectedInput.quantity_in_stock ?? "0"} {selectedInput.unit || "unit"}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="restock-input-qty">Quantity Added</Label>
                <Input
                  id="restock-input-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockData.quantity_added}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, quantity_added: e.target.value }))}
                  placeholder="Enter quantity added"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restock-input-cost">New Unit Cost (optional)</Label>
                <Input
                  id="restock-input-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockData.service_cost}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, service_cost: e.target.value }))}
                  placeholder="Update unit cost"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restock-input-notes">Notes</Label>
                <Input
                  id="restock-input-notes"
                  value={restockData.notes}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional restock note"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRestockOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleRestock} disabled={restocking} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {restocking ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Restocking...</> : "Restock Farm Resources"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
      headerComponent={
        <AgroReportHeader
          title="Farm Resources Report"
          subtitle="Resource valuation and inventory overview"
          endpoint="agro/report/inputs/"
          mapCards={mapCards}
          mapExportRows={mapExportRows}
          exportHeaders={["Item", "Type", "Quantity", "Unit", "Unit Cost", "Total Value"]}
          exportFilename="farm-resources-report"
          showDateFilter={false}
        />
      }
      fields={[
        { name: "farm_id", label: "Farm", type: "async-select", asyncEndpoint: "agro/farms/", asyncResponseKey: "farms", asyncLabelKey: "name", asyncValueKey: "id", required: true },
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
        { name: "quantity_in_stock", label: "Initial Stock", type: "number", placeholder: "50" },
        { name: "service_cost", label: "Unit Cost (₦)", type: "number", placeholder: "3500" },
        { name: "reorder_level", label: "Low Stock Alert Level", type: "number", placeholder: "10" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Where stored, expiry date, usage instructions..." },
      ]}
      displayFields={[
        { key: "farm_name", label: "Farm" },
        { key: "item_type", label: "Type" },
        { key: "quantity", label: "Stock" },
        { key: "unit", label: "Unit" },
        { key: "unit_cost", label: "Unit Cost", format: fmtMoney },
        { key: "reorder_level", label: "Alert Level" },
      ]}
    />
  );
}
