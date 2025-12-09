import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// import your AuthContext if you have one

export default function OAuth2RedirectScreen() {
  const { userId, name, email, picture } = useLocalSearchParams<{
    userId?: string;
    name?: string;
    email?: string;
    picture?: string;
  }>();

  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // TODO: save to your auth context / AsyncStorage
    // e.g. auth.signInWithOAuth({ userId, name, email, picture });

    // After saving, go to your main screen
    router.replace('/(tabs)/index'); // or '/map', '/home', etc.
  }, [userId]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Text>Signing you in…</Text>
    </View>
  );
}