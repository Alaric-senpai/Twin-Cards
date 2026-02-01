import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useColorScheme } from 'nativewind';
import { 
    Layers, Search, Plus, ChevronRight, BookOpen, 
    Filter, LayoutGrid, List as ListIcon 
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as React from 'react';
import { useAllFlashcardGroups } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { db, schema } from '@/db';
import { count, eq } from 'drizzle-orm';

export default function GroupsScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { groups, isLoading } = useAllFlashcardGroups();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [groupsWithCounts, setGroupsWithCounts] = React.useState<any[]>([]);
    const [isLoadingCounts, setIsLoadingCounts] = React.useState(true);

    // Filter groups based on search query
    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Fetch card counts for each group
    React.useEffect(() => {
        const fetchCounts = async () => {
            if (groups.length === 0) {
                setGroupsWithCounts([]);
                setIsLoadingCounts(false);
                return;
            }

            try {
                const data = await Promise.all(
                    groups.map(async (group) => {
                        const result = await db()
                            .select({ count: count() })
                            .from(schema.flashcardGroupItems)
                            .where(eq(schema.flashcardGroupItems.groupId, group.id));
                        
                        return {
                            ...group,
                            cardCount: result[0]?.count || 0
                        };
                    })
                );
                setGroupsWithCounts(data);
            } catch (error) {
                console.error('Failed to fetch group counts:', error);
            } finally {
                setIsLoadingCounts(false);
            }
        };

        if (!isLoading) {
            fetchCounts();
        }
    }, [groups, isLoading]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <View className="px-6 pt-16 pb-6">
                    <Skeleton className="h-10 w-48 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </View>
                <View className="px-6 mb-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </View>
                <ScrollView className="flex-1 px-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl mb-4" />
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-16 pb-6">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-3xl font-bold text-foreground">Groups</Text>
                        <Text className="text-sm text-muted-foreground mt-1">
                            Organize your cards into focused collections
                        </Text>
                    </View>
                    <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center">
                        <Layers size={24} color="#FF6B6B" />
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View className="px-6 mb-6">
                <View 
                    className="flex-row items-center px-4 h-12 rounded-xl border border-border"
                    style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }}
                >
                    <Search size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search groups..."
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        className="flex-1 ml-3 text-foreground text-sm"
                        style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Icon as={Plus} size={18} className="text-muted-foreground rotate-45" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Groups List */}
            <ScrollView 
                className="flex-1 px-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {filteredGroups.length === 0 ? (
                    <View className="mt-12">
                        <EmptyState
                            title={searchQuery ? "No matching groups" : "No groups yet"}
                            description={searchQuery 
                                ? "Try a different search term" 
                                : "Create groups to organize your flashcards and study more effectively"
                            }
                        />
                    </View>
                ) : (
                    <View className="gap-4">
                        {filteredGroups.map((group) => {
                            const groupWithCount = groupsWithCounts.find(g => g.id === group.id);
                            const cardCount = groupWithCount?.cardCount || 0;

                            return (
                                <Pressable
                                    key={group.id}
                                    onPress={() => router.push(`/flashcard-groups/${group.id}`)}
                                >
                                    <Card className="overflow-hidden border-transparent shadow-sm">
                                        <CardContent className="p-0">
                                            <View className="flex-row h-24">
                                                {/* Color Indicator Accent */}
                                                <View 
                                                    className="w-2" 
                                                    style={{ backgroundColor: group.color || '#FF6B6B' }} 
                                                />
                                                <View className="flex-1 flex-row items-center justify-between p-4 bg-card">
                                                    <View className="flex-row items-center gap-4 flex-1">
                                                        <View 
                                                            className="w-12 h-12 rounded-xl items-center justify-center"
                                                            style={{ backgroundColor: (group.color || '#FF6B6B') + '15' }}
                                                        >
                                                            <BookOpen size={22} color={group.color || '#FF6B6B'} />
                                                        </View>
                                                        <View className="flex-1">
                                                            <Text className="text-lg font-bold text-foreground leading-tight" numberOfLines={1}>
                                                                {group.name}
                                                            </Text>
                                                            <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                                                                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                                                                {group.description ? ` • ${group.description}` : ''}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View className="h-8 w-8 rounded-full bg-secondary/50 items-center justify-center">
                                                        <ChevronRight size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                                                    </View>
                                                </View>
                                            </View>
                                        </CardContent>
                                    </Card>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <Pressable
                onPress={() => router.push('/flashcard-groups/create')}
                className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40 active:opacity-90 active:scale-95"
            >
                <Plus size={28} color="white" />
            </Pressable>
        </View>
    );
}
