import { useCallback, useEffect, useRef, useState } from 'react';

import type { EntityRef, Image } from '@fathom/data';
import { loadImagesFor } from '@fathom/data';

import { Section } from '../atlas/components/Section';
import { MEDIA_SIZES, attributionOf, heroImage, mediaSrcSet, mediaUrl } from './media';

function MediaImage({ image, sizes }: { image: Image; sizes: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={loaded ? 'media-frame media-frame--loaded' : 'media-frame'}>
      <img
        src={mediaUrl(image.file)}
        srcSet={mediaSrcSet(image.file)}
        sizes={sizes ?? MEDIA_SIZES}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setLoaded(true);
        }}
      />
    </span>
  );
}

function Lightbox({
  images,
  index,
  onNavigate,
  onClose,
}: {
  images: readonly Image[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index];

  const step = useCallback(
    (delta: number) => {
      onNavigate((index + delta + images.length) % images.length);
    },
    [index, images.length, onNavigate],
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, step]);

  if (!image) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption ?? image.alt}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button ref={closeRef} type="button" className="lightbox-close" onClick={onClose}>
        ✕<span className="sr-only"> Close viewer</span>
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-nav--prev"
            aria-label="Previous image"
            onClick={() => {
              step(-1);
            }}
          >
            ←
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-nav--next"
            aria-label="Next image"
            onClick={() => {
              step(1);
            }}
          >
            →
          </button>
        </>
      )}
      <figure>
        <img src={mediaUrl(image.file)} srcSet={mediaSrcSet(image.file)} alt={image.alt} />
        <figcaption>
          {image.caption ? <span>{image.caption} · </span> : null}
          <span className="lightbox-attribution">{attributionOf(image)}</span>
        </figcaption>
      </figure>
    </div>
  );
}

/** Hero image plus thumbnail gallery with a fullscreen viewer. */
export function MediaGallery({ images }: { images: readonly Image[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hero = heroImage(images);
  if (images.length === 0 || !hero) return null;

  const rest = images.filter((image) => image.id !== hero.id);

  return (
    <Section label="Gallery">
      <div className="media-gallery">
        <button
          type="button"
          className="media-hero"
          onClick={() => {
            setOpenIndex(images.indexOf(hero));
          }}
        >
          <MediaImage image={hero} sizes="(max-width: 640px) 100vw, 720px" />
          <span className="media-attribution">{attributionOf(hero)}</span>
        </button>
        {rest.length > 0 && (
          <div className="media-thumbs">
            {rest.map((image) => (
              <button
                key={image.id}
                type="button"
                className="media-thumb"
                onClick={() => {
                  setOpenIndex(images.indexOf(image));
                }}
              >
                <MediaImage image={image} sizes="160px" />
              </button>
            ))}
          </div>
        )}
      </div>
      {openIndex !== null && (
        <Lightbox
          images={images}
          index={openIndex}
          onNavigate={setOpenIndex}
          onClose={() => {
            setOpenIndex(null);
          }}
        />
      )}
    </Section>
  );
}

/** Gallery for everything depicting an entity; renders nothing when empty. */
export function EntityGallery({ entity }: { entity: EntityRef }) {
  const images = loadImagesFor(entity);
  return <MediaGallery images={images} />;
}
