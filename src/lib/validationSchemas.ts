import { z } from "zod";

// Profile validation
export const profileSchema = z.object({
  display_name: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "Display name can only contain letters, numbers, spaces, hyphens, and underscores"),
  bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  city: z.string()
    .max(100, "City must be less than 100 characters")
    .optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
    .optional(),
});

// Post creation validation
export const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(5000, "Content must be less than 5000 characters"),
  media_type: z.enum(['image', 'video']).optional(),
  status: z.enum(['draft', 'scheduled', 'published']).default('published'),
  scheduled_publish_at: z.string().datetime().optional(),
});

// Creator subscription price validation
export const subscriptionPriceSchema = z.object({
  subscription_price: z.number()
    .min(2.99, "Minimum subscription price is $2.99")
    .max(999.99, "Maximum subscription price is $999.99"),
});

// ID Verification validation
export const idVerificationSchema = z.object({
  full_name: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s-']+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  document_type: z.enum(['passport', 'drivers_license', 'national_id']),
  document_number: z.string()
    .min(5, "Document number must be at least 5 characters")
    .max(50, "Document number must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "Document number can only contain uppercase letters, numbers, and hyphens"),
  issuing_country: z.string()
    .length(2, "Country code must be 2 characters")
    .regex(/^[A-Z]{2}$/, "Invalid country code"),
});

// Message validation
export const messageSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters"),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.custom<File>()
    .refine((file) => file instanceof File, "File is required")
    .refine((file) => file.size <= 10 * 1024 * 1024, "File must be less than 10MB"),
  type: z.enum(['profile_photo', 'creator_content', 'id_document']),
});

// Image file validation
export const imageFileSchema = z.custom<File>()
  .refine((file) => file instanceof File, "File is required")
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    "Only JPEG, PNG, and WebP images are allowed"
  );

// Document file validation
export const documentFileSchema = z.custom<File>()
  .refine((file) => file instanceof File, "File is required")
  .refine((file) => file.size <= 10 * 1024 * 1024, "Document must be less than 10MB")
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type),
    "Only JPEG, PNG, and PDF files are allowed"
  );

// Sanitize HTML content
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Validate and sanitize post content
export function sanitizePostContent(content: string): string {
  // Remove any HTML tags
  const withoutHtml = content.replace(/<[^>]*>/g, '');
  // Limit length
  const truncated = withoutHtml.slice(0, 5000);
  return truncated.trim();
}
