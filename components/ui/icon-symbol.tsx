// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
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
  'chart.bar.fill': 'bar-chart',
  'bell.fill': 'notifications',
  'gear': 'settings',
} as IconMapping;

// Special mapping for icons that use MaterialCommunityIcons
const COMMUNITY_ICON_MAPPING: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  'bird.fill': 'bird',
  'flame.fill': 'fire',
};

type IconSymbolName = keyof typeof MAPPING | keyof typeof COMMUNITY_ICON_MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Use MaterialCommunityIcons for specific icons
  if (name in COMMUNITY_ICON_MAPPING) {
    return <MaterialCommunityIcons color={color} size={size} name={COMMUNITY_ICON_MAPPING[name]} style={style} />;
  }
  // Use MaterialIcons for all other icons
  return <MaterialIcons color={color} size={size} name={MAPPING[name as keyof typeof MAPPING]} style={style} />;
}
