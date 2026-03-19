import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Send,
  Loader2,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Target,
  TrendingUp,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes: string;
  service_interested: string;
  created_at: string;
  last_contacted: string | null;
}

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipients_count: number;
  sent_at: string | null;
  open_rate: number;
  click_rate: number;
}

export default function ServiceLeads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new',
    notes: '',
    service_interested: ''
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    body: '',
    recipients: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, campaignsRes] = await Promise.all([
        apiGet('business/leads/'),
        apiGet('business/email-campaigns/')
      ]);
      
      if (leadsRes.success && leadsRes.leads) {
        setLeads(leadsRes.leads);
      } else {
        // Mock data for demo
        setLeads([
          { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+1234567890', source: 'website', status: 'new', notes: 'Interested in web development', service_interested: 'Web Development', created_at: new Date().toISOString(), last_contacted: null },
          { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+0987654321', source: 'referral', status: 'contacted', notes: 'Follow up needed', service_interested: 'Brand Design', created_at: new Date().toISOString(), last_contacted: new Date().toISOString() },
        ]);
      }
      
      if (campaignsRes.success && campaignsRes.campaigns) {
        setCampaigns(campaignsRes.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLeads([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLead = async () => {
    try {
      if (!leadForm.name || !leadForm.email) {
        toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
        return;
      }

      if (editingLead) {
        await apiPut(`business/leads/${editingLead.id}/`, leadForm);
        toast({ title: "Success", description: "Lead updated successfully" });
      } else {
        await apiPost('business/leads/', leadForm);
        toast({ title: "Success", description: "Lead added successfully" });
      }
      
      setShowLeadDialog(false);
      setEditingLead(null);
      setLeadForm({ name: '', email: '', phone: '', source: 'website', status: 'new', notes: '', service_interested: '' });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save lead", variant: "destructive" });
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await apiDelete(`business/leads/${id}/`);
      toast({ title: "Success", description: "Lead deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete lead", variant: "destructive" });
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
      service_interested: lead.service_interested
    });
    setShowLeadDialog(true);
  };

  const handleSendCampaign = async () => {
    try {
      if (!campaignForm.name || !campaignForm.subject || !campaignForm.body) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }

      if (selectedLeads.length === 0) {
        toast({ title: "Error", description: "Please select at least one recipient", variant: "destructive" });
        return;
      }

      await apiPost('business/email-campaigns/', {
        ...campaignForm,
        recipients: selectedLeads
      });
      
      toast({ title: "Success", description: `Campaign sent to ${selectedLeads.length} recipients` });
      setShowCampaignDialog(false);
      setCampaignForm({ name: '', subject: '', body: '', recipients: [] });
      setSelectedLeads([]);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send campaign", variant: "destructive" });
    }
  };

  const toggleLeadSelection = (id: number) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'contacted': return <MessageSquare className="h-4 w-4 text-yellow-400" />;
      case 'qualified': return <Target className="h-4 w-4 text-purple-400" />;
      case 'converted': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'lost': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'qualified': return 'bg-purple-500/20 text-purple-400';
      case 'converted': return 'bg-emerald-500/20 text-emerald-400';
      case 'lost': return 'bg-red-500/20 text-red-400';
      default: return '';
    }
  };

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : '0'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Leads & Campaigns</h1>
              <p className="text-slate-400">Manage your leads and email marketing</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              setEditingLead(null);
              setLeadForm({ name: '', email: '', phone: '', source: 'website', status: 'new', notes: '', service_interested: '' });
              setShowLeadDialog(true);
            }}>
              <UserPlus className="h-4 w-4" />
              Add Lead
            </Button>
            <Button className="gap-2" onClick={() => setShowCampaignDialog(true)}>
              <Mail className="h-4 w-4" />
              Send Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{leadStats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-slate-400">New</span>
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-1">{leadStats.new}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-slate-400">Contacted</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{leadStats.contacted}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-slate-400">Qualified</span>
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-1">{leadStats.qualified}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Converted</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{leadStats.converted}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Rate</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{leadStats.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border border-slate-700 rounded-xl p-4 md:p-6 bg-slate-800/30">
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-2 w-full md:w-auto md:inline-flex h-auto gap-1 p-1">
            <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 data-[state=active]:bg-slate-700">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection Bar */}
            {selectedLeads.length > 0 && (
              <div className="flex items-center justify-between bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <span className="text-blue-400">{selectedLeads.length} leads selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedLeads([])}>
                    Clear Selection
                  </Button>
                  <Button size="sm" onClick={() => setShowCampaignDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            )}

            {/* Leads List */}
            {filteredLeads.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
                    <p className="text-slate-400 mb-4">Add your first lead to get started</p>
                    <Button onClick={() => setShowLeadDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Lead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Select All */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg">
                  <Checkbox 
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={selectAllLeads}
                  />
                  <span className="text-sm text-slate-400">Select All</span>
                </div>

                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="font-medium text-white">{lead.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                                {lead.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(lead.status)}>
                              {getStatusIcon(lead.status)}
                              <span className="ml-1 capitalize">{lead.status}</span>
                            </Badge>
                          </div>
                          {lead.service_interested && (
                            <p className="text-sm text-slate-500 mt-2">
                              Interested in: {lead.service_interested}
                            </p>
                          )}
                          {lead.notes && (
                            <p className="text-sm text-slate-500 mt-1 italic">
                              "{lead.notes}"
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-500">
                              Source: {lead.source} • Added: {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditLead(lead)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No campaigns yet</h3>
                    <p className="text-slate-400 mb-4">Create your first email campaign</p>
                    <Button onClick={() => setShowCampaignDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">{campaign.name}</CardTitle>
                      <CardDescription className="text-slate-400">{campaign.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-white">{campaign.recipients_count}</p>
                          <p className="text-xs text-slate-400">Recipients</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-400">{campaign.open_rate}%</p>
                          <p className="text-xs text-slate-400">Open Rate</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">{campaign.click_rate}%</p>
                          <p className="text-xs text-slate-400">Click Rate</p>
                        </div>
                      </div>
                      <Badge 
                        className={`mt-4 ${
                          campaign.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                          campaign.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="+1234567890"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Source</Label>
                <Select 
                  value={leadForm.source}
                  onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="ads">Advertising</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select 
                  value={leadForm.status}
                  onValueChange={(value) => setLeadForm({ ...leadForm, status: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Service Interested</Label>
              <Input
                value={leadForm.service_interested}
                onChange={(e) => setLeadForm({ ...leadForm, service_interested: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., Web Development"
              />
            </div>
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitLead}>
              {editingLead ? 'Update Lead' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Send Email Campaign</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an email to {selectedLeads.length > 0 ? `${selectedLeads.length} selected leads` : 'your leads'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Campaign Name *</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., Summer Promotion"
              />
            </div>
            <div>
              <Label className="text-slate-300">Subject Line *</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., Special Offer Just for You!"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email Body *</Label>
              <Textarea
                value={campaignForm.body}
                onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                placeholder="Write your email content here..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Use {`{{name}}`} to personalize with the lead's name
              </p>
            </div>
            
            {selectedLeads.length === 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
                No leads selected. Go to the Leads tab and select recipients first.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSendCampaign}
              disabled={selectedLeads.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send to {selectedLeads.length} Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
