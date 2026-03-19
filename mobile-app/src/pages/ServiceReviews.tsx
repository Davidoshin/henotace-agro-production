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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Star,
  Quote,
  Loader2,
  MessageSquare,
  User,
  Building,
  Calendar,
  ThumbsUp,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface Review {
  id: number;
  client_name: string;
  client_title: string;
  client_company: string;
  client_image: string | null;
  rating: number;
  content: string;
  service_name: string;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
}

export default function ServiceReviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_title: '',
    client_company: '',
    rating: 5,
    content: '',
    service_name: '',
    is_featured: false,
    is_visible: true
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await apiGet('business/reviews/');
      if (response.success && response.reviews) {
        setReviews(response.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.client_name || !formData.content) {
        toast({ title: "Error", description: "Name and review content are required", variant: "destructive" });
        return;
      }

      if (editingReview) {
        await apiPut(`business/reviews/${editingReview.id}/`, formData);
        toast({ title: "Success", description: "Review updated" });
      } else {
        await apiPost('business/reviews/', formData);
        toast({ title: "Success", description: "Review added" });
      }
      
      resetForm();
      loadReviews();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save review", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await apiDelete(`business/reviews/${id}/`);
      toast({ title: "Success", description: "Review deleted" });
      loadReviews();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete review", variant: "destructive" });
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      client_name: review.client_name,
      client_title: review.client_title,
      client_company: review.client_company,
      rating: review.rating,
      content: review.content,
      service_name: review.service_name,
      is_featured: review.is_featured,
      is_visible: review.is_visible
    });
    setShowDialog(true);
  };

  const toggleVisibility = async (review: Review) => {
    try {
      await apiPut(`business/reviews/${review.id}/`, { is_visible: !review.is_visible });
      toast({ title: "Success", description: `Review ${review.is_visible ? 'hidden' : 'visible'} on public page` });
      loadReviews();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const toggleFeatured = async (review: Review) => {
    try {
      await apiPut(`business/reviews/${review.id}/`, { is_featured: !review.is_featured });
      toast({ title: "Success", description: `Review ${review.is_featured ? 'unfeatured' : 'featured'}` });
      loadReviews();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingReview(null);
    setFormData({
      client_name: '',
      client_title: '',
      client_company: '',
      rating: 5,
      content: '',
      service_name: '',
      is_featured: false,
      is_visible: true
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:text-yellow-500' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  const stats = {
    total: reviews.length,
    visible: reviews.filter(r => r.is_visible).length,
    featured: reviews.filter(r => r.is_featured).length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : '0.0'
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
              <h1 className="text-2xl font-bold text-foreground">Reviews & Testimonials</h1>
              <p className="text-muted-foreground">Manage client reviews for your service page</p>
            </div>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setShowDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingReview ? 'Edit Review' : 'Add Client Review'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add reviews from satisfied clients to build trust
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Client Name *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="e.g., John Smith"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Title/Role</Label>
                    <Input
                      value={formData.client_title}
                      onChange={(e) => setFormData({ ...formData, client_title: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="e.g., CEO"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Company</Label>
                    <Input
                      value={formData.client_company}
                      onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <div className="mt-2">
                    {renderStars(formData.rating, true, (r) => setFormData({ ...formData, rating: r }))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Review Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="bg-muted border-border text-foreground min-h-[120px]"
                    placeholder="What did the client say about your service?"
                  />
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Service Received</Label>
                  <Input
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="e.g., Website Redesign"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label className="text-muted-foreground">Feature this review (show prominently)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label className="text-muted-foreground">Show on public service page</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingReview ? 'Update Review' : 'Add Review'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Reviews</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.averageRating}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Visible</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.visible}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Featured</span>
            </div>
            <p className="text-2xl font-bold text-purple-500 mt-1">{stats.featured}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <Quote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-4">Start collecting testimonials from your clients</p>
              <Button onClick={() => setShowDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Review
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card 
              key={review.id} 
              className={`bg-card border-border ${!review.is_visible ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    {review.client_image ? (
                      <AvatarImage src={review.client_image} alt={review.client_name} />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        {review.client_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{review.client_name}</h3>
                          {review.is_featured && (
                            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs">Featured</Badge>
                          )}
                          {!review.is_visible && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.client_title && review.client_company 
                            ? `${review.client_title} at ${review.client_company}`
                            : review.client_title || review.client_company || 'Client'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <blockquote className="text-muted-foreground italic mb-3 relative pl-4 border-l-2 border-border">
                      "{review.content}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {review.service_name && (
                          <span>Service: {review.service_name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleFeatured(review)}
                          className={review.is_featured ? 'text-yellow-500' : 'text-muted-foreground'}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleVisibility(review)}
                        >
                          {review.is_visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(review)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(review.id)}
                          className="text-red-500 hover:text-red-600"
                        >
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
    </div>
  );
}
