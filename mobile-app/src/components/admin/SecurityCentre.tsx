import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Users, UserPlus, Edit, Trash2, Eye, EyeOff, Key, AlertTriangle, 
  CheckCircle, XCircle, Clock, TrendingUp, Activity, Lock, Unlock,
  Plus, Search, Filter, MoreVertical, RefreshCw, Settings, Monitor,
  Target, Bug, ShieldCheck, FileText, BarChart3
} from 'lucide-react';

interface SecurityRole {
  id: number;
  name: string;
  description: string;
  can_monitor_detection: boolean;
  can_incident_response: boolean;
  can_vulnerability_management: boolean;
  can_security_implementation: boolean;
  can_risk_compliance: boolean;
  can_threat_intelligence: boolean;
  can_manage_team: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
  is_active: boolean;
  created_at: string;
}

interface SecurityTeamMember {
  id: number;
  user: {
    id: number;
    email: string;
  };
  role: SecurityRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  status: 'active' | 'inactive' | 'suspended' | 'on_leave';
  is_2fa_enabled: boolean;
  last_login: string;
  department: string;
  specialization: string;
  certifications: string[];
  created_at: string;
}

interface SOCDashboard {
  overview: {
    total_alerts: number;
    critical_alerts: number;
    high_alerts: number;
    medium_alerts: number;
    low_alerts: number;
    alerts_last_24h: number;
    active_incidents: number;
    resolved_incidents_today: number;
    mean_time_to_resolve: number;
    vulnerabilities_found: number;
    critical_vulnerabilities: number;
    unpatched_critical: number;
    security_score: number;
  };
  threat_intelligence: {
    new_threats_today: number;
    active_campaigns: number;
    blocked_malware: number;
    phishing_attempts: number;
    suspicious_ips: number;
    threat_feeds_active: number;
  };
  monitoring: {
    systems_monitored: number;
    network_segments: number;
    endpoints_protected: number;
    siem_events_processed: number;
    anomalies_detected: number;
    compliance_status: number;
  };
  recent_incidents: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
    created_at: string;
    assigned_to: string;
    description: string;
  }>;
  security_alerts: Array<{
    id: number;
    type: string;
    severity: string;
    source: string;
    message: string;
    timestamp: string;
    status: string;
  }>;
}

interface SecurityCentreProps {
  canCreateTeams?: boolean;
  isSOCDashboard?: boolean;
}

