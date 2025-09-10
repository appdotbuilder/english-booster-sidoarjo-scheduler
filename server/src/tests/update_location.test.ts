import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update location name', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Updated Room Name'
    };

    const result = await updateLocation(testInput);

    // Verify the response
    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Updated Room Name');
    expect(result.branch).toEqual('Sidoarjo'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update location branch', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id,
      branch: 'Surabaya'
    };

    const result = await updateLocation(testInput);

    // Verify the response
    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Test Room'); // Should remain unchanged
    expect(result.branch).toEqual('Surabaya');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and branch', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Completely New Room',
      branch: 'Malang'
    };

    const result = await updateLocation(testInput);

    // Verify the response
    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Completely New Room');
    expect(result.branch).toEqual('Malang');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes in database', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Database Test Room',
      branch: 'Jakarta'
    };

    await updateLocation(testInput);

    // Query database directly to verify changes
    const updatedLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(updatedLocation).toHaveLength(1);
    expect(updatedLocation[0].name).toEqual('Database Test Room');
    expect(updatedLocation[0].branch).toEqual('Jakarta');
    expect(updatedLocation[0].created_at).toBeInstanceOf(Date);
  });

  it('should return unchanged location when no fields provided', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Unchanged Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id
      // No name or branch provided
    };

    const result = await updateLocation(testInput);

    // Should return the original location unchanged
    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Unchanged Room');
    expect(result.branch).toEqual('Sidoarjo');
    expect(result.created_at).toEqual(createdLocation.created_at);
  });

  it('should throw error for non-existent location', async () => {
    const testInput: UpdateLocationInput = {
      id: 99999, // Non-existent ID
      name: 'This Should Fail'
    };

    expect(updateLocation(testInput)).rejects.toThrow(/location with id 99999 not found/i);
  });

  it('should handle updating with empty string values', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const testInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: '', // Empty string should be allowed
      branch: 'Updated Branch'
    };

    const result = await updateLocation(testInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('');
    expect(result.branch).toEqual('Updated Branch');
  });
});