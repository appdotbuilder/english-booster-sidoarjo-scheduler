import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, GraduationCap, X } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Teacher, 
  CreateTeacherInput, 
  UpdateTeacherInput
} from '../../../server/src/schema';

interface TeacherManagementProps {
  teachers: Teacher[];
  onDataChange: () => void;
}

const COMMON_SUBJECTS = [
  'General English',
  'IELTS Preparation',
  'TOEFL Preparation',
  'Business English',
  'Conversational English',
  'Academic English',
  'English Grammar',
  'English Writing',
  'Speaking & Pronunciation'
];

export function TeacherManagement({ teachers, onDataChange }: TeacherManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateTeacherInput>({
    full_name: '',
    subjects: []
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateTeacherInput>>({});
  const [newSubject, setNewSubject] = useState('');
  const [editNewSubject, setEditNewSubject] = useState('');

  const resetCreateForm = () => {
    setCreateFormData({
      full_name: '',
      subjects: []
    });
    setNewSubject('');
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createTeacher.mutate(createFormData);
      resetCreateForm();
      setIsCreateOpen(false);
      onDataChange();
    } catch (error) {
      console.error('Failed to create teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsLoading(true);
    try {
      await trpc.updateTeacher.mutate({
        id: editingTeacher.id,
        ...editFormData
      });
      setIsEditOpen(false);
      setEditingTeacher(null);
      setEditFormData({});
      setEditNewSubject('');
      onDataChange();
    } catch (error) {
      console.error('Failed to update teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTeacher.mutate({ id: teacherId });
      onDataChange();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({
      full_name: teacher.full_name,
      subjects: [...teacher.subjects]
    });
    setEditNewSubject('');
    setIsEditOpen(true);
  };

  const addSubject = (subject: string, isEdit = false) => {
    if (!subject.trim()) return;

    if (isEdit) {
      const currentSubjects = editFormData.subjects || [];
      if (!currentSubjects.includes(subject)) {
        setEditFormData((prev: Partial<UpdateTeacherInput>) => ({
          ...prev,
          subjects: [...currentSubjects, subject]
        }));
      }
      setEditNewSubject('');
    } else {
      if (!createFormData.subjects.includes(subject)) {
        setCreateFormData((prev: CreateTeacherInput) => ({
          ...prev,
          subjects: [...prev.subjects, subject]
        }));
      }
      setNewSubject('');
    }
  };

  const removeSubject = (subject: string, isEdit = false) => {
    if (isEdit) {
      const currentSubjects = editFormData.subjects || [];
      setEditFormData((prev: Partial<UpdateTeacherInput>) => ({
        ...prev,
        subjects: currentSubjects.filter((s: string) => s !== subject)
      }));
    } else {
      setCreateFormData((prev: CreateTeacherInput) => ({
        ...prev,
        subjects: prev.subjects.filter((s: string) => s !== subject)
      }));
    }
  };

  const getSubjectColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Teacher Management 👩‍🏫</h2>
          <p className="text-gray-600">Manage teachers and their subjects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Teacher</DialogTitle>
              <DialogDescription>
                Add a new teacher to the English Booster system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={createFormData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTeacherInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <Label>Subjects</Label>
                <div className="space-y-2">
                  {/* Current subjects */}
                  <div className="flex flex-wrap gap-2">
                    {createFormData.subjects.map((subject: string, index: number) => (
                      <Badge key={subject} className={getSubjectColor(index)}>
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(subject)}
                          className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add subject input */}
                  <div className="flex gap-2">
                    <Input
                      value={newSubject}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubject(e.target.value)}
                      placeholder="Add a subject"
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubject(newSubject);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSubject(newSubject)}
                      disabled={!newSubject.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Common subjects */}
                  <div className="text-xs text-gray-500 mb-2">Quick add:</div>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_SUBJECTS.map((subject: string) => (
                      <Button
                        key={subject}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => addSubject(subject)}
                        disabled={createFormData.subjects.includes(subject)}
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || createFormData.subjects.length === 0}>
                  {isLoading ? 'Creating...' : 'Create Teacher'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No teachers registered yet. Add your first teacher!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher: Teacher) => (
            <Card key={teacher.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  {teacher.full_name}
                </CardTitle>
                <CardDescription>
                  Joined: {teacher.created_at.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Subjects:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teacher.subjects.map((subject: string, index: number) => (
                        <Badge key={subject} className={getSubjectColor(index)}>
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(teacher)}
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
                        <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{teacher.full_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTeacher(teacher.id)}
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

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information
            </DialogDescription>
          </DialogHeader>
          {editingTeacher && (
            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTeacherInput>) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label>Subjects</Label>
                <div className="space-y-2">
                  {/* Current subjects */}
                  <div className="flex flex-wrap gap-2">
                    {(editFormData.subjects || []).map((subject: string, index: number) => (
                      <Badge key={subject} className={getSubjectColor(index)}>
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(subject, true)}
                          className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add subject input */}
                  <div className="flex gap-2">
                    <Input
                      value={editNewSubject}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNewSubject(e.target.value)}
                      placeholder="Add a subject"
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubject(editNewSubject, true);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSubject(editNewSubject, true)}
                      disabled={!editNewSubject.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Common subjects */}
                  <div className="text-xs text-gray-500 mb-2">Quick add:</div>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_SUBJECTS.map((subject: string) => (
                      <Button
                        key={subject}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => addSubject(subject, true)}
                        disabled={(editFormData.subjects || []).includes(subject)}
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || (editFormData.subjects || []).length === 0}>
                  {isLoading ? 'Updating...' : 'Update Teacher'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}