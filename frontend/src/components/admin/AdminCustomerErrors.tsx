import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiGet, apiPatch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, Search, Filter, Eye, CheckCircle, Clock, 
  XCircle, Shield, AlertCircle, RefreshCw, ChevronDown,
  Monitor, Smartphone, Tablet, Globe, User, Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface CustomerError {
  id: number;
  error_type: string;
  error_type_display: string;
  severity: string;
  status: string;
  error_message: string;
  error_code?: string;
  url?: string;
  page_path?: string;
  http_method?: string;
  api_endpoint?: string;
  response_status?: number;
  user_email?: string;
  customer_name?: string;
  business_name?: string;
  ip_address?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_suspicious: boolean;
  security_notes?: string;
  stack_trace?: string;
  request_payload?: Record<string, unknown>;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface ErrorStats {
  total_errors: number;
  suspicious_count: number;
  new_count: number;
  investigating_count: number;
  critical_high_count: number;
  by_type: { error_type: string; count: number }[];
  by_severity: Record<string, number>;
  top_ips: { ip_address: string; count: number }[];
  errors_by_day: { date: string; count: number }[];
}

const AdminCustomerErrors = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<CustomerError[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [errorType, setErrorType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('new');  // Default to showing only unresolved errors
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [days, setDays] = useState('7');
  
  // Detail dialog
  const [selectedError, setSelectedError] = useState<CustomerError | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState<CustomerError | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (errorType !== 'all') params.append('error_type', errorType);
      if (severity !== 'all') params.append('severity', severity);
      if (status !== 'all') params.append('status', status);
      if (suspiciousOnly) params.append('is_suspicious', 'true');
      params.append('days', days);
      params.append('page', page.toString());
      
      const response = await apiGet(`/admin/customer-errors/?${params}`);
      setErrors(response.errors || []);
      setTotalCount(response.total_count || 0);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Error fetching customer errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer errors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet(`/admin/customer-errors/stats/?days=${days}`);
      setStats(response);
    } catch (error) {
      console.error('Error fetching error stats:', error);
    }
  };

  const fetchErrorDetail = async (errorId: number) => {
    setDetailLoading(true);
    try {
      const response = await apiGet(`/admin/customer-errors/${errorId}/`);
      setErrorDetail(response);
      setResolutionNotes(response.resolution_notes || '');
    } catch (error) {
      console.error('Error fetching error detail:', error);
      toast({
        title: 'Error',
        description: 'Failed to load error details',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const updateErrorStatus = async (errorId: number, newStatus: string) => {
    try {
      await apiPatch(`/admin/customer-errors/${errorId}/update/`, {
        status: newStatus,
        resolution_notes: resolutionNotes,
      });
      toast({
        title: 'Success',
        description: `Error marked as ${newStatus}`,
      });
      fetchErrors();
      fetchStats();
      if (errorDetail && errorDetail.id === errorId) {
        setErrorDetail({ ...errorDetail, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating error status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update error status',
        variant: 'destructive',
      });
    }
  };

  const flagAsSuspicious = async (errorId: number, isSuspicious: boolean) => {
    try {
      await apiPatch(`/admin/customer-errors/${errorId}/update/`, {
        is_suspicious: isSuspicious,
      });
      toast({
        title: 'Success',
        description: isSuspicious ? 'Error flagged as suspicious' : 'Suspicious flag removed',
      });
      fetchErrors();
      fetchStats();
    } catch (error) {
      console.error('Error flagging error:', error);
    }
  };

  useEffect(() => {
    fetchErrors();
    fetchStats();
  }, [page, days]);

  const handleSearch = () => {
    setPage(1);
    fetchErrors();
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (stat: string) => {
    switch (stat) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Errors</h2>
          <p className="text-muted-foreground">Monitor customer-facing issues proactively</p>
        </div>
        <Button onClick={() => { fetchErrors(); fetchStats(); }} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Error Log</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.new_count}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Investigating</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.investigating_count}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical/High</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical_high_count}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.suspicious_count > 0 ? 'border-red-500 bg-red-50' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspicious</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspicious_count}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Search bar - full width */}
          <div className="mb-4">
            <Input
              placeholder="Search by message, email, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          {/* Filter dropdowns - 2 per row on mobile, flexible on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-4">
            <Select value={errorType} onValueChange={setErrorType}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Error Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="frontend_error">Frontend Error</SelectItem>
                <SelectItem value="api_error">API Error</SelectItem>
                <SelectItem value="network_error">Network Error</SelectItem>
                <SelectItem value="login_failed">Login Failed</SelectItem>
                <SelectItem value="login_blocked">Login Blocked</SelectItem>
                <SelectItem value="page_error">Page Error</SelectItem>
                <SelectItem value="payment_failed">Payment Failed</SelectItem>
                <SelectItem value="permission_denied">Permission Denied</SelectItem>
                <SelectItem value="auth_expired">Auth Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={days} onValueChange={(v) => { setDays(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[130px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={suspiciousOnly ? 'default' : 'outline'}
              onClick={() => { setSuspiciousOnly(!suspiciousOnly); setPage(1); }}
              className="gap-2 col-span-2 md:col-span-1"
            >
              <Shield className="w-4 h-4" />
              Suspicious Only
            </Button>
            
            <Button onClick={handleSearch} className="col-span-2 md:col-span-1">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Error Log ({totalCount} errors)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No errors found for the selected filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    error.is_suspicious ? 'border-red-300 bg-red-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedError(error);
                    setDetailDialogOpen(true);
                    fetchErrorDetail(error.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <Badge className={getStatusColor(error.status)}>
                          {error.status}
                        </Badge>
                        <span className="font-medium">{error.error_type_display}</span>
                        {error.business_name && error.business_name !== 'Unknown Business' && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {error.business_name}
                          </Badge>
                        )}
                        {(!error.business_name || error.business_name === 'Unknown Business') && (error.user_email || error.customer_name) && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {error.user_email || error.customer_name}
                          </Badge>
                        )}
                        {error.is_suspicious && (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Suspicious
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {error.error_message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {error.user_email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {error.user_email}
                          </span>
                        )}
                        {error.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {error.ip_address}
                          </span>
                        )}
                        {error.device_type && (
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(error.device_type)}
                            {error.browser}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(error.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Error Details
              {errorDetail?.is_suspicious && (
                <Badge variant="destructive" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Suspicious
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              ID: {errorDetail?.id} • {errorDetail && formatDate(errorDetail.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : errorDetail ? (
              <div className="space-y-6">
                {/* Status and Severity */}
                <div className="flex gap-4">
                  <Badge className={getSeverityColor(errorDetail.severity)}>
                    {errorDetail.severity}
                  </Badge>
                  <Badge className={getStatusColor(errorDetail.status)}>
                    {errorDetail.status}
                  </Badge>
                  <span className="text-sm">{errorDetail.error_type_display}</span>
                </div>

                {/* Error Message */}
                <div>
                  <h4 className="font-semibold mb-2">Error Message</h4>
                  <p className="text-sm bg-muted p-3 rounded">{errorDetail.error_message}</p>
                </div>

                {/* Customer Info */}
                {(errorDetail.user_email || errorDetail.customer_name || errorDetail.business_name || errorDetail.customer?.email) && (
                  <div>
                    <h4 className="font-semibold mb-2">Customer Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {errorDetail.user_email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span> {errorDetail.user_email}
                        </div>
                      )}
                      {!errorDetail.user_email && errorDetail.customer?.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span> {errorDetail.customer.email}
                        </div>
                      )}
                      {errorDetail.customer_name && (
                        <div>
                          <span className="text-muted-foreground">Name:</span> {errorDetail.customer_name}
                        </div>
                      )}
                      {errorDetail.business_name && errorDetail.business_name !== 'Unknown Business' && (
                        <div>
                          <span className="text-muted-foreground">Business:</span> {errorDetail.business_name}
                        </div>
                      )}
                      {errorDetail.business_name === 'Unknown Business' && (errorDetail.user_email || errorDetail.customer?.email) && (
                        <div>
                          <span className="text-muted-foreground">User:</span> {errorDetail.user_email || errorDetail.customer?.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Context */}
                <div>
                  <h4 className="font-semibold mb-2">Request Context</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-3 rounded">
                    {errorDetail.url && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">URL:</span> {errorDetail.url}
                      </div>
                    )}
                    {errorDetail.api_endpoint && (
                      <div>
                        <span className="text-muted-foreground">Endpoint:</span> {errorDetail.http_method} {errorDetail.api_endpoint}
                      </div>
                    )}
                    {errorDetail.response_status && (
                      <div>
                        <span className="text-muted-foreground">Status:</span> {errorDetail.response_status}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="font-semibold mb-2">Client Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>{errorDetail.ip_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(errorDetail.device_type)}
                      <span>{errorDetail.device_type} • {errorDetail.browser} • {errorDetail.os}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notes */}
                {errorDetail.security_notes && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Notes
                    </h4>
                    <pre className="text-sm bg-red-50 p-3 rounded text-red-800 whitespace-pre-wrap">
                      {errorDetail.security_notes}
                    </pre>
                  </div>
                )}

                {/* Stack Trace */}
                {errorDetail.stack_trace && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Trace</h4>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-40">
                      {errorDetail.stack_trace}
                    </pre>
                  </div>
                )}

                {/* Resolution Notes */}
                <div>
                  <h4 className="font-semibold mb-2">Resolution Notes</h4>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about how this issue was resolved..."
                    rows={3}
                  />
                </div>
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => errorDetail && flagAsSuspicious(errorDetail.id, !errorDetail.is_suspicious)}
            >
              <Shield className="w-4 h-4 mr-2" />
              {errorDetail?.is_suspicious ? 'Remove Suspicious Flag' : 'Flag Suspicious'}
            </Button>
            <Button
              variant="outline"
              onClick={() => errorDetail && updateErrorStatus(errorDetail.id, 'investigating')}
              disabled={errorDetail?.status === 'investigating'}
            >
              <Clock className="w-4 h-4 mr-2" />
              Investigating
            </Button>
            <Button
              variant="outline"
              onClick={() => errorDetail && updateErrorStatus(errorDetail.id, 'ignored')}
              disabled={errorDetail?.status === 'ignored'}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Ignore
            </Button>
            <Button
              onClick={() => errorDetail && updateErrorStatus(errorDetail.id, 'resolved')}
              disabled={errorDetail?.status === 'resolved'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomerErrors;
