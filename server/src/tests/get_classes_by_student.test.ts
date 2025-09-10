import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  studentsTable, 
  teachersTable, 
  locationsTable, 
  classesTable,
  studentClassEnrollmentsTable 
} from '../db/schema';
import { type GetClassesByStudentInput } from '../schema';
import { getClassesByStudent } from '../handlers/get_classes_by_student';

describe('getClassesByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return classes for enrolled student', async () => {
    // Create prerequisite data
    const [student] = await db.insert(studentsTable)
      .values({
        full_name: 'John Doe',
        phone_number: '081234567890',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Jane Smith',
        subjects: ['Mathematics', 'Physics']
      })
      .returning()
      .execute();

    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Room A',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    // Create classes
    const [class1, class2] = await db.insert(classesTable)
      .values([
        {
          name: 'Math Basics',
          level: 'Beginner',
          teacher_id: teacher.id,
          location_id: location.id,
          start_time: '09:00',
          end_time: '10:30',
          days: ['Senin', 'Rabu'],
          max_capacity: 15
        },
        {
          name: 'Physics Advanced',
          level: 'Advanced',
          teacher_id: teacher.id,
          location_id: location.id,
          start_time: '14:00',
          end_time: '15:30',
          days: ['Selasa', 'Kamis'],
          max_capacity: 10
        }
      ])
      .returning()
      .execute();

    // Enroll student in both classes
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: student.id,
          class_id: class1.id
        },
        {
          student_id: student.id,
          class_id: class2.id
        }
      ])
      .execute();

    const input: GetClassesByStudentInput = {
      student_id: student.id
    };

    const result = await getClassesByStudent(input);

    // Verify we get both classes
    expect(result).toHaveLength(2);

    // Find each class in results
    const mathClass = result.find(c => c.name === 'Math Basics');
    const physicsClass = result.find(c => c.name === 'Physics Advanced');

    expect(mathClass).toBeDefined();
    expect(physicsClass).toBeDefined();

    // Verify class details
    expect(mathClass!.level).toEqual('Beginner');
    expect(mathClass!.start_time).toEqual('09:00:00');
    expect(mathClass!.end_time).toEqual('10:30:00');
    expect(mathClass!.days).toEqual(['Senin', 'Rabu']);
    expect(mathClass!.max_capacity).toEqual(15);

    // Verify teacher details are included
    expect(mathClass!.teacher).toBeDefined();
    expect(mathClass!.teacher!.full_name).toEqual('Jane Smith');
    expect(mathClass!.teacher!.subjects).toEqual(['Mathematics', 'Physics']);

    // Verify location details are included
    expect(mathClass!.location).toBeDefined();
    expect(mathClass!.location!.name).toEqual('Room A');
    expect(mathClass!.location!.branch).toEqual('Sidoarjo');

    // Verify physics class details
    expect(physicsClass!.level).toEqual('Advanced');
    expect(physicsClass!.start_time).toEqual('14:00:00');
    expect(physicsClass!.end_time).toEqual('15:30:00');
    expect(physicsClass!.days).toEqual(['Selasa', 'Kamis']);
    expect(physicsClass!.max_capacity).toEqual(10);
  });

  it('should return empty array for student with no enrollments', async () => {
    // Create a student but don't enroll them in any classes
    const [student] = await db.insert(studentsTable)
      .values({
        full_name: 'Alice Johnson',
        phone_number: '081234567891',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    const input: GetClassesByStudentInput = {
      student_id: student.id
    };

    const result = await getClassesByStudent(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent student', async () => {
    const input: GetClassesByStudentInput = {
      student_id: 999999 // Non-existent student ID
    };

    const result = await getClassesByStudent(input);

    expect(result).toHaveLength(0);
  });

  it('should handle student enrolled in single class', async () => {
    // Create prerequisite data
    const [student] = await db.insert(studentsTable)
      .values({
        full_name: 'Bob Wilson',
        phone_number: '081234567892',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Dr. Brown',
        subjects: ['Chemistry']
      })
      .returning()
      .execute();

    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Lab B',
        branch: 'Surabaya'
      })
      .returning()
      .execute();

    const [singleClass] = await db.insert(classesTable)
      .values({
        name: 'Chemistry Intermediate',
        level: 'Intermediate',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '11:00',
        end_time: '12:30',
        days: ['Jumat'],
        max_capacity: 8
      })
      .returning()
      .execute();

    // Enroll student in single class
    await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: student.id,
        class_id: singleClass.id
      })
      .execute();

    const input: GetClassesByStudentInput = {
      student_id: student.id
    };

    const result = await getClassesByStudent(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Chemistry Intermediate');
    expect(result[0].level).toEqual('Intermediate');
    expect(result[0].days).toEqual(['Jumat']);
    expect(result[0].teacher!.full_name).toEqual('Dr. Brown');
    expect(result[0].location!.name).toEqual('Lab B');
    expect(result[0].location!.branch).toEqual('Surabaya');
  });

  it('should handle multiple students enrolled in same class correctly', async () => {
    // Create students
    const [student1, student2] = await db.insert(studentsTable)
      .values([
        {
          full_name: 'Student One',
          phone_number: '081111111111',
          email: 'student1@example.com'
        },
        {
          full_name: 'Student Two', 
          phone_number: '082222222222',
          email: 'student2@example.com'
        }
      ])
      .returning()
      .execute();

    // Create prerequisite data
    const [teacher] = await db.insert(teachersTable)
      .values({
        full_name: 'Ms. Green',
        subjects: ['English']
      })
      .returning()
      .execute();

    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Room C',
        branch: 'Sidoarjo'
      })
      .returning()
      .execute();

    const [sharedClass] = await db.insert(classesTable)
      .values({
        name: 'English Conversation',
        level: 'Intermediate',
        teacher_id: teacher.id,
        location_id: location.id,
        start_time: '16:00',
        end_time: '17:30',
        days: ['Sabtu'],
        max_capacity: 12
      })
      .returning()
      .execute();

    // Enroll both students in same class
    await db.insert(studentClassEnrollmentsTable)
      .values([
        {
          student_id: student1.id,
          class_id: sharedClass.id
        },
        {
          student_id: student2.id,
          class_id: sharedClass.id
        }
      ])
      .execute();

    // Test first student
    const input1: GetClassesByStudentInput = {
      student_id: student1.id
    };

    const result1 = await getClassesByStudent(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].name).toEqual('English Conversation');

    // Test second student - should get same class
    const input2: GetClassesByStudentInput = {
      student_id: student2.id
    };

    const result2 = await getClassesByStudent(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].name).toEqual('English Conversation');
    expect(result2[0].id).toEqual(result1[0].id); // Same class
  });
});