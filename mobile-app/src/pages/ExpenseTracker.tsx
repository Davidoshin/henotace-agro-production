import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner, { CardGridSkeleton } from "@/components/ui/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Calendar,
  ArrowLeft,
  Download,
  Receipt,
  PieChart,
  Wallet,
  BarChart3,
  Filter,
  Search,
  FileText,
  Home,
  Zap,
  Users,
  Package,
  Truck,
  Megaphone,
  Wrench,
  Settings,
  MoreHorizontal,
  Folder
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { PieChart as RechartsP, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  home: Home,
  zap: Zap,
  users: Users,
  package: Package,
  truck: Truck,
  megaphone: Megaphone,
  wrench: Wrench,
  settings: Settings,
  'file-text': FileText,
  'more-horizontal': MoreHorizontal,
  folder: Folder,
};

interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
  expense_count: number;
  total_amount: number;
}

interface Expense {
  id: number;
  title: string;
  description: string;
  amount: number;
  date: string;
  category_id: number | null;
  category_name: string;
  category_color: string;
  category_icon: string;
  vendor_name: string;
  vendor_phone: string;
  payment_method: string;
  payment_method_display: string;
  reference_number: string;
  receipt: string | null;
  is_recurring: boolean;
  recurring_frequency: string;
  next_due_date: string | null;
  is_tax_deductible: boolean;
  tax_category: string;
  notes: string;
  recorded_by: string;
  created_at: string;
}

