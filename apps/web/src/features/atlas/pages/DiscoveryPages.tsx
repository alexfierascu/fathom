import { useState, type ChangeEvent } from 'react';

import { Link, useNavigate, useParams } from 'react-router';

import {
  distanceKm,
  entityId,
  getEntity,
  getRelated,
  getStraitEntity,
  loadAllStraits,
  loadHistoricalEvents,
  loadTags,
  type EntityNode,
  type HistoricalEvent,
  type Strait,
} from '@fathom/data';

import { Breadcrumbs } from '../components/Breadcrumbs';
import { EntityPills } from '../components/EntityPills';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { StraitCard } from '../components/StraitCard';
import { formatDateValue, formatLat, formatLon } from '../lib/format';
import { formatDistance } from '../lib/units';
import { buildQuiz, type QuizQuestion } from '../lib/quiz';

// --- Tags -----------------------------------------------------------------

export function TagDetailPage() {
  const { slug } = useParams();
  const tag = loadTags().find((candidate) => candidate.id === slug);

  if (!tag) {
    return (
      <div className="empty">
        No such tag in the atlas.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
      </div>
    );
  }

  const straits = loadAllStraits().filter((strait) => strait.tagIds?.includes(tag.id));

  return (
    <>
      <SeoTags
        title={`${tag.label} straits — Fathom`}
        description={tag.definition}
        path={`/tags/${tag.id}`}
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: tag.label }]} />
      <article className="detail">
        <header className="strait-hero">
          <div className="eyebrow">Tag</div>
          <h2 className="detail-title detail-title--hero">{tag.label}</h2>
          <p className="note note--lede">{tag.definition}</p>
        </header>
        <Section label={`${String(straits.length)} strait${straits.length === 1 ? '' : 's'}`}>
          <div className="grid">
            {straits.map((strait) => (
              <StraitCard key={strait.id} strait={strait} />
            ))}
          </div>
        </Section>
      </article>
    </>
  );
}

// --- Compare ----------------------------------------------------------------

