import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiCallPublic, apiGet } from '@/lib/api';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login for:', email); // Debug log
      const response = await apiCallPublic('auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      }) as any;
      console.log('Login response:', response); // Debug log

      // Check if 2FA is required
      if (response.requires_2fa) {
        setRequires2FA(true);
        setTwoFAEmail(email);
        toast({
          title: '2FA Required',
          description: 'Please enter your 2FA code to continue',
        });
        setIsLoading(false);
        return;
      }

      console.log('[AdminLogin] Full login response:', response);
      
      if (response.access && response.refresh) {
        // Store tokens
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        
        // Store user data
        if (response.user) {
          console.log('[AdminLogin] User data from response:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          // Prioritize staff/superuser status over role for admin access
          let actualRole = 'staff';
          if (response.user.is_superuser) {
            actualRole = 'admin';
          } else if (response.user.is_staff) {
            actualRole = 'staff';
          } else if (response.user.role === 'admin' || response.user.role === 'staff') {
            actualRole = response.user.role;
          }
          console.log('[AdminLogin] Setting userRole to:', actualRole);
          console.log('[AdminLogin] is_staff:', response.user.is_staff, 'is_superuser:', response.user.is_superuser);
          localStorage.setItem('userRole', actualRole);
        } else {
          console.error('[AdminLogin] No user data in response! Response keys:', Object.keys(response));
          // Try to fetch user profile if user data is missing
          try {
            const profileResponse = await apiGet('user/profile/') as any;
            if (profileResponse) {
              console.log('[AdminLogin] Fetched user profile:', profileResponse);
              localStorage.setItem('user', JSON.stringify(profileResponse));
              let actualRole = 'staff';
              if (profileResponse.is_superuser) {
                actualRole = 'admin';
              } else if (profileResponse.is_staff) {
                actualRole = 'staff';
              }
              localStorage.setItem('userRole', actualRole);
            }
          } catch (e) {
            console.error('[AdminLogin] Failed to fetch user profile:', e);
          }
        }

        toast({
          title: 'Login Successful',
          description: 'Redirecting to admin dashboard...'
        });

        // Force page reload to ensure ProtectedRoute picks up new role
        window.location.href = '/henotacengadmin';
      } else {
        console.error('Invalid login response:', response); // Debug log
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      
      // Handle different types of errors with user-friendly messages
      let userFriendlyError = '';
      
      // Check if it's a network/connection error
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('unreachable') ||
          error?.isNetworkError ||
          error?.name === 'TypeError' ||
          !navigator.onLine) {
        userFriendlyError = 'Network is unreachable. Please check your internet connection and try again.';
      }
      // Check if it's an authentication error (400 status)
      else if (error?.status === 400 || error?.data?.error) {
        // Use the backend error message if available
        userFriendlyError = error?.data?.error || error?.data?.detail || error?.message || 'Your email or password is incorrect. Please check your credentials and try again.';
      }
      // Check if it's a server error (500 status)
      else if (error?.status === 500) {
        userFriendlyError = error?.data?.error || 'Service temporarily unavailable. Please try again in a moment.';
      }
      // Generic error fallback
      else {
        userFriendlyError = error?.data?.error || error?.data?.detail || error?.message || 'Unable to login. Please check your credentials and try again.';
      }
      
      toast({
        title: 'Login Failed',
        description: userFriendlyError,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!otpCode.trim() || !twoFAEmail) {
      toast({
        title: 'Validation Error',
        description: 'Please enter the 6-digit code',
        variant: 'destructive'
      });
      return;
    }

    setTwoFALoading(true);
    try {
      const data = await apiCallPublic('auth/2fa/verify-login-session/', {
        method: 'POST',
        body: JSON.stringify({ 
          email: twoFAEmail, 
          code: otpCode.trim(), 
          realm: 'cbt' 
        })
      }) as any;
      
      console.log('[AdminLogin] 2FA verification response:', data);
      
      if (data.success && data.access && data.refresh) {
        // Store tokens
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        
        // Store user data
        if (data.user) {
          console.log('[AdminLogin] User data from 2FA response:', data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Prioritize staff/superuser status over role for admin access
          let actualRole = 'staff';
          if (data.user.is_superuser) {
            actualRole = 'admin';
          } else if (data.user.is_staff) {
            actualRole = 'staff';
          } else if (data.user.role === 'admin' || data.user.role === 'staff') {
            actualRole = data.user.role;
          }
          console.log('[AdminLogin] Setting userRole to:', actualRole);
          console.log('[AdminLogin] is_staff:', data.user.is_staff, 'is_superuser:', data.user.is_superuser);
          localStorage.setItem('userRole', actualRole);
        } else {
          console.error('[AdminLogin] No user data in 2FA response! Response keys:', Object.keys(data));
          // Try to fetch user profile if user data is missing
          try {
            const profileResponse = await apiGet('user/profile/') as any;
            if (profileResponse) {
              console.log('[AdminLogin] Fetched user profile after 2FA:', profileResponse);
              localStorage.setItem('user', JSON.stringify(profileResponse));
              let actualRole = 'staff';
              if (profileResponse.is_superuser) {
                actualRole = 'admin';
              } else if (profileResponse.is_staff) {
                actualRole = 'staff';
              }
              localStorage.setItem('userRole', actualRole);
            }
          } catch (e) {
            console.error('[AdminLogin] Failed to fetch user profile after 2FA:', e);
          }
        }

        toast({
          title: 'Login Successful',
          description: 'Redirecting to admin dashboard...'
        });

        // Reset 2FA state
        setRequires2FA(false);
        setOtpCode('');
        setTwoFAEmail('');

        // Force page reload to ensure ProtectedRoute picks up new role
        window.location.href = '/henotacengadmin';
      } else {
        toast({
          title: 'Invalid Code',
          description: data.message || 'The code you entered is incorrect. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error?.message || 'Invalid code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-2"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Two-factor authentication is required for this account.
                </p>
                <p className="text-sm font-medium">
                  Enter the 6-digit code sent to {twoFAEmail}
                </p>
              </div>
              <div>
                <Label htmlFor="otp-code">2FA Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="mt-2 text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={twoFALoading}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRequires2FA(false);
                    setOtpCode('');
                    setTwoFAEmail('');
                    setPassword('');
                  }}
                  disabled={twoFALoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handle2FAVerify}
                  disabled={twoFALoading || !otpCode.trim() || otpCode.length !== 6}
                >
                  {twoFALoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

