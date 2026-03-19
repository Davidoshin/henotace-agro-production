import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AdminLogin from './admin/AdminLogin';
import AccessDenied from './admin/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  showLogin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['cbt_institution'], 
  redirectTo = '/manage-account?view=profile',
  showLogin = false
}: ProtectedRouteProps) {
  const [role, setRole] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const userData = localStorage.getItem('user');
    const securityUserData = localStorage.getItem('securityUser');
    let userRole = storedRole;
    let staffStatus = false;
    let superuserStatus = false;
    let userToParse = userData || securityUserData;
    
    // Also check if user is staff/admin from user data
    if (userToParse) {
      try {
        const user = JSON.parse(userToParse);
        // Check staff and superuser status directly - handle both boolean and string values
        staffStatus = user.is_staff === true || user.is_staff === 'true' || user.is_staff === 1;
        superuserStatus = user.is_superuser === true || user.is_superuser === 'true' || user.is_superuser === 1;
        
        // Debug logging
        console.log('[ProtectedRoute] User data:', {
          email: user.email,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
          role: user.role,
          staffStatus,
          superuserStatus
        });
        
        // Prioritize staff/superuser status over stored role
        if (superuserStatus) {
          userRole = 'admin';
        } else if (staffStatus) {
          userRole = 'staff';
        } else if (user.role === 'admin' || user.role === 'staff') {
          userRole = user.role;
        } else if (!userRole) {
          // Fallback to stored role if no staff/admin status
          userRole = storedRole;
        }
      } catch (e) {
        console.error('[ProtectedRoute] Error parsing user data:', e);
      }
    } else {
      console.warn('[ProtectedRoute] No user data found in localStorage');
    }
    
    setRole(userRole);
    setIsStaff(staffStatus);
    setIsSuperuser(superuserStatus);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  const token = localStorage.getItem('accessToken') || localStorage.getItem('securityToken');
  if (!token) {
    // If showLogin is true, show login page instead of redirecting
    if (showLogin) {
      return <AdminLogin />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Allow access to admin routes - we'll restrict actions instead of access
  // No access denial here - let users see the dashboard but restrict actions

  // If student tries to access institution routes, redirect
  if (role === 'student' || role === 'cbt_student') {
    return <Navigate to={redirectTo} replace />;
  }

  // If role doesn't match allowed roles, show access denied for admin routes
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    // For admin routes, allow access but restrict actions
    if (showLogin && (allowedRoles.includes('admin') || allowedRoles.includes('staff'))) {
      // Allow access - actions will be restricted in component
      return <>{children}</>;
    }
    // For other routes, show login or redirect
    if (showLogin) {
      return <AdminLogin />;
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  // Allow access if no specific roles required (for admin routes)
  if (allowedRoles.length === 0 || !role) {
    // Still require authentication
    const checkToken = localStorage.getItem('accessToken') || localStorage.getItem('securityToken');
    if (!checkToken && showLogin) {
      return <AdminLogin />;
    }
    if (!checkToken) {
      return <Navigate to={redirectTo} replace />;
    }
    // For admin routes, allow access - actions will be restricted
    return <>{children}</>;
  }

  return <>{children}</>;
}
