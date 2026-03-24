import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  Package,
  Pencil,
} from "lucide-react";
import AgroPageLayout from "./AgroPageLayout";

/* ═══════════ types ═══════════ */

export interface AgroOption {
  label: string;
  value: string;
}

export interface AgroField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "async-select" | "checkbox";
  placeholder?: string;
  options?: AgroOption[];
  required?: boolean;
  /** For async-select: API endpoint to fetch options from */
  asyncEndpoint?: string;
  /** For async-select: key in the API response containing the array */
  asyncResponseKey?: string;
  /** For async-select: field name for option label (default "name") */
  asyncLabelKey?: string;
  /** For async-select: field name for option value (default "id") */
  asyncValueKey?: string;
  /** When this async-select value is chosen, auto-populate other fields.
   *  Map: { targetFieldName: sourceKeyInRawItem } */
  autoPopulate?: Record<string, string>;
  /** Auto-compute this field value from other form fields (display only) */
  computed?: (formData: Record<string, string>) => string;
  /** Field is read-only (typically for computed fields) */
  readOnly?: boolean;
  /** Only show this field when another field matches one of these values */
  visibleWhen?: { field: string; values: string[] };
  /** If true, this field is not sent in the API payload */
  excludeFromPayload?: boolean;
}

interface AgroCrudPageProps {
  title: string;
  description: string;
  endpoint: string;
  responseKey: string;
  itemTitleKey: string;
  fields: AgroField[];
  displayFields: Array<{
    key: string;
    label: string;
    format?: (val: any) => string;
  }>;
  icon?: React.ReactNode;
  /** If true, show an edit button on each row */
  editable?: boolean;
  /** Transform the payload before sending to the API */
  preparePayload?: (payload: Record<string, string>) => Record<string, string>;
  /** Called after a successful create/edit with the API response */
  onSuccess?: (response: any, isEdit: boolean) => void;
  /** Extra action buttons rendered per row (e.g. receipt) */
  extraActions?: (item: any) => React.ReactNode;
  /** Optional header component rendered above the list */
  headerComponent?: React.ReactNode;
  /** Optional extra actions rendered beside the add button */
  headerActions?: React.ReactNode;
  /** Called whenever items are loaded/refreshed */
  onItemsLoaded?: (items: any[]) => void;
}

/* ═══════════ helpers ═══════════ */

/** Format number input value with commas while typing */
export const formatNumberInput = (raw: string): string => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    return `${intPart}.${parts[1].slice(0, 2)}`;
  }
  return intPart;
};

/** Strip commas from formatted number for API submission */
export const stripCommas = (v: string) => v.replace(/,/g, "");

/* ═══════════ Async-Select sub-component ═══════════ */

