import { useMemo, useState } from "react";
import AgroCrudPage from "@/components/agro/AgroCrudPage";
import { apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";

const fmtMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtStock = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "—") : n.toLocaleString("en-NG");
};

export default function AgroProducePage() {
  const { toast } = useToast();
  const [produceItems, setProduceItems] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [restockData, setRestockData] = useState({
    produce_id: "",
    quantity_added: "",
    unit_price: "",
    notes: "",
  });

  const selectedProduce = useMemo(
    () => produceItems.find((item) => String(item.id) === restockData.produce_id),
    [produceItems, restockData.produce_id]
  );

  const handleRestock = async () => {
    if (restocking) return;
    if (!restockData.produce_id || !restockData.quantity_added) {
      toast({
        title: "Restock details missing",
        description: "Select a farm produce and enter the quantity to add.",
        variant: "destructive",
      });
      return;
    }

    setRestocking(true);
    try {
      await apiPost(`agro/produce/${restockData.produce_id}/restock/`, {
        quantity_added: restockData.quantity_added,
        unit_price: restockData.unit_price,
        notes: restockData.notes,
      });
      toast({ title: "Produce restocked", description: "Farm produce stock has been updated." });
      setRestockData({ produce_id: "", quantity_added: "", unit_price: "", notes: "" });
      setRestockOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (error: any) {
      toast({
        title: "Restock failed",
        description: error?.message || "Could not restock this farm produce.",
        variant: "destructive",
      });
    } finally {
      setRestocking(false);
    }
  };

  return (
    <AgroCrudPage
      key={refreshKey}
      title="Farm Produce"
      description="Track harvested farm produce, stock levels, and pricing across your farms."
      endpoint="agro/produce/"
      responseKey="produce"
      itemTitleKey="name"
      editable
      onItemsLoaded={setProduceItems}
      headerActions={
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <RotateCcw className="mr-1 h-4 w-4" /> Restock Farm Produce
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restock Farm Produce</DialogTitle>
              <DialogDescription>Add more stock to an existing farm produce item.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="mobile-restock-produce-item">Farm Produce</Label>
                <select
                  id="mobile-restock-produce-item"
                  value={restockData.produce_id}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, produce_id: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select produce</option>
                  {produceItems.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}{item.farm_name ? ` • ${item.farm_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduce && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Current stock: {fmtStock(selectedProduce.quantity_in_stock)} {selectedProduce.measurement_unit || "unit"}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mobile-restock-produce-qty">Quantity Added</Label>
                <Input
                  id="mobile-restock-produce-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockData.quantity_added}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, quantity_added: e.target.value }))}
                  placeholder="Enter quantity added"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-restock-produce-price">New Unit Price (optional)</Label>
                <Input
                  id="mobile-restock-produce-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockData.unit_price}
                  onChange={(e) => setRestockData((prev) => ({ ...prev, unit_price: e.target.value }))}
                  placeholder="Update current unit price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-restock-produce-notes">Notes</Label>
                <Input
                  id="mobile-restock-produce-notes"
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
                  {restocking ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Restocking...</> : "Restock Farm Produce"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
      fields={[
        { name: "farm_id", label: "Farm", type: "async-select", asyncEndpoint: "agro/farms/", asyncResponseKey: "farms", asyncLabelKey: "name", asyncValueKey: "id", required: true },
        { name: "name", label: "Farm Produce Name", placeholder: "e.g. Maize, Rice, Tomatoes", required: true },
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
        { name: "quantity_in_stock", label: "Initial Stock", type: "number", placeholder: "1,000", required: true },
        { name: "unit_price", label: "Unit Price (₦)", type: "number", placeholder: "45,000" },
        { name: "supplier_name", label: "Supplier Name", placeholder: "e.g. Agro Dealers Ltd" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Storage location, quality notes..." },
      ]}
      displayFields={[
        { key: "farm_name", label: "Farm" },
        { key: "produce_type", label: "Variety" },
        { key: "quantity_in_stock", label: "Stock", format: fmtStock },
        { key: "measurement_unit", label: "Unit" },
        { key: "unit_price", label: "Unit Price", format: fmtMoney },
        { key: "supplier_name", label: "Supplier" },
      ]}
    />
  );
}
