import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  // Mock statistics data
  const stats = {
    totalSightings: 342,
    totalSpecies: 96,
    totalBirds: 1247,
    favoriteSpecies: 'Northern Cardinal',
    mostSightedLocation: 'Backyard',
    longestStreak: 15,
    thisMonth: 41,
    thisWeek: 12,
  };

  const topSpecies = [
    { name: 'Northern Cardinal', count: 45 },
    { name: 'Blue Jay', count: 32 },
    { name: 'American Robin', count: 28 },
    { name: 'Mourning Dove', count: 24 },
    { name: 'House Sparrow', count: 21 },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Statistics</ThemedText>
        <View style={styles.backButton} />
      </View>
      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>
          Your bird watching journey
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Sightings"
            value={stats.totalSightings}
            icon="eye.fill"
            iconColor={tintColor}
            cardBg={cardBg}
          />
          <StatCard
            label="Species Seen"
            value={stats.totalSpecies}
            icon="bird.fill"
            iconColor={tintColor}
            cardBg={cardBg}
          />
          <StatCard
            label="Total Birds"
            value={stats.totalBirds}
            icon="bird.fill"
            iconColor={tintColor}
            cardBg={cardBg}
          />
          <StatCard
            label="Day Streak"
            value={stats.longestStreak}
            icon="flame.fill"
            iconColor={tintColor}
            cardBg={cardBg}
          />
        </View>

        {/* Favorite Species */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Favorite Species
          </ThemedText>
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              Most Sighted:
            </ThemedText>
            <ThemedText style={styles.infoValue}>{stats.favoriteSpecies}</ThemedText>
          </View>
        </View>

        {/* Top Species */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Top Species
          </ThemedText>
          {topSpecies.map((species, index) => (
            <View key={index} style={[styles.speciesRow, { backgroundColor: cardBg }]}>
              <View style={styles.speciesRank}>
                <ThemedText type="defaultSemiBold" style={styles.rankNumber}>
                  #{index + 1}
                </ThemedText>
              </View>
              <View style={styles.speciesInfo}>
                <ThemedText type="defaultSemiBold">{species.name}</ThemedText>
                <ThemedText style={styles.speciesCount}>{species.count} sightings</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Location Stats */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Location
          </ThemedText>
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              Most Frequent:
            </ThemedText>
            <ThemedText style={styles.infoValue}>{stats.mostSightedLocation}</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  iconColor,
  cardBg 
}: { 
  label: string; 
  value: string | number; 
  icon: string; 
  iconColor: string;
  cardBg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
      <IconSymbol name={icon as any} size={24} color={iconColor} />
      <ThemedText type="defaultSemiBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 18,
  },
  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  speciesRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    opacity: 0.7,
  },
  speciesInfo: {
    flex: 1,
    gap: 4,
  },
  speciesCount: {
    fontSize: 12,
    opacity: 0.7,
  },
});

