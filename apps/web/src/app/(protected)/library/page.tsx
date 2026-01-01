'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import { Library, Search, Filter } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="mt-1 text-gray-500">
            Browse and search your analysis history
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search analyses..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Library className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No analyses yet
            </h3>
            <p className="max-w-sm text-center text-gray-500">
              Your analyzed videos will appear here. Start by pasting a YouTube
              URL in the chat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
