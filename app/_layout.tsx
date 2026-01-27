import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as React from 'react';
import { initializeDatabase } from '@/db';
import { Container } from '@/components/Container';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, View } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [dbReady, setDbReady] = React.useState(false);

  // Initialize database and system UI on app start
  React.useEffect(() => {
    // Initialize database
    initializeDatabase().then((success) => {
      setDbReady(success);
    });

    // Hide navigation bar on Android
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('inset-touch');
      } catch (e) {
        console.error('Failed to set navigation bar visibility', e);
      }
    }
  }, []);

  if (!dbReady) {
    return null; // Or a loading screen
  }

  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Container>
        <ThemeProvider value={theme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent hideTransitionAnimation={'none'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="unit/[id]" />
            <Stack.Screen name="unit/create" />
            <Stack.Screen name="unit/edit/[id]" />
            <Stack.Screen name="flashcard/create" />
            <Stack.Screen name="flashcard/edit/[id]" />
            <Stack.Screen name="study/[unitId]" />
            <Stack.Screen name="material/[id]" />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </Container>
    </GestureHandlerRootView>
  );
}
