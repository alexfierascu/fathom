import { useCallback, useEffect, useRef, useState } from 'react';

import { Link, useOutletContext, useParams, useSearchParams } from 'react-router';

import {
  entityId as canonicalId,
  getEntity,
  loadHistoricalEvents,
  loadImages,
  loadImagesFor,
  loadSourcesFor,
  loadStatisticsFor,
  loadStrait,
} from '@fathom/data';
import {
  bearingWord,
  chartChallengeFor,
  eventYearQuiz,
  straitQuiz,
  legBetween,
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
import { PageHero } from '../atlas/components/PageHero';
import { Section } from '../atlas/components/Section';
import { SeoTags } from '../atlas/components/SeoTags';
import { entityPath } from '../atlas/lib/entityPaths';
import { formatDateValue } from '../atlas/lib/format';
import { CompareStop } from '../expedition/CompareStop';
import { ConnectionCards } from '../expedition/ConnectionCards';
import { JourneyChain } from '../expedition/JourneyChain';
import { NextStopStrip } from '../expedition/NextStopStrip';
import { Tabs, type TabSpec } from '../expedition/Tabs';
import { useT } from '../i18n/locale';
import { EntityGallery } from '../media/MediaGallery';
import { attributionOf, mediaSrcSet, mediaUrl } from '../media/media';
import { JourneyMap } from './JourneyMap';
import { useJourneyLog } from './useJourneyLog';
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
  const heroCover = journeys.map(coverOf).find((cover) => cover !== null) ?? null;
  const first = journeys[0];
  return (
    <>
      <SeoTags
        title="Journeys — Fathom"
        description="Guided voyages through the world's straits, seas, and canals."
        path="/journeys"
      />
      <article>
        <PageHero
          eyebrow="Guided journeys"
          title="Voyages through the narrows"
          subtitle="Ordered passages through the atlas — begin a journey and travel it stop by stop, from open ocean to the narrows that shaped history."
          image={heroCover ? mediaUrl(heroCover.file) : undefined}
          imageSrcSet={heroCover ? mediaSrcSet(heroCover.file) : undefined}
          actions={
            first ? (
              <>
                <Link
                  viewTransition
                  className="uc-btn uc-btn--primary"
                  to={`/journeys/${first.id}`}
                >
                  Begin a journey
                </Link>
                <Link viewTransition className="uc-btn uc-btn--ghost" to="/daily">
                  Today&rsquo;s expedition ⚓
                </Link>
              </>
            ) : undefined
          }
        />

        <section className="reveal journey-index">
          <div className="journey-index-grid">
            {journeys.map((journey) => {
              const cover = coverOf(journey);
              return (
                <Link
                  viewTransition
                  key={journey.id}
                  className="journey-tile"
                  to={`/journeys/${journey.id}`}
                >
                  <span className="journey-tile-media" aria-hidden="true">
                    {cover && (
                      <img
                        src={mediaUrl(cover.file)}
                        srcSet={mediaSrcSet(cover.file)}
                        sizes="(max-width: 760px) 100vw, 460px"
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="journey-tile-grad" />
                  </span>
                  <span className="journey-tile-body">
                    <span className="journey-tile-meta">
                      {String(journey.waypoints.length)} stops ·{' '}
                      {DIFFICULTY_LABELS[journey.difficulty]} · ~{String(journey.estimatedMinutes)}{' '}
                      min
                    </span>
                    <b>{journey.title}</b>
                    <span className="journey-tile-sub">{journey.subtitle}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </article>
    </>
  );
}

// --- Journey detail + Journey Mode ------------------------------------------

function QuizBlock({
  quiz,
  onResult,
}: {
  quiz: JourneyQuiz;
  onResult?: (correct: boolean) => void;
}) {
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
                onResult?.(option === quiz.answer);
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

/** Five questions, one after another; four right earns the gold stamp. */
function ExamBlock({
  questions,
  onDone,
}: {
  questions: readonly JourneyQuiz[];
  onDone: (score: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const question = questions[index];
  if (!question) return null;

  return (
    <div className="stop-quiz" style={{ marginTop: 14 }}>
      <div className="geo-label">
        Exam — question {String(index + 1)} of {String(questions.length)} · {String(score)} correct
      </div>
      <QuizBlock
        key={index}
        quiz={question}
        onResult={(correct) => {
          if (correct) setScore((s) => s + 1);
          setAnswered(true);
        }}
      />
      {answered && (
        <div className="journey-actions" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="journey-btn journey-btn--primary"
            onClick={() => {
              if (index + 1 >= questions.length) {
                onDone(score);
              } else {
                setIndex((i) => i + 1);
                setAnswered(false);
              }
            }}
          >
            {index + 1 >= questions.length ? 'Finish exam' : 'Next question →'}
          </button>
        </div>
      )}
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

const METRIC_LABELS: Record<string, string> = {
  'oil-transit': 'Oil moved through',
};

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

interface JourneyExperienceProps {
  journey: Journey;
  /** Storage key for progress and the voyage log. */
  journeyKey: string;
  /** Canonical path for SEO. */
  path: string;
  crumbs: readonly { label: string; to?: string }[];
  /** Deep-linked stop (0-based) — starts the voyage there. */
  initialStop?: number;
}

/** The full journey experience — catalog voyages and generated ones alike. */
export function JourneyExperience({
  journey,
  journeyKey,
  path,
  crumbs,
  initialStop,
}: JourneyExperienceProps) {
  const { tileStyle } = useOutletContext<LayoutContext>();
  const t = useT();
  const stopCount = journey.waypoints.length;
  const { progress, start, resume, pause, next, previous, jumpTo, finish, reset } =
    useJourneyProgress(journeyKey, stopCount, initialStop);
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
  const { log, logQuiz, logChallenge, logExam, resetLog } = useJourneyLog(journeyKey);
  const [copiedStop, setCopiedStop] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  // Keyboard sailing: arrow keys move the voyage while travelling.
  const travellingRef = useRef(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!travellingRef.current || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
        scrollToCourse();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
        scrollToCourse();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [next, previous, scrollToCourse]);
  const [challengeRun, setChallengeRun] = useState<{ stop: number; solved: string[] } | null>(null);

  const cover = coverOf(journey);
  const related = relatedJourneys(journey, loadJourneys());
  const waypoint = journey.waypoints[progress.stop];
  const stopNode = waypoint ? resolveWaypoint(waypoint) : null;
  const stopPath = stopNode ? entityPath(stopNode) : null;
  const travelling = progress.started && !progress.finished;
  useEffect(() => {
    travellingRef.current = travelling;
  });

  // ----- The stop as a chapter: everything below derives from data -----
  const seeded = (seed: number) => {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  };
  const stopKey = waypoint ? `${waypoint.entity.type}:${waypoint.entity.id}` : null;
  const stopEvents = waypoint
    ? loadHistoricalEvents().filter((event) =>
        event.involves.some(
          (ref) => ref.type === waypoint.entity.type && ref.id === waypoint.entity.id,
        ),
      )
    : [];
  const stopImages = waypoint
    ? loadImagesFor({ type: waypoint.entity.type, id: waypoint.entity.id })
    : [];
  const stopImage = stopImages[0];
  const straitDoc = stopNode?.type === 'strait' ? loadStrait(stopNode.id) : undefined;
  const historyQuiz =
    stopEvents[0] !== undefined
      ? eventYearQuiz(stopEvents[0], seeded(progress.stop * 31 + 7))
      : null;
  const chainItems = journey.waypoints.map((stop, index) => ({
    id: `${stop.entity.type}:${stop.entity.id}`,
    name: resolveWaypoint(stop)?.name ?? stop.entity.id,
    state:
      index < progress.stop
        ? ('done' as const)
        : index === progress.stop
          ? ('current' as const)
          : ('ahead' as const),
  }));

  const nextWaypoint = journey.waypoints[progress.stop + 1];
  const nextNode = nextWaypoint ? resolveWaypoint(nextWaypoint) : null;
  const nextPreview =
    nextWaypoint && nextNode
      ? {
          name: nextNode.name,
          type: nextWaypoint.entity.type,
          id: nextWaypoint.entity.id,
          teaser: nextWaypoint.summary,
          km: legBetween(journey.id, progress.stop, progress.stop + 1).km,
          bearing:
            stopNode?.lat !== undefined &&
            stopNode.lon !== undefined &&
            nextNode.lat !== undefined &&
            nextNode.lon !== undefined
              ? bearingWord(
                  { lat: stopNode.lat, lon: stopNode.lon },
                  { lat: nextNode.lat, lon: nextNode.lon },
                )
              : null,
        }
      : null;

  const chartChallenge = waypoint ? chartChallengeFor(waypoint.entity) : null;
  const challengeDone = log.challenges[String(progress.stop)] === true;
  const challengeActive =
    chartChallenge !== null && challengeRun !== null && challengeRun.stop === progress.stop;
  const correctIds = chartChallenge
    ? chartChallenge.targets.filter((target) => target.correct).map((target) => target.id)
    : [];
  const challengeProp =
    challengeActive && chartChallenge && challengeRun
      ? {
          spec: chartChallenge,
          solved: challengeRun.solved,
          onHit: (id: string, correct: boolean) => {
            if (!correct) return;
            const solved = [...challengeRun.solved, id];
            setChallengeRun({ stop: progress.stop, solved });
            if (correctIds.every((target) => solved.includes(target))) {
              logChallenge(progress.stop);
              window.setTimeout(() => {
                setChallengeRun(null);
              }, 1500);
            }
          },
        }
      : null;
  const beginFresh = travel(() => {
    resetLog();
    setChallengeRun(null);
    start();
  });

  const stopStats = waypoint
    ? loadStatisticsFor({ type: waypoint.entity.type, id: waypoint.entity.id })
    : [];

  // The end-of-voyage exam: five data-grounded questions from the stops.
  const examQuestions = (() => {
    const rng = seeded(journey.id.length * 977 + stopCount * 31);
    const pool: JourneyQuiz[] = [];
    for (const stop of journey.waypoints) {
      if (stop.entity.type === 'strait') {
        const question = straitQuiz(stop.entity.id, rng);
        if (question) pool.push(question);
      }
      for (const event of loadHistoricalEvents().filter((candidate) =>
        candidate.involves.some(
          (involved) => involved.type === stop.entity.type && involved.id === stop.entity.id,
        ),
      )) {
        const question = eventYearQuiz(event, rng);
        if (question) pool.push(question);
      }
    }
    const unique = [...new Map(pool.map((question) => [question.prompt, question])).values()];
    return unique.slice(0, 5);
  })();

  const stopTabs: TabSpec[] = [];
  if (waypoint && stopNode && stopKey) {
    stopTabs.push({
      key: 'story',
      label: 'Story',
      content: (
        <>
          {stopImage && (
            <div
              className="xp-hero"
              style={{ backgroundImage: `url(${mediaUrl(stopImage.file)})` }}
            >
              <span className="media-attribution">{attributionOf(stopImage)}</span>
            </div>
          )}
          <JourneyChain
            items={chainItems}
            onSelect={(index) => {
              travel(() => {
                jumpTo(index);
              })();
            }}
          />
          <p className="journey-leg">{waypoint.summary}</p>
          {stopContext(waypoint) && <p className="note">{stopContext(waypoint)}</p>}
          {waypoint.note && <p className="note">{waypoint.note}</p>}
          {(chartChallenge ?? waypoint.challenge) && (
            <div className="stop-challenge">
              <div className="geo-label">Challenge</div>
              <p className="note">{chartChallenge ? chartChallenge.prompt : waypoint.challenge}</p>
              {chartChallenge &&
                (challengeDone ? (
                  <span className="chip chip--teal">Completed on the chart ✓</span>
                ) : challengeActive ? (
                  <span className="chip chip--on">
                    Look at the chart — {String(challengeRun?.solved.length ?? 0)} of{' '}
                    {String(correctIds.length)} found
                  </span>
                ) : (
                  <button
                    type="button"
                    className="journey-btn"
                    onClick={() => {
                      setChallengeRun({ stop: progress.stop, solved: [] });
                    }}
                  >
                    Try it on the chart →
                  </button>
                ))}
            </div>
          )}
          {waypoint.quiz && (
            <QuizBlock
              quiz={waypoint.quiz}
              onResult={(correct) => {
                logQuiz(`${String(progress.stop)}:story`, correct);
              }}
            />
          )}
          {stopPath && (
            <Link viewTransition className="more-link" to={stopPath}>
              Read the full article →
            </Link>
          )}
        </>
      ),
    });
    stopTabs.push({
      key: 'connections',
      label: 'Connections',
      content: <ConnectionCards entityKey={stopKey} />,
    });
    if (stopEvents.length > 0) {
      stopTabs.push({
        key: 'history',
        label: 'History',
        content: (
          <>
            <ol className="timeline timeline--compact">
              {stopEvents.map((event) => (
                <li key={event.id} className="timeline-event">
                  <div className="timeline-year">{formatDateValue(event.date)}</div>
                  <div className="timeline-body">
                    <h3>{event.name}</h3>
                    <p className="note">{event.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
            {historyQuiz && (
              <QuizBlock
                quiz={historyQuiz}
                onResult={(correct) => {
                  logQuiz(`${String(progress.stop)}:history`, correct);
                }}
              />
            )}
          </>
        ),
      });
    }
    if (straitDoc) {
      stopTabs.push({
        key: 'compare',
        label: 'Compare',
        content: <CompareStop strait={straitDoc} />,
      });
    }
    if (stopImages.length > 0) {
      stopTabs.push({
        key: 'gallery',
        label: 'Gallery',
        content: <EntityGallery entity={{ type: waypoint.entity.type, id: waypoint.entity.id }} />,
      });
    }
    if (stopStats.length > 0) {
      stopTabs.push({
        key: 'numbers',
        label: 'Numbers',
        content: (
          <div className="stat-cards">
            {stopStats.map((stat) => (
              <div key={`${stat.metric}-${stat.period}`} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-unit">{stat.unit}</div>
                <div className="geo-label">
                  {METRIC_LABELS[stat.metric] ?? stat.metric} · {stat.period} ·{' '}
                  {loadSourcesFor(stat)[0]?.publisher ?? 'sourced'}
                </div>
                {stat.notes && <p className="stat-notes">{stat.notes}</p>}
              </div>
            ))}
          </div>
        ),
      });
    }
    {
      const quizEntries = Object.values(log.quiz);
      const quizCorrect = quizEntries.filter(Boolean).length;
      const challengesDone = Object.keys(log.challenges).length;
      stopTabs.push({
        key: 'notes',
        label: 'Notes',
        content: (
          <div>
            <div className="log-tally">
              <span className="chip">
                Stops {String(progress.stop + 1)} / {String(stopCount)}
              </span>
              <span className="chip chip--teal">
                Quizzes {String(quizCorrect)} / {String(quizEntries.length)}
              </span>
              <span className="chip chip--on">Chart challenges {String(challengesDone)}</span>
            </div>
            <ol className="log-rows">
              {journey.waypoints.slice(0, progress.stop + 1).map((stop) => {
                const node = resolveWaypoint(stop);
                return (
                  <li key={`${stop.entity.type}:${stop.entity.id}`}>
                    <b>{node?.name ?? stop.entity.id}</b>
                    <span>{stopContext(stop) ?? stop.summary}</span>
                  </li>
                );
              })}
            </ol>
            {nextPreview && (
              <p className="log-ahead">
                Ahead: <b>{nextPreview.name}</b> — {nextPreview.teaser}
              </p>
            )}
          </div>
        ),
      });
    }
  }
  const stopMinutes = Math.min(stopTabs.length + 1, 5);

  return (
    <>
      <SeoTags title={`${journey.title} — Fathom`} description={journey.subtitle} path={path} />
      <Breadcrumbs items={crumbs} />
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
                onClick={beginFresh}
              >
                {t('journey.start')}
              </button>
            )}
            {!progress.started && (progress.stop > 0 || progress.finished) && (
              <>
                <button
                  type="button"
                  className="journey-btn journey-btn--primary"
                  onClick={travel(resume)}
                >
                  {t('journey.resume', { n: progress.stop + 1 })}
                </button>
                <button type="button" className="journey-btn" onClick={beginFresh}>
                  {t('journey.startOver')}
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
                  {t('journey.overview')}
                </button>
                <span className="k-title">{journey.title}</span>
                <button
                  type="button"
                  className="voyage-exit"
                  title="Copy a link to this stop"
                  onClick={() => {
                    const url = `${window.location.origin}${path}?stop=${String(progress.stop + 1)}`;
                    void navigator.clipboard?.writeText(url).then(() => {
                      setCopiedStop(true);
                      window.setTimeout(() => {
                        setCopiedStop(false);
                      }, 1600);
                    });
                  }}
                >
                  {copiedStop ? 'Copied ✓' : 'Share stop'}
                </button>
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
                  {examQuestions.length >= 3 &&
                    (log.exam ? (
                      <p className="note" style={{ marginTop: 14 }}>
                        Exam: {String(log.exam.score)} / {String(log.exam.total)} —{' '}
                        {log.exam.passed ? 'passed with honours ★' : 'not yet passed.'}
                        {!log.exam.passed && (
                          <button
                            type="button"
                            className="link-button"
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                              setExamOpen(true);
                            }}
                          >
                            Retake
                          </button>
                        )}
                      </p>
                    ) : examOpen ? (
                      <ExamBlock
                        questions={examQuestions}
                        onDone={(score) => {
                          logExam(score, examQuestions.length, score >= 4);
                          setExamOpen(false);
                        }}
                      />
                    ) : (
                      <div className="journey-actions" style={{ marginTop: 14 }}>
                        <button
                          type="button"
                          className="journey-btn journey-btn--primary"
                          onClick={() => {
                            setExamOpen(true);
                          }}
                        >
                          Take the exam — earn a gold stamp
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                waypoint && (
                  <div className="voyage-body" key={progress.stop}>
                    <div className="eyebrow">
                      Stop {String(progress.stop + 1)} of {String(stopCount)} ·{' '}
                      {TYPE_LABELS[waypoint.entity.type] ?? waypoint.entity.type} · ~
                      {String(stopMinutes)} min
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
                    <Tabs idBase={`stop-${String(progress.stop)}`} tabs={stopTabs} />
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
                        onClick={beginFresh}
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
                      aria-label={t('journey.previous')}
                    >
                      ←
                    </button>
                    {nextPreview ? (
                      <NextStopStrip
                        name={nextPreview.name}
                        entityType={nextPreview.type}
                        entityId={nextPreview.id}
                        teaser={nextPreview.teaser}
                        km={nextPreview.km}
                        bearing={nextPreview.bearing}
                        onGo={travel(next)}
                      />
                    ) : (
                      <NextStopStrip
                        name="Complete the journey"
                        entityType="journey"
                        entityId={journey.id}
                        teaser={`All ${String(stopCount)} stops travelled — log the voyage.`}
                        km={null}
                        bearing={null}
                        final
                        onGo={travel(finish)}
                      />
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
                onSelectStop={(index) => {
                  travel(() => {
                    jumpTo(index);
                  })();
                }}
                challenge={challengeProp}
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

export function JourneyDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const journey = findJourney(slug);
  const stopParam = Number.parseInt(searchParams.get('stop') ?? '', 10);
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
  return (
    <JourneyExperience
      journey={journey}
      journeyKey={journey.id}
      path={`/journeys/${journey.id}`}
      initialStop={Number.isFinite(stopParam) && stopParam >= 1 ? stopParam - 1 : undefined}
      crumbs={[
        { label: 'Home', to: '/' },
        { label: 'Journeys', to: '/journeys' },
        { label: journey.title },
      ]}
    />
  );
}
