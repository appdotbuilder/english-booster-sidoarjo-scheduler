import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateStudentInput = {
  full_name: 'John Doe',
  phone_number: '+62812345678',
  email: 'john.doe@example.com'
};

const testInput2: CreateStudentInput = {
  full_name: 'Jane Smith',
  phone_number: '+62887654321',
  email: 'jane.smith@example.com'
};

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student with all required fields', async () => {
    const result = await createStudent(testInput);

    // Verify all fields are correctly set
    expect(result.full_name).toEqual('John Doe');
    expect(result.phone_number).toEqual('+62812345678');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    const result = await createStudent(testInput);

    // Query the database to verify the student was saved
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].full_name).toEqual('John Doe');
    expect(students[0].phone_number).toEqual('+62812345678');
    expect(students[0].email).toEqual('john.doe@example.com');
    expect(students[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple students with unique IDs', async () => {
    const student1 = await createStudent(testInput);
    const student2 = await createStudent(testInput2);

    // Verify both students have different IDs
    expect(student1.id).not.toEqual(student2.id);
    expect(student1.full_name).toEqual('John Doe');
    expect(student2.full_name).toEqual('Jane Smith');

    // Verify both are saved in database
    const allStudents = await db.select().from(studentsTable).execute();
    expect(allStudents).toHaveLength(2);
  });

  it('should handle student with minimal valid data', async () => {
    const minimalInput: CreateStudentInput = {
      full_name: 'A',
      phone_number: '1',
      email: 'a@b.co'
    };

    const result = await createStudent(minimalInput);

    expect(result.full_name).toEqual('A');
    expect(result.phone_number).toEqual('1');
    expect(result.email).toEqual('a@b.co');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create student with Indonesian phone number format', async () => {
    const indonesianInput: CreateStudentInput = {
      full_name: 'Siti Nurhaliza',
      phone_number: '0812-3456-7890',
      email: 'siti.nurhaliza@gmail.com'
    };

    const result = await createStudent(indonesianInput);

    expect(result.full_name).toEqual('Siti Nurhaliza');
    expect(result.phone_number).toEqual('0812-3456-7890');
    expect(result.email).toEqual('siti.nurhaliza@gmail.com');

    // Verify in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students[0].phone_number).toEqual('0812-3456-7890');
  });

  it('should preserve created_at timestamp accuracy', async () => {
    const beforeCreate = new Date();
    const result = await createStudent(testInput);
    const afterCreate = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Verify the timestamp in database matches
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});