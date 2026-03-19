import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate email address with TLD checking
 * @param email - Email address to validate
 * @returns Object with isValid boolean and error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: true }; // Empty is valid (optional field)
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email format validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(trimmedEmail)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Extract TLD
  const parts = trimmedEmail.split('.');
  if (parts.length < 2) {
    return { isValid: false, error: "Invalid email format" };
  }

  const tld = parts[parts.length - 1].toLowerCase();
  
  // Common valid TLDs
  const validTlds = new Set([
    // Common TLDs
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    // Country codes (common ones)
    'ng', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi',
    'ie', 'pl', 'cz', 'hu', 'ro', 'gr', 'pt', 'za', 'ke', 'gh', 'tz', 'ug', 'rw', 'et',
    // New gTLDs (common ones)
    'io', 'co', 'ai', 'app', 'dev', 'tech', 'online', 'site', 'website', 'store', 'shop', 'blog',
    'info', 'biz', 'name', 'pro', 'xyz', 'me', 'tv', 'cc', 'ws', 'mobi', 'asia', 'jobs', 'tel'
  ]);

  // Check if TLD is valid
  if (tld.length < 2) {
    return { isValid: false, error: "Invalid email domain. Please check your email address." };
  }

  // Allow common TLDs and 2-3 letter country codes
  if (!validTlds.has(tld) && !(tld.length >= 2 && tld.length <= 3 && /^[a-z]+$/.test(tld))) {
    return { isValid: false, error: `Invalid email domain '${tld}'. Please check your email address (e.g., .com, .org, .ng).` };
  }

  // Check length
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: "Email too long" };
  }

  return { isValid: true };
}
