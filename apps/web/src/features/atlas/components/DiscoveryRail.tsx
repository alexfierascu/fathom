import { Link } from 'react-router';

/**
 * A Netflix-style rail: a titled row of large, immersive tiles you scroll
 * through sideways. Each tile is a place to sail to — a photograph (or a
 * calm gradient when there is none) under its name.
 */

export interface RailItem {
  key: string;
  name: string;
  to: string;
  image?: string;
  imageSrcSet?: string;
  meta?: string;
}

interface DiscoveryRailProps {
  eyebrow?: string;
  title: string;
  items: readonly RailItem[];
}

export function DiscoveryRail({ eyebrow, title, items }: DiscoveryRailProps) {
  if (items.length === 0) return null;
  return (
    <section className="rail reveal">
      <div className="rail-head">
        {eyebrow && <div className="geo-label">{eyebrow}</div>}
        <h2 className="rail-title">{title}</h2>
      </div>
      <div className="rail-track">
        {items.map((item) => (
          <Link viewTransition key={item.key} className="rail-tile" to={item.to}>
            <span className="rail-tile-media" aria-hidden="true">
              {item.image ? (
                <img
                  src={item.image}
                  srcSet={item.imageSrcSet}
                  sizes="320px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="rail-tile-fallback" />
              )}
              <span className="rail-tile-grad" />
            </span>
            <span className="rail-tile-text">
              {item.meta && <span className="rail-tile-meta">{item.meta}</span>}
              <b>{item.name}</b>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
