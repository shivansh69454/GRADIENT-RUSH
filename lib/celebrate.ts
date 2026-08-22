'use client';

/**
 * Confetti helpers. `canvas-confetti` is imported lazily so it never lands in
 * the initial bundle — celebrations are, by definition, not first paint.
 */

type ConfettiFn = (options?: Record<string, unknown>) => void;

let confettiPromise: Promise<ConfettiFn> | null = null;

const loadConfetti = (): Promise<ConfettiFn> => {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then(
      (mod) => (mod.default ?? mod) as unknown as ConfettiFn
    );
  }
  return confettiPromise;
};

const ACCENT = ['#5865D6', '#7A85F0', '#3EBF7A', '#E8A03C', '#A884F5', '#F36C6C'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Small burst anchored to an element — used for task completions. */
export const burstAt = async (element: HTMLElement | null) => {
  if (prefersReducedMotion()) return;
  const confetti = await loadConfetti();
  const rect = element?.getBoundingClientRect();
  const origin = rect
    ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.5 };

  confetti({
    particleCount: 42,
    spread: 62,
    startVelocity: 26,
    decay: 0.9,
    scalar: 0.75,
    ticks: 120,
    origin,
    colors: ACCENT,
    disableForReducedMotion: true,
  });
};

/** Full-screen cannon sequence for a level-up. */
export const levelUpConfetti = async () => {
  if (prefersReducedMotion()) return;
  const confetti = await loadConfetti();

  const fire = (particleRatio: number, options: Record<string, unknown>) =>
    confetti({
      origin: { y: 0.62 },
      colors: ACCENT,
      disableForReducedMotion: true,
      ...options,
      particleCount: Math.floor(220 * particleRatio),
    });

  fire(0.25, { spread: 26, startVelocity: 55, scalar: 1.1 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.85 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors: ACCENT,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors: ACCENT,
      disableForReducedMotion: true,
    });
  }, 240);
};

/** Gentle upward drift for hitting a savings milestone. */
export const milestoneConfetti = async () => {
  if (prefersReducedMotion()) return;
  const confetti = await loadConfetti();
  confetti({
    particleCount: 80,
    spread: 80,
    startVelocity: 32,
    gravity: 0.55,
    decay: 0.93,
    scalar: 0.9,
    origin: { y: 0.7 },
    colors: ['#3EBF7A', '#5865D6', '#E8A03C'],
    disableForReducedMotion: true,
  });
};
