/**
 * Authentication utilities for persistent login with 2-week token expiry
 */

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

/**
 * Check if the current session is still valid (within 2 weeks)
 */
export const isSessionValid = (): boolean => {
  const loginTimestamp = localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return false;
  
  const loginTime = parseInt(loginTimestamp, 10);
  const now = Date.now();
  const elapsed = now - loginTime;
  
  return elapsed < TWO_WEEKS_MS;
};

/**
 * Get the remaining time until session expiry in milliseconds
 */
export const getSessionTimeRemaining = (): number => {
  const loginTimestamp = localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return 0;
  
  const loginTime = parseInt(loginTimestamp, 10);
  const now = Date.now();
  const elapsed = now - loginTime;
  
  return Math.max(0, TWO_WEEKS_MS - elapsed);
};

/**
 * Check if user is logged in with a valid session
 */
export const isLoggedIn = (): boolean => {
  const token = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('userData');
  const validSession = isSessionValid();
  
  return !!(token && userData && validSession);
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): any => {
  const userData = localStorage.getItem('userData');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

/**
 * Get user role from localStorage
 */
export const getUserRole = (): string | null => {
  return localStorage.getItem('userRole');
};

/**
 * Clear all auth data (logout)
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('loginTimestamp');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
  localStorage.removeItem('securityToken');
  localStorage.removeItem('securityRefreshToken');
};

/**
 * Get the appropriate dashboard route based on user role
 */
export const getDashboardRoute = (role: string): string => {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('agro') || roleLower.includes('farm')) {
    return '/agro-dashboard';
  }
  if (roleLower.includes('admin')) {
    return '/business-admin-dashboard';
  }
  if (roleLower.includes('staff')) {
    return '/business-staff-dashboard';
  }
  if (roleLower.includes('customer')) {
    return '/customer-dashboard';
  }
  
  // Default to customer dashboard
  return '/customer-dashboard';
};
