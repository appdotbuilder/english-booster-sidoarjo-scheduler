import { db } from '../db';
import { classesTable, teachersTable, locationsTable, studentsTable, studentClassEnrollmentsTable } from '../db/schema';
import { type ClassWithDetails } from '../schema';
import { eq, count, sql } from 'drizzle-orm';

export async function getClasses(): Promise<ClassWithDetails[]> {
  try {
    // First, get all classes with their teacher and location details
    const classesWithDetails = await db
      .select({
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
        teacher: {
          id: teachersTable.id,
          full_name: teachersTable.full_name,
          subjects: teachersTable.subjects,
          created_at: teachersTable.created_at,
        },
        location: {
          id: locationsTable.id,
          name: locationsTable.name,
          branch: locationsTable.branch,
          created_at: locationsTable.created_at,
        },
      })
      .from(classesTable)
      .innerJoin(teachersTable, eq(classesTable.teacher_id, teachersTable.id))
      .innerJoin(locationsTable, eq(classesTable.location_id, locationsTable.id))
      .execute();

    // Get enrollment counts for each class
    const enrollmentCounts = await db
      .select({
        class_id: studentClassEnrollmentsTable.class_id,
        count: count(studentClassEnrollmentsTable.student_id).as('enrolled_count'),
      })
      .from(studentClassEnrollmentsTable)
      .groupBy(studentClassEnrollmentsTable.class_id)
      .execute();

    // Create a map for quick lookup of enrollment counts
    const enrollmentCountMap = new Map(
      enrollmentCounts.map(item => [item.class_id, Number(item.count)])
    );

    // Get enrolled students for each class
    const enrolledStudents = await db
      .select({
        class_id: studentClassEnrollmentsTable.class_id,
        student: {
          id: studentsTable.id,
          full_name: studentsTable.full_name,
          phone_number: studentsTable.phone_number,
          email: studentsTable.email,
          created_at: studentsTable.created_at,
        },
      })
      .from(studentClassEnrollmentsTable)
      .innerJoin(studentsTable, eq(studentClassEnrollmentsTable.student_id, studentsTable.id))
      .execute();

    // Group enrolled students by class_id
    const studentsByClass = new Map();
    enrolledStudents.forEach(item => {
      if (!studentsByClass.has(item.class_id)) {
        studentsByClass.set(item.class_id, []);
      }
      studentsByClass.get(item.class_id).push(item.student);
    });

    // Combine all the data
    const result: ClassWithDetails[] = classesWithDetails.map(classData => ({
      id: classData.id,
      name: classData.name,
      level: classData.level,
      teacher_id: classData.teacher_id,
      location_id: classData.location_id,
      start_time: classData.start_time,
      end_time: classData.end_time,
      days: classData.days,
      max_capacity: classData.max_capacity,
      created_at: classData.created_at,
      teacher: classData.teacher,
      location: classData.location,
      enrolled_students: studentsByClass.get(classData.id) || [],
      enrolled_count: enrollmentCountMap.get(classData.id) || 0,
    }));

    return result;
  } catch (error) {
    console.error('Failed to get classes:', error);
    throw error;
  }
}