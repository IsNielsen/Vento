import { View, FlatList, StyleSheet, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatInput } from '@/components/ChatInput';
import { useLLM } from '@/hooks/useLLM';
import {
  listMessages,
  addMessage,
  updateChatTitle,
  updateChatTimestamp,
  type Message,
} from '@/store/db';

const STREAMING_ID = '__streaming__';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { status, generate, stop, resetForChat } = useLLM();

  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('New chat');
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const isFirstRef = useRef(true);
  const isGenerating = status === 'generating';

  useEffect(() => {
    if (!id) return;
    listMessages(id).then(msgs => {
      setMessages(msgs);
      isFirstRef.current = msgs.length === 0;
      if (msgs.length > 0) setTitle(msgs[0].content.slice(0, 40));
    });
    resetForChat();
  }, [id, resetForChat]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isGenerating || !id) return;
    setInput('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      chat_id: id,
      role: 'user',
      content: text,
      created_at: Date.now(),
    };

    await addMessage(userMsg);

    if (isFirstRef.current) {
      const newTitle = text.slice(0, 40);
      await updateChatTitle(id, newTitle);
      setTitle(newTitle);
      isFirstRef.current = false;
    }
    await updateChatTimestamp(id);

    setMessages(prev => [...prev, userMsg]);
    setStreamingContent('');

    let accumulated = '';
    generate(text, async (token, done) => {
      accumulated += token;
      setStreamingContent(accumulated);

      if (done) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          chat_id: id,
          role: 'model',
          content: accumulated,
          created_at: Date.now(),
        };
        await addMessage(assistantMsg);
        await updateChatTimestamp(id);
        setMessages(prev => [...prev, assistantMsg]);
        setStreamingContent('');
      }
    });
  }, [input, isGenerating, id, generate]);

  // Build the list in reverse for the inverted FlatList
  const reversed = [...messages].reverse();
  const listData: Message[] =
    isGenerating || streamingContent
      ? [
          { id: STREAMING_ID, chat_id: id ?? '', role: 'model', content: streamingContent, created_at: 0 },
          ...reversed,
        ]
      : reversed;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { borderBottomColor: colors.inputBorder }]}>
        <Pressable hitSlop={16} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={colors.tint} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 18 }} />
      </View>

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChatBubble
            role={item.role}
            content={item.content}
            isStreaming={item.id === STREAMING_ID}
          />
        )}
      />

      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        onStop={stop}
        isGenerating={isGenerating}
      />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    paddingVertical: 12,
  },
});
