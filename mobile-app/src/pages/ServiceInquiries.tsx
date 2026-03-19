import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  MessageSquare,
  Clock,
  CheckCircle2,
  Archive,
  User,
  Mail,
  Phone,
  Calendar,
  Reply,
  Eye,
  MailOpen,
  Send
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  service_name?: string;
  created_at: string;
  reply?: string;
  replied_at?: string;
}

interface InquiryStats {
  total_inquiries: number;
  new_inquiries: number;
  replied_inquiries: number;
  archived_inquiries: number;
}

export default function ServiceInquiries() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({
    total_inquiries: 0,
    new_inquiries: 0,
    replied_inquiries: 0,
    archived_inquiries: 0
  });
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
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
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/inquiries/').catch(() => ({ success: false }));
      
      if (response.success) {
        setInquiries(response.inquiries || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (inquiryId: number) => {
    try {
      const response = await apiPut(`business/inquiries/${inquiryId}/`, { status: 'read' });
      if (response.success) {
        fetchInquiries();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await apiPost(`business/inquiries/${selectedInquiry.id}/respond/`, {
        response: replyMessage
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Reply sent successfully"
        });
        setShowReplyDialog(false);
        setReplyMessage('');
        fetchInquiries();
      } else {
        throw new Error(response.error || 'Failed to send reply');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleArchive = async (inquiryId: number) => {
    try {
      const response = await apiPut(`business/inquiries/${inquiryId}/`, { status: 'archived' });
      if (response.success) {
        toast({ title: "Success", description: "Inquiry archived" });
        fetchInquiries();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to archive", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> New</Badge>;
      case 'read':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><MailOpen className="w-3 h-3 mr-1" /> Read</Badge>;
      case 'replied':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Replied</Badge>;
      case 'archived':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><Archive className="w-3 h-3 mr-1" /> Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
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
            <h1 className="text-lg font-semibold flex-1">Inquiries</h1>
            {stats.new_inquiries > 0 && (
              <Badge className="bg-blue-500">{stats.new_inquiries} new</Badge>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total_inquiries}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">New</p>
                <p className="text-lg font-bold text-blue-500">{stats.new_inquiries}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Replied</p>
                <p className="text-lg font-bold text-emerald-500">{stats.replied_inquiries}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Archived</p>
                <p className="text-lg font-bold text-slate-500">{stats.archived_inquiries}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inquiries..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Inquiries List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <Card 
                  key={inquiry.id} 
                  className={`cursor-pointer hover:bg-muted/50 ${inquiry.status === 'new' ? 'border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => { 
                    setSelectedInquiry(inquiry); 
                    setShowDetailDialog(true);
                    if (inquiry.status === 'new') handleMarkAsRead(inquiry.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(inquiry.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">{inquiry.name}</p>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(inquiry.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{inquiry.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{inquiry.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(inquiry.status)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No inquiries yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Client inquiries will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inquiry</DialogTitle>
              <DialogDescription>From {selectedInquiry?.name}</DialogDescription>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedInquiry.status)}
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(selectedInquiry.created_at)}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInquiry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedInquiry.phone}`} className="text-primary hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">{selectedInquiry.subject}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
                
                {selectedInquiry.reply && (
                  <div className="bg-primary/5 p-4 rounded-lg border-l-2 border-primary">
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Reply className="h-4 w-4" /> Your Reply
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInquiry.reply}</p>
                    {selectedInquiry.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Sent {formatTimeAgo(selectedInquiry.replied_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedInquiry?.status !== 'archived' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => { handleArchive(selectedInquiry!.id); setShowDetailDialog(false); }}
                  >
                    <Archive className="h-4 w-4 mr-2" /> Archive
                  </Button>
                  {selectedInquiry?.status !== 'replied' && (
                    <Button onClick={() => { setShowDetailDialog(false); setShowReplyDialog(true); }}>
                      <Reply className="h-4 w-4 mr-2" /> Reply
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to {selectedInquiry?.name}</DialogTitle>
              <DialogDescription>
                Re: {selectedInquiry?.subject}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea 
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancel</Button>
              <Button onClick={handleSendReply} disabled={isSending}>
                {isSending ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Reply</>}
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
                <h1 className="text-xl font-bold">Inquiries</h1>
                <p className="text-sm text-muted-foreground">Manage client inquiries and messages</p>
              </div>
            </div>
            {stats.new_inquiries > 0 && (
              <Badge className="bg-blue-500 text-white px-3 py-1">{stats.new_inquiries} new</Badge>
            )}
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
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total_inquiries}</p>
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
                  <p className="text-sm text-muted-foreground">New</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.new_inquiries}</p>
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
                  <p className="text-sm text-muted-foreground">Replied</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.replied_inquiries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Archive className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                  <p className="text-2xl font-bold text-slate-500">{stats.archived_inquiries}</p>
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
              placeholder="Search inquiries..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inquiries List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : filteredInquiries.length > 0 ? (
              <div className="divide-y">
                {filteredInquiries.map((inquiry) => (
                  <div 
                    key={inquiry.id} 
                    className={`p-4 hover:bg-muted/50 cursor-pointer flex items-start gap-4 ${inquiry.status === 'new' ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => { 
                      setSelectedInquiry(inquiry); 
                      setShowDetailDialog(true);
                      if (inquiry.status === 'new') handleMarkAsRead(inquiry.id);
                    }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(inquiry.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{inquiry.name}</p>
                          {getStatusBadge(inquiry.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">{formatTimeAgo(inquiry.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{inquiry.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{inquiry.message}</p>
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
                          setSelectedInquiry(inquiry); 
                          setShowDetailDialog(true); 
                        }}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        {inquiry.status !== 'replied' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedInquiry(inquiry); 
                            setShowReplyDialog(true); 
                          }}>
                            <Reply className="h-4 w-4 mr-2" /> Reply
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          handleArchive(inquiry.id); 
                        }}>
                          <Archive className="h-4 w-4 mr-2" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No inquiries yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Client inquiries from your service page will appear here
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
            <DialogTitle>Inquiry</DialogTitle>
            <DialogDescription>From {selectedInquiry?.name}</DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedInquiry.status)}
                <span className="text-sm text-muted-foreground">{formatTimeAgo(selectedInquiry.created_at)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInquiry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedInquiry.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedInquiry.phone}`} className="text-primary hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedInquiry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">{selectedInquiry.subject}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              
              {selectedInquiry.reply && (
                <div className="bg-primary/5 p-4 rounded-lg border-l-2 border-primary">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Reply className="h-4 w-4" /> Your Reply
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInquiry.reply}</p>
                  {selectedInquiry.replied_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Sent {formatTimeAgo(selectedInquiry.replied_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedInquiry?.status !== 'archived' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => { handleArchive(selectedInquiry!.id); setShowDetailDialog(false); }}
                >
                  <Archive className="h-4 w-4 mr-2" /> Archive
                </Button>
                {selectedInquiry?.status !== 'replied' && (
                  <Button onClick={() => { setShowDetailDialog(false); setShowReplyDialog(true); }}>
                    <Reply className="h-4 w-4 mr-2" /> Reply
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {selectedInquiry?.name}</DialogTitle>
            <DialogDescription>
              Re: {selectedInquiry?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Reply</Label>
              <Textarea 
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancel</Button>
            <Button onClick={handleSendReply} disabled={isSending}>
              {isSending ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Reply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
