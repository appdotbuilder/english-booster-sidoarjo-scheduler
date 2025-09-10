import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, Clock, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  ClassWithDetails, 
  Teacher, 
  Location, 
  CreateClassInput, 
  UpdateClassInput,
  Level,
  DayOfWeek
} from '../../../server/src/schema';

interface ClassManagementProps {
  classes: ClassWithDetails[];
  teachers: Teacher[];
  locations: Location[];
  onDataChange: () => void;
}

const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function ClassManagement({ classes, teachers, locations, onDataChange }: ClassManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateClassInput>({
    name: '',
    level: 'Beginner',
    teacher_id: 0,
    location_id: 0,
    start_time: '',
    end_time: '',
    days: [],
    max_capacity: 1
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateClassInput>>({});

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      level: 'Beginner',
      teacher_id: 0,
      location_id: 0,
      start_time: '',
      end_time: '',
      days: [],
      max_capacity: 1
    });
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createClass.mutate(createFormData);
      resetCreateForm();
      setIsCreateOpen(false);
      onDataChange();
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setIsLoading(true);
    try {
      await trpc.updateClass.mutate({
        id: editingClass.id,
        ...editFormData
      });
      setIsEditOpen(false);
      setEditingClass(null);
      setEditFormData({});
      onDataChange();
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteClass.mutate({ id: classId });
      onDataChange();
    } catch (error) {
      console.error('Failed to delete class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (classItem: ClassWithDetails) => {
    setEditingClass(classItem);
    setEditFormData({
      name: classItem.name,
      level: classItem.level,
      teacher_id: classItem.teacher_id,
      location_id: classItem.location_id,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      days: classItem.days,
      max_capacity: classItem.max_capacity
    });
    setIsEditOpen(true);
  };

  const handleDayToggle = (day: DayOfWeek, checked: boolean, isEdit = false) => {
    if (isEdit) {
      const currentDays = editFormData.days || [];
      setEditFormData((prev: Partial<UpdateClassInput>) => ({
        ...prev,
        days: checked 
          ? [...currentDays, day]
          : currentDays.filter((d: DayOfWeek) => d !== day)
      }));
    } else {
      setCreateFormData((prev: CreateClassInput) => ({
        ...prev,
        days: checked 
          ? [...prev.days, day]
          : prev.days.filter((d: DayOfWeek) => d !== day)
      }));
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Class Management 📚</h2>
          <p className="text-gray-600">Manage classes, schedules, and enrollment</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the English Booster system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., General English, IELTS Preparation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Select
                  value={createFormData.level}
                  onValueChange={(value: Level) =>
                    setCreateFormData((prev: CreateClassInput) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level: Level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="teacher">Teacher</Label>
                <Select
                  value={createFormData.teacher_id > 0 ? createFormData.teacher_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateClassInput) => ({ ...prev, teacher_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={createFormData.location_id > 0 ? createFormData.location_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateClassInput) => ({ ...prev, location_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={createFormData.start_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateClassInput) => ({ ...prev, start_time: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={createFormData.end_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateClassInput) => ({ ...prev, end_time: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Days</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DAYS.map((day: DayOfWeek) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={createFormData.days.includes(day)}
                        onCheckedChange={(checked: boolean) => handleDayToggle(day, checked)}
                      />
                      <Label htmlFor={day} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="max_capacity">Max Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  value={createFormData.max_capacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateClassInput) => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))
                  }
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Class'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes List */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No classes available yet. Create your first class!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem: ClassWithDetails) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <Badge className={getLevelColor(classItem.level)}>
                    {classItem.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{getTeacherName(classItem.teacher_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{getLocationName(classItem.location_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{classItem.start_time} - {classItem.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{classItem.days.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{classItem.enrolled_count || 0}/{classItem.max_capacity} students</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(classItem)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{classItem.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information
            </DialogDescription>
          </DialogHeader>
          {editingClass && (
            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Class Name</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., General English, IELTS Preparation"
                />
              </div>

              <div>
                <Label htmlFor="edit_level">Level</Label>
                <Select
                  value={editFormData.level || 'Beginner'}
                  onValueChange={(value: Level) =>
                    setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level: Level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_teacher">Teacher</Label>
                <Select
                  value={editFormData.teacher_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, teacher_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_location">Location</Label>
                <Select
                  value={editFormData.location_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, location_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_start_time">Start Time</Label>
                  <Input
                    id="edit_start_time"
                    type="time"
                    value={editFormData.start_time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, start_time: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_time">End Time</Label>
                  <Input
                    id="edit_end_time"
                    type="time"
                    value={editFormData.end_time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, end_time: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Days</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DAYS.map((day: DayOfWeek) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit_${day}`}
                        checked={(editFormData.days || []).includes(day)}
                        onCheckedChange={(checked: boolean) => handleDayToggle(day, checked, true)}
                      />
                      <Label htmlFor={`edit_${day}`} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit_max_capacity">Max Capacity</Label>
                <Input
                  id="edit_max_capacity"
                  type="number"
                  min="1"
                  value={editFormData.max_capacity || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateClassInput>) => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Class'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}