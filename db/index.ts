import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the SQLite database
const expoDb = openDatabaseSync('twincards.db', { enableChangeListener: true });

// Create Drizzle instance
export const db = drizzle(expoDb, { schema });

// Export schema for use in other files
export { schema };

// Initialize database with tables
export async function initializeDatabase() {
    try {
        console.log('Initializing database...');

        // Create tables directly using SQL
        expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#FF6B6B',
        icon TEXT DEFAULT 'book',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY NOT NULL,
        unit_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        hint TEXT,
        difficulty INTEGER DEFAULT 0,
        last_reviewed INTEGER,
        next_review INTEGER,
        review_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY NOT NULL,
        unit_id TEXT NOT NULL,
        file_uri TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        unit_id TEXT NOT NULL,
        cards_reviewed INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        session_duration INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_flashcards_unit_id ON flashcards(unit_id);
      CREATE INDEX IF NOT EXISTS idx_materials_unit_id ON materials(unit_id);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_unit_id ON study_sessions(unit_id);
    `);

        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}
