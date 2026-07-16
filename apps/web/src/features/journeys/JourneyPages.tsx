import { useState } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId as canonicalId, getEntity, loadImages } from '@fathom/data';
import {
  loadJourneys,
  relatedJourneys,
  resolveWaypoint,
  type Journey,
  type JourneyQuiz,
  type JourneyWaypoint,
  findJourney,
} from '@fathom/discovery';

import type { LayoutContext } from '../../app/RootLayout';
import { Breadcrumbs } from '../atlas/components/Breadcrumbs';
import { Section } from '../atlas/components/Section';
import { SeoTags } from '../atlas/components/SeoTags';
import { entityPath } from '../atlas/lib/entityPaths';
import { attributionOf, mediaUrl } from '../media/media';
import { JourneyMap } from './JourneyMap';
import { useJourneyProgress } from './useJourneyProgress';

const DIFFICULTY_LABELS: Record<Journey['difficulty'], string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  demanding: 'Demanding',
};

function coverOf(journey: Journey) {
  if (!journey.coverImageId) return null;
  return loadImages().find((image) => image.id === journey.coverImageId) ?? null;
}

// --- Journeys index ---------------------------------------------------------

export function JourneysPage() {
  const journeys = loadJourneys();
  return (
    <>
      <SeoTags
        title="Journeys — Fathom"
        description="Guided voyages through the world's straits, seas, and canals."
        path="/journeys"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journeys' }]} />
      <article className="detail">
        <header className="strait-hero">
          <div className="eyebrow">Guided journeys</div>
          <h2 className="detail-title detail-title--hero">Voyages through the narrows</h2>
          <p className="note note--lede">
            Ordered passages through the atlas — start a journey and travel stop by stop across the
            maritime world.
          </p>
        </header>
        <div className="grid">
          {journeys.map((journey) => {
            const cover = coverOf(journey);
            return (
              <Link key={journey.id} className="card journey-card" to={`/journeys/${journey.id}`}>
                {cover && (
                  <img
                    className="journey-card-cover"
                    src={mediaUrl(cover.file)}
                    alt={cover.alt}
                    loading="lazy"
                  />
                )}
                <div className="eyebrow">
                  {String(journey.waypoints.length)} stops · {DIFFICULTY_LABELS[journey.difficulty]}{' '}
                  · ~{String(journey.estimatedMinutes)} min
                </div>
                <h3>{journey.title}</h3>
                <div className="note">{journey.subtitle}</div>
              </Link>
            );
          })}
        </div>
      </article>
    </>
  );
}

// --- Journey detail + Journey Mode ------------------------------------------

