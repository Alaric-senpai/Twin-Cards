import * as React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { 
  Plus, Play, Trash2, Edit, ChevronLeft, FileSpreadsheet,
  BookOpen, FileText, Clock, Target
} from 'lucide-react-native';
import { FlashcardItem } from '@/components/FlashcardItem';
import { MaterialItem } from '@/components/MaterialItem';
import { EmptyState } from '@/components/EmptyState';
import {
  useUnit,
  useFlashcards,
  useMaterials,
  deleteUnit,
  deleteMaterial,
  createMaterial,
  createFlashcard,
} from '@/hooks/useDatabase';
import { generateId } from '@/utils/ids';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'flashcards' | 'library'>('flashcards');
  const [isImporting, setIsImporting] = React.useState(false);

  const { unit, isLoading: isUnitLoading } = useUnit(id!);
  const { flashcards, isLoading: isFlashcardsLoading } = useFlashcards(id!);
  const { materials, isLoading: isMaterialsLoading } = useMaterials(id!);

  const isLoading = isUnitLoading || isFlashcardsLoading || isMaterialsLoading;

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert('Delete Unit', 'Are you sure you want to delete this unit and all its content?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUnit(id);
          router.back();
        },
      },
    ]);
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsImporting(true);
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      
      const lines = content.split(/\r?\n/);
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

      let importCount = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(regex).map(part => 
          part.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        );
        
        if (parts.length >= 2) {
          await createFlashcard({
            unitId: id!,
            front: parts[0],
            back: parts[1],
          });
          importCount++;
        }
      }
      Alert.alert('Success', `Successfully imported ${importCount} flashcards.`);
    } catch (error) {
      console.error('Failed to import CSV:', error);
      Alert.alert('Error', 'Failed to import CSV file. Please ensure it follows the "Question,Answer" format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddMaterial = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const file = result.assets[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileType = fileExtension === 'pdf' ? 'pdf' : 'pptx';

      const materialsDir = `${FileSystem.documentDirectory}materials/`;
      await FileSystem.makeDirectoryAsync(materialsDir, { intermediates: true });

      const newFileName = `${generateId()}.${fileExtension}`;
      const newFileUri = `${materialsDir}${newFileName}`;
      await FileSystem.copyAsync({ from: file.uri, to: newFileUri });

      await createMaterial({
        unitId: id!,
        fileUri: newFileUri,
        fileName: file.name,
        fileType,
        fileSize: file.size,
      });
    } catch (error) {
      console.error('Failed to add material:', error);
    }
  };

  const handleDeleteMaterial = async (materialId: string, fileUri: string) => {
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      await deleteMaterial(materialId);
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  console.log(isLoading)
  console.log(unit)

  // Show loading state FIRST before checking if unit exists
  if (isLoading || unit === undefined) {
    return (
      <View className="flex-1 bg-background">
        {/* Header Skeleton */}
        <View className="px-4 py-4 mt-6">
          <View className="flex-row items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full mr-3" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </View>
          <View className="flex-row gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </View>
        </View>

        {/* Stats Skeleton */}
        <View className="px-4 py-4">
          <View className="flex-row gap-3">
            <Skeleton className="h-20 flex-1 rounded-2xl" />
            <Skeleton className="h-20 flex-1 rounded-2xl" />
          </View>
        </View>

        {/* Tabs Skeleton */}
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </View>
        </View>

        {/* Content Skeleton */}
        <ScrollView className="flex-1 px-4 pt-6">
          <View className="flex-row gap-3 mb-6">
            <Skeleton className="h-14 flex-1 rounded-2xl" />
            <Skeleton className="h-14 flex-1 rounded-2xl" />
          </View>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl mb-4" />
          ))}
        </ScrollView>
      </View>
    );
  }

  // NOW check if unit exists (after loading is complete)
  if (!unit) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Unit not found</Text>
        <Text className="text-sm text-muted-foreground mb-6 text-center">
          This unit may have been deleted or doesn't exist
        </Text>
        <Button onPress={() => router.back()} className="h-12 px-6 rounded-xl">
          <Text className="font-bold">Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 mt-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <Pressable 
              onPress={() => router.back()} 
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted mr-3"
            >
              <Icon as={ChevronLeft} size={26} className="text-foreground" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {unit.title}
              </Text>
              {unit.description && (
                <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
                  {unit.description}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row gap-2 ml-2">
            <Pressable
              onPress={() => router.push(`/unit/edit/${id}`)}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
            >
              <Icon as={Edit} size={20} className="text-foreground" />
            </Pressable>
            <Pressable 
              onPress={handleDelete} 
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
            >
              <Icon as={Trash2} size={20} className="text-destructive" />
            </Pressable>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3">
          <Card className="flex-1 p-3 border-transparent bg-card">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon as={BookOpen} size={16} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{flashcards.length}</Text>
                <Text className="text-xs text-muted-foreground">Flashcards</Text>
              </View>
            </View>
          </Card>
          
          <Card className="flex-1 p-3 border-transparent bg-card">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon as={FileText} size={16} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{materials.length}</Text>
                <Text className="text-xs text-muted-foreground">Materials</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setActiveTab('flashcards')}
            className={`flex-1 h-10 items-center justify-center  rounded-xl ${
              activeTab === 'flashcards' ? 'bg-primary text-white' : 'bg-secondary'
            }`}
          >
            <Text className={`font-bold ${
              activeTab === 'flashcards' ? 'text-primary-foreground' : 'text-secondary-foreground'
            }`}>
              Flashcards
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('library')}
            className={`flex-1 h-10 items-center justify-center rounded-xl ${
              activeTab === 'library' ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <Text className={`font-bold ${
              activeTab === 'library' ? 'text-primary-foreground' : 'text-secondary-foreground'
            }`}>
              Library
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'flashcards' ? (
        <ScrollView 
          className="flex-1 px-4 pt-4"
          contentContainerClassName={flashcards.length === 0 ? 'flex-1' : ''}
        >
          <View className="flex-row gap-3 mb-4">
            <Button
              onPress={handleImportCSV}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-primary/20"
              disabled={isImporting}
            >
              <Icon as={FileSpreadsheet} size={18} className="mr-2 text-primary" />
              <Text className="text-primary font-bold text-sm">
                {isImporting ? 'Importing...' : 'Import CSV'}
              </Text>
            </Button>

            {flashcards.length > 0 && (
              <Button
                onPress={() => router.push(`/study/${id}`)}
                className="flex-1 h-12 rounded-xl shadow-md"
                variant="default"
              >
                <Icon as={Play} size={18} className="mr-2 text-primary-foreground" />
                <Text className="text-primary-foreground font-bold text-sm">Study</Text>
              </Button>
            )}
          </View>

          {flashcards.length === 0 ? (
            <EmptyState
              title="No flashcards yet"
              description="Add your first flashcard or import a CSV to start studying"
            />
          ) : (
            <View className="gap-3 pb-4">
              {flashcards.map((card) => (
                <FlashcardItem
                  key={card.id}
                  id={card.id}
                  front={card.front}
                  back={card.back}
                  hint={card.hint || undefined}
                  onPress={() => router.push(`/flashcard/edit/${card.id}`)}
                />
              ))}
            </View>
          )}
          <View className="h-24" />
        </ScrollView>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-4"
          contentContainerClassName={materials.length === 0 ? 'flex-1' : ''}
        >
          {materials.length === 0 ? (
            <EmptyState
              title="No materials yet"
              description="Upload PDFs or presentations to this unit"
            />
          ) : (
            <View className="gap-3 pb-4">
              {materials.map((material) => (
                <MaterialItem
                  key={material.id}
                  id={material.id}
                  fileName={material.fileName}
                  fileType={material.fileType}
                  fileSize={material.fileSize || undefined}
                  onPress={() => router.push(`/material/${material.id}`)}
                />
              ))}
            </View>
          )}
          <View className="h-24" />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={() => {
          if (activeTab === 'flashcards') {
            router.push({ pathname: '/flashcard/create', params: { unitId: id } });
          } else {
            handleAddMaterial();
          }
        }}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Icon as={Plus} size={28} className="text-primary-foreground" />
      </Pressable>
    </View>
  );
}
