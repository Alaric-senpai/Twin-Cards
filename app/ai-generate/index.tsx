import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet, Text, Platform, Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Sparkles, BookOpen, FileText, CheckCircle2, AlertCircle, Save, X, Check } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { validateEnv } from '@/lib/env';
import { useUnits, useMaterials, createFlashcards } from '@/hooks/useDatabase';
import { generateFlashcardsFromAI, GeneratedFlashcard } from '@/lib/ai';
import { Card } from '@/components/ui/card';
import * as FileSystem from 'expo-file-system/legacy';

export default function AIGenerateScreen() {
    const { unitId: initialUnitId } = useLocalSearchParams<{ unitId: string }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [hasApiKey, setHasApiKey] = React.useState(false);

    // Flow State
    const [step, setStep] = React.useState<'select-unit' | 'select-materials' | 'processing' | 'review'>('select-unit');
    const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(initialUnitId || null);
    const [selectedMaterialIds, setSelectedMaterialIds] = React.useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedCards, setGeneratedCards] = React.useState<GeneratedFlashcard[]>([]);
    const [cardsToSave, setCardsToSave] = React.useState<Set<number>>(new Set());

    // Data
    const { units, isLoading: isUnitsLoading } = useUnits();
    const { materials, isLoading: isMaterialsLoading } = useMaterials(selectedUnitId || '');

    React.useEffect(() => {
        setHasApiKey(validateEnv());
        if (initialUnitId) {
            setStep('select-materials');
        }
    }, [initialUnitId]);

    // Derived theme colors
    const colors = {
        background: isDark ? '#0F172A' : '#F8FAFC',
        card: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F1F5F9' : '#0F172A',
        muted: isDark ? '#94A3B8' : '#64748B',
        border: isDark ? '#334155' : '#E2E8F0',
        primary: '#FF6B6B',
        secondary: isDark ? '#334155' : '#F1F5F9',
        destructive: '#EF4444',
        success: '#10B981',
    };

    const handleSelectUnit = (id: string) => {
        setSelectedUnitId(id);
        setStep('select-materials');
    };

    const toggleMaterial = (id: string) => {
        const next = new Set(selectedMaterialIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMaterialIds(next);
    };

    const getMimeType = (type: string, fileName: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType === 'pdf' || fileName.endsWith('.pdf')) return 'application/pdf';
        if (lowerType === 'pptx' || fileName.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        if (lowerType === 'html' || fileName.endsWith('.html')) return 'text/html';
        return 'text/plain';
    };

    const handleGenerate = async () => {
        if (selectedMaterialIds.size === 0) {
            Alert.alert('Selection Required', 'Please select at least one material to process.');
            return;
        }

        setStep('processing');
        setIsGenerating(true);

        try {
            const selectedMaterials = materials.filter(m => selectedMaterialIds.has(m.id));
            const attachments: { data: string; mimeType: string }[] = [];

            for (const material of selectedMaterials) {
                try {
                    const base64 = await FileSystem.readAsStringAsync(material.fileUri, {
                        encoding: 'base64',
                    });

                    attachments.push({
                        data: base64,
                        mimeType: getMimeType(material.fileType, material.fileName),
                    });
                } catch (e) {
                    console.warn(`Could not read file ${material.fileName}`, e);
                }
            }

            if (attachments.length === 0) {
                throw new Error('No content could be extracted from the selected materials.');
            }

            const cards = await generateFlashcardsFromAI(
                `Please analyze the attached materials and generate flashcards. Source materials: ${selectedMaterials.map(m => m.fileName).join(', ')}`,
                attachments
            );
            setGeneratedCards(cards);
            setCardsToSave(new Set(cards.map((_, i) => i)));
            setStep('review');
        } catch (error) {
            console.error('Generation failed:', error);
            Alert.alert('Generation Failed', 'An error occurred while generating flashcards. Please try again.');
            setStep('select-materials');
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleCardSelection = (index: number) => {
        const next = new Set(cardsToSave);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setCardsToSave(next);
    };

    const handleSave = async () => {
        if (!selectedUnitId || cardsToSave.size === 0) return;

        try {
            const finalCards = generatedCards
                .filter((_, i) => cardsToSave.has(i))
                .map(card => ({
                    unitId: selectedUnitId,
                    front: card.front,
                    back: card.back,
                    hint: card.hint || null,
                }));

            await createFlashcards(finalCards);
            Alert.alert('Success', `Saved ${finalCards.length} flashcards to your library.`, [
                { text: 'View Unit', onPress: () => router.push(`/unit/${selectedUnitId}`) },
                { text: 'Done', onPress: () => router.push('/(tabs)/study') }
            ]);
        } catch (error) {
            console.error('Save failed:', error);
            Alert.alert('Error', 'Failed to save flashcards.');
        }
    };

    const renderContent = () => {
        if (!hasApiKey) {
            return (
                <View style={[styles.card, { borderColor: colors.destructive, borderWidth: 1.5, backgroundColor: colors.destructive + '05' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.destructive }]}>API Key Missing</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={{ color: colors.muted, marginBottom: 16, lineHeight: 20 }}>
                            The AI Gateway API key is not configured. Please add it to your
                            .env file to enable AI generation features.
                        </Text>
                        <View style={[styles.codeBlock, { backgroundColor: isDark ? '#00000040' : '#00000008', borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.codeText, { color: colors.muted }]}>
                                AI_GATEWAY_API_KEY=your_key_here
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        switch (step) {
            case 'select-unit':
                return (
                    <View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a Unit</Text>
                        {isUnitsLoading ? (
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                        ) : units.length === 0 ? (
                            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 20 }}>No units found. Create one first!</Text>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {units.map(unit => (
                                    <Pressable key={unit.id} onPress={() => handleSelectUnit(unit.id)}>
                                        <Card style={[styles.selectableItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                            <View style={[styles.unitIcon, { backgroundColor: (unit.color || colors.primary) + '20' }]}>
                                                <BookOpen size={20} color={unit.color || colors.primary} />
                                            </View>
                                            <Text style={[styles.itemTitle, { color: colors.text }]}>{unit.title}</Text>
                                        </Card>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                );

            case 'select-materials':
                return (
                    <View>
                        <View style={styles.stepHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Materials</Text>
                            <Pressable onPress={() => setStep('select-unit')}>
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>Change Unit</Text>
                            </Pressable>
                        </View>
                        {isMaterialsLoading ? (
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                        ) : materials.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <AlertCircle size={40} color={colors.muted} />
                                <Text style={[styles.emptyText, { color: colors.muted }]}>
                                    No materials found in this unit. Add some PDFs or presentation files first.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {materials.map(material => {
                                    const isSelected = selectedMaterialIds.has(material.id);
                                    return (
                                        <Pressable key={material.id} onPress={() => toggleMaterial(material.id)}>
                                            <Card style={[
                                                styles.selectableItem, 
                                                { backgroundColor: colors.card },
                                                isSelected ? { borderColor: colors.primary, borderWidth: 2 } : { borderColor: colors.border }
                                            ]}>
                                                <View style={[styles.unitIcon, { backgroundColor: colors.primary + '10' }]}>
                                                    <FileText size={20} color={colors.primary} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{material.fileName}</Text>
                                                    <Text style={{ color: colors.muted, fontSize: 12 }}>{material.fileType.toUpperCase()}</Text>
                                                </View>
                                                {isSelected && <CheckCircle2 size={24} color={colors.primary} />}
                                            </Card>
                                        </Pressable>
                                    );
                                })}
                                <Pressable 
                                    onPress={handleGenerate}
                                    style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 12 }]}
                                    disabled={selectedMaterialIds.size === 0}
                                >
                                    <Sparkles size={20} color="white" />
                                    <Text style={styles.primaryButtonText}>Generate Flashcards</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                );

            case 'processing':
                return (
                    <View style={styles.processingContainer}>
                        <View style={[styles.largeIcon, { backgroundColor: colors.primary + '10' }]}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                        <Text style={[styles.comingSoonTitle, { color: colors.text, marginTop: 24 }]}>
                            AI is Working
                        </Text>
                        <Text style={[styles.comingSoonText, { color: colors.muted }]}>
                            Analyzing your materials and crafting perfect flashcards. This may take a minute...
                        </Text>
                    </View>
                );

            case 'review':
                return (
                    <View>
                        <View style={styles.stepHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Review & Save</Text>
                            <Text style={{ color: colors.muted }}>{cardsToSave.size} of {generatedCards.length} selected</Text>
                        </View>
                        <View style={{ gap: 16, marginBottom: 100 }}>
                            {generatedCards.map((card, index) => {
                                const isSelected = cardsToSave.has(index);
                                return (
                                    <Pressable key={index} onPress={() => toggleCardSelection(index)}>
                                        <Card style={[
                                            styles.generatedCard, 
                                            { backgroundColor: colors.card },
                                            isSelected ? { borderColor: colors.primary, borderWidth: 1 } : { borderColor: colors.border, opacity: 0.6 }
                                        ]}>
                                            <View style={styles.cardSelectHeader}>
                                                <View style={[styles.selectionDot, { backgroundColor: isSelected ? colors.primary : 'transparent', borderColor: isSelected ? colors.primary : colors.border }]}>
                                                    {isSelected && <Check size={12} color="white" />}
                                                </View>
                                                <Text style={[styles.cardIndex, { color: colors.muted }]}>Card {index + 1}</Text>
                                            </View>
                                            <View style={styles.cardContent}>
                                                <Text style={[styles.cardLabel, { color: colors.primary }]}>FRONT</Text>
                                                <Text style={[styles.cardText, { color: colors.text }]}>{card.front}</Text>
                                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                                <Text style={[styles.cardLabel, { color: colors.success }]}>BACK</Text>
                                                <Text style={[styles.cardText, { color: colors.text }]}>{card.back}</Text>
                                                {card.hint && (
                                                    <>
                                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                                        <Text style={[styles.cardLabel, { color: colors.muted }]}>HINT</Text>
                                                        <Text style={[styles.cardText, { color: colors.muted, fontSize: 13 }]}>{card.hint}</Text>
                                                    </>
                                                )}
                                            </View>
                                        </Card>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Pressable 
                    onPress={() => step === 'select-unit' ? router.back() : setStep('select-unit')}
                    style={({ pressed }) => [
                        styles.iconButton, 
                        { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }
                    ]}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]}>AI Generate</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        {step === 'review' ? 'Success! Review your cards' : 'Create flashcards from your library'}
                    </Text>
                </View>
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderContent()}
            </ScrollView>

            {step === 'review' && (
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <Pressable 
                        onPress={handleSave}
                        style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 1 }]}
                        disabled={cardsToSave.size === 0}
                    >
                        <Save size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Save {cardsToSave.size} Cards</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 54,
        paddingBottom: 24,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        height: 44,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    selectableItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    unitIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        paddingHorizontal: 40,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#FF6B6B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            }
        })
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    processingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    largeIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    comingSoonTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    comingSoonText: {
        fontSize: 15,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 24,
        marginTop: 12,
    },
    generatedCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardSelectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 0,
        gap: 8,
    },
    selectionDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardIndex: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    cardContent: {
        padding: 16,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 1,
    },
    cardText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 12,
        opacity: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        borderTopWidth: 1,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    codeBlock: {
        padding: 14,
        borderRadius: 12,
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        fontWeight: '500',
    },
});
