import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, classesTable, locationsTable, teachersTable, studentClassEnrollmentsTable } from '../db/schema';
import { deleteStudent } from '../handlers/delete_student';
import { eq } from 'drizzle-orm';

describe('deleteStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing student', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        full_name: 'John Doe',
        phone_number: '+62812345678',
        email: 'john.doe@example.com'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Delete the student
    const result = await deleteStudent(studentId);

    expect(result.success).toBe(true);

    // Verify student is deleted from database
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(deletedStudent).toHaveLength(0);
  });

  it('should delete student and their enrollments', async () => {
    // Create prerequisites: location and teacher
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Jane Teacher',
        subjects: ['Math', 'Physics']
      })
      .returning()
      .execute();

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Math Beginner',
        level: 'Beginner',
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id,
        start_time: '09:00',
        end_time: '11:00',
        days: ['Senin', 'Rabu'],
        max_capacity: 20
      })
      .returning()
      .execute();

    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values({
        full_name: 'Alice Student',
        phone_number: '+62812345679',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Enroll student in the class
    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: studentId,
        class_id: classResult[0].id
      })
      .execute();

    // Verify enrollment exists before deletion
    const enrollmentsBefore = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.student_id, studentId))
      .execute();

    expect(enrollmentsBefore).toHaveLength(1);

    // Delete the student
    const result = await deleteStudent(studentId);

    expect(result.success).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(deletedStudent).toHaveLength(0);

    // Verify enrollments are also deleted
    const enrollmentsAfter = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.student_id, studentId))
      .execute();

    expect(enrollmentsAfter).toHaveLength(0);
  });

  it('should throw error when student does not exist', async () => {
    const nonExistentId = 999;

    expect(deleteStudent(nonExistentId)).rejects.toThrow(/student with id 999 not found/i);
  });

  it('should handle multiple enrollments deletion', async () => {
    // Create prerequisites
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Room B',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const teacherResult = await db.insert(teachersTable)
      .values({
        full_name: 'Bob Teacher',
        subjects: ['English', 'Science']
      })
      .returning()
      .execute();

    // Create multiple classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'English Beginner',
        level: 'Beginner',
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id,
        start_time: '10:00',
        end_time: '12:00',
        days: ['Selasa', 'Kamis'],
        max_capacity: 15
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Science Intermediate',
        level: 'Intermediate',
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id,
        start_time: '14:00',
        end_time: '16:00',
        days: ['Jumat'],
        max_capacity: 12
      })
      .returning()
      .execute();

    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values({
        full_name: 'Charlie Multi',
        phone_number: '+62812345680',
        email: 'charlie@example.com'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Enroll student in multiple classes
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: studentId,
          class_id: class1Result[0].id
        },
        {
          student_id: studentId,
          class_id: class2Result[0].id
        }
      ])
      .execute();

    // Verify multiple enrollments exist
    const enrollmentsBefore = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.student_id, studentId))
      .execute();

    expect(enrollmentsBefore).toHaveLength(2);

    // Delete the student
    const result = await deleteStudent(studentId);

    expect(result.success).toBe(true);

    // Verify all enrollments are deleted
    const enrollmentsAfter = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.student_id, studentId))
      .execute();

    expect(enrollmentsAfter).toHaveLength(0);

    // Verify classes still exist (should not be affected)
    const remainingClasses = await db.select()
      .from(classesTable)
      .execute();

    expect(remainingClasses.length).toBeGreaterThanOrEqual(2);
  });
});