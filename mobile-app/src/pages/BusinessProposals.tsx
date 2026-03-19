import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, getBaseUrl } from "@/lib/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Send,
  Download,
  Copy,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Building2,
  Mail,
  Phone,
  Loader2,
  Filter,
  ChevronRight,
  ExternalLink,
  Image
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ProposalItem {
  id?: number;
  service_id?: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  is_optional: boolean;
  order: number;
}

interface PaymentMilestone {
  milestone: string;
  percentage: number;
  amount: number;
  due_date: string;
  description: string;
}

interface Proposal {
  id: number;
  proposal_number: string;
  title: string;
  summary: string;
  introduction: string;
  scope_of_work: string;
  deliverables: string;
  timeline: string;
  terms_conditions: string;
  payment_schedule: PaymentMilestone[];
  
  client_id: number | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_address: string;
  
  inquiry_id: number | null;
  booking_id: number | null;
  
  status: string;
  status_display: string;
  valid_until: string | null;
  is_expired: boolean;
  
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  is_template: boolean;
  template_name: string;
  
  include_logo: boolean;
  include_signature: boolean;
  custom_header: string;
  custom_footer: string;
  
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string;
  
  internal_notes: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  items?: ProposalItem[];
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-purple-100 text-purple-700", icon: Eye },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expired", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  revised: { label: "Revised", color: "bg-yellow-100 text-yellow-700", icon: Edit },
};

const formatCurrency = (value: number, currency = "NGN") => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const emptyProposal = {
  title: "",
  summary: "",
  introduction: "",
  scope_of_work: "",
  deliverables: "",
  timeline: "",
  terms_conditions: "",
  client_id: null as number | null,
  client_name: "",
  client_email: "",
  client_phone: "",
  client_company: "",
  client_address: "",
  valid_until: "",
  discount_percent: 0,
  tax_percent: 0,
  currency: "NGN",
  is_template: false,
  template_name: "",
  include_logo: true,
  include_signature: true,
  custom_header: "",
  custom_footer: "",
  internal_notes: "",
  items: [] as ProposalItem[],
  payment_schedule: [] as PaymentMilestone[],
};

