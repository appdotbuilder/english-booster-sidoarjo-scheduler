import { db } from '../db';
import { 
  classesTable, 
  teachersTable, 
  locationsTable, 
  studentClassEnrollmentsTable 
} from '../db/schema';
import { type GetClassesByStudentInput, type ClassWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export async function getClassesByStudent(input: GetClassesByStudentInput): Promise<ClassWithDetails[]> {
  try {
    // Query classes enrolled by the student with teacher and location details
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
      // Teacher details
      teacher: {
        id: teachersTable.id,
        full_name: teachersTable.full_name,
        subjects: teachersTable.subjects,
        created_at: teachersTable.created_at
      },
      // Location details
      location: {
        id: locationsTable.id,
        name: locationsTable.name,
        branch: locationsTable.branch,
        created_at: locationsTable.created_at
      }
    })
    .from(studentClassEnrollmentsTable)
    .innerJoin(classesTable, eq(studentClassEnrollmentsTable.class_id, classesTable.id))
    .innerJoin(teachersTable, eq(classesTable.teacher_id, teachersTable.id))
    .innerJoin(locationsTable, eq(classesTable.location_id, locationsTable.id))
    .where(eq(studentClassEnrollmentsTable.student_id, input.student_id))
    .execute();

    // Transform the results to match ClassWithDetails schema
    return results.map(result => ({
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
      teacher: result.teacher,
      location: result.location
    }));
  } catch (error) {
    console.error('Failed to fetch classes by student:', error);
    throw error;
  }
}