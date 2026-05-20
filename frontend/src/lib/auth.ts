import { apiCallPublic } from '@/lib/api';

/**
 * Authentication utilities for persistent login with 2-week token expiry
 */

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
const CACHED_LOGIN_EMAIL = 'cached_login_email';
const CACHED_LOGIN_PASSWORD = 'cached_login_password';
const CACHED_LOGIN_REALM = 'cached_login_realm';

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
  const userData = getUserData();
  const validSession = isSessionValid();

  return !!(userData && validSession);
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

export const getCachedLoginCredentials = (): { email: string; password: string; realm: string } | null => {
  const email = localStorage.getItem(CACHED_LOGIN_EMAIL);
  const rawPassword = localStorage.getItem(CACHED_LOGIN_PASSWORD);
  const realm = localStorage.getItem(CACHED_LOGIN_REALM) || '';

  if (!email || !rawPassword) return null;

  try {
    const password = atob(rawPassword);
    return {
      email,
      password,
      realm: realm || 'business',
    };
  } catch (err) {
    console.error('Failed to decode cached login password:', err);
    clearCachedLoginCredentials();
    return null;
  }
};

export const saveCachedLoginCredentials = (email: string, password: string, realm: string = 'business'): void => {
  localStorage.setItem(CACHED_LOGIN_EMAIL, email);
  localStorage.setItem(CACHED_LOGIN_PASSWORD, btoa(password));
  localStorage.setItem(CACHED_LOGIN_REALM, realm);
};

export const clearCachedLoginCredentials = (): void => {
  localStorage.removeItem(CACHED_LOGIN_EMAIL);
  localStorage.removeItem(CACHED_LOGIN_PASSWORD);
  localStorage.removeItem(CACHED_LOGIN_REALM);
};

export const touchSession = (): void => {
  if (!getUserData()) return;
  localStorage.setItem('loginTimestamp', String(Date.now()));
};

const AGRO_BUSINESS_CATEGORIES = ['agro_production', 'agro_production_farming', 'agro', 'agriculture', 'farm', 'farming'];

const getStoredBusinessCategory = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('business_category') ||
    localStorage.getItem('business_type') ||
    localStorage.getItem('businessCategory') ||
    localStorage.getItem('businessType') ||
    ''
  ).toLowerCase();
};

const isAgroBusinessCategory = (businessData: any, realm?: string): boolean => {
  const category = String(businessData?.business_category || businessData?.category || '').toLowerCase();
  const businessType = String(businessData?.business_type || businessData?.type || '').toLowerCase();
  return (
    realm === 'agro' ||
    category === 'agro_production' ||
    ['agro_production', 'agro', 'agriculture', 'farm', 'farming'].includes(businessType)
  );
};

export const persistLoginSession = (
  data: any,
  cachedEmail?: string,
  cachedPassword?: string,
  realm: string = 'business'
): void => {
  const accessToken = data.tokens?.access || data.access;
  const refreshToken = data.tokens?.refresh || data.refresh;

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken || '');
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken || '');
  }

  const role = data.user?.role || data.login_as || data.role || 'business_owner';
  localStorage.setItem('userRole', role);
  localStorage.setItem('user_role', role);

  const userData = {
    id: data.user?.id || data.user_id,
    email: data.user?.email || cachedEmail || '',
    first_name: data.user?.first_name || '',
    last_name: data.user?.last_name || '',
    role,
    profile_image: data.user?.profile_image || '',
  };

  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('user_id', userData.id?.toString() || '');
  localStorage.setItem('user_email', userData.email);
  localStorage.setItem('user_first_name', userData.first_name);
  localStorage.setItem('user_last_name', userData.last_name);

  if (data.business) {
    localStorage.setItem('business_id', data.business.id?.toString() || '');
    localStorage.setItem('business_name', data.business.name || '');
    localStorage.setItem('business_unique_code', data.business.code || data.business.unique_code || '');
    localStorage.setItem('business_slug', data.business.slug || data.business.code?.toLowerCase() || '');
  }

  const resolvedRealm = data.realm || realm;
  if (isAgroBusinessCategory(data.business, resolvedRealm)) {
    localStorage.setItem('business_category', data.business?.business_category || data.business?.category || 'agro_production');
    localStorage.setItem('business_type', data.business?.business_type || data.business?.type || 'agro_production');
  }

  saveCachedLoginCredentials(cachedEmail || userData.email, cachedPassword || '', resolvedRealm);
  localStorage.setItem('loginTimestamp', String(Date.now()));
};

export const attemptAutoLoginFromCache = async (): Promise<boolean> => {
  if (isLoggedIn()) {
    touchSession();
    return true;
  }

  const cachedCredentials = getCachedLoginCredentials();
  if (!cachedCredentials) return false;
  if (!navigator.onLine) return false;

  try {
    const loginEndpoint = `auth/${cachedCredentials.realm || 'business'}/login/`;
    const data = await apiCallPublic(loginEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: cachedCredentials.email,
        password: cachedCredentials.password,
        realm: cachedCredentials.realm,
      }),
    });

    if (data?.requires_2fa) {
      return false;
    }

    persistLoginSession(data, cachedCredentials.email, cachedCredentials.password, cachedCredentials.realm);
    return true;
  } catch (err) {
    console.warn('Auto-login from cache failed:', err);
    return false;
  }
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
  localStorage.removeItem(CACHED_LOGIN_EMAIL);
  localStorage.removeItem(CACHED_LOGIN_PASSWORD);
  localStorage.removeItem(CACHED_LOGIN_REALM);
};

export const getDashboardRoute = (role: string): string => {
  const roleLower = role.toLowerCase();
  const businessCategory = getStoredBusinessCategory();
  const isAgroCategory = AGRO_BUSINESS_CATEGORIES.includes(businessCategory);

  if (roleLower.includes('agro') || roleLower.includes('farm') || isAgroCategory) {
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
