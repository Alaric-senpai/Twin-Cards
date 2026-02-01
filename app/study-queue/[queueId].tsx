import * as React from 'react';
import { View, Pressable, Alert, Dimensions, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { X, Check, ChevronLeft } from 'lucide-react-native';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import {
    getStudyQueueById,
    parseFlashcardIds,
    updateStudyQueueProgress,
    markStudyQueueCompleted,
} from '@/db/services/study-queue.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VERTICAL_THRESHOLD = 80;

export default function StudyQueueScreen() {
    const { queueId } = useLocalSearchParams<{ queueId: string }>();
    const router = useRouter();

    const [queue, setQueue] = React.useState<any>(null);
    const [flashcards, setFlashcards] = React.useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [correctCount, setCorrectCount] = React.useState(0);
    const [showSummary, setShowSummary] = React.useState(false);
    const [isFlipped, setIsFlipped] = React.useState(false);

    // Animation values
    const flipRotation = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const cardOpacity = useSharedValue(1);

    const currentCard = flashcards[currentIndex];
    const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

    // Load queue and flashcards
    React.useEffect(() => {
        loadQueue();
    }, [queueId]);

    const loadQueue = async () => {
        if (!queueId) return;

        const queueData = await getStudyQueueById(queueId);
        if (!queueData) {
            Alert.alert('Error', 'Study queue not found');
            router.back();
            return;
        }

        setQueue(queueData);
        setCurrentIndex(queueData.currentIndex || 0);

        // Load flashcards
        const flashcardIds = parseFlashcardIds(queueData);
        const cards = await Promise.all(
            flashcardIds.map(async (id) => {
                const result = await db()
                    .select()
                    .from(schema.flashcards)
                    .where(eq(schema.flashcards.id, id))
                    .get();
                return result;
            })
        );

        setFlashcards(cards.filter((c) => c !== null));
    };

    const handleFlip = () => {
        const nextRotation = isFlipped ? 0 : 180;
        flipRotation.value = withSpring(nextRotation, { 
          damping: 18,
          stiffness: 100 
        });
        setIsFlipped(!isFlipped);
    };

    const resetCardAnimations = () => {
        flipRotation.value = 0;
        translateY.value = 0;
        cardScale.value = 1;
        cardOpacity.value = 1;
        setIsFlipped(false);
    };

    const handleCorrect = async () => {
        const nextCorrectCount = correctCount + 1;
        setCorrectCount(nextCorrectCount);
        await goToNext();
    };

    const handleIncorrect = async () => {
        await goToNext();
    };

    const goToNext = async () => {
        if (currentIndex < flashcards.length - 1) {
            translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
                runOnJS(setCurrentIndex)(currentIndex + 1);
                runOnJS(resetCardAnimations)();
                translateY.value = 0;
                cardOpacity.value = 0;
                cardOpacity.value = withTiming(1, { duration: 300 });
            });
            // Update progress in database
            await updateStudyQueueProgress(queueId!, currentIndex + 1);
        } else {
            // Session complete
            await markStudyQueueCompleted(queueId!);
            setShowSummary(true);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
                runOnJS(setCurrentIndex)(currentIndex - 1);
                runOnJS(resetCardAnimations)();
                translateY.value = -SCREEN_HEIGHT * 0.3;
                translateY.value = withSpring(0);
                cardOpacity.value = 1;
            });
            updateStudyQueueProgress(queueId!, currentIndex - 1);
        }
    };

    // Gestures
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateY.value = event.translationY;
            const distance = Math.abs(event.translationY);
            cardScale.value = interpolate(
                distance,
                [0, VERTICAL_THRESHOLD],
                [1, 0.95],
                Extrapolation.CLAMP
            );
        })
        .onEnd((event) => {
            const { translationY, velocityY } = event;
            if (translationY < -VERTICAL_THRESHOLD || velocityY < -500) {
                if (currentIndex < flashcards.length - 1) runOnJS(goToNext)();
                else { translateY.value = withSpring(0); cardScale.value = withSpring(1); }
            } else if (translationY > VERTICAL_THRESHOLD || velocityY > 500) {
                if (currentIndex > 0) runOnJS(goToPrevious)();
                else { translateY.value = withSpring(0); cardScale.value = withSpring(1); }
            } else {
                translateY.value = withSpring(0);
                cardScale.value = withSpring(1);
            }
        });

    const tapGesture = Gesture.Tap().onEnd(() => { runOnJS(handleFlip)(); });
    const composedGestures = Gesture.Exclusive(panGesture, tapGesture);

    const cardContainerStyle = useAnimatedStyle(() => {
        const rotateZ = interpolate(translateY.value, [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT], [-5, 0, 5], Extrapolation.CLAMP);
        return {
            transform: [{ translateY: translateY.value }, { scale: cardScale.value }, { rotateZ: `${rotateZ}deg` }],
            opacity: cardOpacity.value,
        };
    });

    const frontCardStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180], Extrapolation.CLAMP);
        const opacity = interpolate(flipRotation.value, [0, 90, 180], [1, 0, 0], Extrapolation.CLAMP);
        return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], opacity, backfaceVisibility: 'hidden' };
    });

    const backCardStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360], Extrapolation.CLAMP);
        const opacity = interpolate(flipRotation.value, [0, 90, 180], [0, 0, 1], Extrapolation.CLAMP);
        return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], opacity, backfaceVisibility: 'hidden' };
    });

    // Reset state when card changes
    React.useEffect(() => { setIsFlipped(false); }, [currentIndex]);

    const renderContent = () => {
        if (showSummary) {
            return (
                <View style={styles.centerContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Session Complete! 🎉</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Cards Reviewed</Text>
                                <Text style={styles.statValue}>{flashcards.length}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Correct Answers</Text>
                                <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{correctCount}</Text>
                            </View>
                        </View>
                        <Pressable onPress={() => router.back()} style={styles.doneButton}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        if (!currentCard) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator color="#FF6B6B" size="large" />
                </View>
            );
        }

        return (
            <>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <ChevronLeft size={28} color="#F1F5F9" />
                        </Pressable>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>
                                Queue: {correctCount} / {currentIndex + 1}
                            </Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                        Card {currentIndex + 1} of {flashcards.length}
                    </Text>
                </View>

                {/* Flashcard */}
                <View style={styles.cardSection}>
                    <GestureDetector gesture={composedGestures}>
                        <Animated.View style={[{ width: '100%' }, cardContainerStyle]}>
                            <Animated.View style={frontCardStyle}>
                                <View style={styles.flashcard}>
                                    <Text style={styles.cardLabel}>Question</Text>
                                    <Text style={styles.cardText}>{currentCard.front}</Text>
                                    {currentCard.hint && (
                                        <View style={styles.hintContainer}>
                                            <Text style={styles.hintText}>💡 {currentCard.hint}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.cardFooter}>Tap to reveal answer</Text>
                                </View>
                            </Animated.View>
                            <Animated.View style={[backCardStyle, styles.backCardOverlay]}>
                                <View style={styles.flashcard}>
                                    <Text style={styles.cardLabel}>Answer</Text>
                                    <Text style={styles.cardText}>{currentCard.back}</Text>
                                    <Text style={styles.cardFooter}>Did you get it right?</Text>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {isFlipped ? (
                        <View style={styles.buttonRow}>
                            <Pressable onPress={handleIncorrect} style={[styles.incorrectButton, { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }]}>
                                <X size={24} color="#EF4444" />
                                <Text style={styles.incorrectButtonText}>Incorrect</Text>
                            </Pressable>
                            <Pressable onPress={handleCorrect} style={[styles.correctButton, { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }]}>
                                <Check size={24} color="white" />
                                <Text style={styles.correctButtonText}>Correct</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable onPress={handleFlip} style={[styles.revealButton, { alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={styles.revealButtonText}>Reveal Answer</Text>
                        </Pressable>
                    )}
                </View>
            </>
        );
    };

    return (
        <View style={styles.container}>
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    backButton: {
        height: 40,
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B6B',
        textAlign: 'center',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#334155',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FF6B6B',
    },
    progressText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },
    cardSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingBottom: 0,
    },
    flashcard: {
        minHeight: 400,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderRadius: 24,
        backgroundColor: '#1E293B',
        borderWidth: 0,
    },
    cardLabel: {
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#FF6B6B',
        letterSpacing: 1,
    },
    cardText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        color: '#F1F5F9',
        lineHeight: 36,
    },
    hintContainer: {
        marginTop: 32,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
        borderRadius: 12,
    },
    hintText: {
        textAlign: 'center',
        fontSize: 16,
        fontStyle: 'italic',
        color: '#94A3B8',
    },
    cardFooter: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 14,
        color: '#64748B',
        opacity: 0.6,
    },
    backCardOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
    },
    incorrectButton: {
        flex: 1,
        height: 64,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    incorrectButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    correctButton: {
        flex: 1,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#FF6B6B',
    },
    correctButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    revealButton: {
        width: '100%',
        height: 64,
        borderRadius: 16,
        backgroundColor: '#334155',
    },
    revealButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F1F5F9',
    },
    summaryCard: {
        width: '100%',
        padding: 32,
        borderRadius: 24,
        backgroundColor: '#1E293B',
        borderWidth: 0,
    },
    summaryTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#F1F5F9',
        marginBottom: 16,
        textAlign: 'center',
    },
    statsContainer: {
        marginBottom: 32,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    },
    statLabel: {
        fontSize: 18,
        color: '#94A3B8',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F1F5F9',
    },
    doneButton: {
        height: 56,
        width: '100%',
        borderRadius: 16,
        backgroundColor: '#FF6B6B',
    },
    doneButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
