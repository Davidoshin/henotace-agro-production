import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPut } from '@/lib/api';
import { 
  ArrowLeft, DollarSign, Receipt, Percent, Building2, 
  Copy, ExternalLink, FileText, AlertCircle, CheckCircle,
  Wallet, Home, Calculator, Plus, Edit, Landmark, ChevronDown,
  TrendingUp, ShieldCheck, Users, Clock, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// State Internal Revenue Services (SIRS) - for PAYE payments
// IMPORTANT: PAYE is paid to the STATE IRS, NOT FIRS!
const STATE_IRS_PORTALS: Record<string, { name: string; url: string }> = {
  abia: { name: 'Abia State Internal Revenue Service', url: 'https://absirs.gov.ng/' },
  adamawa: { name: 'Adamawa State Internal Revenue Service', url: 'https://adsirs.gov.ng/' },
  akwa_ibom: { name: 'Akwa Ibom State Internal Revenue Service', url: 'https://akirs.gov.ng/' },
  anambra: { name: 'Anambra State Internal Revenue Service', url: 'https://airs.an.gov.ng/' },
  bauchi: { name: 'Bauchi State Internal Revenue Service', url: 'https://bsirs.gov.ng/' },
  bayelsa: { name: 'Bayelsa State Internal Revenue Service', url: 'https://bysirs.gov.ng/' },
  benue: { name: 'Benue State Internal Revenue Service', url: 'https://bsirs.gov.ng/' },
  borno: { name: 'Borno State Internal Revenue Service', url: 'https://bosirs.gov.ng/' },
  cross_river: { name: 'Cross River State Internal Revenue Service', url: 'https://crirs.gov.ng/' },
  delta: { name: 'Delta State Internal Revenue Service', url: 'https://deltairs.gov.ng/' },
  ebonyi: { name: 'Ebonyi State Internal Revenue Service', url: 'https://ebsirs.gov.ng/' },
  edo: { name: 'Edo State Internal Revenue Service', url: 'https://eirs.gov.ng/' },
  ekiti: { name: 'Ekiti State Internal Revenue Service', url: 'https://eksirs.gov.ng/' },
  enugu: { name: 'Enugu State Internal Revenue Service', url: 'https://esirs.gov.ng/' },
  fct: { name: 'FCT Internal Revenue Service', url: 'https://fctirs.gov.ng/' },
  gombe: { name: 'Gombe State Internal Revenue Service', url: 'https://gosirs.gov.ng/' },
  imo: { name: 'Imo State Internal Revenue Service', url: 'https://irsimo.gov.ng/' },
  jigawa: { name: 'Jigawa State Internal Revenue Service', url: 'https://jgsirs.gov.ng/' },
  kaduna: { name: 'Kaduna State Internal Revenue Service', url: 'https://kadirs.kdsg.gov.ng/' },
  kano: { name: 'Kano State Internal Revenue Service', url: 'https://kirs.gov.ng/' },
  katsina: { name: 'Katsina State Internal Revenue Service', url: 'https://ktsirs.gov.ng/' },
  kebbi: { name: 'Kebbi State Internal Revenue Service', url: 'https://kebsirs.gov.ng/' },
  kogi: { name: 'Kogi State Internal Revenue Service', url: 'https://kgirs.gov.ng/' },
  kwara: { name: 'Kwara State Internal Revenue Service', url: 'https://kwirs.gov.ng/' },
  lagos: { name: 'Lagos State Internal Revenue Service (LIRS)', url: 'https://etax.lirs.net/' },
  nasarawa: { name: 'Nasarawa State Internal Revenue Service', url: 'https://nsirs.gov.ng/' },
  niger: { name: 'Niger State Internal Revenue Service', url: 'https://nigsirs.gov.ng/' },
  ogun: { name: 'Ogun State Internal Revenue Service', url: 'https://ogirs.gov.ng/' },
  ondo: { name: 'Ondo State Internal Revenue Service', url: 'https://odirs.gov.ng/' },
  osun: { name: 'Osun State Internal Revenue Service', url: 'https://osirs.gov.ng/' },
  oyo: { name: 'Oyo State Internal Revenue Service', url: 'https://oyostatebir.com/' },
  plateau: { name: 'Plateau State Internal Revenue Service', url: 'https://psirs.gov.ng/' },
  rivers: { name: 'Rivers State Internal Revenue Service', url: 'https://rirs.gov.ng/' },
  sokoto: { name: 'Sokoto State Internal Revenue Service', url: 'https://sksirs.gov.ng/' },
  taraba: { name: 'Taraba State Internal Revenue Service', url: 'https://trsirs.gov.ng/' },
  yobe: { name: 'Yobe State Internal Revenue Service', url: 'https://ybsirs.gov.ng/' },
  zamfara: { name: 'Zamfara State Internal Revenue Service', url: 'https://zmsirs.gov.ng/' },
};

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

// Nigeria Tax Act 2025 brackets
const TAX_BRACKETS_2025 = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 2400000, rate: 0.07 },
  { min: 2400000, max: 4000000, rate: 0.11 },
  { min: 4000000, max: 6400000, rate: 0.15 },
  { min: 6400000, max: 12000000, rate: 0.19 },
  { min: 12000000, max: Infinity, rate: 0.25 },
];

// Calculate personal income tax based on Nigeria Tax Act 2025
function calculatePersonalTax(annualIncome: number): { 
  taxPayable: number; 
  effectiveRate: number; 
  breakdown: { bracket: string; tax: number; min: number; max: number; rate: number }[] 
} {
  let remainingIncome = annualIncome;
  let totalTax = 0;
  const breakdown: { bracket: string; tax: number; min: number; max: number; rate: number }[] = [];

  for (const bracket of TAX_BRACKETS_2025) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    const taxInBracket = taxableInBracket * bracket.rate;
    totalTax += taxInBracket;

    const naira = '₦';
    const inf = '∞';
    const maxLabel = bracket.max === Infinity ? inf : naira + bracket.max.toLocaleString();
    const bracketLabel = naira + bracket.min.toLocaleString() + ' - ' + maxLabel;
    
    breakdown.push({
      bracket: bracketLabel,
      tax: taxInBracket,
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
    });

    remainingIncome -= taxableInBracket;
  }

  const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return { taxPayable: totalTax, effectiveRate, breakdown };
}

