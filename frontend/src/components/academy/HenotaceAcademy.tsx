import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, BookOpen, ChevronRight, ChevronLeft, CheckCircle2, 
  Circle, PlayCircle, Clock, Star, Trophy, ArrowLeft, Package,
  Wrench, Users, FileText, Calculator, BarChart3, ShoppingCart,
  Calendar, CreditCard, Settings, Building2, TrendingUp, Receipt,
  UserCheck, MessageSquare, Briefcase, Palette, Target, Lightbulb,
  Layers, Grid3X3
} from 'lucide-react';

// Course Types
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  diagramType?: 'flow' | 'hierarchy' | 'process' | 'cycle' | 'comparison';
  content: {
    introduction: string;
    steps: {
      title: string;
      description: string;
      tip?: string;
    }[];
    keyTakeaways: string[];
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lessons: Lesson[];
  category: 'product' | 'service' | 'common';
}

// Product-Based Courses
const PRODUCT_COURSES: Course[] = [
  {
    id: 'inventory-management',
    title: 'Inventory Management',
    description: 'Master stock control, product tracking, and inventory optimization',
    icon: <Package className="h-6 w-6" />,
    color: 'bg-blue-500',
    category: 'product',
    lessons: [
      {
        id: 'add-products',
        title: 'Adding Products',
        description: 'Learn how to add and organize your products',
        duration: '5 min',
        icon: <Package className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'Products are the foundation of your business. This lesson teaches you how to add products with proper details.',
          steps: [
            { title: 'Navigate to Inventory', description: 'Go to Products → Add New Product from your dashboard', tip: 'Use the quick-add button (+) on mobile' },
            { title: 'Enter Product Details', description: 'Add name, description, category, and SKU', tip: 'SKUs help track products across branches' },
            { title: 'Set Pricing', description: 'Enter cost price and selling price to track profit margins', tip: 'The system auto-calculates your margin percentage' },
            { title: 'Add Stock Quantity', description: 'Enter initial stock count and set low stock alerts', tip: 'Low stock alerts prevent stockouts' },
          ],
          keyTakeaways: ['Always include SKU for easy tracking', 'Set realistic low stock thresholds', 'Add product images for quick identification']
        }
      },
      {
        id: 'stock-management',
        title: 'Stock Adjustments',
        description: 'Track stock movements and adjustments',
        duration: '4 min',
        icon: <Layers className="h-5 w-5" />,
        diagramType: 'process',
        content: {
          introduction: 'Stock adjustments help maintain accurate inventory counts when products are damaged, lost, or when you receive new stock.',
          steps: [
            { title: 'Stock In', description: 'Record new stock arrivals from suppliers', tip: 'Always verify physical count against invoice' },
            { title: 'Stock Out', description: 'Record products removed (damages, samples, etc.)', tip: 'Add reasons for better reporting' },
            { title: 'Stock Transfer', description: 'Move products between branches/locations', tip: 'Both branches see the transfer in real-time' },
            { title: 'Audit Trail', description: 'View history of all stock movements', tip: 'Useful for identifying discrepancies' },
          ],
          keyTakeaways: ['Document reasons for adjustments', 'Regular stock counts improve accuracy', 'Use transfers for multi-branch inventory']
        }
      },
      {
        id: 'inventory-reports',
        title: 'Inventory Reports',
        description: 'Understand inventory analytics and reports',
        duration: '6 min',
        icon: <BarChart3 className="h-5 w-5" />,
        diagramType: 'hierarchy',
        content: {
          introduction: 'Reports help you understand inventory performance, identify slow-moving items, and optimize stock levels.',
          steps: [
            { title: 'Stock Level Report', description: 'See current stock quantities and values', tip: 'Export to Excel for detailed analysis' },
            { title: 'Movement Report', description: 'Track what moved in and out over time', tip: 'Filter by date range for specific periods' },
            { title: 'Valuation Report', description: 'Calculate total inventory worth', tip: 'Compare cost vs selling value' },
            { title: 'Low Stock Alert', description: 'Items that need reordering', tip: 'Set up email notifications' },
          ],
          keyTakeaways: ['Review reports weekly', 'Identify slow-moving products', 'Use data for purchasing decisions']
        }
      }
    ]
  },
  {
    id: 'sales-pos',
    title: 'Sales & POS',
    description: 'Process sales efficiently and manage transactions',
    icon: <ShoppingCart className="h-6 w-6" />,
    color: 'bg-green-500',
    category: 'product',
    lessons: [
      {
        id: 'making-sales',
        title: 'Making a Sale',
        description: 'Process customer purchases step by step',
        duration: '5 min',
        icon: <ShoppingCart className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'The POS (Point of Sale) system makes selling easy. Learn to process sales quickly and accurately.',
          steps: [
            { title: 'Open POS', description: 'Click the POS button or go to Sales → New Sale', tip: 'Use keyboard shortcut F2 for quick access' },
            { title: 'Add Products', description: 'Search by name/barcode or browse categories', tip: 'Barcode scanner speeds up checkout' },
            { title: 'Apply Discounts', description: 'Add item or cart-level discounts if applicable', tip: 'Set discount permissions for staff' },
            { title: 'Complete Payment', description: 'Select payment method and finalize', tip: 'Support multiple payment methods per sale' },
          ],
          keyTakeaways: ['Train staff on quick search', 'Always print or send receipts', 'Check product prices before finalizing']
        }
      },
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        description: 'Accept various payment types',
        duration: '4 min',
        icon: <CreditCard className="h-5 w-5" />,
        diagramType: 'comparison',
        content: {
          introduction: 'Accept payments through multiple channels to never lose a sale.',
          steps: [
            { title: 'Cash Payments', description: 'Record cash and calculate change automatically', tip: 'Count change back to customer' },
            { title: 'Bank Transfer', description: 'Accept direct transfers and POS payments', tip: 'Verify before releasing goods' },
            { title: 'Split Payment', description: 'Accept partial payments in different methods', tip: 'Useful for large purchases' },
            { title: 'Credit Sales', description: 'Allow trusted customers to pay later', tip: 'Set credit limits to manage risk' },
          ],
          keyTakeaways: ['Offer multiple payment options', 'Track credit sales carefully', 'Reconcile daily transactions']
        }
      }
    ]
  },
  {
    id: 'branch-management',
    title: 'Multi-Branch Operations',
    description: 'Manage multiple store locations effectively',
    icon: <Building2 className="h-6 w-6" />,
    color: 'bg-purple-500',
    category: 'product',
    lessons: [
      {
        id: 'setup-branches',
        title: 'Setting Up Branches',
        description: 'Create and configure multiple locations',
        duration: '5 min',
        icon: <Building2 className="h-5 w-5" />,
        diagramType: 'hierarchy',
        content: {
          introduction: 'Multi-branch management lets you control all locations from one dashboard.',
          steps: [
            { title: 'Create Branch', description: 'Go to Settings → Branches → Add New', tip: 'Include complete address for delivery' },
            { title: 'Assign Staff', description: 'Add employees to specific branches', tip: 'Staff can be assigned to multiple branches' },
            { title: 'Configure Settings', description: 'Set branch-specific prices, taxes, receipts', tip: 'Each branch can have unique receipt format' },
            { title: 'Set Permissions', description: 'Control what each branch can access', tip: 'Branch managers can view only their data' },
          ],
          keyTakeaways: ['Centralize inventory management', 'Monitor branch performance', 'Standardize operations across locations']
        }
      }
    ]
  }
];

