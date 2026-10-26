import { useState, useRef, useCallback } from 'react';

import type { MentionUser } from '@/components/ui/MentionSuggestions';
import { usersService } from '@/services/users.service';

export function useMentionLookup() {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMentionQuery, setActiveMentionQuery] = useState<{
    query: string;
    startIndex: number;
  } | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = useCallback((text: string) => {
    // Detect if the trailing word is an @mention
    const match = /(?:^|\s)@([a-zA-Z0-9_.-]*)$/.exec(text);

    if (match) {
      const fullMatch = match[0];
      const query = match[1] ?? '';
      const atSymbolOffset = fullMatch.indexOf('@');
      const startIndex = match.index + atSymbolOffset;

      setActiveMentionQuery({ query, startIndex });

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setIsLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await usersService.searchUsers(query, 6);
          setSuggestions(results);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 200);
    } else {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      setActiveMentionQuery(null);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  const selectUser = useCallback(
    (user: MentionUser, currentText: string, onUpdateText: (newText: string) => void) => {
      if (!activeMentionQuery) return;
      const { startIndex, query } = activeMentionQuery;
      // Replace @query with @username + space
      const before = currentText.slice(0, startIndex);
      const after = currentText.slice(startIndex + 1 + query.length);
      const newText = `${before}@${user.username} ${after}`;
      onUpdateText(newText);
      setActiveMentionQuery(null);
      setSuggestions([]);
    },
    [activeMentionQuery],
  );

  const resetMentions = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setActiveMentionQuery(null);
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    activeMentionQuery,
    handleTextChange,
    selectUser,
    resetMentions,
  };
}
