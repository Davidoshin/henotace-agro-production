import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { Clock, Package, ShoppingCart, DollarSign, LogOut, Calendar, Download, FileText, File, CalendarDays, Menu, X, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface StaffProfile {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  business: {
    id: number;
    name: string;
  };
  employee_id: string;
  department: string;
  position: string;
  can_manage_sales: boolean;
  can_manage_inventory: boolean;
  can_manage_staff: boolean;
  can_view_reports: boolean;
}

interface SalaryInfo {
  employee_id: string;
  employee_name: string;
  month: number;
  year: number;
  base_salary: number;
  gross_salary: number;
  deductions: {
    tax: number;
    lateness_penalty: number;
    total: number;
  };
  net_salary: number;
  attendance: {
    days_worked: number;
    late_days: number;
    total_late_minutes: number;
  };
  payroll_id?: number | null;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [withinPremises, setWithinPremises] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState<'txt' | 'pdf'>('pdf');
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [absenceRequests, setAbsenceRequests] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({
    absence_type: 'personal_leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadStaffProfile();
    loadSalaryInfo();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    // Check location on tab change to attendance
    if (activeTab === 'attendance') {
      checkLocation();
      loadAttendanceRecords();
      loadAbsenceRequests();
    }
  }, [activeTab]);

  const checkLocation = async () => {
    try {
      const location = await getLocation();
      // You can add API call here to check if within premises
      // For now, we'll check on clock-in
      setLocationStatus("Location ready");
    } catch (e) {
      setLocationStatus("Location access denied");
      setWithinPremises(false);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!staffProfile?.id) return;
    try {
      const now = new Date();
      const data = await apiGet(`business/staff/${staffProfile.id}/attendance/?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      setAttendanceRecords(data.attendance || []);
    } catch (e: any) {
      console.error("Failed to load attendance:", e);
    }
  };

  const loadAbsenceRequests = async () => {
    try {
      const data = await apiGet('business/staff/absence/my-requests/');
      setAbsenceRequests(data.requests || []);
    } catch (e: any) {
      console.error("Failed to load absence requests:", e);
    }
  };

  const handleAbsenceRequest = async () => {
    if (!absenceForm.start_date || !absenceForm.end_date || !absenceForm.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiPost('business/staff/absence/request/', absenceForm);
      toast({
        title: "Success",
        description: "Absence request submitted successfully"
      });
      setShowAbsenceDialog(false);
      setAbsenceForm({
        absence_type: 'personal_leave',
        start_date: '',
        end_date: '',
        reason: ''
      });
      loadAbsenceRequests();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to submit absence request",
        variant: "destructive"
      });
    }
  };

  const loadStaffProfile = async () => {
    try {
      setLoading(true);
      const data = await apiGet("business/staff/me/");
      setStaffProfile(data.staff);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryInfo = async () => {
    try {
      console.log(`[StaffDashboard] Fetching salary info for month=${selectedMonth}, year=${selectedYear}`);
      const data = await apiGet(`business/staff/salary/?month=${selectedMonth}&year=${selectedYear}`);
      console.log('[StaffDashboard] Salary data received:', data);
      
      if (data.success && data.salary) {
        setSalaryInfo(data.salary);
        console.log('[StaffDashboard] Salary info set successfully:', data.salary);
      } else {
        console.warn('[StaffDashboard] No salary data in response:', data);
        setSalaryInfo(null);
        toast({
          title: "No Payroll Record",
          description: `No payroll record found for ${getMonthName(selectedMonth)} ${selectedYear}`,
          variant: "destructive"
        });
      }
    } catch (e: any) {
      console.error("[StaffDashboard] Failed to load salary info:", e);
      console.error("[StaffDashboard] Error details:", {
        message: e.message,
        response: e.response,
        status: e.status
      });
      setSalaryInfo(null);
      toast({
        title: "Error",
        description: e.message || "Failed to load salary information",
        variant: "destructive"
      });
    }
  };

  const downloadPayslip = async (format: 'txt' | 'pdf' = 'pdf') => {
    if (!salaryInfo) {
      toast({
        title: "Error",
        description: "No payroll record found for this period",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (format === 'txt') {
        // Generate text payslip
        const payslipContent = `
PAYSLIP
========================================
Employee: ${salaryInfo.employee_name}
Employee ID: ${salaryInfo.employee_id}
Period: ${getMonthName(salaryInfo.month)} ${salaryInfo.year}
========================================

EARNINGS:
Base Salary: ₦${salaryInfo.base_salary.toFixed(2)}
Gross Salary: ₦${salaryInfo.gross_salary.toFixed(2)}

DEDUCTIONS:
Tax: ₦${salaryInfo.deductions.tax.toFixed(2)}
Lateness Penalty: ₦${salaryInfo.deductions.lateness_penalty.toFixed(2)}
Total Deductions: ₦${salaryInfo.deductions.total.toFixed(2)}

NET PAY: ₦${salaryInfo.net_salary.toFixed(2)}

ATTENDANCE SUMMARY:
Days Worked: ${salaryInfo.attendance.days_worked}
Late Days: ${salaryInfo.attendance.late_days}
Total Late Minutes: ${salaryInfo.attendance.total_late_minutes}

========================================
Generated on: ${new Date().toLocaleString()}
`;
        
        const blob = new Blob([payslipContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${salaryInfo.employee_id}_${selectedMonth}_${selectedYear}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate PDF using HTML
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Payslip - ${salaryInfo.employee_name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; color: #2563eb; }
                .info-section { margin-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
                .info-item { padding: 5px; }
                .label { font-weight: bold; color: #666; }
                .value { color: #000; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f4f4f4; font-weight: bold; }
                .total-row { font-weight: bold; background-color: #e8f4f8; }
                .net-pay { background-color: #2563eb; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
                .net-pay .amount { font-size: 24px; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PAYSLIP</h1>
                <p>${getMonthName(salaryInfo.month)} ${salaryInfo.year}</p>
              </div>
              
              <div class="info-section">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Employee Name:</span>
                    <span class="value">${salaryInfo.employee_name}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Employee ID:</span>
                    <span class="value">${salaryInfo.employee_id}</span>
                  </div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>EARNINGS</th>
                    <th style="text-align: right;">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Base Salary</td>
                    <td style="text-align: right;">${salaryInfo.base_salary.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Gross Salary</td>
                    <td style="text-align: right;">${salaryInfo.gross_salary.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <table>
                <thead>
                  <tr>
                    <th>DEDUCTIONS</th>
                    <th style="text-align: right;">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tax</td>
                    <td style="text-align: right;">${salaryInfo.deductions.tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Lateness Penalty</td>
                    <td style="text-align: right;">${salaryInfo.deductions.lateness_penalty.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total Deductions</td>
                    <td style="text-align: right;">${salaryInfo.deductions.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="net-pay">
                <div>NET PAY</div>
                <div class="amount">₦${salaryInfo.net_salary.toFixed(2)}</div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th colspan="2">ATTENDANCE SUMMARY</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Days Worked</td>
                    <td style="text-align: right;">${salaryInfo.attendance.days_worked}</td>
                  </tr>
                  <tr>
                    <td>Late Days</td>
                    <td style="text-align: right;">${salaryInfo.attendance.late_days}</td>
                  </tr>
                  <tr>
                    <td>Total Late Minutes</td>
                    <td style="text-align: right;">${salaryInfo.attendance.total_late_minutes}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="footer">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Generated by HenotaceAI</p>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        }
      }
      
      toast({
        title: "Success",
        description: `Payslip ${format === 'pdf' ? 'opened for printing/saving as PDF' : 'downloaded'} successfully`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive"
      });
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error("Unable to retrieve your location"));
        }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      setClockingIn(true);
      setLocationStatus("Getting location...");
      
      const location = await getLocation();
      const data = await apiPost("business/staff/clock/", { 
        action: "clock_in",
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      // Update location status
      if (data.location) {
        setWithinPremises(data.location.within_premises);
        if (data.location.within_premises) {
          setLocationStatus("✓ Within premises");
        } else if (data.location.distance_from_premises) {
          setLocationStatus(`⚠ ${Math.round(data.location.distance_from_premises)}m from premises`);
        }
      }
      
      toast({ title: "Success", description: data.message || "Clocked in successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to clock in", variant: "destructive" });
      setLocationStatus("");
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockingOut(true);
      setLocationStatus("Getting location...");
      
      const location = await getLocation();
      const data = await apiPost("business/staff/clock/", { 
        action: "clock_out",
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      // Update location status
      if (data.location) {
        setWithinPremises(data.location.within_premises);
        if (data.location.within_premises) {
          setLocationStatus("✓ Within premises");
        } else if (data.location.distance_from_premises) {
          setLocationStatus(`⚠ ${Math.round(data.location.distance_from_premises)}m from premises`);
        }
      }
      
      toast({ title: "Success", description: data.message || "Clocked out successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to clock out", variant: "destructive" });
      setLocationStatus("");
    } finally {
      setClockingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Unable to load staff profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/business-login")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {/* Clock In/Out */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("attendance");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Clock className="w-5 h-5" />
                    Clock In/Out
                  </Button>
                  
                  {/* Salary */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("salary");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Wallet className="w-5 h-5" />
                    Salary
                  </Button>
                  
                  <div className="border-t my-4"></div>
                  
                  {/* Logout */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      localStorage.clear();
                      navigate("/business-login");
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-xl lg:text-2xl font-bold">{staffProfile?.business?.name || 'Business Dashboard'}</h1>
              <p className="text-sm text-muted-foreground">
                {staffProfile?.user?.first_name} {staffProfile?.user?.last_name} - {staffProfile?.position || 'Staff'}
              </p>
            </div>
            
            {/* Desktop Logout Button */}
            <Button variant="outline" className="hidden lg:flex" onClick={() => {
              localStorage.clear();
              navigate("/business-login");
            }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Clock In/Out</TabsTrigger>
            {staffProfile.can_manage_sales && <TabsTrigger value="salary">Salary</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Clock In/Out Card - Always visible */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("attendance")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clock In/Out</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Attendance</div>
                  <p className="text-xs text-muted-foreground">Track your time</p>
                </CardContent>
              </Card>

              {/* Sales/POS - Only if can_manage_sales */}
              {staffProfile.can_manage_sales && (
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/pos")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Point of Sale</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">POS</div>
                    <p className="text-xs text-muted-foreground">Process sales</p>
                  </CardContent>
                </Card>
              )}

              {/* Inventory - Only if can_manage_inventory */}
              {staffProfile.can_manage_inventory && (
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/business/products")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Products</div>
                    <p className="text-xs text-muted-foreground">Manage inventory</p>
                  </CardContent>
                </Card>
              )}

              {/* Reports - Only if can_view_reports */}
              {staffProfile.can_view_reports && (
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/business/reports")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reports</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">View Reports</div>
                    <p className="text-xs text-muted-foreground">Business analytics</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="font-medium">{staffProfile.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{staffProfile.department || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium">{staffProfile.position || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clock In/Out</CardTitle>
                <CardDescription>Track your attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1" 
                      onClick={handleClockIn} 
                      disabled={clockingIn || withinPremises === false}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {clockingIn ? "Clocking In..." : "Clock In"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={handleClockOut} 
                      disabled={clockingOut || withinPremises === false}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {clockingOut ? "Clocking Out..." : "Clock Out"}
                    </Button>
                  </div>
                  {withinPremises === false && (
                    <div className="text-center text-sm text-red-600 font-medium">
                      <p>⚠ You must be within company premises to clock in/out</p>
                    </div>
                  )}
                  {locationStatus && (
                    <div className={`text-center text-sm font-medium ${locationStatus.includes('✓') ? 'text-green-600' : locationStatus.includes('⚠') ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      <p>{locationStatus}</p>
                    </div>
                  )}
                  
                  <Dialog open={showAbsenceDialog} onOpenChange={setShowAbsenceDialog}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="w-full">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Request Absence
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Absence</DialogTitle>
                        <DialogDescription>
                          Submit a request for time off. Your manager will review and approve/reject it.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="absence_type">Absence Type</Label>
                          <Select
                            value={absenceForm.absence_type}
                            onValueChange={(value) => setAbsenceForm({...absenceForm, absence_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sick_leave">Sick Leave</SelectItem>
                              <SelectItem value="annual_leave">Annual Leave</SelectItem>
                              <SelectItem value="personal_leave">Personal Leave</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                              id="start_date"
                              type="date"
                              value={absenceForm.start_date}
                              onChange={(e) => setAbsenceForm({...absenceForm, start_date: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                              id="end_date"
                              type="date"
                              value={absenceForm.end_date}
                              onChange={(e) => setAbsenceForm({...absenceForm, end_date: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            id="reason"
                            placeholder="Please provide a reason for your absence..."
                            value={absenceForm.reason}
                            onChange={(e) => setAbsenceForm({...absenceForm, reason: e.target.value})}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbsenceDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAbsenceRequest}>
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.slice(0, 5).map((record: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString() : 'N/A'} - 
                            {record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : 'Not clocked out'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${record.is_late ? 'text-red-600' : 'text-green-600'}`}>
                            {record.is_late ? 'Late' : 'On Time'}
                          </span>
                          {record.is_late && record.late_minutes && (
                            <p className="text-xs text-muted-foreground">{record.late_minutes} mins late</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attendance records yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Absence Requests</CardTitle>
                <CardDescription>View your leave requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {absenceRequests.length > 0 ? (
                  <div className="space-y-3">
                    {absenceRequests.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{request.absence_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{request.total_days} day(s)</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                        {request.review_notes && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium">Admin Notes:</p>
                            <p className="text-xs text-muted-foreground">{request.review_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No absence requests yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {staffProfile.can_manage_sales && (
            <TabsContent value="salary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Information</CardTitle>
                  <CardDescription>View your salary breakdown and download payslips</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Month</label>
                      <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Year</label>
                      <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {salaryInfo ? (
                    <>
                      <div className="border rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-lg">Earnings</h3>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Salary:</span>
                          <span className="font-medium">₦{salaryInfo.base_salary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Gross Salary:</span>
                          <span className="font-semibold">₦{salaryInfo.gross_salary.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Deductions</h3>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-xs h-auto p-0"
                            onClick={() => navigate('/staff-tax-information')}
                          >
                            View Tax Details →
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PAYE Tax:</span>
                          <span className="font-medium">₦{salaryInfo.deductions.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lateness Penalty:</span>
                          <span className="font-medium">₦{salaryInfo.deductions.lateness_penalty.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Total Deductions:</span>
                          <span className="font-semibold">₦{salaryInfo.deductions.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-primary/5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Net Salary:</span>
                          <span className="font-bold text-2xl text-primary">₦{salaryInfo.net_salary.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold">Attendance Summary</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{salaryInfo.attendance.days_worked}</p>
                            <p className="text-xs text-muted-foreground">Days Worked</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">{salaryInfo.attendance.late_days}</p>
                            <p className="text-xs text-muted-foreground">Late Days</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{salaryInfo.attendance.total_late_minutes}</p>
                            <p className="text-xs text-muted-foreground">Late Minutes</p>
                          </div>
                        </div>
                      </div>

                      <Button onClick={() => downloadPayslip('pdf')} className="w-full">
                        <File className="w-4 h-4 mr-2" />
                        Download as PDF
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-sm text-muted-foreground">No payroll record found for {getMonthName(selectedMonth)} {selectedYear}</p>
                      <p className="text-xs text-muted-foreground">
                        This could mean:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• No salary structure has been configured for your position</li>
                        <li>• Payroll has not been processed for this period yet</li>
                        <li>• You may not have attendance records for this month</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-4">
                        Please contact your HR department if you believe this is an error.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
