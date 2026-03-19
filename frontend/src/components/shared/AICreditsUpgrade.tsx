import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Rocket, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Star,
  Wallet,
  Users
} from 'lucide-react';

interface AICreditsUpgradeProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  currentCredits?: number;
  /** If true, renders as a card instead of dialog */
  standalone?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  icon: React.ReactNode;
  popular?: boolean;
  description: string;
  features: string[];
  isShared?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000,
    price: 2000,
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    description: 'For business owner only',
    features: [
      '1,000 AI API calls',
      'Business owner only',
      'All AI features included',
      'Never expires'
    ],
    isShared: false
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 5000,
    price: 5000,
    icon: <Rocket className="h-6 w-6 text-purple-500" />,
    popular: true,
    description: 'Best value for owners',
    features: [
      '5,000 AI API calls',
      'Business owner only',
      '₦1 per call (50% savings!)',
      'Never expires'
    ],
    isShared: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 10000,
    price: 10000,
    icon: <Crown className="h-6 w-6 text-amber-500" />,
    description: 'Shared across all staff',
    features: [
      '10,000 AI API calls',
      'Shared among ALL staff',
      '₦1 per call (50% savings!)',
      'Best for businesses with staff',
      'Never expires'
    ],
    isShared: true
  }
];

export function AICreditsUpgrade({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose, 
  onSuccess, 
  currentCredits = 0,
  standalone = false
}: AICreditsUpgradeProps) {
  const { toast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState<{
    is_staff: boolean;
    is_business_owner: boolean;
    can_purchase: boolean;
    business_wallet_balance: number;
    business_name: string | null;
    personal_credits: number;
    business_credits: number;
    staff_credit_share: number;
    total_available: number;
    total_business_members: number;
  } | null>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onClose = externalOnClose || (() => setInternalIsOpen(false));

  useEffect(() => {
    if (isOpen || standalone) {
      loadCreditsInfo();
    }
  }, [isOpen, standalone]);

  const loadCreditsInfo = async () => {
    try {
      const response = await apiGet('/ai-credits/balance/');
      if (response.success) {
        setCreditsInfo({
          is_staff: response.is_staff,
          is_business_owner: response.is_business_owner,
          can_purchase: response.can_purchase,
          business_wallet_balance: response.business_wallet_balance,
          business_name: response.business_name,
          personal_credits: response.personal_credits,
          business_credits: response.business_credits,
          staff_credit_share: response.staff_credit_share,
          total_available: response.total_available,
          total_business_members: response.total_business_members
        });
      }
    } catch (error) {
      console.error('Failed to load credits info:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);

    try {
      const response = await apiPost('/ai-credits/purchase/initiate/', {
        plan_id: selectedPlan.id
      });

      if (response.success) {
        toast({ 
          title: 'Success!', 
          description: response.message || 'AI credits purchased successfully!' 
        });
        loadCreditsInfo();
        setSelectedPlan(null);
        onSuccess?.();
      } else {
        throw new Error(response.error || 'Purchase failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { error?: string })?.error || 'Failed to process purchase. Please try again.';
      toast({
        title: 'Purchase Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    onClose();
  };

  const canAffordPlan = (plan: PricingPlan) => {
    if (!creditsInfo) return false;
    return creditsInfo.business_wallet_balance >= plan.price;
  };

  // Staff-only view - they can only use business credits
  if (creditsInfo?.is_staff && !creditsInfo?.is_business_owner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Credits
          </CardTitle>
          <CardDescription>
            You're using your business's AI credits pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {creditsInfo.business_name || 'Your Business'}
              </span>
            </div>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-1">Your share of business credits:</p>
              <p className="text-2xl font-bold text-purple-600">
                {creditsInfo.staff_credit_share.toLocaleString()} credits
              </p>
              {creditsInfo.total_business_members > 0 && (
                <p className="text-xs text-muted-foreground">
                  (Business pool: {creditsInfo.business_credits.toLocaleString()} ÷ {creditsInfo.total_business_members} members)
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Contact your business owner to purchase more Enterprise credits for staff.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not a business owner - cannot purchase
  if (!creditsInfo?.is_business_owner && !creditsInfo?.is_staff) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AI credits are purchased through your business. Please contact your business owner.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Inner content for pricing plans (Business Owner Only)
  const PricingContent = () => (
    <>
      {/* Business Wallet Balance */}
      {creditsInfo && (
        <div className="p-3 bg-muted rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Business Wallet Balance</span>
            </div>
            <span className="font-bold text-green-600">₦{(creditsInfo.business_wallet_balance || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Current Credits Summary */}
      {creditsInfo && (creditsInfo.personal_credits > 0 || creditsInfo.business_credits > 0) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Current AI Credits</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Owner Dashboard</p>
              <p className="font-bold text-lg">{creditsInfo.personal_credits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Staff Pool</p>
              <p className="font-bold text-lg">{creditsInfo.business_credits.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {!selectedPlan ? (
        // Plan Selection
        <div className="grid md:grid-cols-3 gap-4 py-4">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg hover:border-primary ${
                plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
              } ${plan.isShared ? 'border-purple-200 dark:border-purple-800' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}
              {plan.isShared && (
                <div className="absolute -top-3 right-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    <Users className="h-3 w-3 mr-1" /> Shared
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-muted">
                  {plan.icon}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold">₦{plan.price.toLocaleString()}</span>
                </div>
                <div className="mb-4 p-2 bg-muted rounded-lg">
                  <span className="text-lg font-semibold text-primary">
                    {plan.credits.toLocaleString()} API Calls
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Select Plan <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Payment confirmation
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {selectedPlan?.icon}
              <div>
                <p className="font-semibold">{selectedPlan?.name} Plan</p>
                <p className="text-sm text-muted-foreground">{selectedPlan?.credits.toLocaleString()} AI credits</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₦{selectedPlan?.price.toLocaleString()}</p>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={() => setSelectedPlan(null)}>
                Change plan
              </Button>
            </div>
          </div>

          {/* Plan Type Info */}
          <div className={`p-4 rounded-lg border ${
            selectedPlan?.isShared 
              ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' 
              : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {selectedPlan?.isShared ? (
                <>
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-purple-700 dark:text-purple-300">
                    Enterprise (Shared Credits)
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Owner Dashboard Only
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedPlan?.isShared 
                ? 'These credits will be shared among ALL staff in your business. Each staff gets an equal share.'
                : 'These credits are for your owner dashboard only. Staff cannot use these credits.'}
            </p>
          </div>

          {/* Purchase from Business Wallet */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">Pay from Business Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: ₦{(creditsInfo?.business_wallet_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {canAffordPlan(selectedPlan!) ? (
                <Button 
                  onClick={handlePurchase} 
                  disabled={isProcessing} 
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₦{(selectedPlan?.price || 0).toLocaleString()} <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">
                    Insufficient balance. You need ₦{((selectedPlan?.price || 0) - (creditsInfo?.business_wallet_balance || 0)).toLocaleString()} more.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/business/dashboard?tab=wallet'}
                    className="w-full"
                  >
                    Fund Business Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );

  // Standalone mode - render as Card
  if (standalone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Purchase AI Credits
          </CardTitle>
          <CardDescription>
            Unlock the full power of AI-assisted business management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-7 w-7 text-primary" />
            Upgrade Your AI Experience
          </DialogTitle>
          <DialogDescription className="text-base">
            Unlock the full power of AI-assisted business management. Choose the plan that works best for you.
          </DialogDescription>
        </DialogHeader>

        <PricingContent />
      </DialogContent>
    </Dialog>
  );
}

// AI Credits Exhausted Modal - Beautiful notification when credits run out
interface AICreditsExhaustedProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function AICreditsExhausted({ isOpen, onClose, onUpgrade }: AICreditsExhaustedProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-6">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          <DialogTitle className="text-2xl mb-2">
            You've Reached Your AI Limit
          </DialogTitle>
          
          <DialogDescription className="text-base mb-6">
            Your AI credits have been fully utilized. Upgrade now to continue your 
            journey with intelligent business assistance, smart analytics, 
            and personalized insights.
          </DialogDescription>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">AI-Powered Analytics</p>
                <p className="text-xs text-muted-foreground">Smart business insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <Rocket className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Smart Recommendations</p>
                <p className="text-xs text-muted-foreground">AI-driven business suggestions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">AI Business Assistant</p>
                <p className="text-xs text-muted-foreground">Get insights and recommendations</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onUpgrade} size="lg" className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// AI Credits Balance Display - Small badge/card for dashboards
interface AICreditsBalanceProps {
  credits: number;
  onUpgrade: () => void;
  compact?: boolean;
}

export function AICreditsBalance({ credits, onUpgrade, compact = false }: AICreditsBalanceProps) {
  const isLow = credits < 50;
  const isEmpty = credits <= 0;

  if (compact) {
    return (
      <Button
        variant={isEmpty ? 'destructive' : isLow ? 'secondary' : 'outline'}
        size="sm"
        onClick={onUpgrade}
        className="gap-2"
      >
        <Zap className={`h-4 w-4 ${isEmpty ? '' : isLow ? 'text-amber-500' : 'text-blue-500'}`} />
        <span>{credits.toLocaleString()} credits</span>
        {isEmpty && <Badge variant="destructive" className="ml-1 text-xs">Upgrade</Badge>}
      </Button>
    );
  }

  return (
    <Card className={`${isEmpty ? 'border-red-300 bg-red-50 dark:bg-red-950' : isLow ? 'border-amber-300 bg-amber-50 dark:bg-amber-950' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isEmpty ? 'bg-red-100 dark:bg-red-900' : isLow ? 'bg-amber-100 dark:bg-amber-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              <Zap className={`h-5 w-5 ${isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-blue-500'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Credits</p>
              <p className="text-xl font-bold">{credits.toLocaleString()}</p>
            </div>
          </div>
          <Button 
            variant={isEmpty ? 'default' : 'outline'} 
            size="sm"
            onClick={onUpgrade}
          >
            {isEmpty ? 'Upgrade Now' : 'Get More'}
          </Button>
        </div>
        {isEmpty && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Your AI credits are exhausted. Upgrade to continue using AI features.
          </p>
        )}
        {isLow && !isEmpty && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Running low on credits. Consider upgrading soon.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AICreditsUpgrade;
