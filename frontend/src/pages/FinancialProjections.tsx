import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Wallet,
  LineChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  Calculator,
  ChevronRight,
  Settings,
  Calendar,
  Target,
  HelpCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  month_date: string;
  income: number;
  expenses: number;
  profit?: number;
  net_cash_flow?: number;
  cumulative_cash?: number;
}

interface Projection {
  month: string;
  month_date: string;
  projected_income?: number;
  projected_expenses?: number;
  projected_profit?: number;
  net_cash_flow?: number;
  cumulative_cash?: number;
  low_estimate?: number;
  high_estimate?: number;
  cash_status?: string;
  confidence?: number;
}

interface TrendAnalysis {
  monthly_growth?: number;
  monthly_change?: number;
  annual_growth_rate?: number;
  annual_change_rate?: number;
  average_monthly_income?: number;
  average_monthly_expense?: number;
  average_monthly_profit?: number;
  average_profit_margin?: number;
  r_squared: number;
  trend_direction: "up" | "down" | "stable";
}

interface CategoryBreakdown {
  category: string;
  color: string;
  total: number;
  count: number;
}

interface DashboardData {
  current_month: {
    income: number;
    expenses: number;
    profit: number;
    income_trend: number;
    expense_trend: number;
  };
  projections: Projection[];
  historical_months: number;
  has_sufficient_data: boolean;
}

interface ScenarioParams {
  income_change_percent: number;
  expense_change_percent: number;
  one_time_income: number;
  one_time_expense: number;
  one_time_month: number;
  months: number;
}

const formatCurrency = (value: number, currency = "NGN") => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

