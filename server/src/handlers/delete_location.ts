import { db } from '../db';
import { locationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteLocation = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the location record
    const result = await db.delete(locationsTable)
      .where(eq(locationsTable.id, id))
      .execute();

    // Check if any rows were affected (location existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
};