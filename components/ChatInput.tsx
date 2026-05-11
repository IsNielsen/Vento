import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
}

export function ChatInput({ value, onChangeText, onSend, onStop, isGenerating }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const canSend = value.trim().length > 0 && !isGenerating;

  return (
    <View style={[styles.container, { borderTopColor: colors.inputBorder, backgroundColor: colors.surface }]}>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Message"
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={4000}
        editable={!isGenerating}
      />
      {isGenerating ? (
        <Pressable style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={onStop}>
          <FontAwesome name="square" size={16} color="#fff" />
        </Pressable>
      ) : (
        <Pressable
          style={[styles.button, { backgroundColor: colors.tint, opacity: canSend ? 1 : 0.35 }]}
          onPress={onSend}
          disabled={!canSend}
        >
          <FontAwesome name="arrow-up" size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
});
