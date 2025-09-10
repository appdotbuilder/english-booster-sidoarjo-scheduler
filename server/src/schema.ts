import { z } from 'zod';

// Enum definitions
export const dayOfWeekSchema = z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

export const levelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type Level = z.infer<typeof levelSchema>;

export const userRoleSchema = z.enum(['admin', 'teacher', 'student']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Location/Room schema
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  branch: z.string(),
  created_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

export const createLocationInputSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  branch: z.string().default('Sidoarjo')
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  branch: z.string().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  subjects: z.array(z.string()),
  created_at: z.coerce.date()
});

export type Teacher = z.infer<typeof teacherSchema>;

export const createTeacherInputSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required')
});

export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

export const updateTeacherInputSchema = z.object({
  id: z.number(),
  full_name: z.string().min(1).optional(),
  subjects: z.array(z.string()).min(1).optional()
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherInputSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  phone_number: z.string(),
  email: z.string(),
  created_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

export const createStudentInputSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required')
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const updateStudentInputSchema = z.object({
  id: z.number(),
  full_name: z.string().min(1).optional(),
  phone_number: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: levelSchema,
  teacher_id: z.number(),
  location_id: z.number(),
  start_time: z.string(), // Stored as TIME in DB, handled as string
  end_time: z.string(),   // Stored as TIME in DB, handled as string
  days: z.array(dayOfWeekSchema),
  max_capacity: z.number().int(),
  created_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

export const createClassInputSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  level: levelSchema,
  teacher_id: z.number().positive('Teacher ID is required'),
  location_id: z.number().positive('Location ID is required'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  days: z.array(dayOfWeekSchema).min(1, 'At least one day is required'),
  max_capacity: z.number().int().positive('Max capacity must be positive')
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  level: levelSchema.optional(),
  teacher_id: z.number().positive().optional(),
  location_id: z.number().positive().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  days: z.array(dayOfWeekSchema).min(1).optional(),
  max_capacity: z.number().int().positive().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Student-Class enrollment schema
export const studentClassEnrollmentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  enrolled_at: z.coerce.date()
});

export type StudentClassEnrollment = z.infer<typeof studentClassEnrollmentSchema>;

export const enrollStudentInputSchema = z.object({
  student_id: z.number().positive('Student ID is required'),
  class_id: z.number().positive('Class ID is required')
});

export type EnrollStudentInput = z.infer<typeof enrollStudentInputSchema>;

export const unenrollStudentInputSchema = z.object({
  student_id: z.number().positive('Student ID is required'),
  class_id: z.number().positive('Class ID is required')
});

export type UnenrollStudentInput = z.infer<typeof unenrollStudentInputSchema>;

// Extended schemas with relations for display purposes
export const classWithDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: levelSchema,
  teacher_id: z.number(),
  location_id: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  days: z.array(dayOfWeekSchema),
  max_capacity: z.number().int(),
  created_at: z.coerce.date(),
  teacher: teacherSchema.optional(),
  location: locationSchema.optional(),
  enrolled_students: z.array(studentSchema).optional(),
  enrolled_count: z.number().int().optional()
});

export type ClassWithDetails = z.infer<typeof classWithDetailsSchema>;

export const studentWithClassesSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  phone_number: z.string(),
  email: z.string(),
  created_at: z.coerce.date(),
  enrolled_classes: z.array(classWithDetailsSchema).optional()
});

export type StudentWithClasses = z.infer<typeof studentWithClassesSchema>;

// Query schemas
export const getClassesByTeacherInputSchema = z.object({
  teacher_id: z.number().positive('Teacher ID is required')
});

export type GetClassesByTeacherInput = z.infer<typeof getClassesByTeacherInputSchema>;

export const getClassesByStudentInputSchema = z.object({
  student_id: z.number().positive('Student ID is required')
});

export type GetClassesByStudentInput = z.infer<typeof getClassesByStudentInputSchema>;

export const getAvailableClassesInputSchema = z.object({
  level: levelSchema.optional(),
  day: dayOfWeekSchema.optional()
});

export type GetAvailableClassesInput = z.infer<typeof getAvailableClassesInputSchema>;