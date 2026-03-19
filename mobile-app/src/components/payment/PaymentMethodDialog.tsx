import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { CreditCard, Building, Clock, Copy, RefreshCw, CheckCircle as CheckCircleIcon, AlertTriangle } from 'lucide-react';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onPaymentSuccess?: () => void;
  purpose?: string;  // e.g., "Wallet Funding", "Subscription Upgrade"
}

export default function PaymentMethodDialog({
  open,
  onOpenChange,
  amount,
  onPaymentSuccess,
  purpose = "Wallet Funding",
}: PaymentMethodDialogProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank_transfer'>('online');
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [platformBankDetails, setPlatformBankDetails] = useState<{
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [walletStatus, setWalletStatus] = useState<{
    pending_platform_fees: number;
    pending_platform_fee_count: number;
    bank_transfer_suspended: boolean;
    fees_to_suspension: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      loadPaymentInfo();
      loadWalletStatus();
    }
  }, [open]);

  const loadPaymentInfo = async () => {
    setLoadingDetails(true);
    try {
      // Get platform bank details for bank transfer option
      const data = await apiGet('platform/bank-details/') as any;
      if (data.success && data.bank_transfer_enabled) {
        setBankTransferEnabled(true);
        setPlatformBankDetails({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
        });
      } else {
        setBankTransferEnabled(false);
        setPlatformBankDetails(null);
      }
    } catch (error) {
      setBankTransferEnabled(false);
      setPlatformBankDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadWalletStatus = async () => {
    try {
      const data = await apiGet('business/wallet/status/') as any;
      if (data.success) {
        setWalletStatus({
          pending_platform_fees: data.pending_platform_fees || 0,
          pending_platform_fee_count: data.pending_platform_fee_count || 0,
          bank_transfer_suspended: data.bank_transfer_suspended || false,
          fees_to_suspension: data.fees_to_suspension || 20,
        });
      }
    } catch (error) {
      console.error('Failed to load wallet status');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const initiateOnlinePayment = async () => {
    setProcessingPayment(true);
    try {
      const response = await apiPost('business/wallet/fund/initiate/', {
        amount,
        callback_url: `${window.location.origin}/manage-account?view=wallet&payment=complete`
      }) as any;

      if (response.payment_link) {
        window.location.href = response.payment_link;
      } else {
        throw new Error(response.error || 'No payment URL received');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error?.message || 'Failed to initiate payment',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const submitBankTransfer = async () => {
    if (!transferReference.trim()) {
      toast({
        title: 'Reference Required',
        description: 'Please enter your bank transfer reference number',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(true);
    try {
      await apiPost('business/wallet/bank-transfer/', {
        amount,
        bank_transfer_reference: transferReference.trim()
      });

      toast({
        title: 'Bank Transfer Submitted',
        description: 'Your payment is pending verification by the platform admin.',
      });

      onOpenChange(false);
      setTransferReference('');
      onPaymentSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit bank transfer',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'bank_transfer') {
      submitBankTransfer();
    } else {
      initiateOnlinePayment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">Choose Payment Method</DialogTitle>
          <DialogDescription className="text-sm">
            {purpose}: ₦{amount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="py-4">
            {/* Show pending fees warning if applicable */}
            {walletStatus && walletStatus.pending_platform_fees > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Pending Platform Fees: ₦{walletStatus.pending_platform_fees.toLocaleString()}
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      {walletStatus.pending_platform_fee_count} transactions pending. 
                      {walletStatus.bank_transfer_suspended 
                        ? " Bank transfer is currently suspended."
                        : ` ${walletStatus.fees_to_suspension} more until suspension.`}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 mt-1 text-xs">
                      These fees will be automatically deducted when you fund your wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'online' | 'bank_transfer')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pay with Flutterwave Option */}
                <div 
                  className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'online' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setPaymentMethod('online')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RadioGroupItem value="online" id="online" />
                    <CreditCard className="h-5 w-5" />
                    <Label htmlFor="online" className="font-semibold cursor-pointer">
                      Flutterwave
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pay with card, bank transfer, or mobile money
                  </p>
                  <div className="space-y-1 mt-auto text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      Secure payment
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      Instant confirmation
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Option */}
                <div 
                  className={`flex flex-col p-4 border-2 rounded-lg transition-all ${
                    !bankTransferEnabled || !platformBankDetails
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed'
                      : paymentMethod === 'bank_transfer' 
                        ? 'border-primary bg-primary/5 shadow-md cursor-pointer' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer'
                  }`} 
                  onClick={() => {
                    if (bankTransferEnabled && platformBankDetails) {
                      setPaymentMethod('bank_transfer');
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" disabled={!bankTransferEnabled || !platformBankDetails} />
                    <Building className="h-5 w-5" />
                    <Label htmlFor="bank_transfer" className={`font-semibold ${!bankTransferEnabled ? 'opacity-60' : 'cursor-pointer'}`}>
                      Platform Bank Account
                    </Label>
                  </div>
                  {loadingDetails ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : !bankTransferEnabled || !platformBankDetails ? (
                    <p className="text-sm text-muted-foreground">Not currently available</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Transfer directly to platform account
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-3 w-3 text-green-500" />
                          Direct bank transfer
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-yellow-500" />
                          Manual verification (1-24 hrs)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </RadioGroup>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank_transfer' && platformBankDetails && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Platform Bank Account Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platformBankDetails.bank_name}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(platformBankDetails.bank_name, 'Bank name')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platformBankDetails.account_number}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(platformBankDetails.account_number, 'Account number')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platformBankDetails.account_name}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(platformBankDetails.account_name, 'Account name')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600">₦{amount.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(amount.toString(), 'Amount')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="transfer-ref">Transfer Reference/Description</Label>
                  <Input
                    id="transfer-ref"
                    placeholder="e.g., TRF12345678 or bank reference"
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the reference number from your bank transfer for verification
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={processingPayment || (paymentMethod === 'bank_transfer' && (!bankTransferEnabled || !transferReference.trim()))}
            size="lg"
          >
            {processingPayment ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === 'bank_transfer' ? (
              <>
                <Building className="h-4 w-4 mr-2" />
                Submit for Verification
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay with Flutterwave
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
