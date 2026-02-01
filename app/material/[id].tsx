import * as React from 'react';
import { View, Pressable, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { 
  ChevronLeft, ExternalLink, FileText, AlertCircle, RefreshCw,
  ZoomIn, ZoomOut, Maximize2
} from 'lucide-react-native';
import { useMaterial } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MaterialViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { material, isLoading } = useMaterial(id!);

  const [pdfError, setPdfError] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);
  const [scale, setScale] = React.useState(1.0);
  const [useWebViewFallback, setUseWebViewFallback] = React.useState(false);
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
    setPdfError(false);
    setUseWebViewFallback(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.0);

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
        <View className="flex-row items-center justify-between mb-2">
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

        {/* PDF Controls */}
        {isPDF && !pdfError && !useWebViewFallback && (
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleZoomOut}
                className="h-9 w-9 items-center justify-center rounded-lg bg-secondary active:bg-secondary/80"
              >
                <Icon as={ZoomOut} size={18} className="text-foreground" />
              </Pressable>
              {/* <Pressable
                onPress={handleResetZoom}
                className="h-9 w-9 items-center justify-center rounded-lg bg-secondary active:bg-secondary/80"
              >
                <Icon as={Maximize2} size={18} className="text-foreground" />
              </Pressable> */}
              <Pressable
                onPress={handleZoomIn}
                className="h-9 w-9 items-center justify-center rounded-lg bg-secondary active:bg-secondary/80"
              >
                <Icon as={ZoomIn} size={18} className="text-foreground" />
              </Pressable>
            </View>
            
            {totalPages > 0 && (
              <Text className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        {isPDF ? (
          pdfError ? (
            <View className="flex-1 items-center justify-center p-6">
              <Icon as={AlertCircle} size={64} className="text-destructive mb-4" />
              <Text className="text-xl font-bold text-foreground mb-2">Unable to display PDF</Text>
              <Text className="text-sm text-muted-foreground mb-6 text-center">
                {useWebViewFallback 
                  ? "This PDF couldn't be loaded. Try opening it in an external PDF reader."
                  : "There was an error loading this PDF file."}
              </Text>
              <View className="flex-row gap-3 w-full max-w-sm">
                {!useWebViewFallback && (
                  <Button onPress={() => setUseWebViewFallback(true)} variant="outline" className="flex-1 h-12 rounded-xl">
                    <Icon as={RefreshCw} size={18} className="mr-2 text-foreground" />
                    <Text className="font-bold">Try WebView</Text>
                  </Button>
                )}
                <Button onPress={handleOpenExternal} className="flex-1 h-12 rounded-xl">
                  <Icon as={ExternalLink} size={18} className="mr-2 text-primary-foreground" />
                  <Text className="font-bold">Open External</Text>
                </Button>
              </View>
            </View>
          ) : useWebViewFallback ? (
            // WebView Fallback
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
                onError={() => {
                  setPdfError(true);
                  setWebViewLoading(false);
                }}
                style={{ flex: 1, backgroundColor: '#1E293B' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                originWhitelist={['*']}
              />
            </View>
          ) : (
            // Native PDF Viewer
            <Pdf
              trustAllCerts={false}
              source={{ uri: material.fileUri, cache: true }}
              onLoadComplete={(numberOfPages) => {
                setTotalPages(numberOfPages);
                setPdfError(false);
              }}
              onPageChanged={(page) => {
                setCurrentPage(page);
              }}
              onError={(error) => {
                console.error('PDF Error:', error);
                setPdfError(true);
              }}
              style={{
                flex: 1,
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              }}
              scale={scale}
              minScale={0.5}
              maxScale={3.0}
              enablePaging={false}
              horizontal={false}
              spacing={0}
              enableDoubleTapZoom
              renderActivityIndicator={() => (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#FF6B6B" />
                  <Text className="mt-4 text-sm text-muted-foreground">Loading PDF...</Text>
                </View>
              )}
            />
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



