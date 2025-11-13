import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Sighting } from '@/utils/sighting';
import { formatTimeAgo, getMarkerColor } from '@/utils/sighting';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, PanResponder, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Get the screen height to position the bottom sheet correctly
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Bottom sheet shows at 30% of the screen height when a sighting is selected
const BOTTOM_SHEET_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.3;
// Bottom sheet is hidden (height 0) when no sighting is selected 
const BOTTOM_SHEET_HIDDEN = 0; 

// Props that the MapView component accepts (sightings to show, callbacks for when user taps a sighting or the map) 
interface MapViewProps {
  sightings?: Sighting[]; // Array of bird sightings to show on the map
  onSightingPress?: (sighting: Sighting) => void; // Called when user taps a sighting marker
  onViewDetails?: (sighting: Sighting) => void; // Called when user wants to see full details
}

export default function MapView({
  sightings = [],
  onSightingPress,
  onViewDetails,
}: MapViewProps) {
  // Get theme and safe area insets
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  // Reference to the WebView to control it if needed
  const webViewRef = useRef<WebView>(null);

  // The sighting that is currently selected (shows in bottom sheet)
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  // User's current location to center the map
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // Whether the map has finished loading (state variable to show the loading spinner)
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Animation value for the bottom sheet height
  // This controls how tall the bottom sheet is (0 = completely hidden, BOTTOM_SHEET_PREVIEW_HEIGHT = visible at 30% screen height)
  const bottomSheetY = useRef(new Animated.Value(BOTTOM_SHEET_HIDDEN)).current;
  // Keep track of the current height so we can calculate touch positions for dragging
  const [bottomSheetHeight, setBottomSheetHeight] = useState(BOTTOM_SHEET_HIDDEN);
  
  // Pan responder handles touch gestures for dragging the bottom sheet
  // User can swipe down to close the sheet, or swipe up to open it more
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Check if user touched near the top of the bottom sheet where the drag handle is
        const touchY = evt.nativeEvent.pageY;
        const sheetTop = SCREEN_HEIGHT - bottomSheetHeight;
        // Only respond to touches within 20 pixels of the top of the sheet where the drag handle is
        return touchY >= sheetTop - 20;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes 
        // dy = vertical movement, dx = horizontal movement
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // User is dragging - update the height of the sheet in real-time
        if (gestureState.dy > 0) {
          // Dragging down = make sheet smaller
          const newHeight = Math.max(BOTTOM_SHEET_HIDDEN, bottomSheetHeight - gestureState.dy);
          bottomSheetY.setValue(newHeight); // Update animation value directly to the new height 
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If user swiped down more than 50 pixels, close the bottom sheet
        if (gestureState.dy > 50) {
          // Swiped down more than 50 pixels = close the sheet
          setSelectedSighting(null); 
        } else {
          // If user didn't swipe down more than 50 pixels, snap back to preview height
          setBottomSheetHeight(BOTTOM_SHEET_PREVIEW_HEIGHT);
          Animated.spring(bottomSheetY, {
            toValue: BOTTOM_SHEET_PREVIEW_HEIGHT,
            useNativeDriver: false, // Can't use native driver because we're animating 'height'
            // WHY: Native driver only works with 'transform' and 'opacity' properties
            // We're animating 'height' which is a layout property, so it must run on JS thread
            // This is slower but necessary for layout animations
            tension: 50, // How bouncy/springy the animation is (higher = more bounce)
            friction: 8, // How much it slows down (higher = less bounce, more damping)
          }).start();
        }
      },
    })
  ).current;
  
  // Animate the bottom sheet when a sighting is selected or deselected
  useEffect(() => {
    if (selectedSighting) {
      // Show the bottom sheet - animate height from 0 to 30% of screen
      setBottomSheetHeight(BOTTOM_SHEET_PREVIEW_HEIGHT);
      Animated.spring(bottomSheetY, {
        toValue: BOTTOM_SHEET_PREVIEW_HEIGHT,
        useNativeDriver: false, // Can't use native driver for this animation
        tension: 50, // Bounciness of the animation
        friction: 8,
      }).start();
    } else {
      // Hide the bottom sheet - animate height from current to 0
      setBottomSheetHeight(BOTTOM_SHEET_HIDDEN);
      Animated.spring(bottomSheetY, {
        toValue: BOTTOM_SHEET_HIDDEN,
        useNativeDriver: false, // Can't use native driver for this animation
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [selectedSighting, bottomSheetY]);

  // Get user's location when component loads to center the map
  useEffect(() => {
    (async () => {
      try {
        // Check if location services are enabled
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          console.log('Location services are disabled');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          } catch (locationError) {
            // Location unavailable - app will use default center 
            console.log('Could not get current location, using default center');
          }
        } else {
          // User denied permission - app will use default center
          console.log('Location permission denied, using default center');
        }
      } catch (error) {
        // If anything goes wrong, just use the default map center
        // The app will still work without user location
        console.log('Location unavailable, using default map center');
      }
    })();
  }, []);

  // Generate the HTML for the map using Leaflet.js library
  // This HTML is loaded into a WebView component
  const generateMapHTML = () => {
    // Use user's location if available, otherwise use default center (Monterey Bay)
    const centerLat = userLocation?.latitude ?? 36.6034; // Monterey Bay latitude
    const centerLng = userLocation?.longitude ?? -121.8951; // Monterey Bay longitude

    // Calculate how much space to leave at top for zoom controls to avoid the status bar or notch area
    const zoomControlTopMargin = Math.max(insets.top, 40) + 10;
    

    // Helper function to escape special HTML characters
    // This prevents XSS attacks if someone puts malicious code in a sighting
    const escapeHTML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Generate HTML for each sighting marker on the map
    // Each marker is a card-style popup
    const markersHTML = sightings.map((sighting, index) => {
      const color = getMarkerColor(sighting);
      const species = escapeHTML(sighting.species);
      const location = escapeHTML(sighting.location);
      const timeAgo = formatTimeAgo(sighting.date);
      
      return `
        const marker${index} = L.marker([${sighting.latitude}, ${sighting.longitude}], {
          riseOnHover: true,
          zIndexOffset: 1000
        }).addTo(map);
        
        marker${index}.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            sighting: ${JSON.stringify(sighting)}
          }));
        });
        
        // Card-style marker icon with rounded corners and shadow
        const icon${index} = L.divIcon({
          className: 'card-marker',
          html: '<div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px 12px; min-width: 120px; border: 2px solid ${color}; display: flex; flex-direction: column; align-items: center; font-family: -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, sans-serif;">' +
            '<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; font-size: 24px;">🦅</div>' +
            '<div style="font-weight: 600; font-size: 13px; color: #333; text-align: center; margin-bottom: 2px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${species}</div>' +
            '<div style="font-size: 11px; color: #666; text-align: center;">${sighting.count} spotted</div>' +
            '<div style="font-size: 10px; color: ${color}; margin-top: 4px; font-weight: 500;">${timeAgo}</div>' +
            '</div>',
          iconSize: [140, 100],
          iconAnchor: [70, 100],
          popupAnchor: [0, -100],
          className: 'card-marker-container'
        });
        marker${index}.setIcon(icon${index});
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { 
              width: 100%; 
              height: 100%; 
              overflow: hidden; 
              touch-action: pan-x pan-y pinch-zoom;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
            }
            #map { 
              width: 100%; 
              height: 100%; 
              touch-action: pan-x pan-y pinch-zoom;
              cursor: grab;
            }
            #map:active {
              cursor: grabbing;
            }
            .custom-marker { background: transparent; border: none; }
            .leaflet-container {
              touch-action: pan-x pan-y pinch-zoom;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const map = L.map('map', {
              zoomControl: false, // We'll add it manually with proper positioning
              scrollWheelZoom: 'center',
              doubleClickZoom: true,
              boxZoom: true,
              keyboard: true,
              dragging: true,
              touchZoom: true,
              tap: true,
              tapTolerance: 15,
              zoomAnimation: true,
              zoomAnimationThreshold: 4,
              fadeAnimation: true,
              markerZoomAnimation: true,
              maxBounds: null,
              maxBoundsViscosity: 0.0
            }).setView([${centerLat}, ${centerLng}], 11);
            
            // Add zoom in/out buttons to the map
            const zoomControl = L.control.zoom({
              position: 'topright' // top right corner of the map
            });
            zoomControl.addTo(map);
            
            // Move zoom controls down a bit so they don't overlap with status bar
            // Use setTimeout because the controls might not exist immediately
            setTimeout(function() {
              const zoomControlElement = document.querySelector('.leaflet-top.leaflet-right');
              if (zoomControlElement) {
                zoomControlElement.style.marginTop = '${zoomControlTopMargin}px';
                zoomControlElement.style.marginRight = '10px';
              }
            }, 100);
            
            // Enable all map interactions
            map.touchZoom.enable(); // Pinch to zoom
            map.doubleClickZoom.enable(); // Double tap to zoom
            map.scrollWheelZoom.enable(); // Scroll wheel to zoom (on web)

            // CartoDB Positron map tiles for the map background
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              attribution: '© OpenStreetMap contributors © CARTO',
              subdomains: 'abcd',
              maxZoom: 19
            }).addTo(map);

            ${userLocation ? `
              // User location marker
              const userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}])
                .addTo(map)
                .bindPopup('Your Location');
              const userIcon = L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });
              userMarker.setIcon(userIcon);
            ` : ''}

            ${markersHTML}

            // Notify React Native that the map finished loading
            map.whenReady(function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
              }));
            });

            // When user clicks on the map (not a marker), close the bottom sheet
            map.on('click', function(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: e.latlng.lat, // Latitude of the click location
                lng: e.latlng.lng // Longitude of where they clicked
              }));
            });
          </script>
        </body>
      </html>
    `;
  };

  // Handle messages from the WebView (the map HTML) (when markers are clicked, map is clicked)
  const handleWebViewMessage = (event: any) => {
    try {
      // Parse the JSON message from the WebView
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'markerClick' && data.sighting) {
        // User clicked a sighting marker
        const sighting = data.sighting as Sighting;
        setSelectedSighting(sighting); // Show it in the bottom sheet
        if (onSightingPress) {
          onSightingPress(sighting); // Call the callback to show the sighting details
        }
      } else if (data.type === 'mapClick') {
        // User clicked on the map (not on a marker)
        setSelectedSighting(null); // Close the bottom sheet
      } else if (data.type === 'mapReady') {
        // Map finished loading
        setMapLoaded(true); // Hide the loading spinner
      }
    } catch (error) {
      // If message parsing fails, just log it
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {!mapLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[theme].tint} />
          <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={Platform.OS === 'android'}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onLoadEnd={() => setMapLoaded(true)}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />

      {/* Bottom Sheet - shows preview at 30% height when sighting is selected */}
      {selectedSighting && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              // Animate the height property 
              // Native driver only works with 'transform' and 'opacity', not layout properties
              height: bottomSheetY,
              maxHeight: BOTTOM_SHEET_PREVIEW_HEIGHT,
            },
          ]}
          pointerEvents="box-none"
        >
        <ThemedView 
          style={styles.bottomSheetContent}
          {...panResponder.panHandlers}
          pointerEvents="box-none"
        >
          {/* Drag Handle */}
          <View 
            style={styles.dragHandleContainer}
            pointerEvents="auto"
          >
            <View style={styles.dragHandle} />
          </View>

          {selectedSighting ? (
            <View style={styles.previewContent} pointerEvents="auto">
              {/* Header Card */}
              <View style={[
                styles.headerCard,
                { borderLeftColor: getMarkerColor(selectedSighting) }
              ]}>
                <View style={styles.headerCardContent}>
                  <View style={[
                    styles.iconCircle,
                    { backgroundColor: getMarkerColor(selectedSighting) }
                  ]}>
                    <ThemedText style={styles.iconEmoji}>🦅</ThemedText>
                  </View>
                  <View style={styles.headerCardText}>
                    <ThemedText type="title" style={styles.speciesTitle}>
                      {selectedSighting.species}
                    </ThemedText>
                    <ThemedText style={styles.timeAgo}>
                      {formatTimeAgo(selectedSighting.date)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Preview Details */}
              <View style={styles.previewDetails}>
                <View style={styles.previewRow}>
                  <IconSymbol name="eye.fill" size={18} color={Colors[theme].icon} />
                  <ThemedText style={styles.previewText}>
                    {selectedSighting.count} {selectedSighting.count === 1 ? 'bird' : 'birds'}
                  </ThemedText>
                </View>
                <View style={styles.previewRow}>
                  <IconSymbol name="mappin.and.ellipse" size={18} color={Colors[theme].icon} />
                  <ThemedText style={styles.previewText} numberOfLines={1}>
                    {selectedSighting.location}
                  </ThemedText>
                </View>
              </View>

              {/* View Details Button - Bottom Right */}
              <View style={styles.viewDetailsButtonContainer}>
                <TouchableOpacity
                  style={[styles.viewDetailsButton, { backgroundColor: Colors[theme].tint }]}
                  onPress={() => {
                    if (onViewDetails && selectedSighting) {
                      onViewDetails(selectedSighting);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.viewDetailsButtonText}>View Details</ThemedText>
                  <IconSymbol name="chevron.right" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ThemedView>
      </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
    // Don't block touches on the map when collapsed
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  previewContent: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  headerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  headerCardText: {
    flex: 1,
  },
  speciesTitle: {
    fontSize: 18,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
  },
  previewDetails: {
    gap: 8,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  viewDetailsButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  viewDetailsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


