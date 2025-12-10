import React, { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, Modal, TextInput, ActivityIndicator } from 'react-native';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

export default function ProfileScreen() {
  const theme = useColorScheme() ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';

  const { user, signOut } = useAuth();

  const userEmail = user?.email || 'No email';

  const userIdDisplay =
  (user as any)?.userId ??
  (user as any)?.id ??
  'N/A';

  const userRoleDisplay = user?.role ?? 'user';

  const providerDisplay = user?.oauthProvider ?? 'google';

  const [displayName, setDisplayName] = useState<string>('Bird Watcher');
  const [editVisible, setEditVisible] = useState(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [userSightings, setUserSightings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync displayName/nameInput when user changes
  useEffect(() => {
    if (user) {
      const nm =
        user.name ||
        (user.email ? user.email.split('@')[0] : '') ||
        'Bird Watcher';
      setDisplayName(nm);
      setNameInput(nm);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userId = user.userId ?? Number(user.id);

    const fetchSightings = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/sightings/by-user/${userId}`
        );
        const data = await res.json();
        setUserSightings(data);
      } catch (e) {
        console.log("Error fetching user stats:", e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchSightings();
  }, [user]);

  const totalSightings = userSightings.length;

  const totalSpecies = new Set(
    userSightings.map((s: any) => s.birdId)
  ).size;


  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  // mock stats for now (can be replaced with real stats later)
  const stats = {
    totalSightings: 342,
    totalSpecies: 96,
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
    ]);
  };

  const openEditName = () => {
    setNameInput(displayName);
    setEditVisible(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'User not found in context.');
      return;
    }

    try {
      setSaving(true);

      const userId = user.userId ?? (user.id ? Number(user.id) : undefined);
      console.log('User from context:', user);
      console.log('Using userId for PUT:', userId);

      if (!userId) {
        Alert.alert('Error', 'No user ID found for update.');
        return;
      }

      // Minimal payload that matches what your controller actually uses
      const payload = {
        userId: userId,
        name: trimmed,
        email: user.email,
        oauthProvider: user.oauthProvider ?? 'google',
        oauthId: user.oauthId ?? '',
        profilePicture: user.profilePicture ?? '',
        role: user.role ?? 'user',
        createdAt: user.created_at,
      };

      console.log('PUT payload:', payload);

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      console.log('Update user status:', res.status);
      console.log('Content-Type:', contentType);

      if (!res.ok) {
        const text = await res.text();
        console.log('Error response text:', text);
        Alert.alert('Error', `Failed to update name (status ${res.status}).`);
        return;
      }

      if (contentType.includes('application/json')) {
        const saved = await res.json();
        console.log('Saved user from server:', saved);
        setDisplayName(saved.name || trimmed);
      } else {
        const text = await res.text();
        // console.log('Non-JSON success response:', text);
        setDisplayName(trimmed);
      }

      setEditVisible(false);
    } catch (e) {
      console.error('Error updating name:', e);
      Alert.alert('Error', 'An error occurred while updating your name.');
    } finally {
      setSaving(false);
    }
  };

  // Menu items: only Edit Name + Sign Out
  const menuItems = [
    { icon: 'pencil', label: 'Edit Name', onPress: openEditName },
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
            {displayName}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>
          <ThemedText style={styles.memberSince}>
            Member since {memberSince}
          </ThemedText>
        </View>

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {loadingStats ? "…" : totalSightings}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Sightings</ThemedText>
          </View>

          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>
              {loadingStats ? "…" : totalSpecies}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Species Seen</ThemedText>
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
                    item.destructive && { color: '#FF3B30' },
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

      {/* Edit Name Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              Edit Name
            </ThemedText>
            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              editable={!saving}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => !saving && setEditVisible(false)}
                disabled={saving}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText style={styles.modalSaveText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButton: {
    backgroundColor: '#E0E0E0',
  },
  modalSaveButton: {
    backgroundColor: '#4CAF50',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '500',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
