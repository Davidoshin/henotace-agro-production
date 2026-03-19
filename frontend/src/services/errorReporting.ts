/**
 * Error Reporting Service
 * 
 * Automatically captures and reports errors to the backend
 * for proactive customer support and security monitoring.
 * Includes global error handlers for unhandled exceptions and promise rejections.
 */

import { getBaseUrl } from '../lib/api';

interface ErrorReport {
  error_type: string;
  error_message: string;
  error_code?: string;
  url?: string;
  page_path?: string;
  http_method?: string;
  api_endpoint?: string;
  response_status?: number;
  stack_trace?: string;
  request_payload?: Record<string, unknown>;
  business_id?: number;
  customer_email?: string;
  session_id?: string;
  dashboard_type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  additional_context?: Record<string, unknown>;
}

// Detect current dashboard type based on URL path
const detectDashboardType = (): string => {
  const path = window.location.pathname;
  
  if (path.includes('/henotacegadmin') || path.includes('/henotacengadmin')) return 'platform_admin';
  if (path.includes('/business/dashboard') || path.includes('/business/')) return 'business_owner';
  if (path.includes('/staff/')) return 'business_staff';
  if (path.includes('/customer/') || path.includes('/store/')) return 'customer';
  if (path.startsWith('/api')) return 'api';
  
  return 'public';
};

// Detect error type from error details
const detectErrorType = (error: Error | unknown, statusCode?: number): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (statusCode === 401 || statusCode === 403) return 'authentication_error';
  if (statusCode === 402 || errorMessage?.toLowerCase().includes('payment')) return 'payment_error';
  if (statusCode === 422 || errorMessage?.toLowerCase().includes('validation')) return 'validation_error';
  if (errorMessage?.includes('network') || errorMessage?.includes('fetch') || errorMessage?.includes('Failed to fetch')) return 'network_error';
  if (errorMessage?.toLowerCase().includes('cors')) return 'cors_error';
  if (statusCode && statusCode >= 500) return 'api_error';
  if (statusCode && statusCode >= 400) return 'api_error';
  
  return 'frontend_error';
};

// Determine severity based on error details
const determineSeverity = (statusCode?: number, errorType?: string): 'low' | 'medium' | 'high' | 'critical' => {
  if (statusCode === 500 || statusCode === 503) return 'critical';
  if (statusCode === 401 || statusCode === 403) return 'medium';
  if (errorType === 'network_error') return 'medium';
  if (errorType === 'cors_error') return 'high';
  if (errorType === 'payment_error') return 'high';
  
  return 'medium';
};

// Generate a simple session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('henotace_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('henotace_session_id', sessionId);
  }
  return sessionId;
};

// Get current user email if logged in
const getCurrentUserEmail = (): string | undefined => {
  try {
    // Try the actual key that's stored in localStorage
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
      return userEmail;
    }
    
    // Check business user
    const businessUser = localStorage.getItem('business_user');
    if (businessUser) {
      const user = JSON.parse(businessUser);
      return user.email;
    }
    // Check customer user
    const customerUser = localStorage.getItem('customer_user');
    if (customerUser) {
      const user = JSON.parse(customerUser);
      return user.email;
    }
  } catch (error) {
    console.error('Error getting user email:', error);
  }
  return undefined;
};

// Get current business ID if available
const getCurrentBusinessId = (): number | undefined => {
  try {
    // Try the actual keys that are stored in localStorage
    const businessId = localStorage.getItem('business_id');
    if (businessId) {
      return parseInt(businessId);
    }
    
    // Fallback to other possible keys
    const businessData = localStorage.getItem('current_business');
    if (businessData) {
      const business = JSON.parse(businessData);
      return business.id;
    }
    
    // Try business user data
    const businessUser = localStorage.getItem('business_user');
    if (businessUser) {
      const user = JSON.parse(businessUser);
      return user.business_id;
    }
  } catch (error) {
    console.error('Error getting business ID:', error);
  }
  return undefined;
};

