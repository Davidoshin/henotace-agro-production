import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
const Home = lazy(() => import("./pages/Home"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const ManageAccount = lazy(() => import("./pages/ManageAccount"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const BusinessLogin = lazy(() => import("./pages/BusinessLogin"));
const AgroFarmsPage = lazy(() => import("./pages/agro/AgroFarmsPage"));
const AgroProducePage = lazy(() => import("./pages/agro/AgroProducePage"));
const AgroInputsPage = lazy(() => import("./pages/agro/AgroInputsPage"));
const AgroSuppliersPage = lazy(() => import("./pages/agro/AgroSuppliersPage"));
const AgroExpensesPage = lazy(() => import("./pages/agro/AgroExpensesPage"));
const AgroSalesPage = lazy(() => import("./pages/agro/AgroSalesPage"));
const AgroCustomersPage = lazy(() => import("./pages/agro/AgroCustomersPage"));
const AgroServicesPage = lazy(() => import("./pages/agro/AgroServicesPage"));
const AgroStaffPage = lazy(() => import("./pages/agro/AgroStaffPage"));
const AgroAccountPage = lazy(() => import("./pages/agro/AgroAccountPage"));
const AgroTaxDashboard = lazy(() => import("./pages/agro/AgroTaxDashboard"));
const BusinessSignup = lazy(() => import("./pages/BusinessSignup"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const BusinessPlatformAdmin = lazy(() => import("./components/admin/BusinessPlatformAdmin"));
const POS = lazy(() => import("./pages/POS"));
const BusinessSettings = lazy(() => import("./pages/BusinessSettings"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const StaffAttendance = lazy(() => import("./pages/StaffDashboard"));
const HRPayroll = lazy(() => import("./pages/HRPayroll"));
const ProductManagement = lazy(() => import("./pages/ProductManagement"));
const CustomerManagement = lazy(() => import("./pages/CustomerManagement"));
const SalesManagement = lazy(() => import("./pages/SalesManagement"));
const Receipt = lazy(() => import("./pages/Receipt"));
const SalesDetails = lazy(() => import("./pages/SalesDetails"));
const Reports = lazy(() => import("./pages/Reports"));
const ReturnsManagement = lazy(() => import("./pages/ReturnsManagement"));
const PaymentVerification = lazy(() => import("./pages/PaymentVerification"));
const WalletDepositVerification = lazy(() => import("./pages/WalletDepositVerification"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PurchaseVerification = lazy(() => import("./pages/PurchaseVerification"));
const CreditPaymentVerification = lazy(() => import("./pages/CreditPaymentVerification"));
const SupplierManagement = lazy(() => import("./pages/SupplierManagement"));
const BusinessAnalysis = lazy(() => import("./pages/BusinessAnalysis"));
const ExpenseTracker = lazy(() => import("./pages/ExpenseTracker"));
const TaxCompliance = lazy(() => import("./components/dashboard/TaxCompliance"));
const StaffTaxInformation = lazy(() => import("./components/dashboard/StaffTaxInformation"));
const ProfitAnalysis = lazy(() => import("./pages/ProfitAnalysis"));
const StockHistoryPage = lazy(() => import("./pages/StockHistoryPage"));
const BusinessDeliveriesPage = lazy(() => import("./pages/BusinessDeliveriesPage"));
const AllServicesPage = lazy(() => import("./pages/AllServicesPage"));
const BusinessOrders = lazy(() => import("./pages/BusinessOrders"));
const CreditManagementPage = lazy(() => import("./pages/CreditManagementPage"));
const ProfessionalServices = lazy(() => import("./pages/ProfessionalServices"));
const ServicesDashboard = lazy(() => import("./pages/ServicesDashboard"));
const BusinessSlugRouter = lazy(() => import("./components/BusinessSlugRouter"));
const PublicStorePage = lazy(() => import("./pages/PublicStorePage"));
const PublicServicesPage = lazy(() => import("./pages/PublicServicesPage"));
const ServiceClientAuth = lazy(() => import("./pages/ServiceClientAuth"));
const ServiceClientDashboard = lazy(() => import("./pages/ServiceClientDashboard"));
const ServiceWalletVerify = lazy(() => import("./pages/ServiceWalletVerify"));
const DeliveryTracking = lazy(() => import("./pages/DeliveryTracking"));
const DeliveryOrders = lazy(() => import("./pages/DeliveryOrders"));
const DeliveryOrderDetails = lazy(() => import("./pages/DeliveryOrderDetails"));
const DeliveryOrderEdit = lazy(() => import("./pages/DeliveryOrderEdit"));
const ShippingManagement = lazy(() => import("./pages/ShippingManagement"));
const ShipmentDetail = lazy(() => import("./pages/ShipmentDetail"));
const ShipmentEdit = lazy(() => import("./pages/ShipmentEdit"));
const CustomerTracking = lazy(() => import("./pages/CustomerTracking"));
const PublicTracking = lazy(() => import("./pages/PublicTracking"));
const BRMDashboard = lazy(() => import("./pages/BRMDashboard"));
const BRMLogin = lazy(() => import("./pages/BRMLogin"));
const SecurityLogin = lazy(() => import("./pages/SecurityLogin"));
const SOCDashboard = lazy(() => import("./pages/SOCDashboard"));
const ServiceSettings = lazy(() => import("./pages/ServiceSettings"));
const ServiceMoreOptions = lazy(() => import("./pages/ServiceMoreOptions"));
const ServiceInvoices = lazy(() => import("./pages/ServiceInvoices"));
const ServiceClients = lazy(() => import("./pages/ServiceClients"));
const ServicesList = lazy(() => import("./pages/ServicesList"));
const ServiceBlog = lazy(() => import("./pages/ServiceBlog"));
const ServiceProjects = lazy(() => import("./pages/ServiceProjects"));
const ServiceRequests = lazy(() => import("./pages/ServiceRequests"));
const ServiceBookings = lazy(() => import("./pages/ServiceBookings"));
const ServiceInquiries = lazy(() => import("./pages/ServiceInquiries"));
const ServiceAnnouncements = lazy(() => import("./pages/ServiceAnnouncements"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ServiceAnalytics = lazy(() => import("./pages/ServiceAnalytics"));
const ServiceRevenueReports = lazy(() => import("./pages/ServiceRevenueReports"));
const ServiceStats = lazy(() => import("./pages/ServiceStats"));
const ServiceEmailTemplates = lazy(() => import("./pages/ServiceEmailTemplates"));
const ServiceLeads = lazy(() => import("./pages/ServiceLeads"));
const ServicePortfolio = lazy(() => import("./pages/ServicePortfolio"));
const ServiceReviews = lazy(() => import("./pages/ServiceReviews"));
const ServiceExpenseTracker = lazy(() => import("./pages/ServiceExpenseTracker"));
const ClientMessagesPage = lazy(() => import("./pages/ClientMessagesPage"));
const BusinessGoals = lazy(() => import("./pages/BusinessGoals"));
const FinancialProjections = lazy(() => import("./pages/FinancialProjections"));
const BusinessProposals = lazy(() => import("./pages/BusinessProposals"));
const HenotaceAcademy = lazy(() => import("./components/academy/HenotaceAcademy"));
const SessionAction = lazy(() => import("./pages/SessionAction"));
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/auth/session-action" element={<SessionAction />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/business-login" element={<BusinessLogin />} />
            <Route path="/agro-login" element={<BusinessLogin />} />
            <Route path="/security-login" element={<SecurityLogin />} />
            <Route path="/soc-dashboard" element={<SOCDashboard />} />
            <Route path="/signup" element={<BusinessSignup />} />
            {/* Business dashboard routes */}
            <Route path="/customer-dashboard" element={<DashboardLayout />} />
            <Route path="/business-admin-dashboard" element={<DashboardLayout />} />
            <Route path="/business-staff-dashboard" element={<DashboardLayout />} />
            <Route path="/agro-dashboard" element={<DashboardLayout />} />
            <Route path="/agro/farms" element={<AgroFarmsPage />} />
            <Route path="/agro/produce" element={<AgroProducePage />} />
            <Route path="/agro/inputs" element={<AgroInputsPage />} />
            <Route path="/agro/suppliers" element={<AgroSuppliersPage />} />
            <Route path="/agro/expenses" element={<AgroExpensesPage />} />
            <Route path="/agro/sales" element={<AgroSalesPage />} />
            <Route path="/agro/customers" element={<AgroCustomersPage />} />
            <Route path="/agro/services" element={<AgroServicesPage />} />
            <Route path="/agro/staff" element={<AgroStaffPage />} />
            <Route path="/agro/account" element={<AgroAccountPage />} />
            <Route path="/agro/tax" element={<AgroTaxDashboard />} />
            <Route path="/staff-attendance" element={<StaffAttendance />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/business/settings" element={<BusinessSettings />} />
            <Route path="/business/staff" element={<StaffManagement />} />
            <Route path="/business/hr-payroll" element={<HRPayroll />} />
            <Route path="/business/products" element={<ProductManagement />} />
            <Route path="/business/customers" element={<CustomerManagement />} />
            <Route path="/business/suppliers" element={<SupplierManagement />} />
            <Route path="/business/sales" element={<SalesManagement />} />
            <Route path="/business/sales-details" element={<SalesDetails />} />
            <Route path="/sales-management" element={<SalesManagement />} />
            <Route path="/business/receipt/:id" element={<Receipt />} />
            <Route path="/business/reports" element={<Reports />} />
            <Route path="/business/returns" element={<ReturnsManagement />} />
            <Route path="/business/analysis" element={<BusinessAnalysis />} />
            <Route path="/business/expenses" element={<ExpenseTracker />} />
            <Route path="/business/tax-compliance" element={<TaxCompliance />} />
            <Route path="/business/my-tax" element={<StaffTaxInformation />} />
            <Route path="/staff-tax-information" element={<StaffTaxInformation />} />
            <Route path="/business/profit-analysis" element={<ProfitAnalysis />} />
            <Route path="/business/stock-history" element={<StockHistoryPage />} />
            <Route path="/business/deliveries" element={<BusinessDeliveriesPage />} />
            <Route path="/business/all-services" element={<AllServicesPage />} />
            <Route path="/business/orders" element={<BusinessOrders />} />
            <Route path="/business/credit" element={<CreditManagementPage />} />
            <Route path="/business/professional-services" element={<ProfessionalServices />} />
            <Route path="/business/academy" element={<HenotaceAcademy />} />
            <Route path="/business/services-dashboard" element={<ServicesDashboard />} />
            <Route path="/business/wallet" element={<ManageAccount />} />
            
            {/* Public Store Page - Unique URL for each business that can be shared with customers */}
            <Route path="/store/:slug" element={<PublicStorePage />} />
            
            {/* Public Services Page - Unique URL for service-based businesses */}
            <Route path="/services/:slug" element={<PublicServicesPage />} />
            <Route path="/services/:slug/login" element={<ServiceClientAuth />} />
            <Route path="/services/:slug/dashboard" element={<ServiceClientDashboard />} />
            <Route path="/services/:slug/wallet/verify" element={<ServiceWalletVerify />} />
            
            {/* Delivery Tracking - Public tracking page */}
            <Route path="/track" element={<DeliveryTracking />} />
            <Route path="/track/:trackingCode" element={<DeliveryTracking />} />
            
            {/* Public Shipment Tracking - Simple public page */}
            <Route path="/shipment-track/:trackingCode" element={<PublicTracking />} />
            
            {/* Delivery Orders Management */}
            <Route path="/delivery-orders" element={<DeliveryOrders />} />
            <Route path="/delivery-orders/:id" element={<DeliveryOrderDetails />} />
            <Route path="/delivery-orders/:id/edit" element={<DeliveryOrderEdit />} />
            
            {/* Shipping Management */}
            <Route path="/shipping-management" element={<ShippingManagement />} />
            
            {/* Shipment Detail and Edit */}
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/shipments/:id/edit" element={<ShipmentEdit />} />
            
            {/* Customer Tracking */}
            <Route path="/customer-tracking" element={<CustomerTracking />} />
            
            {/* Service Settings */}
            <Route path="/service-settings" element={<ServiceSettings />} />
            <Route path="/service-more-options" element={<ServiceMoreOptions />} />
            
            {/* Service-based business routes */}
            <Route path="/business/clients" element={<ServiceClients />} />
            <Route path="/business/clients/new" element={<ServiceClients />} />
            <Route path="/business/invoices" element={<ServiceInvoices />} />
            <Route path="/business/invoices/:id" element={<ServiceInvoices />} />
            <Route path="/business/invoices/:id/edit" element={<ServiceInvoices />} />
            <Route path="/business/services" element={<ServicesList />} />
            <Route path="/business/tax" element={<StaffTaxInformation />} />
            <Route path="/business/account" element={<BusinessSettings />} />
            <Route path="/business/service-requests" element={<ServiceRequests />} />
            <Route path="/business/bookings" element={<ServiceBookings />} />
            <Route path="/business/inquiries" element={<ServiceInquiries />} />
            <Route path="/business/team-members" element={<StaffManagement />} />
            <Route path="/business/testimonials" element={<ServiceSettings />} />
            <Route path="/business/analytics" element={<ServiceAnalytics />} />
            <Route path="/business/reports/revenue" element={<ServiceRevenueReports />} />
            <Route path="/business/reports/services" element={<ServiceStats />} />
            <Route path="/business/notifications" element={<ManageAccount />} />
            <Route path="/business/email-templates" element={<ServiceEmailTemplates />} />
            <Route path="/business/leads" element={<ServiceLeads />} />
            <Route path="/business/portfolio" element={<ServicePortfolio />} />
            <Route path="/business/reviews" element={<ServiceReviews />} />
            <Route path="/business/service-expenses" element={<ServiceExpenseTracker />} />
            <Route path="/business/messages" element={<ClientMessagesPage />} />
            <Route path="/business/client-messages" element={<ClientMessagesPage />} />
            <Route path="/business/announcements" element={<ServiceAnnouncements />} />
            <Route path="/business-settings" element={<BusinessSettings />} />
            <Route path="/settings" element={<BusinessSettings />} />
            <Route path="/help" element={<BusinessSettings />} />
            <Route path="/business/schedule" element={<ServiceBookings />} />
            <Route path="/business/schedule/new" element={<ServiceBookings />} />
            <Route path="/business/transactions" element={<SalesManagement />} />
            <Route path="/business/projects" element={<ServiceProjects />} />
            <Route path="/business/projects/new" element={<ServiceProjects />} />
            <Route path="/business/projects/:id" element={<ServiceProjects />} />
            <Route path="/business/invoices/new" element={<ServiceInvoices />} />
            <Route path="/business/blog" element={<ServiceBlog />} />
            <Route path="/business/blog/:id/edit" element={<ServiceBlog />} />
            
            {/* Business Goals (for both product-based and service-based businesses) */}
            <Route path="/business/goals" element={<BusinessGoals />} />
            
            {/* Financial Projections (for both product-based and service-based businesses) */}
            <Route path="/business/financial-projections" element={<FinancialProjections />} />
            
            {/* Business Proposals (service-based businesses only) */}
            <Route path="/business/proposals" element={<BusinessProposals />} />
            
            {/* Client Portal - Dark Theme Dashboard */}
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-dashboard/:slug" element={<ClientDashboard />} />
            
            {/* BRM Staff Portal */}
            <Route path="/brm-login" element={<BRMLogin />} />
            <Route path="/brm-dashboard" element={<BRMDashboard />} />
            
            {/* Per-business unique URL (slug). Renders the same dashboard layout and
              stores the slug in localStorage so backend/API calls can use it when
              implemented. */}
            <Route path="/b/:slug/*" element={<BusinessSlugRouter />} />
            <Route path="/manage-account" element={<ManageAccount />} />
            <Route path="/payment/verify" element={<PaymentVerification />} />
            <Route path="/wallet/deposit/verify" element={<WalletDepositVerification />} />
            <Route path="/purchase/verify" element={<PurchaseVerification />} />
            <Route path="/credit/payment/verify" element={<CreditPaymentVerification />} />
            <Route 
              path="/henotacengadmin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']} redirectTo="/" showLogin={true}>
                  <BusinessPlatformAdmin />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
