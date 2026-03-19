import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import {
  FolderOpen,
  Receipt,
  Clock,
  MessageSquare,
  Calendar,
  Video,
  FileText,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  User,
  Send,
  ExternalLink,
  Menu,
  X,
  Home,
  Briefcase,
  CreditCard,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ClientStats {
  active_projects: number;
  pending_invoices: number;
  hours_this_month: number;
  unread_messages: number;
}

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  due_date: string;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  meeting_link?: string;
}

interface Message {
  id: number;
  sender: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
}

interface BusinessInfo {
  name: string;
  logo?: string;
  tagline?: string;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [clientName, setClientName] = useState("Client");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({ name: "Acme Agency" });
  const [stats, setStats] = useState<ClientStats>({
    active_projects: 0,
    pending_invoices: 0,
    hours_this_month: 0,
    unread_messages: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchClientData();
  }, [slug]);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet(`client/dashboard/${slug || ''}`).catch(() => ({ success: false }));
      
      if (response.success) {
        setClientName(response.client_name || "Client");
        setBusinessInfo(response.business || businessInfo);
        setStats(response.stats || stats);
        setProjects(response.projects || []);
        setMeetings(response.meetings || []);
        setMessages(response.messages || []);
        setInvoices(response.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    try {
      const response = await apiPost(`client/messages/`, {
        content: newMessage,
        business_slug: slug
      });
      
      if (response.success) {
        toast({ title: "Message sent!", description: "Your message has been sent successfully." });
        setShowMessageDialog(false);
        setNewMessage('');
        fetchClientData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'text-emerald-400';
      case 'on_hold':
        return 'text-amber-400';
      case 'completed':
        return 'text-blue-400';
      case 'paid':
        return 'text-emerald-400';
      case 'pending':
        return 'text-amber-400';
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-slate-500';
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

  // Sidebar Component
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {businessInfo.logo ? (
            <img src={businessInfo.logo} alt={businessInfo.name} className="h-10 w-10 rounded-lg" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold">
              {getInitials(businessInfo.name)}
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg">{businessInfo.name}</h1>
            {businessInfo.tagline && <p className="text-xs text-slate-400">{businessInfo.tagline}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 bg-slate-800/50">
          <Home className="h-5 w-5 mr-3" /> Dashboard
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
          <Briefcase className="h-5 w-5 mr-3" /> My Projects
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
          <CreditCard className="h-5 w-5 mr-3" /> Invoices
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
          <Calendar className="h-5 w-5 mr-3" /> Meetings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setShowMessageDialog(true)}>
          <MessageSquare className="h-5 w-5 mr-3" /> Messages
          {stats.unread_messages > 0 && (
            <Badge className="ml-auto bg-violet-500 text-white">{stats.unread_messages}</Badge>
          )}
        </Button>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-slate-700 text-white">{getInitials(clientName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{clientName}</p>
            <p className="text-xs text-slate-400">Client</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Main Content
  const MainContent = () => (
    <div className="flex-1 bg-slate-950 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Welcome back, {clientName.split(' ')[0]}!</h1>
              <p className="text-sm text-slate-400">Here's what's happening with your projects</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              {stats.unread_messages > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-violet-500 rounded-full text-[10px] flex items-center justify-center">
                  {stats.unread_messages}
                </span>
              )}
            </Button>
            <Button onClick={() => setShowMessageDialog(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Send className="h-4 w-4 mr-2" /> Send Message
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <FolderOpen className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Projects</p>
                  <p className="text-2xl font-bold text-white">{stats.active_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Receipt className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pending Invoices</p>
                  <p className="text-2xl font-bold text-white">{stats.pending_invoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Clock className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Hours This Month</p>
                  <p className="text-2xl font-bold text-white">{stats.hours_this_month}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Unread Messages</p>
                  <p className="text-2xl font-bold text-white">{stats.unread_messages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects & Meetings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Projects */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Your Projects</CardTitle>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-slate-800" />)
              ) : projects.length > 0 ? (
                projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">{project.name}</p>
                        <p className={`text-xs capitalize ${getStatusColor(project.status)}`}>{project.status.replace('_', ' ')}</p>
                      </div>
                      <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
                        Due {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(project.progress)} transition-all`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-400">No active projects</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Upcoming Meetings</CardTitle>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-slate-800" />)
              ) : meetings.length > 0 ? (
                meetings.slice(0, 4).map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className="w-14 h-14 rounded-lg bg-slate-700 flex flex-col items-center justify-center">
                      <span className="text-xs text-slate-400">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {new Date(meeting.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{meeting.title}</p>
                      <p className="text-sm text-slate-400">{meeting.time}</p>
                    </div>
                    {meeting.meeting_link && (
                      <Button variant="ghost" size="icon" className="text-violet-400 hover:text-violet-300" asChild>
                        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Video className="h-5 w-5" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-400">No upcoming meetings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages & Invoices Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Messages</CardTitle>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300" onClick={() => setShowMessageDialog(true)}>
                  <Send className="h-4 w-4 mr-2" /> New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-slate-800" />)
              ) : messages.length > 0 ? (
                messages.slice(0, 4).map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 p-3 rounded-lg ${message.is_read ? 'bg-slate-800/30' : 'bg-slate-800/50 border-l-2 border-violet-500'}`}>
                    <Avatar className="h-9 w-9">
                      {message.sender_avatar ? (
                        <AvatarImage src={message.sender_avatar} />
                      ) : null}
                      <AvatarFallback className="bg-slate-700 text-white text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white text-sm">{message.sender}</p>
                        <span className="text-xs text-slate-500">{formatTimeAgo(message.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{message.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-400">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Invoices</CardTitle>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-slate-800" />)
              ) : invoices.length > 0 ? (
                invoices.slice(0, 4).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{invoice.invoice_number}</p>
                        <p className="text-xs text-slate-400">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(invoice.amount)}</p>
                      <Badge className={`text-xs ${
                        invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                        invoice.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-400">No invoices yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 flex-shrink-0 border-r border-slate-800">
          <Sidebar />
        </div>
      )}
      
      {/* Main Content */}
      <MainContent />

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send a message to {businessInfo.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Message</Label>
              <Textarea 
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={5}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending} className="bg-violet-600 hover:bg-violet-700">
              {isSending ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