// Calculate PAYE for an employee (2026 Tax Act - CRA REMOVED)
function calculatePAYE(annualSalary: number, deductions: {
  rentRelief?: number;
  pensionContribution?: number;
  nhfContribution?: number;
  nhisContribution?: number;
  lifeInsurancePremium?: number;
  homeLoanInterest?: number;
  customDeductions?: number;
} = {}): { 
  grossPay: number;
  nhf: number;
  pension: number;
  pensionEmployer: number;
  taxableIncome: number;
  paye: number;
  totalDeductions: number;
} {
  // NHF: 2.5% of basic salary (default if not provided)
  const nhf = deductions.nhfContribution ?? (annualSalary * 0.025);
  
  // Pension: 8% employee contribution + 10% employer contribution
  const pension = deductions.pensionContribution ?? (annualSalary * 0.08);
  const pensionEmployer = annualSalary * 0.10;
  
  // 2026 Tax Act - Allowable Deductions (CRA REMOVED)
  // Calculate rent relief (20% of rent, max ₦500,000)
  const rentRelief = deductions.rentRelief ?? 0;
  const nhisContribution = deductions.nhisContribution ?? 0;
  const lifeInsurancePremium = deductions.lifeInsurancePremium ?? 0;
  const homeLoanInterest = deductions.homeLoanInterest ?? 0;
  const customDeductions = deductions.customDeductions ?? 0;
  
  // Total allowable deductions
  const totalDeductions = rentRelief + pension + nhf + nhisContribution + 
    lifeInsurancePremium + homeLoanInterest + customDeductions;
  
  // Taxable income after deductions (NO CRA - REMOVED IN 2026)
  const taxableIncome = Math.max(0, annualSalary - totalDeductions);
  
  // Calculate tax on taxable income
  const { taxPayable } = calculatePersonalTax(taxableIncome);
  
  return {
    grossPay: annualSalary,
    nhf,
    pension,
    pensionEmployer,
    taxableIncome,
    paye: taxPayable,
    totalDeductions,
  };
}

// Business Expense Categories
interface BusinessExpenses {
  officeRent: string;
  utilities: string;
  professionalFees: string;
  equipment: string;
  supplies: string;
  marketing: string;
  travel: string;
  salaries: string;
  insurance: string;
  otherExpenses: string;
}

// Calculate Business Owner's Personal Income Tax (Direct Assessment)
// Business owners pay tax on their business PROFIT, not salary
function calculateBusinessOwnerPIT(
  businessRevenue: number,
  businessExpenses: BusinessExpenses,
  customExpenses: { name: string; amount: number }[],
  personalDeductions: {
    rentRelief?: number;
    pensionContribution?: number;
    nhfContribution?: number;
    nhisContribution?: number;
    lifeInsurancePremium?: number;
    homeLoanInterest?: number;
    customDeductions?: number;
  } = {}
): {
  grossRevenue: number;
  totalExpenses: number;
  taxableProfit: number;
  personalDeductionsTotal: number;
  taxableIncome: number;
  annualTax: number;
  effectiveRate: number;
  breakdown: { bracket: string; tax: number; min: number; max: number; rate: number }[];
} {
  // Calculate total business expenses
  const expenseValues = Object.values(businessExpenses).map(v => parseFloat(v) || 0);
  const baseExpenses = expenseValues.reduce((sum, val) => sum + val, 0);
  const customExpenseTotal = customExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = baseExpenses + customExpenseTotal;
  
  // Taxable Profit = Revenue - Business Expenses
  const taxableProfit = Math.max(0, businessRevenue - totalExpenses);
  
  // Personal allowable deductions (2026 Tax Act)
  const rentRelief = personalDeductions.rentRelief ?? 0;
  const pension = personalDeductions.pensionContribution ?? 0;
  const nhf = personalDeductions.nhfContribution ?? 0;
  const nhis = personalDeductions.nhisContribution ?? 0;
  const lifeInsurance = personalDeductions.lifeInsurancePremium ?? 0;
  const homeLoan = personalDeductions.homeLoanInterest ?? 0;
  const customDed = personalDeductions.customDeductions ?? 0;
  
  const personalDeductionsTotal = rentRelief + pension + nhf + nhis + lifeInsurance + homeLoan + customDed;
  
  // Final taxable income after personal deductions
  const taxableIncome = Math.max(0, taxableProfit - personalDeductionsTotal);
  
  // Calculate tax using Nigeria Tax Act 2025 brackets
  const { taxPayable, effectiveRate, breakdown } = calculatePersonalTax(taxableIncome);
  
  return {
    grossRevenue: businessRevenue,
    totalExpenses,
    taxableProfit,
    personalDeductionsTotal,
    taxableIncome,
    annualTax: taxPayable,
    effectiveRate,
    breakdown,
  };
}

// API Response Interface - Updated for 2026 Tax Act
interface StaffTaxData {
  tax_year?: number;
  tax_act_info?: string;
  staff: {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    position: string;
    department: string;
  };
  salary: {
    monthly: number;
    annual: number;
  };
  accommodation: {
    annual_rent_paid: number;
    rent_relief: number;
    max_relief: number;
  };
  tax: {
    taxable_income: number;
    annual_paye: number;
    monthly_paye: number;
    effective_rate: number;
  };
  // New 2026 Tax Act allowable deductions (replaces CRA)
  allowable_deductions?: {
    rent_relief: number;
    pension_contribution: number;
    nhf_contribution: number;
    nhis_contribution: number;
    life_insurance_premium: number;
    home_loan_interest: number;
    custom_deductions: number;
    total_deductions: number;
  };
  // Statutory deductions (still required)
  statutory_deductions?: {
    nhf_annual: number;
    nhf_monthly: number;
    pension_employee_annual: number;
    pension_employer_annual: number;
    pension_total: number;
  };
  // Legacy support
  deductions?: {
    nhf_annual: number;
    nhf_monthly: number;
    pension_employee_annual: number;
    pension_employer_annual: number;
    pension_total: number;
    cra?: number; // REMOVED in 2026 - kept for backward compatibility
  };
  net_pay: {
    annual: number;
    monthly: number;
  };
}

// Custom deduction item interface
interface CustomDeduction {
  id: string;
  name: string;
  amount: number;
}

