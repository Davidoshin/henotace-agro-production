import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowLeft, Fingerprint, ShieldCheck, KeyRound, Mail, Eye, EyeOff, Sprout } from 'lucide-react';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { getBaseUrl } from '@/lib/api';
import { reportLoginFailure } from '@/services/errorReporting';

const BusinessLogin = () => {
  const AUTH_REQUEST_TIMEOUT_MS = 12000;
  const navigate = useNavigate();
  const location = useLocation();
  const isAgroRoute = location.pathname === '/agro-login';
  const loginRealm = isAgroRoute ? 'agro' : 'business';
  const loginEndpoint = `${getBaseUrl()}auth/${isAgroRoute ? 'agro' : 'business'}/login/`;
  const forgotPasswordContext = isAgroRoute ? 'agro-login' : 'business-login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  // Biometrics state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  
  // 2FA state
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  
  // Forgot password state
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs: number = AUTH_REQUEST_TIMEOUT_MS
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const getErrorMessage = (err: any, fallback: string) => {
    if (err?.name === 'AbortError') {
      return 'Request timed out. Please check your internet and try again.';
    }
    return err?.message || fallback;
  };

  // Check biometrics availability on mount
  useEffect(() => {
    checkBiometricsAvailability();
    // Load cached credentials if available
    loadCachedCredentials();
  }, []);

  // Load cached credentials from localStorage
  const loadCachedCredentials = () => {
    try {
      const cachedEmail = localStorage.getItem('cached_login_email');
      const cachedPassword = localStorage.getItem('cached_login_password');
      if (cachedEmail) {
        setEmail(cachedEmail);
      }
      if (cachedPassword) {
        // Decode the base64 encoded password
        setPassword(atob(cachedPassword));
      }
    } catch (err) {
      console.log('Failed to load cached credentials:', err);
    }
  };

  // Save credentials to localStorage for future logins
  const saveCachedCredentials = (emailToSave: string, passwordToSave: string) => {
    try {
      localStorage.setItem('cached_login_email', emailToSave);
      // Encode password in base64 for basic obfuscation (not security)
      localStorage.setItem('cached_login_password', btoa(passwordToSave));
    } catch (err) {
      console.log('Failed to cache credentials:', err);
    }
  };

  const checkBiometricsAvailability = async () => {
    try {
      // Check if WebAuthn is available
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricsAvailable(available);
        
        // Check if user has enrolled biometrics
        const enrolled = localStorage.getItem('biometrics_enrolled') === 'true';
        const storedEmail = localStorage.getItem('biometrics_email');
        // Only show biometric login if credentials exist and are properly enrolled
        setBiometricsEnrolled(enrolled && !!storedEmail);
      }
    } catch (err) {
      console.log('Biometrics not available:', err);
      setBiometricsAvailable(false);
    }
  };

  const isAgroBusiness = (businessData: any, realm?: string) => {
    const category = String(businessData?.business_category || businessData?.category || '').toLowerCase();
    const businessType = String(businessData?.business_type || businessData?.type || '').toLowerCase();
    return realm === 'agro' || category === 'agro_production' || ['agro_production', 'agro', 'agriculture', 'farm'].includes(businessType);
  };

  const persistBusinessCategory = (businessData: any, realm?: string) => {
    if (!businessData && realm !== 'agro') return;
    const category = String(businessData?.business_category || businessData?.category || '').toLowerCase();
    const businessType = String(businessData?.business_type || businessData?.type || '').toLowerCase();
    const resolvedCategory = category || (realm === 'agro' ? 'agro_production' : '');
    const resolvedType = businessType || (realm === 'agro' ? 'agro_production' : '');
    if (resolvedCategory) {
      localStorage.setItem('business_category', resolvedCategory);
    }
    if (resolvedType) {
      localStorage.setItem('business_type', resolvedType);
    }
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    setError('');
    
    try {
      const storedCredentialId = localStorage.getItem('biometrics_credential_id');
      const storedEmail = localStorage.getItem('biometrics_email');
      const storedToken = localStorage.getItem('biometrics_token');
      
      if (!storedCredentialId || !storedEmail || !storedToken) {
        setError('Biometric credentials not found. Please login with email and password first.');
        setIsBiometricLoading(false);
        return;
      }
      
      // Create credential request options
      const credentialIdBuffer = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32),
        rpId: window.location.hostname,
        allowCredentials: [{
          id: credentialIdBuffer,
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60000
      };
      
      // Fill challenge with random values
      crypto.getRandomValues(publicKeyCredentialRequestOptions.challenge as Uint8Array);
      
      // Get credential (this triggers biometric prompt)
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;
      
      if (credential) {
        // Biometric verification successful, now login with stored credentials
        const decodedPassword = atob(storedToken);
        
        const response = await fetchWithTimeout(loginEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include session cookies for 2FA flow
          body: JSON.stringify({
            email: storedEmail,
            password: decodedPassword,
            realm: loginRealm,
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.detail || 'Login failed');
        }
        
        // Check if 2FA is required
        if (data.requires_2fa) {
          setPendingLoginData({
            email: storedEmail,
            password: decodedPassword,
            user_id: data.user_id
          });
          setShow2FADialog(true);
          setIsBiometricLoading(false);
          return;
        }
        
        // Store tokens and user data
        handleSuccessfulLogin(data);
      }
    } catch (err: any) {
      console.error('Biometric login error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Biometric authentication was cancelled or not allowed.');
      } else {
        setError(getErrorMessage(err, 'Biometric login failed. Please try email and password.'));
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSuccessfulLogin = (data: any) => {
    // NOTE: Primary tokens are now stored in HttpOnly cookies by the server
    // The server sets henotace_access_token and henotace_refresh_token cookies
    // which JavaScript cannot access (this is intentional for security)
    
    // For backwards compatibility with mobile apps and existing code,
    // we also store tokens in localStorage if they're in the response
    const accessToken = data.tokens?.access || data.access;
    const refreshToken = data.tokens?.refresh || data.refresh;
    
    if (accessToken) {
      // Store in localStorage for backwards compatibility
      // Primary auth will use HttpOnly cookies set by server
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken || '');
    }
    
    const role = data.user?.role || data.login_as || data.role || 'business_owner';
    localStorage.setItem('userRole', role);
    localStorage.setItem('user_role', role);
    
    // Build user data object
    const userData = {
      id: data.user?.id || data.user_id,
      email: data.user?.email || email,
      first_name: data.user?.first_name || '',
      last_name: data.user?.last_name || '',
      role: role,
      profile_image: data.user?.profile_image || ''
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('user_id', userData.id?.toString() || '');
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('user_first_name', userData.first_name);
    localStorage.setItem('user_last_name', userData.last_name);
    
    // Store business data if available
    if (data.business) {
      localStorage.setItem('business_id', data.business.id?.toString() || '');
      localStorage.setItem('business_name', data.business.name || '');
      localStorage.setItem('business_unique_code', data.business.code || data.business.unique_code || '');
      localStorage.setItem('business_slug', data.business.slug || data.business.code?.toLowerCase() || '');
    }
    const agroAccount = isAgroRoute || isAgroBusiness(data.business, data.realm);
    persistBusinessCategory(data.business, data.realm);
    
    toast({
      title: 'Login successful',
      description: `Welcome back${userData.first_name ? ', ' + userData.first_name : ''}!`,
    });
    
    // Save credentials for future logins (auto-fill feature)
    saveCachedCredentials(userData.email, password);
    
    // Navigate based on role
    if (agroAccount) {
      navigate('/agro-dashboard');
    } else if (role === 'business_staff' || role === 'staff') {
      navigate('/business-staff-dashboard');
    } else {
      navigate('/business-admin-dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchWithTimeout(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookies for 2FA flow
        body: JSON.stringify({ email, password, realm: loginRealm })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Login failed');
      }

      // Check if 2FA is required
      if (data.requires_2fa) {
        setPendingLoginData({
          email,
          password,
          user_id: data.user_id
        });
        setShow2FADialog(true);
        setIsLoading(false);
        return;
      }

      // Store tokens and user data
      handleSuccessfulLogin(data);
      
      // If biometrics is enrolled for this user, store the password for future biometric login
      const biometricsEnrolledEmail = localStorage.getItem('biometrics_email');
      if (biometricsEnrolledEmail === email && localStorage.getItem('biometrics_enrolled') === 'true') {
        localStorage.setItem('biometrics_token', btoa(password));
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = getErrorMessage(err, 'Login failed. Please check your credentials.');
      setError(errorMessage);
      // Report login failure to error tracking
      reportLoginFailure(email, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIs2FALoading(true);
    setError('');
    
    try {
      // Use verify-login-session endpoint which handles session-based 2FA during login
      const response = await fetchWithTimeout(`${getBaseUrl()}auth/2fa/verify-login-session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          email: pendingLoginData.email,
          code: twoFactorCode,
          realm: loginRealm,
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || data.detail || '2FA verification failed');
      }
      
      // Close dialog and complete login
      setShow2FADialog(false);
      setTwoFactorCode('');
      
      // The verify-login-session endpoint returns tokens directly
      if (data.success && (data.access || data.tokens?.access)) {
        handleSuccessfulLogin(data);
      } else {
        throw new Error('2FA verification did not return tokens');
      }
      
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(getErrorMessage(err, '2FA verification failed'));
    } finally {
      setIs2FALoading(false);
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
      const response = await fetchWithTimeout(`${getBaseUrl()}otp/send-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          account_type: 'business',
          realm: loginRealm,
          login_context: forgotPasswordContext,
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
      setForgotPasswordError(getErrorMessage(err, 'Failed to send reset code'));
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
      const response = await fetchWithTimeout(`${getBaseUrl()}otp/login-with-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          otp_code: otpCode,
          account_type: 'business',
          realm: loginRealm,
          login_context: forgotPasswordContext,
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
      
      // Handle successful login
      handleSuccessfulLogin(data);
      
      // Show reminder to change password
      toast({
        title: 'Login Successful',
        description: 'Please change your password in Manage Account.',
        duration: 5000,
      });
      
    } catch (err: any) {
      console.error('Login with OTP error:', err);
      setForgotPasswordError(getErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}otp/resend/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          purpose: 'password_reset',
          account_type: 'business',
          realm: loginRealm,
          login_context: forgotPasswordContext,
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
      setForgotPasswordError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isAgroRoute ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className={`p-2 rounded-lg ${isAgroRoute ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              {isAgroRoute ? (
                <Sprout className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{isAgroRoute ? 'Farm Login' : 'Business Login'}</CardTitle>
              <CardDescription>
                {isAgroRoute ? 'Sign in to manage your farm operations' : 'Sign in to manage your business'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Biometric Login Button */}
            {biometricsAvailable && biometricsEnrolled && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 flex items-center justify-center gap-3 border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:hover:border-blue-500 dark:hover:bg-blue-900 dark:hover:text-blue-200 transition-colors"
                  onClick={handleBiometricLogin}
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    <ButtonSpinner className="mr-2" />
                  ) : (
                    <Fingerprint className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-200" />
                  )}
                  <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                    {isBiometricLoading ? 'Verifying...' : 'Sign in with Biometrics'}
                  </span>
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
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
                disabled={isLoading}
              />
            </div>

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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className={`w-full ${isAgroRoute ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} disabled={isLoading}>
              {isLoading ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Signing in...
                </>
              ) : (
                isAgroRoute ? 'Sign In to Farm' : 'Sign In'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className={`p-0 h-auto font-semibold ${isAgroRoute ? 'text-emerald-600 hover:text-emerald-700' : ''}`}
                  onClick={() => navigate(isAgroRoute ? '/signup?type=agro' : '/signup?type=business')}
                >
                  {isAgroRoute ? 'Register your farm' : 'Register your business'}
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to complete login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Authentication Code</Label>
              <Input
                id="2fa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
            <Button 
              onClick={handle2FAVerify} 
              className="w-full"
              disabled={is2FALoading || twoFactorCode.length !== 6}
            >
              {is2FALoading ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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
              <KeyRound className="h-5 w-5 text-blue-600" />
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
    </div>
  );
};

export default BusinessLogin;