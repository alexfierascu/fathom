import type { ReactNode } from 'react';

/** A labeled content section on detail pages: mono eyebrow + content. */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <div className="eyebrow">{label}</div>
      {children}
    </section>
  );
}