export default function StaffTaxInformation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [taxData, setTaxData] = useState<StaffTaxData | null>(null);
  const [accommodationDialogOpen, setAccommodationDialogOpen] = useState(false);
  const [rentInput, setRentInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedState, setSelectedState] = useState('lagos');
  
  // Deductions dialog state
  const [deductionsDialogOpen, setDeductionsDialogOpen] = useState(false);
  const [deductionInputs, setDeductionInputs] = useState({
    annualRentPaid: '',
    nhisContribution: '',
    lifeInsurancePremium: '',
    homeLoanInterest: '',
  });
  const [customDeductions, setCustomDeductions] = useState<CustomDeduction[]>([]);
  const [newCustomDeduction, setNewCustomDeduction] = useState({ name: '', amount: '' });
  
  // Business owner income/expense state (for Personal Income Tax - Direct Assessment)
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [useAppRevenue, setUseAppRevenue] = useState(true);
  const [manualBusinessIncome, setManualBusinessIncome] = useState('');
  const [businessExpenses, setBusinessExpenses] = useState({
    officeRent: '',
    utilities: '',
    professionalFees: '',
    equipment: '',
    supplies: '',
    marketing: '',
    travel: '',
    salaries: '', // Salaries paid to employees
    insurance: '',
    otherExpenses: '',
  });
  const [customBusinessExpenses, setCustomBusinessExpenses] = useState<CustomDeduction[]>([]);
  const [newCustomExpense, setNewCustomExpense] = useState({ name: '', amount: '' });
  
  // Collapsible states for business owner view
  const [personalIncomeTaxOpen, setPersonalIncomeTaxOpen] = useState(true);
  const [vatOpen, setVatOpen] = useState(false);
  const [payeOpen, setPayeOpen] = useState(false); // For staff PAYE
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [businessData, setBusinessData] = useState<{
    owner_annual_salary?: number;
    total_revenue?: number;
    total_vat_collected?: number;
    vat_breakdown?: {
      product_vat?: number;
      service_invoice_vat?: number;
    };
    annual_sales?: number;
    state_of_residence?: string;
    vat_business_type?: string;
    is_vat_registered?: boolean;
    vat_number?: string;
  } | null>(null);
  
  // Staff PAYE summary data
  const [staffPayeData, setStaffPayeData] = useState<{
    total_staff: number;
    total_annual_paye: number;
    total_monthly_paye: number;
    total_annual_pension?: number;
    total_annual_nhf?: number;
    exemption_threshold?: number;
    staff_breakdown: Array<{
      name: string;
      position?: string;
      department?: string;
      annual_salary: number;
      monthly_salary?: number;
      monthly_paye: number;
      annual_paye: number;
      effective_rate?: number;
      is_exempt?: boolean;
      exemption_reason?: string;
      mandatory_deductions?: {
        pension_contribution: number;
        nhf_contribution: number;
        nhis_contribution: number;
        total: number;
      };
      net_monthly_salary?: number;
      net_annual_salary?: number;
      needs_salary_setup?: boolean;
    }>;
  } | null>(null);
  
  // VAT constants
  const VAT_RATE = 0.075; // 7.5%
  const VAT_THRESHOLD = 100000000; // ₦100 million

  const fetchTaxData = async () => {
    try {
      setIsLoading(true);
      
      // First check if user is business owner
      try {
        const businessResponse = await apiGet('business/update/');
        if (businessResponse && businessResponse.success && businessResponse.business) {
          setIsBusinessOwner(true);
          
          let totalRevenue = 0;
          let totalVatCollected = 0;
          let vatBreakdown = { product_vat: 0, service_invoice_vat: 0 };
          
          // Fetch business revenue from dedicated tax revenue endpoint
          try {
            const revenueResponse = await apiGet('business/tax/revenue/');
            if (revenueResponse && revenueResponse.success && revenueResponse.data) {
              totalRevenue = parseFloat(revenueResponse.data.total_revenue) || 0;
              totalVatCollected = parseFloat(revenueResponse.data.total_vat_collected) || 0;
              if (revenueResponse.data.breakdown) {
                vatBreakdown = {
                  product_vat: parseFloat(revenueResponse.data.breakdown.product_vat) || 0,
                  service_invoice_vat: parseFloat(revenueResponse.data.breakdown.service_invoice_vat) || 0,
                };
              }
            }
          } catch (err) {
            console.log('Business revenue not available:', err);
          }
          
          setBusinessData({
            owner_annual_salary: parseFloat(businessResponse.business.owner_annual_salary) || 0,
            total_revenue: totalRevenue,
            total_vat_collected: totalVatCollected,
            vat_breakdown: vatBreakdown,
            state_of_residence: businessResponse.business.state_of_residence,
            vat_business_type: businessResponse.business.vat_business_type,
            is_vat_registered: businessResponse.business.is_vat_registered,
            vat_number: businessResponse.business.vat_number,
          });
          
          if (businessResponse.business.state_of_residence) {
            const stateKey = businessResponse.business.state_of_residence.toLowerCase().replace(/ /g, '_');
            if (STATE_IRS_PORTALS[stateKey]) {
              setSelectedState(stateKey);
            }
          }
          
          // Fetch staff PAYE summary for business owner
          try {
            const staffPayeResponse = await apiGet('business/tax/staff-paye-summary/');
            if (staffPayeResponse && staffPayeResponse.success) {
              setStaffPayeData(staffPayeResponse.data);
            }
          } catch (err) {
            console.log('Staff PAYE summary not available:', err);
            // Staff PAYE data not available - set empty data
            setStaffPayeData({
              total_staff: 0,
              total_annual_paye: 0,
              total_monthly_paye: 0,
              staff_breakdown: [],
            });
          }
        }
      } catch {
        // Not a business owner, continue as staff
        setIsBusinessOwner(false);
      }
      
      // Fetch live tax data from API
      const data = await apiGet('business/staff/my-tax/');
      if (data && data.success) {
        setTaxData(data);
        setRentInput(data.accommodation?.annual_rent_paid?.toString() || '0');
        // Set state from business if available
        if (data.business?.state_of_residence) {
          const stateKey = data.business.state_of_residence.toLowerCase().replace(/ /g, '_');
          if (STATE_IRS_PORTALS[stateKey]) {
            setSelectedState(stateKey);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load tax data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your tax information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, []);

  const handleUpdateAccommodation = async () => {
    try {
      setIsUpdating(true);
      const response = await apiPut('business/staff/my-tax/accommodation/', {
        annual_rent_paid: parseFloat(rentInput) || 0
      });
      
      if (response && response.success) {
        toast({
          title: 'Success',
          description: 'Accommodation details updated. Your tax relief has been recalculated.',
        });
        setAccommodationDialogOpen(false);
        // Refresh tax data
        fetchTaxData();
      }
    } catch (error) {
      console.error('Failed to update accommodation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update accommodation details',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add custom deduction
  const addCustomDeduction = () => {
    if (!newCustomDeduction.name.trim() || !newCustomDeduction.amount) return;
    const newItem: CustomDeduction = {
      id: Date.now().toString(),
      name: newCustomDeduction.name.trim(),
      amount: parseFloat(newCustomDeduction.amount) || 0,
    };
    setCustomDeductions([...customDeductions, newItem]);
    setNewCustomDeduction({ name: '', amount: '' });
  };

  // Remove custom deduction
  const removeCustomDeduction = (id: string) => {
    setCustomDeductions(customDeductions.filter(d => d.id !== id));
  };

  // Calculate total custom deductions
  const totalCustomDeductions = useMemo(() => {
    return customDeductions.reduce((sum, d) => sum + d.amount, 0);
  }, [customDeductions]);

  // Calculate tax bracket breakdown for display (using local calc for bracket visualization)
  const taxBreakdown = useMemo(() => {
    if (!taxData) return [];
    return calculatePersonalTax(taxData.tax.taxable_income).breakdown;
  }, [taxData]);

  // Calculate owner's PAYE if business owner - MUST be before any conditional returns
  // Updated for 2026 Tax Act (CRA REMOVED)
  const ownerPAYE = useMemo(() => {
    if (!isBusinessOwner || !businessData?.owner_annual_salary) return null;
    
    const annualSalary = businessData.owner_annual_salary;
    
    // Calculate rent relief (20% of rent, max ₦500,000)
    const rentPaid = parseFloat(deductionInputs.annualRentPaid) || 0;
    const rentRelief = Math.min(rentPaid * 0.20, 500000);
    
    // Use user-provided deduction values
    const userDeductions = {
      rentRelief,
      pensionContribution: annualSalary * 0.08,
      nhfContribution: annualSalary * 0.025,
      nhisContribution: parseFloat(deductionInputs.nhisContribution) || 0,
      lifeInsurancePremium: parseFloat(deductionInputs.lifeInsurancePremium) || 0,
      homeLoanInterest: parseFloat(deductionInputs.homeLoanInterest) || 0,
      customDeductions: totalCustomDeductions,
    };
    return calculatePAYE(annualSalary, userDeductions);
  }, [isBusinessOwner, businessData?.owner_annual_salary, deductionInputs, totalCustomDeductions]);

  // Calculate VAT liability - MUST be before any conditional returns
  const vatCalculation = useMemo(() => {
    if (!isBusinessOwner || !businessData) return null;
    // Use total_revenue from business data for VAT calculation
    const annualSales = businessData.total_revenue || 0;
    const isAboveThreshold = annualSales >= VAT_THRESHOLD;
    const estimatedVAT = annualSales * VAT_RATE;
    return {
      annualSales,
      isAboveThreshold,
      estimatedVAT,
      monthlyVAT: estimatedVAT / 12,
    };
  }, [isBusinessOwner, businessData]);

  // Add custom business expense
  const addCustomBusinessExpense = () => {
    if (!newCustomExpense.name.trim() || !newCustomExpense.amount) return;
    const newItem: CustomDeduction = {
      id: Date.now().toString(),
      name: newCustomExpense.name.trim(),
      amount: parseFloat(newCustomExpense.amount) || 0,
    };
    setCustomBusinessExpenses([...customBusinessExpenses, newItem]);
    setNewCustomExpense({ name: '', amount: '' });
  };

  // Remove custom business expense
  const removeCustomBusinessExpense = (id: string) => {
    setCustomBusinessExpenses(customBusinessExpenses.filter(e => e.id !== id));
  };

  // Calculate Business Owner Personal Income Tax (Direct Assessment)
  const businessOwnerPIT = useMemo(() => {
    if (!isBusinessOwner || !businessData) return null;
    
    // Get business revenue - either from app or manual input
    const businessRevenue = useAppRevenue 
      ? (businessData.total_revenue || 0) 
      : (parseFloat(manualBusinessIncome) || 0);
    
    if (businessRevenue <= 0) return null;
    
    // Calculate rent relief for personal deductions (20% of rent, max ₦500,000)
    const rentPaid = parseFloat(deductionInputs.annualRentPaid) || 0;
    const rentRelief = Math.min(rentPaid * 0.20, 500000);
    
    // Personal deductions
    const personalDeductions = {
      rentRelief,
      pensionContribution: 0, // Business owner can contribute voluntarily
      nhfContribution: 0, // NHF is optional for business owners
      nhisContribution: parseFloat(deductionInputs.nhisContribution) || 0,
      lifeInsurancePremium: parseFloat(deductionInputs.lifeInsurancePremium) || 0,
      homeLoanInterest: parseFloat(deductionInputs.homeLoanInterest) || 0,
      customDeductions: totalCustomDeductions,
    };
    
    return calculateBusinessOwnerPIT(
      businessRevenue,
      businessExpenses,
      customBusinessExpenses,
      personalDeductions
    );
  }, [isBusinessOwner, businessData, useAppRevenue, manualBusinessIncome, businessExpenses, customBusinessExpenses, deductionInputs, totalCustomDeductions]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Salary Information</h3>
            <p className="text-muted-foreground mb-4">
              Your salary information has not been set up yet.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                <strong>Business Owner?</strong> Set your annual salary in Business Settings → Tax Compliance Settings to see your PAYE calculations here.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/business/settings')}>
                Go to Business Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          My Tax Information
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isBusinessOwner 
            ? "View and manage your Personal Income Tax, VAT, and Staff PAYE obligations" 
            : `View your personal tax breakdown and deductions - ${taxData.staff.name}`}
        </p>
      </div>

      {/* Business Owner View - Three Collapsibles: Personal Income Tax, VAT, Staff PAYE */}
      {isBusinessOwner ? (
        <div className="space-y-4">
          {/* 1. PERSONAL INCOME TAX Collapsible (Direct Assessment for Business Owner) */}
          <Collapsible open={personalIncomeTaxOpen} onOpenChange={setPersonalIncomeTaxOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Personal Income Tax</h3>
                  <p className="text-sm text-muted-foreground">Direct Assessment - Tax on your business profit (Annual filing by March 31st)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {businessOwnerPIT && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    ₦{businessOwnerPIT.annualTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
                  </Badge>
                )}
                <ChevronDown className={`w-5 h-5 transition-transform ${personalIncomeTaxOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Business Income & Expenses Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Business Revenue</span>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      ₦{(useAppRevenue ? (businessData?.total_revenue || 0) : (parseFloat(manualBusinessIncome) || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {useAppRevenue ? 'From app revenue' : 'Manual input'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Business Expenses</span>
                      <Building2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-amber-600">
                      ₦{businessOwnerPIT?.totalExpenses.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Allowable business deductions
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxable Profit</span>
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-purple-600">
                      ₦{businessOwnerPIT?.taxableProfit.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Revenue - Expenses
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Annual Tax Due</span>
                      <Receipt className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-red-600">
                      ₦{businessOwnerPIT?.annualTax.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: March 31st, {new Date().getFullYear()} (for {new Date().getFullYear() - 1})
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Business Income/Expenses Dialog Button */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Configure Business Income & Expenses</h4>
                      <p className="text-sm text-muted-foreground">Set your revenue source and enter business expenses</p>
                    </div>
                    <Button onClick={() => setIncomeDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Income & Expenses
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Breakdown */}
              {businessOwnerPIT && businessOwnerPIT.annualTax > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      <CardTitle>Tax Breakdown (Nigeria Tax Act 2025)</CardTitle>
                    </div>
                    <CardDescription>
                      Tax calculated on taxable income of ₦{businessOwnerPIT.taxableIncome.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {businessOwnerPIT.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{item.bracket}</span>
                              <span className="text-sm text-muted-foreground">Rate: {(item.rate * 100).toFixed(0)}%</span>
                            </div>
                            <Progress 
                              value={item.tax > 0 && businessOwnerPIT.annualTax > 0 ? (item.tax / businessOwnerPIT.annualTax) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          <div className="ml-4 text-right min-w-[100px]">
                            <span className="font-semibold text-red-600">
                              ₦{item.tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex items-center justify-between pt-3 border-t-2 border-primary/20">
                        <div>
                          <span className="font-semibold">Total Annual Tax</span>
                          <p className="text-xs text-muted-foreground">
                            Effective rate: {businessOwnerPIT.effectiveRate.toFixed(2)}%
                          </p>
                        </div>
                        <span className="text-xl font-bold text-red-600">
                          ₦{businessOwnerPIT.annualTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Allowable Deductions Summary */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle>Personal Allowable Deductions</CardTitle>
                        <CardDescription>
                          These reduce your taxable income after business expenses
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeductionsDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Deductions
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Rent Relief */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-muted-foreground">Rent Relief</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        ₦{(Math.min((parseFloat(deductionInputs.annualRentPaid) || 0) * 0.20, 500000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">20% of rent (max ₦500K)</p>
                    </div>
                    
                    {/* NHIS */}
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-teal-600" />
                        <p className="text-sm text-muted-foreground">NHIS</p>
                      </div>
                      <p className="text-lg font-bold text-teal-600">
                        ₦{(parseFloat(deductionInputs.nhisContribution) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Health Insurance</p>
                    </div>
                    
                    {/* Life Insurance */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        <p className="text-sm text-muted-foreground">Life Insurance</p>
                      </div>
                      <p className="text-lg font-bold text-indigo-600">
                        ₦{(parseFloat(deductionInputs.lifeInsurancePremium) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Annual premium</p>
                    </div>
                    
                    {/* Home Loan Interest */}
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Landmark className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-muted-foreground">Home Loan Interest</p>
                      </div>
                      <p className="text-lg font-bold text-orange-600">
                        ₦{(parseFloat(deductionInputs.homeLoanInterest) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Owner-occupied</p>
                    </div>
                    
                    {/* Custom Deductions */}
                    {totalCustomDeductions > 0 && (
                      <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Plus className="h-4 w-4 text-pink-600" />
                          <p className="text-sm text-muted-foreground">Other Deductions</p>
                        </div>
                        <p className="text-lg font-bold text-pink-600">
                          ₦{totalCustomDeductions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground">{customDeductions.length} item(s)</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Total Deductions */}
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Personal Deductions</span>
                      <span className="text-xl font-bold text-primary">
                        ₦{businessOwnerPIT?.personalDeductionsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pay to State IRS */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-700">Pay Personal Income Tax</CardTitle>
                  </div>
                  <CardDescription>
                    Direct Assessment is paid to your <strong>State Internal Revenue Service</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Label className="text-sm font-medium mb-2 block">Select Your State of Residence</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Pay to: <strong>{STATE_IRS_PORTALS[selectedState]?.name}</strong>
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-700">Filing Deadline</span>
                    </div>
                    <p className="text-lg font-bold text-amber-700">March 31st, {new Date().getFullYear()}</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Annual filing for {new Date().getFullYear() - 1} Direct Assessment
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => window.open(STATE_IRS_PORTALS[selectedState]?.url, '_blank')}
                    >
                      <Landmark className="h-4 w-4 mr-2" />
                      Pay via {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} State IRS
                    </Button>
                    <Button variant="outline" onClick={() => window.open(STATE_IRS_PORTALS[selectedState]?.url, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit State IRS Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* No Revenue Configured */}
              {!businessOwnerPIT && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Revenue Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your business revenue and expenses to calculate your Personal Income Tax.
                    </p>
                    <Button onClick={() => setIncomeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Business Income
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* 2. VAT Collapsible */}
          <Collapsible open={vatOpen} onOpenChange={setVatOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">VAT (Value Added Tax)</h3>
                  <p className="text-sm text-muted-foreground">7.5% tax on goods and services - collected by FIRS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {vatCalculation?.isAboveThreshold && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Registration Required
                  </Badge>
                )}
                <ChevronDown className={`w-5 h-5 transition-transform ${vatOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* VAT Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">VAT Rate</span>
                      <Percent className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">7.5%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nigeria VAT Rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Registration Threshold</span>
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">₦100M</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Annual turnover threshold
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Your Status</span>
                      <ShieldCheck className="h-5 w-5 text-purple-600" />
                    </div>
                    {businessData?.is_vat_registered ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">Registered</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          TIN: {businessData.vat_number || 'Not provided'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-amber-600">Not Registered</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check if registration needed
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* VAT Calculations */}
              <Card>
                <CardHeader>
                  <CardTitle>Your VAT Summary</CardTitle>
                  <CardDescription>
                    VAT collected from your sales this tax year
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total VAT - always show if registered and has VAT */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted-foreground mb-1">Total VAT Collected</p>
                      <p className="text-2xl font-bold text-green-600">₦{(businessData?.total_vat_collected || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">From all sales this year</p>
                    </div>
                    {/* Product VAT - only show if > 0 */}
                    {(businessData?.vat_breakdown?.product_vat || 0) > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-muted-foreground mb-1">POS/Product Sales VAT</p>
                        <p className="text-xl font-bold text-blue-600">₦{(businessData?.vat_breakdown?.product_vat || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">7.5% on product sales</p>
                      </div>
                    )}
                    {/* Service Invoice VAT - only show if > 0 */}
                    {(businessData?.vat_breakdown?.service_invoice_vat || 0) > 0 && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-muted-foreground mb-1">Service Invoice VAT</p>
                        <p className="text-xl font-bold text-purple-600">₦{(businessData?.vat_breakdown?.service_invoice_vat || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">7.5% on service invoices</p>
                      </div>
                    )}
                  </div>

                  {businessData?.is_vat_registered && (businessData?.total_vat_collected || 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-800 dark:text-amber-200">VAT Remittance Due</h5>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            You have ₦{(businessData?.total_vat_collected || 0).toLocaleString()} VAT to remit to FIRS by the 21st of each month.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!businessData?.is_vat_registered && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> VAT is only charged and collected when your business is VAT registered. 
                        Register for VAT in Business Settings to start collecting VAT on your sales.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* VAT Payment */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-700">Pay Your VAT</CardTitle>
                  </div>
                  <CardDescription>
                    VAT is collected and remitted to <strong>FIRS (Federal Inland Revenue Service)</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Filing Deadline</span>
                      <Badge variant="outline">21st of following month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      VAT returns must be filed and remitted by the 21st day of the month following the month of transaction.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => window.open('https://taxpromax.firs.gov.ng/', '_blank')}
                    >
                      <Landmark className="h-4 w-4 mr-2" />
                      File VAT on FIRS TaxProMax
                    </Button>
                    <Button variant="outline" onClick={() => window.open('https://www.firs.gov.ng/', '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit FIRS Website
                    </Button>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      <strong>Note:</strong> VAT is collected from your customers and remitted to FIRS. You can claim input VAT 
                      (VAT paid on purchases) against output VAT (VAT collected from sales).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 3. PAYE for Employees Collapsible */}
          <Collapsible open={payeOpen} onOpenChange={setPayeOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Staff PAYE (Employee Taxes)</h3>
                  <p className="text-sm text-muted-foreground">Auto-calculated PAYE for all your employees - remit monthly</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {staffPayeData && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    ₦{staffPayeData.total_monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                  </Badge>
                )}
                <ChevronDown className={`w-5 h-5 transition-transform ${payeOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {staffPayeData && staffPayeData.total_staff > 0 ? (
                <>
                  {/* Staff PAYE Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Staff</span>
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {staffPayeData.total_staff}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Employees on payroll</p>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Monthly PAYE</span>
                          <Receipt className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          ₦{staffPayeData.total_monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Due 10th of each month</p>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Annual PAYE</span>
                          <Calculator className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          ₦{staffPayeData.total_annual_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Total for all staff</p>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Filing Deadline</span>
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold text-amber-600">10th</p>
                        <p className="text-xs text-muted-foreground mt-1">of every month</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Staff Breakdown Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle>Employee PAYE Breakdown</CardTitle>
                      </div>
                      <CardDescription>
                        Individual PAYE calculations for each employee
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {staffPayeData.staff_breakdown.map((staff, index) => (
                          <div key={index} className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg gap-2 ${staff.needs_salary_setup ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : staff.is_exempt ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <div className="flex-1">
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {staff.position && `${staff.position}`}{staff.department && ` • ${staff.department}`}
                              </p>
                              {staff.needs_salary_setup ? (
                                <p className="text-sm text-amber-600">
                                  ⚠️ Salary not set - configure in HR & Payroll
                                </p>
                              ) : staff.is_exempt ? (
                                <div>
                                  <p className="text-sm text-green-600">
                                    ✓ PAYE Exempt (Income below ₦1.2M/year threshold)
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Annual Salary: ₦{staff.annual_salary.toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Annual Salary: ₦{staff.annual_salary.toLocaleString()} | Net: ₦{(staff.net_monthly_salary || 0).toLocaleString()}/month
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {staff.needs_salary_setup ? (
                                <Button size="sm" variant="outline" onClick={() => navigate('/business/hr-payroll')}>
                                  Set Salary
                                </Button>
                              ) : staff.is_exempt ? (
                                <div>
                                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                    Tax Exempt
                                  </Badge>
                                  {staff.mandatory_deductions && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Deductions: ₦{(staff.mandatory_deductions.total / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <p className="font-bold text-red-600">
                                    ₦{staff.monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ₦{staff.annual_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year ({(staff.effective_rate || 0).toFixed(1)}%)
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Row */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-primary/20">
                          <span className="font-semibold">Total Monthly PAYE to Remit</span>
                          <span className="text-xl font-bold text-red-600">
                            ₦{staffPayeData.total_monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pay Staff PAYE to State IRS */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-purple-700">Remit Staff PAYE</CardTitle>
                      </div>
                      <CardDescription>
                        Employee PAYE is remitted to the <strong>State IRS</strong> where each employee resides
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-amber-700">Monthly Filing Deadline</span>
                        </div>
                        <p className="text-sm text-amber-600">
                          PAYE for employees must be remitted by the <strong>10th day of the following month</strong>.
                          Failure to remit on time attracts penalties.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => window.open(STATE_IRS_PORTALS[selectedState]?.url, '_blank')}
                        >
                          <Landmark className="h-4 w-4 mr-2" />
                          Pay via State IRS Portal
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/business/staff')}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Staff
                        </Button>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Note:</strong> As an employer, you are responsible for deducting PAYE from your employees' salaries 
                          and remitting it to the relevant State IRS. Keep records of all payments for annual tax returns.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Employees Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add staff members to see their PAYE calculations here.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/business/staff')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Members
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Business Income/Expenses Dialog */}
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Business Income & Expenses</DialogTitle>
                <DialogDescription>
                  Configure your business revenue source and enter allowable business expenses for tax calculation.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Revenue Source Toggle */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Business Revenue Source</Label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Use App Revenue</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically use total revenue from your business app (₦{(businessData?.total_revenue || 0).toLocaleString()})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{useAppRevenue ? 'On' : 'Off'}</span>
                      <button
                        type="button"
                        onClick={() => setUseAppRevenue(!useAppRevenue)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          useAppRevenue ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            useAppRevenue ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {!useAppRevenue && (
                    <div className="space-y-2">
                      <Label htmlFor="manualIncome">Manual Business Income (Annual)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="manualIncome"
                          type="number"
                          placeholder="Enter annual business revenue"
                          className="pl-8"
                          value={manualBusinessIncome}
                          onChange={(e) => setManualBusinessIncome(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Business Expenses */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Business Expenses (Annual)</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Enter your allowable business expenses. These will be deducted from revenue to calculate taxable profit.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="officeRent">Office/Shop Rent</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="officeRent"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.officeRent}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, officeRent: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="utilities">Utilities (Power, Water, Internet)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="utilities"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.utilities}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, utilities: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="professionalFees">Professional Fees (Legal, Accounting)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="professionalFees"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.professionalFees}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, professionalFees: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="equipment">Equipment & Depreciation</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="equipment"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.equipment}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, equipment: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supplies">Office Supplies</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="supplies"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.supplies}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, supplies: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketing">Marketing & Advertising</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="marketing"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.marketing}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, marketing: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="travel">Travel & Transportation</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="travel"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.travel}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, travel: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salaries">Staff Salaries Paid</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="salaries"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.salaries}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, salaries: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="insurance">Business Insurance</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="insurance"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.insurance}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, insurance: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="otherExpenses">Other Expenses</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                        <Input
                          id="otherExpenses"
                          type="number"
                          placeholder="0"
                          className="pl-8"
                          value={businessExpenses.otherExpenses}
                          onChange={(e) => setBusinessExpenses({...businessExpenses, otherExpenses: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Custom Business Expenses */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Additional Expenses</Label>
                  <p className="text-xs text-muted-foreground mb-3">Add any other documented business expenses</p>
                  
                  {customBusinessExpenses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {customBusinessExpenses.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">₦{item.amount.toLocaleString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeCustomBusinessExpense(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Expense name"
                      value={newCustomExpense.name}
                      onChange={(e) => setNewCustomExpense({...newCustomExpense, name: e.target.value})}
                      className="flex-1"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="pl-8"
                        value={newCustomExpense.amount}
                        onChange={(e) => setNewCustomExpense({...newCustomExpense, amount: e.target.value})}
                      />
                    </div>
                    <Button onClick={addCustomBusinessExpense} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="border-t pt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Business Revenue:</span>
                      <span className="font-medium text-green-600">
                        ₦{(useAppRevenue ? (businessData?.total_revenue || 0) : (parseFloat(manualBusinessIncome) || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span className="font-medium text-red-600">
                        -₦{(Object.values(businessExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) + 
                          customBusinessExpenses.reduce((sum, exp) => sum + exp.amount, 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Taxable Profit:</span>
                      <span className="font-bold text-primary">
                        ₦{Math.max(0, (useAppRevenue ? (businessData?.total_revenue || 0) : (parseFloat(manualBusinessIncome) || 0)) -
                          Object.values(businessExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) -
                          customBusinessExpenses.reduce((sum, exp) => sum + exp.amount, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deductions Edit Dialog */}
          <Dialog open={deductionsDialogOpen} onOpenChange={setDeductionsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Personal Deductions</DialogTitle>
                <DialogDescription>
                  Enter your allowable personal deductions. These reduce your taxable income after business expenses.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRent">Annual Rent Paid (Personal Residence)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="annualRent"
                      type="number"
                      placeholder="0"
                      className="pl-8"
                      value={deductionInputs.annualRentPaid}
                      onChange={(e) => setDeductionInputs({...deductionInputs, annualRentPaid: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Relief: 20% of rent paid (max ₦500,000). Current relief: ₦{(Math.min((parseFloat(deductionInputs.annualRentPaid) || 0) * 0.20, 500000)).toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nhis">NHIS Contribution (Annual)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="nhis"
                      type="number"
                      placeholder="0"
                      className="pl-8"
                      value={deductionInputs.nhisContribution}
                      onChange={(e) => setDeductionInputs({...deductionInputs, nhisContribution: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">National Health Insurance Scheme contribution</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lifeInsurance">Life Insurance Premium (Annual)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="lifeInsurance"
                      type="number"
                      placeholder="0"
                      className="pl-8"
                      value={deductionInputs.lifeInsurancePremium}
                      onChange={(e) => setDeductionInputs({...deductionInputs, lifeInsurancePremium: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Life insurance or deferred annuity premiums</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="homeLoan">Home Loan Interest (Annual)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="homeLoan"
                      type="number"
                      placeholder="0"
                      className="pl-8"
                      value={deductionInputs.homeLoanInterest}
                      onChange={(e) => setDeductionInputs({...deductionInputs, homeLoanInterest: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Interest on loan for owner-occupied residential house</p>
                </div>
                
                {/* Custom Deductions */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Custom Deductions</Label>
                  <p className="text-xs text-muted-foreground mb-3">Add other allowable deductions with documented proof</p>
                  
                  {customDeductions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {customDeductions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">₦{item.amount.toLocaleString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeCustomDeduction(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Deduction name"
                      value={newCustomDeduction.name}
                      onChange={(e) => setNewCustomDeduction({...newCustomDeduction, name: e.target.value})}
                      className="flex-1"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="pl-8"
                        value={newCustomDeduction.amount}
                        onChange={(e) => setNewCustomDeduction({...newCustomDeduction, amount: e.target.value})}
                      />
                    </div>
                    <Button onClick={addCustomDeduction} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeductionsDialogOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Configure Tax Settings CTA */}
          <Card className="border-2 border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Configure your tax settings for accurate calculations
              </p>
              <Button variant="outline" onClick={() => navigate('/business/settings?tab=business-type&section=tax-compliance')}>
                <Edit className="h-4 w-4 mr-2" />
                Go to Tax Compliance Settings
              </Button>
            </CardContent>
          </Card>

          {/* Request Professional Service Badge */}
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Need Help With Tax Compliance?</p>
                    <p className="text-xs text-muted-foreground">
                      Get expert assistance from our professional services team
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/business/professional-services?category=tax')}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Request Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Staff View - Original Layout */
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Annual Gross Salary</span>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  ₦{taxData.salary.annual.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly: ₦{taxData.salary.monthly.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Annual PAYE Tax</span>
                  <Receipt className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  ₦{taxData.tax.annual_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly: ₦{taxData.tax.monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pension Contribution</span>
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xl md:text-2xl font-bold">
              ₦{taxData.deductions.pension_employee_annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              8% Employee + 10% Employer
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-purple-600">
              {taxData.tax.effective_rate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Nigeria Tax Act 2025
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Relief from Accommodation */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-700">Tax Relief - Accommodation</CardTitle>
            </div>
            <Dialog open={accommodationDialogOpen} onOpenChange={setAccommodationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  {taxData.accommodation.annual_rent_paid > 0 ? (
                    <><Edit className="h-4 w-4 mr-2" /> Update</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Add Accommodation</>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Accommodation for Tax Relief</DialogTitle>
                  <DialogDescription>
                    Enter your annual rent paid. You can claim 20% of your rent as tax relief (max ₦500,000).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Annual Rent Paid (₦)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1,200,000"
                      value={rentInput}
                      onChange={(e) => setRentInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Estimated relief: ₦{Math.min(parseFloat(rentInput || '0') * 0.2, 500000).toLocaleString()}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAccommodationDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateAccommodation} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Reduce your taxable income by claiming accommodation expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Annual Rent Paid</p>
              <p className="text-lg font-bold">₦{taxData.accommodation.annual_rent_paid.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tax Relief (20%)</p>
              <p className="text-lg font-bold text-blue-600">₦{taxData.accommodation.rent_relief.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Max Relief Allowed</p>
              <p className="text-lg font-bold text-green-600">₦{taxData.accommodation.max_relief.toLocaleString()}</p>
            </div>
          </div>
          {taxData.accommodation.annual_rent_paid === 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Add your accommodation details to reduce your taxable income and save on taxes!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAYE Tax Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Your PAYE Tax Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taxBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.bracket}</span>
                    <span className="text-sm text-muted-foreground">Rate: {(item.rate * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={item.tax > 0 && taxData.tax.annual_paye > 0 ? (item.tax / taxData.tax.annual_paye) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="ml-4 text-right min-w-[100px]">
                  <span className="font-semibold text-red-600">
                    ₦{item.tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-3 border-t-2 border-primary/20">
              <span className="font-semibold">Total Annual Tax</span>
              <div className="text-right">
                <span className="text-xl font-bold text-red-600">
                  ₦{taxData.tax.annual_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <p className="text-xs text-muted-foreground">
                  ₦{taxData.tax.monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Your Tax Directly - TO STATE IRS, NOT FIRS! */}
      <Card className="mb-6 border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">Pay Your PAYE Tax</CardTitle>
          </div>
          <CardDescription>
            PAYE (Personal Income Tax) is paid to your <strong>State Internal Revenue Service</strong>, NOT FIRS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State Selection */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <Label className="text-sm font-medium mb-2 block">Select Your State of Residence</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Your PAYE will be paid to: <strong>{STATE_IRS_PORTALS[selectedState]?.name}</strong>
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Monthly PAYE Due</span>
              <Badge variant="outline">Amount due this month</Badge>
            </div>
            <p className="text-2xl font-bold text-primary">
              ₦{taxData.tax.monthly_paye.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your employer typically remits PAYE on your behalf. If you need to make a direct payment, use the button below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => window.open(STATE_IRS_PORTALS[selectedState]?.url, '_blank')}
            >
              <Landmark className="h-4 w-4 mr-2" />
              Pay via {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} State IRS
            </Button>
            <Button variant="outline" onClick={() => window.open(STATE_IRS_PORTALS[selectedState]?.url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit State IRS Portal
            </Button>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Important:</strong> PAYE (Personal Income Tax) is ALWAYS paid to your State Internal Revenue Service, 
              not to FIRS. FIRS only collects Company Income Tax (CIT), VAT, and Withholding Tax.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Other Statutory Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>Other Statutory Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pension Contribution */}
            <Card className="border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Pension Contribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Contribution (8%)</span>
                  <span className="font-medium">₦{taxData.deductions.pension_employee_annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employer Contribution (10%)</span>
                  <span className="font-medium">₦{taxData.deductions.pension_employer_annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total to PFA</span>
                  <span className="font-bold text-blue-600">
                    ₦{taxData.deductions.pension_total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* NHF */}
            <Card className="border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">National Housing Fund (NHF)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Contribution (2.5%)</span>
                  <span className="font-medium">₦{taxData.deductions.nhf_monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Annual Contribution</span>
                  <span className="font-bold text-purple-600">
                    ₦{taxData.deductions.nhf_annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Managed by Federal Mortgage Bank of Nigeria
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Net Pay Summary */}
      <Card className="mt-6 border-2 border-green-500">
        <CardHeader className="bg-green-50 dark:bg-green-900/20">
          <CardTitle className="text-green-700 dark:text-green-400">Your Net Pay Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Annual Net Pay</p>
              <p className="text-2xl font-bold text-green-600">₦{taxData.net_pay.annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Monthly Net Pay</p>
              <p className="text-2xl font-bold text-green-600">₦{taxData.net_pay.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Net pay = Gross Salary - PAYE Tax - NHF - Pension (Employee)
          </p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
