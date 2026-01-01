'use client';

import Image from 'next/image';
import { useAnalysisResult } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
} from '@/components/ui';
import { formatDuration } from '@/lib/utils';
import {
  Clock,
  Tag,
  List,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import type { AnalysisResultJson } from '@glint/types';

interface AnalysisCardProps {
  analysisId: string;
}

export function AnalysisCard({ analysisId }: AnalysisCardProps) {
  const { data: analysis, isLoading, error } = useAnalysisResult(analysisId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg animate-pulse">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-2 text-sm text-muted-foreground">Loading analysis...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="w-full max-w-lg border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-center text-sm text-destructive">
          Failed to load analysis
        </CardContent>
      </Card>
    );
  }

  const result = analysis.resultJson as AnalysisResultJson | null;

  return (
    <Card className="w-full max-w-lg overflow-hidden transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      {analysis.videoThumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={analysis.videoThumbnail}
            alt={analysis.videoTitle || 'Video thumbnail'}
            fill
            className="object-cover"
          />
          {analysis.videoDurationSeconds && (
            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
              {formatDuration(analysis.videoDurationSeconds)}
            </div>
          )}
          <Badge
            variant={analysis.mode === 'DEEP' ? 'primary' : 'default'}
            className="absolute left-2 top-2"
          >
            {analysis.mode}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base">
          {analysis.videoTitle || result?.title || 'Untitled'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        {result?.summary && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Summary
            </h4>
            <p className="text-sm text-foreground leading-relaxed">
              {result.summary}
            </p>
          </div>
        )}

        {/* Key Takeaways */}
        {result?.keyTakeaways && result.keyTakeaways.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <List className="h-3.5 w-3.5" />
              Key Takeaways
            </h4>
            <ul className="space-y-1">
              {result.keyTakeaways.slice(0, expanded ? undefined : 3).map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            {result.keyTakeaways.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show {result.keyTakeaways.length - 3} more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Keywords */}
        {result?.keywords && result.keywords.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Keywords
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.slice(0, 6).map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Preview */}
        {result?.timeline && result.timeline.length > 0 && expanded && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </h4>
            <div className="space-y-2">
              {result.timeline.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-sm"
                >
                  <span className="flex-shrink-0 font-mono text-xs text-primary">
                    {item.timestamp}
                  </span>
                  <span className="text-foreground">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <a
            href={analysis.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Video
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(analysis.videoUrl)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
