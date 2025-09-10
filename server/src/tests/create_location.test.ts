import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateLocationInput = {
  name: 'Room A1',
  branch: 'Jakarta'
};

const testInputWithDefault: CreateLocationInput = {
  name: 'Room B2',
  branch: 'Sidoarjo' // Test with explicit default value
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location with provided branch', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.name).toEqual('Room A1');
    expect(result.branch).toEqual('Jakarta');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a location with default branch value', async () => {
    const result = await createLocation(testInputWithDefault);

    // Verify default branch value
    expect(result.name).toEqual('Room B2');
    expect(result.branch).toEqual('Sidoarjo');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save location to database', async () => {
    const result = await createLocation(testInput);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Room A1');
    expect(locations[0].branch).toEqual('Jakarta');
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple unique locations', async () => {
    const location1 = await createLocation({
      name: 'Room 101',
      branch: 'Surabaya'
    });

    const location2 = await createLocation({
      name: 'Room 102',
      branch: 'Malang'
    });

    // Verify different IDs
    expect(location1.id).not.toEqual(location2.id);
    expect(location1.name).toEqual('Room 101');
    expect(location1.branch).toEqual('Surabaya');
    expect(location2.name).toEqual('Room 102');
    expect(location2.branch).toEqual('Malang');

    // Verify both are in database
    const allLocations = await db.select()
      .from(locationsTable)
      .execute();

    expect(allLocations).toHaveLength(2);
  });

  it('should handle special characters in location name', async () => {
    const specialInput: CreateLocationInput = {
      name: 'Room A1 - Computer Lab (2nd Floor)',
      branch: 'Sidoarjo Main'
    };

    const result = await createLocation(specialInput);

    expect(result.name).toEqual('Room A1 - Computer Lab (2nd Floor)');
    expect(result.branch).toEqual('Sidoarjo Main');

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations[0].name).toEqual('Room A1 - Computer Lab (2nd Floor)');
    expect(locations[0].branch).toEqual('Sidoarjo Main');
  });
});