/**
 * Unified API utility for WAEC CBT backend calls
 * Handles authentication, token refresh, error handling, and developer API keys
 */

import { getEffectiveApiKey as getCbtEffectiveApiKey } from './cbtKey';
import { Capacitor } from '@capacitor/core';
import { reportApiError } from '../services/errorReporting';

// Check if running in Electron
const isElectron = (): boolean => {
  // Check if window.electron exists (exposed by preload script)
  return typeof window !== 'undefined' && 
         (window as any).electron?.isElectron === true;
};

// Check if running in Capacitor (native mobile app)
const isCapacitor = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get base API URL from environment
const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If running in Capacitor (mobile app), always use production backend
  if (isCapacitor()) {
    if (envUrl && envUrl.trim()) {
      let url = envUrl.trim().replace(/\/+$/, '');
      if (!url.includes('/api')) {
        url = url + '/api';
      }
      return url + '/';
    }
    // Default production API for mobile app
    return 'https://business.api.henotaceai.ng/api/';
  }
  
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

// Get the frontend app base URL (for store links, callbacks, etc.)
// This returns the correct production URL regardless of where the app is running
export const getAppBaseUrl = (): string => {
  // If running in Capacitor (mobile app) or Electron, always use production frontend
  if (isCapacitor() || isElectron()) {
    return 'https://business.henotaceai.ng';
  }
  
  // Web app: check if production
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  if (isProduction) {
    return 'https://business.henotaceai.ng';
  }
  
  // Development: use current origin (localhost)
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
};

// Get effective API key (institution > user > empty)
const getEffectiveApiKey = (): string => {
  return getCbtEffectiveApiKey();
};

// Get access token
const getAccessToken = (): string | null => {
  // Check for standard user token first, then security token
  return localStorage.getItem('accessToken') || localStorage.getItem('securityToken');
};

// Get refresh token
const getRefreshToken = (): string | null => {
  // Check for standard refresh token first, then security refresh token
  return localStorage.getItem('refreshToken') || localStorage.getItem('securityRefreshToken');
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access) {
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }
        return true;
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  // Clear tokens on refresh failure
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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

  // Add authorization token
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
    
    // Determine if this is a cross-origin request
    const isCrossOrigin = new URL(url).origin !== window.location.origin;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
      credentials: isCrossOrigin ? 'include' : 'same-origin', // Include credentials for cross-origin requests
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
        // Refresh failed, clear auth and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        window.location.href = '/';
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
      reportApiError(endpoint, response.status, {
        error_type: response.status >= 500 ? 'server_error' : 'api_error',
        message: errorMessage,
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
      reportApiError(endpoint, 0, {
        error_type: 'timeout',
        message: `Request timeout after ${timeoutMs}ms`,
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
    reportApiError(endpoint, 0, {
      error_type: errorType,
      message: error.message,
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

// Export helper functions for components that need them
export { getBaseUrl, getEffectiveApiKey, buildUrl };

/**
 * Secure logout - calls server logout endpoint and clears local storage
 */
export const secureLogout = async (): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    await fetch(`${baseUrl}auth/cookie/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Server logout failed:', error);
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  localStorage.removeItem('business_user');
  localStorage.removeItem('current_business');
  localStorage.removeItem('customer_user');
};

