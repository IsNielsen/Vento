import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export function ChatBubble({ role, content, isStreaming }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.userBubble }]
            : [styles.assistantBubble, { backgroundColor: colors.assistantBubble }],
        ]}
      >
        <Text style={[styles.text, { color: isUser ? colors.userBubbleText : colors.text }]}>
          {content || (isStreaming ? '' : '…')}
          {isStreaming && <Text style={{ color: colors.tint }}>▋</Text>}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
