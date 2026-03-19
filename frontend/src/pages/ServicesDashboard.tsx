import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Wrench, 
  Users, 
  Star, 
  MessageSquare,
  Calendar,
  TrendingUp,
  ExternalLink,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Briefcase,
  DollarSign,
  Eye,
  Plus,
  Edit,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Package
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Service {
  id: number;
  name: string;
  description?: string;
  price: string;
  duration?: string;
  is_active: boolean;
  category?: string;
  bookings_count?: number;
}

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  image?: string;
  is_active: boolean;
}

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_services: number;
  active_services: number;
  total_team_members: number;
  total_inquiries: number;
  pending_inquiries: number;
  total_bookings: number;
  page_views: number;
}

export default function ServicesDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  
  const [stats, setStats] = useState<DashboardStats>({
    total_services: 0,
    active_services: 0,
    total_team_members: 0,
    total_inquiries: 0,
    pending_inquiries: 0,
    total_bookings: 0,
    page_views: 0
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch business settings to check if service website is enabled
      const settingsResponse = await apiGet('business/update/');
      if (settingsResponse.success && settingsResponse.business) {
        setBusinessSlug(settingsResponse.business.slug);
        setServiceEnabled(settingsResponse.business.service_based_enabled || false);
      }
      
      // Fetch services dashboard data
      const dashboardResponse = await apiGet('business/services-dashboard/');
      if (dashboardResponse.success) {
        if (dashboardResponse.stats) {
          setStats(dashboardResponse.stats);
        }
        if (dashboardResponse.services) {
          setServices(dashboardResponse.services);
        }
        if (dashboardResponse.team_members) {
          setTeamMembers(dashboardResponse.team_members);
        }
        if (dashboardResponse.inquiries) {
          setInquiries(dashboardResponse.inquiries);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load services dashboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'responded':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" /> Responded</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-primary" />
                  Services Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Manage your service website and inquiries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {businessSlug && serviceEnabled && (
                <Button variant="outline" onClick={() => window.open(`/services/${businessSlug}`, '_blank')}>
                  <Globe className="w-4 h-4 mr-2" />
                  View Website
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
              <Button onClick={() => navigate('/service-settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Service Website Status */}
        {!serviceEnabled && (
          <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Service Website Not Enabled</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Enable your service website to start accepting inquiries and showcase your services.</p>
                </div>
              </div>
              <Button onClick={() => navigate('/business/settings?tab=business-type')}>
                Enable Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Services</p>
                  <p className="text-2xl font-bold">{stats.total_services}</p>
                  <p className="text-xs text-muted-foreground">{stats.active_services} active</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{stats.total_team_members}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold">{stats.total_inquiries}</p>
                  <p className="text-xs text-yellow-600">{stats.pending_inquiries} pending</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold">{stats.page_views}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Eye className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/business/professional-services')}>
            <Wrench className="w-5 h-5 mb-2" />
            <span>Manage Services</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/shipping-management')}>
            <Truck className="w-5 h-5 mb-2" />
            <span>Shipping</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/service-settings')}>
            <Settings className="w-5 h-5 mb-2" />
            <span>Website Settings</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/service-settings')}>
            <Settings className="w-5 h-5 mb-2" />
            <span>Website Settings</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/business/client-messages')}>
            <MessageSquare className="w-5 h-5 mb-2" />
            <span>Client Messages</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('inquiries')}>
            <MessageSquare className="w-5 h-5 mb-2" />
            <span>View Inquiries</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/business/staff')}>
            <Users className="w-5 h-5 mb-2" />
            <span>Manage Team</span>
          </Button>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="inquiries">
              Inquiries
              {stats.pending_inquiries > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{stats.pending_inquiries}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Services */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Your Services</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/business/professional-services')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-8">
                      <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No services added yet</p>
                      <Button size="sm" className="mt-3" onClick={() => navigate('/business/professional-services')}>
                        <Plus className="w-4 h-4 mr-1" /> Add Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.slice(0, 5).map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.price}</p>
                          </div>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Inquiries */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Recent Inquiries</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('inquiries')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {inquiries.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No inquiries yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Inquiries from your service website will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.slice(0, 5).map((inquiry) => (
                        <div key={inquiry.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{inquiry.name}</p>
                            {getStatusBadge(inquiry.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{inquiry.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Website Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Service Website Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${serviceEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-sm text-muted-foreground">{serviceEnabled ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">URL</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {businessSlug ? `/services/${businessSlug}` : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Activity className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Today's Views</p>
                      <p className="text-sm text-muted-foreground">{stats.page_views}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Services</CardTitle>
                  <CardDescription>Manage the services displayed on your website</CardDescription>
                </div>
                <Button onClick={() => navigate('/business/professional-services')}>
                  <Plus className="w-4 h-4 mr-2" /> Add Service
                </Button>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Services Yet</h3>
                    <p className="text-muted-foreground mb-4">Add services to showcase them on your public website</p>
                    <Button onClick={() => navigate('/business/professional-services')}>
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Service
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.category || '-'}</TableCell>
                          <TableCell>{service.price}</TableCell>
                          <TableCell>{service.duration || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/business/professional-services')}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Service Inquiries</CardTitle>
                  <CardDescription>Inquiries submitted through your service website</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Inquiries Yet</h3>
                    <p className="text-muted-foreground">When customers submit inquiries through your service website, they'll appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell className="font-medium">{inquiry.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {inquiry.email}
                              </p>
                              {inquiry.phone && (
                                <p className="text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {inquiry.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{inquiry.service || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{inquiry.message}</TableCell>
                          <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                          <TableCell>{new Date(inquiry.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
