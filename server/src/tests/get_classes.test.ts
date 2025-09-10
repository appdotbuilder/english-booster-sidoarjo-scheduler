import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, teachersTable, locationsTable, studentsTable, studentClassEnrollmentsTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toEqual([]);
  });

  it('should return classes with teacher and location details', async () => {
    // Create prerequisite data
    const [teacher] = await db
      .insert(teachersTable)
      .values({
        full_name: 'John Doe',
        subjects: ['Math', 'Physics'],
      })
      .returning()
      .execute();

    const [location] = await db
      .insert(locationsTable)
      .values({
        name: 'Room A1',
        branch: 'Sidoarjo',
      })
      .returning()
      .execute();

    // Create a class
    const [classData] = await db
      .insert(classesTable)
      .values({
        name: 'Math 101',
        level: 'Beginner',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '09:00',
        end_time: '10:30',
        days: ['Senin', 'Rabu'],
        max_capacity: 20,
      })
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: classData.id,
      name: 'Math 101',
      level: 'Beginner',
      teacher_id: teacher.id,
      location_id: location.id,
      start_time: '09:00:00',
      end_time: '10:30:00',
      days: ['Senin', 'Rabu'],
      max_capacity: 20,
      created_at: expect.any(Date),
      teacher: {
        id: teacher.id,
        full_name: 'John Doe',
        subjects: ['Math', 'Physics'],
        created_at: expect.any(Date),
      },
      location: {
        id: location.id,
        name: 'Room A1',
        branch: 'Sidoarjo',
        created_at: expect.any(Date),
      },
      enrolled_students: [],
      enrolled_count: 0,
    });
  });

  it('should return classes with enrolled students and correct count', async () => {
    // Create prerequisite data
    const [teacher] = await db
      .insert(teachersTable)
      .values({
        full_name: 'Jane Smith',
        subjects: ['English', 'Literature'],
      })
      .returning()
      .execute();

    const [location] = await db
      .insert(locationsTable)
      .values({
        name: 'Room B2',
        branch: 'Sidoarjo',
      })
      .returning()
      .execute();

    const [student1, student2] = await db
      .insert(studentsTable)
      .values([
        {
          full_name: 'Alice Johnson',
          phone_number: '123456789',
          email: 'alice@example.com',
        },
        {
          full_name: 'Bob Wilson',
          phone_number: '987654321',
          email: 'bob@example.com',
        },
      ])
      .returning()
      .execute();

    const [classData] = await db
      .insert(classesTable)
      .values({
        name: 'English Literature',
        level: 'Intermediate',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '14:00',
        end_time: '15:30',
        days: ['Selasa', 'Kamis'],
        max_capacity: 15,
      })
      .returning()
      .execute();

    // Enroll students in the class
    await db
      .insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: student1.id,
          class_id: classData.id,
        },
        {
          student_id: student2.id,
          class_id: classData.id,
        },
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].enrolled_count).toBe(2);
    expect(result[0].enrolled_students).toHaveLength(2);
    
    const enrolledStudentsNames = result[0].enrolled_students!.map(s => s.full_name).sort();
    expect(enrolledStudentsNames).toEqual(['Alice Johnson', 'Bob Wilson']);

    // Verify student details
    const aliceStudent = result[0].enrolled_students!.find(s => s.full_name === 'Alice Johnson');
    expect(aliceStudent).toEqual({
      id: student1.id,
      full_name: 'Alice Johnson',
      phone_number: '123456789',
      email: 'alice@example.com',
      created_at: expect.any(Date),
    });
  });

  it('should return multiple classes with different enrollment states', async () => {
    // Create prerequisite data
    const [teacher1, teacher2] = await db
      .insert(teachersTable)
      .values([
        {
          full_name: 'Math Teacher',
          subjects: ['Math'],
        },
        {
          full_name: 'Science Teacher',
          subjects: ['Science'],
        },
      ])
      .returning()
      .execute();

    const [location1, location2] = await db
      .insert(locationsTable)
      .values([
        {
          name: 'Math Lab',
          branch: 'Sidoarjo',
        },
        {
          name: 'Science Lab',
          branch: 'Sidoarjo',
        },
      ])
      .returning()
      .execute();

    const [student] = await db
      .insert(studentsTable)
      .values({
        full_name: 'Test Student',
        phone_number: '555123456',
        email: 'student@example.com',
      })
      .returning()
      .execute();

    // Create two classes
    const [mathClass, scienceClass] = await db
      .insert(classesTable)
      .values([
        {
          name: 'Basic Math',
          level: 'Beginner',
          teacher_id: teacher1.id,
          location_id: location1.id,
          start_time: '09:00',
          end_time: '10:30',
          days: ['Senin'],
          max_capacity: 10,
        },
        {
          name: 'Advanced Science',
          level: 'Advanced',
          teacher_id: teacher2.id,
          location_id: location2.id,
          start_time: '11:00',
          end_time: '12:30',
          days: ['Rabu'],
          max_capacity: 8,
        },
      ])
      .returning()
      .execute();

    // Enroll student only in math class
    await db
      .insert(studentClassEnrollmentsTable)
      .values({
        student_id: student.id,
        class_id: mathClass.id,
      })
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Find each class in the result
    const mathResult = result.find(c => c.name === 'Basic Math');
    const scienceResult = result.find(c => c.name === 'Advanced Science');

    expect(mathResult).toBeDefined();
    if (mathResult) {
      expect(mathResult.enrolled_count).toBe(1);
      expect(mathResult.enrolled_students).toHaveLength(1);
      expect(mathResult.teacher?.full_name).toBe('Math Teacher');
      expect(mathResult.location?.name).toBe('Math Lab');
    }

    expect(scienceResult).toBeDefined();
    if (scienceResult) {
      expect(scienceResult.enrolled_count).toBe(0);
      expect(scienceResult.enrolled_students).toHaveLength(0);
      expect(scienceResult.teacher?.full_name).toBe('Science Teacher');
      expect(scienceResult.location?.name).toBe('Science Lab');
    }
  });

  it('should handle classes with different day combinations', async () => {
    // Create prerequisite data
    const [teacher] = await db
      .insert(teachersTable)
      .values({
        full_name: 'Multi-day Teacher',
        subjects: ['General'],
      })
      .returning()
      .execute();

    const [location] = await db
      .insert(locationsTable)
      .values({
        name: 'Multi-purpose Room',
        branch: 'Sidoarjo',
      })
      .returning()
      .execute();

    // Create class with multiple days
    const [classData] = await db
      .insert(classesTable)
      .values({
        name: 'Daily Practice',
        level: 'Intermediate',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '16:00',
        end_time: '17:00',
        days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        max_capacity: 25,
      })
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].days).toEqual(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
    expect(result[0].name).toBe('Daily Practice');
    expect(result[0].max_capacity).toBe(25);
  });

  it('should handle classes with different levels correctly', async () => {
    // Create prerequisite data
    const [teacher] = await db
      .insert(teachersTable)
      .values({
        full_name: 'Level Expert',
        subjects: ['All Levels'],
      })
      .returning()
      .execute();

    const [location] = await db
      .insert(locationsTable)
      .values({
        name: 'Flexible Room',
        branch: 'Sidoarjo',
      })
      .returning()
      .execute();

    // Create classes with different levels
    const [beginnerClass, intermediateClass, advancedClass] = await db
      .insert(classesTable)
      .values([
        {
          name: 'Beginner Class',
          level: 'Beginner',
          teacher_id: teacher.id,
          location_id: location.id,
          start_time: '08:00',
          end_time: '09:00',
          days: ['Senin'],
          max_capacity: 20,
        },
        {
          name: 'Intermediate Class',
          level: 'Intermediate',
          teacher_id: teacher.id,
          location_id: location.id,
          start_time: '09:00',
          end_time: '10:00',
          days: ['Selasa'],
          max_capacity: 15,
        },
        {
          name: 'Advanced Class',
          level: 'Advanced',
          teacher_id: teacher.id,
          location_id: location.id,
          start_time: '10:00',
          end_time: '11:00',
          days: ['Rabu'],
          max_capacity: 10,
        },
      ])
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    const levels = result.map(c => c.level).sort();
    expect(levels).toEqual(['Advanced', 'Beginner', 'Intermediate']);
    
    const beginnerResult = result.find(c => c.level === 'Beginner');
    const intermediateResult = result.find(c => c.level === 'Intermediate');
    const advancedResult = result.find(c => c.level === 'Advanced');

    if (beginnerResult) {
      expect(beginnerResult.name).toBe('Beginner Class');
    }
    if (intermediateResult) {
      expect(intermediateResult.name).toBe('Intermediate Class');
    }
    if (advancedResult) {
      expect(advancedResult.name).toBe('Advanced Class');
    }
  });
});