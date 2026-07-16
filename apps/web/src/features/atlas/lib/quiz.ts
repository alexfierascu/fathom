import { getRelated, getStraitEntity, loadAllStraits, type Strait } from '@fathom/data';

/**
 * Quiz questions generated entirely from the dataset — the question, the
 * answer, and every distractor are values that exist in the documents, so
 * the quiz can never assert something the atlas does not.
 */
export interface QuizQuestion {
  prompt: string;
  options: readonly string[];
  answer: string;
  /** Strait the question is about, for the reveal link. */
  straitId: string;
}

const shuffle = <T>(items: readonly T[], random: () => number): T[] => {
  const remaining = [...items];
  const result: T[] = [];
  while (remaining.length > 0) {
    result.push(...remaining.splice(Math.floor(random() * remaining.length), 1));
  }
  return result;
};

const sample = <T>(items: readonly T[], count: number, random: () => number): T[] =>
  shuffle(items, random).slice(0, count);

function connectsQuestion(strait: Strait, pool: readonly Strait[], random: () => number) {
  const distractors = sample(
    pool.filter((other) => other.id !== strait.id && other.connects !== strait.connects),
    3,
    random,
  ).map((other) => other.name);
  const [from, to] = strait.connects.split(' ↔ ');
  return {
    prompt: to
      ? `Which strait connects the ${from} with the ${to}?`
      : `Which strait matches: ${strait.connects}?`,
    options: shuffle([strait.name, ...distractors], random),
    answer: strait.name,
    straitId: strait.id,
  };
}

function regionQuestion(strait: Strait, pool: readonly Strait[], random: () => number) {
  const regions = [...new Set(pool.map((other) => other.region))];
  const distractors = sample(
    regions.filter((region) => region !== strait.region),
    3,
    random,
  );
  return {
    prompt: `In which region of the atlas is the ${strait.name}?`,
    options: shuffle([strait.region, ...distractors], random),
    answer: strait.region,
    straitId: strait.id,
  };
}

function countryQuestion(strait: Strait, pool: readonly Strait[], random: () => number) {
  const countries = getRelated(getStraitEntity(strait), 'countries').map((c) => c.name);
  if (countries.length === 0) return null;
  const answer = countries[Math.floor(random() * countries.length)];
  if (answer === undefined) return null;
  const others = [
    ...new Set(
      pool
        .filter((other) => other.id !== strait.id)
        .flatMap((other) => getRelated(getStraitEntity(other), 'countries').map((c) => c.name)),
    ),
  ].filter((name) => !countries.includes(name));
  if (others.length < 3) return null;
  return {
    prompt: `Which of these countries borders the ${strait.name}?`,
    options: shuffle([answer, ...sample(others, 3, random)], random),
    answer,
    straitId: strait.id,
  };
}

const GENERATORS = [connectsQuestion, regionQuestion, countryQuestion];

/**
 * Builds a quiz of `count` questions. Pass a seeded `random` for
 * deterministic output (tests); defaults to Math.random.
 */
export function buildQuiz(count = 10, random: () => number = Math.random): QuizQuestion[] {
  const pool = loadAllStraits();
  const straits = shuffle(pool, random);
  const questions: QuizQuestion[] = [];
  let generatorIndex = 0;
  for (const strait of straits) {
    if (questions.length >= count) break;
    const generate = GENERATORS[generatorIndex % GENERATORS.length];
    generatorIndex += 1;
    const question = generate?.(strait, pool, random);
    if (!question) continue;
    if (new Set(question.options).size === question.options.length) {
      questions.push(question);
    }
  }
  return questions;
}

/** Tiny deterministic PRNG (mulberry32) for reproducible quizzes. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
