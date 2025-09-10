import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Calendar, MapPin, BookOpen, Clock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { 
  Student, 
  Teacher, 
  Location, 
  ClassWithDetails
} from '../../server/src/schema';

import { ClassManagement } from './components/ClassManagement';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { LocationManagement } from './components/LocationManagement';
import { ClassSchedule } from './components/ClassSchedule';

function App() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [classData, studentData, teacherData, locationData] = await Promise.all([
          trpc.getClasses.query(),
          trpc.getStudents.query(),
          trpc.getTeachers.query(),
          trpc.getLocations.query()
        ]);
        
        setClasses(classData);
        setStudents(studentData);
        setTeachers(teacherData);
        setLocations(locationData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const [classData, studentData, teacherData, locationData] = await Promise.all([
        trpc.getClasses.query(),
        trpc.getStudents.query(),
        trpc.getTeachers.query(),
        trpc.getLocations.query()
      ]);
      
      setClasses(classData);
      setStudents(studentData);
      setTeachers(teacherData);
      setLocations(locationData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading English Booster...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">English Booster</h1>
                <p className="text-sm text-gray-500">Cabang Sidoarjo - Class Scheduling System</p>
              </div>
            </div>
            <Button onClick={refreshData} variant="outline" size="sm">
              🔄 Refresh Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{classes.length}</div>
                  <p className="text-xs text-blue-600">Active classes available</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{students.length}</div>
                  <p className="text-xs text-green-600">Registered students</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Total Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{teachers.length}</div>
                  <p className="text-xs text-purple-600">Available instructors</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Total Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{locations.length}</div>
                  <p className="text-xs text-orange-600">Available rooms</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Classes
                </CardTitle>
                <CardDescription>
                  Overview of the latest classes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No classes available yet. Create your first class!</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.slice(0, 6).map((classItem: ClassWithDetails) => (
                      <Card key={classItem.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{classItem.name}</CardTitle>
                            <Badge variant="secondary">{classItem.level}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span>{classItem.start_time} - {classItem.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{classItem.days.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span>{classItem.enrolled_count || 0}/{classItem.max_capacity} students</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <ClassManagement 
              classes={classes}
              teachers={teachers}
              locations={locations}
              onDataChange={refreshData}
            />
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <StudentManagement 
              students={students}
              classes={classes}
              onDataChange={refreshData}
            />
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <TeacherManagement 
              teachers={teachers}
              onDataChange={refreshData}
            />
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <LocationManagement 
              locations={locations}
              onDataChange={refreshData}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <ClassSchedule 
              classes={classes}
              teachers={teachers}
              locations={locations}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;