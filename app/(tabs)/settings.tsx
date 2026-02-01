import { View, ScrollView, Switch, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useColorScheme } from 'nativewind';
import { Moon, Sun, Info, Database, Download, Upload, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import Constants from 'expo-constants';

export default function SettingsScreen() {
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const appVersion = Constants.expoConfig?.version || '1.2.0';

    const handleToggleTheme = () => {
        setColorScheme(isDark ? 'light' : 'dark');
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all your units, flashcards, and materials. This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement data clearing
                        console.log('Clear all data');
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 border-b border-border">
                <Text className="text-3xl font-bold text-foreground">Settings</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                    Customize your app experience
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                {/* Appearance */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the app's look and feel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                {isDark ? (
                                    <Moon size={20} color="#94A3B8" />
                                ) : (
                                    <Sun size={20} color="#64748B" />
                                )}
                                <Text className="text-base text-foreground">Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={handleToggleTheme}
                                trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                                thumbColor={isDark ? '#FFFFFF' : '#F1F5F9'}
                            />
                        </View>
                    </CardContent>
                </Card>

                {/* Study Preferences */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Study Preferences</CardTitle>
                        <CardDescription>Configure your study sessions</CardDescription>
                    </CardHeader>
                    <CardContent className="gap-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base text-foreground">
                                Default Cards per Session
                            </Text>
                            <Text className="text-base text-muted-foreground">20</Text>
                        </View>
                        <Separator />
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base text-foreground">Auto-advance Timing</Text>
                            <Text className="text-base text-muted-foreground">3s</Text>
                        </View>
                        <Separator />
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base text-foreground">Shuffle by Default</Text>
                            <Switch
                                value={true}
                                onValueChange={() => {}}
                                trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>
                    </CardContent>
                </Card>

                {/* Data Management */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>Backup and manage your data</CardDescription>
                    </CardHeader>
                    <CardContent className="gap-3">
                        <Button
                            variant="outline"
                            className="flex-row items-center justify-center gap-2"
                            onPress={() => {
                                // TODO: Implement export
                                console.log('Export data');
                            }}
                        >
                            <Download size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                            <Text className="text-foreground">Export Data</Text>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex-row items-center justify-center gap-2"
                            onPress={() => {
                                // TODO: Implement import
                                console.log('Import data');
                            }}
                        >
                            <Upload size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                            <Text className="text-foreground">Import Data</Text>
                        </Button>

                        <Button
                            variant="destructive"
                            className="flex-row items-center justify-center gap-2"
                            onPress={handleClearData}
                        >
                            <Trash2 size={18} color="white" />
                            <Text className="text-white">Clear All Data</Text>
                        </Button>
                    </CardContent>
                </Card>

                {/* About */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent className="gap-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base text-foreground">App Version</Text>
                            <Text className="text-base text-muted-foreground">{appVersion}</Text>
                        </View>
                        <Separator />
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base text-foreground">Developer</Text>
                            <Text className="text-base text-muted-foreground">Alaric Senpai</Text>
                        </View>
                    </CardContent>
                </Card>

                {/* Footer */}
                <View className="items-center py-8">
                    <Text className="text-xs text-muted-foreground">
                        Made with ❤️ for better learning
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
