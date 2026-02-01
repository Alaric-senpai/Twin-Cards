import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Units table - stores study units/subjects
export const units = sqliteTable('units', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    color: text('color').default('#FF6B6B'),
    icon: text('icon').default('book'),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Flashcards table - stores flashcard data for spaced repetition
export const flashcards = sqliteTable('flashcards', {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
        .notNull()
        .references(() => units.id, { onDelete: 'cascade' }),
    front: text('front').notNull(),
    back: text('back').notNull(),
    hint: text('hint'),
    difficulty: integer('difficulty').default(0), // 0-5 scale
    lastReviewed: integer('last_reviewed', { mode: 'timestamp' }),
    nextReview: integer('next_review', { mode: 'timestamp' }),
    reviewCount: integer('review_count').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Materials table - stores references to PDF/PPTX files
export const materials = sqliteTable('materials', {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
        .notNull()
        .references(() => units.id, { onDelete: 'cascade' }),
    fileUri: text('file_uri').notNull(),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(), // 'pdf' | 'pptx' | 'html' (v1.2.0)
    fileSize: integer('file_size'), // in bytes
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Study sessions table - tracks study progress
export const studySessions = sqliteTable('study_sessions', {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
        .notNull()
        .references(() => units.id, { onDelete: 'cascade' }),
    cardsReviewed: integer('cards_reviewed').notNull(),
    correctCount: integer('correct_count').notNull(),
    sessionDuration: integer('session_duration'), // in seconds
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Flashcard Groups table - stores custom collections of flashcards (v1.2.0)
export const flashcardGroups = sqliteTable('flashcard_groups', {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
        .notNull()
        .references(() => units.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').default('#FF6B6B'),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Flashcard Group Items table - many-to-many relationship (v1.2.0)
export const flashcardGroupItems = sqliteTable('flashcard_group_items', {
    id: text('id').primaryKey(),
    groupId: text('group_id')
        .notNull()
        .references(() => flashcardGroups.id, { onDelete: 'cascade' }),
    flashcardId: text('flashcard_id')
        .notNull()
        .references(() => flashcards.id, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Study Queue table - saves randomized study sessions (v1.2.0)
export const studyQueue = sqliteTable('study_queue', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    flashcardIds: text('flashcard_ids').notNull(), // JSON array of flashcard IDs
    currentIndex: integer('current_index').default(0),
    completed: integer('completed', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
});

// System Settings table (v1.2.0)
export const systemSettings = sqliteTable('system_settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Type exports for TypeScript
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;

export type FlashcardGroup = typeof flashcardGroups.$inferSelect;
export type NewFlashcardGroup = typeof flashcardGroups.$inferInsert;

export type FlashcardGroupItem = typeof flashcardGroupItems.$inferSelect;
export type NewFlashcardGroupItem = typeof flashcardGroupItems.$inferInsert;

export type StudyQueue = typeof studyQueue.$inferSelect;
export type NewStudyQueue = typeof studyQueue.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
