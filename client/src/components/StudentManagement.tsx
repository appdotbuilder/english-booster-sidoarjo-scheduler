import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, User, Mail, Phone, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Student, 
  ClassWithDetails,
  CreateStudentInput, 
  UpdateStudentInput
} from '../../../server/src/schema';

interface StudentManagementProps {
  students: Student[];
  classes: ClassWithDetails[];
  onDataChange: () => void;
}

export function StudentManagement({ students, classes, onDataChange }: StudentManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateStudentInput>({
    full_name: '',
    phone_number: '',
    email: ''
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateStudentInput>>({});
  const [selectedClassId, setSelectedClassId] = useState<number>(0);

  const resetCreateForm = () => {
    setCreateFormData({
      full_name: '',
      phone_number: '',
      email: ''
    });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createStudent.mutate(createFormData);
      resetCreateForm();
      setIsCreateOpen(false);
      onDataChange();
    } catch (error) {
      console.error('Failed to create student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsLoading(true);
    try {
      await trpc.updateStudent.mutate({
        id: editingStudent.id,
        ...editFormData
      });
      setIsEditOpen(false);
      setEditingStudent(null);
      setEditFormData({});
      onDataChange();
    } catch (error) {
      console.error('Failed to update student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteStudent.mutate({ id: studentId });
      onDataChange();
    } catch (error) {
      console.error('Failed to delete student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollingStudent || !selectedClassId) return;

    setIsLoading(true);
    try {
      await trpc.enrollStudent.mutate({
        student_id: enrollingStudent.id,
        class_id: selectedClassId
      });
      setIsEnrollOpen(false);
      setEnrollingStudent(null);
      setSelectedClassId(0);
      onDataChange();
    } catch (error) {
      console.error('Failed to enroll student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      phone_number: student.phone_number,
      email: student.email
    });
    setIsEditOpen(true);
  };

  const openEnrollDialog = (student: Student) => {
    setEnrollingStudent(student);
    setSelectedClassId(0);
    setIsEnrollOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Student Management 👨‍🎓</h2>
          <p className="text-gray-600">Manage student information and class enrollments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
              <DialogDescription>
                Add a new student to the English Booster system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={createFormData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStudentInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={createFormData.phone_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStudentInput) => ({ ...prev, phone_number: e.target.value }))
                  }
                  placeholder="e.g., +62812345678"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStudentInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="student@example.com"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No students registered yet. Add your first student!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student: Student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {student.full_name}
                </CardTitle>
                <CardDescription>
                  Joined: {student.created_at.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{student.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(student)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => openEnrollDialog(student)}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Enroll
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
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{student.full_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStudent(student.id)}
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

      {/* Edit Student Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateStudentInput>) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label htmlFor="edit_phone_number">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  value={editFormData.phone_number || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateStudentInput>) => ({ ...prev, phone_number: e.target.value }))
                  }
                  placeholder="e.g., +62812345678"
                />
              </div>

              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateStudentInput>) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="student@example.com"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Student'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>
              Enroll {enrollingStudent?.full_name} in a class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="class_select">Select Class</Label>
              <Select
                value={selectedClassId.toString()}
                onValueChange={(value: string) => setSelectedClassId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem: ClassWithDetails) => (
                    <SelectItem key={classItem.id} value={classItem.id.toString()}>
                      <div className="flex flex-col">
                        <span>{classItem.name}</span>
                        <span className="text-xs text-gray-500">
                          {classItem.level} • {classItem.days.join(', ')} • {classItem.start_time}-{classItem.end_time}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEnrollOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEnrollStudent} 
              disabled={isLoading || !selectedClassId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}