import { type CreateLocationInput, type Location } from '../schema';

export async function createLocation(input: CreateLocationInput): Promise<Location> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new location/room and persisting it in the database.
    return Promise.resolve({
        id: 0, // Placeholder ID
        name: input.name,
        branch: input.branch || 'Sidoarjo',
        created_at: new Date()
    } as Location);
}