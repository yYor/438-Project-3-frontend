import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

type Bird = {
  birdId: number;
  birdName: string;
  sciName: string;
  habitat: string;
  family: string;
  cnsrvStatus: string;
  description?: string;
  pictureUrl?: string;
};

export default function SpeciesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [species, setSpecies] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: pop-up state
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const modalBackground =
    theme === 'light' ? Colors.light.background : Colors.dark.background;

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

  const filteredSpecies = species.filter((bird) =>
    bird.birdName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // NEW: handlers for opening/closing the pop-up
  const openBirdModal = (bird: Bird) => {
    setSelectedBird(bird);
    setModalVisible(true);
  };

  const closeBirdModal = () => {
    setModalVisible(false);
    setSelectedBird(null);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Bird Species
        </ThemedText>
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
              <ThemedText style={styles.emptyText}>
                Try a different search term
              </ThemedText>
            </View>
          ) : (
            filteredSpecies.map((bird) => (
              <TouchableOpacity
                key={bird.birdId}
                style={styles.speciesCard}
                onPress={() => openBirdModal(bird)} // ← open pop-up
              >
                <ThemedText type="defaultSemiBold" style={styles.speciesName}>
                  {bird.birdName}
                </ThemedText>
                <ThemedText style={styles.speciesSci}>
                  {bird.sciName}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* NEW: Pop-up modal for selected bird */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeBirdModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
            {selectedBird && (
              <ScrollView contentContainerStyle={styles.modalContent}>
                {/* Picture */}
                {selectedBird.pictureUrl ? (
                  <Image
                    source={{ uri: selectedBird.pictureUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : null}

                {/* Name + sci name */}
                <ThemedText type="title" style={styles.modalTitle}>
                  {selectedBird.birdName}
                </ThemedText>
                <ThemedText style={styles.modalSci}>{selectedBird.sciName}</ThemedText>

                {/* Family */}
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>Family</ThemedText>
                  <ThemedText>{selectedBird.family || 'Unknown'}</ThemedText>
                </View>

                {/* Habitat */}
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>Habitat</ThemedText>
                  <ThemedText>{selectedBird.habitat || 'Unknown'}</ThemedText>
                </View>

                {/* Conservation status */}
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>
                    Conservation Status
                  </ThemedText>
                  <ThemedText>
                    {selectedBird.cnsrvStatus || 'Unknown'}
                  </ThemedText>
                </View>

                {/* Description */}
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>Description</ThemedText>
                  <ThemedText>
                    {selectedBird.description && selectedBird.description.trim().length > 0
                      ? selectedBird.description
                      : 'No description available.'}
                  </ThemedText>
                </View>

                {/* Close */}
                <TouchableOpacity style={styles.closeButton} onPress={closeBirdModal}>
                  <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  searchInputDark: { borderColor: '#444', backgroundColor: '#1E1E1E', color: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 8, opacity: 0.7, textAlign: 'center' },

  speciesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  speciesName: { fontSize: 16 },
  speciesSci: { fontSize: 13, opacity: 0.7, marginTop: 4 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    maxHeight: '100%',
  },
  modalContent: { paddingBottom: 12 },
  modalImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalSci: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  modalSection: {
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  closeButtonText: {
    fontWeight: '600',
  },
});
