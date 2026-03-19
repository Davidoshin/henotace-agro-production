import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api';

export default function CreditPaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    credit_id?: number;
    amount_paid?: number;
    remaining_balance?: number;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');

      console.log('[CreditPaymentVerification] Starting verification', { txRef, transactionId, status });

      // Check if payment was cancelled
      if (status === 'cancelled') {
        console.log('[CreditPaymentVerification] Payment was cancelled');
        setVerificationResult({
          success: false,
          message: 'Payment was cancelled. No charges were made.'
        });
        setVerifying(false);
        return;
      }

      if (!txRef) {
        console.error('[CreditPaymentVerification] Missing tx_ref parameter');
        setVerificationResult({
          success: false,
          message: 'Payment verification parameters missing.'
        });
        setVerifying(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('tx_ref', txRef);
        if (transactionId) params.append('transaction_id', transactionId);
        if (status) params.append('status', status);

        console.log('[CreditPaymentVerification] Calling API with params:', params.toString());
        const response = await apiGet(`business/customer/credit/verify/?${params.toString()}`) as any;
        console.log('[CreditPaymentVerification] API response:', response);
        
        setVerificationResult({
          success: response.success || false,
          message: response.message || 'Credit payment verification completed.',
          credit_id: response.credit_id,
          amount_paid: response.amount_paid,
          remaining_balance: response.remaining_balance,
        });
      } catch (error: any) {
        console.error('[CreditPaymentVerification] Verification error:', error);
        console.error('[CreditPaymentVerification] Error details:', {
          message: error?.message,
          response: error?.response,
          status: error?.status
        });
        setVerificationResult({
          success: false,
          message: error?.message || 'Credit payment verification failed. Please contact support if payment was deducted.',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  useEffect(() => {
    if (!verifying && verificationResult) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/customer-dashboard?tab=credit');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verificationResult, navigate]);

  const handleGoToDashboard = () => {
    console.log('[CreditPaymentVerification] Navigating to dashboard');
    navigate('/customer-dashboard?tab=credit');
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
              <CardDescription>Please wait while we verify your credit payment...</CardDescription>
            </>
          ) : verificationResult?.success ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>Your credit payment has been verified and completed.</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Payment {searchParams.get('status') === 'cancelled' ? 'Cancelled' : 'Failed'}</CardTitle>
              <CardDescription>{verificationResult?.message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!verifying && verificationResult && (
            <>
              {verificationResult.success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  {verificationResult.amount_paid && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold">₦{verificationResult.amount_paid.toLocaleString()}</span>
                    </div>
                  )}
                  {verificationResult.remaining_balance !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Remaining Balance:</span>
                      <span className="font-semibold">₦{verificationResult.remaining_balance.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {!verificationResult.success && searchParams.get('status') !== 'cancelled' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    If your payment was deducted from your account, please contact support with your transaction reference.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
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
