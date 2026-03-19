import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Check,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { EmailVerificationGate, checkEmailVerification } from "@/components/account/EmailVerificationGate";

interface Project {
  id: number;
  name: string;
  description: string;
  client_id?: number;
  client_name: string;
  client_email?: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  created_at: string;
}

interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_revenue: number;
}

interface Client {
  id: number;
  name: string;
  email?: string;
}

export default function ServiceProjects() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    total_revenue: 0
  });
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showEmailVerificationGate, setShowEmailVerificationGate] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    client_name: '',
    client_email: '',
    budget: '',
    start_date: '',
    due_date: ''
  });
  
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
    fetchProjects();
    fetchClients();
  }, []);

  // Handle project ID from URL - select the project when ID is present
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === parseInt(projectId));
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projectId, projects]);

  const fetchClients = async () => {
    try {
      const response = await apiGet('business/service-clients/').catch(() => ({ success: false }));
      if (response.success) {
        setClients(response.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/projects/').catch(() => ({ success: false }));
      
      if (response.success) {
        setProjects(response.projects || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiPost('business/projects/', newProject);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Project created successfully"
        });
        setShowNewProjectDialog(false);
        setNewProject({ name: '', description: '', client_id: '', client_name: '', client_email: '', budget: '', start_date: '', due_date: '' });
        fetchProjects();
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (projectId: number, newStatus: string) => {
    try {
      const response = await apiPut(`business/projects/${projectId}/`, { status: newStatus });
      
      if (response.success) {
        toast({ title: "Success", description: "Project status updated" });
        fetchProjects();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await apiDelete(`business/projects/${selectedProject.id}/`);
      
      if (response.success) {
        toast({ title: "Success", description: "Project deleted successfully" });
        setShowDeleteDialog(false);
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      setNewProject({
        ...newProject,
        client_id: clientId,
        client_name: client.name,
        client_email: client.email || ''
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Play className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'on_hold':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Pause className="w-3 h-3 mr-1" /> On Hold</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const requireEmailVerification = async (onVerified: () => void) => {
    const verified = await checkEmailVerification();
    if (verified) {
      onVerified();
      return;
    }
    setShowEmailVerificationGate(true);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <EmailVerificationGate
          open={showEmailVerificationGate}
          onOpenChange={setShowEmailVerificationGate}
          reason="Please verify your email before creating projects."
        />
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Projects</h1>
            <Button size="sm" onClick={() => requireEmailVerification(() => setShowNewProjectDialog(true))}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Projects</p>
                <p className="text-lg font-bold">{stats.total_projects}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-emerald-500">{stats.active_projects}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-blue-500">{stats.completed_projects}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(stats.total_revenue)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Projects List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.client_name}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'pending')}>
                            <Clock className="h-4 w-4 mr-2" /> Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'in_progress')}>
                            <Play className="h-4 w-4 mr-2" /> Start Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'on_hold')}>
                            <Pause className="h-4 w-4 mr-2" /> Put On Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'completed')}>
                            <Check className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/business/invoices/new?project=${project.id}&client=${project.client_id || ''}&client_name=${encodeURIComponent(project.client_name)}&amount=${project.budget || ''}&description=${encodeURIComponent(project.name)}`)}>
                            <FileText className="h-4 w-4 mr-2" /> Create Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => { setSelectedProject(project); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(project.status)}
                      <span className="text-xs text-muted-foreground">Due: {new Date(project.due_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    {project.budget > 0 && (
                      <p className="text-sm font-medium mt-2">{formatCurrency(project.budget)}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No projects yet</p>
                <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewProjectDialog(true))}>
                  Create your first project
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New Project Dialog */}
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new project for a client</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input 
                  placeholder="e.g., Website Redesign" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Project description..." 
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <Select value={newProject.client_id} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Client name"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget (₦)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date"
                    value={newProject.due_date}
                    onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
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
        reason="Please verify your email before creating projects."
      />
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Projects</h1>
                <p className="text-sm text-muted-foreground">Manage your client projects</p>
              </div>
            </div>
            <Button onClick={() => requireEmailVerification(() => setShowNewProjectDialog(true))}>
              <Plus className="h-4 w-4 mr-2" /> New Project
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
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.total_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Play className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.active_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.completed_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.client_name}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'pending')}>
                          <Clock className="h-4 w-4 mr-2" /> Set Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'in_progress')}>
                          <Play className="h-4 w-4 mr-2" /> Start Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'on_hold')}>
                          <Pause className="h-4 w-4 mr-2" /> Put On Hold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, 'completed')}>
                          <Check className="h-4 w-4 mr-2" /> Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/business/invoices/new?project=${project.id}&client=${project.client_id || ''}&client_name=${encodeURIComponent(project.client_name)}&amount=${project.budget || ''}&description=${encodeURIComponent(project.name)}`)}>
                          <FileText className="h-4 w-4 mr-2" /> Create Invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => { setSelectedProject(project); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    {getStatusBadge(project.status)}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.status === 'completed' ? 100 : project.progress}%</span>
                    </div>
                    <Progress value={project.status === 'completed' ? 100 : project.progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
                    </div>
                    {project.budget > 0 && (
                      <span className="font-semibold">{formatCurrency(project.budget)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No projects yet</p>
              <Button variant="link" onClick={() => requireEmailVerification(() => setShowNewProjectDialog(true))}>
                Create your first project
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project for a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input 
                placeholder="e.g., Website Redesign" 
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Project description..." 
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
              />
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={newProject.client_id} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input 
                placeholder="Client name"
                value={newProject.client_name}
                onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Budget (₦)</Label>
              <Input 
                type="number"
                placeholder="0"
                value={newProject.budget}
                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={newProject.due_date}
                  onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
