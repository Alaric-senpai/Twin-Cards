import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'expo-crypto';

/**
 * Flashcard Groups Service
 * Handles CRUD operations for flashcard groups and group memberships
 */

// Get all flashcard groups
export async function getAllFlashcardGroups() {
    try {
        const groups = await db().select().from(schema.flashcardGroups).all();
        return groups;
    } catch (error) {
        console.error('Error fetching flashcard groups:', error);
        return [];
    }
}

// Get flashcard groups by unit ID
export async function getFlashcardGroupsByUnitId(unitId: string) {
    try {
        const groups = await db()
            .select()
            .from(schema.flashcardGroups)
            .where(eq(schema.flashcardGroups.unitId, unitId))
            .all();
        return groups;
    } catch (error) {
        console.error('Error fetching flashcard groups by unit:', error);
        return [];
    }
}

// Get a single flashcard group by ID
export async function getFlashcardGroupById(id: string) {
    try {
        const group = await db()
            .select()
            .from(schema.flashcardGroups)
            .where(eq(schema.flashcardGroups.id, id))
            .get();
        return group;
    } catch (error) {
        console.error('Error fetching flashcard group:', error);
        return null;
    }
}

// Create a new flashcard group
export async function createFlashcardGroup(data: {
    unitId: string;
    name: string;
    description?: string;
    color?: string;
}) {
    try {
        const newGroup: schema.NewFlashcardGroup = {
            id: crypto.randomUUID(),
            unitId: data.unitId,
            name: data.name,
            description: data.description,
            color: data.color || '#FF6B6B',
        };

        await db().insert(schema.flashcardGroups).values(newGroup).run();
        return newGroup;
    } catch (error) {
        console.error('Error creating flashcard group:', error);
        return null;
    }
}

// Update a flashcard group
export async function updateFlashcardGroup(
    id: string,
    data: {
        name?: string;
        description?: string;
        color?: string;
    }
) {
    try {
        await db()
            .update(schema.flashcardGroups)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(schema.flashcardGroups.id, id))
            .run();
        return true;
    } catch (error) {
        console.error('Error updating flashcard group:', error);
        return false;
    }
}

// Delete a flashcard group
export async function deleteFlashcardGroup(id: string) {
    try {
        await db().delete(schema.flashcardGroups).where(eq(schema.flashcardGroups.id, id)).run();
        return true;
    } catch (error) {
        console.error('Error deleting flashcard group:', error);
        return false;
    }
}

// Add flashcard to group
export async function addFlashcardToGroup(groupId: string, flashcardId: string) {
    try {
        // Check if already exists
        const existing = await db()
            .select()
            .from(schema.flashcardGroupItems)
            .where(
                and(
                    eq(schema.flashcardGroupItems.groupId, groupId),
                    eq(schema.flashcardGroupItems.flashcardId, flashcardId)
                )
            )
            .get();

        if (existing) {
            return true; // Already in group
        }

        const newItem: schema.NewFlashcardGroupItem = {
            id: crypto.randomUUID(),
            groupId,
            flashcardId,
        };

        await db().insert(schema.flashcardGroupItems).values(newItem).run();
        return true;
    } catch (error) {
        console.error('Error adding flashcard to group:', error);
        return false;
    }
}

// Add multiple flashcards to group
export async function addFlashcardsToGroup(groupId: string, flashcardIds: string[]) {
    try {
        for (const flashcardId of flashcardIds) {
            await addFlashcardToGroup(groupId, flashcardId);
        }
        return true;
    } catch (error) {
        console.error('Error adding flashcards to group:', error);
        return false;
    }
}

// Remove flashcard from group
export async function removeFlashcardFromGroup(groupId: string, flashcardId: string) {
    try {
        await db()
            .delete(schema.flashcardGroupItems)
            .where(
                and(
                    eq(schema.flashcardGroupItems.groupId, groupId),
                    eq(schema.flashcardGroupItems.flashcardId, flashcardId)
                )
            )
            .run();
        return true;
    } catch (error) {
        console.error('Error removing flashcard from group:', error);
        return false;
    }
}

// Remove multiple flashcards from group
export async function removeFlashcardsFromGroup(groupId: string, flashcardIds: string[]) {
    try {
        for (const flashcardId of flashcardIds) {
            await removeFlashcardFromGroup(groupId, flashcardId);
        }
        return true;
    } catch (error) {
        console.error('Error removing flashcards from group:', error);
        return false;
    }
}

// Get all flashcards in a group
export async function getFlashcardsByGroupId(groupId: string) {
    try {
        const items = await db()
            .select({
                flashcard: schema.flashcards,
                addedAt: schema.flashcardGroupItems.addedAt,
            })
            .from(schema.flashcardGroupItems)
            .innerJoin(
                schema.flashcards,
                eq(schema.flashcardGroupItems.flashcardId, schema.flashcards.id)
            )
            .where(eq(schema.flashcardGroupItems.groupId, groupId))
            .all();

        return items.map((item) => ({
            ...item.flashcard,
            addedAt: item.addedAt,
        }));
    } catch (error) {
        console.error('Error fetching flashcards by group:', error);
        return [];
    }
}

// Get flashcard count for a group
export async function getFlashcardCountByGroupId(groupId: string) {
    try {
        const items = await db()
            .select()
            .from(schema.flashcardGroupItems)
            .where(eq(schema.flashcardGroupItems.groupId, groupId))
            .all();
        return items.length;
    } catch (error) {
        console.error('Error counting flashcards in group:', error);
        return 0;
    }
}
