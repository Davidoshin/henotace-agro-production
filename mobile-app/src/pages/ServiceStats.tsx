import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  Calendar,
  Users,
  FileText,
  Target,
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';
import { ExportComponent } from "@/components/ExportComponent";

interface ServiceStatsData {
  services_overview: {
    total_services: number;
    active_services: number;
    featured_services: number;
    average_price: number;
    total_bookings: number;
    total_inquiries: number;
  };
  service_performance: {
    service_id: number;
    service_name: string;
    bookings_count: number;
    inquiries_count: number;
    revenue: number;
    average_rating: number;
    completion_rate: number;
    is_featured: boolean;
  }[];
  booking_stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  inquiry_stats: {
    total: number;
    pending: number;
    responded: number;
    converted: number;
    conversion_rate: number;
  };
  time_metrics: {
    average_response_time: string;
    average_completion_time: string;
    busiest_day: string;
    busiest_hour: string;
  };
  category_breakdown: {
    category_name: string;
    services_count: number;
    bookings_count: number;
    revenue: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ServiceStats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ServiceStatsData | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadStats();
  }, [dateRange, startDate, endDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      let url = 'business/service-stats/';
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
          services_overview: {
            total_services: 0,
            active_services: 0,
            featured_services: 0,
            average_price: 0,
            total_bookings: 0,
            total_inquiries: 0
          },
          service_performance: [],
          booking_stats: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
          inquiry_stats: { total: 0, pending: 0, responded: 0, converted: 0, conversion_rate: 0 },
          time_metrics: { average_response_time: 'N/A', average_completion_time: 'N/A', busiest_day: 'N/A', busiest_hour: 'N/A' },
          category_breakdown: []
        });
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setData({
        services_overview: {
          total_services: 0,
          active_services: 0,
          featured_services: 0,
          average_price: 0,
          total_bookings: 0,
          total_inquiries: 0
        },
        service_performance: [],
        booking_stats: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
        inquiry_stats: { total: 0, pending: 0, responded: 0, converted: 0, conversion_rate: 0 },
        time_metrics: { average_response_time: 'N/A', average_completion_time: 'N/A', busiest_day: 'N/A', busiest_hour: 'N/A' },
        category_breakdown: []
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

  const bookingData = data?.booking_stats ? [
    { name: 'Pending', value: data.booking_stats.pending, color: '#f59e0b' },
    { name: 'Confirmed', value: data.booking_stats.confirmed, color: '#3b82f6' },
    { name: 'Completed', value: data.booking_stats.completed, color: '#10b981' },
    { name: 'Cancelled', value: data.booking_stats.cancelled, color: '#ef4444' }
  ] : [];

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
            <h1 className="text-2xl font-bold text-foreground">Service Statistics</h1>
            <p className="text-muted-foreground">Detailed service performance metrics</p>
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
              data={data?.service_performance || []}
              columns={[
                { header: "Service", accessor: "service_name" },
                { header: "Bookings", accessor: "bookings_count" },
                { header: "Inquiries", accessor: "inquiries_count" },
                { header: "Revenue", accessor: (row: any) => formatCurrency(row.revenue) },
                { header: "Rating", accessor: "average_rating" },
                { header: "Completion Rate", accessor: (row: any) => `${row.completion_rate}%` }
              ]}
              filename={`service-stats-${new Date().toISOString().split('T')[0]}`}
              title="Service Statistics"
              variant="outline"
            />
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-xs">Services</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{data?.services_overview.total_services || 0}</p>
            <p className="text-xs text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data?.services_overview.active_services || 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data?.services_overview.featured_services || 0}</p>
            <p className="text-xs text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data?.services_overview.average_price || 0)}</p>
            <p className="text-xs text-muted-foreground">Avg. Price</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data?.services_overview.total_bookings || 0}</p>
            <p className="text-xs text-muted-foreground">Bookings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data?.services_overview.total_inquiries || 0}</p>
            <p className="text-xs text-muted-foreground">Inquiries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Booking Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Booking Status</CardTitle>
            <CardDescription className="text-muted-foreground">
              Distribution of booking statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.booking_stats && data.booking_stats.total > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={bookingData.filter(d => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {bookingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex flex-col justify-center">
                  {bookingData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground text-sm">{item.name}</span>
                      </div>
                      <span className="text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No booking data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiry Conversion */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Inquiry Conversion</CardTitle>
            <CardDescription className="text-muted-foreground">
              How inquiries convert to bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.inquiry_stats ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-foreground">{data.inquiry_stats.conversion_rate}%</p>
                  <p className="text-muted-foreground">Conversion Rate</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Total Inquiries</span>
                    <span className="text-foreground font-medium">{data.inquiry_stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Pending Response</span>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {data.inquiry_stats.pending}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Responded</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      {data.inquiry_stats.responded}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Converted to Booking</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      {data.inquiry_stats.converted}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No inquiry data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Metrics */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Time Metrics</CardTitle>
          <CardDescription className="text-muted-foreground">
            Response and completion times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <Clock className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-muted-foreground text-sm">Avg. Response Time</p>
              <p className="text-xl font-bold text-foreground">{data?.time_metrics.average_response_time || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <Target className="h-6 w-6 text-emerald-500 mb-2" />
              <p className="text-muted-foreground text-sm">Avg. Completion Time</p>
              <p className="text-xl font-bold text-foreground">{data?.time_metrics.average_completion_time || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <Calendar className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-muted-foreground text-sm">Busiest Day</p>
              <p className="text-xl font-bold text-foreground">{data?.time_metrics.busiest_day || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <Activity className="h-6 w-6 text-amber-500 mb-2" />
              <p className="text-muted-foreground text-sm">Peak Hour</p>
              <p className="text-xl font-bold text-foreground">{data?.time_metrics.busiest_hour || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Performance Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Service Performance</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed metrics for each service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.service_performance && data.service_performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Service</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Bookings</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Inquiries</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Revenue</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Rating</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.service_performance.map((service) => (
                    <tr key={service.service_id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{service.service_name}</span>
                          {service.is_featured && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-muted-foreground">{service.bookings_count}</td>
                      <td className="text-center py-3 px-4 text-muted-foreground">{service.inquiries_count}</td>
                      <td className="text-right py-3 px-4 text-emerald-500">{formatCurrency(service.revenue)}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-foreground">{service.average_rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={service.completion_rate} className="w-16 h-2" />
                          <span className="text-muted-foreground text-sm">{service.completion_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No service performance data</p>
              <p className="text-sm">Add services and get bookings to see metrics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
