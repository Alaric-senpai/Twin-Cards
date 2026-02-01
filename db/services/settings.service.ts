import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

// Default settings
const DEFAULT_SETTINGS = {
    cards_per_session: '20',
    shuffle_enabled: 'true',
    auto_advance_timing: '3',
    theme: 'dark',
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;

export interface Settings {
    cards_per_session: number;
    shuffle_enabled: boolean;
    auto_advance_timing: number;
    theme: string;
}

/**
 * Get all settings as a typed object
 */
export async function getSettings(): Promise<Settings> {
    const settings = await db().select().from(schema.systemSettings);

    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
    });

    return {
        cards_per_session: parseInt(settingsMap.cards_per_session || DEFAULT_SETTINGS.cards_per_session),
        shuffle_enabled: settingsMap.shuffle_enabled === 'true',
        auto_advance_timing: parseInt(
            settingsMap.auto_advance_timing || DEFAULT_SETTINGS.auto_advance_timing
        ),
        theme: settingsMap.theme || DEFAULT_SETTINGS.theme,
    };
}

/**
 * Get a single setting value
 */
export async function getSetting(key: SettingsKey): Promise<string> {
    const result = await db()
        .select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, key))
        .limit(1);

    return result[0]?.value || DEFAULT_SETTINGS[key];
}

/**
 * Update a setting value
 */
export async function updateSetting(key: SettingsKey, value: string): Promise<void> {
    // Check if setting exists
    const existing = await db()
        .select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, key))
        .limit(1);

    if (existing.length > 0) {
        // Update existing setting
        await db()
            .update(schema.systemSettings)
            .set({
                value,
                updatedAt: new Date(),
            })
            .where(eq(schema.systemSettings.key, key));
    } else {
        // Insert new setting
        await db().insert(schema.systemSettings).values({
            key,
            value,
        });
    }
}

/**
 * Initialize default settings (called during migration)
 */
export async function initializeDefaultSettings(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        const existing = await db()
            .select()
            .from(schema.systemSettings)
            .where(eq(schema.systemSettings.key, key))
            .limit(1);

        if (existing.length === 0) {
            await db().insert(schema.systemSettings).values({
                key,
                value,
            });
        }
    }
}
