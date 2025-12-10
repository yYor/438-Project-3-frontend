import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {Platform,ScrollView,StatusBar,StyleSheet,TouchableOpacity,View,ActivityIndicator} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTimeAgo } from '@/utils/sighting';
import type { ApiSightingResponse } from '@/types/ApiSightingResponse'; // ⬅️ adjust path if different
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

type RecentSighting = {
  id: number;
  name: string;
  location: string;
  date: string;
  username: string | null;
};

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top;

  const [stats, setStats] = useState({
    totalSightings: 0, // number of records
    speciesCount: 0,   // unique birdName
    thisMonth: 0,
    thisWeek: 0,
  });

  const [recentSightings, setRecentSightings] = useState<RecentSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchSightings = async () => {
        try {
          setLoading(true);
          setError(null);

          const res = await fetch(`${API_BASE_URL}/api/sightings`, {
            headers: {
              Accept: 'application/json',
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data: ApiSightingResponse[] = await res.json();

          // ----- Stats -----
          const totalSightings = data.length;

          const speciesSet = new Set(
            data.map((s) => s.birdName).filter(Boolean)
          );
          const speciesCount = speciesSet.size;

          const now = new Date().getTime();

          const thisMonth = data.filter((s) => {
            const d = new Date(s.observedAt);
            const nowD = new Date();
            return (
              d.getFullYear() === nowD.getFullYear() &&
              d.getMonth() === nowD.getMonth()
            );
          }).length;

          const thisWeek = data.filter((s) => {
            const diff =
              (now - new Date(s.observedAt).getTime()) /
              (1000 * 60 * 60 * 24);
            return diff <= 7;
          }).length;

          setStats({ totalSightings, speciesCount, thisMonth, thisWeek });

          // Recent sightings
          const recent = [...data]
            .sort(
              (a, b) =>
                new Date(b.observedAt).getTime() -
                new Date(a.observedAt).getTime()
            )
            .slice(0, 5)
            .map((s) => ({
              id: s.id,
              name: s.birdName,
              location: s.location,
              date: formatTimeAgo(s.observedAt),
              username: s.username,
            }));

          setRecentSightings(recent);
        } catch (err: any) {
          console.error('Failed to load sightings', err);
          setError('Could not load sightings from the server.');
        } finally {
          setLoading(false);
        }
      };

      fetchSightings();

      // OPTIONAL CLEANUP
      return () => {};
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: statusBarHeight + 32 }} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.headerTitle}>
              BirdWatcher
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Track your favorite birds
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <IconSymbol name="house.fill" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Total Sightings"
            value={stats.totalSightings}
            icon="eye.fill"
            iconColor={tintColor}
          />
          <StatCard
            label="Species"
            value={stats.speciesCount}
            icon="bird.fill"
            iconColor={tintColor}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            label="This Month"
            value={stats.thisMonth}
            icon="calendar"
            iconColor={tintColor}
          />
          <StatCard
            label="This Week"
            value={stats.thisWeek}
            icon="calendar"
            iconColor={tintColor}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.actionsGrid}>
            <ActionButton
              label="Add Sighting"
              icon="plus.circle.fill"
              iconColor="#4CAF50"
              onPress={() => router.push('/add-sighting')}
            />
            <ActionButton
              label="My List"
              icon="list.bullet"
              iconColor="#FF9800"
              onPress={() => router.push('/list')}
            />
            <ActionButton
              label="Species"
              icon="bird.fill"
              iconColor="#4CAF50"
              onPress={() => router.push('/species')}
            />
            <ActionButton
              label="Stats"
              icon="chart.bar.fill"
              iconColor="#9C27B0"
              onPress={() => router.push('/stats')}
            />
          </View>
        </View>

        {/* Recent Sightings */}
        <View style={styles.sightingsContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Sightings
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/list')}>
              <ThemedText type="link" style={styles.seeAll}>
                See All
              </ThemedText>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator />
              <ThemedText style={{ marginTop: 8 }}>
                Loading sightings…
              </ThemedText>
            </View>
          )}

          {error && !loading && (
            <ThemedText style={{ color: 'red', marginBottom: 8 }}>
              {error}
            </ThemedText>
          )}

          {!loading &&
            !error &&
            recentSightings.map((sighting) => (
              <SightingCard key={sighting.id} sighting={sighting} />
            ))}

          {!loading && !error && recentSightings.length === 0 && (
            <ThemedText>
              No sightings yet. Add your first one!
            </ThemedText>
          )}
        </View>

        {/* Today's Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalContent}>
            <View>
              <ThemedText
                type="defaultSemiBold"
                style={styles.goalTitle}
              >
                Today&apos;s Goal
              </ThemedText>
              <ThemedText style={styles.goalText}>
                Log your first sighting of the day!
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/add-sighting')}
              style={[styles.goalButton, { backgroundColor: tintColor }]}
            >
              <ThemedText style={styles.goalButtonText}>
                Get Started
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconColor: string;
}) {
  const theme = useColorScheme() ?? 'light';
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const textColor = theme === 'light' ? Colors.light.text : Colors.dark.text;

  return (
    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
      <View style={styles.statContent}>
        <IconSymbol name={icon as any} size={20} color={iconColor} />
        <View style={styles.statText}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.statValue, { color: textColor }]}
          >
            {value}
          </ThemedText>
          <ThemedText style={styles.statLabel}>{label}</ThemedText>
        </View>
      </View>
    </View>
  );
}

// Action Button Component
function ActionButton({
  label,
  icon,
  iconColor,
  onPress,
}: {
  label: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
}) {
  const theme = useColorScheme() ?? 'light';
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';

  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: cardBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol name={icon as any} size={24} color={iconColor} />
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

// Sighting Card Component
function SightingCard({
  sighting,
}: {
  sighting: {
    id: number;
    name: string;
    location: string;
    date: string;
    username: string | null;
  };
}) {
  const theme = useColorScheme() ?? 'light';
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  return (
    <TouchableOpacity
      style={[styles.sightingCard, { backgroundColor: cardBg }]}
      activeOpacity={0.7}
    >
      <View style={styles.sightingImagePlaceholder}>
        <IconSymbol name="leaf.fill" size={32} color={iconColor} />
      </View>
      <View style={styles.sightingInfo}>
        <ThemedText type="defaultSemiBold" style={styles.sightingName}>
          {sighting.name}
        </ThemedText>
        <ThemedText style={styles.sightingLocation}>
          {sighting.location}
        </ThemedText>
        {/* show user so it’s clearly from various users */}
        <ThemedText style={styles.sightingDate}>
          {sighting.username ? `by ${sighting.username}` : 'by Anonymous'}
        </ThemedText>
        <ThemedText style={styles.sightingDate}>
          {sighting.date}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  sightingsContainer: {
    marginBottom: 24,
  },
  sightingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  sightingImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightingInfo: {
    flex: 1,
    gap: 4,
  },
  sightingName: {
    fontSize: 16,
  },
  sightingLocation: {
    fontSize: 14,
    opacity: 0.7,
  },
  sightingDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  goalCard: {
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    padding: 16,
  },
  goalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    opacity: 0.8,
  },
  goalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
