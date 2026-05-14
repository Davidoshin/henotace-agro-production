import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowLeft, Sprout } from 'lucide-react';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { apiCallPublic, getBaseUrl } from '@/lib/api';


const BusinessSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialReferralCode = searchParams.get('ref') || '';
  const signupType = searchParams.get('type') || 'agro';
  const isAgro = signupType === 'agro';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessType] = useState('agro_production');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const isAgroBusiness = (businessData: any, realm?: string) => {
    const category = String(businessData?.business_category || businessData?.category || '').toLowerCase();
    const businessType = String(businessData?.business_type || businessData?.type || '').toLowerCase();
    return realm === 'agro' || category === 'agro_production' || ['agro_production', 'agro', 'agriculture', 'farm', 'farming'].includes(businessType);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!email || !password || !businessName || !firstName || !lastName || !phoneNumber) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // First create the user account
      const signupData = {
        email: email.toLowerCase().trim(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber.trim(),
        business_name: businessName.trim(),
        role: 'business_owner',
        business_type: businessType,
      };

      // Initialize signup with role
      const userData = await apiCallPublic('auth/signup/init/', {
        method: 'POST',
        body: JSON.stringify({ 
          email: signupData.email,
          role: signupData.role,
          first_name: signupData.first_name,
          last_name: signupData.last_name,
          phone: signupData.phone,
          business_name: signupData.business_name,
          referral_code: referralCode,
          business_type: businessType,
        }),
      }) as any;

      if (userData.success) {
        // Set password
        const setPasswordData = await apiCallPublic('auth/signup/set-password/', {
          method: 'POST',
          body: JSON.stringify({
            email: signupData.email,
            password: signupData.password,
            first_name: signupData.first_name,
            last_name: signupData.last_name,
            phone: signupData.phone,
            role: signupData.role,
            business_name: signupData.business_name,
            referral_code: referralCode,
            business_type: businessType,
          }),
        });

        // Auto-login after successful signup
        const loginEndpoint = `${getBaseUrl()}auth/${isAgro ? 'agro' : 'business'}/login/`;
        const loginResponse = await fetch(loginEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            email: signupData.email, 
            password: signupData.password,
            realm: isAgro ? 'agro' : 'business'
          })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginData.error || loginData.detail || 'Auto-login failed');
        }

        // Store tokens and user data (same logic as BusinessLogin)
        const accessToken = loginData.tokens?.access || loginData.access;
        const refreshToken = loginData.tokens?.refresh || loginData.refresh;
        
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken || '');
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken || '');
        }
        
        const role = loginData.user?.role || loginData.login_as || loginData.role || 'business_owner';
        localStorage.setItem('userRole', role);
        localStorage.setItem('user_role', role);
        
        const userData = {
          id: loginData.user?.id || loginData.user_id,
          email: loginData.user?.email || signupData.email,
          first_name: loginData.user?.first_name || signupData.first_name,
          last_name: loginData.user?.last_name || signupData.last_name,
          role: role,
          profile_image: loginData.user?.profile_image || ''
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('user_id', userData.id?.toString() || '');
        localStorage.setItem('user_email', userData.email);
        localStorage.setItem('user_first_name', userData.first_name);
        localStorage.setItem('user_last_name', userData.last_name);
        
        // Store business data if available
        if (loginData.business) {
          localStorage.setItem('business_id', loginData.business.id?.toString() || '');
          localStorage.setItem('business_name', loginData.business.name || '');
          localStorage.setItem('business_unique_code', loginData.business.code || loginData.business.unique_code || '');
          localStorage.setItem('business_slug', loginData.business.slug || loginData.business.code?.toLowerCase() || '');
        }
        
        const agroAccount = isAgro || isAgroBusiness(loginData.business, loginData.realm);
        if (agroAccount) {
          localStorage.setItem('business_category', loginData.business?.business_category || loginData.business?.category || 'agro_production');
          localStorage.setItem('business_type', loginData.business?.business_type || loginData.business?.type || 'agro_production');
        }

        toast({
          title: 'Account Created',
          description: 'Your account has been created successfully!',
        });

        // Navigate to dashboard
        if (isAgro) {
          navigate('/agro-dashboard');
        } else {
          navigate('/business-admin-dashboard');
        }
      }
    } catch (e: any) {
      const errorMessage = e?.data?.error || e?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isAgro ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-primary/10'}`}>
                {isAgro ? (
                  <Sprout className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">{isAgro ? 'Create Farm Account' : 'Create Business Account'}</CardTitle>
            <CardDescription>
              {isAgro ? 'Start managing your farm operations with HENOTACE AGRO' : 'Start managing your business with AI-powered tools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {initialReferralCode && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    🎉 You were referred! Referral code <strong>{initialReferralCode}</strong> has been applied.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g. +234 123 456 7890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">{isAgro ? 'Farm / Business Name' : 'Business Name'}</Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder={isAgro ? 'E.g. Musa Farms Ltd' : 'My Business'}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>



              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Enter referral code if you have one"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="uppercase"
                />
              </div>

              <Button
                type="submit"
                className={`w-full ${isAgro ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  isAgro ? 'Create Farm Account' : 'Create Account'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className={`p-0 h-auto ${isAgro ? 'text-emerald-600 hover:text-emerald-700' : ''}`}
                  onClick={() => navigate(isAgro ? '/agro-login' : '/login?type=business')}
                >
                  Sign in
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSignup;

