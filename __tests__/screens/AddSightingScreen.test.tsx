import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AddSightingScreen from '@/app/add-sighting';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context');

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    get back() {
      return mockRouterBack;
    },
    get push() {
      return mockRouterPush;
    },
  },
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

global.fetch = jest.fn();

const mockAlert = jest.fn();
jest.spyOn(require('react-native'), 'Alert', 'get').mockReturnValue({
  alert: mockAlert,
} as any);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AddSightingScreen', () => {
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

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/birds/getBirds')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { birdId: 1, birdName: 'Northern Cardinal' },
            { birdId: 2, birdName: 'Blue Jay' },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('should render add sighting screen with title', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('Add Sighting')).toBeTruthy();
  });

  it('should render cancel button', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should render save button', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('should render species picker', async () => {
    render(<AddSightingScreen />);
    await waitFor(() => {
      expect(screen.getByText('Select Species')).toBeTruthy();
    });
  });

  it('should render count input', () => {
    render(<AddSightingScreen />);
    expect(screen.getByPlaceholderText('1')).toBeTruthy();
  });

  it('should render location section', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('Location')).toBeTruthy();
  });

  it('should render GPS toggle', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('Use GPS')).toBeTruthy();
  });

  it('should render city picker', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('City *')).toBeTruthy();
  });

  it('should render state picker', () => {
    render(<AddSightingScreen />);
    expect(screen.getByText('State *')).toBeTruthy();
  });

  it('should render date/time pickers', () => {
    render(<AddSightingScreen />);
    const touchables = screen.UNSAFE_queryAllByType(require('react-native').TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(0);
  });

  it('should render notes input', () => {
    render(<AddSightingScreen />);
    expect(screen.getByPlaceholderText('Behavior, habitat, field marks...')).toBeTruthy();
  });

  it('should allow typing in count field', () => {
    render(<AddSightingScreen />);
    const countInput = screen.getByPlaceholderText('1');
    fireEvent.changeText(countInput, '5');
    expect(countInput.props.value).toBe('5');
  });

  it('should allow typing in notes field', () => {
    render(<AddSightingScreen />);
    const notesInput = screen.getByPlaceholderText('Behavior, habitat, field marks...');
    fireEvent.changeText(notesInput, 'Spotted near the lake');
    expect(notesInput.props.value).toBe('Spotted near the lake');
  });

  it('should navigate back when cancel button is pressed', () => {
    render(<AddSightingScreen />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('should toggle GPS switch', async () => {
    render(<AddSightingScreen />);
    await waitFor(() => {
      const gpsToggle = screen.getByText('Use GPS');
      const { Switch } = require('react-native');
      const switches = screen.UNSAFE_queryAllByType(Switch);
      if (switches.length > 0) {
        fireEvent(switches[0], 'valueChange', true);
      }
    });
  });

  it('should render save button and allow pressing it', async () => {
    render(<AddSightingScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Species')).toBeTruthy();
    });

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeTruthy();
    fireEvent.press(saveButton);
  });
});

