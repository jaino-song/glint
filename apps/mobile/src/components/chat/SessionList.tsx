import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import type { ChatSession } from '@glint/types';

interface SessionListProps {
  sessions: ChatSession[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function SessionList({ sessions, onRefresh, refreshing = false }: SessionListProps) {
  const handlePress = (session: ChatSession) => {
    router.push(`/chat/${session.id}`);
  };

  const renderItem = ({ item }: { item: ChatSession }) => (
    <SessionItem session={item} onPress={() => handlePress(item)} />
  );

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start analyzing YouTube videos by entering a URL
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

interface SessionItemProps {
  session: ChatSession;
  onPress: () => void;
}

function SessionItem({ session, onPress }: SessionItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {session.title || 'New Conversation'}
        </Text>
        <Text style={styles.itemDate}>
          {formatDate(session.updatedAt)}
        </Text>
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  }
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
  chevron: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 20,
  },
});
