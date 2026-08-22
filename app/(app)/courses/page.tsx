'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Clock, GraduationCap, Percent } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { COURSES, type Course } from '@/lib/courses';
import { getCompletedCourses, setCompletedCourses } from '@/lib/storage';
import { cn, getLevelDiscount } from '@/lib/utils';

const CourseReader: React.FC<{
  course: Course;
  completed: boolean;
  onComplete: () => void;
  onBack: () => void;
}> = ({ course, completed, onComplete, onBack }) => {
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const correct = answer === course.quiz.answerIndex;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" />}>
        All courses
      </Button>

      <Panel>
        <PanelBody className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{course.emoji}</span>
            <span className="chip">{course.level}</span>
            <span className="chip">
              <Clock className="h-2.5 w-2.5" />
              {course.minutes} min
            </span>
            <span className="chip chip-accent">+{course.xp} XP</span>
          </div>
          <h2 className="pt-1 text-lg font-semibold text-ink">{course.title}</h2>
          <p className="text-sm text-muted">{course.summary}</p>
        </PanelBody>
      </Panel>

      {course.lessons.map((lesson, index) => (
        <Panel key={lesson.title}>
          <PanelBody className="space-y-2">
            <p className="eyebrow">Lesson {index + 1}</p>
            <h3 className="text-sm font-semibold text-ink">{lesson.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{lesson.body}</p>
          </PanelBody>
        </Panel>
      ))}

      <Panel>
        <PanelHeader title="Check your understanding" icon={<Check className="h-3.5 w-3.5" />} />
        <PanelBody className="space-y-3">
          <p className="text-sm font-medium text-ink">{course.quiz.question}</p>
          <div className="space-y-1.5">
            {course.quiz.options.map((option, index) => {
              const isPicked = answer === index;
              const isAnswer = index === course.quiz.answerIndex;
              return (
                <button
                  key={option}
                  onClick={() => {
                    if (!checked) setAnswer(index);
                  }}
                  disabled={checked}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                    checked && isAnswer && 'border-positive bg-positive/[0.07] text-ink',
                    checked && isPicked && !isAnswer && 'border-negative bg-negative/[0.07]',
                    !checked && isPicked && 'border-accent bg-accent/[0.06]',
                    !checked && !isPicked && 'border-line bg-surface hover:border-line-strong'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      isPicked ? 'border-accent' : 'border-line-strong'
                    )}
                  >
                    {isPicked && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <span className="min-w-0 flex-1 text-muted">{option}</span>
                  {checked && isAnswer && <Check className="h-4 w-4 shrink-0 text-positive" />}
                </button>
              );
            })}
          </div>

          {checked && (
            <p
              className={cn(
                'rounded-lg border px-3 py-2 text-xs leading-relaxed',
                correct
                  ? 'border-positive/25 bg-positive/[0.05] text-muted'
                  : 'border-warning/25 bg-warning/[0.05] text-muted'
              )}
            >
              <span className={cn('font-semibold', correct ? 'text-positive' : 'text-warning')}>
                {correct ? 'Correct. ' : 'Not quite. '}
              </span>
              {course.quiz.explanation}
            </p>
          )}

          {!checked ? (
            <Button
              variant="primary"
              disabled={answer === null}
              onClick={() => {
                setChecked(true);
                if (answer === course.quiz.answerIndex && !completed) onComplete();
              }}
            >
              Check answer
            </Button>
          ) : (
            <div className="flex gap-2">
              {!correct && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setChecked(false);
                    setAnswer(null);
                  }}
                >
                  Try again
                </Button>
              )}
              <Button variant="ghost" onClick={onBack}>
                Back to courses
              </Button>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
};

export default function CoursesPage() {
  const { player, awardXP, pushToast } = useApp();
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<Course | null>(null);

  useEffect(() => setCompleted(getCompletedCourses()), []);

  const discount = getLevelDiscount(player.level);
  const nextTier = (Math.floor(player.level / 20) + 1) * 20;

  const complete = (course: Course) => {
    if (completed.includes(course.id)) return;
    const next = [...completed, course.id];
    setCompleted(next);
    setCompletedCourses(next);
    awardXP(course.xp, `Completed: ${course.title}`);
    pushToast({
      variant: 'success',
      icon: '🎓',
      title: 'Course complete',
      description: `${course.title} · +${course.xp} XP`,
    });
  };

  if (active) {
    return (
      <>
        <PageHeader title="Course" eyebrow="Learn" description={active.title} />
        <PageBody>
          <CourseReader
            course={active}
            completed={completed.includes(active.id)}
            onComplete={() => complete(active)}
            onBack={() => setActive(null)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Courses"
        description="Short, specific, and free"
        eyebrow="Learn"
        action={
          discount > 0 ? (
            <span className="chip chip-accent">
              <Percent className="h-3 w-3" />
              {discount}% level perk
            </span>
          ) : undefined
        }
      />

      <PageBody className="space-y-4">
        <Panel>
          <PanelBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">Your progress</p>
              <p className="mt-0.5 text-sm text-muted">
                <span className="font-semibold text-ink">{completed.length}</span> of{' '}
                {COURSES.length} courses finished ·{' '}
                <span className="font-semibold text-ink">
                  {COURSES.filter((c) => completed.includes(c.id)).reduce((a, c) => a + c.xp, 0)}
                </span>{' '}
                XP earned
              </p>
              <p className="mt-1.5 text-2xs text-faint">
                {discount > 0
                  ? `Level ${player.level} unlocked a ${discount}% perk. Next tier at level ${nextTier}.`
                  : `Reach level 20 to unlock your first level perk. You are level ${player.level}.`}
              </p>
            </div>
            <div className="w-full sm:w-48">
              <ProgressBar
                value={completed.length}
                max={COURSES.length}
                height={5}
                barClassName="bg-positive"
              />
            </div>
          </PanelBody>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {COURSES.map((course) => {
            const isDone = completed.includes(course.id);
            return (
              <button
                key={course.id}
                onClick={() => setActive(course)}
                className={cn(
                  'panel group flex flex-col gap-3 p-4 text-left transition-all duration-150',
                  'hover:border-line-strong hover:shadow-md',
                  isDone && 'border-positive/25'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{course.emoji}</span>
                  {isDone ? (
                    <span className="chip chip-positive">
                      <Check className="h-2.5 w-2.5" />
                      Done
                    </span>
                  ) : (
                    <span className="chip chip-accent">+{course.xp} XP</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-snug text-ink">{course.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{course.summary}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="chip">{course.level}</span>
                  <span className="chip">
                    <Clock className="h-2.5 w-2.5" />
                    {course.minutes} min
                  </span>
                  <span className="chip">
                    <BookOpen className="h-2.5 w-2.5" />
                    {course.lessons.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3.5">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <p className="text-xs leading-relaxed text-muted">
            Every course is free and always will be. Smartwise does not sell subscriptions, advisor
            packages, or tips — if a financial product needs a sales page, it is not education.
          </p>
        </div>
      </PageBody>
    </>
  );
}
