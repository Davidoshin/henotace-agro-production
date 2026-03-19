import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { apiCallPublic, getBaseUrl } from '@/lib/api';
import { reportLoginFailure } from '@/services/errorReporting';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get('type');
  
  // Redirect to business login if type is business
  useEffect(() => {
    if (loginType === 'business') {
      navigate('/business-login');
    }
  }, [loginType, navigate]);
  const [email, setEmail] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomerCode, setUseCustomerCode] = useState(false);
  const { toast } = useToast();
  
  // Forgot password state
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [showDashboardDialog, setShowDashboardDialog] = useState(false);
  const [dashboardOptions, setDashboardOptions] = useState<any[]>([]);
  const [pendingLoginCredentials, setPendingLoginCredentials] = useState<{ email: string; password: string } | null>(null);

  const persistCustomerSession = (data: any) => {
    localStorage.setItem('accessToken', data.tokens.access);
    localStorage.setItem('refreshToken', data.tokens.refresh);
    localStorage.setItem('userRole', 'customer');
    localStorage.setItem('userData', JSON.stringify(data.user));
  };

  const handleSelectDashboard = async (option: any) => {
    if (!pendingLoginCredentials) {
      setError('Session expired. Please login again.');
      setShowDashboardDialog(false);
      return;
    }

    if ((option?.realm || '').toLowerCase() === 'hotel') {
      toast({
        title: 'Hotel dashboard selected',
        description: 'Please use Henotace Hotels login to open the hotel dashboard.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await apiCallPublic('auth/customer/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: pendingLoginCredentials.email,
          password: pendingLoginCredentials.password,
          business_id: option.business_id,
        }),
      }) as any;

      if (data.success && data.tokens) {
        persistCustomerSession(data);
        setShowDashboardDialog(false);
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.user?.first_name || data.user?.email || 'Customer'}!`,
        });
        navigate('/customer-dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (e: any) {
      setError(e?.data?.error || e?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (!email && !customerCode) {
      setError('Email or customer code is required');
      setIsLoading(false);
      return;
    }

    try {
      const loginData: any = {
        password,
      };

      if (useCustomerCode && customerCode) {
        loginData.customer_code = customerCode;
        const businessId = searchParams.get('business_id');
        if (businessId) {
          loginData.business_id = businessId;
        }
      } else if (email) {
        loginData.email = email;
        const businessId = searchParams.get('business_id');
        if (businessId) {
          loginData.business_id = businessId;
        }
      }

      const data = await apiCallPublic('auth/customer/login/', {
        method: 'POST',
        body: JSON.stringify(loginData),
      }) as any;

      if (data?.requires_dashboard_selection && Array.isArray(data.customer_dashboards)) {
        setPendingLoginCredentials({ email, password });
        setDashboardOptions(data.customer_dashboards);
        setShowDashboardDialog(true);
        return;
      }

      if (data.success && data.tokens) {
        persistCustomerSession(data);
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.user?.first_name || data.user?.email || 'Customer'}!`,
        });

        // Navigate to customer dashboard
        navigate('/customer-dashboard');
      } else {
        setError(data.error || 'Login failed');
        // Report login failure to error tracking
        reportLoginFailure(email || customerCode, data.error || 'Login failed');
      }
    } catch (e: any) {
      const errorMessage = e?.data?.error || e?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      // Report login failure to error tracking
      reportLoginFailure(email || customerCode, errorMessage, e?.status === 429);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handlers
  const handleSendResetOTP = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }
    
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    
    try {
      const response = await fetch(`${getBaseUrl()}otp/send-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          account_type: 'customer',
          login_context: 'customer-login',
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }
      
      toast({
        title: 'Code Sent',
        description: 'If an account exists with this email, a reset code has been sent.',
      });
      
      setForgotPasswordStep('otp');
    } catch (err: any) {
      console.error('Send reset OTP error:', err);
      setForgotPasswordError(err.message || 'Failed to send reset code');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };
  
  const handleLoginWithOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setForgotPasswordError('Please enter the 6-digit code');
      return;
    }
    
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    
    try {
      const response = await fetch(`${getBaseUrl()}otp/login-with-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          otp_code: otpCode,
          account_type: 'customer',
          login_context: 'customer-login',
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }
      
      // Close dialog
      setShowForgotPasswordDialog(false);
      setForgotPasswordStep('email');
      setForgotPasswordEmail('');
      setOtpCode('');
      
      // Handle successful login - store tokens
      if (data.access) {
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('userRole', data.user?.role || 'customer');
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      toast({
        title: 'Login Successful',
        description: 'Please change your password in Manage Account.',
        duration: 5000,
      });
      
      // Navigate to customer dashboard
      navigate('/customer-dashboard');
      
    } catch (err: any) {
      console.error('Login with OTP error:', err);
      setForgotPasswordError(err.message || 'Invalid or expired code');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    
    try {
      const response = await fetch(`${getBaseUrl()}otp/resend/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          purpose: 'password_reset',
          account_type: 'customer',
          login_context: 'customer-login',
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setForgotPasswordError(err.message || 'Failed to resend code');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Customer Login</CardTitle>
            <CardDescription>
              Sign in to your customer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={!useCustomerCode ? "default" : "outline"}
                  onClick={() => setUseCustomerCode(false)}
                  className="flex-1"
                >
                  Email
                </Button>
                <Button
                  type="button"
                  variant={useCustomerCode ? "default" : "outline"}
                  onClick={() => setUseCustomerCode(true)}
                  className="flex-1"
                >
                  Customer Code
                </Button>
              </div>

              {!useCustomerCode ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customerCode">Customer Code</Label>
                  <Input
                    id="customerCode"
                    type="text"
                    placeholder="CUST-XXXXX"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setShowForgotPasswordDialog(true);
                      setForgotPasswordStep('email');
                      setForgotPasswordEmail(email);
                      setOtpCode('');
                      setForgotPasswordError('');
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => navigate('/signup?type=customer')}
                >
                  Contact your business
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={(open) => {
        setShowForgotPasswordDialog(open);
        if (!open) {
          setForgotPasswordStep('email');
          setForgotPasswordError('');
          setOtpCode('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {forgotPasswordStep === 'email' ? 'Reset Password' : 'Enter Verification Code'}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' 
                ? "Enter your email address and we'll send you a one-time code to login."
                : "Enter the 6-digit code sent to your email to login."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {forgotPasswordError && (
              <Alert variant="destructive">
                <AlertDescription>{forgotPasswordError}</AlertDescription>
              </Alert>
            )}
            
            {forgotPasswordStep === 'email' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={isForgotPasswordLoading}
                    autoFocus
                  />
                </div>
                <Button 
                  onClick={handleSendResetOTP} 
                  className="w-full"
                  disabled={isForgotPasswordLoading || !forgotPasswordEmail}
                >
                  {isForgotPasswordLoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Code
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Verification Code</Label>
                  <Input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    disabled={isForgotPasswordLoading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to {forgotPasswordEmail}
                  </p>
                </div>
                <Button 
                  onClick={handleLoginWithOTP} 
                  className="w-full"
                  disabled={isForgotPasswordLoading || otpCode.length !== 6}
                >
                  {isForgotPasswordLoading ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Login with Code'
                  )}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-muted-foreground"
                    onClick={() => setForgotPasswordStep('email')}
                    disabled={isForgotPasswordLoading}
                  >
                    Change email
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-muted-foreground"
                    onClick={handleResendOTP}
                    disabled={isForgotPasswordLoading}
                  >
                    Resend code
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDashboardDialog} onOpenChange={setShowDashboardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Dashboard</DialogTitle>
            <DialogDescription>
              This email is linked to multiple customer dashboards. Choose one to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dashboardOptions.map((option) => (
              <Button
                key={`${option.business_id}-${option.realm}`}
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSelectDashboard(option)}
                disabled={isLoading}
              >
                <span>{option.business_name}</span>
                <span className="text-xs text-muted-foreground uppercase">{option.realm}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerLogin;