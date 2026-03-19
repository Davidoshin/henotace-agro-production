import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DelayedLoadingOverlay } from "@/components/ui/LoadingSpinner";
import { 
  ArrowLeft,
  CreditCard,
  Search,
  Eye,
  EyeOff,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Pencil,
  Wallet
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreditOverview {
  total_credit: number;
  total_paid: number;
  total_outstanding: number;
  pending_count: number;
  overdue_count: number;
}

interface CreditRecord {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  amount_paid: number;
  balance: number;
  description: string;
  products?: string | null;
  due_date: string;
  status: string;
  created_at: string;
}

export default function CreditManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [showCreditCustomers, setShowCreditCustomers] = useState(true);
  const [creditSearchName, setCreditSearchName] = useState("");
  const [creditStartDate, setCreditStartDate] = useState("");
  const [creditEndDate, setCreditEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manualCreditForm, setManualCreditForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    products: "",
    amount: "",
    amount_paid: "",
    due_date: "",
  });
  const [savingManualCredit, setSavingManualCredit] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditRecord | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    amount_paid: "",
    due_date: "",
    description: "",
    products: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Load credit data
  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    setIsLoading(true);
    try {
      // Load credit overview (includes credits list)
      const overviewData = await apiGet('business/credits/overview/');
      if (overviewData.success) {
        setCreditOverview(overviewData.overview || overviewData);
        // Credits are included in overview response
        if (overviewData.credits) {
          setCreditRecords(overviewData.credits);
        }
      }
    } catch (error) {
      console.error('Failed to load credit data:', error);
      toast({
        title: "Error",
        description: "Failed to load credit data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter credit records
  const filteredCreditRecords = creditRecords.filter(credit => {
    // Search filter
    const matchesSearch = !creditSearchName || 
      credit.customer_name.toLowerCase().includes(creditSearchName.toLowerCase()) ||
      (credit.customer_email || '').toLowerCase().includes(creditSearchName.toLowerCase()) ||
      (credit.customer_phone || '').toLowerCase().includes(creditSearchName.toLowerCase());
    
    // Date filters
    const creditDate = new Date(credit.created_at);
    const matchesStartDate = !creditStartDate || creditDate >= new Date(creditStartDate);
    const matchesEndDate = !creditEndDate || creditDate <= new Date(creditEndDate);
    
    // Status filter
    const matchesStatus = statusFilter === "all" || credit.status === statusFilter;
    
    return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const downloadCreditRecordsExcel = () => {
    if (filteredCreditRecords.length === 0) {
      toast({ title: "No Data", description: "No credit records to export", variant: "destructive" });
      return;
    }

    const escapeCsv = (value: string | number) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Customer", "Email", "Phone", "Amount", "Paid", "Balance", "Due Date", "Status", "Products", "Description", "Created At"],
      ...filteredCreditRecords.map((credit) => [
        credit.customer_name,
        credit.customer_email || "",
        credit.customer_phone || "",
        credit.amount.toFixed(2),
        credit.amount_paid.toFixed(2),
        credit.balance.toFixed(2),
        new Date(credit.due_date).toLocaleDateString(),
        credit.status,
        credit.products || "",
        credit.description || "",
        new Date(credit.created_at).toLocaleDateString(),
      ]),
    ];

    const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `credit-records-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const downloadCreditRecordsPdf = () => {
    if (filteredCreditRecords.length === 0) {
      toast({ title: "No Data", description: "No credit records to export", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const title = "Credit Records";
    const generatedAt = `Generated: ${new Date().toLocaleString()}`;

    doc.setFontSize(14);
    doc.text(title, 14, 12);
    doc.setFontSize(9);
    doc.text(generatedAt, 14, 18);

    const headers = ["Customer", "Amount", "Paid", "Balance", "Due", "Status", "Created"];
    const colX = [14, 74, 104, 134, 164, 194, 224];
    let y = 26;

    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    doc.setFont("helvetica", "normal");
    y += 5;

    for (const credit of filteredCreditRecords) {
      if (y > 190) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        headers.forEach((h, i) => doc.text(h, colX[i], y));
        doc.setFont("helvetica", "normal");
        y += 5;
      }

      const row = [
        credit.customer_name.length > 24 ? `${credit.customer_name.slice(0, 24)}…` : credit.customer_name,
        formatCurrency(credit.amount),
        formatCurrency(credit.amount_paid),
        formatCurrency(credit.balance),
        new Date(credit.due_date).toLocaleDateString(),
        credit.status.toUpperCase(),
        new Date(credit.created_at).toLocaleDateString(),
      ];

      row.forEach((cell, i) => doc.text(cell, colX[i], y));
      y += 5;
    }

    doc.save(`credit-records-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const stripAmountFormatting = (value: string) => value.replace(/,/g, "").trim();

  const parseAmount = (value: string) => {
    const parsed = Number(stripAmountFormatting(value));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const firstDotIndex = cleaned.indexOf(".");
    const normalized = firstDotIndex === -1
      ? cleaned
      : `${cleaned.slice(0, firstDotIndex + 1)}${cleaned.slice(firstDotIndex + 1).replace(/\./g, "")}`;

    const [integerPart = "", decimalPart] = normalized.split(".");
    const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart.slice(0, 2)}`
      : formattedInteger;
  };

  const formatAmountOnBlur = (value: string) => {
    const raw = stripAmountFormatting(value);
    if (!raw) return "";
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return "";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const remainingBalance = () => {
    const total = parseAmount(manualCreditForm.amount || '0');
    const paid = parseAmount(manualCreditForm.amount_paid || '0');
    if (Number.isNaN(total) || Number.isNaN(paid)) return 0;
    return Math.max(0, total - paid);
  };

  const handleCreateManualCredit = async () => {
    if (!manualCreditForm.customer_name.trim()) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return;
    }
    if (!manualCreditForm.amount || parseAmount(manualCreditForm.amount) <= 0) {
      toast({ title: "Error", description: "Enter a valid credit amount", variant: "destructive" });
      return;
    }

    setSavingManualCredit(true);
    try {
      await apiPost('business/credits/manual/', {
        customer_name: manualCreditForm.customer_name.trim(),
        customer_email: manualCreditForm.customer_email.trim() || undefined,
        customer_phone: manualCreditForm.customer_phone.trim() || undefined,
        products: manualCreditForm.products.trim() || undefined,
        amount: parseAmount(manualCreditForm.amount),
        amount_paid: manualCreditForm.amount_paid ? parseAmount(manualCreditForm.amount_paid) : 0,
        due_date: manualCreditForm.due_date || undefined,
      });
      toast({ title: "Success", description: "Customer credit recorded" });
      setManualCreditForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        products: "",
        amount: "",
        amount_paid: "",
        due_date: "",
      });
      loadCreditData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create credit", variant: "destructive" });
    } finally {
      setSavingManualCredit(false);
    }
  };

  const openEditDialog = (credit: CreditRecord) => {
    setSelectedCredit(credit);
    setEditForm({
      amount: formatAmountOnBlur(credit.amount?.toString() || ""),
      amount_paid: formatAmountOnBlur(credit.amount_paid?.toString() || ""),
      due_date: credit.due_date ? credit.due_date.split('T')[0] : "",
      description: credit.description || "",
      products: credit.products || "",
    });
    setEditDialogOpen(true);
  };

  const openPaymentDialog = (credit: CreditRecord) => {
    setSelectedCredit(credit);
    setPaymentAmount("");
    setPaymentDialogOpen(true);
  };

  const handleUpdateCredit = async () => {
    if (!selectedCredit) return;
    if (!editForm.amount || parseAmount(editForm.amount) <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (editForm.amount_paid && parseAmount(editForm.amount_paid) < 0) {
      toast({ title: "Error", description: "Amount paid cannot be negative", variant: "destructive" });
      return;
    }

    setSavingEdit(true);
    try {
      await apiPost(`business/credits/${selectedCredit.id}/update/`, {
        amount: parseAmount(editForm.amount),
        amount_paid: editForm.amount_paid ? parseAmount(editForm.amount_paid) : 0,
        due_date: editForm.due_date || undefined,
        description: editForm.description || "",
        products: editForm.products || "",
      });
      toast({ title: "Success", description: "Credit updated" });
      setEditDialogOpen(false);
      loadCreditData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update credit", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCredit) return;
    if (!paymentAmount || parseAmount(paymentAmount) <= 0) {
      toast({ title: "Error", description: "Enter a valid payment amount", variant: "destructive" });
      return;
    }

    setSavingPayment(true);
    try {
      await apiPost(`business/credits/${selectedCredit.id}/record-payment/`, {
        amount: parseAmount(paymentAmount),
      });
      toast({ title: "Success", description: "Payment recorded" });
      setPaymentDialogOpen(false);
      loadCreditData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to record payment", variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  if (isLoading) {
    return <DelayedLoadingOverlay isLoading={true} message="Loading credit data..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Credit Management</h1>
            <p className="text-sm text-muted-foreground">Track customer credit purchases and payments</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadCreditData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Credit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: formatAmountInput(e.target.value) })}
                  onBlur={(e) => setEditForm({ ...editForm, amount: formatAmountOnBlur(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editForm.amount_paid}
                  onChange={(e) => setEditForm({ ...editForm, amount_paid: formatAmountInput(e.target.value) })}
                  onBlur={(e) => setEditForm({ ...editForm, amount_paid: formatAmountOnBlur(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Products</label>
                <Textarea
                  value={editForm.products}
                  onChange={(e) => setEditForm({ ...editForm, products: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateCredit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Amount</label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(formatAmountInput(e.target.value))}
                onBlur={(e) => setPaymentAmount(formatAmountOnBlur(e.target.value))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={savingPayment}>
                {savingPayment ? "Saving..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Overview Cards */}
        {creditOverview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Credit Issued</span>
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold">{formatCurrency(creditOverview.total_credit)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Outstanding</span>
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(creditOverview.total_outstanding)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {creditOverview.pending_count} pending, {creditOverview.overdue_count} overdue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(creditOverview.total_paid)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual Credit Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Record Customer Credit</CardTitle>
            <CardDescription>Log credit purchases and track payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name *</label>
                <Input
                  placeholder="Customer name"
                  value={manualCreditForm.customer_name}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, customer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  placeholder="Phone number"
                  value={manualCreditForm.customer_phone}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, customer_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="customer@email.com"
                  value={manualCreditForm.customer_email}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, customer_email: e.target.value })}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-sm font-medium">Products Bought on Credit</label>
                <Textarea
                  placeholder="e.g. Rice 50kg x2, Cooking Oil x1"
                  value={manualCreditForm.products}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, products: e.target.value })}
                  className="min-h-[90px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Credit Amount *</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={manualCreditForm.amount}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, amount: formatAmountInput(e.target.value) })}
                  onBlur={(e) => setManualCreditForm({ ...manualCreditForm, amount: formatAmountOnBlur(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={manualCreditForm.amount_paid}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, amount_paid: formatAmountInput(e.target.value) })}
                  onBlur={(e) => setManualCreditForm({ ...manualCreditForm, amount_paid: formatAmountOnBlur(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remaining Balance</label>
                <Input
                  value={remainingBalance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={manualCreditForm.due_date}
                  onChange={(e) => setManualCreditForm({ ...manualCreditForm, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreateManualCredit} disabled={savingManualCredit}>
                {savingManualCredit ? "Saving..." : "Save Credit"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Credit Records</CardTitle>
                <CardDescription>All customer credit transactions</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCreditRecordsPdf}
                  className="gap-2"
                  aria-label="Download PDF"
                  title="Download PDF"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCreditRecordsExcel}
                  className="gap-2"
                  aria-label="Download Excel"
                  title="Download Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Download Excel</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCreditCustomers(!showCreditCustomers)}
                  className="gap-2"
                >
                  {showCreditCustomers ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Hide Records</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Show Records</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {showCreditCustomers && (
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name/email..."
                      value={creditSearchName}
                      onChange={(e) => setCreditSearchName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={creditStartDate}
                    onChange={(e) => setCreditStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={creditEndDate}
                    onChange={(e) => setCreditEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Credit Records Table */}
              {creditRecords.length > 0 ? (
                <>
                  <div className="border rounded-lg overflow-auto" style={{ maxHeight: '600px' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted sticky top-0 z-10">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Customer</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Amount</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Paid</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Balance</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Due Date</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Status</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Products</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Description</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Created</th>
                            <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCreditRecords.length > 0 ? (
                            filteredCreditRecords.map((credit) => (
                              <tr key={credit.id} className="border-t hover:bg-muted/50">
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium whitespace-nowrap">{credit.customer_name}</p>
                                    <p className="text-xs text-muted-foreground">{credit.customer_email || credit.customer_phone || '-'}</p>
                                  </div>
                                </td>
                                <td className="p-3 whitespace-nowrap font-medium">{formatCurrency(credit.amount)}</td>
                                <td className="p-3 text-green-600 whitespace-nowrap">{formatCurrency(credit.amount_paid)}</td>
                                <td className="p-3 text-red-600 font-bold whitespace-nowrap">{formatCurrency(credit.balance)}</td>
                                <td className="p-3 text-sm whitespace-nowrap">{new Date(credit.due_date).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <Badge variant={
                                    credit.status === 'paid' ? 'default' :
                                    credit.status === 'partial' ? 'secondary' :
                                    credit.status === 'overdue' ? 'destructive' :
                                    'outline'
                                  } className={
                                    credit.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    credit.status === 'partial' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                    credit.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                    'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                  }>
                                    {credit.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm max-w-xs truncate" title={credit.products || ''}>
                                  {credit.products || '-'}
                                </td>
                                <td className="p-3 text-sm max-w-xs truncate" title={credit.description}>
                                  {credit.description || '-'}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                                  {new Date(credit.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(credit)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button size="sm" onClick={() => openPaymentDialog(credit)}>
                                      <Wallet className="h-4 w-4 mr-2" />
                                      Record Payment
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                No credit records found matching your filters
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Showing {filteredCreditRecords.length} of {creditRecords.length} credit records
                  </p>
                </>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Credit Records</h3>
                  <p className="text-muted-foreground">
                    When customers make purchases on credit, they will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
