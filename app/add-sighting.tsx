import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Sighting } from '@/utils/sighting';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSightingScreen() {
  // Get theme and safe area insets
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  // Form state - all the fields the user can fill in when adding a sighting
  const [species, setSpecies] = useState(''); // Bird species name
  const [count, setCount] = useState<string>('1'); // How many birds they spotted
  const [notes, setNotes] = useState(''); // Optional notes about the sighting
  const [date, setDate] = useState<string>(new Date().toISOString()); // When they spotted it (defaults to now)
  const [showDatePicker, setShowDatePicker] = useState(false); // Whether date picker is showing (hidden by default)
  const [showTimePicker, setShowTimePicker] = useState(false); // Whether time picker is showing (hidden by default)
  
  // Location fields - dropdowns for city and state
  const [city, setCity] = useState(''); // City name
  const [state, setState] = useState(''); // State or region (e.g., "CA" or "California")
  const [showCityPicker, setShowCityPicker] = useState(false); // Whether city picker is showing
  const [showStatePicker, setShowStatePicker] = useState(false); // Whether state picker is showing
  
  // GPS location fields
  const [useGPS, setUseGPS] = useState(false); // Whether user wants to use GPS
  const [latitude, setLatitude] = useState<number | null>(null); // GPS latitude coordinate
  const [longitude, setLongitude] = useState<number | null>(null); // GPS longitude coordinate
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Loading state while getting GPS
  const [isGeocoding, setIsGeocoding] = useState(false); // Loading state while geocoding city/state
  const [locationError, setLocationError] = useState<string | null>(null); // Error message if GPS fails
  
  // Track the last geocoded city/state to prevent re-geocoding the same location
  const lastGeocodedLocation = useRef<string>('');
  // Track if geocoding is in progress to prevent multiple simultaneous calls
  const isGeocodingRef = useRef(false);
  

  // List of US states (common ones for bird watching areas)
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // Common cities (can be expanded or fetched from API later)
  const cities = [
    'Monterey', 'Salinas', 'Santa Cruz', 'San Francisco', 'San Jose', 'Oakland', 'Sacramento', 'Los Angeles',
    'San Diego', 'Fresno', 'Long Beach', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista',
    'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard', 'Moreno Valley', 'Huntington Beach', 'Glendale',
    'Santa Clarita', 'Garden Grove', 'Oceanside', 'Rancho Cucamonga', 'Santa Rosa', 'Ontario', 'Lancaster',
    'Elk Grove', 'Corona', 'Palmdale', 'Salem', 'Pomona', 'Hayward', 'Escondido', 'Torrance', 'Sunnyvale',
    'Orange', 'Fullerton', 'Pasadena', 'Thousand Oaks', 'Visalia', 'Simi Valley', 'Concord', 'Roseville',
    'Vallejo', 'Victorville', 'Fairfield', 'Inglewood', 'Santa Clara', 'San Buenaventura', 'Richmond', 'Daly City'
  ];

  // Get the right colors based on theme
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;

  // Convert city and state name to coordinates using geocoding API
  // This is much easier than maintaining a hardcoded list of coordinates
  // Expo Location's geocodeAsync converts location names to coordinates
  // useCallback ensures this function doesn't change on every render
  const geocodeLocation = useCallback(async (cityName: string, stateName: string) => {
    // Format the location string: "City, State" (e.g., "Santa Cruz, California")
    const locationString = `${cityName}, ${stateName}`;
    
    // Don't geocode if we already geocoded this exact location
    if (lastGeocodedLocation.current === locationString) {
      console.log(`Skipping geocode - already have coordinates for "${locationString}"`);
      return;
    }
    
    // Don't geocode if we're already getting GPS location or already geocoding
    if (isGettingLocation || isGeocodingRef.current) {
      console.log('Skipping geocode - already in progress');
      return;
    }
    
    setIsGeocoding(true);
    setLocationError(null);
    
    try {
      // Use Expo Location's geocodeAsync to convert location name to coordinates
      // This uses the device's geocoding service
      const results = await Location.geocodeAsync(locationString);
      
      if (results && results.length > 0) {
        // Get the first (most relevant) result
        const { latitude: lat, longitude: lng } = results[0];
        setLatitude(lat);
        setLongitude(lng);
        // Remember we geocoded this location
        lastGeocodedLocation.current = locationString;
        console.log(`Geocoded "${locationString}" to coordinates: ${lat}, ${lng}`);
      } else {
        // No results found - this city/state combination might not exist
        console.log(`Could not geocode "${locationString}"`);
        setLatitude(null);
        setLongitude(null);
      }
    } catch (error: any) {
      // If geocoding fails, log it
      console.log('Geocoding error:', error.message);
      setLatitude(null);
      setLongitude(null);
    } finally {
      // Mark that we're done geocoding
      isGeocodingRef.current = false;
      setIsGeocoding(false);
    }
  }, [isGettingLocation]);

  // When user toggles GPS on/off, get location or clear GPS data
  useEffect(() => {
    if (useGPS) {
      // GPS is enabled - get precise GPS coordinates
      getCurrentLocation();
    } else {
      // User turned GPS off - clear GPS coordinates but keep city/state selections
      setLocationError(null);
      // Don't clear city/state - user can still use the dropdowns
      // Geocoding will happen in the city/state useEffect below
    }
  }, [useGPS]);
  
  // When city or state changes and GPS is off, geocode to get coordinates
  useEffect(() => {
    // Only geocode if GPS is off and both city and state are selected
    // This ensures selecting a city/state (like Santa Cruz, California) sets the correct coordinates
    if (useGPS) {
      // GPS is on, don't geocode - GPS coordinates take priority
      // Also clear the last geocoded location so we can geocode again if GPS is turned off
      lastGeocodedLocation.current = '';
      return;
    }
    
    if (!city.trim() || !state.trim()) {
      // City or state is empty, clear coordinates
      setLatitude(null);
      setLongitude(null);
      lastGeocodedLocation.current = '';
      return;
    }
    
    // Check if we already geocoded this exact location
    const locationString = `${city.trim()}, ${state.trim()}`;
    if (lastGeocodedLocation.current === locationString) {
      // Already have coordinates for this location, no need to geocode again
      return;
    }
    
    // Debounce geocoding - wait 500ms after user stops selecting
    // This prevents geocoding on every keystroke/selection
    const timer = setTimeout(() => {
      geocodeLocation(city.trim(), state.trim());
    }, 500);
    
    // Cleanup timer if city/state changes again before 500ms
    return () => clearTimeout(timer);
  }, [city, state, useGPS, geocodeLocation]);

  // Get the user's current GPS location
  async function getCurrentLocation() {
    setIsGettingLocation(true); // Show loading spinner
    setLocationError(null); // Clear any previous errors
    
    try {
      // First check if location services are even enabled on the device
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError('Location services are disabled. Please enable them in settings.');
        setUseGPS(false); // Turn off GPS toggle
        setIsGettingLocation(false);
        return;
      }

      // Ask user for permission to use their location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location access in settings.');
        setUseGPS(false);
        setIsGettingLocation(false);
        return;
      }

      // Get the actual GPS coordinates with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Use high accuracy for precise location
      });

      // Extract the coordinates from the location object
      const { latitude: lat, longitude: lng } = location.coords;
      
      // Save the GPS coordinates
      setLatitude(lat);
      setLongitude(lng);

      // Try to convert coordinates to city and state (reverse geocoding)
      // This auto-fills the dropdowns so user doesn't have to select manually
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (address) {
          // Auto-fill city and state dropdowns from GPS location
          if (address.city) setCity(address.city);
          if (address.region) setState(address.region); // region is state/province (e.g., "California")
          // User can still change these using the dropdowns if GPS got it wrong
        }
      } catch (geocodeError) {
        // If we can't get city/state from GPS, that's okay
        // User can still select city and state from the dropdowns
        console.log('Reverse geocoding failed, user can select city/state from dropdowns');
      }
    } catch (error: any) {
      // Something went wrong, show error message
      console.log('Error getting location:', error);
      setLocationError(error.message || 'Failed to get location');
      setUseGPS(false);
    } finally {
      // Always stop loading spinner, even if there was an error
      setIsGettingLocation(false);
    }
  }

  // Format an ISO date string to a nice readable format
  // Example: "2024-01-15T14:30:00Z" -> "Jan 15, 2024, 02:30 PM"
  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short', // "Jan", "Feb", etc.
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      // If date parsing fails, just return the original string
      return iso;
    }
  }

  // Called when user picks a new date
  function onChangeDate(_event: any, value?: Date) {
    // On iOS, close the picker after selection
    if (Platform.OS === 'ios') setShowDatePicker(false);
    if (!value) return; // User cancelled 
    
    // Update the date part but keep the time the same
    const current = new Date(date);
    current.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
    setDate(current.toISOString()); // Save as ISO string
  }

  // Called when user picks a new time
  function onChangeTime(_event: any, value?: Date) {
    // On iOS, close the picker after selection
    if (Platform.OS === 'ios') setShowTimePicker(false);
    if (!value) return; // User cancelled
    
    // Update the time part but keep the date the same
    const current = new Date(date);
    current.setHours(value.getHours(), value.getMinutes(), 0, 0); // Set seconds to 0 to clear seconds
    setDate(current.toISOString()); // Save as ISO string
  }

  // Open the Android date picker modal component for date selection
  function openAndroidDate() {
    DateTimePickerAndroid.open({
      value: new Date(date), // Current date
      mode: 'date', // Date picker mode
      onChange: (event, value) => {
        // Only update if user actually set a date (didn't cancel) and value is 'set'
        if (event?.type !== 'set' || !value) return;
        onChangeDate(event, value);
      },
    });
  }

  // Open the Android time picker modal component for time selection
  function openAndroidTime() {
    DateTimePickerAndroid.open({
      value: new Date(date), // Current time
      mode: 'time', // Time picker mode
      is24Hour: false, // Use 12-hour format (AM/PM)
      onChange: (event, value) => {
        // Only update if user actually set a time (didn't cancel) and value is 'set'
        if (event?.type !== 'set' || !value) return;
        onChangeTime(event, value);
      },
    });
  }

  // Called when user taps the Save button
  function handleSave() {
    // Validate that required fields are filled in
    if (!species.trim()) {
      Alert.alert('Missing species', 'Please enter a species name.');
      return; // Don't save if species is empty
    }

    // Validate that we have city and state filled in
    if (!city.trim() || !state.trim()) {
      Alert.alert('Missing location', 'Please select a city and state, or enable GPS to auto-fill them.');
      return; // Don't save if city or state is missing
    }

    // If GPS is enabled, make sure we actually got coordinates
    if (useGPS && (latitude === null || longitude === null)) {
      Alert.alert('Location error', 'GPS location is enabled but coordinates are missing. Please wait for GPS to finish, or disable GPS and select city/state manually.');
      return;
    }

    // Build the location string from city and state
    // Format: "City, State" (e.g., "Monterey, California")
    const locationString = `${city.trim()}, ${state.trim()}`;

    // Get the final latitude and longitude values
    // Priority: GPS coordinates > geocoded coordinates > 0 (fallback)
    // The schema requires latitude and longitude to be numbers (not null)
    const finalLatitude: number = latitude ?? 0;
    const finalLongitude: number = longitude ?? 0;

    // Build the sighting object matching the Sighting schema exactly
    // Only include fields that are in the schema
    const sightingData: Omit<Sighting, 'id'> = {
      species: species.trim(), // Remove extra spaces
      count: Number(count) || 1, // Convert to number, default to 1
      location: locationString, // Combined address, city, state string
      latitude: finalLatitude, // Must be a number (required by schema)
      longitude: finalLongitude, // Must be a number (required by schema)
      notes: notes.trim() || undefined, // Optional notes (use undefined instead of empty string)
      date: date, // ISO date string (required)
      // Optional fields from schema:
      userId: undefined, // Will be set by backend when user authentication is added
      username: undefined, // Will be set by backend when user authentication is added
      photos: undefined, // Will be added when photo upload is implemented
    };
    
    // Send this to the backend API using createSighting() method from apiService class
    // log it and show a success message in an alert
    console.log('Saving sighting', sightingData);
    Alert.alert('Sighting saved', 'Your sighting has been saved locally.');
    router.back(); // Go back to previous screen
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }] }>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.headerBtn}>
              <ThemedText type="link">Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title">Add Sighting</ThemedText>
            <TouchableOpacity accessibilityRole="button" onPress={handleSave} style={styles.headerBtn}>
              <ThemedText type="link">Save</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Details</ThemedText>
            <LabeledInput label="Species" placeholder="e.g., Northern Cardinal" value={species} onChangeText={setSpecies} autoCapitalize="words" />
            <LabeledInput label="Count" placeholder="1" keyboardType="number-pad" value={count} onChangeText={setCount} />
            
            {/* Location Section */}
            <View style={{ marginBottom: 12 }}>
              <View style={styles.locationHeader}>
                <ThemedText style={{ marginBottom: 6 }}>Location</ThemedText>
                <View style={styles.gpsToggle}>
                  <ThemedText style={styles.gpsToggleLabel}>Use GPS</ThemedText>
                  <Switch
                    value={useGPS}
                    onValueChange={setUseGPS}
                    trackColor={{ false: '#767577', true: tintColor }}
                    thumbColor={Platform.OS === 'android' ? '#f4f3f4' : '#fff'}
                  />
                </View>
              </View>
              
              {/* Always show city and state dropdowns - GPS just auto-fills them */}
              <View>
                {/* Show GPS status when GPS is enabled */}
                {useGPS && (
                  <View>
                    {isGettingLocation ? (
                      <View style={styles.locationStatus}>
                        <ActivityIndicator size="small" color={tintColor} />
                        <ThemedText style={styles.locationStatusText}>Getting GPS location...</ThemedText>
                      </View>
                    ) : latitude !== null && longitude !== null ? (
                      <View style={styles.locationStatus}>
                        <IconSymbol name="mappin.and.ellipse" size={16} color={tintColor} />
                        <ThemedText style={styles.locationStatusText}>GPS location found</ThemedText>
                      </View>
                    ) : null}
                    
                    {locationError && (
                      <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>{locationError}</ThemedText>
                        <TouchableOpacity onPress={getCurrentLocation} style={styles.retryButton}>
                          <ThemedText style={styles.retryButtonText}>Retry GPS</ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Show GPS coordinates if we have them */}
                    {latitude !== null && longitude !== null && (
                      <View style={styles.coordinatesContainer}>
                        <ThemedText style={styles.coordinatesLabel}>GPS Coordinates:</ThemedText>
                        <ThemedText style={styles.coordinatesText}>
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {/* Button to get GPS location if we don't have it yet */}
                    {!isGettingLocation && (latitude === null || longitude === null) && (
                      <TouchableOpacity 
                        onPress={getCurrentLocation} 
                        style={[styles.gpsButton, { backgroundColor: tintColor }]}
                      >
                        <IconSymbol name="mappin.and.ellipse" size={18} color="#FFF" />
                        <ThemedText style={styles.gpsButtonText}>Get Current Location</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Show geocoding status when getting coordinates from city/state */}
                {!useGPS && isGeocoding && (
                  <View style={styles.locationStatus}>
                    <ActivityIndicator size="small" color={tintColor} />
                    <ThemedText style={styles.locationStatusText}>Getting coordinates...</ThemedText>
                  </View>
                )}
                
                {/* Show coordinates if we have them from geocoding */}
                {!useGPS && !isGeocoding && latitude !== null && longitude !== null && (
                  <View style={styles.coordinatesContainer}>
                    <ThemedText style={styles.coordinatesLabel}>Coordinates:</ThemedText>
                    <ThemedText style={styles.coordinatesText}>
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </ThemedText>
                  </View>
                )}

                {/* City Dropdown - always shown */}
                <View style={{ marginBottom: 12, marginTop: useGPS ? 12 : 0 }}>
                  <ThemedText style={{ marginBottom: 6 }}>City *</ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowCityPicker(true)}
                    style={[styles.input, styles.locationTypeButton]}
                    disabled={isGettingLocation}
                  >
                    <ThemedText style={styles.locationTypeLabel}>
                      {city || 'Select City'}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={16} color={iconColor} />
                  </TouchableOpacity>
                </View>

                {/* State Dropdown - always shown */}
                <View style={{ marginBottom: 12 }}>
                  <ThemedText style={{ marginBottom: 6 }}>State *</ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowStatePicker(true)}
                    style={[styles.input, styles.locationTypeButton]}
                    disabled={isGettingLocation}
                  >
                    <ThemedText style={styles.locationTypeLabel}>
                      {state || 'Select State'}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={16} color={iconColor} />
                  </TouchableOpacity>
                </View>
                
              </View>
              
              <ThemedText style={styles.locationHint}>
                {useGPS 
                  ? 'GPS will automatically fill in city and state from your location. You can still change them using the dropdowns above if needed.'
                  : 'Select your city and state from the dropdowns above. Required fields are marked with *.'}
              </ThemedText>
            </View>
            <ThemedText style={{ marginBottom: 6 }}>Date/Time</ThemedText>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() => (Platform.OS === 'android' ? openAndroidDate() : setShowDatePicker(true))}
                activeOpacity={0.8}
              >
                <IconSymbol name="calendar" size={18} color={iconColor} />
                <ThemedText style={{ marginLeft: 8 }}>{formatDate(date).split(',')[0]}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() => (Platform.OS === 'android' ? openAndroidTime() : setShowTimePicker(true))}
                activeOpacity={0.8}
              >
                <IconSymbol name="clock.fill" size={18} color={iconColor} />
                <ThemedText style={{ marginLeft: 8 }}>{formatDate(date).split(',').slice(1).join(', ').trim()}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Notes</ThemedText>
            <TextInput
              placeholder="Behavior, habitat, field marks..."
              placeholderTextColor={theme === 'light' ? '#8E9BA3' : '#7A7F85'}
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
            <View style={[styles.modalHeader, { borderBottomColor: theme === 'light' ? '#E1E6EA' : '#2A2D31' }]}>
              <ThemedText type="subtitle">Select City</ThemedText>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <ThemedText type="link">Done</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {cities.map((cityName) => (
                <TouchableOpacity
                  key={cityName}
                  style={[
                    styles.locationTypeOption,
                    { borderBottomColor: theme === 'light' ? '#F0F0F0' : '#2A2D31' },
                    city === cityName && styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => {
                    setCity(cityName);
                    setShowCityPicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.locationTypeOptionText,
                      city === cityName && [styles.locationTypeOptionTextSelected, { color: tintColor }],
                    ]}
                  >
                    {cityName}
                  </ThemedText>
                  {city === cityName && (
                    <IconSymbol name="checkmark" size={18} color={tintColor} />
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
            <View style={[styles.modalHeader, { borderBottomColor: theme === 'light' ? '#E1E6EA' : '#2A2D31' }]}>
              <ThemedText type="subtitle">Select State</ThemedText>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <ThemedText type="link">Done</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {states.map((stateName) => (
                <TouchableOpacity
                  key={stateName}
                  style={[
                    styles.locationTypeOption,
                    { borderBottomColor: theme === 'light' ? '#F0F0F0' : '#2A2D31' },
                    state === stateName && styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => {
                    setState(stateName);
                    setShowStatePicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.locationTypeOptionText,
                      state === stateName && [styles.locationTypeOptionTextSelected, { color: tintColor }],
                    ]}
                  >
                    {stateName}
                  </ThemedText>
                  {state === stateName && (
                    <IconSymbol name="checkmark" size={18} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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

function LabeledInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useColorScheme() ?? 'light';
  const borderColor = theme === 'light' ? '#E1E6EA' : '#2A2D31';
  const textColor = theme === 'light' ? '#11181C' : '#ECEDEE';

  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedText style={{ marginBottom: 6 }}>{label}</ThemedText>
      <TextInput
        {...props}
        style={[styles.input, { borderColor, color: textColor }]}
      />
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.qaBtn} activeOpacity={0.8}>
      <IconSymbol name={icon} size={22} color={color} />
      <ThemedText style={{ marginTop: 6 }}>{label}</ThemedText>
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
  enhancedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  enhancedLocationText: {
    fontSize: 12,
    color: '#1976D2',
    flex: 1,
  },
  coordinatesHint: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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


