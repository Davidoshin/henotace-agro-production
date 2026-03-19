import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineLoadingSpinner, ButtonSpinner, PageSpinner, DelayedLoadingOverlay } from "@/components/ui/LoadingSpinner";
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Search,
  Printer,
  CreditCard,
  User,
  Calculator,
  Camera,
  CameraOff,
  Scan,
  Percent,
  Gift,
  Download,
  ArrowLeft,
  Pause,
  Play,
  Clock,
  ChevronDown,
  Usb,
  Building2,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
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

// WebUSB type declarations for SAM4s/ESC-POS printers
declare global {
  interface Navigator {
    usb: USB;
    serial: Serial;
  }
  interface USB {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
  }
  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
  }
  interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
  }
  interface USBDevice {
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: ArrayBuffer | ArrayBufferView): Promise<USBOutTransferResult>;
    configuration: USBConfiguration | null;
    productName?: string;
  }
  interface USBConfiguration {
    interfaces: USBInterface[];
  }
  interface USBInterface {
    alternates: USBAlternateInterface[];
  }
  interface USBAlternateInterface {
    endpoints: USBEndpoint[];
  }
  interface USBEndpoint {
    direction: 'in' | 'out';
    endpointNumber: number;
  }
  interface USBOutTransferResult {
    bytesWritten: number;
    status: 'ok' | 'stall' | 'babble';
  }
  // Web Serial API types
  interface Serial {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  }
  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }
  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }
  interface SerialPort extends EventTarget {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    writable: WritableStream<Uint8Array> | null;
    readable: ReadableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    ondisconnect: ((event: Event) => void) | null;
  }
  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }
  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  selling_price: string;
  current_stock: string;
  unit: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  customer_code: string;
  phone?: string;
  loyalty_points?: number;
  discount_percentage?: number;
}

// Branch Interface
interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_main_branch: boolean;
}

// Held Transaction Interface
interface HeldTransaction {
  id: string;
  cart: CartItem[];
  customer: Customer | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  loyaltyPointsToUse: number;
  note: string;
  timestamp: Date;
  branchId?: number;
}

