import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, ShoppingCart, Package, Users, DollarSign, Calendar, Download, FileText, File, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";

interface ReportData {
  sales: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  products: {
    total: number;
    low_stock: number;
  };
  customers: {
    total: number;
    new_this_month: number;
  };
  staff: {
    total: number;
    active: number;
  };
}

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [canViewReports, setCanViewReports] = useState<boolean | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || '';
    if (role === 'business_staff' || role === 'staff') {
      apiGet('business/staff/me/')
        .then((data: any) => {
          const allowed = !!data?.staff?.can_view_reports;
          setCanViewReports(allowed);
          if (!allowed) {
            toast({ title: "Access denied", description: "You don't have permission to view reports", variant: "destructive" });
            navigate('/business-staff-dashboard');
          }
        })
        .catch(() => {
          setCanViewReports(false);
          toast({ title: "Access denied", description: "You don't have permission to view reports", variant: "destructive" });
          navigate('/business-staff-dashboard');
        });
    } else {
      setCanViewReports(true);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (canViewReports) {
      loadReportData();
    }
  }, [dateRange, canViewReports]);

  const loadReportData = async () => {
    if (canViewReports === false) return;
    try {
      setLoading(true);
      const data = await apiGet("business/dashboard/");
      
      // Transform dashboard data into report format
      const dashboard = data.dashboard || {};
      setReportData({
        sales: {
          today: dashboard.today?.sales_count || 0,
          week: dashboard.today?.sales_count || 0,
          month: dashboard.today?.sales_count || 0,
          year: dashboard.today?.sales_count || 0,
        },
        revenue: {
          today: dashboard.today?.revenue || 0,
          week: dashboard.today?.revenue || 0,
          month: dashboard.this_month?.revenue || 0,
          year: dashboard.this_month?.revenue || 0,
        },
        products: {
          total: dashboard.inventory?.total_products || 0,
          low_stock: dashboard.inventory?.low_stock_count || 0,
        },
        customers: {
          total: dashboard.customers?.count || 0,
          new_this_month: 0,
        },
        staff: {
          total: dashboard.staff?.count || 0,
          active: dashboard.staff?.count || 0,
        },
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load report data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow && reportData) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Business Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #2563eb; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .stat-label { font-size: 12px; color: #666; margin-bottom: 5px; }
            .stat-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BUSINESS REPORT</h1>
            <p>Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Sales & Revenue</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Sales</div>
                <div class="stat-value">${reportData.sales[dateRange as keyof typeof reportData.sales]}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${formatCurrency(reportData.revenue[dateRange as keyof typeof reportData.revenue])}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Inventory</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Products</div>
                <div class="stat-value">${reportData.products.total}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value">${reportData.products.low_stock}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">People</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Customers</div>
                <div class="stat-value">${reportData.customers.total}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Staff</div>
                <div class="stat-value">${reportData.staff.total}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated by HenotaceAI</p>
            <p>© ${new Date().getFullYear()} Henotace Business Management</p>
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
    toast({ title: "Success", description: "Report opened for printing/saving as PDF" });
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    const csvContent = [
      ['Business Report'],
      [`Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [''],
      ['Category', 'Metric', 'Value'],
      ['Sales', 'Total Sales', reportData.sales[dateRange as keyof typeof reportData.sales]],
      ['Revenue', 'Total Revenue', reportData.revenue[dateRange as keyof typeof reportData.revenue]],
      ['Products', 'Total Products', reportData.products.total],
      ['Products', 'Low Stock Items', reportData.products.low_stock],
      ['Customers', 'Total Customers', reportData.customers.total],
      ['Customers', 'New This Month', reportData.customers.new_this_month],
      ['Staff', 'Total Staff', reportData.staff.total],
      ['Staff', 'Active Staff', reportData.staff.active],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Business_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "CSV report downloaded successfully" });
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    // Create Excel-compatible HTML table
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Business Report</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #2563eb; color: white; font-weight: bold; padding: 10px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .header { font-size: 18px; font-weight: bold; }
          .subheader { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="3" class="header">Business Report</td></tr>
          <tr><td colspan="3" class="subheader">Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}</td></tr>
          <tr><td colspan="3" class="subheader">Generated: ${new Date().toLocaleDateString()}</td></tr>
          <tr><td colspan="3"></td></tr>
          <tr>
            <th>Category</th>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td rowspan="2">Sales & Revenue</td>
            <td>Total Sales</td>
            <td>${reportData.sales[dateRange as keyof typeof reportData.sales]}</td>
          </tr>
          <tr>
            <td>Total Revenue</td>
            <td>${formatCurrency(reportData.revenue[dateRange as keyof typeof reportData.revenue])}</td>
          </tr>
          <tr>
            <td rowspan="2">Products</td>
            <td>Total Products</td>
            <td>${reportData.products.total}</td>
          </tr>
          <tr>
            <td>Low Stock Items</td>
            <td>${reportData.products.low_stock}</td>
          </tr>
          <tr>
            <td rowspan="2">Customers</td>
            <td>Total Customers</td>
            <td>${reportData.customers.total}</td>
          </tr>
          <tr>
            <td>New This Month</td>
            <td>${reportData.customers.new_this_month}</td>
          </tr>
          <tr>
            <td rowspan="2">Staff</td>
            <td>Total Staff</td>
            <td>${reportData.staff.total}</td>
          </tr>
          <tr>
            <td>Active Staff</td>
            <td>${reportData.staff.active}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Business_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Excel report downloaded successfully" });
  };

  const reportCards = [
    {
      title: "Total Sales",
      value: reportData?.sales[dateRange as keyof typeof reportData.sales] || 0,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(reportData?.revenue[dateRange as keyof typeof reportData.revenue] || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Products",
      value: reportData?.products.total || 0,
      subtitle: `${reportData?.products.low_stock || 0} low stock`,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Customers",
      value: reportData?.customers.total || 0,
      subtitle: `${reportData?.customers.new_this_month || 0} new this month`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Staff",
      value: reportData?.staff.total || 0,
      subtitle: `${reportData?.staff.active || 0} active`,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const reportTypes = [
    {
      title: "Sales Report",
      description: "Detailed sales transactions and performance",
      icon: ShoppingCart,
      action: () => navigate('/business/sales-details'),
    },
    {
      title: "Inventory Report",
      description: "Stock levels, low stock alerts, and product performance",
      icon: Package,
      action: () => navigate('/business/products'),
    },
    {
      title: "Customer Report",
      description: "Customer analytics and purchase history",
      icon: Users,
      action: () => navigate('/business/customers'),
    },
    {
      title: "Staff Report",
      description: "Staff performance and attendance records",
      icon: Users,
      action: () => navigate('/business/staff'),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/business-admin-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Business Reports</h1>
            <p className="text-muted-foreground">View and analyze your business performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Report Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Select a report type to view detailed information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report, index) => {
                  const Icon = report.icon;
                  return (
                    <Card key={index} className="cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={report.action}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{report.title}</CardTitle>
                            <CardDescription className="text-xs">{report.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>Download reports in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={exportToPDF} disabled={!reportData}>
                  <File className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" onClick={exportToCSV} disabled={!reportData}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" onClick={exportToExcel} disabled={!reportData}>
                  <Table className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Select an export format to download your business report
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
