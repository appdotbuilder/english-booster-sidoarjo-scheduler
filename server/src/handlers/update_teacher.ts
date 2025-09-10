import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type UpdateTeacherInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTeacher = async (input: UpdateTeacherInput): Promise<Teacher> => {
  try {
    // Build the update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.full_name !== undefined) {
      updateData['full_name'] = input.full_name;
    }
    
    if (input.subjects !== undefined) {
      updateData['subjects'] = input.subjects;
    }

    // If no fields to update, just return the existing record
    if (Object.keys(updateData).length === 0) {
      const existingTeacher = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, input.id))
        .execute();

      if (existingTeacher.length === 0) {
        throw new Error(`Teacher with id ${input.id} not found`);
      }

      return existingTeacher[0];
    }

    // Update the teacher record
    const result = await db.update(teachersTable)
      .set(updateData)
      .where(eq(teachersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Teacher with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Teacher update failed:', error);
    throw error;
  }
};