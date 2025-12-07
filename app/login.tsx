import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading, signInWithOAuth } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top;

  // redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading]);

  useEffect(() => {
  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    const parsed = Linking.parse(url);
    const params = parsed?.queryParams ?? {};

    const userId  = params.userId as string | undefined;
    const email   = params.email as string | undefined;
    const name    = params.name as string | undefined;
    const picture = params.picture as string | undefined;
    const token   = params.token as string | undefined; // optional: if you add it later

    // We only proceed if we at least have an id + email
    if (userId && email) {
      // Optional: store token if you decide to use a real JWT later
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }

      const oauthUser = {
        id: String(userId),
        email,
        created_at: new Date().toISOString(),
        name,
        profilePicture: picture,
        oauthProvider: 'google',
      };

      await signInWithOAuth(oauthUser as any);

      // Go to tabs – also your other effect (if !authLoading && user) will kick in
      router.replace('/(tabs)');
    }
  };

  // 1) App opened from a deep link (cold start)
  (async () => {
    const initialUrl = await Linking.getInitialURL();
    await handleDeepLink(initialUrl);
  })();

  // 2) Deep link received while app is already running
  const subscription = Linking.addEventListener('url', async (event) => {
    await handleDeepLink(event.url);
  });

  return () => {
    subscription.remove();
  };
}, [signInWithOAuth]);

  const BACKEND = "https://birdwatchers-c872a1ce9f02.herokuapp.com";

  const loginWithGoogle = () => {
    Linking.openURL(`${BACKEND}/oauth2/authorization/google?mobile=true`);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // basic password validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        Alert.alert('Error', error.message || 'An error occurred');
      } else {
        if (isSignUp) {
          Alert.alert(
            'Success',
            'Account created! You can now sign in.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                },
              },
            ]
          );
        } else {
          // redirect to tabs automatically when signing in
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = theme === 'light' ? '#F8F9FA' : '#1E1E1E';
  const inputBg = theme === 'light' ? '#FFFFFF' : '#2A2A2A';
  const borderColor = theme === 'light' ? '#E0E0E0' : '#404040';

  // show loading while checking auth state
  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Icon Section */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
              <IconSymbol name="bird.fill" size={48} color={tintColor} />
            </View>
            <ThemedText type="title" style={styles.title}>
              BirdWatcher
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </ThemedText>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { backgroundColor: cardBg }]}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
                <IconSymbol
                  name="envelope.fill"
                  size={20}
                  color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme === 'light' ? Colors.light.text : Colors.dark.text },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme === 'light' ? '#999' : '#666'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
                <IconSymbol
                  name="lock.fill"
                  size={20}
                  color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme === 'light' ? Colors.light.text : Colors.dark.text },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme === 'light' ? '#999' : '#666'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

          <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: "#DB4437", marginTop: 12 }]}
              onPress={loginWithGoogle}
              disabled={loading}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.submitButtonText}>
                Sign in with Google
              </ThemedText>
            </TouchableOpacity> 
            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: tintColor }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
            
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Toggle Sign Up/Sign In */}
            <View style={styles.toggleContainer}>
              <ThemedText style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={loading}>
                <ThemedText type="link" style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});


