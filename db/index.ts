import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';
import migrations from '@/drizzle/migrations';

let database: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database with migrations
 */
export const initializeDatabase = async () => {
  try {
    if (database) {
      return database; // Already initialized
    }

    console.log('🔄 Initializing database...');

    const expo = SQLite.openDatabaseSync('twin-cardsapp.db', { enableChangeListener: true });
    database = drizzle(expo, { schema });

    // Run migrations
    console.log('🔄 Running migrations...');
    await migrate(database, migrations);

    console.log('✅ Database initialized and migrations completed');

    // Initialize default settings if they don't exist
    await initializeDefaultSettings();

    return database;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Get the database instance
 */
export const getDatabase = () => {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return database;
};

/**
 * Initialize default settings
 */
async function initializeDefaultSettings() {
  try {
    if (!database) return;

    // Check if settings exist
    const existingSettings = await database.select().from(schema.systemSettings).limit(1);

    if (existingSettings.length === 0) {
      console.log('Initializing default settings...');

      // Insert default settings
      await database.insert(schema.systemSettings).values([
        { key: 'cards_per_session', value: '20' },
        { key: 'shuffle_enabled', value: 'true' },
        { key: 'auto_advance_timing', value: '3' },
        { key: 'theme', value: 'dark' },
      ]);

      console.log('Default settings initialized');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
    // Don't throw - settings might not be critical for app startup
  }
}

// Export db as a getter function
export const db = getDatabase;

// Export schema for easy access
export { schema };
