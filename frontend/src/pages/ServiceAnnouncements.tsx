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
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Send,
  AlertCircle
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
import { Switch } from "@/components/ui/switch";

interface Announcement {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  audience: 'all_clients' | 'active_clients' | 'inactive_clients';
  scheduled_at?: string;
  sent_at?: string;
  recipients_count?: number;
  created_at: string;
}

interface AnnouncementStats {
  total_announcements: number;
  sent_announcements: number;
  scheduled_announcements: number;
  draft_announcements: number;
}

export default function ServiceAnnouncements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats>({
    total_announcements: 0,
    sent_announcements: 0,
    scheduled_announcements: 0,
    draft_announcements: 0
  });
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    audience: 'all_clients',
    scheduled_at: ''
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
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/announcements/').catch(() => ({ success: false }));
      
      if (response.success) {
        setAnnouncements(response.announcements || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (sendNow: boolean = false) => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        ...newAnnouncement,
        status: sendNow ? 'sent' : (scheduleEnabled && newAnnouncement.scheduled_at ? 'scheduled' : 'draft'),
        scheduled_at: scheduleEnabled ? newAnnouncement.scheduled_at : null
      };

      const response = isEditing && selectedAnnouncement
        ? await apiPut(`business/announcements/${selectedAnnouncement.id}/`, payload)
        : await apiPost('business/announcements/', payload);
      
      if (response.success) {
        toast({
          title: "Success",
          description: sendNow ? "Announcement sent successfully" : (isEditing ? "Announcement updated" : "Announcement saved")
        });
        setShowNewDialog(false);
        resetForm();
        fetchAnnouncements();
      } else {
        throw new Error(response.error || 'Failed to save announcement');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save announcement",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendNow = async (announcementId: number) => {
    try {
      const response = await apiPost(`business/announcements/${announcementId}/send/`, {});
      
      if (response.success) {
        toast({ title: "Success", description: "Announcement sent successfully" });
        fetchAnnouncements();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send announcement", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    
    try {
      const response = await apiDelete(`business/announcements/${selectedAnnouncement.id}/`);
      
      if (response.success) {
        toast({ title: "Success", description: "Announcement deleted" });
        setShowDeleteDialog(false);
        setSelectedAnnouncement(null);
        fetchAnnouncements();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewAnnouncement({ title: '', content: '', priority: 'normal', audience: 'all_clients', scheduled_at: '' });
    setScheduleEnabled(false);
    setIsEditing(false);
    setSelectedAnnouncement(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      audience: announcement.audience,
      scheduled_at: announcement.scheduled_at || ''
    });
    setScheduleEnabled(!!announcement.scheduled_at);
    setIsEditing(true);
    setShowNewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><Edit className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'sent':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Low</Badge>;
      default:
        return null;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all_clients':
        return 'All Clients';
      case 'active_clients':
        return 'Active Clients';
      case 'inactive_clients':
        return 'Inactive Clients';
      default:
        return audience;
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
    
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
            <h1 className="text-lg font-semibold flex-1">Announcements</h1>
            <Button size="sm" onClick={() => { resetForm(); setShowNewDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total_announcements}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-lg font-bold text-emerald-500">{stats.sent_announcements}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-lg font-bold text-blue-500">{stats.scheduled_announcements}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="text-lg font-bold text-slate-500">{stats.draft_announcements}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
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
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>

          {/* Announcements List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <Card 
                  key={announcement.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelectedAnnouncement(announcement); setShowDetailDialog(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-1">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {announcement.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(announcement); }}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSendNow(announcement.id); }}>
                                <Send className="h-4 w-4 mr-2" /> Send Now
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={(e) => { e.stopPropagation(); setSelectedAnnouncement(announcement); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(announcement.status)}
                      {getPriorityBadge(announcement.priority)}
                      {announcement.recipients_count && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {announcement.recipients_count}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {announcement.sent_at 
                        ? `Sent ${new Date(announcement.sent_at).toLocaleDateString()}`
                        : announcement.scheduled_at
                        ? `Scheduled for ${new Date(announcement.scheduled_at).toLocaleDateString()}`
                        : `Created ${new Date(announcement.created_at).toLocaleDateString()}`
                      }
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No announcements yet</p>
                <Button variant="link" onClick={() => { resetForm(); setShowNewDialog(true); }}>
                  Create your first announcement
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New/Edit Dialog */}
        <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowNewDialog(open); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
              <DialogDescription>Send an announcement to your clients</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  placeholder="e.g., Holiday Hours Update" 
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea 
                  placeholder="Write your announcement..."
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={newAnnouncement.priority} 
                    onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select 
                    value={newAnnouncement.audience} 
                    onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_clients">All Clients</SelectItem>
                      <SelectItem value="active_clients">Active Clients</SelectItem>
                      <SelectItem value="inactive_clients">Inactive Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Schedule for later</Label>
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              </div>
              {scheduleEnabled && (
                <div className="space-y-2">
                  <Label>Scheduled Date & Time</Label>
                  <Input 
                    type="datetime-local"
                    value={newAnnouncement.scheduled_at}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduled_at: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => handleCreate(false)} disabled={isCreating}>
                Save as Draft
              </Button>
              <Button onClick={() => handleCreate(true)} disabled={isCreating}>
                {isCreating ? "Sending..." : scheduleEnabled ? "Schedule" : "Send Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
              <DialogDescription>Announcement details</DialogDescription>
            </DialogHeader>
            {selectedAnnouncement && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedAnnouncement.status)}
                  {getPriorityBadge(selectedAnnouncement.priority)}
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{getAudienceLabel(selectedAnnouncement.audience)}</span>
                  </div>
                  {selectedAnnouncement.recipients_count && (
                    <p className="text-muted-foreground">
                      Sent to {selectedAnnouncement.recipients_count} recipients
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedAnnouncement.sent_at 
                        ? `Sent ${new Date(selectedAnnouncement.sent_at).toLocaleString()}`
                        : selectedAnnouncement.scheduled_at
                        ? `Scheduled for ${new Date(selectedAnnouncement.scheduled_at).toLocaleString()}`
                        : `Created ${new Date(selectedAnnouncement.created_at).toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedAnnouncement?.status === 'draft' && (
                <>
                  <Button variant="outline" onClick={() => { setShowDetailDialog(false); handleEdit(selectedAnnouncement); }}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button onClick={() => { handleSendNow(selectedAnnouncement.id); setShowDetailDialog(false); }}>
                    <Send className="h-4 w-4 mr-2" /> Send Now
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
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
                <h1 className="text-xl font-bold">Announcements</h1>
                <p className="text-sm text-muted-foreground">Send announcements to your clients</p>
              </div>
            </div>
            <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> New Announcement
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
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Megaphone className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total_announcements}</p>
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
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.sent_announcements}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.scheduled_announcements}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Edit className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-slate-500">{stats.draft_announcements}</p>
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
              placeholder="Search announcements..."
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
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)
          ) : filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(announcement.status)}
                        {getPriorityBadge(announcement.priority)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedAnnouncement(announcement); setShowDetailDialog(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        {announcement.status === 'draft' && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(announcement)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendNow(announcement.id)}>
                              <Send className="h-4 w-4 mr-2" /> Send Now
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => { setSelectedAnnouncement(announcement); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{announcement.content}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{getAudienceLabel(announcement.audience)}</span>
                    </div>
                    {announcement.recipients_count && (
                      <span>{announcement.recipients_count} sent</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {announcement.sent_at 
                      ? `Sent ${new Date(announcement.sent_at).toLocaleDateString()}`
                      : announcement.scheduled_at
                      ? `Scheduled for ${new Date(announcement.scheduled_at).toLocaleDateString()}`
                      : `Created ${new Date(announcement.created_at).toLocaleDateString()}`
                    }
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No announcements yet</p>
              <Button variant="link" onClick={() => { resetForm(); setShowNewDialog(true); }}>
                Create your first announcement
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Dialog */}
      <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowNewDialog(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>Send an announcement to your clients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                placeholder="e.g., Holiday Hours Update" 
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea 
                placeholder="Write your announcement..."
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newAnnouncement.priority} 
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select 
                  value={newAnnouncement.audience} 
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_clients">All Clients</SelectItem>
                    <SelectItem value="active_clients">Active Clients</SelectItem>
                    <SelectItem value="inactive_clients">Inactive Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Schedule for later</Label>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>
            {scheduleEnabled && (
              <div className="space-y-2">
                <Label>Scheduled Date & Time</Label>
                <Input 
                  type="datetime-local"
                  value={newAnnouncement.scheduled_at}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduled_at: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCreate(false)} disabled={isCreating}>
              Save as Draft
            </Button>
            <Button onClick={() => handleCreate(true)} disabled={isCreating}>
              {isCreating ? "Sending..." : scheduleEnabled ? "Schedule" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription>Announcement details</DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedAnnouncement.status)}
                {getPriorityBadge(selectedAnnouncement.priority)}
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{getAudienceLabel(selectedAnnouncement.audience)}</span>
                </div>
                {selectedAnnouncement.recipients_count && (
                  <p className="text-muted-foreground">
                    Sent to {selectedAnnouncement.recipients_count} recipients
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedAnnouncement.sent_at 
                      ? `Sent ${new Date(selectedAnnouncement.sent_at).toLocaleString()}`
                      : selectedAnnouncement.scheduled_at
                      ? `Scheduled for ${new Date(selectedAnnouncement.scheduled_at).toLocaleString()}`
                      : `Created ${new Date(selectedAnnouncement.created_at).toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedAnnouncement?.status === 'draft' && (
              <>
                <Button variant="outline" onClick={() => { setShowDetailDialog(false); handleEdit(selectedAnnouncement); }}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button onClick={() => { handleSendNow(selectedAnnouncement.id); setShowDetailDialog(false); }}>
                  <Send className="h-4 w-4 mr-2" /> Send Now
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