function AsyncSelectField({
  field,
  value,
  onChange,
  onItemSelected,
}: {
  field: AgroField;
  value: string;
  onChange: (val: string) => void;
  onItemSelected?: (rawItem: any) => void;
}) {
  const [options, setOptions] = useState<AgroOption[]>([]);
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const labelKey = field.asyncLabelKey || "name";
  const valueKey = field.asyncValueKey || "id";

  useEffect(() => {
    if (!field.asyncEndpoint) return;
    setLoading(true);
    apiGet(field.asyncEndpoint)
      .then((res: any) => {
        const items = res?.[field.asyncResponseKey || "items"] || [];
        setRawItems(items);
        setOptions(
          items.map((item: any) => ({
            label: String(item[labelKey] || ""),
            value: String(item[valueKey] || ""),
          }))
        );
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [field.asyncEndpoint, field.asyncResponseKey, labelKey, valueKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-between"
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
          {loading ? "Loading..." : selectedLabel || `Select ${field.label}`}
        </span>
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-56 overflow-hidden">
          <div className="p-2 border-b border-border">
            <Input
              placeholder={`Search ${field.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {loading ? "Loading..." : "No results found"}
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    if (onItemSelected) {
                      const raw = rawItems.find(
                        (item: any) => String(item[valueKey]) === opt.value
                      );
                      if (raw) onItemSelected(raw);
                    }
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    opt.value === value
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium"
                      : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ Main component ═══════════ */

export default function AgroCrudPage({
  title,
  description,
  endpoint,
  responseKey,
  itemTitleKey,
  fields,
  displayFields,
  icon,
  editable = false,
  preparePayload,
  onSuccess,
  extraActions,
  headerComponent,
  headerActions,
  onItemsLoaded,
}: AgroCrudPageProps) {
  const { toast } = useToast();
  const initialData = useMemo(
    () =>
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [fields]
  );

  const [formData, setFormData] = useState<Record<string, string>>(initialData);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(endpoint);
      const loadedItems = Array.isArray(data?.[responseKey]) ? data[responseKey] : [];
      setItems(loadedItems);
      onItemsLoaded?.(loadedItems);
    } catch (error: any) {
      toast({
        title: "Load failed",
        description: error?.message || `Could not load ${title.toLowerCase()}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [endpoint, onItemsLoaded, responseKey, title, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialData);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const data: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.computed || f.excludeFromPayload) return;
      const raw = item[f.name];
      if (f.type === "checkbox") {
        data[f.name] = raw ? "true" : "false";
      } else if (f.type === "number" && raw != null && raw !== "") {
        data[f.name] = formatNumberInput(String(raw));
      } else {
        data[f.name] = raw != null ? String(raw) : "";
      }
    });
    setFormData(data);
    setDialogOpen(true);
  };

  /* ═══════════ Auto-populate handler ═══════════ */
  const handleAutoPopulate = useCallback(
    (field: AgroField, rawItem: any) => {
      if (!field.autoPopulate || !rawItem) return;
      setFormData((prev) => {
        const next = { ...prev };
        for (const [targetName, sourceKey] of Object.entries(field.autoPopulate!)) {
          const val = rawItem[sourceKey];
          if (val != null) {
            const targetField = fields.find((f) => f.name === targetName);
            if (targetField?.type === "number") {
              next[targetName] = formatNumberInput(String(val));
            } else {
              next[targetName] = String(val);
            }
          }
        }
        return next;
      });
    },
    [fields]
  );

  /* ═══════════ Check field visibility ═══════════ */
  const isFieldVisible = useCallback(
    (field: AgroField): boolean => {
      if (!field.visibleWhen) return true;
      return field.visibleWhen.values.includes(formData[field.visibleWhen.field] || "");
    },
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    let payload: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.computed) return;
      if (!isFieldVisible(f)) return;
      const val = formData[f.name] || "";
      if (f.type === "checkbox") {
        payload[f.name] = val === "true" ? "true" : "false";
      } else {
        payload[f.name] = f.type === "number" ? stripCommas(val) : val;
      }
    });

    if (preparePayload) {
      payload = preparePayload(payload);
    }

    // Strip fields marked excludeFromPayload (after preparePayload had a chance to read them)
    fields.forEach((f) => {
      if (f.excludeFromPayload) delete payload[f.name];
    });

    try {
      let response: any;
      if (editingItem) {
        response = await apiPut(`${endpoint}${editingItem.id}/`, payload);
        toast({ title: "Updated", description: `${title} entry updated successfully.` });
      } else {
        response = await apiPost(endpoint, payload);
        toast({ title: "Saved", description: `${title} entry created successfully.` });
      }
      if (onSuccess) onSuccess(response, !!editingItem);
      setFormData(initialData);
      setEditingItem(null);
      setDialogOpen(false);
      loadItems();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || `Could not save.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiDelete(`${endpoint}${id}/`);
      toast({ title: "Deleted", description: `Record removed.` });
      loadItems();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      Object.values(item).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  /* ═══════════ Render form field ═══════════ */
  const renderField = (field: AgroField) => {
    if (field.computed || field.readOnly) {
      const displayValue = field.computed ? field.computed(formData) : (formData[field.name] || "");
      return (
        <Input
          id={`f-${field.name}`}
          type="text"
          value={displayValue}
          readOnly
          className="bg-gray-100 dark:bg-gray-800 font-semibold cursor-default"
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          id={`f-${field.name}`}
          value={formData[field.name] || ""}
          placeholder={field.placeholder}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
        />
      );
    }

    if (field.type === "async-select") {
      return (
        <AsyncSelectField
          field={field}
          value={formData[field.name] || ""}
          onChange={(val) => setFormData((prev) => ({ ...prev, [field.name]: val }))}
          onItemSelected={(rawItem) => handleAutoPopulate(field, rawItem)}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          id={`f-${field.name}`}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData[field.name] || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((opt) => (
            <option key={`${field.name}-${opt.value}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "date") {
      return (
        <Input
          id={`f-${field.name}`}
          type="date"
          value={formData[field.name] || ""}
          placeholder={field.placeholder}
          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
          className="cursor-pointer"
        />
      );
    }

    if (field.type === "number") {
      return (
        <Input
          id={`f-${field.name}`}
          type="text"
          inputMode="decimal"
          value={formData[field.name] || ""}
          placeholder={field.placeholder}
          onChange={(e) => {
            const formatted = formatNumberInput(e.target.value);
            setFormData((prev) => ({ ...prev, [field.name]: formatted }));
          }}
        />
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData[field.name] === "true"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.name]: e.target.checked ? "true" : "false" }))
            }
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-muted-foreground">Enable</span>
        </label>
      );
    }

    return (
      <Input
        id={`f-${field.name}`}
        type="text"
        value={formData[field.name] || ""}
        placeholder={field.placeholder}
        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
      />
    );
  };

  const visibleFields = fields.filter(isFieldVisible);

  return (
    <AgroPageLayout title={title} description={description}>
      {/* Optional header component (e.g. report section) */}
      {headerComponent}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {headerActions}
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add {title}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? `Edit ${title}` : `New ${title} Entry`}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update the details below." : "Fill in the details below to create a new record."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {visibleFields.map((field) => (
                  <div
                    key={field.name}
                    className={field.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}
                  >
                    <Label htmlFor={`f-${field.name}`}>{field.label}</Label>
                    {renderField(field)}
                  </div>
                ))}
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                    ) : editingItem ? `Update ${title}` : `Save ${title}`}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Count badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          {filteredItems.length} record{filteredItems.length !== 1 ? "s" : ""}
        </Badge>
        {searchQuery && <span className="text-xs text-gray-500">filtered from {items.length} total</span>}
      </div>

      {/* Records */}
      {loading ? (
        <div className="py-12 text-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-border bg-card">
          <Package className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {searchQuery ? "No matching records" : `No ${title.toLowerCase()} yet`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? "Try a different search term." : `Click "Add ${title}" to create your first entry.`}
          </p>
          {!searchQuery && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Add {title}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 md:hidden">
            {filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {String(item[itemTitleKey] || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{item[itemTitleKey] || `Record ${idx + 1}`}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayFields.slice(0, 2).map((f) => f.format ? f.format(item[f.key]) : String(item[f.key] ?? "")).filter(Boolean).join(" • ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {extraActions && extraActions(item)}
                  {editable && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => item.id && handleDelete(item.id)} disabled={deletingId === item.id}>
                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="font-semibold">{title.replace(/s$/, "")}</TableHead>
                    {displayFields.map((f) => <TableHead key={f.key} className="font-semibold">{f.label}</TableHead>)}
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id || idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                      <TableCell className="font-medium">{item[itemTitleKey] || `Record ${idx + 1}`}</TableCell>
                      {displayFields.map((f) => (
                        <TableCell key={`${item.id || idx}-${f.key}`} className="text-sm">
                          {f.format ? f.format(item[f.key]) : String(item[f.key] ?? "—")}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {extraActions && extraActions(item)}
                          {editable && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600" onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => item.id && handleDelete(item.id)} disabled={deletingId === item.id}>
                            {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </AgroPageLayout>
  );
}
