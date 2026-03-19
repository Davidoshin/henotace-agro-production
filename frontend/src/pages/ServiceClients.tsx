import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { ExportComponent } from "@/components/ExportComponent";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Users,
  TrendingUp,
  TrendingDown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmailVerificationGate, checkEmailVerification } from "@/components/account/EmailVerificationGate";

interface ClientStats {
  total_clients: number;
  new_this_month: number;
  clients_change: number;
  active_clients: number;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_spent: number;
  projects_count: number;
  status: 'active' | 'inactive';
  source: string;
  created_at: string;
  last_activity: string;
}

export default function ServiceClients() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total_clients: 0,
    new_this_month: 0,
    clients_change: 0,
    active_clients: 0
  });
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEmailVerificationGate, setShowEmailVerificationGate] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Initialize with proper check to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const openFromRoute = async () => {
      if (location.pathname.endsWith('/new')) {
        const verified = await checkEmailVerification();
        if (!verified) {
          setShowEmailVerificationGate(true);
          return;
        }
        setShowNewClientDialog(true);
      }
    };
    void openFromRoute();
  }, [location.pathname]);

  const requireEmailVerification = async (onVerified: () => void) => {
    const verified = await checkEmailVerification();
    if (verified) {
      onVerified();
      return;
    }
    setShowEmailVerificationGate(true);
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/service-clients/').catch(() => ({ success: false }));
      
      if (response.success) {
        setClients(response.clients || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name) {
      toast({ title: "Error", description: "Client name is required", variant: "destructive" });
      return;
    }
    
    try {
      const response = await apiPost('business/service-clients/', newClient);
      if (response.success) {
        toast({ title: "Success", description: "Client added successfully" });
        setShowNewClientDialog(false);
        setNewClient({ name: '', email: '', phone: '', address: '', notes: '' });
        fetchClients();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add client", variant: "destructive" });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: '' // Notes field not in Client interface
    });
    setShowEditClientDialog(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !newClient.name) {
      toast({ title: "Error", description: "Client name is required", variant: "destructive" });
      return;
    }
    
    try {
      const response = await apiPost(`business/service-clients/${editingClient.id}/`, newClient);
      if (response.success) {
        toast({ title: "Success", description: "Client updated successfully" });
        setShowEditClientDialog(false);
        setEditingClient(null);
        setNewClient({ name: '', email: '', phone: '', address: '', notes: '' });
        fetchClients();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await apiDelete(`business/service-clients/${clientId}/`);
      toast({ title: "Success", description: "Client deleted" });
      fetchClients();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
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

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <EmailVerificationGate
          open={showEmailVerificationGate}
          onOpenChange={setShowEmailVerificationGate}
          reason="Please verify your email before adding clients."
        />
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Clients</h1>
            <Button size="sm" onClick={() => requireEmailVerification(() => setShowNewClientDialog(true))}>
              <UserPlus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-lg font-bold">{stats.total_clients}</p>
                <div className={`flex items-center gap-1 text-xs ${stats.clients_change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.clients_change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(stats.clients_change)}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Active Clients</p>
                <p className="text-lg font-bold text-emerald-500">{stats.active_clients}</p>
                <p className="text-xs text-muted-foreground">Last 90 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <Card key={client.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">{client.name}</p>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {client.status}
                          </Badge>
                        </div>
                        {client.email && (
                          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{client.projects_count} projects</span>
                          <span className="font-medium text-foreground">{formatCurrency(client.total_spent)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No clients found</p>
                <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewClientDialog(true))}>
                  Add your first client
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Dialog */}
        <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Add a client to your business</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input 
                  placeholder="Client name" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  placeholder="client@email.com" 
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+234..."
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  placeholder="Address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes..."
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>Cancel</Button>
              <Button onClick={handleAddClient}>Add Client</Button>
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
        reason="Please verify your email before adding clients."
      />
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Clients</h1>
            </div>
            <Button onClick={() => requireEmailVerification(() => setShowNewClientDialog(true))}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold mt-1">{stats.total_clients}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stats.clients_change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.clients_change >= 0 ? '+' : ''}{stats.clients_change}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold text-primary mt-1">{stats.new_this_month}</p>
              <p className="text-sm text-muted-foreground mt-1">Clients added</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Clients</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.active_clients}</p>
              <p className="text-sm text-muted-foreground mt-1">Last 90 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. Client Value</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(stats.total_clients > 0 ? clients.reduce((sum, c) => sum + c.total_spent, 0) / stats.total_clients : 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Per client</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <ExportComponent
              data={filteredClients}
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Email', accessor: 'email' },
                { header: 'Phone', accessor: 'phone' },
                { header: 'Address', accessor: 'address' },
                { header: 'Projects', accessor: 'projects_count' },
                { header: 'Total Spent', accessor: (row) => `₦${row.total_spent?.toLocaleString() || '0'}` },
                { header: 'Status', accessor: 'status' },
                { header: 'Joined', accessor: (row) => new Date(row.created_at).toLocaleDateString() },
              ]}
              filename={`clients-${new Date().toISOString().split('T')[0]}`}
              title="Clients List"
            />
          </div>
        </div>

        {/* Clients Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CLIENT</TableHead>
                <TableHead>CONTACT</TableHead>
                <TableHead>PROJECTS</TableHead>
                <TableHead>TOTAL SPENT</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>JOINED</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.email && <p>{client.email}</p>}
                        {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{client.projects_count}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(client.total_spent)}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClient(client)}>Edit Client</DropdownMenuItem>
                          <DropdownMenuItem>Send Email</DropdownMenuItem>
                          <DropdownMenuItem>Create Invoice</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No clients found</p>
                    <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewClientDialog(true))}>
                      Add your first client
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Add a new client to your service business</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                placeholder="Client name" 
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                placeholder="client@email.com" 
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+234..."
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  placeholder="Address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Additional notes about this client..."
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>Cancel</Button>
            <Button onClick={handleAddClient}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Client Dialog */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                placeholder="Client name" 
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                placeholder="client@email.com" 
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+234..."
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  placeholder="Address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Additional notes about this client..."
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditClientDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateClient}>Update Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
