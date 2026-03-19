import { useState, useEffect, useCallback } from "react";
import { X, Target, Receipt, Bell, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";

export interface PopupNotification {
  id: string;
  type: 'goal_reminder' | 'tax_due' | 'goal_completed' | 'general';
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  meta?: any;
  dismissible?: boolean;
  created_at: string;
}

interface NotificationPopupProps {
  className?: string;
}

const NotificationPopup = ({ className }: NotificationPopupProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<PopupNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load dismissed notifications from localStorage
  useEffect(() => {
    const storedDismissed = localStorage.getItem('dismissed_popup_notifications');
    if (storedDismissed) {
      const parsed = JSON.parse(storedDismissed);
      // Clear dismissed that are older than 24 hours
      const now = Date.now();
      const validDismissed = parsed.filter((item: { id: string; timestamp: number }) => 
        now - item.timestamp < 24 * 60 * 60 * 1000
      );
      setDismissed(validDismissed.map((item: { id: string }) => item.id));
      localStorage.setItem('dismissed_popup_notifications', JSON.stringify(validDismissed));
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const popupNotifications: PopupNotification[] = [];
      
      // Fetch goals with due dates
      try {
        const goalsResponse = await apiGet('business/goals/');
        if (goalsResponse?.goals) {
          goalsResponse.goals.forEach((goal: any) => {
            if (goal.target_date && goal.status !== 'completed' && goal.status !== 'cancelled') {
              const targetDate = new Date(goal.target_date);
              const daysRemaining = differenceInDays(targetDate, new Date());
              
              // Goal due today
              if (isToday(targetDate)) {
                popupNotifications.push({
                  id: `goal_today_${goal.id}`,
                  type: 'goal_reminder',
                  title: '🎯 Goal Due Today!',
                  message: `Your goal "${goal.title}" is due today. Keep pushing to reach your target!`,
                  action_url: '/business/goals',
                  action_text: 'View Goal',
                  priority: 'urgent',
                  due_date: goal.target_date,
                  meta: { goal_id: goal.id, progress: goal.progress },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              }
              // Goal due tomorrow
              else if (isTomorrow(targetDate)) {
                popupNotifications.push({
                  id: `goal_tomorrow_${goal.id}`,
                  type: 'goal_reminder',
                  title: '⏰ Goal Due Tomorrow',
                  message: `Your goal "${goal.title}" is due tomorrow. You're at ${goal.progress || 0}% progress.`,
                  action_url: '/business/goals',
                  action_text: 'View Goal',
                  priority: 'high',
                  due_date: goal.target_date,
                  meta: { goal_id: goal.id, progress: goal.progress },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              }
              // Goal overdue
              else if (isPast(targetDate)) {
                popupNotifications.push({
                  id: `goal_overdue_${goal.id}`,
                  type: 'goal_reminder',
                  title: '⚠️ Goal Overdue',
                  message: `Your goal "${goal.title}" was due ${Math.abs(daysRemaining)} days ago. Consider updating or completing it.`,
                  action_url: '/business/goals',
                  action_text: 'Review Goal',
                  priority: 'urgent',
                  due_date: goal.target_date,
                  meta: { goal_id: goal.id, progress: goal.progress },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              }
              // Goal due within 3 days
              else if (daysRemaining <= 3 && daysRemaining > 1) {
                popupNotifications.push({
                  id: `goal_soon_${goal.id}`,
                  type: 'goal_reminder',
                  title: '📅 Goal Due Soon',
                  message: `Your goal "${goal.title}" is due in ${daysRemaining} days.`,
                  action_url: '/business/goals',
                  action_text: 'View Goal',
                  priority: 'medium',
                  due_date: goal.target_date,
                  meta: { goal_id: goal.id, progress: goal.progress },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              }
            }
          });
        }
      } catch (e) {
        console.log('Could not fetch goals for notifications');
      }
      
      // Fetch tax remittances with pending status
      try {
        const taxResponse = await apiGet('business/tax-remittances/?status=pending');
        if (taxResponse?.remittances) {
          taxResponse.remittances.forEach((remittance: any) => {
            if (remittance.due_date) {
              const dueDate = new Date(remittance.due_date);
              const daysUntilDue = differenceInDays(dueDate, new Date());
              
              if (daysUntilDue <= 7 && daysUntilDue >= 0) {
                popupNotifications.push({
                  id: `tax_${remittance.id}`,
                  type: 'tax_due',
                  title: daysUntilDue === 0 ? '🚨 Tax Payment Due Today!' : `📊 Tax Payment Due in ${daysUntilDue} Days`,
                  message: `Your ${remittance.tax_type || 'tax'} payment of ₦${Number(remittance.amount).toLocaleString()} is due ${isToday(dueDate) ? 'today' : `on ${format(dueDate, 'MMM d, yyyy')}`}.`,
                  action_url: '/business/my-tax',
                  action_text: 'View Tax Details',
                  priority: daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'high' : 'medium',
                  due_date: remittance.due_date,
                  meta: { amount: remittance.amount, tax_type: remittance.tax_type },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              } else if (daysUntilDue < 0) {
                popupNotifications.push({
                  id: `tax_overdue_${remittance.id}`,
                  type: 'tax_due',
                  title: '⚠️ Overdue Tax Payment',
                  message: `Your ${remittance.tax_type || ''} tax payment of ₦${Number(remittance.amount).toLocaleString()} was due ${Math.abs(daysUntilDue)} days ago. Please make payment to avoid penalties.`,
                  action_url: '/business/my-tax',
                  action_text: 'Pay Now',
                  priority: 'urgent',
                  due_date: remittance.due_date,
                  meta: { amount: remittance.amount, tax_type: remittance.tax_type },
                  dismissible: true,
                  created_at: new Date().toISOString(),
                });
              }
            }
          });
        }
      } catch (e) {
        console.log('Could not fetch tax remittances for notifications');
      }
      
      // Filter out dismissed notifications
      const activeNotifications = popupNotifications.filter(n => !dismissed.includes(n.id));
      
      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      activeNotifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      setNotifications(activeNotifications);
      
      if (activeNotifications.length > 0) {
        setIsVisible(true);
        setIsAnimating(true);
      }
    } catch (error) {
      console.error('Error fetching popup notifications:', error);
    }
  }, [dismissed]);

  useEffect(() => {
    // Initial fetch after a short delay
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 2000);
    
    // Refetch periodically (every 30 minutes)
    const interval = setInterval(fetchNotifications, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    
    // Store in localStorage with timestamp
    const storedDismissed = localStorage.getItem('dismissed_popup_notifications');
    const parsed = storedDismissed ? JSON.parse(storedDismissed) : [];
    parsed.push({ id, timestamp: Date.now() });
    localStorage.setItem('dismissed_popup_notifications', JSON.stringify(parsed));
    
    // Move to next notification or close
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setCurrentIndex(0);
    }, 300);
  };

  const handleAction = (notification: PopupNotification) => {
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    handleDismiss(notification.id);
  };

  const getIcon = (type: PopupNotification['type'], priority: PopupNotification['priority']) => {
    switch (type) {
      case 'goal_reminder':
      case 'goal_completed':
        return <Target className="h-6 w-6" />;
      case 'tax_due':
        return <Receipt className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  const getPriorityStyles = (priority: PopupNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          container: 'border-red-500 bg-red-50 dark:bg-red-950/30',
          icon: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
          badge: 'bg-red-500 text-white',
        };
      case 'high':
        return {
          container: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
          icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
          badge: 'bg-orange-500 text-white',
        };
      case 'medium':
        return {
          container: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
          icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
          badge: 'bg-yellow-500 text-white',
        };
      default:
        return {
          container: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
          icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
          badge: 'bg-blue-500 text-white',
        };
    }
  };

  if (!isVisible || notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];
  if (!currentNotification) return null;

  const styles = getPriorityStyles(currentNotification.priority);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
        isAnimating ? "animate-in fade-in duration-300" : "animate-out fade-out duration-300",
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget && currentNotification.dismissible) {
          handleClose();
        }
      }}
    >
      <Card 
        className={cn(
          "w-full max-w-md shadow-2xl border-2 transition-all duration-300",
          isAnimating ? "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" : "animate-out zoom-out-95 slide-out-to-bottom-4 duration-300",
          styles.container
        )}
      >
        <CardHeader className="pb-2 relative">
          <div className="flex items-start gap-3">
            <div className={cn("p-3 rounded-full flex-shrink-0", styles.icon)}>
              {getIcon(currentNotification.type, currentNotification.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">
                  {currentNotification.title}
                </CardTitle>
              </div>
              {currentNotification.due_date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due: {format(new Date(currentNotification.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            {currentNotification.dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleDismiss(currentNotification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            {currentNotification.message}
          </p>
          
          {/* Progress indicator for goals */}
          {currentNotification.meta?.progress !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{currentNotification.meta.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${currentNotification.meta.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Tax amount if available */}
          {currentNotification.meta?.amount && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Due</span>
                <span className="font-semibold text-lg">
                  ₦{Number(currentNotification.meta.amount).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {notifications.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} of {notifications.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {currentNotification.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(currentNotification.id)}
                >
                  Dismiss
                </Button>
              )}
              {currentNotification.action_url && (
                <Button
                  size="sm"
                  onClick={() => handleAction(currentNotification)}
                >
                  {currentNotification.action_text || 'View'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
