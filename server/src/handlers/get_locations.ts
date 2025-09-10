import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location } from '../schema';

export const getLocations = async (): Promise<Location[]> => {
  try {
    const result = await db.select()
      .from(locationsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw error;
  }
};