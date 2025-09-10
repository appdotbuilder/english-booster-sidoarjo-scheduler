import { db } from '../db';
import { studentsTable, studentClassEnrollmentsTable, classesTable, teachersTable, locationsTable } from '../db/schema';
import { type StudentWithClasses } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentWithClasses(studentId: number): Promise<StudentWithClasses | null> {
  try {
    // First, get the student
    const studentResult = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    if (studentResult.length === 0) {
      return null;
    }

    const student = studentResult[0];

    // Get all classes the student is enrolled in with full details
    const classesResult = await db.select({
      // Student enrollment info
      enrollment_id: studentClassEnrollmentsTable.id,
      enrolled_at: studentClassEnrollmentsTable.enrolled_at,
      // Class info
      class_id: classesTable.id,
      class_name: classesTable.name,
      level: classesTable.level,
      start_time: classesTable.start_time,
      end_time: classesTable.end_time,
      days: classesTable.days,
      max_capacity: classesTable.max_capacity,
      class_created_at: classesTable.created_at,
      teacher_id: classesTable.teacher_id,
      location_id: classesTable.location_id,
      // Teacher info
      teacher_full_name: teachersTable.full_name,
      teacher_subjects: teachersTable.subjects,
      teacher_created_at: teachersTable.created_at,
      // Location info
      location_name: locationsTable.name,
      location_branch: locationsTable.branch,
      location_created_at: locationsTable.created_at,
    })
      .from(studentClassEnrollmentsTable)
      .innerJoin(classesTable, eq(studentClassEnrollmentsTable.class_id, classesTable.id))
      .innerJoin(teachersTable, eq(classesTable.teacher_id, teachersTable.id))
      .innerJoin(locationsTable, eq(classesTable.location_id, locationsTable.id))
      .where(eq(studentClassEnrollmentsTable.student_id, studentId))
      .execute();

    // Transform the results to match the expected schema
    const enrolledClasses = classesResult.map(result => ({
      id: result.class_id,
      name: result.class_name,
      level: result.level,
      teacher_id: result.teacher_id,
      location_id: result.location_id,
      start_time: result.start_time,
      end_time: result.end_time,
      days: result.days,
      max_capacity: result.max_capacity,
      created_at: result.class_created_at,
      teacher: {
        id: result.teacher_id,
        full_name: result.teacher_full_name,
        subjects: result.teacher_subjects,
        created_at: result.teacher_created_at,
      },
      location: {
        id: result.location_id,
        name: result.location_name,
        branch: result.location_branch,
        created_at: result.location_created_at,
      },
    }));

    return {
      id: student.id,
      full_name: student.full_name,
      phone_number: student.phone_number,
      email: student.email,
      created_at: student.created_at,
      enrolled_classes: enrolledClasses,
    };
  } catch (error) {
    console.error('Failed to get student with classes:', error);
    throw error;
  }
}