export default function FinancialProjections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [projectionMonths, setProjectionMonths] = useState(6);
  
  // Data states
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [incomeData, setIncomeData] = useState<{ historical_data: MonthlyData[]; projections: Projection[]; trend_analysis: TrendAnalysis } | null>(null);
  const [expenseData, setExpenseData] = useState<{ historical_data: MonthlyData[]; projections: Projection[]; trend_analysis: TrendAnalysis; category_breakdown: CategoryBreakdown[] } | null>(null);
  const [cashFlowData, setCashFlowData] = useState<{ cash_flow_history: MonthlyData[]; projections: Projection[]; current_cash_position: number; summary: any } | null>(null);
  const [profitData, setProfitData] = useState<{ historical_data: MonthlyData[]; projections: Projection[]; trend_analysis: TrendAnalysis } | null>(null);
  
  // Scenario dialog
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    income_change_percent: 0,
    expense_change_percent: 0,
    one_time_income: 0,
    one_time_expense: 0,
    one_time_month: 1,
    months: 6,
  });
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [runningScenario, setRunningScenario] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "income") fetchIncome();
    if (activeTab === "expenses") fetchExpenses();
    if (activeTab === "cash-flow") fetchCashFlow();
    if (activeTab === "profit") fetchProfit();
  }, [activeTab, projectionMonths]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiGet("business/financial-projections/");
      setDashboard(response);
    } catch (error: any) {
      console.error("Error fetching dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load projections",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    try {
      const response = await apiGet(`business/financial-projections/income/?months=${projectionMonths}`);
      setIncomeData(response);
    } catch (error: any) {
      console.error("Error fetching income projections:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await apiGet(`business/financial-projections/expenses/?months=${projectionMonths}`);
      setExpenseData(response);
    } catch (error: any) {
      console.error("Error fetching expense projections:", error);
    }
  };

  const fetchCashFlow = async () => {
    try {
      const response = await apiGet(`business/financial-projections/cash-flow/?months=${projectionMonths}`);
      setCashFlowData(response);
    } catch (error: any) {
      console.error("Error fetching cash flow projections:", error);
    }
  };

  const fetchProfit = async () => {
    try {
      const response = await apiGet(`business/financial-projections/profit/?months=${projectionMonths}`);
      setProfitData(response);
    } catch (error: any) {
      console.error("Error fetching profit projections:", error);
    }
  };

  const runScenario = async () => {
    try {
      setRunningScenario(true);
      const response = await apiPost("business/financial-projections/scenario/", scenarioParams);
      setScenarioResult(response);
      toast({
        title: "Scenario Calculated",
        description: "Your what-if scenario has been calculated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to calculate scenario",
      });
    } finally {
      setRunningScenario(false);
    }
  };

  const TrendIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    
    return (
      <div className="flex items-center gap-1">
        {isNeutral ? (
          <span className="text-gray-500 text-sm">{label}</span>
        ) : isPositive ? (
          <>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-green-600 text-sm font-medium">{formatPercent(value)}</span>
          </>
        ) : (
          <>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
            <span className="text-red-600 text-sm font-medium">{formatPercent(value)}</span>
          </>
        )}
      </div>
    );
  };

  const ConfidenceBadge = ({ value }: { value: number }) => {
    const getColor = () => {
      if (value >= 70) return "bg-green-100 text-green-700";
      if (value >= 40) return "bg-yellow-100 text-yellow-700";
      return "bg-red-100 text-red-700";
    };
    
    return (
      <Badge className={cn("text-xs", getColor())}>
        {value.toFixed(0)}% confidence
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Financial Projections
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Forecast your income, expenses, and cash flow
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Select 
                value={projectionMonths.toString()} 
                onValueChange={(v) => setProjectionMonths(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowScenarioDialog(true)} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                What-If
              </Button>
              <Button onClick={fetchDashboard} variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Mobile controls - second line */}
          <div className="flex sm:hidden items-center gap-2 mt-3">
            <Select 
              value={projectionMonths.toString()} 
              onValueChange={(v) => setProjectionMonths(parseInt(v))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowScenarioDialog(true)} variant="outline" className="flex-1">
              <Calculator className="h-4 w-4 mr-2" />
              What-If
            </Button>
            <Button onClick={fetchDashboard} variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Data Availability Notice */}
        {dashboard && !dashboard.has_sufficient_data && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Limited Data Available</h3>
                <p className="text-sm text-yellow-700">
                  Only {dashboard.historical_months} month(s) of data available. For more accurate projections, 
                  at least 3 months of historical data is recommended.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Month Summary */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Month Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboard.current_month.income)}
                      </p>
                    </div>
                  </div>
                  <TrendIndicator value={dashboard.current_month.income_trend} label="vs last month" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Month Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboard.current_month.expenses)}
                      </p>
                    </div>
                  </div>
                  <TrendIndicator value={dashboard.current_month.expense_trend} label="vs last month" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      dashboard.current_month.profit >= 0 ? "bg-blue-100" : "bg-orange-100"
                    )}>
                      <Wallet className={cn(
                        "h-5 w-5",
                        dashboard.current_month.profit >= 0 ? "text-blue-600" : "text-orange-600"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Month Profit</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        dashboard.current_month.profit >= 0 ? "text-blue-600" : "text-orange-600"
                      )}>
                        {formatCurrency(dashboard.current_month.profit)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projections Preview */}
        {dashboard && dashboard.projections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Next 3 Months Forecast
              </CardTitle>
              <CardDescription>
                Quick preview of upcoming financial projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboard.projections.map((proj, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{proj.month}</span>
                      {proj.confidence && <ConfidenceBadge value={proj.confidence} />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Income</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(proj.projected_income || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expenses</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(proj.projected_expenses || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="font-medium">Profit</span>
                        <span className={cn(
                          "font-bold",
                          (proj.projected_profit || 0) >= 0 ? "text-blue-600" : "text-orange-600"
                        )}>
                          {formatCurrency(proj.projected_profit || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("income")}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Income Projections
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View projected income trends and forecasts based on historical data.
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("expenses")}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Expense Projections
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Forecast upcoming expenses and view category breakdowns.
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("cash-flow")}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      Cash Flow
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See your projected cash position and runway over time.
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowScenarioDialog(true)}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-purple-500" />
                      What-If Scenarios
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Test different assumptions and see how they impact your finances.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            {incomeData ? (
              <>
                {/* Trend Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Income Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Avg Monthly</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(incomeData.trend_analysis.average_monthly_income || 0)}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Monthly Growth</p>
                        <p className={cn(
                          "text-xl font-bold",
                          (incomeData.trend_analysis.monthly_growth || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(incomeData.trend_analysis.monthly_growth || 0)}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Annual Growth Rate</p>
                        <p className={cn(
                          "text-xl font-bold",
                          (incomeData.trend_analysis.annual_growth_rate || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercent(incomeData.trend_analysis.annual_growth_rate || 0)}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Trend Direction</p>
                        <p className="text-xl font-bold capitalize">
                          {incomeData.trend_analysis.trend_direction}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Projections Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Income Projections</CardTitle>
                    <CardDescription>
                      Projected income for the next {projectionMonths} months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {incomeData.projections.map((proj, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="font-medium">{proj.month}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Low</p>
                              <p className="text-sm">{formatCurrency(proj.low_estimate || 0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Projected</p>
                              <p className="font-bold text-green-600">
                                {formatCurrency(proj.projected_income || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">High</p>
                              <p className="text-sm">{formatCurrency(proj.high_estimate || 0)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            {expenseData ? (
              <>
                {/* Category Breakdown */}
                {expenseData.category_breakdown && expenseData.category_breakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Expense Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {expenseData.category_breakdown.map((cat, index) => {
                          const total = expenseData.category_breakdown.reduce((sum, c) => sum + c.total, 0);
                          const percent = total > 0 ? (cat.total / total) * 100 : 0;
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <span className="font-medium">{cat.category}</span>
                                </div>
                                <span className="font-bold">{formatCurrency(cat.total)}</span>
                              </div>
                              <Progress value={percent} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Expense Projections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expense Projections</CardTitle>
                    <CardDescription>
                      Projected expenses for the next {projectionMonths} months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expenseData.projections.map((proj, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="font-medium">{proj.month}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Low</p>
                              <p className="text-sm">{formatCurrency(proj.low_estimate || 0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Projected</p>
                              <p className="font-bold text-red-600">
                                {formatCurrency(proj.projected_expenses || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">High</p>
                              <p className="text-sm">{formatCurrency(proj.high_estimate || 0)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="cash-flow" className="space-y-4">
            {cashFlowData ? (
              <>
                {/* Cash Position Card */}
                <Card className={cn(
                  "border-2",
                  cashFlowData.current_cash_position >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center",
                        cashFlowData.current_cash_position >= 0 ? "bg-green-200" : "bg-red-200"
                      )}>
                        <PiggyBank className={cn(
                          "h-7 w-7",
                          cashFlowData.current_cash_position >= 0 ? "text-green-700" : "text-red-700"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Cash Position</p>
                        <p className={cn(
                          "text-3xl font-bold",
                          cashFlowData.current_cash_position >= 0 ? "text-green-700" : "text-red-700"
                        )}>
                          {formatCurrency(cashFlowData.current_cash_position)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cash Flow Projections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cash Flow Projections</CardTitle>
                    <CardDescription>
                      Projected net cash flow and cumulative position
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cashFlowData.projections.map((proj, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <span className="font-medium">{proj.month}</span>
                            {proj.cash_status === "negative" && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Cash Warning
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Inflow</p>
                              <p className="text-sm text-green-600">
                                +{formatCurrency(proj.projected_income || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Outflow</p>
                              <p className="text-sm text-red-600">
                                -{formatCurrency(proj.projected_expenses || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Net</p>
                              <p className={cn(
                                "font-medium",
                                (proj.net_cash_flow || 0) >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(proj.net_cash_flow || 0)}
                              </p>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-sm text-muted-foreground">Cumulative</p>
                              <p className={cn(
                                "font-bold",
                                (proj.cumulative_cash || 0) >= 0 ? "text-blue-600" : "text-orange-600"
                              )}>
                                {formatCurrency(proj.cumulative_cash || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* What-If Scenario Dialog */}
      <Dialog open={showScenarioDialog} onOpenChange={setShowScenarioDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              What-If Scenario Analysis
            </DialogTitle>
            <DialogDescription>
              Adjust assumptions to see how they impact your financial projections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Income Change */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Income Change</Label>
                <span className="text-sm font-medium">
                  {formatPercent(scenarioParams.income_change_percent)}
                </span>
              </div>
              <Slider
                value={[scenarioParams.income_change_percent]}
                onValueChange={([v]) => setScenarioParams(prev => ({ ...prev, income_change_percent: v }))}
                min={-50}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Adjust expected monthly income change
              </p>
            </div>

            {/* Expense Change */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Expense Change</Label>
                <span className="text-sm font-medium">
                  {formatPercent(scenarioParams.expense_change_percent)}
                </span>
              </div>
              <Slider
                value={[scenarioParams.expense_change_percent]}
                onValueChange={([v]) => setScenarioParams(prev => ({ ...prev, expense_change_percent: v }))}
                min={-50}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Adjust expected monthly expense change
              </p>
            </div>

            {/* One-time items */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>One-time Income</Label>
                <Input
                  type="number"
                  value={scenarioParams.one_time_income}
                  onChange={(e) => setScenarioParams(prev => ({ 
                    ...prev, 
                    one_time_income: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>One-time Expense</Label>
                <Input
                  type="number"
                  value={scenarioParams.one_time_expense}
                  onChange={(e) => setScenarioParams(prev => ({ 
                    ...prev, 
                    one_time_expense: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Apply One-time in Month</Label>
                <Select
                  value={scenarioParams.one_time_month.toString()}
                  onValueChange={(v) => setScenarioParams(prev => ({ ...prev, one_time_month: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(m => (
                      <SelectItem key={m} value={m.toString()}>Month {m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projection Months</Label>
                <Select
                  value={scenarioParams.months.toString()}
                  onValueChange={(v) => setScenarioParams(prev => ({ ...prev, months: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scenario Results */}
            {scenarioResult && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Scenario Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Income</p>
                      <p className="font-bold text-green-600">
                        {formatCurrency(scenarioResult.summary.total_projected_income)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                      <p className="font-bold text-red-600">
                        {formatCurrency(scenarioResult.summary.total_projected_expenses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final Position</p>
                      <p className={cn(
                        "font-bold",
                        scenarioResult.summary.final_cumulative_position >= 0 ? "text-blue-600" : "text-orange-600"
                      )}>
                        {formatCurrency(scenarioResult.summary.final_cumulative_position)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground">Impact on Net Flow:</p>
                    <p className={cn(
                      "font-medium",
                      scenarioResult.scenario.impact_on_net_flow >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(scenarioResult.scenario.impact_on_net_flow)} per month
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScenarioDialog(false)}>
              Close
            </Button>
            <Button onClick={runScenario} disabled={runningScenario}>
              {runningScenario ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Run Scenario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
