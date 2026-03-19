import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api';

export default function WalletDepositVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    wallet_transaction_id?: number;
    amount?: string;
    new_balance?: string;
    user_role?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyDeposit = async () => {
      const walletTransactionId = searchParams.get('wallet_transaction_id');
      const parentTransactionId = searchParams.get('parent_transaction_id');
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');
      const reference = searchParams.get('reference');
      const transactionRef = searchParams.get('transaction_ref');

      if (!walletTransactionId && !parentTransactionId && !txRef && !reference && !transactionRef) {
        setVerificationResult({
          success: false,
          message: 'Deposit verification parameters missing.'
        });
        setVerifying(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (walletTransactionId) params.append('wallet_transaction_id', walletTransactionId);
        if (parentTransactionId) params.append('parent_transaction_id', parentTransactionId);
        if (txRef) params.append('tx_ref', txRef);
        if (transactionId) params.append('transaction_id', transactionId);
        if (status) params.append('status', status);
        if (reference) params.append('reference', reference);
        if (transactionRef) params.append('tx_ref', transactionRef);

        const response = await apiGet(`business/customer/wallet/fund/verify/?${params.toString()}`) as any;
        
        setVerificationResult({
          success: response.success || false,
          message: response.message || 'Deposit verification completed.',
          wallet_transaction_id: response.wallet_transaction_id || response.parent_transaction_id,
          amount: response.amount,
          new_balance: response.new_balance,
          user_role: response.user_role,
        });
      } catch (error: any) {
        setVerificationResult({
          success: false,
          message: error?.message || 'Deposit verification failed. Please contact support if payment was deducted.',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyDeposit();
  }, [searchParams]);

  const getRedirectPath = (success: boolean) => {
    const basePath = success ? '?deposit_verified=true' : '';
    return `/customer-dashboard?tab=wallet${success ? '&deposit_verified=true' : ''}`;
  };

  useEffect(() => {
    if (!verifying && verificationResult) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const redirectPath = getRedirectPath(verificationResult?.success || false);
            navigate(redirectPath);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verificationResult, navigate]);

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
              <CardTitle>Verifying Deposit</CardTitle>
              <CardDescription>Please wait while we verify your wallet deposit...</CardDescription>
            </>
          ) : verificationResult?.success ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Deposit Successful!</CardTitle>
              <CardDescription>Your wallet deposit has been verified and processed.</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Deposit Verification Failed</CardTitle>
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
                      <span className="text-sm text-muted-foreground">Amount Deposited:</span>
                      <span className="font-semibold">₦{parseFloat(verificationResult.amount).toLocaleString()}</span>
                    </div>
                  )}
                  {verificationResult.new_balance && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">New Wallet Balance:</span>
                      <span className="font-semibold">₦{parseFloat(verificationResult.new_balance).toLocaleString()}</span>
                    </div>
                  )}
                  {verificationResult.wallet_transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Transaction ID:</span>
                      <span className="font-semibold">#{verificationResult.wallet_transaction_id}</span>
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
