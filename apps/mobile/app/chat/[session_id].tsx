import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/stores';
import { ChatInput, ChatMessage } from '@/components/chat';
import { AdBanner } from '@/components/ads';
import { LoadingScreen } from '@/components/common';
import { useInterstitialAd } from '@/hooks/ads';
import type { ChatMessage as ChatMessageType } from '@glint/types';

export default function ChatRoomScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const { show: showInterstitial, canShow: canShowInterstitial } = useInterstitialAd();

  const { messages, setMessages, addMessage, setLoading, isLoading } = useChatStore();

  // Fetch session details
  const { data, isLoading: isFetching } = useQuery({
    queryKey: ['session', session_id],
    queryFn: () => chatApi.getSession(session_id!),
    enabled: !!session_id,
  });

  // Update messages when data changes
  useEffect(() => {
    if (data?.data?.messages) {
      setMessages(data.data.messages);
    }
  }, [data, setMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(session_id!, content),
    onMutate: async (content) => {
      // Optimistically add user message
      const tempMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        sessionId: session_id!,
        role: 'user',
        type: 'text',
        content,
        analysisRefId: null,
        createdAt: new Date().toISOString(),
      };
      addMessage(tempMessage);
      setLoading(true);
    },
    onSuccess: (response) => {
      if (response.data?.message) {
        // Replace temp message or add assistant response
        queryClient.invalidateQueries({ queryKey: ['session', session_id] });
      }
      setLoading(false);

      // Show interstitial after a few messages
      if (canShowInterstitial && messages.length > 0 && messages.length % 5 === 0) {
        showInterstitial();
      }
    },
    onError: () => {
      setLoading(false);
      // Could add error message to chat
    },
  });

  const handleSend = useCallback((content: string) => {
    if (!content.trim() || isLoading) return;
    sendMessageMutation.mutate(content);
  }, [isLoading, sendMessageMutation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const sessionTitle = data?.data?.session?.title || 'Chat';

  if (isFetching && messages.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: sessionTitle,
          headerBackTitle: 'Back',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <ChatMessage message={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        <ChatInput
          onSend={handleSend}
          loading={isLoading}
          disabled={sendMessageMutation.isPending}
          placeholder="Type a message or paste a YouTube URL..."
        />

        <AdBanner />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
});
