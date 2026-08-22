'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  Mic,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { askMentor } from '@/lib/ai';
import { getChat, setChat } from '@/lib/storage';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import type { ChatMessage } from '@/types';
import { cn, formatCurrency, uid } from '@/lib/utils';

const SUGGESTIONS = [
  'Am I overspending this month?',
  'How do I start a SIP with ₹500?',
  'What is a good credit score and how do I build one?',
  'Should I buy something on EMI?',
  'Where should my first ₹10,000 go?',
];

/** Renders **bold** and newlines without pulling in a markdown dependency. */
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('\n').map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={partIndex} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={partIndex}>{part}</React.Fragment>
          )
        )}
      </React.Fragment>
    ))}
  </>
);

interface AIMentorChatProps {
  /** Compact mode is used inside the floating popover. */
  compact?: boolean;
  className?: string;
  /** Question handed over from the command palette, asked once on mount. */
  initialQuestion?: string;
}

export const AIMentorChat: React.FC<AIMentorChatProps> = ({
  compact = false,
  className,
  initialQuestion,
}) => {
  const { aiContext, completeTaskByKey, awardXP, budget, player } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { speak, stop: stopSpeaking, speaking, supported: ttsSupported } = useSpeechSynthesis();
  const {
    supported: sttSupported,
    listening,
    interim,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition((transcript) => setInput((prev) => `${prev} ${transcript}`.trim()));

  useEffect(() => setMessages(getChat()), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const persist = (next: ChatMessage[]) => {
    setMessages(next);
    setChat(next.slice(-40));
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;

    const userMessage: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };
    const withUser = [...messages, userMessage];
    persist(withUser);
    setInput('');
    setThinking(true);

    const result = await askMentor(question, messages, aiContext);

    const reply: ChatMessage = {
      id: uid('msg'),
      role: 'assistant',
      content: result.text,
      timestamp: Date.now(),
      live: result.live,
    };
    persist([...withUser, reply]);
    setThinking(false);

    if (autoSpeak) speak(result.text);

    if (!rewarded) {
      setRewarded(true);
      completeTaskByKey('ask-mentor');
      awardXP(20, 'Asked the mentor a question', { silent: true });
    }
  };

  // A question arriving via the URL should ask itself, exactly once.
  const askedInitialRef = useRef(false);
  useEffect(() => {
    const question = initialQuestion?.trim();
    if (!question || askedInitialRef.current) return;
    askedInitialRef.current = true;
    void send(question);
    // `send` closes over live state but is stable enough for this one-shot call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const clear = () => {
    persist([]);
    stopSpeaking();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-slim"
      >
        {messages.length === 0 && !thinking && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm leading-relaxed text-ink">
                  Hi{player.name ? ` ${player.name}` : ''} — I&apos;m your money coach. I can see
                  your actual numbers, so ask me anything about them.
                </p>
                {player.monthly_allowance > 0 && (
                  <p className="text-xs leading-relaxed text-muted">
                    Right now: {formatCurrency(budget.spentThisMonth)} spent this month,{' '}
                    {formatCurrency(budget.remaining)} left across {budget.daysLeft} days.
                  </p>
                )}
                <p className="text-2xs text-faint">
                  I only answer money questions — budgeting, saving, investing, loans, credit,
                  taxes. Anything else and I&apos;ll point you back here.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="eyebrow">Try asking</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, compact ? 3 : 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void send(suggestion)}
                    className="chip text-left transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-accent px-3 py-2 text-sm leading-relaxed text-white">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-2xs font-medium text-muted">Smartwise AI</span>
                  {message.live ? (
                    <span className="chip chip-accent">
                      <Sparkles className="h-2.5 w-2.5" />
                      Gemini
                    </span>
                  ) : (
                    <span className="chip" title="No API key configured — using the built-in coach">
                      <WifiOff className="h-2.5 w-2.5" />
                      Offline
                    </span>
                  )}
                  {ttsSupported && (
                    <IconButton
                      label="Read aloud"
                      onClick={() => (speaking ? stopSpeaking() : speak(message.content))}
                      className="h-5 w-5"
                    >
                      {speaking ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </IconButton>
                  )}
                </div>
                <div className="text-sm leading-relaxed text-muted">
                  <RichText text={message.content} />
                </div>
              </div>
            </div>
          )
        )}

        {thinking && (
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
              <Bot className="h-3.5 w-3.5 text-accent" />
            </span>
            <div className="flex items-center gap-1.5 pt-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-breathe rounded-full bg-muted"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
              <span className="ml-1 text-2xs text-faint">Reading your data…</span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-surface p-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={listening && interim ? `${input} ${interim}`.trim() : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={compact ? 2 : 2}
            placeholder={listening ? 'Listening…' : 'Ask about your money…'}
            className="field w-full resize-none pr-[76px] leading-relaxed"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {sttSupported && (
              <IconButton
                label={listening ? 'Stop dictation' : 'Dictate'}
                onClick={listening ? stopListening : startListening}
                className={listening ? 'text-negative' : undefined}
              >
                <Mic className="h-3.5 w-3.5" />
              </IconButton>
            )}
            <button
              onClick={() => void send(input)}
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white transition-all hover:bg-accent-hover disabled:opacity-35"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {ttsSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  if (autoSpeak) stopSpeaking();
                }}
                icon={
                  autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />
                }
                className={autoSpeak ? 'text-accent' : undefined}
              >
                {autoSpeak ? 'Voice on' : 'Voice off'}
              </Button>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                icon={<Trash2 className="h-3 w-3" />}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-2xs text-faint">Enter to send · Shift+Enter for a new line</p>
        </div>
      </div>
    </div>
  );
};

export default AIMentorChat;