// Service-Based Courses
const SERVICE_COURSES: Course[] = [
  {
    id: 'service-management',
    title: 'Service Management',
    description: 'Create and manage your service offerings',
    icon: <Wrench className="h-6 w-6" />,
    color: 'bg-orange-500',
    category: 'service',
    lessons: [
      {
        id: 'creating-services',
        title: 'Creating Services',
        description: 'Set up your service catalog',
        duration: '5 min',
        icon: <Wrench className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'Services are what you offer to clients. Define them clearly to attract the right customers.',
          steps: [
            { title: 'Add New Service', description: 'Go to Services → Add Service from dashboard', tip: 'Group similar services into categories' },
            { title: 'Set Details', description: 'Add name, description, and duration', tip: 'Clear descriptions help clients understand value' },
            { title: 'Configure Pricing', description: 'Set hourly rate or fixed price', tip: 'Offer packages for better value' },
            { title: 'Add Images', description: 'Upload photos of your work', tip: 'Before/after images showcase quality' },
          ],
          keyTakeaways: ['Price based on value, not just time', 'Include all materials in service price', 'Create packages for popular combinations']
        }
      },
      {
        id: 'service-packages',
        title: 'Service Packages',
        description: 'Bundle services for better value',
        duration: '4 min',
        icon: <Grid3X3 className="h-5 w-5" />,
        diagramType: 'comparison',
        content: {
          introduction: 'Packages combine multiple services at a discounted rate, encouraging larger purchases.',
          steps: [
            { title: 'Create Package', description: 'Go to Services → Packages → New', tip: 'Name packages attractively (e.g., "Complete Care")' },
            { title: 'Add Services', description: 'Select services to include', tip: 'Bundle complementary services' },
            { title: 'Set Package Price', description: 'Offer savings over individual prices', tip: '10-20% discount is attractive' },
            { title: 'Promote Package', description: 'Feature on booking page and invoices', tip: 'Highlight savings amount' },
          ],
          keyTakeaways: ['Packages increase average order value', 'Make savings obvious to clients', 'Update packages seasonally']
        }
      }
    ]
  },
  {
    id: 'booking-management',
    title: 'Booking & Scheduling',
    description: 'Manage appointments and schedules efficiently',
    icon: <Calendar className="h-6 w-6" />,
    color: 'bg-indigo-500',
    category: 'service',
    lessons: [
      {
        id: 'setup-booking',
        title: 'Setting Up Bookings',
        description: 'Configure your booking system',
        duration: '6 min',
        icon: <Calendar className="h-5 w-5" />,
        diagramType: 'process',
        content: {
          introduction: 'Online booking lets clients schedule appointments 24/7, reducing admin work.',
          steps: [
            { title: 'Set Working Hours', description: 'Define your availability per day', tip: 'Include buffer time between appointments' },
            { title: 'Configure Services', description: 'Set duration and capacity for each', tip: 'Account for setup/cleanup time' },
            { title: 'Enable Online Booking', description: 'Activate client booking page', tip: 'Share link on social media and website' },
            { title: 'Set Booking Rules', description: 'Configure advance notice, cancellation policy', tip: 'Require minimum 24h notice for cancellations' },
          ],
          keyTakeaways: ['24/7 booking increases appointments', 'Clear policies prevent no-shows', 'Buffer time prevents running late']
        }
      },
      {
        id: 'managing-calendar',
        title: 'Calendar Management',
        description: 'Handle bookings and schedule changes',
        duration: '5 min',
        icon: <Clock className="h-5 w-5" />,
        diagramType: 'cycle',
        content: {
          introduction: 'Your calendar is your command center. Keep it updated for smooth operations.',
          steps: [
            { title: 'View Bookings', description: 'See daily, weekly, or monthly view', tip: 'Color-code by service type' },
            { title: 'Manual Booking', description: 'Add walk-ins or phone bookings', tip: 'Always add client contact info' },
            { title: 'Reschedule', description: 'Drag and drop to change times', tip: 'System notifies client automatically' },
            { title: 'Block Time', description: 'Mark personal time or breaks', tip: 'Block lunch and personal appointments' },
          ],
          keyTakeaways: ['Check calendar every morning', 'Confirm appointments day before', 'Track no-shows for follow-up']
        }
      }
    ]
  },
  {
    id: 'client-management',
    title: 'Client Management',
    description: 'Build and maintain client relationships',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-pink-500',
    category: 'service',
    lessons: [
      {
        id: 'client-profiles',
        title: 'Client Profiles',
        description: 'Keep detailed client records',
        duration: '5 min',
        icon: <UserCheck className="h-5 w-5" />,
        diagramType: 'hierarchy',
        content: {
          introduction: 'Good client data enables personalized service and builds loyalty.',
          steps: [
            { title: 'Add Client', description: 'Create profile with contact details', tip: 'Capture phone, email, and address' },
            { title: 'Record Preferences', description: 'Note likes, dislikes, special needs', tip: 'Review before each appointment' },
            { title: 'Service History', description: 'Track all past services automatically', tip: 'Use for recommendations' },
            { title: 'Notes & Tags', description: 'Add internal notes and categorize', tip: 'Tag VIP clients for special treatment' },
          ],
          keyTakeaways: ['Personal touches build loyalty', 'Track birthdays for special offers', 'Review history before appointments']
        }
      }
    ]
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Manage complex projects with milestones',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-cyan-500',
    category: 'service',
    lessons: [
      {
        id: 'creating-projects',
        title: 'Creating Projects',
        description: 'Set up and track client projects',
        duration: '6 min',
        icon: <Briefcase className="h-5 w-5" />,
        diagramType: 'process',
        content: {
          introduction: 'Projects help you manage larger engagements with multiple deliverables.',
          steps: [
            { title: 'Create Project', description: 'Go to Projects → New Project', tip: 'Link to client profile' },
            { title: 'Set Milestones', description: 'Break into phases with dates', tip: 'Milestones trigger billing' },
            { title: 'Add Tasks', description: 'List specific work items', tip: 'Assign to team members' },
            { title: 'Track Progress', description: 'Update status as work progresses', tip: 'Clients can view progress' },
          ],
          keyTakeaways: ['Clear milestones set expectations', 'Regular updates build trust', 'Document everything']
        }
      }
    ]
  },
  {
    id: 'portfolio-building',
    title: 'Portfolio & Marketing',
    description: 'Showcase your work and attract clients',
    icon: <Palette className="h-6 w-6" />,
    color: 'bg-rose-500',
    category: 'service',
    lessons: [
      {
        id: 'building-portfolio',
        title: 'Building Your Portfolio',
        description: 'Showcase your best work',
        duration: '5 min',
        icon: <Palette className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'A strong portfolio converts visitors into clients by showing your capabilities.',
          steps: [
            { title: 'Select Best Work', description: 'Choose projects that showcase range', tip: 'Quality over quantity' },
            { title: 'Add Details', description: 'Include description, client, and results', tip: 'Mention measurable outcomes' },
            { title: 'Upload Images', description: 'Use high-quality photos', tip: 'Before/after images are powerful' },
            { title: 'Organize Categories', description: 'Group by service type', tip: 'Help clients find relevant work' },
          ],
          keyTakeaways: ['Update portfolio regularly', 'Get client permission for photos', 'Share on social media']
        }
      }
    ]
  }
];

