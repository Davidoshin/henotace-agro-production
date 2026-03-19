import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiPost } from '@/lib/api';

interface ForgotPasswordProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiPost('otp/send-password-reset/', { email });
      
      if (response.success) {
        setMessage('Password reset code has been sent to your email. Please check your inbox.');
        setStep('otp');
      } else {
        setError(response.error || 'Failed to send reset code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasLetter || !hasNumber) {
      setError('Password must contain both letters and numbers');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiPost('otp/verify-password-reset/', {
        email,
        otp_code: otp,
        new_password: newPassword
      });
      
      if (response.success) {
        setMessage('Password has been reset successfully! You can now login with your new password.');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {message && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {message}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {step === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
              
              {onBack && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={onBack}
                >
                  Back to Login
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'otp' && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Reset Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="otp">Reset Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code from your email"
                  maxLength={6}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setStep('email')}
              >
                Back
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForgotPassword;
