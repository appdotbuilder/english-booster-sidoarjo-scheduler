import { db } from '../db';
import { classesTable, teachersTable, locationsTable, studentClassEnrollmentsTable } from '../db/schema';
import { type GetAvailableClassesInput, type ClassWithDetails } from '../schema';
import { eq, and, arrayContains, count, sql } from 'drizzle-orm';

export async function getAvailableClasses(input: GetAvailableClassesInput): Promise<ClassWithDetails[]> {
  try {
    // Build where conditions
    let whereClause = sql`1=1`; // Always true condition as base

    // Filter by level if provided
    if (input.level) {
      whereClause = sql`${whereClause} AND ${eq(classesTable.level, input.level)}`;
    }

    // Filter by day if provided
    if (input.day) {
      whereClause = sql`${whereClause} AND ${arrayContains(classesTable.days, [input.day])}`;
    }

    // Execute the query with proper structure
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
      enrolled_count: count(studentClassEnrollmentsTable.id)
    })
    .from(classesTable)
    .innerJoin(teachersTable, eq(classesTable.teacher_id, teachersTable.id))
    .innerJoin(locationsTable, eq(classesTable.location_id, locationsTable.id))
    .leftJoin(studentClassEnrollmentsTable, eq(classesTable.id, studentClassEnrollmentsTable.class_id))
    .where(whereClause)
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
      teachersTable.id,
      teachersTable.full_name,
      teachersTable.subjects,
      teachersTable.created_at,
      locationsTable.id,
      locationsTable.name,
      locationsTable.branch,
      locationsTable.created_at
    )
    .execute();

    // Filter out classes that are at full capacity and transform the results
    const availableClasses = results
      .filter(result => result.enrolled_count < result.max_capacity)
      .map(result => ({
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
        enrolled_count: result.enrolled_count
      }));

    return availableClasses;
  } catch (error) {
    console.error('Get available classes failed:', error);
    throw error;
  }
}