import { useCallback, useRef, useState } from 'react';

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
              <Link
                viewTransition
                key={journey.id}
                className="card journey-card"
                to={`/journeys/${journey.id}`}
              >
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
              {picked !== null && option === quiz.answer && (
                <span className="quiz-mark" aria-hidden="true">
                  ✓
                </span>
              )}
              {picked === option && option !== quiz.answer && (
                <span className="quiz-mark" aria-hidden="true">
                  ✕
                </span>
              )}
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
  const { progress, start, resume, pause, next, previous, jumpTo, finish, reset } =
    useJourneyProgress(slug ?? 'unknown', stopCount);
  const courseRef = useRef<HTMLDivElement>(null);

  // Every travel action returns the eyes to the chart and the stop panel —
  // no manual scrolling back up after answering a quiz at the bottom.
  const scrollToCourse = useCallback(() => {
    window.setTimeout(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      courseRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 40);
  }, []);
  const travel = useCallback(
    (action: () => void) => () => {
      action();
      scrollToCourse();
    },
    [scrollToCourse],
  );

  if (!journey) {
    return (
      <div className="empty">
        No such journey.{' '}
        <Link viewTransition to="/journeys">
          Browse the journeys.
        </Link>
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
              <button
                type="button"
                className="journey-btn journey-btn--primary"
                onClick={travel(start)}
              >
                Start journey
              </button>
            )}
            {!progress.started && (progress.stop > 0 || progress.finished) && (
              <>
                <button
                  type="button"
                  className="journey-btn journey-btn--primary"
                  onClick={travel(resume)}
                >
                  Resume at stop {String(progress.stop + 1)}
                </button>
                <button type="button" className="journey-btn" onClick={travel(start)}>
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

        {travelling || progress.finished ? (
          <div className="voyage" ref={courseRef}>
            <section className="voyage-card" aria-label="Journey mode">
              <header className="voyage-head">
                <button type="button" className="voyage-exit" onClick={pause}>
                  ‹ Overview
                </button>
                <span className="k-title">{journey.title}</span>
                <span className="k-count">
                  {progress.finished
                    ? 'Complete'
                    : `Stop ${String(progress.stop + 1)} / ${String(stopCount)}`}
                </span>
              </header>

              <div className="stop-rail" aria-label="Journey progress">
                {journey.waypoints.map((stop, index) => {
                  const node = resolveWaypoint(stop);
                  const state = progress.finished
                    ? ' is-done'
                    : index === progress.stop
                      ? ' is-current'
                      : index < progress.stop
                        ? ' is-done'
                        : '';
                  return (
                    <span
                      key={`${stop.entity.type}:${stop.entity.id}`}
                      style={{ display: 'contents' }}
                    >
                      {index > 0 && (
                        <span
                          className={
                            index <= progress.stop || progress.finished
                              ? 'stop-link is-done'
                              : 'stop-link'
                          }
                        />
                      )}
                      <button
                        type="button"
                        className={`stop-dot${state}`}
                        title={node?.name ?? stop.entity.id}
                        aria-label={`Stop ${String(index + 1)}: ${node?.name ?? stop.entity.id}`}
                        aria-current={
                          !progress.finished && index === progress.stop ? 'step' : undefined
                        }
                        onClick={travel(() => {
                          jumpTo(index);
                        })}
                      >
                        {index < progress.stop || progress.finished ? '✓' : index + 1}
                      </button>
                    </span>
                  );
                })}
              </div>

              {progress.finished ? (
                <div className="voyage-body">
                  <div className="geo-label">Journey complete</div>
                  <p className="note note--lede" style={{ margin: '10px 0 0' }}>
                    You have travelled all {String(stopCount)} stops of {journey.title}. The narrows
                    ahead are endless — pick another course.
                  </p>
                </div>
              ) : (
                waypoint && (
                  <div className="voyage-body" key={progress.stop}>
                    <div className="eyebrow">
                      Stop {String(progress.stop + 1)} of {String(stopCount)} ·{' '}
                      {TYPE_LABELS[waypoint.entity.type] ?? waypoint.entity.type}
                    </div>
                    <h3 className="journey-stop-title">
                      {stopPath ? (
                        <Link viewTransition to={stopPath}>
                          {stopNode?.name}
                        </Link>
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
                      <Link viewTransition className="more-link" to={stopPath}>
                        Read the full article →
                      </Link>
                    )}
                  </div>
                )
              )}

              <div className="voyage-actions">
                {progress.finished ? (
                  <>
                    <button type="button" className="journey-btn" onClick={reset}>
                      Reset
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Link viewTransition className="journey-btn" to="/journeys">
                        All journeys
                      </Link>
                      <button
                        type="button"
                        className="journey-btn journey-btn--primary"
                        onClick={travel(start)}
                      >
                        Travel again
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="journey-btn"
                      onClick={travel(previous)}
                      disabled={progress.stop === 0}
                    >
                      ← Previous
                    </button>
                    {atLastStop ? (
                      <button
                        type="button"
                        className="journey-btn journey-btn--primary"
                        onClick={travel(finish)}
                      >
                        Finish journey
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="journey-btn journey-btn--primary"
                        onClick={travel(next)}
                      >
                        Next stop →
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            <aside className="voyage-chart">
              <JourneyMap
                journey={journey}
                currentStop={progress.stop}
                travelling={travelling}
                tileStyle={tileStyle}
              />
            </aside>
          </div>
        ) : (
          <>
            <div ref={courseRef}>
              <JourneyMap
                journey={journey}
                currentStop={progress.stop}
                travelling={false}
                tileStyle={tileStyle}
              />
            </div>

            <Section label="The stops">
              <div className="stops-preview">
                {journey.waypoints.map((stop, index) => {
                  const node = resolveWaypoint(stop);
                  return (
                    <button
                      key={`${stop.entity.type}:${stop.entity.id}`}
                      type="button"
                      className="stop-chip"
                      onClick={travel(() => {
                        jumpTo(index);
                      })}
                    >
                      <span className="journey-stop-number">{index + 1}</span>
                      <span style={{ minWidth: 0 }}>
                        <b>{node?.name ?? stop.entity.id}</b>
                        <span>{TYPE_LABELS[stop.entity.type] ?? stop.entity.type}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>
          </>
        )}

        {related.length > 0 && (
          <Section label="Related journeys">
            <div className="grid">
              {related.map((other) => (
                <Link viewTransition key={other.id} className="card" to={`/journeys/${other.id}`}>
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
