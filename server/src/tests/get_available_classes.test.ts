import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, teachersTable, classesTable, studentsTable, studentClassEnrollmentsTable } from '../db/schema';
import { type GetAvailableClassesInput } from '../schema';
import { getAvailableClasses } from '../handlers/get_available_classes';

describe('getAvailableClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const setupTestData = async () => {
    // Create location
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create teacher
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'John Teacher',
        subjects: ['Math', 'Science']
      })
      .returning()
      .execute();

    // Create classes with different levels and days
    const [beginnerClass] = await db.insert(classesTable)
      .values({
        name: 'Beginner Math',
        level: 'Beginner',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '09:00',
        end_time: '10:00',
        days: ['Senin', 'Rabu'],
        max_capacity: 10
      })
      .returning()
      .execute();

    const [intermediateClass] = await db.insert(classesTable)
      .values({
        name: 'Intermediate Science',
        level: 'Intermediate',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '11:00',
        end_time: '12:00',
        days: ['Selasa', 'Kamis'],
        max_capacity: 8
      })
      .returning()
      .execute();

    const [advancedClass] = await db.insert(classesTable)
      .values({
        name: 'Advanced Physics',
        level: 'Advanced',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '14:00',
        end_time: '15:30',
        days: ['Jumat'],
        max_capacity: 5
      })
      .returning()
      .execute();

    return {
      location,
      teacher,
      beginnerClass,
      intermediateClass,
      advancedClass
    };
  };

  it('should return all available classes when no filters provided', async () => {
    const testData = await setupTestData();

    const input: GetAvailableClassesInput = {};
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(3);
    
    // Check that all classes are included
    const classNames = result.map(c => c.name).sort();
    expect(classNames).toEqual(['Advanced Physics', 'Beginner Math', 'Intermediate Science']);

    // Verify structure of first class
    const firstClass = result[0];
    expect(firstClass.id).toBeDefined();
    expect(firstClass.name).toBeDefined();
    expect(firstClass.level).toBeDefined();
    expect(firstClass.teacher_id).toEqual(testData.teacher.id);
    expect(firstClass.location_id).toEqual(testData.location.id);
    expect(firstClass.start_time).toBeDefined();
    expect(firstClass.end_time).toBeDefined();
    expect(firstClass.days).toBeInstanceOf(Array);
    expect(firstClass.max_capacity).toBeTypeOf('number');
    expect(firstClass.created_at).toBeInstanceOf(Date);

    // Verify teacher relation is populated
    expect(firstClass.teacher).toBeDefined();
    expect(firstClass.teacher?.id).toEqual(testData.teacher.id);
    expect(firstClass.teacher?.full_name).toEqual('John Teacher');
    expect(firstClass.teacher?.subjects).toEqual(['Math', 'Science']);

    // Verify location relation is populated
    expect(firstClass.location).toBeDefined();
    expect(firstClass.location?.id).toEqual(testData.location.id);
    expect(firstClass.location?.name).toEqual('Room A');
    expect(firstClass.location?.branch).toEqual('Sidoarjo');

    // Verify enrolled count
    expect(firstClass.enrolled_count).toEqual(0);
  });

  it('should filter by level correctly', async () => {
    await setupTestData();

    const input: GetAvailableClassesInput = {
      level: 'Beginner'
    };
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Beginner Math');
    expect(result[0].level).toEqual('Beginner');
  });

  it('should filter by day correctly', async () => {
    await setupTestData();

    const input: GetAvailableClassesInput = {
      day: 'Senin'
    };
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Beginner Math');
    expect(result[0].days).toContain('Senin');
  });

  it('should filter by both level and day', async () => {
    await setupTestData();

    const input: GetAvailableClassesInput = {
      level: 'Intermediate',
      day: 'Selasa'
    };
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Intermediate Science');
    expect(result[0].level).toEqual('Intermediate');
    expect(result[0].days).toContain('Selasa');
  });

  it('should return empty array when no classes match filters', async () => {
    await setupTestData();

    const input: GetAvailableClassesInput = {
      level: 'Beginner',
      day: 'Minggu'
    };
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(0);
  });

  it('should exclude classes at full capacity', async () => {
    const testData = await setupTestData();

    // Create students to fill up one class
    const students = await Promise.all([
      db.insert(studentsTable)
        .values({
          full_name: 'Student 1',
          phone_number: '081234567891',
          email: 'student1@test.com'
        })
        .returning()
        .execute(),
      db.insert(studentsTable)
        .values({
          full_name: 'Student 2',
          phone_number: '081234567892',
          email: 'student2@test.com'
        })
        .returning()
        .execute(),
      db.insert(studentsTable)
        .values({
          full_name: 'Student 3',
          phone_number: '081234567893',
          email: 'student3@test.com'
        })
        .returning()
        .execute(),
      db.insert(studentsTable)
        .values({
          full_name: 'Student 4',
          phone_number: '081234567894',
          email: 'student4@test.com'
        })
        .returning()
        .execute(),
      db.insert(studentsTable)
        .values({
          full_name: 'Student 5',
          phone_number: '081234567895',
          email: 'student5@test.com'
        })
        .returning()
        .execute()
    ]);

    // Fill up the advanced class (capacity 5) completely
    for (const [student] of students) {
      await db.insert(studentClassEnrollmentsTable)
        .values({
          student_id: student.id,
          class_id: testData.advancedClass.id
        })
        .execute();
    }

    const input: GetAvailableClassesInput = {};
    const result = await getAvailableClasses(input);

    // Should only return 2 classes (beginner and intermediate), not the full advanced class
    expect(result).toHaveLength(2);
    const classNames = result.map(c => c.name).sort();
    expect(classNames).toEqual(['Beginner Math', 'Intermediate Science']);
  });

  it('should return classes with partial enrollment', async () => {
    const testData = await setupTestData();

    // Create one student and enroll in beginner class
    const [student] = await db.insert(studentsTable)
      .values({
        full_name: 'Student 1',
        phone_number: '081234567891',
        email: 'student1@test.com'
      })
      .returning()
      .execute();

    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: student.id,
        class_id: testData.beginnerClass.id
      })
      .execute();

    const input: GetAvailableClassesInput = {};
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(3);
    
    // Find the beginner class and check enrollment count
    const beginnerClass = result.find(c => c.name === 'Beginner Math');
    expect(beginnerClass).toBeDefined();
    expect(beginnerClass?.enrolled_count).toEqual(1);
    expect(beginnerClass?.max_capacity).toEqual(10);
  });

  it('should handle multiple days filter correctly', async () => {
    await setupTestData();

    // Test filtering by a day that appears in multiple classes
    const input: GetAvailableClassesInput = {
      day: 'Rabu'
    };
    const result = await getAvailableClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Beginner Math');
    expect(result[0].days).toContain('Rabu');
  });
});