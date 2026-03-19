import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Download,
  BarChart3,
  PieChart,
  Users,
  Briefcase,
  Clock,
  FileText,
  Star,
  CalendarDays,
  Target,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

interface ServiceAnalyticsData {
  overview: {
    total_revenue: number;
    total_projects: number;
    total_bookings: number;
    total_inquiries: number;
    active_clients: number;
    team_members: number;
    average_rating: number;
    completion_rate: number;
  };
  revenue_trend: {
    month: string;
    revenue: number;
    projects: number;
    bookings: number;
  }[];
  service_breakdown: {
    service_name: string;
    revenue: number;
    bookings_count: number;
    inquiries_count: number;
  }[];
  project_status: {
    status: string;
    count: number;
  }[];
  recent_activity: {
    type: string;
    description: string;
    date: string;
    amount?: number;
  }[];
  top_clients: {
    name: string;
    email: string;
    total_spent: number;
    projects_count: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ServiceAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ServiceAnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, startDate, endDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      let url = 'business/service-analytics/';
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
        // Set default empty data
        setData({
          overview: {
            total_revenue: 0,
            total_projects: 0,
            total_bookings: 0,
            total_inquiries: 0,
            active_clients: 0,
            team_members: 0,
            average_rating: 0,
            completion_rate: 0
          },
          revenue_trend: [],
          service_breakdown: [],
          project_status: [],
          recent_activity: [],
          top_clients: []
        });
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      // Set default data on error
      setData({
        overview: {
          total_revenue: 0,
          total_projects: 0,
          total_bookings: 0,
          total_inquiries: 0,
          active_clients: 0,
          team_members: 0,
          average_rating: 0,
          completion_rate: 0
        },
        revenue_trend: [],
        service_breakdown: [],
        project_status: [],
        recent_activity: [],
        top_clients: []
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

  const exportReport = () => {
    if (!data) return;
    
    const csvContent = [
      ['Service Analytics Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Overview'],
      ['Total Revenue', formatCurrency(data.overview.total_revenue)],
      ['Total Projects', data.overview.total_projects],
      ['Total Bookings', data.overview.total_bookings],
      ['Total Inquiries', data.overview.total_inquiries],
      ['Active Clients', data.overview.active_clients],
      ['Completion Rate', `${data.overview.completion_rate}%`],
      [''],
      ['Revenue by Month'],
      ['Month', 'Revenue', 'Projects', 'Bookings'],
      ...data.revenue_trend.map(r => [r.month, r.revenue, r.projects, r.bookings]),
      [''],
      ['Service Breakdown'],
      ['Service', 'Revenue', 'Bookings', 'Inquiries'],
      ...data.service_breakdown.map(s => [s.service_name, s.revenue, s.bookings_count, s.inquiries_count])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Report exported successfully" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-foreground">Service Analytics</h1>
            <p className="text-muted-foreground">Track your service business performance</p>
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
          
          <Button onClick={exportReport} variant="outline" className="gap-2 ml-auto">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(data?.overview.total_revenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.overview.total_projects || 0}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.overview.total_bookings || 0}</p>
                <p className="text-xs text-muted-foreground">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.overview.active_clients || 0}</p>
                <p className="text-xs text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Completion Rate</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{data?.overview.completion_rate || 0}%</p>
            <Progress value={data?.overview.completion_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Average Rating</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{data?.overview.average_rating?.toFixed(1) || '0.0'}</p>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= (data?.overview.average_rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Inquiries</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{data?.overview.total_inquiries || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">New leads this period</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Team Members</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{data?.overview.team_members || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Active team</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs Section */}
      <div className="border border-border rounded-xl p-4 md:p-6 bg-card/30">
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted border-border grid grid-cols-2 md:grid-cols-4 w-full h-auto gap-1 p-1">
            <TabsTrigger value="revenue" className="text-xs md:text-sm py-2">Revenue Trend</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm py-2">Service Breakdown</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs md:text-sm py-2">Project Status</TabsTrigger>
            <TabsTrigger value="clients" className="text-xs md:text-sm py-2">Top Clients</TabsTrigger>
          </TabsList>

        <TabsContent value="revenue">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue Trend</CardTitle>
              <CardDescription className="text-muted-foreground">
                Monthly revenue, projects, and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.revenue_trend && data.revenue_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.revenue_trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                    <Bar dataKey="projects" name="Projects" fill="#3b82f6" />
                    <Bar dataKey="bookings" name="Bookings" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No revenue data available yet</p>
                    <p className="text-sm">Complete some projects to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Service Performance</CardTitle>
              <CardDescription className="text-muted-foreground">
                Revenue and activity by service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                {data?.service_breakdown && data.service_breakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={data.service_breakdown}
                          dataKey="revenue"
                          nameKey="service_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ service_name, percent }) => `${service_name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.service_breakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {data.service_breakdown.map((service, index) => (
                        <div key={service.service_name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground">{service.service_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-foreground font-medium">{formatCurrency(service.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.bookings_count} bookings · {service.inquiries_count} inquiries
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No service data available yet</p>
                      <p className="text-sm">Add services to see breakdown</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Project Status Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">
                Current status of all projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                {data?.project_status && data.project_status.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={data.project_status}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.project_status.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {data.project_status.map((status, index) => (
                        <div key={status.status} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground capitalize">{status.status.replace('_', ' ')}</span>
                          </div>
                          <Badge variant="secondary">{status.count} projects</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No project data available yet</p>
                      <p className="text-sm">Create projects to see status distribution</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Clients</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your highest-value clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.top_clients && data.top_clients.length > 0 ? (
                <div className="space-y-3">
                  {data.top_clients.map((client, index) => (
                    <div key={client.email} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center text-foreground font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground font-medium">{formatCurrency(client.total_spent)}</p>
                        <p className="text-xs text-muted-foreground">{client.projects_count} projects</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No client data available yet</p>
                    <p className="text-sm">Complete projects to see top clients</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest business activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recent_activity && data.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {data.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'project' ? 'bg-blue-500' :
                      activity.type === 'booking' ? 'bg-purple-500' :
                      activity.type === 'inquiry' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <span className="text-muted-foreground">{activity.description}</span>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="text-foreground text-sm">{formatCurrency(activity.amount)}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
