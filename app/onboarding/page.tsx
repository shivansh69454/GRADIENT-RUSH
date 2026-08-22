'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, MoneyInput } from '@/components/ui/Field';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp } from '@/contexts/AppContext';
import { cn, formatCurrency, getTodayDate, uid } from '@/lib/utils';

const ALLOWANCE_PRESETS = [3000, 5000, 10000, 15000, 25000, 40000];

const STEPS = [
  { key: 'name', title: 'What should we call you?', hint: 'Your coach will use this.' },
  { key: 'age', title: 'How old are you?', hint: 'It changes the advice you get.' },
  {
    key: 'allowance',
    title: 'What do you get each month?',
    hint: 'Allowance, stipend, or salary — whatever lands in your account.',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { updatePlayer } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [allowance, setAllowance] = useState('');

  const values = [name.trim(), age, allowance];
  const canAdvance =
    step === 0
      ? name.trim().length >= 2
      : step === 1
        ? Number(age) >= 10 && Number(age) <= 100
        : Number(allowance) > 0;

  const finish = () => {
    updatePlayer({
      id: uid('player'),
      name: name.trim(),
      age: Number(age),
      monthly_allowance: Number(allowance),
      isOnboarded: true,
      joined_date: getTodayDate(),
      total_xp_earned: 100,
    });
    router.replace('/dashboard');
  };

  const next = () => {
    if (!canAdvance) return;
    if (step === STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  const dailyBudget = Number(allowance) > 0 ? Number(allowance) / 30 : 0;

  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="glass-bar relative flex h-14 items-center justify-between border-b px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-white"
            style={{ boxShadow: '0 2px 12px rgb(var(--accent) / 0.4)' }}
          >
            ₹
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Smartwise</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="relative flex flex-1 items-center justify-center px-5 pb-16">
        <div className="glass-strong w-full max-w-md rounded-2xl p-6 sm:p-8">
          {/* Progress */}
          <div className="mb-8 flex gap-1.5">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors duration-300',
                  index <= step ? 'bg-accent' : 'bg-line'
                )}
              />
            ))}
          </div>

          <div key={step} className="animate-fade-up space-y-6">
            <div className="space-y-1.5">
              <p className="eyebrow">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {STEPS[step].title}
              </h1>
              <p className="text-sm text-muted">{STEPS[step].hint}</p>
            </div>

            {step === 0 && (
              <Input
                large
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="Your first name"
                autoFocus
                maxLength={24}
              />
            )}

            {step === 1 && (
              <div className="space-y-3">
                <Input
                  large
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  placeholder="20"
                  autoFocus
                  className="tabnum"
                />
                <div className="flex gap-1.5">
                  {[18, 20, 22, 25].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAge(String(preset))}
                      className={cn('chip', Number(age) === preset && 'chip-accent')}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <MoneyInput
                  large
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  placeholder="10000"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {ALLOWANCE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAllowance(String(preset))}
                      className={cn('chip', Number(allowance) === preset && 'chip-accent')}
                    >
                      {formatCurrency(preset, true)}
                    </button>
                  ))}
                </div>

                {dailyBudget > 0 && (
                  <div className="panel-quiet animate-fade-up space-y-2 p-3.5">
                    <p className="eyebrow">What that means</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted">Safe daily spend</p>
                        <p className="text-base font-semibold tabnum text-ink">
                          {formatCurrency(dailyBudget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">20% savings target</p>
                        <p className="text-base font-semibold tabnum text-positive">
                          {formatCurrency(Number(allowance) * 0.2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xs leading-relaxed text-faint">
                      You can change this any time in settings. It drives your daily budget,
                      Smartwise Score, and the tasks Smartwise generates for you.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setStep(step - 1)}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={next}
                disabled={!canAdvance}
                iconRight={
                  step === STEPS.length - 1 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )
                }
                className="flex-1"
              >
                {step === STEPS.length - 1 ? 'Start tracking' : 'Continue'}
              </Button>
            </div>

            {/* Recap of answers already given */}
            {step > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-line pt-4">
                {STEPS.slice(0, step).map((s, index) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(index)}
                    className="chip transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    <Check className="h-2.5 w-2.5 text-positive" />
                    {s.key === 'allowance' ? formatCurrency(Number(values[index])) : values[index]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {step === 0 && (
            <div className="mt-10 flex items-start gap-2.5 panel-quiet p-3.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted">
                Everything stays in this browser. No account, no bank login, no data leaving your
                device — the only thing sent anywhere is a chat message when you ask the AI coach a
                question.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
