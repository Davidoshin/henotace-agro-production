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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calculator, Users, FileText, Calendar, CheckCircle, AlertTriangle, 
  Clock, RefreshCw, ChevronDown, Package, Wrench,
  TrendingUp, ArrowLeft, Building2, ExternalLink, CalendarPlus,
  AlertCircle, Info, CreditCard, Receipt, Copy, Landmark, Sparkles
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

// VAT Constants - Nigeria 2024
const VAT_RATE = 0.075; // 7.5%
const VAT_THRESHOLD = 100000000; // ₦100 million annual turnover threshold for VAT registration

// VAT Exempt Categories - Goods and services that don't require VAT collection
const VAT_EXEMPT_CATEGORIES = [
  { value: 'basic_food', label: 'Basic Food Items (unprocessed)', description: 'Fruits, vegetables, grains, tubers' },
  { value: 'medical', label: 'Medical & Healthcare Services', description: 'Hospitals, clinics, pharmacies' },
  { value: 'education', label: 'Educational Services', description: 'Schools, universities, training' },
  { value: 'financial', label: 'Financial Services', description: 'Banking, insurance, pension services' },
  { value: 'export', label: 'Export Services', description: 'Goods/services exported outside Nigeria' },
  { value: 'agricultural', label: 'Agricultural Products', description: 'Farm produce, livestock, fishery' },
  { value: 'baby_products', label: 'Baby Products', description: 'Baby food, diapers, infant formula' },
  { value: 'books', label: 'Books & Newspapers', description: 'Educational materials, newspapers' },
];

