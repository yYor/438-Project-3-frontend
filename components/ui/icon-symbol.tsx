// This component makes icons work on all platforms
// in iOS it uses SF Symbols, in Android/web it uses Material Icons
// Maps SF Symbol names to Material Icon names for iOS and Android/web

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Type definition for the mapping object
// Maps SF Symbol names to Material Icon names
type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Mapping from SF Symbol names (iOS) to Material Icon names (Android/web)
 * When you want to add a new icon:
 * 1. Go to https://developer.apple.com/sf-symbols/ and find the matching SF Symbol name 
 * 2. Find the matching Material Icon name at https://icons.expo.fyi
 * 3. Add to MAPPING object 
 */
const MAPPING = {
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  // app specific actions and stats
  'plus.circle.fill': 'add-circle',
  'map.fill': 'map',
  'list.bullet': 'list',
  'magnifyingglass.circle.fill': 'search',
  'eye.fill': 'visibility',
  'leaf.fill': 'park',
  'calendar': 'event',
  'clock.fill': 'schedule',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'mappin.and.ellipse': 'my-location',
  'mappin.circle': 'place',
  'magnifyingglass': 'search',
  'slider.horizontal.3': 'tune',
  'xmark.circle.fill': 'cancel',
  'checkmark': 'check',
} as IconMapping;

// Some icons are only available in MaterialCommunityIcons (not regular MaterialIcons)
// separate mapping for those icons
const COMMUNITY_ICON_MAPPING: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    'bird.fill': 'bird', // Bird icon is in MaterialCommunityIcons
    'flame.fill': 'fire', // Fire icon is in MaterialCommunityIcons
};

// The icon name can be from either mapping
type IconSymbolName = keyof typeof MAPPING | keyof typeof COMMUNITY_ICON_MAPPING;

/**
 * Icon component that works on all platforms
 * On iOS: Uses native SF Symbols (looks better)
 * On Android/Web: Uses Material Icons (fallback if SF Symbols are not available)
 * 
 * Usage: <IconSymbol name="house.fill" size={24} color="#000" />
 * 
 * Note: Icon names are based on SF Symbols, so you need to add them to MAPPING above
 */
export function IconSymbol({
  name,
  size = 24, // Default size is 24
  color,
  style,
}: {
  name: IconSymbolName; // Which icon to show
  size?: number; // How big the icon should be
  color: string | OpaqueColorValue; // What color the icon should be
  style?: StyleProp<TextStyle>; // Optional extra styles
  weight?: SymbolWeight; // Not used on Android/web, but kept for type compatibility
}) {
  // Check if this icon is in the MaterialCommunityIcons mapping
  if (name in COMMUNITY_ICON_MAPPING) {
    return <MaterialCommunityIcons color={color} size={size} name={COMMUNITY_ICON_MAPPING[name]} style={style} />;
  }
  // Otherwise use regular MaterialIcons
  return <MaterialIcons color={color} size={size} name={MAPPING[name as keyof typeof MAPPING]} style={style} />;
}
