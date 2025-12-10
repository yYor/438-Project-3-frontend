import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
// import type { Sighting } from '@/utils/sighting'; // no longer needed for payload
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://birdwatchers-c872a1ce9f02.herokuapp.com';

type BirdOption = {
  id: number;
  name: string;
};

export default function AddSightingScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  // ---- Species / birds from API ----
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [speciesName, setSpeciesName] = useState<string>('');
  const [speciesList, setSpeciesList] = useState<BirdOption[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState<boolean>(false);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);

  // other form state
  const [count, setCount] = useState<string>('1');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  const [useGPS, setUseGPS] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const lastGeocodedLocation = useRef<string>('');
  const isGeocodingRef = useRef(false);

  const [saving, setSaving] = useState(false);

  const { user } = useAuth();


  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  ];

  const cities = [
    'Monterey', 'Salinas', 'Santa Cruz', 'San Francisco', 'San Jose', 'Oakland', 'Sacramento', 'Los Angeles',
    'San Diego', 'Fresno', 'Long Beach', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista',
    'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard', 'Moreno Valley', 'Huntington Beach', 'Glendale',
    'Santa Clarita', 'Garden Grove', 'Oceanside', 'Rancho Cucamonga', 'Santa Rosa', 'Ontario', 'Lancaster',
    'Elk Grove', 'Corona', 'Palmdale', 'Salem', 'Pomona', 'Hayward', 'Escondido', 'Torrance', 'Sunnyvale',
    'Orange', 'Fullerton', 'Pasadena', 'Thousand Oaks', 'Visalia', 'Simi Valley', 'Concord', 'Roseville',
    'Vallejo', 'Victorville', 'Fairfield', 'Inglewood', 'Santa Clara', 'San Buenaventura', 'Richmond', 'Daly City',
  ];

  const iconColor =
    theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor =
    theme === 'light' ? Colors.light.tint : Colors.dark.tint;

  useEffect(() => {
  const fetchSpecies = async () => {
    try {
      setSpeciesLoading(true);
      setSpeciesError(null);

      const res = await fetch(`${API_BASE_URL}/api/birds/getBirds`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const birds = await res.json();
      console.log("BIRDS RESPONSE:", birds);

      const options: BirdOption[] = birds.map((b: any) => ({
        id: b.birdId,       // ✔ correct field
        name: b.birdName,   // ✔ correct field
      }));

      setSpeciesList(options);
    } catch (err) {
      console.error("Failed to fetch species", err);
      setSpeciesError("Could not load species list. Please try again.");
    } finally {
      setSpeciesLoading(false);
    }
  };

  fetchSpecies();
}, []);
  // ---- Geocoding / location logic (unchanged) ----
  const geocodeLocation = useCallback(
    async (cityName: string, stateName: string) => {
      const locationString = `${cityName}, ${stateName}`;

      if (lastGeocodedLocation.current === locationString) {
        console.log(
          `Skipping geocode - already have coordinates for "${locationString}"`,
        );
        return;
      }

      if (isGettingLocation || isGeocodingRef.current) {
        console.log('Skipping geocode - already in progress');
        return;
      }

      setIsGeocoding(true);
      setLocationError(null);

      try {
        const results = await Location.geocodeAsync(locationString);

        if (results && results.length > 0) {
          const { latitude: lat, longitude: lng } = results[0];
          setLatitude(lat);
          setLongitude(lng);
          lastGeocodedLocation.current = locationString;
          console.log(
            `Geocoded "${locationString}" to coordinates: ${lat}, ${lng}`,
          );
        } else {
          console.log(`Could not geocode "${locationString}"`);
          setLatitude(null);
          setLongitude(null);
        }
      } catch (error: any) {
        console.log('Geocoding error:', error.message);
        setLatitude(null);
        setLongitude(null);
      } finally {
        isGeocodingRef.current = false;
        setIsGeocoding(false);
      }
    },
    [isGettingLocation],
  );

  useEffect(() => {
    if (useGPS) {
      getCurrentLocation();
    } else {
      setLocationError(null);
    }
  }, [useGPS]);

  useEffect(() => {
    if (useGPS) {
      lastGeocodedLocation.current = '';
      return;
    }

    if (!city.trim() || !state.trim()) {
      setLatitude(null);
      setLongitude(null);
      lastGeocodedLocation.current = '';
      return;
    }

    const locationString = `${city.trim()}, ${state.trim()}`;
    if (lastGeocodedLocation.current === locationString) {
      return;
    }

    const timer = setTimeout(() => {
      geocodeLocation(city.trim(), state.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [city, state, useGPS, geocodeLocation]);

  async function getCurrentLocation() {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError(
          'Location services are disabled. Please enable them in settings.',
        );
        setUseGPS(false);
        setIsGettingLocation(false);
        return;
      }

      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(
          'Location permission denied. Please enable location access in settings.',
        );
        setUseGPS(false);
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng } = location.coords;
      setLatitude(lat);
      setLongitude(lng);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (address) {
          if (address.city) setCity(address.city);
          if (address.region) setState(address.region);
        }
      } catch {
        console.log(
          'Reverse geocoding failed, user can select city/state from dropdowns',
        );
      }
    } catch (error: any) {
      console.log('Error getting location:', error);
      setLocationError(error.message || 'Failed to get location');
      setUseGPS(false);
    } finally {
      setIsGettingLocation(false);
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function onChangeDate(_event: any, value?: Date) {
    if (Platform.OS === 'ios') setShowDatePicker(false);
    if (!value) return;

    const current = new Date(date);
    current.setFullYear(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );
    setDate(current.toISOString());
  }

  function onChangeTime(_event: any, value?: Date) {
    if (Platform.OS === 'ios') setShowTimePicker(false);
    if (!value) return;

    const current = new Date(date);
    current.setHours(value.getHours(), value.getMinutes(), 0, 0);
    setDate(current.toISOString());
  }

  function openAndroidDate() {
    DateTimePickerAndroid.open({
      value: new Date(date),
      mode: 'date',
      onChange: (event, value) => {
        if (event?.type !== 'set' || !value) return;
        onChangeDate(event, value);
      },
    });
  }

  function openAndroidTime() {
    DateTimePickerAndroid.open({
      value: new Date(date),
      mode: 'time',
      is24Hour: false,
      onChange: (event, value) => {
        if (event?.type !== 'set' || !value) return;
        onChangeTime(event, value);
      },
    });
  }

  // ---- Save to backend ----
  async function handleSave() {
    if (!speciesId || !speciesName.trim()) {
      Alert.alert(
        'Missing species',
        'Please select a species from the list.',
      );
      return;
    }

    if (!city.trim() || !state.trim()) {
      Alert.alert(
        'Missing location',
        'Please select a city and state, or enable GPS to auto-fill them.',
      );
      return;
    }

    if (useGPS && (latitude === null || longitude === null)) {
      Alert.alert(
        'Location error',
        'GPS location is enabled but coordinates are missing. Please wait for GPS to finish, or disable GPS and select city/state manually.',
      );
      return;
    }

    const locationString = `${city.trim()}, ${state.trim()}`;

    const finalLatitude: number = latitude ?? 0;
    const finalLongitude: number = longitude ?? 0;

    const payload = {
      userId: user?.id,
      birdId: speciesId,
      count: Number(count) || 1,
      location: locationString,
      latitude: finalLatitude,
      longitude: finalLongitude,
      notes: notes.trim() || undefined,
      observedAt: date, // backend uses observedAt in ApiSightingResponse
    };

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/sightings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Create sighting failed:', res.status, text);
        throw new Error(
          `Failed to save sighting (HTTP ${res.status}).`,
        );
      }

      Alert.alert('Success', 'Your sighting has been recorded.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Could not save your sighting.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.select({
          ios: 'padding',
          android: undefined,
        })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.headerBtn}
            >
              <ThemedText type="link">Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title">Add Sighting</ThemedText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={saving ? undefined : handleSave}
              style={styles.headerBtn}
              disabled={saving}
            >
              <ThemedText type="link">
                {saving ? 'Saving…' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <ThemedText
              type="subtitle"
              style={styles.sectionTitle}
            >
              Details
            </ThemedText>

            {/* Species dropdown instead of text input */}
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6 }}>
                Species *
              </ThemedText>

              <TouchableOpacity
                onPress={() => {
                  if (!speciesLoading) setShowSpeciesPicker(true);
                }}
                style={[
                  styles.input,
                  styles.locationTypeButton,
                  speciesLoading && { opacity: 0.6 },
                ]}
                disabled={speciesLoading}
              >
                <ThemedText style={styles.locationTypeLabel}>
                  {speciesLoading
                    ? 'Loading species…'
                    : speciesName || 'Select Species'}
                </ThemedText>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={iconColor}
                />
              </TouchableOpacity>

              {speciesError && (
                <ThemedText
                  style={{
                    fontSize: 11,
                    color: '#C62828',
                    marginTop: 4,
                  }}
                >
                  {speciesError}
                </ThemedText>
              )}
            </View>

            <LabeledInput
              label="Count"
              placeholder="1"
              keyboardType="number-pad"
              value={count}
              onChangeText={setCount}
            />

            {/* Location Section (unchanged UI) */}
            <View style={{ marginBottom: 12 }}>
              <View style={styles.locationHeader}>
                <ThemedText style={{ marginBottom: 6 }}>
                  Location
                </ThemedText>
                <View style={styles.gpsToggle}>
                  <ThemedText style={styles.gpsToggleLabel}>
                    Use GPS
                  </ThemedText>
                  <Switch
                    value={useGPS}
                    onValueChange={setUseGPS}
                    trackColor={{
                      false: '#767577',
                      true: tintColor,
                    }}
                    thumbColor={
                      Platform.OS === 'android'
                        ? '#f4f3f4'
                        : '#fff'
                    }
                  />
                </View>
              </View>

              <View>
                {useGPS && (
                  <View>
                    {isGettingLocation ? (
                      <View style={styles.locationStatus}>
                        <ActivityIndicator
                          size="small"
                          color={tintColor}
                        />
                        <ThemedText
                          style={styles.locationStatusText}
                        >
                          Getting GPS location...
                        </ThemedText>
                      </View>
                    ) : latitude !== null &&
                      longitude !== null ? (
                      <View style={styles.locationStatus}>
                        <IconSymbol
                          name="mappin.and.ellipse"
                          size={16}
                          color={tintColor}
                        />
                        <ThemedText
                          style={styles.locationStatusText}
                        >
                          GPS location found
                        </ThemedText>
                      </View>
                    ) : null}

                    {locationError && (
                      <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>
                          {locationError}
                        </ThemedText>
                        <TouchableOpacity
                          onPress={getCurrentLocation}
                          style={styles.retryButton}
                        >
                          <ThemedText
                            style={styles.retryButtonText}
                          >
                            Retry GPS
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}

                    {latitude !== null && longitude !== null && (
                      <View style={styles.coordinatesContainer}>
                        <ThemedText
                          style={styles.coordinatesLabel}
                        >
                          GPS Coordinates:
                        </ThemedText>
                        <ThemedText style={styles.coordinatesText}>
                          {latitude.toFixed(6)},{' '}
                          {longitude.toFixed(6)}
                        </ThemedText>
                      </View>
                    )}

                    {!isGettingLocation &&
                      (latitude === null ||
                        longitude === null) && (
                        <TouchableOpacity
                          onPress={getCurrentLocation}
                          style={[
                            styles.gpsButton,
                            { backgroundColor: tintColor },
                          ]}
                        >
                          <IconSymbol
                            name="mappin.and.ellipse"
                            size={18}
                            color="#FFF"
                          />
                          <ThemedText
                            style={styles.gpsButtonText}
                          >
                            Get Current Location
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                  </View>
                )}

                {!useGPS && isGeocoding && (
                  <View style={styles.locationStatus}>
                    <ActivityIndicator
                      size="small"
                      color={tintColor}
                    />
                    <ThemedText
                      style={styles.locationStatusText}
                    >
                      Getting coordinates...
                    </ThemedText>
                  </View>
                )}

                {!useGPS &&
                  !isGeocoding &&
                  latitude !== null &&
                  longitude !== null && (
                    <View style={styles.coordinatesContainer}>
                      <ThemedText
                        style={styles.coordinatesLabel}
                      >
                        Coordinates:
                      </ThemedText>
                      <ThemedText
                        style={styles.coordinatesText}
                      >
                        {latitude.toFixed(4)},{' '}
                        {longitude.toFixed(4)}
                      </ThemedText>
                    </View>
                  )}

                {/* City dropdown */}
                <View
                  style={{
                    marginBottom: 12,
                    marginTop: useGPS ? 12 : 0,
                  }}
                >
                  <ThemedText style={{ marginBottom: 6 }}>
                    City *
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowCityPicker(true)}
                    style={[
                      styles.input,
                      styles.locationTypeButton,
                    ]}
                    disabled={isGettingLocation}
                  >
                    <ThemedText
                      style={styles.locationTypeLabel}
                    >
                      {city || 'Select City'}
                    </ThemedText>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                </View>

                {/* State dropdown */}
                <View style={{ marginBottom: 12 }}>
                  <ThemedText style={{ marginBottom: 6 }}>
                    State *
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowStatePicker(true)}
                    style={[
                      styles.input,
                      styles.locationTypeButton,
                    ]}
                    disabled={isGettingLocation}
                  >
                    <ThemedText
                      style={styles.locationTypeLabel}
                    >
                      {state || 'Select State'}
                    </ThemedText>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ThemedText style={styles.locationHint}>
                {useGPS
                  ? 'GPS will automatically fill in city and state from your location. You can still change them using the dropdowns above if needed.'
                  : 'Select your city and state from the dropdowns above. Required fields are marked with *.'}
              </ThemedText>
            </View>

            <ThemedText style={{ marginBottom: 6 }}>
              Date/Time
            </ThemedText>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() =>
                  Platform.OS === 'android'
                    ? openAndroidDate()
                    : setShowDatePicker(true)
                }
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="calendar"
                  size={18}
                  color={iconColor}
                />
                <ThemedText style={{ marginLeft: 8 }}>
                  {formatDate(date).split(',')[0]}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() =>
                  Platform.OS === 'android'
                    ? openAndroidTime()
                    : setShowTimePicker(true)
                }
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="clock.fill"
                  size={18}
                  color={iconColor}
                />
                <ThemedText style={{ marginLeft: 8 }}>
                  {formatDate(date)
                    .split(',')
                    .slice(1)
                    .join(',')
                    .trim()}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText
              type="subtitle"
              style={styles.sectionTitle}
            >
              Notes
            </ThemedText>
            <TextInput
              placeholder="Behavior, habitat, field marks..."
              placeholderTextColor={
                theme === 'light'
                  ? '#8E9BA3'
                  : '#7A7F85'
              }
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
              multiline
              numberOfLines={5}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityPicker(false)}
        >
          <ThemedView
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    theme === 'light'
                      ? '#E1E6EA'
                      : '#2A2D31',
                },
              ]}
            >
              <ThemedText type="subtitle">
                Select City
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowCityPicker(false)}
              >
                <ThemedText type="link">Done</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {cities.map((cityName) => (
                <TouchableOpacity
                  key={cityName}
                  style={[
                    styles.locationTypeOption,
                    {
                      borderBottomColor:
                        theme === 'light'
                          ? '#F0F0F0'
                          : '#2A2D31',
                    },
                    city === cityName &&
                      styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => {
                    setCity(cityName);
                    setShowCityPicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.locationTypeOptionText,
                      city === cityName && [
                        styles.locationTypeOptionTextSelected,
                        { color: tintColor },
                      ],
                    ]}
                  >
                    {cityName}
                  </ThemedText>
                  {city === cityName && (
                    <IconSymbol
                      name="checkmark"
                      size={18}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatePicker(false)}
        >
          <ThemedView
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    theme === 'light'
                      ? '#E1E6EA'
                      : '#2A2D31',
                },
              ]}
            >
              <ThemedText type="subtitle">
                Select State
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowStatePicker(false)}
              >
                <ThemedText type="link">Done</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {states.map((stateName) => (
                <TouchableOpacity
                  key={stateName}
                  style={[
                    styles.locationTypeOption,
                    {
                      borderBottomColor:
                        theme === 'light'
                          ? '#F0F0F0'
                          : '#2A2D31',
                    },
                    state === stateName &&
                      styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => {
                    setState(stateName);
                    setShowStatePicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.locationTypeOptionText,
                      state === stateName && [
                        styles.locationTypeOptionTextSelected,
                        { color: tintColor },
                      ],
                    ]}
                  >
                    {stateName}
                  </ThemedText>
                  {state === stateName && (
                    <IconSymbol
                      name="checkmark"
                      size={18}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {/* Species Picker Modal */}
      <Modal
        visible={showSpeciesPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpeciesPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeciesPicker(false)}
        >
          <ThemedView
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    theme === 'light'
                      ? '#E1E6EA'
                      : '#2A2D31',
                },
              ]}
            >
              <ThemedText type="subtitle">
                Select Species
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowSpeciesPicker(false)}
              >
                <ThemedText type="link">Done</ThemedText>
              </TouchableOpacity>
            </View>
            {speciesLoading ? (
              <View
                style={{
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator color={tintColor} />
                <ThemedText style={{ marginTop: 8 }}>
                  Loading species…
                </ThemedText>
              </View>
            ) : (
              <ScrollView>
              {speciesList.map((bird) => (
                <TouchableOpacity
                  key={bird.id}   // <-- ADD THIS
                  style={[
                    styles.locationTypeOption,
                    {
                      borderBottomColor:
                        theme === 'light' ? '#F0F0F0' : '#2A2D31',
                    },
                    speciesId === bird.id && styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => {
                    setSpeciesId(bird.id);
                    setSpeciesName(bird.name);
                    setShowSpeciesPicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.locationTypeOptionText,
                      speciesId === bird.id && [
                        styles.locationTypeOptionTextSelected,
                        { color: tintColor },
                      ],
                    ]}
                  >
                    {bird.name}
                  </ThemedText>
                  {speciesId === bird.id && (
                    <IconSymbol
                      name="checkmark"
                      size={18}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}

              </ScrollView>
            )}
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {Platform.OS === 'ios' && showDatePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {Platform.OS === 'ios' && showTimePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeTime}
          is24Hour={false}
        />
      )}
    </ThemedView>
  );
}

function LabeledInput({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  const theme = useColorScheme() ?? 'light';
  const borderColor =
    theme === 'light' ? '#E1E6EA' : '#2A2D31';
  const textColor =
    theme === 'light' ? '#11181C' : '#ECEDEE';

  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedText style={{ marginBottom: 6 }}>
        {label}
      </ThemedText>
      <TextInput
        {...props}
        style={[
          styles.input,
          { borderColor, color: textColor },
        ]}
      />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.qaBtn}
      activeOpacity={0.8}
    >
      <IconSymbol name={icon} size={22} color={color} />
      <ThemedText style={{ marginTop: 6 }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    padding: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qaBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsToggleLabel: {
    fontSize: 14,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 6,
  },
  locationStatusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F44336',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  coordinatesContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  coordinatesLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.9,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  gpsButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  locationHint: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 6,
    fontStyle: 'italic',
  },
  locationTypeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationTypeLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  locationTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  locationTypeOptionSelected: {
    backgroundColor: '#F0F7FF',
  },
  locationTypeOptionText: {
    fontSize: 16,
  },
  locationTypeOptionTextSelected: {
    fontWeight: '600',
  },
});