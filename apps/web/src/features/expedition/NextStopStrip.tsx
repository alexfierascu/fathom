import { loadImagesFor, type EntityType } from '@fathom/data';

import { formatDistance } from '../atlas/lib/units';
import { mediaUrl } from '../media/media';

interface NextStopStripProps {
  name: string;
  entityType: string;
  entityId: string;
  teaser: string;
  km: number | null;
  bearing: string | null;
  final?: boolean;
  onGo: () => void;
}

/**
 * The cinematic way forward: where next, how far, which way, and one
 * line to make you want it.
 */
export function NextStopStrip({
  name,
  entityType,
  entityId,
  teaser,
  km,
  bearing,
  final = false,
  onGo,
}: NextStopStripProps) {
  const image =
    entityType === 'journey'
      ? undefined
      : loadImagesFor({ type: entityType as EntityType, id: entityId })[0];
  const meta = [km !== null ? formatDistance(km) : null, bearing ? `heading ${bearing}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <button type="button" className="next-strip" onClick={onGo}>
      {image && (
        <span
          className="next-strip-thumb"
          style={{ backgroundImage: `url(${mediaUrl(image.file)})` }}
          aria-hidden="true"
        />
      )}
      <span className="next-strip-body">
        <span className="geo-label">
          {final ? 'Journey’s end' : `Next stop${meta ? ` · ${meta}` : ''}`}
        </span>
        <b>{name}</b>
        <span className="next-strip-teaser">{teaser}</span>
      </span>
      <span className="next-strip-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
