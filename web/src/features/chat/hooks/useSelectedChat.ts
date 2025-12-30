import { useState } from 'react';

/**
 * Selected Chat Hook
 *
 * Manages selected chat ID in memory only.
 */
export function useSelectedChat() {
  const [selectedChatId, setSelectedChatIdState] = useState<string | null>(null);

  const setSelectedChatId = (chatId: string | null) => {
    setSelectedChatIdState(chatId);
  };

  return [selectedChatId, setSelectedChatId] as const;
}
