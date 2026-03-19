import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/lib/api";
import { reportLoginFailure } from "@/services/errorReporting";
import { 
  ArrowLeft, 
  Briefcase, 
  Mail, 
  Lock, 
  User, 
  Phone,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";

const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

interface Business {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
}

export default function ServiceClientAuth() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Register form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Fetch business info
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.business) {
            setBusiness({
              id: parseInt(data.business.id),
              name: data.business.name,
              slug: data.business.slug,
              logo: data.business.logo,
              primary_color: data.business.primary_color || '#3b82f6',
              secondary_color: data.business.secondary_color || '#1f2937',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store client token
        localStorage.setItem('client_access_token', data.access);
        localStorage.setItem('client_refresh_token', data.refresh);
        localStorage.setItem('client_business_slug', slug || '');
        
        toast({
          title: "Welcome back!",
          description: "Login successful"
        });
        
        // Redirect to client dashboard
        navigate(`/services/${slug}/dashboard`);
      } else {
        const errorMessage = data.error || "Invalid credentials";
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive"
        });
        // Report login failure to error tracking
        reportLoginFailure(loginForm.email, errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive"
      });
      // Report login failure to error tracking
      reportLoginFailure(loginForm.email, "Failed to connect");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    if (registerForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/services/${slug}/client-register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store client token
        localStorage.setItem('client_access_token', data.access);
        localStorage.setItem('client_refresh_token', data.refresh);
        localStorage.setItem('client_business_slug', slug || '');
        
        toast({
          title: "Account Created!",
          description: "Welcome! Your account has been created."
        });
        
        // Redirect to client dashboard
        navigate(`/services/${slug}/dashboard`);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to create account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const primaryColor = business?.primary_color || '#3b82f6';
  const secondaryColor = business?.secondary_color || '#1f2937';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: secondaryColor }}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(`/services/${slug}`)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {business?.logo ? (
              <img 
                src={business.logo} 
                alt={business.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Briefcase className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-white">{business?.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Client Portal</CardTitle>
            <CardDescription className="text-slate-400">
              Login or create an account to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-slate-600 text-slate-300 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-slate-600 text-slate-300 data-[state=active]:text-white"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="pl-10 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="pl-10 pr-10 bg-slate-900 border-slate-600 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="John Doe"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                        className="pl-10 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        className="pl-10 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="+234..."
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                        className="pl-10 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        className="pl-10 pr-10 bg-slate-900 border-slate-600 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                        className="pl-10 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-slate-500 text-sm">
        <p>Powered by HenotaceAI</p>
      </div>
    </div>
  );
}
