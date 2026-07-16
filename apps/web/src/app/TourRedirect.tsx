import { Navigate, useParams } from 'react-router';

/** The tours of the experience pack grew into journeys; old links keep working. */
const TOUR_TO_JOURNEY: Record<string, string> = {
  'oil-chokepoints': 'the-worlds-great-chokepoints',
  'arctic-passages': 'arctic-exploration',
  'mediterranean-gates': 'gateway-to-the-mediterranean',
};

export function TourRedirect() {
  const { slug } = useParams();
  const journey = slug !== undefined ? TOUR_TO_JOURNEY[slug] : undefined;
  return <Navigate to={journey ? `/journeys/${journey}` : '/journeys'} replace />;
}