function CompareColumn({ strait }: { strait: Strait }) {
  const entity = getStraitEntity(strait);
  const region = getRelated(entity, 'region');
  const countries = getRelated(entity, 'countries');
  const waterBodies = getRelated(entity, 'waterBodies');
  const crossings = getRelated(entity, 'crossings');
  const tags = getRelated(entity, 'tags');

  return (
    <div className="compare-column">
      <h3>
        <Link viewTransition to={`/straits/${strait.id}`}>
          {strait.name}
        </Link>
      </h3>
      <div className="eyebrow">{region?.name ?? strait.region}</div>
      <dl className="compare-facts">
        <dt>Connects</dt>
        <dd>{strait.connects}</dd>
        <dt>Coordinates</dt>
        <dd>
          {formatLat(strait.lat)}, {formatLon(strait.lon)}
        </dd>
        <dt>Countries</dt>
        <dd>{countries.length > 0 ? <EntityPills entities={countries} /> : '—'}</dd>
        <dt>Connected waters</dt>
        <dd>{waterBodies.length > 0 ? <EntityPills entities={waterBodies} /> : '—'}</dd>
        <dt>Crossings</dt>
        <dd>{crossings.length > 0 ? <EntityPills entities={crossings} /> : 'None charted'}</dd>
        <dt>Tags</dt>
        <dd>
          {tags.length > 0 ? (
            <div className="pills">
              {tags.map((tag) => (
                <Link viewTransition key={tag.id} className="pill" to={`/tags/${tag.id}`}>
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : (
            '—'
          )}
        </dd>
      </dl>
      <p className="note">{strait.note}</p>
    </div>
  );
}

export function ComparePage() {
  const { a, b } = useParams();
  const navigate = useNavigate();
  const straits = loadAllStraits();
  const left = straits.find((strait) => strait.id === a) ?? straits[0];
  if (!left) return null;
  const right =
    straits.find((strait) => strait.id === b && strait.id !== left.id) ??
    straits.find((strait) => strait.id !== left.id);
  if (!right) return null;

  const pick = (side: 'a' | 'b') => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextA = side === 'a' ? event.target.value : left.id;
    const nextB = side === 'b' ? event.target.value : right.id;
    void navigate(`/compare/${nextA}/${nextB}`, { replace: true });
  };

  const separation = distanceKm(left.lat, left.lon, right.lat, right.lon);

  return (
    <>
      <SeoTags
        title={`${left.name} vs ${right.name} — Fathom`}
        description={`Side-by-side comparison of the ${left.name} and the ${right.name}.`}
        path={`/compare/${left.id}/${right.id}`}
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Compare' }]} />
      <article className="detail">
        <header className="strait-hero">
          <div className="eyebrow">Compare straits</div>
          <h2 className="detail-title detail-title--hero">
            {left.name} <span className="compare-vs">vs</span> {right.name}
          </h2>
          <div className="compare-pickers">
            <select aria-label="First strait" value={left.id} onChange={pick('a')}>
              {straits.map((strait) => (
                <option key={strait.id} value={strait.id}>
                  {strait.name}
                </option>
              ))}
            </select>
            <select aria-label="Second strait" value={right.id} onChange={pick('b')}>
              {straits.map((strait) => (
                <option key={strait.id} value={strait.id}>
                  {strait.name}
                </option>
              ))}
            </select>
          </div>
          <div className="connects">{formatDistance(separation)} apart</div>
        </header>
        <div className="compare-grid">
          <CompareColumn strait={left} />
          <CompareColumn strait={right} />
        </div>
      </article>
    </>
  );
}

// --- Quiz ---------------------------------------------------------------------

export function QuizPage() {
  const [quiz, setQuiz] = useState<QuizQuestion[]>(() => buildQuiz(10));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const question = quiz[index];
  const finished = !question;

  const restart = () => {
    setQuiz(buildQuiz(10));
    setIndex(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <>
      <SeoTags
        title="Strait Quiz — Fathom"
        description="Test your knowledge of the world's straits."
        path="/quiz"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Quiz' }]} />
      <article className="detail">
        <header className="strait-hero">
          <div className="eyebrow">Quiz</div>
          <h2 className="detail-title detail-title--hero">Know your narrows</h2>
          <div className="connects">
            {finished
              ? `Final score: ${String(score)} / ${String(quiz.length)}`
              : `Question ${String(index + 1)} of ${String(quiz.length)} — score ${String(score)}`}
          </div>
        </header>

        {question ? (
          <div className="quiz-panel">
            <p className="quiz-prompt">{question.prompt}</p>
            <div className="quiz-options">
              {question.options.map((option, index) => {
                const state =
                  picked === null
                    ? ''
                    : option === question.answer
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
                      if (option === question.answer) setScore((s) => s + 1);
                    }}
                  >
                    <i className="quiz-letter">{'ABCD'[index]}</i>
                    {option}
                    {picked !== null && option === question.answer && (
                      <span className="quiz-mark" aria-hidden="true">
                        ✓
                      </span>
                    )}
                    {picked === option && option !== question.answer && (
                      <span className="quiz-mark" aria-hidden="true">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="quiz-followup">
                <Link viewTransition to={`/straits/${question.straitId}`}>
                  Read about this strait →
                </Link>
                <button
                  type="button"
                  className="nav-random"
                  onClick={() => {
                    setIndex((i) => i + 1);
                    setPicked(null);
                  }}
                >
                  {index + 1 < quiz.length ? 'Next question' : 'See final score'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="quiz-panel">
            <p className="quiz-prompt">
              {score === quiz.length
                ? 'A perfect chart — every channel called correctly.'
                : score >= quiz.length / 2
                  ? 'A steady hand at the helm. The narrows reward another pass.'
                  : 'The narrows are treacherous — explore the atlas and try again.'}
            </p>
            <div className="quiz-followup">
              <button type="button" className="nav-random" onClick={restart}>
                Play again
              </button>
              <button
                type="button"
                className="journey-btn"
                onClick={() => {
                  shareQuizResult(score, quiz.length);
                }}
              >
                Share result ↓
              </button>
            </div>
          </div>
        )}
      </article>
    </>
  );
}

/** Renders a shareable score card and downloads it. */
function shareQuizResult(score: number, total: number): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#071e3d';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = 'rgba(231, 183, 95, 0.12)';
  ctx.beginPath();
  ctx.arc(1050, 90, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5f1e8';
  ctx.font = '800 30px -apple-system, sans-serif';
  ctx.fillText('F A T H O M', 70, 90);
  ctx.fillStyle = '#e7b75f';
  ctx.font = '500 190px "Iowan Old Style", Palatino, Georgia, serif';
  ctx.fillText(`${String(score)} / ${String(total)}`, 70, 350);
  ctx.fillStyle = '#f5f1e8';
  ctx.font = '500 52px "Iowan Old Style", Palatino, Georgia, serif';
  ctx.fillText('Know your narrows', 70, 460);
  ctx.fillStyle = 'rgba(245, 241, 232, 0.6)';
  ctx.font = '26px Menlo, monospace';
  ctx.fillText('fathom-atlas.pages.dev/quiz', 70, 540);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fathom-quiz-${String(score)}-of-${String(total)}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// --- Timeline -------------------------------------------------------------------

function eventYear(event: HistoricalEvent): number {
  return Number.parseInt(event.date.value, 10) || 0;
}

export function TimelinePage() {
  const events = [...loadHistoricalEvents()].sort((a, b) => eventYear(a) - eventYear(b));

  return (
    <>
      <SeoTags
        title="Timeline — Fathom"
        description="Historical events in the world's straits, in order."
        path="/timeline"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Timeline' }]} />
      <article className="detail">
        <header className="strait-hero">
          <div className="eyebrow">Timeline</div>
          <h2 className="detail-title detail-title--hero">History in the narrows</h2>
          <p className="note note--lede">
            Every event the atlas records, in chronological order — each grounded in its cited
            sources.
          </p>
        </header>
        <ol className="timeline">
          {events.map((event) => (
            <li key={event.id} className="timeline-event">
              <div className="timeline-year">{formatDateValue(event.date)}</div>
              <div className="timeline-body">
                <h3>{event.name}</h3>
                <p className="note">{event.summary}</p>
                <EntityPills
                  entities={event.involves
                    .map((ref) => getEntity(entityId(ref.type, ref.id)))
                    .filter((node): node is EntityNode => node !== null)}
                />
              </div>
            </li>
          ))}
        </ol>
      </article>
    </>
  );
}
