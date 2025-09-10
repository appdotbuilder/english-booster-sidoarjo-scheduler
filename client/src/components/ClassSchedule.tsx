import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, MapPin, Users, GraduationCap, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { 
  ClassWithDetails, 
  Teacher, 
  Location, 
  Level,
  DayOfWeek
} from '../../../server/src/schema';

interface ClassScheduleProps {
  classes: ClassWithDetails[];
  teachers: Teacher[];
  locations: Location[];
}

const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];

export function ClassSchedule({ classes, teachers, locations }: ClassScheduleProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'all'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<number | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<number | 'all'>('all');

  // Filter classes based on selected filters
  const filteredClasses = useMemo(() => {
    return classes.filter((classItem: ClassWithDetails) => {
      if (selectedDay !== 'all' && !classItem.days.includes(selectedDay)) return false;
      if (selectedLevel !== 'all' && classItem.level !== selectedLevel) return false;
      if (selectedTeacher !== 'all' && classItem.teacher_id !== selectedTeacher) return false;
      if (selectedLocation !== 'all' && classItem.location_id !== selectedLocation) return false;
      return true;
    });
  }, [classes, selectedDay, selectedLevel, selectedTeacher, selectedLocation]);

  // Group classes by day for schedule view
  const classesGroupedByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, ClassWithDetails[]> = {
      'Senin': [],
      'Selasa': [],
      'Rabu': [],
      'Kamis': [],
      'Jumat': [],
      'Sabtu': [],
      'Minggu': []
    };

    filteredClasses.forEach((classItem: ClassWithDetails) => {
      classItem.days.forEach((day: DayOfWeek) => {
        grouped[day].push(classItem);
      });
    });

    // Sort classes within each day by start time
    Object.keys(grouped).forEach((day: string) => {
      grouped[day as DayOfWeek].sort((a: ClassWithDetails, b: ClassWithDetails) => {
        return a.start_time.localeCompare(b.start_time);
      });
    });

    return grouped;
  }, [filteredClasses]);

  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find((t: Teacher) => t.id === teacherId);
    return teacher?.full_name || 'Unknown Teacher';
  };

  const getLocationName = (locationId: number) => {
    const location = locations.find((l: Location) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getLevelColor = (level: Level) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSelectedDay('all');
    setSelectedLevel('all');
    setSelectedTeacher('all');
    setSelectedLocation('all');
  };

  const hasActiveFilters = selectedDay !== 'all' || selectedLevel !== 'all' || selectedTeacher !== 'all' || selectedLocation !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Class Schedule 🗓️</h2>
            <p className="text-gray-600">View all classes organized by day and time</p>
          </div>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Day</label>
                <Select value={selectedDay} onValueChange={(value: DayOfWeek | 'all') => setSelectedDay(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    {DAYS.map((day: DayOfWeek) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Level</label>
                <Select value={selectedLevel} onValueChange={(value: Level | 'all') => setSelectedLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {LEVELS.map((level: Level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Teacher</label>
                <Select value={selectedTeacher.toString()} onValueChange={(value: string) => setSelectedTeacher(value === 'all' ? 'all' : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>{teacher.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                <Select value={selectedLocation.toString()} onValueChange={(value: string) => setSelectedLocation(value === 'all' ? 'all' : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Grid */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters 
                ? 'No classes match your current filters. Try adjusting the filters above.' 
                : 'No classes scheduled yet. Create your first class!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day: DayOfWeek) => {
            const dayClasses = classesGroupedByDay[day];
            
            if (dayClasses.length === 0 && selectedDay !== 'all' && selectedDay !== day) return null;
            
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    {day}
                    <Badge variant="secondary" className="ml-2">
                      {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dayClasses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No classes scheduled for {day}</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dayClasses.map((classItem: ClassWithDetails) => (
                        <Card key={`${classItem.id}-${day}`} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{classItem.name}</CardTitle>
                              <Badge className={getLevelColor(classItem.level)}>
                                {classItem.level}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-blue-600">
                                  {classItem.start_time} - {classItem.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-3 w-3 text-gray-400" />
                                <span>{getTeacherName(classItem.teacher_id)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span>{getLocationName(classItem.location_id)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span>{classItem.enrolled_count || 0}/{classItem.max_capacity} students</span>
                              </div>
                              {classItem.days.length > 1 && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs">
                                    Also on: {classItem.days.filter((d: DayOfWeek) => d !== day).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredClasses.length}</div>
              <p className="text-sm text-gray-600">Total Classes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(classesGroupedByDay).reduce((acc: number, classes: ClassWithDetails[]) => 
                  acc + classes.reduce((dayAcc: number, classItem: ClassWithDetails) => 
                    dayAcc + (classItem.enrolled_count || 0), 0), 0)}
              </div>
              <p className="text-sm text-gray-600">Total Enrollments</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(classesGroupedByDay).filter((classes: ClassWithDetails[]) => classes.length > 0).length}
              </div>
              <p className="text-sm text-gray-600">Active Days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}