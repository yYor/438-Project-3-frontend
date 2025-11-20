import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const theme = useColorScheme() ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const { user, signOut } = useAuth();

  // get user email or default
  const userEmail = user?.email || 'No email';
  
  // format member since date from user created_at
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // mock stats
  const stats = {
    totalSightings: 342,
    totalSpecies: 96,
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'person.fill', label: 'Edit Profile', onPress: () => {} },
    { icon: 'bell.fill', label: 'Notifications', onPress: () => {} },
    { icon: 'gear', label: 'Settings', onPress: () => {} },
    { 
      icon: 'arrow.right.square.fill', 
      label: 'Sign Out', 
      onPress: handleLogout,
      destructive: true,
    },
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
            {userEmail.split('@')[0] || 'Bird Watcher'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>
          <ThemedText style={styles.memberSince}>
            Member since {memberSince}
          </ThemedText>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {stats.totalSightings}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Sightings</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {stats.totalSpecies}
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
                <IconSymbol 
                  name={item.icon as any} 
                  size={24} 
                  color={item.destructive ? '#FF3B30' : iconColor} 
                />
                <ThemedText 
                  type="defaultSemiBold" 
                  style={[
                    styles.menuItemLabel,
                    item.destructive && { color: '#FF3B30' }
                  ]}
                >
                  {item.label}
                </ThemedText>
              </View>
              <IconSymbol 
                name="chevron.right" 
                size={20} 
                color={item.destructive ? '#FF3B30' : iconColor} 
              />
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



