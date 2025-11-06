import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ListScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  const sightings = [
    { id: 1, species: 'Northern Cardinal', location: 'Backyard', date: '2024-01-15', count: 2 },
    { id: 2, species: 'Blue Jay', location: 'Park', date: '2024-01-14', count: 1 },
    { id: 3, species: 'Robin', location: 'Garden', date: '2024-01-13', count: 3 },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }] }>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>My Sightings</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>
          {sightings.length} total sightings
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {sightings.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle">No sightings yet</ThemedText>
            <ThemedText style={styles.emptyText}>Start logging your bird sightings!</ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-sighting')}>
              <ThemedText style={styles.addButtonText}>Add First Sighting</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          sightings.map((sighting) => (
            <TouchableOpacity key={sighting.id} style={styles.sightingCard}>
              <View style={styles.sightingHeader}>
                <ThemedText type="defaultSemiBold" style={styles.speciesName}>
                  {sighting.species}
                </ThemedText>
                <ThemedText style={styles.count}>×{sighting.count}</ThemedText>
              </View>
              <ThemedText style={styles.location}>📍 {sighting.location}</ThemedText>
              <ThemedText style={styles.date}>🕐 {sighting.date}</ThemedText>
            </TouchableOpacity>
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
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 8, opacity: 0.7, marginBottom: 20 },
  addButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  sightingCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12 },
  sightingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  speciesName: { fontSize: 18, flex: 1 },
  count: { fontSize: 14, opacity: 0.7 },
  location: { fontSize: 14, marginTop: 4, opacity: 0.8 },
  date: { fontSize: 12, marginTop: 4, opacity: 0.7 },
});

