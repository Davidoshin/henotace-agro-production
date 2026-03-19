import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  Wrench,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmailVerificationGate, checkEmailVerification } from "@/components/account/EmailVerificationGate";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  is_active: boolean;
  bookings_count: number;
  total_revenue: number;
  created_at: string;
}

interface ServiceStats {
  total_services: number;
  active_services: number;
  total_bookings: number;
  total_revenue: number;
}

export default function ServicesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    total_services: 0,
    active_services: 0,
    total_bookings: 0,
    total_revenue: 0
  });
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [showEmailVerificationGate, setShowEmailVerificationGate] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    is_active: true
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  const requireEmailVerification = async (onVerified: () => void) => {
    const verified = await checkEmailVerification();
    if (verified) {
      onVerified();
      return;
    }
    setShowEmailVerificationGate(true);
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/services/').catch(() => ({ success: false }));
      
      if (response.success) {
        setServices(response.services || []);
        // Calculate stats
        const servicesData = response.services || [];
        setStats({
          total_services: servicesData.length,
          active_services: servicesData.filter((s: Service) => s.is_active).length,
          total_bookings: servicesData.reduce((sum: number, s: Service) => sum + (s.bookings_count || 0), 0),
          total_revenue: servicesData.reduce((sum: number, s: Service) => sum + (s.total_revenue || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name) {
      toast({ title: "Error", description: "Service name is required", variant: "destructive" });
      return;
    }
    
    try {
      const response = await apiPost('business/services/', {
        name: newService.name,
        short_description: newService.description,
        description: newService.description,
        base_price: newService.price ? parseFloat(newService.price) : null,
        duration: newService.duration ? parseInt(newService.duration) : null,
        is_active: newService.is_active,
        price_type: newService.price ? 'fixed' : 'quote'
      });
      
      if (response.success) {
        toast({ title: "Success", description: "Service created successfully" });
        setShowNewServiceDialog(false);
        setNewService({ name: '', description: '', price: '', duration: '', category: '', is_active: true });
        fetchServices();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" });
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await apiPut(`business/services/${service.id}/`, { is_active: !service.is_active });
      toast({ title: "Success", description: `Service ${service.is_active ? 'deactivated' : 'activated'}` });
      fetchServices();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await apiDelete(`business/services/${serviceId}/`);
      toast({ title: "Success", description: "Service deleted" });
      fetchServices();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <EmailVerificationGate
          open={showEmailVerificationGate}
          onOpenChange={setShowEmailVerificationGate}
          reason="Please verify your email before creating services."
        />
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">My Services</h1>
            <Button size="sm" onClick={() => requireEmailVerification(() => setShowNewServiceDialog(true))}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Services</p>
                <p className="text-lg font-bold">{stats.total_services}</p>
                <p className="text-xs text-emerald-500">{stats.active_services} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-xs text-muted-foreground">{stats.total_bookings} bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Services List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{service.name}</p>
                          {!service.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{service.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                            {service.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">{formatCurrency(service.price)}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {service.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {service.duration}
                          </span>
                        )}
                        <span>{service.bookings_count || 0} bookings</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No services found</p>
                <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewServiceDialog(true))}>
                  Create your first service
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Add Service Dialog */}
        <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a service offering for your clients</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input 
                  placeholder="e.g., Website Design" 
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe your service..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₦)</Label>
                  <Input 
                    placeholder="0.00"
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input 
                    placeholder="e.g., 2 weeks"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch 
                  checked={newService.is_active}
                  onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewServiceDialog(false)}>Cancel</Button>
              <Button onClick={handleAddService}>Create Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <EmailVerificationGate
        open={showEmailVerificationGate}
        onOpenChange={setShowEmailVerificationGate}
        reason="Please verify your email before creating services."
      />
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">My Services</h1>
                <p className="text-sm text-muted-foreground">Services you offer to clients</p>
              </div>
            </div>
            <Button onClick={() => requireEmailVerification(() => setShowNewServiceDialog(true))}>
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Services</p>
                  <p className="text-2xl font-bold">{stats.total_services}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.active_services}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total_bookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <Card key={service.id} className={`hover:shadow-lg transition-shadow ${!service.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.category && (
                        <Badge variant="secondary" className="mt-1">{service.category}</Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                          {service.is_active ? <><EyeOff className="h-4 w-4 mr-2" /> Deactivate</> : <><Eye className="h-4 w-4 mr-2" /> Activate</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">{formatCurrency(service.price)}</p>
                    {service.duration && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" /> {service.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-muted-foreground">
                    <span>{service.bookings_count || 0} bookings</span>
                    <span>{formatCurrency(service.total_revenue || 0)} earned</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No services found</p>
              <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewServiceDialog(true))}>
                Create your first service
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a service offering for your clients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input 
                placeholder="e.g., Website Design" 
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe your service..."
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₦) *</Label>
                <Input 
                  placeholder="0.00"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input 
                  placeholder="e.g., 2 weeks"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                placeholder="e.g., Design, Development"
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active (visible to clients)</Label>
              <Switch 
                checked={newService.is_active}
                onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewServiceDialog(false)}>Cancel</Button>
            <Button onClick={handleAddService}>Create Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
