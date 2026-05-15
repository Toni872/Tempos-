import DOMPurify from 'dompurify';

/**
 * Script 9 Advanced Security Module
 * 
 * Provides an enterprise-grade layer of protection for the frontend:
 * - XSS Sanitization
 * - CSRF Tokens simulation/handling
 * - Payload validation
 */

/**
 * Sanitizes an input string to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous HTML tags and attributes.
 * 
 * @param {string} dirtyInput The untrusted input
 * @returns {string} Sanitized input safe for rendering
 */
export function sanitizeInput(dirtyInput) {
  if (typeof dirtyInput !== 'string') return dirtyInput;
  return DOMPurify.sanitize(dirtyInput, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

/**
 * Generates an opaque, unpredictable CSRF token.
 * In a real backend, this would be generated server-side and matched.
 * We'll use this to tag requests from the frontend to show the pattern.
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates common input types to prevent basic injection patterns
 * before they even hit the API or DOM.
 */
export const Validator = {
  isEmailValid: (email) => {
    // Regex from OWASP validation guidelines
    const emailRegex = /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },
  
  isSafeText: (text) => {
    // Blocks common SQL/NoSQL injection characters in plain text fields
    const dangerousPatterns = /['";\\]|\$eq|\$ne|\$gt|\$lt/i;
    return !dangerousPatterns.test(text);
  }
};

/**
 * Provides a basic local rate limiter to prevent UI spamming
 * that could lead to DoS or unnecessary backend load.
 */
class LocalRateLimiter {
  constructor(limit, timeWindowMs) {
    this.limit = limit;
    this.timeWindowMs = timeWindowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindowMs);
    
    if (this.requests.length >= this.limit) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

export const apiRateLimiter = new LocalRateLimiter(200, 60000); // 200 req per minute (ajustado para dev)
export const authRateLimiter = new LocalRateLimiter(5, 300000); // 5 req per 5 minutes

