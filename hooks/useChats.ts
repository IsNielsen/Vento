import { useState, useCallback, useEffect } from 'react';
import { createChat, deleteChat, listChats, type Chat } from '@/store/db';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);

  const reload = useCallback(async () => {
    setChats(await listChats());
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

  return { chats, reload, create, remove };
}
