'use client';

import Image from 'next/image';
import { useAnalysisResult, useAnalysisJob } from '@/hooks';
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
  Tag,
  ExternalLink,
  Copy,
  FileText,
  Loader2,
  BookOpen,
} from 'lucide-react';
import type { AnalysisResultJson } from '@glint/types';

interface AnalysisCardProps {
  analysisId: string;
}

export function AnalysisCard({ analysisId }: AnalysisCardProps) {
  // analysisId could be a job ID or a result ID
  // First try to fetch as a job to check status
  const { data: job, isLoading: jobLoading, error: jobError } = useAnalysisJob(analysisId);

  // Determine if we should fetch the result:
  // - If job exists and has resultId, use that
  // - If job doesn't exist (404 = not a job ID), try analysisId as a result ID
  // - If job is pending/processing, don't fetch result yet
  const shouldFetchResult = job?.resultId || (!job && !jobLoading && jobError);
  const resultId = job?.resultId || (shouldFetchResult ? analysisId : '');
  const { data: analysis, isLoading: resultLoading, error } = useAnalysisResult(resultId);

  // Job is pending or processing
  if (job && (job.status === 'PENDING' || job.status === 'PROCESSING')) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mt-3 text-sm font-medium text-foreground">
            {job.status === 'PENDING' ? 'Waiting to start...' : 'Analyzing video...'}
          </span>
          {job.progress > 0 && (
            <div className="mt-2 w-full max-w-xs">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="mt-1 text-xs text-muted-foreground">{job.progress}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Job failed
  if (job?.status === 'FAILED') {
    return (
      <Card className="w-full max-w-lg border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-center text-sm text-destructive">
          Analysis failed: {job.errorMessage || 'Unknown error'}
        </CardContent>
      </Card>
    );
  }

  // Loading states
  if (jobLoading || resultLoading) {
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

        {/* Chapters */}
        {result?.timeline && result.timeline.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Chapters
            </h4>
            <div className="space-y-4">
              {result.timeline.map((chapter, i) => {
                const nextChapter = result.timeline[i + 1];
                const timeRange = nextChapter
                  ? `${chapter.timestamp} – ${nextChapter.timestamp}`
                  : chapter.timestamp;
                const chapterTitle = chapter.title || chapter.description || 'Section';

                return (
                  <div key={i} className="space-y-2">
                    {/* Chapter header */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">{timeRange}</span>
                      <span className="text-sm font-medium text-foreground">{chapterTitle}</span>
                    </div>
                    {/* Chapter points */}
                    {chapter.points && chapter.points.length > 0 && (
                      <ul className="ml-4 space-y-1.5">
                        {chapter.points.map((point, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="flex-shrink-0 font-mono text-primary">[{point.timestamp}]</span>
                            <span>{point.content}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Fallback to summary if no points */}
                    {!chapter.points && chapter.summary && (
                      <p className="ml-4 text-xs text-muted-foreground">{chapter.summary}</p>
                    )}
                    {/* Legacy details format */}
                    {chapter.details && chapter.details.length > 0 && (
                      <ul className="ml-4 space-y-1">
                        {chapter.details.map((detail, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
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
