'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Lock } from 'lucide-react';
import { PageHeader } from '@/components/AppShell';
import { AIMentorChat } from '@/components/AIMentorChat';

/** Reads `?q=` so the command palette can hand over a question mid-flight. */
const SeededChat: React.FC = () => {
  const params = useSearchParams();
  return <AIMentorChat initialQuestion={params.get('q') ?? undefined} />;
};

export default function MentorPage() {
  return (
    <>
      <PageHeader
        title="AI mentor"
        description="A coach that can see your actual numbers"
        eyebrow="Learn"
        action={
          <span className="chip hidden sm:inline-flex">
            <Lock className="h-3 w-3" />
            Finance only
          </span>
        }
      />

      <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-4 pb-4 sm:px-6">
        <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/12">
              <Bot className="h-4 w-4 text-accent" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Smartwise AI</p>
              <p className="text-2xs text-muted">
                Reads your budget, categories, goals, and streak before answering
              </p>
            </div>
          </header>
          <Suspense fallback={<AIMentorChat />}>
            <SeededChat />
          </Suspense>
        </div>
      </div>
    </>
  );
}
