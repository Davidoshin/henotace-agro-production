import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { ArrowLeft, Plus, Edit, Trash2, Package, Image as ImageIcon, FolderTree, Search, ArrowRightLeft, Warehouse, AlertTriangle, RefreshCw, Palette, X, Shirt, Zap, Clock, Calendar, Globe, ExternalLink, Upload, FileSpreadsheet, Download, ClipboardPaste } from "lucide-react";
import { PageSpinner, ButtonSpinner, SectionSpinner, SavingOverlay } from "@/components/ui/LoadingSpinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmailVerificationGate, checkEmailVerification } from "@/components/account/EmailVerificationGate";

interface ProductVariant {
  id?: number;
  size?: string;
  color?: string;
  color_code?: string;
  variant_sku?: string;
  price_adjustment: number;
  selling_price?: number;
  current_stock: number;
  min_stock_level: number;
  image?: string;
  is_active?: boolean;
  is_low_stock?: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  selling_price: string;
  cost_price?: string;
  current_stock: number;
  unit?: string;
  image?: string;
  category?: {
    id: number;
    name: string;
    supports_weight: boolean;
    parent_category?: {
      id: number;
      name: string;
    };
  };
  supports_carton?: boolean;
  carton_size?: number;
  carton_price?: number;
  weight_kg?: number;
  branch_stocks?: Array<{
    branch_id: number;
    branch_name: string;
    stock: number;
  }>;
  has_variants?: boolean;
  available_sizes?: string[];
  available_colors?: string[];
  variants?: ProductVariant[];
  // Flash Sale Fields
  is_flash_sale?: boolean;
  flash_sale_price?: number;
  flash_sale_start?: string;
  flash_sale_end?: string;
  // Digital Product Fields
  is_digital?: boolean;
  digital_file_url?: string;
  digital_access_instructions?: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_category?: {
    id: number;
    name: string;
  };
  subcategories: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  supports_weight: boolean;
  supports_volume: boolean;
  default_unit: string;
  product_count: number;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  is_main: boolean;
}

interface BranchStock {
  id: number;
  branch_id: number;
  branch_name: string;
  product_id: number;
  product_name: string;
  product_sku: string;
  current_stock: number;
  min_stock_level: number;
  is_low_stock: boolean;
  last_restocked: string | null;
  last_sale_date: string | null;
}

