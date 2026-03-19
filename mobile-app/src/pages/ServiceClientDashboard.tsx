import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Briefcase, 
  User, 
  Mail,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  LogOut,
  Bell,
  Settings,
  MessageSquare,
  ChevronRight,
  Loader2,
  Send,
  Star,
  BookOpen,
  Wallet,
  Shield,
  Palette,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Plus,
  ChevronDown,
  Eye,
  CreditCard,
  RefreshCw,
  Wrench,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
  CalendarDays,
  ChevronLeft,
  X,
  Sun,
  Moon,
  Video,
  Building2
} from "lucide-react";

const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  projects_count: number;
  status: string;
  avatar?: string;
  wallet_balance?: number;
  email_verified?: boolean;
}

interface Business {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
  email?: string;
  phone?: string;
  bank_transfer_enabled?: boolean;
  manual_payment_bank_name?: string;
  manual_payment_account_number?: string;
  manual_payment_account_name?: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  due_date: string;
  progress: number;
  description?: string;
  budget?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  items?: any[];
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: string;
  image?: string;
}

interface Message {
  id: number;
  content: string;
  sender: 'client' | 'business';
  timestamp: string;
  read: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  slug: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  date: string;
  project_name?: string;
}

interface Booking {
  id: number;
  title: string;
  service?: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration: number;
  duration_minutes?: number;
  status: string;
  notes?: string;
  meeting_type?: string;
  meeting_type_other?: string;
  meeting_link?: string;
  calendar_link?: string;
  rejection_reason?: string;
  created_at?: string;
}

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
    enabled?: boolean;
  };
}

interface ClientNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

interface BookedSlot {
  time: string;
  duration: number;
}

