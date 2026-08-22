'use client';

import React, { useState } from 'react';
import { Check, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSpeechRecognition } from '@/hooks/useSpeech';
import { parseVoiceExpense, VOICE_EXAMPLES, type VoiceParseResult } from '@/lib/voiceParser';
import { detectEmoji } from '@/lib/categories';
import { cn, formatCurrency } from '@/lib/utils';

interface VoiceExpenseCaptureProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: { amount: number; description: string; category: string }) => void;
}

/**
 * "Spent 150 on lunch" → a filled-in expense. The parse is shown as separated
 * chips so the user can see exactly what was understood before committing.
 */
export const VoiceExpenseCapture: React.FC<VoiceExpenseCaptureProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [parsed, setParsed] = useState<VoiceParseResult | null>(null);
  const [heard, setHeard] = useState('');

  const { supported, listening, interim, error, start, stop, reset } = useSpeechRecognition(
    (transcript) => {
      setHeard(transcript);
      setParsed(parseVoiceExpense(transcript));
    }
  );

  const close = () => {
    stop();
    reset();
    setParsed(null);
    setHeard('');
    onClose();
  };

  const confirm = () => {
    if (!parsed?.amount) return;
    onConfirm({
      amount: parsed.amount,
      description: parsed.description || parsed.category,
      category: parsed.category,
    });
    close();
  };

  const live = interim || heard;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Voice expense"
      subtitle="Say the amount and what it was for"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirm}
            disabled={!parsed?.amount}
            icon={<Check className="h-3.5 w-3.5" />}
          >
            Add expense
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-4">
        {!supported ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] p-3">
            <MicOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-muted">
              Voice input needs the Web Speech API, which this browser does not expose. Chrome,
              Edge, and Safari on iOS 15+ all work.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                onClick={listening ? stop : start}
                className={cn(
                  'relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200',
                  listening
                    ? 'bg-negative text-white'
                    : 'border border-line bg-surface text-muted hover:border-accent/40 hover:text-accent'
                )}
                aria-label={listening ? 'Stop listening' : 'Start listening'}
              >
                {listening && (
                  <>
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-negative/40" />
                    <span className="absolute inset-0 animate-ping rounded-full bg-negative/20" />
                  </>
                )}
                <Mic className="relative h-7 w-7" />
              </button>
              <p className="text-xs font-medium text-ink">
                {listening ? 'Listening…' : heard ? 'Tap to try again' : 'Tap to speak'}
              </p>
            </div>

            <div className="min-h-[52px] rounded-lg border border-line bg-surface p-3">
              {live ? (
                <p className="text-sm leading-snug text-ink">
                  &ldquo;{live}
                  {listening && <span className="ml-0.5 animate-breathe">|</span>}&rdquo;
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p className="eyebrow">Try saying</p>
                  <div className="flex flex-wrap gap-1">
                    {VOICE_EXAMPLES.slice(0, 3).map((example) => (
                      <span key={example} className="chip">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-negative">{error}</p>}

            {parsed && (
              <div className="animate-fade-up space-y-2.5 rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Parsed
                  </span>
                  <span
                    className={
                      parsed.confidence > 0.7
                        ? 'chip chip-positive'
                        : parsed.confidence > 0.4
                          ? 'chip chip-warning'
                          : 'chip chip-negative'
                    }
                  >
                    {Math.round(parsed.confidence * 100)}% confident
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-positive/25 bg-positive/[0.06] p-2">
                    <p className="eyebrow">Amount</p>
                    <p className="text-sm font-semibold tabnum text-positive">
                      {parsed.amount ? formatCurrency(parsed.amount) : '—'}
                    </p>
                  </div>
                  <div className="rounded-md border border-info/25 bg-info/[0.06] p-2">
                    <p className="eyebrow">What</p>
                    <p className="truncate text-sm font-medium text-info">
                      {parsed.description || '—'}
                    </p>
                  </div>
                  <div className="rounded-md border border-grape/25 bg-grape/[0.06] p-2">
                    <p className="eyebrow">Category</p>
                    <p className="truncate text-sm font-medium text-grape">
                      {detectEmoji(parsed.description, parsed.category)} {parsed.category}
                    </p>
                  </div>
                </div>

                {!parsed.amount && (
                  <p className="flex items-center gap-1.5 text-2xs text-negative">
                    <X className="h-3 w-3" />
                    No amount detected. Include a number, like &ldquo;spent 150 on lunch&rdquo;.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
