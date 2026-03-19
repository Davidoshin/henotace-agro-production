import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  BarChart3,
  FileText,
  Receipt,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ExportComponent } from "@/components/ExportComponent";

interface RevenueData {
  summary: {
    total_revenue: number;
    project_revenue: number;
    booking_revenue: number;
    other_revenue: number;
    pending_payments: number;
    growth_percentage: number;
  };
  monthly_revenue: {
    month: string;
    revenue: number;
    project_revenue: number;
    booking_revenue: number;
    projects_completed: number;
    bookings_completed: number;
  }[];
  payment_methods: {
    method: string;
    amount: number;
    count: number;
  }[];
  recent_payments: {
    id: number;
    description: string;
    amount: number;
    date: string;
    status: string;
    type: string;
    client_name: string;
  }[];
  top_revenue_services: {
    service_name: string;
    revenue: number;
    count: number;
  }[];
}

export default function ServiceRevenueReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedPayments, setExpandedPayments] = useState(false);

  useEffect(() => {
    loadRevenueData();
  }, [dateRange, startDate, endDate]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      let url = 'business/service-revenue/';
      const params = new URLSearchParams();
      
      if (dateRange !== 'custom') {
        params.append('range', dateRange);
      } else if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiGet(url);
      
      if (response.success) {
        setData(response.data);
      } else {
        // Set default data
        setData({
          summary: {
            total_revenue: 0,
            project_revenue: 0,
            booking_revenue: 0,
            other_revenue: 0,
            pending_payments: 0,
            growth_percentage: 0
          },
          monthly_revenue: [],
          payment_methods: [],
          recent_payments: [],
          top_revenue_services: []
        });
      }
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      setData({
        summary: {
          total_revenue: 0,
          project_revenue: 0,
          booking_revenue: 0,
          other_revenue: 0,
          pending_payments: 0,
          growth_percentage: 0
        },
        monthly_revenue: [],
        payment_methods: [],
        recent_payments: [],
        top_revenue_services: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const growth = data?.summary.growth_percentage || 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue Reports</h1>
            <p className="text-muted-foreground">Track your service business earnings</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Period:</Label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-muted border-border text-foreground rounded-md px-3 py-2"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}
          
          <div className="ml-auto">
            <ExportComponent
              data={data?.monthly_revenue || []}
              columns={[
                { header: "Month", accessor: "month" },
                { header: "Total Revenue", accessor: (row: any) => formatCurrency(row.revenue) },
                { header: "Project Revenue", accessor: (row: any) => formatCurrency(row.project_revenue) },
                { header: "Booking Revenue", accessor: (row: any) => formatCurrency(row.booking_revenue) },
                { header: "Projects Completed", accessor: "projects_completed" },
                { header: "Bookings Completed", accessor: "bookings_completed" }
              ]}
              filename={`revenue-report-${new Date().toISOString().split('T')[0]}`}
              title="Revenue Report"
              variant="outline"
            />
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-emerald-700/50 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-600 dark:text-emerald-300 text-sm">Total Revenue</span>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data?.summary.total_revenue || 0)}</p>
            <div className={`flex items-center gap-1 mt-2 ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm">{Math.abs(growth)}% from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Project Revenue</span>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data?.summary.project_revenue || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Booking Revenue</span>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data?.summary.booking_revenue || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Other Revenue</span>
              <Receipt className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data?.summary.other_revenue || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Pending</span>
              <CreditCard className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data?.summary.pending_payments || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Revenue Trend</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly revenue breakdown by source
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.monthly_revenue && data.monthly_revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="project_revenue" 
                  name="Projects" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="booking_revenue" 
                  name="Bookings" 
                  stackId="1"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No revenue data available yet</p>
                <p className="text-sm">Complete projects and bookings to see revenue trends</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Revenue Services */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Revenue Services</CardTitle>
            <CardDescription className="text-muted-foreground">
              Services generating the most revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.top_revenue_services && data.top_revenue_services.length > 0 ? (
              <div className="space-y-3">
                {data.top_revenue_services.map((service, index) => (
                  <div key={service.service_name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{service.service_name}</p>
                        <p className="text-xs text-muted-foreground">{service.count} completed</p>
                      </div>
                    </div>
                    <p className="text-emerald-500 font-medium">{formatCurrency(service.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No service revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Payment Methods</CardTitle>
            <CardDescription className="text-muted-foreground">
              Revenue by payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.payment_methods && data.payment_methods.length > 0 ? (
              <div className="space-y-3">
                {data.payment_methods.map((method) => {
                  const total = data.payment_methods.reduce((acc, m) => acc + m.amount, 0);
                  const percentage = total > 0 ? (method.amount / total) * 100 : 0;
                  return (
                    <div key={method.method} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize">{method.method.replace('_', ' ')}</span>
                        <span className="text-foreground font-medium">{formatCurrency(method.amount)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{method.count} payments · {percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No payment data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Recent Payments</CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest payment transactions
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpandedPayments(!expandedPayments)}
            className="text-muted-foreground"
          >
            {expandedPayments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expandedPayments ? 'Show Less' : 'Show All'}
          </Button>
        </CardHeader>
        <CardContent>
          {data?.recent_payments && data.recent_payments.length > 0 ? (
            <div className="space-y-2">
              {(expandedPayments ? data.recent_payments : data.recent_payments.slice(0, 5)).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'completed' ? 'bg-emerald-500' :
                      payment.status === 'pending' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-foreground">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">{payment.client_name} · {payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">{formatCurrency(payment.amount)}</p>
                    <Badge 
                      variant="secondary"
                      className={
                        payment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        payment.status === 'pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-red-500/20 text-red-600 dark:text-red-400'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No payments recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