export default function ServiceClientDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Booking calendar states
  const [workingHours, setWorkingHours] = useState<WorkingHours>({});
  const [bookedSlots, setBookedSlots] = useState<{[date: string]: BookedSlot[]}>({});
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [meetingType, setMeetingType] = useState<string>("office_meeting");
  const [meetingTypeOther, setMeetingTypeOther] = useState("");
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  
  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  
  // Invoice payment states
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<'wallet' | 'card' | 'bank_transfer'>('wallet');
  const [bankTransferReference, setBankTransferReference] = useState('');
  const [bankTransferNotes, setBankTransferNotes] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Form states
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundingWallet, setFundingWallet] = useState(false);
  const [walletFundMethod, setWalletFundMethod] = useState<'card' | 'transfer'>('card');
  const [transferReference, setTransferReference] = useState("");
  const [walletTransactions, setWalletTransactions] = useState<Array<{
    id: number;
    type: string;
    amount: number;
    description: string;
    balance_after: number;
    created_at: string;
  }>>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceRequest, setServiceRequest] = useState({ message: "", preferred_date: "" });
  
  // Profile form states
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Security form states
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Email verification
  const [sendingVerification, setSendingVerification] = useState(false);

  // Notifications state
  const [clientNotifications, setClientNotifications] = useState<ClientNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Settings states - persist theme to localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(`client_theme_${slug}`);
    return saved === null ? true : saved === 'dark';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Toggle theme handler
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem(`client_theme_${slug}`, newMode ? 'dark' : 'light');
  };

  // Theme-aware colors
  const bgColor = darkMode ? 'bg-slate-900' : 'bg-gray-100';
  const cardBg = darkMode ? 'bg-slate-800' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-slate-400' : 'text-gray-600';
  const textSecondary = darkMode ? 'text-slate-300' : 'text-gray-700';
  const headerBg = darkMode ? 'bg-slate-800/80' : 'bg-white/80';
  const headerBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-slate-700' : 'bg-white';
  const inputBorder = darkMode ? 'border-slate-600' : 'border-gray-300';
  const inputText = darkMode ? 'text-white' : 'text-gray-900';
  const dropdownBg = darkMode ? 'bg-slate-800' : 'bg-white';
  const dropdownBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const dropdownHover = darkMode ? 'focus:bg-slate-700 focus:text-white' : 'focus:bg-gray-100 focus:text-gray-900';
  const dropdownText = darkMode ? 'text-slate-300' : 'text-gray-700';
  const tabsBg = darkMode ? 'bg-slate-800/50' : 'bg-gray-100';
  const tabActive = darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow';
  const tabInactive = darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900';

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('client_access_token');
    const storedSlug = localStorage.getItem('client_business_slug');
    
    if (!token || storedSlug !== slug) {
      navigate(`/services/${slug}/login`);
      return;
    }
    
    fetchData();
  }, [slug, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('client_access_token');
      
      // Fetch client dashboard data
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('client_access_token');
        localStorage.removeItem('client_refresh_token');
        navigate(`/services/${slug}/login`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBusiness(data.business);
        setClient(data.client);
        setProjects(data.projects || []);
        setInvoices(data.invoices || []);
        setServices(data.services || []);
        setMessages(data.messages || []);
        setBlogPosts(data.blog_posts || []);
        setReviews(data.reviews || []);
        setBookings(data.bookings || []);
      }
      
      // Fetch notifications
      loadNotifications();
      
      // Fetch booking availability (public endpoint)
      fetchAvailability();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/booking-availability/`);
      const data = await response.json();
      
      if (data.success) {
        setWorkingHours(data.working_hours || {});
        setBookedSlots(data.booked_slots || {});
        setBookingEnabled(data.business?.booking_enabled || false);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };
  
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/bookings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('client_access_token');
    localStorage.removeItem('client_refresh_token');
    localStorage.removeItem('client_business_slug');
    navigate(`/services/${slug}/login`);
  };

  // Initialize profile form when client data loads
  useEffect(() => {
    if (client) {
      setProfileForm({
        name: client.name || '',
        phone: client.phone || '',
        address: ''
      });
    }
  }, [client]);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClientNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('client_access_token');
      await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('client_access_token');
      await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-notifications/read-all/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-wallet/transactions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletTransactions(data.transactions || []);
          if (client) {
            setClient({ ...client, wallet_balance: data.wallet_balance });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fund wallet handler
  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Handle bank transfer submission separately
    if (walletFundMethod === 'transfer') {
      if (!transferReference.trim()) {
        toast({
          title: "Reference Required",
          description: "Please enter your bank transfer reference",
          variant: "destructive"
        });
        return;
      }
      
      setFundingWallet(true);
      try {
        const token = localStorage.getItem('client_access_token');
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-wallet/fund-transfer/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            amount,
            reference: transferReference.trim(),
            payment_method: 'bank_transfer'
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Transfer Submitted",
            description: "Your bank transfer has been submitted for verification. You will be notified once approved."
          });
          setFundAmount("");
          setTransferReference("");
          setShowWalletModal(false);
          // Refresh client data
          fetchData();
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to submit transfer",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit bank transfer",
          variant: "destructive"
        });
      } finally {
        setFundingWallet(false);
      }
      return;
    }

    // Handle card payment via payment gateway
    setFundingWallet(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-wallet/fund/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      
      if (data.success && data.payment_link) {
        // Redirect to payment gateway
        window.location.href = data.payment_link;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initiate payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate wallet funding",
        variant: "destructive"
      });
    } finally {
      setFundingWallet(false);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    setSavingProfile(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        // Update local client data
        if (client && data.client) {
          setClient({ ...client, ...data.client });
        }
        setShowProfileModal(false);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-change-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setShowSecurityModal(false);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Resend verification email handler
  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-resend-verification/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Verification email sent"
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive"
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Message sent successfully!" });
        setNewMessage("");
        setShowMessageModal(false);
        // Add to local messages
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: newMessage,
          sender: 'client',
          timestamp: new Date().toISOString(),
          read: true
        }]);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleServiceRequest = async () => {
    if (!selectedService) return;
    
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/service-request/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          message: serviceRequest.message,
          preferred_date: serviceRequest.preferred_date
        })
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Service request submitted!" });
        setShowServiceRequestModal(false);
        setSelectedService(null);
        setServiceRequest({ message: "", preferred_date: "" });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Request Sent",
        description: "Your service request has been sent to the business owner.",
      });
      setShowServiceRequestModal(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) return;
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/submit-review/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Thank you for your review!" });
        setShowReviewModal(false);
        setNewReview({ rating: 5, comment: "" });
        // Add to local reviews
        setReviews(prev => [...prev, {
          id: Date.now(),
          rating: newReview.rating,
          comment: newReview.comment,
          date: new Date().toISOString()
        }]);
      }
    } catch (error) {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setShowReviewModal(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Booking handlers
  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }
    
    setCreatingBooking(true);
    try {
      const token = localStorage.getItem('client_access_token');
      // Format date in local timezone (YYYY-MM-DD) to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/bookings/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_date: formattedDate,
          scheduled_time: selectedTime,
          service_id: bookingService?.id,
          title: bookingService?.name || 'Meeting',
          description: bookingNotes,
          meeting_type: meetingType,
          meeting_type_other: meetingType === 'other' ? meetingTypeOther : ''
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ 
          title: "Booking Created!", 
          description: `Your appointment is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}` 
        });
        setShowBookingModal(false);
        setSelectedDate(null);
        setSelectedTime("");
        setBookingService(null);
        setBookingNotes("");
        setMeetingType("office_meeting");
        setMeetingTypeOther("");
        fetchBookings();
        fetchAvailability();
      } else {
        throw new Error(data.error || 'Failed to create booking');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('client_access_token');
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/bookings/${bookingId}/cancel/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({ title: "Booking Cancelled", description: "Your booking has been cancelled" });
        fetchBookings();
        fetchAvailability();
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive"
      });
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDayAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = workingHours[dayName];
    
    if (!dayHours) return false;
    // Check both 'closed' (frontend convention) and 'enabled' (possible backend format)
    if (dayHours.closed === true) return false;
    if ('enabled' in dayHours && dayHours.enabled === false) return false;
    
    return true;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = workingHours[dayName];
    
    // Check both 'closed' and 'enabled' formats
    if (!dayHours || dayHours.closed === true || ('enabled' in dayHours && dayHours.enabled === false)) return [];
    
    const openTime = dayHours.open || '09:00';
    const closeTime = dayHours.close || '17:00';
    
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const slots = [];
    // Format date in local timezone (YYYY-MM-DD) to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const bookedForDay = bookedSlots[dateStr] || [];
    
    for (let hour = openHour; hour < closeHour || (hour === closeHour && 0 < closeMin); hour++) {
      for (let min = (hour === openHour ? openMin : 0); min < 60; min += 30) {
        if (hour === closeHour && min >= closeMin) break;
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const isBooked = bookedForDay.some(slot => slot.time === timeStr);
        
        if (!isBooked) {
          slots.push(timeStr);
        }
      }
    }
    
    return slots;
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoicePaymentMethod('wallet');
    setBankTransferReference('');
    setBankTransferNotes('');
    setShowPayInvoiceModal(true);
  };

  const processPayment = async (method: 'wallet' | 'card' | 'bank_transfer') => {
    if (!selectedInvoice) return;
    
    try {
      const token = localStorage.getItem('client_access_token');
      
      if (method === 'wallet') {
        // Pay with wallet
        setIsProcessingPayment(true);
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/invoices/${selectedInvoice.id}/pay/wallet/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Payment Successful",
            description: `Invoice ${selectedInvoice.invoice_number} has been paid.`,
          });
          
          // Update local data
          setInvoices(prev => prev.map(inv => 
            inv.id === selectedInvoice.id ? { ...inv, status: 'paid' } : inv
          ));
          if (client && data.wallet_balance !== undefined) {
            setClient({ ...client, wallet_balance: data.wallet_balance });
          }
          
          setShowPayInvoiceModal(false);
          setSelectedInvoice(null);
          loadNotifications();
        } else {
          toast({
            title: "Payment Failed",
            description: data.error || "Please try again or contact support.",
            variant: "destructive"
          });
        }
      } else if (method === 'card') {
        // Pay with card/Flutterwave
        setIsProcessingPayment(true);
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/invoices/${selectedInvoice.id}/pay/gateway/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.payment_link) {
          // Redirect to Flutterwave
          window.location.href = data.payment_link;
        } else {
          toast({
            title: "Payment Failed",
            description: data.error || "Failed to initialize payment.",
            variant: "destructive"
          });
        }
      } else if (method === 'bank_transfer') {
        // Submit bank transfer
        if (!bankTransferReference.trim()) {
          toast({
            title: "Reference Required",
            description: "Please enter your payment reference.",
            variant: "destructive"
          });
          return;
        }
        
        setIsProcessingPayment(true);
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/invoices/${selectedInvoice.id}/pay/bank-transfer/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference: bankTransferReference.trim(),
            amount: selectedInvoice.amount,
            notes: bankTransferNotes.trim()
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Transfer Submitted",
            description: "Your bank transfer has been submitted for approval.",
          });
          
          setShowPayInvoiceModal(false);
          setSelectedInvoice(null);
          setBankTransferReference('');
          setBankTransferNotes('');
          loadNotifications();
        } else {
          toast({
            title: "Submission Failed",
            description: data.error || "Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
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
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'overdue':
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const primaryColor = business?.primary_color || '#3b82f6';
  const secondaryColor = business?.secondary_color || '#0f172a';
  const unreadMessages = messages.filter(m => m.sender === 'business' && !m.read).length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending');

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Header */}
      <header className={`border-b ${headerBorder} ${headerBg} sticky top-0 z-50 backdrop-blur`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/services/${slug}`)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                {business?.logo ? (
                  <img 
                    src={business.logo} 
                    alt={business.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <h1 className={`font-semibold ${textColor}`}>{business?.name}</h1>
                  <p className={`text-xs ${textMuted}`}>Client Portal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu open={showNotificationsPanel} onOpenChange={setShowNotificationsPanel}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} relative`}
                  >
                    <Bell className="h-5 w-5" />
                    {clientNotifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {clientNotifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-80 max-h-96 overflow-y-auto ${dropdownBg} ${dropdownBorder}`}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className={textMuted}>Notifications</DropdownMenuLabel>
                    {clientNotifications.filter(n => !n.read).length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.preventDefault();
                          markAllNotificationsRead();
                        }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : 'bg-gray-200'} />
                  {clientNotifications.length === 0 ? (
                    <div className={`px-3 py-8 text-center ${textMuted}`}>
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    clientNotifications.slice(0, 10).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={`${dropdownText} ${dropdownHover} cursor-pointer px-3 py-3 flex-col items-start ${!notification.read ? (darkMode ? 'bg-slate-700/50' : 'bg-blue-50') : ''}`}
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          )}
                          <div className={`flex-1 ${notification.read ? 'pl-4' : ''}`}>
                            <p className={`text-sm font-medium ${textColor}`}>{notification.title}</p>
                            <p className={`text-xs ${textMuted} mt-0.5 line-clamp-2`}>{notification.message}</p>
                            <p className={`text-xs ${textMuted} mt-1`}>
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Account Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`flex items-center gap-2 ${darkMode ? 'text-slate-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={client?.avatar} />
                      <AvatarFallback style={{ backgroundColor: primaryColor }}>
                        {client?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`hidden sm:inline text-sm`}>{client?.name?.split(' ')[0]}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-56 ${dropdownBg} ${dropdownBorder}`}>
                  <DropdownMenuLabel className={textMuted}>Manage Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : 'bg-gray-200'} />
                  <DropdownMenuItem 
                    className={`${dropdownText} ${dropdownHover} cursor-pointer`}
                    onClick={() => setShowProfileModal(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={`${dropdownText} ${dropdownHover} cursor-pointer`}
                    onClick={() => {
                      setShowWalletModal(true);
                      fetchWalletTransactions();
                    }}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet
                    <span className="ml-auto text-xs text-emerald-400">
                      {formatCurrency(client?.wallet_balance || 0)}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={`${dropdownText} ${dropdownHover} cursor-pointer`}
                    onClick={() => setShowSecurityModal(true)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Security & Privacy
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={`${dropdownText} ${dropdownHover} cursor-pointer`}
                    onClick={toggleTheme}
                  >
                    {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={`${dropdownText} ${dropdownHover} cursor-pointer`}
                    onClick={() => setShowEmailVerificationModal(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email Verification
                    {client?.email_verified ? (
                      <CheckCircle className="ml-auto h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="ml-auto h-4 w-4 text-amber-400" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : 'bg-gray-200'} />
                  <DropdownMenuItem 
                    className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${textColor} mb-1`}>
            Welcome back, {client?.name?.split(' ')[0]}! 👋
          </h2>
          <p className={textMuted}>
            Manage your projects, invoices, and communications with {business?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={`${cardBg} ${cardBorder} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer`} onClick={() => setActiveTab("projects")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Briefcase className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{projects.length}</p>
                  <p className={`text-xs ${textMuted}`}>Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${cardBg} ${cardBorder} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer`} onClick={() => setActiveTab("bookings")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{bookings.length}</p>
                  <p className={`text-xs ${textMuted}`}>Schedules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${cardBg} ${cardBorder} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer`} onClick={() => setActiveTab("messages")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{messages.length}</p>
                  <p className={`text-xs ${textMuted}`}>Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${cardBg} ${cardBorder} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer`} onClick={() => setActiveTab("invoices")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{pendingInvoices.length}</p>
                  <p className={`text-xs ${textMuted}`}>Pending Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className={`${cardBg} ${cardBorder} mb-6`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${textColor} text-lg`}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setShowMessageModal(true)}
              >
                <MessageSquare className="h-5 w-5" style={{ color: primaryColor }} />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Send Message</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setActiveTab("projects")}
              >
                <Briefcase className="h-5 w-5 text-blue-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>View Projects</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setActiveTab("invoices")}
              >
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Pay Invoice</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setActiveTab("services")}
              >
                <Wrench className="h-5 w-5 text-orange-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Request Service</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setActiveTab("bookings")}
              >
                <CalendarDays className="h-5 w-5 text-purple-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Book Meeting</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex-col gap-2 ${darkMode ? 'border-slate-600 bg-slate-800/50 text-white hover:text-white hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setShowReviewModal(true)}
              >
                <Star className="h-5 w-5 text-amber-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Leave Review</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className={`border ${cardBorder} rounded-lg p-3 ${cardBg}`}>
            <TabsList className="bg-transparent border-0 p-0 h-auto flex flex-wrap gap-2 justify-start">
              <TabsTrigger value="overview" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Overview</TabsTrigger>
              <TabsTrigger value="projects" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Projects</TabsTrigger>
              <TabsTrigger value="bookings" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>
                <CalendarDays className="h-4 w-4 mr-1" />
                Book Meeting
              </TabsTrigger>
              <TabsTrigger value="invoices" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Invoices</TabsTrigger>
              <TabsTrigger value="services" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Services</TabsTrigger>
              <TabsTrigger value="messages" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Messages</TabsTrigger>
              <TabsTrigger value="blog" className={`${darkMode ? 'data-[state=active]:bg-slate-700 text-slate-300' : 'data-[state=active]:bg-slate-200 text-slate-700'} px-4 py-2 rounded-md`}>Blog</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className={`${cardBg} ${cardBorder}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={`${textColor} text-lg`}>Active Projects</CardTitle>
                    <CardDescription className={textMuted}>Your ongoing work</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("projects")} className={`${textMuted} hover:${textColor}`}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className={`h-12 w-12 mx-auto ${textMuted} mb-3`} />
                      <p className={textMuted}>No active projects</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`mt-3 ${cardBorder}`}
                        onClick={() => setActiveTab("services")}
                      >
                        Request a Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projects.slice(0, 3).map((project) => (
                        <div 
                          key={project.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}
                        >
                          <div className="flex-1">
                            <p className={`font-medium ${textColor}`}>{project.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={project.progress} className="h-1.5 flex-1 max-w-[100px]" />
                              <span className={`text-xs ${textMuted}`}>{project.progress}%</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className={`${cardBg} ${cardBorder}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={`${textColor} text-lg`}>Recent Invoices</CardTitle>
                    <CardDescription className={textMuted}>Your billing history</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("invoices")} className={`${textMuted} hover:${textColor}`}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className={`h-12 w-12 mx-auto ${textMuted} mb-3`} />
                      <p className={textMuted}>No invoices yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoices.slice(0, 3).map((invoice) => (
                        <div 
                          key={invoice.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}
                        >
                          <div>
                            <p className={`font-medium ${textColor}`}>{invoice.invoice_number}</p>
                            <p className={`text-sm ${textMuted}`}>{formatCurrency(invoice.amount)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            {invoice.status === 'pending' && (
                              <Button 
                                size="sm" 
                                style={{ backgroundColor: primaryColor }}
                                className="text-white"
                                onClick={() => handlePayInvoice(invoice)}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Messages */}
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className={`${textColor} text-lg`}>Recent Messages</CardTitle>
                  <CardDescription className={textMuted}>Communication with {business?.name}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("messages")} className={`${textMuted} hover:${textColor}`}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className={`h-12 w-12 mx-auto ${textMuted} mb-3`} />
                    <p className={textMuted}>No messages yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`mt-3 ${cardBorder}`}
                      onClick={() => setShowMessageModal(true)}
                    >
                      Start Conversation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.slice(0, 3).map((msg) => (
                      <div 
                        key={msg.id}
                        className={`p-3 rounded-lg ${msg.sender === 'client' 
                          ? (darkMode ? 'bg-slate-700/50 ml-8' : 'bg-slate-200 ml-8') 
                          : (darkMode ? 'bg-blue-500/10 mr-8' : 'bg-blue-100 mr-8')}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${textMuted}`}>
                            {msg.sender === 'client' ? 'You' : business?.name}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader>
                <CardTitle className={textColor}>All Projects</CardTitle>
                <CardDescription className={textMuted}>
                  Track progress and updates on your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                    <h3 className={`text-lg font-medium ${textColor} mb-2`}>No projects yet</h3>
                    <p className={`${textMuted} mb-4`}>Request a service to get started</p>
                    <Button 
                      style={{ backgroundColor: primaryColor }}
                      className="text-white"
                      onClick={() => setActiveTab("services")}
                    >
                      Browse Services
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card key={project.id} className={darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className={`font-medium ${textColor}`}>{project.name}</h4>
                              <p className={`text-sm ${textMuted}`}>{project.description || 'No description'}</p>
                            </div>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-4 text-sm ${textMuted}`}>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Due: {new Date(project.due_date).toLocaleDateString()}
                              </span>
                              {project.budget && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {formatCurrency(project.budget)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${textMuted}`}>{project.progress}%</span>
                              <Progress value={project.progress} className="h-2 w-24" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader>
                <CardTitle className={textColor}>Invoices</CardTitle>
                <CardDescription className={textMuted}>
                  View and pay your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                    <h3 className={`text-lg font-medium ${textColor} mb-2`}>No invoices yet</h3>
                    <p className={textMuted}>Invoices will appear here once generated</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <Card key={invoice.id} className={darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}>
                                <FileText className={`h-6 w-6 ${textMuted}`} />
                              </div>
                              <div>
                                <h4 className={`font-medium ${textColor}`}>{invoice.invoice_number}</h4>
                                <p className={`text-sm ${textMuted}`}>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`text-lg font-bold ${textColor}`}>{formatCurrency(invoice.amount)}</p>
                                <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                              </div>
                              {invoice.status === 'pending' && (
                                <Button 
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white"
                                  onClick={() => handlePayInvoice(invoice)}
                                >
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader>
                <CardTitle className={textColor}>Available Services</CardTitle>
                <CardDescription className={textMuted}>
                  Browse and request services from {business?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                    <h3 className={`text-lg font-medium ${textColor} mb-2`}>No services listed</h3>
                    <p className={textMuted}>Contact the business for available services</p>
                    <Button 
                      variant="outline" 
                      className={`mt-4 ${cardBorder}`}
                      onClick={() => setShowMessageModal(true)}
                    >
                      Send Inquiry
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <Card key={service.id} className={`overflow-hidden ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                        {service.image && (
                          <img src={service.image} alt={service.name} className="w-full h-32 object-cover" />
                        )}
                        <CardContent className="p-4">
                          <h4 className={`font-medium ${textColor} mb-1`}>{service.name}</h4>
                          <p className={`text-sm ${textMuted} mb-3 line-clamp-2`}>{service.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-500">
                              {service.price && service.price > 0 ? formatCurrency(service.price) : 'Price Varies'}
                            </span>
                            <Button 
                              size="sm" 
                              style={{ backgroundColor: primaryColor }}
                              className="text-white"
                              onClick={() => {
                                setSelectedService(service);
                                setShowServiceRequestModal(true);
                              }}
                            >
                              Request
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className={textColor}>Messages</CardTitle>
                  <CardDescription className={textMuted}>
                    Your conversation with {business?.name}
                  </CardDescription>
                </div>
                <Button 
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                  onClick={() => setShowMessageModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                      <h3 className={`text-lg font-medium ${textColor} mb-2`}>No messages yet</h3>
                      <p className={`${textMuted} mb-4`}>Start a conversation with {business?.name}</p>
                      <Button 
                        style={{ backgroundColor: primaryColor }}
                        className="text-white"
                        onClick={() => setShowMessageModal(true)}
                      >
                        Send First Message
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={`p-4 rounded-lg ${msg.sender === 'client' 
                            ? (darkMode ? 'bg-slate-700/50 ml-12' : 'bg-slate-200 ml-12') 
                            : (darkMode ? 'bg-blue-500/10 mr-12' : 'bg-blue-100 mr-12')}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={msg.sender === 'client' ? (darkMode ? 'bg-slate-600' : 'bg-slate-300') : ''} style={msg.sender !== 'client' ? { backgroundColor: primaryColor } : {}}>
                                {msg.sender === 'client' ? client?.name?.charAt(0) : business?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {msg.sender === 'client' ? 'You' : business?.name}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Tab */}
          {/* Bookings Tab - Calendly-like Calendar */}
          <TabsContent value="bookings">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <Card className={`${cardBg} ${cardBorder} lg:col-span-2`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={`${textColor} flex items-center gap-2`}>
                      <CalendarDays className="h-5 w-5" style={{ color: primaryColor }} />
                      Book a Meeting
                    </CardTitle>
                    <CardDescription className={textMuted}>
                      Select a date and time for your appointment
                    </CardDescription>
                  </div>
                  {loadingAvailability && (
                    <Loader2 className={`h-5 w-5 animate-spin ${textMuted}`} />
                  )}
                </CardHeader>
                <CardContent>
                  {!bookingEnabled ? (
                    <div className="text-center py-12">
                      <CalendarDays className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                      <h3 className={`text-lg font-medium ${textColor} mb-2`}>Online Booking Not Available</h3>
                      <p className={`${textMuted} mb-4`}>Contact {business?.name} directly to schedule an appointment</p>
                      <Button 
                        variant="outline" 
                        className={cardBorder}
                        onClick={() => setShowMessageModal(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className={`${textMuted} hover:${textColor}`}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h3 className={`text-lg font-semibold ${textColor}`}>
                          {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className={`${textMuted} hover:${textColor}`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className={`text-center text-sm font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'} py-2`}>
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days */}
                        {getDaysInMonth(calendarMonth).map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} className="h-12" />;
                          }
                          
                          const isAvailable = isDayAvailable(date);
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => isAvailable && setSelectedDate(date)}
                              disabled={!isAvailable}
                              className={`
                                h-12 rounded-lg text-sm font-medium transition-all
                                ${!isAvailable ? (darkMode ? 'text-slate-600' : 'text-slate-400') + ' cursor-not-allowed' : (darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200') + ' cursor-pointer ' + textColor}
                                ${isToday && !isSelected ? (darkMode ? 'bg-slate-700/50' : 'bg-slate-200') : ''}
                              `}
                              style={{
                                backgroundColor: isSelected ? primaryColor : undefined,
                                color: isSelected ? '#fff' : undefined,
                                outline: isSelected ? `2px solid ${primaryColor}` : undefined,
                                outlineOffset: '2px'
                              }}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className={`space-y-3 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <h4 className={`font-medium ${textColor}`}>
                            Available times for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {getAvailableTimeSlots(selectedDate).map(time => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`
                                  py-2 px-3 rounded-lg text-sm font-medium transition-all
                                  ${selectedTime === time 
                                    ? 'text-white' 
                                    : (darkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')}
                                `}
                                style={{
                                  backgroundColor: selectedTime === time ? primaryColor : undefined
                                }}
                              >
                                {formatTime12Hour(time)}
                              </button>
                            ))}
                          </div>
                          
                          {getAvailableTimeSlots(selectedDate).length === 0 && (
                            <p className={`${textMuted} text-sm`}>No available times for this date</p>
                          )}
                        </div>
                      )}

                      {/* Confirm Booking */}
                      {selectedDate && selectedTime && (
                        <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <p className={`${textColor} font-medium`}>
                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </p>
                              <p className={textMuted}>{formatTime12Hour(selectedTime)}</p>
                            </div>
                            <Button 
                              style={{ backgroundColor: primaryColor }}
                              className="text-white"
                              onClick={() => setShowBookingModal(true)}
                            >
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Confirm Booking
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Bookings Sidebar */}
              <Card className={`${cardBg} ${cardBorder}`}>
                <CardHeader>
                  <CardTitle className={`${textColor} text-lg`}>My Bookings</CardTitle>
                  <CardDescription className={textMuted}>
                    Your upcoming appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarDays className={`h-12 w-12 mx-auto ${textMuted} mb-3`} />
                      <p className={`${textMuted} text-sm`}>No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'} border`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`font-medium ${textColor} text-sm`}>{booking.service || booking.title}</p>
                              <p className={`text-xs ${textMuted} mt-1`}>
                                {new Date(booking.scheduled_date).toLocaleDateString('en-US', { 
                                  weekday: 'short', month: 'short', day: 'numeric' 
                                })}
                                {booking.scheduled_time && ` at ${formatTime12Hour(booking.scheduled_time)}`}
                              </p>
                              {booking.meeting_type && (
                                <p className={`text-xs ${textMuted} mt-0.5`}>
                                  {booking.meeting_type === 'google_meet' ? '📹 Google Meet' : 
                                   booking.meeting_type === 'whatsapp_call' ? '📞 WhatsApp Call' : 
                                   booking.meeting_type === 'office_meeting' ? '🏢 Office Meeting' : 
                                   `📍 ${booking.meeting_type_other || 'Other'}`}
                                </p>
                              )}
                            </div>
                            <Badge className={getStatusColor(booking.status)} style={{ fontSize: '0.65rem' }}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {booking.calendar_link && (
                              <a 
                                href={booking.calendar_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} transition-colors`}
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
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-green-100 text-green-600 hover:bg-green-200'} transition-colors`}
                              >
                                <Video className="h-3 w-3" />
                                Join Meeting
                              </a>
                            )}
                            {booking.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 px-2 text-xs"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="blog">
            <Card className={`${cardBg} ${cardBorder}`}>
              <CardHeader>
                <CardTitle className={textColor}>Blog & Updates</CardTitle>
                <CardDescription className={textMuted}>
                  Latest posts from {business?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blogPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
                    <h3 className={`text-lg font-medium ${textColor} mb-2`}>No blog posts yet</h3>
                    <p className={textMuted}>Check back later for updates and articles</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blogPosts.map((post) => (
                      <Card key={post.id} className={`overflow-hidden cursor-pointer transition-colors ${darkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
                        {post.image && (
                          <img src={post.image} alt={post.title} className="w-full h-32 object-cover" />
                        )}
                        <CardContent className="p-4">
                          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'} mb-2`}>{new Date(post.date).toLocaleDateString()}</p>
                          <h4 className={`font-medium ${textColor} mb-2`}>{post.title}</h4>
                          <p className={`text-sm ${textMuted} line-clamp-2`}>{post.excerpt}</p>
                          <Button variant="link" className="p-0 mt-2 text-sm" style={{ color: primaryColor }}>
                            Read More <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Send Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Send Message</DialogTitle>
            <DialogDescription className={textMuted}>
              Send a message to {business?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={textMuted}>Message</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor} min-h-[120px]`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={sendingMessage || !newMessage.trim()}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Request Modal */}
      <Dialog open={showServiceRequestModal} onOpenChange={setShowServiceRequestModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Request Service</DialogTitle>
            <DialogDescription className={textMuted}>
              {selectedService?.name} - {selectedService && formatCurrency(selectedService.price)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Preferred Date</Label>
              <Input
                type="date"
                value={serviceRequest.preferred_date}
                onChange={(e) => setServiceRequest({...serviceRequest, preferred_date: e.target.value})}
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
              />
            </div>
            <div>
              <Label className={textMuted}>Additional Details</Label>
              <Textarea
                value={serviceRequest.message}
                onChange={(e) => setServiceRequest({...serviceRequest, message: e.target.value})}
                placeholder="Any specific requirements or questions..."
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor} min-h-[100px]`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceRequestModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button onClick={handleServiceRequest} style={{ backgroundColor: primaryColor }} className="text-white">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Leave a Review</DialogTitle>
            <DialogDescription className={textMuted}>
              Share your experience with {business?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={textMuted}>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({...newReview, rating: star})}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 transition-colors ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : (darkMode ? 'text-slate-600' : 'text-slate-300')}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className={textMuted}>Your Review</Label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Tell us about your experience..."
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor} min-h-[100px]`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={submittingReview || !newReview.comment.trim()}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Invoice Modal */}
      <Dialog open={showPayInvoiceModal} onOpenChange={setShowPayInvoiceModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor} max-w-md`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Pay Invoice</DialogTitle>
            <DialogDescription className={textMuted}>
              Invoice: {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className={`text-3xl font-bold ${textColor}`}>{selectedInvoice && formatCurrency(selectedInvoice.amount)}</p>
              <p className={`text-sm ${textMuted} mt-1`}>Amount Due</p>
            </div>
            
            {/* Payment Method Selection */}
            <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(51,65,85,0.5)' : 'rgba(243,244,246,1)' }}>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  invoicePaymentMethod === 'wallet' 
                    ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow') 
                    : (darkMode ? 'text-slate-400' : 'text-gray-600')
                }`}
                onClick={() => setInvoicePaymentMethod('wallet')}
              >
                Wallet
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  invoicePaymentMethod === 'card' 
                    ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow') 
                    : (darkMode ? 'text-slate-400' : 'text-gray-600')
                }`}
                onClick={() => setInvoicePaymentMethod('card')}
              >
                Card
              </button>
              {business?.bank_transfer_enabled && (
                <button
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    invoicePaymentMethod === 'bank_transfer' 
                      ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow') 
                      : (darkMode ? 'text-slate-400' : 'text-gray-600')
                  }`}
                  onClick={() => setInvoicePaymentMethod('bank_transfer')}
                >
                  Bank Transfer
                </button>
              )}
            </div>
            
            {/* Wallet Payment */}
            {invoicePaymentMethod === 'wallet' && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className={`font-medium ${textColor}`}>Pay with Wallet</p>
                    <p className={`text-xs ${textMuted}`}>Balance: {formatCurrency(client?.wallet_balance || 0)}</p>
                  </div>
                </div>
                {(client?.wallet_balance || 0) < (selectedInvoice?.amount || 0) && (
                  <p className="text-xs text-red-400 mt-2">Insufficient wallet balance</p>
                )}
              </div>
            )}
            
            {/* Card Payment */}
            {invoicePaymentMethod === 'card' && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className={`font-medium ${textColor}`}>Pay with Card</p>
                    <p className={`text-xs ${textMuted}`}>You'll be redirected to our secure payment partner</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bank Transfer */}
            {invoicePaymentMethod === 'bank_transfer' && business?.bank_transfer_enabled && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium ${textColor} mb-2`}>Transfer to:</p>
                  <div className="space-y-1 text-sm">
                    <p className={textMuted}>Bank: <span className={textColor}>{business.manual_payment_bank_name || 'Not set'}</span></p>
                    <p className={textMuted}>Account: <span className={textColor}>{business.manual_payment_account_number || 'Not set'}</span></p>
                    <p className={textMuted}>Name: <span className={textColor}>{business.manual_payment_account_name || 'Not set'}</span></p>
                  </div>
                </div>
                <div>
                  <Label className={textMuted}>Payment Reference *</Label>
                  <Input 
                    placeholder="Enter your transfer reference"
                    value={bankTransferReference}
                    onChange={(e) => setBankTransferReference(e.target.value)}
                    className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </div>
                <div>
                  <Label className={textMuted}>Notes (Optional)</Label>
                  <Textarea 
                    placeholder="Any additional information"
                    value={bankTransferNotes}
                    onChange={(e) => setBankTransferNotes(e.target.value)}
                    className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                    rows={2}
                  />
                </div>
                <p className={`text-xs ${textMuted}`}>
                  After transferring, enter your payment reference above. The business will verify and approve your payment.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayInvoiceModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button 
              onClick={() => processPayment(invoicePaymentMethod)}
              disabled={isProcessingPayment || (invoicePaymentMethod === 'wallet' && (client?.wallet_balance || 0) < (selectedInvoice?.amount || 0)) || (invoicePaymentMethod === 'bank_transfer' && !bankTransferReference.trim())}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {isProcessingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {invoicePaymentMethod === 'bank_transfer' ? 'Submit Transfer' : 'Pay Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={client?.avatar} />
                  <AvatarFallback style={{ backgroundColor: primaryColor }} className="text-2xl text-white">
                    {client?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className={`absolute bottom-0 right-0 p-2 rounded-full ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>
                  <Camera className={`h-4 w-4 ${textColor}`} />
                </button>
              </div>
            </div>
            <div>
              <Label className={textMuted}>Name</Label>
              <Input 
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`} 
              />
            </div>
            <div>
              <Label className={textMuted}>Email</Label>
              <Input defaultValue={client?.email} className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`} disabled />
            </div>
            <div>
              <Label className={textMuted}>Phone</Label>
              <Input 
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button 
              style={{ backgroundColor: primaryColor }} 
              className="text-white"
              onClick={handleUpdateProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Confirm Your Booking</DialogTitle>
            <DialogDescription className={textMuted}>
              Review and confirm your appointment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date & Time Summary */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'} border`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <CalendarDays className="h-6 w-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className={`font-medium ${textColor}`}>
                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className={textMuted}>{selectedTime && formatTime12Hour(selectedTime)}</p>
                </div>
              </div>
            </div>
            
            {/* Service Selection (Optional) */}
            <div>
              <Label className={textMuted}>Service (Optional)</Label>
              <select
                value={bookingService?.id || ''}
                onChange={(e) => {
                  const service = services.find(s => s.id === Number(e.target.value));
                  setBookingService(service || null);
                }}
                className={`mt-1 w-full ${inputBg} border ${inputBorder} ${textColor} rounded-md px-3 py-2`}
              >
                <option value="">General Meeting</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} {service.price && service.price > 0 ? `- ${formatCurrency(service.price)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Meeting Type */}
            <div>
              <Label className={textMuted}>How would you like to meet?</Label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className={`mt-1 w-full ${inputBg} border ${inputBorder} ${textColor} rounded-md px-3 py-2`}
              >
                <option value="office_meeting">Office Meeting (In-Person)</option>
                <option value="google_meet">Google Meet (Video Call)</option>
                <option value="whatsapp_call">WhatsApp Call</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Meeting Type Other Explanation */}
            {meetingType === 'other' && (
              <div>
                <Label className={textMuted}>Please explain how you'd like to meet</Label>
                <Input
                  value={meetingTypeOther}
                  onChange={(e) => setMeetingTypeOther(e.target.value)}
                  placeholder="E.g., Zoom call, Phone call, etc."
                  className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                />
              </div>
            )}
            
            {/* Notes */}
            <div>
              <Label className={textMuted}>Notes (Optional)</Label>
              <Textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any specific topics or requirements for the meeting..."
                className={`mt-1 ${inputBg} ${inputBorder} ${textColor} min-h-[80px]`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBookingModal(false)} 
              className={cardBorder}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBooking}
              disabled={creatingBooking}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {creatingBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className={`${cardBg} ${cardBorder} max-w-md max-h-[90vh] flex flex-col`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Wallet</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            <div className="space-y-4 pb-4">
              <div className="text-center py-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Current Balance</p>
                <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(client?.wallet_balance || 0)}</p>
              </div>
              
              {/* Fund Wallet Section */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Fund Your Wallet</Label>
                <div className="mt-2 space-y-3">
                  <Input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Enter amount"
                    className={`${inputBg} ${inputBorder} ${darkMode ? 'text-white placeholder:text-gray-400' : 'text-gray-900'}`}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 5000, 10000, 20000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setFundAmount(amount.toString())}
                      >
                        ₦{amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xs`}>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={walletFundMethod === 'card' ? 'default' : 'outline'}
                        size="sm"
                        className={walletFundMethod === 'card' ? '' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}
                        onClick={() => setWalletFundMethod('card')}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Card
                      </Button>
                      <Button
                        type="button"
                        variant={walletFundMethod === 'transfer' ? 'default' : 'outline'}
                        size="sm"
                        className={walletFundMethod === 'transfer' ? '' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}
                        onClick={() => setWalletFundMethod('transfer')}
                      >
                        <Building2 className="h-4 w-4 mr-1" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                  
                  {walletFundMethod === 'transfer' && (
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-600/50' : 'bg-gray-100'} space-y-3`}>
                      <p className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Bank Transfer Details</p>
                      <div className="space-y-1 text-xs">
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}><span className="font-medium">Bank:</span> {business?.manual_payment_bank_name || 'Wema Bank'}</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}><span className="font-medium">Account:</span> {business?.manual_payment_account_number || '7824301527'}</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}><span className="font-medium">Name:</span> {business?.manual_payment_account_name || business?.name || 'Business Account'}</p>
                      </div>
                      <div className="pt-2 border-t border-dashed ${darkMode ? 'border-slate-500' : 'border-gray-300'}">
                        <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xs`}>Payment Reference</Label>
                        <Input
                          type="text"
                          value={transferReference}
                          onChange={(e) => setTransferReference(e.target.value)}
                          placeholder="Enter your transfer reference"
                          className={`mt-1 ${inputBg} ${inputBorder} ${darkMode ? 'text-white placeholder:text-gray-400' : 'text-gray-900'}`}
                        />
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        Enter your bank transfer reference after making payment.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    style={{ backgroundColor: primaryColor }} 
                    className="w-full text-white" 
                    disabled={!fundAmount || fundingWallet || (walletFundMethod === 'transfer' && !transferReference)}
                    onClick={handleFundWallet}
                  >
                    {fundingWallet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                    {walletFundMethod === 'transfer' ? 'Submit Transfer' : 'Fund via Card'}
                  </Button>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                    A platform fee of ₦50 will be added to your payment
                  </p>
                </div>
              </div>
              
              {/* Recent Transactions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Recent Transactions</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    onClick={fetchWalletTransactions}
                    disabled={loadingTransactions}
                  >
                    {loadingTransactions ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className={`h-6 w-6 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  ) : walletTransactions.length === 0 ? (
                    <p className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No transactions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {walletTransactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-slate-700/30' : 'bg-gray-100'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                              {tx.type === 'credit' ? (
                                <Plus className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <DollarSign className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tx.description.substring(0, 25)}...</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(tx.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}">
            <Button variant="outline" onClick={() => setShowWalletModal(false)} className={`${cardBorder} ${darkMode ? 'text-white' : ''}`}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security & Privacy Modal */}
      <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Security & Privacy</DialogTitle>
            <DialogDescription className={textMuted}>
              Manage your account security settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-3 ${textColor}`}>Change Password</h4>
              <div className="space-y-3">
                <div>
                  <Label className={textMuted}>Current Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </div>
                <div>
                  <Label className={textMuted}>New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Enter new password"
                    className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </div>
                <div>
                  <Label className={textMuted}>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    className={`mt-1 ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecurityModal(false)} className={cardBorder}>
              Cancel
            </Button>
            <Button 
              style={{ backgroundColor: primaryColor }} 
              className="text-white"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Verification Modal */}
      <Dialog open={showEmailVerificationModal} onOpenChange={setShowEmailVerificationModal}>
        <DialogContent className={`${cardBg} ${cardBorder} ${textColor}`}>
          <DialogHeader>
            <DialogTitle className={textColor}>Email Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center py-4">
            {client?.email_verified ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className={`font-medium ${textColor}`}>Email Verified</h4>
                  <p className={`text-sm ${textMuted}`}>
                    Your email address ({client?.email}) has been verified.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h4 className={`font-medium ${textColor}`}>Email Not Verified</h4>
                  <p className={`text-sm ${textMuted}`}>
                    Please verify your email address ({client?.email}) to access all features.
                  </p>
                </div>
                <Button 
                  style={{ backgroundColor: primaryColor }} 
                  className="text-white"
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Verification Email
                </Button>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailVerificationModal(false)} className={cardBorder}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
