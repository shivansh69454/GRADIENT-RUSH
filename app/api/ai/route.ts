import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  explainScorePrompt,
  futureLetterPrompt,
  insightPrompt,
  mentorSystemPrompt,
} from '@/lib/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Mode = 'mentor' | 'explain' | 'letter' | 'insight';

interface Body {
  mode: Mode;
  message?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
  years?: number;
  /** Bring-your-own-key so the app is demoable without a server env var. */
  apiKey?: string;
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const buildSystemPrompt = (mode: Mode, context: string, years: number): string => {
  switch (mode) {
    case 'explain':
      return explainScorePrompt(context);
    case 'letter':
      return futureLetterPrompt(context, years);
    case 'insight':
      return insightPrompt(context);
    default:
      return mentorSystemPrompt(context);
  }
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mode: Mode = body.mode ?? 'mentor';
  const context = body.context ?? 'No data available yet.';
  const years = body.years ?? 10;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || body.apiKey;

  if (!apiKey) {
    // Signals the client to use its offline responder rather than showing an error.
    return NextResponse.json(
      { text: null, live: false, reason: 'missing-key' },
      { status: 200 }
    );
  }

  const userTurn =
    mode === 'mentor'
      ? body.message?.trim()
      : mode === 'letter'
        ? `Write my letter from ${years} years in the future.`
        : mode === 'explain'
          ? 'Explain my Smartwise Score.'
          : 'Give me one insight about my spending.';

  if (!userTurn) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: buildSystemPrompt(mode, context, years),
      generationConfig: {
        temperature: mode === 'letter' ? 0.95 : 0.6,
        maxOutputTokens: mode === 'letter' ? 700 : 500,
        topP: 0.95,
      },
    });

    // Only the mentor keeps conversational memory; the other modes are one-shot.
    const history =
      mode === 'mentor'
        ? (body.history ?? []).slice(-8).map((m) => ({
            role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: m.content }],
          }))
        : [];

    // Gemini rejects a history that does not start with a user turn.
    while (history.length > 0 && history[0].role !== 'user') history.shift();

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userTurn);
    const text = result.response.text()?.trim();

    if (!text) {
      return NextResponse.json({ text: null, live: false, reason: 'empty' }, { status: 200 });
    }

    return NextResponse.json({ text, live: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAuth = /api key|permission|unauthenticated|invalid/i.test(message);
    return NextResponse.json(
      { text: null, live: false, reason: isAuth ? 'invalid-key' : 'upstream-error', detail: message },
      { status: 200 }
    );
  }
}

export async function GET() {
  const configured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  return NextResponse.json({ configured, model: MODEL });
}
