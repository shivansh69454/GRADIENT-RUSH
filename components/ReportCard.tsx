'use client';

import React, { useRef, useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { byCategory, expensesInMonth, sum } from '@/lib/analytics';
import { getCategoryMeta } from '@/lib/categories';
import { formatCurrency, getLevelTitle, getMonthKey } from '@/lib/utils';

interface ReportCardProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Spotify Wrapped for your money" — a self-contained card rendered to PNG.
 *
 * The exported node uses literal hex colours instead of our CSS variables
 * because html2canvas resolves computed styles and cannot follow `rgb(var(--x))`.
 */
export const ReportCard: React.FC<ReportCardProps> = ({ open, onClose }) => {
  const { player, expenses, goals, streak, smartwiseScore, budget } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const monthKey = getMonthKey();
  const monthExpenses = expensesInMonth(expenses, monthKey);
  const spent = sum(monthExpenses);
  const categories = byCategory(monthExpenses);
  const top = categories[0];
  const saved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const scoreColor =
    smartwiseScore.band === 'positive' ? '#3EBF7A' : smartwiseScore.band === 'warning' ? '#E8A03C' : '#F36C6C';

  const render = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#08090A',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png', 1));
  };

  const download = async () => {
    setExporting(true);
    try {
      const blob = await render();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartwise-report-${monthKey}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const share = async () => {
    setSharing(true);
    try {
      const blob = await render();
      if (!blob) return;
      const file = new File([blob], `smartwise-report-${monthKey}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Smartwise report card',
          text: `Smartwise Score ${smartwiseScore.score}/100 · Level ${player.level} ${getLevelTitle(player.level)}`,
        });
      } else {
        // Desktop has no file share target, so fall back to WhatsApp text.
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            `My Smartwise report card for ${monthLabel} 📊\n\nSmartwise Score: ${smartwiseScore.score}/100 (${smartwiseScore.grade})\nLevel ${player.level} — ${getLevelTitle(player.level)}\n${streak.current}-day tracking streak\n\nTracking my money with Smartwise.`
          )}`,
          '_blank',
          'noopener'
        );
      }
    } catch {
      /* user cancelled the share sheet */
    } finally {
      setSharing(false);
    }
  };

  const stats = [
    { label: 'Spent', value: formatCurrency(spent, true) },
    { label: 'Saved', value: formatCurrency(saved, true) },
    { label: 'Streak', value: `${streak.current}d` },
    { label: 'XP', value: player.total_xp_earned.toLocaleString('en-IN') },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your report card"
      subtitle="Download it or send it to a friend"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={share}
            loading={sharing}
            icon={<Share2 className="h-3.5 w-3.5" />}
          >
            Share
          </Button>
          <Button
            variant="primary"
            onClick={download}
            loading={exporting}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Download PNG
          </Button>
        </>
      }
    >
      <div className="p-4">
        <div className="overflow-hidden rounded-xl">
          {/* Fixed-width, literal-colour node so the PNG matches what is on screen. */}
          <div
            ref={cardRef}
            style={{
              width: 420,
              padding: 28,
              background: 'linear-gradient(160deg, #0F1014 0%, #08090A 55%, #101018 100%)',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#F7F8F8',
              margin: '0 auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: '#5865D6',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ₹
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Smartwise
                </span>
              </div>
              <span style={{ fontSize: 10, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                {monthLabel}
              </span>
            </div>

            {/* Name */}
            <p style={{ marginTop: 22, fontSize: 11, color: '#8A8F98', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              Report card
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>
              {player.name || 'Your'} money, this month
            </h2>

            {/* Score */}
            <div
              style={{
                marginTop: 22,
                padding: 20,
                borderRadius: 14,
                border: '1px solid #26272C',
                background: '#0F1012',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="#26272C" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(smartwiseScore.score / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {smartwiseScore.score}
                  </span>
                  <span style={{ fontSize: 9, color: '#8A8F98', marginTop: 2 }}>/ 100</span>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  Smartwise Score
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 19, fontWeight: 600, color: scoreColor, letterSpacing: '-0.02em' }}>
                  {smartwiseScore.grade}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#8A8F98', lineHeight: 1.5 }}>
                  Level {player.level} · {getLevelTitle(player.level)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: '1px solid #26272C',
                    background: '#0F1012',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 9, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Top category */}
            {top && (
              <div
                style={{
                  marginTop: 14,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #26272C',
                  background: '#0F1012',
                }}
              >
                <p style={{ margin: 0, fontSize: 9, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Biggest category
                </p>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{getCategoryMeta(top.category).emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{top.category}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(top.total)}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        height: 5,
                        borderRadius: 999,
                        background: '#26272C',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.round(top.share * 100)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: '#5865D6',
                        }}
                      />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: 10, color: '#8A8F98' }}>
                      {Math.round(top.share * 100)}% of everything you spent this month
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid #26272C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p style={{ margin: 0, fontSize: 10, color: '#687177' }}>
                {monthExpenses.length} expenses tracked · {budget.daysLeft} days left
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#5865D6', fontWeight: 500 }}>
                smartwise.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
;
