import { type UpdateLocationInput, type Location } from '../schema';

export async function updateLocation(input: UpdateLocationInput): Promise<Location> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is updating an existing location/room in the database.
    return Promise.resolve({
        id: input.id,
        name: input.name || 'Updated Location',
        branch: input.branch || 'Sidoarjo',
        created_at: new Date()
    } as Location);
}