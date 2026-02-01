import { Tabs } from 'expo-router';
import { Home, BookOpen, Settings, Layers } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

export default function TabsLayout() {
    const { colorScheme } = useColorScheme();
    const iconColor = colorScheme === 'dark' ? '#94A3B8' : '#64748B';
    const activeIconColor = '#FF6B6B';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                    borderTopColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: activeIconColor,
                tabBarInactiveTintColor: iconColor,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="study"
                options={{
                    title: 'Study',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Flashcards',
                    tabBarIcon: ({ color, size }) => (
                        <Layers color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Settings color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
