import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useColorScheme } from 'nativewind';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import * as React from 'react';
import { getAllFlashcardGroups, getFlashcardCountByGroupId } from '@/db/services/flashcard-groups.service';
import type { FlashcardGroup } from '@/db/schema';

export default function FlashcardGroupsScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [groups, setGroups] = React.useState<FlashcardGroup[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        const data = await getAllFlashcardGroups();
        setGroups(data);
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 border-b border-border flex-row items-center justify-between">
                <View>
                    <Text className="text-3xl font-bold text-foreground">Flashcard Groups</Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                        Organize flashcards across units
                    </Text>
                </View>
                <Button
                    size="icon"
                    onPress={() => router.push('/flashcard-groups/create')}
                    className="rounded-full"
                >
                    <Plus size={24} color="white" />
                </Button>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                {loading ? (
                    <Text className="text-center text-muted-foreground">Loading...</Text>
                ) : groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="items-center justify-center py-16">
                            <View
                                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                                style={{
                                    backgroundColor: isDark
                                        ? 'rgba(255, 107, 107, 0.1)'
                                        : 'rgba(255, 107, 107, 0.1)',
                                }}
                            >
                                <FolderOpen size={40} color="#FF6B6B" />
                            </View>
                            <Text className="text-lg font-semibold text-foreground mb-2">
                                No Groups Yet
                            </Text>
                            <Text className="text-sm text-muted-foreground text-center px-8 mb-6">
                                Create flashcard groups to organize your study materials
                            </Text>
                            <Button onPress={() => router.push('/flashcard-groups/create')}>
                                <Text className="text-white font-semibold">Create Group</Text>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <View className="gap-3">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} isDark={isDark} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function GroupCard({ group, isDark }: { group: FlashcardGroup; isDark: boolean }) {
    const [cardCount, setCardCount] = React.useState(0);

    React.useEffect(() => {
        getFlashcardCountByGroupId(group.id).then(setCardCount);
    }, [group.id]);

    return (
        <Pressable onPress={() => router.push(`/flashcard-groups/${group.id}`)}>
            <Card>
                <CardContent className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center gap-3 flex-1">
                        <View
                            className="w-12 h-12 rounded-lg items-center justify-center"
                            style={{ backgroundColor: group.color || '#FF6B6B' }}
                        >
                            <FolderOpen size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-foreground">
                                {group.name}
                            </Text>
                            {group.description && (
                                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                                    {group.description}
                                </Text>
                            )}
                            <Text className="text-xs text-muted-foreground mt-1">
                                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                </CardContent>
            </Card>
        </Pressable>
    );
}
