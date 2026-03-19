import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Users, CreditCard, FileText, BookOpen, Settings, LogOut, Upload, X, Building2, CheckCircle2, Truck, BarChart3, Facebook, ChevronDown, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubjectSelect } from '@/components/ui/subject-select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AdminDeliveryManagement from './AdminDeliveryManagement';
import AccessDenied from './AccessDenied';

type AdminView = 'dashboard' | 'users' | 'subscriptions' | 'payments' | 'waec-questions' | 'jamb-questions' | 'subjects' | 'institutions' | 'delivery' | 'analytics';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [view, setView] = useState<AdminView>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [waecQuestions, setWaecQuestions] = useState<any[]>([]);
  const [jambQuestions, setJambQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', is_active: true, display_order: 0 });
  const [questions, setQuestions] = useState<any[]>([]);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  // Institutions and feature management
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [institutionFeatures, setInstitutionFeatures] = useState<string[]>([]);
  const [allFeatures] = useState<string[]>([
    'ai_chatbot',
    'ai_question_generator',
    'ai_study_assistant'
  ]);
  
  // Import questions state
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'text' | 'csv' | 'pdf' | 'docx'>('text');
  const [importSubject, setImportSubject] = useState('');
  const [importTopic, setImportTopic] = useState('');
  const [importYear, setImportYear] = useState<string>('');
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Image upload state
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>('');

  // Platform Analytics Settings
  const [platformAnalytics, setPlatformAnalytics] = useState({
    google_analytics_id: "",
    google_analytics_enabled: false,
    google_ads_id: "",
    google_ads_conversion_id: "",
    google_ads_enabled: false,
    facebook_pixel_id: "",
    facebook_pixel_enabled: false,
    facebook_access_token: "",
    facebook_test_event_code: "",
    tiktok_pixel_id: "",
    tiktok_pixel_enabled: false,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [googleAnalyticsOpen, setGoogleAnalyticsOpen] = useState(true);
  const [googleAdsOpen, setGoogleAdsOpen] = useState(false);
  const [facebookPixelOpen, setFacebookPixelOpen] = useState(false);
  const [tiktokPixelOpen, setTiktokPixelOpen] = useState(false);

  // Create Question form
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    subject: '',
    topic: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    difficulty: 'medium',
    year: new Date().getFullYear(),
    image_url: ''
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin-users/') as any;
      // Handle different response formats
      let usersList = [];
      if (Array.isArray(data)) {
        usersList = data;
      } else if (Array.isArray(data?.results)) {
        usersList = data.results;
      } else if (Array.isArray(data?.users)) {
        usersList = data.users;
      }
      setUsers(usersList);
    } catch (e: any) {
      toast({ title: 'Failed to load users', description: e?.message, variant: 'destructive' });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/active-subscriptions/') as any;
      setSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
    } catch (e: any) {
      toast({ title: 'Failed to load subscriptions', description: e?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/payments/') as any;
      // Handle different response formats
      let paymentsList = [];
      if (Array.isArray(data?.payments)) {
        paymentsList = data.payments;
      } else if (Array.isArray(data?.records)) {
        paymentsList = data.records;
      } else if (Array.isArray(data)) {
        paymentsList = data;
      }
      setPayments(paymentsList);
    } catch (e: any) {
      toast({ title: 'Failed to load payments', description: e?.message, variant: 'destructive' });
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWaecQuestions = async () => {
    setIsLoading(true);
    try {
      // Load questions from QuestionBank database where exam_type='waec'
      const data = await apiGet('question-bank/questions/?exam_type=waec') as any;
      console.log('WAEC questions response:', data); // Debug log
      // Handle different response formats
      let questionsList = [];
      if (Array.isArray(data?.questions)) {
        questionsList = data.questions;
      } else if (Array.isArray(data?.results)) {
        questionsList = data.results;
      } else if (Array.isArray(data)) {
        questionsList = data;
      }
      console.log('Parsed WAEC questions:', questionsList.length); // Debug log
      setWaecQuestions(questionsList);
      if (questionsList.length === 0 && data?.success) {
        toast({ title: 'No WAEC questions found', description: 'There are no WAEC questions in the database yet.', variant: 'default' });
      }
    } catch (e: any) {
      console.error('Error loading WAEC questions:', e); // Debug log
      toast({ title: 'Failed to load WAEC questions', description: e?.message || 'Unknown error occurred', variant: 'destructive' });
      setWaecQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJambQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('question-bank/questions/?exam_type=jamb') as any;
      console.log('JAMB questions response:', data); // Debug log
      // Handle different response formats
      let questionsList = [];
      if (Array.isArray(data?.questions)) {
        questionsList = data.questions;
      } else if (Array.isArray(data?.results)) {
        questionsList = data.results;
      } else if (Array.isArray(data)) {
        questionsList = data;
      }
      console.log('Parsed JAMB questions:', questionsList.length); // Debug log
      setJambQuestions(questionsList);
      if (questionsList.length === 0 && data?.success) {
        toast({ title: 'No JAMB questions found', description: 'There are no JAMB questions in the database yet.', variant: 'default' });
      }
    } catch (e: any) {
      console.error('Error loading JAMB questions:', e); // Debug log
      toast({ title: 'Failed to load JAMB questions', description: e?.message || 'Unknown error occurred', variant: 'destructive' });
      setJambQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const data = await apiGet('subjects/all/') as any;
      if (data.success && data.subjects) {
        setSubjects(data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (e: any) {
      console.error('Failed to load subjects:', e);
      toast({ title: 'Failed to load subjects', variant: 'destructive' });
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Check if user is staff or superuser on mount
  useEffect(() => {
    const checkAuthorization = async () => {
      // Always fetch fresh user profile to get latest staff status
      try {
        const profileData = await apiGet('profile/') as any;
        if (profileData) {
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(profileData));
          
          // Handle both boolean and string/number values
          const staffStatus = profileData.is_staff === true || profileData.is_staff === 'true' || profileData.is_staff === 1;
          const superuserStatus = profileData.is_superuser === true || profileData.is_superuser === 'true' || profileData.is_superuser === 1;
          
          setIsStaff(staffStatus);
          setIsSuperuser(superuserStatus);
          setIsAuthorized(true);
          
          // Debug logging
          console.log('[AdminDashboard] Authorization check (fresh data):', {
            email: profileData.email,
            is_staff: profileData.is_staff,
            is_superuser: profileData.is_superuser,
            isStaff: staffStatus,
            isSuperuser: superuserStatus
          });
        } else {
          // Fallback to localStorage if API fails
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              const staffStatus = user.is_staff === true || user.is_staff === 'true' || user.is_staff === 1;
              const superuserStatus = user.is_superuser === true || user.is_superuser === 'true' || user.is_superuser === 1;
              
              setIsStaff(staffStatus);
              setIsSuperuser(superuserStatus);
              setIsAuthorized(true);
            } catch (e) {
              console.error('[AdminDashboard] Error parsing localStorage user:', e);
              setIsAuthorized(true);
            }
          } else {
            setIsAuthorized(true);
          }
        }
      } catch (e: any) {
        console.error('[AdminDashboard] Error fetching profile:', e);
        // Fallback to localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const staffStatus = user.is_staff === true || user.is_staff === 'true' || user.is_staff === 1;
            const superuserStatus = user.is_superuser === true || user.is_superuser === 'true' || user.is_superuser === 1;
            
            setIsStaff(staffStatus);
            setIsSuperuser(superuserStatus);
            setIsAuthorized(true);
          } catch (parseError) {
            console.error('[AdminDashboard] Error parsing localStorage user:', parseError);
            setIsAuthorized(true);
          }
        } else {
          setIsAuthorized(true);
        }
      }
    };
    
    checkAuthorization();
  }, []);

  useEffect(() => {
    if (view === 'users') {
      loadUsers();
    } else if (view === 'subscriptions') {
      loadSubscriptions();
    } else if (view === 'payments') {
      loadPayments();
    } else if (view === 'waec-questions') {
      loadWaecQuestions();
    } else if (view === 'jamb-questions') {
      loadJambQuestions();
    } else if (view === 'subjects') {
      loadSubjects();
    } else if (view === 'institutions') {
      loadInstitutions();
    } else if (view === 'analytics') {
      loadPlatformAnalytics();
    }
  }, [view]);

  const loadPlatformAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiGet('admin/platform-analytics/') as any;
      if (data.success && data.settings) {
        setPlatformAnalytics({
          google_analytics_id: data.settings.google_analytics_id || "",
          google_analytics_enabled: data.settings.google_analytics_enabled ?? false,
          google_ads_id: data.settings.google_ads_id || "",
          google_ads_conversion_id: data.settings.google_ads_conversion_id || "",
          google_ads_enabled: data.settings.google_ads_enabled ?? false,
          facebook_pixel_id: data.settings.facebook_pixel_id || "",
          facebook_pixel_enabled: data.settings.facebook_pixel_enabled ?? false,
          facebook_access_token: data.settings.facebook_access_token || "",
          facebook_test_event_code: data.settings.facebook_test_event_code || "",
          tiktok_pixel_id: data.settings.tiktok_pixel_id || "",
          tiktok_pixel_enabled: data.settings.tiktok_pixel_enabled ?? false,
        });
      }
    } catch (e: any) {
      toast({ title: 'Failed to load analytics settings', description: e?.message, variant: 'destructive' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const savePlatformAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const result = await apiPost('admin/platform-analytics/', platformAnalytics) as any;
      if (result.success) {
        toast({ title: 'Success', description: 'Platform analytics settings saved successfully' });
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (e: any) {
      toast({ title: 'Failed to save analytics settings', description: e?.message, variant: 'destructive' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadInstitutions = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('admin/institutions/') as any;
      setInstitutions(Array.isArray(data?.institutions) ? data.institutions : Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: 'Failed to load institutions', description: e?.message, variant: 'destructive' });
      setInstitutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstitutionFeatures = async (institutionId: number) => {
    try {
      const data = await apiGet(`admin/institutions/${institutionId}/features/`) as any;
      setInstitutionFeatures(data?.restricted_features || []);
    } catch (e: any) {
      toast({ title: 'Failed to load features', description: e?.message, variant: 'destructive' });
      setInstitutionFeatures([]);
    }
  };

  const saveInstitutionFeatures = async (institutionId: number) => {
    try {
      await apiPut(`admin/institutions/${institutionId}/features/`, {
        restricted_features: institutionFeatures
      });
      toast({ title: 'Success', description: 'Feature restrictions updated successfully' });
      await loadInstitutions();
    } catch (e: any) {
      toast({ title: 'Failed to save features', description: e?.message, variant: 'destructive' });
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiPost('question-bank/questions/upload-image/', formData) as any;
      if (response.success) {
        return response.image_url;
      } else {
        throw new Error(response.error || 'Image upload failed');
      }
    } catch (e: any) {
      toast({ title: 'Image upload failed', description: e?.message || 'Could not upload image', variant: 'destructive' });
      throw e;
    }
  };

  const handleCreateQuestion = async (examType: 'waec' | 'jamb') => {
    // Check if user is staff before allowing question creation
    if (!isStaff && !isSuperuser) {
      toast({ 
        title: 'Access Denied', 
        description: 'Only staff members can create questions. Please contact an administrator.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!newQuestion.question_text || !newQuestion.subject || !newQuestion.topic ||
        !newQuestion.option_a || !newQuestion.option_b || !newQuestion.option_c || !newQuestion.option_d) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      // Upload image first if present
      let imageUrl = newQuestion.image_url;
      if (questionImage) {
        imageUrl = await handleImageUpload(questionImage);
      }

      const result = await apiPost('question-bank/questions/create/', {
        exam_type: examType,
        subject: newQuestion.subject,
        topic: newQuestion.topic,
        question_text: newQuestion.question_text,
        option_a: newQuestion.option_a,
        year: newQuestion.year || null,
        option_b: newQuestion.option_b,
        option_c: newQuestion.option_c,
        option_d: newQuestion.option_d,
        correct_answer: newQuestion.correct_answer,
        explanation: newQuestion.explanation,
        difficulty: newQuestion.difficulty,
        image_url: imageUrl
      }) as any;

      if (result.success) {
        toast({ title: 'Question created successfully!' });
        setNewQuestion({
          question_text: '',
          subject: '',
          topic: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          explanation: '',
          difficulty: 'medium',
          year: new Date().getFullYear(),
          image_url: ''
        });
        setQuestionImage(null);
        setQuestionImagePreview('');
        if (examType === 'waec') {
          loadWaecQuestions();
        } else {
          loadJambQuestions();
        }
      } else {
        toast({ title: 'Failed', description: result.error || 'Could not create question', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Could not create question', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    // Check if user is staff before allowing user deletion
    if (!isStaff && !isSuperuser) {
      toast({ 
        title: 'Access Denied', 
        description: 'Only staff members can manage users. Please contact an administrator.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiDelete(`admin-users/${userId}/`);
      await loadUsers();
      toast({ title: 'User deleted successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to delete user', description: e?.message, variant: 'destructive' });
    }
  };

  // Track staff status for action restrictions
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Dashboard view
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <Button variant="outline" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = '/';
              }}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('users');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>Add, remove, and manage users</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('subscriptions');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Active Subscriptions</CardTitle>
                    <CardDescription>View and manage subscriptions</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('payments');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>View payment history</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('subjects');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div>
                    <CardTitle>Manage Subjects</CardTitle>
                    <CardDescription>Add, edit, or remove subjects</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('institutions');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-500" />
                  <div>
                    <CardTitle>Manage Institutions</CardTitle>
                    <CardDescription>Manage feature restrictions for institutions</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('waec-questions');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Create WAEC Questions</CardTitle>
                    <CardDescription>Add WAEC past questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('jamb-questions');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Create JAMB Questions</CardTitle>
                    <CardDescription>Add JAMB past questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setView('analytics');
            }} style={{ pointerEvents: 'auto' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle>Analytics & Ads</CardTitle>
                    <CardDescription>Configure platform analytics and advertising tracking</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

          </div>
        </div>
      </div>
    );
  }

  // Users view
  if (view === 'users') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
                <h1 className="text-2xl font-bold">Manage Users</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.first_name} {user.last_name} • Role: {user.role || 'N/A'}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={!isStaff && !isSuperuser}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subscriptions view
  if (view === 'subscriptions') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Active Subscriptions</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions ({subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active subscriptions</div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub: any) => (
                    <div key={sub.id} className="p-4 border rounded-lg">
                      <div className="font-semibold">{sub.user?.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Plan: {sub.plan} • Status: {sub.status} • Expires: {new Date(sub.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Payments view
  if (view === 'payments') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Payments</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment History ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payments found</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="p-4 border rounded-lg">
                      <div className="font-semibold">{payment.user?.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Amount: {payment.amount} {payment.currency} • Status: {payment.status} • Date: {new Date(payment.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // WAEC Questions view
  if (view === 'waec-questions') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Create WAEC Questions</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          {/* Import Questions Button */}
          <div className="mb-4 flex gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import WAEC Questions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {(['text','csv','pdf','docx'] as const).map(m => (
                      <Button key={m} variant={importMode===m? 'default':'outline'} size="sm" onClick={()=>setImportMode(m)}>
                        {m.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <SubjectSelect
                        value={importSubject}
                        onChange={setImportSubject}
                        label="Subject"
                        required
                      />
                    </div>
                    <div>
                      <Label>Topic</Label>
                      <Input value={importTopic} onChange={(e)=>setImportTopic(e.target.value)} placeholder="e.g. Algebra" />
                    </div>
                    <div>
                      <Label>Year (Optional)</Label>
                      <Input 
                        type="number" 
                        value={importYear} 
                        onChange={(e)=>setImportYear(e.target.value)} 
                        placeholder="e.g. 2024" 
                        min="2000"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                  {importMode === 'text' && (
                    <div>
                      <Label>Paste Questions (Question/Options/Correct/Explanation format)</Label>
                      <Textarea rows={10} placeholder={`Question 1: ...\nA) ...\nB) ...\nC) ...\nD) ...\nCorrect: B\nExplanation: ...`} value={importText} onChange={(e)=>setImportText(e.target.value)} />
                    </div>
                  )}
                  {importMode !== 'text' && (
                    <div>
                      <Label>Upload {importMode.toUpperCase()} File</Label>
                      <Input type="file" accept={importMode==='csv'?'.csv':importMode==='pdf'?'.pdf':importMode==='docx'?'.doc,.docx':''} onChange={(e)=> setImportFile(e.target.files?.[0] || null)} />
                      {importFile && <div className="text-xs text-muted-foreground mt-1">{importFile.name}</div>}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={()=>{ setImportOpen(false); setImportText(''); setImportFile(null); setImportYear(''); }}>Cancel</Button>
                    <Button onClick={async()=>{
                      try {
                        const subjectVal = importSubject.trim();
                        if (!subjectVal) { toast({title:'Subject required', variant:'destructive'}); return; }
                        if (importMode === 'text') {
                          if (!importText.trim()) { toast({title:'Paste the questions text', variant:'destructive'}); return; }
                          // Use question-bank import endpoint (same format as teacher dashboard)
                          const res = await apiPost('question-bank/import-text/', { 
                            exam_type: 'waec',
                            subject: subjectVal, 
                            topic: importTopic || 'General',
                            text: importText,
                            year: importYear ? parseInt(importYear) : null
                          }) as any;
                          if (res.success === false || res.imported_count === 0) {
                            toast({ 
                              title: 'Import failed', 
                              description: res.error || 'No questions were imported. Please check the format.',
                              variant:'destructive',
                              duration: 10000
                            });
                          } else {
                            toast({ title: 'Import complete', description: `${res.imported_count} imported, ${res.failed_count || 0} failed` });
                            setImportOpen(false);
                            setImportText(''); 
                            setImportFile(null); 
                            setImportTopic(''); 
                            setImportSubject('');
                            setImportYear('');
                            loadWaecQuestions();
                          }
                        } else {
                          if (!importFile) { toast({title:'Select a file', variant:'destructive'}); return; }
                          const fd = new FormData();
                          fd.append('exam_type', 'waec');
                          fd.append('subject', subjectVal);
                          if (importTopic) fd.append('topic', importTopic);
                          if (importYear) fd.append('year', importYear);
                          fd.append('file', importFile);
                          let endpoint = 'question-bank/import-csv/';
                          if (importMode==='pdf') endpoint = 'question-bank/import-pdf/';
                          if (importMode==='docx') endpoint = 'question-bank/import-docx/';
                          const res = await apiPost(endpoint, fd) as any;
                          if (res.success === false || res.imported_count === 0) {
                            toast({ 
                              title: 'Import failed', 
                              description: res.error || 'No questions were imported. Please check the format.',
                              variant:'destructive',
                              duration: 10000
                            });
                          } else {
                            toast({ title: 'Import complete', description: `${res.imported_count} imported, ${res.failed_count || 0} failed` });
                            setImportOpen(false);
                            setImportText(''); 
                            setImportFile(null); 
                            setImportTopic(''); 
                            setImportSubject('');
                            setImportYear('');
                            loadWaecQuestions();
                          }
                        }
                      } catch (e:any) {
                        toast({ 
                          title: 'Import failed', 
                          description: e?.message || 'Import failed. Please check the format.',
                          variant:'destructive',
                          duration: 10000
                        });
                      }
                    }}>Run Import</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New WAEC Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Question Text *</Label>
                  <Textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="Enter the question text..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <SubjectSelect
                      value={newQuestion.subject}
                      onChange={(value) => setNewQuestion({...newQuestion, subject: value})}
                      label="Subject"
                      required
                    />
                  </div>
                  <div>
                    <Label>Topic *</Label>
                    <Input
                      value={newQuestion.topic}
                      onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                      placeholder="e.g. Algebra"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Year *</Label>
                    <Input
                      type="number"
                      value={newQuestion.year}
                      onChange={(e) => setNewQuestion({...newQuestion, year: parseInt(e.target.value) || new Date().getFullYear()})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Option A *</Label>
                    <Input
                      value={newQuestion.option_a}
                      onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Option B *</Label>
                    <Input
                      value={newQuestion.option_b}
                      onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Option C *</Label>
                    <Input
                      value={newQuestion.option_c}
                      onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Option D *</Label>
                    <Input
                      value={newQuestion.option_d}
                      onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Correct Answer *</Label>
                    <select
                      value={newQuestion.correct_answer}
                      onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                      className="w-full p-2 border rounded mt-2"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                      className="w-full p-2 border rounded mt-2"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explain why this answer is correct..."
                    rows={2}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Question Image (Optional)</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setQuestionImage(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setQuestionImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {questionImagePreview && (
                      <div className="relative inline-block">
                        <img src={questionImagePreview} alt="Preview" className="max-w-xs max-h-48 rounded border" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0"
                          onClick={() => {
                            setQuestionImage(null);
                            setQuestionImagePreview('');
                            setNewQuestion({...newQuestion, image_url: ''});
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {newQuestion.image_url && !questionImagePreview && (
                      <div className="relative inline-block">
                        <img src={newQuestion.image_url} alt="Current" className="max-w-xs max-h-48 rounded border" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0"
                          onClick={() => {
                            setNewQuestion({...newQuestion, image_url: ''});
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={() => handleCreateQuestion('waec')}>Create Question</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WAEC Questions ({waecQuestions.length})</CardTitle>
              <CardDescription>
                Questions are loaded from the QuestionBank database (exam_type='waec'). 
                These are stored in the database and can be filtered by subject and year for past questions practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : waecQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No WAEC questions found</div>
              ) : (
                <div className="space-y-4">
                  {waecQuestions.map((q: any) => (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <div className="font-semibold">{q.subject} - {q.topic} {q.year ? `(${q.year})` : ''}</div>
                      <div className="text-sm mt-2">{q.question_text}</div>
                      {q.image_url && (
                        <div className="mt-2">
                          <img src={q.image_url} alt="Question" className="max-w-md max-h-48 rounded border" />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Options: A) {q.option_a} | B) {q.option_b} | C) {q.option_c} | D) {q.option_d} | Correct: {q.correct_answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subjects Management view
  if (view === 'subjects') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Manage Subjects</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Subject Code *</Label>
                  <Input
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    placeholder="e.g. mathematics"
                  />
                </div>
                <div>
                  <Label>Subject Name *</Label>
                  <Input
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={newSubject.display_order}
                    onChange={(e) => setNewSubject({...newSubject, display_order: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={async () => {
                    if (!newSubject.code || !newSubject.name) {
                      toast({ title: 'Validation Error', description: 'Code and name are required', variant: 'destructive' });
                      return;
                    }
                    if (!isStaff && !isSuperuser) {
                      toast({ 
                        title: 'Access Denied', 
                        description: 'Only staff members can manage subjects. Please contact an administrator.', 
                        variant: 'destructive' 
                      });
                      return;
                    }
                    try {
                      const result = await apiPost('subjects/create/', newSubject) as any;
                      if (result.success) {
                        toast({ title: 'Subject created successfully!' });
                        setNewSubject({ code: '', name: '', is_active: true, display_order: 0 });
                        await loadSubjects();
                      } else {
                        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
                      }
                    } catch (e: any) {
                      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
                    }
                  }}>Add Subject</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Subjects ({subjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                <div className="text-center py-8">Loading...</div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No subjects found</div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject: any) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{subject.name}</div>
                        <div className="text-sm text-muted-foreground">Code: {subject.code}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="text-sm text-muted-foreground">Order: {subject.display_order}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!isStaff && !isSuperuser) {
                              toast({ 
                                title: 'Access Denied', 
                                description: 'Only staff members can edit subjects.', 
                                variant: 'destructive' 
                              });
                              return;
                            }
                            setEditingSubject(subject);
                          }}
                          disabled={!isStaff && !isSuperuser}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!isStaff && !isSuperuser) {
                              toast({ 
                                title: 'Access Denied', 
                                description: 'Only staff members can delete subjects.', 
                                variant: 'destructive' 
                              });
                              return;
                            }
                            if (!confirm(`Delete subject "${subject.name}"? This will fail if it's used in questions.`)) return;
                            try {
                              const result = await apiDelete(`subjects/${subject.id}/delete/`) as any;
                              if (result.success) {
                                toast({ title: 'Subject deleted successfully!' });
                                await loadSubjects();
                              } else {
                                toast({ title: 'Failed', description: result.error, variant: 'destructive' });
                              }
                            } catch (e: any) {
                              toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
                            }
                          }}
                          disabled={!isStaff && !isSuperuser}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {editingSubject && (
            <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Subject Code</Label>
                    <Input
                      value={editingSubject.code}
                      onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    />
                  </div>
                  <div>
                    <Label>Subject Name</Label>
                    <Input
                      value={editingSubject.name}
                      onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={editingSubject.display_order}
                      onChange={(e) => setEditingSubject({...editingSubject, display_order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingSubject.is_active}
                      onChange={(e) => setEditingSubject({...editingSubject, is_active: e.target.checked})}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancel</Button>
                    <Button onClick={async () => {
                      if (!isStaff && !isSuperuser) {
                        toast({ 
                          title: 'Access Denied', 
                          description: 'Only staff members can edit subjects.', 
                          variant: 'destructive' 
                        });
                        return;
                      }
                      try {
                        const result = await apiPut(`subjects/${editingSubject.id}/update/`, editingSubject) as any;
                        if (result.success) {
                          toast({ title: 'Subject updated successfully!' });
                          setEditingSubject(null);
                          await loadSubjects();
                        } else {
                          toast({ title: 'Failed', description: result.error, variant: 'destructive' });
                        }
                      } catch (e: any) {
                        toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
                      }
                    }}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  // Institutions and Feature Management view
  if (view === 'institutions') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Manage Institutions</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-8">Loading institutions...</div>
          ) : institutions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No institutions found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {institutions.map((institution: any) => (
                <Card key={institution.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{institution.name || institution.institution_name || 'Unnamed Institution'}</CardTitle>
                        <CardDescription>
                          {institution.email || 'No email'} • ID: {institution.id}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setSelectedInstitution(institution);
                          await loadInstitutionFeatures(institution.id);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Features
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Feature Management Dialog */}
          {selectedInstitution && (
            <Dialog open={!!selectedInstitution} onOpenChange={(open) => !open && setSelectedInstitution(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Manage Features - {selectedInstitution.name || selectedInstitution.institution_name}</DialogTitle>
                  <CardDescription>
                    Restrict features for this institution. Unchecked features will be hidden from their dashboard.
                  </CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {allFeatures.map((feature) => {
                    const isRestricted = institutionFeatures.includes(feature);
                    const featureNames: Record<string, string> = {
                      'ai_chatbot': 'AI Chatbot',
                      'ai_question_generator': 'AI Question Generator',
                      'ai_study_assistant': 'AI Study Assistant'
                    };
                    return (
                      <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`feature-${feature}`}
                            checked={!isRestricted}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Remove from restricted list (enable feature)
                                setInstitutionFeatures(prev => prev.filter(f => f !== feature));
                              } else {
                                // Add to restricted list (disable feature)
                                setInstitutionFeatures(prev => [...prev, feature]);
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`feature-${feature}`} className="cursor-pointer">
                            {featureNames[feature] || feature}
                          </Label>
                        </div>
                        {isRestricted && (
                          <Badge variant="destructive">Restricted</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedInstitution(null)}>
                    Cancel
                  </Button>
                  <Button onClick={async () => {
                    await saveInstitutionFeatures(selectedInstitution.id);
                    setSelectedInstitution(null);
                  }}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  // JAMB Questions view (similar to WAEC)
  if (view === 'jamb-questions') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
              <h1 className="text-2xl font-bold">Create JAMB Questions</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New JAMB Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Question Text *</Label>
                  <Textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="Enter the question text..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <SubjectSelect
                      value={newQuestion.subject}
                      onChange={(value) => setNewQuestion({...newQuestion, subject: value})}
                      label="Subject"
                      required
                    />
                  </div>
                  <div>
                    <Label>Topic *</Label>
                    <Input
                      value={newQuestion.topic}
                      onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                      placeholder="e.g. Algebra"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Year *</Label>
                    <Input
                      type="number"
                      value={newQuestion.year}
                      onChange={(e) => setNewQuestion({...newQuestion, year: parseInt(e.target.value) || new Date().getFullYear()})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Option A *</Label>
                    <Input
                      value={newQuestion.option_a}
                      onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Option B *</Label>
                    <Input
                      value={newQuestion.option_b}
                      onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Option C *</Label>
                    <Input
                      value={newQuestion.option_c}
                      onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Option D *</Label>
                    <Input
                      value={newQuestion.option_d}
                      onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Correct Answer *</Label>
                    <select
                      value={newQuestion.correct_answer}
                      onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                      className="w-full p-2 border rounded mt-2"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                      className="w-full p-2 border rounded mt-2"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explain why this answer is correct..."
                    rows={2}
                    className="mt-2"
                  />
                </div>
                <Button onClick={() => handleCreateQuestion('jamb')}>Create Question</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JAMB Questions ({jambQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : jambQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No JAMB questions found</div>
              ) : (
                <div className="space-y-4">
                  {jambQuestions.map((q: any) => (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <div className="font-semibold">{q.subject} - {q.topic} {q.year ? `(${q.year})` : ''}</div>
                      <div className="text-sm mt-2">{q.question_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Analytics & Ads view
  if (view === 'analytics') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setView('dashboard')}>← Back</Button>
                <h1 className="text-2xl font-bold">Platform Analytics & Ads</h1>
              </div>
              <Button onClick={savePlatformAnalytics} disabled={analyticsLoading}>
                {analyticsLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Platform Analytics & Advertising
                </CardTitle>
                <CardDescription>
                  Configure analytics and advertising tracking for the Henotace platform. These codes will be injected on all platform pages to track visitors and ad campaigns.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Google Analytics 4 */}
            <Collapsible open={googleAnalyticsOpen} onOpenChange={setGoogleAnalyticsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Google Analytics 4</CardTitle>
                          <CardDescription>Track platform visitors and user behavior</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platformAnalytics.google_analytics_enabled && (
                          <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${googleAnalyticsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Enable Google Analytics</Label>
                        <p className="text-xs text-muted-foreground">Track all platform visitors with GA4</p>
                      </div>
                      <Switch
                        checked={platformAnalytics.google_analytics_enabled}
                        onCheckedChange={(checked) => setPlatformAnalytics(prev => ({ ...prev, google_analytics_enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ga4_id">Measurement ID</Label>
                      <Input
                        id="ga4_id"
                        placeholder="G-XXXXXXXXXX"
                        value={platformAnalytics.google_analytics_id}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Find this in Google Analytics: Admin → Data Streams → Select stream → Measurement ID
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Google Ads */}
            <Collapsible open={googleAdsOpen} onOpenChange={setGoogleAdsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.464 16.107l4-6.928c.39-.676.132-1.54-.577-1.93l-.927-.535c-.39-.225-.85-.289-1.289-.18-.439.11-.813.4-1.04.812l-3.08 5.333a3.5 3.5 0 0 0 1.282 4.78 3.5 3.5 0 0 0 4.78-1.28l.577-1c-.676-.39-.866-1.253-.577-1.929l-1.149 1.99a1.5 1.5 0 0 1-2.05.55 1.5 1.5 0 0 1-.55-2.05v-.633zM20.535 7.893l-4-6.928c-.227-.39-.586-.67-1.025-.78-.44-.11-.9-.046-1.29.18l-.927.535c-.709.39-.967 1.254-.577 1.93l4 6.928c.39.676 1.254.866 1.93.577l.927-.535c.71-.39.967-1.254.577-1.93v.023zm-5 8.66a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Google Ads</CardTitle>
                          <CardDescription>Track ad conversions and optimize campaigns</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platformAnalytics.google_ads_enabled && (
                          <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${googleAdsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Enable Google Ads Tracking</Label>
                        <p className="text-xs text-muted-foreground">Track conversions from Google Ads campaigns</p>
                      </div>
                      <Switch
                        checked={platformAnalytics.google_ads_enabled}
                        onCheckedChange={(checked) => setPlatformAnalytics(prev => ({ ...prev, google_ads_enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gads_id">Google Ads ID</Label>
                      <Input
                        id="gads_id"
                        placeholder="AW-XXXXXXXXX"
                        value={platformAnalytics.google_ads_id}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, google_ads_id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gads_conversion">Conversion ID (Optional)</Label>
                      <Input
                        id="gads_conversion"
                        placeholder="XXXXXXX"
                        value={platformAnalytics.google_ads_conversion_id}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, google_ads_conversion_id: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Facebook/Meta Pixel */}
            <Collapsible open={facebookPixelOpen} onOpenChange={setFacebookPixelOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                          <Facebook className="w-6 h-6 text-[#1877F2]" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Facebook/Meta Pixel</CardTitle>
                          <CardDescription>Track Facebook and Instagram ad conversions</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platformAnalytics.facebook_pixel_enabled && (
                          <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${facebookPixelOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Enable Meta Pixel</Label>
                        <p className="text-xs text-muted-foreground">Track visitors from Facebook & Instagram ads</p>
                      </div>
                      <Switch
                        checked={platformAnalytics.facebook_pixel_enabled}
                        onCheckedChange={(checked) => setPlatformAnalytics(prev => ({ ...prev, facebook_pixel_enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fb_pixel">Pixel ID</Label>
                      <Input
                        id="fb_pixel"
                        placeholder="XXXXXXXXXXXXXXX"
                        value={platformAnalytics.facebook_pixel_id}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fb_token">Conversions API Access Token (Optional)</Label>
                      <Input
                        id="fb_token"
                        type="password"
                        placeholder="EAAxxxxxx..."
                        value={platformAnalytics.facebook_access_token}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, facebook_access_token: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fb_test">Test Event Code (Optional)</Label>
                      <Input
                        id="fb_test"
                        placeholder="TEST12345"
                        value={platformAnalytics.facebook_test_event_code}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, facebook_test_event_code: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* TikTok Pixel */}
            <Collapsible open={tiktokPixelOpen} onOpenChange={setTiktokPixelOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                          <CardDescription>Track TikTok ad conversions</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platformAnalytics.tiktok_pixel_enabled && (
                          <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${tiktokPixelOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Enable TikTok Pixel</Label>
                        <p className="text-xs text-muted-foreground">Track visitors from TikTok ads</p>
                      </div>
                      <Switch
                        checked={platformAnalytics.tiktok_pixel_enabled}
                        onCheckedChange={(checked) => setPlatformAnalytics(prev => ({ ...prev, tiktok_pixel_enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_pixel">TikTok Pixel ID</Label>
                      <Input
                        id="tiktok_pixel"
                        placeholder="XXXXXXXXXXXXXXX"
                        value={platformAnalytics.tiktok_pixel_id}
                        onChange={(e) => setPlatformAnalytics(prev => ({ ...prev, tiktok_pixel_id: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Help Card */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Platform-Wide Analytics</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      These tracking codes will be automatically injected on all Henotace platform pages. Use them to:
                    </p>
                    <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                      <li>• Track all platform visitors and page views</li>
                      <li>• Measure sign-up and subscription conversions</li>
                      <li>• Build retargeting audiences for your ad campaigns</li>
                      <li>• Calculate ROI and optimize ad spend</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Removed create exam views - questions can be added directly via Create WAEC/JAMB Questions
  // This avoids repetition since questions can be filtered by year in the question bank

  return null;
}

