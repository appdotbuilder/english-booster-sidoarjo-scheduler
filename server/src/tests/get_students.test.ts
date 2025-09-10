import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { getStudents } from '../handlers/get_students';

// Test data
const testStudent1: CreateStudentInput = {
  full_name: 'John Doe',
  phone_number: '08123456789',
  email: 'john.doe@example.com'
};

const testStudent2: CreateStudentInput = {
  full_name: 'Jane Smith',
  phone_number: '08987654321',
  email: 'jane.smith@example.com'
};

const testStudent3: CreateStudentInput = {
  full_name: 'Ahmad Rahman',
  phone_number: '08555666777',
  email: 'ahmad.rahman@example.com'
};

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getStudents();

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should return all students when students exist', async () => {
    // Create test students
    await db.insert(studentsTable)
      .values([testStudent1, testStudent2, testStudent3])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(student => {
      expect(student.id).toBeDefined();
      expect(typeof student.id).toBe('number');
      expect(student.full_name).toBeDefined();
      expect(typeof student.full_name).toBe('string');
      expect(student.phone_number).toBeDefined();
      expect(typeof student.phone_number).toBe('string');
      expect(student.email).toBeDefined();
      expect(typeof student.email).toBe('string');
      expect(student.created_at).toBeInstanceOf(Date);
    });

    // Verify specific student data
    const johnDoe = result.find(s => s.full_name === 'John Doe');
    expect(johnDoe).toBeDefined();
    expect(johnDoe!.phone_number).toEqual('08123456789');
    expect(johnDoe!.email).toEqual('john.doe@example.com');

    const janeSmith = result.find(s => s.full_name === 'Jane Smith');
    expect(janeSmith).toBeDefined();
    expect(janeSmith!.phone_number).toEqual('08987654321');
    expect(janeSmith!.email).toEqual('jane.smith@example.com');
  });

  it('should return single student when only one exists', async () => {
    // Create single test student
    await db.insert(studentsTable)
      .values(testStudent1)
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('John Doe');
    expect(result[0].phone_number).toEqual('08123456789');
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return students in database insertion order', async () => {
    // Insert students in specific order
    await db.insert(studentsTable)
      .values(testStudent1)
      .execute();

    await db.insert(studentsTable)
      .values(testStudent2)
      .execute();

    await db.insert(studentsTable)
      .values(testStudent3)
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    // Students should be returned in order of their IDs (insertion order)
    expect(result[0].id < result[1].id).toBe(true);
    expect(result[1].id < result[2].id).toBe(true);
    expect(result[0].full_name).toEqual('John Doe');
    expect(result[1].full_name).toEqual('Jane Smith');
    expect(result[2].full_name).toEqual('Ahmad Rahman');
  });

  it('should handle students with various character sets', async () => {
    const internationalStudent: CreateStudentInput = {
      full_name: 'José María González',
      phone_number: '+34123456789',
      email: 'jose.maria@universidad.es'
    };

    const indonesianStudent: CreateStudentInput = {
      full_name: 'Siti Nurhaliza',
      phone_number: '08123456789',
      email: 'siti.nurhaliza@gmail.com'
    };

    await db.insert(studentsTable)
      .values([internationalStudent, indonesianStudent])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(2);
    
    const joseStudent = result.find(s => s.full_name === 'José María González');
    expect(joseStudent).toBeDefined();
    expect(joseStudent!.phone_number).toEqual('+34123456789');
    expect(joseStudent!.email).toEqual('jose.maria@universidad.es');

    const sitiStudent = result.find(s => s.full_name === 'Siti Nurhaliza');
    expect(sitiStudent).toBeDefined();
    expect(sitiStudent!.phone_number).toEqual('08123456789');
    expect(sitiStudent!.email).toEqual('siti.nurhaliza@gmail.com');
  });

  it('should return consistent data structure across multiple calls', async () => {
    // Create test student
    await db.insert(studentsTable)
      .values(testStudent1)
      .execute();

    const result1 = await getStudents();
    const result2 = await getStudents();

    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    
    // Verify same student data in both calls
    expect(result1[0].id).toEqual(result2[0].id);
    expect(result1[0].full_name).toEqual(result2[0].full_name);
    expect(result1[0].phone_number).toEqual(result2[0].phone_number);
    expect(result1[0].email).toEqual(result2[0].email);
    expect(result1[0].created_at).toEqual(result2[0].created_at);
  });
});