import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, getBaseUrl } from '@/lib/api';
import { DollarSign, CreditCard, CheckCircle, XCircle, RefreshCw, Eye, FileText, Wallet, CheckCircle2 as CheckCircleIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeesPaymentProps {
  studentId?: number; // Optional: if provided, shows fees for specific student (for parent view)
  isParentView?: boolean; // If true, shows child selection for parents
}

export default function FeesPayment({ studentId, isParentView = false }: FeesPaymentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');
  const [preferredGateway, setPreferredGateway] = useState<string>('Flutterwave');

  useEffect(() => {
    loadPaymentBreakdown();
    loadWalletBalance();
    loadPaymentGateway();
  }, [studentId]);

  const loadWalletBalance = async () => {
    setLoadingWallet(true);
    try {
      let data;
      if (isParentView && studentId) {
        data = await apiGet(`school/student/wallet/?student_id=${studentId}`) as any;
      } else if (!isParentView) {
        data = await apiGet('school/student/wallet/') as any;
      } else {
        return;
      }
      setWalletBalance(parseFloat(data?.balance || '0'));
    } catch (error: any) {
      // Silently fail - wallet might not exist yet
      setWalletBalance(0);
    } finally {
      setLoadingWallet(false);
    }
  };

  const loadPaymentGateway = async () => {
    try {
      // Get school info to determine preferred gateway
      let schoolData;
      if (isParentView && studentId) {
        const studentData = await apiGet(`school/parent/payment-breakdown/?student_id=${studentId}`) as any;
        schoolData = studentData?.school;
      } else if (!isParentView) {
        const studentData = await apiGet('school/student/fees/') as any;
        schoolData = studentData?.school;
      }
      
      if (schoolData?.preferred_payment_gateway) {
        const gateway = schoolData.preferred_payment_gateway;
        setPreferredGateway(gateway.charAt(0).toUpperCase() + gateway.slice(1));
      }
    } catch (error: any) {
      // Default to Flutterwave if can't determine
      setPreferredGateway('Flutterwave');
    }
  };

  // Reload payment breakdown when component becomes visible (e.g., returning from payment)
  useEffect(() => {
    // Check if we're returning from a payment verification
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_verified') === 'true' || urlParams.get('payment_id')) {
      // Reload to show updated balance
      loadPaymentBreakdown();
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Also reload when window regains focus (user might have completed payment in another tab)
    const handleFocus = () => {
      loadPaymentBreakdown();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadPaymentBreakdown = async () => {
    setLoading(true);
    try {
      let data;
      if (isParentView && studentId) {
        // Parent viewing specific child
        data = await apiGet(`school/parent/payment-breakdown/?student_id=${studentId}`) as any;
      } else if (isParentView) {
        // Parent viewing all children
        data = await apiGet('school/parent/payment-breakdown/') as any;
      } else {
        // Student viewing own fees
        data = await apiGet('school/student/fees/') as any;
      }
      setPaymentBreakdown(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load payment breakdown',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = (fee: any) => {
    setSelectedFee(fee);
    const balance = parseFloat(fee.balance || '0');
    setPaymentAmount(balance > 0 ? balance.toString() : '');
    setPaymentMethod('online'); // Reset to online payment by default
    setShowPaymentDialog(true);
    // Reload wallet balance when opening payment dialog
    loadWalletBalance();
  };

  const payFromWallet = async () => {
    if (!selectedFee) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        title: 'Insufficient Wallet Balance',
        description: `Your wallet balance is ₦${walletBalance.toLocaleString()}. Please add funds to your wallet or use online payment.`,
        variant: 'destructive'
      });
      return;
    }

    const student_id = studentId || paymentBreakdown?.student?.id || paymentBreakdown?.student_id;
    
    if (!student_id) {
      toast({
        title: 'Error',
        description: 'Student ID not found. Please refresh the page and try again.',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await apiPost('school/student/pay-fee-from-wallet/', {
        fee_structure_id: selectedFee.id,
        amount: amount,
        student_id: student_id,
      }) as any;

      toast({
        title: 'Payment Successful',
        description: `Fee payment of ₦${amount.toLocaleString()} completed from wallet. Receipt: ${response.receipt_number}`,
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setSelectedFee(null);
      loadPaymentBreakdown();
      loadWalletBalance();
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error?.message || 'Failed to process payment from wallet. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const initiatePayment = async () => {
    if (paymentMethod === 'wallet') {
      return payFromWallet();
    }

    if (!selectedFee) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      });
      return;
    }

    const balance = parseFloat(selectedFee.balance || '0');
    if (amount > balance) {
      toast({
        title: 'Amount Exceeds Balance',
        description: `Maximum payment amount is ₦${balance.toLocaleString()}`,
        variant: 'destructive'
      });
      return;
    }

    // Get student_id from payment breakdown (for student view) or from prop (for parent view)
    const student_id = studentId || paymentBreakdown?.student?.id || paymentBreakdown?.student_id;
    
    if (!student_id) {
      toast({
        title: 'Error',
        description: 'Student ID not found. Please refresh the page and try again.',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(true);
    try {
      // Initiate payment with backend
      const response = await apiPost('school/student/initiate-payment/', {
        fee_structure_id: selectedFee.id,
        amount: amount,
        student_id: student_id,
      }) as any;

      console.log('Payment initiation response:', response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Payment URL check:', {
        payment_url: response?.payment_url,
        flutterwave_url: response?.flutterwave_url,
        paystack_url: response?.paystack_url
      });

      // Handle payment URL from any gateway (Flutterwave or Paystack)
      const paymentUrl = response?.payment_url || response?.flutterwave_url || response?.paystack_url;
      
      if (paymentUrl) {
        console.log('Redirecting to payment URL:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        console.error('No payment URL found in response:', response);
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      console.error('Error details:', {
        message: error?.message,
        data: error?.data,
        response: error?.response
      });
      toast({
        title: 'Payment Initiation Failed',
        description: error?.message || error?.data?.error || 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      });
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading payment information...</span>
      </div>
    );
  }

  // For parent view with multiple children
  if (isParentView && !studentId && paymentBreakdown?.children) {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        {paymentBreakdown?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentBreakdown.summary.total_children}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees Due</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{parseFloat(paymentBreakdown.summary.total_fees_due || '0').toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₦{parseFloat(paymentBreakdown.summary.total_paid || '0').toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₦{parseFloat(paymentBreakdown.summary.total_balance || '0').toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Children List */}
        <div className="space-y-4">
          {paymentBreakdown.children.map((child: any) => (
            <Card key={child.student_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>{child.student_id_code}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Navigate to child's fees (would need to update parent dashboard to handle this)
                      window.location.href = `?student_id=${child.student_id}`;
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Fees
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Single student view (student or parent viewing specific child)
  const fees = paymentBreakdown?.fee_structures || paymentBreakdown?.fees || [];
  const summary = paymentBreakdown?.summary || paymentBreakdown;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees Due</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{parseFloat(summary.total_due || summary.total_fees_due || '0').toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₦{parseFloat(summary.total_paid || '0').toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₦{parseFloat(summary.total_balance || summary.balance || '0').toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.completion_percentage || 0}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Structures */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>View and pay your fees</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadPaymentBreakdown} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fee structures assigned
            </div>
          ) : (
            <div className="space-y-4">
              {fees.map((fee: any) => {
                const balance = parseFloat(fee.balance || '0');
                const isPaid = balance <= 0;
                
                return (
                  <Card key={fee.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{fee.name}</CardTitle>
                          {fee.term && fee.academic_year && (
                            <CardDescription>{fee.term} - {fee.academic_year}</CardDescription>
                          )}
                        </div>
                        <Badge variant={isPaid ? 'default' : fee.status === 'partial' ? 'secondary' : 'destructive'}>
                          {isPaid ? 'Paid' : fee.status || 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground text-xs sm:text-sm">Amount Due</p>
                          <p className="font-semibold text-sm sm:text-base">₦{parseFloat(fee.amount || '0').toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs sm:text-sm">Amount Paid</p>
                          <p className="font-semibold text-green-600 text-sm sm:text-base">₦{parseFloat(fee.total_paid || '0').toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs sm:text-sm">Balance</p>
                          <p className="font-semibold text-red-600 text-sm sm:text-base">₦{balance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs sm:text-sm">Payments</p>
                          <p className="font-semibold text-sm sm:text-base">{fee.payments?.length || 0}</p>
                        </div>
                      </div>
                      
                      {!isPaid && (
                        <Button
                          onClick={() => handlePayFee(fee)}
                          className="w-full"
                          disabled={balance <= 0}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now (₦{balance.toLocaleString()})
                        </Button>
                      )}

                      {fee.payments && fee.payments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Payment History</p>
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Receipt</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {fee.payments.map((p: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="text-xs sm:text-sm">{new Date(p.date || p.payment_date).toLocaleDateString()}</TableCell>
                                      <TableCell className="text-xs sm:text-sm">₦{parseFloat(p.amount || p.amount_paid || '0').toLocaleString()}</TableCell>
                                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{p.receipt_number || p.transaction_id || 'N/A'}</TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <Badge variant={p.status === 'completed' || p.status === 'successful' ? 'default' : 'secondary'} className="text-xs">
                                          {p.status || 'Pending'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        {p.id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={async () => {
                                              try {
                                                const token = localStorage.getItem('accessToken');
                                                if (!token) {
                                                  toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
                                                  return;
                                                }
                                                const baseUrl = getBaseUrl();
                                                const response = await fetch(`${baseUrl}school/payments/${p.id}/receipt-pdf/`, {
                                                  method: 'GET',
                                                  headers: { 'Authorization': `Bearer ${token}` },
                                                });
                                                if (!response.ok) throw new Error('Failed to download receipt');
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `receipt_${p.receipt_number || p.id}_${new Date().toISOString().split('T')[0]}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                                toast({ title: 'Success', description: 'Receipt downloaded successfully' });
                                              } catch (error: any) {
                                                toast({ title: 'Error', description: error?.message || 'Failed to download receipt', variant: 'destructive' });
                                              }
                                            }}
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            <span className="hidden sm:inline">Receipt</span>
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {/* Mobile view: Show receipt in a separate row */}
                          <div className="sm:hidden space-y-2 mt-2">
                            {fee.payments.map((p: any, idx: number) => (
                              <div key={idx} className="text-xs text-muted-foreground pl-2">
                                Receipt: {p.receipt_number || p.transaction_id || 'N/A'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog - Side by Side Options */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Choose Payment Method</DialogTitle>
            <DialogDescription className="text-sm">
              Pay ₦{parseFloat(paymentAmount || selectedFee?.balance || '0').toLocaleString()} for {selectedFee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'online' | 'wallet')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pay with Gateway Option */}
                <div 
                  className={`flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'online' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setPaymentMethod('online')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RadioGroupItem value="online" id="online" />
                    <CreditCard className="h-6 w-6" />
                    <Label htmlFor="online" className="text-lg font-semibold cursor-pointer">
                      {preferredGateway}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pay with card, bank transfer, or mobile money
                  </p>
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      Secure payment processing
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      Multiple payment options
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      Instant confirmation
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-muted-foreground italic">
                        Note: Platform fee = ₦50 flat
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pay from Wallet Option */}
                <div 
                  className={`flex flex-col p-6 border-2 rounded-lg transition-all ${
                    paymentMethod === 'wallet' && walletBalance > 0 && parseFloat(paymentAmount) <= walletBalance
                      ? 'border-primary bg-primary/5 shadow-md cursor-pointer' 
                      : walletBalance <= 0 || parseFloat(paymentAmount) > walletBalance
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer'
                  }`} 
                  onClick={() => {
                    if (walletBalance > 0 && parseFloat(paymentAmount) <= walletBalance) {
                      setPaymentMethod('wallet');
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RadioGroupItem 
                      value="wallet" 
                      id="wallet" 
                      disabled={walletBalance <= 0 || parseFloat(paymentAmount) > walletBalance} 
                    />
                    <Wallet className="h-6 w-6" />
                    <Label 
                      htmlFor="wallet" 
                      className={`text-lg font-semibold ${
                        walletBalance <= 0 || parseFloat(paymentAmount) > walletBalance 
                          ? 'cursor-not-allowed opacity-60' 
                          : 'cursor-pointer'
                      }`}
                    >
                      Wallet Balance
                    </Label>
                  </div>
                  {loadingWallet ? (
                    <p className="text-sm text-muted-foreground">Loading wallet data...</p>
                  ) : walletBalance > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Available balance: <span className="font-semibold text-green-600">₦{walletBalance.toLocaleString()}</span>
                      </p>
                      {parseFloat(paymentAmount) > walletBalance && (
                        <p className="text-xs text-red-500 mt-2">
                          Insufficient balance
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-red-500">Failed to load wallet data</p>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPaymentDialog(false);
              setPaymentMethod('online');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={initiatePayment} 
              disabled={processingPayment || (paymentMethod === 'wallet' && (walletBalance <= 0 || parseFloat(paymentAmount) > walletBalance))}
              className="w-full sm:w-auto"
              size="lg"
            >
              {processingPayment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'wallet' ? (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Pay from Wallet Balance
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with {preferredGateway}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

