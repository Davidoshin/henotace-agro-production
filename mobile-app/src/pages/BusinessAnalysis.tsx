import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Calendar,
  ArrowLeft,
  Download,
  BarChart3,
  PieChart,
  AlertCircle,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  month_name: string;
  revenue: number;
  cost: number;
  profit: number;
  profit_margin: number;
  sales_count: number;
  credit_issued: number;
  credit_collected: number;
  credit_outstanding: number;
  credit_count: number;
}

interface DailyData {
  date: string;
  day_name: string;
  revenue: number;
  cost: number;
  profit: number;
  sales_count: number;
  items_sold: number;
}

interface DailyRevenue {
  date_range: {
    start: string;
    end: string;
    branch_id?: string;
  };
  summary: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    total_sales: number;
    total_items: number;
    average_daily_revenue: number;
    days_with_sales: number;
  };
  daily_breakdown: DailyData[];
}

interface Analytics {
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
    total_sales: number;
    business_status: string;
    status_message: string;
  };
  credit_summary: {
    total_credit_issued: number;
    total_collected: number;
    total_outstanding: number;
    pending_count: number;
    overdue_count: number;
  };
  monthly_breakdown: MonthlyData[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_main_branch: boolean;
}

export default function BusinessAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [canViewReports, setCanViewReports] = useState<boolean | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyStartDate, setDailyStartDate] = useState("");
  const [dailyEndDate, setDailyEndDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeChart, setActiveChart] = useState<'profit' | 'trend' | 'credit'>('profit');
  const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');

  const loadBranches = async () => {
    try {
      console.log('=== BRANCHES DEBUG ===');
      console.log('Loading branches...');
      const data = await apiGet('business/branches/');
      console.log('Branches Response:', data);
      if (data.success && data.branches) {
        setBranches(data.branches);
        console.log('Branches loaded:', data.branches.length);
      }
      console.log('=== END BRANCHES DEBUG ===');
    } catch (e: any) {
      console.error("=== BRANCHES ERROR ===");
      console.error("Failed to load branches:", e);
      console.error("Error message:", e.message);
      console.error("Error response:", e.response);
      console.error("=== END BRANCHES ERROR ===");
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          const allowed = !!data?.staff?.can_view_reports;
          setCanViewReports(allowed);
          if (!allowed) {
            toast({ title: "Access denied", description: "You don't have permission to view reports", variant: "destructive" });
            navigate('/business-staff-dashboard');
          }
        })
        .catch(() => {
          setCanViewReports(false);
          toast({ title: "Access denied", description: "You don't have permission to view reports", variant: "destructive" });
          navigate('/business-staff-dashboard');
        });
    } else {
      setCanViewReports(true);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (!canViewReports) return;
    console.log('=== BUSINESS ANALYSIS COMPONENT MOUNTED ===');
    // Set default date range (last 12 months for monthly, last 30 days for daily)
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    
    const dailyEnd = new Date();
    const dailyStart = new Date();
    dailyStart.setDate(dailyStart.getDate() - 30);
    
    console.log('Date ranges calculated:');
    console.log('Monthly: ', start.toISOString().split('T')[0], ' to ', end.toISOString().split('T')[0]);
    console.log('Daily: ', dailyStart.toISOString().split('T')[0], ' to ', dailyEnd.toISOString().split('T')[0]);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setDailyEndDate(dailyEnd.toISOString().split('T')[0]);
    setDailyStartDate(dailyStart.toISOString().split('T')[0]);
    
    loadBranches();
    loadAnalytics(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    loadDailyRevenue(dailyStart.toISOString().split('T')[0], dailyEnd.toISOString().split('T')[0]);
  }, [canViewReports]);

  const loadAnalytics = async (start?: string, end?: string, branchId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      if (branchId && branchId !== 'all') params.append('branch_id', branchId);
      
      const url = `business/analytics/?${params.toString()}`;
      console.log('=== ANALYTICS DEBUG ===');
      console.log('Request URL:', url);
      console.log('Start Date:', start);
      console.log('End Date:', end);
      console.log('Branch ID:', branchId);
      
      const data = await apiGet(url);
      console.log('Analytics Response:', data);
      console.log('Analytics Data:', data?.analytics);
      console.log('Analytics Summary:', data?.analytics?.summary);
      console.log('Total Revenue:', data?.analytics?.summary?.total_revenue);
      console.log('Total Cost:', data?.analytics?.summary?.total_cost);
      console.log('Total Profit:', data?.analytics?.summary?.total_profit);
      console.log('Monthly Breakdown:', data?.analytics?.monthly_breakdown);
      if (data?.analytics?.monthly_breakdown) {
        data.analytics.monthly_breakdown.forEach((m: any, i: number) => {
          console.log(`Month ${i}: ${m.month_name} - Revenue: ${m.revenue}, Sales: ${m.sales_count}`);
        });
      }
      console.log('=== END ANALYTICS DEBUG ===');
      
      setAnalytics(data.analytics);
    } catch (error: any) {
      console.error('=== ANALYTICS ERROR ===');
      console.error('Error Object:', error);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response);
      console.error('Error Status:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      console.error('=== END ANALYTICS ERROR ===');
      
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyRevenue = async (start?: string, end?: string, branchId?: string) => {
    try {
      setDailyLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      if (branchId && branchId !== 'all') params.append('branch_id', branchId);
      
      const url = `business/analytics/daily/?${params.toString()}`;
      console.log('=== DAILY REVENUE DEBUG ===');
      console.log('Request URL:', url);
      console.log('Start Date:', start);
      console.log('End Date:', end);
      console.log('Branch ID:', branchId);
      
      const data = await apiGet(url);
      console.log('Daily Revenue Response:', data);
      console.log('Daily Revenue Data:', data?.daily_revenue);
      console.log('=== END DAILY REVENUE DEBUG ===');
      
      setDailyRevenue(data.daily_revenue);
    } catch (error: any) {
      console.error('=== DAILY REVENUE ERROR ===');
      console.error('Error Object:', error);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response);
      console.error('Error Status:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      console.error('=== END DAILY REVENUE ERROR ===');
      
      toast({
        title: "Error",
        description: error.message || "Failed to load daily revenue",
        variant: "destructive"
      });
    } finally {
      setDailyLoading(false);
    }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }
    loadAnalytics(startDate, endDate, selectedBranch);
  };

  const handleDailyFilter = () => {
    if (!dailyStartDate || !dailyEndDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }
    loadDailyRevenue(dailyStartDate, dailyEndDate, selectedBranch);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'profitable': return 'text-green-600 bg-green-50';
      case 'moderately_profitable': return 'text-blue-600 bg-blue-50';
      case 'break_even': return 'text-yellow-600 bg-yellow-50';
      case 'losing': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'profitable':
      case 'moderately_profitable':
        return <TrendingUp className="h-8 w-8" />;
      case 'losing':
        return <TrendingDown className="h-8 w-8" />;
      default:
        return <AlertCircle className="h-8 w-8" />;
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Business Analysis</h1>
            <p className="text-muted-foreground">Comprehensive profit and performance metrics</p>
          </div>
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          <TabsTrigger value="daily">Daily Revenue</TabsTrigger>
        </TabsList>

        {/* Monthly Analysis Tab */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {branches.length > 1 && (
                  <div className="flex-1 min-w-[150px]">
                    <Label className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                  Branch
                </Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name} {b.is_main_branch && '(Main)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleFilter} disabled={loading}>
              {loading ? "Loading..." : "Apply Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Business Status */}
          <Card className={getStatusColor(analytics.summary.business_status)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {getStatusIcon(analytics.summary.business_status)}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold capitalize">
                    {analytics.summary.business_status.replace('_', ' ')}
                  </h3>
                  <p className="text-sm">{analytics.summary.status_message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{analytics.summary.total_revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{analytics.summary.total_sales} sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{analytics.summary.total_cost.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{analytics.summary.total_profit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.profit_margin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credit Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{analytics.credit_summary.total_outstanding.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.credit_summary.overdue_count} overdue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Tabbed to reduce rendering load */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Charts</CardTitle>
              <CardDescription>Select a chart to view detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profit">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Profit Analysis
                  </TabsTrigger>
                  <TabsTrigger value="trend">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Profit Trend
                  </TabsTrigger>
                  <TabsTrigger value="credit">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit Analysis
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profit" className="mt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analytics.monthly_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                      <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="trend" className="mt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analytics.monthly_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                      <Line type="monotone" dataKey="profit_margin" stroke="#10b981" strokeWidth={2} name="Profit Margin %" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="credit" className="mt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analytics.monthly_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="credit_issued" fill="#f59e0b" name="Credit Issued" />
                      <Bar dataKey="credit_collected" fill="#10b981" name="Collected" />
                      <Bar dataKey="credit_outstanding" fill="#ef4444" name="Outstanding" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Detailed month-by-month analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Cost</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Margin %</th>
                      <th className="text-right p-2">Sales</th>
                      <th className="text-right p-2">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthly_breakdown.map((month) => (
                      <tr key={month.month} className="border-b hover:bg-muted/50">
                        <td className="p-2">{month.month_name}</td>
                        <td className="text-right p-2">₦{month.revenue.toLocaleString()}</td>
                        <td className="text-right p-2">₦{month.cost.toLocaleString()}</td>
                        <td className={`text-right p-2 font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₦{month.profit.toLocaleString()}
                        </td>
                        <td className="text-right p-2">{month.profit_margin.toFixed(1)}%</td>
                        <td className="text-right p-2">{month.sales_count}</td>
                        <td className="text-right p-2">₦{month.credit_outstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
        </TabsContent>

        {/* Daily Revenue Tab */}
        <TabsContent value="daily" className="space-y-6">
          {/* Daily Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Revenue Filter
              </CardTitle>
              <CardDescription>View revenue breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dailyStartDate}
                    onChange={(e) => setDailyStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dailyEndDate}
                    onChange={(e) => setDailyEndDate(e.target.value)}
                  />
                </div>
                {branches.length > 1 && (
                  <div className="flex-1 min-w-[150px]">
                    <Label className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Branch
                    </Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name} {b.is_main_branch && '(Main)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleDailyFilter} disabled={dailyLoading}>
                  {dailyLoading ? "Loading..." : "Apply Filter"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {dailyLoading && (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading daily revenue...</p>
              </div>
            </div>
          )}

          {dailyRevenue && !dailyLoading && (
            <>
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{dailyRevenue.summary.total_revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{dailyRevenue.summary.total_sales} sales</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{dailyRevenue.summary.total_cost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{dailyRevenue.summary.total_items} items sold</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${dailyRevenue.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{dailyRevenue.summary.total_profit.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Daily Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{dailyRevenue.summary.average_daily_revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{dailyRevenue.summary.days_with_sales} days with sales</p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue Trend</CardTitle>
                  <CardDescription>Revenue breakdown by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[...dailyRevenue.daily_breakdown].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day_name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Breakdown</CardTitle>
                  <CardDescription>Detailed day-by-day revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Day</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">Cost</th>
                          <th className="text-right p-2">Profit</th>
                          <th className="text-right p-2">Sales</th>
                          <th className="text-right p-2">Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRevenue.daily_breakdown.map((day) => (
                          <tr key={day.date} className="border-b hover:bg-muted/50">
                            <td className="p-2">{day.day_name}</td>
                            <td className="text-right p-2">₦{day.revenue.toLocaleString()}</td>
                            <td className="text-right p-2">₦{day.cost.toLocaleString()}</td>
                            <td className={`text-right p-2 font-semibold ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₦{day.profit.toLocaleString()}
                            </td>
                            <td className="text-right p-2">{day.sales_count}</td>
                            <td className="text-right p-2">{day.items_sold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
