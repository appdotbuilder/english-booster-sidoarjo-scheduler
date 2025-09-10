import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type Location } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLocation = async (input: UpdateLocationInput): Promise<Location> => {
  try {
    // Check if location exists first
    const existingLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    if (existingLocation.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.branch !== undefined) {
      updateData.branch = input.branch;
    }

    // If no fields to update, return existing location
    if (Object.keys(updateData).length === 0) {
      return existingLocation[0];
    }

    // Update the location
    const result = await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
};