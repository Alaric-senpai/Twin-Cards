import * as React from 'react';
import { View, TextInput } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Search } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  className,
}: SearchBarProps) {
  return (
    <View className={cn('flex-row items-center rounded-lg bg-secondary px-4 py-3', className)}>
      <Icon as={Search} size={20} className="mr-2 text-muted-foreground" />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // placeholderTextColor="hsl(var(--primary))"
        className="flex-1 text-base text-foreground"
      />
    </View>
  );
}

