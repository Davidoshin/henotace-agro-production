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
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft,
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Send,
  Loader2,
  FileText,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TEMPLATES = [
  {
    name: "Welcome Email",
    subject: "Welcome to {{business_name}}!",
    body: `Dear {{client_name}},

Welcome to {{business_name}}! We're thrilled to have you as our client.

Our team is dedicated to providing you with exceptional service. If you have any questions, please don't hesitate to reach out.

Best regards,
{{business_name}} Team`,
    type: "welcome"
  },
  {
    name: "Booking Confirmation",
    subject: "Your Booking is Confirmed - {{business_name}}",
    body: `Dear {{client_name}},

Your booking has been confirmed!

Service: {{service_name}}
Date: {{booking_date}}
Time: {{booking_time}}

If you need to reschedule, please contact us at least 24 hours in advance.

See you soon!
{{business_name}}`,
    type: "booking_confirmation"
  },
  {
    name: "Project Update",
    subject: "Project Update - {{project_name}}",
    body: `Dear {{client_name}},

Here's an update on your project "{{project_name}}":

Status: {{project_status}}
Progress: {{project_progress}}%

{{update_message}}

If you have any questions, feel free to reach out.

Best regards,
{{business_name}} Team`,
    type: "project_update"
  },
  {
    name: "Invoice Reminder",
    subject: "Payment Reminder - Invoice #{{invoice_number}}",
    body: `Dear {{client_name}},

This is a friendly reminder that Invoice #{{invoice_number}} for {{invoice_amount}} is due on {{due_date}}.

Please ensure payment is made by the due date to avoid any late fees.

Thank you for your business!
{{business_name}}`,
    type: "invoice_reminder"
  },
  {
    name: "Thank You Email",
    subject: "Thank You - {{business_name}}",
    body: `Dear {{client_name}},

Thank you for choosing {{business_name}}!

We hope you're satisfied with our service. Your feedback means a lot to us.

Would you mind leaving us a review? It helps us improve and helps others discover our services.

Best regards,
{{business_name}} Team`,
    type: "thank_you"
  }
];

export default function ServiceEmailTemplates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'custom',
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiGet('business/email-templates/');
      if (response.success && response.templates) {
        setTemplates(response.templates);
      } else {
        // Use default templates if none exist
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.body) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }

      if (editingTemplate) {
        await apiPut(`business/email-templates/${editingTemplate.id}/`, formData);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await apiPost('business/email-templates/', formData);
        toast({ title: "Success", description: "Template created successfully" });
      }
      
      setShowDialog(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', type: 'custom', is_active: true });
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save template", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await apiDelete(`business/email-templates/${id}/`);
      toast({ title: "Success", description: "Template deleted successfully" });
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete template", variant: "destructive" });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      is_active: template.is_active
    });
    setShowDialog(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const loadDefaultTemplate = (defaultTemplate: typeof DEFAULT_TEMPLATES[0]) => {
    setFormData({
      name: defaultTemplate.name,
      subject: defaultTemplate.subject,
      body: defaultTemplate.body,
      type: defaultTemplate.type,
      is_active: true
    });
  };

  const handleCopy = (template: EmailTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      subject: template.subject,
      body: template.body,
      type: template.type,
      is_active: true
    });
    setShowDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
              <p className="text-muted-foreground">Manage your email communication templates</p>
            </div>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setEditingTemplate(null);
                setFormData({ name: '', subject: '', body: '', type: 'custom', is_active: true });
              }}>
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingTemplate ? 'Edit Template' : 'Create Email Template'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create personalized email templates. Use variables like {`{{client_name}}`}, {`{{business_name}}`}
                </DialogDescription>
              </DialogHeader>
              
              {/* Default Template Selector */}
              {!editingTemplate && (
                <div className="mb-4">
                  <Label className="text-muted-foreground mb-2 block">Start from a template:</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TEMPLATES.map((dt) => (
                      <Button
                        key={dt.type}
                        variant="outline"
                        size="sm"
                        onClick={() => loadDefaultTemplate(dt)}
                        className="text-xs"
                      >
                        {dt.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Template Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <Select 
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                        <SelectItem value="project_update">Project Update</SelectItem>
                        <SelectItem value="invoice_reminder">Invoice Reminder</SelectItem>
                        <SelectItem value="thank_you">Thank You</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Subject Line *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="e.g., Welcome to {{business_name}}!"
                  />
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Email Body *</Label>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="bg-muted border-border text-foreground min-h-[200px]"
                    placeholder="Write your email content here..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available variables: {`{{client_name}}, {{business_name}}, {{service_name}}, {{booking_date}}, {{project_name}}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="text-muted-foreground">Active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first email template to get started</p>
              <Button onClick={() => setShowDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {template.subject.substring(0, 40)}...
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={template.is_active ? "default" : "secondary"}
                    className={template.is_active ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : ""}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {template.body.substring(0, 120)}...
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(template)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Templates Section */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Start Templates</CardTitle>
          <CardDescription className="text-muted-foreground">
            Click on a template to add it to your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {DEFAULT_TEMPLATES.map((dt) => (
              <Button
                key={dt.type}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-border hover:bg-muted"
                onClick={() => {
                  loadDefaultTemplate(dt);
                  setShowDialog(true);
                }}
              >
                <Mail className="h-6 w-6 text-blue-500" />
                <span className="text-xs text-center">{dt.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-white rounded-lg p-6 text-black">
            <div className="border-b pb-4 mb-4">
              <p className="font-semibold">Subject: {previewTemplate?.subject}</p>
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {previewTemplate?.body}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
