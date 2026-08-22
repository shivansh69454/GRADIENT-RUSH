'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldShell, Input, MoneyInput } from '@/components/ui/Field';
import { useApp } from '@/contexts/AppContext';
import { getApiKey, setApiKey } from '@/lib/storage';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { player, updatePlayer, resetEverything, seedDemoData, pushToast } = useApp();
  const [name, setName] = useState(player.name);
  const [allowance, setAllowance] = useState(String(player.monthly_allowance || ''));
  const [key, setKey] = useState('');
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(player.name);
    setAllowance(String(player.monthly_allowance || ''));
    setKey(getApiKey());
    setConfirmReset(false);
    setConfirmSeed(false);

    fetch('/api/ai')
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setServerConfigured(d.configured))
      .catch(() => setServerConfigured(false));
  }, [open, player]);

  const save = () => {
    const parsedAllowance = Number(allowance) || 0;
    updatePlayer({ name: name.trim() || player.name, monthly_allowance: parsedAllowance });
    setApiKey(key.trim());
    pushToast({ variant: 'success', title: 'Settings saved', description: 'Your numbers are updated.' });
    onClose();
  };

  const aiLive = serverConfigured || key.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      subtitle="Your profile, budget, and AI configuration"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </FieldShell>
          <FieldShell label="Monthly allowance" hint="Drives your daily budget and Smartwise Score">
            <MoneyInput
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              placeholder="10000"
            />
          </FieldShell>
        </div>

        <div className="space-y-2.5 rounded-lg border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted" />
              <div>
                <p className="text-sm font-medium text-ink">Gemini API key</p>
                <p className="text-xs text-muted">Powers the AI mentor, Smartwise Score explainer, and future-self letter.</p>
              </div>
            </div>
            <span
              className={
                aiLive
                  ? 'chip chip-positive shrink-0'
                  : 'chip chip-warning shrink-0'
              }
            >
              {aiLive ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Live
                </>
              ) : (
                <>
                  <TriangleAlert className="h-3 w-3" /> Offline mode
                </>
              )}
            </span>
          </div>

          {serverConfigured ? (
            <p className="text-xs text-positive">
              A key is configured on the server via <code className="text-2xs">GEMINI_API_KEY</code>.
              Nothing more to do.
            </p>
          ) : (
            <>
              <Input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-2xs leading-relaxed text-faint">
                Stored only in this browser and sent with each request. For deployment, set{' '}
                <code>GEMINI_API_KEY</code> in your environment instead.{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-accent hover:underline"
                >
                  Get a free key <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
              <p className="text-2xs leading-relaxed text-muted">
                Without a key, Smartwise still works — the mentor falls back to a rule-based coach
                that reasons over your real data, and every reply is clearly labelled offline.
              </p>
            </>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-line bg-surface p-3.5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted" />
            <p className="text-sm font-medium text-ink">Load demo history</p>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Fills the app with three months of realistic expenses, subscriptions, goals and a
            streak. The subscription radar, spending heatmap and goal forecast all need real history
            before they have anything to say.
          </p>
          <p className="text-2xs text-faint">Replaces your current expenses and goals.</p>
          {confirmSeed ? (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  seedDemoData();
                  setConfirmSeed(false);
                  onClose();
                }}
              >
                Yes, load it
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmSeed(false)}>
                Never mind
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirmSeed(true)}>
              Load demo data
            </Button>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-negative/25 bg-negative/4 p-3.5">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-negative" />
            <p className="text-sm font-medium text-ink">Reset all data</p>
          </div>
          <p className="text-xs text-muted">
            Wipes every expense, goal, task, streak, and XP point from this browser. Cannot be
            undone.
          </p>
          {confirmReset ? (
            <div className="flex items-center gap-2 pt-1">
              <Button variant="danger" size="sm" onClick={resetEverything}>
                Yes, delete everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Never mind
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
              Reset data
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
