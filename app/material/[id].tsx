import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ExternalLink, FileText, ChevronLeft } from 'lucide-react-native';
import { useMaterial } from '@/hooks/useDatabase';
import * as Sharing from 'expo-sharing';

export default function MaterialViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { material } = useMaterial(id!);

  const handleOpenFile = async () => {
    if (!material) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(material.fileUri, {
          mimeType: material.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.ms-powerpoint',
          dialogTitle: material.fileName,
        });
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  if (!material) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Material not found</Text>
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
        <Text className="text-2xl font-bold text-foreground flex-1" numberOfLines={1}>
          {material.fileName}
        </Text>
      </View>

      <View className="flex-1">
        <ScrollView className="flex-1 p-6" contentContainerClassName="flex-1 items-center justify-center">
          <View className="items-center justify-center w-full max-w-sm">
            <View className="mb-8 h-32 w-32 items-center justify-center rounded-3xl bg-primary/10">
              <Icon as={FileText} size={64} className="text-primary" />
            </View>
            
            <Text className="mb-2 text-center text-2xl font-bold text-foreground">
              {material.fileName}
            </Text>
            
            <Text className="mb-8 text-center text-sm font-bold uppercase text-muted-foreground tracking-widest">
              {material.fileType} Document
            </Text>
            
            <Button onPress={handleOpenFile} className="w-full h-16 rounded-2xl shadow-lg">
              <Icon as={ExternalLink} size={20} className="mr-2 text-primary-foreground" />
              <Text className="text-lg font-bold">Open in External App</Text>
            </Button>
            
            <Text className="mt-6 text-center text-sm text-muted-foreground opacity-60">
              This will open the file in your device's default {material.fileType} viewer
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
