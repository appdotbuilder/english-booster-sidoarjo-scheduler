import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput } from '../schema';
import { getTeachers } from '../handlers/get_teachers';

describe('getTeachers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no teachers exist', async () => {
    const result = await getTeachers();
    expect(result).toEqual([]);
  });

  it('should return all teachers', async () => {
    // Create test teachers
    const testTeacher1: CreateTeacherInput = {
      full_name: 'John Smith',
      subjects: ['Mathematics', 'Physics']
    };

    const testTeacher2: CreateTeacherInput = {
      full_name: 'Jane Doe',
      subjects: ['English', 'Literature']
    };

    const testTeacher3: CreateTeacherInput = {
      full_name: 'Bob Johnson',
      subjects: ['Chemistry']
    };

    await db.insert(teachersTable)
      .values([
        {
          full_name: testTeacher1.full_name,
          subjects: testTeacher1.subjects
        },
        {
          full_name: testTeacher2.full_name,
          subjects: testTeacher2.subjects
        },
        {
          full_name: testTeacher3.full_name,
          subjects: testTeacher3.subjects
        }
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(3);
    
    // Verify all teachers are returned with correct fields
    expect(result[0].full_name).toEqual('John Smith');
    expect(result[0].subjects).toEqual(['Mathematics', 'Physics']);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].full_name).toEqual('Jane Doe');
    expect(result[1].subjects).toEqual(['English', 'Literature']);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    expect(result[2].full_name).toEqual('Bob Johnson');
    expect(result[2].subjects).toEqual(['Chemistry']);
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return teachers with single subject', async () => {
    await db.insert(teachersTable)
      .values({
        full_name: 'Alice Wilson',
        subjects: ['Art']
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Alice Wilson');
    expect(result[0].subjects).toEqual(['Art']);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return teachers with multiple subjects correctly', async () => {
    const multipleSubjects = ['Math', 'Science', 'Physics', 'Chemistry', 'Biology'];
    
    await db.insert(teachersTable)
      .values({
        full_name: 'Dr. Multiple',
        subjects: multipleSubjects
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Dr. Multiple');
    expect(result[0].subjects).toEqual(multipleSubjects);
    expect(result[0].subjects).toHaveLength(5);
  });

  it('should return teachers ordered by creation time', async () => {
    // Insert teachers with slight delays to ensure different timestamps
    await db.insert(teachersTable)
      .values({
        full_name: 'First Teacher',
        subjects: ['Subject A']
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(teachersTable)
      .values({
        full_name: 'Second Teacher',
        subjects: ['Subject B']
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toEqual('First Teacher');
    expect(result[1].full_name).toEqual('Second Teacher');
    
    // Verify timestamps are in chronological order
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });

  it('should handle teachers with same name but different subjects', async () => {
    await db.insert(teachersTable)
      .values([
        {
          full_name: 'John Smith',
          subjects: ['Mathematics']
        },
        {
          full_name: 'John Smith',
          subjects: ['English']
        }
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(2);
    
    const mathTeacher = result.find(t => t.subjects.includes('Mathematics'));
    const englishTeacher = result.find(t => t.subjects.includes('English'));
    
    expect(mathTeacher).toBeDefined();
    expect(englishTeacher).toBeDefined();
    expect(mathTeacher!.id).not.toEqual(englishTeacher!.id);
  });
});