// Common Courses (For Both)
const COMMON_COURSES: Course[] = [
  {
    id: 'invoicing',
    title: 'Invoicing & Payments',
    description: 'Create professional invoices and track payments',
    icon: <Receipt className="h-6 w-6" />,
    color: 'bg-emerald-500',
    category: 'common',
    lessons: [
      {
        id: 'creating-invoices',
        title: 'Creating Invoices',
        description: 'Generate professional invoices',
        duration: '5 min',
        icon: <FileText className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'Professional invoices ensure you get paid on time and look credible.',
          steps: [
            { title: 'Create Invoice', description: 'Go to Invoices → Create New', tip: 'Select customer first' },
            { title: 'Add Line Items', description: 'Add products or services with quantities', tip: 'Include detailed descriptions' },
            { title: 'Set Terms', description: 'Add due date and payment instructions', tip: 'Net 7 or Net 14 is standard' },
            { title: 'Send Invoice', description: 'Email directly or download PDF', tip: 'WhatsApp delivery works great' },
          ],
          keyTakeaways: ['Invoice immediately after delivery', 'Follow up on overdue invoices', 'Offer multiple payment options']
        }
      },
      {
        id: 'tracking-payments',
        title: 'Tracking Payments',
        description: 'Monitor payment status and follow up',
        duration: '4 min',
        icon: <CreditCard className="h-5 w-5" />,
        diagramType: 'cycle',
        content: {
          introduction: 'Stay on top of receivables to maintain healthy cash flow.',
          steps: [
            { title: 'View Dashboard', description: 'See pending, paid, and overdue', tip: 'Check daily for new payments' },
            { title: 'Record Payment', description: 'Mark invoices as paid when received', tip: 'Note payment method used' },
            { title: 'Send Reminders', description: 'Auto-remind for overdue invoices', tip: 'Customize reminder messages' },
            { title: 'Generate Reports', description: 'Analyze payment patterns', tip: 'Identify slow-paying clients' },
          ],
          keyTakeaways: ['Same-day payment recording', 'Automate reminders', 'Review aging report weekly']
        }
      }
    ]
  },
  {
    id: 'tax-compliance',
    title: 'Tax Compliance',
    description: 'Understand Nigerian tax obligations',
    icon: <Calculator className="h-6 w-6" />,
    color: 'bg-red-500',
    category: 'common',
    lessons: [
      {
        id: 'paye-basics',
        title: 'PAYE Tax Basics',
        description: 'Understand employee income tax',
        duration: '7 min',
        icon: <Calculator className="h-5 w-5" />,
        diagramType: 'hierarchy',
        content: {
          introduction: 'PAYE (Pay As You Earn) is tax deducted from employee salaries and paid to state tax authority.',
          steps: [
            { title: 'Understand PAYE', description: 'Tax on employee salaries paid to STATE IRS', tip: 'Not FIRS - state where employee works!' },
            { title: 'Calculate Tax', description: 'Use tax brackets (0-25% based on income)', tip: 'System calculates automatically' },
            { title: 'Deduct Monthly', description: 'Withhold from employee salary', tip: 'Show on payslip' },
            { title: 'Remit by 10th', description: 'Pay to State IRS by 10th of next month', tip: 'Late payment incurs penalties' },
          ],
          keyTakeaways: ['PAYE goes to STATE IRS', 'Calculate using 2025 tax brackets', 'Pay by 10th of following month']
        }
      },
      {
        id: 'vat-basics',
        title: 'VAT Basics',
        description: 'Value Added Tax for businesses',
        duration: '6 min',
        icon: <Receipt className="h-5 w-5" />,
        diagramType: 'cycle',
        content: {
          introduction: 'VAT is a 7.5% tax on goods and services, paid to FIRS.',
          steps: [
            { title: 'Check If Required', description: 'Mandatory if turnover > ₦100M/year', tip: 'Some services are exempt' },
            { title: 'Charge on Sales', description: 'Add 7.5% VAT to taxable items', tip: 'Show VAT separately on invoice' },
            { title: 'Track Input VAT', description: 'Record VAT paid on purchases', tip: 'Keep all receipts' },
            { title: 'File & Remit', description: 'Pay net VAT to FIRS by 21st', tip: 'Input VAT reduces payment' },
          ],
          keyTakeaways: ['7.5% VAT rate in Nigeria', 'Keep input VAT receipts', 'File by 21st monthly']
        }
      }
    ]
  },
  {
    id: 'team-management',
    title: 'Team & Staff',
    description: 'Manage employees and permissions',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-violet-500',
    category: 'common',
    lessons: [
      {
        id: 'adding-staff',
        title: 'Adding Team Members',
        description: 'Set up employee accounts',
        duration: '5 min',
        icon: <UserCheck className="h-5 w-5" />,
        diagramType: 'flow',
        content: {
          introduction: 'Add team members to delegate tasks and track performance.',
          steps: [
            { title: 'Invite Member', description: 'Go to Team → Add Member', tip: 'Use work email addresses' },
            { title: 'Assign Role', description: 'Select Admin, Manager, or Staff', tip: 'Start with limited permissions' },
            { title: 'Set Permissions', description: 'Customize access levels', tip: 'Review permissions quarterly' },
            { title: 'Onboarding', description: 'Member receives email to set up', tip: 'Guide them through first login' },
          ],
          keyTakeaways: ['Principle of least privilege', 'Review access regularly', 'Deactivate former staff immediately']
        }
      }
    ]
  },
  {
    id: 'analytics-reports',
    title: 'Analytics & Reports',
    description: 'Understand your business performance',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-amber-500',
    category: 'common',
    lessons: [
      {
        id: 'dashboard-overview',
        title: 'Understanding Dashboard',
        description: 'Read key metrics at a glance',
        duration: '5 min',
        icon: <BarChart3 className="h-5 w-5" />,
        diagramType: 'hierarchy',
        content: {
          introduction: 'Your dashboard shows business health at a glance. Learn what each metric means.',
          steps: [
            { title: 'Revenue Metrics', description: 'Today, week, month, year totals', tip: 'Compare to previous periods' },
            { title: 'Profit Margins', description: 'Gross and net profit percentages', tip: 'Track trends over time' },
            { title: 'Top Performers', description: 'Best selling products/services', tip: 'Stock up on winners' },
            { title: 'Growth Indicators', description: 'Month-over-month changes', tip: 'Identify seasonal patterns' },
          ],
          keyTakeaways: ['Check dashboard daily', 'Focus on trends, not just numbers', 'Set weekly review reminders']
        }
      }
    ]
  }
];

