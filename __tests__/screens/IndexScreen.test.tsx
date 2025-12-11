import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import IndexScreen from '@/app/index';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const { router } = require('expo-router');

describe('IndexScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading indicator', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
    });

    render(<IndexScreen />);
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('should redirect to tabs when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
    });

    render(<IndexScreen />);
    
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
    });

    render(<IndexScreen />);
    
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('should not redirect while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
    });

    render(<IndexScreen />);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

