import MapView from '@/components/map/MapView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Sighting } from '@/utils/sighting';
import { formatTimeAgo, getMarkerColor } from '@/utils/sighting';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// fake data to test the map screen

const MOCK_SIGHTINGS: Sighting[] = [
  {
    id: 1,
    species: 'Black Oystercatcher',
    count: 3,
    location: 'Pacific Grove, California',
    latitude: 36.6372,
    longitude: -121.9356,
    notes: 'Spotted near the lighthouse, feeding along the rocky shore',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    userId: 1,
    username: 'birdwatcher123',
  },
  {
    id: 2,
    species: "Brandt's Cormorant",
    count: 12,
    location: 'Pacific Grove, California',
    latitude: 36.6181,
    longitude: -121.9414,
    notes: 'Large group diving for fish',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    userId: 2,
    username: 'coastal_birder',
  },
  {
    id: 3,
    species: 'Brown Pelican',
    count: 5,
    location: 'Pacific Grove, California',
    latitude: 36.6256,
    longitude: -121.9181,
    notes: 'Flying in formation along the coast',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    userId: 3,
    username: 'pelican_watcher',
  },
  {
    id: 4,
    species: "Heermann's Gull",
    count: 8,
    location: 'Monterey, California',
    latitude: 36.6177,
    longitude: -121.9017,
    notes: 'Mixed with other gulls near the pier',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    userId: 1,
    username: 'birdwatcher123',
  },
  {
    id: 5,
    species: 'Snowy Egret',
    count: 2,
    location: 'Carmel, California',
    latitude: 36.5414,
    longitude: -121.9250,
    notes: 'Wading in shallow water, very active',
    date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
    userId: 4,
    username: 'egret_enthusiast',
  },
  {
    id: 6,
    species: 'Great Blue Heron',
    count: 1,
    location: 'Moss Landing, California',
    latitude: 36.8097,
    longitude: -121.7406,
    notes: 'Standing motionless, hunting',
    date: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
    userId: 2,
    username: 'coastal_birder',
  },
  {
    id: 7,
    species: 'California Quail',
    count: 6,
    location: 'Carmel Valley, California',
    latitude: 36.5211,
    longitude: -121.7514,
    notes: 'Family group in the brush',
    date: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(), // 5 days ago
    userId: 5,
    username: 'park_birder',
  },
  {
    id: 8,
    species: 'Anna\'s Hummingbird',
    count: 3,
    location: 'Monterey, California',
    latitude: 36.6002,
    longitude: -121.8947,
    notes: 'Feeding on native flowers',
    date: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(), // 7 days ago
    userId: 3,
    username: 'pelican_watcher',
  },
];

// The user can view sightings in two ways: map view or list view
type ViewMode = 'map' | 'list';

