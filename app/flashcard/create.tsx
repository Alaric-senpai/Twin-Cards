import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react-native';
import { createFlashcard } from '@/hooks/useDatabase';

export default function CreateFlashcardScreen() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const [front, setFront] = React.useState('');
  const [back, setBack] = React.useState('');
  const [hint, setHint] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreate = async () => {
    if (!front.trim() || !back.trim() || !unitId) return;

    setIsSubmitting(true);
    try {
      await createFlashcard({
        unitId,
        front: front.trim(),
        back: back.trim(),
        hint: hint.trim() || undefined,
      });
      router.back();
    } catch (error) {
      console.error('Failed to create flashcard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-4 mt-6">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full active:bg-muted mr-2"
        >
          <Icon as={ChevronLeft} size={28} className="text-foreground" />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Create Flashcard</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Front */}
          <View className="mb-6">
            <Label nativeID="front" className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Front (Question) *
            </Label>
            <Textarea
              value={front}
              onChangeText={setFront}
              placeholder="Enter the question or prompt..."
              placeholderTextColor="hsl(var(--muted-foreground))"
              numberOfLines={4}
              className="bg-card border-transparent dark:bg-card text-lg"
            />
          </View>

          {/* Back */}
          <View className="mb-6">
            <Label nativeID="back" className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Back (Answer) *
            </Label>
            <Textarea
              value={back}
              onChangeText={setBack}
              placeholder="Enter the answer..."
              placeholderTextColor="hsl(var(--muted-foreground))"
              numberOfLines={4}
              className="bg-card border-transparent dark:bg-card text-lg"
            />
          </View>

          {/* Hint */}
          <View className="mb-8">
            <Label nativeID="hint" className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Hint (Optional)
            </Label>
            <Textarea
              value={hint}
              onChangeText={setHint}
              placeholder="Add a helpful hint..."
              placeholderTextColor="hsl(var(--muted-foreground))"
              numberOfLines={2}
              className="bg-card border-transparent dark:bg-card text-lg"
            />
          </View>

          {/* Create button */}
          <Button
            onPress={handleCreate}
            disabled={!front.trim() || !back.trim() || isSubmitting}
            className="h-14 rounded-2xl shadow-lg"
          >
            <Text className="text-lg font-bold">{isSubmitting ? 'Creating...' : 'Create Flashcard'}</Text>
          </Button>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
