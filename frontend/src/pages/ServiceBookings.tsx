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
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Video,
  Edit,
  Trash2,
  Check,
  X,
  RefreshCw
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

interface Booking {
  id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_name: string;
  service_id?: number;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  meeting_type?: string;
  meeting_type_other?: string;
  meeting_link?: string;
  calendar_link?: string;
  notes?: string;
  created_at: string;
}

interface BookingStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
}

interface Service {
  id: number;
  title: string;
}

export default function ServiceBookings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total_bookings: 0,
    upcoming_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0
  });
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBooking, setNewBooking] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '60',
    location: '',
    meeting_link: '',
    notes: ''
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
    fetchBookings();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await apiGet('business/services/').catch(() => ({ success: false }));
      if (response.success) {
        setServices(response.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/bookings/').catch(() => ({ success: false }));
      
      if (response.success) {
        setBookings(response.bookings || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.client_name.trim() || !newBooking.client_email.trim()) {
      toast({
        title: "Error",
        description: "Client name and email are required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiPost('business/bookings/', newBooking);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking created successfully"
        });
        setShowNewBookingDialog(false);
        setNewBooking({
          client_name: '', client_email: '', client_phone: '',
          service_id: '', scheduled_date: '', scheduled_time: '',
          duration_minutes: '60', location: '', meeting_link: '', notes: ''
        });
        fetchBookings();
      } else {
        throw new Error(response.error || 'Failed to create booking');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await apiPut(`business/bookings/${bookingId}/`, { status: newStatus });
      
      if (response.success) {
        toast({ title: "Success", description: "Booking status updated" });
        fetchBookings();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const response = await apiDelete(`business/bookings/${selectedBooking.id}/`);
      
      if (response.success) {
        toast({ title: "Success", description: "Booking deleted successfully" });
        setShowDeleteDialog(false);
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete booking", variant: "destructive" });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Check className="w-3 h-3 mr-1" /> Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'no_show':
        return <Badge className="bg-muted text-muted-foreground border-border"><AlertCircle className="w-3 h-3 mr-1" /> No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isUpcoming = (date: string, time: string) => {
    const bookingDateTime = new Date(`${date}T${time}`);
    return bookingDateTime > new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort bookings: upcoming first, then by date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
    const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
    return dateA.getTime() - dateB.getTime();
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
            <h1 className="text-lg font-semibold flex-1">Bookings</h1>
            <Button size="sm" onClick={() => setShowNewBookingDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-lg font-bold">{stats.total_bookings}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-lg font-bold text-blue-500">{stats.upcoming_bookings}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-emerald-500">{stats.completed_bookings}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-lg font-bold text-red-500">{stats.cancelled_bookings}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
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
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          {/* Bookings List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            ) : sortedBookings.length > 0 ? (
              sortedBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelectedBooking(booking); setShowDetailDialog(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{booking.client_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.service_name}</p>
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
                            handleUpdateStatus(booking.id, 'confirmed'); 
                          }}>
                            <Check className="h-4 w-4 mr-2" /> Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(booking.id, 'completed'); 
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(booking.id, 'cancelled'); 
                          }}>
                            <XCircle className="h-4 w-4 mr-2" /> Cancel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedBooking(booking); 
                              setShowDeleteDialog(true); 
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(booking.status)}
                      {isUpcoming(booking.scheduled_date, booking.scheduled_time) && booking.status !== 'cancelled' && (
                        <Badge variant="outline" className="text-xs">Upcoming</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.scheduled_time}</span>
                      </div>
                      <span className="text-xs">({formatDuration(booking.duration_minutes)})</span>
                    </div>
                    
                    {/* Calendar and Meeting Links */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {booking.calendar_link && (
                        <a 
                          href={booking.calendar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <CalendarDays className="h-3 w-3" />
                          Add to Calendar
                        </a>
                      )}
                      {booking.meeting_link && booking.meeting_type === 'google_meet' && (
                        <a 
                          href={booking.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <Video className="h-3 w-3" />
                          Join Meeting
                        </a>
                      )}
                      {booking.meeting_type && (
                        <span className="text-xs text-muted-foreground">
                          {booking.meeting_type === 'google_meet' ? '📹 Google Meet' : 
                           booking.meeting_type === 'whatsapp_call' ? '📞 WhatsApp' : 
                           booking.meeting_type === 'office_meeting' ? '🏢 Office' : 
                           `📍 ${booking.meeting_type_other || 'Other'}`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No bookings yet</p>
                <Button variant="link" onClick={() => setShowNewBookingDialog(true)}>
                  Create your first booking
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New Booking Dialog */}
        <Dialog open={showNewBookingDialog} onOpenChange={setShowNewBookingDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
              <DialogDescription>Create a new appointment booking</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Client name" 
                  value={newBooking.client_name}
                  onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email *</Label>
                <Input 
                  type="email"
                  placeholder="client@example.com" 
                  value={newBooking.client_email}
                  onChange={(e) => setNewBooking({ ...newBooking, client_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Phone</Label>
                <Input 
                  type="tel"
                  placeholder="+234..." 
                  value={newBooking.client_phone}
                  onChange={(e) => setNewBooking({ ...newBooking, client_phone: e.target.value })}
                />
              </div>
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select 
                    value={newBooking.service_id} 
                    onValueChange={(value) => setNewBooking({ ...newBooking, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>{service.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    type="date"
                    value={newBooking.scheduled_date}
                    onChange={(e) => setNewBooking({ ...newBooking, scheduled_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input 
                    type="time"
                    value={newBooking.scheduled_time}
                    onChange={(e) => setNewBooking({ ...newBooking, scheduled_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select 
                  value={newBooking.duration_minutes} 
                  onValueChange={(value) => setNewBooking({ ...newBooking, duration_minutes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  placeholder="e.g., Office, Client's place, etc." 
                  value={newBooking.location}
                  onChange={(e) => setNewBooking({ ...newBooking, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meeting Link (for virtual meetings)</Label>
                <Input 
                  placeholder="https://meet.google.com/..." 
                  value={newBooking.meeting_link}
                  onChange={(e) => setNewBooking({ ...newBooking, meeting_link: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes..." 
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBookingDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateBooking} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Appointment with {selectedBooking?.client_name}</DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedBooking.client_email}`} className="text-primary hover:underline">
                      {selectedBooking.client_email}
                    </a>
                  </div>
                  {selectedBooking.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedBooking.client_phone}`} className="text-primary hover:underline">
                        {selectedBooking.client_phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedBooking.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.scheduled_time} ({formatDuration(selectedBooking.duration_minutes)})</span>
                  </div>
                  {selectedBooking.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.location}</span>
                    </div>
                  )}
                  {selectedBooking.meeting_link && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a href={selectedBooking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedBooking.notes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedBooking?.status === 'pending' && (
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => { handleUpdateStatus(selectedBooking.id, 'confirmed'); setShowDetailDialog(false); }}
                >
                  <Check className="h-4 w-4 mr-2" /> Confirm Booking
                </Button>
              )}
              {selectedBooking?.status === 'confirmed' && (
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => { handleUpdateStatus(selectedBooking.id, 'completed'); setShowDetailDialog(false); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteBooking}>Delete</Button>
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
                <h1 className="text-xl font-bold">Bookings</h1>
                <p className="text-sm text-muted-foreground">Manage your appointment bookings</p>
              </div>
            </div>
            <Button onClick={() => setShowNewBookingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Booking
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
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total_bookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.upcoming_bookings}</p>
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
                  <p className="text-2xl font-bold text-emerald-500">{stats.completed_bookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-500">{stats.cancelled_bookings}</p>
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
              placeholder="Search bookings..."
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
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : sortedBookings.length > 0 ? (
              <div className="divide-y">
                {sortedBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer flex items-center gap-4"
                    onClick={() => { setSelectedBooking(booking); setShowDetailDialog(true); }}
                  >
                    <div className="w-16 h-16 rounded-lg bg-muted flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(booking.scheduled_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold">
                        {new Date(booking.scheduled_date).getDate()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold">{booking.client_name}</p>
                        {getStatusBadge(booking.status)}
                        {isUpcoming(booking.scheduled_date, booking.scheduled_time) && booking.status !== 'cancelled' && (
                          <Badge variant="outline" className="text-xs">Upcoming</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.service_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{booking.scheduled_time}</span>
                        <span>{formatDuration(booking.duration_minutes)}</span>
                        {booking.location && <span>{booking.location}</span>}
                        {booking.meeting_type && (
                          <span>
                            {booking.meeting_type === 'google_meet' ? '📹 Google Meet' : 
                             booking.meeting_type === 'whatsapp_call' ? '📞 WhatsApp' : 
                             booking.meeting_type === 'office_meeting' ? '🏢 Office' : 
                             `📍 ${booking.meeting_type_other || 'Other'}`}
                          </span>
                        )}
                      </div>
                      {/* Calendar and Meeting Links */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {booking.calendar_link && (
                          <a 
                            href={booking.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <CalendarDays className="h-3 w-3" />
                            Add to Calendar
                          </a>
                        )}
                        {booking.meeting_link && booking.meeting_type === 'google_meet' && (
                          <a 
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                          >
                            <Video className="h-3 w-3" />
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {booking.status === 'pending' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(booking.id, 'confirmed'); 
                          }}>
                            <Check className="h-4 w-4 mr-2" /> Confirm
                          </DropdownMenuItem>
                        )}
                        {booking.status === 'confirmed' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(booking.id, 'completed'); 
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          handleUpdateStatus(booking.id, 'cancelled'); 
                        }}>
                          <XCircle className="h-4 w-4 mr-2" /> Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          handleUpdateStatus(booking.id, 'no_show'); 
                        }}>
                          <AlertCircle className="h-4 w-4 mr-2" /> Mark No Show
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedBooking(booking); 
                            setShowDeleteDialog(true); 
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No bookings yet</p>
                <Button variant="link" onClick={() => setShowNewBookingDialog(true)}>
                  Create your first booking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Booking Dialog */}
      <Dialog open={showNewBookingDialog} onOpenChange={setShowNewBookingDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>Create a new appointment booking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Client name" 
                  value={newBooking.client_name}
                  onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email *</Label>
                <Input 
                  type="email"
                  placeholder="client@example.com" 
                  value={newBooking.client_email}
                  onChange={(e) => setNewBooking({ ...newBooking, client_email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Phone</Label>
                <Input 
                  type="tel"
                  placeholder="+234..." 
                  value={newBooking.client_phone}
                  onChange={(e) => setNewBooking({ ...newBooking, client_phone: e.target.value })}
                />
              </div>
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select 
                    value={newBooking.service_id} 
                    onValueChange={(value) => setNewBooking({ ...newBooking, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>{service.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input 
                  type="date"
                  value={newBooking.scheduled_date}
                  onChange={(e) => setNewBooking({ ...newBooking, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input 
                  type="time"
                  value={newBooking.scheduled_time}
                  onChange={(e) => setNewBooking({ ...newBooking, scheduled_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select 
                  value={newBooking.duration_minutes} 
                  onValueChange={(value) => setNewBooking({ ...newBooking, duration_minutes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                placeholder="e.g., Office, Client's place, etc." 
                value={newBooking.location}
                onChange={(e) => setNewBooking({ ...newBooking, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Link (for virtual meetings)</Label>
              <Input 
                placeholder="https://meet.google.com/..." 
                value={newBooking.meeting_link}
                onChange={(e) => setNewBooking({ ...newBooking, meeting_link: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Additional notes..." 
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBookingDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBooking} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Appointment with {selectedBooking?.client_name}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedBooking.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedBooking.client_email}`} className="text-primary hover:underline">
                      {selectedBooking.client_email}
                    </a>
                  </div>
                  {selectedBooking.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedBooking.client_phone}`} className="text-primary hover:underline">
                        {selectedBooking.client_phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedBooking.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.scheduled_time} ({formatDuration(selectedBooking.duration_minutes)})</span>
                  </div>
                  {selectedBooking.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedBooking.meeting_link && (
                <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <a href={selectedBooking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Join Virtual Meeting
                  </a>
                </div>
              )}
              
              {selectedBooking.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedBooking?.status === 'pending' && (
              <Button 
                onClick={() => { handleUpdateStatus(selectedBooking.id, 'confirmed'); setShowDetailDialog(false); }}
              >
                <Check className="h-4 w-4 mr-2" /> Confirm Booking
              </Button>
            )}
            {selectedBooking?.status === 'confirmed' && (
              <Button 
                onClick={() => { handleUpdateStatus(selectedBooking.id, 'completed'); setShowDetailDialog(false); }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBooking}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
