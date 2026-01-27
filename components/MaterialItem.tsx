import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { FileText, FileSpreadsheet, ChevronRight } from 'lucide-react-native';

interface MaterialItemProps {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  onPress: () => void;
}

export function MaterialItem({ fileName, fileType, fileSize, onPress }: MaterialItemProps) {
  const IconComponent = fileType === 'pdf' ? FileText : FileSpreadsheet;
  const formattedSize = fileSize ? formatFileSize(fileSize) : null;

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-2 flex-row items-center p-4">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon as={IconComponent} size={20} className="text-accent" />
        </View>

        <View className="flex-1 mr-3">
          <Text className="text-base font-medium text-card-foreground" numberOfLines={1}>
            {fileName}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-2">
            <Text className="text-xs uppercase text-muted-foreground">{fileType}</Text>
            {formattedSize && (
              <>
                <Text className="text-xs text-muted-foreground">•</Text>
                <Text className="text-xs text-muted-foreground">{formattedSize}</Text>
              </>
            )}
          </View>
        </View>

        <Icon as={ChevronRight} size={20} className="text-muted-foreground" />
      </Card>
    </Pressable>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
