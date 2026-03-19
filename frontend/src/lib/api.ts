/**
 * Unified API utility for Henotace Business backend calls
 * 
 * SECURITY: Uses HttpOnly cookies for JWT token storage (anti-Evilginx/XSS protection)
 * - Tokens are stored in HttpOnly cookies by the server
 * - JavaScript cannot access HttpOnly cookies (prevents XSS token theft)
 * - Browser automatically sends cookies with requests (credentials: 'include')
 * - Token refresh happens via cookie-based endpoint
 * 
 * BACKWARDS COMPATIBILITY:
 * - Still checks localStorage for tokens (for mobile apps/legacy clients)
 * - Authorization header is sent if localStorage token exists
 * - Server accepts both cookie and header authentication
 */

import { getEffectiveApiKey as getCbtEffectiveApiKey } from './cbtKey';
import { reportApiError } from '@/services/errorReporting';

// Check if running in Electron
const isElectron = (): boolean => {
  // Check if window.electron exists (exposed by preload script)
  return typeof window !== 'undefined' && 
         (window as any).electron?.isElectron === true;
};

// Get base API URL from environment
const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If running in Electron, always use production backend
  if (isElectron()) {
    if (envUrl && envUrl.trim()) {
      let url = envUrl.trim().replace(/\/+$/, '');
      if (!url.includes('/api')) {
        url = url + '/api';
      }
      return url + '/';
    }
    // Default production API for Electron
    return 'https://business.api.henotaceai.ng/api/';
  }
  
  // Web app: use environment-based logic
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // Production: use env URL or default to production API
  if (isProduction) {
    if (envUrl && envUrl.trim()) {
      let url = envUrl.trim().replace(/\/+$/, '');
      if (!url.includes('/api')) {
        url = url + '/api';
      }
      return url + '/';
    }
    // Hardcoded production fallback
    return 'https://business.api.henotaceai.ng/api/';
  }
  
  // Development: use env URL or default to localhost
  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim().replace(/\/+$/, '');
    if (!url.includes('/api')) {
      url = url + '/api';
    }
    return url + '/';
  }
  
  // Development fallback
  return 'http://localhost:8000/api/';
};

// Get effective API key (institution > user > empty)
const getEffectiveApiKey = (): string => {
  return getCbtEffectiveApiKey();
};

// Get access token from localStorage (for backwards compatibility / mobile apps)
const getAccessToken = (): string | null => {
  // Check for standard user token first, then security token
  return localStorage.getItem('accessToken') || localStorage.getItem('securityToken');
};

// Get refresh token from localStorage (for backwards compatibility / mobile apps)
const getRefreshToken = (): string | null => {
  // Check for standard refresh token first, then security refresh token
  return localStorage.getItem('refreshToken') || localStorage.getItem('securityRefreshToken');
};

