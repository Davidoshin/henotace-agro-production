import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, Wallet, ArrowLeft } from "lucide-react";

const API_BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

export default function ServiceWalletVerify() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  // Get theme from localStorage
  const darkMode = localStorage.getItem(`client_theme_${slug}`) !== 'light';
  const bgColor = darkMode ? 'bg-slate-900' : 'bg-gray-100';
  const cardBg = darkMode ? 'bg-slate-800' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-slate-400' : 'text-gray-600';

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const tx_ref = searchParams.get('tx_ref');
    const transaction_id = searchParams.get('transaction_id');

    if (!tx_ref) {
      setStatus('error');
      setMessage('Invalid transaction reference');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/services/${slug}/client-wallet/verify/?tx_ref=${tx_ref}&transaction_id=${transaction_id || ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Wallet funded successfully');
        setAmount(data.amount);
        setNewBalance(data.new_balance);
        toast({
          title: "Success",
          description: "Your wallet has been funded successfully!"
        });
      } else {
        setStatus('error');
        setMessage(data.error || 'Payment verification failed');
        toast({
          title: "Error",
          description: data.error || "Payment verification failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying payment');
      toast({
        title: "Error",
        description: "An error occurred while verifying payment",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4`}>
      <Card className={`w-full max-w-md ${cardBg} ${cardBorder}`}>
        <CardContent className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${textColor}`}>Verifying Payment</h2>
                <p className={textMuted}>Please wait while we confirm your payment...</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${textColor}`}>Payment Successful!</h2>
                <p className={textMuted}>{message}</p>
              </div>
              {amount && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Amount Added</p>
                  <p className={`text-2xl font-bold text-emerald-500`}>+{formatCurrency(amount)}</p>
                </div>
              )}
              {newBalance !== null && (
                <div className={`p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-blue-500/20`}>
                  <p className={`text-sm ${textMuted}`}>New Balance</p>
                  <p className={`text-3xl font-bold ${textColor}`}>{formatCurrency(newBalance)}</p>
                </div>
              )}
              <Button 
                className="w-full"
                onClick={() => navigate(`/services/${slug}/dashboard`)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${textColor}`}>Payment Failed</h2>
                <p className={textMuted}>{message}</p>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/services/${slug}/dashboard`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  className={`w-full ${cardBorder}`}
                  onClick={verifyPayment}
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
