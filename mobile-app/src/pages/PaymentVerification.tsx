import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, getBaseUrl } from '@/lib/api';

export default function PaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    payment_id?: number;
    amount?: string;
    receipt_number?: string;
    user_role?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentId = searchParams.get('payment_id');
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');
      const paymentType = searchParams.get('payment_type');

      if (!paymentId && !txRef) {
        setVerificationResult({
          success: false,
          message: 'Payment verification parameters missing.'
        });
        setVerifying(false);
        return;
      }

      try {
        // Build verification URL with all parameters
        const params = new URLSearchParams();
        if (paymentId) params.append('payment_id', paymentId);
        if (txRef) params.append('tx_ref', txRef);
        if (transactionId) params.append('transaction_id', transactionId);
        if (status) params.append('status', status);
        if (paymentType) params.append('payment_type', paymentType);

        const response = await apiGet(`school/payment/verify/?${params.toString()}`) as any;
        
        // Handle both regular payment and ID card payment responses
        setVerificationResult({
          success: response.success || response.payment_verified || false,
          message: response.message || 'Payment verification completed.',
          payment_id: response.payment_id,
          amount: response.amount,
          receipt_number: response.receipt_number,
          user_role: response.user_role,
        });
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setVerificationResult({
          success: false,
          message: error?.message || error?.data?.error || 'Payment verification failed. Please contact support if payment was deducted.',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Determine redirect path based on user role
  const getRedirectPath = (success: boolean) => {
    const role = verificationResult?.user_role;
    const basePath = success ? '?payment_verified=true' : '';
    
    // Redirect based on who made the payment
    if (role === 'school_parent') {
      return `/parent-dashboard${basePath}`;
    } else if (role === 'cbt_student' || role === 'school_student') {
      return `/school${basePath}`;
    } else {
      // Default fallback
      return `/school${basePath}`;
    }
  };

  // Countdown and redirect - use setTimeout to avoid setState during render warning
  useEffect(() => {
    if (!verifying && verificationResult) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Use setTimeout to avoid setState during render warning
            setTimeout(() => {
              const redirectPath = getRedirectPath(verificationResult?.success || false);
              navigate(redirectPath);
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verificationResult, navigate]);

  // Add payment_verified param to URL when redirecting so FeesPayment can refresh
  const handleGoToDashboard = () => {
    const redirectPath = getRedirectPath(verificationResult?.success || false);
    navigate(redirectPath);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verifying ? (
            <>
              <div className="flex justify-center mb-4">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we verify your payment...</CardDescription>
            </>
          ) : verificationResult?.success ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>Your payment has been verified and processed.</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
              <CardDescription>{verificationResult?.message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!verifying && verificationResult && (
            <>
              {verificationResult.success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  {verificationResult.amount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold">₦{parseFloat(verificationResult.amount).toLocaleString()}</span>
                    </div>
                  )}
                  {verificationResult.receipt_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Receipt Number:</span>
                      <span className="font-semibold">{verificationResult.receipt_number}</span>
                    </div>
                  )}
                  {verificationResult.payment_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment ID:</span>
                      <span className="font-semibold">#{verificationResult.payment_id}</span>
                    </div>
                  )}
                </div>
              )}

              {!verificationResult.success && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    If your payment was deducted from your account, please contact support with your transaction reference.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {verificationResult.success && verificationResult.payment_id && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('accessToken');
                        if (!token) {
                          toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
                          return;
                        }
                        const baseUrl = getBaseUrl();
                        const response = await fetch(`${baseUrl}school/payments/${verificationResult.payment_id}/receipt-pdf/`, {
                          method: 'GET',
                          headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (!response.ok) throw new Error('Failed to download receipt');
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `receipt_${verificationResult.receipt_number || verificationResult.payment_id}_${new Date().toISOString().split('T')[0]}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast({ title: 'Success', description: 'Receipt downloaded successfully' });
                      } catch (error: any) {
                        toast({ title: 'Error', description: error?.message || 'Failed to download receipt', variant: 'destructive' });
                      }
                    }}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                )}
                <Button onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                {countdown > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

