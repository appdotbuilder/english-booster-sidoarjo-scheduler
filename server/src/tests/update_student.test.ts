import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

describe('updateStudent', () => {
  let studentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test student first
    const result = await db.insert(studentsTable)
      .values({
        full_name: 'Original Student',
        phone_number: '08111111111',
        email: 'original@example.com'
      })
      .returning()
      .execute();

    studentId = result[0].id;
  });

  afterEach(resetDB);

  it('should update student full name only', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Updated Student Name'
    };

    const result = await updateStudent(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Updated Student Name');
    expect(result.phone_number).toEqual('08111111111'); // Should remain unchanged
    expect(result.email).toEqual('original@example.com'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update student phone number only', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId,
      phone_number: '08222222222'
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Original Student'); // Should remain unchanged
    expect(result.phone_number).toEqual('08222222222');
    expect(result.email).toEqual('original@example.com'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update student email only', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId,
      email: 'updated@example.com'
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Original Student'); // Should remain unchanged
    expect(result.phone_number).toEqual('08111111111'); // Should remain unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Completely Updated Student',
      phone_number: '08333333333',
      email: 'completely.updated@example.com'
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Completely Updated Student');
    expect(result.phone_number).toEqual('08333333333');
    expect(result.email).toEqual('completely.updated@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated student to database', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Database Verified Student',
      email: 'verified@example.com'
    };

    const result = await updateStudent(updateInput);

    // Query database directly to verify the update
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].full_name).toEqual('Database Verified Student');
    expect(students[0].phone_number).toEqual('08111111111'); // Unchanged
    expect(students[0].email).toEqual('verified@example.com');
  });

  it('should return current student when no fields are provided for update', async () => {
    const updateInput: UpdateStudentInput = {
      id: studentId
      // No update fields provided
    };

    const result = await updateStudent(updateInput);

    // Should return the original student data
    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Original Student');
    expect(result.phone_number).toEqual('08111111111');
    expect(result.email).toEqual('original@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when student does not exist', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999, // Non-existent ID
      full_name: 'Non-existent Student'
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/student with id 99999 not found/i);
  });

  it('should throw error when trying to update non-existent student with no fields', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999 // Non-existent ID
      // No update fields
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/student with id 99999 not found/i);
  });
});