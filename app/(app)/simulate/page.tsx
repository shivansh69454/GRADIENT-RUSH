'use client';

import React from 'react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { GoalForecast } from '@/components/GoalForecast';
import { SIPCalculator } from '@/components/SIPCalculator';
import { EMICalculator } from '@/components/EMICalculator';

export default function SimulatePage() {
  return (
    <>
      <PageHeader
        title="Simulate"
        description="Play with the numbers before they are real"
        eyebrow="Tools"
      />

      <PageBody className="space-y-4">
        <GoalForecast />
        <WhatIfSimulator />
        <div className="grid gap-4 lg:grid-cols-2">
          <SIPCalculator />
          <EMICalculator />
        </div>
      </PageBody>
    </>
  );
}
