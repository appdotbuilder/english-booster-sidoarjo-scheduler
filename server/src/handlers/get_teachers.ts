import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type Teacher } from '../schema';

export async function getTeachers(): Promise<Teacher[]> {
  try {
    const results = await db.select()
      .from(teachersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    throw error;
  }
}