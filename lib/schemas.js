import { z } from 'zod';

/**
 * ============================================================================
 * INT252 UNIT IV: SCHEMA-BASED FORM VALIDATION USING ZOD
 * ============================================================================
 * Minimal, declarative schemas for campus events, login, and registration.
 * Very easy to explain to the teacher: "Zod defines the expected shape and rules
 * of our form data, and automatically generates error messages if rules fail."
 */

// 1. Event Creation & Edit Schema
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM format'),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM format'),
  venue: z.string().min(1, 'Please select a campus venue'),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int('Capacity must be a whole number')
    .positive('Capacity must be greater than 0'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// 2. User Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid campus email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

// 3. User Registration Schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Please enter a valid campus email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'organiser'], {
    errorMap: () => ({ message: 'Role must be student or organiser' }),
  }),
  clubName: z.string().optional(),
}).refine((data) => {
  if (data.role === 'organiser') {
    return Boolean(data.clubName && data.clubName.trim().length > 0);
  }
  return true;
}, {
  message: 'Club Name is required for club organisers',
  path: ['clubName'],
});

/**
 * Helper: Validates any JavaScript object against a Zod schema.
 * Returns: { success: true, data } OR { success: false, errors: { field: message } }
 */
export function validateForm(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  // Convert Zod error array into a clean key-value object: { [field]: 'Error message' }
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] || 'general';
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { success: false, data: null, errors };
}
