'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip check for onboarding page
    if (pathname === '/onboarding') {
      setIsChecking(false);
      return;
    }

    // Check if user is onboarded
    const playerData = localStorage.getItem('finwise_player');
    
    if (!playerData) {
      router.push('/onboarding');
    } else {
      try {
        const player = JSON.parse(playerData);
        if (!player.isOnboarded) {
          router.push('/onboarding');
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        router.push('/onboarding');
      }
    }
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