// Canvas Diagram Drawing Functions
const drawFlowDiagram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, steps: {title: string}[]) => {
  const width = canvas.width;
  const height = canvas.height;
  const boxWidth = 120;
  const boxHeight = 40;
  const gap = 60;
  const startX = 30;
  const startY = height / 2 - boxHeight / 2;
  
  ctx.clearRect(0, 0, width, height);
  
  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  steps.forEach((step, i) => {
    const x = startX + i * (boxWidth + gap);
    
    // Draw arrow (except for last box)
    if (i < steps.length - 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.moveTo(x + boxWidth + 5, startY + boxHeight / 2);
      ctx.lineTo(x + boxWidth + gap - 15, startY + boxHeight / 2);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.fillStyle = '#94a3b8';
      ctx.moveTo(x + boxWidth + gap - 15, startY + boxHeight / 2 - 6);
      ctx.lineTo(x + boxWidth + gap - 5, startY + boxHeight / 2);
      ctx.lineTo(x + boxWidth + gap - 15, startY + boxHeight / 2 + 6);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw box
    ctx.beginPath();
    ctx.fillStyle = '#3b82f6';
    ctx.roundRect(x, startY, boxWidth, boxHeight, 8);
    ctx.fill();
    
    // Draw step number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Step ${i + 1}`, x + boxWidth / 2, startY + boxHeight / 2 + 4);
  });
};

const drawProcessDiagram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, steps: {title: string}[]) => {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 70;
  
  ctx.clearRect(0, 0, width, height);
  
  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  
  // Draw cycle arrows
  const stepAngle = (2 * Math.PI) / steps.length;
  
  steps.forEach((step, i) => {
    const angle = -Math.PI / 2 + i * stepAngle;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    // Draw circle
    ctx.beginPath();
    ctx.fillStyle = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4];
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, x, y);
    
    // Draw curved arrow to next
    if (steps.length > 1) {
      const nextAngle = -Math.PI / 2 + ((i + 1) % steps.length) * stepAngle;
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, radius - 10, angle + 0.3, nextAngle - 0.3);
      ctx.stroke();
    }
  });
  
  // Center text
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Process', centerX, centerY - 6);
  ctx.fillText('Cycle', centerX, centerY + 8);
};

