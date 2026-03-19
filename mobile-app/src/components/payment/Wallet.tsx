import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { Wallet as WalletIcon, Plus, RefreshCw, History, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface WalletProps {
  studentId?: number;
  isParentView?: boolean;
}

export default function Wallet({ studentId, isParentView = false }: WalletProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('');

  useEffect(() => {
    loadWalletData();
  }, [studentId]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, transactionsPage, studentId, transactionTypeFilter]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('wallet_transaction_id') || urlParams.get('deposit_verified') === 'true') {
      loadWalletData();
      loadTransactions();
      window.history.replaceState({}, '', window.location.pathname);
    }

    const handleFocus = () => {
      loadWalletData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      let data;
      if (isParentView) {
        // For parents, load their shared wallet (student_id is optional for reference)
        const url = studentId 
          ? `school/student/wallet/?student_id=${studentId}` 
          : 'school/student/wallet/';
        data = await apiGet(url) as any;
      } else {
        // For students, load their own wallet
        data = await apiGet('school/student/wallet/') as any;
      }
      setWalletData(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load wallet data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // For parents, if no studentId, load parent's shared wallet transactions
      // For students, always load their own transactions
      let url = 'school/student/wallet/transactions/';
      if (isParentView && studentId) {
        url += `?student_id=${studentId}&page=${transactionsPage}&limit=10`;
      } else {
        url += `?page=${transactionsPage}&limit=10`;
      }
      
      if (transactionTypeFilter && transactionTypeFilter !== 'all') {
        url += `&transaction_type=${transactionTypeFilter}`;
      }

      const data = await apiGet(url) as any;
      setTransactions(data.transactions || []);
      setTransactionsTotalPages(Math.ceil((data.total_count || 0) / 10));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid deposit amount', variant: 'destructive' });
      return;
    }
    if (amount < 100) {
      toast({ title: 'Invalid Amount', description: 'Minimum deposit amount is ₦100', variant: 'destructive' });
      return;
    }

    setProcessingDeposit(true);
    try {
      // For parents: don't pass student_id to deposit to shared parent wallet
      // For students: pass student_id to deposit to their own wallet
      const depositPayload: any = { amount: amount };
      if (!isParentView) {
        // Students must deposit to their own wallet
        const student_id = studentId || walletData?.student_id;
        if (!student_id) {
          toast({ title: 'Error', description: 'Student ID not found. Please refresh the page.', variant: 'destructive' });
          setProcessingDeposit(false);
          return;
        }
        depositPayload.student_id = student_id;
      }
      // For parents, we don't pass student_id, so it goes to their shared wallet

      const response = await apiPost('school/student/wallet/deposit/', depositPayload) as any;

      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        throw new Error('Payment URL not received from server');
      }
    } catch (error: any) {
      toast({
        title: 'Deposit Initiation Failed',
        description: error?.message || 'Failed to initiate deposit. Please try again.',
        variant: 'destructive'
      });
      setProcessingDeposit(false);
    }
  };

  if (loading && !walletData && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading wallet information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Wallet Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <WalletIcon className="h-5 w-5" />
                    Wallet Balance
                  </CardTitle>
                  <CardDescription>Your available wallet balance</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadWalletData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl font-bold mb-2">
                  ₦{parseFloat(walletData?.balance || '0').toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mb-6">Available Balance</p>
                
                <Button
                  onClick={() => setShowDepositDialog(true)}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Money to Wallet
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Deposited</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₦{parseFloat(walletData?.total_deposited || '0').toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-lg font-semibold text-red-600">
                    ₦{parseFloat(walletData?.total_spent || '0').toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{isParentView ? 'Wallet Type' : 'Student'}</p>
                  <p className="text-sm font-medium">
                    {isParentView ? 'Shared Parent Wallet' : (walletData?.student_name || 'N/A')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Add money to your wallet using your institution's payment gateway</p>
              <p>• Use your wallet balance to pay school fees instantly</p>
              {isParentView && <p>• Your wallet balance can be used to pay fees for all your children</p>}
              <p>• Wallet balance never expires</p>
              <p>• View all transactions in the Transactions tab</p>
              <p className="text-xs pt-2 border-t mt-2">
                <strong>Platform Fee:</strong> A flat fee of <strong>₦50</strong> is charged on every wallet deposit transaction. This fee is automatically added to your deposit amount and is used to maintain and improve the platform services.
              </p>
              <p className="text-xs pt-2">
                <strong>Note:</strong> When you deposit money to your wallet, the funds are processed through your institution's payment gateway account. The wallet balance is a convenient way to track and use these funds for fee payments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View all your wallet transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadTransactions}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={transactionTypeFilter || 'all'} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Gateway</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn: any) => (
                          <TableRow key={txn.id}>
                            <TableCell className="font-medium capitalize">{txn.transaction_type}</TableCell>
                            <TableCell>₦{parseFloat(txn.amount).toLocaleString()}</TableCell>
                            <TableCell>₦{parseFloat(txn.balance_after).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                                {txn.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs">{txn.payment_gateway || 'N/A'}</TableCell>
                            <TableCell className="hidden sm:table-cell">{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {transactionsTotalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setTransactionsPage(prev => Math.max(1, prev - 1))} 
                            className={transactionsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm">Page {transactionsPage} of {transactionsTotalPages}</span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setTransactionsPage(prev => Math.min(transactionsTotalPages, prev + 1))} 
                            className={transactionsPage === transactionsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Deposit Funds to Wallet</DialogTitle>
            <DialogDescription className="text-sm">
              Add money to your wallet using your institution's preferred payment gateway. 
              A platform fee of ₦50 will be charged on this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount to Deposit</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
              />
              <p className="text-xs text-muted-foreground">
                Minimum deposit: ₦100. Payment will be processed using your institution's preferred payment gateway. A platform fee of ₦50 will be added to your deposit amount.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm">
                Current wallet balance: <span className="font-semibold">₦{parseFloat(walletData?.balance || '0').toLocaleString()}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Cancel
            </Button>
            <Button onClick={initiateDeposit} disabled={processingDeposit || parseFloat(depositAmount) < 100}>
              {processingDeposit ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Deposit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
