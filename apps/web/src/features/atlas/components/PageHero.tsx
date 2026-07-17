import type { ReactNode } from 'react';

/**
 * The opening frame of every page: a near-fullscreen cinematic hero.
 * Large photography behind an editorial title, a whisper of a subtitle,
 * a few metadata pills, and at most two actions — nothing else. The
 * design language is the landing page's, applied to every entity.
 */
interface PageHeroProps {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  image?: string;
  imageSrcSet?: string;
  imageAlt?: string;
  pills?: ReactNode;
  actions?: ReactNode;
  /** Extra hero content (e.g. a connections line) below the pills. */
  children?: ReactNode;
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageSrcSet,
  imageAlt,
  pills,
  actions,
  children,
}: PageHeroProps) {
  return (
    <header className={image ? 'page-hero page-hero--image' : 'page-hero'}>
      {image && (
        <div className="page-hero-media" aria-hidden="true">
          <img
            src={image}
            srcSet={imageSrcSet}
            sizes="100vw"
            alt={imageAlt ?? ''}
            fetchPriority="high"
            decoding="async"
          />
          <span className="page-hero-scrim" />
        </div>
      )}
      <div className="page-hero-inner">
        {eyebrow && <div className="page-hero-eyebrow">{eyebrow}</div>}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {pills && <div className="page-hero-pills">{pills}</div>}
        {children}
        {actions && <div className="page-hero-actions">{actions}</div>}
      </div>
    </header>
  );
}
