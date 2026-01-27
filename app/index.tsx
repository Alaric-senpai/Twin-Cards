import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, BookOpen, FileText, TrendingUp, Zap } from 'lucide-react-native';
import { UnitCard } from '@/components/UnitCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { useUnits, useUnitStats } from '@/hooks/useDatabase';
import { Card } from '@/components/ui/card';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { units } = useUnits();

  // Calculate overall stats
  const totalStats = React.useMemo(() => {
    let totalCards = 0;
    let totalMaterials = 0;
    units.forEach(unit => {
      // We'll need to get stats for each unit
      totalCards += 0; // Placeholder
      totalMaterials += 0; // Placeholder
    });
    return { totalCards, totalMaterials, totalUnits: units.length };
  }, [units]);

  const filteredUnits = React.useMemo(() => {
    if (!searchQuery.trim()) return units;
    const query = searchQuery.toLowerCase();
    return units.filter(
      (unit) =>
        unit.title.toLowerCase().includes(query) ||
        unit.description?.toLowerCase().includes(query)
    );
  }, [units, searchQuery]);

  const hasUnits = units.length > 0;

  return (
    <View className="flex-1 bg-background">
      <Header />

      <ScrollView 
        className="flex-1" 
        contentContainerClassName={!hasUnits ? 'flex-1' : ''}
        showsVerticalScrollIndicator={false}
      >
        {hasUnits ? (
          <>
            {/* Quick Stats Section */}
            <View className="px-4 pt-2 pb-4">
              <Text className="text-lg font-bold text-foreground mb-3">Your Progress</Text>
              <View className="flex-row gap-3">
                <Card className="flex-1 p-4 border-transparent bg-card">
                  <View className="flex-row items-center justify-between mb-2">
                    <Icon as={BookOpen} size={20} className="text-primary" />
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Icon as={TrendingUp} size={14} className="text-primary" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-foreground">{units.length}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {units.length === 1 ? 'Unit' : 'Units'}
                  </Text>
                </Card>

                <Card className="flex-1 p-4 border-transparent bg-card">
                  <View className="flex-row items-center justify-between mb-2">
                    <Icon as={Zap} size={20} className="text-primary" />
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Text className="text-xs font-bold text-primary">New</Text>
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-foreground">
                    {units.filter(u => {
                      const created = new Date(u.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return created > weekAgo;
                    }).length}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">This Week</Text>
                </Card>
              </View>
            </View>

            {/* Search Bar */}
            <View className="px-4 pb-3">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your units..."
              />
            </View>

            {/* Units Section */}
            <View className="px-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-foreground">
                  {searchQuery ? 'Search Results' : 'All Units'}
                </Text>
                {!searchQuery && (
                  <Text className="text-sm text-muted-foreground">
                    {units.length} total
                  </Text>
                )}
              </View>

              {filteredUnits.length === 0 ? (
                <View className="py-12">
                  <EmptyState
                    title="No units found"
                    description="Try adjusting your search"
                  />
                </View>
              ) : (
                <View className="gap-3 pb-4">
                  {filteredUnits.map((unit) => (
                    <UnitCardWithStats
                      key={unit.id}
                      unit={unit}
                      onPress={() => router.push(`/unit/${unit.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
            <View className="h-24" />
          </>
        ) : (
          <View className="flex-1 px-4">
            <EmptyState
              title="Welcome to TwinCards!"
              description="Create your first study unit to start learning with flashcards and materials"
            />
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/unit/create')}
        className="absolute bottom-12 right-6 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}>
        <Icon as={Plus} size={28} className="text-primary-foreground" />
      </Pressable>
    </View>
  );
}

// Wrapper component to fetch stats for each unit
function UnitCardWithStats({ unit, onPress }: { unit: any; onPress: () => void }) {
  const { flashcardCount, materialCount } = useUnitStats(unit.id);

  return (
    <UnitCard
      id={unit.id}
      title={unit.title}
      description={unit.description}
      color={unit.color}
      icon={unit.icon}
      flashcardCount={flashcardCount}
      materialCount={materialCount}
      onPress={onPress}
    />
  );
}
