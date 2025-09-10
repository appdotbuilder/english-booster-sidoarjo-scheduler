import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput } from '../schema';
import { createTeacher } from '../handlers/create_teacher';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTeacherInput = {
  full_name: 'John Smith',
  subjects: ['Mathematics', 'Physics']
};

describe('createTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a teacher', async () => {
    const result = await createTeacher(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('John Smith');
    expect(result.subjects).toEqual(['Mathematics', 'Physics']);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save teacher to database', async () => {
    const result = await createTeacher(testInput);

    // Query using proper drizzle syntax
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers).toHaveLength(1);
    expect(teachers[0].full_name).toEqual('John Smith');
    expect(teachers[0].subjects).toEqual(['Mathematics', 'Physics']);
    expect(teachers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create teacher with single subject', async () => {
    const singleSubjectInput: CreateTeacherInput = {
      full_name: 'Jane Doe',
      subjects: ['English']
    };

    const result = await createTeacher(singleSubjectInput);

    expect(result.full_name).toEqual('Jane Doe');
    expect(result.subjects).toEqual(['English']);
    expect(result.subjects).toHaveLength(1);
  });

  it('should create teacher with multiple subjects', async () => {
    const multiSubjectInput: CreateTeacherInput = {
      full_name: 'Bob Wilson',
      subjects: ['Chemistry', 'Biology', 'Science', 'Laboratory']
    };

    const result = await createTeacher(multiSubjectInput);

    expect(result.full_name).toEqual('Bob Wilson');
    expect(result.subjects).toEqual(['Chemistry', 'Biology', 'Science', 'Laboratory']);
    expect(result.subjects).toHaveLength(4);

    // Verify in database
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers[0].subjects).toEqual(['Chemistry', 'Biology', 'Science', 'Laboratory']);
  });

  it('should create multiple teachers independently', async () => {
    const teacher1Input: CreateTeacherInput = {
      full_name: 'Alice Johnson',
      subjects: ['History', 'Geography']
    };

    const teacher2Input: CreateTeacherInput = {
      full_name: 'Charlie Brown',
      subjects: ['Art', 'Music']
    };

    const result1 = await createTeacher(teacher1Input);
    const result2 = await createTeacher(teacher2Input);

    // Verify both teachers have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.full_name).toEqual('Alice Johnson');
    expect(result2.full_name).toEqual('Charlie Brown');

    // Verify both exist in database
    const allTeachers = await db.select()
      .from(teachersTable)
      .execute();

    expect(allTeachers).toHaveLength(2);
    
    const teacherNames = allTeachers.map(t => t.full_name).sort();
    expect(teacherNames).toEqual(['Alice Johnson', 'Charlie Brown']);
  });

  it('should handle special characters in names and subjects', async () => {
    const specialCharsInput: CreateTeacherInput = {
      full_name: 'María José García-López',
      subjects: ['Español (Lengua)', 'Matemáticas Básicas', 'Ciências Sociais']
    };

    const result = await createTeacher(specialCharsInput);

    expect(result.full_name).toEqual('María José García-López');
    expect(result.subjects).toEqual(['Español (Lengua)', 'Matemáticas Básicas', 'Ciências Sociais']);

    // Verify in database
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers[0].full_name).toEqual('María José García-López');
    expect(teachers[0].subjects).toEqual(['Español (Lengua)', 'Matemáticas Básicas', 'Ciências Sociais']);
  });
});