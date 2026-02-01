import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import * as crypto from 'expo-crypto';
import { getSettings } from './settings.service';

/**
 * Study Queue Service
 * Handles CRUD operations for study queues (saved study sessions)
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Create a study session from a unit
 */
export async function createStudySessionFromUnit(
    unitId: string,
    unitTitle: string
): Promise<string> {
    try {
        // Get settings
        const settings = await getSettings();

        // Fetch all flashcards from the unit
        const flashcards = await db()
            .select()
            .from(schema.flashcards)
            .where(eq(schema.flashcards.unitId, unitId))
            .all();

        if (flashcards.length === 0) {
            throw new Error('No flashcards found in this unit');
        }

        // Shuffle if enabled
        let selectedFlashcards = flashcards;
        if (settings.shuffle_enabled) {
            selectedFlashcards = shuffleArray(flashcards);
        }

        // Select subset based on cards_per_session
        const cardCount = Math.min(settings.cards_per_session, selectedFlashcards.length);
        const finalFlashcards = selectedFlashcards.slice(0, cardCount);

        // Generate study queue name with date
        const date = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        const queueName = `${unitTitle} - ${date}`;

        // Create study queue
        const queueId = crypto.randomUUID();
        const flashcardIds = finalFlashcards.map((f) => f.id);

        await db()
            .insert(schema.studyQueue)
            .values({
                id: queueId,
                name: queueName,
                description: `Study session with ${cardCount} cards from ${unitTitle}`,
                flashcardIds: JSON.stringify(flashcardIds),
                currentIndex: 0,
                completed: false,
            })
            .run();

        return queueId;
    } catch (error) {
        console.error('Error creating study session from unit:', error);
        throw error;
    }
}

// Get all study queues
export async function getAllStudyQueues() {
    try {
        const queues = await db().select().from(schema.studyQueue).all();
        return queues;
    } catch (error) {
        console.error('Error fetching study queues:', error);
        return [];
    }
}

// Get active (incomplete) study queues
export async function getActiveStudyQueues() {
    try {
        const queues = await db()
            .select()
            .from(schema.studyQueue)
            .where(eq(schema.studyQueue.completed, false))
            .all();
        return queues;
    } catch (error) {
        console.error('Error fetching active study queues:', error);
        return [];
    }
}

// Get a single study queue by ID
export async function getStudyQueueById(id: string) {
    try {
        const queue = await db()
            .select()
            .from(schema.studyQueue)
            .where(eq(schema.studyQueue.id, id))
            .get();
        return queue;
    } catch (error) {
        console.error('Error fetching study queue:', error);
        return null;
    }
}

// Create a new study queue
export async function createStudyQueue(data: {
    name: string;
    description?: string;
    flashcardIds: string[];
}) {
    try {
        const newQueue: schema.NewStudyQueue = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            flashcardIds: JSON.stringify(data.flashcardIds),
            currentIndex: 0,
            completed: false,
        };

        await db().insert(schema.studyQueue).values(newQueue).run();
        return newQueue;
    } catch (error) {
        console.error('Error creating study queue:', error);
        return null;
    }
}

// Update study queue progress
export async function updateStudyQueueProgress(id: string, currentIndex: number) {
    try {
        await db()
            .update(schema.studyQueue)
            .set({
                currentIndex,
                lastAccessedAt: new Date(),
            })
            .where(eq(schema.studyQueue.id, id))
            .run();
        return true;
    } catch (error) {
        console.error('Error updating study queue progress:', error);
        return false;
    }
}

// Mark study queue as completed
export async function markStudyQueueCompleted(id: string) {
    try {
        await db()
            .update(schema.studyQueue)
            .set({
                completed: true,
                lastAccessedAt: new Date(),
            })
            .where(eq(schema.studyQueue.id, id))
            .run();
        return true;
    } catch (error) {
        console.error('Error marking study queue as completed:', error);
        return false;
    }
}

// Reset study queue (start over)
export async function resetStudyQueue(id: string) {
    try {
        await db()
            .update(schema.studyQueue)
            .set({
                currentIndex: 0,
                completed: false,
                lastAccessedAt: new Date(),
            })
            .where(eq(schema.studyQueue.id, id))
            .run();
        return true;
    } catch (error) {
        console.error('Error resetting study queue:', error);
        return false;
    }
}

// Delete a study queue
export async function deleteStudyQueue(id: string) {
    try {
        await db().delete(schema.studyQueue).where(eq(schema.studyQueue.id, id)).run();
        return true;
    } catch (error) {
        console.error('Error deleting study queue:', error);
        return false;
    }
}

// Get flashcard IDs from queue
export function parseFlashcardIds(queue: schema.StudyQueue): string[] {
    try {
        return JSON.parse(queue.flashcardIds);
    } catch (error) {
        console.error('Error parsing flashcard IDs:', error);
        return [];
    }
}

// Get progress percentage
export function getQueueProgress(queue: schema.StudyQueue): number {
    const ids = parseFlashcardIds(queue);
    if (ids.length === 0) return 0;
    return Math.round(((queue.currentIndex || 0) / ids.length) * 100);
}
