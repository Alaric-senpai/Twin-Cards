import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Logo } from '@/constants/images';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-transparent">
      <View className="items-center justify-center mb-6">
        <Image 
          source={Logo} 
          style={{ width: 150, height: 150 }} 
          contentFit="contain"
          alt="Twin Cards Logo" 
        />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-foreground">
        {title}
      </Text>
      <Text className="text-center text-sm text-muted-foreground max-w-[250px]">
        {description}
      </Text>
    </View>
  );
}
