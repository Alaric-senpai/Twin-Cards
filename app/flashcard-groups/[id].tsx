import { View, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { 
    ChevronLeft, Play, Plus, Trash2, 
    FileSpreadsheet, BookOpen, Layers, X, Edit2
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
    deleteFlashcardGroup,
    removeFlashcardFromGroup,
    removeFlashcardsFromGroup,
    addFlashcardToGroup,
} from '@/db/services/flashcard-groups.service';
import { 
    useFlashcardGroup, 
    useFlashcardsByGroupId,
    createFlashcard 
} from '@/hooks/useDatabase';
import { FlashcardItem } from '@/components/FlashcardItem';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from '@/components/ui/button';

export default function FlashcardGroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    // Live Database Queries
    const { group, isLoading: isGroupLoading } = useFlashcardGroup(id!);
    const { flashcards, isLoading: isCardsLoading } = useFlashcardsByGroupId(id!);
    
    // Local State
    const [isImporting, setIsImporting] = React.useState(false);
    const [selectionMode, setSelectionMode] = React.useState<'none' | 'flashcards'>('none');
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    const isLoading = isGroupLoading || isCardsLoading;

    // Theme Colors
    const colors = {
        background: isDark ? '#0F172A' : '#F8FAFC',
        card: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F1F5F9' : '#0F172A',
        muted: isDark ? '#94A3B8' : '#64748B',
        border: isDark ? '#334155' : '#E2E8F0',
        primary: '#FF6B6B',
        primaryMuted: '#FF6B6B20',
        secondary: isDark ? '#334155' : '#F1F5F9',
        destructive: '#EF4444',
        destructiveMuted: '#EF444415',
    };

    // Selection Handlers
    const toggleSelection = (cardId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
            if (newSelected.size === 0) setSelectionMode('none');
        } else {
            newSelected.add(cardId);
        }
        setSelectedIds(newSelected);
    };

    const exitSelectionMode = () => {
        setSelectionMode('none');
        setSelectedIds(new Set());
    };

    // Action Handlers
    const handleDeleteGroup = () => {
        Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (id) {
                        try {
                            await deleteFlashcardGroup(id);
                            router.back();
                        } catch (err) {
                            console.error('Delete group error:', err);
                        }
                    }
                },
            },
        ]);
    };

    const handleBatchRemove = () => {
        if (selectedIds.size === 0) return;
        
        Alert.alert(
            'Remove Cards', 
            `Remove ${selectedIds.size} cards from this group?`, 
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        if (id) {
                            try {
                                await removeFlashcardsFromGroup(id, Array.from(selectedIds));
                                exitSelectionMode();
                            } catch (err) {
                                console.error('Batch remove error:', err);
                            }
                        }
                    },
                },
            ]
        );
    };

    const handleImportCSV = async () => {
        if (!group) return;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/comma-separated-values',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets[0]) return;

            setIsImporting(true);
            const fileUri = result.assets[0].uri;
            const content = await FileSystem.readAsStringAsync(fileUri);
            
            const lines = content.split(/\r?\n/);
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

            let importCount = 0;
            for (const line of lines) {
                if (!line.trim()) continue;
                const parts = line.split(regex).map(part => 
                    part.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
                );
                
                if (parts.length >= 2) {
                    const cardId = await createFlashcard({
                        unitId: group.unitId,
                        front: parts[0],
                        back: parts[1],
                        hint: parts[2] || undefined,
                    });
                    
                    if (cardId) {
                        await addFlashcardToGroup(group.id, cardId);
                        importCount++;
                    }
                }
            }
            Alert.alert('Import Success', `Successfully added ${importCount} cards to this group.`);
        } catch (error) {
            console.error('CSV Import error:', error);
            Alert.alert('Error', 'Failed to import CSV. Ensure it follows "Question,Answer" format.');
        } finally {
            setIsImporting(false);
        }
    };

    if (isLoading || !group) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Skeleton style={[styles.skeletonCircle, { backgroundColor: colors.secondary }]} />
                        <View style={styles.headerActions}>
                            <Skeleton style={[styles.skeletonAction, { backgroundColor: colors.secondary }]} />
                            <Skeleton style={[styles.skeletonAction, { backgroundColor: colors.secondary }]} />
                        </View>
                    </View>
                    <Skeleton style={[styles.skeletonTitle, { backgroundColor: colors.secondary }]} />
                    <Skeleton style={[styles.skeletonText, { backgroundColor: colors.secondary, width: '60%' }]} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton style={[styles.skeletonButton, { backgroundColor: colors.secondary }]} />
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} style={[styles.skeletonCard, { backgroundColor: colors.secondary }]} />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Conditional Header: Selection Mode vs Normal Mode */}
            {selectionMode === 'flashcards' ? (
                <View style={[styles.selectionHeader, { backgroundColor: colors.primary + '10', borderBottomColor: colors.primary + '30' }]}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerRow}>
                            <Pressable onPress={exitSelectionMode} style={[styles.iconButton, { backgroundColor: 'transparent' }]}>
                                <X size={24} color={colors.primary} />
                            </Pressable>
                            <Text style={[styles.selectionTitle, { color: colors.text }]}>{selectedIds.size} Selected</Text>
                        </View>
                        <Pressable onPress={handleBatchRemove} style={styles.iconButton}>
                            <Trash2 size={22} color={colors.destructive} />
                        </Pressable>
                    </View>
                </View>
            ) : (
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.secondary }]}>
                            <ChevronLeft size={24} color={colors.text} />
                        </Pressable>
                        <View style={styles.headerActions}>
                            <Pressable 
                                onPress={handleImportCSV} 
                                disabled={isImporting}
                                style={[styles.actionButton, { backgroundColor: colors.primaryMuted }]}
                            >
                                <FileSpreadsheet size={18} color={colors.primary} />
                                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                                    {isImporting ? '...' : 'CSV'}
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => router.push(`/flashcard-groups/edit/${id}`)} style={[styles.iconButton, { backgroundColor: colors.secondary }]}>
                                <Edit2 size={18} color={colors.text} />
                            </Pressable>
                            <Pressable onPress={handleDeleteGroup} style={[styles.iconButton, { backgroundColor: colors.destructiveMuted }]}>
                                <Trash2 size={18} color={colors.destructive} />
                            </Pressable>
                        </View>
                    </View>
                    
                    <View style={styles.groupMeta}>
                        <View style={[styles.titleRow, { flex: 1 }]}>
                            <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
                            {group.description && (
                                <Text style={[styles.groupDesc, { color: colors.muted }]} numberOfLines={1}>{group.description}</Text>
                            )}
                        </View>
                        <View style={[styles.badge, { backgroundColor: (group.color || colors.primary) + '20' }]}>
                            <Layers size={14} color={group.color || colors.primary} />
                            <Text style={[styles.badgeText, { color: group.color || colors.primary }]}>{flashcards.length}</Text>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <BookOpen size={16} color={colors.primary} />
                        <View>
                            <Text style={[styles.statsVal, { color: colors.text }]}>{flashcards.length}</Text>
                            <Text style={[styles.statsLabel, { color: colors.muted }]}>Total Cards</Text>
                        </View>
                    </View>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Play size={16} color={colors.primary} />
                        <View>
                            <Text style={[styles.statsVal, { color: colors.text }]}>Today</Text>
                            <Text style={[styles.statsLabel, { color: colors.muted }]}>Last Study</Text>
                        </View>
                    </View>
                </View>

                {/* Main Action */}
                <Button
                    variant={'default'} 
                    onPress={() => router.push({ pathname: '/study/[unitId]', params: { unitId: group.unitId, groupId: group.id } })}
                    disabled={flashcards.length === 0}
                    className="flex-row items-center justify-center gap-2 p-3-5 h-12 my-2 mb-4 "
                >
                    <Play size={20} color="white" fill="white" />
                    <Text style={styles.studyButtonText}>Start Study Session</Text>
                </Button>

                <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>Flashcards</Text>
                    {selectionMode === 'none' && (
                        <Pressable onPress={() => setSelectionMode('flashcards')} style={styles.selectToggle}>
                            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Select</Text>
                        </Pressable>
                    )}
                </View>

                {flashcards.length === 0 ? (
                    <EmptyState 
                        title="No cards here yet" 
                        description="Add flashcards to this group or import them from a CSV file to begin your study journey."
                    />
                ) : (
                    <View style={styles.cardsList}>
                        {flashcards.map((card) => (
                            <FlashcardItem
                                key={card.id}
                                id={card.id}
                                front={card.front}
                                back={card.back}
                                hint={card.hint || undefined}
                                selectionMode={selectionMode === 'flashcards'}
                                isSelected={selectedIds.has(card.id)}
                                onPress={() => {
                                    if (selectionMode === 'flashcards') {
                                        toggleSelection(card.id);
                                    } else {
                                        router.push(`/flashcard/edit/${card.id}`);
                                    }
                                }}
                                onLongPress={() => {
                                    if (selectionMode === 'none') {
                                        setSelectionMode('flashcards');
                                        setSelectedIds(new Set([card.id]));
                                    }
                                }}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            {selectionMode === 'none' && (
                <Pressable
                    onPress={() => router.push(`/flashcard/create?unitId=${group.unitId}&groupId=${group.id}`)}
                    style={({ pressed }) => [
                        styles.fab, 
                        { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.92 : 1 }] }
                    ]}
                >
                    <Plus size={28} color="white" />
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    selectionHeader: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        borderBottomWidth: 1.5,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        height: 40,
        width: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 12,
    },
    actionButtonText: {
        fontWeight: '700',
        fontSize: 13,
    },
    groupMeta: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
    },
    titleRow: {
        gap: 2,
    },
    groupName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    groupDesc: {
        fontSize: 14,
    },
    selectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statsCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    statsVal: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    studyButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 28,
        ...Platform.select({
            ios: {
                shadowColor: '#FF6B6B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    studyButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '800',
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectToggle: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    cardsList: {
        gap: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        height: 60,
        width: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    // Skeletons
    skeletonCircle: {
        height: 40,
        width: 40,
        borderRadius: 20,
    },
    skeletonAction: {
        height: 40,
        width: 60,
        borderRadius: 12,
    },
    skeletonTitle: {
        height: 28,
        width: '50%',
        borderRadius: 8,
        marginBottom: 8,
    },
    skeletonText: {
        height: 16,
        borderRadius: 4,
    },
    skeletonButton: {
        height: 56,
        width: '100%',
        borderRadius: 16,
        marginBottom: 28,
    },
    skeletonCard: {
        height: 80,
        width: '100%',
        borderRadius: 16,
        marginBottom: 12,
    }
});
