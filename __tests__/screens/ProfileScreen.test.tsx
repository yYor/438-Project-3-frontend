import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

global.fetch = jest.fn();

const mockAlert = jest.fn((title: string, message?: string, buttons?: any[]) => {
  if (buttons && Array.isArray(buttons) && buttons[1] && buttons[1].onPress) {
    buttons[1].onPress();
  }
});
jest.spyOn(require('react-native'), 'Alert', 'get').mockReturnValue({
  alert: mockAlert,
} as any);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSignOut = jest.fn();

describe('ProfileScreen', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: mockSignOut,
      signInWithOAuth: jest.fn(),
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it('should render profile screen with title', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('should display user email', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('should display user name', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('should render edit name button', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Edit Name')).toBeTruthy();
  });

  it('should render sign out button', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('should open edit name modal when edit button is pressed', () => {
    render(<ProfileScreen />);
    const editButtons = screen.getAllByText('Edit Name');
    fireEvent.press(editButtons[0]);
    expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('should display sightings count', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, birdId: 1, birdName: 'Bird 1' },
        { id: 2, birdId: 2, birdName: 'Bird 2' },
      ],
    });

    render(<ProfileScreen />);
    await waitFor(() => {
      expect(screen.getByText('Sightings')).toBeTruthy();
    });
  });

  it('should allow editing name in modal', () => {
    render(<ProfileScreen />);
    const editButtons = screen.getAllByText('Edit Name');
    fireEvent.press(editButtons[0]);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.changeText(nameInput, 'New Name');
    expect(nameInput.props.value).toBe('New Name');
  });

  it('should call fetch when saving name', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    mockAlert.mockImplementation((title: string, message?: string, buttons?: any[]) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    render(<ProfileScreen />);
    const editButtons = screen.getAllByText('Edit Name');
    fireEvent.press(editButtons[0]);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.changeText(nameInput, 'New Name');
    
    const saveButton = screen.getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should close modal when cancel is pressed', () => {
    render(<ProfileScreen />);
    const editButtons = screen.getAllByText('Edit Name');
    fireEvent.press(editButtons[0]);
    
    expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);
    
    expect(screen.queryByPlaceholderText('Enter your name')).toBeNull();
  });

  it('should call signOut when sign out button is pressed', () => {
    render(<ProfileScreen />);
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.press(signOutButton);
    expect(mockSignOut).toHaveBeenCalled();
  });
});

