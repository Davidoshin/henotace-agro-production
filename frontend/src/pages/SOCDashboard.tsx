import { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Users, Lock, User, LogOut, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import SecurityCentre from '@/components/admin/SecurityCentre';

const SOCDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreateTeams, setCanCreateTeams] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved ? saved === 'dark' : false; // Default to light
  });

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('admin_theme', newMode ? 'dark' : 'light');
    
    // Apply theme to document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const securityUser = localStorage.getItem('securityUser');
        if (securityUser) {
          const user = JSON.parse(securityUser);
          setUserData(user);
          // Check if user has permission to create teams (only for main admin dashboard users)
          setCanCreateTeams(false); // Security users cannot create teams
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('securityToken');
    localStorage.removeItem('securityRefreshToken');
    localStorage.removeItem('securityUser');
    navigate('/security-login');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">SOC Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData?.avatar} alt={userData?.first_name} />
                      <AvatarFallback>
                        {getInitials(userData?.first_name, userData?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {userData?.first_name && userData?.last_name && (
                        <p className="font-medium">
                          {userData.first_name} {userData.last_name}
                        </p>
                      )}
                      {userData?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {userData.email}
                        </p>
                      )}
                      {userData?.role_display && (
                        <p className="text-xs text-muted-foreground">
                          {userData.role_display}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/manage-account')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Manage Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Centre Component - Fetches data from /henotacengadmin API */}
        <SecurityCentre 
          canCreateTeams={canCreateTeams}
          isSOCDashboard={true}
        />
      </main>
    </div>
  );
};

export default SOCDashboard;
