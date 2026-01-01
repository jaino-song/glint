import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Sparkles, Zap, Brain } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Glint
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Login
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-1.5 text-sm text-accent-700">
            <Sparkles className="h-4 w-4" />
            Powered by Gemini 3.0 Pro
          </div>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Video Insights
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              at a Glance
            </span>
          </h2>
          <p className="mb-10 text-xl text-gray-600">
            Ultra-precise video analysis and knowledge management powered by
            Google's most advanced AI. Extract insights from any YouTube video
            in seconds.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <Zap className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Standard Mode
            </h3>
            <p className="text-gray-600">
              Quick text-based analysis using Gemini Flash. Get summaries, key
              takeaways, and timestamps in seconds.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
              <Brain className="h-6 w-6 text-accent-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Deep Mode
            </h3>
            <p className="text-gray-600">
              Frame-by-frame analysis using Gemini Pro Thinking. Captures
              visual details, charts, and on-screen text.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Chat Interface
            </h3>
            <p className="text-gray-600">
              Ask follow-up questions about any video. Our AI remembers context
              and provides detailed answers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-16 text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to capture insights?</h2>
          <p className="mb-8 text-lg text-white/90">
            Start with 30 free credits. No credit card required.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Glint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
