jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  usePathname: () => '/',
}));

const mockLinkingListeners = [];
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost/${path}`),
  parse: jest.fn((url) => {
    try {
      const parsed = new URL(url);
      return {
        scheme: parsed.protocol.slice(0, -1),
        hostname: parsed.hostname,
        path: parsed.pathname,
        queryParams: Object.fromEntries(parsed.searchParams),
      };
    } catch {
      return { queryParams: {} };
    }
  }),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn((event, callback) => {
    const listener = { remove: jest.fn() };
    mockLinkingListeners.push(listener);
    return listener;
  }),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 36.6177,
        longitude: -121.9017,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    })
  ),
  geocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        latitude: 36.6177,
        longitude: -121.9017,
        altitude: null,
        accuracy: null,
      },
    ])
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        city: 'Monterey',
        region: 'California',
        country: 'United States',
      },
    ])
  ),
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
    }),
    useFocusEffect: (callback) => {
      React.useEffect(() => {
        const unsubscribe = callback();
        return unsubscribe || undefined;
      }, []);
    },
    NavigationContainer: ({ children }) => children,
  };
});

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

afterEach(async () => {
  mockLinkingListeners.forEach(listener => listener.remove());
  mockLinkingListeners.length = 0;
  
  jest.clearAllMocks();
  
  await new Promise((resolve) => {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
});

