import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You do not have permission to access this page. Only staff members and administrators can access the admin dashboard.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
            <Button onClick={handleLogout} variant="default" className="w-full">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

