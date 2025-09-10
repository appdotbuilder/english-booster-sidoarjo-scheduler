import { db } from '../db';
import { teachersTable, classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTeacher = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if teacher exists
    const existingTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, id))
      .execute();

    if (existingTeacher.length === 0) {
      throw new Error(`Teacher with id ${id} not found`);
    }

    // Check if teacher has any active classes
    const teacherClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.teacher_id, id))
      .execute();

    if (teacherClasses.length > 0) {
      throw new Error(`Cannot delete teacher with id ${id}. Teacher has ${teacherClasses.length} active classes`);
    }

    // Delete the teacher
    const result = await db.delete(teachersTable)
      .where(eq(teachersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Teacher deletion failed:', error);
    throw error;
  }
};