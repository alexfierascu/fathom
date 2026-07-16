import { loadAllStraits, loadStrait, type Strait } from '@fathom/data';
import { randomEntity } from '@fathom/discovery';

/** Deterministic daily pick — same strait for everyone on a given day. */
export function straitOfTheDay(): Strait | undefined {
  const all = loadAllStraits();
  const day = Math.floor(Date.now() / 86_400_000);
  return all[day % all.length];
}

/** A uniformly random strait, for the header's Random explorer. */
export function randomStrait(): Strait | undefined {
  const pick = randomEntity({ types: ['strait'] });
  return pick ? loadStrait(pick.id) : undefined;
}
