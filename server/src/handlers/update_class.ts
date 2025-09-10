import { db } from '../db';
import { classesTable, teachersTable, locationsTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // Verify the class exists
    const existingClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.id))
      .execute();

    if (existingClass.length === 0) {
      throw new Error(`Class with ID ${input.id} not found`);
    }

    // Verify teacher exists if teacher_id is being updated
    if (input.teacher_id !== undefined) {
      const teacher = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, input.teacher_id))
        .execute();

      if (teacher.length === 0) {
        throw new Error(`Teacher with ID ${input.teacher_id} not found`);
      }
    }

    // Verify location exists if location_id is being updated
    if (input.location_id !== undefined) {
      const location = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.location_id))
        .execute();

      if (location.length === 0) {
        throw new Error(`Location with ID ${input.location_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.teacher_id !== undefined) updateData.teacher_id = input.teacher_id;
    if (input.location_id !== undefined) updateData.location_id = input.location_id;
    if (input.start_time !== undefined) updateData.start_time = input.start_time;
    if (input.end_time !== undefined) updateData.end_time = input.end_time;
    if (input.days !== undefined) updateData.days = input.days;
    if (input.max_capacity !== undefined) updateData.max_capacity = input.max_capacity;

    // If no fields to update, just return the existing class
    if (Object.keys(updateData).length === 0) {
      return existingClass[0];
    }

    // Update the class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};