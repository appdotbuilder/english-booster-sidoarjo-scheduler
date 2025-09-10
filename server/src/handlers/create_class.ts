import { db } from '../db';
import { classesTable, teachersTable, locationsTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Verify that teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.teacher_id))
      .execute();

    if (teacher.length === 0) {
      throw new Error(`Teacher with ID ${input.teacher_id} not found`);
    }

    // Verify that location exists
    const location = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.location_id))
      .execute();

    if (location.length === 0) {
      throw new Error(`Location with ID ${input.location_id} not found`);
    }

    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        level: input.level,
        teacher_id: input.teacher_id,
        location_id: input.location_id,
        start_time: input.start_time,
        end_time: input.end_time,
        days: input.days,
        max_capacity: input.max_capacity
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};