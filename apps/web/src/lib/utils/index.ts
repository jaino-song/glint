export { cn } from './cn';

/**
 * 날짜를 상대적 시간으로 포맷
 */
export function formatRelativeDate(date: string | Date, locale = 'ko'): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return locale === 'ko' ? '방금 전' : 'just now';
      }
      return rtf.format(-diffMinutes, 'minute');
    }
    return rtf.format(-diffHours, 'hour');
  }

  if (diffDays < 7) {
    return rtf.format(-diffDays, 'day');
  }

  if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return rtf.format(-diffWeeks, 'week');
  }

  return targetDate.toLocaleDateString(locale);
}

/**
 * 초를 mm:ss 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 큰 숫자를 축약 형식으로 변환 (1.2K, 1.5M 등)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 타임스탬프 문자열 파싱 (00:00 또는 00:00:00)
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * 세션 그룹화 헬퍼
 */
export function groupByDate<T extends { createdAt: string }>(
  items: T[],
  locale = 'ko'
): { label: string; items: T[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const labels = {
    ko: { today: '오늘', yesterday: '어제', lastWeek: '지난 7일', older: '이전' },
    en: { today: 'Today', yesterday: 'Yesterday', lastWeek: 'Last 7 days', older: 'Older' },
    ja: { today: '今日', yesterday: '昨日', lastWeek: '過去7日間', older: 'それ以前' },
  };

  const l = labels[locale as keyof typeof labels] || labels.ko;

  const groups: { label: string; items: T[] }[] = [
    { label: l.today, items: [] },
    { label: l.yesterday, items: [] },
    { label: l.lastWeek, items: [] },
    { label: l.older, items: [] },
  ];

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    if (date >= today) {
      groups[0].items.push(item);
    } else if (date >= yesterday) {
      groups[1].items.push(item);
    } else if (date >= lastWeek) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}
