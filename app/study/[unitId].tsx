import * as React from 'react';
import { View, Pressable, Dimensions, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { X, Check, RotateCcw, ChevronLeft } from 'lucide-react-native';
import { useFlashcards, useFlashcardsByGroupId, createStudySession } from '@/hooks/useDatabase';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VERTICAL_THRESHOLD = 80;

export default function StudySessionScreen() {
  const { unitId, groupId } = useLocalSearchParams<{ unitId: string, groupId?: string }>();
  const router = useRouter();
  const unitCards = useFlashcards(unitId!);
  const groupCards = useFlashcardsByGroupId(groupId || '');
  
  const { flashcards } = groupId ? groupCards : unitCards;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [sessionStartTime] = React.useState(Date.now());
  const [showSummary, setShowSummary] = React.useState(false);

  // Animation values
  const flipRotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

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
    cardOpacity.value = 1;
    cardScale.value = 1;
    setIsFlipped(false);
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        runOnJS(resetCardAnimations)();
        translateY.value = 0;
        cardOpacity.value = 0;
        cardOpacity.value = withTiming(1, { duration: 300 });
      });
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
    }
  };

  const handleCorrect = () => {
    const nextCorrectCount = correctCount + 1;
    setCorrectCount(nextCorrectCount);

    if (currentIndex < flashcards.length - 1) {
      goToNext();
    } else {
      finishSession(nextCorrectCount);
    }
  };

  const handleIncorrect = () => {
    if (currentIndex < flashcards.length - 1) {
      goToNext();
    } else {
      finishSession(correctCount);
    }
  };

  const finishSession = async (finalCorrectCount: number) => {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    await createStudySession({
      unitId: unitId!,
      cardsReviewed: flashcards.length,
      correctCount: finalCorrectCount,
      sessionDuration: duration,
    });
    setShowSummary(true);
  };

  // Simplified gesture: vertical swipe for navigation, tap for flip
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
        // Swipe up - next card
        if (currentIndex < flashcards.length - 1) {
          runOnJS(goToNext)();
        } else {
          translateY.value = withSpring(0);
          cardScale.value = withSpring(1);
        }
      } else if (translationY > VERTICAL_THRESHOLD || velocityY > 500) {
        // Swipe down - previous card
        if (currentIndex > 0) {
          runOnJS(goToPrevious)();
        } else {
          translateY.value = withSpring(0);
          cardScale.value = withSpring(1);
        }
      } else {
        // Reset
        translateY.value = withSpring(0);
        cardScale.value = withSpring(1);
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handleFlip)();
    });

  const composedGestures = Gesture.Exclusive(panGesture, tapGesture);

  const cardContainerStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      translateY.value,
      [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
      [-5, 0, 5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY: translateY.value },
        { scale: cardScale.value },
        { rotateZ: `${rotateZ}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  const frontCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 180],
      [0, 180],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      flipRotation.value,
      [0, 90, 180],
      [1, 0, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` }
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  const backCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 180],
      [180, 360],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      flipRotation.value,
      [0, 90, 180],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` }
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  // Reset state when card changes
  React.useEffect(() => { setIsFlipped(false); }, [currentIndex]);

  const renderContent = () => {
    if (flashcards.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No flashcards to study in this unit</Text>
          <Pressable onPress={() => router.back()} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Go Back</Text>
          </Pressable>
        </View>
      );
    }

    if (showSummary) {
      const accuracy = Math.round((correctCount / flashcards.length) * 100);
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
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Accuracy</Text>
                <Text style={styles.statValue}>{accuracy}%</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Pressable onPress={() => router.back()} style={[styles.doneButton, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' }]}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCurrentIndex(0);
                  setCorrectCount(0);
                  setShowSummary(false);
                  resetCardAnimations();
                }}
                style={[styles.doneButton, { flex: 1, flexDirection: 'row', gap: 8 }]}
              >
                <RotateCcw size={20} color="white" />
                <Text style={styles.doneButtonText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color="#F1F5F9" />
          </Pressable>
          <Text style={styles.headerTitle}>Study Session</Text>
        </View>

        <View style={{ flex: 1 }}>
          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>
                Card {currentIndex + 1} of {flashcards.length}
              </Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Swipe UP/DOWN to navigate • Tap to flip
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
                    {currentCard.hint && !isFlipped && (
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

          {/* Answer buttons */}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 16,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  progressInfo: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  instructions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: '#94A3B8',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
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
    top: 0,
    left: 0,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
  emptyText: {
    fontSize: 20,
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#1E293B',
  },
  summaryTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 32,
    gap: 0,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});