import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { Calendar, CheckCircle, XCircle, Clock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  reason: string;
  status: string;
  total_days: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string;
  created_at: string;
}

export default function AbsenceRequestManagement() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadAbsenceRequests();
  }, [statusFilter]);

  const loadAbsenceRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? 'business/absence-requests/' 
        : `business/absence-requests/?status=${statusFilter}`;
      const data = await apiGet(url);
      setRequests(data.requests || []);
    } catch (error: any) {
      console.error("Failed to load absence requests:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load absence requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: AbsenceRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewDialog(true);
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    if (reviewAction === "reject" && !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = reviewAction === "approve" 
        ? `business/absence-requests/${selectedRequest.id}/approve/`
        : `business/absence-requests/${selectedRequest.id}/reject/`;

      await apiPost(endpoint, { notes: reviewNotes });

      toast({
        title: "Success",
        description: `Request ${reviewAction === "approve" ? "approved" : "rejected"} successfully`,
      });

      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
      loadAbsenceRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${reviewAction} request`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string }> = {
      pending: { variant: "secondary", color: "text-yellow-600" },
      approved: { variant: "default", color: "text-green-600" },
      rejected: { variant: "destructive", color: "text-red-600" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} className={config.color}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Absence Requests</CardTitle>
          <CardDescription>Review and manage staff leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => setStatusFilter("approved")}
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approved
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                onClick={() => setStatusFilter("rejected")}
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejected
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All Requests
              </Button>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No {statusFilter !== "all" ? statusFilter : ""} requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{request.staff.name}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p>{request.staff.position} • {request.staff.employee_id}</p>
                            <p>{request.staff.email}</p>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{request.absence_type}</span>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium">
                              {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground">{request.total_days} day(s)</p>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium">Reason:</p>
                            <p className="text-muted-foreground">{request.reason}</p>
                          </div>

                          {request.review_notes && (
                            <div className="text-sm mt-2 p-2 bg-muted rounded">
                              <p className="font-medium">Review Notes:</p>
                              <p className="text-muted-foreground">{request.review_notes}</p>
                              {request.reviewed_by && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Reviewed by {request.reviewed_by} on {new Date(request.reviewed_at!).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openReviewDialog(request, "approve")}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openReviewDialog(request, "reject")}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Absence Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {selectedRequest.staff.name} - {selectedRequest.absence_type}
                  <br />
                  {new Date(selectedRequest.start_date).toLocaleDateString()} to {new Date(selectedRequest.end_date).toLocaleDateString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review_notes">
                {reviewAction === "approve" ? "Notes (Optional)" : "Rejection Reason *"}
              </Label>
              <Textarea
                id="review_notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={reviewAction === "approve" 
                  ? "Add any notes about this approval..." 
                  : "Please provide a reason for rejection..."}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleReview}
            >
              {reviewAction === "approve" ? "Approve Request" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
