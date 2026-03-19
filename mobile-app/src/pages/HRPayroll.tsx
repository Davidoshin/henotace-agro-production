import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { ArrowLeft, MapPin, Clock, DollarSign, Calendar, Download, Users, TrendingUp, AlertCircle, X, CheckCircle, Search, ChevronsUpDown, CalendarCheck } from "lucide-react";
import AbsenceRequestManagement from "@/components/AbsenceRequestManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AttendanceSettings {
  id?: number;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  resumption_time: string;
  closing_time: string;
  late_threshold_minutes: number;
  lateness_penalty: number;
}

interface AttendanceRecord {
  id: number;
  staff: {
    id: number;
    employee_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  clock_in_time: string;
  clock_out_time: string | null;
  is_late: boolean;
  late_minutes: number;
  date: string;
}

interface PayrollOverview {
  total_staff: number;
  monthly_payroll: number;
  avg_salary: number;
  pending_approvals: number;
  chart_data: Array<{ month: string; amount: number }>;
  staff_directory: Array<{
    id: number;
    name: string;
    role: string;
    department: string;
    salary: number;
    status: string;
  }>;
}

interface SalaryStructure {
  id: number;
  position: string;
  department: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowances: number;
  // 2026 Tax Act mandatory deductions
  pension_percentage: number;
  nhf_percentage: number;
  nhis_percentage: number;
  health_insurance: number;
  annual_rent_paid: number;
  mandatory_savings_percentage: number;
  // Deprecated
  tax_percentage: number;
  is_active: boolean;
  gross_salary?: number;
  net_salary?: number;
}

export default function HRPayroll() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading] = useState(false);
  
  // Attendance Settings
  const [settings, setSettings] = useState<AttendanceSettings>({
    latitude: 0,
    longitude: 0,
    geofence_radius: 100,
    resumption_time: "08:00",
    closing_time: "17:00",
    late_threshold_minutes: 15,
    lateness_penalty: 500,
  });
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Attendance Records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payrollOverview, setPayrollOverview] = useState<PayrollOverview | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [showChart, setShowChart] = useState(true);
  
  // Salary Structure
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [structureForm, setStructureForm] = useState({
    position: "",
    department: "",
    base_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    meal_allowance: "",
    other_allowances: "",
    // 2026 Nigeria Tax Act mandatory deductions
    pension_percentage: "8", // 8% employee pension (mandatory)
    nhf_percentage: "2.5", // 2.5% National Housing Fund (mandatory)
    nhis_percentage: "0.5", // NHIS (mandatory)
    health_insurance: "", // Additional private health insurance
    annual_rent_paid: "", // For rent relief calculation
    mandatory_savings_percentage: "",
    // Deprecated - PAYE is now auto-calculated
    tax_percentage: "0",
  });
  
  const [positionSearch, setPositionSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  const defaultPositions = [
    "Store Manager", "Operations Manager", "Logistics Staff", "Warehouse Staff",
    "Sales Rep.", "Bookkeeper", "Accountant", "Administrative Assistant",
    "Sales Lead", "Supervisor", "Customer Service Rep.", "Managing Director", "CEO"
  ];
  
  const defaultDepartments = [
    "Operations", "Finance", "Sales / Customer Relations", "Leadership",
    "Marketing", "Human Resources", "IT", "Customer Service"
  ];
  
  const filteredPositions = defaultPositions.filter(pos => 
    pos.toLowerCase().includes(positionSearch.toLowerCase())
  );
  
  const filteredDepartments = defaultDepartments.filter(dept => 
    dept.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  useEffect(() => {
    loadAttendanceSettings();
    loadAttendanceRecords();
    if (activeTab === 'payroll') {
      loadPayrollOverview();
    }
    if (activeTab === 'salary-structure') {
      loadSalaryStructures();
    }
  }, [activeTab]);

  const loadAttendanceSettings = async () => {
    try {
      const data = await apiGet("business/hr/attendance-settings/");
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (e: any) {
      console.error("Failed to load settings:", e);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      } else if (filterMonth) {
        params.append("month", filterMonth);
      }
      
      const data = await apiGet(`business/hr/attendance/?${params.toString()}`);
      setAttendanceRecords(data.records || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load attendance", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSettings({
            ...settings,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({ title: "Success", description: "Location captured successfully" });
        },
        (error) => {
          toast({ title: "Error", description: "Failed to get location", variant: "destructive" });
        }
      );
    } else {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
    }
  };

  const saveAttendanceSettings = async () => {
    try {
      await apiPost("business/hr/attendance-settings/", settings);
      setShowSettingsDialog(false);
      toast({ title: "Success", description: "Attendance settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save settings", variant: "destructive" });
    }
  };

  const loadPayrollOverview = async () => {
    try {
      const data = await apiGet("business/payroll/overview/");
      setPayrollOverview(data.overview);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load payroll overview", variant: "destructive" });
    }
  };

  const loadSalaryStructures = async () => {
    try {
      const data = await apiGet("business/payroll/salary-structures/");
      setSalaryStructures(data.structures || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load salary structures", variant: "destructive" });
    }
  };

  const saveSalaryStructure = async () => {
    try {
      setLoading(true);
      const payload = {
        position: structureForm.position,
        department: structureForm.department,
        base_salary: parseFloat(structureForm.base_salary as string) || 0,
        housing_allowance: parseFloat(structureForm.housing_allowance as string) || 0,
        transport_allowance: parseFloat(structureForm.transport_allowance as string) || 0,
        meal_allowance: parseFloat(structureForm.meal_allowance as string) || 0,
        other_allowances: parseFloat(structureForm.other_allowances as string) || 0,
        // 2026 Nigeria Tax Act mandatory deductions
        pension_percentage: parseFloat(structureForm.pension_percentage as string) || 8,
        nhf_percentage: parseFloat(structureForm.nhf_percentage as string) || 2.5,
        nhis_percentage: parseFloat(structureForm.nhis_percentage as string) || 0.5,
        health_insurance: parseFloat(structureForm.health_insurance as string) || 0,
        annual_rent_paid: parseFloat(structureForm.annual_rent_paid as string) || 0,
        mandatory_savings_percentage: parseFloat(structureForm.mandatory_savings_percentage as string) || 0,
        tax_percentage: 0, // Deprecated - PAYE auto-calculated
        is_active: true
      };
      
      if (editingStructure) {
        await apiPut(`business/payroll/salary-structures/${editingStructure.id}/`, payload);
        toast({ title: "Success", description: "Salary structure updated successfully" });
      } else {
        await apiPost("business/payroll/salary-structures/", payload);
        toast({ title: "Success", description: "Salary structure created successfully" });
      }
      setShowStructureDialog(false);
      setEditingStructure(null);
      resetStructureForm();
      loadSalaryStructures();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save salary structure", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteSalaryStructure = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salary structure?")) return;
    
    try {
      await apiPost(`business/payroll/salary-structures/${id}/delete/`, {});
      toast({ title: "Success", description: "Salary structure deleted successfully" });
      loadSalaryStructures();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete salary structure", variant: "destructive" });
    }
  };

  const resetStructureForm = () => {
    setStructureForm({
      position: "",
      department: "",
      base_salary: "",
      housing_allowance: "",
      transport_allowance: "",
      meal_allowance: "",
      other_allowances: "",
      // 2026 Nigeria Tax Act mandatory deductions (defaults)
      pension_percentage: "8",
      nhf_percentage: "2.5",
      nhis_percentage: "0.5",
      health_insurance: "",
      annual_rent_paid: "",
      mandatory_savings_percentage: "",
      tax_percentage: "0",
    });
    setPositionSearch("");
    setDepartmentSearch("");
    setShowPositionDropdown(false);
    setShowDepartmentDropdown(false);
  };

  const openEditStructure = (structure: SalaryStructure) => {
    setEditingStructure(structure);
    setStructureForm({
      position: structure.position || "",
      department: structure.department || "",
      base_salary: (structure.base_salary ?? 0).toString(),
      housing_allowance: (structure.housing_allowance ?? 0).toString(),
      transport_allowance: (structure.transport_allowance ?? 0).toString(),
      meal_allowance: (structure.meal_allowance ?? 0).toString(),
      other_allowances: (structure.other_allowances ?? 0).toString(),
      pension_percentage: (structure.pension_percentage ?? 8).toString(),
      nhf_percentage: (structure.nhf_percentage ?? 2.5).toString(),
      nhis_percentage: (structure.nhis_percentage ?? 0.5).toString(),
      health_insurance: (structure.health_insurance ?? 0).toString(),
      annual_rent_paid: (structure.annual_rent_paid ?? 0).toString(),
      mandatory_savings_percentage: (structure.mandatory_savings_percentage ?? 0).toString(),
      tax_percentage: "0", // Deprecated
    });
    setPositionSearch(structure.position || "");
    setDepartmentSearch(structure.department || "");
    setShowStructureDialog(true);
  };

  const calculateGrossSalary = () => {
    const base = parseFloat(structureForm.base_salary as string) || 0;
    const housing = parseFloat(structureForm.housing_allowance as string) || 0;
    const transport = parseFloat(structureForm.transport_allowance as string) || 0;
    const meal = parseFloat(structureForm.meal_allowance as string) || 0;
    const other = parseFloat(structureForm.other_allowances as string) || 0;
    return base + housing + transport + meal + other;
  };

  const calculateNetSalary = () => {
    const gross = calculateGrossSalary();
    // 2026 Tax Act mandatory deductions
    const pensionPct = parseFloat(structureForm.pension_percentage as string) || 8;
    const nhfPct = parseFloat(structureForm.nhf_percentage as string) || 2.5;
    const nhisPct = parseFloat(structureForm.nhis_percentage as string) || 0.5;
    const savingsPct = parseFloat(structureForm.mandatory_savings_percentage as string) || 0;
    const healthIns = parseFloat(structureForm.health_insurance as string) || 0;
    
    const pensionAmount = (gross * pensionPct) / 100;
    const nhfAmount = (gross * nhfPct) / 100;
    const nhisAmount = (gross * nhisPct) / 100;
    const savingsAmount = (gross * savingsPct) / 100;
    
    // PAYE Tax is calculated based on annual income after deductions
    // For display purposes, we estimate based on net taxable income
    const annualGross = gross * 12;
    const annualDeductions = (pensionAmount + nhfAmount + nhisAmount) * 12;
    const rentRelief = Math.min((parseFloat(structureForm.annual_rent_paid as string) || 0) * 0.2, 500000);
    const taxableIncome = Math.max(0, annualGross - annualDeductions - rentRelief - 1200000); // ₦1.2M exemption
    
    // Simplified PAYE estimate (actual calculation is more complex with brackets)
    let estimatedAnnualPaye = 0;
    if (taxableIncome > 0) {
      // Progressive tax brackets
      let remaining = taxableIncome;
      if (remaining > 0) { estimatedAnnualPaye += Math.min(remaining, 800000) * 0; remaining -= 800000; }
      if (remaining > 0) { estimatedAnnualPaye += Math.min(remaining, 2200000) * 0.15; remaining -= 2200000; }
      if (remaining > 0) { estimatedAnnualPaye += Math.min(remaining, 9000000) * 0.18; remaining -= 9000000; }
      if (remaining > 0) { estimatedAnnualPaye += Math.min(remaining, 13000000) * 0.21; remaining -= 13000000; }
      if (remaining > 0) { estimatedAnnualPaye += Math.min(remaining, 25000000) * 0.23; remaining -= 25000000; }
      if (remaining > 0) { estimatedAnnualPaye += remaining * 0.25; }
    }
    const monthlyPaye = estimatedAnnualPaye / 12;
    
    return gross - pensionAmount - nhfAmount - nhisAmount - savingsAmount - healthIns - monthlyPaye;
  };

  const generatePayroll = async () => {
    try {
      const now = new Date();
      await apiPost("business/payroll/generate/", {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      toast({ title: "Success", description: "Payroll generated successfully" });
      loadPayrollOverview();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate payroll", variant: "destructive" });
    }
  };

  const paySalaries = async () => {
    if (selectedStaff.length === 0) {
      toast({ title: "Error", description: "Please select staff to pay", variant: "destructive" });
      return;
    }

    try {
      await apiPost("business/payroll/pay/", { payroll_ids: selectedStaff });
      toast({ title: "Success", description: "Salaries paid successfully" });
      setSelectedStaff([]);
      loadPayrollOverview();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to pay salaries", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">HR & Payroll</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage attendance, payroll, and staff compensation</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="attendance" className="text-xs md:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="leave-requests" className="text-xs md:text-sm">Leave Requests</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs md:text-sm">Settings</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs md:text-sm">Payroll</TabsTrigger>
          <TabsTrigger value="salary-structure" className="text-xs md:text-sm">Salary</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Tracking</CardTitle>
              <CardDescription>View and filter staff attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Filter by Month</Label>
                    <Input 
                      type="month" 
                      value={filterMonth} 
                      onChange={(e) => {
                        setFilterMonth(e.target.value);
                        setStartDate("");
                        setEndDate("");
                      }} 
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setFilterMonth("");
                      }} 
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setFilterMonth("");
                      }} 
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadAttendanceRecords}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Apply Filter
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left whitespace-nowrap">Employee</th>
                        <th className="p-3 text-left whitespace-nowrap">Date</th>
                        <th className="p-3 text-left whitespace-nowrap">Clock In</th>
                        <th className="p-3 text-left whitespace-nowrap">Clock Out</th>
                        <th className="p-3 text-left whitespace-nowrap">Status</th>
                        <th className="p-3 text-left whitespace-nowrap">Late (mins)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            Loading...
                          </td>
                        </tr>
                      ) : attendanceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            No attendance records found
                          </td>
                        </tr>
                      ) : (
                        attendanceRecords.map((record) => (
                          <tr key={record.id} className="border-t">
                            <td className="p-3">
                              {record.staff.user.first_name} {record.staff.user.last_name}
                              <br />
                              <span className="text-xs text-muted-foreground">{record.staff.employee_id}</span>
                            </td>
                            <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                            <td className="p-3">{new Date(record.clock_in_time).toLocaleTimeString()}</td>
                            <td className="p-3">
                              {record.clock_out_time 
                                ? new Date(record.clock_out_time).toLocaleTimeString() 
                                : "Not clocked out"}
                            </td>
                            <td className="p-3">
                              {record.is_late ? (
                                <span className="text-red-600 font-medium">Late</span>
                              ) : (
                                <span className="text-green-600 font-medium">On Time</span>
                              )}
                            </td>
                            <td className="p-3">{record.late_minutes || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-requests" className="space-y-4">
          <AbsenceRequestManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Settings</CardTitle>
              <CardDescription>Configure geofencing, work hours, and penalties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Geofencing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input 
                      type="number" 
                      step="0.000001"
                      value={settings.latitude} 
                      onChange={(e) => setSettings({...settings, latitude: parseFloat(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input 
                      type="number" 
                      step="0.000001"
                      value={settings.longitude} 
                      onChange={(e) => setSettings({...settings, longitude: parseFloat(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <Label>Radius (meters)</Label>
                    <Input 
                      type="number" 
                      value={settings.geofence_radius} 
                      onChange={(e) => setSettings({...settings, geofence_radius: parseInt(e.target.value)})} 
                    />
                  </div>
                </div>
                <Button onClick={getCurrentLocation} variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Use Current Location
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Work Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Resumption Time</Label>
                    <Input 
                      type="time" 
                      value={settings.resumption_time} 
                      onChange={(e) => setSettings({...settings, resumption_time: e.target.value})} 
                    />
                  </div>
                  <div>
                    <Label>Closing Time</Label>
                    <Input 
                      type="time" 
                      value={settings.closing_time} 
                      onChange={(e) => setSettings({...settings, closing_time: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Lateness Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Late Threshold (minutes)</Label>
                    <Input 
                      type="number" 
                      value={settings.late_threshold_minutes} 
                      onChange={(e) => setSettings({...settings, late_threshold_minutes: parseInt(e.target.value)})} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Staff arriving after this time are marked as late
                    </p>
                  </div>
                  <div>
                    <Label>Penalty Fee (₦)</Label>
                    <Input 
                      type="number" 
                      value={settings.lateness_penalty} 
                      onChange={(e) => setSettings({...settings, lateness_penalty: parseFloat(e.target.value)})} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deducted from salary for each late occurrence
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={saveAttendanceSettings} className="w-full md:w-auto">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollOverview?.total_staff || 0}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{payrollOverview?.monthly_payroll.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{payrollOverview?.avg_salary.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Per employee</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollOverview?.pending_approvals || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {showChart && payrollOverview?.chart_data && (
            <Card className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => setShowChart(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardHeader>
                <CardTitle>Monthly Payroll Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-2">
                  {payrollOverview.chart_data.map((data, idx) => {
                    const maxAmount = Math.max(...payrollOverview.chart_data.map(d => d.amount));
                    const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: '20px' }}
                          title={`₦${data.amount.toLocaleString()}`}
                        />
                        <span className="text-xs text-muted-foreground">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Directory */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Directory</CardTitle>
                  <CardDescription>Manage staff salaries and payment status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generatePayroll} variant="outline">
                    Generate Payroll
                  </Button>
                  <Button onClick={paySalaries} disabled={selectedStaff.length === 0}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Selected ({selectedStaff.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 w-12">
                        <Checkbox
                          checked={selectedStaff.length === payrollOverview?.staff_directory.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStaff(payrollOverview?.staff_directory.map(s => s.id) || []);
                            } else {
                              setSelectedStaff([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Department</th>
                      <th className="text-left p-3">Salary</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollOverview?.staff_directory.map((staff) => (
                      <tr key={staff.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedStaff.includes(staff.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStaff([...selectedStaff, staff.id]);
                              } else {
                                setSelectedStaff(selectedStaff.filter(id => id !== staff.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-3 font-medium">{staff.name}</td>
                        <td className="p-3">{staff.role}</td>
                        <td className="p-3">{staff.department}</td>
                        <td className="p-3">₦{staff.salary.toLocaleString()}</td>
                        <td className="p-3">
                          {staff.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Paid
                            </span>
                          ) : staff.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-yellow-600">
                              <AlertCircle className="w-4 h-4" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <AlertCircle className="w-4 h-4" />
                              Not Generated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-structure" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Salary Structures</CardTitle>
                  <CardDescription>Define salary structures for different positions and departments</CardDescription>
                </div>
                <Button onClick={() => {
                  resetStructureForm();
                  setEditingStructure(null);
                  setShowStructureDialog(true);
                }}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 whitespace-nowrap">Position</th>
                      <th className="text-left p-3 whitespace-nowrap">Department</th>
                      <th className="text-left p-3 whitespace-nowrap">Base Salary</th>
                      <th className="text-left p-3 whitespace-nowrap">Allowances</th>
                      <th className="text-left p-3 whitespace-nowrap">Deductions</th>
                      <th className="text-left p-3 whitespace-nowrap">Net Salary</th>
                      <th className="text-left p-3 whitespace-nowrap">Status</th>
                      <th className="text-left p-3 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryStructures.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                          No salary structures defined yet. Click "Add Structure" to create one.
                        </td>
                      </tr>
                    ) : (
                      salaryStructures.map((structure) => {
                        const totalAllowances = structure.housing_allowance + structure.transport_allowance + structure.meal_allowance + structure.other_allowances;
                        const grossSalary = structure.base_salary + totalAllowances;
                        const taxAmount = (grossSalary * structure.tax_percentage) / 100;
                        const pensionAmount = (grossSalary * structure.pension_percentage) / 100;
                        const savingsAmount = (grossSalary * structure.mandatory_savings_percentage) / 100;
                        const totalDeductions = taxAmount + pensionAmount + savingsAmount + structure.health_insurance;
                        const netSalary = grossSalary - totalDeductions;
                        
                        return (
                          <tr key={structure.id} className="border-t">
                            <td className="p-3 font-medium">{structure.position}</td>
                            <td className="p-3">{structure.department}</td>
                            <td className="p-3">₦{structure.base_salary.toLocaleString()}</td>
                            <td className="p-3">₦{totalAllowances.toLocaleString()}</td>
                            <td className="p-3">₦{totalDeductions.toLocaleString()}</td>
                            <td className="p-3 font-semibold">₦{netSalary.toLocaleString()}</td>
                            <td className="p-3">
                              {structure.is_active ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-600">
                                  <X className="w-4 h-4" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditStructure(structure)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteSalaryStructure(structure.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Structure Dialog */}
      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStructure ? 'Edit' : 'Add'} Salary Structure</DialogTitle>
            <DialogDescription>
              Define the salary components for a position
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Label>Position</Label>
                <div className="relative">
                  <Input
                    value={structureForm.position}
                    onChange={(e) => {
                      setStructureForm({ ...structureForm, position: e.target.value });
                      setPositionSearch(e.target.value);
                      setShowPositionDropdown(true);
                    }}
                    onFocus={() => setShowPositionDropdown(true)}
                    placeholder="Search or type position..."
                  />
                  <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                {showPositionDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2">
                      <div className="flex items-center border-b pb-2 mb-2">
                        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input
                          value={positionSearch}
                          onChange={(e) => setPositionSearch(e.target.value)}
                          placeholder="Search positions..."
                          className="border-0 p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      {filteredPositions.length > 0 ? (
                        filteredPositions.map((pos) => (
                          <div
                            key={pos}
                            className="px-2 py-1.5 hover:bg-muted cursor-pointer rounded text-sm"
                            onClick={() => {
                              setStructureForm({ ...structureForm, position: pos });
                              setPositionSearch(pos);
                              setShowPositionDropdown(false);
                            }}
                          >
                            {pos}
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No positions found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Label>Department</Label>
                <div className="relative">
                  <Input
                    value={structureForm.department}
                    onChange={(e) => {
                      setStructureForm({ ...structureForm, department: e.target.value });
                      setDepartmentSearch(e.target.value);
                      setShowDepartmentDropdown(true);
                    }}
                    onFocus={() => setShowDepartmentDropdown(true)}
                    placeholder="Search or type department..."
                  />
                  <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                {showDepartmentDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2">
                      <div className="flex items-center border-b pb-2 mb-2">
                        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input
                          value={departmentSearch}
                          onChange={(e) => setDepartmentSearch(e.target.value)}
                          placeholder="Search departments..."
                          className="border-0 p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((dept) => (
                          <div
                            key={dept}
                            className="px-2 py-1.5 hover:bg-muted cursor-pointer rounded text-sm"
                            onClick={() => {
                              setStructureForm({ ...structureForm, department: dept });
                              setDepartmentSearch(dept);
                              setShowDepartmentDropdown(false);
                            }}
                          >
                            {dept}
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No departments found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Salary Components</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Salary (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.base_salary}
                    onChange={(e) => setStructureForm({ ...structureForm, base_salary: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Housing Allowance (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.housing_allowance}
                    onChange={(e) => setStructureForm({ ...structureForm, housing_allowance: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Transport Allowance (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.transport_allowance}
                    onChange={(e) => setStructureForm({ ...structureForm, transport_allowance: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Meal Allowance (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.meal_allowance}
                    onChange={(e) => setStructureForm({ ...structureForm, meal_allowance: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Other Allowances (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.other_allowances}
                    onChange={(e) => setStructureForm({ ...structureForm, other_allowances: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Mandatory Statutory Deductions (2026 Tax Act)</h4>
              <p className="text-xs text-muted-foreground mb-3">These are required by Nigerian law. PAYE tax is auto-calculated based on income brackets.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pension Contribution (%)</Label>
                  <Input
                    type="number"
                    value={structureForm.pension_percentage}
                    onChange={(e) => setStructureForm({ ...structureForm, pension_percentage: e.target.value })}
                    placeholder="8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Employee: 8% (mandatory)</p>
                </div>
                <div>
                  <Label>NHF - National Housing Fund (%)</Label>
                  <Input
                    type="number"
                    value={structureForm.nhf_percentage}
                    onChange={(e) => setStructureForm({ ...structureForm, nhf_percentage: e.target.value })}
                    placeholder="2.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">2.5% (mandatory)</p>
                </div>
                <div>
                  <Label>NHIS - Health Insurance (%)</Label>
                  <Input
                    type="number"
                    value={structureForm.nhis_percentage}
                    onChange={(e) => setStructureForm({ ...structureForm, nhis_percentage: e.target.value })}
                    placeholder="0.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">~0.5% (mandatory)</p>
                </div>
                <div>
                  <Label>Additional Health Insurance (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.health_insurance}
                    onChange={(e) => setStructureForm({ ...structureForm, health_insurance: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Private health cover (optional)</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Tax Relief & Savings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Annual Rent Paid (₦)</Label>
                  <Input
                    type="number"
                    value={structureForm.annual_rent_paid}
                    onChange={(e) => setStructureForm({ ...structureForm, annual_rent_paid: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">20% deductible, max ₦500,000 relief</p>
                </div>
                <div>
                  <Label>Voluntary Savings (%)</Label>
                  <Input
                    type="number"
                    value={structureForm.mandatory_savings_percentage}
                    onChange={(e) => setStructureForm({ ...structureForm, mandatory_savings_percentage: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional savings deduction</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gross Salary</p>
                  <p className="text-xl font-bold">₦{calculateGrossSalary().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Salary</p>
                  <p className="text-xl font-bold text-green-600">₦{calculateNetSalary().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStructureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveSalaryStructure} disabled={loading || !structureForm.position || !structureForm.department}>
              {loading ? "Saving..." : "Save Structure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
