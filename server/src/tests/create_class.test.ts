import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, teachersTable, locationsTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateClassInput = {
  name: 'Test Class',
  level: 'Beginner',
  teacher_id: 1,
  location_id: 1,
  start_time: '09:00',
  end_time: '10:30',
  days: ['Senin', 'Rabu'],
  max_capacity: 20
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class with valid data', async () => {
    // Create prerequisite teacher
    await db.insert(teachersTable)
      .values({
        full_name: 'Test Teacher',
        subjects: ['Math', 'Science']
      })
      .execute();

    // Create prerequisite location
    await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Sidoarjo'
      })
      .execute();

    const result = await createClass(testInput);

    // Verify basic fields
    expect(result.name).toEqual('Test Class');
    expect(result.level).toEqual('Beginner');
    expect(result.teacher_id).toEqual(1);
    expect(result.location_id).toEqual(1);
    expect(result.start_time).toEqual('09:00:00');
    expect(result.end_time).toEqual('10:30:00');
    expect(result.days).toEqual(['Senin', 'Rabu']);
    expect(result.max_capacity).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    // Create prerequisites
    await db.insert(teachersTable)
      .values({
        full_name: 'Test Teacher',
        subjects: ['Math']
      })
      .execute();

    await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Sidoarjo'
      })
      .execute();

    const result = await createClass(testInput);

    // Query the database to verify the class was saved
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Test Class');
    expect(classes[0].level).toEqual('Beginner');
    expect(classes[0].teacher_id).toEqual(1);
    expect(classes[0].location_id).toEqual(1);
    expect(classes[0].start_time).toEqual('09:00:00');
    expect(classes[0].end_time).toEqual('10:30:00');
    expect(classes[0].days).toEqual(['Senin', 'Rabu']);
    expect(classes[0].max_capacity).toEqual(20);
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when teacher does not exist', async () => {
    // Only create location, not teacher
    await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Sidoarjo'
      })
      .execute();

    await expect(createClass(testInput)).rejects.toThrow(/teacher with id 1 not found/i);
  });

  it('should throw error when location does not exist', async () => {
    // Only create teacher, not location
    await db.insert(teachersTable)
      .values({
        full_name: 'Test Teacher',
        subjects: ['Math']
      })
      .execute();

    await expect(createClass(testInput)).rejects.toThrow(/location with id 1 not found/i);
  });

  it('should handle different levels and multiple days', async () => {
    // Create prerequisites
    await db.insert(teachersTable)
      .values({
        full_name: 'Advanced Teacher',
        subjects: ['Physics', 'Chemistry']
      })
      .execute();

    await db.insert(locationsTable)
      .values({
        name: 'Advanced Room',
        branch: 'Surabaya'
      })
      .execute();

    const advancedInput: CreateClassInput = {
      name: 'Advanced Physics',
      level: 'Advanced',
      teacher_id: 1,
      location_id: 1,
      start_time: '14:00',
      end_time: '16:00',
      days: ['Selasa', 'Kamis', 'Sabtu'],
      max_capacity: 15
    };

    const result = await createClass(advancedInput);

    expect(result.name).toEqual('Advanced Physics');
    expect(result.level).toEqual('Advanced');
    expect(result.start_time).toEqual('14:00:00');
    expect(result.end_time).toEqual('16:00:00');
    expect(result.days).toEqual(['Selasa', 'Kamis', 'Sabtu']);
    expect(result.max_capacity).toEqual(15);
  });
});