export default function MapScreen() {
  // Get the current theme (light or dark mode)
  const theme = useColorScheme() ?? 'light';
  // Get safe area insets so content doesn't go under the notch/status bar
  const insets = useSafeAreaInsets();
  
  // State variables to keep track of what the user is doing
  const [viewMode, setViewMode] = useState<ViewMode>('map'); // Start with map view
  const [searchQuery, setSearchQuery] = useState(''); // What the user typed in search
  const [showFilters, setShowFilters] = useState(false); // Whether filter modal is open
  const [showRadiusModal, setShowRadiusModal] = useState(false); // Whether radius modal is open
  const [radius, setRadius] = useState(6); // Search radius in miles
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null); // Selected species filter

  // Filter out sightings that don't have valid coordinates
  // useMemo makes sure we only recalculate this if MOCK_SIGHTINGS changes
  const allSightings = useMemo(
    () =>
      MOCK_SIGHTINGS.filter(
        (s) => s.latitude !== 0 && s.longitude !== 0 && s.latitude != null && s.longitude != null
      ),
    []
  );

  // Filter sightings based on search query and selected species
  // This runs whenever allSightings, searchQuery, or selectedSpecies changes
  const filteredSightings = useMemo(() => {
    let filtered = allSightings;

    // If user typed something in search, filter by species, location, or notes
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase(); // Make search case-insensitive
      filtered = filtered.filter(
        (s) =>
          s.species.toLowerCase().includes(query) ||
          s.location.toLowerCase().includes(query) ||
          s.notes?.toLowerCase().includes(query)
      );
    }

    // If user selected a specific species filter chip, only show that species
    if (selectedSpecies) {
      filtered = filtered.filter((s) => s.species === selectedSpecies);
    }

    return filtered;
  }, [allSightings, searchQuery, selectedSpecies]);

  // Get a list of all unique species names for the species filter chips.
  // Array.from(new Set(...)) removes duplicates, then we sort alphabetically
  const uniqueSpecies = useMemo(
    () => Array.from(new Set(allSightings.map((s) => s.species))).sort(),
    [allSightings]
  );

  // Keep track of which sighting detail modal is open
  const [selectedSightingDetail, setSelectedSightingDetail] = useState<Sighting | null>(null);

  // When user taps on a sighting (for now just logs it)
  // useCallback prevents this function from being recreated on every render
  const handleSightingPress = useCallback((sighting: Sighting) => {
    console.log('Sighting pressed:', sighting);
  }, []);

  // When user wants to see full details of a sighting
  const handleViewDetails = useCallback((sighting: Sighting) => {
    setSelectedSightingDetail(sighting); // opens the detail modal
  }, []);

  // Function to render each item in the list view
  // flatList calls this function for each sighting in the data array
  const renderSightingItem = ({ item }: { item: Sighting }) => {
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: Colors[theme].background }]}
        onPress={() => handleSightingPress(item)}
      >
        <View style={styles.listItemContent}>
          <View style={styles.listItemHeader}>
            <ThemedText type="subtitle" style={styles.listItemSpecies}>
              {item.species}
            </ThemedText>
            <ThemedText style={styles.listItemCount}>{item.count}</ThemedText>
          </View>
          <ThemedText style={styles.listItemLocation}>{item.location}</ThemedText>
          <View style={styles.listItemFooter}>
            <ThemedText style={styles.listItemTime}>{formatTimeAgo(item.date)}</ThemedText>
            {item.username && (
              <ThemedText style={styles.listItemUser}>by {item.username}</ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.searchBar, { backgroundColor: Colors[theme].background }]}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors[theme].icon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[theme].text }]}
            placeholder="Search species or location..."
            placeholderTextColor={Colors[theme].text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: Colors[theme].background }]}
            onPress={() => setShowFilters(true)}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color={Colors[theme].icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: Colors[theme].background }]}
            onPress={() => setShowRadiusModal(true)}
          >
            <IconSymbol name="mappin.circle" size={20} color={Colors[theme].icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: Colors[theme].background }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
            viewMode === 'list' && { backgroundColor: Colors[theme].tint },
          ]}
          onPress={() => setViewMode('list')}
        >
          <ThemedText
            style={[
              styles.toggleText,
              viewMode === 'list' && styles.toggleTextActive,
            ]}
          >
            List
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'map' && styles.toggleButtonActive,
            viewMode === 'map' && { backgroundColor: Colors[theme].tint },
          ]}
          onPress={() => setViewMode('map')}
        >
          <ThemedText
            style={[
              styles.toggleText,
              viewMode === 'map' && styles.toggleTextActive,
            ]}
          >
            Map
          </ThemedText>
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        <MapView
          sightings={filteredSightings}
          onSightingPress={handleSightingPress}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <FlatList
          data={filteredSightings}
          renderItem={renderSightingItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No sightings found</ThemedText>
            </View>
          }
        />
      )}

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Filters</ThemedText>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Colors[theme].icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Species</ThemedText>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedSpecies && styles.filterChipActive,
                    !selectedSpecies && { backgroundColor: Colors[theme].tint },
                  ]}
                  onPress={() => setSelectedSpecies(null)}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      !selectedSpecies && styles.filterChipTextActive,
                    ]}
                  >
                    All
                  </ThemedText>
                </TouchableOpacity>
                {uniqueSpecies.map((species) => (
                  <TouchableOpacity
                    key={species}
                    style={[
                      styles.filterChip,
                      selectedSpecies === species && styles.filterChipActive,
                      selectedSpecies === species && { backgroundColor: Colors[theme].tint },
                    ]}
                    onPress={() => setSelectedSpecies(species)}
                  >
                    <ThemedText
                      style={[
                        styles.filterChipText,
                        selectedSpecies === species && styles.filterChipTextActive,
                      ]}
                    >
                      {species}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: Colors[theme].tint }]}
              onPress={() => setShowFilters(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showRadiusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Search Radius</ThemedText>
              <TouchableOpacity onPress={() => setShowRadiusModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Colors[theme].icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.radiusSection}>
              <ThemedText style={styles.radiusLabel}>Distance: {radius} mi</ThemedText>
              <View style={styles.radiusButtons}>
                {[3, 6, 15, 30, 60].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusButton,
                      radius === r && styles.radiusButtonActive,
                      radius === r && { backgroundColor: Colors[theme].tint },
                    ]}
                    onPress={() => setRadius(r)}
                  >
                    <ThemedText
                      style={[
                        styles.radiusButtonText,
                        radius === r && styles.radiusButtonTextActive,
                      ]}
                    >
                      {r} mi
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: Colors[theme].tint }]}
              onPress={() => setShowRadiusModal(false)}
            >
              <ThemedText style={styles.applyButtonText}>Set Radius</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={!!selectedSightingDetail}
        animationType="slide"
        onRequestClose={() => setSelectedSightingDetail(null)}
      >
        <ThemedView style={styles.detailScreen}>
          {selectedSightingDetail && (
            <>
              <View style={styles.detailHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedSightingDetail(null)}
                  style={styles.closeButton}
                >
                  <IconSymbol name="chevron.left" size={24} color={Colors[theme].icon} />
                </TouchableOpacity>
                <ThemedText type="title" style={styles.detailTitle}>
                  Sighting Details
                </ThemedText>
                <View style={styles.closeButton} />
              </View>

              <ScrollView style={styles.detailContent} contentContainerStyle={styles.detailContentInner}>
                <View style={[
                  styles.detailHeaderCard,
                  { borderLeftColor: getMarkerColor(selectedSightingDetail) }
                ]}>
                  <View style={styles.detailHeaderCardContent}>
                    <View style={[
                      styles.detailIconCircle,
                      { backgroundColor: getMarkerColor(selectedSightingDetail) }
                    ]}>
                      <ThemedText style={styles.detailIconEmoji}>🦅</ThemedText>
                    </View>
                    <View style={styles.detailHeaderCardText}>
                      <ThemedText type="title" style={styles.detailSpeciesTitle}>
                        {selectedSightingDetail.species}
                      </ThemedText>
                      <ThemedText style={styles.detailTimeAgo}>
                        {formatTimeAgo(selectedSightingDetail.date)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="eye.fill" size={24} color={Colors[theme].icon} />
                    <View style={styles.detailTextContainer}>
                      <ThemedText style={styles.detailLabel}>Count</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {selectedSightingDetail.count} {selectedSightingDetail.count === 1 ? 'bird' : 'birds'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol name="mappin.and.ellipse" size={24} color={Colors[theme].icon} />
                    <View style={styles.detailTextContainer}>
                      <ThemedText style={styles.detailLabel}>Location</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {selectedSightingDetail.location}
                      </ThemedText>
                    </View>
                  </View>

                  {selectedSightingDetail.username && (
                    <View style={styles.detailRow}>
                      <IconSymbol name="person.fill" size={24} color={Colors[theme].icon} />
                      <View style={styles.detailTextContainer}>
                        <ThemedText style={styles.detailLabel}>Spotted by</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                          {selectedSightingDetail.username}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <IconSymbol name="calendar" size={24} color={Colors[theme].icon} />
                    <View style={styles.detailTextContainer}>
                      <ThemedText style={styles.detailLabel}>Date & Time</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {new Date(selectedSightingDetail.date).toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>

                  {selectedSightingDetail.notes && (
                    <View style={styles.detailNotesSection}>
                      <ThemedText type="defaultSemiBold" style={styles.detailNotesLabel}>
                        Notes
                      </ThemedText>
                      <ThemedText style={styles.detailNotesText}>
                        {selectedSightingDetail.notes}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </ScrollView>
            </>
          )}
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  toggleTextActive: {
    opacity: 1,
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listItemContent: {
    gap: 8,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemSpecies: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  listItemCount: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  listItemLocation: {
    fontSize: 14,
    opacity: 0.7,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listItemTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  listItemUser: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  radiusSection: {
    marginBottom: 24,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    minWidth: 80,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#007AFF',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: '#FFF',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  detailScreen: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  detailContent: {
    flex: 1,
  },
  detailContentInner: {
    padding: 20,
  },
  detailHeaderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  detailHeaderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIconEmoji: {
    fontSize: 32,
  },
  detailHeaderCardText: {
    flex: 1,
  },
  detailSpeciesTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailTimeAgo: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailSection: {
    gap: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 18,
    color: '#111827',
  },
  detailNotesSection: {
    marginTop: 8,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  detailNotesLabel: {
    fontSize: 14,
    marginBottom: 12,
    color: '#374151',
  },
  detailNotesText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
});
