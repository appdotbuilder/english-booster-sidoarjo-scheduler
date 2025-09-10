import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput, type Location } from '../schema';

export const createLocation = async (input: CreateLocationInput): Promise<Location> => {
  try {
    // Insert location record
    const result = await db.insert(locationsTable)
      .values({
        name: input.name,
        branch: input.branch // Zod schema already applies default value
      })
      .returning()
      .execute();

    const location = result[0];
    return location;
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
};