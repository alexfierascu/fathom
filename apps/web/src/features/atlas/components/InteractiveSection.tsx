import type { ReactNode } from 'react';

/**
 * An interactive experience given a full stage — a map, a timeline, a
 * chart — introduced by a quiet heading and, optionally, an aside of
 * supporting facts alongside it. Never a static wall of data.
 */
interface InteractiveSectionProps {
  eyebrow?: string;
  title?: string;
  id?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function InteractiveSection({
  eyebrow,
  title,
  id,
  aside,
  children,
}: InteractiveSectionProps) {
  return (
    <section id={id} className="interactive reveal">
      {(eyebrow ?? title) && (
        <div className="interactive-head">
          {eyebrow && <div className="geo-label">{eyebrow}</div>}
          {title && <h2 className="interactive-title">{title}</h2>}
        </div>
      )}
      <div className={aside ? 'interactive-grid' : 'interactive-solo'}>
        <div className="interactive-stage">{children}</div>
        {aside && <div className="interactive-aside">{aside}</div>}
      </div>
    </section>
  );
}
