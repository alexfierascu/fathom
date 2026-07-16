import { Link } from 'react-router';

import { loadAllStraits, loadImages, loadImagesFor, loadStrait, type Image } from '@fathom/data';
import { loadJourneys } from '@fathom/discovery';

import { straitOfTheDay } from '../atlas/lib/discovery';
import { attributionOf, mediaUrl } from '../media/media';

/**
 * The homepage's six calm moments. Each block answers one question and
 * offers one action — the browsing depth lives on /explore, /map, and
 * /learn instead.
 */

const dayIndex = (length: number) => Math.floor(Date.now() / 86_400_000) % Math.max(length, 1);

function Attribution({ image }: { image: Image }) {
  return <span className="media-attribution">{attributionOf(image)}</span>;
}

export function HomeHero() {
  const straitCount = loadAllStraits().length;
  const hero = loadImagesFor({ type: 'strait', id: 'gibraltar' })[0];
  return (
    <section className="home-hero">
      {hero && (
        <div
          className="home-hero-media"
          style={{ backgroundImage: `url(${mediaUrl(hero.file)})` }}
          role="img"
          aria-label={hero.alt}
        />
      )}
      <div className="home-hero-content">
        <div className="eyebrow">The interactive atlas of the world's straits</div>
        <h2 className="home-hero-title">
          Where oceans meet
          <br />
          and history turns.
        </h2>
        <p className="home-hero-lede">
          {straitCount} narrow waterways, mapped and sourced — explore how the world's oceans,
          countries, and centuries connect through them.
        </p>
        <div className="home-hero-actions">
          <Link className="hero-btn hero-btn--primary" to="/explore">
            Start exploring
          </Link>
          <Link className="hero-btn" to="/map">
            Open the map
          </Link>
        </div>
      </div>
      {hero && <Attribution image={hero} />}
    </section>
  );
}

export function ModeCards() {
  return (
    <section className="mode-cards" aria-label="Ways to explore">
      <Link className="mode-card" to="/explore">
        <h3>Explore</h3>
        <p>Browse the world's waterways.</p>
      </Link>
      <Link className="mode-card" to="/journeys">
        <h3>Journeys</h3>
        <p>Follow curated expeditions.</p>
      </Link>
      <Link className="mode-card" to="/learn">
        <h3>Learn</h3>
        <p>Collections, quizzes, and stories.</p>
      </Link>
    </section>
  );
}

export function FeaturedJourneyCinematic() {
  const journeys = loadJourneys();
  const journey = journeys[dayIndex(journeys.length)];
  if (!journey) return null;
  const cover = journey.coverImageId
    ? loadImages().find((image) => image.id === journey.coverImageId)
    : undefined;

  return (
    <section className="cinematic" aria-label="Featured journey">
      {cover && (
        <div
          className="cinematic-media"
          style={{ backgroundImage: `url(${mediaUrl(cover.file)})` }}
        />
      )}
      <div className="cinematic-content">
        <div className="eyebrow">Featured journey</div>
        <h3 className="cinematic-title">{journey.title}</h3>
        <p className="cinematic-lede">{journey.description}</p>
        <div className="home-hero-actions">
          <Link className="hero-btn hero-btn--primary" to={`/journeys/${journey.id}`}>
            Start journey
          </Link>
          <span className="cinematic-meta">
            {String(journey.waypoints.length)} stops · ~{String(journey.estimatedMinutes)} min
          </span>
        </div>
      </div>
      {cover && <Attribution image={cover} />}
    </section>
  );
}

export function FeaturedStrait() {
  const strait = straitOfTheDay();
  if (!strait) return null;
  const image = loadImagesFor({ type: 'strait', id: strait.id })[0];

  return (
    <section className="cinematic cinematic--strait" aria-label="Featured strait">
      {image && (
        <div
          className="cinematic-media"
          style={{ backgroundImage: `url(${mediaUrl(image.file)})` }}
        />
      )}
      <div className="cinematic-content">
        <div className="eyebrow">Strait of the day · {strait.region}</div>
        <h3 className="cinematic-title">{strait.name}</h3>
        <p className="cinematic-lede">{strait.note}</p>
        <div className="home-hero-actions">
          <Link className="hero-btn" to={`/straits/${strait.id}`}>
            Explore this strait
          </Link>
        </div>
      </div>
      {image && <Attribution image={image} />}
    </section>
  );
}

/** One beautiful fact — not a statistics dashboard. */
const FACT_STRAIT_IDS = ['hormuz', 'malacca', 'denmark'];

export function OneFact() {
  const id = FACT_STRAIT_IDS[dayIndex(FACT_STRAIT_IDS.length)];
  if (!id) return null;
  const strait = loadStrait(id);
  return (
    <section className="one-fact" aria-label="Did you know">
      <div className="eyebrow">Did you know?</div>
      <blockquote>
        <p>{strait.note}</p>
        <footer>
          — <Link to={`/straits/${strait.id}`}>{strait.name}</Link>
        </footer>
      </blockquote>
    </section>
  );
}
