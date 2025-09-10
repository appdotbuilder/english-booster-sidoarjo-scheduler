import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, teachersTable, locationsTable, classesTable, studentClassEnrollmentsTable } from '../db/schema';
import { type EnrollStudentInput } from '../schema';
import { enrollStudent } from '../handlers/enroll_student';
import { eq, and } from 'drizzle-orm';

// Test data setup
const createTestStudent = async () => {
  const result = await db.insert(studentsTable)
    .values({
      full_name: 'Test Student',
      phone_number: '081234567890',
      email: 'teststudent@example.com'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestTeacher = async () => {
  const result = await db.insert(teachersTable)
    .values({
      full_name: 'Test Teacher',
      subjects: ['Math', 'Science']
    })
    .returning()
    .execute();
  return result[0];
};

const createTestLocation = async () => {
  const result = await db.insert(locationsTable)
    .values({
      name: 'Test Room',
      branch: 'Sidoarjo'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestClass = async (teacherId: number, locationId: number, maxCapacity: number = 20) => {
  const result = await db.insert(classesTable)
    .values({
      name: 'Test Class',
      level: 'Beginner',
      teacher_id: teacherId,
      location_id: locationId,
      start_time: '09:00',
      end_time: '11:00',
      days: ['Senin', 'Rabu'],
      max_capacity: maxCapacity
    })
    .returning()
    .execute();
  return result[0];
};

describe('enrollStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully enroll a student in a class', async () => {
    // Create test data
    const student = await createTestStudent();
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    const testInput: EnrollStudentInput = {
      student_id: student.id,
      class_id: testClass.id
    };

    const result = await enrollStudent(testInput);

    // Verify enrollment record
    expect(result.student_id).toBe(student.id);
    expect(result.class_id).toBe(testClass.id);
    expect(result.id).toBeDefined();
    expect(result.enrolled_at).toBeInstanceOf(Date);
  });

  it('should save enrollment to database', async () => {
    // Create test data
    const student = await createTestStudent();
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    const testInput: EnrollStudentInput = {
      student_id: student.id,
      class_id: testClass.id
    };

    const result = await enrollStudent(testInput);

    // Query database to verify enrollment exists
    const enrollments = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.id, result.id))
      .execute();

    expect(enrollments).toHaveLength(1);
    expect(enrollments[0].student_id).toBe(student.id);
    expect(enrollments[0].class_id).toBe(testClass.id);
    expect(enrollments[0].enrolled_at).toBeInstanceOf(Date);
  });

  it('should throw error when student does not exist', async () => {
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    const testInput: EnrollStudentInput = {
      student_id: 999, // Non-existent student ID
      class_id: testClass.id
    };

    await expect(enrollStudent(testInput)).rejects.toThrow(/Student with ID 999 not found/i);
  });

  it('should throw error when class does not exist', async () => {
    const student = await createTestStudent();

    const testInput: EnrollStudentInput = {
      student_id: student.id,
      class_id: 999 // Non-existent class ID
    };

    await expect(enrollStudent(testInput)).rejects.toThrow(/Class with ID 999 not found/i);
  });

  it('should prevent duplicate enrollments', async () => {
    // Create test data
    const student = await createTestStudent();
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    const testInput: EnrollStudentInput = {
      student_id: student.id,
      class_id: testClass.id
    };

    // First enrollment should succeed
    await enrollStudent(testInput);

    // Second enrollment should fail
    await expect(enrollStudent(testInput)).rejects.toThrow(/Student is already enrolled in class/i);
  });

  it('should respect class capacity limits', async () => {
    // Create test data with max capacity of 2
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id, 2);

    // Create two students
    const student1 = await createTestStudent();
    const student2 = await db.insert(studentsTable)
      .values({
        full_name: 'Test Student 2',
        phone_number: '081234567891',
        email: 'teststudent2@example.com'
      })
      .returning()
      .execute();

    const student3 = await db.insert(studentsTable)
      .values({
        full_name: 'Test Student 3',
        phone_number: '081234567892',
        email: 'teststudent3@example.com'
      })
      .returning()
      .execute();

    // Enroll first two students successfully
    await enrollStudent({ student_id: student1.id, class_id: testClass.id });
    await enrollStudent({ student_id: student2[0].id, class_id: testClass.id });

    // Third enrollment should fail due to capacity
    const testInput: EnrollStudentInput = {
      student_id: student3[0].id,
      class_id: testClass.id
    };

    await expect(enrollStudent(testInput)).rejects.toThrow(/Class .* is at full capacity/i);
  });

  it('should handle concurrent enrollments correctly', async () => {
    // Create test data
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    // Create multiple students
    const student1 = await createTestStudent();
    const student2 = await db.insert(studentsTable)
      .values({
        full_name: 'Test Student 2',
        phone_number: '081234567891',
        email: 'teststudent2@example.com'
      })
      .returning()
      .execute();

    const student3 = await db.insert(studentsTable)
      .values({
        full_name: 'Test Student 3',
        phone_number: '081234567892',
        email: 'teststudent3@example.com'
      })
      .returning()
      .execute();

    // Enroll multiple students concurrently
    const enrollmentPromises = [
      enrollStudent({ student_id: student1.id, class_id: testClass.id }),
      enrollStudent({ student_id: student2[0].id, class_id: testClass.id }),
      enrollStudent({ student_id: student3[0].id, class_id: testClass.id })
    ];

    const results = await Promise.all(enrollmentPromises);

    // All enrollments should succeed
    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.class_id).toBe(testClass.id);
      expect(result.enrolled_at).toBeInstanceOf(Date);
    });

    // Verify all enrollments in database
    const allEnrollments = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.class_id, testClass.id))
      .execute();

    expect(allEnrollments).toHaveLength(3);
  });

  it('should verify enrollment persists after transaction', async () => {
    // Create test data
    const student = await createTestStudent();
    const teacher = await createTestTeacher();
    const location = await createTestLocation();
    const testClass = await createTestClass(teacher.id, location.id);

    const testInput: EnrollStudentInput = {
      student_id: student.id,
      class_id: testClass.id
    };

    const result = await enrollStudent(testInput);

    // Query with join to verify enrollment with related data
    const enrollmentWithDetails = await db.select()
      .from(studentClassEnrollmentsTable)
      .innerJoin(studentsTable, eq(studentClassEnrollmentsTable.student_id, studentsTable.id))
      .innerJoin(classesTable, eq(studentClassEnrollmentsTable.class_id, classesTable.id))
      .where(eq(studentClassEnrollmentsTable.id, result.id))
      .execute();

    expect(enrollmentWithDetails).toHaveLength(1);
    
    const enrollmentData = enrollmentWithDetails[0];
    expect(enrollmentData.student_class_enrollments.student_id).toBe(student.id);
    expect(enrollmentData.student_class_enrollments.class_id).toBe(testClass.id);
    expect(enrollmentData.students.full_name).toBe('Test Student');
    expect(enrollmentData.classes.name).toBe('Test Class');
  });
});