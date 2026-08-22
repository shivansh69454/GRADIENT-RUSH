'use client';

import React, { useRef, useState } from 'react';
import { Check, RefreshCw, Skull, Sparkles, Target, Zap } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Charts';
import { XPFloat } from '@/components/ToastHost';
import { useApp } from '@/contexts/AppContext';
import { burstAt } from '@/lib/celebrate';
import type { Task, TaskDifficulty } from '@/types';
import { cn } from '@/lib/utils';

const DIFFICULTY: Record<TaskDifficulty, { label: string; chip: string }> = {
  easy: { label: 'Easy', chip: 'chip' },
  medium: { label: 'Medium', chip: 'chip chip-warning' },
  hard: { label: 'Hard', chip: 'chip chip-negative' },
  boss: { label: 'Boss', chip: 'chip chip-accent' },
};

const TaskRow: React.FC<{ task: Task; onToggle: (el: HTMLElement | null) => void }> = ({
  task,
  onToggle,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [float, setFloat] = useState(false);

  const handleClick = () => {
    if (!task.completed) {
      void burstAt(anchorRef.current);
      setFloat(true);
      setTimeout(() => setFloat(false), 1700);
    }
    onToggle(anchorRef.current);
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface',
        task.completed && 'opacity-55'
      )}
    >
      <button
        ref={anchorRef}
        onClick={handleClick}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150',
          task.completed
            ? 'border-accent bg-accent text-white'
            : 'border-line-strong hover:border-accent'
        )}
      >
        {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
        {float && <XPFloat amount={task.xp_reward} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium leading-snug text-ink',
              task.completed && 'line-through decoration-faint'
            )}
          >
            {task.title}
          </p>
          <span className="shrink-0 text-2xs font-semibold tabnum text-accent">
            +{task.xp_reward}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{task.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={DIFFICULTY[task.difficulty].chip}>
            {DIFFICULTY[task.difficulty].label}
          </span>
          <span className="chip capitalize">{task.category}</span>
          {task.personalized && (
            <span className="chip chip-accent">
              <Sparkles className="h-2.5 w-2.5" />
              From your data
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Daily tasks, regenerated from the user's own numbers each day, plus one 500 XP
 * boss challenge that is always the hardest thing on the list.
 */
export const TaskPanel: React.FC = () => {
  const { tasks, toggleTask, regenerateTasks, multiplier } = useApp();

  const regular = tasks.filter((t) => t.difficulty !== 'boss');
  const boss = tasks.find((t) => t.difficulty === 'boss');

  const done = regular.filter((t) => t.completed).length;
  const earned = tasks.filter((t) => t.completed).reduce((acc, t) => acc + t.xp_reward, 0);
  const available = tasks.reduce((acc, t) => acc + t.xp_reward, 0);

  return (
    <Panel>
      <PanelHeader
        title="Today's missions"
        subtitle={`${done} of ${regular.length} done · ${earned}/${available} XP`}
        icon={<Target className="h-3.5 w-3.5" />}
        action={
          <>
            {multiplier > 1 && (
              <span className="chip chip-accent">
                <Zap className="h-3 w-3" />
                {multiplier}×
              </span>
            )}
            <IconButton label="Regenerate tasks from latest data" onClick={regenerateTasks}>
              <RefreshCw className="h-3.5 w-3.5" />
            </IconButton>
          </>
        }
      />

      <PanelBody className="pb-3">
        <ProgressBar
          value={done}
          max={Math.max(1, regular.length)}
          height={4}
          barClassName={done === regular.length ? 'bg-positive' : 'bg-accent'}
        />
      </PanelBody>

      <div className="divide-y divide-line border-t border-line">
        {regular.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={(el) => toggleTask(task.id, el)} />
        ))}
      </div>

      {boss && (
        <div
          className={cn(
            'border-t-2 border-accent/30 bg-accent/[0.04]',
            boss.completed && 'bg-positive/[0.05]'
          )}
        >
          <div className="flex items-center gap-2 px-4 pt-3">
            <Skull className={cn('h-3.5 w-3.5', boss.completed ? 'text-positive' : 'text-accent')} />
            <p className="eyebrow text-accent">Boss challenge · 500 XP</p>
          </div>
          <TaskRow task={boss} onToggle={(el) => toggleTask(boss.id, el)} />
        </div>
      )}
    </Panel>
  );
};
