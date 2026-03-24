import { useEffect, useMemo, useState } from "react";
import AgroPageLayout from "@/components/agro/AgroPageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  TrendingUp,
} from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const UNIT_OPTIONS = [
  { label: "Kg", value: "kg" },
  { label: "Ton", value: "ton" },
  { label: "Pick-up Load", value: "pickup_load" },
  { label: "Lorry Load", value: "lorry_load" },
  { label: "Trailer Load", value: "trailer_load" },
  { label: "100kg Bag", value: "bag_100kg" },
  { label: "50kg Bag", value: "bag_50kg" },
  { label: "20kg Bag", value: "bag_20kg" },
  { label: "Basket", value: "basket" },
  { label: "Bundle", value: "bundle" },
  { label: "Unit", value: "unit" },
];

const STATUS_OPTIONS = [
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Harvested", value: "harvested" },
  { label: "Cancelled", value: "cancelled" },
];

const defaultForm = {
  farm_id: "",
  produce_name: "",
  planned_date: "",
  estimated_quantity: "",
  measurement_unit: "kg",
  actual_date: "",
  actual_quantity: "",
  status: "planned",
  notes: "",
};

interface FarmOption {
  id: number;
  name: string;
}

interface HarvestSchedule {
  id: number;
  farm_id: number | null;
  farm_name: string | null;
  produce_name: string;
  planned_date: string;
  estimated_quantity: number;
  measurement_unit: string;
  actual_date: string | null;
  actual_quantity: number | null;
  status: string;
  notes: string | null;
}

const fmtQty = (value: number | null | undefined, unit: string) => {
  const qty = Number(value || 0);
  return `${qty.toLocaleString("en-NG", { minimumFractionDigits: qty % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} ${unit}`;
};

