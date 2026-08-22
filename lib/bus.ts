'use client';

/**
 * A two-function event bus for the handful of actions the command palette needs
 * to trigger inside a page it does not own — opening the report card, starting
 * Survival Mode. Lifting that state into AppContext would make every consumer
 * re-render for something only one panel cares about.
 */

export type AppCommand = 'open-report' | 'open-survival' | 'open-settings';

const EVENT = 'smartwise:command';

export const emit = (command: AppCommand): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: command }));
};

export const onCommand = (
  command: AppCommand,
  handler: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    if ((event as CustomEvent<AppCommand>).detail === command) handler();
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