export default function BusinessProposals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<Proposal[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("proposals");
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfTemplateStyle, setPdfTemplateStyle] = useState<'beautiful' | 'simple'>('beautiful');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // PDF generation states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [proposalHtml, setProposalHtml] = useState<string>("");
  const proposalPreviewRef = useRef<HTMLDivElement>(null);
  
  // Form data
  const [formData, setFormData] = useState(emptyProposal);

  useEffect(() => {
    fetchProposals();
    fetchServices();
    fetchClients();
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    if (activeTab === "templates") {
      fetchTemplates();
    }
  }, [activeTab]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await apiGet(`business/proposals/?${params.toString()}`);
      setProposals(response.results || []);
      setTotalCount(response.total || 0);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      if (error.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This feature is only available for service-based businesses",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiGet("business/proposals/templates/");
      setTemplates(response.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await apiGet("business/services/");
      setServices(response.results || response || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiGet("business/service-clients/");
      setClients(response.clients || response.results || response || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleClientSelect = (clientId: string) => {
    if (clientId === "new") {
      // Clear form for new client entry
      setFormData(prev => ({
        ...prev,
        client_id: null,
        client_name: "",
        client_email: "",
        client_phone: "",
        client_company: "",
        client_address: "",
      }));
      return;
    }
    
    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: client.id,
        client_name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
        client_email: client.email || "",
        client_phone: client.phone || client.phone_number || "",
        client_company: client.company || client.company_name || "",
        client_address: client.address || "",
      }));
    }
  };

  const fetchProposalDetail = async (id: number) => {
    try {
      const response = await apiGet(`business/proposals/${id}/`);
      setSelectedProposal(response);
      return response;
    } catch (error) {
      console.error("Error fetching proposal:", error);
      return null;
    }
  };

  const handleCreateProposal = async () => {
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        items: formData.items.map((item, index) => ({
          ...item,
          order: index,
        })),
      };
      
      const response = await apiPost("business/proposals/create/", payload);
      
      toast({
        title: "Proposal Created",
        description: `${response.proposal.proposal_number} has been created successfully.`,
      });
      
      setShowCreateDialog(false);
      setFormData(emptyProposal);
      setCurrentStep(1);
      fetchProposals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create proposal",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProposal = async () => {
    if (!selectedProposal) return;
    
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        items: formData.items.map((item, index) => ({
          ...item,
          order: index,
        })),
      };
      
      await apiPut(`business/proposals/${selectedProposal.id}/`, payload);
      
      toast({
        title: "Proposal Updated",
        description: "The proposal has been updated successfully.",
      });
      
      setShowCreateDialog(false);
      setSelectedProposal(null);
      setFormData(emptyProposal);
      setCurrentStep(1);
      fetchProposals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update proposal",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProposal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    
    try {
      await apiDelete(`business/proposals/${id}/`);
      toast({
        title: "Proposal Deleted",
        description: "The proposal has been deleted.",
      });
      fetchProposals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete proposal",
      });
    }
  };

  const handleSendProposal = async (id: number) => {
    try {
      await apiPost(`business/proposals/${id}/send/`, {});
      toast({
        title: "Proposal Sent",
        description: "The proposal has been marked as sent.",
      });
      fetchProposals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send proposal",
      });
    }
  };

  const handleDuplicateProposal = async (id: number) => {
    try {
      const response = await apiPost(`business/proposals/${id}/duplicate/`, {});
      toast({
        title: "Proposal Duplicated",
        description: `Created ${response.proposal.proposal_number}`,
      });
      fetchProposals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to duplicate proposal",
      });
    }
  };

  // Fetch proposal HTML and generate PDF using jspdf + html2canvas
  const handleGeneratePDF = async (proposal: Proposal, style: 'beautiful' | 'simple', asImage = false) => {
    try {
      setIsGeneratingPdf(true);
      toast({ title: asImage ? "Generating Image" : "Generating PDF", description: "Please wait..." });
      
      const baseUrl = getBaseUrl();
      const token = localStorage.getItem('accessToken');
      
      // Fetch HTML from backend
      const response = await fetch(`${baseUrl}business/proposals/${proposal.id}/pdf/?token=${token}&style=${style}`);
      if (!response.ok) throw new Error('Failed to fetch proposal');
      const html = await response.text();
      
      // Create an iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe');
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture the content
      const element = iframeDoc.body;
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(4, pixelRatio * 2);
      
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794, // A4 width in px at 96dpi
        windowHeight: 1123, // A4 height in px at 96dpi
      });
      
      // Remove iframe
      document.body.removeChild(iframe);
      
      if (asImage) {
        // Download as JPEG
        const link = document.createElement('a');
        link.download = `${proposal.proposal_number}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
        toast({ title: "Download Complete", description: "Proposal saved as image" });
      } else {
        // Generate PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const pdfWidth = 210;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        
        const pdf = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: pdfHeight > 297 ? [pdfWidth, pdfHeight] : 'a4',
          compress: false,
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
        pdf.save(`${proposal.proposal_number}.pdf`);
        toast({ title: "Download Complete", description: "Proposal saved as PDF" });
      }
      
      setShowPdfDialog(false);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to generate PDF" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // View proposal HTML in new window
  const handleViewProposal = (proposal: Proposal, style: 'beautiful' | 'simple') => {
    const baseUrl = getBaseUrl();
    const token = localStorage.getItem('accessToken');
    window.open(`${baseUrl}business/proposals/${proposal.id}/pdf/?token=${token}&style=${style}`, "_blank");
  };

  const openEditDialog = async (proposal: Proposal) => {
    const details = await fetchProposalDetail(proposal.id);
    if (details) {
      setFormData({
        title: details.title || "",
        summary: details.summary || "",
        introduction: details.introduction || "",
        scope_of_work: details.scope_of_work || "",
        deliverables: details.deliverables || "",
        timeline: details.timeline || "",
        terms_conditions: details.terms_conditions || "",
        client_id: details.client_id || null,
        client_name: details.client_name || "",
        client_email: details.client_email || "",
        client_phone: details.client_phone || "",
        client_company: details.client_company || "",
        client_address: details.client_address || "",
        valid_until: details.valid_until || "",
        discount_percent: details.discount_percent || 0,
        tax_percent: details.tax_percent || 0,
        currency: details.currency || "NGN",
        is_template: details.is_template || false,
        template_name: details.template_name || "",
        include_logo: details.include_logo ?? true,
        include_signature: details.include_signature ?? true,
        custom_header: details.custom_header || "",
        custom_footer: details.custom_footer || "",
        internal_notes: details.internal_notes || "",
        items: details.items || [],
        payment_schedule: details.payment_schedule || [],
      });
      setSelectedProposal(details);
      setShowCreateDialog(true);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unit: "unit",
          unit_price: 0,
          total_price: 0,
          is_optional: false,
          order: prev.items.length,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate total_price
      if (field === "quantity" || field === "unit_price") {
        newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addServiceAsItem = (service: Service) => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          service_id: service.id,
          name: service.name,
          description: service.description || "",
          quantity: 1,
          unit: "service",
          unit_price: service.price || 0,
          total_price: service.price || 0,
          is_optional: false,
          order: prev.items.length,
        },
      ],
    }));
  };

  const calculateSubtotal = () => {
    return formData.items
      .filter(item => !item.is_optional)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = (subtotal * formData.discount_percent) / 100;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * formData.tax_percent) / 100;
    return afterDiscount + tax;
  };

  // Payment schedule functions
  const addPaymentMilestone = () => {
    const total = calculateTotal();
    const remainingPercent = 100 - formData.payment_schedule.reduce((sum, m) => sum + m.percentage, 0);
    setFormData(prev => ({
      ...prev,
      payment_schedule: [
        ...prev.payment_schedule,
        {
          milestone: `Milestone ${prev.payment_schedule.length + 1}`,
          percentage: Math.min(remainingPercent, 25),
          amount: (total * Math.min(remainingPercent, 25)) / 100,
          due_date: "",
          description: "",
        },
      ],
    }));
  };

  const updatePaymentMilestone = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSchedule = [...prev.payment_schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      
      // Recalculate amount when percentage changes
      if (field === "percentage") {
        const total = calculateTotal();
        newSchedule[index].amount = (total * value) / 100;
      }
      
      return { ...prev, payment_schedule: newSchedule };
    });
  };

  const removePaymentMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payment_schedule: prev.payment_schedule.filter((_, i) => i !== index),
    }));
  };

  const useTemplate = (template: Proposal) => {
    setFormData({
      title: `${template.title} - New`,
      summary: template.summary || "",
      introduction: template.introduction || "",
      scope_of_work: template.scope_of_work || "",
      deliverables: template.deliverables || "",
      timeline: template.timeline || "",
      terms_conditions: template.terms_conditions || "",
      client_id: null,
      client_name: "",
      client_email: "",
      client_phone: "",
      client_company: "",
      client_address: "",
      valid_until: "",
      discount_percent: template.discount_percent || 0,
      tax_percent: template.tax_percent || 0,
      currency: template.currency || "NGN",
      is_template: false,
      template_name: "",
      include_logo: template.include_logo ?? true,
      include_signature: template.include_signature ?? true,
      custom_header: template.custom_header || "",
      custom_footer: template.custom_footer || "",
      internal_notes: "",
      items: template.items?.map(item => ({ ...item, id: undefined })) || [],
      payment_schedule: template.payment_schedule?.map(m => ({ ...m })) || [],
    });
    setActiveTab("proposals");
    setShowCreateDialog(true);
  };

  const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
    const statusInfo = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-muted-foreground">
                  {proposal.proposal_number}
                </span>
                <Badge className={cn("text-xs", statusInfo.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                {proposal.is_expired && (
                  <Badge variant="destructive" className="text-xs">Expired</Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg truncate">{proposal.title}</h3>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {proposal.client_name || "No client"}
                </span>
                {proposal.client_company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {proposal.client_company}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-lg">
                  {formatCurrency(proposal.total_amount, proposal.currency)}
                </span>
                {proposal.valid_until && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Valid until {format(parseISO(proposal.valid_until), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  fetchProposalDetail(proposal.id);
                  setShowViewDialog(true);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(proposal)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedProposal(proposal);
                  setShowPdfDialog(true);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Options
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {proposal.status === "draft" && proposal.client_email && (
                  <DropdownMenuItem onClick={() => handleSendProposal(proposal.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDuplicateProposal(proposal.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteProposal(proposal.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && proposals.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Business Proposals
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and manage client proposals
              </p>
            </div>
          </div>
          <Button onClick={() => {
            setFormData(emptyProposal);
            setSelectedProposal(null);
            setCurrentStep(1);
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="proposals">Proposals ({totalCount})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proposals List */}
            {proposals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first proposal to get started
                  </p>
                  <Button onClick={() => {
                    setFormData(emptyProposal);
                    setSelectedProposal(null);
                    setShowCreateDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {proposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Save proposals as templates for quick reuse
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => useTemplate(template)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{template.template_name || "Template"}</p>
                          <h3 className="font-semibold">{template.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.items?.length || 0} items • {formatCurrency(template.total_amount)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setFormData(emptyProposal);
          setSelectedProposal(null);
          setCurrentStep(1);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProposal ? "Edit Proposal" : "Create New Proposal"}
            </DialogTitle>
            <DialogDescription>
              Step {currentStep} of 4
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center gap-2">
                <Button
                  variant={currentStep === step ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setCurrentStep(step)}
                >
                  {step}
                </Button>
                {step < 4 && <div className="w-8 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>

          {/* Step 1: Client Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Client Information</h3>
              
              {/* Client Selector */}
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Existing Client (Optional)</Label>
                  <Select 
                    value={formData.client_id?.toString() || "new"}
                    onValueChange={handleClientSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client or enter new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Enter New Client
                        </span>
                      </SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          <div className="flex flex-col">
                            <span>{client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim()}</span>
                            {client.email && (
                              <span className="text-xs text-muted-foreground">{client.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.client_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_company: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+234..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.client_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
                  placeholder="Client address"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Proposal Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Proposal Details</h3>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Website Development Proposal"
                />
              </div>
              <div className="space-y-2">
                <Label>Executive Summary</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief summary of the proposal..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Scope of Work</Label>
                <Textarea
                  value={formData.scope_of_work}
                  onChange={(e) => setFormData(prev => ({ ...prev, scope_of_work: e.target.value }))}
                  placeholder="Detailed description of work to be done..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Deliverables</Label>
                <Textarea
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="List of deliverables..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Textarea
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder="Project timeline and milestones..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 3: Line Items */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Services & Pricing</h3>
                <div className="flex gap-2">
                  {services.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Add Service
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {services.slice(0, 10).map(service => (
                          <DropdownMenuItem 
                            key={service.id}
                            onClick={() => addServiceAsItem(service)}
                          >
                            {service.name} - {formatCurrency(service.price)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Custom Item
                  </Button>
                </div>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items added yet. Add services or custom items.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <Card key={index} className={item.is_optional ? "border-dashed" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(index, "name", e.target.value)}
                                placeholder="Item name"
                              />
                              <Input
                                value={item.description}
                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                placeholder="Description"
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                placeholder="Qty"
                              />
                              <Input
                                value={item.unit}
                                onChange={(e) => updateItem(index, "unit", e.target.value)}
                                placeholder="Unit"
                              />
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                                placeholder="Unit Price"
                              />
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {formatCurrency(item.quantity * item.unit_price)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.is_optional}
                                onCheckedChange={(v) => updateItem(index, "is_optional", v)}
                              />
                              <Label className="text-sm">Optional add-on</Label>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-32">Discount %</Label>
                      <Input
                        type="number"
                        className="w-24"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                      />
                      <span className="text-muted-foreground">
                        -{formatCurrency((calculateSubtotal() * formData.discount_percent) / 100)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-32">Tax %</Label>
                      <Input
                        type="number"
                        className="w-24"
                        value={formData.tax_percent}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_percent: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Settings & Terms</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                  placeholder="Payment terms, conditions, etc."
                  rows={4}
                />
              </div>

              {/* Payment Schedule */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Payment Schedule</Label>
                  <Button variant="outline" size="sm" onClick={addPaymentMilestone}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>
                
                {formData.payment_schedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payment milestones. Add milestones to define payment schedule.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.payment_schedule.map((milestone, index) => (
                      <Card key={index} className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input
                            value={milestone.milestone}
                            onChange={(e) => updatePaymentMilestone(index, "milestone", e.target.value)}
                            placeholder="Milestone name"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20"
                              value={milestone.percentage}
                              onChange={(e) => updatePaymentMilestone(index, "percentage", parseFloat(e.target.value) || 0)}
                              placeholder="%"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                            <span className="text-sm font-medium">
                              = {formatCurrency(milestone.amount)}
                            </span>
                          </div>
                          <Input
                            type="date"
                            value={milestone.due_date}
                            onChange={(e) => updatePaymentMilestone(index, "due_date", e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              value={milestone.description}
                              onChange={(e) => updatePaymentMilestone(index, "description", e.target.value)}
                              placeholder="Description"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaymentMilestone(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total: {formData.payment_schedule.reduce((sum, m) => sum + m.percentage, 0)}% of {formatCurrency(calculateTotal())}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Internal Notes (not visible to client)</Label>
                <Textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                  placeholder="Notes for your reference..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.include_logo}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, include_logo: v }))}
                  />
                  <Label>Include Logo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.include_signature}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, include_signature: v }))}
                  />
                  <Label>Include Signature</Label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Switch
                  checked={formData.is_template}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_template: v }))}
                />
                <Label>Save as Template</Label>
              </div>
              {formData.is_template && (
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="Template name"
                />
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button onClick={() => setCurrentStep(s => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={selectedProposal ? handleUpdateProposal : handleCreateProposal}
                  disabled={saving || !formData.title || !formData.client_name}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedProposal ? "Update Proposal" : "Create Proposal"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedProposal?.proposal_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge className={STATUS_CONFIG[selectedProposal.status]?.color || ""}>
                  {selectedProposal.status_display}
                </Badge>
                {selectedProposal.is_expired && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {selectedProposal.sent_at && (
                  <span className="text-sm text-muted-foreground">
                    Sent: {format(parseISO(selectedProposal.sent_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {/* Title and Client */}
              <div>
                <h2 className="text-xl font-bold">{selectedProposal.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedProposal.client_name}
                  </span>
                  {selectedProposal.client_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedProposal.client_email}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {selectedProposal.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedProposal.summary}</p>
                </div>
              )}

              {/* Scope of Work */}
              {selectedProposal.scope_of_work && (
                <div>
                  <h3 className="font-semibold mb-2">Scope of Work</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedProposal.scope_of_work}</p>
                </div>
              )}

              {/* Deliverables */}
              {selectedProposal.deliverables && (
                <div>
                  <h3 className="font-semibold mb-2">Deliverables</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedProposal.deliverables}</p>
                </div>
              )}

              {/* Timeline */}
              {selectedProposal.timeline && (
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedProposal.timeline}</p>
                </div>
              )}

              {/* Items */}
              {selectedProposal.items && selectedProposal.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Services & Pricing</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Item</th>
                          <th className="text-center p-3">Qty</th>
                          <th className="text-right p-3">Price</th>
                          <th className="text-right p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProposal.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-3">
                              <span className="font-medium">{item.name}</span>
                              {item.is_optional && (
                                <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                              )}
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                            </td>
                            <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                            <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedProposal.subtotal)}</span>
                </div>
                {selectedProposal.discount_amount > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">Discount ({selectedProposal.discount_percent}%)</span>
                    <span>-{formatCurrency(selectedProposal.discount_amount)}</span>
                  </div>
                )}
                {selectedProposal.tax_amount > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">Tax ({selectedProposal.tax_percent}%)</span>
                    <span>{formatCurrency(selectedProposal.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-end gap-8 text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedProposal.total_amount)}</span>
                </div>
              </div>

              {/* Payment Schedule */}
              {selectedProposal.payment_schedule && selectedProposal.payment_schedule.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Schedule</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Milestone</th>
                          <th className="text-center p-3">%</th>
                          <th className="text-right p-3">Amount</th>
                          <th className="text-left p-3">Due Date</th>
                          <th className="text-left p-3">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProposal.payment_schedule.map((milestone: PaymentMilestone, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-3 font-medium">{milestone.milestone}</td>
                            <td className="p-3 text-center">{milestone.percentage}%</td>
                            <td className="p-3 text-right">{formatCurrency(milestone.amount)}</td>
                            <td className="p-3">{milestone.due_date || "TBD"}</td>
                            <td className="p-3 text-muted-foreground">{milestone.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              {selectedProposal.terms_conditions && (
                <div>
                  <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{selectedProposal.terms_conditions}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => {
              const baseUrl = getBaseUrl();
              const token = localStorage.getItem('accessToken');
              window.open(`${baseUrl}business/proposals/${selectedProposal?.id}/pdf/?token=${token}&style=${pdfTemplateStyle}`, "_blank");
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View PDF
            </Button>
            <Button onClick={() => {
              const baseUrl = getBaseUrl();
              const token = localStorage.getItem('accessToken');
              // Download with download=true to trigger file download
              window.open(`${baseUrl}business/proposals/${selectedProposal?.id}/pdf/?token=${token}&download=true&style=${pdfTemplateStyle}`, "_blank");
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Options Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Options
            </DialogTitle>
            <DialogDescription>
              Choose how you want your proposal to look
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Style</Label>
              <Select value={pdfTemplateStyle} onValueChange={(value: 'beautiful' | 'simple') => setPdfTemplateStyle(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beautiful">
                    <div className="flex items-center gap-2">
                      <span>✨ Beautiful</span>
                      <span className="text-xs text-muted-foreground">- Modern branded design</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="simple">
                    <div className="flex items-center gap-2">
                      <span>📄 Simple</span>
                      <span className="text-xs text-muted-foreground">- Classic invoice style</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {pdfTemplateStyle === 'beautiful' 
                  ? "Uses your brand colors with a modern, professional layout"
                  : "Clean, simple layout focused on content and readability"
                }
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPdfDialog(false)} disabled={isGeneratingPdf}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => selectedProposal && handleViewProposal(selectedProposal, pdfTemplateStyle)}
              disabled={isGeneratingPdf}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline"
              onClick={() => selectedProposal && handleGeneratePDF(selectedProposal, pdfTemplateStyle, true)}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
              JPEG
            </Button>
            <Button 
              onClick={() => selectedProposal && handleGeneratePDF(selectedProposal, pdfTemplateStyle, false)}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
