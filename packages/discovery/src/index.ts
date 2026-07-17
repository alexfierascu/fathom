/**
 * @fathom/discovery — the exploration engine.
 *
 * Framework-independent algorithms over the atlas: the maritime graph
 * (generated from @fathom/data, never stored), traversal, similarity
 * scoring, recommendations, random exploration, and the Journey model.
 * React consumes this package; nothing here knows React exists.
 */

export {
  EDGE_KINDS,
  buildMaritimeGraph,
  degree,
  getMaritimeGraph,
  neighbors,
  shortestPath,
  traverse,
} from './graph';
export type { EdgeKind, GraphEdge, GraphNode, MaritimeGraph, TraversalVisit } from './graph';

export { similarStraits, similarityBetween } from './similarity';
export type { SimilarStrait, SimilarityReason } from './similarity';

export { clearRecommendationCache, recommendationsFor } from './recommend';
export type { Recommendation, RecommendationGroup } from './recommend';

export { EXPLORABLE_TYPES, randomEntity, randomWalk } from './random';

export {
  difficultyFor,
  estimateMinutes,
  eventYearQuiz,
  journeyBetween,
  journeyFromRoute,
  journeyVisits,
  locatedStops,
  relatedJourneys,
  resolveWaypoint,
  straitQuiz,
  validateJourney,
} from './journeys';
export type {
  Journey,
  JourneyDifficulty,
  JourneyIssue,
  JourneyQuiz,
  JourneyWaypoint,
} from './journeys';

export { findJourney, loadJourneys } from './catalog';

export { bearingWord, courseLengthKm, journeyCourse, legBetween } from './course';
export { chartChallengeFor } from './challenge';
export type { ChallengeTarget, ChartChallenge } from './challenge';
export type { CoursePoint } from './course';
