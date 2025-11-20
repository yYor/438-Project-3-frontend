import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !hasRedirected.current) {
      hasRedirected.current = true;
      if (user) {
        // if user is authenticated, redirect to tabs
        router.replace('/(tabs)');
      } else {
        // if user is not authenticated, redirect to login 
        router.replace('/login');
      }
    }
  }, [user, loading]);

  // show loading spinner while checking auth state
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
