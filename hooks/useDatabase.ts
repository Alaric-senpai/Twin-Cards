import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { generateId } from '@/utils/ids';
import React from 'react';

// ============= UNITS =============

export function useUnits() {
    const { data: units, error } = useLiveQuery(
        db().select().from(schema.units).orderBy(desc(schema.units.createdAt))
    );

    return {
        units: units || [],
        error,
        isLoading: units === undefined && !error,
    };
}

export function useUnit(id: string) {
    const [isFirstLoad, setIsFirstLoad] = React.useState(true);
    const { data, error } = useLiveQuery(
        db().select().from(schema.units).where(eq(schema.units.id, id))
    );

    React.useEffect(() => {
        if (data !== undefined) {
            setIsFirstLoad(false);
        }
    }, [data]);

    return {
        unit: data?.[0],
        error,
        isLoading: isFirstLoad && data === undefined,
    };
}

export async function createUnit(data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
}) {
    const id = generateId();
    await db().insert(schema.units).values({
        id,
        ...data,
    });
    return id;
}

export async function updateUnit(
    id: string,
    data: Partial<{
        title: string;
        description: string;
        color: string;
        icon: string;
    }>
) {
    await db()
        .update(schema.units)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(schema.units.id, id));
}

export async function deleteUnit(id: string) {
    await db().delete(schema.units).where(eq(schema.units.id, id));
}

// ============= FLASHCARDS =============

export function useFlashcards(unitId: string) {
    const { data: flashcards, error } = useLiveQuery(
        db()
            .select()
            .from(schema.flashcards)
            .where(eq(schema.flashcards.unitId, unitId))
            .orderBy(desc(schema.flashcards.createdAt))
    );

    return {
        flashcards: flashcards || [],
        error,
        isLoading: flashcards === undefined && !error,
    };
}

export function useFlashcard(id: string) {
    const { data, error } = useLiveQuery(
        db().select().from(schema.flashcards).where(eq(schema.flashcards.id, id))
    );

    return {
        flashcard: data?.[0],
        error,
        isLoading: data === undefined && !error,
    };
}

export async function createFlashcard(data: {
    unitId: string;
    front: string;
    back: string;
    hint?: string | null;
}) {
    const id = generateId();
    await db().insert(schema.flashcards).values({
        id,
        ...data,
    });
    return id;
}

export async function createFlashcards(
    cards: {
        unitId: string;
        front: string;
        back: string;
        hint?: string | null;
    }[]
) {
    if (cards.length === 0) return [];

    const insertions = cards.map((card) => ({
        id: generateId(),
        ...card,
    }));

    await db().insert(schema.flashcards).values(insertions);
    return insertions.map((i) => i.id);
}

export async function updateFlashcard(
    id: string,
    data: Partial<{
        front: string;
        back: string;
        hint: string;
        difficulty: number;
        lastReviewed: Date;
        nextReview: Date;
        reviewCount: number;
    }>
) {
    await db().update(schema.flashcards).set(data).where(eq(schema.flashcards.id, id));
}

export async function deleteFlashcard(id: string) {
    await db().delete(schema.flashcards).where(eq(schema.flashcards.id, id));
}

export async function deleteFlashcards(ids: string[]) {
    if (ids.length === 0) return;
    await db().delete(schema.flashcards).where(inArray(schema.flashcards.id, ids));
}

// ============= MATERIALS =============

export function useMaterials(unitId: string) {
    const { data: materials, error } = useLiveQuery(
        db()
            .select()
            .from(schema.materials)
            .where(eq(schema.materials.unitId, unitId))
            .orderBy(desc(schema.materials.createdAt))
    );

    return {
        materials: materials || [],
        error,
        isLoading: materials === undefined && !error,
    };
}

export function useMaterial(id: string) {
    const { data, error } = useLiveQuery(
        db().select().from(schema.materials).where(eq(schema.materials.id, id))
    );

    return {
        material: data?.[0],
        error,
        isLoading: data === undefined && !error,
    };
}

