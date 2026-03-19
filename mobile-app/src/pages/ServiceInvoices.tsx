import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useSearchParams, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { ExportComponent } from "@/components/ExportComponent";
import { DownloadComponent } from "@/components/DownloadComponent";
import { InvoiceReceipt } from "@/components/InvoiceReceipt";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  Send,
  MoreHorizontal,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmailVerificationGate, checkEmailVerification } from "@/components/account/EmailVerificationGate";

interface InvoiceStats {
  total_outstanding: number;
  outstanding_change: number;
  paid_this_month: number;
  paid_change: number;
  overdue: number;
  overdue_change: number;
  draft_invoices: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  description: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  amount: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled';
  due_date: string;
  created_at: string;
  paid_date?: string;
  notes?: string;
  terms?: string;
  items?: { description: string; quantity: number; rate: number; amount: number }[];
}

interface BusinessInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  is_vat_registered?: boolean;
  vat_number?: string;
}

export default function ServiceInvoices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: invoiceId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadInvoice, setDownloadInvoice] = useState<Invoice | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditInvoiceNumberDialog, setShowEditInvoiceNumberDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const [isUpdatingInvoiceNumber, setIsUpdatingInvoiceNumber] = useState(false);
  const [stats, setStats] = useState<InvoiceStats>({
    total_outstanding: 0,
    outstanding_change: 0,
    paid_this_month: 0,
    paid_change: 0,
    overdue: 0,
    overdue_change: 0,
    draft_invoices: 0
  });
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [showEmailVerificationGate, setShowEmailVerificationGate] = useState(false);
  
  // Initialize with proper check to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [clients, setClients] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    client_name: '',
    client_email: '',
    description: '',
    amount: '',
    due_date: '',
    items: [] as { description: string; quantity: number; price: number }[]
  });
  const [isCreating, setIsCreating] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle invoice ID from URL (view/edit specific invoice)
  useEffect(() => {
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === parseInt(invoiceId));
      if (invoice) {
        setSelectedInvoice(invoice);
        setShowDetailDialog(true);
        setIsEditMode(location.pathname.includes('/edit'));
      }
    }
  }, [invoiceId, invoices, location.pathname]);

  // Handle URL query parameters (when coming from projects)
  useEffect(() => {
    const clientId = searchParams.get('client');
    const clientName = searchParams.get('client_name');
    const amount = searchParams.get('amount');
    const description = searchParams.get('description');
    
    if (clientId || clientName || amount || description) {
      // Pre-fill the form and open dialog
      const openWithPrefill = async () => {
        const verified = await checkEmailVerification();
        if (!verified) {
          setShowEmailVerificationGate(true);
          return;
        }
        setNewInvoice(prev => ({
          ...prev,
          client_id: clientId || '',
          client_name: clientName ? decodeURIComponent(clientName) : '',
          description: description ? decodeURIComponent(description) : '',
          amount: amount || '',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 30 days from now
        }));
        setShowNewInvoiceDialog(true);
      };
      void openWithPrefill();
      
      // Clean up URL params
      navigate('/business/invoices', { replace: true });
    }
  }, [searchParams, navigate]);

  const requireEmailVerification = async (onVerified: () => void) => {
    const verified = await checkEmailVerification();
    if (verified) {
      onVerified();
      return;
    }
    setShowEmailVerificationGate(true);
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const response = await apiGet('business/service-settings/').catch(() => ({ success: false }));
      if (response.success && response.settings) {
        const settings = response.settings;
        setBusinessInfo({
          name: settings.name || localStorage.getItem('business_name') || '',
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          logo: settings.business_logo || '',
          bank_name: settings.manual_payment_bank_name || '',
          account_number: settings.manual_payment_account_number || '',
          account_name: settings.manual_payment_account_name || '',
          is_vat_registered: settings.is_vat_registered || false,
          vat_number: settings.vat_registration_number || '',
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiGet('business/service-clients/').catch(() => ({ success: false }));
      if (response.success) {
        setClients(response.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      // Fetch invoices from API
      const response = await apiGet('business/service-invoices/').catch(() => ({ success: false }));
      
      if (response.success) {
        setInvoices(response.invoices || []);
        setStats(response.stats || stats);
      }
      // No mock data - show empty state if no data
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = async () => {
    // Validate required fields
    if (!newInvoice.client_name?.trim()) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    if (!newInvoice.due_date) {
      toast({
        title: "Error",
        description: "Due date is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const amount = parseFloat(newInvoice.amount);
      // Auto-calculate VAT (7.5%) if business is VAT registered
      const vatAmount = businessInfo.is_vat_registered ? amount * 0.075 : 0;
      const totalAmount = amount + vatAmount;
      
      const response = await apiPost('business/service-invoices/', {
        client_id: newInvoice.client_id || null,
        client_name: newInvoice.client_name.trim(),
        client_email: newInvoice.client_email?.trim() || '',
        description: newInvoice.description?.trim() || 'Service Invoice',
        amount: amount,
        tax_amount: vatAmount,
        total_amount: totalAmount,
        due_date: newInvoice.due_date,
        items: newInvoice.items
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Invoice created successfully"
        });
        setShowNewInvoiceDialog(false);
        setNewInvoice({
          client_id: '',
          client_name: '',
          client_email: '',
          description: '',
          amount: '',
          due_date: '',
          items: []
        });
        fetchInvoices();
      } else {
        throw new Error(response.message || response.error || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      setNewInvoice({
        ...newInvoice,
        client_id: clientId,
        client_name: client.name,
        client_email: client.email || ''
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      const response = await apiPut(`business/service-invoices/${invoiceId}/`, {
        status: 'paid'
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Invoice marked as paid"
        });
        fetchInvoices(); // Refresh the invoice list
      } else {
        throw new Error(response.message || response.error || 'Failed to update invoice');
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive"
      });
    }
  };

  // View invoice details
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditMode(false);
    setShowDetailDialog(true);
  };

  // Edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditMode(true);
    setShowDetailDialog(true);
  };

  // Open invoice number edit dialog
  const handleEditInvoiceNumber = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewInvoiceNumber(invoice.invoice_number);
    setShowEditInvoiceNumberDialog(true);
  };

  // Update invoice number
  const handleUpdateInvoiceNumber = async () => {
    if (!editingInvoice || !newInvoiceNumber.trim()) {
      toast({
        title: "Error",
        description: "Invoice number cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingInvoiceNumber(true);
    try {
      const response = await apiPut(`business/service-invoices/${editingInvoice.id}/`, {
        invoice_number: newInvoiceNumber.trim()
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Invoice number updated successfully"
        });
        setShowEditInvoiceNumberDialog(false);
        setEditingInvoice(null);
        setNewInvoiceNumber("");
        fetchInvoices(); // Refresh the invoice list
      } else {
        throw new Error(response.message || response.error || 'Failed to update invoice number');
      }
    } catch (error: any) {
      console.error('Error updating invoice number:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice number",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingInvoiceNumber(false);
    }
  };

  // Close detail dialog
  const handleCloseDetailDialog = () => {
    setShowDetailDialog(false);
    setSelectedInvoice(null);
    setIsEditMode(false);
    // If we came from a URL with an ID, navigate back to the list
    if (invoiceId) {
      navigate('/business/invoices', { replace: true });
    }
  };

  // Download invoice - prepares invoice data for download
  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details
      const response = await apiGet(`business/service-invoices/${invoice.id}/`);
      
      if (response.success && response.invoice) {
        // Set the download invoice and show dialog
        setDownloadInvoice({
          ...invoice,
          ...response.invoice,
          total_amount: response.invoice.total_amount || invoice.amount,
        });
        setShowDownloadDialog(true);
      } else if (response.success) {
        // Use local invoice data
        setDownloadInvoice({
          ...invoice,
          total_amount: invoice.amount,
        });
        setShowDownloadDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      // Still show download dialog with available data
      setDownloadInvoice({
        ...invoice,
        total_amount: invoice.amount,
      });
      setShowDownloadDialog(true);
    }
  };

  // State for rendering invoice for capture (temporary visible render)
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to wait for element to be available after state updates
  const waitForElement = (maxAttempts = 30, interval = 100): Promise<HTMLElement | null> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        // Use document.getElementById as it's more reliable than refs for dynamically rendered content
        const element = document.getElementById('invoice-capture-element');
        console.log(`Checking for element, attempt ${attempts}, element:`, element);
        if (element) {
          resolve(element);
        } else if (attempts >= maxAttempts) {
          resolve(null);
        } else {
          setTimeout(check, interval);
        }
      };
      // Start checking after a small delay to allow React to render
      setTimeout(check, 50);
    });
  };

  // Quick download as PDF (renders invoice temporarily for capture)
  const handleQuickDownloadPDF = async (invoice: Invoice) => {
    try {
      toast({ title: "Generating PDF", description: "Please wait..." });
      
      // Fetch full invoice details
      const response = await apiGet(`business/service-invoices/${invoice.id}/`);
      const fullInvoice = response.success && response.invoice ? { ...invoice, ...response.invoice } : invoice;
      
      // Use flushSync to force synchronous render of the invoice component
      flushSync(() => {
        setIsGenerating(true);
        setDownloadInvoice({ ...fullInvoice, total_amount: fullInvoice.total_amount || invoice.amount });
      });
      
      // Small delay to ensure DOM is fully painted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for the element to be rendered with retry mechanism
      const element = await waitForElement();
      
      if (!element) {
        console.error('Invoice element not found after waiting');
        toast({ title: "Error", description: "Could not generate invoice. Please try again.", variant: "destructive" });
        setIsGenerating(false);
        setDownloadInvoice(null);
        return;
      }
      
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(4, pixelRatio * 2);
      
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
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
      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
      
      toast({ title: "Download Complete", description: "Invoice saved as PDF" });
      setIsGenerating(false);
      setDownloadInvoice(null);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
      setIsGenerating(false);
      setDownloadInvoice(null);
    }
  };

  // Quick download as JPEG (renders invoice temporarily for capture)
  const handleQuickDownloadJPEG = async (invoice: Invoice) => {
    try {
      toast({ title: "Generating Image", description: "Please wait..." });
      
      // Fetch full invoice details
      const response = await apiGet(`business/service-invoices/${invoice.id}/`);
      const fullInvoice = response.success && response.invoice ? { ...invoice, ...response.invoice } : invoice;
      
      // Use flushSync to force synchronous render of the invoice component
      flushSync(() => {
        setIsGenerating(true);
        setDownloadInvoice({ ...fullInvoice, total_amount: fullInvoice.total_amount || invoice.amount });
      });
      
      // Small delay to ensure DOM is fully painted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for the element to be rendered with retry mechanism
      const element = await waitForElement();
      
      if (!element) {
        console.error('Invoice element not found after waiting');
        toast({ title: "Error", description: "Could not generate invoice. Please try again.", variant: "destructive" });
        setIsGenerating(false);
        setDownloadInvoice(null);
        return;
      }
      
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(4, pixelRatio * 2);
      
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
          setIsGenerating(false);
          setDownloadInvoice(null);
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `invoice-${invoice.invoice_number}.jpg`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast({ title: "Download Complete", description: "Invoice saved as JPEG" });
        setIsGenerating(false);
        setDownloadInvoice(null);
      }, 'image/jpeg', 1.0);
      
    } catch (error) {
      console.error('JPEG generation error:', error);
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
      setIsGenerating(false);
      setDownloadInvoice(null);
    }
  };

  // Download as PDF
  const handleDownloadAsPDF = async () => {
    if (!downloadInvoice || !invoiceRef.current) return;
    
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait..."
      });
      
      // Use higher scale for sharper text (4x for crisp rendering)
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(4, pixelRatio * 2);
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
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
      
      // Direct save - no popup
      pdf.save(`invoice-${downloadInvoice.invoice_number}.pdf`);
      
      toast({
        title: "Download Complete",
        description: `Invoice saved as PDF`
      });
      setShowDownloadDialog(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  // Download as JPEG
  const handleDownloadAsJPEG = async () => {
    if (!downloadInvoice || !invoiceRef.current) return;
    
    try {
      toast({
        title: "Generating Image",
        description: "Please wait..."
      });
      
      // Use higher scale for sharper text (4x for crisp rendering)
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(4, pixelRatio * 2);
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Use blob for mobile compatibility
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to generate image",
            variant: "destructive"
          });
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `invoice-${downloadInvoice.invoice_number}.jpg`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast({
          title: "Download Complete",
          description: `Invoice saved as JPEG`
        });
        setShowDownloadDialog(false);
      }, 'image/jpeg', 1.0); // Maximum quality
      
    } catch (error) {
      console.error('JPEG generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive"
      });
    }
  };

  // Print invoice
  const handlePrintInvoice = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${downloadInvoice?.invoice_number}</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${invoiceRef.current.outerHTML}
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Send invoice via email
  const handleSendInvoice = async (invoice: Invoice) => {
    if (!invoice.client_email) {
      toast({
        title: "Cannot Send",
        description: "Client email is not available",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiPost(`business/service-invoices/${invoice.id}/send/`, {});
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Invoice sent to ${invoice.client_email}`
        });
      } else {
        throw new Error(response.message || 'Failed to send invoice');
      }
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invoice",
        variant: "destructive"
      });
    }
  };

  // Send reminder for unpaid invoice
  const handleSendReminder = async (invoice: Invoice) => {
    if (!invoice.client_email) {
      toast({
        title: "Cannot Send Reminder",
        description: "Client email is not available",
        variant: "destructive"
      });
      return;
    }

    if (invoice.status === 'paid') {
      toast({
        title: "Already Paid",
        description: "This invoice has already been paid",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiPost(`business/service-invoices/${invoice.id}/reminder/`, {});
      
      if (response.success) {
        toast({
          title: "Reminder Sent",
          description: `Payment reminder sent to ${invoice.client_email}`
        });
      } else {
        throw new Error(response.message || response.error || 'Failed to send reminder');
      }
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await apiDelete(`business/service-invoices/${invoice.id}/`);
      
      if (response.success) {
        toast({
          title: "Deleted",
          description: "Invoice deleted successfully"
        });
        fetchInvoices();
      } else {
        throw new Error(response.message || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  // Export invoices to CSV
  const handleExportInvoices = () => {
    try {
      const csvData = filteredInvoices.map(inv => ({
        'Invoice Number': inv.invoice_number,
        'Client': inv.client_name,
        'Email': inv.client_email || '',
        'Description': inv.description,
        'Amount': inv.amount,
        'Status': inv.status,
        'Due Date': new Date(inv.due_date).toLocaleDateString(),
        'Created': new Date(inv.created_at).toLocaleDateString()
      }));
      
      if (csvData.length === 0) {
        toast({
          title: "No Data",
          description: "No invoices to export",
          variant: "destructive"
        });
        return;
      }
      
      // Create CSV content
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: "Exported",
        description: `${csvData.length} invoices exported successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export invoices",
        variant: "destructive"
      });
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <EmailVerificationGate
          open={showEmailVerificationGate}
          onOpenChange={setShowEmailVerificationGate}
          reason="Please verify your email before creating invoices."
        />
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Invoices</h1>
            <Button size="sm" onClick={() => requireEmailVerification(() => setShowNewInvoiceDialog(true))}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold">{formatCurrency(stats.total_outstanding)}</p>
                <div className={`flex items-center gap-1 text-xs ${stats.outstanding_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.outstanding_change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(stats.outstanding_change)}%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Paid This Month</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(stats.paid_this_month)}</p>
                <div className={`flex items-center gap-1 text-xs ${stats.paid_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.paid_change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(stats.paid_change)}%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(stats.overdue)}</p>
                <div className={`flex items-center gap-1 text-xs ${stats.overdue_change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {stats.overdue_change < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                  <span>{Math.abs(stats.overdue_change)}%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Draft Invoices</p>
                <p className="text-lg font-bold">{stats.draft_invoices}</p>
                <p className="text-xs text-amber-500">Pending review</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p 
                          className="font-semibold text-primary cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); handleEditInvoiceNumber(invoice); }}
                          title="Click to edit invoice number"
                        >
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{invoice.client_name}</span>
                      <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); handleSendInvoice(invoice); }}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        {/* Download dropdown - inline under button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 z-[100]">
                            <DropdownMenuItem onClick={() => handleQuickDownloadPDF(invoice)}>
                              <FileText className="h-4 w-4 mr-2" /> Download as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickDownloadJPEG(invoice)}>
                              <Download className="h-4 w-4 mr-2" /> Download as Image
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* More actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[100]">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>Edit Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>Send Reminder</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteInvoice(invoice)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No invoices found</p>
                <Button 
                  variant="link" 
                  onClick={() => requireEmailVerification(() => setShowNewInvoiceDialog(true))}
                >
                  Create your first invoice
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Invoice Dialog */}
        <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for your client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Existing Client</Label>
                  <Select value={newInvoice.client_id} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Enter client name" 
                  value={newInvoice.client_name}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email</Label>
                <Input 
                  placeholder="Enter client email" 
                  type="email" 
                  value={newInvoice.client_email}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Invoice description" 
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₦) *</Label>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input 
                    type="date" 
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden render area for PDF/JPEG generation - MOBILE */}
        {downloadInvoice && (
          <div 
            id="invoice-capture-element"
            className="bg-white"
            style={{ 
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              width: '210mm',
              minHeight: '297mm',
              visibility: 'visible',
              zIndex: 9999,
            }}
          >
            <InvoiceReceipt
              ref={invoiceRef}
              invoice={{
                invoice_number: downloadInvoice.invoice_number,
                client_name: downloadInvoice.client_name,
                client_email: downloadInvoice.client_email,
                client_address: downloadInvoice.client_address,
                description: downloadInvoice.description,
                items: downloadInvoice.items,
                amount: downloadInvoice.amount,
                tax_amount: downloadInvoice.tax_amount,
                discount_amount: downloadInvoice.discount_amount,
                total_amount: downloadInvoice.total_amount || downloadInvoice.amount,
                paid_amount: downloadInvoice.paid_amount,
                status: downloadInvoice.status,
                due_date: downloadInvoice.due_date,
                created_at: downloadInvoice.created_at,
                paid_date: downloadInvoice.paid_date,
                notes: downloadInvoice.notes,
                terms: downloadInvoice.terms,
              }}
              business={businessInfo}
            />
          </div>
        )}

        {/* Loading overlay when generating - MOBILE */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm font-medium">Generating invoice...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout (ServHub Style)
  return (
    <div className="min-h-screen bg-background">
      <EmailVerificationGate
        open={showEmailVerificationGate}
        onOpenChange={setShowEmailVerificationGate}
        reason="Please verify your email before creating invoices."
      />
      {/* Desktop Header */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Invoices</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => requireEmailVerification(() => setShowNewInvoiceDialog(true))}>
                <Plus className="h-4 w-4 mr-2" /> New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.total_outstanding)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stats.outstanding_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.outstanding_change > 0 ? '+' : ''}{stats.outstanding_change}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(stats.paid_this_month)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stats.paid_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.paid_change > 0 ? '+' : ''}{stats.paid_change}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(stats.overdue)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stats.overdue_change < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.overdue_change}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Draft Invoices</p>
              <p className="text-2xl font-bold mt-1">{stats.draft_invoices}</p>
              <p className="text-sm text-amber-500 mt-1">Pending review</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportInvoices}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Invoices Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE</TableHead>
                <TableHead>CLIENT</TableHead>
                <TableHead>AMOUNT</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>DUE DATE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p 
                          className="font-semibold text-primary cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); handleEditInvoiceNumber(invoice); }}
                          title="Click to edit invoice number"
                        >
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Send"
                          onClick={() => handleSendInvoice(invoice)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Download"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>Edit Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>Send Reminder</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteInvoice(invoice)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No invoices found</p>
                    <Button 
                      variant="link" 
                      onClick={() => requireEmailVerification(() => setShowNewInvoiceDialog(true))}
                    >
                      Create your first invoice
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* New Invoice - Sheet for Mobile, Dialog for Desktop */}
      {isMobile ? (
        <Sheet open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Create New Invoice</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pb-6">
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Existing Client</Label>
                  <Select value={newInvoice.client_id} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Enter client name" 
                  value={newInvoice.client_name}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email</Label>
                <Input 
                  placeholder="Enter client email" 
                  type="email" 
                  value={newInvoice.client_email}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Invoice description" 
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₦) *</Label>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input 
                    type="date" 
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice} disabled={isCreating} className="flex-1">
                  {isCreating ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for your client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Existing Client</Label>
                  <Select value={newInvoice.client_id} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  placeholder="Enter client name" 
                  value={newInvoice.client_name}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email</Label>
                <Input 
                  placeholder="Enter client email" 
                  type="email" 
                  value={newInvoice.client_email}
                  onChange={(e) => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Invoice description" 
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₦) *</Label>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input 
                    type="date" 
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Detail/Edit Dialog - Sheet for Mobile, Dialog for Desktop */}
      {isMobile ? (
        <Sheet open={showDetailDialog} onOpenChange={(open) => !open && handleCloseDetailDialog()}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {isEditMode ? 'Edit Invoice' : 'Invoice Details'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{selectedInvoice?.invoice_number}</p>
            </SheetHeader>
            {selectedInvoice && (
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input 
                    value={selectedInvoice.client_name}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input 
                    value={selectedInvoice.client_email || 'N/A'}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={selectedInvoice.description}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <p className="text-2xl font-bold">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <p className="text-lg">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {/* Action Buttons - Prominent on Mobile */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleSendInvoice(selectedInvoice)}
                    >
                      <Send className="h-4 w-4 mr-2" /> Send
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownloadInvoice(selectedInvoice)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={handleCloseDetailDialog}
                    >
                      Close
                    </Button>
                    {selectedInvoice.status !== 'paid' && (
                      <Button 
                        className="w-full"
                        onClick={() => { handleMarkAsPaid(selectedInvoice.id); handleCloseDetailDialog(); }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showDetailDialog} onOpenChange={(open) => !open && handleCloseDetailDialog()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Invoice' : 'Invoice Details'}
              </DialogTitle>
              <DialogDescription>
                {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input 
                    value={selectedInvoice.client_name}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input 
                    value={selectedInvoice.client_email || 'N/A'}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={selectedInvoice.description}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <p className="text-2xl font-bold">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <p className="text-lg">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleSendInvoice(selectedInvoice)}
                  >
                    <Send className="h-4 w-4 mr-2" /> Send
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDetailDialog}>
                Close
              </Button>
              {selectedInvoice && selectedInvoice.status !== 'paid' && (
                <Button onClick={() => { handleMarkAsPaid(selectedInvoice.id); handleCloseDetailDialog(); }}>
                  Mark as Paid
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Download Invoice - Sheet for Mobile, Dialog for Desktop */}
      {isMobile ? (
        <Sheet open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl z-[100]">
            <SheetHeader className="pb-4 sticky top-0 bg-background z-10">
              <SheetTitle>Download Invoice</SheetTitle>
            </SheetHeader>
            
            {/* Invoice Preview */}
            <div className="border rounded-lg bg-white overflow-auto mb-4" style={{ maxHeight: '60vh' }}>
              {downloadInvoice && (
                <InvoiceReceipt
                  ref={invoiceRef}
                  invoice={{
                    invoice_number: downloadInvoice.invoice_number,
                    client_name: downloadInvoice.client_name,
                    client_email: downloadInvoice.client_email,
                    client_address: downloadInvoice.client_address,
                    description: downloadInvoice.description,
                    items: downloadInvoice.items,
                    amount: downloadInvoice.amount,
                    tax_amount: downloadInvoice.tax_amount,
                    discount_amount: downloadInvoice.discount_amount,
                    total_amount: downloadInvoice.total_amount || downloadInvoice.amount,
                    paid_amount: downloadInvoice.paid_amount,
                    status: downloadInvoice.status,
                    due_date: downloadInvoice.due_date,
                    created_at: downloadInvoice.created_at,
                    paid_date: downloadInvoice.paid_date,
                    notes: downloadInvoice.notes,
                    terms: downloadInvoice.terms,
                  }}
                  business={businessInfo}
                />
              )}
            </div>
            
            <div className="flex gap-2 pb-6 sticky bottom-0 bg-background pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={handleDownloadAsJPEG}>
                <Download className="h-4 w-4 mr-2" /> JPEG
              </Button>
              <Button className="flex-1" onClick={handleDownloadAsPDF}>
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Download Invoice</DialogTitle>
              <DialogDescription>
                Preview and download your invoice as PDF or JPEG
              </DialogDescription>
            </DialogHeader>
            
            {/* Invoice Preview */}
            <div className="border rounded-lg bg-white overflow-auto" style={{ maxHeight: '70vh' }}>
              {downloadInvoice && (
                <InvoiceReceipt
                  ref={invoiceRef}
                  invoice={{
                    invoice_number: downloadInvoice.invoice_number,
                    client_name: downloadInvoice.client_name,
                    client_email: downloadInvoice.client_email,
                    client_address: downloadInvoice.client_address,
                    description: downloadInvoice.description,
                    items: downloadInvoice.items,
                    amount: downloadInvoice.amount,
                    tax_amount: downloadInvoice.tax_amount,
                    discount_amount: downloadInvoice.discount_amount,
                    total_amount: downloadInvoice.total_amount || downloadInvoice.amount,
                    paid_amount: downloadInvoice.paid_amount,
                    status: downloadInvoice.status,
                    due_date: downloadInvoice.due_date,
                    created_at: downloadInvoice.created_at,
                    paid_date: downloadInvoice.paid_date,
                    notes: downloadInvoice.notes,
                    terms: downloadInvoice.terms,
                  }}
                  business={businessInfo}
                />
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handlePrintInvoice}>
                <FileText className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" onClick={handleDownloadAsJPEG}>
                <Download className="h-4 w-4 mr-2" /> JPEG
              </Button>
              <Button onClick={handleDownloadAsPDF}>
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Invoice Number Dialog */}
      <Dialog open={showEditInvoiceNumberDialog} onOpenChange={setShowEditInvoiceNumberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invoice Number</DialogTitle>
            <DialogDescription>
              Update the invoice number for this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={newInvoiceNumber}
                onChange={(e) => setNewInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditInvoiceNumberDialog(false);
                setEditingInvoice(null);
                setNewInvoiceNumber("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateInvoiceNumber}
              disabled={isUpdatingInvoiceNumber || !newInvoiceNumber.trim()}
            >
              {isUpdatingInvoiceNumber ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden render area for PDF/JPEG generation - always render when downloadInvoice exists */}
      {downloadInvoice && (
        <div 
          id="invoice-capture-element"
          className="bg-white"
          style={{ 
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: '210mm',
            minHeight: '297mm',
            visibility: 'visible',
            zIndex: 9999,
          }}
        >
          <InvoiceReceipt
            ref={invoiceRef}
            invoice={{
              invoice_number: downloadInvoice.invoice_number,
              client_name: downloadInvoice.client_name,
              client_email: downloadInvoice.client_email,
              client_address: downloadInvoice.client_address,
              description: downloadInvoice.description,
              items: downloadInvoice.items,
              amount: downloadInvoice.amount,
              tax_amount: downloadInvoice.tax_amount,
              discount_amount: downloadInvoice.discount_amount,
              total_amount: downloadInvoice.total_amount || downloadInvoice.amount,
              paid_amount: downloadInvoice.paid_amount,
              status: downloadInvoice.status,
              due_date: downloadInvoice.due_date,
              created_at: downloadInvoice.created_at,
              paid_date: downloadInvoice.paid_date,
              notes: downloadInvoice.notes,
              terms: downloadInvoice.terms,
            }}
            business={businessInfo}
          />
        </div>
      )}

      {/* Loading overlay when generating */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm font-medium">Generating invoice...</p>
          </div>
        </div>
      )}
    </div>
  );
}
