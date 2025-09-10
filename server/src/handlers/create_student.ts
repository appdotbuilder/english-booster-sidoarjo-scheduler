import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        full_name: input.full_name,
        phone_number: input.phone_number,
        email: input.email
      })
      .returning()
      .execute();

    // Return the created student
    const student = result[0];
    return {
      id: student.id,
      full_name: student.full_name,
      phone_number: student.phone_number,
      email: student.email,
      created_at: student.created_at
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};