const statusClassName = (status: string) => {
  switch (status) {
    case "harvested":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
};

export default function AgroHarvestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<HarvestSchedule[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, farmRes] = await Promise.all([
        apiGet(`agro/harvest-schedules/?year=${selectedYear}`),
        apiGet("agro/farms/"),
      ]);
      setSchedules(scheduleRes?.harvest_schedules || []);
      setFarms((farmRes?.farms || []).map((farm: any) => ({ id: farm.id, name: farm.name })));
    } catch (error: any) {
      setSchedules([]);
      toast({
        title: "Could not load harvest calendar",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const monthBuckets = useMemo(
    () => MONTHS.map((_, index) => schedules.filter((item) => new Date(item.planned_date).getMonth() === index)),
    [schedules],
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const totalPlanned = schedules.length;
  const upcomingCount = schedules.filter((item) => item.status !== "harvested" && item.status !== "cancelled" && item.planned_date >= todayIso).length;
  const harvestedCount = schedules.filter((item) => item.status === "harvested").length;
  const estimatedTotal = schedules.reduce((sum, item) => sum + Number(item.estimated_quantity || 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: HarvestSchedule) => {
    setEditingId(item.id);
    setForm({
      farm_id: item.farm_id ? String(item.farm_id) : "",
      produce_name: item.produce_name || "",
      planned_date: item.planned_date || "",
      estimated_quantity: item.estimated_quantity != null ? String(item.estimated_quantity) : "",
      measurement_unit: item.measurement_unit || "kg",
      actual_date: item.actual_date || "",
      actual_quantity: item.actual_quantity != null ? String(item.actual_quantity) : "",
      status: item.status || "planned",
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const submitForm = async () => {
    if (!form.produce_name.trim() || !form.planned_date) {
      toast({
        title: "Missing details",
        description: "Produce name and planned harvest date are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        farm_id: form.farm_id ? Number(form.farm_id) : null,
        estimated_quantity: form.estimated_quantity || 0,
        actual_quantity: form.actual_quantity || null,
      };

      if (editingId) {
        await apiPut(`agro/harvest-schedules/${editingId}/`, payload);
      } else {
        await apiPost("agro/harvest-schedules/", payload);
      }

      toast({
        title: editingId ? "Harvest schedule updated" : "Harvest schedule added",
        description: "The harvest calendar has been saved successfully.",
      });
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      toast({
        title: "Could not save schedule",
        description: error?.message || "Please review the form and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeSchedule = async (item: HarvestSchedule) => {
    const confirmed = window.confirm(`Delete harvest plan for ${item.produce_name} on ${item.planned_date}?`);
    if (!confirmed) return;

    try {
      await apiDelete(`agro/harvest-schedules/${item.id}/`);
      toast({ title: "Harvest schedule deleted" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Could not delete schedule",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AgroPageLayout
      title="Harvest Calendar"
      description="Plan upcoming harvests across the year and assign each harvest date to a farm."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Annual Harvest Schedule</h2>
            <p className="text-sm text-muted-foreground">Set harvest dates, expected yield, and progress status for each farm.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-border bg-background p-1">
              <Button variant="ghost" size="icon" onClick={() => setSelectedYear((year) => year - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-20 px-3 text-center text-sm font-semibold">{selectedYear}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedYear((year) => year + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Add Harvest Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-emerald-500" /> Scheduled Harvests
            </div>
            <p className="mt-2 text-2xl font-bold">{loading ? "..." : totalPlanned}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sprout className="h-4 w-4 text-amber-500" /> Upcoming
            </div>
            <p className="mt-2 text-2xl font-bold">{loading ? "..." : upcomingCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Leaf className="h-4 w-4 text-blue-500" /> Harvested
            </div>
            <p className="mt-2 text-2xl font-bold">{loading ? "..." : harvestedCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-violet-500" /> Estimated Yield
            </div>
            <p className="mt-2 text-2xl font-bold">{loading ? "..." : estimatedTotal.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</p>
          </Card>
        </div>

        <Card className="p-4 border-dashed">
          <p className="text-sm text-muted-foreground">
            Use this page as the farm calendar. Each entry is tied to a date in {selectedYear}, so the user can now plan upcoming harvest timing across the full year.
          </p>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Loading harvest calendar...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MONTHS.map((month, index) => (
              <Card key={month} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{month}</h3>
                    <p className="text-xs text-muted-foreground">{monthBuckets[index].length} planned harvest{monthBuckets[index].length === 1 ? "" : "s"}</p>
                  </div>
                  <Badge variant="secondary">{monthBuckets[index].length}</Badge>
                </div>
                <div className="space-y-3 p-4 min-h-40">
                  {monthBuckets[index].length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No harvest date has been scheduled for this month.
                    </div>
                  ) : (
                    monthBuckets[index].map((item) => (
                      <div key={item.id} className="rounded-xl border border-border bg-background p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.produce_name}</p>
                            <p className="text-xs text-muted-foreground">{item.farm_name || "No farm selected"}</p>
                          </div>
                          <Badge className={statusClassName(item.status)}>{STATUS_OPTIONS.find((status) => status.value === item.status)?.label || item.status}</Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <p>Date: <span className="font-medium text-foreground">{item.planned_date}</span></p>
                          <p>Estimated: <span className="font-medium text-foreground">{fmtQty(item.estimated_quantity, item.measurement_unit)}</span></p>
                          {item.actual_date ? <p>Actual harvest: <span className="font-medium text-foreground">{item.actual_date}</span></p> : null}
                          {item.notes ? <p className="line-clamp-2">{item.notes}</p> : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removeSchedule(item)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit harvest plan" : "Add harvest plan"}</DialogTitle>
            <DialogDescription>Assign a farm, date, quantity, and status for the harvest schedule.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farm</Label>
              <Select value={form.farm_id || "none"} onValueChange={(value) => setForm((current) => ({ ...current, farm_id: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No farm selected</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={String(farm.id)}>{farm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produce Name</Label>
              <Input value={form.produce_name} onChange={(e) => setForm((current) => ({ ...current, produce_name: e.target.value }))} placeholder="e.g. Maize, Cassava, Tomatoes" />
            </div>

            <div className="space-y-2">
              <Label>Planned Harvest Date</Label>
              <Input type="date" value={form.planned_date} onChange={(e) => setForm((current) => ({ ...current, planned_date: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Quantity</Label>
              <Input type="number" value={form.estimated_quantity} onChange={(e) => setForm((current) => ({ ...current, estimated_quantity: e.target.value }))} placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Measurement Unit</Label>
              <Select value={form.measurement_unit} onValueChange={(value) => setForm((current) => ({ ...current, measurement_unit: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actual Harvest Date</Label>
              <Input type="date" value={form.actual_date} onChange={(e) => setForm((current) => ({ ...current, actual_date: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Actual Quantity</Label>
              <Input type="number" value={form.actual_quantity} onChange={(e) => setForm((current) => ({ ...current, actual_quantity: e.target.value }))} placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Add weather notes, harvesting crew plan, or market timing notes..." rows={4} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={saving}>Cancel</Button>
            <Button onClick={submitForm} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
              {editingId ? "Update Harvest Plan" : "Save Harvest Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgroPageLayout>
  );
}
