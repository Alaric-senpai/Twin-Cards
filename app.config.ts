import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    const IS_DEV = process.env.APP_VARIANT === 'development';
    const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

    return {
        ...config,
        name: IS_DEV ? 'Twin Cards (Dev)' : 'Twin Cards',
        slug: 'twincards',
        version: '1.2.0',
        orientation: 'portrait',
        icon: './assets/logo.png',
        scheme: 'twincards',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        splash: {
            image: './assets/logo.png',
            resizeMode: 'contain',
            backgroundColor: '#0F172A',
        },
        assetBundlePatterns: ['**/*'],
        ios: {
            supportsTablet: true,
            bundleIdentifier: IS_DEV
                ? 'com.alaric987.twincards.dev'
                : 'com.alaric987.twincards',
        },
        android: {
            edgeToEdgeEnabled: true,
            adaptiveIcon: {
                foregroundImage: './assets/logo.png',
                backgroundColor: '#0F172A',
            },
            package: IS_DEV
                ? 'com.alaric987.twincards.dev'
                : 'com.alaric987.twincards',
        },
        web: {
            bundler: 'metro',
            output: 'static',
            favicon: './assets/logo.png',
        },
        plugins: [
            'expo-router',
            'expo-video',
            'expo-sqlite',
            [
                'expo-document-picker',
                {
                    iCloudContainerEnvironment: 'Production',
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
        },
        extra: {
            router: {},
            eas: {
                projectId: '6dcf42e9-160b-4ac4-8893-3006ae2f7332',
            },
            appVariant: process.env.APP_VARIANT || 'production',
            aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY || '',
        },
    };
};
