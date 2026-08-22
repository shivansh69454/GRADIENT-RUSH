'use client';

import React from 'react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { FutureSelfLetter } from '@/components/FutureSelfLetter';

export default function FuturePage() {
  return (
    <>
      <PageHeader
        title="Future self"
        description="A letter written from your own data"
        eyebrow="Tools"
      />

      <PageBody>
        <div className="mx-auto max-w-3xl">
          <FutureSelfLetter />
        </div>
      </PageBody>
    </>
  );
}
