import React from 'react';

/**
 * The lit room the frosted panels sit in.
 *
 * Glassmorphism is entirely dependent on what is behind the glass: frost a
 * pane over a flat white page and you get a slightly grey rectangle. These
 * slow-drifting colour blobs give every `.glass-*` surface something to
 * refract, which is what makes the blur legible as glass.
 *
 * Rendered once at the root, fixed and inert. Only `transform` is animated so
 * the whole layer stays on the compositor — it never triggers layout or paint,
 * which matters because it is always on screen.
 */
export const Aurora: React.FC = () => (
  <div aria-hidden className="aurora grain pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div
      className="absolute -left-[15%] -top-[20%] h-[60vh] w-[60vw] animate-drift-a rounded-full blur-[110px]"
      style={{ backgroundColor: 'rgb(var(--aurora-a) / var(--aurora-blob-alpha))' }}
    />
    <div
      className="absolute -right-[12%] top-[8%] h-[52vh] w-[48vw] animate-drift-b rounded-full blur-[120px]"
      style={{ backgroundColor: 'rgb(var(--aurora-b) / var(--aurora-blob-alpha))' }}
    />
    <div
      className="absolute -bottom-[22%] left-[35%] h-[55vh] w-[52vw] animate-drift-c rounded-full blur-[130px]"
      style={{ backgroundColor: 'rgb(var(--aurora-c) / var(--aurora-blob-alpha))' }}
    />
  </div>
);
