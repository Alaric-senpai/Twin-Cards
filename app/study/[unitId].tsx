import * as React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { X, Check, RotateCcw, ChevronLeft } from 'lucide-react-native';
import { useFlashcards, createStudySession } from '@/hooks/useDatabase';
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
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const router = useRouter();
  const { flashcards } = useFlashcards(unitId!);

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

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }

    if (currentIndex < flashcards.length - 1) {
      goToNext();
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    await createStudySession({
      unitId: unitId!,
      cardsReviewed: flashcards.length,
      correctCount,
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

  const cardContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

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

  if (flashcards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl text-foreground text-center mb-6">No flashcards to study in this unit</Text>
        <Button onPress={() => router.back()} className="h-14 w-full rounded-2xl">
          <Text className="text-lg font-bold">Go Back</Text>
        </Button>
      </View>
    );
  }

  if (showSummary) {
    const accuracy = Math.round((correctCount / flashcards.length) * 100);
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full p-8 rounded-3xl bg-card border-transparent">
          <Text className="mb-6 text-center text-3xl font-bold text-foreground">
            Session Complete! 🎉
          </Text>

          <View className="mb-8 space-y-4">
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <Text className="text-lg text-muted-foreground">Cards Reviewed</Text>
              <Text className="text-xl font-bold text-foreground">{flashcards.length}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <Text className="text-lg text-muted-foreground">Correct Answers</Text>
              <Text className="text-xl font-bold text-primary">{correctCount}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-lg text-muted-foreground">Accuracy</Text>
              <Text className="text-xl font-bold text-foreground">{accuracy}%</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Button onPress={() => router.back()} variant="outline" className="flex-1 h-14 rounded-2xl">
              <Text className="text-lg font-bold">Done</Text>
            </Button>
            <Button
              onPress={() => {
                setCurrentIndex(0);
                setCorrectCount(0);
                setShowSummary(false);
                resetCardAnimations();
              }}
              className="flex-1 h-14 rounded-2xl"
            >
              <Icon as={RotateCcw} size={20} className="mr-2 text-primary-foreground" />
              <Text className="text-lg font-bold">Retry</Text>
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 mt-6">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full active:bg-muted mr-2"
        >
          <Icon as={ChevronLeft} size={28} className="text-foreground" />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Study Session</Text>
      </View>

      <View className="flex-1">
        {/* Progress bar */}
        <View className="px-6 pt-2">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-muted-foreground">
              Card {currentIndex + 1} of {flashcards.length}
            </Text>
            <Text className="text-base font-bold text-primary">{Math.round(progress)}%</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-secondary">
            <Animated.View
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Instructions */}
        <View className="px-6 pt-4 items-center">
          <Text className="text-xs text-muted-foreground opacity-50 uppercase tracking-widest text-center">
            Swipe UP/DOWN to navigate • Tap to flip
          </Text>
        </View>

        {/* Flashcard */}
        <View className="flex-1 items-center justify-center p-6 pb-0">
          <GestureDetector gesture={composedGestures}>
            <Animated.View style={[{ width: '100%' }, cardContainerStyle]}>
              {/* Front Card */}
              <Animated.View style={frontCardStyle}>
                <Card className="min-h-[400px] w-full items-center justify-center p-8 rounded-3xl bg-card border-transparent shadow-xl">
                  <Text className="mb-6 text-center text-sm font-bold uppercase text-primary tracking-widest">
                    Question
                  </Text>
                  <Text className="text-center text-2xl font-semibold text-foreground leading-9">
                    {currentCard.front}
                  </Text>
                  {currentCard.hint && !isFlipped && (
                    <View className="mt-8 px-4 py-2 bg-secondary/50 rounded-xl">
                      <Text className="text-center text-base italic text-muted-foreground">
                        💡 {currentCard.hint}
                      </Text>
                    </View>
                  )}
                  <Text className="mt-10 text-center text-sm text-muted-foreground opacity-60">
                    Tap to reveal answer
                  </Text>
                </Card>
              </Animated.View>

              {/* Back Card */}
              <Animated.View
                style={[
                  backCardStyle,
                  { 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                  }
                ]}
              >
                <Card className="min-h-[400px] w-full items-center justify-center p-8 rounded-3xl bg-card border-transparent shadow-xl shadow-primary/5">
                  <Text className="mb-6 text-center text-sm font-bold uppercase text-primary tracking-widest">
                    Answer
                  </Text>
                  <Text className="text-center text-2xl font-semibold text-foreground leading-9">
                    {currentCard.back}
                  </Text>
                  <Text className="mt-10 text-center text-sm text-muted-foreground opacity-60">
                    Did you get it right?
                  </Text>
                </Card>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Answer buttons */}
        <View className="px-6 pb-12 pt-6">
          {isFlipped ? (
            <View className="flex-row gap-4">
              <Button
                onPress={() => handleAnswer(false)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-destructive/20 active:bg-destructive/5"
              >
                <Icon as={X} size={24} className="mr-2 text-destructive" />
                <Text className="text-lg font-bold text-destructive">Incorrect</Text>
              </Button>
              <Button 
                onPress={() => handleAnswer(true)} 
                className="flex-1 h-16 rounded-2xl shadow-lg shadow-primary/20"
              >
                <Icon as={Check} size={24} className="mr-2 text-primary-foreground" />
                <Text className="text-lg font-bold text-primary-foreground">Correct</Text>
              </Button>
            </View>
          ) : (
            <Button 
              onPress={handleFlip} 
              variant="secondary"
              className="w-full h-16 rounded-2xl active:bg-secondary/80"
            >
              <Text className="text-lg font-bold text-foreground">Reveal Answer</Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}