'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, RefreshCw, ScanLine, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Charts';
import { parseReceiptText, type ReceiptScan } from '@/lib/receipt';
import { CATEGORIES, detectEmoji } from '@/lib/categories';
import { cn, formatCurrency } from '@/lib/utils';

interface BillScannerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: { amount: number; description: string; category: string }) => void;
}

type Stage = 'idle' | 'preview' | 'reading' | 'done' | 'error';

/**
 * Camera → OCR → expense, entirely on-device.
 *
 * Tesseract runs in a web worker in the browser, so there is no API cost, no
 * upload, and no receipt ever leaves the phone.
 */
export const BillScanner: React.FC<BillScannerProps> = ({ open, onClose, onConfirm }) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [scan, setScan] = useState<ReceiptScan | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [errorMessage, setErrorMessage] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const reset = () => {
    cleanup();
    setStage('idle');
    setProgress(0);
    setPreview(null);
    setScan(null);
    setAmount('');
    setCategory('Other');
    setErrorMessage('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const runOcr = async (file: File) => {
    cleanup();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
    setStage('reading');
    setProgress(0);

    try {
      const { default: Tesseract } = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (message: { status: string; progress: number }) => {
          if (message.status === 'recognizing text') {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });

      const parsed = parseReceiptText(result.data.text);
      setScan(parsed);
      setAmount(parsed.amount ? String(parsed.amount) : '');
      setCategory(parsed.category);
      setStage('done');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not read that image: ${error.message}`
          : 'Could not read that image.'
      );
      setStage('error');
    }
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void runOcr(file);
  };

  const confirm = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onConfirm({
      amount: value,
      description: scan?.merchant || 'Scanned receipt',
      category,
    });
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Scan a receipt"
      subtitle="Reads the total on-device — nothing is uploaded"
      footer={
        stage === 'done' ? (
          <>
            <Button variant="ghost" onClick={reset} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Scan another
            </Button>
            <Button
              variant="primary"
              onClick={confirm}
              disabled={!Number(amount)}
              icon={<Check className="h-3.5 w-3.5" />}
            >
              Add expense
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
        )
      }
    >
      <div className="space-y-4 p-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />

        {stage === 'idle' && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface p-5 transition-all hover:border-accent/40 hover:bg-elevated"
              >
                <Camera className="h-6 w-6 text-accent" />
                <span className="text-xs font-medium text-ink">Use camera</span>
                <span className="text-2xs text-faint">Point at the bill</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface p-5 transition-all hover:border-accent/40 hover:bg-elevated"
              >
                <Upload className="h-6 w-6 text-muted" />
                <span className="text-xs font-medium text-ink">Upload image</span>
                <span className="text-2xs text-faint">JPG or PNG</span>
              </button>
            </div>

            <div className="space-y-1.5 rounded-lg border border-line bg-surface p-3">
              <p className="eyebrow">For the best read</p>
              <ul className="space-y-1 text-2xs leading-relaxed text-muted">
                <li>· Flatten the receipt and fill the frame with it</li>
                <li>· Good light, no shadow across the total line</li>
                <li>· Printed bills read far better than handwritten ones</li>
              </ul>
            </div>
          </>
        )}

        {(stage === 'reading' || stage === 'done' || stage === 'error') && preview && (
          <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-52 w-full object-contain"
            />
            {stage === 'reading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/75 backdrop-blur-sm">
                <ScanLine className="h-6 w-6 animate-breathe text-accent" />
                <p className="text-xs font-medium text-ink">Reading receipt…</p>
                <div className="w-40">
                  <ProgressBar value={progress} height={4} />
                </div>
                <p className="text-2xs tabnum text-faint">{progress}%</p>
              </div>
            )}
          </div>
        )}

        {stage === 'reading' && (
          <p className="flex items-center justify-center gap-2 text-2xs text-faint">
            <Loader2 className="h-3 w-3 animate-spin" />
            First scan downloads the OCR model — later scans are instant
          </p>
        )}

        {stage === 'error' && (
          <div className="space-y-2 rounded-lg border border-negative/30 bg-negative/[0.06] p-3">
            <p className="text-xs text-negative">{errorMessage}</p>
            <Button variant="secondary" size="sm" onClick={reset}>
              Try another image
            </Button>
          </div>
        )}

        {stage === 'done' && scan && (
          <div className="animate-fade-up space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink">What Smartwise read</p>
              <span
                className={
                  scan.confidence > 0.65
                    ? 'chip chip-positive'
                    : scan.confidence > 0.4
                      ? 'chip chip-warning'
                      : 'chip chip-negative'
                }
              >
                {Math.round(scan.confidence * 100)}% confident
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="eyebrow">Total</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="field pl-7 tabnum font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="eyebrow">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="field cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.emoji} {c.key}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {scan.merchant && (
              <p className="text-xs text-muted">
                Merchant:{' '}
                <span className="font-medium text-ink">
                  {detectEmoji(scan.merchant, category)} {scan.merchant}
                </span>
              </p>
            )}

            {scan.candidates.length > 1 && (
              <div className="space-y-1.5">
                <p className="eyebrow">Other amounts found — tap to use</p>
                <div className="flex flex-wrap gap-1.5">
                  {scan.candidates.map((value) => (
                    <button
                      key={value}
                      onClick={() => setAmount(String(value))}
                      className={cn(
                        'chip transition-colors hover:border-accent/40 hover:text-accent',
                        Number(amount) === value && 'chip-accent'
                      )}
                    >
                      {formatCurrency(value)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <details className="group rounded-lg border border-line bg-surface">
              <summary className="cursor-pointer list-none px-3 py-2 text-2xs font-medium text-muted transition-colors hover:text-ink">
                View raw OCR text
              </summary>
              <pre className="max-h-32 overflow-auto whitespace-pre-wrap border-t border-line px-3 py-2 text-[10px] leading-relaxed text-faint scrollbar-slim">
                {scan.rawText.trim() || 'No text detected.'}
              </pre>
            </details>
          </div>
        )}
      </div>
    </Modal>
  );
};
