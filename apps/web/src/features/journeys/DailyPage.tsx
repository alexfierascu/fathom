import { loadAllStraits } from '@fathom/data';
import { journeyBetween, type Journey } from '@fathom/discovery';

import { JourneyExperience } from './JourneyPages';

/**
 * The Daily Expedition: a passage generated from the date, identical for
 * every visitor, new every day. Route generation is the discovery
 * engine's shortest charted chain between two seeded straits.
 */
function dailyJourney(): Journey | null {
  const day = Math.floor(Date.now() / 86_400_000);
  const isoDate = new Date(day * 86_400_000).toISOString().slice(0, 10);
  const straits = loadAllStraits();
  const count = straits.length;
  if (count < 2) return null;

  for (let attempt = 0; attempt < count; attempt += 1) {
    const from = straits[(day * 7 + attempt) % count];
    const to = straits[(day * 13 + attempt * 3 + 5) % count];
    if (!from || !to || from.id === to.id) continue;
    const generated = journeyBetween(from.id, to.id);
    if (generated && generated.waypoints.length >= 4 && generated.waypoints.length <= 14) {
      return {
        ...generated,
        id: `daily-${isoDate}`,
        title: `Daily Expedition — ${isoDate}`,
        subtitle: `A new passage every day: today, ${from.name} to ${to.name}.`,
      };
    }
  }
  return null;
}

export function DailyPage() {
  const journey = dailyJourney();
  if (!journey) {
    return <div className="empty">The tide charts no passage today — return tomorrow.</div>;
  }
  return (
    <JourneyExperience
      journey={journey}
      journeyKey={journey.id}
      path="/daily"
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Daily Expedition' }]}
    />
  );
}
