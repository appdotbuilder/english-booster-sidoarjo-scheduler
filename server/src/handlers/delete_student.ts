import { db } from '../db';
import { studentsTable, studentClassEnrollmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteStudent = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, check if the student exists
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    if (existingStudent.length === 0) {
      throw new Error(`Student with ID ${id} not found`);
    }

    // Delete related enrollments first (foreign key constraint)
    await db.delete(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.student_id, id))
      .execute();

    // Delete the student
    await db.delete(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
};