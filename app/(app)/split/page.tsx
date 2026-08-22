'use client';

import React, { Suspense } from 'react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { ExpenseSplitter } from '@/components/ExpenseSplitter';
import { PeerBattle } from '@/components/PeerBattle';

export default function SplitPage() {
  return (
    <>
      <PageHeader
        title="Split & settle"
        description="Shared expenses and friendly competition"
        eyebrow="Workspace"
      />

      <PageBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <ExpenseSplitter />
          {/* PeerBattle reads an invite token from the URL, so it needs a Suspense boundary. */}
          <Suspense
            fallback={<div className="skeleton h-72 rounded-xl" />}
          >
            <PeerBattle />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}
