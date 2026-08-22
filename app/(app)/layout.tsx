import React from 'react';
import { AppShell } from '@/components/AppShell';
import { FloatingMentor } from '@/components/FloatingMentor';
import { BrokeAlertBanner } from '@/components/BudgetGuardian';
import { CommandPalette } from '@/components/CommandPalette';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <BrokeAlertBanner />
      {children}
      <FloatingMentor />
      <CommandPalette />
    </AppShell>
  );
}
