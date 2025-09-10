import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  locationsTable, 
  teachersTable, 
  studentsTable, 
  classesTable, 
  studentClassEnrollmentsTable 
} from '../db/schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a class successfully', async () => {
    // Create prerequisite data
    const location = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'John Doe',
        subjects: ['Mathematics', 'Physics']
      })
      .returning()
      .execute();

    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Math 101',
        level: 'Beginner',
        teacher_id: teacher[0].id,
        location_id: location[0].id,
        start_time: '09:00',
        end_time: '10:30',
        days: ['Senin', 'Rabu'],
        max_capacity: 20
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass[0].id);

    expect(result.success).toBe(true);

    // Verify the class was deleted from database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass[0].id))
      .execute();

    expect(classes).toHaveLength(0);
  });

  it('should delete class and all associated enrollments', async () => {
    // Create prerequisite data
    const location = await db.insert(locationsTable)
      .values({
        name: 'Room B',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'Jane Smith',
        subjects: ['English']
      })
      .returning()
      .execute();

    const student1 = await db.insert(studentsTable)
      .values({
        full_name: 'Alice Johnson',
        phone_number: '081234567890',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    const student2 = await db.insert(studentsTable)
      .values({
        full_name: 'Bob Wilson',
        phone_number: '081234567891',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'English 101',
        level: 'Intermediate',
        teacher_id: teacher[0].id,
        location_id: location[0].id,
        start_time: '14:00',
        end_time: '15:30',
        days: ['Selasa', 'Kamis'],
        max_capacity: 15
      })
      .returning()
      .execute();

    // Create enrollments for the class
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: student1[0].id,
          class_id: testClass[0].id
        },
        {
          student_id: student2[0].id,
          class_id: testClass[0].id
        }
      ])
      .execute();

    // Verify enrollments exist before deletion
    const enrollmentsBefore = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.class_id, testClass[0].id))
      .execute();

    expect(enrollmentsBefore).toHaveLength(2);

    // Delete the class
    const result = await deleteClass(testClass[0].id);

    expect(result.success).toBe(true);

    // Verify all enrollments were deleted
    const enrollmentsAfter = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.class_id, testClass[0].id))
      .execute();

    expect(enrollmentsAfter).toHaveLength(0);

    // Verify the class was deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass[0].id))
      .execute();

    expect(classes).toHaveLength(0);

    // Verify students still exist (should not cascade delete)
    const studentsAfter = await db.select()
      .from(studentsTable)
      .execute();

    expect(studentsAfter).toHaveLength(2);
  });

  it('should return false when trying to delete non-existent class', async () => {
    const nonExistentId = 999;

    const result = await deleteClass(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should handle deletion of class with no enrollments', async () => {
    // Create prerequisite data
    const location = await db.insert(locationsTable)
      .values({
        name: 'Room C',
        branch: 'Surabaya'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'Mike Brown',
        subjects: ['Science']
      })
      .returning()
      .execute();

    // Create a test class with no enrollments
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Science 101',
        level: 'Advanced',
        teacher_id: teacher[0].id,
        location_id: location[0].id,
        start_time: '08:00',
        end_time: '09:30',
        days: ['Jumat'],
        max_capacity: 25
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass[0].id);

    expect(result.success).toBe(true);

    // Verify the class was deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass[0].id))
      .execute();

    expect(classes).toHaveLength(0);
  });

  it('should maintain referential integrity for teacher and location after class deletion', async () => {
    // Create prerequisite data
    const location = await db.insert(locationsTable)
      .values({
        name: 'Room D',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'Sarah Davis',
        subjects: ['History']
      })
      .returning()
      .execute();

    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'History 101',
        level: 'Beginner',
        teacher_id: teacher[0].id,
        location_id: location[0].id,
        start_time: '10:00',
        end_time: '11:30',
        days: ['Sabtu'],
        max_capacity: 30
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass[0].id);

    expect(result.success).toBe(true);

    // Verify teacher still exists
    const teachersAfter = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher[0].id))
      .execute();

    expect(teachersAfter).toHaveLength(1);
    expect(teachersAfter[0].full_name).toEqual('Sarah Davis');

    // Verify location still exists
    const locationsAfter = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, location[0].id))
      .execute();

    expect(locationsAfter).toHaveLength(1);
    expect(locationsAfter[0].name).toEqual('Room D');
  });
});