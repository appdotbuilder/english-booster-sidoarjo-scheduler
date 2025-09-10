import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type UpdateTeacherInput, type CreateTeacherInput } from '../schema';
import { updateTeacher } from '../handlers/update_teacher';
import { eq } from 'drizzle-orm';

// Helper function to create a test teacher
const createTestTeacher = async (teacherData: CreateTeacherInput) => {
  const result = await db.insert(teachersTable)
    .values({
      full_name: teacherData.full_name,
      subjects: teacherData.subjects
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update teacher full name', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'John Doe',
      subjects: ['English', 'Math']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      full_name: 'John Smith'
    };

    const result = await updateTeacher(updateInput);

    expect(result.id).toEqual(testTeacher.id);
    expect(result.full_name).toEqual('John Smith');
    expect(result.subjects).toEqual(['English', 'Math']); // Unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update teacher subjects', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'Jane Doe',
      subjects: ['History']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      subjects: ['Science', 'Physics', 'Chemistry']
    };

    const result = await updateTeacher(updateInput);

    expect(result.id).toEqual(testTeacher.id);
    expect(result.full_name).toEqual('Jane Doe'); // Unchanged
    expect(result.subjects).toEqual(['Science', 'Physics', 'Chemistry']);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both full name and subjects', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'Bob Johnson',
      subjects: ['Art']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      full_name: 'Robert Johnson',
      subjects: ['Art', 'Music', 'Drama']
    };

    const result = await updateTeacher(updateInput);

    expect(result.id).toEqual(testTeacher.id);
    expect(result.full_name).toEqual('Robert Johnson');
    expect(result.subjects).toEqual(['Art', 'Music', 'Drama']);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'Alice Cooper',
      subjects: ['Music']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      full_name: 'Alice Johnson',
      subjects: ['Music', 'Guitar', 'Piano']
    };

    await updateTeacher(updateInput);

    // Verify changes were saved to database
    const updatedTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, testTeacher.id))
      .execute();

    expect(updatedTeacher).toHaveLength(1);
    expect(updatedTeacher[0].full_name).toEqual('Alice Johnson');
    expect(updatedTeacher[0].subjects).toEqual(['Music', 'Guitar', 'Piano']);
  });

  it('should return existing record when no fields to update', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'Charlie Brown',
      subjects: ['Literature']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id
    };

    const result = await updateTeacher(updateInput);

    expect(result.id).toEqual(testTeacher.id);
    expect(result.full_name).toEqual('Charlie Brown');
    expect(result.subjects).toEqual(['Literature']);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when teacher does not exist', async () => {
    const updateInput: UpdateTeacherInput = {
      id: 99999,
      full_name: 'Non-existent Teacher'
    };

    await expect(updateTeacher(updateInput))
      .rejects
      .toThrow(/Teacher with id 99999 not found/i);
  });

  it('should throw error when teacher does not exist for no-update case', async () => {
    const updateInput: UpdateTeacherInput = {
      id: 99999
    };

    await expect(updateTeacher(updateInput))
      .rejects
      .toThrow(/Teacher with id 99999 not found/i);
  });

  it('should update with single subject', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'David Wilson',
      subjects: ['Math', 'Algebra']
    });

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      subjects: ['Physics']
    };

    const result = await updateTeacher(updateInput);

    expect(result.id).toEqual(testTeacher.id);
    expect(result.full_name).toEqual('David Wilson'); // Unchanged
    expect(result.subjects).toEqual(['Physics']);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should preserve created_at timestamp', async () => {
    // Create a test teacher first
    const testTeacher = await createTestTeacher({
      full_name: 'Emma Davis',
      subjects: ['Geography']
    });

    const originalCreatedAt = testTeacher.created_at;

    // Wait a moment to ensure timestamps would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTeacherInput = {
      id: testTeacher.id,
      full_name: 'Emma Wilson'
    };

    const result = await updateTeacher(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});