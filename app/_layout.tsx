import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { initializeDatabase } from '@/db';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
export {
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    const [dbReady, setDbReady] = useState(false);

    // Hide system navigation bar as early as possible
    React.useLayoutEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync('hidden').catch(() => {});
            NavigationBar.setBehaviorAsync('inset-touch').catch(() => {});
        }
    }, []);

    useEffect(() => {
        const setup = async () => {
            try {
                await initializeDatabase();
                setDbReady(true);
            } catch (error) {
                console.error('❌ Database setup failed:', error);
                setDbReady(true); // Proceed anyway to see error
            }
        };
        setup();
    }, []);

    const theme = NAV_THEME[colorScheme ?? 'light'];

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <SafeAreaProvider>
                <ThemeProvider value={theme}>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    {!dbReady ? (
                        <View className="flex-1 items-center justify-center bg-background">
                            <ActivityIndicator size="large" color="#FF6B6B" />
                        </View>
                    ) : (
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: theme.colors.background },
                            }}
                        >
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="unit/[id]" />
                            <Stack.Screen name="unit/create" />
                            <Stack.Screen name="unit/edit/[id]" />
                            <Stack.Screen name="flashcard/create" />
                            <Stack.Screen name="flashcard/edit/[id]" />
                            <Stack.Screen name="study/[unitId]" />
                            <Stack.Screen name="material/[id]" />
                            <Stack.Screen name="flashcard-groups/index" />
                            <Stack.Screen name="flashcard-groups/create" />
                            <Stack.Screen name="flashcard-groups/[id]" />
                            <Stack.Screen name="ai-generate/index" />
                        </Stack>
                    )}
                    <PortalHost />
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
