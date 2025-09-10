import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, locationsTable, classesTable, studentsTable, studentClassEnrollmentsTable } from '../db/schema';
import { type GetClassesByTeacherInput } from '../schema';
import { getClassesByTeacher } from '../handlers/get_classes_by_teacher';

describe('getClassesByTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return classes taught by a specific teacher with all details', async () => {
    // Create test teacher
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'John Doe',
        subjects: ['Math', 'Physics']
      })
      .returning()
      .execute();

    // Create test location
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Room A1',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Advanced Math',
        level: 'Advanced',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '09:00',
        end_time: '10:30',
        days: ['Senin', 'Rabu', 'Jumat'],
        max_capacity: 20
      })
      .returning()
      .execute();

    // Create test students
    const [student1] = await db.insert(studentsTable)
      .values({
        full_name: 'Alice Smith',
        phone_number: '081234567890',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    const [student2] = await db.insert(studentsTable)
      .values({
        full_name: 'Bob Johnson',
        phone_number: '081234567891',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    // Enroll students in the class
    await db.insert(studentClassEnrollmentsTable)
      .values([
        { student_id: student1.id, class_id: testClass.id },
        { student_id: student2.id, class_id: testClass.id }
      ])
      .execute();

    const input: GetClassesByTeacherInput = {
      teacher_id: teacher.id
    };

    const result = await getClassesByTeacher(input);

    // Verify results
    expect(result).toHaveLength(1);
    
    const classWithDetails = result[0];
    expect(classWithDetails.id).toEqual(testClass.id);
    expect(classWithDetails.name).toEqual('Advanced Math');
    expect(classWithDetails.level).toEqual('Advanced');
    expect(classWithDetails.teacher_id).toEqual(teacher.id);
    expect(classWithDetails.location_id).toEqual(location.id);
    expect(classWithDetails.start_time).toEqual('09:00:00');
    expect(classWithDetails.end_time).toEqual('10:30:00');
    expect(classWithDetails.days).toEqual(['Senin', 'Rabu', 'Jumat']);
    expect(classWithDetails.max_capacity).toEqual(20);
    expect(classWithDetails.created_at).toBeInstanceOf(Date);

    // Verify teacher details
    expect(classWithDetails.teacher).toBeDefined();
    expect(classWithDetails.teacher!.id).toEqual(teacher.id);
    expect(classWithDetails.teacher!.full_name).toEqual('John Doe');
    expect(classWithDetails.teacher!.subjects).toEqual(['Math', 'Physics']);
    expect(classWithDetails.teacher!.created_at).toBeInstanceOf(Date);

    // Verify location details
    expect(classWithDetails.location).toBeDefined();
    expect(classWithDetails.location!.id).toEqual(location.id);
    expect(classWithDetails.location!.name).toEqual('Room A1');
    expect(classWithDetails.location!.branch).toEqual('Sidoarjo');
    expect(classWithDetails.location!.created_at).toBeInstanceOf(Date);

    // Verify enrolled students
    expect(classWithDetails.enrolled_students).toHaveLength(2);
    expect(classWithDetails.enrolled_count).toEqual(2);
    
    const studentNames = classWithDetails.enrolled_students!.map(s => s.full_name).sort();
    expect(studentNames).toEqual(['Alice Smith', 'Bob Johnson']);
    
    // Verify student details
    const alice = classWithDetails.enrolled_students!.find(s => s.full_name === 'Alice Smith');
    expect(alice).toBeDefined();
    expect(alice!.phone_number).toEqual('081234567890');
    expect(alice!.email).toEqual('alice@example.com');
    expect(alice!.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple classes for teacher who teaches multiple classes', async () => {
    // Create test teacher
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Jane Teacher',
        subjects: ['English', 'Literature']
      })
      .returning()
      .execute();

    // Create test locations
    const [location1] = await db.insert(locationsTable)
      .values({
        name: 'Room B1',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const [location2] = await db.insert(locationsTable)
      .values({
        name: 'Room B2',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create multiple classes for the same teacher
    await db.insert(classesTable)
      .values([
        {
          name: 'Beginner English',
          level: 'Beginner',
          teacher_id: teacher.id,
          location_id: location1.id,
          start_time: '08:00',
          end_time: '09:30',
          days: ['Selasa', 'Kamis'],
          max_capacity: 15
        },
        {
          name: 'Intermediate Literature',
          level: 'Intermediate',
          teacher_id: teacher.id,
          location_id: location2.id,
          start_time: '10:00',
          end_time: '11:30',
          days: ['Senin', 'Rabu', 'Jumat'],
          max_capacity: 12
        }
      ])
      .execute();

    const input: GetClassesByTeacherInput = {
      teacher_id: teacher.id
    };

    const result = await getClassesByTeacher(input);

    // Verify results
    expect(result).toHaveLength(2);
    
    const classNames = result.map(c => c.name).sort();
    expect(classNames).toEqual(['Beginner English', 'Intermediate Literature']);
    
    // Both classes should have the same teacher
    result.forEach(classItem => {
      expect(classItem.teacher_id).toEqual(teacher.id);
      expect(classItem.teacher!.full_name).toEqual('Jane Teacher');
      expect(classItem.enrolled_count).toEqual(0); // No students enrolled
      expect(classItem.enrolled_students).toHaveLength(0);
    });
  });

  it('should return empty array for teacher with no classes', async () => {
    // Create test teacher with no classes
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Teacher No Classes',
        subjects: ['History']
      })
      .returning()
      .execute();

    const input: GetClassesByTeacherInput = {
      teacher_id: teacher.id
    };

    const result = await getClassesByTeacher(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error for non-existent teacher', async () => {
    const input: GetClassesByTeacherInput = {
      teacher_id: 99999 // Non-existent teacher ID
    };

    await expect(getClassesByTeacher(input)).rejects.toThrow(/Teacher with ID 99999 not found/);
  });

  it('should handle classes with no enrolled students correctly', async () => {
    // Create test teacher
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Empty Class Teacher',
        subjects: ['Chemistry']
      })
      .returning()
      .execute();

    // Create test location
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Lab C1',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create class with no enrollments
    await db.insert(classesTable)
      .values({
        name: 'Advanced Chemistry',
        level: 'Advanced',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '14:00',
        end_time: '15:30',
        days: ['Sabtu'],
        max_capacity: 10
      })
      .execute();

    const input: GetClassesByTeacherInput = {
      teacher_id: teacher.id
    };

    const result = await getClassesByTeacher(input);

    expect(result).toHaveLength(1);
    
    const classWithDetails = result[0];
    expect(classWithDetails.name).toEqual('Advanced Chemistry');
    expect(classWithDetails.enrolled_students).toHaveLength(0);
    expect(classWithDetails.enrolled_count).toEqual(0);
    expect(classWithDetails.teacher!.full_name).toEqual('Empty Class Teacher');
    expect(classWithDetails.location!.name).toEqual('Lab C1');
  });

  it('should properly format time fields from database', async () => {
    // Create test teacher and location
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Time Test Teacher',
        subjects: ['Music']
      })
      .returning()
      .execute();

    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Music Room',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create class with specific times
    await db.insert(classesTable)
      .values({
        name: 'Music Theory',
        level: 'Beginner',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '07:30',
        end_time: '08:45',
        days: ['Minggu'],
        max_capacity: 8
      })
      .execute();

    const input: GetClassesByTeacherInput = {
      teacher_id: teacher.id
    };

    const result = await getClassesByTeacher(input);

    expect(result).toHaveLength(1);
    
    const classItem = result[0];
    expect(classItem.start_time).toEqual('07:30:00'); // TIME fields include seconds
    expect(classItem.end_time).toEqual('08:45:00');
    expect(classItem.days).toEqual(['Minggu']);
  });
});