import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const theme = useColorScheme() ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';

  // Mock user data
  const user = {
    name: 'Bird Watcher',
    email: 'birdwatcher@example.com',
    memberSince: 'January 2024',
    totalSightings: 342,
    totalSpecies: 96,
  };

  const menuItems = [
    { icon: 'person.fill', label: 'Edit Profile', onPress: () => {} },
    { icon: 'bell.fill', label: 'Notifications', onPress: () => {} },
    { icon: 'gear', label: 'Settings', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: tintColor }]}>
              <IconSymbol name="person.fill" size={40} color="#fff" />
            </View>
          </View>
          <ThemedText type="title" style={styles.userName}>
            {user.name}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          <ThemedText style={styles.memberSince}>
            Member since {user.memberSince}
          </ThemedText>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {user.totalSightings}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Sightings</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {user.totalSpecies}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Species</ThemedText>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: cardBg }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name={item.icon as any} size={24} color={iconColor} />
                <ThemedText type="defaultSemiBold" style={styles.menuItemLabel}>
                  {item.label}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={iconColor} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  menuSection: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
  },
});



