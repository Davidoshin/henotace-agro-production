import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Shield } from 'lucide-react';
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

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const data = await apiCallPublic('auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          login_context: 'admin-login',
          realm: 'cbt',
        }),
      });

      // Store tokens and user data
      localStorage.setItem('accessToken', data?.access || '');
      localStorage.setItem('refreshToken', data?.refresh || '');
      localStorage.setItem('userRole', data?.user?.role || 'school_admin');
      if (data?.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data?.user?.first_name || data?.user?.email || 'Admin'}!`,
      });

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 500);
    } catch (error: any) {
      let userFriendlyError = '';
      
      if (error?.status === 400) {
        userFriendlyError = error?.data?.error || error?.message || 'Your email or password is incorrect. Please check your credentials and try again.';
      } else if (error?.status === 500) {
        userFriendlyError = error?.data?.error || 'Service temporarily unavailable. Please try again in a moment.';
      } else {
        userFriendlyError = error?.data?.error || error?.message || 'Unable to login. Please check your credentials and try again.';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-950 dark:via-gray-900 dark:to-cyan-950 p-4">
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
              <Shield className="h-12 w-12 text-blue-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">Henotace</CardTitle>
            <CardDescription>Admin Login</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </Button>

            <div className="text-center text-sm">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/school')}
                className="text-muted-foreground"
              >
                ← Back to School Portal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

