import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Location, 
  CreateLocationInput, 
  UpdateLocationInput
} from '../../../server/src/schema';

interface LocationManagementProps {
  locations: Location[];
  onDataChange: () => void;
}

export function LocationManagement({ locations, onDataChange }: LocationManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateLocationInput>({
    name: '',
    branch: 'Sidoarjo'
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateLocationInput>>({});

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      branch: 'Sidoarjo'
    });
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createLocation.mutate(createFormData);
      resetCreateForm();
      setIsCreateOpen(false);
      onDataChange();
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    setIsLoading(true);
    try {
      await trpc.updateLocation.mutate({
        id: editingLocation.id,
        ...editFormData
      });
      setIsEditOpen(false);
      setEditingLocation(null);
      setEditFormData({});
      onDataChange();
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteLocation.mutate({ id: locationId });
      onDataChange();
    } catch (error) {
      console.error('Failed to delete location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setEditFormData({
      name: location.name,
      branch: location.branch
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Location Management 📍</h2>
          <p className="text-gray-600">Manage rooms and locations in Sidoarjo branch</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Add a new room to the English Booster Sidoarjo branch
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateLocationInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Room A, Room B, Meeting Room"
                  required
                />
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={createFormData.branch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateLocationInput) => ({ ...prev, branch: e.target.value }))
                  }
                  placeholder="Branch location"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Room'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No rooms available yet. Add your first room!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location: Location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  {location.name}
                </CardTitle>
                <CardDescription>
                  Created: {location.created_at.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {location.branch}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(location)}
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
                        <AlertDialogTitle>Delete Room</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{location.name}"? This action cannot be undone and may affect existing classes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteLocation(location.id)}
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

      {/* Edit Location Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room information
            </DialogDescription>
          </DialogHeader>
          {editingLocation && (
            <form onSubmit={handleEditLocation} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Room Name</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateLocationInput>) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Room A, Room B, Meeting Room"
                />
              </div>

              <div>
                <Label htmlFor="edit_branch">Branch</Label>
                <Input
                  id="edit_branch"
                  value={editFormData.branch || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateLocationInput>) => ({ ...prev, branch: e.target.value }))
                  }
                  placeholder="Branch location"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Room'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}