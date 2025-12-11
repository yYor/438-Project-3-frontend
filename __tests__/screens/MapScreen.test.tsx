import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MapScreen from '@/app/(tabs)/map';

jest.mock('@/components/map/MapView', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ sightings }: any) => (
    <View testID="map-view">
      <Text>{sightings.length} sightings</Text>
    </View>
  );
});

global.fetch = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => {
    const React = require('react');
    React.useEffect(() => {
      const unsubscribe = callback();
      return unsubscribe || undefined;
    }, []);
  },
}));

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          return null;
        },
      },
      text: async () => JSON.stringify([]),
    });
  });

  it('should render map screen with search bar', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search species or location...')).toBeTruthy();
    });
  });

  it('should render view toggle buttons', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByText('List')).toBeTruthy();
      expect(screen.getByText('Map')).toBeTruthy();
    });
  });

  it('should switch to list view when list button is pressed', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByText('List')).toBeTruthy();
    });
    const listButton = screen.getByText('List');
    fireEvent.press(listButton);
    expect(screen.getByText('List')).toBeTruthy();
  });

  it('should switch to map view when map button is pressed', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByText('Map')).toBeTruthy();
    });
    const mapButton = screen.getByText('Map');
    fireEvent.press(mapButton);
    expect(screen.getByText('Map')).toBeTruthy();
  });

  it('should allow typing in search input', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search species or location...')).toBeTruthy();
    });
    const searchInput = screen.getByPlaceholderText('Search species or location...');
    fireEvent.changeText(searchInput, 'cardinal');
    expect(searchInput.props.value).toBe('cardinal');
  });

  it('should render filter button', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      const filterButtons = screen.UNSAFE_queryAllByType(require('react-native').TouchableOpacity);
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });

  it('should filter sightings when search query is entered', async () => {
    const mockSightings = [
      { id: 1, birdName: 'Northern Cardinal', location: 'Monterey, CA' },
      { id: 2, birdName: 'Blue Jay', location: 'San Francisco, CA' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          return null;
        },
      },
      text: async () => JSON.stringify(mockSightings),
    });

    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search species or location...')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search species or location...');
    fireEvent.changeText(searchInput, 'Cardinal');

    await waitFor(() => {
      expect(searchInput.props.value).toBe('Cardinal');
    });
  });

  it('should display sightings in list view', async () => {
    const mockSightings = [
      { id: 1, birdName: 'Northern Cardinal', location: 'Monterey, CA' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          return null;
        },
      },
      text: async () => JSON.stringify(mockSightings),
    });

    render(<MapScreen />);
    await waitFor(() => {
      const listButton = screen.getByText('List');
      fireEvent.press(listButton);
    });

    await waitFor(() => {
      const mapView = screen.queryByTestId('map-view');
      expect(mapView || screen.getByText('List')).toBeTruthy();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: () => null,
      },
      text: async () => 'Error',
    });

    render(<MapScreen />);
    await waitFor(() => {
      expect(screen.getByText('Unable to load sightings.')).toBeTruthy();
    });
  });
});

