import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStudent = async (input: UpdateStudentInput): Promise<Student> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: Partial<{
      full_name: string;
      phone_number: string;
      email: string;
    }> = {};

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }

    if (input.phone_number !== undefined) {
      updateData.phone_number = input.phone_number;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    // If no fields to update, just return the current student
    if (Object.keys(updateData).length === 0) {
      const existingStudent = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, input.id))
        .execute();

      if (existingStudent.length === 0) {
        throw new Error(`Student with ID ${input.id} not found`);
      }

      return existingStudent[0];
    }

    // Update the student record
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};