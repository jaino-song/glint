import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdBanner } from '@/components/ads';
import { LoadingScreen } from '@/components/common';
import type { AnalysisResult } from '@glint/types';

interface LibraryResponse {
  analyses: AnalysisResult[];
}

export default function LibraryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.get<LibraryResponse>('/analysis/library'),
  });

  const analyses = data?.data?.analyses ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: AnalysisResult }) => (
    <AnalysisItem analysis={item} />
  ), []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={analyses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <AdBanner />
    </View>
  );
}

function AnalysisItem({ analysis }: { analysis: AnalysisResult }) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        {analysis.videoThumbnail ? (
          <Image
            source={{ uri: analysis.videoThumbnail }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Text style={styles.placeholderText}>V</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {analysis.resultJson?.title || analysis.videoTitle || 'Untitled'}
          </Text>
          <View style={styles.itemMeta}>
            <View style={styles.modeBadge}>
              <Text style={styles.modeText}>{analysis.mode}</Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(analysis.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No analyses yet</Text>
      <Text style={styles.emptySubtitle}>
        Your analyzed videos will appear here
      </Text>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnail: {
    width: 100,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d1d5db',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modeBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6366f1',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  },
});
