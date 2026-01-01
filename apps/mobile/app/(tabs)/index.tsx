import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { ChatInput, SessionList } from '@/components/chat';
import { AdBanner } from '@/components/ads';
import { LoadingScreen } from '@/components/common';
import type { ChatSession } from '@glint/types';

export default function ChatScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sessions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: chatApi.getSessions,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (message: string) => chatApi.createSession(message),
    onSuccess: (response) => {
      if (response.data?.session) {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        router.push(`/chat/${response.data.session.id}`);
      }
    },
  });

  const sessions = data?.data?.sessions ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSend = useCallback((message: string) => {
    // Check if message is a YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const isYouTubeUrl = youtubeRegex.test(message);

    // Create new session with the first message
    createSessionMutation.mutate(isYouTubeUrl ? 'Video Analysis' : message);
  }, [createSessionMutation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.content}>
        <SessionList
          sessions={sessions}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>

      <ChatInput
        onSend={handleSend}
        loading={createSessionMutation.isPending}
        placeholder="Start with a YouTube URL..."
      />

      {/* Bottom banner ad */}
      <AdBanner />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
});
