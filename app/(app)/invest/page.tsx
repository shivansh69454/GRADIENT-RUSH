'use client';

import React from 'react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { StockLearn } from '@/components/StockLearn';

export default function InvestPage() {
  return (
    <>
      <PageHeader
        title="Invest"
        description="Learn the concepts before you risk real money"
        eyebrow="Tools"
      />

      <PageBody>
        <div className="mx-auto max-w-3xl">
          <StockLearn />
        </div>
      </PageBody>
    </>
  );
}
