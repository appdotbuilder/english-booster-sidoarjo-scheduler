import { serial, text, pgTable, timestamp, integer, time, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions
export const dayOfWeekEnum = pgEnum('day_of_week', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
export const levelEnum = pgEnum('level', ['Beginner', 'Intermediate', 'Advanced']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);

// Location/Room table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  branch: text('branch').notNull().default('Sidoarjo'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Teacher table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  subjects: text('subjects').array().notNull(), // Array of subjects they can teach
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Student table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  phone_number: text('phone_number').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Class table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  level: levelEnum('level').notNull(),
  teacher_id: integer('teacher_id').references(() => teachersTable.id).notNull(),
  location_id: integer('location_id').references(() => locationsTable.id).notNull(),
  start_time: time('start_time').notNull(), // TIME type for start time
  end_time: time('end_time').notNull(),     // TIME type for end time
  days: dayOfWeekEnum('days').array().notNull(), // Array of days
  max_capacity: integer('max_capacity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Many-to-many relationship table for student-class enrollments
export const studentClassEnrollmentsTable = pgTable('student_class_enrollments', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').references(() => studentsTable.id).notNull(),
  class_id: integer('class_id').references(() => classesTable.id).notNull(),
  enrolled_at: timestamp('enrolled_at').defaultNow().notNull(),
});

// Relations
export const locationsRelations = relations(locationsTable, ({ many }) => ({
  classes: many(classesTable),
}));

export const teachersRelations = relations(teachersTable, ({ many }) => ({
  classes: many(classesTable),
}));

export const studentsRelations = relations(studentsTable, ({ many }) => ({
  enrollments: many(studentClassEnrollmentsTable),
}));

export const classesRelations = relations(classesTable, ({ one, many }) => ({
  teacher: one(teachersTable, {
    fields: [classesTable.teacher_id],
    references: [teachersTable.id],
  }),
  location: one(locationsTable, {
    fields: [classesTable.location_id],
    references: [locationsTable.id],
  }),
  enrollments: many(studentClassEnrollmentsTable),
}));

export const studentClassEnrollmentsRelations = relations(studentClassEnrollmentsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [studentClassEnrollmentsTable.student_id],
    references: [studentsTable.id],
  }),
  class: one(classesTable, {
    fields: [studentClassEnrollmentsTable.class_id],
    references: [classesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type StudentClassEnrollment = typeof studentClassEnrollmentsTable.$inferSelect;
export type NewStudentClassEnrollment = typeof studentClassEnrollmentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  locations: locationsTable,
  teachers: teachersTable,
  students: studentsTable,
  classes: classesTable,
  studentClassEnrollments: studentClassEnrollmentsTable,
};