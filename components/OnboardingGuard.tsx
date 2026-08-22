'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

const PUBLIC_ROUTES = ['/onboarding'];

export const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, player } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [slowLoad, setSlowLoad] = useState(false);

  const needsOnboarding = ready && !player.isOnboarded;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (!ready) return;
    if (needsOnboarding && !isPublic) router.replace('/onboarding');
    if (!needsOnboarding && isPublic) router.replace('/dashboard');
  }, [ready, needsOnboarding, isPublic, router]);

  // If JS chunks fail to load, the spinner never resolves — surface a hint after 6s.
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlowLoad(true), 6000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
        style={{ minHeight: '100dvh' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-ink">Loading Smartwise</p>
          <p className="mt-1 text-xs text-muted">Reading your saved data…</p>
        </div>
        {slowLoad && (
          <p className="max-w-xs text-center text-2xs leading-relaxed text-faint">
            Taking longer than usual. Try a hard refresh (Cmd+Shift+R) or restart the dev server
            with <code className="text-muted">rm -rf .next && npm run dev</code>.
          </p>
        )}
      </div>
    );
  }

  // Avoid rendering a protected page for the frame before the redirect lands.
  if (needsOnboarding && !isPublic) return null;

  return <>{children}</>;
};

export default OnboardingGuard;
