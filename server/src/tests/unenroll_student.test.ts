import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, teachersTable, locationsTable, classesTable, studentClassEnrollmentsTable } from '../db/schema';
import { type UnenrollStudentInput } from '../schema';
import { unenrollStudent } from '../handlers/unenroll_student';
import { eq, and } from 'drizzle-orm';

describe('unenrollStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let classId: number;

  beforeEach(async () => {
    // Create a teacher
    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'Test Teacher',
        subjects: ['Math', 'Science']
      })
      .returning()
      .execute();

    // Create a location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create a student
    const student = await db.insert(studentsTable)
      .values({
        full_name: 'Test Student',
        phone_number: '081234567890',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create a class
    const classResult = await db.insert(classesTable)
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

    studentId = student[0].id;
    classId = classResult[0].id;

    // Create initial enrollment
    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: studentId,
        class_id: classId
      })
      .execute();
  });

  const testInput: UnenrollStudentInput = {
    student_id: 0, // Will be set in tests
    class_id: 0    // Will be set in tests
  };

  it('should successfully unenroll a student from a class', async () => {
    const input = {
      ...testInput,
      student_id: studentId,
      class_id: classId
    };

    const result = await unenrollStudent(input);

    expect(result.success).toBe(true);
  });

  it('should remove enrollment record from database', async () => {
    const input = {
      ...testInput,
      student_id: studentId,
      class_id: classId
    };

    await unenrollStudent(input);

    // Verify enrollment record is deleted
    const enrollments = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, studentId),
        eq(studentClassEnrollmentsTable.class_id, classId)
      ))
      .execute();

    expect(enrollments).toHaveLength(0);
  });

  it('should throw error when student does not exist', async () => {
    const input = {
      ...testInput,
      student_id: 99999, // Non-existent student ID
      class_id: classId
    };

    await expect(unenrollStudent(input)).rejects.toThrow(/Student with ID 99999 not found/i);
  });

  it('should throw error when class does not exist', async () => {
    const input = {
      ...testInput,
      student_id: studentId,
      class_id: 99999 // Non-existent class ID
    };

    await expect(unenrollStudent(input)).rejects.toThrow(/Class with ID 99999 not found/i);
  });

  it('should throw error when student is not enrolled in the class', async () => {
    // First unenroll the student
    await db.delete(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, studentId),
        eq(studentClassEnrollmentsTable.class_id, classId)
      ))
      .execute();

    const input = {
      ...testInput,
      student_id: studentId,
      class_id: classId
    };

    await expect(unenrollStudent(input)).rejects.toThrow(/Student with ID .+ is not enrolled in class with ID .+/i);
  });

  it('should handle multiple enrollments correctly', async () => {
    // Create another class
    const teacher = await db.insert(teachersTable)
      .values({
        full_name: 'Another Teacher',
        subjects: ['English']
      })
      .returning()
      .execute();

    const location = await db.insert(locationsTable)
      .values({
        name: 'Room B',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const anotherClass = await db.insert(classesTable)
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

    // Enroll student in the second class
    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: studentId,
        class_id: anotherClass[0].id
      })
      .execute();

    // Unenroll from first class only
    const input = {
      ...testInput,
      student_id: studentId,
      class_id: classId
    };

    const result = await unenrollStudent(input);

    expect(result.success).toBe(true);

    // Verify first enrollment is gone
    const firstEnrollment = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, studentId),
        eq(studentClassEnrollmentsTable.class_id, classId)
      ))
      .execute();

    expect(firstEnrollment).toHaveLength(0);

    // Verify second enrollment still exists
    const secondEnrollment = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, studentId),
        eq(studentClassEnrollmentsTable.class_id, anotherClass[0].id)
      ))
      .execute();

    expect(secondEnrollment).toHaveLength(1);
  });
});