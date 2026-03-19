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
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Loader2,
  ExternalLink,
  Upload,
  Star,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string | null;
  image_url: string | null;
  gallery: string[];
  client_name: string;
  project_url: string;
  completion_date: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export default function ServicePortfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    client_name: '',
    project_url: '',
    completion_date: '',
    is_featured: false
  });

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await apiGet('business/portfolio/');
      if (response.success && response.items) {
        setItems(response.items);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title) {
        toast({ title: "Error", description: "Title is required", variant: "destructive" });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('client_name', formData.client_name);
      formDataToSend.append('project_url', formData.project_url);
      formDataToSend.append('completion_date', formData.completion_date);
      formDataToSend.append('is_featured', String(formData.is_featured));
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      if (editingItem) {
        await apiPut(`business/portfolio/${editingItem.id}/`, formDataToSend);
        toast({ title: "Success", description: "Portfolio item updated" });
      } else {
        await apiPost('business/portfolio/', formDataToSend);
        toast({ title: "Success", description: "Portfolio item added" });
      }
      
      resetForm();
      loadPortfolio();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save portfolio item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    
    try {
      await apiDelete(`business/portfolio/${id}/`);
      toast({ title: "Success", description: "Portfolio item deleted" });
      loadPortfolio();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete item", variant: "destructive" });
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      client_name: item.client_name,
      project_url: item.project_url,
      completion_date: item.completion_date,
      is_featured: item.is_featured
    });
    setPreviewUrl(item.image || item.image_url);
    setShowDialog(true);
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingItem(null);
    setSelectedImage(null);
    setPreviewUrl(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      client_name: '',
      project_url: '',
      completion_date: '',
      is_featured: false
    });
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
              <h1 className="text-2xl font-bold text-white">Portfolio</h1>
              <p className="text-muted-foreground">Showcase your best work</p>
            </div>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setShowDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Work
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Showcase your work to potential clients
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label className="text-foreground mb-2 block">Project Image</Label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setPreviewUrl(null);
                            setSelectedImage(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-8">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Click to upload image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-foreground">Project Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-input border-input"
                      placeholder="e.g., E-commerce Website Redesign"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Category</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-input border-input">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web-design">Web Design</SelectItem>
                        <SelectItem value="branding">Branding</SelectItem>
                        <SelectItem value="mobile-app">Mobile App</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Client Name</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="bg-input border-input"
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border-input min-h-[100px]"
                    placeholder="Describe the project, your role, and the outcomes..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Project URL</Label>
                    <Input
                      value={formData.project_url}
                      onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                      className="bg-input border-input"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Completion Date</Label>
                    <Input
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      className="bg-input border-input"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  <Label className="text-foreground">Feature this project (show at top)</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingItem ? 'Update' : 'Add to Portfolio'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">Total Projects</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Featured</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {items.filter(i => i.is_featured).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      {items.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No portfolio items yet</h3>
              <p className="text-muted-foreground mb-4">Start showcasing your work to attract clients</p>
              <Button onClick={() => setShowDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-card border-border overflow-hidden group">
              {(item.image || item.image_url) ? (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image || item.image_url || ''} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-black">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    {item.client_name && (
                      <p className="text-sm text-muted-foreground">Client: {item.client_name}</p>
                    )}
                  </div>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">
                      {item.category.replace('-', ' ')}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'No date'}
                  </div>
                  <div className="flex gap-1">
                    {item.project_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.project_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
