import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '@/lib/api';
import type { AnalysisResultJson } from '@glint/types';

interface AnalysisCardProps {
  analysisId: string;
}

export function AnalysisCard({ analysisId }: AnalysisCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => analysisApi.getResult(analysisId),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading analysis...</Text>
        </View>
      </View>
    );
  }

  if (error || !data?.data?.result) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Failed to load analysis</Text>
      </View>
    );
  }

  const { result } = data.data;
  const resultJson = result.resultJson as AnalysisResultJson | null;

  if (!resultJson) {
    return (
      <View style={styles.container}>
        <Text style={styles.pendingText}>Analysis in progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with thumbnail */}
      <View style={styles.header}>
        {result.videoThumbnail && (
          <Image source={{ uri: result.videoThumbnail }} style={styles.thumbnail} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {resultJson.title || result.videoTitle}
          </Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>{result.mode}</Text>
          </View>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>{resultJson.summary}</Text>
      </View>

      {/* Key Takeaways */}
      {resultJson.keyTakeaways && resultJson.keyTakeaways.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Takeaways</Text>
          {resultJson.keyTakeaways.slice(0, 3).map((takeaway, index) => (
            <View key={index} style={styles.takeawayItem}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.takeawayText}>{takeaway}</Text>
            </View>
          ))}
          {resultJson.keyTakeaways.length > 3 && (
            <Text style={styles.moreText}>+{resultJson.keyTakeaways.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Keywords */}
      {resultJson.keywords && resultJson.keywords.length > 0 && (
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.keywordsContainer}>
              {resultJson.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* View Details Button */}
      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View Full Analysis</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loading: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorContainer: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  pendingText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 45,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6366f1',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  takeawayItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 8,
  },
  takeawayText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  moreText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  keywordsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  keywordBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    color: '#4b5563',
  },
  viewButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
