'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, Crown, Swords, Trophy, UserPlus, X } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { FieldShell, Input } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { milestoneConfetti } from '@/lib/celebrate';
import {
  buildCard,
  buildShareUrl,
  compareCards,
  generateCode,
  parseInvite,
  type BattleCard,
} from '@/lib/battle';
import { read, write } from '@/lib/storage';
import { cn, formatCurrency } from '@/lib/utils';

const RIVAL_KEY = 'smartwise_battle_rival';
const CODE_KEY = 'smartwise_battle_code';

/**
 * Anonymous weekly savings duel.
 *
 * There is no server: each side encodes its real weekly numbers into a share
 * link, so both players compare genuine data rather than a simulated opponent.
 */
export const PeerBattle: React.FC = () => {
  const { player, expenses, goals, streak, awardXP, pushToast } = useApp();
  const searchParams = useSearchParams();

  const [code, setCode] = useState<string>('');
  const [rival, setRival] = useState<BattleCard | null>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  const currentStreak = streak.current;

  const you = useMemo(
    () =>
      buildCard(
        code || '000000',
        player.name,
        expenses,
        goals,
        player.monthly_allowance,
        currentStreak
      ),
    [code, player.name, player.monthly_allowance, expenses, goals, currentStreak]
  );

  useEffect(() => {
    setCode(read<string>(CODE_KEY, ''));
    setRival(read<BattleCard | null>(RIVAL_KEY, null));
  }, []);

  // Accept an invite that arrived as a link.
  useEffect(() => {
    const token = searchParams?.get('b');
    if (!token) return;
    const { card } = parseInvite(token);
    if (!card) return;

    setRival(card);
    write(RIVAL_KEY, card);
    setCode(card.c);
    write(CODE_KEY, card.c);
    pushToast({
      variant: 'success',
      icon: '⚔️',
      title: `${card.n} challenged you`,
      description: `They saved ${formatCurrency(card.s)} this week. Beat it.`,
    });
  }, [searchParams, pushToast]);

  const outcome = rival ? compareCards(you, rival) : null;

  // One-time celebration when you take the lead.
  useEffect(() => {
    if (outcome === 'winning' && rival && !celebrated) {
      setCelebrated(true);
      void milestoneConfetti();
      awardXP(75, `Leading the battle vs ${rival.n}`);
    }
  }, [outcome, rival, celebrated, awardXP]);

  const startBattle = () => {
    const next = generateCode();
    setCode(next);
    write(CODE_KEY, next);
    awardXP(25, 'Started a peer battle', { silent: true });
  };

  const join = () => {
    const { card, code: parsedCode } = parseInvite(inviteInput);
    if (card) {
      setRival(card);
      write(RIVAL_KEY, card);
      setCode(card.c);
      write(CODE_KEY, card.c);
      setInviteInput('');
      setJoining(false);
      awardXP(25, `Joined battle vs ${card.n}`);
      return;
    }
    if (parsedCode) {
      pushToast({
        variant: 'warning',
        title: 'Code alone is not enough',
        description: 'Ask your friend for the full challenge link so their real numbers come with it.',
      });
      return;
    }
    pushToast({
      variant: 'danger',
      title: 'Could not read that invite',
      description: 'Paste the whole link your friend sent you.',
    });
  };

  const reset = () => {
    setRival(null);
    setCode('');
    setCelebrated(false);
    write(RIVAL_KEY, null);
    write(CODE_KEY, '');
  };

  const copy = async (value: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      pushToast({ variant: 'warning', title: 'Copy failed', description: 'Select and copy manually.' });
    }
  };

  const shareUrl = code ? buildShareUrl(you) : '';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `I'm challenging you to a savings battle on Smartwise this week 💪\n\nI saved ${formatCurrency(
      you.s
    )} so far. Beat me:\n${shareUrl}\n\nBattle code: ${code}`
  )}`;

  const max = Math.max(you.s, rival?.s ?? 0, 1);

  return (
    <Panel>
      <PanelHeader
        title="Peer battle"
        subtitle={rival ? `You vs ${rival.n} · this week` : 'Challenge a friend to save more'}
        icon={<Swords className="h-3.5 w-3.5" />}
        action={
          rival ? (
            <span
              className={cn(
                'chip',
                outcome === 'winning' && 'chip-positive',
                outcome === 'losing' && 'chip-negative',
                outcome === 'tied' && 'chip-warning'
              )}
            >
              {outcome === 'winning' && (
                <>
                  <Crown className="h-3 w-3" /> Leading
                </>
              )}
              {outcome === 'losing' && 'Behind'}
              {outcome === 'tied' && 'Dead even'}
            </span>
          ) : undefined
        }
      />

      <PanelBody className="space-y-4">
        {!code && !rival && (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-muted">
              Both of you track a normal week. Whoever keeps more of their budget wins. No
              accounts, no server — your numbers travel inside the invite link.
            </p>
            <div className="flex gap-2">
              <Button variant="primary" onClick={startBattle} icon={<Swords className="h-3.5 w-3.5" />}>
                Create a battle
              </Button>
              <Button
                variant="secondary"
                onClick={() => setJoining(true)}
                icon={<UserPlus className="h-3.5 w-3.5" />}
              >
                Join with invite
              </Button>
            </div>
          </div>
        )}

        {joining && !rival && (
          <div className="animate-fade-up space-y-2 rounded-lg border border-line bg-surface p-3">
            <FieldShell
              label="Paste the challenge link"
              hint="A bare 6-digit code has no stats attached — you need the full link."
            >
              <Input
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="https://…/split?b=… or 482910"
                autoFocus
              />
            </FieldShell>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={join} disabled={!inviteInput.trim()}>
                Join battle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setJoining(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {code && (
          <>
            {/* Scoreboard */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    {outcome === 'winning' && <Crown className="h-3 w-3 text-warning" />}
                    You
                  </span>
                  <span className="text-sm font-semibold tabnum text-ink">
                    {formatCurrency(you.s)}
                  </span>
                </div>
                <ProgressBar value={(you.s / max) * 100} height={7} barClassName="bg-accent" />
                <p className="text-2xs text-faint">
                  {you.l} {you.l === 1 ? 'expense' : 'expenses'} logged · {streak.current}-day streak
                </p>
              </div>

              {rival ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                      {outcome === 'losing' && <Crown className="h-3 w-3 text-warning" />}
                      {rival.n}
                    </span>
                    <span className="text-sm font-semibold tabnum text-ink">
                      {formatCurrency(rival.s)}
                    </span>
                  </div>
                  <ProgressBar
                    value={(rival.s / max) * 100}
                    height={7}
                    barClassName="bg-line-strong"
                  />
                  <p className="text-2xs text-faint">
                    {rival.l} {rival.l === 1 ? 'expense' : 'expenses'} logged · {rival.k}-day streak
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center">
                  <p className="text-xs text-muted">Waiting for your rival to accept</p>
                  <p className="mt-0.5 text-2xs text-faint">
                    Send them the link below, then paste theirs back here
                  </p>
                </div>
              )}
            </div>

            {/* Winner badge */}
            {rival && outcome === 'winning' && (
              <div className="flex items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.07] p-3">
                <Trophy className="h-5 w-5 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">
                    You are ahead by {formatCurrency(you.s - rival.s)}
                  </p>
                  <p className="text-2xs text-muted">
                    Hold it until Sunday and the badge is yours.
                  </p>
                </div>
              </div>
            )}
            {rival && outcome === 'losing' && (
              <div className="rounded-lg border border-negative/25 bg-negative/[0.06] p-3">
                <p className="text-xs font-semibold text-ink">
                  {rival.n} is ahead by {formatCurrency(rival.s - you.s)}
                </p>
                <p className="mt-0.5 text-2xs text-muted">
                  Skipping{' '}
                  {Math.max(1, Math.ceil((rival.s - you.s) / 150))} small purchases closes the gap.
                </p>
              </div>
            )}

            {/* Share */}
            <div className="space-y-2 border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="eyebrow">Battle code</p>
                  <p className="text-lg font-semibold tracking-[0.18em] tabnum text-ink">{code}</p>
                </div>
                <IconButton label="Copy code" onClick={() => copy(code, 'code')}>
                  {copied === 'code' ? (
                    <Check className="h-3.5 w-3.5 text-positive" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </IconButton>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open(whatsappUrl, '_blank', 'noopener')}
                >
                  Send on WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copy(shareUrl, 'link')}
                  icon={
                    copied === 'link' ? (
                      <Check className="h-3.5 w-3.5 text-positive" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {copied === 'link' ? 'Copied' : 'Copy link'}
                </Button>
                {!rival && (
                  <Button variant="ghost" size="sm" onClick={() => setJoining(true)}>
                    Paste their link
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  icon={<X className="h-3.5 w-3.5" />}
                >
                  End battle
                </Button>
              </div>
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  );
};
