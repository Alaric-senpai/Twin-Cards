import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ChevronRight } from 'lucide-react-native';

interface FlashcardItemProps {
  id: string;
  front: string;
  back: string;
  hint?: string;
  onPress: () => void;
}

export function FlashcardItem({ front, back, hint, onPress }: FlashcardItemProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-2 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-base font-medium text-card-foreground" numberOfLines={2}>
              {front}
            </Text>
            {hint && (
              <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
                Hint: {hint}
              </Text>
            )}
          </View>
          <Icon as={ChevronRight} size={20} className="text-muted-foreground" />
        </View>
      </Card>
    </Pressable>
  );
}