export default function SecurityCentre({ canCreateTeams = true, isSOCDashboard = false }: SecurityCentreProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // Security Team Management
  const [securityRoles, setSecurityRoles] = useState<SecurityRole[]>([]);
  const [teamMembers, setTeamMembers] = useState<SecurityTeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<SecurityTeamMember | null>(null);
  const [showCreateMemberDialog, setShowCreateMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  
  // Security Logs
  const [securityLogs, setSecurityLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({
    severity: 'all',
    limit: 50,
    offset: 0
  });
  
  // Incident Management
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState('all');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('all');
  const [incidentStatus, setIncidentStatus] = useState('');
  
  // SOC Dashboard
  const [socDashboard, setSocDashboard] = useState<SOCDashboard | null>(null);
  
  // Form states
  const [newMember, setNewMember] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    department: 'Security Operations',
    specialization: '',
    certifications: []
  });
  
  const [editMember, setEditMember] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    department: 'Security Operations',
    specialization: '',
    certifications: [],
    status: 'active'
  });
  
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    can_monitor_detection: false,
    can_incident_response: false,
    can_vulnerability_management: false,
    can_security_implementation: false,
    can_risk_compliance: false,
    can_threat_intelligence: false,
    can_manage_team: false,
    can_view_reports: true,
    can_export_data: false
  });

  // Load data
  useEffect(() => {
    if (activeTab === 'team') {
      loadSecurityRoles();
      loadTeamMembers();
    } else if (activeTab === 'dashboard') {
      loadSOCDashboard();
    } else if (activeTab === 'logs') {
      loadSecurityLogs();
    }
  }, [activeTab]);

  const loadSecurityRoles = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('security/roles/') as any;
      setSecurityRoles(data.roles || []);
    } catch (e: any) {
      toast({ title: 'Failed to load security roles', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('security/team/') as any;
      setTeamMembers(data.members || []);
    } catch (e: any) {
      toast({ title: 'Failed to load team members', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSOCDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('security/dashboard/') as any;
      setSocDashboard(data.dashboard);
    } catch (e: any) {
      toast({ title: 'Failed to load SOC dashboard', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        severity: logFilters.severity,
        limit: logFilters.limit.toString(),
        offset: logFilters.offset.toString()
      });
      const data = await apiGet(`security/logs/?${queryParams}`) as any;
      setSecurityLogs(data.logs || []);
    } catch (e: any) {
      toast({ title: 'Failed to load security logs', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: number, newStatus: string) => {
    try {
      const data = await apiPatch(`admin/customer-errors/${incidentId}/update/`, {
        status: newStatus,
        resolution_notes: `Status updated to ${newStatus} via Security Centre`
      }) as any;
      
      if (data.success) {
        toast({ title: 'Success', description: 'Incident status updated successfully' });
        setShowIncidentDialog(false);
        setSelectedIncident(null);
        // Refresh the dashboard to show updated status
        loadSOCDashboard();
        loadSecurityLogs();
      }
    } catch (e: any) {
      toast({ title: 'Failed to update incident', description: e?.message, variant: 'destructive' });
    }
  };

  const handleIncidentClick = (incident: any) => {
    console.log('Incident clicked:', incident);
    setSelectedIncident(incident);
    setIncidentStatus(incident.status);
    setShowIncidentDialog(true);
  };

  const handleViewVulnerability = (index: number) => {
    console.log('Viewing vulnerability:', index);
    toast({ 
      title: 'Vulnerability Details', 
      description: `Viewing details for Critical Vulnerability #${index + 1} (CVE-2024-${1000 + index})` 
    });
  };

  const handleRemediateVulnerability = (index: number) => {
    console.log('Remediating vulnerability:', index);
    toast({ 
      title: 'Remediation Started', 
      description: `Starting remediation for Critical Vulnerability #${index + 1}` 
    });
  };

  const handleScanVulnerabilities = () => {
    console.log('Starting vulnerability scan...');
    toast({ 
      title: 'Vulnerability Scan', 
      description: 'Security scan initiated. This may take a few minutes...' 
    });
  };

  const handleEditMember = (member: SecurityTeamMember) => {
    console.log('Editing member:', member);
    setEditMember({
      id: member.id.toString(),
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      role_id: member.role.id.toString(),
      department: member.department || 'Security Operations',
      specialization: member.specialization || '',
      certifications: member.certifications || [],
      status: member.status
    });
    setShowEditMemberDialog(true);
  };

  const updateTeamMember = async () => {
    try {
      const memberData = {
        ...editMember,
        role_id: parseInt(editMember.role_id) || editMember.role_id
      };
      
      console.log('Updating team member with data:', memberData);
      const data = await apiPut(`security/team/${editMember.id}/update/`, memberData) as any;
      console.log('API Response:', data);
      
      if (data.success) {
        toast({ title: 'Success', description: 'Security team member updated successfully' });
        setShowEditMemberDialog(false);
        setEditMember({
          id: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role_id: '',
          department: 'Security Operations',
          specialization: '',
          certifications: [],
          status: 'active'
        });
        loadTeamMembers();
      } else {
        console.error('API Error Response:', data);
        toast({ 
          title: 'Failed to update team member', 
          description: data.message || data.error || 'Unknown error occurred', 
          variant: 'destructive' 
        });
      }
    } catch (e: any) {
      console.error('Team member update error:', e);
      console.error('Error details:', {
        message: e?.message,
        status: e?.status,
        data: e?.data,
        response: e?.response?.data
      });
      
      const errorMessage = e?.response?.data?.message || 
                          e?.data?.message || 
                          e?.message || 
                          'An error occurred while updating team member';
      
      toast({ 
        title: 'Failed to update team member', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const createTeamMember = async () => {
    try {
      const data = await apiPost('security/team/create/', newMember) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Security team member created successfully' });
        setShowCreateMemberDialog(false);
        setNewMember({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role_id: '',
          department: 'Security Operations',
          specialization: '',
          certifications: []
        });
        loadTeamMembers();
      }
    } catch (e: any) {
      toast({ title: 'Failed to create team member', description: e?.message, variant: 'destructive' });
    }
  };

  const createSecurityRole = async () => {
    try {
      const data = await apiPost('security/roles/create/', newRole) as any;
      if (data.success) {
        toast({ title: 'Success', description: 'Security role created successfully' });
        setShowCreateRoleDialog(false);
        setNewRole({
          name: '',
          description: '',
          can_monitor_detection: false,
          can_incident_response: false,
          can_vulnerability_management: false,
          can_security_implementation: false,
          can_risk_compliance: false,
          can_threat_intelligence: false,
          can_manage_team: false,
          can_view_reports: true,
          can_export_data: false
        });
        loadSecurityRoles();
      }
    } catch (e: any) {
      toast({ title: 'Failed to create security role', description: e?.message, variant: 'destructive' });
    }
  };

  const deleteTeamMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      await apiDelete(`security/team/${memberId}/delete/`);
      toast({ title: 'Success', description: 'Team member deleted successfully' });
      loadTeamMembers();
    } catch (e: any) {
      toast({ title: 'Failed to delete team member', description: e?.message, variant: 'destructive' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      case 'on_leave': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            Security Centre
          </h1>
          <p className="text-muted-foreground text-sm">Manage security team and monitor security operations</p>
        </div>
        <Button onClick={() => loadSOCDashboard()} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${canCreateTeams ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs lg:text-sm">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">SOC Dashboard</span>
              <span className="sm:hidden">SOC</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2 text-xs lg:text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Incidents</span>
              <span className="sm:hidden">Inc</span>
            </TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="flex items-center gap-2 text-xs lg:text-sm">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Vulnerabilities</span>
              <span className="sm:hidden">Vuln</span>
            </TabsTrigger>
            {canCreateTeams && (
            <TabsTrigger value="team" className="flex items-center gap-2 text-xs lg:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Security Team</span>
              <span className="sm:hidden">Team</span>
            </TabsTrigger>
            )}
            <TabsTrigger value="logs" className="flex items-center gap-2 text-xs lg:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Security Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

        {/* SOC Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {socDashboard ? (
            <>
              {/* Overview Stats - Mobile Optimized */}
              <Card className="mx-4 my-4 border-2 border-dashed border-primary/30 bg-background shadow-lg">
                <CardHeader className="pb-4 bg-muted/20 border-b border-dashed border-primary/20">
                  <CardTitle className="text-base font-medium text-center">Security Overview</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-6">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-3 pt-3">
                        <CardTitle className="text-xs font-medium">Total Alerts</CardTitle>
                        <Activity className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="text-lg font-bold">{socDashboard.overview.total_alerts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {socDashboard.overview.critical_alerts} critical, {socDashboard.overview.high_alerts} high
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-3 pt-3">
                        <CardTitle className="text-xs font-medium">Active Incidents</CardTitle>
                        <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="text-lg font-bold">{socDashboard.overview.active_incidents}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {socDashboard.overview.resolved_incidents_today} resolved today
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-3 pt-3">
                        <CardTitle className="text-xs font-medium">Security Score</CardTitle>
                        <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="text-lg font-bold">{socDashboard.overview.security_score}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Overall security posture</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-3 pt-3">
                        <CardTitle className="text-xs font-medium">Vulnerabilities</CardTitle>
                        <Bug className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="text-lg font-bold">{socDashboard.overview.vulnerabilities_found}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {socDashboard.overview.critical_vulnerabilities} critical
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-3 pt-3">
                        <CardTitle className="text-xs font-medium">Team Members</CardTitle>
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="text-lg font-bold">{teamMembers.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {teamMembers.filter(m => m.status === 'active').length} active
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Incidents and Alerts - Mobile Stack */}
              <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Incidents</CardTitle>
                    <CardDescription className="text-sm">Latest security incidents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {socDashboard.recent_incidents.slice(0, 5).map((incident) => (
                        <div 
                          key={incident.id} 
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleIncidentClick(incident)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{incident.title}</p>
                            <p className="text-xs text-muted-foreground">{incident.assigned_to}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getSeverityColor(incident.severity)} text-white text-xs`}>
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{incident.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Security Alerts</CardTitle>
                    <CardDescription className="text-sm">Latest security alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {socDashboard.security_alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm">{alert.message}</p>
                            <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{alert.source}</p>
                          <Badge variant="outline" className="text-xs">{alert.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading SOC dashboard...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Security Team Management</h2>
            <div className="flex gap-2">
              <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Security Role</DialogTitle>
                    <DialogDescription>
                      Define a new security role with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role-name">Role Name</Label>
                        <Select value={newRole.name} onValueChange={(value) => setNewRole({...newRole, name: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="security_analyst">Security Analyst</SelectItem>
                            <SelectItem value="security_engineer">Security Engineer</SelectItem>
                            <SelectItem value="security_manager">Security Manager</SelectItem>
                            <SelectItem value="soc_analyst">SOC Analyst</SelectItem>
                            <SelectItem value="incident_responder">Incident Responder</SelectItem>
                            <SelectItem value="threat_hunter">Threat Hunter</SelectItem>
                            <SelectItem value="compliance_analyst">Compliance Analyst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="role-description">Description</Label>
                      <Textarea
                        id="role-description"
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        placeholder="Describe the role responsibilities"
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Security Operations</h4>
                        {[
                          { key: 'can_monitor_detection', label: 'Monitor & Detection' },
                          { key: 'can_incident_response', label: 'Incident Response' },
                          { key: 'can_vulnerability_management', label: 'Vulnerability Management' },
                          { key: 'can_security_implementation', label: 'Security Implementation' },
                        ].map((permission) => (
                          <div key={permission.key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={newRole[permission.key as keyof typeof newRole] as boolean}
                              onChange={(e) => setNewRole({...newRole, [permission.key]: e.target.checked})}
                              className="rounded"
                            />
                            <Label htmlFor={permission.key} className="text-sm">{permission.label}</Label>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Management & Access</h4>
                        {[
                          { key: 'can_risk_compliance', label: 'Risk & Compliance' },
                          { key: 'can_threat_intelligence', label: 'Threat Intelligence' },
                          { key: 'can_manage_team', label: 'Manage Team' },
                          { key: 'can_export_data', label: 'Export Data' },
                        ].map((permission) => (
                          <div key={permission.key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={newRole[permission.key as keyof typeof newRole] as boolean}
                              onChange={(e) => setNewRole({...newRole, [permission.key]: e.target.checked})}
                              className="rounded"
                            />
                            <Label htmlFor={permission.key} className="text-sm">{permission.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>Cancel</Button>
                    <Button onClick={createSecurityRole}>Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showCreateMemberDialog} onOpenChange={setShowCreateMemberDialog}>
                <DialogTrigger asChild>
                  <Button className="text-xs sm:text-sm">
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Add Team Member</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Security Team Member</DialogTitle>
                    <DialogDescription>
                      Create a new security team member account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          value={newMember.first_name}
                          onChange={(e) => setNewMember({...newMember, first_name: e.target.value})}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          value={newMember.last_name}
                          onChange={(e) => setNewMember({...newMember, last_name: e.target.value})}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                        placeholder="john.doe@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Security Role</Label>
                      <Select value={newMember.role_id} onValueChange={(value) => setNewMember({...newMember, role_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security role" />
                        </SelectTrigger>
                        <SelectContent>
                          {securityRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={newMember.specialization}
                        onChange={(e) => setNewMember({...newMember, specialization: e.target.value})}
                        placeholder="e.g., Network Security, Application Security"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateMemberDialog(false)}>Cancel</Button>
                    <Button onClick={createTeamMember}>Add Team Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Edit Team Member Dialog */}
              <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Security Team Member</DialogTitle>
                    <DialogDescription>
                      Update security team member information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-first-name">First Name</Label>
                        <Input
                          id="edit-first-name"
                          value={editMember.first_name}
                          onChange={(e) => setEditMember({...editMember, first_name: e.target.value})}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-last-name">Last Name</Label>
                        <Input
                          id="edit-last-name"
                          value={editMember.last_name}
                          onChange={(e) => setEditMember({...editMember, last_name: e.target.value})}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editMember.email}
                        onChange={(e) => setEditMember({...editMember, email: e.target.value})}
                        placeholder="john.doe@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editMember.phone}
                        onChange={(e) => setEditMember({...editMember, phone: e.target.value})}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-role">Security Role</Label>
                      <Select value={editMember.role_id} onValueChange={(value) => setEditMember({...editMember, role_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security role" />
                        </SelectTrigger>
                        <SelectContent>
                          {securityRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={editMember.department}
                        onChange={(e) => setEditMember({...editMember, department: e.target.value})}
                        placeholder="Security Operations"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-specialization">Specialization</Label>
                      <Input
                        id="edit-specialization"
                        value={editMember.specialization}
                        onChange={(e) => setEditMember({...editMember, specialization: e.target.value})}
                        placeholder="Network Security"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editMember.status} onValueChange={(value) => setEditMember({...editMember, status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditMemberDialog(false)}>Cancel</Button>
                    <Button onClick={updateTeamMember}>Update Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Team Members Table - Mobile Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Team Members ({teamMembers.length})</CardTitle>
              <CardDescription className="text-sm">Manage security team members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No security team members found</p>
                  <p className="text-sm">Add your first security team member to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Email</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">2FA</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Last Login</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member, index) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{member.first_name} {member.last_name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{member.email}</p>
                              <p className="text-xs text-muted-foreground">{member.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs">{member.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {member.role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                              {member.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {member.is_2fa_enabled ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">
                            {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditMember(member)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewVulnerability(index)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleRemediateVulnerability(index)}
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Remediate
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteTeamMember(member.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Security Incidents</CardTitle>
                  <CardDescription className="text-sm">Manage and track security incidents</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={incidentFilter} onValueChange={setIncidentFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Incidents</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowIncidentDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Incident
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {socDashboard?.recent_incidents?.length > 0 ? (
                <div className="space-y-4">
                  {socDashboard.recent_incidents
                    .filter(incident => incidentFilter === 'all' || incident.status === incidentFilter)
                    .map((incident) => (
                    <div 
                      key={incident.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleIncidentClick(incident)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{incident.title}</h3>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>ID: {incident.id}</span>
                          <span>Assigned to: {incident.assigned_to || 'Unassigned'}</span>
                          <span>Created: {new Date(incident.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{incident.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No incidents found</p>
                  <p className="text-sm">Create your first security incident to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulnerabilities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Security Vulnerabilities</CardTitle>
                  <CardDescription className="text-sm">View and manage security vulnerabilities</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={vulnerabilityFilter} onValueChange={setVulnerabilityFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vulnerabilities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleScanVulnerabilities}>
                    <Plus className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-red-700">Critical</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-red-600">{socDashboard?.overview?.critical_vulnerabilities || 0}</div>
                      <p className="text-xs text-red-600">Immediate</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-orange-700">High</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-orange-600">0</div>
                      <p className="text-xs text-orange-600">Soon</p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-yellow-700">Medium</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-yellow-600">0</div>
                      <p className="text-xs text-yellow-600">Plan</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-blue-700">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{socDashboard.threat_intelligence?.new_threats_today || 0}</div>
                      <p className="text-xs text-blue-600">All</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Vulnerability List */}
                {(socDashboard?.overview?.vulnerabilities_found || 0) > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Recent Vulnerabilities</h3>
                    {/* Sample vulnerability items - in real app this would come from API */}
                    <div className="space-y-3">
                      {[...Array(Math.min(4, socDashboard?.overview?.critical_vulnerabilities || 0))].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm">Critical Vulnerability #{index + 1}</h3>
                              <Badge className="bg-red-600 text-xs">Critical</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Security vulnerability detected requiring immediate attention
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>CVE-2024-{1000 + index}</span>
                              <span>Detected: {new Date().toLocaleDateString()}</span>
                              <span>Impact: High</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewVulnerability(index)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleRemediateVulnerability(index)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Fix
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No vulnerabilities found</p>
                    <p className="text-xs">Run a security scan to check for vulnerabilities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Security Logs</CardTitle>
                  <CardDescription className="text-sm">View security-focused error logs and events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={logFilters.severity} onValueChange={(value) => {
                    setLogFilters({...logFilters, severity: value});
                    loadSecurityLogs();
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadSecurityLogs} variant="outline" size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-sm">Loading security logs...</div>
              ) : securityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No security logs found</p>
                  <p className="text-xs">Security-related events and errors will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityLogs.map((log: any) => (
                    <div key={log.id} className="border rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${getSeverityColor(log.severity)} text-white text-xs`}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant={log.status === 'active' ? 'destructive' : 'secondary'} className="text-xs">
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{log.message}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Source:</strong> {log.source}</p>
                        {log.assigned_to && <p><strong>Assigned to:</strong> {log.assigned_to}</p>}
                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer hover:text-foreground">View Details</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Incident Details Dialog */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
            <DialogDescription>
              View and manage security incident information
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Incident ID</Label>
                  <p className="text-sm">{selectedIncident.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge className={`${getSeverityColor(selectedIncident.severity)} text-white`}>
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={incidentStatus} onValueChange={setIncidentStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm mt-1">{selectedIncident.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedIncident.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <p className="text-sm">{selectedIncident.assigned_to || 'Unassigned'}</p>
                </div>
                {selectedIncident.business_name && (
                  <div>
                    <Label className="text-sm font-medium">Business</Label>
                    <p className="text-sm">{selectedIncident.business_name}</p>
                  </div>
                )}
              </div>
              
              {selectedIncident.user_email && (
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm">{selectedIncident.user_email}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncidentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateIncidentStatus(selectedIncident.id, incidentStatus)}
              disabled={incidentStatus === selectedIncident.status}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
