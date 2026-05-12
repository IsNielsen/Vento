import { useState, useCallback, useEffect } from 'react';
import { createChat, deleteChat, listChats, type Chat } from '@/store/db';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      setChats(await listChats());
    } catch (err) {
      console.error('Failed to load chats:', err);
      setChats([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (id: string, title: string) => {
      await createChat(id, title);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteChat(id);
      await reload();
    },
    [reload]
  );

  return { chats, loaded, reload, create, remove };
}
