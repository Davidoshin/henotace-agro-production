import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Flag,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
  CalendarDays,
  ListTodo
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isBefore, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  category_display: string;
  goal_type: string;
  goal_type_display: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  progress_percentage: number;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  reminder_date: string | null;
  color: string;
  is_overdue: boolean;
  days_remaining: number | null;
  calendar_link: string | null;
  sync_to_google_calendar: boolean;
  assigned_to: { id: number; name: string; email: string } | null;
  created_by: { id: number; name: string } | null;
  sub_goals_count: number;
  sub_goals_completed: number;
  created_at: string;
  updated_at: string;
}

interface GoalStats {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  overdue: number;
  on_hold: number;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string | null;
  color: string;
  status: string;
  priority: string;
  progress: number;
}

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  on_hold: { label: "On Hold", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: Clock },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600" },
  high: { label: "High", color: "bg-orange-100 text-orange-600" },
  critical: { label: "Critical", color: "bg-red-100 text-red-600" },
};

const CATEGORY_OPTIONS = [
  { value: "revenue", label: "Revenue Target" },
  { value: "sales", label: "Sales Target" },
  { value: "customer", label: "Customer Acquisition" },
  { value: "product", label: "Product Launch" },
  { value: "service", label: "Service Delivery" },
  { value: "marketing", label: "Marketing Campaign" },
  { value: "project", label: "Project Completion" },
  { value: "personal", label: "Personal Development" },
  { value: "team", label: "Team Performance" },
  { value: "other", label: "Other" },
];

const COLOR_OPTIONS = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#22C55E", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#A855F7", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
];

