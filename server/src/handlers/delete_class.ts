import { db } from '../db';
import { classesTable, studentClassEnrollmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteClass(id: number): Promise<{ success: boolean }> {
  try {
    // First, delete all student enrollments for this class
    await db.delete(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.class_id, id))
      .execute();

    // Then delete the class itself
    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, id))
      .returning()
      .execute();

    // Check if a class was actually deleted
    if (result.length === 0) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
}