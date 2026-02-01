import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Check } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
    getFlashcardGroupById,
    updateFlashcardGroup,
} from '@/db/services/flashcard-groups.service';
import type { FlashcardGroup } from '@/db/schema';

const COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
];

export default function EditFlashcardGroupScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);
    const [saving, setSaving] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        if (!id) return;
        const group = await getFlashcardGroupById(id);
        if (group) {
            setName(group.name);
            setDescription(group.description || '');
            setSelectedColor(group.color || COLORS[0]);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!name.trim() || !id) {
            return;
        }

        setSaving(true);
        const result = await updateFlashcardGroup(id, {
            name: name.trim(),
            description: description.trim() || undefined,
            color: selectedColor,
        });

        if (result) {
            router.back();
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-muted-foreground">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 border-b border-border flex-row items-center gap-4">
                <Pressable onPress={() => router.back()}>
                    <ArrowLeft size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
                </Pressable>
                <Text className="text-2xl font-bold text-foreground">Edit Group</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                <View className="gap-6">
                    {/* Name Input */}
                    <View>
                        <Label nativeID="name" className="mb-2">
                            Group Name *
                        </Label>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Biology Finals"
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                            className="border border-input rounded-lg px-4 py-3 text-foreground"
                            style={{
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                            }}
                        />
                    </View>

                    {/* Description Input */}
                    <View>
                        <Label nativeID="description" className="mb-2">
                            Description (Optional)
                        </Label>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add a description..."
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            className="border border-input rounded-lg px-4 py-3 text-foreground"
                            style={{
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                                minHeight: 80,
                            }}
                        />
                    </View>

                    {/* Color Picker */}
                    <View>
                        <Label className="mb-3">Group Color</Label>
                        <View className="flex-row flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    onPress={() => setSelectedColor(color)}
                                    className="w-14 h-14 rounded-full items-center justify-center"
                                    style={{
                                        backgroundColor: color,
                                        borderWidth: selectedColor === color ? 3 : 0,
                                        borderColor: isDark ? '#F1F5F9' : '#0F172A',
                                    }}
                                >
                                    {selectedColor === color && <Check size={24} color="white" />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Preview */}
                    <View>
                        <Label className="mb-3">Preview</Label>
                        <Card>
                            <CardContent className="flex-row items-center gap-3 p-4">
                                <View
                                    className="w-12 h-12 rounded-lg"
                                    style={{ backgroundColor: selectedColor }}
                                />
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-foreground">
                                        {name || 'Group Name'}
                                    </Text>
                                    {description && (
                                        <Text
                                            className="text-sm text-muted-foreground"
                                            numberOfLines={1}
                                        >
                                            {description}
                                        </Text>
                                    )}
                                </View>
                            </CardContent>
                        </Card>
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View className="p-6 border-t border-border">
                <Button
                    onPress={handleSave}
                    disabled={!name.trim() || saving}
                    className="w-full"
                >
                    <Text className="text-white font-semibold">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Text>
                </Button>
            </View>
        </View>
    );
}
