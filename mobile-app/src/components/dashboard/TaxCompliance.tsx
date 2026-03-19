import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PageSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Calculator, Users, FileText, Calendar, CheckCircle, AlertTriangle, 
  Clock, RefreshCw,
  TrendingUp, ArrowLeft, Building2, ExternalLink, CalendarPlus,
  AlertCircle, Info, CreditCard, Receipt, Copy, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/api';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Nigeria Tax Act 2025 brackets (effective January 2026)
const TAX_BRACKETS_2025 = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 2400000, rate: 0.07 },
  { min: 2400000, max: 4000000, rate: 0.11 },
  { min: 4000000, max: 6400000, rate: 0.15 },
  { min: 6400000, max: 12000000, rate: 0.19 },
  { min: 12000000, max: Infinity, rate: 0.25 },
];

interface Employee {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  monthly_salary: number;
  annual_salary: number;
  monthly_paye: number;
  annual_paye: number;
  effective_rate: number;
}

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'registration' | 'filing' | 'remittance' | 'record_keeping';
  mandatory: boolean;
  deadline?: string;
  action_url?: string;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount?: number;
  type: 'PAYE' | 'VAT' | 'WHT' | 'CIT' | 'Pension' | 'NHF' | 'ITF';
  urgent: boolean;
}

interface TaxDashboardData {
  stats: {
    monthly_paye: number;
    annual_paye: number;
    employee_count: number;
    total_payroll: number;
    compliance_percentage: number;
  };
  employees: Employee[];
  business: {
    name: string;
    tin: string;
    registration_type: string;
    registration_number: string;
    address: string;
  };
}

// Nigerian Tax Payment Portals
// IMPORTANT TAX AUTHORITY GUIDE:
// - PAYE (Personal Income Tax) → STATE Internal Revenue Service (SIRS) where employee resides/works
// - Company Income Tax (CIT) → Federal Inland Revenue Service (FIRS)
// - VAT → Federal Inland Revenue Service (FIRS)
// - WHT → FIRS (for federal) or State IRS (depending on transaction type)

// State Internal Revenue Services (SIRS) - for PAYE payments
const STATE_IRS_PORTALS: Record<string, { name: string; url: string }> = {
  lagos: { name: 'Lagos State Internal Revenue Service (LIRS)', url: 'https://etax.lirs.net/' },
  fct: { name: 'FCT Internal Revenue Service', url: 'https://fctirs.gov.ng/' },
  rivers: { name: 'Rivers State Internal Revenue Service', url: 'https://rirs.gov.ng/' },
  oyo: { name: 'Oyo State Internal Revenue Service', url: 'https://oyostatebir.com/' },
  kano: { name: 'Kano State Internal Revenue Service', url: 'https://kirs.gov.ng/' },
  kaduna: { name: 'Kaduna State Internal Revenue Service', url: 'https://kadirs.kdsg.gov.ng/' },
  ogun: { name: 'Ogun State Internal Revenue Service', url: 'https://ogirs.gov.ng/' },
  edo: { name: 'Edo State Internal Revenue Service', url: 'https://eirs.gov.ng/' },
  delta: { name: 'Delta State Internal Revenue Service', url: 'https://deltairs.gov.ng/' },
  enugu: { name: 'Enugu State Internal Revenue Service', url: 'https://esirs.gov.ng/' },
  anambra: { name: 'Anambra State Internal Revenue Service', url: 'https://airs.an.gov.ng/' },
  imo: { name: 'Imo State Internal Revenue Service', url: 'https://irsimo.gov.ng/' },
  abia: { name: 'Abia State Internal Revenue Service', url: 'https://absirs.gov.ng/' },
  cross_river: { name: 'Cross River State Internal Revenue Service', url: 'https://crirs.gov.ng/' },
  akwa_ibom: { name: 'Akwa Ibom State Internal Revenue Service', url: 'https://akirs.gov.ng/' },
  kwara: { name: 'Kwara State Internal Revenue Service', url: 'https://kwirs.gov.ng/' },
  osun: { name: 'Osun State Internal Revenue Service', url: 'https://osirs.gov.ng/' },
  ondo: { name: 'Ondo State Internal Revenue Service', url: 'https://odirs.gov.ng/' },
  ekiti: { name: 'Ekiti State Internal Revenue Service', url: 'https://eksirs.gov.ng/' },
  plateau: { name: 'Plateau State Internal Revenue Service', url: 'https://psirs.gov.ng/' },
  benue: { name: 'Benue State Internal Revenue Service', url: 'https://bsirs.gov.ng/' },
  nasarawa: { name: 'Nasarawa State Internal Revenue Service', url: 'https://nsirs.gov.ng/' },
  kogi: { name: 'Kogi State Internal Revenue Service', url: 'https://kgirs.gov.ng/' },
};