interface StockTransfer {
  id: number;
  transfer_number?: string;
  from_branch: string;
  from_branch_id: number | null;
  to_branch: string;
  to_branch_id: number;
  product: string;
  product_id: number;
  quantity: number;
  status: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function ProductManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [transferHistory, setTransferHistory] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<{ flash_sales_enabled?: boolean }>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEditBranchStockDialog, setShowEditBranchStockDialog] = useState(false);
  const [editingBranchStock, setEditingBranchStock] = useState<BranchStock | null>(null);
  const [editBranchStockForm, setEditBranchStockForm] = useState({ current_stock: "", min_stock_level: "" });
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Product search in dialogs
  const [stockProductSearch, setStockProductSearch] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;
  
  // Stock adjustment state
  const [stockAdjustment, setStockAdjustment] = useState({
    branch_id: "",
    product_id: "",
    quantity: "",
    adjustment_type: "add",
    notes: ""
  });
  
  // Stock transfer state
  const [stockTransfer, setStockTransfer] = useState({
    from_branch_id: "",
    to_branch_id: "",
    product_id: "",
    quantity: "",
    notes: ""
  });

  // Flash sale form state
  const [flashSaleForm, setFlashSaleForm] = useState({
    product_id: null as number | null,
    flash_sale_price: 0,
    flash_sale_start: '',
    flash_sale_end: '',
    original_price: 0
  });
  
  // Product form state - simplified: products go to Main Branch by default
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    barcode: "",
    parent_category_id: "",
    category_id: "",
    price: "",
    cost_price: "",
    quantity: "",
    unit: "piece",
    weight_kg: "",
    supports_carton: false,
    carton_size: "",
    carton_price: "",
    description: "",
    has_variants: false,
    available_sizes: [] as string[],
    available_colors: [] as Array<{name: string; code: string}>,
    is_digital: false,
    digital_file_url: "",
    digital_access_instructions: "",
  });
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newColorInput, setNewColorInput] = useState({ name: "", code: "#000000" });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  
  // Check if business has additional branches (beyond main)
  const hasAdditionalBranches = branches.filter(b => !b.is_main).length > 0;
  
  // Store Stock tab state
  const [stores, setStores] = useState<Array<{id: number; name: string; code: string; branch: {id: number; name: string}; allow_direct_sales: boolean}>>([]);
  const [storeStock, setStoreStock] = useState<Array<{id: number; store: {id: number; name: string}; product: {id: number; name: string; sku: string}; current_stock: number; min_stock_level: number}>>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("all");
  const [storeStockLoading, setStoreStockLoading] = useState(false);
  const [showAddStoreStockDialog, setShowAddStoreStockDialog] = useState(false);
  const [showStoreTransferDialog, setShowStoreTransferDialog] = useState(false);
  const [showEditStoreStockDialog, setShowEditStoreStockDialog] = useState(false);
  const [editingStoreStock, setEditingStoreStock] = useState<{id: number; store: {id: number; name: string}; product: {id: number; name: string; sku: string}; current_stock: number; min_stock_level: number} | null>(null);
  const [editStoreStockForm, setEditStoreStockForm] = useState({ current_stock: "", min_stock_level: "" });
  
  // Loading states for save operations (prevents double-clicking)
  const [savingStoreStock, setSavingStoreStock] = useState(false);
  const [savingBranchStock, setSavingBranchStock] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  // Bulk Import state
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportMode, setBulkImportMode] = useState<'file' | 'paste'>('file');
  const [bulkImportCsvText, setBulkImportCsvText] = useState('');
  const [bulkImportResult, setBulkImportResult] = useState<{
    created_count: number;
    skipped_count: number;
    error_count: number;
    created_products: Array<{ id: number; name: string; sku: string; selling_price: number; quantity: number }>;
    skipped: Array<{ row: number; name?: string; reason: string }>;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  
  // Bulk Branch Stock Import state
  const [branchStockImportMode, setBranchStockImportMode] = useState<'single' | 'bulk'>('single');
  const [branchStockBulkFile, setBranchStockBulkFile] = useState<File | null>(null);
  const [branchStockBulkCsv, setBranchStockBulkCsv] = useState('');
  const [branchStockBulkInputMode, setBranchStockBulkInputMode] = useState<'file' | 'paste'>('file');
  const [branchStockBulkLoading, setBranchStockBulkLoading] = useState(false);
  const [branchStockBulkResult, setBranchStockBulkResult] = useState<{
    total_processed: number;
    total_errors: number;
    successful: Array<{ product_name: string; sku: string; previous_stock: number; new_stock: number; quantity_changed: number }>;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  
  // Bulk Store Stock Import state
  const [storeStockImportMode, setStoreStockImportMode] = useState<'single' | 'bulk'>('single');
  const [storeStockBulkFile, setStoreStockBulkFile] = useState<File | null>(null);
  const [storeStockBulkCsv, setStoreStockBulkCsv] = useState('');
  const [storeStockBulkInputMode, setStoreStockBulkInputMode] = useState<'file' | 'paste'>('file');
  const [storeStockBulkLoading, setStoreStockBulkLoading] = useState(false);
  const [storeStockBulkResult, setStoreStockBulkResult] = useState<{
    total_processed: number;
    total_errors: number;
    successful: Array<{ product_name: string; sku: string; previous_stock: number; new_stock: number; quantity_added: number }>;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  
  const [storeStockForm, setStoreStockForm] = useState({
    store_id: "",
    product_id: "",
    quantity: "",
  });
  const [storeTransferForm, setStoreTransferForm] = useState({
    from_store_id: "",
    to_branch_id: "",
    product_id: "",
    quantity: "",
    notes: "",
  });
  
  // Product search for dialogs
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<Array<{id: number; name: string; sku: string; current_stock: number}>>([]);
    const [showEmailVerificationGate, setShowEmailVerificationGate] = useState(false);
  const [canManageInventory, setCanManageInventory] = useState<boolean | null>(null);
  
  // Branch stock breakdown dialog
  const [showBranchStockDialog, setShowBranchStockDialog] = useState(false);
  const [selectedProductBranchStock, setSelectedProductBranchStock] = useState<{
    productName: string;
    unit: string;
    branchStocks: Array<{branch_id: number; branch_name: string; stock: number}>;
  } | null>(null);
  
  // Category form state
  const [newCategory, setNewCategory] = useState({
    name: "",
    code: "",
    description: "",
    parent_category_id: "",
    supports_weight: false,
    supports_volume: false,
    default_unit: "piece",
  });

  const stripAmountFormatting = (value: string) => value.replace(/,/g, "").trim();

  const formatAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const firstDotIndex = cleaned.indexOf(".");
    const normalized = firstDotIndex === -1
      ? cleaned
      : `${cleaned.slice(0, firstDotIndex + 1)}${cleaned.slice(firstDotIndex + 1).replace(/\./g, "")}`;

    const [integerPart = "", decimalPart] = normalized.split(".");
    const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart.slice(0, 2)}`
      : formattedInteger;
  };

  const formatAmountOnBlur = (value: string) => {
    const raw = stripAmountFormatting(value);
    if (!raw) return "";
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return "";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          const allowed = !!data?.staff?.can_manage_inventory;
          setCanManageInventory(allowed);
          if (!allowed) {
            toast({ title: "Access denied", description: "You don't have permission to manage inventory", variant: "destructive" });
            navigate('/business-staff-dashboard');
          }
        })
        .catch(() => {
          setCanManageInventory(false);
          toast({ title: "Access denied", description: "You don't have permission to manage inventory", variant: "destructive" });
          navigate('/business-staff-dashboard');
        });
    } else {
      setCanManageInventory(true);
    }
  }, [navigate, toast]);

  useEffect(() => { 
    if (!canManageInventory) return;
    const autoOpenAdd = async () => {
      load(); 
      loadCategories();
      loadBranches();
      loadAllStores();
      loadBusinessSettings();
      if (searchParams.get('action') === 'add') {
        await requireEmailVerification(() => setShowAddDialog(true));
      }
    };
    void autoOpenAdd();
  }, [searchParams, canManageInventory]);

  const requireEmailVerification = async (onVerified: () => void) => {
    const verified = await checkEmailVerification();
    if (verified) {
      onVerified();
      return;
    }
    setShowEmailVerificationGate(true);
  };

  const handleEmailGateChange = (open: boolean) => {
    setShowEmailVerificationGate(open);
  };

  // Load business settings to check if flash sales is enabled
  const loadBusinessSettings = async () => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      setBusinessSettings({ flash_sales_enabled: false });
      return;
    }
    try {
      const data = await apiGet('business/update/');
      if (data.business) {
        setBusinessSettings({
          flash_sales_enabled: data.business.flash_sales_enabled ?? false
        });
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
  };

  useEffect(() => {
    if (!canManageInventory) return;
    if (activeTab === 'branch-stock') {
      loadBranchStock();
      loadTransferHistory();
    } else if (activeTab === 'store-stock') {
      loadStoreStock();
    }
  }, [activeTab, canManageInventory]);

  const load = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', PAGE_SIZE.toString());
      
      const data = await apiGet(`business/products/?${params.toString()}`);
      
      if (append) {
        setProducts(prev => [...prev, ...(data.products || [])]);
      } else {
        setProducts(data.products || []);
      }
      
      // Update pagination state
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
        setTotalProducts(data.pagination.total);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      load(currentPage + 1, true);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiGet("business/categories/");
      setCategories(data.categories || []);
    } catch (e: any) {
      console.error("Failed to load categories:", e);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await apiGet("business/branches/");
      setBranches(data.branches || []);
    } catch (e: any) {
      console.error("Failed to load branches:", e);
    }
  };

  const loadAllStores = async () => {
    try {
      const data = await apiGet("business/stores/");
      setStores(data.stores || []);
    } catch (e: any) {
      console.error("Failed to load all stores:", e);
      setStores([]);
    }
  };

  const loadStoreStock = async () => {
    try {
      setStoreStockLoading(true);
      let url = "business/stores/";
      
      if (selectedStoreFilter !== "all") {
        // Get stock for specific store
        const storeData = await apiGet(`business/stores/${selectedStoreFilter}/`);
        if (storeData.success && storeData.store?.stock_items) {
          setStoreStock(storeData.store.stock_items.map((item: any) => ({
            id: item.id,
            store: { id: parseInt(selectedStoreFilter), name: "" },
            product: { id: item.product_id, name: item.product_name, sku: item.product_sku },
            current_stock: item.current_stock,
            min_stock_level: item.min_stock_level,
          })));
        } else {
          setStoreStock([]);
        }
      } else {
        // Get all stores and aggregate stock
        const storesData = await apiGet("business/stores/");
        const allStock: any[] = [];
        for (const store of (storesData.stores || [])) {
          const storeDetail = await apiGet(`business/stores/${store.id}/`);
          if (storeDetail.success && storeDetail.store?.stock_items) {
            for (const item of storeDetail.store.stock_items) {
              allStock.push({
                id: item.id,
                store: { id: store.id, name: store.name },
                product: { id: item.product_id, name: item.product_name, sku: item.product_sku },
                current_stock: item.current_stock,
                min_stock_level: item.min_stock_level,
              });
            }
          }
        }
        setStoreStock(allStock);
      }
    } catch (e: any) {
      console.error("Failed to load store stock:", e);
      setStoreStock([]);
    } finally {
      setStoreStockLoading(false);
    }
  };

  const handleAddStoreStock = async () => {
    if (!storeStockForm.store_id || !storeStockForm.product_id || !storeStockForm.quantity) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const response = await apiPost(`business/stores/${storeStockForm.store_id}/add-stock/`, {
        product_id: parseInt(storeStockForm.product_id),
        quantity: parseFloat(storeStockForm.quantity),
      });
      if (response.success) {
        toast({ title: "Success", description: "Stock added to store successfully" });
        setShowAddStoreStockDialog(false);
        setStoreStockForm({ store_id: "", product_id: "", quantity: "" });
        loadStoreStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to add stock", variant: "destructive" });
    }
  };

  const handleBulkStoreStockAdd = async () => {
    if (!storeStockForm.store_id) {
      toast({ title: "Error", description: "Please select a store", variant: "destructive" });
      return;
    }
    
    if (storeStockBulkInputMode === 'file' && !storeStockBulkFile) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" });
      return;
    }
    
    if (storeStockBulkInputMode === 'paste' && !storeStockBulkCsv.trim()) {
      toast({ title: "Error", description: "Please paste CSV data", variant: "destructive" });
      return;
    }
    
    setStoreStockBulkLoading(true);
    setStoreStockBulkResult(null);
    
    try {
      let response;
      
      if (storeStockBulkInputMode === 'file' && storeStockBulkFile) {
        const formData = new FormData();
        formData.append('file', storeStockBulkFile);
        
        response = await fetch(`/api/business/stores/${storeStockForm.store_id}/bulk-add-stock/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          },
          body: formData
        });
      } else {
        response = await fetch(`/api/business/stores/${storeStockForm.store_id}/bulk-add-stock/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            csv_data: storeStockBulkCsv
          })
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk add stock');
      }
      
      setStoreStockBulkResult(data);
      
      if (data.total_processed > 0) {
        toast({ 
          title: "Bulk Import Complete", 
          description: `${data.total_processed} products added${data.total_errors > 0 ? `, ${data.total_errors} errors` : ''}`
        });
        loadStoreStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to bulk add stock", variant: "destructive" });
    } finally {
      setStoreStockBulkLoading(false);
    }
  };

  const handleStoreTransfer = async () => {
    if (!storeTransferForm.from_store_id || !storeTransferForm.to_branch_id || !storeTransferForm.product_id || !storeTransferForm.quantity) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const response = await apiPost("business/store-transfers/", {
        transfer_type: "store_to_branch",
        from_store_id: parseInt(storeTransferForm.from_store_id),
        to_branch_id: parseInt(storeTransferForm.to_branch_id),
        product_id: parseInt(storeTransferForm.product_id),
        quantity: parseFloat(storeTransferForm.quantity),
        notes: storeTransferForm.notes,
        auto_complete: true,
      });
      if (response.success) {
        toast({ title: "Success", description: "Stock transferred to branch successfully" });
        setShowStoreTransferDialog(false);
        setStoreTransferForm({ from_store_id: "", to_branch_id: "", product_id: "", quantity: "", notes: "" });
        setSelectedStoreProducts([]);
        loadStoreStock();
        loadBranchStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to transfer stock", variant: "destructive" });
    }
  };

  const handleEditStoreStock = async () => {
    if (!editingStoreStock || savingStoreStock) return;
    setSavingStoreStock(true);
    try {
      const response = await apiPut(`business/store-stock/${editingStoreStock.id}/`, {
        current_stock: parseFloat(editStoreStockForm.current_stock),
        min_stock_level: parseFloat(editStoreStockForm.min_stock_level || "0"),
      });
      if (response.success) {
        toast({ title: "Success", description: "Store stock updated successfully" });
        setShowEditStoreStockDialog(false);
        setEditingStoreStock(null);
        loadStoreStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update stock", variant: "destructive" });
    } finally {
      setSavingStoreStock(false);
    }
  };

  const handleDeleteStoreStock = async (stockItem: typeof storeStock[0]) => {
    if (stockItem.current_stock > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `Set stock to 0 first or transfer the ${stockItem.current_stock} units before deleting.`, 
        variant: "destructive" 
      });
      return;
    }
    if (!confirm(`Remove ${stockItem.product.name} from ${stockItem.store.name}?`)) return;
    try {
      const response = await apiDelete(`business/store-stock/${stockItem.id}/`);
      if (response.success) {
        toast({ title: "Success", description: "Store stock removed successfully" });
        loadStoreStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete stock", variant: "destructive" });
    }
  };

  const handleEditBranchStock = async () => {
    if (!editingBranchStock || savingBranchStock) return;
    setSavingBranchStock(true);
    try {
      const response = await apiPut(`business/branch-stock/${editingBranchStock.id}/`, {
        current_stock: parseFloat(editBranchStockForm.current_stock),
        min_stock_level: parseFloat(editBranchStockForm.min_stock_level || "0"),
      });
      if (response.success) {
        toast({ title: "Success", description: "Branch stock updated successfully" });
        setShowEditBranchStockDialog(false);
        setEditingBranchStock(null);
        loadBranchStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update stock", variant: "destructive" });
    } finally {
      setSavingBranchStock(false);
    }
  };

  const handleDeleteBranchStock = async (stockItem: BranchStock) => {
    if (stockItem.current_stock > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `Set stock to 0 first or transfer the ${stockItem.current_stock} units before deleting.`, 
        variant: "destructive" 
      });
      return;
    }
    if (!confirm(`Remove ${stockItem.product_name} from ${stockItem.branch_name}?`)) return;
    try {
      const response = await apiDelete(`business/branch-stock/${stockItem.id}/`);
      if (response.success) {
        toast({ title: "Success", description: "Branch stock removed successfully" });
        loadBranchStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete stock", variant: "destructive" });
    }
  };

  // Load products from a specific store (for transfers)
  const loadStoreProducts = async (storeId: string) => {
    if (!storeId) {
      setSelectedStoreProducts([]);
      return;
    }
    try {
      const storeData = await apiGet(`business/stores/${storeId}/`);
      if (storeData.success && storeData.store?.stock_items) {
        setSelectedStoreProducts(storeData.store.stock_items.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          current_stock: item.current_stock,
        })));
      } else {
        setSelectedStoreProducts([]);
      }
    } catch (e) {
      console.error("Failed to load store products:", e);
      setSelectedStoreProducts([]);
    }
  };

  const loadBranchStock = async () => {
    try {
      setStockLoading(true);
      let url = "business/branch-stock/";
      const params = [];
      if (selectedBranchFilter !== "all") {
        params.push(`branch_id=${selectedBranchFilter}`);
      }
      if (selectedProductFilter !== "all") {
        params.push(`product_id=${selectedProductFilter}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      const data = await apiGet(url);
      setBranchStock(data.branch_stock || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load branch stock", variant: "destructive" });
    } finally {
      setStockLoading(false);
    }
  };

  const loadTransferHistory = async () => {
    try {
      const data = await apiGet("business/branch-stock/transfer-history/");
      setTransferHistory(data.transfers || []);
    } catch (e: any) {
      console.error("Failed to load transfer history:", e);
    }
  };

  const handleStockAdjustment = async () => {
    try {
      if (!stockAdjustment.branch_id || !stockAdjustment.product_id || !stockAdjustment.quantity) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      
      await apiPost("business/branch-stock/update/", {
        branch_id: parseInt(stockAdjustment.branch_id),
        product_id: parseInt(stockAdjustment.product_id),
        quantity: parseFloat(stockAdjustment.quantity),
        adjustment_type: stockAdjustment.adjustment_type,
        notes: stockAdjustment.notes
      });
      
      toast({ title: "Success", description: "Stock updated successfully" });
      setShowStockDialog(false);
      setStockAdjustment({ branch_id: "", product_id: "", quantity: "", adjustment_type: "add", notes: "" });
      loadBranchStock();
      loadTransferHistory();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update stock", variant: "destructive" });
    }
  };

  const handleBulkBranchStockUpdate = async () => {
    if (!stockAdjustment.branch_id) {
      toast({ title: "Error", description: "Please select a branch", variant: "destructive" });
      return;
    }
    
    if (branchStockBulkInputMode === 'file' && !branchStockBulkFile) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" });
      return;
    }
    
    if (branchStockBulkInputMode === 'paste' && !branchStockBulkCsv.trim()) {
      toast({ title: "Error", description: "Please paste CSV data", variant: "destructive" });
      return;
    }
    
    setBranchStockBulkLoading(true);
    setBranchStockBulkResult(null);
    
    try {
      let response;
      
      if (branchStockBulkInputMode === 'file' && branchStockBulkFile) {
        const formData = new FormData();
        formData.append('file', branchStockBulkFile);
        formData.append('branch_id', stockAdjustment.branch_id);
        formData.append('adjustment_type', stockAdjustment.adjustment_type);
        formData.append('notes', stockAdjustment.notes || 'Bulk import');
        
        response = await fetch('/api/business/branch-stock/bulk-update/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          },
          body: formData
        });
      } else {
        response = await fetch('/api/business/branch-stock/bulk-update/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            branch_id: parseInt(stockAdjustment.branch_id),
            adjustment_type: stockAdjustment.adjustment_type,
            notes: stockAdjustment.notes || 'Bulk import',
            csv_data: branchStockBulkCsv
          })
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk update stock');
      }
      
      setBranchStockBulkResult(data);
      
      if (data.total_processed > 0) {
        toast({ 
          title: "Bulk Import Complete", 
          description: `${data.total_processed} products updated${data.total_errors > 0 ? `, ${data.total_errors} errors` : ''}`
        });
        loadBranchStock();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to bulk update stock", variant: "destructive" });
    } finally {
      setBranchStockBulkLoading(false);
    }
  };

  const handleStockTransfer = async () => {
    try {
      if (!stockTransfer.from_branch_id || !stockTransfer.to_branch_id || !stockTransfer.product_id || !stockTransfer.quantity) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      
      await apiPost("business/branch-stock/transfer/", {
        from_branch_id: parseInt(stockTransfer.from_branch_id),
        to_branch_id: parseInt(stockTransfer.to_branch_id),
        product_id: parseInt(stockTransfer.product_id),
        quantity: parseFloat(stockTransfer.quantity),
        notes: stockTransfer.notes
      });
      
      toast({ title: "Success", description: "Stock transferred successfully" });
      setShowTransferDialog(false);
      setStockTransfer({ from_branch_id: "", to_branch_id: "", product_id: "", quantity: "", notes: "" });
      loadBranchStock();
      loadTransferHistory();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to transfer stock", variant: "destructive" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoGenerateSKU = async () => {
    if (!newProduct.name) {
      toast({ title: "Error", description: "Enter product name first", variant: "destructive" });
      return;
    }

    try {
      const data = await apiPost("business/generate-sku/", {
        product_name: newProduct.name,
        category_id: newProduct.category_id || null,
      });
      setNewProduct({ ...newProduct, sku: data.sku });
      toast({ title: "SKU Generated", description: `Generated SKU: ${data.sku}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate SKU", variant: "destructive" });
    }
  };

  const createProduct = async () => {
    if (savingProduct) return;
    setSavingProduct(true);
    try {
      const formData = new FormData();
      const normalizedSellingPrice = stripAmountFormatting(newProduct.price);
      const normalizedCostPrice = stripAmountFormatting(newProduct.cost_price || newProduct.price);
      const normalizedCartonPrice = stripAmountFormatting(newProduct.carton_price);

      formData.append("name", newProduct.name);
      formData.append("sku", newProduct.sku);
      if (newProduct.barcode) formData.append("barcode", newProduct.barcode);
      formData.append("cost_price", normalizedCostPrice);
      formData.append("selling_price", normalizedSellingPrice);
      formData.append("current_stock", newProduct.quantity);
      formData.append("unit", newProduct.unit);
      
      // Products always go to Main Branch - no branch/store selection in product form
      // User can add to other branches via Branch Stock tab
      // User can add to stores via Store Stock tab
      
      // Handle category: use subcategory if selected, otherwise use parent category
      const categoryToSave = newProduct.category_id || newProduct.parent_category_id;
      if (categoryToSave) formData.append("category_id", categoryToSave);
      
      if (newProduct.description) formData.append("description", newProduct.description);
      if (newProduct.weight_kg) formData.append("weight_kg", newProduct.weight_kg);
      if (newProduct.supports_carton) {
        formData.append("supports_carton", "true");
        if (newProduct.carton_size) formData.append("carton_size", newProduct.carton_size);
        if (normalizedCartonPrice) formData.append("carton_price", normalizedCartonPrice);
      }
      
      // Add variant data
      if (newProduct.has_variants) {
        formData.append("has_variants", "true");
        formData.append("available_sizes", JSON.stringify(newProduct.available_sizes));
        formData.append("available_colors", JSON.stringify(newProduct.available_colors.map(c => c.name)));
        
        // Generate variants list for bulk creation
        const variants: Array<{size?: string; color?: string; color_code?: string; current_stock: number; min_stock_level: number; price_adjustment: number}> = [];
        
        if (newProduct.available_sizes.length > 0 && newProduct.available_colors.length > 0) {
          // Both sizes and colors - create all combinations
          for (const size of newProduct.available_sizes) {
            for (const color of newProduct.available_colors) {
              variants.push({
                size,
                color: color.name,
                color_code: color.code,
                current_stock: 0,
                min_stock_level: 0,
                price_adjustment: 0,
              });
            }
          }
        } else if (newProduct.available_sizes.length > 0) {
          // Only sizes
          for (const size of newProduct.available_sizes) {
            variants.push({
              size,
              current_stock: 0,
              min_stock_level: 0,
              price_adjustment: 0,
            });
          }
        } else if (newProduct.available_colors.length > 0) {
          // Only colors
          for (const color of newProduct.available_colors) {
            variants.push({
              color: color.name,
              color_code: color.code,
              current_stock: 0,
              min_stock_level: 0,
              price_adjustment: 0,
            });
          }
        }
        
        if (variants.length > 0) {
          formData.append("variants", JSON.stringify(variants));
        }
      }
      
      // Digital product fields
      if (newProduct.is_digital) {
        formData.append("is_digital", "true");
        if (newProduct.digital_file_url) formData.append("digital_file_url", newProduct.digital_file_url);
        if (newProduct.digital_access_instructions) formData.append("digital_access_instructions", newProduct.digital_access_instructions);
      }
      
      if (productImage) formData.append("image", productImage);

      if (editingProduct) {
        // Update existing product - use apiPut which handles token refresh
        await apiPut(`business/products/${editingProduct.id}/`, formData);
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        // Create new product
        await apiPost("business/products/", formData);
        toast({ title: "Success", description: "Product added successfully" });
      }
      
      setNewProduct({ name: "", sku: "", barcode: "", parent_category_id: "", category_id: "", price: "", cost_price: "", quantity: "", unit: "piece", weight_kg: "", supports_carton: false, carton_size: "", carton_price: "", description: "", has_variants: false, available_sizes: [], available_colors: [], is_digital: false, digital_file_url: "", digital_access_instructions: "" });
      setProductVariants([]);
      setNewSizeInput("");
      setNewColorInput({ name: "", code: "#000000" });
      setProductImage(null);
      setImagePreview("");
      setSelectedParentCategory(null);
      setEditingProduct(null);
      setShowAddDialog(false);
      await load();
    } catch (e: any) {
      // Check if upgrade is required (plan limit reached)
      if (e.data?.upgrade_required || e.upgrade_required) {
        toast({ 
          title: "Plan Limit Reached", 
          description: (
            <div>
              {e.message || e.data?.error || "You've reached your plan limit."}{" "}
              <a href="/manage-account?tab=subscription" className="underline font-medium text-primary hover:text-primary/80">
                Upgrade now
              </a>
            </div>
          ),
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({ title: "Error", description: e.message || "Failed to save product", variant: "destructive" });
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const createCategory = async () => {
    try {
      await apiPost("business/categories/", newCategory);
      setNewCategory({ name: "", code: "", description: "", parent_category_id: "", supports_weight: false, supports_volume: false, default_unit: "piece" });
      setShowCategoryDialog(false);
      await loadCategories();
      toast({ title: "Success", description: "Category created successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create category", variant: "destructive" });
    }
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    
    // Find the parent category if product has a category
    let parentCatId = "";
    let subcatId = "";
    
    if (product.category) {
      if (product.category.parent_category) {
        // Product has a subcategory
        parentCatId = product.category.parent_category.id.toString();
        subcatId = product.category.id.toString();
      } else {
        // Product has a parent category (no subcategory)
        const cat = categories.find(c => c.id === product.category?.id);
        if (cat && !cat.parent_category) {
          // It's a parent category
          parentCatId = cat.id.toString();
          subcatId = ""; // No subcategory
        }
      }
    }
    
    setNewProduct({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      parent_category_id: parentCatId,
      category_id: subcatId,
      price: formatAmountOnBlur(product.selling_price?.toString() || ""),
      cost_price: formatAmountOnBlur(product.cost_price?.toString() || ""),
      quantity: product.current_stock.toString(),
      unit: product.unit || "piece",
      weight_kg: product.weight_kg?.toString() || "",
      supports_carton: product.supports_carton || false,
      carton_size: product.carton_size?.toString() || "",
      carton_price: formatAmountOnBlur(product.carton_price?.toString() || ""),
      description: "",
      has_variants: product.has_variants || false,
      available_sizes: product.available_sizes || [],
      available_colors: (product.available_colors || []).map(c => ({ name: c, code: "#000000" })),
      is_digital: product.is_digital || false,
      digital_file_url: product.digital_file_url || "",
      digital_access_instructions: product.digital_access_instructions || "",
    });
    
    // Set variants if available
    if (product.variants && product.variants.length > 0) {
      setProductVariants(product.variants);
    } else {
      setProductVariants([]);
    }
    
    // Set selected parent category for subcategory dropdown
    if (parentCatId) {
      const parentCat = categories.find(c => c.id.toString() === parentCatId);
      setSelectedParentCategory(parentCat || null);
    } else {
      setSelectedParentCategory(null);
    }
    
    if (product.image) {
      setImagePreview(product.image);
    }
    setShowAddDialog(true);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await apiDelete(`business/products/${id}/`);
      toast({ title: "Success", description: "Product deleted" });
      load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete product", variant: "destructive" });
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiDelete(`business/categories/${id}/`);
      await loadCategories();
      toast({ title: "Success", description: "Category deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete category", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <EmailVerificationGate
        open={showEmailVerificationGate}
        onOpenChange={handleEmailGateChange}
        reason="Please verify your email before adding products to your inventory."
      />
      {/* Saving overlay for long operations (shows after 5 seconds) */}
      <SavingOverlay 
        isSaving={savingProduct || savingStoreStock || savingBranchStock} 
        delay={5000}
        message={
          savingProduct ? "Saving product..." : 
          savingStoreStock ? "Updating store stock..." : 
          "Updating branch stock..."
        }
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage your business inventory and categories</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border rounded-lg p-2 mb-4">
          <TabsList className={`grid grid-cols-2 ${businessSettings.flash_sales_enabled ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2 h-auto bg-transparent`}>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Products</TabsTrigger>
            {businessSettings.flash_sales_enabled && (
              <TabsTrigger value="flash-sales" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <Zap className="w-4 h-4 mr-1" />
                Flash Sales
              </TabsTrigger>
            )}
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Categories</TabsTrigger>
            {hasAdditionalBranches && (
              <TabsTrigger value="branch-stock" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Branch Stock</TabsTrigger>
            )}
            <TabsTrigger value="store-stock" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Store Stock</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products" className="space-y-4">
          {/* Search and Add Product Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV/Excel
              </Button>
              <Button onClick={() => requireEmailVerification(() => setShowAddDialog(true))}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <PageSpinner message="Loading products..." />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first product</p>
                <Button onClick={() => requireEmailVerification(() => setShowAddDialog(true))}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filter products based on search query */}
              {(() => {
                const filteredProducts = products.filter(p => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase().trim();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.sku.toLowerCase().includes(query) ||
                    (p.category?.name?.toLowerCase().includes(query))
                  );
                });
                
                if (filteredProducts.length === 0) {
                  return (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Search className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No products found</h3>
                        <p className="text-muted-foreground mb-4">No products match "{searchQuery}"</p>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(p => (
                <Card key={p.id}>
                  <CardHeader>
                    {p.image && (
                      <div className="w-full h-32 mb-2 rounded-md overflow-hidden bg-muted">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{p.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => editProduct(p)}>
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      SKU: {p.sku}
                      {p.category && <span className="block text-xs mt-1">Category: {p.category.name}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {p.category && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <span className="text-sm font-medium">{p.category.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price:</span>
                        <span className="font-semibold">₦{parseFloat(p.selling_price || '0').toFixed(2)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Stock:</span>
                          <span className="font-semibold">{p.current_stock} {p.unit || 'units'}</span>
                        </div>
                        {p.branch_stocks && p.branch_stocks.length > 0 && (
                          <div className="bg-muted/50 rounded-md p-2 space-y-1">
                            {p.branch_stocks.slice(0, 2).map((bs, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate max-w-[120px]">{bs.branch_name}</span>
                                <span className="font-medium">{bs.stock} {p.unit || 'units'}</span>
                              </div>
                            ))}
                            {p.branch_stocks.length > 2 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  setSelectedProductBranchStock({
                                    productName: p.name,
                                    unit: p.unit || 'units',
                                    branchStocks: p.branch_stocks || []
                                  });
                                  setShowBranchStockDialog(true);
                                }}
                              >
                                +{p.branch_stocks.length - 2} more branches
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {p.supports_carton && p.carton_size && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Carton:</span>
                          <span>{p.carton_size} units @ ₦{p.carton_price?.toFixed(2)}</span>
                        </div>
                      )}
                      {p.has_variants && p.variants && p.variants.length > 0 && (
                        <div className="flex items-center gap-2 text-xs border-t pt-2 mt-2">
                          <Shirt className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            {p.variants.length} variant{p.variants.length > 1 ? 's' : ''}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {p.variants.slice(0, 3).map((v, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs px-1 py-0 h-5">
                                {v.size && v.color ? `${v.size}/${v.color}` : v.size || v.color}
                              </Badge>
                            ))}
                            {p.variants.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                                +{p.variants.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {p.weight_kg && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Weight:</span>
                          <span>{p.weight_kg} kg</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
                  </div>
                );
              })()}
              
              {/* Load More / Pagination Controls */}
              {!searchQuery.trim() && currentPage < totalPages && (
                <div className="flex flex-col items-center mt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {products.length} of {totalProducts} products
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="min-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <ButtonSpinner className="mr-2" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Load More Products
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Show total when all loaded */}
              {!searchQuery.trim() && currentPage >= totalPages && products.length > 0 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing all {products.length} products
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Flash Sales Tab - Only shown when enabled in Business Settings */}
        {businessSettings.flash_sales_enabled && (
          <TabsContent value="flash-sales" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                Flash Sales Management
              </CardTitle>
              <CardDescription className="text-white/80">
                Create limited-time deals to boost sales. Products on flash sale will be featured on your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Flash Sale Products List */}
              {(() => {
                const flashSaleProducts = products.filter(p => p.is_flash_sale);
                const nonFlashSaleProducts = products.filter(p => !p.is_flash_sale);
                
                return (
                  <div className="space-y-6">
                    {/* Current Flash Sales */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Active Flash Sales ({flashSaleProducts.length})
                      </h3>
                      {flashSaleProducts.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg bg-muted/30">
                          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No active flash sales</p>
                          <p className="text-sm text-muted-foreground mt-1">Add products to flash sale below</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {flashSaleProducts.map(product => (
                            <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{product.name}</h4>
                                <div className="flex items-center gap-3 mt-1 text-sm">
                                  <span className="text-gray-500 line-through">₦{parseFloat(product.selling_price).toLocaleString()}</span>
                                  <span className="text-red-600 font-bold">₦{product.flash_sale_price?.toLocaleString()}</span>
                                  <Badge variant="destructive" className="text-xs">
                                    {Math.round(((parseFloat(product.selling_price) - (product.flash_sale_price || 0)) / parseFloat(product.selling_price)) * 100)}% OFF
                                  </Badge>
                                </div>
                                {product.flash_sale_end && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    Ends: {new Date(product.flash_sale_end).toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await apiPut(`business/products/${product.id}/`, {
                                      is_flash_sale: false,
                                      flash_sale_price: null,
                                      flash_sale_start: null,
                                      flash_sale_end: null
                                    });
                                    toast({ title: "Success", description: "Removed from flash sale" });
                                    load();
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to update", variant: "destructive" });
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add to Flash Sale */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Add Product to Flash Sale</h3>
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <Label>Select Product</Label>
                            <Select
                              value={flashSaleForm.product_id?.toString() || ""}
                              onValueChange={(v) => {
                                const prod = products.find(p => p.id === parseInt(v));
                                setFlashSaleForm({
                                  ...flashSaleForm,
                                  product_id: parseInt(v),
                                  original_price: prod ? parseFloat(prod.selling_price) : 0
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose product..." />
                              </SelectTrigger>
                              <SelectContent>
                                {nonFlashSaleProducts.map(p => (
                                  <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name} - ₦{parseFloat(p.selling_price).toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Flash Sale Price (₦)</Label>
                            <Input
                              type="number"
                              placeholder="Sale price"
                              value={flashSaleForm.flash_sale_price || ""}
                              onChange={(e) => setFlashSaleForm({...flashSaleForm, flash_sale_price: parseFloat(e.target.value)})}
                            />
                            {flashSaleForm.original_price > 0 && flashSaleForm.flash_sale_price && (
                              <p className="text-xs text-green-600 mt-1">
                                {Math.round(((flashSaleForm.original_price - flashSaleForm.flash_sale_price) / flashSaleForm.original_price) * 100)}% discount
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Start Date & Time</Label>
                            <Input
                              type="datetime-local"
                              value={flashSaleForm.flash_sale_start || ""}
                              onChange={(e) => setFlashSaleForm({...flashSaleForm, flash_sale_start: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>End Date & Time</Label>
                            <Input
                              type="datetime-local"
                              value={flashSaleForm.flash_sale_end || ""}
                              onChange={(e) => setFlashSaleForm({...flashSaleForm, flash_sale_end: e.target.value})}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            if (!flashSaleForm.product_id || !flashSaleForm.flash_sale_price || !flashSaleForm.flash_sale_end) {
                              toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
                              return;
                            }
                            try {
                              await apiPut(`business/products/${flashSaleForm.product_id}/`, {
                                is_flash_sale: true,
                                flash_sale_price: flashSaleForm.flash_sale_price,
                                flash_sale_start: flashSaleForm.flash_sale_start || new Date().toISOString(),
                                flash_sale_end: flashSaleForm.flash_sale_end
                              });
                              toast({ title: "Success", description: "Product added to flash sale!" });
                              setFlashSaleForm({ product_id: null, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '', original_price: 0 });
                              load();
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to add to flash sale", variant: "destructive" });
                            }
                          }}
                          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Add to Flash Sale
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCategoryDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                <p className="text-muted-foreground mb-4">Create categories to organize your products</p>
                <Button onClick={() => setShowCategoryDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <Card key={cat.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cat.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Code: {cat.code}
                      {cat.parent_category && <span className="block text-xs">Parent: {cat.parent_category.name}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Products:</span>
                        <span className="font-semibold">{cat.product_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Default Unit:</span>
                        <span>{cat.default_unit}</span>
                      </div>
                      {cat.subcategories.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Subcategories:</p>
                          <div className="flex flex-wrap gap-1">
                            {cat.subcategories.map(sub => (
                              <span key={sub.id} className="text-xs bg-muted px-2 py-1 rounded">
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Branch Stock Tab */}
        <TabsContent value="branch-stock" className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Select value={selectedBranchFilter} onValueChange={(value) => {
                setSelectedBranchFilter(value);
                setTimeout(loadBranchStock, 100);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedProductFilter} onValueChange={(value) => {
                setSelectedProductFilter(value);
                setTimeout(loadBranchStock, 100);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={loadBranchStock}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowStockDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product to Branch
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => setShowTransferDialog(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer Between Branches
              </Button>
            </div>
          </div>

          {stockLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <PageSpinner message="Loading stock..." />
            </div>
          ) : branches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Warehouse className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No branches set up</h3>
                <p className="text-muted-foreground mb-4">Create branches to manage stock across locations</p>
                <Button onClick={() => navigate('/settings')}>
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          ) : branchStock.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No branch stock records</h3>
                <p className="text-muted-foreground mb-4">Add stock to branches to track inventory by location</p>
                <Button onClick={() => setShowStockDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Stock Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer transition-shadow ${stockStatusFilter === 'all' ? 'ring-2 ring-primary/40' : ''}`}
                  onClick={() => setStockStatusFilter('all')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{branchStock.length}</div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-shadow ${stockStatusFilter === 'low' ? 'ring-2 ring-orange-400/60' : ''}`}
                  onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {branchStock.filter(bs => bs.is_low_stock).length}
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-shadow ${stockStatusFilter === 'out' ? 'ring-2 ring-red-500/60' : ''}`}
                  onClick={() => setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {branchStock.filter(bs => bs.current_stock === 0).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Branch Stock Levels</CardTitle>
                  <CardDescription>Stock quantities for each product at each branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Min Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Restocked</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(stockStatusFilter === 'low'
                        ? branchStock.filter(bs => bs.is_low_stock)
                        : stockStatusFilter === 'out'
                        ? branchStock.filter(bs => bs.current_stock === 0)
                        : branchStock
                      ).map((bs) => (
                        <TableRow key={bs.id}>
                          <TableCell className="font-medium">{bs.branch_name}</TableCell>
                          <TableCell>{bs.product_name}</TableCell>
                          <TableCell className="text-muted-foreground">{bs.product_sku}</TableCell>
                          <TableCell className="text-right font-semibold">{bs.current_stock}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{bs.min_stock_level}</TableCell>
                          <TableCell>
                            {bs.current_stock === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : bs.is_low_stock ? (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {bs.last_restocked ? new Date(bs.last_restocked).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingBranchStock(bs);
                                  setEditBranchStockForm({
                                    current_stock: bs.current_stock.toString(),
                                    min_stock_level: bs.min_stock_level.toString(),
                                  });
                                  setShowEditBranchStockDialog(true);
                                }}
                                title="Edit stock"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteBranchStock(bs)}
                                title="Delete stock"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Transfer History */}
              {transferHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Stock Movements</CardTitle>
                    <CardDescription>Stock transfers and adjustments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferHistory.slice(0, 10).map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                                {t.transfer_number || 'Transfer'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{t.product}</TableCell>
                            <TableCell>{t.from_branch || '-'}</TableCell>
                            <TableCell>{t.to_branch}</TableCell>
                            <TableCell className="text-right font-semibold">{t.quantity}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {t.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Store Stock Tab */}
        <TabsContent value="store-stock" className="space-y-4">
          {/* Store Stock Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Select value={selectedStoreFilter} onValueChange={(v) => {
                setSelectedStoreFilter(v);
                setTimeout(loadStoreStock, 100);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name} ({store.branch.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadStoreStock}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAddStoreStockDialog(true)}>
                <Package className="w-4 h-4 mr-2" />
                Add Stock to Store
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => setShowStoreTransferDialog(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer to Branch
              </Button>
            </div>
          </div>

          {/* Store Stock Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stores.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stock Items in Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{storeStock.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stores with Direct Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stores.filter(s => s.allow_direct_sales).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Store Stock Table */}
          {storeStockLoading ? (
            <div className="flex justify-center py-8">
              <SectionSpinner message="Loading store stock..." />
            </div>
          ) : storeStock.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Warehouse className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Stock in Stores</h3>
                <p className="text-muted-foreground mb-4">
                  Add products to stores for storage before transferring to branches for sale.
                </p>
                <Button onClick={() => setShowAddStoreStockDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock to Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Store Stock Levels</CardTitle>
                <CardDescription>Products stored in warehouses/stores (not available for sale until transferred to branch)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeStock.map((ss) => (
                      <TableRow key={ss.id}>
                        <TableCell className="font-medium">{ss.store.name}</TableCell>
                        <TableCell>{ss.product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{ss.product.sku}</TableCell>
                        <TableCell className="text-right font-semibold">{ss.current_stock}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{ss.min_stock_level}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingStoreStock(ss);
                                setEditStoreStockForm({
                                  current_stock: ss.current_stock.toString(),
                                  min_stock_level: ss.min_stock_level.toString(),
                                });
                                setShowEditStoreStockDialog(true);
                              }}
                              title="Edit stock"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteStoreStock(ss)}
                              title="Delete stock"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const store = stores.find(s => s.id === ss.store.id);
                                if (store) {
                                  setStoreTransferForm({
                                    from_store_id: ss.store.id.toString(),
                                    to_branch_id: store.branch.id.toString(),
                                    product_id: ss.product.id.toString(),
                                    quantity: "",
                                    notes: "",
                                  });
                                  setShowStoreTransferDialog(true);
                                }
                              }}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-1" />
                              Transfer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Stock to Store Dialog */}
      <Dialog open={showAddStoreStockDialog} onOpenChange={(open) => {
        setShowAddStoreStockDialog(open);
        if (!open) {
          setProductSearchQuery("");
          setStoreStockImportMode('single');
          setStoreStockBulkFile(null);
          setStoreStockBulkCsv('');
          setStoreStockBulkResult(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Stock to Store</DialogTitle>
            <DialogDescription>Add product stock directly to a store/warehouse</DialogDescription>
          </DialogHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-2">
            <Button
              variant={storeStockImportMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoreStockImportMode('single')}
            >
              Single Product
            </Button>
            <Button
              variant={storeStockImportMode === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoreStockImportMode('bulk')}
            >
              <Upload className="w-4 h-4 mr-1" />
              Bulk Import
            </Button>
          </div>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>Store *</Label>
              <Select value={storeStockForm.store_id} onValueChange={(v) => setStoreStockForm({...storeStockForm, store_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name} ({store.branch.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {storeStockImportMode === 'single' ? (
              <>
                <div>
                  <Label>Product * ({products.length} available)</Label>
                  <Input 
                    placeholder="Search products by name or SKU..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {products
                      .filter(p => 
                        productSearchQuery === "" || 
                        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
                      )
                      .slice(0, 50)
                      .map(p => (
                        <div 
                          key={p.id}
                          className={`p-2 cursor-pointer hover:bg-muted flex justify-between items-center border-b last:border-b-0 ${storeStockForm.product_id === p.id.toString() ? 'bg-primary/10' : ''}`}
                          onClick={() => setStoreStockForm({...storeStockForm, product_id: p.id.toString()})}
                        >
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">₦{parseFloat(p.selling_price || '0').toLocaleString()}</span>
                        </div>
                      ))
                    }
                    {products.filter(p => 
                      productSearchQuery === "" || 
                      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="p-4 text-center text-muted-foreground">No products found</p>
                    )}
                  </div>
                  {storeStockForm.product_id && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {products.find(p => p.id.toString() === storeStockForm.product_id)?.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity"
                    value={storeStockForm.quantity}
                    onChange={(e) => setStoreStockForm({...storeStockForm, quantity: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Bulk Import Mode */}
                <div className="flex gap-2 items-center">
                  <Button
                    variant={storeStockBulkInputMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStoreStockBulkInputMode('file')}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                  <Button
                    variant={storeStockBulkInputMode === 'paste' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStoreStockBulkInputMode('paste')}
                  >
                    <ClipboardPaste className="w-4 h-4 mr-1" />
                    Paste CSV
                  </Button>
                  <a 
                    href="/api/business/stores/bulk-add-stock/template/" 
                    download 
                    className="ml-auto"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Template
                    </Button>
                  </a>
                </div>
                
                {storeStockBulkInputMode === 'file' ? (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setStoreStockBulkFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="store-stock-bulk-file"
                    />
                    <label htmlFor="store-stock-bulk-file" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {storeStockBulkFile ? storeStockBulkFile.name : 'Click to upload CSV or Excel file'}
                      </p>
                    </label>
                  </div>
                ) : (
                  <div>
                    <Label>Paste CSV Data</Label>
                    <Textarea
                      placeholder="product_name,sku,quantity&#10;Product 1,SKU001,10&#10;Product 2,SKU002,25"
                      value={storeStockBulkCsv}
                      onChange={(e) => setStoreStockBulkCsv(e.target.value)}
                      className="font-mono text-sm h-32"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Include header row: product_name,sku,quantity
                    </p>
                  </div>
                )}
                
                {storeStockBulkResult && (
                  <div className="border rounded-md p-3 bg-muted/50 max-h-40 overflow-y-auto">
                    <p className="font-medium text-sm mb-2">
                      Import Result: {storeStockBulkResult.total_processed} added, {storeStockBulkResult.total_errors} errors
                    </p>
                    {storeStockBulkResult.errors.length > 0 && (
                      <div className="text-xs text-destructive">
                        {storeStockBulkResult.errors.slice(0, 5).map((err, i) => (
                          <p key={i}>Row {err.row}: {err.error}</p>
                        ))}
                        {storeStockBulkResult.errors.length > 5 && (
                          <p>...and {storeStockBulkResult.errors.length - 5} more errors</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStoreStockDialog(false)}>Cancel</Button>
            {storeStockImportMode === 'single' ? (
              <Button onClick={handleAddStoreStock}>Add Stock</Button>
            ) : (
              <Button onClick={handleBulkStoreStockAdd} disabled={storeStockBulkLoading}>
                {storeStockBulkLoading ? <ButtonSpinner /> : 'Import Stock'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Store Stock Dialog */}
      <Dialog open={showEditStoreStockDialog} onOpenChange={(open) => {
        if (!savingStoreStock) {
          setShowEditStoreStockDialog(open);
          if (!open) setEditingStoreStock(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store Stock</DialogTitle>
            <DialogDescription>
              {editingStoreStock && `Update ${editingStoreStock.product.name} in ${editingStoreStock.store.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Stock *</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="Enter current stock"
                value={editStoreStockForm.current_stock}
                onChange={(e) => setEditStoreStockForm({...editStoreStockForm, current_stock: e.target.value})}
                disabled={savingStoreStock}
              />
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="Enter min stock level"
                value={editStoreStockForm.min_stock_level}
                onChange={(e) => setEditStoreStockForm({...editStoreStockForm, min_stock_level: e.target.value})}
                disabled={savingStoreStock}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStoreStockDialog(false)} disabled={savingStoreStock}>Cancel</Button>
            <Button onClick={handleEditStoreStock} disabled={savingStoreStock}>
              {savingStoreStock ? <><ButtonSpinner className="mr-2" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Stock Dialog */}
      <Dialog open={showEditBranchStockDialog} onOpenChange={(open) => {
        if (!savingBranchStock) {
          setShowEditBranchStockDialog(open);
          if (!open) setEditingBranchStock(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch Stock</DialogTitle>
            <DialogDescription>
              {editingBranchStock && `Update ${editingBranchStock.product_name} at ${editingBranchStock.branch_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Stock *</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="Enter current stock"
                value={editBranchStockForm.current_stock}
                onChange={(e) => setEditBranchStockForm({...editBranchStockForm, current_stock: e.target.value})}
                disabled={savingBranchStock}
              />
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="Enter min stock level"
                value={editBranchStockForm.min_stock_level}
                onChange={(e) => setEditBranchStockForm({...editBranchStockForm, min_stock_level: e.target.value})}
                disabled={savingBranchStock}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBranchStockDialog(false)} disabled={savingBranchStock}>Cancel</Button>
            <Button onClick={handleEditBranchStock} disabled={savingBranchStock}>
              {savingBranchStock ? <><ButtonSpinner className="mr-2" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store to Branch Transfer Dialog */}
      <Dialog open={showStoreTransferDialog} onOpenChange={(open) => {
        setShowStoreTransferDialog(open);
        if (!open) {
          setSelectedStoreProducts([]);
          setProductSearchQuery("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Transfer Stock to Branch</DialogTitle>
            <DialogDescription>Move stock from store to branch for sale</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>From Store *</Label>
              <Select value={storeTransferForm.from_store_id} onValueChange={(v) => {
                const store = stores.find(s => s.id.toString() === v);
                setStoreTransferForm({
                  ...storeTransferForm, 
                  from_store_id: v,
                  to_branch_id: store ? store.branch.id.toString() : "",
                  product_id: ""
                });
                loadStoreProducts(v);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name} ({store.branch.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Branch *</Label>
              <Select value={storeTransferForm.to_branch_id} onValueChange={(v) => setStoreTransferForm({...storeTransferForm, to_branch_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name} {b.is_main ? "(Main)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product * {storeTransferForm.from_store_id && `(${selectedStoreProducts.length} available)`}</Label>
              {!storeTransferForm.from_store_id ? (
                <p className="text-sm text-muted-foreground py-2">Select a store first to see available products</p>
              ) : selectedStoreProducts.length === 0 ? (
                <p className="text-sm text-amber-600 py-2">No products in this store. Add stock first.</p>
              ) : (
                <>
                  <Input 
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {selectedStoreProducts
                      .filter(p => 
                        productSearchQuery === "" || 
                        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
                      )
                      .map(p => (
                        <div 
                          key={p.id}
                          className={`p-2 cursor-pointer hover:bg-muted flex justify-between items-center border-b last:border-b-0 ${storeTransferForm.product_id === p.id.toString() ? 'bg-primary/10' : ''}`}
                          onClick={() => setStoreTransferForm({...storeTransferForm, product_id: p.id.toString()})}
                        >
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">{p.current_stock} in stock</span>
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
            <div>
              <Label>Quantity *</Label>
              <Input 
                type="number" 
                placeholder="Enter quantity to transfer"
                value={storeTransferForm.quantity}
                onChange={(e) => setStoreTransferForm({...storeTransferForm, quantity: e.target.value})}
              />
              {storeTransferForm.product_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedStoreProducts.find(p => p.id.toString() === storeTransferForm.product_id)?.current_stock || 0} units
                </p>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                placeholder="Optional notes..."
                value={storeTransferForm.notes}
                onChange={(e) => setStoreTransferForm({...storeTransferForm, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoreTransferDialog(false)}>Cancel</Button>
            <Button onClick={handleStoreTransfer}>Transfer Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md md:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>{editingProduct ? "Update product details" : "Add a new product to your inventory"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input placeholder="e.g. Rice 50kg" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              
              <div>
                <Label>Parent Category</Label>
                <Select value={newProduct.parent_category_id || "none"} onValueChange={(value)=>{
                  const parentId = value === "none" ? "" : value;
                  setNewProduct({...newProduct, parent_category_id: parentId, category_id: ""});
                  const parent = categories.find(c => c.id.toString() === parentId);
                  setSelectedParentCategory(parent || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent Category</SelectItem>
                    {categories.filter(c => !c.parent_category).map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedParentCategory && selectedParentCategory.subcategories.length > 0 && (
                <div>
                  <Label>Subcategory</Label>
                  <Select value={newProduct.category_id || "none"} onValueChange={(value)=>setNewProduct({...newProduct, category_id: value === "none" ? "" : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Subcategory</SelectItem>
                      {selectedParentCategory.subcategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>SKU</Label>
                <div className="flex gap-2">
                  <Input placeholder="Auto-generated" value={newProduct.sku} onChange={(e)=>setNewProduct({...newProduct, sku: e.target.value})} />
                  <Button type="button" variant="outline" onClick={autoGenerateSKU}>
                    Auto
                  </Button>
                </div>
              </div>

              <div>
                <Label>Barcode</Label>
                <Input placeholder="Manufacturer barcode" value={newProduct.barcode} onChange={(e)=>setNewProduct({...newProduct, barcode: e.target.value})} />
              </div>

              <div>
                <Label>Cost Price (₦) *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={newProduct.cost_price}
                  onChange={(e)=>setNewProduct({...newProduct, cost_price: formatAmountInput(e.target.value)})}
                  onBlur={(e)=>setNewProduct({...newProduct, cost_price: formatAmountOnBlur(e.target.value)})}
                />
              </div>

              <div>
                <Label>Selling Price (₦) *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e)=>setNewProduct({...newProduct, price: formatAmountInput(e.target.value)})}
                  onBlur={(e)=>setNewProduct({...newProduct, price: formatAmountOnBlur(e.target.value)})}
                />
              </div>

              <div>
                <Label>Initial Stock (Main Branch) *</Label>
                <Input type="number" placeholder="0" value={newProduct.quantity} onChange={(e)=>setNewProduct({...newProduct, quantity: e.target.value})} />
                <p className="text-xs text-muted-foreground mt-1">
                  Stock goes to Main Branch. Use Branch Stock or Store Stock tabs for other locations.
                </p>
              </div>

              <div>
                <Label>Unit</Label>
                <Select value={newProduct.unit} onValueChange={(value)=>setNewProduct({...newProduct, unit: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="g">Gram</SelectItem>
                    <SelectItem value="l">Liter</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="0.0" value={newProduct.weight_kg} onChange={(e)=>setNewProduct({...newProduct, weight_kg: e.target.value})} />
              </div>

              <div className="col-span-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && (
                    <div className="w-20 h-20 rounded border overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="supports_carton" 
                    checked={newProduct.supports_carton}
                    onCheckedChange={(checked) => setNewProduct({...newProduct, supports_carton: checked as boolean})}
                  />
                  <Label htmlFor="supports_carton" className="cursor-pointer">
                    Supports Carton Sales
                  </Label>
                </div>
              </div>

              {newProduct.supports_carton && (
                <>
                  <div>
                    <Label>Units per Carton</Label>
                    <Input type="number" placeholder="e.g. 12" value={newProduct.carton_size} onChange={(e)=>setNewProduct({...newProduct, carton_size: e.target.value})} />
                  </div>
                  <div>
                    <Label>Carton Price (₦)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={newProduct.carton_price}
                      onChange={(e)=>setNewProduct({...newProduct, carton_price: formatAmountInput(e.target.value)})}
                      onBlur={(e)=>setNewProduct({...newProduct, carton_price: formatAmountOnBlur(e.target.value)})}
                    />
                  </div>
                </>
              )}

              {/* Product Variants Section */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="has_variants" 
                    checked={newProduct.has_variants}
                    onCheckedChange={(checked) => setNewProduct({...newProduct, has_variants: checked as boolean})}
                  />
                  <Label htmlFor="has_variants" className="cursor-pointer flex items-center gap-2">
                    <Shirt className="h-4 w-4" />
                    Product has Size/Color Variants (Fashion/Retail)
                  </Label>
                </div>
              </div>

              {newProduct.has_variants && (
                <>
                  {/* Sizes Input */}
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2 mb-2">
                      Sizes
                      <span className="text-xs text-muted-foreground">(e.g., S, M, L, XL, 40, 42)</span>
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newProduct.available_sizes.map((size, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {size}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setNewProduct({
                              ...newProduct, 
                              available_sizes: newProduct.available_sizes.filter((_, i) => i !== idx)
                            })}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add size..." 
                        value={newSizeInput}
                        onChange={(e) => setNewSizeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSizeInput.trim()) {
                            e.preventDefault();
                            if (!newProduct.available_sizes.includes(newSizeInput.trim())) {
                              setNewProduct({
                                ...newProduct, 
                                available_sizes: [...newProduct.available_sizes, newSizeInput.trim()]
                              });
                            }
                            setNewSizeInput("");
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (newSizeInput.trim() && !newProduct.available_sizes.includes(newSizeInput.trim())) {
                            setNewProduct({
                              ...newProduct, 
                              available_sizes: [...newProduct.available_sizes, newSizeInput.trim()]
                            });
                            setNewSizeInput("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Colors Input */}
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4" />
                      Colors
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newProduct.available_colors.map((color, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          <span 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: color.code }}
                          />
                          {color.name}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setNewProduct({
                              ...newProduct, 
                              available_colors: newProduct.available_colors.filter((_, i) => i !== idx)
                            })}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input 
                          placeholder="Color name (e.g., Red, Blue)" 
                          value={newColorInput.name}
                          onChange={(e) => setNewColorInput({...newColorInput, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Input 
                          type="color" 
                          className="w-12 h-9 p-1 cursor-pointer"
                          value={newColorInput.code}
                          onChange={(e) => setNewColorInput({...newColorInput, code: e.target.value})}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (newColorInput.name.trim()) {
                            const exists = newProduct.available_colors.some(c => c.name.toLowerCase() === newColorInput.name.trim().toLowerCase());
                            if (!exists) {
                              setNewProduct({
                                ...newProduct, 
                                available_colors: [...newProduct.available_colors, { name: newColorInput.name.trim(), code: newColorInput.code }]
                              });
                              setNewColorInput({ name: "", code: "#000000" });
                            }
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Variant Stock Info */}
                  {(newProduct.available_sizes.length > 0 || newProduct.available_colors.length > 0) && (
                    <div className="col-span-2 bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>
                          {newProduct.available_sizes.length > 0 && newProduct.available_colors.length > 0
                            ? `${newProduct.available_sizes.length * newProduct.available_colors.length} variants`
                            : newProduct.available_sizes.length > 0 
                              ? `${newProduct.available_sizes.length} size variants`
                              : `${newProduct.available_colors.length} color variants`
                          }
                        </strong> will be created. You can manage individual variant stock after saving.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Digital Product Section */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="is_digital" 
                    checked={newProduct.is_digital}
                    onCheckedChange={(checked) => setNewProduct({...newProduct, is_digital: checked as boolean})}
                  />
                  <Label htmlFor="is_digital" className="cursor-pointer flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    This is a Digital Product (e-book, software, course, etc.)
                  </Label>
                </div>
              </div>

              {newProduct.is_digital && (
                <>
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4" />
                      Digital File URL
                    </Label>
                    <Input 
                      type="url"
                      placeholder="https://dropbox.com/your-file or https://drive.google.com/..."
                      value={newProduct.digital_file_url}
                      onChange={(e) => setNewProduct({...newProduct, digital_file_url: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the download link from Dropbox, Google Drive, or other platforms
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2 mb-2">
                      Access Instructions
                    </Label>
                    <Textarea 
                      placeholder="Enter instructions for accessing the digital product..."
                      value={newProduct.digital_access_instructions}
                      onChange={(e) => setNewProduct({...newProduct, digital_access_instructions: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="Product description..." value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={savingProduct} onClick={() => { 
              setShowAddDialog(false); 
              setNewProduct({ name: "", sku: "", barcode: "", parent_category_id: "", category_id: "", price: "", cost_price: "", quantity: "", unit: "piece", weight_kg: "", supports_carton: false, carton_size: "", carton_price: "", description: "", has_variants: false, available_sizes: [], available_colors: [], is_digital: false, digital_file_url: "", digital_access_instructions: "" });
              setProductVariants([]);
              setNewSizeInput("");
              setNewColorInput({ name: "", code: "#000000" });
              setProductImage(null);
              setImagePreview("");
              setSelectedParentCategory(null);
              setEditingProduct(null);
            }}>Cancel</Button>
            <Button onClick={createProduct} disabled={savingProduct}>
              {savingProduct ? <><ButtonSpinner className="mr-2" /> Saving...</> : (editingProduct ? "Save Changes" : "Add Product")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new product category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input placeholder="e.g. Fish" value={newCategory.name} onChange={(e)=>setNewCategory({...newCategory, name: e.target.value})} />
            </div>
            <div>
              <Label>Category Code</Label>
              <Input placeholder="Auto-generated" value={newCategory.code} onChange={(e)=>setNewCategory({...newCategory, code: e.target.value})} />
            </div>
            <div>
              <Label>Parent Category (Optional)</Label>
              <Select value={newCategory.parent_category_id || "none"} onValueChange={(value)=>setNewCategory({...newCategory, parent_category_id: value === "none" ? "" : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="None (Main Category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.filter(c => !c.parent_category).map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Unit</Label>
              <Select value={newCategory.default_unit} onValueChange={(value)=>setNewCategory({...newCategory, default_unit: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="g">Gram</SelectItem>
                  <SelectItem value="l">Liter</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="supports_weight" 
                  checked={newCategory.supports_weight}
                  onCheckedChange={(checked) => setNewCategory({...newCategory, supports_weight: checked as boolean})}
                />
                <Label htmlFor="supports_weight" className="cursor-pointer">
                  Supports Weight (kg)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="supports_volume" 
                  checked={newCategory.supports_volume}
                  onCheckedChange={(checked) => setNewCategory({...newCategory, supports_volume: checked as boolean})}
                />
                <Label htmlFor="supports_volume" className="cursor-pointer">
                  Supports Volume (liters)
                </Label>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Category description..." value={newCategory.description} onChange={(e)=>setNewCategory({...newCategory, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setShowCategoryDialog(false); 
              setNewCategory({ name: "", code: "", description: "", parent_category_id: "", supports_weight: false, supports_volume: false, default_unit: "piece" });
            }}>Cancel</Button>
            <Button onClick={createCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockDialog} onOpenChange={(open) => {
        setShowStockDialog(open);
        if (!open) {
          setStockProductSearch("");
          setBranchStockImportMode('single');
          setBranchStockBulkFile(null);
          setBranchStockBulkCsv('');
          setBranchStockBulkResult(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Product to Branch</DialogTitle>
            <DialogDescription>Add or adjust stock at a specific branch</DialogDescription>
          </DialogHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-2">
            <Button
              variant={branchStockImportMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBranchStockImportMode('single')}
            >
              Single Product
            </Button>
            <Button
              variant={branchStockImportMode === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBranchStockImportMode('bulk')}
            >
              <Upload className="w-4 h-4 mr-1" />
              Bulk Import
            </Button>
          </div>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>Branch *</Label>
              <Select value={stockAdjustment.branch_id} onValueChange={(value) => setStockAdjustment({...stockAdjustment, branch_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name} {branch.is_main ? "(Main)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {branchStockImportMode === 'single' ? (
              <>
                <div>
                  <Label>Product *</Label>
                  <Input 
                    placeholder="Search products..."
                    value={stockProductSearch}
                    onChange={(e) => setStockProductSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-md h-48 overflow-y-auto">
                    {products
                      .filter(p => 
                        stockProductSearch === "" || 
                        p.name.toLowerCase().includes(stockProductSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(stockProductSearch.toLowerCase())
                      )
                      .map(product => (
                        <div 
                          key={product.id}
                          className={`p-2 cursor-pointer hover:bg-muted flex justify-between items-center border-b last:border-b-0 ${stockAdjustment.product_id === product.id.toString() ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => setStockAdjustment({...stockAdjustment, product_id: product.id.toString()})}
                        >
                          <div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.current_stock}
                          </span>
                        </div>
                      ))
                    }
                    {products.filter(p => 
                      stockProductSearch === "" || 
                      p.name.toLowerCase().includes(stockProductSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(stockProductSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="p-4 text-center text-muted-foreground text-sm">No products found</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Adjustment Type *</Label>
                  <Select value={stockAdjustment.adjustment_type} onValueChange={(value) => setStockAdjustment({...stockAdjustment, adjustment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="subtract">Remove Stock</SelectItem>
                      <SelectItem value="set">Set Stock (Override)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity"
                    value={stockAdjustment.quantity} 
                    onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    placeholder="Reason for adjustment..."
                    value={stockAdjustment.notes} 
                    onChange={(e) => setStockAdjustment({...stockAdjustment, notes: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Bulk Import Mode */}
                <div>
                  <Label>Adjustment Type *</Label>
                  <Select value={stockAdjustment.adjustment_type} onValueChange={(value) => setStockAdjustment({...stockAdjustment, adjustment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="subtract">Remove Stock</SelectItem>
                      <SelectItem value="set">Set Stock (Override)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Button
                    variant={branchStockBulkInputMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBranchStockBulkInputMode('file')}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                  <Button
                    variant={branchStockBulkInputMode === 'paste' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBranchStockBulkInputMode('paste')}
                  >
                    <ClipboardPaste className="w-4 h-4 mr-1" />
                    Paste CSV
                  </Button>
                  <a 
                    href="/api/business/branch-stock/bulk-update/template/" 
                    download 
                    className="ml-auto"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Template
                    </Button>
                  </a>
                </div>
                
                {branchStockBulkInputMode === 'file' ? (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setBranchStockBulkFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="branch-stock-bulk-file"
                    />
                    <label htmlFor="branch-stock-bulk-file" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {branchStockBulkFile ? branchStockBulkFile.name : 'Click to upload CSV or Excel file'}
                      </p>
                    </label>
                  </div>
                ) : (
                  <div>
                    <Label>Paste CSV Data</Label>
                    <Textarea
                      placeholder="product_name,sku,quantity&#10;Product 1,SKU001,10&#10;Product 2,SKU002,25"
                      value={branchStockBulkCsv}
                      onChange={(e) => setBranchStockBulkCsv(e.target.value)}
                      className="font-mono text-sm h-32"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Include header row: product_name,sku,quantity
                    </p>
                  </div>
                )}
                
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="Bulk stock adjustment notes..."
                    value={stockAdjustment.notes} 
                    onChange={(e) => setStockAdjustment({...stockAdjustment, notes: e.target.value})}
                  />
                </div>
                
                {branchStockBulkResult && (
                  <div className="border rounded-md p-3 bg-muted/50 max-h-40 overflow-y-auto">
                    <p className="font-medium text-sm mb-2">
                      Import Result: {branchStockBulkResult.total_processed} updated, {branchStockBulkResult.total_errors} errors
                    </p>
                    {branchStockBulkResult.errors.length > 0 && (
                      <div className="text-xs text-destructive">
                        {branchStockBulkResult.errors.slice(0, 5).map((err, i) => (
                          <p key={i}>Row {err.row}: {err.error}</p>
                        ))}
                        {branchStockBulkResult.errors.length > 5 && (
                          <p>...and {branchStockBulkResult.errors.length - 5} more errors</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>Cancel</Button>
            {branchStockImportMode === 'single' ? (
              <Button onClick={handleStockAdjustment}>Update Stock</Button>
            ) : (
              <Button onClick={handleBulkBranchStockUpdate} disabled={branchStockBulkLoading}>
                {branchStockBulkLoading ? <ButtonSpinner /> : 'Import Stock'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
            <DialogDescription>Move stock between branches</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From Branch *</Label>
              <Select value={stockTransfer.from_branch_id} onValueChange={(value) => setStockTransfer({...stockTransfer, from_branch_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Branch *</Label>
              <Select value={stockTransfer.to_branch_id} onValueChange={(value) => setStockTransfer({...stockTransfer, to_branch_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.filter(b => b.id.toString() !== stockTransfer.from_branch_id).map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product *</Label>
              <Select value={stockTransfer.product_id} onValueChange={(value) => setStockTransfer({...stockTransfer, product_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>{product.name} ({product.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity *</Label>
              <Input 
                type="number" 
                placeholder="Enter quantity to transfer"
                value={stockTransfer.quantity} 
                onChange={(e) => setStockTransfer({...stockTransfer, quantity: e.target.value})}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Transfer notes..."
                value={stockTransfer.notes} 
                onChange={(e) => setStockTransfer({...stockTransfer, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button onClick={handleStockTransfer}>Transfer Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Stock Details Dialog */}
      <Dialog open={showBranchStockDialog} onOpenChange={setShowBranchStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock by Branch</DialogTitle>
            <DialogDescription>
              {selectedProductBranchStock?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {selectedProductBranchStock?.branchStocks.map((bs, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <span className="font-medium">{bs.branch_name}</span>
                  <Badge variant="secondary">
                    {bs.stock} {selectedProductBranchStock.unit}
                  </Badge>
                </div>
              ))}
              {(!selectedProductBranchStock?.branchStocks || selectedProductBranchStock.branchStocks.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No branch stock data available
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchStockDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Products Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={(open) => {
        setShowBulkImportDialog(open);
        if (!open) {
          setBulkImportFile(null);
          setBulkImportResult(null);
          setBulkImportCsvText('');
          setBulkImportMode('file');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Bulk Import Products
            </DialogTitle>
            <DialogDescription>
              Upload a CSV/Excel file or paste CSV data to import multiple products at once
            </DialogDescription>
          </DialogHeader>

          {!bulkImportResult ? (
            <div className="space-y-6">
              {/* Import Mode Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={bulkImportMode === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setBulkImportMode('file')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  variant={bulkImportMode === 'paste' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setBulkImportMode('paste')}
                >
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste CSV
                </Button>
              </div>

              {bulkImportMode === 'file' ? (
                <>
                  {/* Download Template Section */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Step 1: Download Template</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download the template file, fill in your product data, then upload it below.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open('/api/business/products/bulk-import/template/', '_blank');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV Template
                    </Button>
                  </div>

                  {/* File Upload Section */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Step 2: Upload Your File</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Supported formats: CSV (.csv), Excel (.xlsx)
                    </p>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="bulk-import-file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBulkImportFile(file);
                          }
                        }}
                      />
                      {bulkImportFile ? (
                        <div className="space-y-2">
                          <FileSpreadsheet className="w-12 h-12 mx-auto text-primary" />
                          <p className="font-medium">{bulkImportFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(bulkImportFile.size / 1024).toFixed(1)} KB
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBulkImportFile(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="bulk-import-file" className="cursor-pointer">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="font-medium">Click to select a file</p>
                          <p className="text-sm text-muted-foreground">or drag and drop</p>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Paste CSV Section */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Paste CSV Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Paste your CSV data below. First row should be headers.
                    </p>
                    
                    {/* Example */}
                    <div className="bg-background border rounded-md p-3 mb-3 text-xs font-mono overflow-x-auto">
                      <p className="text-muted-foreground mb-1">Example:</p>
                      <p>name,sku,barcode,selling_price,cost_price,quantity,category</p>
                      <p>Product A,SKU001,0123456789012,1500,1200,50,Electronics</p>
                      <p>Product B,SKU002,0987654321098,800,600,100,Clothing</p>
                    </div>
                    
                    <Textarea
                      placeholder="name,sku,barcode,selling_price,cost_price,quantity,category&#10;Product 1,SKU001,0123456789012,1000,800,50,General&#10;Product 2,SKU002,0987654321098,2000,1500,25,General"
                      value={bulkImportCsvText}
                      onChange={(e) => setBulkImportCsvText(e.target.value)}
                      className="font-mono text-sm min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {bulkImportCsvText.split('\n').filter(line => line.trim()).length - 1} products detected
                    </p>
                  </div>
                </>
              )}

              {/* Required Columns Info */}
              <div className="text-sm">
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>name</strong> - Product name</li>
                  <li><strong>selling_price</strong> - Selling price</li>
                </ul>
                <h4 className="font-medium mt-3 mb-2">Optional Columns:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>cost_price</strong> - Cost/purchase price</li>
                  <li><strong>quantity</strong> - Initial stock quantity</li>
                  <li><strong>category</strong> - Category name</li>
                  <li><strong>unit</strong> - Measurement unit (piece, kg, etc.)</li>
                  <li><strong>sku</strong> - Product SKU (auto-generated if empty)</li>
                  <li><strong>barcode</strong> - Manufacturer barcode (optional)</li>
                  <li><strong>description</strong> - Product description</li>
                  <li><strong>min_stock_level</strong> - Minimum stock alert level</li>
                  <li><strong>weight_kg</strong> - Weight in kilograms</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Results */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{bulkImportResult.created_count}</p>
                    <p className="text-sm text-muted-foreground">Created</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{bulkImportResult.skipped_count}</p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{bulkImportResult.error_count}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </CardContent>
                </Card>
              </div>

              {/* Skipped Items */}
              {bulkImportResult.skipped.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-yellow-600">Skipped Items:</h4>
                  <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-2">
                    {bulkImportResult.skipped.map((item, idx) => (
                      <p key={idx} className="text-sm">
                        Row {item.row}: {item.name ? `"${item.name}" - ` : ''}{item.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {bulkImportResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-2">
                    {bulkImportResult.errors.map((item, idx) => (
                      <p key={idx} className="text-sm text-red-600">
                        Row {item.row}: {item.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Products Preview */}
              {bulkImportResult.created_products.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Successfully Created:</h4>
                  <div className="max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-2">
                    {bulkImportResult.created_products.slice(0, 10).map((product, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">₦{product.selling_price.toLocaleString()}</span>
                      </div>
                    ))}
                    {bulkImportResult.created_products.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        ...and {bulkImportResult.created_products.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!bulkImportResult ? (
              <>
                <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (bulkImportMode === 'file' && !bulkImportFile) {
                      toast({
                        title: "No file selected",
                        description: "Please select a CSV or Excel file to import",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (bulkImportMode === 'paste' && !bulkImportCsvText.trim()) {
                      toast({
                        title: "No CSV data",
                        description: "Please paste your CSV data to import",
                        variant: "destructive",
                      });
                      return;
                    }

                    setBulkImportLoading(true);
                    try {
                      const formData = new FormData();
                      
                      if (bulkImportMode === 'file') {
                        formData.append('file', bulkImportFile!);
                      } else {
                        // Create a Blob from the pasted CSV text and send as file
                        const csvBlob = new Blob([bulkImportCsvText], { type: 'text/csv' });
                        formData.append('file', csvBlob, 'pasted_data.csv');
                      }

                      const response = await apiPost('business/products/bulk-import/', formData, true);
                      
                      setBulkImportResult({
                        created_count: response.created_count || 0,
                        skipped_count: response.skipped_count || 0,
                        error_count: response.error_count || 0,
                        created_products: response.created_products || [],
                        skipped: response.skipped || [],
                        errors: response.errors || [],
                      });

                      toast({
                        title: "Import Complete",
                        description: `Successfully imported ${response.created_count} products`,
                      });

                      // Refresh products list
                      load();
                    } catch (error: any) {
                      toast({
                        title: "Import Failed",
                        description: error.message || "Failed to import products",
                        variant: "destructive",
                      });
                    } finally {
                      setBulkImportLoading(false);
                    }
                  }}
                  disabled={(bulkImportMode === 'file' ? !bulkImportFile : !bulkImportCsvText.trim()) || bulkImportLoading}
                >
                  {bulkImportLoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Products
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setShowBulkImportDialog(false);
                setBulkImportFile(null);
                setBulkImportResult(null);
                setBulkImportCsvText('');
                setBulkImportMode('file');
              }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
