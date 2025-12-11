import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/login';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockOpenURL = jest.fn(() => Promise.resolve());
const Linking = require('expo-linking');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();
  const mockSignInWithOAuth = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: jest.fn(),
      signInWithOAuth: mockSignInWithOAuth,
    });
    jest.clearAllMocks();
  });

  it('should render login screen with email and password inputs', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('should render sign in button', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('should render Google sign in button', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('should render GitHub sign in button', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Sign in with GitHub')).toBeTruthy();
  });

  it('should toggle to sign up mode', () => {
    render(<LoginScreen />);
    const toggleLink = screen.getByText('Sign Up');
    fireEvent.press(toggleLink);
    expect(screen.getByText('Sign Up')).toBeTruthy();
    expect(screen.getByText('Already have an account?')).toBeTruthy();
  });

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: jest.fn(),
      signInWithOAuth: mockSignInWithOAuth,
    });
    render(<LoginScreen />);
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('should allow typing in email field', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should allow typing in password field', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should call signIn when sign in button is pressed', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<LoginScreen />);
    
    fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
    
    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should call signUp when in sign up mode and button is pressed', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    render(<LoginScreen />);
    
    const toggleLink = screen.getByText('Sign Up');
    fireEvent.press(toggleLink);
    
    fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
    
    const signUpButton = screen.getByText('Sign Up');
    fireEvent.press(signUpButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'password123');
    });
  });

  it('should open OAuth URL when Google button is pressed', () => {
    jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);
    render(<LoginScreen />);
    const googleButton = screen.getByText('Sign in with Google');
    fireEvent.press(googleButton);
    expect(Linking.openURL).toHaveBeenCalled();
  });

  it('should open OAuth URL when GitHub button is pressed', () => {
    jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);
    render(<LoginScreen />);
    const githubButton = screen.getByText('Sign in with GitHub');
    fireEvent.press(githubButton);
    expect(Linking.openURL).toHaveBeenCalled();
  });

  it('should show error message when sign in fails', async () => {
    const mockAlert = jest.fn();
    jest.spyOn(require('react-native'), 'Alert', 'get').mockReturnValue({
      alert: mockAlert,
    } as any);

    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    render(<LoginScreen />);
    
    fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'wrong');
    
    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    });
  });
});

