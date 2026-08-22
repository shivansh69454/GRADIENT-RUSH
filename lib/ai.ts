'use client';

import type { ChatMessage } from '@/types';
import { getApiKey } from './storage';
import {
  offlineFutureLetter,
  offlineMentorReply,
  offlineScoreExplanation,
} from './offlineMentor';
import { serializeContext, type FinanceContext } from './prompts';

export interface AIResult {
  text: string;
  live: boolean;
  reason?: string;
}

type Mode = 'mentor' | 'explain' | 'letter' | 'insight';

const callRoute = async (payload: Record<string, unknown>): Promise<AIResult | null> => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, apiKey: getApiKey() || undefined }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { text: string | null; live: boolean; reason?: string };
    if (!data.text) return { text: '', live: false, reason: data.reason };
    return { text: data.text, live: Boolean(data.live) };
  } catch {
    return null;
  }
};

/**
 * Asks the live model and silently degrades to the offline responder when no key
 * is configured or the call fails, so the app never shows a dead chat box.
 */
export const askMentor = async (
  message: string,
  history: ChatMessage[],
  context: FinanceContext
): Promise<AIResult> => {
  const result = await callRoute({
    mode: 'mentor' satisfies Mode,
    message,
    context: serializeContext(context),
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });

  if (result?.live && result.text) return result;
  return { text: offlineMentorReply(message, context), live: false, reason: result?.reason };
};

export const explainScore = async (context: FinanceContext): Promise<AIResult> => {
  const result = await callRoute({
    mode: 'explain' satisfies Mode,
    context: serializeContext(context),
  });
  if (result?.live && result.text) return result;
  return { text: offlineScoreExplanation(context), live: false, reason: result?.reason };
};

export const writeFutureLetter = async (
  context: FinanceContext,
  years: number
): Promise<AIResult> => {
  const result = await callRoute({
    mode: 'letter' satisfies Mode,
    context: serializeContext(context),
    years,
  });
  if (result?.live && result.text) return result;
  return { text: offlineFutureLetter(context, years), live: false, reason: result?.reason };
};

export const isKeyConfigured = async (): Promise<boolean> => {
  if (getApiKey()) return true;
  try {
    const response = await fetch('/api/ai');
    if (!response.ok) return false;
    const data = (await response.json()) as { configured: boolean };
    return data.configured;
  } catch {
    return false;
  }
};
