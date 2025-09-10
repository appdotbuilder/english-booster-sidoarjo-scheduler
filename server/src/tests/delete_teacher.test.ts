import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, classesTable, locationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTeacher } from '../handlers/delete_teacher';

describe('deleteTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a teacher successfully', async () => {
    // Create a test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Test Teacher',
        subjects: ['Math', 'Science']
      })
      .returning()
      .execute();

    const teacherId = teacherResult[0].id;

    // Delete the teacher
    const result = await deleteTeacher(teacherId);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify teacher no longer exists in database
    const deletedTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    expect(deletedTeacher).toHaveLength(0);
  });

  it('should throw error when deleting non-existent teacher', async () => {
    const nonExistentId = 999;

    await expect(deleteTeacher(nonExistentId))
      .rejects
      .toThrow(/Teacher with id 999 not found/i);
  });

  it('should throw error when teacher has active classes', async () => {
    // Create a test location first
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Test Branch'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create a test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Teacher with Classes',
        subjects: ['Math']
      })
      .returning()
      .execute();

    const teacherId = teacherResult[0].id;

    // Create a class assigned to the teacher
    await db.insert(classesTable)
      .values({
        name: 'Test Class',
        level: 'Beginner',
        teacher_id: teacherId,
        location_id: locationId,
        start_time: '09:00',
        end_time: '11:00',
        days: ['Senin', 'Rabu'],
        max_capacity: 20
      })
      .execute();

    // Attempt to delete the teacher
    await expect(deleteTeacher(teacherId))
      .rejects
      .toThrow(/Cannot delete teacher with id \d+\. Teacher has 1 active classes/i);

    // Verify teacher still exists
    const teacherCheck = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    expect(teacherCheck).toHaveLength(1);
  });

  it('should throw error when teacher has multiple active classes', async () => {
    // Create a test location first
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Test Branch'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create a test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Busy Teacher',
        subjects: ['Math', 'Science', 'English']
      })
      .returning()
      .execute();

    const teacherId = teacherResult[0].id;

    // Create multiple classes assigned to the teacher
    await db.insert(classesTable)
      .values([
        {
          name: 'Math Class',
          level: 'Beginner',
          teacher_id: teacherId,
          location_id: locationId,
          start_time: '09:00',
          end_time: '11:00',
          days: ['Senin'],
          max_capacity: 15
        },
        {
          name: 'Science Class',
          level: 'Intermediate',
          teacher_id: teacherId,
          location_id: locationId,
          start_time: '14:00',
          end_time: '16:00',
          days: ['Selasa'],
          max_capacity: 20
        },
        {
          name: 'English Class',
          level: 'Advanced',
          teacher_id: teacherId,
          location_id: locationId,
          start_time: '10:00',
          end_time: '12:00',
          days: ['Rabu'],
          max_capacity: 12
        }
      ])
      .execute();

    // Attempt to delete the teacher
    await expect(deleteTeacher(teacherId))
      .rejects
      .toThrow(/Cannot delete teacher with id \d+\. Teacher has 3 active classes/i);

    // Verify teacher still exists
    const teacherCheck = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    expect(teacherCheck).toHaveLength(1);

    // Verify all classes still exist
    const classesCheck = await db.select()
      .from(classesTable)
      .where(eq(classesTable.teacher_id, teacherId))
      .execute();

    expect(classesCheck).toHaveLength(3);
  });

  it('should allow deletion after removing all classes', async () => {
    // Create a test location first
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Room',
        branch: 'Test Branch'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create a test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Teacher to Delete',
        subjects: ['History']
      })
      .returning()
      .execute();

    const teacherId = teacherResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'History Class',
        level: 'Intermediate',
        teacher_id: teacherId,
        location_id: locationId,
        start_time: '13:00',
        end_time: '15:00',
        days: ['Kamis'],
        max_capacity: 25
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // First deletion attempt should fail
    await expect(deleteTeacher(teacherId))
      .rejects
      .toThrow(/Cannot delete teacher with id \d+\. Teacher has 1 active classes/i);

    // Remove the class
    await db.delete(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    // Now deletion should succeed
    const result = await deleteTeacher(teacherId);
    expect(result.success).toBe(true);

    // Verify teacher is deleted
    const teacherCheck = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    expect(teacherCheck).toHaveLength(0);
  });
});