// Sanitize sensitive data from request payloads
const sanitizePayload = (payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!payload) return undefined;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'credit_card', 'cvv', 'pin', 'authorization'];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(s => keyLower.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Report an error to the backend
export const reportError = async (error: Partial<ErrorReport>): Promise<void> => {
  try {
    const errorType = error.error_type || detectErrorType(null, error.response_status);
    
    const report: ErrorReport = {
      error_type: errorType,
      error_message: error.error_message || 'Unknown error',
      error_code: error.error_code,
      url: error.url || window.location.href,
      page_path: error.page_path || window.location.pathname,
      http_method: error.http_method,
      api_endpoint: error.api_endpoint,
      response_status: error.response_status,
      stack_trace: error.stack_trace,
      request_payload: sanitizePayload(error.request_payload),
      business_id: error.business_id || getCurrentBusinessId(),
      customer_email: error.customer_email || getCurrentUserEmail(),
      session_id: getSessionId(),
      dashboard_type: error.dashboard_type || detectDashboardType(),
      severity: error.severity || determineSeverity(error.response_status, errorType),
      additional_context: {
        ...error.additional_context,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };
    
    // Use fetch directly to avoid circular dependencies with api module
    const baseUrl = getBaseUrl().replace(/\/api\/?$/, '');
    await fetch(`${baseUrl}/api/customer-errors/log/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
  } catch (e) {
    // Silently fail - we don't want error reporting to cause more errors
    console.debug('Failed to report error:', e);
  }
};

// Report API errors
export const reportApiError = async (
  endpoint: string,
  method: string,
  status: number,
  errorMessage: string,
  requestPayload?: Record<string, unknown>
): Promise<void> => {
  let errorType = 'api_error';
  
  if (status === 401) {
    errorType = 'auth_expired';
  } else if (status === 403) {
    errorType = 'permission_denied';
  } else if (status === 0 || status === undefined) {
    errorType = 'network_error';
  } else if (status >= 500) {
    errorType = 'api_error';
  }
  
  await reportError({
    error_type: errorType,
    error_message: errorMessage,
    api_endpoint: endpoint,
    http_method: method,
    response_status: status,
    request_payload: requestPayload,
  });
};

// Report login failures
export const reportLoginFailure = async (
  email: string,
  errorMessage: string,
  isBlocked: boolean = false
): Promise<void> => {
  await reportError({
    error_type: isBlocked ? 'login_blocked' : 'login_failed',
    error_message: errorMessage,
    customer_email: email,
    api_endpoint: '/api/public/customer/login/',
  });
};

// Report payment failures
export const reportPaymentFailure = async (
  errorMessage: string,
  paymentDetails?: Record<string, unknown>
): Promise<void> => {
  await reportError({
    error_type: 'payment_failed',
    error_message: errorMessage,
    request_payload: paymentDetails,
  });
};

// Report page errors (JavaScript errors)
export const reportPageError = async (
  error: Error,
  componentStack?: string
): Promise<void> => {
  await reportError({
    error_type: 'page_error',
    error_message: error.message,
    stack_trace: error.stack || componentStack,
  });
};

// Report component errors from React Error Boundary
export const reportComponentError = (
  error: Error,
  componentStack: string,
  componentName?: string
): void => {
  reportError({
    error_type: 'frontend_error',
    error_message: error.message,
    stack_trace: error.stack,
    additional_context: {
      type: 'react_error_boundary',
      componentStack,
      componentName,
    },
  });
};

// Setup global error handlers
export const setupGlobalErrorHandlers = (): void => {
  // Catch unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    // Skip reporting for certain common non-critical errors
    if (event.message?.includes('ResizeObserver')) return;
    if (event.message?.includes('Script error')) return;
    
    reportError({
      error_type: 'frontend_error',
      error_message: event.message || 'Unknown error',
      stack_trace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      additional_context: {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Skip reporting for certain common non-critical errors
    if (error?.message?.includes('ResizeObserver')) return;
    if (error?.message?.includes('Script error')) return;
    
    reportError({
      error_type: 'frontend_error',
      error_message: error?.message || 'Unhandled promise rejection',
      stack_trace: error?.stack,
      additional_context: {
        type: 'unhandledrejection',
        promiseRejection: true,
      },
    });
  });
  
  console.log('Global error handlers initialized');
};

// Initialize error reporting
export const initErrorReporting = (): void => {
  setupGlobalErrorHandlers();
  console.debug('Error reporting initialized');
};

export default {
  reportError,
  reportApiError,
  reportLoginFailure,
  reportPaymentFailure,
  reportPageError,
  reportComponentError,
  setupGlobalErrorHandlers,
  initErrorReporting,
};
