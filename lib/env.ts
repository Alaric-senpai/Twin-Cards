import Constants from 'expo-constants';

/**
 * Environment variables helper
 * Access environment variables via expo-constants
 */

export const env = {
    AI_GATEWAY_API_KEY:
        Constants.expoConfig?.extra?.aiGatewayApiKey || process.env.AI_GATEWAY_API_KEY || '',
};

// Validate required environment variables
export function validateEnv() {
    const missing: string[] = [];

    if (!env.AI_GATEWAY_API_KEY) {
        missing.push('AI_GATEWAY_API_KEY');
    }

    if (missing.length > 0) {
        console.warn(
            `Missing environment variables: ${missing.join(', ')}. AI features may not work properly.`
        );
        return false;
    }

    return true;
}
