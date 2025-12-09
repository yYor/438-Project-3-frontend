import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { ApiSightingResponse } from '@/types/ApiSightingResponse';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

type Stats = {
  totalSightings: number;
  totalSpecies: number;
  totalBirds: number;
  favoriteSpecies: string | null;
  mostSightedLocation: string | null;
  longestStreak: number;
  thisMonth: number;
  thisWeek: number;
};

type TopSpeciesItem = { name: string; count: number };

export default function StatsScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalSightings: 0,
    totalSpecies: 0,
    totalBirds: 0,
    favoriteSpecies: null,
    mostSightedLocation: null,
    longestStreak: 0,
    thisMonth: 0,
    thisWeek: 0,
  });
  const [topSpecies, setTopSpecies] = useState<TopSpeciesItem[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAndComputeStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = (user as any).id ?? (user as any).userId;
        const res = await fetch(`${API_BASE_URL}/api/sightings/by-user/${userId}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch sightings: ${res.status}`);
        }

        const data: ApiSightingResponse[] = await res.json();
        const { stats, topSpecies } = computeStatsFromSightings(data);

        setStats(stats);
        setTopSpecies(topSpecies);
      } catch (e: any) {
        console.error('Error fetching stats:', e);
        setError(e.message ?? 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    };

    fetchAndComputeStats();
  }, [user]);

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
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <ThemedText style={{ marginTop: 8 }}>Loading your stats...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ThemedText type="subtitle">Error</ThemedText>
            <ThemedText style={{ opacity: 0.7 }}>{error}</ThemedText>
          </View>
        ) : (
          <>
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
                label="Longest Streak"
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
                <ThemedText style={styles.infoValue}>
                  {stats.favoriteSpecies ?? 'No data yet'}
                </ThemedText>
              </View>
            </View>

            {/* Top Species */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Top Species
              </ThemedText>
              {topSpecies.length === 0 ? (
                <ThemedText style={{ opacity: 0.7 }}>No species data yet.</ThemedText>
              ) : (
                topSpecies.map((species, index) => (
                  <View key={index} style={[styles.speciesRow, { backgroundColor: cardBg }]}>
                    <View style={styles.speciesRank}>
                      <ThemedText type="defaultSemiBold" style={styles.rankNumber}>
                        #{index + 1}
                      </ThemedText>
                    </View>
                    <View style={styles.speciesInfo}>
                      <ThemedText type="defaultSemiBold">{species.name}</ThemedText>
                      <ThemedText style={styles.speciesCount}>
                        {species.count} sightings
                      </ThemedText>
                    </View>
                  </View>
                ))
              )}
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
                <ThemedText style={styles.infoValue}>
                  {stats.mostSightedLocation ?? 'No data yet'}
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function computeStatsFromSightings(
  sightings: ApiSightingResponse[]
): { stats: Stats; topSpecies: TopSpeciesItem[] } {
  if (sightings.length === 0) {
    return {
      stats: {
        totalSightings: 0,
        totalSpecies: 0,
        totalBirds: 0,
        favoriteSpecies: null,
        mostSightedLocation: null,
        longestStreak: 0,
        thisMonth: 0,
        thisWeek: 0,
      },
      topSpecies: [],
    };
  }

  // Totals
  const totalSightings = sightings.length;
  const totalBirds = sightings.reduce((sum, s) => sum + (s.count ?? 0), 0);

  // Species
  const speciesMap = new Map<number, { name: string; count: number }>();
  for (const s of sightings) {
    const existing = speciesMap.get(s.birdId) ?? { name: s.birdName, count: 0 };
    existing.count += s.count ?? 0;
    speciesMap.set(s.birdId, existing);
  }
  const totalSpecies = speciesMap.size;

  const speciesArray = Array.from(speciesMap.values());
  speciesArray.sort((a, b) => b.count - a.count);
  const favoriteSpecies = speciesArray[0]?.name ?? null;
  const topSpecies = speciesArray.slice(0, 5).map((s) => ({
    name: s.name,
    count: s.count,
  }));

  // Location
  const locationMap = new Map<string, number>();
  for (const s of sightings) {
    if (!s.location) continue;
    locationMap.set(s.location, (locationMap.get(s.location) ?? 0) + 1);
  }
  let mostSightedLocation: string | null = null;
  let mostLocationCount = 0;
  for (const [loc, count] of locationMap.entries()) {
    if (count > mostLocationCount) {
      mostLocationCount = count;
      mostSightedLocation = loc;
    }
  }

  // Time-based stats
  const now = new Date();
  const nowTime = now.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  let thisMonth = 0;
  let thisWeek = 0;

  const daySet = new Set<number>(); // days since epoch that have sightings

  for (const s of sightings) {
    const d = new Date(s.observedAt);
    const dayKey = Math.floor(d.getTime() / MS_PER_DAY);
    daySet.add(dayKey);

    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      thisMonth += 1;
    }

    const diffDays = (nowTime - d.getTime()) / MS_PER_DAY;
    if (diffDays >= 0 && diffDays < 7) {
      thisWeek += 1;
    }
  }

  // Longest streak of consecutive days with at least one sighting
  const sortedDays = Array.from(daySet).sort((a, b) => a - b);
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === sortedDays[i - 1] + 1) {
      currentStreak += 1;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    stats: {
      totalSightings,
      totalSpecies,
      totalBirds,
      favoriteSpecies,
      mostSightedLocation,
      longestStreak: sightings.length === 0 ? 0 : longestStreak,
      thisMonth,
      thisWeek,
    },
    topSpecies,
  };
}

function StatCard({
  label,
  value,
  icon,
  iconColor,
  cardBg,
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
