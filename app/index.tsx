import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useChats } from '@/hooks/useChats';
import { type Chat } from '@/store/db';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { chats, loaded, create, remove } = useChats();
  const hasAutoOpened = useRef(false);

  const handleNewChat = useCallback(async () => {
    const id = Crypto.randomUUID();
    await create(id, 'New chat');
    router.push(`/chat/${id}` as never);
  }, [create, router]);

  useEffect(() => {
    if (!hasAutoOpened.current && loaded && chats.length === 0) {
      hasAutoOpened.current = true;
      const id = Crypto.randomUUID();
      create(id, 'New chat').then(() => {
        router.replace(`/chat/${id}` as never);
      });
    }
  }, [loaded, chats.length, create, router]);

  const renderItem = useCallback(
    ({ item }: { item: Chat }) => (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: colors.inputBorder, backgroundColor: pressed ? colors.surface : 'transparent' },
        ]}
        onPress={() => router.push(`/chat/${item.id}` as never)}
        onLongPress={() => remove(item.id)}
      >
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.rowTime, { color: colors.textSecondary }]}>
            {formatRelative(item.updated_at)}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
      </Pressable>
    ),
    [colors, router, remove]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.inputBorder }]}>
        <Text style={[styles.logo, { color: colors.tint }]}>Vento</Text>
        <Pressable hitSlop={16} onPress={handleNewChat}>
          <FontAwesome name="pencil" size={20} color={colors.tint} />
        </Pressable>
      </View>

      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Tap the pencil icon to start
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      )}
    </View>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  rowTime: { fontSize: 12 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyHint: { fontSize: 14 },
});
