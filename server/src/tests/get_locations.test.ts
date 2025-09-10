import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { getLocations } from '../handlers/get_locations';

// Sample test data
const testLocation1: CreateLocationInput = {
  name: 'Main Classroom',
  branch: 'Sidoarjo'
};

const testLocation2: CreateLocationInput = {
  name: 'Computer Lab',
  branch: 'Jakarta'
};

const testLocation3: CreateLocationInput = {
  name: 'Music Room',
  branch: 'Surabaya'
};

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no locations exist', async () => {
    const result = await getLocations();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return a single location', async () => {
    // Create one test location
    await db.insert(locationsTable)
      .values({
        name: testLocation1.name,
        branch: testLocation1.branch
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Main Classroom');
    expect(result[0].branch).toEqual('Sidoarjo');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple locations in correct order', async () => {
    // Create multiple test locations
    const locations = [testLocation1, testLocation2, testLocation3];
    
    for (const location of locations) {
      await db.insert(locationsTable)
        .values({
          name: location.name,
          branch: location.branch
        })
        .execute();
    }

    const result = await getLocations();

    expect(result).toHaveLength(3);

    // Verify each location has the correct structure
    result.forEach(location => {
      expect(location.id).toBeDefined();
      expect(location.name).toBeDefined();
      expect(location.branch).toBeDefined();
      expect(location.created_at).toBeInstanceOf(Date);
      expect(typeof location.id).toBe('number');
      expect(typeof location.name).toBe('string');
      expect(typeof location.branch).toBe('string');
    });

    // Verify specific data
    const names = result.map(loc => loc.name);
    const branches = result.map(loc => loc.branch);
    
    expect(names).toContain('Main Classroom');
    expect(names).toContain('Computer Lab');
    expect(names).toContain('Music Room');
    
    expect(branches).toContain('Sidoarjo');
    expect(branches).toContain('Jakarta');
    expect(branches).toContain('Surabaya');
  });

  it('should return locations with default branch', async () => {
    // Create location without specifying branch (should default to 'Sidoarjo')
    await db.insert(locationsTable)
      .values({
        name: 'Default Branch Room',
        branch: 'Sidoarjo' // Explicitly using default
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Default Branch Room');
    expect(result[0].branch).toEqual('Sidoarjo');
  });

  it('should maintain consistent ordering across multiple calls', async () => {
    // Create test locations
    await db.insert(locationsTable)
      .values([
        { name: 'Room A', branch: 'Branch A' },
        { name: 'Room B', branch: 'Branch B' },
        { name: 'Room C', branch: 'Branch C' }
      ])
      .execute();

    const result1 = await getLocations();
    const result2 = await getLocations();

    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);

    // Results should be identical across calls
    expect(result1.map(r => r.id)).toEqual(result2.map(r => r.id));
    expect(result1.map(r => r.name)).toEqual(result2.map(r => r.name));
    expect(result1.map(r => r.branch)).toEqual(result2.map(r => r.branch));
  });

  it('should handle locations with special characters in names', async () => {
    await db.insert(locationsTable)
      .values({
        name: "Teacher's Lounge & Meeting Room",
        branch: 'Main Campus'
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual("Teacher's Lounge & Meeting Room");
    expect(result[0].branch).toEqual('Main Campus');
  });
});