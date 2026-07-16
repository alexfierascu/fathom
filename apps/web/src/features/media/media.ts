import type { Image } from '@fathom/data';

/**
 * Media-store conventions. An Image record's `file` is a path inside the
 * media store, served under /media. Responsive variants live under
 * width-prefixed folders (/media/480/…, /media/960/…), produced by the
 * media pipeline; browsers fall back to the original when a variant is
 * missing.
 */
export function mediaUrl(file: string): string {
  return `/media/${file}`;
}

/**
 * Until a width-variant pipeline exists, the original is the only srcset
 * candidate — a 404ing variant would break the image entirely.
 */
export function mediaSrcSet(file: string): string {
  return `/media/${file} 1280w`;
}

/** The image shown first: the representative one, else the first. */
export function heroImage(images: readonly Image[]): Image | undefined {
  return images.find((image) => image.role === 'representative') ?? images[0];
}

/** Attribution line, always shown with an image (DATA_MODEL.md rule). */
export function attributionOf(image: Image): string {
  return `${image.credit} · ${image.license}`;
}
