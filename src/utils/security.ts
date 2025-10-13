// Security utilities and validation functions
export class SecurityValidator {
  // Input sanitization
  static sanitizeString(input: string, maxLength: number = 255): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>\"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      });
  }

  // Email validation with additional security checks
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    const sanitized = this.sanitizeString(email, 255);
    
    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Additional security checks
    if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }

  // Name validation
  static validateName(name: string, fieldName: string): { isValid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: `${fieldName} is required` };
    }

    const sanitized = this.sanitizeString(name, 100);
    
    if (sanitized.length < 1) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (sanitized.length > 100) {
      return { isValid: false, error: `${fieldName} must be less than 100 characters` };
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(sanitized)) {
      return { isValid: false, error: `${fieldName} contains invalid characters` };
    }

    return { isValid: true };
  }

  // Cart validation
  static validateCartItem(item: any): { isValid: boolean; error?: string } {
    if (!item || typeof item !== 'object') {
      return { isValid: false, error: 'Invalid cart item' };
    }

    if (!item.item || !item.item.id || !item.item.title || !item.item.price) {
      return { isValid: false, error: 'Missing required item data' };
    }

    if (typeof item.item.price !== 'number' || item.item.price <= 0 || item.item.price > 10000) {
      return { isValid: false, error: 'Invalid item price' };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return { isValid: false, error: 'Invalid quantity' };
    }

    return { isValid: true };
  }
}

// Rate limiting utility
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static checkLimit(
    identifier: string, 
    maxRequests: number = 10, 
    windowMs: number = 60000
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const key = identifier;
    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, resetTime: current.resetTime };
    }

    current.count++;
    return { allowed: true };
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Security headers utility
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

// CSRF token generation and validation
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  static generateToken(sessionId: string): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    if (!stored || Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.tokens.entries()) {
      if (now > value.expires) {
        this.tokens.delete(key);
      }
    }
  }
}