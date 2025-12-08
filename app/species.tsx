import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

type Bird = {
  birdId: number;
  birdName: string;
  sciName?: string;
  habitat?: string;
  family?: string;
  cnsvStatus?: string;
};

export default function SpeciesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [species, setSpecies] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/birds/getBirds`);
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data: Bird[] = await response.json();
        setSpecies(data);
      } catch (err: any) {
        console.error('Failed to fetch birds', err);
        setError('Unable to load species from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  const filteredSpecies = species.filter(bird =>
    bird.birdName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Bird Species</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>
          Browse {species.length} common bird species
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, theme === 'dark' && styles.searchInputDark]}
          placeholder="Search species..."
          placeholderTextColor={theme === 'light' ? '#8E9BA3' : '#7A7F85'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator />
          <ThemedText style={{ marginTop: 12 }}>Loading species…</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <ThemedText type="subtitle">Error</ThemedText>
          <ThemedText style={styles.emptyText}>{error}</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredSpecies.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText type="subtitle">No species found</ThemedText>
              <ThemedText style={styles.emptyText}>Try a different search term</ThemedText>
            </View>
          ) : (
            filteredSpecies.map(bird => (
              <View key={bird.birdId} style={styles.speciesCard}>
                <ThemedText type="defaultSemiBold" style={styles.speciesName}>
                  {bird.birdName}
                </ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  header: { padding: 16, paddingTop: 8 },
  subtitle: { marginTop: 4, opacity: 0.7, fontSize: 14 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16 },
  searchInputDark: { borderColor: '#444', backgroundColor: '#1E1E1E', color: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 8, opacity: 0.7, textAlign: 'center' },
  speciesCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12 },
  speciesName: { fontSize: 16 },
});