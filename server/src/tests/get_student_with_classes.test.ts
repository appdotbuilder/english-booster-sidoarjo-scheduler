import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, teachersTable, locationsTable, classesTable, studentClassEnrollmentsTable } from '../db/schema';
import { getStudentWithClasses } from '../handlers/get_student_with_classes';
import type { DayOfWeek, Level } from '../schema';

// Test data
const testStudent = {
  full_name: 'John Doe',
  phone_number: '+1234567890',
  email: 'john.doe@example.com'
};

const testTeacher = {
  full_name: 'Jane Smith',
  subjects: ['Math', 'Physics']
};

const testLocation = {
  name: 'Room A',
  branch: 'Sidoarjo'
};

const testClass = {
  name: 'Advanced Math',
  level: 'Advanced' as Level,
  start_time: '09:00',
  end_time: '11:00',
  days: ['Senin', 'Rabu', 'Jumat'] as DayOfWeek[],
  max_capacity: 20
};

const testClass2 = {
  name: 'Beginner Physics',
  level: 'Beginner' as Level,
  start_time: '14:00',
  end_time: '16:00',
  days: ['Selasa', 'Kamis'] as DayOfWeek[],
  max_capacity: 15
};

describe('getStudentWithClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent student', async () => {
    const result = await getStudentWithClasses(999);
    expect(result).toBeNull();
  });

  it('should return student with no classes when not enrolled', async () => {
    // Create student
    const studentResult = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    const student = studentResult[0];
    const result = await getStudentWithClasses(student.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(student.id);
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.phone_number).toEqual('+1234567890');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.enrolled_classes).toEqual([]);
  });

  it('should return student with enrolled classes and all details', async () => {
    // Create prerequisite data
    const studentResult = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id
      })
      .returning()
      .execute();

    // Enroll student in class
    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: studentResult[0].id,
        class_id: classResult[0].id
      })
      .execute();

    const result = await getStudentWithClasses(studentResult[0].id);

    // Verify student data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(studentResult[0].id);
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.phone_number).toEqual('+1234567890');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify enrolled classes
    expect(result!.enrolled_classes).toHaveLength(1);
    const enrolledClass = result!.enrolled_classes![0];

    // Verify class details
    expect(enrolledClass.id).toEqual(classResult[0].id);
    expect(enrolledClass.name).toEqual('Advanced Math');
    expect(enrolledClass.level).toEqual('Advanced');
    expect(enrolledClass.start_time).toEqual('09:00:00');
    expect(enrolledClass.end_time).toEqual('11:00:00');
    expect(enrolledClass.days).toEqual(['Senin', 'Rabu', 'Jumat']);
    expect(enrolledClass.max_capacity).toEqual(20);
    expect(enrolledClass.teacher_id).toEqual(teacherResult[0].id);
    expect(enrolledClass.location_id).toEqual(locationResult[0].id);
    expect(enrolledClass.created_at).toBeInstanceOf(Date);

    // Verify teacher details
    expect(enrolledClass.teacher).toBeDefined();
    expect(enrolledClass.teacher!.id).toEqual(teacherResult[0].id);
    expect(enrolledClass.teacher!.full_name).toEqual('Jane Smith');
    expect(enrolledClass.teacher!.subjects).toEqual(['Math', 'Physics']);
    expect(enrolledClass.teacher!.created_at).toBeInstanceOf(Date);

    // Verify location details
    expect(enrolledClass.location).toBeDefined();
    expect(enrolledClass.location!.id).toEqual(locationResult[0].id);
    expect(enrolledClass.location!.name).toEqual('Room A');
    expect(enrolledClass.location!.branch).toEqual('Sidoarjo');
    expect(enrolledClass.location!.created_at).toBeInstanceOf(Date);
  });

  it('should return student with multiple enrolled classes', async () => {
    // Create prerequisite data
    const studentResult = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();

    // Create two classes
    const class1Result = await db.insert(classesTable)
      .values({
        ...testClass,
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        ...testClass2,
        teacher_id: teacherResult[0].id,
        location_id: locationResult[0].id
      })
      .returning()
      .execute();

    // Enroll student in both classes
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: studentResult[0].id,
          class_id: class1Result[0].id
        },
        {
          student_id: studentResult[0].id,
          class_id: class2Result[0].id
        }
      ])
      .execute();

    const result = await getStudentWithClasses(studentResult[0].id);

    // Verify student has both classes
    expect(result).not.toBeNull();
    expect(result!.enrolled_classes).toHaveLength(2);

    // Verify both classes are included
    const classNames = result!.enrolled_classes!.map(c => c.name);
    expect(classNames).toContain('Advanced Math');
    expect(classNames).toContain('Beginner Physics');

    // Verify each class has complete details
    result!.enrolled_classes!.forEach(enrolledClass => {
      expect(enrolledClass.teacher).toBeDefined();
      expect(enrolledClass.location).toBeDefined();
      expect(enrolledClass.teacher!.full_name).toEqual('Jane Smith');
      expect(enrolledClass.location!.name).toEqual('Room A');
    });
  });

  it('should handle student with different teachers and locations for different classes', async () => {
    // Create prerequisite data
    const studentResult = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    const teacher1Result = await db.insert(teachersTable)
      .values({ full_name: 'Teacher One', subjects: ['Math'] })
      .returning()
      .execute();

    const teacher2Result = await db.insert(teachersTable)
      .values({ full_name: 'Teacher Two', subjects: ['Physics'] })
      .returning()
      .execute();

    const location1Result = await db.insert(locationsTable)
      .values({ name: 'Room 1', branch: 'Sidoarjo' })
      .returning()
      .execute();

    const location2Result = await db.insert(locationsTable)
      .values({ name: 'Room 2', branch: 'Surabaya' })
      .returning()
      .execute();

    // Create classes with different teachers and locations
    const class1Result = await db.insert(classesTable)
      .values({
        ...testClass,
        teacher_id: teacher1Result[0].id,
        location_id: location1Result[0].id
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        ...testClass2,
        teacher_id: teacher2Result[0].id,
        location_id: location2Result[0].id
      })
      .returning()
      .execute();

    // Enroll student in both classes
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: studentResult[0].id,
          class_id: class1Result[0].id
        },
        {
          student_id: studentResult[0].id,
          class_id: class2Result[0].id
        }
      ])
      .execute();

    const result = await getStudentWithClasses(studentResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.enrolled_classes).toHaveLength(2);

    // Verify different teachers and locations are correctly associated
    const mathClass = result!.enrolled_classes!.find(c => c.name === 'Advanced Math');
    const physicsClass = result!.enrolled_classes!.find(c => c.name === 'Beginner Physics');

    expect(mathClass).toBeDefined();
    expect(mathClass!.teacher!.full_name).toEqual('Teacher One');
    expect(mathClass!.location!.name).toEqual('Room 1');
    expect(mathClass!.location!.branch).toEqual('Sidoarjo');

    expect(physicsClass).toBeDefined();
    expect(physicsClass!.teacher!.full_name).toEqual('Teacher Two');
    expect(physicsClass!.location!.name).toEqual('Room 2');
    expect(physicsClass!.location!.branch).toEqual('Surabaya');
  });
});