// Nigerian States List
const NIGERIAN_STATES = [
  { value: 'abia', label: 'Abia' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'benue', label: 'Benue' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'fct', label: 'FCT (Abuja)' },
  { value: 'imo', label: 'Imo' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
];

// Federal tax portals - CIT, VAT, WHT (NOT for PAYE)
const TAX_PAYMENT_PORTALS = [
  {
    name: 'FIRS TaxProMax',
    description: 'Federal Inland Revenue Service - For CIT, VAT, WHT. NOT for PAYE!',
    url: 'https://taxpromax.firs.gov.ng/',
    types: ['CIT', 'VAT', 'WHT'],
  },
  {
    name: 'Remita',
    description: 'Payment gateway for government payments',
    url: 'https://remita.net/',
    types: ['VAT', 'WHT', 'CIT'],
  },
  {
    name: 'PenCom Portal',
    description: 'For pension contributions via your PFA',
    url: 'https://www.pencom.gov.ng/',
    types: ['Pension'],
  },
  {
    name: 'FMBN Portal',
    description: 'For National Housing Fund (NHF)',
    url: 'https://www.fmbn.gov.ng/',
    types: ['NHF'],
  },
  {
    name: 'ITF Portal',
    description: 'For ITF contributions',
    url: 'https://www.itf.gov.ng/',
    types: ['ITF'],
  },
];

// Comprehensive Nigerian Tax Compliance Checklist
// IMPORTANT TAX AUTHORITY GUIDE:
// - PAYE (Personal Income Tax) → State Internal Revenue Service where employees work/reside
// - Company Income Tax (CIT) → Federal Inland Revenue Service (FIRS)
// - VAT → Federal Inland Revenue Service (FIRS)
const DEFAULT_COMPLIANCE_ITEMS: ComplianceItem[] = [
  // Registration Requirements
  {
    id: 'tin_registration',
    title: 'TIN Registration',
    description: 'Register for Tax Identification Number with FIRS (mandatory for all businesses)',
    completed: false,
    category: 'registration',
    mandatory: true,
    action_url: 'https://taxpromax.firs.gov.ng/',
  },
  {
    id: 'cac_registration',
    title: 'CAC Registration',
    description: 'Business Name or Company registration with Corporate Affairs Commission',
    completed: false,
    category: 'registration',
    mandatory: true,
    action_url: 'https://www.cac.gov.ng/',
  },
  {
    id: 'paye_registration',
    title: 'PAYE Employer Registration (State IRS)',
    description: 'Register as an employer with your STATE Internal Revenue Service for PAYE deductions. PAYE is paid to the state where employees work, NOT to FIRS.',
    completed: false,
    category: 'registration',
    mandatory: true,
  },
  {
    id: 'vat_registration',
    title: 'VAT Registration (FIRS)',
    description: 'Register for Value Added Tax with FIRS if turnover exceeds ₦100 million annually',
    completed: false,
    category: 'registration',
    mandatory: false,
    action_url: 'https://taxpromax.firs.gov.ng/',
  },
  {
    id: 'pension_registration',
    title: 'Pension Fund Administrator',
    description: 'Register with a licensed PFA and open RSA for employees (mandatory if 3+ employees)',
    completed: false,
    category: 'registration',
    mandatory: true,
    action_url: 'https://www.pencom.gov.ng/',
  },
  {
    id: 'nhf_registration',
    title: 'NHF Registration',
    description: 'Register with Federal Mortgage Bank of Nigeria for National Housing Fund',
    completed: false,
    category: 'registration',
    mandatory: true,
    action_url: 'https://www.fmbn.gov.ng/',
  },
  {
    id: 'itf_registration',
    title: 'ITF Registration',
    description: 'Register with Industrial Training Fund (if 5+ employees or turnover > ₦50M)',
    completed: false,
    category: 'registration',
    mandatory: false,
    action_url: 'https://www.itf.gov.ng/',
  },
  {
    id: 'nsitf_registration',
    title: 'NSITF Registration',
    description: 'Register with Nigeria Social Insurance Trust Fund for employees compensation',
    completed: false,
    category: 'registration',
    mandatory: true,
    action_url: 'https://www.nsitf.gov.ng/',
  },
  
  // Filing Requirements
  {
    id: 'monthly_paye_filing',
    title: 'Monthly PAYE Returns (State IRS)',
    description: 'File monthly PAYE returns with your STATE Internal Revenue Service by 10th of following month',
    completed: false,
    category: 'filing',
    mandatory: true,
    deadline: 'Monthly - 10th',
  },
  {
    id: 'monthly_vat_filing',
    title: 'Monthly VAT Returns (FIRS)',
    description: 'File VAT returns with FIRS by 21st of the following month (if VAT registered)',
    completed: false,
    category: 'filing',
    mandatory: false,
    deadline: 'Monthly - 21st',
  },
  {
    id: 'annual_tax_returns',
    title: 'Annual Company Tax Returns (FIRS)',
    description: 'File annual Company Income Tax returns with FIRS within 6 months of year-end',
    completed: false,
    category: 'filing',
    mandatory: true,
    deadline: 'Annual - 6 months after year-end',
  },
  {
    id: 'annual_audited_accounts',
    title: 'Audited Financial Statements (FIRS)',
    description: 'Submit audited accounts to FIRS (for companies)',
    completed: false,
    category: 'filing',
    mandatory: true,
    deadline: 'Annual - 6 months after year-end',
  },
  
  // Remittance Requirements
  {
    id: 'paye_remittance',
    title: 'PAYE Remittance (State IRS)',
    description: 'Remit PAYE/Income Tax to your STATE Internal Revenue Service by 10th of following month. NOT to FIRS!',
    completed: false,
    category: 'remittance',
    mandatory: true,
    deadline: 'Monthly - 10th',
  },
  {
    id: 'pension_remittance',
    title: 'Pension Contribution',
    description: 'Remit pension contributions (18% - 10% employer, 8% employee) by 7th of following month',
    completed: false,
    category: 'remittance',
    mandatory: true,
    deadline: 'Monthly - 7th',
  },
  {
    id: 'nhf_remittance',
    title: 'NHF Remittance',
    description: 'Remit National Housing Fund (2.5% of basic salary) monthly',
    completed: false,
    category: 'remittance',
    mandatory: true,
    deadline: 'Monthly',
  },
  {
    id: 'vat_remittance',
    title: 'VAT Remittance',
    description: 'Remit VAT collected to FIRS by 21st of following month',
    completed: false,
    category: 'remittance',
    mandatory: false,
    deadline: 'Monthly - 21st',
  },
  {
    id: 'wht_remittance',
    title: 'WHT Remittance',
    description: 'Remit Withholding Tax deducted from payments to contractors/suppliers',
    completed: false,
    category: 'remittance',
    mandatory: true,
    deadline: 'Within 21 days of deduction',
  },
  {
    id: 'itf_remittance',
    title: 'ITF Contribution',
    description: 'Remit 1% of annual payroll to ITF',
    completed: false,
    category: 'remittance',
    mandatory: false,
    deadline: 'Quarterly',
  },
  {
    id: 'nsitf_remittance',
    title: 'NSITF Contribution',
    description: 'Remit 1% of payroll to NSITF',
    completed: false,
    category: 'remittance',
    mandatory: true,
    deadline: 'Monthly',
  },
  
  // Record Keeping
  {
    id: 'payroll_records',
    title: 'Payroll Records',
    description: 'Maintain accurate payroll records for at least 6 years',
    completed: false,
    category: 'record_keeping',
    mandatory: true,
  },
  {
    id: 'tax_receipts',
    title: 'Tax Payment Receipts',
    description: 'Keep all tax payment receipts and TCC certificates',
    completed: false,
    category: 'record_keeping',
    mandatory: true,
  },
  {
    id: 'employee_records',
    title: 'Employee Tax Records',
    description: 'Maintain Form A (PAYE computation) for each employee',
    completed: false,
    category: 'record_keeping',
    mandatory: true,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate PAYE tax based on Nigeria Tax Act 2025
function calculatePAYE(annualSalary: number): {
  grossPay: number;
  nhf: number;
  pension: number;
  cra: number;
  taxableIncome: number;
  paye: number;
  effectiveRate: number;
} {
  const nhf = annualSalary * 0.025;
  const pension = annualSalary * 0.08;
  const cra = Math.max(200000, annualSalary * 0.01) + (annualSalary * 0.20);
  const taxableIncome = Math.max(0, annualSalary - nhf - pension - cra);
  
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  
  for (const bracket of TAX_BRACKETS_2025) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    totalTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  const effectiveRate = annualSalary > 0 ? (totalTax / annualSalary) * 100 : 0;
  
  return { grossPay: annualSalary, nhf, pension, cra, taxableIncome, paye: totalTax, effectiveRate };
}

// Generate upcoming tax deadlines
function generateUpcomingDeadlines(): Deadline[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const deadlines: Deadline[] = [];
  const prevMonthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
  
  // Pension - 7th
  const pensionDate = new Date(currentYear, currentMonth, 7);
  if (pensionDate > now) {
    deadlines.push({
      id: 'pension_next',
      title: 'Pension Contribution',
      description: `${prevMonthName} pension due`,
      dueDate: pensionDate.toISOString().split('T')[0],
      type: 'Pension',
      urgent: (pensionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7,
    });
  }
  
  // PAYE - 10th
  const payeDate = new Date(currentYear, currentMonth, 10);
  if (payeDate > now) {
    deadlines.push({
      id: 'paye_next',
      title: 'PAYE Remittance',
      description: `${prevMonthName} PAYE due`,
      dueDate: payeDate.toISOString().split('T')[0],
      type: 'PAYE',
      urgent: (payeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7,
    });
  }
  
  // NHF - 15th
  const nhfDate = new Date(currentYear, currentMonth, 15);
  if (nhfDate > now) {
    deadlines.push({
      id: 'nhf_next',
      title: 'NHF Remittance',
      description: `${prevMonthName} NHF due`,
      dueDate: nhfDate.toISOString().split('T')[0],
      type: 'NHF',
      urgent: (nhfDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7,
    });
  }
  
  // VAT - 21st
  const vatDate = new Date(currentYear, currentMonth, 21);
  if (vatDate > now) {
    deadlines.push({
      id: 'vat_next',
      title: 'VAT Returns & Remittance',
      description: `${prevMonthName} VAT due`,
      dueDate: vatDate.toISOString().split('T')[0],
      type: 'VAT',
      urgent: (vatDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7,
    });
  }
  
  // Add next month deadlines
  const nextPensionDate = new Date(currentYear, currentMonth + 1, 7);
  deadlines.push({
    id: 'pension_next_month',
    title: 'Pension Contribution',
    description: `${new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' })} pension due`,
    dueDate: nextPensionDate.toISOString().split('T')[0],
    type: 'Pension',
    urgent: false,
  });
  
  const nextPayeDate = new Date(currentYear, currentMonth + 1, 10);
  deadlines.push({
    id: 'paye_next_month',
    title: 'PAYE Remittance',
    description: `${new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' })} PAYE due`,
    dueDate: nextPayeDate.toISOString().split('T')[0],
    type: 'PAYE',
    urgent: false,
  });
  
  // CIT - Annual
  const citDate = new Date(currentYear + 1, 5, 30);
  deadlines.push({
    id: 'cit_annual',
    title: 'Company Income Tax',
    description: `${currentYear} Annual CIT filing`,
    dueDate: citDate.toISOString().split('T')[0],
    type: 'CIT',
    urgent: false,
  });
  
  return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export default function TaxCompliance() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TaxDashboardData | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(DEFAULT_COMPLIANCE_ITEMS);
  const [upcomingDeadlines] = useState<Deadline[]>(generateUpcomingDeadlines());
  
  const [personalIncome, setPersonalIncome] = useState('');
  const [personalResult, setPersonalResult] = useState<ReturnType<typeof calculatePAYE> | null>(null);
  
  // Business owner PAYE calculation
  const [selectedState, setSelectedState] = useState('lagos');
  const [businessOwnerSalary, setBusinessOwnerSalary] = useState('');
  const [businessOwnerResult, setBusinessOwnerResult] = useState<ReturnType<typeof calculatePAYE> | null>(null);
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState<string>('');

  const loadTaxDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiGet('business/tax/dashboard/');
      if (result.success) {
        setData(result);
        
        if (result.business) {
          setComplianceItems(prev => prev.map(item => {
            if (item.id === 'tin_registration') {
              return { ...item, completed: !!result.business.tin };
            }
            if (item.id === 'cac_registration') {
              return { ...item, completed: !!result.business.registration_number };
            }
            return item;
          }));
        }
      }
    } catch (error) {
      console.error('Error loading tax dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxDashboard();
  }, [loadTaxDashboard]);

  const handleCalculatePAYE = () => {
    const income = parseFloat(personalIncome.replace(/,/g, '')) || 0;
    if (income > 0) {
      setPersonalResult(calculatePAYE(income));
    }
  };

  const handleCalculateOwnerPAYE = () => {
    const salary = parseFloat(businessOwnerSalary.replace(/,/g, '')) || 0;
    if (salary > 0) {
      setBusinessOwnerResult(calculatePAYE(salary));
    }
  };

  const handleComplianceToggle = (itemId: string) => {
    setComplianceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
    toast({ title: "Compliance Updated", description: "Your compliance checklist has been updated." });
  };

  const getCompliancePercentage = () => {
    const mandatoryItems = complianceItems.filter(item => item.mandatory);
    const completedMandatory = mandatoryItems.filter(item => item.completed);
    return Math.round((completedMandatory.length / mandatoryItems.length) * 100);
  };

  const openPaymentPortal = (taxType: string) => {
    setSelectedTaxType(taxType);
    setShowPaymentDialog(true);
  };

  const addToGoogleCalendar = (deadline: Deadline) => {
    const startDate = new Date(deadline.dueDate);
    const endDate = new Date(deadline.dueDate);
    endDate.setHours(endDate.getHours() + 1);
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(deadline.title)}&details=${encodeURIComponent(deadline.description)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&sf=true&output=xml`;
    
    window.open(calendarUrl, '_blank');
    toast({ title: "Calendar Event", description: "Opening Google Calendar to add reminder..." });
  };

  const copyPaymentReference = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Payment reference copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageSpinner message="Loading tax compliance..." />
      </div>
    );
  }

  const compliancePercentage = getCompliancePercentage();

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/business-admin-dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tax Compliance</h1>
          <p className="text-muted-foreground">Manage your tax obligations and stay compliant</p>
        </div>
        <Button variant="outline" className="ml-auto" onClick={loadTaxDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Business Info Banner */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-10 h-10 text-blue-600" />
              <div>
                <h3 className="font-semibold">{data?.business?.name || 'Your Business'}</h3>
                <p className="text-sm text-muted-foreground">
                  {data?.business?.registration_type === 'registered_company' 
                    ? `RC: ${data?.business?.registration_number || 'Not registered'}` 
                    : `BN: ${data?.business?.registration_number || 'Not registered'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">TIN</p>
                <p className="font-mono font-semibold">
                  {data?.business?.tin || (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Not registered
                    </span>
                  )}
                </p>
              </div>
              {!data?.business?.tin && (
                <Button size="sm" onClick={() => navigate('/business/settings')}>
                  Add TIN
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Compliance</p>
                <p className="text-xl md:text-2xl font-bold">{compliancePercentage}%</p>
              </div>
            </div>
            <Progress value={compliancePercentage} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Employees</p>
                <p className="text-xl md:text-2xl font-bold">{data?.stats?.employee_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Monthly PAYE</p>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(data?.stats?.monthly_paye || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Annual Payroll</p>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(data?.stats?.total_payroll || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section in Bordered Container */}
      <Card className="p-5 md:p-8 mt-4">
        <Tabs defaultValue="compliance" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-4">
            <TabsTrigger value="compliance" className="text-xs md:text-sm">Compliance</TabsTrigger>
            <TabsTrigger value="deadlines" className="text-xs md:text-sm">Deadlines</TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs md:text-sm">Calculator</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs md:text-sm">Pay Taxes</TabsTrigger>
          </TabsList>

        {/* Compliance Checklist Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registration Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Registration Requirements
                </CardTitle>
                <CardDescription>Mandatory registrations for tax compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {complianceItems.filter(item => item.category === 'registration').map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => handleComplianceToggle(item.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={item.id} className="font-medium cursor-pointer flex items-center gap-2">
                        {item.title}
                        {item.mandatory && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.action_url && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 mt-1"
                          onClick={() => window.open(item.action_url, '_blank')}
                        >
                          Register Now <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Filing & Remittance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Filing & Remittance
                </CardTitle>
                <CardDescription>Periodic tax filing and payment obligations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {complianceItems.filter(item => item.category === 'filing' || item.category === 'remittance').map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => handleComplianceToggle(item.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={item.id} className="font-medium cursor-pointer flex items-center gap-2">
                        {item.title}
                        {item.deadline && <Badge variant="outline" className="text-xs">{item.deadline}</Badge>}
                      </label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Record Keeping */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Record Keeping Requirements
                </CardTitle>
                <CardDescription>Maintain proper records for audit purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {complianceItems.filter(item => item.category === 'record_keeping').map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={item.id}
                        checked={item.completed}
                        onCheckedChange={() => handleComplianceToggle(item.id)}
                      />
                      <div className="flex-1">
                        <label htmlFor={item.id} className="font-medium cursor-pointer text-sm">
                          {item.title}
                        </label>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Tax Deadlines
              </CardTitle>
              <CardDescription>Add reminders to your Google Calendar to never miss a deadline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map(deadline => (
                  <div 
                    key={deadline.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 ${
                      deadline.urgent ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${deadline.urgent ? 'bg-red-100' : 'bg-muted'}`}>
                        {deadline.urgent ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2 flex-wrap">
                          {deadline.title}
                          <Badge variant={deadline.urgent ? "destructive" : "secondary"}>
                            {deadline.type}
                          </Badge>
                        </p>
                        <p className="text-sm text-muted-foreground">{deadline.description}</p>
                        <p className="text-sm font-medium mt-1">
                          Due: {new Date(deadline.dueDate).toLocaleDateString('en-NG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addToGoogleCalendar(deadline)}
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add to Google Calendar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button 
                        size="sm"
                        onClick={() => openPaymentPortal(deadline.type)}
                      >
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          {/* State Selection */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                State of Residence (for PAYE)
              </CardTitle>
              <CardDescription>
                PAYE is paid to your State Internal Revenue Service, NOT to FIRS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {STATE_IRS_PORTALS[selectedState] && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm font-medium">{STATE_IRS_PORTALS[selectedState].name}</p>
                  <a 
                    href={STATE_IRS_PORTALS[selectedState].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Visit portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Owner PAYE Calculator */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Business Owner PAYE
                </CardTitle>
                <CardDescription>Calculate your personal PAYE as the business owner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>Your Annual Salary (₦)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 5,000,000"
                    value={businessOwnerSalary}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setBusinessOwnerSalary(value ? parseInt(value).toLocaleString() : '');
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the salary you pay yourself as the business owner
                  </p>
                </div>
                <Button onClick={handleCalculateOwnerPAYE} className="w-full bg-purple-600 hover:bg-purple-700">
                  Calculate My PAYE
                </Button>
                
                {businessOwnerResult && (
                  <div className="mt-4 space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex justify-between py-2 border-b border-purple-200">
                      <span>Annual Salary</span>
                      <span className="font-semibold">{formatCurrency(businessOwnerResult.grossPay)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-purple-200">
                      <span>Annual PAYE</span>
                      <span className="font-bold text-purple-700">{formatCurrency(businessOwnerResult.paye)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-purple-200">
                      <span>Monthly PAYE</span>
                      <span className="font-semibold">{formatCurrency(businessOwnerResult.paye / 12)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Effective Rate</span>
                      <Badge className="bg-purple-600">{businessOwnerResult.effectiveRate.toFixed(2)}%</Badge>
                    </div>
                    
                    {STATE_IRS_PORTALS[selectedState] && (
                      <Button 
                        className="w-full mt-3"
                        onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pay via {STATE_IRS_PORTALS[selectedState].name.split(' ')[0]} State IRS
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff PAYE Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  PAYE Calculator (2025 Tax Act)
                </CardTitle>
                <CardDescription>Calculate Pay-As-You-Earn tax based on annual salary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Annual Gross Salary (₦)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 3,600,000"
                    value={personalIncome}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPersonalIncome(value ? parseInt(value).toLocaleString() : '');
                    }}
                  />
                </div>
                <Button onClick={handleCalculatePAYE} className="w-full">
                  Calculate PAYE
                </Button>
              </CardContent>
            </Card>

            {personalResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Tax Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Gross Annual Salary</span>
                    <span className="font-semibold">{formatCurrency(personalResult.grossPay)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>Less: Pension (8%)</span>
                    <span>-{formatCurrency(personalResult.pension)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>Less: NHF (2.5%)</span>
                    <span>-{formatCurrency(personalResult.nhf)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>Less: CRA</span>
                    <span>-{formatCurrency(personalResult.cra)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Taxable Income</span>
                    <span className="font-semibold">{formatCurrency(personalResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-muted p-3 rounded-lg">
                    <span className="font-semibold">Annual PAYE</span>
                    <span className="font-bold text-lg">{formatCurrency(personalResult.paye)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 p-3 rounded-lg">
                    <span>Monthly PAYE</span>
                    <span className="font-semibold">{formatCurrency(personalResult.paye / 12)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Effective Tax Rate</span>
                    <Badge variant="secondary">{personalResult.effectiveRate.toFixed(2)}%</Badge>
                  </div>
                  
                  {/* State IRS Payment Button */}
                  {STATE_IRS_PORTALS[selectedState] && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                        Staff PAYE is remitted to the State IRS where the employee works
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pay via {STATE_IRS_PORTALS[selectedState].name.split(' ')[0]} State IRS
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 2025 Tax Brackets Reference */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Nigeria Tax Act 2025 - Personal Income Tax Brackets
                </CardTitle>
                <CardDescription>Effective from January 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Income Band</th>
                        <th className="text-right p-2">Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAX_BRACKETS_2025.map((bracket, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">
                            {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                          </td>
                          <td className="text-right p-2 font-semibold">
                            {(bracket.rate * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * First ₦800,000 is tax-free under the 2025 Tax Act. CRA of ₦200,000 or 1% of gross income 
                  (whichever is higher) + 20% of gross income is deducted before applying tax rates.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tax Payment Portals
              </CardTitle>
              <CardDescription>
                Official government portals for tax payments. Your wallet balance cannot be used for tax payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TAX_PAYMENT_PORTALS.map(portal => (
                  <Card key={portal.name} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Landmark className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{portal.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{portal.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {portal.types.map(type => (
                              <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                            ))}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(portal.url, '_blank')}
                          >
                            Go to Portal <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Important Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tax payments must be made directly through official government portals using bank transfer, 
                      card payment, or approved payment channels. Keep all payment receipts for your Tax Clearance Certificate (TCC).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Reference Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment Reference Generator
              </CardTitle>
              <CardDescription>Generate payment references for your tax payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tax Type</Label>
                  <Select value={selectedTaxType} onValueChange={setSelectedTaxType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYE">PAYE</SelectItem>
                      <SelectItem value="VAT">VAT</SelectItem>
                      <SelectItem value="WHT">Withholding Tax</SelectItem>
                      <SelectItem value="CIT">Company Income Tax</SelectItem>
                      <SelectItem value="Pension">Pension</SelectItem>
                      <SelectItem value="NHF">NHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedTaxType && data?.business?.tin && (
                  <div className="flex items-end">
                    <div className="flex-1">
                      <Label>Payment Reference</Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${selectedTaxType}-${data.business.tin}-${new Date().toISOString().slice(0, 7)}`}
                          readOnly
                          className="font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyPaymentReference(`${selectedTaxType}-${data.business.tin}-${new Date().toISOString().slice(0, 7)}`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedTaxType && !data?.business?.tin && (
                <p className="text-sm text-red-500 mt-2">
                  Please add your TIN in Business Settings to generate payment references.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </Card>

      {/* Payment Portal Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay {selectedTaxType}</DialogTitle>
            <DialogDescription>Select an official portal to make your {selectedTaxType} payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {TAX_PAYMENT_PORTALS.filter(p => p.types.includes(selectedTaxType)).map(portal => (
              <Button
                key={portal.name}
                variant="outline"
                className="w-full justify-start gap-3 h-auto p-4"
                onClick={() => {
                  window.open(portal.url, '_blank');
                  setShowPaymentDialog(false);
                }}
              >
                <Landmark className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">{portal.name}</p>
                  <p className="text-xs text-muted-foreground">{portal.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto" />
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
