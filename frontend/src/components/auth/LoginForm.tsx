import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Building2, User, School, ArrowRight } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiCallPublic, getBaseUrl } from "@/lib/api";

interface LoginFormProps {
  onLoginSuccess: (user: any, role: string) => void;
}

export const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const { toast } = useToast();
  
  // Get initial menu selection from URL query parameters
  const [selectedMenu, setSelectedMenu] = useState<'student' | 'institution' | 'teacher' | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const login = params.get('login');
      // If type and login=true are specified, automatically select that menu (skip selection screen)
      if ((type === 'student' || type === 'institution') && login === 'true') {
        return type as 'student' | 'institution';
      }
      if (type === 'student' || type === 'institution') {
        return type as 'student' | 'institution';
      }
    }
    return null;
  });
  
  // Check if signup mode should be enabled
  const [shouldSignup, setShouldSignup] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('signup') === 'true';
    }
    return false;
  });
  
  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);

  const openReset = (prefill?: string) => {
    setResetEmail(prefill || "");
    setResetOpen(true);
  };

  const submitReset = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      await apiCallPublic('auth/password/reset-request/', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), realm: 'cbt' })
      });
      toast({ title: 'Password reset sent', description: 'Check your email for the reset link.' });
      setResetOpen(false);
    } catch (e: any) {
      toast({ title: 'Reset failed', description: e?.message || 'Unable to send reset link.', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const submitOtp = async (role: 'student' | 'institution') => {
    if (!twoFAEmail || !otpCode.trim()) return;
    setTwoFALoading(true);
    try {
      const data = await apiCallPublic('auth/2fa/verify-login-session/', {
        method: 'POST',
        body: JSON.stringify({ email: twoFAEmail, code: otpCode.trim(), realm: 'cbt' })
      }) as any;
      
      if (data.success) {
        // store tokens and proceed
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        // Use actual role from backend if available, otherwise map the login role
        const actualRole = data?.user?.role || (role === 'student' ? 'cbt_student' : 'cbt_institution');
        localStorage.setItem('userRole', actualRole);
        localStorage.setItem('userData', JSON.stringify(data.user));
        toast({ title: 'Login Successful', description: `Welcome back, ${data.user?.first_name || data.user?.email || 'User'}!` });
        setTwoFAOpen(false);
        setOtpCode("");
        onLoginSuccess(data.user, actualRole);
      } else {
        toast({ title: 'Invalid code', description: data.message || 'Please try again.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Invalid code', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleLogin = async (email: string, password: string, role: 'student' | 'institution', opts?: { studentId?: string }) => {
    setIsLoading(true);
    setError("");

    try {
      const loginPayload: any = {
        password,
        login_context: role === 'student' ? 'cbt-student-login' : 'cbt-institution-login',
        realm: 'cbt',
      };
      
      // Support both email and student_id login
      if (opts?.studentId) {
        loginPayload.student_id = opts.studentId;
      } else if (email) {
        loginPayload.email = email;
      }
      
      const data = await apiCallPublic('auth/login/', {
        method: 'POST',
        body: JSON.stringify(loginPayload)
      }) as any;

      // If backend requires 2FA, open modal and stop here
      if (data?.requires_2fa) {
        setTwoFAEmail(email);
        setTwoFAOpen(true);
        return;
      }
      // Store tokens and user data
      localStorage.setItem('accessToken', data?.access || '');
      localStorage.setItem('refreshToken', data?.refresh || '');
      // Use actual role from backend if available, otherwise map the login role
      const actualRole = data?.user?.role || (role === 'student' ? 'cbt_student' : 'cbt_institution');
      localStorage.setItem('userRole', actualRole);
      if (data?.user) localStorage.setItem('userData', JSON.stringify(data.user));

      onLoginSuccess(data.user, actualRole);
      // Don't redirect - let DashboardLayout handle showing the dashboard
      // The state update from onLoginSuccess will trigger a re-render and show the dashboard
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data?.user?.first_name || data?.user?.email || 'User'}!`,
      });
      if (data?.requires_email_verification || data?.user?.email_verified === false) {
        toast({
          title: 'Verify your email',
          description: 'Please check your inbox and verify your email to fully activate your account.',
        });
      }
    } catch (error: any) {
      // Handle different types of errors with user-friendly messages
      let userFriendlyError = '';
      
      // Check if it's a network/connection error
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('timeout') ||
          error?.name === 'TypeError' ||
          !navigator.onLine) {
        userFriendlyError = 'Network is unreachable. Please check your internet connection and try again.';
      }
      // Check if it's an authentication error (400 status)
      else if (error?.status === 400 || error?.data?.error) {
        // Use the backend error message if available
        userFriendlyError = error?.data?.error || error?.message || 'Your email or password is incorrect. Please check your credentials and try again.';
      }
      // Check if it's a server error (500 status)
      else if (error?.status === 500) {
        userFriendlyError = error?.data?.error || 'Service temporarily unavailable. Please try again in a moment.';
      }
      // Generic error fallback
      else {
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

  const handleSignup = async (
    email: string,
    password: string,
    role: 'student' | 'institution',
    firstName?: string,
    lastName?: string,
    institutionName?: string
  ) => {
    setIsLoading(true);
    setError("");
    const mappedRole = role === 'student' ? 'cbt_student' : 'cbt_institution';

    try {
      // 1) Initialize signup
      try {
        await apiCallPublic('auth/signup/init/', {
          method: 'POST',
          body: JSON.stringify({
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            role: mappedRole,
            realm: 'cbt',
            // pass along institution name if provided (backend may ignore unknown fields safely)
            institution_name: institutionName || undefined
          })
        });
      } catch (initError: any) {
        const msg = initError?.message || '';
        // For CBT signups, show the error directly - don't auto-trigger login/password reset
        // Only attempt auto-login if the message specifically says "verified" (already complete signup)
        if (/already exists.*verified|verified.*already exists/i.test(msg)) {
          try {
            const data = await apiCallPublic('auth/login/', {
              method: 'POST',
              body: JSON.stringify({
                email,
                password,
                login_context: role === 'student' 
                  ? 'cbt-student-login' 
                  : (institutionRole === 'teacher' ? 'teacher-login' : 'cbt-institution-login'),
                realm: 'cbt'
              })
            }) as any;
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            // Use actual role from backend if available, otherwise map the login role
            const actualRole = data?.user?.role || (role === 'student' ? 'cbt_student' : 'cbt_institution');
            localStorage.setItem('userRole', actualRole);
            localStorage.setItem('userData', JSON.stringify(data.user));
            onLoginSuccess(data.user, actualRole);
            toast({ title: 'Welcome back', description: 'Logged in successfully.' });
            return;
          } catch {}
        }
        // For all other errors (including role conflicts), show the error message directly
        setError(msg || 'Signup failed at init.');
        return;
      }

      // 2) Set password
      try {
        await apiCallPublic('auth/signup/set-password/', {
          method: 'POST',
          body: JSON.stringify({ email, password, realm: 'cbt' })
        });
      } catch (pwError: any) {
        const msg = pwError?.message || '';
        // If password already set, attempt direct login with provided password
        if (msg.toLowerCase().includes('password already set')) {
          try {
            const data = await apiCallPublic('auth/login/', {
              method: 'POST',
              body: JSON.stringify({
                email,
                password,
                login_context: role === 'student' 
                  ? 'cbt-student-login' 
                  : (institutionRole === 'teacher' ? 'teacher-login' : 'cbt-institution-login'),
                realm: 'cbt'
              })
            }) as any;
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            // Use actual role from backend if available, otherwise map the login role
            const actualRole = data?.user?.role || (role === 'student' ? 'cbt_student' : 'cbt_institution');
            localStorage.setItem('userRole', actualRole);
            localStorage.setItem('userData', JSON.stringify(data.user));
            onLoginSuccess(data.user, actualRole);
            toast({ title: 'Welcome back', description: 'Logged in successfully.' });
            return;
          } catch {}
          // If login still fails, trigger password reset automatically
          try {
            await apiCallPublic('auth/password/reset-request/', {
              method: 'POST',
              body: JSON.stringify({ email })
            });
          } catch {}
          setError('An account already exists for this email. We have sent a password reset link to your email.');
          toast({ title: 'Reset link sent', description: 'Please check your email to set a new password.' });
          return;
        }
        setError(msg || 'Signup failed at set-password.');
        return;
      }

      // 3) Skip email verification for institution/student signups (not required)
      // Email verification is disabled for institution, teachers, and students

      toast({ title: 'Account created', description: 'Signing you in...' });

      // 4) Auto-login (allowed after password is set)
      // Note: handleLogin will call onLoginSuccess which updates DashboardLayout state
      // No need for additional redirect - DashboardLayout will show dashboard automatically
      await handleLogin(email, password, role);
    } catch (e) {
      setError('Network error during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StudentLogin = () => {
    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [mode, setMode] = useState<'signin' | 'signup'>(shouldSignup ? 'signup' : 'signin');
    // Clear signup flag after using it
    useEffect(() => {
      if (shouldSignup && mode === 'signup') {
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('signup');
        window.history.replaceState({}, '', url);
      }
    }, [shouldSignup, mode]);

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === 'signin') {
        // If student_id is provided, use it; otherwise use email
        const useId = studentId.trim();
        if (useId) {
          handleLogin('', password, 'student', { studentId: useId });
        } else if (email.trim()) {
          handleLogin(email, password, 'student');
        } else {
          setError('Please enter either email or student ID');
          return;
        }
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        // Always use school exam type
        try { localStorage.setItem('preferredExam', 'school'); } catch {}
        handleSignup(email, password, 'student', firstName, lastName);
      }
    };

    return (
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="student-first-name">First name</Label>
                <Input id="student-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-last-name">Last name</Label>
                <Input id="student-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="student-email">{mode === 'signin' ? 'Email (or leave blank to use Student ID)' : 'Email'}</Label>
            <Input
              id="student-email"
              type={mode === 'signin' ? 'text' : 'email'}
              placeholder={mode === 'signin' ? 'Enter your email (optional if using Student ID)' : 'Enter your email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={mode === 'signup'}
            />
          </div>
          {mode === 'signin' && (
            <div className="space-y-2">
              <Label htmlFor="student-id">Or Student ID</Label>
              <Input
                id="student-id"
                placeholder="e.g. SCH-2024-ABC123"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">If you don't have an email, use your Student ID to login.</div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="student-password">Password</Label>
            <Input
              id="student-password"
              type="password"
              placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === 'signin' && (
              <div className="text-right">
                <Button type="button" variant="link" className="px-0 text-primary" onClick={() => openReset(email)}>
                  Forgot password?
                </Button>
              </div>
            )}
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="student-password-confirm">Confirm Password</Label>
              <Input
                id="student-password-confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <ButtonSpinner className="mr-2" />}
            {mode === 'signin' ? 'Login as Student' : 'Create Student Account'}
          </Button>
        </form>

        <div className="text-center">
          {mode === 'signin' ? (
            <Button type="button" variant="link" className="text-primary" onClick={() => setMode('signup')}>
              Don't have an account? <span className="font-semibold ml-1">Create one</span>
            </Button>
          ) : (
            <Button type="button" variant="link" className="text-muted-foreground" onClick={() => setMode('signin')}>
              Already have an account? <span className="font-semibold ml-1">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const InstitutionLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [institutionName, setInstitutionName] = useState("");
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [institutionRole, setInstitutionRole] = useState<'teacher' | 'admin'>('admin');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === 'signin') {
        // Save institution role selection
        try { localStorage.setItem('institutionRole', institutionRole); } catch {}
        handleLogin(email, password, 'institution');
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!institutionName.trim()) {
          setError('Institution name is required.');
          return;
        }
        // Always use school exam type
        try { localStorage.setItem('preferredExam', 'school'); } catch {}
        handleSignup(email, password, 'institution', firstName, lastName, institutionName);
      }
    };

    return (
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="institution-first-name">First name</Label>
                <Input id="institution-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution-last-name">Last name</Label>
                <Input id="institution-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="institution-name">Institution name</Label>
                <Input id="institution-name" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="e.g. Henotace College" required />
              </div>
            </div>
          )}

          {mode === 'signin' && (
            <div className="space-y-2">
              <Label>Login as</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={institutionRole === 'admin' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    window.location.href = '/admin-login';
                  }}
                >
                  Login as Admin
                </Button>
                <Button
                  type="button"
                  variant={institutionRole === 'teacher' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    window.location.href = '/teacher-login';
                  }}
                >
                  Login as Teacher
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="institution-email">Email</Label>
            <Input
              id="institution-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution-password">Password</Label>
            <Input
              id="institution-password"
              type="password"
              placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === 'signin' && (
              <div className="text-right">
                <Button type="button" variant="link" className="px-0 text-primary" onClick={() => openReset(email)}>
                  Forgot password?
                </Button>
              </div>
            )}
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="institution-password-confirm">Confirm Password</Label>
              <Input
                id="institution-password-confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <ButtonSpinner className="mr-2" />}
            {mode === 'signin' ? 'Login as Institution' : 'Create Institution Account'}
          </Button>
        </form>

        <div className="text-center">
          {mode === 'signin' ? (
            <Button type="button" variant="link" className="text-primary" onClick={() => setMode('signup')}>
              Don't have an account? <span className="font-semibold ml-1">Create one</span>
            </Button>
          ) : (
            <Button type="button" variant="link" className="text-muted-foreground" onClick={() => setMode('signin')}>
              Already have an account? <span className="font-semibold ml-1">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm shadow-lg mx-auto mb-4 overflow-hidden relative">
            {!logoError ? (
              <img 
                src={isDark ? "/darkmodelogo.jpg" : "/light-mode-logo.jpg"} 
                alt="Henotace Logo" 
                className="w-full h-full object-contain p-1"
                onError={() => setLogoError(true)}
              />
            ) : (
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">Henotace</CardTitle>
          <CardDescription>
            Choose your login type to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!selectedMenu ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-4 text-base"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                <User className="w-4 h-4 mr-3" />
                For Customers
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-4 text-base"
                onClick={() => {
                  window.location.href = '/business-login';
                }}
              >
                <Building2 className="w-4 h-4 mr-3" />
                For Business
              </Button>

              <div className="pt-2 border-t mt-4">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => {
                    // Route to an existing page that can host signup
                    window.location.href = '/business-login';
                  }}
                >
                  Sign up
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMenu(null)}
                  className="h-8"
                >
                  ← Back
                </Button>
              </div>
              
              <Tabs value={selectedMenu} className="w-full">
                <TabsContent value="student" className="mt-0">
                  <StudentLogin />
                </TabsContent>
                
                <TabsContent value="institution" className="mt-0">
                  <InstitutionLogin />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} placeholder="Enter your email" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setResetOpen(false)}>Cancel</Button>
            <Button onClick={submitReset} disabled={resetLoading || !resetEmail.trim()}>
              {resetLoading ? 'Sending...' : 'Send reset link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={twoFAOpen} onOpenChange={setTwoFAOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="otp-code">Enter 6-digit code</Label>
            <Input id="otp-code" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} placeholder="000000" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setTwoFAOpen(false)}>Cancel</Button>
            {/* We don't know which role launched it; infer from stored userRole or default to student */}
            <Button onClick={()=>submitOtp((localStorage.getItem('userRole') as any) || 'student')} disabled={twoFALoading || !otpCode.trim()}>
              {twoFALoading ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