export async function createMaterial(data: {
    unitId: string;
    fileUri: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
}) {
    const id = generateId();
    await db().insert(schema.materials).values({
        id,
        ...data,
    });
    return id;
}

export async function deleteMaterial(id: string) {
    await db().delete(schema.materials).where(eq(schema.materials.id, id));
}

export async function deleteMaterials(ids: string[]) {
    if (ids.length === 0) return;
    await db().delete(schema.materials).where(inArray(schema.materials.id, ids));
}

// ============= FLASHCARD GROUPS =============

export function useFlashcardGroups(unitId: string) {
    const { data: groups, error } = useLiveQuery(
        db()
            .select()
            .from(schema.flashcardGroups)
            .where(eq(schema.flashcardGroups.unitId, unitId))
            .orderBy(desc(schema.flashcardGroups.createdAt))
    );

    return {
        groups: groups || [],
        error,
        isLoading: groups === undefined && !error,
    };
}

export function useAllFlashcardGroups() {
    const { data: groups, error } = useLiveQuery(
        db().select().from(schema.flashcardGroups).orderBy(desc(schema.flashcardGroups.createdAt))
    );

    return {
        groups: groups || [],
        error,
        isLoading: groups === undefined && !error,
    };
}

export function useFlashcardGroup(id: string) {
    const { data, error } = useLiveQuery(
        db().select().from(schema.flashcardGroups).where(eq(schema.flashcardGroups.id, id))
    );

    return {
        group: data?.[0],
        error,
        isLoading: data === undefined && !error,
    };
}

export function useFlashcardsByGroupId(groupId: string) {
    const { data: flashcards, error } = useLiveQuery(
        db()
            .select({
                flashcard: schema.flashcards,
            })
            .from(schema.flashcardGroupItems)
            .innerJoin(
                schema.flashcards,
                eq(schema.flashcardGroupItems.flashcardId, schema.flashcards.id)
            )
            .where(eq(schema.flashcardGroupItems.groupId, groupId))
            .orderBy(desc(schema.flashcardGroupItems.addedAt))
    );

    return {
        flashcards: flashcards?.map((f) => f.flashcard) || [],
        error,
        isLoading: flashcards === undefined && !error,
    };
}

// ============= STUDY SESSIONS =============

export function useStudySessions(unitId: string) {
    const { data: sessions, error } = useLiveQuery(
        db()
            .select()
            .from(schema.studySessions)
            .where(eq(schema.studySessions.unitId, unitId))
            .orderBy(desc(schema.studySessions.createdAt))
    );

    return {
        sessions: sessions || [],
        error,
        isLoading: sessions === undefined && !error,
    };
}

export function useAllStudySessions() {
    const { data: sessions, error } = useLiveQuery(
        db()
            .select()
            .from(schema.studySessions)
            .orderBy(desc(schema.studySessions.createdAt))
    );

    return {
        sessions: sessions || [],
        error,
        isLoading: sessions === undefined && !error,
    };
}

export async function createStudySession(data: {
    unitId: string;
    cardsReviewed: number;
    correctCount: number;
    sessionDuration?: number;
}) {
    const id = generateId();
    await db().insert(schema.studySessions).values({
        id,
        ...data,
    });
    return id;
}

// ============= STATISTICS =============

export function useUnitStats(unitId: string) {
    const { flashcards } = useFlashcards(unitId);
    const { materials } = useMaterials(unitId);
    const { sessions } = useStudySessions(unitId);

    return {
        flashcardCount: flashcards.length,
        materialCount: materials.length,
        totalSessions: sessions.length,
        totalCardsReviewed: sessions.reduce((sum, s) => sum + s.cardsReviewed, 0),
        averageAccuracy:
            sessions.length > 0
                ? sessions.reduce((sum, s) => sum + (s.correctCount / s.cardsReviewed) * 100, 0) /
                sessions.length
                : 0,
    };
}
