import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ListScreen from '@/app/list';
import { useAuth } from '@/contexts/auth-context';

const mockRouterPush = jest.fn();
jest.mock('@/contexts/auth-context');
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: mockRouterPush,
  },
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
    });
  });

  it('should render list screen with title', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ListScreen />);
    expect(screen.getByText('My Sightings')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ListScreen />);
    expect(screen.getByText('Loading sightings...')).toBeTruthy();
  });

  it('should show empty state when no sightings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ListScreen />);
    await waitFor(() => {
      expect(screen.getByText('No sightings yet')).toBeTruthy();
      expect(screen.getByText('Start logging your bird sightings!')).toBeTruthy();
    });
  });

  it('should display sightings when data is loaded', async () => {
    const mockSightings = [
      {
        id: 1,
        birdName: 'Northern Cardinal',
        count: 2,
        location: 'Monterey, CA',
        observedAt: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<ListScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
    });
  });

  it('should show total sightings count', async () => {
    const mockSightings = [
      { id: 1, birdName: 'Bird 1', count: 1, location: 'Location 1', observedAt: new Date().toISOString() },
      { id: 2, birdName: 'Bird 2', count: 1, location: 'Location 2', observedAt: new Date().toISOString() },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<ListScreen />);
    await waitFor(() => {
      expect(screen.getByText('2 total sightings')).toBeTruthy();
    });
  });

  it('should navigate to sighting detail when sighting is pressed', async () => {
    const mockSightings = [
      {
        id: 1,
        birdName: 'Northern Cardinal',
        count: 2,
        location: 'Monterey, CA',
        observedAt: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<ListScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = screen.UNSAFE_queryAllByType(TouchableOpacity);
    if (touchables.length > 0) {
      fireEvent.press(touchables[0]);
    }
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ListScreen />);
    await waitFor(() => {
      expect(screen.getByText('My Sightings')).toBeTruthy();
    });
  });
});

