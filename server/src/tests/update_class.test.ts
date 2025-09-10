import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, teachersTable, locationsTable } from '../db/schema';
import { type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testTeacherId: number;
  let testLocationId: number;
  let testClassId: number;
  let secondTeacherId: number;
  let secondLocationId: number;

  beforeEach(async () => {
    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'John Doe',
        subjects: ['Mathematics', 'Physics']
      })
      .returning()
      .execute();
    testTeacherId = teacherResult[0].id;

    // Create second teacher for updates
    const secondTeacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Jane Smith',
        subjects: ['English', 'Literature']
      })
      .returning()
      .execute();
    secondTeacherId = secondTeacherResult[0].id;

    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();
    testLocationId = locationResult[0].id;

    // Create second location for updates
    const secondLocationResult = await db.insert(locationsTable)
      .values({
        name: 'Room B',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();
    secondLocationId = secondLocationResult[0].id;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Mathematics 101',
        level: 'Beginner',
        teacher_id: testTeacherId,
        location_id: testLocationId,
        start_time: '09:00',
        end_time: '11:00',
        days: ['Senin', 'Rabu'],
        max_capacity: 20
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;
  });

  it('should update class name only', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      name: 'Advanced Mathematics'
    };

    const result = await updateClass(input);

    expect(result.id).toEqual(testClassId);
    expect(result.name).toEqual('Advanced Mathematics');
    expect(result.level).toEqual('Beginner'); // Should remain unchanged
    expect(result.teacher_id).toEqual(testTeacherId);
    expect(result.location_id).toEqual(testLocationId);
    expect(result.start_time).toEqual('09:00:00');
    expect(result.end_time).toEqual('11:00:00');
    expect(result.days).toEqual(['Senin', 'Rabu']);
    expect(result.max_capacity).toEqual(20);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      name: 'Physics Advanced',
      level: 'Advanced',
      teacher_id: secondTeacherId,
      location_id: secondLocationId,
      start_time: '14:00',
      end_time: '16:00',
      days: ['Selasa', 'Kamis', 'Jumat'],
      max_capacity: 15
    };

    const result = await updateClass(input);

    expect(result.id).toEqual(testClassId);
    expect(result.name).toEqual('Physics Advanced');
    expect(result.level).toEqual('Advanced');
    expect(result.teacher_id).toEqual(secondTeacherId);
    expect(result.location_id).toEqual(secondLocationId);
    expect(result.start_time).toEqual('14:00:00');
    expect(result.end_time).toEqual('16:00:00');
    expect(result.days).toEqual(['Selasa', 'Kamis', 'Jumat']);
    expect(result.max_capacity).toEqual(15);
  });

  it('should persist changes to database', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      name: 'Updated Class Name',
      level: 'Intermediate',
      max_capacity: 25
    };

    await updateClass(input);

    // Verify changes in database
    const classFromDb = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClassId))
      .execute();

    expect(classFromDb).toHaveLength(1);
    expect(classFromDb[0].name).toEqual('Updated Class Name');
    expect(classFromDb[0].level).toEqual('Intermediate');
    expect(classFromDb[0].max_capacity).toEqual(25);
    expect(classFromDb[0].teacher_id).toEqual(testTeacherId); // Unchanged
    expect(classFromDb[0].location_id).toEqual(testLocationId); // Unchanged
  });

  it('should update only time fields', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      start_time: '08:30',
      end_time: '10:30'
    };

    const result = await updateClass(input);

    expect(result.start_time).toEqual('08:30:00');
    expect(result.end_time).toEqual('10:30:00');
    expect(result.name).toEqual('Mathematics 101'); // Should remain unchanged
    expect(result.level).toEqual('Beginner');
  });

  it('should update only days field', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      days: ['Minggu']
    };

    const result = await updateClass(input);

    expect(result.days).toEqual(['Minggu']);
    expect(result.name).toEqual('Mathematics 101'); // Should remain unchanged
  });

  it('should throw error when class does not exist', async () => {
    const input: UpdateClassInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateClass(input)).rejects.toThrow(/Class with ID 99999 not found/i);
  });

  it('should throw error when teacher does not exist', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      teacher_id: 99999 // Non-existent teacher ID
    };

    await expect(updateClass(input)).rejects.toThrow(/Teacher with ID 99999 not found/i);
  });

  it('should throw error when location does not exist', async () => {
    const input: UpdateClassInput = {
      id: testClassId,
      location_id: 99999 // Non-existent location ID
    };

    await expect(updateClass(input)).rejects.toThrow(/Location with ID 99999 not found/i);
  });

  it('should handle empty update (no fields provided except id)', async () => {
    const input: UpdateClassInput = {
      id: testClassId
    };

    const result = await updateClass(input);

    // Should return the class unchanged
    expect(result.id).toEqual(testClassId);
    expect(result.name).toEqual('Mathematics 101');
    expect(result.level).toEqual('Beginner');
    expect(result.teacher_id).toEqual(testTeacherId);
    expect(result.location_id).toEqual(testLocationId);
  });

  it('should update level to all valid enum values', async () => {
    // Test Intermediate
    let input: UpdateClassInput = {
      id: testClassId,
      level: 'Intermediate'
    };

    let result = await updateClass(input);
    expect(result.level).toEqual('Intermediate');

    // Test Advanced
    input = {
      id: testClassId,
      level: 'Advanced'
    };

    result = await updateClass(input);
    expect(result.level).toEqual('Advanced');

    // Test back to Beginner
    input = {
      id: testClassId,
      level: 'Beginner'
    };

    result = await updateClass(input);
    expect(result.level).toEqual('Beginner');
  });
});