// VAT Taxable Business Categories
const VAT_TAXABLE_CATEGORIES = [
  { value: 'retail', label: 'Retail Trade', description: 'Sale of goods to consumers' },
  { value: 'wholesale', label: 'Wholesale Trade', description: 'Sale of goods in bulk' },
  { value: 'manufacturing', label: 'Manufacturing', description: 'Production of goods' },
  { value: 'hospitality', label: 'Hospitality & Entertainment', description: 'Hotels, restaurants, events' },
  { value: 'professional', label: 'Professional Services', description: 'Legal, accounting, consulting' },
  { value: 'telecom', label: 'Telecommunications', description: 'Phone, internet services' },
  { value: 'transport', label: 'Transportation', description: 'Logistics, shipping, delivery' },
  { value: 'construction', label: 'Construction', description: 'Building, renovation services' },
  { value: 'real_estate', label: 'Real Estate', description: 'Property sales and rentals' },
  { value: 'technology', label: 'Technology Services', description: 'Software, IT services' },
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
// - Pension → PFA/PenCom
// - NHF → Federal Mortgage Bank of Nigeria

// State Internal Revenue Services (SIRS) - for PAYE payments
const STATE_IRS_PORTALS: Record<string, { name: string; url: string; phone?: string }> = {
  lagos: { name: 'Lagos State Internal Revenue Service (LIRS)', url: 'https://etax.lirs.net/', phone: '0700-CALL-LIRS' },
  fct: { name: 'FCT Internal Revenue Service', url: 'https://fctirs.gov.ng/', phone: '' },
  rivers: { name: 'Rivers State Internal Revenue Service', url: 'https://rirs.gov.ng/', phone: '' },
  oyo: { name: 'Oyo State Internal Revenue Service', url: 'https://oyostatebir.com/', phone: '' },
  kano: { name: 'Kano State Internal Revenue Service', url: 'https://kirs.gov.ng/', phone: '' },
  kaduna: { name: 'Kaduna State Internal Revenue Service', url: 'https://kadirs.kdsg.gov.ng/', phone: '' },
  ogun: { name: 'Ogun State Internal Revenue Service', url: 'https://ogirs.gov.ng/', phone: '' },
  edo: { name: 'Edo State Internal Revenue Service', url: 'https://eirs.gov.ng/', phone: '' },
  delta: { name: 'Delta State Internal Revenue Service', url: 'https://deltairs.gov.ng/', phone: '' },
  enugu: { name: 'Enugu State Internal Revenue Service', url: 'https://esirs.gov.ng/', phone: '' },
  anambra: { name: 'Anambra State Internal Revenue Service', url: 'https://airs.an.gov.ng/', phone: '' },
  imo: { name: 'Imo State Internal Revenue Service', url: 'https://irsimo.gov.ng/', phone: '' },
  abia: { name: 'Abia State Internal Revenue Service', url: 'https://absirs.gov.ng/', phone: '' },
  cross_river: { name: 'Cross River State Internal Revenue Service', url: 'https://crirs.gov.ng/', phone: '' },
  akwa_ibom: { name: 'Akwa Ibom State Internal Revenue Service', url: 'https://akirs.gov.ng/', phone: '' },
  kwara: { name: 'Kwara State Internal Revenue Service', url: 'https://kwirs.gov.ng/', phone: '' },
  osun: { name: 'Osun State Internal Revenue Service', url: 'https://osirs.gov.ng/', phone: '' },
  ondo: { name: 'Ondo State Internal Revenue Service', url: 'https://odirs.gov.ng/', phone: '' },
  ekiti: { name: 'Ekiti State Internal Revenue Service', url: 'https://eksirs.gov.ng/', phone: '' },
  plateau: { name: 'Plateau State Internal Revenue Service', url: 'https://psirs.gov.ng/', phone: '' },
  benue: { name: 'Benue State Internal Revenue Service', url: 'https://bsirs.gov.ng/', phone: '' },
  nasarawa: { name: 'Nasarawa State Internal Revenue Service', url: 'https://nsirs.gov.ng/', phone: '' },
  kogi: { name: 'Kogi State Internal Revenue Service', url: 'https://kgirs.gov.ng/', phone: '' },
  niger: { name: 'Niger State Internal Revenue Service', url: 'https://nsirs.gov.ng/', phone: '' },
  sokoto: { name: 'Sokoto State Internal Revenue Service', url: 'https://soksirs.gov.ng/', phone: '' },
  kebbi: { name: 'Kebbi State Internal Revenue Service', url: 'https://kebirs.gov.ng/', phone: '' },
  zamfara: { name: 'Zamfara State Internal Revenue Service', url: 'https://zamirs.gov.ng/', phone: '' },
  katsina: { name: 'Katsina State Internal Revenue Service', url: 'https://ktirs.gov.ng/', phone: '' },
  jigawa: { name: 'Jigawa State Internal Revenue Service', url: 'https://jgirs.gov.ng/', phone: '' },
  bauchi: { name: 'Bauchi State Internal Revenue Service', url: 'https://basirs.gov.ng/', phone: '' },
  gombe: { name: 'Gombe State Internal Revenue Service', url: 'https://gosirs.gov.ng/', phone: '' },
  adamawa: { name: 'Adamawa State Internal Revenue Service', url: 'https://adsirs.gov.ng/', phone: '' },
  taraba: { name: 'Taraba State Internal Revenue Service', url: 'https://trsirs.gov.ng/', phone: '' },
  borno: { name: 'Borno State Internal Revenue Service', url: 'https://bosirs.gov.ng/', phone: '' },
  yobe: { name: 'Yobe State Internal Revenue Service', url: 'https://yosirs.gov.ng/', phone: '' },
  bayelsa: { name: 'Bayelsa State Internal Revenue Service', url: 'https://bysirs.gov.ng/', phone: '' },
  ebonyi: { name: 'Ebonyi State Internal Revenue Service', url: 'https://ebsirs.gov.ng/', phone: '' },
};

// Nigerian States List
const NIGERIAN_STATES = [
  { value: 'abia', label: 'Abia' },
  { value: 'adamawa', label: 'Adamawa' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'fct', label: 'FCT (Abuja)' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' },
];

// Federal tax portals - CIT, VAT, WHT (NOT for PAYE)
const TAX_PAYMENT_PORTALS = [
  {
    name: 'FIRS TaxProMax',
    description: 'Federal Inland Revenue Service - For Company Income Tax (CIT), VAT, and WHT only. NOT for PAYE!',
    url: 'https://taxpromax.firs.gov.ng/',
    types: ['CIT', 'VAT', 'WHT'],
    note: 'Federal taxes only (NOT for PAYE)'
  },
  {
    name: 'Remita',
    description: 'Official payment gateway - Can be used for various government payments',
    url: 'https://remita.net/',
    types: ['PAYE', 'VAT', 'WHT', 'CIT'],
    note: 'Payment gateway'
  },
  {
    name: 'PenCom Portal',
    description: 'National Pension Commission - For pension contributions via your PFA',
    url: 'https://www.pencom.gov.ng/',
    types: ['Pension'],
    note: 'Pension only'
  },
  {
    name: 'FMBN Portal',
    description: 'Federal Mortgage Bank of Nigeria - For National Housing Fund (NHF)',
    url: 'https://www.fmbn.gov.ng/',
    types: ['NHF'],
    note: 'NHF only'
  },
  {
    name: 'ITF Portal',
    description: 'Industrial Training Fund - For ITF contributions',
    url: 'https://www.itf.gov.ng/',
    types: ['ITF'],
    note: 'ITF only'
  },
];

// Comprehensive Nigerian Tax Compliance Checklist
// IMPORTANT TAX AUTHORITY GUIDE:
// - PAYE (Personal Income Tax) → State Internal Revenue Service where employees work/reside
// - Company Income Tax (CIT) → Federal Inland Revenue Service (FIRS)
// - VAT → Federal Inland Revenue Service (FIRS)
// - WHT → FIRS (for federal) or State IRS (depending on transaction type)
// - Pension → PFA/PenCom
// - NHF → Federal Mortgage Bank of Nigeria
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
  
  // State of residence for PAYE payment
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Business owner salary for tax computation
  const [businessOwnerSalary, setBusinessOwnerSalary] = useState('');
  const [businessOwnerResult, setBusinessOwnerResult] = useState<ReturnType<typeof calculatePAYE> | null>(null);
  
  const [personalIncome, setPersonalIncome] = useState('');
  const [personalResult, setPersonalResult] = useState<ReturnType<typeof calculatePAYE> | null>(null);
  
  // VAT Tracking State
  const [vatTracker, setVatTracker] = useState({
    annualTurnover: 0,
    vatCollected: 0,
    vatPaid: 0,
    vatLiable: false,
    businessCategory: '', // product, service, or hybrid
    isExemptCategory: false,
  });
  
  // Collapsible states for PAYE and VAT sections
  const [payeOpen, setPayeOpen] = useState(true);
  const [vatOpen, setVatOpen] = useState(false);
  
  // Business owner VAT settings (loaded from business settings)
  const [businessVatSettings, setBusinessVatSettings] = useState({
    vat_business_type: '',
    vat_product_category: '',
    vat_service_category: '',
    is_vat_registered: false,
    vat_number: '',
  });
  
  // Calculated VAT amount based on business revenue
  const [calculatedVat, setCalculatedVat] = useState({
    annualRevenue: 0,
    isVatLiable: false,
    monthlyVatDue: 0,
    annualVatDue: 0,
  });
  
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
      
      // Also load business settings for VAT info
      const settingsResult = await apiGet('business/settings/');
      if (settingsResult.success && settingsResult.business) {
        const biz = settingsResult.business;
        // Load PAYE settings
        if (biz.state_of_residence) {
          setSelectedState(biz.state_of_residence.toLowerCase().replace(' ', '_'));
        }
        if (biz.owner_annual_salary) {
          setBusinessOwnerSalary(biz.owner_annual_salary);
          // Auto-calculate PAYE
          const salary = parseFloat(biz.owner_annual_salary) || 0;
          if (salary > 0) {
            setBusinessOwnerResult(calculatePAYE(salary));
          }
        }
        
        // Load VAT settings
        setBusinessVatSettings({
          vat_business_type: biz.vat_business_type || '',
          vat_product_category: biz.vat_product_category || '',
          vat_service_category: biz.vat_service_category || '',
          is_vat_registered: biz.is_vat_registered || false,
          vat_number: biz.vat_number || '',
        });
      }
      
      // Load business revenue for VAT calculation
      const analyticsResult = await apiGet('business/analytics/');
      if (analyticsResult.success && analyticsResult.data) {
        const annualRevenue = analyticsResult.data.annual_revenue || 0;
        const isVatLiable = annualRevenue >= VAT_THRESHOLD;
        const annualVatDue = isVatLiable ? annualRevenue * VAT_RATE : 0;
        const monthlyVatDue = annualVatDue / 12;
        
        setCalculatedVat({
          annualRevenue,
          isVatLiable,
          monthlyVatDue,
          annualVatDue,
        });
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

      {/* Professional Tax Services Banner */}
      <Card className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white overflow-hidden border-0">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Need Help with Tax Compliance?</h3>
              <p className="text-xs sm:text-sm text-white/80">Our experts can handle your TIN registration, PAYE filing & more</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/business/professional-services')}
            variant="secondary"
            size="sm"
            className="bg-white text-green-600 hover:bg-white/90 font-medium"
          >
            <Calculator className="w-4 h-4 mr-1" />
            Get Help
          </Button>
        </CardContent>
      </Card>

      {/* Business Owner Tax Summary - PAYE & VAT Collapsibles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Owner Tax Summary
          </CardTitle>
          <CardDescription>
            Your personal PAYE and business VAT obligations based on your settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PAYE Collapsible */}
          <Collapsible open={payeOpen} onOpenChange={setPayeOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">PAYE (Pay As You Earn)</h4>
                  <p className="text-sm text-muted-foreground">Personal Income Tax for business owner</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {businessOwnerResult && (
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    {formatCurrency(businessOwnerResult.paye / 12)}/month
                  </Badge>
                )}
                <ChevronDown className={`h-5 w-5 transition-transform ${payeOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Current PAYE Settings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">State of Residence</Label>
                  <p className="font-medium">
                    {selectedState ? NIGERIAN_STATES.find(s => s.value === selectedState)?.label || selectedState : 
                      <span className="text-orange-500">Not set - <Button variant="link" className="h-auto p-0" onClick={() => navigate('/business/settings')}>Configure in Settings</Button></span>
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Annual Salary</Label>
                  <p className="font-medium">
                    {businessOwnerSalary ? formatCurrency(parseFloat(businessOwnerSalary)) : 
                      <span className="text-orange-500">Not set - <Button variant="link" className="h-auto p-0" onClick={() => navigate('/business/settings')}>Configure in Settings</Button></span>
                    }
                  </p>
                </div>
              </div>

              {/* Auto-calculated PAYE */}
              {businessOwnerResult ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Monthly PAYE</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(businessOwnerResult.paye / 12)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Annual PAYE</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(businessOwnerResult.paye)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Effective Rate</p>
                      <p className="text-xl font-bold text-purple-600">{businessOwnerResult.effectiveRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Net Monthly</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency((parseFloat(businessOwnerSalary) / 12) - (businessOwnerResult.paye / 12))}</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-6 text-center bg-muted/30 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Configure your salary in Business Settings to see PAYE calculation</p>
                  <Button className="mt-3" onClick={() => navigate('/business/settings')}>
                    Go to Settings
                  </Button>
                </div>
              )}

              {/* Pay PAYE Button */}
              {businessOwnerResult && selectedState && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => openPaymentPortal('PAYE')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Landmark className="w-4 h-4 mr-2" />
                    Pay PAYE to {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} IRS
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* VAT Collapsible */}
          <Collapsible open={vatOpen} onOpenChange={setVatOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">VAT (Value Added Tax)</h4>
                  <p className="text-sm text-muted-foreground">7.5% tax on goods and services</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {calculatedVat.isVatLiable ? (
                  <Badge variant="destructive">VAT Liable</Badge>
                ) : (
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">Below Threshold</Badge>
                )}
                <ChevronDown className={`h-5 w-5 transition-transform ${vatOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* VAT Settings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Business Type</Label>
                  <p className="font-medium flex items-center gap-2">
                    {businessVatSettings.vat_business_type === 'product' ? (
                      <><Package className="h-4 w-4" /> Products</>
                    ) : businessVatSettings.vat_business_type === 'service' ? (
                      <><Wrench className="h-4 w-4" /> Services</>
                    ) : (
                      <span className="text-orange-500">Not set - <Button variant="link" className="h-auto p-0" onClick={() => navigate('/business/settings')}>Configure</Button></span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="font-medium">
                    {businessVatSettings.vat_product_category || businessVatSettings.vat_service_category || 
                      <span className="text-orange-500">Not set</span>
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Registered</Label>
                  <p className="font-medium">
                    {businessVatSettings.is_vat_registered ? (
                      <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Yes ({businessVatSettings.vat_number})</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Annual Revenue</Label>
                  <p className="font-medium">{formatCurrency(calculatedVat.annualRevenue)}</p>
                </div>
              </div>

              {/* VAT Threshold Status */}
              <div className={`p-4 rounded-lg border ${calculatedVat.isVatLiable ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                <div className="flex items-start gap-3">
                  {calculatedVat.isVatLiable ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  <div>
                    <h5 className={`font-semibold ${calculatedVat.isVatLiable ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'}`}>
                      {calculatedVat.isVatLiable ? 'VAT Registration Required' : 'Below VAT Threshold'}
                    </h5>
                    <p className={`text-sm ${calculatedVat.isVatLiable ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                      {calculatedVat.isVatLiable 
                        ? `Your annual revenue of ${formatCurrency(calculatedVat.annualRevenue)} exceeds the ₦25,000,000 threshold. You must register for VAT and charge 7.5% on all taxable supplies.`
                        : `Your annual revenue of ${formatCurrency(calculatedVat.annualRevenue)} is below the ₦25,000,000 threshold. VAT registration is optional but may be beneficial.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-calculated VAT (if liable) */}
              {calculatedVat.isVatLiable && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Monthly VAT Due</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(calculatedVat.monthlyVatDue)}</p>
                      <p className="text-xs text-muted-foreground">Due by 21st monthly</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Annual VAT Due</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(calculatedVat.annualVatDue)}</p>
                      <p className="text-xs text-muted-foreground">Based on 7.5% rate</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">VAT Rate</p>
                      <p className="text-xl font-bold text-blue-600">7.5%</p>
                      <p className="text-xs text-muted-foreground">Standard rate</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* VAT Example Calculation */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">VAT Pricing Example</h5>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• Product Price: <strong>₦500.00</strong></p>
                  <p>• VAT (7.5%): <strong>₦37.50</strong></p>
                  <p>• Subtotal: <strong>₦537.50</strong></p>
                  <p>• Transaction Fee (online): <strong>₦50.00</strong></p>
                  <p>• Final Total: <strong>₦587.50</strong></p>
                </div>
              </div>

              {/* Pay VAT Button */}
              {calculatedVat.isVatLiable && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => window.open('https://taxpromax.firs.gov.ng/', '_blank')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay VAT to FIRS
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Tabs Section in Bordered Container */}
      <Card className="p-5 md:p-8 mt-4">
        <Tabs defaultValue="compliance" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full mb-4">
            <TabsTrigger value="compliance" className="text-xs md:text-sm">Compliance</TabsTrigger>
            <TabsTrigger value="vat" className="text-xs md:text-sm">VAT Tax</TabsTrigger>
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

        {/* VAT Tax Tab */}
        <TabsContent value="vat" className="space-y-4">
          {/* VAT Overview Card */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Value Added Tax (VAT) - Nigeria
              </CardTitle>
              <CardDescription>
                VAT is a 7.5% consumption tax on goods and services. Businesses with annual turnover above ₦100 million must register and remit VAT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* VAT Threshold Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm text-muted-foreground">VAT Registration Threshold</p>
                  <p className="text-2xl font-bold text-blue-600">₦100,000,000</p>
                  <p className="text-xs text-muted-foreground">Annual Turnover</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm text-muted-foreground">VAT Rate</p>
                  <p className="text-2xl font-bold text-green-600">7.5%</p>
                  <p className="text-xs text-muted-foreground">Standard Rate</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Filing Deadline</p>
                  <p className="text-2xl font-bold text-orange-600">21st</p>
                  <p className="text-xs text-muted-foreground">Of each month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VAT Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                VAT Calculator
              </CardTitle>
              <CardDescription>Calculate VAT on your sales or determine VAT-inclusive prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add VAT to Amount */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Add VAT to Amount</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Amount (excl. VAT)</Label>
                      <Input
                        type="text"
                        placeholder="Enter amount"
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                          const vat = amount * VAT_RATE;
                          const total = amount + vat;
                          setVatTracker(prev => ({
                            ...prev,
                            vatCollected: vat,
                            annualTurnover: total
                          }));
                        }}
                      />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                      <p className="text-sm">VAT (7.5%): <span className="font-bold">{formatCurrency(vatTracker.vatCollected)}</span></p>
                      <p className="text-sm">Total (incl. VAT): <span className="font-bold text-green-600">{formatCurrency(vatTracker.annualTurnover)}</span></p>
                    </div>
                  </div>
                </div>

                {/* Extract VAT from Amount */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Extract VAT from Total</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Amount (incl. VAT)</Label>
                      <Input
                        type="text"
                        placeholder="Enter VAT-inclusive amount"
                        onChange={(e) => {
                          const total = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                          const vat = total - (total / (1 + VAT_RATE));
                          const net = total - vat;
                          setVatTracker(prev => ({
                            ...prev,
                            vatPaid: vat,
                            annualTurnover: net, // Reuse for net display
                          }));
                        }}
                      />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                      <p className="text-sm">VAT Component: <span className="font-bold text-orange-600">{formatCurrency(vatTracker.vatPaid)}</span></p>
                      <p className="text-sm">Net Amount: <span className="font-bold">{formatCurrency(vatTracker.vatPaid > 0 ? vatTracker.vatPaid / VAT_RATE : 0)}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VAT Exempt vs Taxable Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VAT Exempt Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  VAT Exempt Categories
                </CardTitle>
                <CardDescription>These goods/services don't require VAT collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                {VAT_EXEMPT_CATEGORIES.map(cat => (
                  <div key={cat.value} className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* VAT Taxable Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  VAT Taxable Categories
                </CardTitle>
                <CardDescription>These businesses must charge and remit 7.5% VAT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                {VAT_TAXABLE_CATEGORIES.map(cat => (
                  <div key={cat.value} className="p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* VAT Requirements Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                VAT Requirements for Nigerian Businesses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Who Must Register for VAT?</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Businesses with annual turnover ≥ <strong>₦100 million</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>New businesses expecting to reach threshold within a year</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Businesses selling VAT-taxable goods or services</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Key VAT Obligations</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>Charge 7.5% VAT on all taxable sales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>Issue VAT invoices for all transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>File monthly VAT returns by the 21st</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Landmark className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>Remit collected VAT to FIRS monthly</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-800 dark:text-amber-200">Important Note</h5>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Even if your annual turnover is below ₦100 million, you may still need to collect VAT if you sell 
                      taxable goods/services. Businesses below the threshold are exempt from VAT registration but should 
                      monitor their turnover. Non-compliance can result in penalties up to 5% of unpaid VAT plus interest.
                    </p>
                  </div>
                </div>
              </div>

              {/* FIRS VAT Registration Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  onClick={() => window.open('https://taxpromax.firs.gov.ng/', '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Register for VAT on FIRS TaxProMax
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://firs.gov.ng/vat-guide', '_blank')}
                >
                  <Info className="w-4 h-4 mr-2" />
                  VAT Guide
                </Button>
              </div>
            </CardContent>
          </Card>
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
          {/* State Selection - Required for PAYE Payment */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                Select Your State of Residence
              </CardTitle>
              <CardDescription>
                PAYE (Income Tax) is paid to your STATE Internal Revenue Service (SIRS), NOT to FIRS. 
                Select your state to see where to pay.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select your state..." />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map(state => (
                    <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedState && STATE_IRS_PORTALS[selectedState] && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800">{STATE_IRS_PORTALS[selectedState].name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is where you pay your PAYE (Income Tax). NOT FIRS!
                  </p>
                  <Button 
                    className="mt-3" 
                    onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Go to {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} IRS Portal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Owner Salary Section */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Business Owner Salary & PAYE
              </CardTitle>
              <CardDescription>
                As a business owner, enter your monthly/annual salary to calculate your PAYE. 
                This helps you know exactly how much tax to remit to your State IRS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your Annual Gross Salary (₦)</Label>
                <Input
                  type="text"
                  placeholder="e.g., 6,000,000"
                  value={businessOwnerSalary}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setBusinessOwnerSalary(value ? parseInt(value).toLocaleString() : '');
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is the salary you pay yourself from the business
                </p>
              </div>
              <Button 
                onClick={() => {
                  const income = parseFloat(businessOwnerSalary.replace(/,/g, '')) || 0;
                  if (income > 0) {
                    setBusinessOwnerResult(calculatePAYE(income));
                  }
                }} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Calculate My PAYE
              </Button>

              {businessOwnerResult && (
                <div className="mt-4 p-4 bg-white rounded-lg border space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Your Annual Gross Salary</span>
                    <span className="font-semibold">{formatCurrency(businessOwnerResult.grossPay)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>Less: Pension (8%)</span>
                    <span>-{formatCurrency(businessOwnerResult.pension)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>Less: NHF (2.5%)</span>
                    <span>-{formatCurrency(businessOwnerResult.nhf)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Taxable Income</span>
                    <span className="font-semibold">{formatCurrency(businessOwnerResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-green-100 p-3 rounded-lg">
                    <span className="font-semibold">Your Annual PAYE</span>
                    <span className="font-bold text-lg text-green-700">{formatCurrency(businessOwnerResult.paye)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 p-3 rounded-lg">
                    <span>Monthly PAYE to Remit</span>
                    <span className="font-semibold">{formatCurrency(businessOwnerResult.paye / 12)}</span>
                  </div>

                  {/* Pay Button - Goes to State IRS */}
                  {selectedState && STATE_IRS_PORTALS[selectedState] ? (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Pay your PAYE to: <strong>{STATE_IRS_PORTALS[selectedState].name}</strong>
                      </p>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                      >
                        <Landmark className="w-4 h-4 mr-2" />
                        Pay via {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} State IRS
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Please select your state above to see where to pay PAYE
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General PAYE Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Staff PAYE Calculator (2025 Tax Act)
                </CardTitle>
                <CardDescription>Calculate Pay-As-You-Earn tax for any salary</CardDescription>
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
                  
                  {/* Pay Button - Goes to State IRS */}
                  {selectedState && STATE_IRS_PORTALS[selectedState] ? (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Pay PAYE to: <strong>{STATE_IRS_PORTALS[selectedState].name}</strong>
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                      >
                        <Landmark className="w-4 h-4 mr-2" />
                        Pay via {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} State IRS
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Select your state above to see where to pay PAYE
                      </p>
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
          {/* PAYE Payment - State IRS */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Landmark className="w-5 h-5" />
                PAYE Payment (State Internal Revenue Service)
              </CardTitle>
              <CardDescription>
                <strong className="text-green-700">PAYE (Income Tax) is paid to your STATE Internal Revenue Service, NOT FIRS!</strong>
                <br />Select your state to see the correct payment portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4">
                <Label>Select Your State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select your state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(state => (
                      <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedState && STATE_IRS_PORTALS[selectedState] && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Landmark className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">{STATE_IRS_PORTALS[selectedState].name}</h4>
                        <p className="text-sm text-green-700 mb-2">This is where you pay PAYE (Income Tax)</p>
                        <Badge className="bg-green-600 mb-3">PAYE</Badge>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(STATE_IRS_PORTALS[selectedState].url, '_blank')}
                        >
                          Pay via {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} State IRS <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!selectedState && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Please select your state above to see where to pay PAYE
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">SIRS Payment Guide</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• PAYE is due by the 10th of each month</li>
                      <li>• File your monthly PAYE returns with your State IRS</li>
                      <li>• Keep receipts for Tax Clearance Certificate (TCC)</li>
                      <li>• Staff can also pay their own PAYE through the same portal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Federal Taxes - FIRS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Federal Taxes (FIRS) & Other Payments
              </CardTitle>
              <CardDescription>
                Company Income Tax (CIT), VAT, WHT go to FIRS. Pension, NHF, ITF have separate portals.
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
