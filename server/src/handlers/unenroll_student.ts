import { db } from '../db';
import { studentClassEnrollmentsTable, studentsTable, classesTable } from '../db/schema';
import { type UnenrollStudentInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export const unenrollStudent = async (input: UnenrollStudentInput): Promise<{ success: boolean }> => {
  try {
    // First verify that the student exists
    const studentExists = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (studentExists.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    // Verify that the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found`);
    }

    // Check if enrollment exists
    const existingEnrollment = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, input.student_id),
        eq(studentClassEnrollmentsTable.class_id, input.class_id)
      ))
      .execute();

    if (existingEnrollment.length === 0) {
      throw new Error(`Student with ID ${input.student_id} is not enrolled in class with ID ${input.class_id}`);
    }

    // Delete the enrollment record
    const result = await db.delete(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, input.student_id),
        eq(studentClassEnrollmentsTable.class_id, input.class_id)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Student unenrollment failed:', error);
    throw error;
  }
};