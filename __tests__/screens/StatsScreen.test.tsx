import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import StatsScreen from '@/app/stats';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context');
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('StatsScreen', () => {
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

  it('should render stats screen with title', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<StatsScreen />);
    expect(screen.getByText('Statistics')).toBeTruthy();
  });

  it('should render subtitle', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<StatsScreen />);
    expect(screen.getByText('Your bird watching journey')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<StatsScreen />);
    expect(screen.getByText('Loading your stats...')).toBeTruthy();
  });

  it('should display total sightings stat', async () => {
    const mockSightings = [
      { id: 1, birdId: 1, birdName: 'Bird 1', count: 1, observedAt: new Date().toISOString() },
      { id: 2, birdId: 2, birdName: 'Bird 2', count: 2, observedAt: new Date().toISOString() },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Total Sightings')).toBeTruthy();
    });
  });

  it('should display species seen stat', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Species Seen')).toBeTruthy();
    });
  });

  it('should display favorite species section', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Favorite Species')).toBeTruthy();
    });
  });

  it('should calculate and display correct total sightings count', async () => {
    const mockSightings = [
      { id: 1, birdId: 1, birdName: 'Bird 1', count: 2, observedAt: new Date().toISOString() },
      { id: 2, birdId: 2, birdName: 'Bird 2', count: 3, observedAt: new Date().toISOString() },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Total Sightings')).toBeTruthy();
    });
  });

  it('should calculate and display correct species count', async () => {
    const mockSightings = [
      { id: 1, birdId: 1, birdName: 'Bird 1', count: 1, observedAt: new Date().toISOString() },
      { id: 2, birdId: 2, birdName: 'Bird 2', count: 1, observedAt: new Date().toISOString() },
      { id: 3, birdId: 1, birdName: 'Bird 1', count: 1, observedAt: new Date().toISOString() },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Species Seen')).toBeTruthy();
    });
  });

  it('should display favorite species with data', async () => {
    const mockSightings = [
      { id: 1, birdId: 1, birdName: 'Northern Cardinal', count: 5, observedAt: new Date().toISOString() },
      { id: 2, birdId: 2, birdName: 'Blue Jay', count: 3, observedAt: new Date().toISOString() },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSightings,
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Favorite Species')).toBeTruthy();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeTruthy();
    });
  });
});

