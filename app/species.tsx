import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SpeciesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  // fake data to test the species screen
  const allSpecies = [
    'Northern Cardinal', 'Blue Jay', 'American Robin', 'Mourning Dove', 'House Sparrow',
    'Red-winged Blackbird', 'Common Grackle', 'European Starling', 'American Goldfinch', 'House Finch',
    'Dark-eyed Junco', 'White-crowned Sparrow', 'Song Sparrow', 'Black-capped Chickadee', 'Tufted Titmouse',
    'Downy Woodpecker', 'Red-bellied Woodpecker', 'Northern Flicker', 'Carolina Wren', 'Eastern Bluebird',
  ];

  const filteredSpecies = allSpecies.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }] }>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Bird Species</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>Browse {allSpecies.length} common bird species</ThemedText>
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredSpecies.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle">No species found</ThemedText>
            <ThemedText style={styles.emptyText}>Try a different search term</ThemedText>
          </View>
        ) : (
          filteredSpecies.map((species, index) => (
            <View key={index} style={styles.speciesCard}>
              <ThemedText type="defaultSemiBold" style={styles.speciesName}>{species}</ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
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
  emptyText: { marginTop: 8, opacity: 0.7 },
  speciesCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12 },
  speciesName: { fontSize: 16 },
});