interface ExpenseSummary {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  summary: {
    total_expenses: number;
    expense_count: number;
    total_revenue: number;
    net_profit: number;
    profit_margin: number;
    recurring_expenses: number;
    tax_deductible_expenses: number;
    average_expense: number;
  };
  category_breakdown: Array<{
    id: number;
    name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  payment_breakdown: Array<{
    method: string;
    total: number;
    count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    month_name: string;
    total: number;
    count: number;
  }>;
  profit_trend: Array<{
    month: string;
    month_name: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  top_expenses: Array<{
    id: number;
    title: string;
    amount: number;
    date: string;
    category_name: string;
  }>;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'wallet', label: 'Business Wallet' },
  { value: 'other', label: 'Other' },
];

const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function ExpenseTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters
  const [period, setPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Dialogs
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category_id: "",
    vendor_name: "",
    vendor_phone: "",
    payment_method: "cash",
    reference_number: "",
    is_recurring: false,
    recurring_frequency: "",
    is_tax_deductible: false,
    tax_category: "",
    notes: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    icon: "folder",
    color: "#6B7280",
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, summaryRes, expensesRes] = await Promise.all([
        apiGet("/business/expenses/categories/"),
        apiGet(`/business/expenses/summary/?period=${period}`),
        apiGet("/business/expenses/"),
      ]);
      setCategories(categoriesRes);
      setSummary(summaryRes);
      setExpenses(expensesRes.expenses || []);
    } catch (error) {
      console.error("Failed to load expense data:", error);
      toast({
        title: "Error",
        description: "Failed to load expense data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add expense
  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Title and amount are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiPost("/business/expenses/", {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        category_id: newExpense.category_id || null,
      });
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      setShowAddExpense(false);
      resetExpenseForm();
      loadData();
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error",
        description: "Failed to record expense",
        variant: "destructive",
      });
    }
  };

  // Update expense
  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    try {
      await apiPut(`/business/expenses/${editingExpense.id}/`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        category_id: newExpense.category_id || null,
      });
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
      setEditingExpense(null);
      setShowAddExpense(false);
      resetExpenseForm();
      loadData();
    } catch (error) {
      console.error("Failed to update expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await apiDelete(`/business/expenses/${expenseId}/`);
      toast({
        title: "Success",
        description: "Expense deleted",
      });
      loadData();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiPost("/business/expenses/categories/", newCategory);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setShowAddCategory(false);
      setNewCategory({ name: "", description: "", icon: "folder", color: "#6B7280" });
      loadData();
    } catch (error: any) {
      console.error("Failed to add category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  // Reset expense form
  const resetExpenseForm = () => {
    setNewExpense({
      title: "",
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      category_id: "",
      vendor_name: "",
      vendor_phone: "",
      payment_method: "cash",
      reference_number: "",
      is_recurring: false,
      recurring_frequency: "",
      is_tax_deductible: false,
      tax_category: "",
      notes: "",
    });
  };

  // Edit expense
  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      date: expense.date,
      category_id: expense.category_id?.toString() || "",
      vendor_name: expense.vendor_name || "",
      vendor_phone: expense.vendor_phone || "",
      payment_method: expense.payment_method,
      reference_number: expense.reference_number || "",
      is_recurring: expense.is_recurring,
      recurring_frequency: expense.recurring_frequency || "",
      is_tax_deductible: expense.is_tax_deductible,
      tax_category: expense.tax_category || "",
      notes: expense.notes || "",
    });
    setShowAddExpense(true);
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || expense.category_id?.toString() === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  // Get icon component for category
  const getCategoryIcon = (iconName: string) => {
    const IconComponent = categoryIcons[iconName] || Folder;
    return IconComponent;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // PIE Chart colors
  const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#6B7280"];

  if (loading) {
    return <LoadingSpinner message="Loading expense data..." />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Expense Tracker</h1>
            <p className="text-muted-foreground">Track expenses and monitor profitability</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.summary.total_expenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.summary.expense_count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.summary.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">From sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {summary.summary.net_profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.summary.net_profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(summary.summary.net_profit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.summary.profit_margin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Expense</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.summary.average_expense)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary && summary.category_breakdown.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsP>
                        <Pie
                          data={summary.category_breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total"
                        >
                          {summary.category_breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsP>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No expense data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary && summary.profit_trend.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.profit_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month_name" />
                        <YAxis tickFormatter={(value) => `₦${value / 1000}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => label}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
                        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
                        <Bar dataKey="profit" name="Profit" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Expenses & Category List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Expenses</CardTitle>
                <CardDescription>Highest expenses this period</CardDescription>
              </CardHeader>
              <CardContent>
                {summary && summary.top_expenses.length > 0 ? (
                  <div className="space-y-4">
                    {summary.top_expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category_name} • {format(new Date(expense.date), "MMM d")}
                          </p>
                        </div>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No expenses recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Category Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
                <CardDescription>Spending breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                {summary && summary.category_breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {summary.category_breakdown.slice(0, 6).map((cat) => {
                      const IconComp = getCategoryIcon(cat.icon);
                      return (
                        <div key={cat.id} className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            <IconComp className="h-4 w-4" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{cat.name}</span>
                              <span className="text-sm font-semibold">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${cat.percentage}%`,
                                  backgroundColor: cat.color,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No category data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Expenses</CardTitle>
                  <CardDescription>View and manage your expenses</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => {
                        const IconComp = getCategoryIcon(expense.category_icon);
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(expense.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{expense.title}</p>
                                {expense.is_recurring && (
                                  <Badge variant="outline" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="p-1 rounded"
                                  style={{ backgroundColor: `${expense.category_color}20` }}
                                >
                                  <IconComp
                                    className="h-3 w-3"
                                    style={{ color: expense.category_color }}
                                  />
                                </div>
                                <span className="text-sm">{expense.category_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{expense.vendor_name || "-"}</TableCell>
                            <TableCell>{expense.payment_method_display}</TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditExpense(expense)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your business expenses
                  </p>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>Organize your expenses by category</CardDescription>
                </div>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const IconComp = getCategoryIcon(category.icon);
                  return (
                    <Card key={category.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <IconComp className="h-6 w-6" style={{ color: category.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{category.name}</h3>
                              {category.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                            <div className="mt-2 flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {category.expense_count} expenses
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(category.total_amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={(open) => {
        setShowAddExpense(open);
        if (!open) {
          setEditingExpense(null);
          resetExpenseForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense details" : "Record a new business expense"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Electricity Bill"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExpense.category_id}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor/Payee</Label>
                <Input
                  id="vendor_name"
                  placeholder="Who was paid"
                  value={newExpense.vendor_name}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={newExpense.payment_method}
                  onValueChange={(value) => setNewExpense({ ...newExpense, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details..."
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={newExpense.is_recurring}
                  onCheckedChange={(checked) =>
                    setNewExpense({ ...newExpense, is_recurring: checked })
                  }
                />
                <Label htmlFor="is_recurring">Recurring Expense</Label>
              </div>
              {newExpense.is_recurring && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newExpense.recurring_frequency}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, recurring_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRING_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_tax_deductible"
                checked={newExpense.is_tax_deductible}
                onCheckedChange={(checked) =>
                  setNewExpense({ ...newExpense, is_tax_deductible: checked })
                }
              />
              <Label htmlFor="is_tax_deductible">Tax Deductible</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExpense(false)}>
              Cancel
            </Button>
            <Button onClick={editingExpense ? handleUpdateExpense : handleAddExpense}>
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new expense category</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat_name">Name *</Label>
              <Input
                id="cat_name"
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat_desc">Description</Label>
              <Input
                id="cat_desc"
                placeholder="What this category is for"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="h-10 w-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