export default function BusinessGoals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    total: 0,
    not_started: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    on_hold: 0,
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "sales",
    goal_type: "target",
    target_value: "",
    current_value: "",
    unit: "",
    priority: "medium",
    status: "not_started",
    start_date: "",
    due_date: "",
    reminder_date: "",
    color: "#3B82F6",
    notes: "",
    sync_to_google_calendar: false,
  });

  useEffect(() => {
    fetchGoals();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await apiGet(`business/goals/?${params.toString()}`);
      if (response.success) {
        setGoals(response.goals);
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const params = new URLSearchParams({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
      });
      
      const response = await apiGet(`business/goals/calendar/?${params.toString()}`);
      if (response.success) {
        setCalendarEvents(response.events);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  };

  useEffect(() => {
    if (activeView === "calendar") {
      fetchCalendarEvents();
    }
  }, [activeView, selectedMonth]);

  const handleCreateGoal = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiPost("business/goals/create/", {
        ...formData,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Goal created successfully",
        });
        setShowCreateDialog(false);
        resetForm();
        fetchGoals();
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiPut(`business/goals/${selectedGoal.id}/`, {
        ...formData,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Goal updated successfully",
        });
        setShowEditDialog(false);
        setSelectedGoal(null);
        resetForm();
        fetchGoals();
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;

    setIsSubmitting(true);
    try {
      const response = await apiDelete(`business/goals/${selectedGoal.id}/`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Goal deleted successfully",
        });
        setShowDeleteDialog(false);
        setSelectedGoal(null);
        fetchGoals();
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async (goalId: number, progress: number) => {
    try {
      const response = await apiPost(`business/goals/${goalId}/progress/`, {
        progress_percentage: progress,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Progress updated",
        });
        fetchGoals();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "sales",
      goal_type: "target",
      target_value: "",
      current_value: "",
      unit: "",
      priority: "medium",
      status: "not_started",
      start_date: "",
      due_date: "",
      reminder_date: "",
      color: "#3B82F6",
      notes: "",
      sync_to_google_calendar: false,
    });
  };

  const openEditDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      goal_type: goal.goal_type,
      target_value: goal.target_value?.toString() || "",
      current_value: goal.current_value?.toString() || "",
      unit: goal.unit || "",
      priority: goal.priority,
      status: goal.status,
      start_date: goal.start_date || "",
      due_date: goal.due_date || "",
      reminder_date: goal.reminder_date || "",
      color: goal.color,
      notes: "",
      sync_to_google_calendar: goal.sync_to_google_calendar,
    });
    setShowEditDialog(true);
  };

  const filteredGoals = useMemo(() => {
    if (!searchQuery) return goals;
    const query = searchQuery.toLowerCase();
    return goals.filter(
      (goal) =>
        goal.title.toLowerCase().includes(query) ||
        goal.description?.toLowerCase().includes(query)
    );
  }, [goals, searchQuery]);

  // Calendar helper functions
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarEvents.filter(
      (event) =>
        (event.start && event.start <= dateStr && (!event.end || event.end >= dateStr)) ||
        event.start === dateStr
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Goals</h1>
                <p className="text-sm text-muted-foreground">
                  Track your business goals and targets
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setStatusFilter("in_progress")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.in_progress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-green-500 transition-colors" onClick={() => setStatusFilter("completed")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStatusFilter("overdue")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-gray-500 transition-colors" onClick={() => setStatusFilter("not_started")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.not_started}</p>
                  <p className="text-xs text-muted-foreground">Not Started</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list">
                <ListTodo className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goals List View */}
        {activeView === "list" && (
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : filteredGoals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No goals found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No goals match your search"
                      : "Start by creating your first goal"}
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredGoals.map((goal) => {
                const statusConfig = STATUS_CONFIG[goal.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started;
                const StatusIcon = statusConfig.icon;
                const priorityConfig = PRIORITY_CONFIG[goal.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

                return (
                  <Card
                    key={goal.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowDetailDialog(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Color indicator */}
                        <div
                          className="w-1 h-16 rounded-full flex-shrink-0"
                          style={{ backgroundColor: goal.color }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{goal.title}</h3>
                                {goal.is_overdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {goal.description || "No description"}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Badge className={statusConfig.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                                <Badge className={priorityConfig.color}>
                                  <Flag className="h-3 w-3 mr-1" />
                                  {priorityConfig.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {goal.category_display}
                                </span>
                                {goal.due_date && (
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Due: {format(parseISO(goal.due_date), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Progress */}
                              <div className="w-24 hidden md:block">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{goal.progress_percentage}%</span>
                                </div>
                                <Progress value={goal.progress_percentage} className="h-2" />
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(goal);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Goal
                                  </DropdownMenuItem>
                                  {goal.calendar_link && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(goal.calendar_link!, "_blank");
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" />
                                      Add to Google Calendar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGoal(goal);
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Mobile progress */}
                          <div className="mt-3 md:hidden">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{goal.progress_percentage}%</span>
                            </div>
                            <Progress value={goal.progress_percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Calendar View */}
        {activeView === "calendar" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className="rounded-md border"
                  modifiers={{
                    hasGoals: (date) => getEventsForDate(date).length > 0,
                  }}
                  modifiersClassNames={{
                    hasGoals: "bg-primary/10 font-bold",
                  }}
                  components={{
                    Day: ({ date, displayMonth, ...props }) => {
                      const events = getEventsForDate(date);
                      // Only filter out displayMonth to avoid React DOM warning
                      const { displayMonth: _, ...buttonProps } = { displayMonth, ...props };
                      return (
                        <div className="relative">
                          <button {...buttonProps} className="h-full w-full p-2 text-center">
                            {format(date, "d")}
                          </button>
                          {events.length > 0 && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {events.slice(0, 3).map((event, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: event.color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </div>
              
              {/* Events for selected date */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Goals this month</h3>
                <div className="space-y-2">
                  {calendarEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No goals scheduled this month
                    </p>
                  ) : (
                    calendarEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          const goal = goals.find((g) => g.id === event.id);
                          if (goal) {
                            setSelectedGoal(goal);
                            setShowDetailDialog(true);
                          }
                        }}
                      >
                        <div
                          className="w-2 h-8 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.start && format(parseISO(event.start), "MMM d")}
                            {event.end && ` - ${format(parseISO(event.end), "MMM d")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{event.progress}%</p>
                          <Progress value={event.progress} className="h-1 w-16" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a new goal for your business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter goal title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your goal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1000000"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="e.g., NGN, sales, customers"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update goal details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter goal title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your goal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1000000"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Value</Label>
                <Input
                  type="number"
                  placeholder="Current progress"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          {selectedGoal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: selectedGoal.color }}
                  />
                  <div>
                    <DialogTitle>{selectedGoal.title}</DialogTitle>
                    <DialogDescription>
                      {selectedGoal.category_display}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedGoal.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedGoal.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{selectedGoal.progress_percentage}%</span>
                  </div>
                  <Progress value={selectedGoal.progress_percentage} className="h-3" />
                  {selectedGoal.target_value && (
                    <p className="text-xs text-muted-foreground text-right">
                      {selectedGoal.current_value} / {selectedGoal.target_value} {selectedGoal.unit}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={STATUS_CONFIG[selectedGoal.status as keyof typeof STATUS_CONFIG]?.color}>
                      {selectedGoal.status_display}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <Badge className={PRIORITY_CONFIG[selectedGoal.priority as keyof typeof PRIORITY_CONFIG]?.color}>
                      {selectedGoal.priority_display}
                    </Badge>
                  </div>
                  {selectedGoal.start_date && (
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {format(parseISO(selectedGoal.start_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                  {selectedGoal.due_date && (
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {format(parseISO(selectedGoal.due_date), "MMM d, yyyy")}
                      </p>
                      {selectedGoal.days_remaining !== null && selectedGoal.days_remaining >= 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedGoal.days_remaining} days remaining
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedGoal.calendar_link && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedGoal.calendar_link!, "_blank")}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Add to Google Calendar
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailDialog(false);
                    openEditDialog(selectedGoal);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGoal?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
