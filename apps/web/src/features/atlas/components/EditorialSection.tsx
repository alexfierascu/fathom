import type { ReactNode } from 'react';

/**
 * A story block: one spacious, readable editorial passage — a label, a
 * heading, and prose given room to breathe. This is how the atlas tells
 * a place's story instead of dumping its facts.
 */
interface EditorialSectionProps {
  eyebrow?: string;
  title?: string;
  id?: string;
  /** A wider column for pull-quote or lede treatments. */
  wide?: boolean;
  children: ReactNode;
}

export function EditorialSection({ eyebrow, title, id, wide, children }: EditorialSectionProps) {
  return (
    <section id={id} className="editorial reveal">
      <div className={wide ? 'editorial-inner editorial-inner--wide' : 'editorial-inner'}>
        {eyebrow && <div className="geo-label">{eyebrow}</div>}
        {title && <h2 className="editorial-title">{title}</h2>}
        <div className="editorial-body">{children}</div>
      </div>
    </section>
  );
}
