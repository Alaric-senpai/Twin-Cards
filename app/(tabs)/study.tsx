import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { BookOpen, Plus, Sparkles, ChevronRight, Trash2, Play, Clock, History } from 'lucide-react-native';
import { router } from 'expo-router';
import * as React from 'react';
import { useUnits, useAllStudySessions } from '@/hooks/useDatabase';
import { db, schema } from '@/db';
import { eq, count } from 'drizzle-orm';
import {
    createStudySessionFromUnit,
    getActiveStudyQueues,
    deleteStudyQueue,
    parseFlashcardIds,
    getQueueProgress,
} from '@/db/services/study-queue.service';

interface UnitWithCount {
    id: string;
    title: string;
    color: string | null;
    icon: string | null;
    flashcardCount: number;
}

export default function StudyScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { units, isLoading } = useUnits();
    const [bottomSheetVisible, setBottomSheetVisible] = React.useState(false);
    const [unitsWithCounts, setUnitsWithCounts] = React.useState<UnitWithCount[]>([]);
    const [loadingCounts, setLoadingCounts] = React.useState(false);
    const [studyQueues, setStudyQueues] = React.useState<any[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadUnitsWithCounts = async () => {
        setLoadingCounts(true);
        const unitsData = await Promise.all(
            units.map(async (unit) => {
                const result = await db()
                    .select({ count: count() })
                    .from(schema.flashcards)
                    .where(eq(schema.flashcards.unitId, unit.id));

                const flashcardCount = result[0]?.count || 0;

                return {
                    id: unit.id,
                    title: unit.title,
                    color: unit.color,
                    icon: unit.icon,
                    flashcardCount,
                };
            })
        );
        setUnitsWithCounts(unitsData);
        setLoadingCounts(false);
    };

    const loadStudyQueues = async () => {
        const queues = await getActiveStudyQueues();
        setStudyQueues(queues);
    };

    const refreshData = async () => {
        setRefreshing(true);
        await loadStudyQueues();
        setRefreshing(false);
    };

    React.useEffect(() => {
        refreshData();
    }, []);

    const handleOpenBottomSheet = async () => {
        if (units.length === 0) {
            Alert.alert('No Units', 'Please create a unit with flashcards first.');
            return;
        }
        await loadUnitsWithCounts();
        setBottomSheetVisible(true);
    };

    const handleSelectUnit = async (unit: UnitWithCount) => {
        if (unit.flashcardCount === 0) {
            Alert.alert('No Flashcards', `The unit "${unit.title}" has no flashcards yet.`);
            return;
        }

        try {
            setBottomSheetVisible(false);
            const queueId = await createStudySessionFromUnit(unit.id, unit.title);
            await refreshData();
            router.push(`/study-queue/${queueId}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to create study session. Please try again.');
            console.error(error);
        }
    };

    const handleDeleteQueue = async (queueId: string) => {
        Alert.alert('Delete Study Queue', 'Are you sure you want to delete this study queue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteStudyQueue(queueId);
                    await refreshData();
                },
            },
        ]);
    };

    const handleResumeQueue = (queueId: string) => {
        router.push(`/study-queue/${queueId}`);
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 border-b border-border">
                <Text className="text-3xl font-bold text-foreground">Study</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                    Manage your study sessions and queues
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                {/* Quick Actions */}
                <View className="gap-4 mb-6">
                    <Button
                        onPress={handleOpenBottomSheet}
                        disabled={isLoading || units.length === 0}
                        className="flex-row items-center justify-center gap-2"
                    >
                        <Plus size={20} color="white" />
                        <Text className="text-white font-semibold">Create Study Session</Text>
                    </Button>

                    <Button
                        variant="outline"
                        onPress={() => {
                            router.push('/ai-generate');
                        }}
                        className="flex-row items-center justify-center gap-2"
                    >
                        <Sparkles size={20} color="#FF6B6B" />
                        <Text className="font-semibold" style={{ color: '#FF6B6B' }}>
                            AI Generate Flashcards
                        </Text>
                    </Button>
                </View>

                {/* Study Queues Section */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-foreground mb-3">
                        Saved Study Queues
                    </Text>

                    {studyQueues.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="items-center justify-center py-12">
                                <View
                                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                    style={{
                                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                    }}
                                >
                                    <BookOpen size={32} color="#FF6B6B" />
                                </View>
                                <Text className="text-base font-semibold text-foreground mb-1">
                                    No Study Queues Yet
                                </Text>
                                <Text className="text-sm text-muted-foreground text-center px-8">
                                    Create a study session to get started
                                </Text>
                            </CardContent>
                        </Card>
                    ) : (
                        <View className="gap-3">
                            {studyQueues.map((queue) => {
                                const flashcardIds = parseFlashcardIds(queue);
                                const progress = getQueueProgress(queue);
                                return (
                                    <Card key={queue.id}>
                                        <CardContent className="p-4">
                                            <View className="flex-row items-center justify-between mb-2">
                                                <Text className="text-base font-semibold text-foreground flex-1">
                                                    {queue.name}
                                                </Text>
                                                <Pressable
                                                    onPress={() => handleDeleteQueue(queue.id)}
                                                    className="p-2"
                                                >
                                                    <Trash2
                                                        size={18}
                                                        color={isDark ? '#94A3B8' : '#64748B'}
                                                    />
                                                </Pressable>
                                            </View>
                                            <Text className="text-sm text-muted-foreground mb-3">
                                                {queue.currentIndex} / {flashcardIds.length} cards •{' '}
                                                {progress}% complete
                                            </Text>
                                            <Button
                                                size="sm"
                                                onPress={() => handleResumeQueue(queue.id)}
                                                className="flex-row items-center justify-center gap-2"
                                            >
                                                <Play size={16} color="white" />
                                                <Text className="text-white font-semibold">
                                                    Resume
                                                </Text>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Study History Section */}
                <StudyHistorySection units={units} />
            </ScrollView>

            {/* Bottom Sheet for Unit Selection */}
            <BottomSheet
                visible={bottomSheetVisible}
                onClose={() => setBottomSheetVisible(false)}
                title="Select a Unit"
                description="Choose a unit to create a study session"
            >
                {loadingCounts ? (
                    <View className="py-8 items-center">
                        <Text className="text-muted-foreground">Loading units...</Text>
                    </View>
                ) : unitsWithCounts.length === 0 ? (
                    <View className="py-8 items-center">
                        <Text className="text-muted-foreground text-center">
                            No units available. Create a unit first.
                        </Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {unitsWithCounts.map((unit) => (
                            <Pressable
                                key={unit.id}
                                onPress={() => handleSelectUnit(unit)}
                                disabled={unit.flashcardCount === 0}
                                className={`flex-row items-center p-3 rounded-lg border ${
                                    unit.flashcardCount === 0
                                        ? 'opacity-50 border-border'
                                        : 'border-border active:bg-slate-700'
                                }`}
                            >
                                <View
                                    className="w-9 h-9 rounded-lg items-center justify-center"
                                    style={{
                                        backgroundColor: unit.color || '#FF6B6B',
                                    }}
                                >
                                    <BookOpen size={18} color="white" />
                                </View>
                                <View className="flex-1 ml-3">
                                    <Text className="text-sm font-semibold text-foreground">
                                        {unit.title}
                                    </Text>
                                    <Text className="text-xs text-muted-foreground">
                                        {unit.flashcardCount}{' '}
                                        {unit.flashcardCount === 1 ? 'card' : 'cards'}
                                    </Text>
                                </View>
                                {unit.flashcardCount > 0 && (
                                    <ChevronRight
                                        size={18}
                                        color={isDark ? '#94A3B8' : '#64748B'}
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}
            </BottomSheet>
        </View>
    );
}

function StudyHistorySection({ units }: { units: any[] }) {
    const { sessions, isLoading } = useAllStudySessions();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (isLoading) return null;
    if (sessions.length === 0) return null;

    // Group sessions by unit
    const groupedSessions = sessions.reduce((acc: any, session) => {
        const unitId = session.unitId;
        if (!acc[unitId]) acc[unitId] = [];
        acc[unitId].push(session);
        return acc;
    }, {});

    const unitMap = units.reduce((acc: any, unit) => {
        acc[unit.id] = unit;
        return acc;
    }, {});

    return (
        <View className="mt-2 mb-8">
            <View className="flex-row items-center gap-2 mb-4">
                <History size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text className="text-lg font-semibold text-foreground">
                    Study History
                </Text>
            </View>

            {Object.keys(groupedSessions).map((unitId) => {
                const unit = unitMap[unitId] || { title: 'Unknown Unit', color: '#64748B' };
                const unitSessions = groupedSessions[unitId];

                return (
                    <View key={unitId} className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: unit.color || '#FF6B6B' }} 
                            />
                            <Text className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                {unit.title}
                            </Text>
                        </View>

                        <View className="gap-2">
                            {unitSessions.map((session: any) => {
                                const date = new Date(session.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                const accuracy = Math.round((session.correctCount / session.cardsReviewed) * 100);

                                return (
                                    <View 
                                        key={session.id}
                                        className="flex-row items-center justify-between p-4 rounded-2xl bg-card border border-border/50"
                                    >
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-2 mb-1">
                                                <Clock size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                                                <Text className="text-sm font-medium text-foreground">
                                                    {date}
                                                </Text>
                                            </View>
                                            <Text className="text-xs text-muted-foreground">
                                                {session.cardsReviewed} cards reviewed
                                            </Text>
                                        </View>
                                        
                                        <View className="items-end">
                                            <Text className={"text-base font-bold " + (accuracy >= 80 ? 'text-primary' : 'text-foreground')}>
                                                {accuracy}%
                                            </Text>
                                            <Text className="text-[10px] uppercase font-bold text-muted-foreground">
                                                Accuracy
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
