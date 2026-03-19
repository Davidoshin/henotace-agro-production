import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet, apiPut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Search, 
  Palette, FileCheck, Calculator, Megaphone, Share2, Globe, PenTool, Sparkles,
  MessageSquare, Building2, User, Calendar, DollarSign, ExternalLink, Phone, Star
} from 'lucide-react';

interface ServiceRequest {
  id: number;
  business: {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
  };
  requested_by: {
    id: number;
    email: string;
    name: string;
  };
  service_type: string;
  service_type_display: string;
  title: string;
  description: string;
  priority: string;
  budget_range: string | null;
  deadline: string | null;
  attachments: string[];
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  quoted_price: number | null;
  final_price: number | null;
  deliverables: string[];
  customer_notes: string | null;
  assigned_to: { id: number; email: string } | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  review_rating: number | null;
  review_comment: string | null;
}

interface Stats {
  total: number;
  pending: number;
  in_review: number;
  in_progress: number;
  completed: number;
}

const SERVICE_ICONS: Record<string, any> = {
  graphic_design: Palette,
  cac_registration: FileCheck,
  tax_management: Calculator,
  digital_marketing: Megaphone,
  social_media_ads: Share2,
  website_development: Globe,
  content_creation: PenTool,
  branding: Sparkles,
  other: MessageSquare,
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  in_review: { label: "In Review", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function AdminProfessionalServices() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [serviceTypes, setServiceTypes] = useState<Array<{ value: string; label: string }>>([]);
  
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [updateForm, setUpdateForm] = useState({
    status: '',
    admin_notes: '',
    quoted_price: '',
    rejection_reason: '',
    deliverables: [] as string[],
    newDeliverable: '',
  });
  
  useEffect(() => {
    loadRequests();
  }, [statusFilter, serviceTypeFilter]);
  
  const loadRequests = async () => {
    try {
      setLoading(true);
      let url = 'admin/professional-services/';
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (serviceTypeFilter !== 'all') params.append('service_type', serviceTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiGet(url);
      setRequests(response.requests || []);
      setStats(response.stats || null);
      setServiceTypes(response.service_types || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openRequestDetail = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setUpdateForm({
      status: request.status,
      admin_notes: request.admin_notes || '',
      quoted_price: request.quoted_price?.toString() || '',
      rejection_reason: request.rejection_reason || '',
      deliverables: request.deliverables || [],
      newDeliverable: '',
    });
    setShowDetailDialog(true);
  };
  
  const updateRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setUpdating(true);
      await apiPut(`admin/professional-services/${selectedRequest.id}/`, {
        status: updateForm.status,
        admin_notes: updateForm.admin_notes || null,
        quoted_price: updateForm.quoted_price ? parseFloat(updateForm.quoted_price) : null,
        rejection_reason: updateForm.status === 'rejected' ? updateForm.rejection_reason : null,
        deliverables: updateForm.deliverables,
      });
      
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      setShowDetailDialog(false);
      await loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  const addDeliverable = () => {
    if (updateForm.newDeliverable.trim()) {
      setUpdateForm({
        ...updateForm,
        deliverables: [...updateForm.deliverables, updateForm.newDeliverable.trim()],
        newDeliverable: '',
      });
    }
  };
  
  const removeDeliverable = (index: number) => {
    setUpdateForm({
      ...updateForm,
      deliverables: updateForm.deliverables.filter((_, i) => i !== index),
    });
  };
  
  const filteredRequests = requests.filter(req => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(search) ||
        req.business.name.toLowerCase().includes(search) ||
        req.requested_by.email.toLowerCase().includes(search)
      );
    }
    return true;
  });
  
  const ServiceIcon = ({ type }: { type: string }) => {
    const Icon = SERVICE_ICONS[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-6 pt-6 mt-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">In Review</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats?.in_review || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">In Progress</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats?.in_progress || 0}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats?.completed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, business, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadRequests}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
          <CardDescription>Manage professional service requests from businesses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openRequestDetail(request)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <ServiceIcon type={request.service_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{request.title}</h3>
                          <Badge variant="outline" className={PRIORITY_CONFIG[request.priority]?.color}>
                            {PRIORITY_CONFIG[request.priority]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.service_type_display}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {request.business.name}
                          </span>
                          {request.business.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {request.business.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.requested_by.name || request.requested_by.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={STATUS_CONFIG[request.status]?.color}>
                        {STATUS_CONFIG[request.status]?.label}
                      </Badge>
                      {request.review_rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= request.review_rating!
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {request.quoted_price && (
                        <span className="text-sm font-semibold text-primary">
                          ₦{request.quoted_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <ServiceIcon type={selectedRequest.service_type} />
                  </div>
                  <div>
                    <DialogTitle>{selectedRequest.title}</DialogTitle>
                    <DialogDescription>{selectedRequest.service_type_display}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Business & Requester Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">Business</Label>
                    <p className="font-medium">{selectedRequest.business.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.business.code}</p>
                    {selectedRequest.business.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedRequest.business.phone}
                      </p>
                    )}
                    {selectedRequest.business.email && (
                      <p className="text-sm text-muted-foreground">{selectedRequest.business.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Requested By</Label>
                    <p className="font-medium">{selectedRequest.requested_by.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.requested_by.email}</p>
                  </div>
                </div>
                
                {/* Request Details */}
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Priority</Label>
                    <Badge variant="outline" className={PRIORITY_CONFIG[selectedRequest.priority]?.color}>
                      {PRIORITY_CONFIG[selectedRequest.priority]?.label}
                    </Badge>
                  </div>
                  {selectedRequest.budget_range && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Budget Range</Label>
                      <p className="font-medium">{selectedRequest.budget_range}</p>
                    </div>
                  )}
                  {selectedRequest.deadline && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Deadline</Label>
                      <p className="font-medium">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {selectedRequest.customer_notes && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Customer Notes</Label>
                    <p className="mt-1 text-sm">{selectedRequest.customer_notes}</p>
                  </div>
                )}
                
                {/* Customer Review */}
                {selectedRequest.review_rating && (
                  <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <Label className="font-semibold">Customer Review</Label>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= selectedRequest.review_rating!
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium">
                        {selectedRequest.review_rating}/5
                      </span>
                    </div>
                    {selectedRequest.review_comment && (
                      <p className="text-sm italic">"{selectedRequest.review_comment}"</p>
                    )}
                    {selectedRequest.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed on {new Date(selectedRequest.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Update Form */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Update Request</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select 
                        value={updateForm.status} 
                        onValueChange={(v) => setUpdateForm({ ...updateForm, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Quoted Price (₦)</Label>
                      <Input
                        type="number"
                        value={updateForm.quoted_price}
                        onChange={(e) => setUpdateForm({ ...updateForm, quoted_price: e.target.value })}
                        placeholder="Enter price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={updateForm.admin_notes}
                      onChange={(e) => setUpdateForm({ ...updateForm, admin_notes: e.target.value })}
                      placeholder="Notes visible to the customer..."
                      rows={3}
                    />
                  </div>
                  
                  {updateForm.status === 'rejected' && (
                    <div>
                      <Label>Rejection Reason</Label>
                      <Textarea
                        value={updateForm.rejection_reason}
                        onChange={(e) => setUpdateForm({ ...updateForm, rejection_reason: e.target.value })}
                        placeholder="Explain why the request was rejected..."
                        rows={2}
                      />
                    </div>
                  )}
                  
                  {/* Deliverables */}
                  <div>
                    <Label>Deliverables (URLs to completed work)</Label>
                    <div className="space-y-2 mt-2">
                      {updateForm.deliverables.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input value={url} readOnly className="flex-1" />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeDeliverable(idx)}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          value={updateForm.newDeliverable}
                          onChange={(e) => setUpdateForm({ ...updateForm, newDeliverable: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={addDeliverable}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={updateRequest} disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
