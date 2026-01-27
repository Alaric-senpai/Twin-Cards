import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Logo, LogoWithText } from '@/constants/images';
import { Icon } from '@/components/ui/icon';
import { MoonStar, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface HeaderProps {
  title?: string;
  showThemeToggle?: boolean;
}

export function Header({ showThemeToggle = true }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-row items-center justify-between mb-3 mx-3 mt-5 bg-background">
      <View className="flex-row items-center">
        <Image
          source={Logo}
          style={{ width:60, height: 60, borderRadius: 999 }}
          contentFit="contain"
          alt="Twin Cards"
        />
      </View>
      
      {showThemeToggle && (
        <Pressable
          onPress={toggleColorScheme}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
        >
          <Icon
            as={colorScheme === 'dark' ? Sun : MoonStar}
            size={40}
            className="text-foreground"
          />
        </Pressable>
      )}
    </View>
  );
}
