import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiPost } from '@/lib/api';
import ForgotPassword from '@/components/auth/ForgotPassword';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginType, setLoginType] = useState<'customer' | 'business'>('business');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = loginType === 'customer' ? 'customer/login/' : 'business/login/';
      const response = await apiPost(endpoint, { 
        email, 
        password,
        ...(loginType === 'business' && { login_as: 'admin' })
      });
      
      if (response.success) {
        // Store tokens and redirect
        localStorage.setItem('accessToken', response.tokens.access);
        localStorage.setItem('refreshToken', response.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.business) {
          localStorage.setItem('business', JSON.stringify(response.business));
          window.location.href = '/business/dashboard';
        } else {
          window.location.href = '/customer/dashboard';
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email to receive a password reset code
            </p>
          </div>
          
          <ForgotPassword 
            onSuccess={() => {
              setShowForgotPassword(false);
              setError('');
              setPassword('');
            }}
            onBack={() => setShowForgotPassword(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'customer' | 'business')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="business">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your business email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="business-password">Password</Label>
                  <Input
                    id="business-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In as Business'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="customer">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In as Customer'}
                </Button>
              </form>
            </TabsContent>
            
            <div className="mt-4 text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm"
              >
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