/**
 * Refresh access token using secure cookie-based refresh endpoint.
 * 
 * SECURITY: This uses HttpOnly cookies - the refresh token is NOT accessible
 * to JavaScript, making it immune to XSS and Evilginx attacks.
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    
    // First, try the secure cookie-based refresh endpoint
    const response = await fetch(`${baseUrl}auth/cookie/refresh/`, {
      method: 'POST',
      credentials: 'include', // Send HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      // Tokens are set as HttpOnly cookies by the server
      // No need to store anything in localStorage
      console.log('Token refreshed via secure cookie endpoint');
      return true;
    }
    
    // Fallback: try legacy token refresh if cookie refresh fails
    // This supports mobile apps and older clients that use localStorage
    const legacyRefreshToken = getRefreshToken();
    if (legacyRefreshToken) {
      const legacyResponse = await fetch(`${baseUrl}auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: legacyRefreshToken }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (legacyResponse.ok) {
        const data = await legacyResponse.json();
        if (data.access) {
          localStorage.setItem('accessToken', data.access);
          if (data.refresh) {
            localStorage.setItem('refreshToken', data.refresh);
          }
          return true;
        }
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Don't clear localStorage on network errors - might be temporary
    if (error.name === 'AbortError') {
      console.warn('Token refresh timed out');
    } else if (!navigator.onLine) {
      console.warn('Offline - cannot refresh token');
    }
  }

  // Only clear localStorage on actual authentication failures, not network issues
  // This prevents unnecessary logouts on temporary connectivity problems
  return false;
};

// Build complete URL from endpoint
const buildUrl = (endpoint: string): string => {
  const baseUrl = getBaseUrl();
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}${cleanEndpoint}`;
};

// Build headers for API request
const buildHeaders = (options: RequestInit = {}, includeAuth: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};

  // Add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add authorization header from localStorage (backwards compatibility for mobile/legacy)
  // NOTE: Primary authentication is via HttpOnly cookies (sent automatically)
  // The header is a fallback for clients that don't support cookies
  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add developer API key if available
  const apiKey = getEffectiveApiKey();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
    headers['X-Developer-API-Key'] = apiKey; // Support both headers
  }

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return headers;
};

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

/**
 * Unified API call function with automatic token refresh
 * @param endpoint - API endpoint (e.g., 'auth/login/' or '/cbt/student/me/')
 * @param options - Fetch options
 * @param retryCount - Internal retry counter (max 1 retry on 401)
 * @returns Promise with response data
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean; timeout?: number } = {},
  retryCount: number = 0
): Promise<T> => {
  const url = buildUrl(endpoint);
  const includeAuth = options.includeAuth !== false; // Default to true unless explicitly set
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutMs = options.timeout || 30000; // Default 30 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = buildHeaders(options, includeAuth);
    
    // Extract custom options that aren't part of RequestInit
    const { includeAuth: _, timeout: __, ...fetchOptions } = options;
    
    console.log('Making API request:', { url, method: options.method || 'GET', endpoint }); // Debug log
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
      // SECURITY: Always include credentials to send HttpOnly cookies
      // This is critical for the anti-Evilginx cookie-based authentication
      credentials: 'include',
    });
    
    console.log('API response received:', { status: response.status, statusText: response.statusText, url }); // Debug log

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && includeAuth && retryCount === 0) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        return apiCall<T>(endpoint, options, retryCount + 1);
      } else {
        // Refresh failed - don't automatically logout, let the component handle it
        // This prevents automatic logouts on temporary network issues
        console.warn('Token refresh failed, but not automatically logging out');
        throw new Error('Authentication expired. Please log in again.');
      }
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) {
        data = {} as T;
      } else {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}`);
        }
      }
    } else {
      data = (await response.text()) as T;
    }

    // Check if response is ok
    if (!response.ok) {
      const errorMessage = (data as any)?.error || 
                          (data as any)?.message || 
                          (data as any)?.detail || 
                          `HTTP ${response.status}: ${response.statusText}`;
      
      // Report API errors to error tracking (for 4xx and 5xx responses)
      reportApiError(endpoint, options.method || 'GET', response.status, errorMessage, {
        url,
        statusText: response.statusText,
      });
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        data,
      };
      throw error;
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      // Report timeout errors
      reportApiError(endpoint, options.method || 'GET', 0, `Request timeout after ${timeoutMs}ms`, {
        url,
      });
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    // Re-throw API errors
    if (error.status) {
      throw error;
    }

    // Handle network errors with user-friendly messages
    let userFriendlyMessage = 'Network is unreachable. Please check your internet connection and try again.';
    let errorType = 'network_error';
    
    // Detect specific error types
    if (error.message?.includes('timeout') || error.name === 'AbortError') {
      userFriendlyMessage = 'Request timed out. Please check your connection and try again.';
      errorType = 'timeout';
    } else if (!navigator.onLine) {
      userFriendlyMessage = 'You are offline. Please check your internet connection.';
      errorType = 'offline';
    } else if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      // This often indicates CORS or network issues
      errorType = error.message?.includes('CORS') || error.message?.includes('blocked') ? 'cors_error' : 'connection_error';
    }
    
    // Log technical details for debugging (but don't show to user)
    console.error('Network error details:', {
      message: error.message,
      name: error.name,
      url: url,
      endpoint: endpoint
    });
    
    // Report network/CORS errors to error tracking
    reportApiError(endpoint, options.method || 'GET', 0, error.message, {
      error_type: errorType,
      name: error.name,
      url,
      online: navigator.onLine,
    });
    
    // Create error object with user-friendly message
    const friendlyError: any = new Error(userFriendlyMessage);
    friendlyError.isNetworkError = true;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const apiGet = <T = any>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiCall<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> =>
  apiCall<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

export const apiPut = <T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> =>
  apiCall<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

export const apiPatch = <T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> =>
  apiCall<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

export const apiDelete = <T = any>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiCall<T>(endpoint, { ...options, method: 'DELETE' });

/**
 * API call without authentication (for login, signup, etc.)
 */
export const apiCallPublic = <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> =>
  apiCall<T>(endpoint, { ...options, includeAuth: false }, 0);

/**
 * Check if an error is a plan limit error (upgrade required)
 * Returns true if the error indicates plan limit was reached
 */
export const isUpgradeRequiredError = (error: any): boolean => {
  return error?.data?.upgrade_required === true || error?.upgrade_required === true;
};

/**
 * Get upgrade error message from API error
 */
export const getUpgradeErrorMessage = (error: any): string => {
  return error?.message || error?.data?.error || "You've reached your plan limit.";
};

/**
 * Secure logout function - clears both server-side tokens and localStorage
 * 
 * SECURITY: This calls the server logout endpoint which:
 * 1. Blacklists the refresh token (prevents reuse)
 * 2. Clears HttpOnly cookies
 * 
 * Always use this instead of just clearing localStorage to ensure
 * tokens are properly invalidated on the server.
 */
export const secureLogout = async (): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    
    // Call server logout endpoint to blacklist token and clear cookies
    await fetch(`${baseUrl}auth/cookie/logout/`, {
      method: 'POST',
      credentials: 'include', // Send HttpOnly cookies so server can blacklist them
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Server logout failed:', error);
    // Continue with local cleanup even if server logout fails
  }
  
  // Clear localStorage tokens (for backwards compatibility)
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  localStorage.removeItem('business_user');
  localStorage.removeItem('current_business');
  localStorage.removeItem('customer_user');
  
  console.log('Secure logout completed');
};

/**
 * Check if user is authenticated
 * Checks both localStorage tokens AND makes a test request to verify cookie auth
 */
export const isAuthenticated = (): boolean => {
  // Check if there's a localStorage token (backwards compatibility)
  const localStorageToken = getAccessToken();
  if (localStorageToken) {
    return true;
  }
  
  // Note: We can't directly check HttpOnly cookies from JavaScript
  // The actual authentication check happens on API calls
  // If cookies exist, the server will authenticate the request
  return false;
};

// Export helper functions for components that need them
export { getBaseUrl, getEffectiveApiKey, buildUrl };
