/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  // Remove dangerous tags
  const dangerousTags = ["iframe", "object", "embed", "link", "style", "meta"];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    sanitized = sanitized.replace(regex, "");
    sanitized = sanitized.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "");
  });
  
  return sanitized;
}

/**
 * Sanitize text content to prevent injection attacks
 * Encodes special characters
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize user-generated content for posts
 */
export function sanitizePostContent(content: string): string {
  if (!content) return "";
  
  // Remove excessive whitespace
  let sanitized = content.trim();
  sanitized = sanitized.replace(/\s+/g, " ");
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  
  return sanitized;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}
