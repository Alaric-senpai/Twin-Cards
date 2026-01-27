import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { BookOpen, FileText, Folder, Beaker, GraduationCap, ChevronRight, type LucideIcon } from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  book: BookOpen,
  folder: Folder,
  file: FileText,
  beaker: Beaker,
  graduation: GraduationCap,
};

interface UnitCardProps {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  flashcardCount: number;
  materialCount: number;
  onPress: () => void;
}

export function UnitCard({
  title,
  description,
  color = '#FF6B6B',
  icon = 'book',
  flashcardCount,
  materialCount,
  onPress,
}: UnitCardProps) {
  const IconComponent = ICON_MAP[icon] || BookOpen;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="p-4 border-transparent bg-card overflow-hidden">
        <View className="flex-row items-start">
          {/* Icon with gradient background */}
          <View
            className="mr-4 h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: color }}>
            <Icon as={IconComponent} size={26} className="text-white" />
          </View>

          {/* Content */}
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
            {description && (
              <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>
                {description}
              </Text>
            )}
            
            {/* Stats */}
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <View className="h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Icon as={BookOpen} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-medium text-foreground">
                  {flashcardCount}
                </Text>
              </View>
              
              <View className="flex-row items-center gap-1.5">
                <View className="h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Icon as={FileText} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-medium text-foreground">
                  {materialCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrow indicator */}
          <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/50 self-center">
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
