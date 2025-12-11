import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

global.fetch = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => {
    const React = require('react');
    React.useEffect(() => {
      const unsubscribe = callback();
      return unsubscribe || undefined;
    }, []);
  },
}));

const { router } = require('expo-router');

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render home screen with title', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('BirdWatcher')).toBeTruthy();
  });

  it('should render subtitle', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('Track your favorite birds')).toBeTruthy();
  });

  it('should render quick actions section', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('Quick Actions')).toBeTruthy();
  });

  it('should render Add Sighting action button', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('Add Sighting')).toBeTruthy();
  });

  it('should render My List action button', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('My List')).toBeTruthy();
  });

  it('should render Species action button', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    const speciesButtons = screen.getAllByText('Species');
    expect(speciesButtons.length).toBeGreaterThan(0);
  });

  it('should render Stats action button', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('Stats')).toBeTruthy();
  });

  it('should render Recent Sightings section', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    expect(screen.getByText('Recent Sightings')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<HomeScreen />);
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('should have navigation buttons that can be pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: [], recentSightings: [] }),
    });

    render(<HomeScreen />);
    await waitFor(() => {
      const addButton = screen.getByText('Add Sighting');
      expect(addButton).toBeTruthy();
      fireEvent.press(addButton);
    });
  });

  it('should display error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<HomeScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load sightings/i)).toBeTruthy();
    }, { timeout: 3000 });
  });
});