export default function EnhancedPOS() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [creditCustomerSearch, setCreditCustomerSearch] = useState("");
  
  // Barcode scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  
  // Discount state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  
  // Loyalty points state
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState<number>(0);
  
  // Receipt state
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // Transaction history state
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(new Date().toISOString().split('T')[0]);

  // Held transactions state
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('pos_held_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldDialog, setShowHeldDialog] = useState(false);
  const [holdNote, setHoldNote] = useState("");
  const [showHoldNoteDialog, setShowHoldNoteDialog] = useState(false);

  // Product display limit state
  const [showAllProducts, setShowAllProducts] = useState(false);
  const PRODUCTS_LIMIT = 12;

  // SAM4s Printer state (Web Serial API for FTDI-based printers)
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    return localStorage.getItem('pos_auto_print') === 'true';
  });

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    try {
      const saved = localStorage.getItem('pos_selected_branch');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [canChangeBranch, setCanChangeBranch] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [staffBranchId, setStaffBranchId] = useState<number | null>(null);

  // VAT state
  const [isVatRegistered, setIsVatRegistered] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const tax = isVatRegistered ? subtotal * 0.075 : 0;  // 7.5% VAT for registered businesses
  
  const discountAmount = discountType === "percentage" 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  
  const loyaltyDiscount = loyaltyPointsToUse;
  const totalDiscount = discountAmount + loyaltyDiscount;
  const total = Math.max(0, subtotal + tax - totalDiscount);
  const change = paymentAmount ? Math.max(0, parseFloat(paymentAmount) - total) : 0;

  useEffect(() => {
    initializePOS();
    
    // Cleanup function for component unmount
    return () => {
      // Stop barcode scanner
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      // Close serial port if connected (prevents "port busy" errors)
      if (serialPort) {
        serialPort.close().catch(() => {});
      }
    };
  }, []);

  // Reload products when branch changes
  useEffect(() => {
    if (selectedBranch) {
      loadProducts(selectedBranch.id);
    }
  }, [selectedBranch?.id]);

  // Cleanup serial port on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (serialPort) {
        serialPort.close().catch(() => {});
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [serialPort]);

  // Handle serial port disconnect event
  useEffect(() => {
    if (!serialPort) return;
    
    const handleDisconnect = () => {
      setSerialPort(null);
      setPrinterConnected(false);
      toast({
        title: "Printer Disconnected",
        description: "The printer was disconnected. Please reconnect to continue printing.",
        variant: "destructive"
      });
    };
    
    // Listen for the disconnect event on the navigator.serial
    navigator.serial?.addEventListener('disconnect', (event: any) => {
      if (event.target === serialPort) {
        handleDisconnect();
      }
    });
    
    return () => {
      navigator.serial?.removeEventListener('disconnect', handleDisconnect as any);
    };
  }, [serialPort]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  // Save held transactions to localStorage
  useEffect(() => {
    localStorage.setItem('pos_held_transactions', JSON.stringify(heldTransactions));
  }, [heldTransactions]);

  // Save auto-print preference
  useEffect(() => {
    localStorage.setItem('pos_auto_print', autoPrintEnabled.toString());
  }, [autoPrintEnabled]);

  // Get displayed products (limited or all)
  const displayedProducts = showAllProducts 
    ? filteredProducts 
    : filteredProducts.slice(0, PRODUCTS_LIMIT);
  const hasMoreProducts = filteredProducts.length > PRODUCTS_LIMIT;

  // ========== SAM4s Thermal Printer Functions (Web Serial API for FTDI) ==========
  
  const connectPrinter = async () => {
    try {
      // Check for Web Serial API support (works with FTDI-based printers like SAM4s)
      if (!navigator.serial) {
        toast({
          title: "Web Serial Not Supported",
          description: "Your browser doesn't support Serial connections. Use Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }

      // Request serial port - this will show a dialog with available serial devices
      // Your SAM4s with FTDI chip (0403:6001) will appear here
      
      // First, try to get a previously paired port
      let port: SerialPort | null = null;
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        // Use the first available port that matches our filters
        port = ports.find(p => {
          const info = p.getInfo();
          return info.usbVendorId === 0x0403 || // FTDI
                 info.usbVendorId === 0x1A86 || // CH340
                 info.usbVendorId === 0x067B || // Prolific
                 info.usbVendorId === 0x10C4 || // Silicon Labs
                 info.usbVendorId === 0x0DD4;   // SAM4s
        }) || null;
      }
      
      // If no paired port found, request a new one
      if (!port) {
        port = await navigator.serial.requestPort({
          filters: [
            { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI FT232 (your SAM4s)
            { usbVendorId: 0x0403 }, // Any FTDI device
            { usbVendorId: 0x1A86 }, // CH340 USB-Serial
            { usbVendorId: 0x067B }, // Prolific USB-Serial
            { usbVendorId: 0x10C4 }, // Silicon Labs CP210x
            { usbVendorId: 0x0DD4 }, // SAM4s direct
          ]
        });
      }

      // Check if port is already open and close it if necessary
      if (port.readable || port.writable) {
        try {
          await port.close();
          console.log('Closed already open port');
        } catch (closeError) {
          console.log('Port was already closed or could not be closed:', closeError);
        }
      }

      // Open the port with SAM4s compatible settings
      await port.open({ 
        baudRate: 9600,  // SAM4s default baud rate
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });
      
      setSerialPort(port);
      setPrinterConnected(true);
      
      const info = port.getInfo();
      toast({
        title: "Printer Connected",
        description: `Connected to SAM4s printer (${info.usbVendorId?.toString(16) || 'Serial'})`,
      });
    } catch (error: any) {
      console.error('Printer connection error:', error);
      
      // Don't show error if user cancelled the dialog
      if (error.name === 'NotFoundError') {
        return; // User cancelled or no device selected
      }
      
      // Handle specific errors with friendly messages
      let errorMessage = "Failed to connect to printer.";
      
      if (error.message?.includes('Failed to open serial port')) {
        errorMessage = "Printer port is busy. Please unplug and replug the printer, or restart your browser.";
      } else if (error.message?.includes('already open')) {
        errorMessage = "Printer is already connected. Attempting to use existing connection...";
        // Try to use the existing port
        if (port && (port.readable || port.writable)) {
          setSerialPort(port);
          setPrinterConnected(true);
          toast({
            title: "Printer Connected",
            description: "Using existing printer connection",
          });
          return; // Exit successfully
        }
      } else if (error.name === 'SecurityError') {
        errorMessage = "Permission denied. Please allow access to the printer.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Printer Connection Issue",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const disconnectPrinter = async () => {
    if (serialPort) {
      try {
        if (serialPort.readable || serialPort.writable) {
          await serialPort.close();
        }
      } catch (error) {
        console.error('Error disconnecting printer:', error);
      }
      setSerialPort(null);
      setPrinterConnected(false);
      toast({
        title: "Printer Disconnected",
        description: "SAM4s printer has been disconnected",
      });
    }
  };

  // Check printer connection status
  const checkPrinterStatus = async () => {
    if (serialPort) {
      try {
        // Check if port is still connected and accessible
        const isStillConnected = serialPort.readable || serialPort.writable;
        if (!isStillConnected && printerConnected) {
          console.log('Printer disconnected, updating status');
          setPrinterConnected(false);
          toast({
            title: "Printer Disconnected",
            description: "Printer connection was lost. Please reconnect.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.log('Error checking printer status:', error);
        if (printerConnected) {
          setPrinterConnected(false);
        }
      }
    }
  };

  // Periodically check printer status
  useEffect(() => {
    if (printerConnected && serialPort) {
      const interval = setInterval(checkPrinterStatus, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [printerConnected, serialPort]);

  // Generate 6-character receipt ID from sale number
  const generateReceiptId = (saleNumber: string): string => {
    // Extract last 6 characters or generate from hash
    if (saleNumber.length >= 6) {
      // Get numeric part or last 6 chars
      const matches = saleNumber.match(/[A-Z0-9]+$/i);
      if (matches && matches[0].length >= 6) {
        return matches[0].slice(-6).toUpperCase();
      }
    }
    // Fallback: generate from hash
    let hash = 0;
    for (let i = 0; i < saleNumber.length; i++) {
      const char = saleNumber.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 6).toUpperCase().padStart(6, '0');
  };

  // ESC/POS command builder for SAM4s
  const buildESCPOSReceipt = (data: any): Uint8Array => {
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @
    
    // Center alignment
    commands.push(0x1B, 0x61, 0x01); // ESC a 1
    
    // Get business info
    const businessName = localStorage.getItem('business_name') || "HENOTACE BUSINESS";
    const businessCode = localStorage.getItem('business_unique_code') || "001";
    const staffName = data.staff?.name || localStorage.getItem('user_first_name') || 'Staff';
    const receiptId = generateReceiptId(data.sale_number);
    
    // Date and Time header with Receipt ID (like MIC MART format)
    const saleDate = new Date(data.date);
    const dateStr = saleDate.toLocaleDateString();
    const timeStr = saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    commands.push(...encoder.encode(`${dateStr} ${timeStr}\n`));
    
    // Sales Receipt with 6-char ID
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(...encoder.encode(`Sales Receipt #${receiptId}\n`));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    
    // Branch info
    const branchName = data.branch?.name || 'Main';
    commands.push(...encoder.encode(`Branch: ${branchName}\n`));
    if (data.branch?.address) {
      commands.push(...encoder.encode(`${data.branch.address}\n`));
    }
    if (data.branch?.phone) {
      commands.push(...encoder.encode(`Tel: ${data.branch.phone}\n`));
    }
    commands.push(...encoder.encode("\n"));
    
    // Business name - Bold and double height
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(0x1B, 0x21, 0x10); // Double height
    commands.push(...encoder.encode(businessName.toUpperCase() + "\n"));
    commands.push(0x1B, 0x21, 0x00); // Normal height
    commands.push(0x1B, 0x45, 0x00); // Bold off
    
    // Cashier
    commands.push(...encoder.encode(`Cashier: ${staffName}\n`));
    
    // Customer if available
    if (data.customer) {
      commands.push(...encoder.encode(`Customer: ${data.customer.name}\n`));
    }
    
    commands.push(...encoder.encode("\n"));
    commands.push(...encoder.encode("================================\n"));
    
    // Left alignment for items table
    commands.push(0x1B, 0x61, 0x00); // ESC a 0
    
    // Items header (ID, Qty, Price, Ext Price format)
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(...encoder.encode("ID   Qty    Price    Ext Price\n"));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(...encoder.encode("--------------------------------\n"));
    
    // Items with SKU/ID format
    data.items.forEach((item: CartItem, index: number) => {
      const itemId = item.product.sku || (index + 1).toString().padStart(3, '0');
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = `N${item.unit_price.toFixed(0)}`.padStart(8, ' ');
      const extPrice = `N${item.total_price.toFixed(2)}`.padStart(10, ' ');
      
      // Product name first
      commands.push(...encoder.encode(`${item.product.name}\n`));
      // Then ID, Qty, Price, Ext Price
      commands.push(...encoder.encode(`${itemId.slice(0,4).padEnd(5)}${qty}${price}${extPrice}\n`));
    });
    
    commands.push(...encoder.encode("--------------------------------\n"));
    
    // Right alignment for totals
    commands.push(0x1B, 0x61, 0x02); // ESC a 2
    
    // Subtotal
    commands.push(...encoder.encode(`Subtotal: N${data.subtotal.toFixed(2)}\n`));
    
    // Discount if any
    if (data.discount > 0) {
      commands.push(...encoder.encode(`Discount: -N${data.discount.toFixed(2)}\n`));
    }
    
    // VAT (7.5%) if applicable
    const taxAmount = data.tax || 0;
    if (taxAmount > 0) {
      commands.push(...encoder.encode(`VAT (7.5%): N${taxAmount.toFixed(2)}\n`));
    }
    
    commands.push(...encoder.encode("\n"));
    
    // Bold TOTAL
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(0x1B, 0x21, 0x10); // Double height
    commands.push(...encoder.encode(`TOTAL: N${data.total.toFixed(2)}\n`));
    commands.push(0x1B, 0x21, 0x00); // Normal height
    commands.push(0x1B, 0x45, 0x00); // Bold off
    
    // Payment method
    commands.push(...encoder.encode(`Payment: ${data.payment_method.toUpperCase()}\n`));
    
    // Center for footer
    commands.push(0x1B, 0x61, 0x01); // Center
    commands.push(...encoder.encode("\n"));
    commands.push(...encoder.encode("================================\n"));
    commands.push(...encoder.encode("Thanks for shopping with us!\n"));
    commands.push(...encoder.encode("================================\n"));
    commands.push(...encoder.encode("\n\n\n"));
    
    // Cut paper (partial cut)
    commands.push(0x1D, 0x56, 0x01); // GS V 1
    
    return new Uint8Array(commands);
  };

  const printToThermalPrinter = async (data: any) => {
    if (!serialPort || !printerConnected) {
      toast({
        title: "Printer Not Connected",
        description: "Please connect the SAM4s printer first",
        variant: "destructive"
      });
      return false;
    }

    try {
      const receiptData = buildESCPOSReceipt(data);
      
      // Get the writable stream
      const writer = serialPort.writable?.getWriter();
      if (!writer) {
        throw new Error('Cannot write to printer');
      }

      // Write the receipt data
      await writer.write(receiptData);
      await writer.releaseLock();
      
      toast({
        title: "Receipt Printed",
        description: "Receipt sent to SAM4s printer",
      });
      return true;
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error.message || "Failed to print receipt",
        variant: "destructive"
      });
      return false;
    }
  };

  // ========== Hold Transaction Functions ==========
  
  const holdCurrentTransaction = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "No items to hold",
        variant: "destructive"
      });
      return;
    }
    setShowHoldNoteDialog(true);
  };

  const confirmHoldTransaction = () => {
    const heldTransaction: HeldTransaction = {
      id: `hold_${Date.now()}`,
      cart: [...cart],
      customer: selectedCustomer,
      discountType,
      discountValue,
      loyaltyPointsToUse,
      note: holdNote,
      timestamp: new Date(),
      branchId: selectedBranch?.id,
    };

    setHeldTransactions([...heldTransactions, heldTransaction]);
    
    // Clear current transaction
    setCart([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setLoyaltyPointsToUse(0);
    setHoldNote("");
    setShowHoldNoteDialog(false);

    toast({
      title: "Transaction Held",
      description: `Transaction saved with ${heldTransaction.cart.length} items`,
    });
  };

  const resumeHeldTransaction = (transaction: HeldTransaction) => {
    // Check if current cart has items
    if (cart.length > 0) {
      const confirm = window.confirm(
        "You have items in your current cart. Resume will replace them. Continue?"
      );
      if (!confirm) return;
    }

    // Restore the held transaction
    setCart(transaction.cart);
    setSelectedCustomer(transaction.customer);
    setDiscountType(transaction.discountType);
    setDiscountValue(transaction.discountValue);
    setLoyaltyPointsToUse(transaction.loyaltyPointsToUse);

    // Remove from held transactions
    setHeldTransactions(heldTransactions.filter(t => t.id !== transaction.id));
    setShowHeldDialog(false);

    toast({
      title: "Transaction Resumed",
      description: `Restored ${transaction.cart.length} items to cart`,
    });
  };

  const deleteHeldTransaction = (id: string) => {
    const confirm = window.confirm("Delete this held transaction?");
    if (!confirm) return;

    setHeldTransactions(heldTransactions.filter(t => t.id !== id));
    toast({
      title: "Transaction Deleted",
      description: "Held transaction has been removed",
    });
  };

  // Initialize POS - load user permissions first, then branches
  const initializePOS = async () => {
    try {
      // First, get user role from localStorage
      // Note: Login pages use 'userRole' or 'user_role' key
      const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
      setUserRole(role);
      
      let canChange = false;
      let branchId: number | null = null;
      
      // Business owner can always change branch
      if (role === 'business_owner') {
        canChange = true;
      } else {
        // For staff, check their profile for branch and permissions
        try {
          const data = await apiGet('business/staff/me/');
          if (data.success && data.staff) {
            const staff = data.staff;
            if (!staff.can_manage_sales) {
              toast({ title: "Access denied", description: "You don't have permission to access POS", variant: "destructive" });
              navigate('/business-staff-dashboard');
              return;
            }
            canChange = staff.can_manage_branches || false;
            if (staff.branch?.id) {
              branchId = staff.branch.id;
            }
          }
        } catch (error) {
          console.error("Failed to load staff profile:", error);
        }
      }
      
      setCanChangeBranch(canChange);
      setStaffBranchId(branchId);
      
      // Now load branches with the permission info
      const branchData = await apiGet('business/branches/');
      if (branchData.success && branchData.branches) {
        setBranches(branchData.branches);
        
        // Determine which branch to select based on user permissions
        if (branchData.branches.length > 0) {
          // If user is staff assigned to a specific branch and can't change, use that branch
          if (branchId && !canChange) {
            const staffBranch = branchData.branches.find((b: Branch) => b.id === branchId);
            if (staffBranch) {
              setSelectedBranch(staffBranch);
              localStorage.setItem('pos_selected_branch', JSON.stringify(staffBranch));
              loadProducts(staffBranch.id);
              loadCustomers();
              return;
            }
          }
          
          // For owners/managers, use saved branch or select main branch
          const saved = localStorage.getItem('pos_selected_branch');
          if (saved) {
            try {
              const savedBranch = JSON.parse(saved);
              const branch = branchData.branches.find((b: Branch) => b.id === savedBranch.id);
              if (branch) {
                setSelectedBranch(branch);
                loadProducts(branch.id);
                loadCustomers();
                return;
              }
            } catch {
              // Ignore parse error
            }
          }
          
          // Default to main branch or first branch
          const mainBranch = branchData.branches.find((b: Branch) => b.is_main_branch);
          const branchToSelect = mainBranch || branchData.branches[0];
          setSelectedBranch(branchToSelect);
          localStorage.setItem('pos_selected_branch', JSON.stringify(branchToSelect));
          loadProducts(branchToSelect.id);
        }
      }
      
      // Load customers
      loadCustomers();
      
      // Load VAT registration status
      try {
        const settingsResponse = await apiGet('business/service-settings/').catch(() => ({ success: false }));
        if (settingsResponse.success && settingsResponse.settings) {
          setIsVatRegistered(settingsResponse.settings.is_vat_registered || false);
        }
      } catch (err) {
        console.error("Failed to load VAT settings:", err);
      }
    } catch (error: any) {
      console.error("Failed to initialize POS:", error);
      toast({
        title: "Error",
        description: "Failed to load POS data. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const loadProducts = async (branchId?: number) => {
    try {
      setIsLoading(true);
      const branch = branchId || selectedBranch?.id;
      
      // Load first batch quickly for fast initial display
      let url = `business/products/?page_size=100`;
      if (branch) {
        url += `&branch_id=${branch}`;
      }
      const firstBatch = await apiGet(url);
      const initialProducts = firstBatch.products || [];
      setProducts(initialProducts);
      setFilteredProducts(initialProducts);
      setIsLoading(false);
      
      // If there are more products, load them in background
      if (firstBatch.pagination && firstBatch.pagination.total_pages > 1) {
        const totalPages = firstBatch.pagination.total_pages;
        let allProducts = [...initialProducts];
        
        // Load remaining pages in background (don't show loading indicator)
        for (let page = 2; page <= totalPages; page++) {
          try {
            let pageUrl = `business/products/?page=${page}&page_size=100`;
            if (branch) {
              pageUrl += `&branch_id=${branch}`;
            }
            const pageData = await apiGet(pageUrl);
            allProducts = [...allProducts, ...(pageData.products || [])];
            // Update products progressively
            setProducts([...allProducts]);
            setFilteredProducts([...allProducts]);
          } catch (e) {
            console.error(`Failed to load products page ${page}:`, e);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiGet('business/customers/');
      setCustomers(data.customers || []);
    } catch (error: any) {
      console.error("Failed to load customers:", error);
    }
  };

  const loadBranches = async () => {
    // This function is now primarily used for refreshing branches
    // Initial loading is handled by initializePOS
    try {
      const data = await apiGet('business/branches/');
      if (data.success && data.branches) {
        setBranches(data.branches);
      }
    } catch (error: any) {
      console.error("Failed to load branches:", error);
    }
  };

  const loadUserPermissions = async () => {
    // This function is now primarily used for refreshing permissions
    // Initial loading is handled by initializePOS
    try {
      const role = localStorage.getItem('role') || '';
      setUserRole(role);
      
      if (role === 'business_owner') {
        setCanChangeBranch(true);
        return;
      }
      
      const data = await apiGet('business/staff/me/');
      if (data.success && data.staff) {
        const staff = data.staff;
        setCanChangeBranch(staff.can_manage_branches || false);
        if (staff.branch?.id) {
          setStaffBranchId(staff.branch.id);
        }
      }
    } catch (error: any) {
      console.error("Failed to load user permissions:", error);
      setCanChangeBranch(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id.toString() === branchId);
    if (branch) {
      setSelectedBranch(branch);
      localStorage.setItem('pos_selected_branch', JSON.stringify(branch));
      toast({
        title: "Branch Changed",
        description: `Now operating from ${branch.name}`,
      });
    }
  };

  const loadTransactionHistory = async (date?: string) => {
    try {
      setHistoryLoading(true);
      const dateParam = date || selectedHistoryDate;
      // Load all sales for the date - sale_source filter removed for backward compatibility
      // since existing sales may not have sale_source set
      const data = await apiGet(`business/sales/?start_date=${dateParam}&end_date=${dateParam}&page_size=100`);
      setTransactionHistory(data.sales || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const normalizeReceiptData = (sale: any) => {
    const itemsSource = sale?.items || sale?.sale_items || [];
    const items = Array.isArray(itemsSource)
      ? itemsSource.map((item: any, index: number) => {
          const product = item?.product || {
            name: item?.product_name || item?.name || `Item ${index + 1}`,
            sku: item?.sku,
          };

          const quantity = Number(item?.quantity ?? 0);
          const unitPrice = Number(item?.unit_price ?? item?.price ?? 0);
          const totalPrice = Number(item?.total_price ?? (unitPrice * quantity) ?? 0);

          return {
            product,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          } as CartItem;
        })
      : [];

    const subtotal = Number(sale?.subtotal ?? sale?.total_amount ?? sale?.total ?? 0);
    const discount = Number(sale?.discount ?? sale?.discount_amount ?? 0);
    const tax = Number(sale?.tax ?? sale?.tax_amount ?? 0);
    const total = Number(
      sale?.total ??
        sale?.final_amount ??
        Math.max(0, subtotal - discount + tax)
    );

    return {
      sale_number: sale?.sale_number ?? sale?.id ?? '',
      items,
      subtotal,
      discount,
      tax,
      total,
      payment_method: sale?.payment_method ?? sale?.paymentMethod ?? 'cash',
      customer: sale?.customer,
      branch: sale?.branch,
      staff: sale?.staff,
      date: sale?.date ?? sale?.created_at ?? new Date().toISOString(),
    };
  };

  const reprintTransaction = (sale: any) => {
    setReceiptData(normalizeReceiptData(sale));
    printReceipt();
  };

  const viewTransactionHistory = () => {
    setShowHistoryDialog(true);
    loadTransactionHistory();
  };

  // Barcode scanning functions
  const startScanner = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).Html5Qrcode) {
        toast({
          title: 'Scanner Error',
          description: 'Scanner library not loaded. Please refresh the page.',
          variant: 'destructive'
        });
        return;
      }

      const Html5Qrcode = (window as any).Html5Qrcode;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!scannerContainerRef.current) {
        toast({
          title: 'Error',
          description: 'Scanner container not found.',
          variant: 'destructive'
        });
        return;
      }

      const scanner = new Html5Qrcode('barcode-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          handleBarcodeScanned(decodedText);
        },
        () => {}
      );

      setScannerActive(true);
    } catch (error: any) {
      console.error('Scanner error:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to start camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    setScannerActive(false);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      });
      stopScanner();
      setShowScannerDialog(false);
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive"
      });
    }
  };

  const handleManualBarcodeSubmit = () => {
    if (barcodeInput.trim()) {
      handleBarcodeScanned(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const newTotal = newQuantity * existingItem.unit_price;
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: newQuantity, total_price: newTotal }
          : item
      ));
    } else {
      const price = parseFloat(product.selling_price);
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: price,
        total_price: price,
      }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0.1, item.quantity + delta);
        setQuantityInputs(prev => ({ ...prev, [productId]: newQuantity.toString() }));
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  };

  const setDirectQuantity = (productId: number, quantity: string) => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        setQuantityInputs(prev => ({ ...prev, [productId]: quantity }));
        return {
          ...item,
          quantity: qty,
          total_price: qty * item.unit_price
        };
      }
      return item;
    }));
  };

  const handleQuantityInputChange = (productId: number, value: string) => {
    setQuantityInputs(prev => ({ ...prev, [productId]: value }));
    if (value.trim() === '') return;
    setDirectQuantity(productId, value);
  };

  const handleQuantityInputBlur = (productId: number) => {
    const current = quantityInputs[productId];
    const qty = parseFloat(current);
    if (!current || isNaN(qty) || qty <= 0) {
      const item = cart.find(ci => ci.product.id === productId);
      if (item) {
        setQuantityInputs(prev => ({ ...prev, [productId]: item.quantity.toString() }));
      }
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const applyDiscount = () => {
    setShowDiscountDialog(false);
    toast({
      title: "Discount Applied",
      description: `${discountType === "percentage" ? discountValue + "%" : "₦" + discountValue} discount applied`,
    });
  };

  const applyLoyaltyPoints = () => {
    if (!selectedCustomer) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer to use loyalty points",
        variant: "destructive"
      });
      return;
    }
    
    const maxPoints = Math.min(selectedCustomer.loyalty_points || 0, Math.floor(subtotal));
    setLoyaltyPointsToUse(Math.min(loyaltyPointsToUse, maxPoints));
    
    toast({
      title: "Loyalty Points Applied",
      description: `${loyaltyPointsToUse} points applied (₦${loyaltyPointsToUse} discount)`,
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (paymentMethod === "cash" && (!paymentAmount || parseFloat(paymentAmount) < total)) {
      toast({
        title: "Insufficient Payment",
        description: "Payment amount must be at least the total amount",
        variant: "destructive"
      });
      return;
    }
    if (paymentMethod === "credit" && !selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for credit sales",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const resolvedPaymentStatus = paymentMethod === "credit" ? "credit" : "completed";
      const saleData = {
        customer_id: selectedCustomer?.id,
        branch_id: selectedBranch?.id,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
        })),
        total_amount: subtotal,
        discount_amount: totalDiscount,
        tax_amount: tax,
        final_amount: total,
        payment_method: paymentMethod,
        payment_status: resolvedPaymentStatus,
        loyalty_points_used: loyaltyPointsToUse,
        sale_source: 'pos',  // Mark as POS sale
      };

      const response = await apiPost('business/sales/', saleData);
      
      setLastSaleId(response.sale.id);
      const receiptInfo = {
        sale_number: response.sale.sale_number,
        items: cart,
        subtotal,
        discount: totalDiscount,
        tax,
        total,
        payment_method: paymentMethod,
        customer: selectedCustomer,
        branch: response.sale.branch || selectedBranch,
        date: new Date().toISOString(),
      };
      setReceiptData(receiptInfo);
      
      // Auto-print to thermal printer if connected and enabled
      if (printerConnected && autoPrintEnabled) {
        await printToThermalPrinter(receiptInfo);
      }
      
      // Clear cart and reset
      setCart([]);
      setDiscountValue(0);
      setLoyaltyPointsToUse(0);
      setPaymentDialogOpen(false);
      setShowReceiptDialog(true);

      // Reload products to reflect updated stock (AJAX update, no page refresh)
      loadProducts(selectedBranch?.id);
      
      toast({
        title: "Sale Completed",
        description: "Transaction completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt - uses thermal printer if connected, otherwise browser print
  const printReceipt = async () => {
    if (!receiptData) return;
    
    // If SAM4s thermal printer is connected, use it directly
    if (printerConnected && serialPort) {
      await printToThermalPrinter(receiptData);
      return;
    }
    
    // Fallback to browser print dialog
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    
    // Get business info
    const businessName = localStorage.getItem('business_name') || "HENOTACE BUSINESS";
    const businessSlug = localStorage.getItem('business_slug');
    const staffName = receiptData.staff?.name || localStorage.getItem('user_first_name') || 'Staff';
    const receiptId = generateReceiptId(receiptData.sale_number);
    const saleDate = new Date(receiptData.date);
    const storeUrl = businessSlug ? `/store/${businessSlug}` : null;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${receiptId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 10px; 
            max-width: 300px; 
            margin: 0 auto;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .header .datetime { font-size: 11px; color: #666; }
          .header .receipt-id { font-size: 14px; font-weight: bold; margin: 5px 0; }
          .header .store-info { font-size: 10px; color: #666; }
          .header .business-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 10px 0 5px; 
            text-transform: uppercase;
          }
          .header .cashier { font-size: 11px; }
          .divider { 
            border-top: 1px dashed #000; 
            margin: 8px 0; 
          }
          .items-table { width: 100%; font-size: 11px; }
          .items-table th { 
            text-align: left; 
            font-weight: bold;
            padding: 2px 0;
            border-bottom: 1px solid #000;
          }
          .items-table th:nth-child(2),
          .items-table th:nth-child(3),
          .items-table th:nth-child(4) { text-align: right; }
          .items-table td { padding: 3px 0; vertical-align: top; }
          .items-table td:nth-child(2),
          .items-table td:nth-child(3),
          .items-table td:nth-child(4) { text-align: right; }
          .product-name { font-size: 10px; color: #333; }
          .totals { margin-top: 10px; text-align: right; }
          .totals div { margin: 3px 0; font-size: 11px; }
          .totals .total-line { 
            font-size: 16px; 
            font-weight: bold; 
            margin: 10px 0;
            padding-top: 5px;
            border-top: 2px solid #000;
          }
          .totals .payment { font-size: 11px; color: #666; }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .footer .thanks { font-weight: bold; margin-bottom: 10px; }
          .qr-container { margin: 10px auto; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px; }
          .qr-container img { width: 80px; height: 80px; }
          .qr-container .shop-text { font-size: 11px; font-weight: bold; text-align: left; }
          .qr-container .url { font-size: 8px; color: #666; word-break: break-all; text-align: left; }
          .print-btn { 
            display: block;
            width: 100%; 
            margin-top: 20px; 
            padding: 10px; 
            background: #000;
            color: #fff;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .print-btn { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="datetime">${saleDate.toLocaleDateString()} ${saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="receipt-id">Sales Receipt #${receiptId}</div>
          <div class="store-info">Branch: ${receiptData.branch?.name || 'Main'}</div>
          ${receiptData.branch?.address ? `<div class="store-info">${receiptData.branch.address}</div>` : ''}
          ${receiptData.branch?.phone ? `<div class="store-info">Tel: ${receiptData.branch.phone}</div>` : ''}
          <div class="business-name">${businessName}</div>
          <div class="cashier">Cashier: ${staffName}</div>
          ${receiptData.customer ? `<div class="cashier">Customer: ${receiptData.customer.name}</div>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Ext</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData.items.map((item: CartItem, index: number) => `
              <tr>
                <td>
                  <div class="product-name">${item.product.name}</div>
                  <div style="font-size:9px;color:#888;">${item.product.sku || (index + 1).toString().padStart(3, '0')}</div>
                </td>
                <td>${item.quantity}</td>
                <td>₦${item.unit_price.toFixed(0)}</td>
                <td>₦${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div>Subtotal: ₦${receiptData.subtotal.toFixed(2)}</div>
          ${receiptData.discount > 0 ? `<div>Discount: -₦${receiptData.discount.toFixed(2)}</div>` : ''}
          ${(receiptData.tax || 0) > 0 ? `<div>VAT (7.5%): ₦${(receiptData.tax || 0).toFixed(2)}</div>` : ''}
          <div class="total-line">TOTAL: ₦${receiptData.total.toFixed(2)}</div>
          <div class="payment">Payment: ${receiptData.payment_method.toUpperCase()}</div>
        </div>
        
        <div class="footer">
          <div class="thanks">Thanks for shopping with us!</div>
          ${storeUrl ? `
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(storeUrl)}" alt="Store QR Code" />
            <div>
              <div class="shop-text">Shop with us<br/>online!</div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <button class="print-btn" onclick="window.print()">Print Receipt</button>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadReceiptPDF = () => {
    if (!receiptData) return;
    
    // Get business info
    const businessName = localStorage.getItem('business_name') || "HENOTACE BUSINESS";
    const staffName = receiptData.staff?.name || localStorage.getItem('user_first_name') || 'Staff';
    const receiptId = generateReceiptId(receiptData.sale_number);
    const saleDate = new Date(receiptData.date);
    
    const receiptText = `
${'='.repeat(40)}
${saleDate.toLocaleDateString()} ${saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Sales Receipt #${receiptId}
Store: Main | Workstation: 1
${'='.repeat(40)}

${businessName.toUpperCase()}
Cashier: ${staffName}
${receiptData.customer ? `Customer: ${receiptData.customer.name}\n` : ''}
${'-'.repeat(40)}
ITEM                  QTY   PRICE    EXT
${'-'.repeat(40)}
${receiptData.items.map((item: CartItem, index: number) => {
  const itemId = item.product.sku || (index + 1).toString().padStart(3, '0');
  return `${item.product.name}
${itemId.slice(0,6).padEnd(18)}${item.quantity.toString().padStart(3)}  N${item.unit_price.toFixed(0).padStart(6)}  N${item.total_price.toFixed(2).padStart(8)}`;
}).join('\n')}

${'-'.repeat(40)}
${'Subtotal:'.padStart(30)} N${receiptData.subtotal.toFixed(2)}
${receiptData.discount > 0 ? `${'Discount:'.padStart(30)} -N${receiptData.discount.toFixed(2)}\n` : ''}${(receiptData.tax || 0) > 0 ? `${'VAT (7.5%):'.padStart(30)} N${(receiptData.tax || 0).toFixed(2)}\n` : ''}${'='.repeat(40)}
${'TOTAL:'.padStart(30)} N${receiptData.total.toFixed(2)}
${'Payment:'.padStart(30)} ${receiptData.payment_method.toUpperCase()}
${'='.repeat(40)}

       Thanks for shopping with us!

${'='.repeat(40)}
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been downloaded as a text file",
    });
  };

  const filteredCreditCustomers = customers.filter((customer) => {
    const query = creditCustomerSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      (customer.name || "").toLowerCase().includes(query) ||
      (customer.phone || "").toLowerCase().includes(query) ||
      (customer.customer_code || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          {/* Top Row - Back button and Title */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/business-admin-dashboard')} className="px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold whitespace-nowrap">Point of Sale</h1>
              <p className="text-muted-foreground text-sm hidden sm:block">Process sales and manage transactions</p>
            </div>
            
            {/* Branch Selector - Only show if user can change branches */}
            {branches.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
                {canChangeBranch && branches.length > 1 ? (
                  <Select 
                    value={selectedBranch?.id?.toString() || ""} 
                    onValueChange={handleBranchChange}
                  >
                    <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
                      <SelectValue placeholder="Select branch">
                        {selectedBranch && (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{selectedBranch.name}</span>
                            {selectedBranch.is_main_branch && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 hidden sm:inline-flex">HQ</Badge>
                            )}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{branch.name}</span>
                            {branch.is_main_branch && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">HQ</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  /* Staff can only see their branch name (no dropdown) */
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedBranch?.name || 'No Branch'}</span>
                    {selectedBranch?.is_main_branch && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">HQ</Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons - 2x2 grid on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {/* Printer Connection */}
            <Button 
              onClick={printerConnected ? disconnectPrinter : connectPrinter} 
              variant={printerConnected ? "default" : "outline"}
              className={`flex flex-col sm:flex-row items-center justify-center h-auto py-2 sm:py-2 sm:h-10 ${printerConnected ? "bg-green-600 hover:bg-green-700" : ""}`}
              size="sm"
            >
              <Usb className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-[10px] sm:text-sm leading-tight text-center">
                {printerConnected ? "Connected" : "Printer"}
              </span>
            </Button>
            
            {/* Auto Print Toggle - Only show when connected */}
            {printerConnected && (
              <Button 
                onClick={() => setAutoPrintEnabled(!autoPrintEnabled)} 
                variant={autoPrintEnabled ? "default" : "outline"}
                className="flex flex-col sm:flex-row items-center justify-center h-auto py-2 sm:py-2 sm:h-10"
                size="sm"
              >
                <Printer className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1 mb-1 sm:mb-0" />
                <span className="text-[10px] sm:text-sm leading-tight">
                  Auto {autoPrintEnabled ? "ON" : "OFF"}
                </span>
              </Button>
            )}

            {/* Held Transactions */}
            <Button 
              onClick={() => setShowHeldDialog(true)} 
              variant="outline"
              className="relative flex flex-col sm:flex-row items-center justify-center h-auto py-2 sm:py-2 sm:h-10"
              size="sm"
            >
              <Pause className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-[10px] sm:text-sm leading-tight">Held</span>
              {heldTransactions.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
                >
                  {heldTransactions.length}
                </Badge>
              )}
            </Button>

            {/* Scan Item */}
            <Button 
              onClick={() => setShowScannerDialog(true)} 
              variant="outline"
              className="flex flex-col sm:flex-row items-center justify-center h-auto py-2 sm:py-2 sm:h-10"
              size="sm"
            >
              <Scan className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-[10px] sm:text-sm leading-tight">Scan</span>
            </Button>
            
            {/* History */}
            <Button 
              onClick={viewTransactionHistory} 
              variant="outline"
              className="flex flex-col sm:flex-row items-center justify-center h-auto py-2 sm:py-2 sm:h-10"
              size="sm"
            >
              <ShoppingCart className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="text-[10px] sm:text-sm leading-tight">History</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8">
                      <PageSpinner />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No products found
                    </div>
                  ) : (
                    <>
                      {displayedProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                            <p className="text-lg font-bold text-primary">₦{parseFloat(product.selling_price).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Stock: {product.current_stock}</p>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Load More / Show Less Button */}
                      {hasMoreProducts && !searchQuery && (
                        <div className="col-span-full pt-4">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowAllProducts(!showAllProducts)}
                          >
                            <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAllProducts ? 'rotate-180' : ''}`} />
                            {showAllProducts 
                              ? `Show Less (${PRODUCTS_LIMIT} items)` 
                              : `Load More (${filteredProducts.length - PRODUCTS_LIMIT} more items)`
                            }
                          </Button>
                        </div>
                      )}
                      
                      {/* Product count info */}
                      <div className="col-span-full text-center text-sm text-muted-foreground pt-2">
                        Showing {displayedProducts.length} of {filteredProducts.length} products
                        {searchQuery && ` matching "${searchQuery}"`}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cart</span>
                  <Badge variant="secondary">{cart.length} items</Badge>
                </CardTitle>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select
                    value={selectedCustomer?.id.toString() || "walk-in"}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id.toString() === value);
                      setSelectedCustomer(customer || null);
                      setLoyaltyPointsToUse(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} ({customer.customer_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer && selectedCustomer.loyalty_points && selectedCustomer.loyalty_points > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Gift className="h-4 w-4" />
                      <span>{selectedCustomer.loyalty_points} loyalty points available</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">₦{item.unit_price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, -0.5)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={quantityInputs[item.product.id] ?? item.quantity.toString()}
                            onChange={(e) => handleQuantityInputChange(item.product.id, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(item.product.id)}
                            className="w-16 h-8 text-center text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, 0.5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">₦{item.total_price.toFixed(2)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscountDialog(true)}
                    className="flex-1"
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Discount
                  </Button>
                  {selectedCustomer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyLoyaltyPoints}
                      className="flex-1"
                      disabled={!selectedCustomer.loyalty_points || selectedCustomer.loyalty_points === 0}
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Loyalty
                    </Button>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₦{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-₦{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Loyalty Points:</span>
                      <span>-₦{loyaltyDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>VAT (7.5%):</span>
                      <span>₦{tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>₦{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={holdCurrentTransaction}
                    disabled={cart.length === 0}
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Hold
                  </Button>
                  <Button
                    className="flex-[2]"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScannerDialog} onOpenChange={(open) => {
        setShowScannerDialog(open);
        if (!open && scannerActive) {
          stopScanner();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Use your camera to scan product barcodes or enter manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="camera">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">Camera</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="camera" className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <div
                    id="barcode-scanner-container"
                    ref={scannerContainerRef}
                    className="w-full h-full"
                    style={{ display: scannerActive ? 'block' : 'none' }}
                  />
                  {!scannerActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startScanner}>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>
                {scannerActive && (
                  <Button onClick={stopScanner} variant="outline" className="w-full">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter Barcode/SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter barcode or SKU"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                    />
                    <Button onClick={handleManualBarcodeSubmit}>
                      Add
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Add a discount to the current transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Value</Label>
              <Input
                type="number"
                placeholder={discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Discount Amount: <span className="font-semibold">₦{discountAmount.toFixed(2)}</span>
              </p>
              <p className="text-sm">
                New Total: <span className="font-semibold">₦{(subtotal - discountAmount).toFixed(2)}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>Cancel</Button>
            <Button onClick={applyDiscount}>Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete the transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-lg">₦{total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "credit" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Customer (Credit)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search customer name, phone, or code"
                      value={creditCustomerSearch}
                      onChange={(e) => setCreditCustomerSearch(e.target.value)}
                    />
                    <Button type="button" variant="outline">
                      Search
                    </Button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredCreditCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                        selectedCustomer?.id === customer.id ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setLoyaltyPointsToUse(0);
                        toast({
                          title: "Customer Selected",
                          description: customer.name || "Customer selected",
                        });
                      }}
                    >
                      <div className="font-medium">{customer.name || "Unnamed Customer"}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.customer_code}{customer.phone ? ` • ${customer.phone}` : ""}
                      </div>
                    </button>
                  ))}
                  {filteredCreditCustomers.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No matching customers
                    </div>
                  )}
                </div>
                {selectedCustomer ? (
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedCustomer.name}</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Select a customer to attach this credit sale.
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "cash" && (
              <>
                <div className="space-y-2">
                  <Label>Amount Received</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                {paymentAmount && parseFloat(paymentAmount) >= total && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Change: ₦{change.toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={processPayment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
            <DialogDescription>
              Sale completed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">Receipt #{receiptData?.sale_number}</p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={printReceipt} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                {printerConnected ? 'Print to SAM4s' : 'Print Receipt'}
              </Button>
              <Button onClick={downloadReceiptPDF} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReceiptDialog(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {/* Delayed loading overlay for slow loads */}
          <DelayedLoadingOverlay 
            isLoading={historyLoading} 
            delay={5000}
            message="Loading POS history..."
          />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              POS Transaction History
            </DialogTitle>
            <DialogDescription>
              View and reprint past POS transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>Select Date:</Label>
                <Input
                  type="date"
                  value={selectedHistoryDate}
                  onChange={(e) => {
                    setSelectedHistoryDate(e.target.value);
                    loadTransactionHistory(e.target.value);
                  }}
                  className="w-auto"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowHistoryDialog(false);
                  navigate(`/business/sales-details?start_date=${selectedHistoryDate}&end_date=${selectedHistoryDate}`);
                }}
              >
                View Full Sales Report
              </Button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <PageSpinner message="Loading POS transactions..." />
              </div>
            ) : transactionHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No POS transactions found for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactionHistory.map((sale) => (
                  <Card key={sale.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{sale.sale_number}</h3>
                            <Badge variant={sale.payment_status === 'completed' ? 'default' : 'secondary'}>
                              {sale.payment_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm">
                            Customer: <span className="font-medium">{sale.customer?.name || 'Walk-in'}</span>
                          </p>
                          {sale.staff && (
                            <p className="text-sm">
                              Staff: <span className="font-medium">
                                {sale.staff.is_owner ? 'Business Owner' : sale.staff.name}
                              </span>
                            </p>
                          )}
                          {sale.items && sale.items.length > 0 && (
                            <div className="mt-2 text-sm">
                              <p className="font-semibold">Items:</p>
                              <ul className="list-disc list-inside text-muted-foreground">
                                {sale.items.map((item: any, idx: number) => (
                                  <li key={idx}>
                                    {item.product?.name || 'Unknown'} (x{item.quantity}) - ₦{parseFloat(item.total_price || 0).toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">₦{parseFloat(sale.final_amount || sale.total_amount || 0).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground mb-2">{sale.payment_method}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reprintTransaction(sale)}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Reprint
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Note Dialog */}
      <Dialog open={showHoldNoteDialog} onOpenChange={setShowHoldNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5" />
              Hold Transaction
            </DialogTitle>
            <DialogDescription>
              Save this transaction to continue later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Transaction Summary</p>
              <p className="text-lg font-bold">₦{total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{cart.length} items</p>
              {selectedCustomer && (
                <p className="text-sm text-muted-foreground">Customer: {selectedCustomer.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g., Customer went to get more items..."
                value={holdNote}
                onChange={(e) => setHoldNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldNoteDialog(false)}>Cancel</Button>
            <Button onClick={confirmHoldTransaction}>
              <Pause className="w-4 h-4 mr-2" />
              Hold Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Held Transactions Dialog */}
      <Dialog open={showHeldDialog} onOpenChange={setShowHeldDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Held Transactions
            </DialogTitle>
            <DialogDescription>
              Resume or delete held transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {heldTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pause className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No held transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {heldTransactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {transaction.cart.length} items
                            </h3>
                            <Badge variant="secondary">
                              ₦{transaction.cart.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                          {transaction.customer && (
                            <p className="text-sm">
                              Customer: <span className="font-medium">{transaction.customer.name}</span>
                            </p>
                          )}
                          {transaction.note && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{transaction.note}"
                            </p>
                          )}
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">
                              {transaction.cart.slice(0, 3).map(item => item.product.name).join(', ')}
                              {transaction.cart.length > 3 && ` +${transaction.cart.length - 3} more`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => resumeHeldTransaction(transaction)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteHeldTransaction(transaction.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHeldDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
