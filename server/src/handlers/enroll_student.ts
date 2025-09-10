import { db } from '../db';
import { studentsTable, classesTable, studentClassEnrollmentsTable } from '../db/schema';
import { type EnrollStudentInput, type StudentClassEnrollment } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export async function enrollStudent(input: EnrollStudentInput): Promise<StudentClassEnrollment> {
  try {
    // Check if student exists
    const studentExists = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (studentExists.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    // Check if class exists and get class details
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found`);
    }

    const classData = classExists[0];

    // Check if student is already enrolled in this class
    const existingEnrollment = await db.select()
      .from(studentClassEnrollmentsTable)
      .where(and(
        eq(studentClassEnrollmentsTable.student_id, input.student_id),
        eq(studentClassEnrollmentsTable.class_id, input.class_id)
      ))
      .execute();

    if (existingEnrollment.length > 0) {
      throw new Error(`Student is already enrolled in class ${input.class_id}`);
    }

    // Check class capacity
    const enrollmentCount = await db.select({ count: count() })
      .from(studentClassEnrollmentsTable)
      .where(eq(studentClassEnrollmentsTable.class_id, input.class_id))
      .execute();

    const currentEnrollments = enrollmentCount[0].count;
    if (currentEnrollments >= classData.max_capacity) {
      throw new Error(`Class ${input.class_id} is at full capacity (${classData.max_capacity} students)`);
    }

    // Create the enrollment
    const result = await db.insert(studentClassEnrollmentsTable)
      .values({
        student_id: input.student_id,
        class_id: input.class_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student enrollment failed:', error);
    throw error;
  }
}