import * as React from 'react';
import { View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { 
  ChevronLeft, ExternalLink, FileText, AlertCircle, RefreshCw 
} from 'lucide-react-native';
import { useMaterial } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

export default function MaterialViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { material, isLoading } = useMaterial(id!);

  const [webViewError, setWebViewError] = React.useState(false);
  const [webViewLoading, setWebViewLoading] = React.useState(true);
  const webViewRef = React.useRef<WebView>(null);

  const handleOpenExternal = async () => {
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

  const handleRetry = () => {
    setWebViewError(false);
    setWebViewLoading(true);
    webViewRef.current?.reload();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-4 mt-6 mb-4">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <Skeleton className="h-[70%] w-full rounded-2xl" />
        </View>
      </View>
    );
  }

  if (!material) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Icon as={AlertCircle} size={64} className="text-destructive mb-4" />
        <Text className="text-xl font-bold text-foreground mb-2">Material not found</Text>
        <Text className="text-sm text-muted-foreground mb-6 text-center">
          This file may have been deleted or doesn't exist
        </Text>
        <Button onPress={() => router.back()} className="h-12 px-6 rounded-xl">
          <Text className="font-bold">Go Back</Text>
        </Button>
      </View>
    );
  }

  const isPDF = material.fileType === 'pdf';

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 mt-6 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable 
              onPress={() => router.back()} 
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted mr-3"
            >
              <Icon as={ChevronLeft} size={26} className="text-foreground" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
                {material.fileName}
              </Text>
              <Text className="text-xs text-muted-foreground uppercase tracking-wide">
                {material.fileType} Document
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleOpenExternal}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <Icon as={ExternalLink} size={20} className="text-foreground" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {isPDF ? (
          webViewError ? (
            <View className="flex-1 items-center justify-center p-6">
              <Icon as={AlertCircle} size={64} className="text-destructive mb-4" />
              <Text className="text-xl font-bold text-foreground mb-2">Unable to display PDF</Text>
              <Text className="text-sm text-muted-foreground mb-6 text-center">
                This PDF couldn't be loaded in-app. Open it in an external PDF reader for the best experience.
              </Text>
              <View className="flex-row gap-3 w-full max-w-sm">
                <Button onPress={handleRetry} variant="outline" className="flex-1 h-12 rounded-xl">
                  <Icon as={RefreshCw} size={18} className="mr-2 text-foreground" />
                  <Text className="font-bold">Retry</Text>
                </Button>
                <Button onPress={handleOpenExternal} className="flex-1 h-12 rounded-xl">
                  <Icon as={ExternalLink} size={18} className="mr-2 text-primary-foreground" />
                  <Text className="font-bold">Open External</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View className="flex-1">
              {webViewLoading && (
                <View className="absolute inset-0 items-center justify-center bg-background z-10">
                  <ActivityIndicator size="large" color="#FF6B6B" />
                  <Text className="mt-4 text-sm text-muted-foreground">Loading PDF...</Text>
                </View>
              )}
              <WebView
                ref={webViewRef}
                source={{ uri: material.fileUri }}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                  setWebViewError(true);
                  setWebViewLoading(false);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView HTTP error:', nativeEvent);
                  // Don't set error for HTTP errors as they might be false positives
                }}
                style={{ flex: 1, backgroundColor: '#1E293B' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                bounces={false}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            </View>
          )
        ) : (
          // PPTX - Enhanced external app prompt
          <View className="flex-1 items-center justify-center p-6">
            <View className="items-center justify-center w-full max-w-sm">
              <View className="mb-8 h-32 w-32 items-center justify-center rounded-3xl bg-primary/10">
                <Icon as={FileText} size={64} className="text-primary" />
              </View>
              
              <Text className="mb-2 text-center text-2xl font-bold text-foreground">
                {material.fileName}
              </Text>
              
              <Text className="mb-8 text-center text-sm text-muted-foreground">
                PowerPoint presentations are best viewed in dedicated apps like Microsoft PowerPoint or Google Slides
              </Text>
              
              <Button onPress={handleOpenExternal} className="w-full h-16 rounded-2xl shadow-lg">
                <Icon as={ExternalLink} size={20} className="mr-2 text-primary-foreground" />
                <Text className="text-lg font-bold">Open in External App</Text>
              </Button>
              
              <Text className="mt-6 text-center text-xs text-muted-foreground opacity-60">
                This will open the file in your device's default presentation viewer
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
