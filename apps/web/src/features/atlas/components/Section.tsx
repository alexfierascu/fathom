import type { ReactNode } from 'react';

/** A labeled content section on detail pages: mono eyebrow + content. */
export function Section({
  label,
  id,
  children,
}: {
  label: string;
  /** Optional anchor target so the Captain's Log can deep-link here. */
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="detail-section">
      <div className="eyebrow">{label}</div>
      {children}
    </section>
  );
}
