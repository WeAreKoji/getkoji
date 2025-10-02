import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" })
  .max(255, { message: "Email must be less than 255 characters" })
  .toLowerCase();

/**
 * Password validation schema for signup
 */
export const passwordSignupSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password must be less than 72 characters" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

/**
 * Password validation schema for login (less strict)
 */
export const passwordLoginSchema = z
  .string()
  .min(1, { message: "Password is required" })
  .max(72, { message: "Password is too long" });

/**
 * Complete auth validation schema for signup
 */
export const authSignupSchema = z.object({
  email: emailSchema,
  password: passwordSignupSchema,
});

/**
 * Complete auth validation schema for login
 */
export const authLoginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

/**
 * Validates email input
 */
export function validateEmail(email: string): { success: boolean; error?: string; data?: string } {
  try {
    const validated = emailSchema.parse(email);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Invalid email" };
  }
}

/**
 * Validates password input for signup
 */
export function validatePasswordSignup(password: string): { success: boolean; error?: string } {
  try {
    passwordSignupSchema.parse(password);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Invalid password" };
  }
}

/**
 * Validates complete auth form for signup
 */
export function validateAuthSignup(email: string, password: string): { 
  success: boolean; 
  errors?: { email?: string; password?: string };
  data?: { email: string; password: string };
} {
  try {
    const validated = authSignupSchema.parse({ email, password });
    return { success: true, data: validated as { email: string; password: string } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { email?: string; password?: string } = {};
      error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { email: "Validation failed" } };
  }
}

/**
 * Validates complete auth form for login
 */
export function validateAuthLogin(email: string, password: string): { 
  success: boolean; 
  errors?: { email?: string; password?: string };
  data?: { email: string; password: string };
} {
  try {
    const validated = authLoginSchema.parse({ email, password });
    return { success: true, data: validated as { email: string; password: string } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { email?: string; password?: string } = {};
      error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { email: "Validation failed" } };
  }
}
