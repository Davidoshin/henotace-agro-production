import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/LoadingSpinner";
import { getBaseUrl } from "@/lib/api";

// Use centralized API base URL that handles environment correctly
const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

interface StoreAuthProps {
  businessName: string;
  businessSlug: string;
  businessLogo?: string | null;
  onSuccess: (data: any) => void;
  onBack: () => void;
}

export default function StoreAuth({ businessName, businessSlug, businessLogo, onSuccess, onBack }: StoreAuthProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    if (!loginPassword) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/business/${businessSlug}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens - use consistent keys with DashboardLayout
      localStorage.setItem('accessToken', data.tokens.access);
      localStorage.setItem('refreshToken', data.tokens.refresh);
      localStorage.setItem('userRole', data.user.role || 'customer');
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('customer', JSON.stringify(data.customer));
      localStorage.setItem('current_business', JSON.stringify(data.business));

      toast({ title: "Success", description: data.message });
      onSuccess(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    if (!registerData.first_name) {
      toast({ title: "Error", description: "First name is required", variant: "destructive" });
      return;
    }
    if (!registerData.password) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }
    if (registerData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/business/${businessSlug}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          phone: registerData.phone,
          address: registerData.address
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store tokens - use consistent keys with DashboardLayout
      localStorage.setItem('accessToken', data.tokens.access);
      localStorage.setItem('refreshToken', data.tokens.refresh);
      localStorage.setItem('userRole', data.user.role || 'customer');
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('customer', JSON.stringify(data.customer));
      localStorage.setItem('current_business', JSON.stringify(data.business));

      toast({ title: "Success", description: data.message });
      onSuccess(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {businessLogo ? (
            <img 
              src={businessLogo} 
              alt={businessName}
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-10 w-10 text-primary" />
            </div>
          )}
          <CardTitle>{businessName}</CardTitle>
          <CardDescription>
            Sign in or create an account to shop
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name *</Label>
                    <Input
                      id="first-name"
                      placeholder="John"
                      value={registerData.first_name}
                      onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      placeholder="Doe"
                      value={registerData.last_name}
                      onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="08012345678"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-address">Address (optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-address"
                      placeholder="123 Main St"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By creating an account, you'll become a customer of {businessName}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
