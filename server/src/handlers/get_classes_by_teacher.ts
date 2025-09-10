import { db } from '../db';
import { classesTable, teachersTable, locationsTable, studentClassEnrollmentsTable, studentsTable } from '../db/schema';
import { type GetClassesByTeacherInput, type ClassWithDetails } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function getClassesByTeacher(input: GetClassesByTeacherInput): Promise<ClassWithDetails[]> {
  try {
    // First verify the teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.teacher_id))
      .execute();

    if (teacher.length === 0) {
      throw new Error(`Teacher with ID ${input.teacher_id} not found`);
    }

    // Query classes with teacher, location details, and enrollment count
    const results = await db.select({
      // Class fields
      id: classesTable.id,
      name: classesTable.name,
      level: classesTable.level,
      teacher_id: classesTable.teacher_id,
      location_id: classesTable.location_id,
      start_time: classesTable.start_time,
      end_time: classesTable.end_time,
      days: classesTable.days,
      max_capacity: classesTable.max_capacity,
      created_at: classesTable.created_at,
      // Teacher fields
      teacher_full_name: teachersTable.full_name,
      teacher_subjects: teachersTable.subjects,
      teacher_created_at: teachersTable.created_at,
      // Location fields
      location_name: locationsTable.name,
      location_branch: locationsTable.branch,
      location_created_at: locationsTable.created_at,
      // Enrollment count
      enrolled_count: sql<number>`CAST(COUNT(${studentClassEnrollmentsTable.id}) AS INTEGER)`.as('enrolled_count')
    })
    .from(classesTable)
    .innerJoin(teachersTable, eq(classesTable.teacher_id, teachersTable.id))
    .innerJoin(locationsTable, eq(classesTable.location_id, locationsTable.id))
    .leftJoin(studentClassEnrollmentsTable, eq(classesTable.id, studentClassEnrollmentsTable.class_id))
    .where(eq(classesTable.teacher_id, input.teacher_id))
    .groupBy(
      classesTable.id,
      classesTable.name,
      classesTable.level,
      classesTable.teacher_id,
      classesTable.location_id,
      classesTable.start_time,
      classesTable.end_time,
      classesTable.days,
      classesTable.max_capacity,
      classesTable.created_at,
      teachersTable.full_name,
      teachersTable.subjects,
      teachersTable.created_at,
      locationsTable.name,
      locationsTable.branch,
      locationsTable.created_at
    )
    .execute();

    // For each class, get enrolled students
    const classesWithDetails: ClassWithDetails[] = [];
    
    for (const result of results) {
      // Get enrolled students for this class
      const enrolledStudents = await db.select({
        id: studentsTable.id,
        full_name: studentsTable.full_name,
        phone_number: studentsTable.phone_number,
        email: studentsTable.email,
        created_at: studentsTable.created_at
      })
      .from(studentsTable)
      .innerJoin(studentClassEnrollmentsTable, eq(studentsTable.id, studentClassEnrollmentsTable.student_id))
      .where(eq(studentClassEnrollmentsTable.class_id, result.id))
      .execute();

      classesWithDetails.push({
        id: result.id,
        name: result.name,
        level: result.level,
        teacher_id: result.teacher_id,
        location_id: result.location_id,
        start_time: result.start_time,
        end_time: result.end_time,
        days: result.days,
        max_capacity: result.max_capacity,
        created_at: result.created_at,
        teacher: {
          id: result.teacher_id,
          full_name: result.teacher_full_name,
          subjects: result.teacher_subjects,
          created_at: result.teacher_created_at
        },
        location: {
          id: result.location_id,
          name: result.location_name,
          branch: result.location_branch,
          created_at: result.location_created_at
        },
        enrolled_students: enrolledStudents,
        enrolled_count: result.enrolled_count
      });
    }

    return classesWithDetails;
  } catch (error) {
    console.error('Failed to get classes by teacher:', error);
    throw error;
  }
}