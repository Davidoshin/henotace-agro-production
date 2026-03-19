import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Image,
  Globe,
  EyeOff,
  ChevronRight,
  BookOpen,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  category: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  views: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
}

export default function ServiceBlog() {
  const navigate = useNavigate();
  const { id: editPostId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    total_views: 0
  });
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    status: 'draft' as 'draft' | 'published'
  });
  const [selectedFeaturedImage, setSelectedFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  
  // Initialize with proper check to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchPosts();
    // Get business slug from localStorage
    const slug = localStorage.getItem('business_slug');
    setBusinessSlug(slug);
  }, []);
  
  // Load post for editing when URL contains an ID
  useEffect(() => {
    if (editPostId) {
      loadPostForEdit(editPostId);
    }
  }, [editPostId]);

  const loadPostForEdit = async (postId: string) => {
    try {
      const response = await apiGet(`business/blog/posts/${postId}/`);
      if (response.success && response.post) {
        const post = response.post;
        setEditingPost(post);
        setNewPost({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || '',
          status: post.status || 'draft'
        });
        if (post.featured_image) {
          setFeaturedImagePreview(post.featured_image);
        }
        setShowNewPostDialog(true);
        setIsEditing(true);
      } else {
        toast({
          title: "Error",
          description: "Post not found",
          variant: "destructive"
        });
        navigate('/business/blog');
      }
    } catch (error) {
      console.error('Error loading post for edit:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive"
      });
      navigate('/business/blog');
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/blog/posts/').catch(() => ({ success: false }));
      
      if (response.success) {
        setPosts(response.posts || []);
        setStats(response.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim()) {
      toast({
        title: "Error",
        description: "Post title is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Use FormData to support file upload for both create and update
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('excerpt', newPost.excerpt);
      formData.append('content', newPost.content);
      formData.append('category', newPost.category);
      formData.append('status', newPost.status);
      
      if (selectedFeaturedImage) {
        formData.append('featured_image', selectedFeaturedImage);
      }
      
      let response;
      if (isEditing && editingPost) {
        // Update existing post - use FormData to include image upload
        response = await apiPut(`business/blog/posts/${editingPost.id}/`, formData);
      } else {
        // Create new post
        response = await apiPost('business/blog/posts/', formData);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Blog post updated successfully" : "Blog post created successfully"
        });
        closePostDialog();
        fetchPosts();
        if (isEditing) {
          navigate('/business/blog');
        }
      } else {
        throw new Error(response.error || 'Failed to save post');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const closePostDialog = () => {
    setShowNewPostDialog(false);
    setIsEditing(false);
    setEditingPost(null);
    setNewPost({ title: '', excerpt: '', content: '', category: '', status: 'draft' });
    setSelectedFeaturedImage(null);
    setFeaturedImagePreview(null);
    // Navigate away from edit URL to prevent re-opening on back button
    if (editPostId) {
      navigate('/business/blog', { replace: true });
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    
    try {
      const response = await apiDelete(`business/blog/posts/${selectedPost.id}/`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Blog post deleted successfully"
        });
        setShowDeleteDialog(false);
        setSelectedPost(null);
        fetchPosts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Globe className="w-3 h-3 mr-1" /> Published</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Blog</h1>
            <Button size="sm" onClick={() => setShowNewPostDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Posts</p>
                <p className="text-lg font-bold">{stats.total_posts}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-lg font-bold text-emerald-500">{stats.published_posts}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="text-lg font-bold text-amber-500">{stats.draft_posts}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Views</p>
                <p className="text-lg font-bold">{stats.total_views.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>

          {/* Posts List */}
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Card key={post.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-1">{post.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/business/blog/${post.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => businessSlug && window.open(`/services/${businessSlug}#blog`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => {
                              setSelectedPost(post);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views} views
                      </span>
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No blog posts yet</p>
                <Button 
                  variant="link" 
                  onClick={() => setShowNewPostDialog(true)}
                >
                  Create your first post
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New Post Dialog */}
        <Dialog open={showNewPostDialog} onOpenChange={(open) => {
          if (!open) closePostDialog();
          else setShowNewPostDialog(open);
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
              <DialogDescription>{isEditing ? 'Update your blog post' : 'Write a new blog post for your service business'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  placeholder="Enter post title" 
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  {featuredImagePreview ? (
                    <div className="relative">
                      <img 
                        src={featuredImagePreview} 
                        alt="Featured preview" 
                        className="max-h-40 mx-auto rounded-lg object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => {
                          setSelectedFeaturedImage(null);
                          setFeaturedImagePreview(null);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center py-4">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload featured image</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFeaturedImage(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFeaturedImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea 
                  placeholder="Brief description of the post..." 
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  placeholder="Write your blog post content..." 
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  placeholder="e.g., Tips, News, Tutorial"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newPost.status} 
                  onValueChange={(value: 'draft' | 'published') => setNewPost({ ...newPost, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="published">Publish Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closePostDialog}>Cancel</Button>
              <Button onClick={handleCreatePost} disabled={isCreating}>
                {isCreating ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Post" : "Create Post")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Blog Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeletePost}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Blog</h1>
                <p className="text-sm text-muted-foreground">Create and manage blog posts for your business</p>
              </div>
            </div>
            <Button onClick={() => setShowNewPostDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.total_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.published_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <EyeOff className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.draft_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.total_views.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POST</TableHead>
                <TableHead>CATEGORY</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>VIEWS</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {post.featured_image ? (
                            <img src={post.featured_image} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{post.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {post.views}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Edit"
                          onClick={() => navigate(`/business/blog/${post.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="View"
                          onClick={() => businessSlug && window.open(`/services/${businessSlug}#blog`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/business/blog/${post.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => businessSlug && window.open(`/services/${businessSlug}#blog`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" /> View Post
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => {
                                setSelectedPost(post);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No blog posts yet</p>
                    <Button 
                      variant="link" 
                      onClick={() => setShowNewPostDialog(true)}
                    >
                      Create your first post
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={(open) => {
        if (!open) closePostDialog();
        else setShowNewPostDialog(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
            <DialogDescription>{isEditing ? 'Update your blog post' : 'Write a new blog post for your service business'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                placeholder="Enter post title" 
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea 
                placeholder="Brief description of the post (shown in previews)..." 
                value={newPost.excerpt}
                onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea 
                placeholder="Write your blog post content here..." 
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={10}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  placeholder="e.g., Tips, News, Tutorial"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newPost.status} 
                  onValueChange={(value: 'draft' | 'published') => setNewPost({ ...newPost, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="published">Publish Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePostDialog}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={isCreating}>
              {isCreating ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Post" : (newPost.status === 'published' ? "Publish Post" : "Save Draft"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
