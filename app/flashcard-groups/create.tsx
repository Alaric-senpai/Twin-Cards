import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Check, Layers, BookOpen, Palette, Info } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { createFlashcardGroup } from '@/db/services/flashcard-groups.service';
import { useUnits } from '@/hooks/useDatabase';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = [
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquoise
    '#45B7D1', // Sky Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Seafoam
    '#F7DC6F', // Yellow
    '#BB8FCE', // Lavender
    '#85C1E2', // Ocean Blue
    '#FF85A1', // Pink
    '#A0D468', // Grass
];

export default function CreateFlashcardGroupScreen() {
    const insets = useSafeAreaInsets();
    const { unitId: initialUnitId } = useLocalSearchParams<{ unitId: string }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { units, isLoading: isLoadingUnits } = useUnits();

    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);
    const [selectedUnitId, setSelectedUnitId] = React.useState(initialUnitId || '');
    const [saving, setSaving] = React.useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }
        if (!selectedUnitId) {
            Alert.alert('Error', 'Please select a unit to link this group to.');
            return;
        }

        setSaving(true);
        try {
            const result = await createFlashcardGroup({
                unitId: selectedUnitId,
                name: name.trim(),
                description: description.trim() || undefined,
                color: selectedColor,
            });

            if (result) {
                router.back();
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View 
                className="px-6 pb-6 border-b border-border flex-row items-center justify-between"
                style={{ paddingTop: insets.top + 16 }}
            >
                <View className="flex-row items-center gap-4">
                    <Pressable 
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full bg-secondary/50 active:bg-secondary"
                    >
                        <ArrowLeft size={20} color={isDark ? '#F1F5F9' : '#0F172A'} />
                    </Pressable>
                    <View>
                        <Text className="text-2xl font-bold text-foreground">New Group</Text>
                        <Text className="text-xs text-muted-foreground">Create a focused collection</Text>
                    </View>
                </View>
                <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center">
                    <Layers size={24} color="#FF6B6B" />
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="gap-8">
                    {/* Unit Selection */}
                    <View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <BookOpen size={18} color="#FF6B6B" />
                            <Label className="text-base font-semibold">Select Unit *</Label>
                        </View>
                        <Select
                            value={{ label: units.find(u => u.id === selectedUnitId)?.title || 'Select a unit', value: selectedUnitId }}
                            onValueChange={(val) => setSelectedUnitId(val?.value || '')}
                        >
                            <SelectTrigger className="w-full h-14 bg-card border-border px-4 rounded-xl">
                                <SelectValue
                                    placeholder="Choose a unit to link to"
                                    className="text-foreground text-base"
                                />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectGroup>
                                    <SelectLabel>Available Units</SelectLabel>
                                    {units.map((unit) => (
                                        <SelectItem 
                                            key={unit.id} 
                                            label={unit.title} 
                                            value={unit.id}
                                        />
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Text className="text-[10px] text-muted-foreground mt-2 px-1">
                            Groups must belong to a unit to organize your progress
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <Layers size={18} color="#FF6B6B" />
                            <Label className="text-base font-semibold">Group Name *</Label>
                        </View>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Biology Finals, Important Concepts"
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                            className="h-14 bg-card border border-border rounded-xl px-4 text-foreground text-base"
                            style={{ elevation: 1 }}
                        />
                    </View>

                    {/* Description Input */}
                    <View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <Info size={18} color="#FF6B6B" />
                            <Label className="text-base font-semibold">Description (Optional)</Label>
                        </View>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Explain what this group covers..."
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                            style={{ minHeight: 100, elevation: 1 }}
                        />
                    </View>

                    {/* Color Picker */}
                    <View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <Palette size={18} color="#FF6B6B" />
                            <Label className="text-base font-semibold">Group Theme Color</Label>
                        </View>
                        <View className="flex-row flex-wrap gap-4">
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    onPress={() => setSelectedColor(color)}
                                    className="w-12 h-12 rounded-2xl items-center justify-center shadow-sm"
                                    style={{
                                        backgroundColor: color,
                                    }}
                                >
                                    {selectedColor === color && (
                                        <View className="w-6 h-6 rounded-full bg-white/30 items-center justify-center">
                                            <Check size={16} color="white" strokeWidth={3} />
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Actions */}
            <View 
                className="absolute bottom-0 left-0 right-0 p-6 bg-background/80"
                style={{ paddingBottom: insets.bottom + 16 }}
            >
                <Button
                    onPress={handleSave}
                    disabled={saving || !name.trim() || !selectedUnitId}
                    className="h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20"
                >
                    <Text className="text-white text-lg font-bold">
                        {saving ? 'Creating Group...' : 'Create Flashcard Group'}
                    </Text>
                </Button>
            </View>
        </View>
    );
}

