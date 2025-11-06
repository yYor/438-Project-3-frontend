import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSightingScreen() {
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const [species, setSpecies] = useState('');
  const [count, setCount] = useState<string>('1');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  const tintColor = theme === 'light' ? Colors.light.tint : Colors.dark.tint;

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

function onChangeDate(_event: any, value?: Date) {
    if (Platform.OS === 'ios') setShowDatePicker(false);
    if (!value) return;
    const current = new Date(date);
    current.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
    setDate(current.toISOString());
  }

function onChangeTime(_event: any, value?: Date) {
    if (Platform.OS === 'ios') setShowTimePicker(false);
    if (!value) return;
    const current = new Date(date);
    current.setHours(value.getHours(), value.getMinutes(), 0, 0);
    setDate(current.toISOString());
  }

  function openAndroidDate() {
    DateTimePickerAndroid.open({
      value: new Date(date),
      mode: 'date',
      onChange: (event, value) => {
        if (event?.type !== 'set' || !value) return;
        onChangeDate(event, value);
      },
    });
  }

  function openAndroidTime() {
    DateTimePickerAndroid.open({
      value: new Date(date),
      mode: 'time',
      is24Hour: false,
      onChange: (event, value) => {
        if (event?.type !== 'set' || !value) return;
        onChangeTime(event, value);
      },
    });
  }

  function handleSave() {
    if (!species.trim()) {
      Alert.alert('Missing species', 'Please enter a species name.');
      return;
    }
    const sightingData = {
      species: species.trim(),
      count: Number(count) || 1,
      location: location.trim(),
      notes: notes.trim(),
      dateISO: date,
    };
    // Placeholder: integrate with backend later
    console.log('Saving sighting', sightingData);
    Alert.alert('Sighting saved', 'Your sighting has been saved locally.');
    router.back();
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }] }>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.headerBtn}>
              <ThemedText type="link">Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title">Add Sighting</ThemedText>
            <TouchableOpacity accessibilityRole="button" onPress={handleSave} style={styles.headerBtn}>
              <ThemedText type="link">Save</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Details</ThemedText>
            <LabeledInput label="Species" placeholder="e.g., Northern Cardinal" value={species} onChangeText={setSpecies} autoCapitalize="words" />
            <LabeledInput label="Count" placeholder="1" keyboardType="number-pad" value={count} onChangeText={setCount} />
            <LabeledInput label="Location" placeholder="e.g., Backyard, Point Lobos" value={location} onChangeText={setLocation} />
            <ThemedText style={{ marginBottom: 6 }}>Date/Time</ThemedText>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() => (Platform.OS === 'android' ? openAndroidDate() : setShowDatePicker(true))}
                activeOpacity={0.8}
              >
                <IconSymbol name="calendar" size={18} color={iconColor} />
                <ThemedText style={{ marginLeft: 8 }}>{formatDate(date).split(',')[0]}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.inputButton]}
                onPress={() => (Platform.OS === 'android' ? openAndroidTime() : setShowTimePicker(true))}
                activeOpacity={0.8}
              >
                <IconSymbol name="clock.fill" size={18} color={iconColor} />
                <ThemedText style={{ marginLeft: 8 }}>{formatDate(date).split(',').slice(1).join(', ').trim()}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Notes</ThemedText>
            <TextInput
              placeholder="Behavior, habitat, field marks..."
              placeholderTextColor={theme === 'light' ? '#8E9BA3' : '#7A7F85'}
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
              multiline
              numberOfLines={5}
            />
          </View>

          
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && showDatePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {Platform.OS === 'ios' && showTimePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeTime}
          is24Hour={false}
        />
      )}
    </ThemedView>
  );
}

function LabeledInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useColorScheme() ?? 'light';
  const borderColor = theme === 'light' ? '#E1E6EA' : '#2A2D31';
  const textColor = theme === 'light' ? '#11181C' : '#ECEDEE';

  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedText style={{ marginBottom: 6 }}>{label}</ThemedText>
      <TextInput
        {...props}
        style={[styles.input, { borderColor, color: textColor }]}
      />
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.qaBtn} activeOpacity={0.8}>
      <IconSymbol name={icon} size={22} color={color} />
      <ThemedText style={{ marginTop: 6 }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    padding: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qaBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },
});