function QuizBlock({ quiz }: { quiz: JourneyQuiz }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="stop-quiz">
      <div className="geo-label">Quick quiz</div>
      <p className="quiz-prompt">{quiz.prompt}</p>
      <div className="quiz-options">
        {quiz.options.map((option, index) => {
          const state =
            picked === null
              ? ''
              : option === quiz.answer
                ? ' quiz-option--correct'
                : option === picked
                  ? ' quiz-option--wrong'
                  : '';
          return (
            <button
              key={option}
              type="button"
              className={`quiz-option${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(option);
              }}
            >
              <i className="quiz-letter">{'ABCD'[index]}</i>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The factual context for a stop, straight from the entity's document. */
function stopContext(waypoint: JourneyWaypoint): string | null {
  const node = getEntity(canonicalId(waypoint.entity.type, waypoint.entity.id));
  if (!node) return null;
  const data = node.data as { note?: unknown; summary?: unknown };
  if (typeof data.note === 'string') return data.note;
  if (typeof data.summary === 'string') return data.summary;
  return null;
}

const TYPE_LABELS: Record<string, string> = {
  strait: 'Strait',
  'water-body': 'Waters',
  country: 'Country',
  port: 'Port',
  canal: 'Canal',
  bridge: 'Bridge',
  tunnel: 'Tunnel',
  island: 'Island',
  'maritime-route': 'Route',
};

export function JourneyDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const journey = findJourney(slug);
  const stopCount = journey?.waypoints.length ?? 0;
  const { progress, start, resume, next, previous, jumpTo, finish, reset } = useJourneyProgress(
    slug ?? 'unknown',
    stopCount,
  );

  if (!journey) {
    return (
      <div className="empty">
        No such journey. <Link to="/journeys">Browse the journeys.</Link>
      </div>
    );
  }

  const cover = coverOf(journey);
  const related = relatedJourneys(journey, loadJourneys());
  const waypoint = journey.waypoints[progress.stop];
  const stopNode = waypoint ? resolveWaypoint(waypoint) : null;
  const stopPath = stopNode ? entityPath(stopNode) : null;
  const atLastStop = progress.stop >= stopCount - 1;
  const travelling = progress.started && !progress.finished;

  return (
    <>
      <SeoTags
        title={`${journey.title} — Fathom`}
        description={journey.subtitle}
        path={`/journeys/${journey.id}`}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Journeys', to: '/journeys' },
          { label: journey.title },
        ]}
      />
      <article className="detail">
        <header className="strait-hero journey-hero">
          {cover && (
            <div className="journey-hero-media">
              <img src={mediaUrl(cover.file)} alt={cover.alt} />
              <span className="media-attribution">{attributionOf(cover)}</span>
            </div>
          )}
          <div className="eyebrow">
            Guided journey · {DIFFICULTY_LABELS[journey.difficulty]} · ~
            {String(journey.estimatedMinutes)} min · {String(stopCount)} stops
          </div>
          <h2 className="detail-title detail-title--hero">{journey.title}</h2>
          <div className="connects">{journey.subtitle}</div>
          <p className="note note--lede">{journey.description}</p>
          <div className="journey-actions">
            {!progress.started && progress.stop === 0 && !progress.finished && (
              <button type="button" className="journey-btn journey-btn--primary" onClick={start}>
                Start journey
              </button>
            )}
            {!progress.started && (progress.stop > 0 || progress.finished) && (
              <>
                <button type="button" className="journey-btn journey-btn--primary" onClick={resume}>
                  Resume at stop {String(progress.stop + 1)}
                </button>
                <button type="button" className="journey-btn" onClick={start}>
                  Start over
                </button>
              </>
            )}
            {progress.finished && progress.started && (
              <button type="button" className="journey-btn" onClick={reset}>
                Reset journey
              </button>
            )}
          </div>
        </header>

        <JourneyMap
          journey={journey}
          currentStop={progress.stop}
          travelling={travelling}
          tileStyle={tileStyle}
        />

        <div className="journey-mode">
          <ol className="journey-stops" aria-label="Journey progress">
            {journey.waypoints.map((stop, index) => {
              const node = resolveWaypoint(stop);
              const state = travelling
                ? index === progress.stop
                  ? ' is-current'
                  : index < progress.stop
                    ? ' is-done'
                    : ''
                : progress.finished
                  ? ' is-done'
                  : '';
              return (
                <li key={`${stop.entity.type}:${stop.entity.id}`}>
                  <button
                    type="button"
                    className={`journey-stop${state}`}
                    onClick={() => {
                      jumpTo(index);
                    }}
                  >
                    <span className="journey-stop-number">{index + 1}</span>
                    <span>
                      <span className="journey-stop-name">{node?.name ?? stop.entity.id}</span>
                      <span className="journey-stop-type">
                        {TYPE_LABELS[stop.entity.type] ?? stop.entity.type}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="journey-panel">
            {!progress.started && !progress.finished ? (
              <div className="journey-intro">
                <p className="note note--lede">
                  {String(stopCount)} stops, about {String(journey.estimatedMinutes)} minutes. Start
                  the journey to travel the course stop by stop — the chart follows you.
                </p>
                <button type="button" className="journey-btn journey-btn--primary" onClick={start}>
                  Start journey
                </button>
              </div>
            ) : progress.finished ? (
              <div className="journey-intro">
                <div className="geo-label">Journey complete</div>
                <p className="note note--lede">
                  You have travelled all {String(stopCount)} stops of {journey.title}. The narrows
                  ahead are endless — pick another course.
                </p>
                <div className="journey-actions">
                  <button
                    type="button"
                    className="journey-btn journey-btn--primary"
                    onClick={start}
                  >
                    Travel again
                  </button>
                  <Link className="journey-btn" to="/journeys">
                    All journeys
                  </Link>
                </div>
              </div>
            ) : (
              waypoint && (
                <div className="journey-stop-panel" key={progress.stop}>
                  <div className="eyebrow">
                    Stop {String(progress.stop + 1)} of {String(stopCount)} ·{' '}
                    {TYPE_LABELS[waypoint.entity.type] ?? waypoint.entity.type}
                  </div>
                  <h3 className="journey-stop-title">
                    {stopPath ? (
                      <Link to={stopPath}>{stopNode?.name}</Link>
                    ) : (
                      (stopNode?.name ?? waypoint.entity.id)
                    )}
                  </h3>
                  <p className="journey-leg">{waypoint.summary}</p>
                  {stopContext(waypoint) && <p className="note">{stopContext(waypoint)}</p>}
                  {waypoint.note && <p className="note">{waypoint.note}</p>}
                  {waypoint.challenge && (
                    <div className="stop-challenge">
                      <div className="geo-label">Challenge</div>
                      <p className="note">{waypoint.challenge}</p>
                    </div>
                  )}
                  {waypoint.quiz && <QuizBlock quiz={waypoint.quiz} />}
                  {stopPath && (
                    <Link className="more-link" to={stopPath}>
                      Read the full article →
                    </Link>
                  )}
                  <div className="journey-actions journey-actions--nav">
                    <button
                      type="button"
                      className="journey-btn"
                      onClick={previous}
                      disabled={progress.stop === 0}
                    >
                      ← Previous
                    </button>
                    {atLastStop ? (
                      <button
                        type="button"
                        className="journey-btn journey-btn--primary"
                        onClick={finish}
                      >
                        Finish journey
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="journey-btn journey-btn--primary"
                        onClick={next}
                      >
                        Next stop →
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {related.length > 0 && (
          <Section label="Related journeys">
            <div className="grid">
              {related.map((other) => (
                <Link key={other.id} className="card" to={`/journeys/${other.id}`}>
                  <div className="eyebrow">
                    {String(other.waypoints.length)} stops · {DIFFICULTY_LABELS[other.difficulty]}
                  </div>
                  <h3>{other.title}</h3>
                  <div className="note">{other.subtitle}</div>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </article>
    </>
  );
}
