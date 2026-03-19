import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Tag,
  DollarSign,
  Eye,
  Check,
  X,
  MessageSquare,
  Filter,
  FolderPlus
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceRequest {
  id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_name: string;
  service_id?: number;
  description: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined';
  budget_min?: number;
  budget_max?: number;
  preferred_date?: string;
  created_at: string;
  notes?: string;
}

interface RequestStats {
  total_requests: number;
  pending_requests: number;
  accepted_requests: number;
  completed_requests: number;
}

export default function ServiceRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<RequestStats>({
    total_requests: 0,
    pending_requests: 0,
    accepted_requests: 0,
    completed_requests: 0
  });
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [responseAction, setResponseAction] = useState<'accept' | 'decline'>('accept');
  const [responseNote, setResponseNote] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  
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
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/service-requests/').catch(() => ({ success: false }));
      
      if (response.success) {
        setRequests(response.requests || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToRequest = async () => {
    if (!selectedRequest) return;
    
    setIsResponding(true);
    try {
      const newStatus = responseAction === 'accept' ? 'accepted' : 'declined';
      const response = await apiPut(`business/service-requests/${selectedRequest.id}/`, {
        status: newStatus,
        notes: responseNote
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Request ${responseAction === 'accept' ? 'accepted' : 'declined'} successfully`
        });
        setShowResponseDialog(false);
        setResponseNote('');
        fetchRequests();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive"
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: string) => {
    try {
      const response = await apiPut(`business/service-requests/${requestId}/`, { status: newStatus });
      
      if (response.success) {
        toast({ title: "Success", description: "Status updated" });
        fetchRequests();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Check className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Service Requests</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-lg font-bold">{stats.total_requests}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-amber-500">{stats.pending_requests}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Accepted</p>
                <p className="text-lg font-bold text-blue-500">{stats.accepted_requests}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-emerald-500">{stats.completed_requests}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
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
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          {/* Requests List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelectedRequest(request); setShowDetailDialog(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{request.client_name}</p>
                        <p className="text-sm text-muted-foreground">{request.service_name}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedRequest(request); 
                            setResponseAction('accept');
                            setShowResponseDialog(true); 
                          }}>
                            <Check className="h-4 w-4 mr-2" /> Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedRequest(request); 
                            setResponseAction('decline');
                            setShowResponseDialog(true); 
                          }}>
                            <X className="h-4 w-4 mr-2" /> Decline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(request.id, 'in_progress'); 
                          }}>
                            <Clock className="h-4 w-4 mr-2" /> Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(request.id, 'completed'); 
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                    
                    {(request.budget_min || request.budget_max) && (
                      <p className="text-sm font-medium mt-2">
                        Budget: {request.budget_min ? formatCurrency(request.budget_min) : '?'} - {request.budget_max ? formatCurrency(request.budget_max) : '?'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No service requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Requests from clients will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Request</DialogTitle>
              <DialogDescription>Request from {selectedRequest?.client_name}</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedRequest.client_email}`} className="text-primary hover:underline">
                      {selectedRequest.client_email}
                    </a>
                  </div>
                  {selectedRequest.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedRequest.client_phone}`} className="text-primary hover:underline">
                        {selectedRequest.client_phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.service_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  {(selectedRequest.budget_min || selectedRequest.budget_max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedRequest.budget_min ? formatCurrency(selectedRequest.budget_min) : '?'} - {selectedRequest.budget_max ? formatCurrency(selectedRequest.budget_max) : '?'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>
                
                {selectedRequest.preferred_date && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Preferred Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRequest.preferred_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedRequest.notes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedRequest?.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => { setResponseAction('decline'); setShowDetailDialog(false); setShowResponseDialog(true); }}
                  >
                    <X className="h-4 w-4 mr-2" /> Decline
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => { setResponseAction('accept'); setShowDetailDialog(false); setShowResponseDialog(true); }}
                  >
                    <Check className="h-4 w-4 mr-2" /> Accept
                  </Button>
                </>
              )}
              {selectedRequest?.status === 'accepted' && (
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to create project with pre-filled client info
                      navigate(`/business/projects/new?client_name=${encodeURIComponent(selectedRequest.client_name)}&client_email=${encodeURIComponent(selectedRequest.client_email)}&client_phone=${encodeURIComponent(selectedRequest.client_phone || '')}&service_id=${selectedRequest.service_id || ''}&request_id=${selectedRequest.id}`);
                      setShowDetailDialog(false);
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" /> Create Project
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => { handleUpdateStatus(selectedRequest.id, 'in_progress'); setShowDetailDialog(false); }}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Mark In Progress
                  </Button>
                </div>
              )}
              {selectedRequest?.status === 'in_progress' && (
                <Button 
                  className="w-full"
                  onClick={() => { handleUpdateStatus(selectedRequest.id, 'completed'); setShowDetailDialog(false); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {responseAction === 'accept' ? 'Accept Request' : 'Decline Request'}
              </DialogTitle>
              <DialogDescription>
                {responseAction === 'accept' 
                  ? 'Accept this service request and start working with the client'
                  : 'Decline this service request'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Add a note (optional)</Label>
                <Textarea 
                  placeholder={responseAction === 'accept' 
                    ? "e.g., I'll contact you shortly to discuss the details..."
                    : "e.g., Unfortunately, I'm fully booked at the moment..."
                  }
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
              <Button 
                variant={responseAction === 'accept' ? 'default' : 'destructive'}
                onClick={handleRespondToRequest}
                disabled={isResponding}
              >
                {isResponding ? "Sending..." : responseAction === 'accept' ? 'Accept Request' : 'Decline Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Service Requests</h1>
                <p className="text-sm text-muted-foreground">Manage requests from your clients</p>
              </div>
            </div>
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
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total_requests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.pending_requests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Check className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.accepted_requests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.completed_requests}</p>
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
              placeholder="Search by client, email, or service..."
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
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="divide-y">
                {filteredRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer flex items-center gap-4"
                    onClick={() => { setSelectedRequest(request); setShowDetailDialog(true); }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold">{request.client_name}</p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.service_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{request.description}</p>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(request.created_at).toLocaleDateString()}</p>
                      {(request.budget_min || request.budget_max) && (
                        <p className="font-medium text-foreground">
                          {request.budget_min ? formatCurrency(request.budget_min) : '?'} - {request.budget_max ? formatCurrency(request.budget_max) : '?'}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedRequest(request); 
                          setShowDetailDialog(true); 
                        }}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {request.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedRequest(request); 
                              setResponseAction('accept');
                              setShowResponseDialog(true); 
                            }}>
                              <Check className="h-4 w-4 mr-2" /> Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedRequest(request); 
                              setResponseAction('decline');
                              setShowResponseDialog(true); 
                            }}>
                              <X className="h-4 w-4 mr-2" /> Decline
                            </DropdownMenuItem>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(request.id, 'in_progress'); 
                          }}>
                            <Clock className="h-4 w-4 mr-2" /> Mark In Progress
                          </DropdownMenuItem>
                        )}
                        {request.status === 'in_progress' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(request.id, 'completed'); 
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No service requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When clients request your services, they'll appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Request</DialogTitle>
            <DialogDescription>Request from {selectedRequest?.client_name}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedRequest.client_email}`} className="text-primary hover:underline">
                      {selectedRequest.client_email}
                    </a>
                  </div>
                  {selectedRequest.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedRequest.client_phone}`} className="text-primary hover:underline">
                        {selectedRequest.client_phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.service_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  {(selectedRequest.budget_min || selectedRequest.budget_max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedRequest.budget_min ? formatCurrency(selectedRequest.budget_min) : '?'} - {selectedRequest.budget_max ? formatCurrency(selectedRequest.budget_max) : '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.preferred_date && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Preferred Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRequest.preferred_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setResponseAction('decline'); setShowDetailDialog(false); setShowResponseDialog(true); }}
                >
                  <X className="h-4 w-4 mr-2" /> Decline
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => { setResponseAction('accept'); setShowDetailDialog(false); setShowResponseDialog(true); }}
                >
                  <Check className="h-4 w-4 mr-2" /> Accept
                </Button>
              </>
            )}
            {selectedRequest?.status === 'accepted' && (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigate(`/business/projects/new?client_name=${encodeURIComponent(selectedRequest.client_name)}&client_email=${encodeURIComponent(selectedRequest.client_email)}&client_phone=${encodeURIComponent(selectedRequest.client_phone || '')}&service_id=${selectedRequest.service_id || ''}&request_id=${selectedRequest.id}`);
                    setShowDetailDialog(false);
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" /> Create Project
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => { handleUpdateStatus(selectedRequest.id, 'in_progress'); setShowDetailDialog(false); }}
                >
                  <Clock className="h-4 w-4 mr-2" /> Mark In Progress
                </Button>
              </div>
            )}
            {selectedRequest?.status === 'in_progress' && (
              <Button 
                className="w-full"
                onClick={() => { handleUpdateStatus(selectedRequest.id, 'completed'); setShowDetailDialog(false); }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accept' ? 'Accept Request' : 'Decline Request'}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'accept' 
                ? 'Accept this service request and start working with the client'
                : 'Decline this service request'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Add a note (optional)</Label>
              <Textarea 
                placeholder={responseAction === 'accept' 
                  ? "e.g., I'll contact you shortly to discuss the details..."
                  : "e.g., Unfortunately, I'm fully booked at the moment..."
                }
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
            <Button 
              variant={responseAction === 'accept' ? 'default' : 'destructive'}
              onClick={handleRespondToRequest}
              disabled={isResponding}
            >
              {isResponding ? "Sending..." : responseAction === 'accept' ? 'Accept Request' : 'Decline Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
