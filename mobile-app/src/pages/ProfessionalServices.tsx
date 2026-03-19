import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { 
  ArrowLeft, 
  Plus, 
  Palette, 
  FileCheck, 
  Calculator, 
  Megaphone, 
  Globe, 
  Share2,
  PenTool,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  MessageSquare,
  Star,
  Smartphone,
  Code,
  Search,
  Camera
} from "lucide-react";
import { PageSpinner, ButtonSpinner } from "@/components/ui/LoadingSpinner";

interface ServiceType {
  value: string;
  label: string;
}

interface ServiceRequest {
  id: number;
  service_type: string;
  service_type_display: string;
  title: string;
  description: string;
  priority: string;
  budget_range: string | null;
  deadline: string | null;
  status: string;
  quoted_price: number | null;
  final_price: number | null;
  deliverables: string[];
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  review_rating: number | null;
  review_comment: string | null;
  reviewed_at: string | null;
}

const SERVICE_ICONS: Record<string, any> = {
  graphic_design: Palette,
  cac_registration: FileCheck,
  tax_management: Calculator,
  digital_marketing: Megaphone,
  social_media_ads: Share2,
  website_development: Globe,
  website_design: Globe,
  content_creation: PenTool,
  branding: Sparkles,
  marketing: Megaphone,
  social_media: Share2,
  training: FileCheck,
  seo: Search,
  consulting: Calculator,
  photography: Camera,
  content: PenTool,
  mobile_app: Smartphone,
  custom_software: Code,
  custom_domain: Globe,
  other: MessageSquare,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_review: { label: "In Review", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: RefreshCw },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function ProfessionalServices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  
  // Get service type from URL params (e.g., ?service=custom_domain)
  const preSelectedService = searchParams.get('service');
  
  const [newRequest, setNewRequest] = useState({
    service_type: preSelectedService || "",
    title: preSelectedService === 'custom_domain' ? "Custom Domain Setup Request" : "",
    description: preSelectedService === 'custom_domain' ? "I would like to set up a custom domain for my business portal. Please provide information on available domains and pricing." : "",
    priority: "medium",
    budget_range: "",
    deadline: "",
    customer_notes: "",
  });
  
  useEffect(() => {
    loadRequests();
    // Auto-open dialog if service param is present
    if (preSelectedService) {
      setShowNewRequestDialog(true);
    }
  }, []);
  
  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiGet("business/professional-services/");
      setRequests(response.requests || []);
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
  
  const submitRequest = async () => {
    if (!newRequest.service_type || !newRequest.title || !newRequest.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      await apiPost("business/professional-services/", newRequest);
      toast({
        title: "Success",
        description: "Service request submitted successfully!",
      });
      setShowNewRequestDialog(false);
      setNewRequest({
        service_type: "",
        title: "",
        description: "",
        priority: "medium",
        budget_range: "",
        deadline: "",
        customer_notes: "",
      });
      await loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const cancelRequest = async (requestId: number) => {
    try {
      await apiDelete(`business/professional-services/${requestId}/`);
      toast({
        title: "Cancelled",
        description: "Request cancelled successfully",
      });
      setShowDetailDialog(false);
      await loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      });
    }
  };
  
  const submitReview = async () => {
    if (!selectedRequest || reviewRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      await apiPost(`business/professional-services/${selectedRequest.id}/review/`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast({
        title: "Thank you!",
        description: "Your review has been submitted successfully",
      });
      setShowReviewDialog(false);
      setReviewRating(0);
      setReviewComment("");
      await loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const openReviewDialog = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setReviewRating(0);
    setReviewComment("");
    setShowReviewDialog(true);
  };
  
  const filteredRequests = requests.filter(req => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ["pending", "in_review", "approved", "in_progress"].includes(req.status);
    if (activeTab === "completed") return req.status === "completed";
    if (activeTab === "cancelled") return ["rejected", "cancelled"].includes(req.status);
    return true;
  });
  
  const ServiceIcon = ({ type }: { type: string }) => {
    const Icon = SERVICE_ICONS[type] || MessageSquare;
    return <Icon className="h-5 w-5" />;
  };
  
  if (loading) {
    return <PageSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Professional Services</h1>
              <p className="text-muted-foreground">Request expert services for your business</p>
            </div>
          </div>
          <Button onClick={() => setShowNewRequestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
        
        {/* Service Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: "graphic_design", label: "Graphic Design", desc: "Logos, banners, flyers" },
            { type: "cac_registration", label: "CAC Registration", desc: "Business registration" },
            { type: "tax_management", label: "Tax Management", desc: "Tax filing & compliance" },
            { type: "digital_marketing", label: "Digital Marketing", desc: "SEO, ads, campaigns" },
          ].map((service) => (
            <Card 
              key={service.type}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setNewRequest({ ...newRequest, service_type: service.type });
                setShowNewRequestDialog(true);
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ServiceIcon type={service.type} />
                </div>
                <h3 className="font-semibold text-sm">{service.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{service.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* More Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">More Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "social_media_ads", label: "Social Media Ads" },
                { type: "content_creation", label: "Content Creation" },
                { type: "branding", label: "Branding & Identity" },
                { type: "other", label: "Other Services" },
              ].map((service) => (
                <Button
                  key={service.type}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewRequest({ ...newRequest, service_type: service.type });
                    setShowNewRequestDialog(true);
                  }}
                >
                  <ServiceIcon type={service.type} />
                  <span className="ml-2">{service.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Requests</CardTitle>
            <CardDescription>Track your service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Active ({requests.filter(r => ["pending", "in_review", "approved", "in_progress"].includes(r.status)).length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({requests.filter(r => r.status === "completed").length})
                </TabsTrigger>
              </TabsList>
              
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No requests found</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setShowNewRequestDialog(true)}
                    >
                      Submit your first request
                    </Button>
                  </div>
                ) : (
                  filteredRequests.map((request) => {
                    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailDialog(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <ServiceIcon type={request.service_type} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.title}</h3>
                              <p className="text-sm text-muted-foreground">{request.service_type_display}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                              {/* Show existing review */}
                              {request.review_rating && (
                                <div className="flex items-center gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${star <= request.review_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-1">Reviewed</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {request.quoted_price && (
                              <span className="text-sm font-semibold text-primary">
                                ₦{request.quoted_price.toLocaleString()}
                              </span>
                            )}
                            {/* Leave Review button for completed requests without review */}
                            {request.status === 'completed' && !request.review_rating && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewDialog(request);
                                }}
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Leave Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Request Professional Service</DialogTitle>
            <DialogDescription>
              Tell us what you need and we'll connect you with experts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select
                value={newRequest.service_type}
                onValueChange={(value) => setNewRequest({ ...newRequest, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Brief title for your request"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe what you need in detail..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Budget Range (Optional)</Label>
                <Input
                  placeholder="e.g., ₦50,000 - ₦100,000"
                  value={newRequest.budget_range}
                  onChange={(e) => setNewRequest({ ...newRequest, budget_range: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input
                type="date"
                value={newRequest.deadline}
                onChange={(e) => setNewRequest({ ...newRequest, deadline: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any other information you'd like to share..."
                value={newRequest.customer_notes}
                onChange={(e) => setNewRequest({ ...newRequest, customer_notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting ? <><ButtonSpinner className="mr-2" /> Submitting...</> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
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
              
              <div className="space-y-4">
                {/* Status & Priority */}
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_CONFIG[selectedRequest.status]?.color}>
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </Badge>
                  <Badge variant="outline" className={PRIORITY_CONFIG[selectedRequest.priority]?.color}>
                    {PRIORITY_CONFIG[selectedRequest.priority]?.label} Priority
                  </Badge>
                </div>
                
                {/* Description */}
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{selectedRequest.description}</p>
                </div>
                
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedRequest.budget_range && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Budget
                      </Label>
                      <p className="font-medium">{selectedRequest.budget_range}</p>
                    </div>
                  )}
                  {selectedRequest.deadline && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Deadline
                      </Label>
                      <p className="font-medium">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedRequest.quoted_price && (
                    <div>
                      <Label className="text-muted-foreground">Quoted Price</Label>
                      <p className="font-bold text-primary">₦{selectedRequest.quoted_price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div className="bg-muted rounded-lg p-3">
                    <Label className="text-muted-foreground">Response from Team</Label>
                    <p className="mt-1 text-sm">{selectedRequest.admin_notes}</p>
                  </div>
                )}
                
                {/* Rejection Reason */}
                {selectedRequest.rejection_reason && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <Label className="text-red-700 dark:text-red-400">Rejection Reason</Label>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
                
                {/* Deliverables */}
                {selectedRequest.deliverables && selectedRequest.deliverables.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Deliverables</Label>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.deliverables.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Download File {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {["pending", "in_review"].includes(selectedRequest.status) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => cancelRequest(selectedRequest.id)}
                  >
                    Cancel Request
                  </Button>
                )}
                {selectedRequest.status === 'completed' && !selectedRequest.review_rating && (
                  <Button 
                    onClick={() => {
                      setShowDetailDialog(false);
                      openReviewDialog(selectedRequest);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave Review
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              How satisfied are you with this service?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {reviewRating === 1 && "Poor"}
                  {reviewRating === 2 && "Fair"}
                  {reviewRating === 3 && "Good"}
                  {reviewRating === 4 && "Very Good"}
                  {reviewRating === 5 && "Excellent"}
                </p>
              )}
            </div>
            
            {/* Comment */}
            <div className="space-y-2">
              <Label>Comment (Optional)</Label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={submitting || reviewRating === 0}>
              {submitting ? <ButtonSpinner /> : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
