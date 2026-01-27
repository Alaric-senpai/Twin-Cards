import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Folder, FileText, Beaker, GraduationCap, ChevronLeft } from 'lucide-react-native';
import { useUnit, updateUnit } from '@/hooks/useDatabase';
import { cn } from '@/lib/utils';

const COLORS = [
  { value: '#FF6B6B', label: 'Coral' },
  { value: '#4ECDC4', label: 'Teal' },
  { value: '#45B7D1', label: 'Blue' },
  { value: '#FFA07A', label: 'Salmon' },
  { value: '#98D8C8', label: 'Mint' },
  { value: '#F7DC6F', label: 'Yellow' },
  { value: '#BB8FCE', label: 'Purple' },
  { value: '#85C1E2', label: 'Sky' },
];

const ICONS = [
  { value: 'book', icon: BookOpen, label: 'Book' },
  { value: 'folder', icon: Folder, label: 'Folder' },
  { value: 'file', icon: FileText, label: 'File' },
  { value: 'beaker', icon: Beaker, label: 'Science' },
  { value: 'graduation', icon: GraduationCap, label: 'Graduation' },
];

export default function EditUnitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { unit } = useUnit(id!);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = React.useState(ICONS[0].value);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (unit) {
      setTitle(unit.title);
      setDescription(unit.description || '');
      setSelectedColor(unit.color || COLORS[0].value);
      setSelectedIcon(unit.icon || ICONS[0].value);
    }
  }, [unit]);

  const handleUpdate = async () => {
    if (!title.trim() || !id) return;

    setIsSubmitting(true);
    try {
      await updateUnit(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!unit) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Unit not found</Text>
      </View>
    );
  }

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
        <Text className="text-2xl font-bold text-foreground">Edit Unit</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Title */}
          <View className="mb-6">
            <Label nativeID="title" className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Title *
            </Label>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Organic Chemistry"
              placeholderTextColor="hsl(var(--muted-foreground))"
              className="h-14 text-lg bg-card border-transparent dark:bg-card"
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Label nativeID="description" className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Description (Optional)
            </Label>
            <Textarea
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this unit..."
              placeholderTextColor="hsl(var(--muted-foreground))"
              numberOfLines={4}
              className="bg-card border-transparent dark:bg-card text-lg"
            />
          </View>

          {/* Color picker */}
          <View className="mb-6">
            <Label className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Color</Label>
            <View className="flex-row flex-wrap gap-4">
              {COLORS.map((color) => (
                <Pressable
                  key={color.value}
                  onPress={() => setSelectedColor(color.value)}
                  className={cn(
                    'h-14 w-14 items-center justify-center rounded-full border-2 border-transparent',
                    selectedColor === color.value && 'border-primary'
                  )}
                >
                  <View 
                    style={{ backgroundColor: color.value }}
                    className="h-10 w-10 rounded-full"
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Icon picker */}
          <View className="mb-8">
            <Label className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Icon</Label>
            <View className="flex-row flex-wrap gap-4">
              {ICONS.map((iconItem) => (
                <Pressable
                  key={iconItem.value}
                  onPress={() => setSelectedIcon(iconItem.value)}
                  className={cn(
                    'h-16 w-16 items-center justify-center rounded-2xl bg-card border-2 border-transparent',
                    selectedIcon === iconItem.value && 'border-primary bg-primary/10'
                  )}>
                  <Icon
                    as={iconItem.icon}
                    size={32}
                    className={cn(
                      'text-muted-foreground',
                      selectedIcon === iconItem.value && 'text-primary'
                    )}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Update button */}
          <Button
            onPress={handleUpdate}
            disabled={!title.trim() || isSubmitting}
            className="h-14 rounded-2xl shadow-lg"
          >
            <Text className="text-lg font-bold">{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
          </Button>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
