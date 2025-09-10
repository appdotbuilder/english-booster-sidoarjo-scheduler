import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createLocationInputSchema,
  updateLocationInputSchema,
  createTeacherInputSchema,
  updateTeacherInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  enrollStudentInputSchema,
  unenrollStudentInputSchema,
  getClassesByTeacherInputSchema,
  getClassesByStudentInputSchema,
  getAvailableClassesInputSchema
} from './schema';

// Import handlers
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { updateLocation } from './handlers/update_location';
import { deleteLocation } from './handlers/delete_location';
import { createTeacher } from './handlers/create_teacher';
import { getTeachers } from './handlers/get_teachers';
import { updateTeacher } from './handlers/update_teacher';
import { deleteTeacher } from './handlers/delete_teacher';
import { createStudent } from './handlers/create_student';
import { getStudents } from './handlers/get_students';
import { updateStudent } from './handlers/update_student';
import { deleteStudent } from './handlers/delete_student';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';
import { enrollStudent } from './handlers/enroll_student';
import { unenrollStudent } from './handlers/unenroll_student';
import { getClassesByTeacher } from './handlers/get_classes_by_teacher';
import { getClassesByStudent } from './handlers/get_classes_by_student';
import { getAvailableClasses } from './handlers/get_available_classes';
import { getStudentWithClasses } from './handlers/get_student_with_classes';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Location/Room management
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),
  
  getLocations: publicProcedure
    .query(() => getLocations()),
  
  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),
  
  deleteLocation: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteLocation(input.id)),

  // Teacher management
  createTeacher: publicProcedure
    .input(createTeacherInputSchema)
    .mutation(({ input }) => createTeacher(input)),
  
  getTeachers: publicProcedure
    .query(() => getTeachers()),
  
  updateTeacher: publicProcedure
    .input(updateTeacherInputSchema)
    .mutation(({ input }) => updateTeacher(input)),
  
  deleteTeacher: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTeacher(input.id)),

  // Student management
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  
  getStudents: publicProcedure
    .query(() => getStudents()),
  
  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),
  
  deleteStudent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteStudent(input.id)),

  // Class management
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  
  getClasses: publicProcedure
    .query(() => getClasses()),
  
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  
  deleteClass: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClass(input.id)),

  // Student enrollment management
  enrollStudent: publicProcedure
    .input(enrollStudentInputSchema)
    .mutation(({ input }) => enrollStudent(input)),
  
  unenrollStudent: publicProcedure
    .input(unenrollStudentInputSchema)
    .mutation(({ input }) => unenrollStudent(input)),

  // Role-based queries
  getClassesByTeacher: publicProcedure
    .input(getClassesByTeacherInputSchema)
    .query(({ input }) => getClassesByTeacher(input)),
  
  getClassesByStudent: publicProcedure
    .input(getClassesByStudentInputSchema)
    .query(({ input }) => getClassesByStudent(input)),
  
  getAvailableClasses: publicProcedure
    .input(getAvailableClassesInputSchema)
    .query(({ input }) => getAvailableClasses(input)),

  // Detailed queries
  getStudentWithClasses: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getStudentWithClasses(input.studentId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`English Booster Class Scheduling TRPC server listening at port: ${port}`);
}

start();