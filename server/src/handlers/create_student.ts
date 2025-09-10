import { type CreateStudentInput, type Student } from '../schema';

export async function createStudent(input: CreateStudentInput): Promise<Student> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new student and persisting them in the database.
    return Promise.resolve({
        id: 0, // Placeholder ID
        full_name: input.full_name,
        phone_number: input.phone_number,
        email: input.email,
        created_at: new Date()
    } as Student);
}