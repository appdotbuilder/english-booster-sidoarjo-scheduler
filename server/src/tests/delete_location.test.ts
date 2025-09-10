import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

// Test data for creating locations
const testLocationInput: CreateLocationInput = {
  name: 'Test Room',
  branch: 'Sidoarjo'
};

const secondLocationInput: CreateLocationInput = {
  name: 'Another Room',
  branch: 'Surabaya'
};

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing location', async () => {
    // Create a test location first
    const createResult = await db.insert(locationsTable)
      .values({
        name: testLocationInput.name,
        branch: testLocationInput.branch
      })
      .returning()
      .execute();

    const locationId = createResult[0].id;

    // Delete the location
    const result = await deleteLocation(locationId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify location no longer exists in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent location', async () => {
    // Try to delete a location that doesn't exist
    const result = await deleteLocation(999);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should not affect other locations when deleting one', async () => {
    // Create two test locations
    const firstResult = await db.insert(locationsTable)
      .values({
        name: testLocationInput.name,
        branch: testLocationInput.branch
      })
      .returning()
      .execute();

    const secondResult = await db.insert(locationsTable)
      .values({
        name: secondLocationInput.name,
        branch: secondLocationInput.branch
      })
      .returning()
      .execute();

    const firstLocationId = firstResult[0].id;
    const secondLocationId = secondResult[0].id;

    // Delete only the first location
    const result = await deleteLocation(firstLocationId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify first location was deleted
    const deletedLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, firstLocationId))
      .execute();

    expect(deletedLocation).toHaveLength(0);

    // Verify second location still exists
    const remainingLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, secondLocationId))
      .execute();

    expect(remainingLocation).toHaveLength(1);
    expect(remainingLocation[0].name).toBe(secondLocationInput.name);
    expect(remainingLocation[0].branch).toBe(secondLocationInput.branch);
  });

  it('should handle deletion of location with default branch', async () => {
    // Create location without specifying branch (should use default)
    const createResult = await db.insert(locationsTable)
      .values({
        name: 'Default Branch Room'
        // branch will default to 'Sidoarjo' as per schema
      })
      .returning()
      .execute();

    const locationId = createResult[0].id;

    // Delete the location
    const result = await deleteLocation(locationId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify location no longer exists
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should handle multiple consecutive deletions correctly', async () => {
    // Create multiple locations
    const locations = [];
    for (let i = 0; i < 3; i++) {
      const result = await db.insert(locationsTable)
        .values({
          name: `Room ${i + 1}`,
          branch: 'Sidoarjo'
        })
        .returning()
        .execute();
      locations.push(result[0]);
    }

    // Delete all locations one by one
    for (const location of locations) {
      const deleteResult = await deleteLocation(location.id);
      expect(deleteResult.success).toBe(true);
    }

    // Verify all locations are deleted
    const remainingLocations = await db.select()
      .from(locationsTable)
      .execute();

    expect(remainingLocations).toHaveLength(0);
  });
});