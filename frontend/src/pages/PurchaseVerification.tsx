import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, ShoppingCart, Download, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api';

export default function PurchaseVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    sale_id?: number;
    sale_number?: string;
    total?: number;
    platform_fee?: number;
    total_paid?: number;
    items?: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    customer_name?: string;
    business_name?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyPurchase = async () => {
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');

      console.log('[PurchaseVerification] Starting verification', { txRef, transactionId, status });

      if (!txRef) {
        console.error('[PurchaseVerification] Missing tx_ref parameter');
        setVerificationResult({
          success: false,
          message: 'Purchase verification parameters missing.'
        });
        setVerifying(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('tx_ref', txRef);
        if (transactionId) params.append('transaction_id', transactionId);
        if (status) params.append('status', status);

        console.log('[PurchaseVerification] Calling API with params:', params.toString());
        const response = await apiGet(`business/customer/purchase/verify/?${params.toString()}`) as any;
        console.log('[PurchaseVerification] API response:', response);
        
        setVerificationResult({
          success: response.success || false,
          message: response.message || 'Purchase verification completed.',
          sale_id: response.sale_id,
          sale_number: response.sale_number,
          total: response.total,
          platform_fee: response.platform_fee,
          total_paid: response.total_paid,
          items: response.items,
          customer_name: response.customer_name,
          business_name: response.business_name,
        });
      } catch (error: any) {
        console.error('[PurchaseVerification] Verification error:', error);
        console.error('[PurchaseVerification] Error details:', {
          message: error?.message,
          response: error?.response,
          status: error?.status
        });
        setVerificationResult({
          success: false,
          message: error?.message || 'Purchase verification failed. Please contact support if payment was deducted.',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPurchase();
  }, [searchParams]);

  useEffect(() => {
    if (!verifying && verificationResult) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/customer-dashboard?tab=overview${verificationResult.success ? '&purchase_verified=true' : ''}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verificationResult, navigate]);

  const handleGoToDashboard = () => {
    console.log('[PurchaseVerification] Navigating to dashboard');
    navigate(`/customer-dashboard?tab=overview${verificationResult?.success ? '&purchase_verified=true' : ''}`);
  };

  const downloadReceipt = () => {
    if (!verificationResult || !verificationResult.success) return;

    const receiptContent = `
${'='.repeat(50)}
                PURCHASE RECEIPT
${'='.repeat(50)}

Business: ${verificationResult.business_name || 'N/A'}
Customer: ${verificationResult.customer_name || 'N/A'}
Receipt No: ${verificationResult.sale_number || verificationResult.sale_id || 'N/A'}
Date: ${new Date().toLocaleString()}

${'-'.repeat(50)}
ITEMS PURCHASED:
${'-'.repeat(50)}
${verificationResult.items?.map(item => 
  `${item.product_name.padEnd(25)} x${String(item.quantity).padStart(3)} @ ₦${item.unit_price.toFixed(2).padStart(10)} = ₦${item.total_price.toFixed(2).padStart(10)}`
).join('\n') || 'No items details available'}

${'-'.repeat(50)}
SUBTOTAL: ₦${(verificationResult.total || 0).toFixed(2)}
PLATFORM FEE: ₦${(verificationResult.platform_fee || 0).toFixed(2)}
TOTAL PAID: ₦${(verificationResult.total_paid || 0).toFixed(2)}
${'-'.repeat(50)}

Thank you for your purchase!
For support, please contact the business directly.

${'='.repeat(50)}
Generated: ${new Date().toISOString()}
${'='.repeat(50)}
`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${verificationResult.sale_number || verificationResult.sale_id || 'Purchase'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Receipt downloaded successfully"
    });
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
              <CardTitle>Verifying Purchase</CardTitle>
              <CardDescription>Please wait while we verify your payment...</CardDescription>
            </>
          ) : verificationResult?.success ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Purchase Successful!</CardTitle>
              <CardDescription>Your purchase has been verified and completed.</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Purchase Verification Failed</CardTitle>
              <CardDescription>{verificationResult?.message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!verifying && verificationResult && (
            <>
              {verificationResult.success && (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                    {verificationResult.sale_number && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Receipt Number:</span>
                        <span className="font-semibold">{verificationResult.sale_number}</span>
                      </div>
                    )}
                    {verificationResult.total && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Purchase Amount:</span>
                        <span className="font-semibold">₦{verificationResult.total.toLocaleString()}</span>
                      </div>
                    )}
                    {verificationResult.total_paid && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Paid:</span>
                        <span className="font-semibold">₦{verificationResult.total_paid.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">Your Receipt is Ready!</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Download your receipt for this purchase. Keep it for your records.
                    </p>
                    <Button 
                      onClick={downloadReceipt} 
                      variant="outline" 
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </>
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
