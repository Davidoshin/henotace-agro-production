import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { CalendarDays, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AbsenceRequest {
  id: number;
  staff: {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    position: string;
  };
  absence_type: string;
  absence_type_code: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  status: string;
  total_days: number;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export default function AbsenceRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`business/absence-requests/?status=${statusFilter}`);
      setRequests(data.requests || []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to load absence requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    if (reviewAction === 'reject' && !reviewNotes) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      const endpoint = reviewAction === 'approve' 
        ? `business/absence-requests/${selectedRequest.id}/approve/`
        : `business/absence-requests/${selectedRequest.id}/reject/`;

      await apiPost(endpoint, { notes: reviewNotes });

      toast({
        title: "Success",
        description: `Absence request ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`
      });

      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
      loadRequests();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || `Failed to ${reviewAction} request`,
        variant: "destructive"
      });
    }
  };

  const openReviewDialog = (request: AbsenceRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Absence Requests</h1>
                <p className="text-sm text-muted-foreground">
                  Manage staff leave and absence requests
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount} Pending
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : requests.length > 0 ? (
              <div className="grid gap-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {request.staff.name}
                          </CardTitle>
                          <CardDescription>
                            {request.staff.position} • {request.staff.employee_id}
                          </CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Absence Type</p>
                          <p className="text-sm font-semibold">{request.absence_type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duration</p>
                          <p className="text-sm font-semibold">{request.total_days} day(s)</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                          <p className="text-sm">{new Date(request.start_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">End Date</p>
                          <p className="text-sm">{new Date(request.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm bg-muted p-3 rounded">{request.reason}</p>
                      </div>

                      {request.review_notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Review Notes</p>
                          <p className="text-sm bg-muted p-3 rounded">{request.review_notes}</p>
                          {request.reviewed_by && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed by {request.reviewed_by} on {new Date(request.reviewed_at!).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => openReviewDialog(request, 'approve')}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => openReviewDialog(request, 'reject')}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Requested on {new Date(request.created_at).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No {statusFilter !== 'all' ? statusFilter : ''} requests</p>
                  <p className="text-sm text-muted-foreground">
                    {statusFilter === 'pending' 
                      ? "All absence requests have been reviewed" 
                      : "No absence requests found"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Absence Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {reviewAction === 'approve' 
                    ? `Approve ${selectedRequest.staff.name}'s request for ${selectedRequest.total_days} day(s) leave?`
                    : `Reject ${selectedRequest.staff.name}'s absence request?`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review_notes">
                {reviewAction === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection (Required)'}
              </Label>
              <Textarea
                id="review_notes"
                placeholder={reviewAction === 'approve' 
                  ? "Add any notes about this approval..."
                  : "Please provide a reason for rejection..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
            >
              {reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
