import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Shield, Eye, EyeOff } from 'lucide-react';
import { getBaseUrl } from '@/lib/api';

const apiCallPublic = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response.json();
};

export default function BRMLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiCallPublic('brm/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        // Store tokens and staff data
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('brmStaff', JSON.stringify(data.staff));
        localStorage.setItem('userRole', 'brm_staff');

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.staff.first_name || data.staff.email}!`,
        });

        // Redirect to BRM dashboard
        setTimeout(() => {
          navigate('/brm-dashboard');
        }, 500);
      }
    } catch (error: any) {
      let userFriendlyError = '';
      
      if (error?.status === 401) {
        userFriendlyError = 'Invalid email or password. Please try again.';
      } else if (error?.status === 403) {
        userFriendlyError = error?.data?.error || 'You are not authorized as platform staff.';
      } else {
        userFriendlyError = error?.data?.error || error?.message || 'Unable to login. Please try again.';
      }
      
      setError(userFriendlyError);
      toast({
        title: "Login Failed",
        description: userFriendlyError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-gray-900 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {!logoError ? (
              <img 
                src="/light-mode-logo.jpg" 
                alt="Henotace Logo" 
                className="h-12 w-12 rounded-lg"
                onError={() => setLogoError(true)}
              />
            ) : (
              <UserCog className="h-12 w-12 text-purple-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">Henotace Staff Portal</CardTitle>
            <CardDescription>Business Relationship Manager Login</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@henotace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Staff portal for Business Relationship Managers</p>
            <p className="mt-1">Contact admin if you need access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
