import * as React from 'react';
import { Pressable, Dimensions } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VERTICAL_THRESHOLD = 80;

export interface FlashcardData {
    id: string;
    front: string;
    back: string;
    hint?: string | null;
}

interface FlashcardViewerProps {
    flashcard: FlashcardData;
    onCorrect?: () => void;
    onIncorrect?: () => void;
    showGestures?: boolean;
    height?: number;
}

export function FlashcardViewer({
    flashcard,
    onCorrect,
    onIncorrect,
    showGestures = true,
    height = 400,
}: FlashcardViewerProps) {
    const [isFlipped, setIsFlipped] = React.useState(false);

    // Animation values
    const flipRotation = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardScale = useSharedValue(1);

    const handleFlip = () => {
        const nextRotation = isFlipped ? 0 : 180;
        flipRotation.value = withSpring(nextRotation, {
            damping: 18,
            stiffness: 100,
        });
        setIsFlipped(!isFlipped);
    };

    const resetCardAnimations = () => {
        translateY.value = withSpring(0);
        cardScale.value = withSpring(1);
    };

    const handleCorrect = () => {
        if (onCorrect) {
            onCorrect();
        }
        // Reset for next card
        setIsFlipped(false);
        flipRotation.value = 0;
    };

    const handleIncorrect = () => {
        if (onIncorrect) {
            onIncorrect();
        }
        // Reset for next card
        setIsFlipped(false);
        flipRotation.value = 0;
    };

    // Gesture handling
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (!showGestures) return;
            translateY.value = event.translationY;
            const scale = interpolate(
                Math.abs(event.translationY),
                [0, VERTICAL_THRESHOLD],
                [1, 0.95],
                Extrapolation.CLAMP
            );
            cardScale.value = scale;
        })
        .onEnd((event) => {
            if (!showGestures) {
                resetCardAnimations();
                return;
            }

            if (event.translationY < -VERTICAL_THRESHOLD) {
                // Swipe up - correct
                runOnJS(handleCorrect)();
                resetCardAnimations();
            } else if (event.translationY > VERTICAL_THRESHOLD) {
                // Swipe down - incorrect
                runOnJS(handleIncorrect)();
                resetCardAnimations();
            } else {
                // Reset
                resetCardAnimations();
            }
        });

    const cardAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);

        return {
            transform: [
                { translateY: translateY.value },
                { scale: cardScale.value },
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` },
            ],
        };
    });

    // Reset flip state when flashcard changes
    React.useEffect(() => {
        setIsFlipped(false);
        flipRotation.value = 0;
        translateY.value = 0;
        cardScale.value = 1;
    }, [flashcard.id]);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[{ width: '100%', height }, cardAnimatedStyle]}>
                <Pressable onPress={handleFlip} className="w-full h-full">
                    <Card className="w-full h-full items-center justify-center p-8">
                        <Text className="text-2xl font-bold text-foreground text-center">
                            {isFlipped ? flashcard.back : flashcard.front}
                        </Text>
                        {flashcard.hint && !isFlipped && (
                            <Text className="text-sm text-muted-foreground mt-4 text-center italic">
                                Hint: {flashcard.hint}
                            </Text>
                        )}
                    </Card>
                </Pressable>
            </Animated.View>
        </GestureDetector>
    );
}