const drawHierarchyDiagram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, steps: {title: string}[]) => {
  const width = canvas.width;
  const height = canvas.height;
  const boxWidth = 80;
  const boxHeight = 30;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  
  // Top level
  const topX = width / 2 - boxWidth / 2;
  ctx.fillStyle = '#3b82f6';
  ctx.roundRect(topX, 15, boxWidth, boxHeight, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Main', topX + boxWidth / 2, 35);
  
  // Second level
  const secondY = 70;
  const cols = Math.min(steps.length, 4);
  const spacing = (width - cols * boxWidth) / (cols + 1);
  
  steps.slice(0, 4).forEach((_, i) => {
    const x = spacing + i * (boxWidth + spacing);
    
    // Line from top
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.moveTo(width / 2, 45);
    ctx.lineTo(x + boxWidth / 2, secondY);
    ctx.stroke();
    
    // Box
    ctx.fillStyle = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i];
    ctx.roundRect(x, secondY, boxWidth, boxHeight, 6);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(`${i + 1}`, x + boxWidth / 2, secondY + 19);
  });
};

const drawComparisonDiagram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, steps: {title: string}[]) => {
  const width = canvas.width;
  const height = canvas.height;
  const barHeight = 20;
  const maxBarWidth = width - 100;
  const startX = 40;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  
  const values = steps.map((_, i) => 100 - i * 20);
  
  steps.slice(0, 4).forEach((step, i) => {
    const y = 20 + i * (barHeight + 15);
    const barWidth = (values[i] / 100) * maxBarWidth;
    
    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}`, startX - 20, y + barHeight / 2 + 4);
    
    // Bar background
    ctx.fillStyle = '#e2e8f0';
    ctx.roundRect(startX, y, maxBarWidth, barHeight, 4);
    ctx.fill();
    
    // Bar
    ctx.fillStyle = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i];
    ctx.roundRect(startX, y, barWidth, barHeight, 4);
    ctx.fill();
  });
};

const drawCycleDiagram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, steps: {title: string}[]) => {
  drawProcessDiagram(ctx, canvas, steps); // Reuse process diagram for cycle
};

// Canvas Component
const LessonDiagram = ({ type, steps }: { type?: string; steps: {title: string}[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 120;
    
    switch (type) {
      case 'flow':
        drawFlowDiagram(ctx, canvas, steps);
        break;
      case 'process':
        drawProcessDiagram(ctx, canvas, steps);
        break;
      case 'hierarchy':
        drawHierarchyDiagram(ctx, canvas, steps);
        break;
      case 'comparison':
        drawComparisonDiagram(ctx, canvas, steps);
        break;
      case 'cycle':
        drawCycleDiagram(ctx, canvas, steps);
        break;
      default:
        drawFlowDiagram(ctx, canvas, steps);
    }
  }, [type, steps]);
  
  return (
    <div className="w-full overflow-x-auto bg-slate-50 rounded-lg p-2 mb-4">
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto"
        style={{ maxHeight: '120px' }}
      />
    </div>
  );
};

interface HenotaceAcademyProps {
  onClose?: () => void;
}

export default function HenotaceAcademy({ onClose }: HenotaceAcademyProps) {
  const [businessType, setBusinessType] = useState<'product' | 'service'>(() => {
    const stored = localStorage.getItem('dashboard_view_mode') || localStorage.getItem('dashboardViewMode');
    return (stored as 'product' | 'service') || 'product';
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('academy_completed_lessons');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Save progress
  useEffect(() => {
    localStorage.setItem('academy_completed_lessons', JSON.stringify([...completedLessons]));
  }, [completedLessons]);
  
  // Get courses based on business type
  const getCourses = useCallback(() => {
    if (businessType === 'product') {
      return [...PRODUCT_COURSES, ...COMMON_COURSES];
    } else {
      return [...SERVICE_COURSES, ...COMMON_COURSES];
    }
  }, [businessType]);
  
  const courses = getCourses();
  
  // Calculate progress
  const totalLessons = courses.reduce((acc, course) => acc + course.lessons.length, 0);
  const completedCount = courses.reduce((acc, course) => 
    acc + course.lessons.filter(l => completedLessons.has(l.id)).length, 0);
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  const markLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };
  
  const currentLesson = selectedCourse?.lessons[currentLessonIndex];
  
  const nextLesson = () => {
    if (selectedCourse && currentLessonIndex < selectedCourse.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    }
  };
  
  const prevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
    }
  };
  
  // Course List View
  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">Henotace Academy</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Learn to master your business management platform
              </p>
            </div>
          </div>
          
          {/* Progress Card */}
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Your Progress</span>
                </div>
                <Badge variant="secondary">{completedCount}/{totalLessons} lessons</Badge>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {progressPercentage === 100 
                  ? '🎉 Congratulations! You\'ve completed all lessons!' 
                  : `${progressPercentage}% complete - Keep going!`}
              </p>
            </CardContent>
          </Card>
          
          {/* Business Type Selector */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Your Business Type</CardTitle>
              <CardDescription>Choose to see relevant courses for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={businessType} onValueChange={(v) => setBusinessType(v as 'product' | 'service')}>
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="product" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product-Based
                  </TabsTrigger>
                  <TabsTrigger value="service" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Service-Based
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Course Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => {
              const courseLessons = course.lessons.length;
              const courseCompleted = course.lessons.filter(l => completedLessons.has(l.id)).length;
              const isComplete = courseCompleted === courseLessons;
              
              return (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedCourse(course);
                    setCurrentLessonIndex(0);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${course.color} text-white`}>
                        {course.icon}
                      </div>
                      {isComplete && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {courseLessons} lessons
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        ~{courseLessons * 5} min
                      </div>
                    </div>
                    <Progress 
                      value={(courseCompleted / courseLessons) * 100} 
                      className="h-1.5 mt-3" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {courseCompleted}/{courseLessons} completed
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  // Lesson View
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSelectedCourse(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${selectedCourse.color} text-white`}>
                {selectedCourse.icon}
              </div>
              <h1 className="text-xl font-bold">{selectedCourse.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Lesson {currentLessonIndex + 1} of {selectedCourse.lessons.length}
            </p>
          </div>
        </div>
        
        {/* Lesson Progress */}
        <div className="flex gap-1 mb-6">
          {selectedCourse.lessons.map((lesson, i) => (
            <button
              key={lesson.id}
              onClick={() => setCurrentLessonIndex(i)}
              className={`flex-1 h-2 rounded transition-colors ${
                i === currentLessonIndex 
                  ? 'bg-primary' 
                  : completedLessons.has(lesson.id)
                    ? 'bg-green-500'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        {currentLesson && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {currentLesson.icon}
                  </div>
                  <div>
                    <CardTitle>{currentLesson.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {currentLesson.duration}
                    </CardDescription>
                  </div>
                </div>
                {completedLessons.has(currentLesson.id) && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Introduction */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{currentLesson.content.introduction}</p>
              </div>
              
              {/* Canvas Diagram */}
              <LessonDiagram 
                type={currentLesson.diagramType} 
                steps={currentLesson.content.steps} 
              />
              
              {/* Steps */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Step-by-Step Guide
                </h3>
                {currentLesson.content.steps.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                      {step.tip && (
                        <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-2 rounded">
                          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span><strong>Pro Tip:</strong> {step.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Key Takeaways */}
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
                  <Star className="h-5 w-5" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {currentLesson.content.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={prevLesson}
                  disabled={currentLessonIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {!completedLessons.has(currentLesson.id) ? (
                  <Button onClick={() => markLessonComplete(currentLesson.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                ) : currentLessonIndex < selectedCourse.lessons.length - 1 ? (
                  <Button onClick={nextLesson}>
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setSelectedCourse(null)}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Finish Course
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={nextLesson}
                  disabled={currentLessonIndex === selectedCourse.lessons.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
