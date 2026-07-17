import { Link } from 'react-router';

import { getMaritimeGraph, neighbors } from '@fathom/discovery';

import { Section } from './Section';

/**
 * How water flows through a sea: its gates. Each connected strait is a
 * gold diamond; the water on its far side is the next stop on the thread.
 * Seas with exactly two gates read as one line (the Marmara case); seas
 * with more show each gate as its own doorway.
 */

interface Gate {
  straitId: string;
  straitName: string;
  /** Straits and canals both gate a sea. */
  kind: 'strait' | 'canal';
  otherId: string | null;
  otherName: string | null;
}

function gatesOf(waterBodyId: string): Gate[] {
  const graph = getMaritimeGraph();
  const self = `water-body:${waterBodyId}`;
  return neighbors(graph, self, { kinds: ['connected_to'] })
    .filter(({ node }) => node.type === 'strait' || node.type === 'canal')
    .map(({ node: gate }) => {
      const other = neighbors(graph, gate.entityId, { kinds: ['connected_to'] }).find(
        ({ node }) => node.type === 'water-body' && node.entityId !== self,
      )?.node;
      return {
        straitId: gate.id,
        straitName: gate.name,
        kind: gate.type === 'canal' ? ('canal' as const) : ('strait' as const),
        otherId: other?.id ?? null,
        otherName: other?.name ?? null,
      };
    });
}

function SeaNode({ id, name }: { id: string | null; name: string }) {
  const body = (
    <>
      <span className="flow-glyph" />
      <span>
        <span className="flow-name">{name}</span>
        <span className="flow-kind" style={{ display: 'block', marginTop: 2 }}>
          Sea
        </span>
      </span>
    </>
  );
  return id ? (
    <Link viewTransition className="flow-node flow-node--sea" to={`/water-bodies/${id}`}>
      {body}
    </Link>
  ) : (
    <span className="flow-node flow-node--sea">{body}</span>
  );
}

function StraitNode({ gate }: { gate: Gate }) {
  return (
    <Link
      viewTransition
      className="flow-node flow-node--strait"
      to={`/${gate.kind === 'canal' ? 'canals' : 'straits'}/${gate.straitId}`}
    >
      <span className="flow-glyph" />
      <span>
        <span className="flow-name">{gate.straitName}</span>
        <span className="flow-kind" style={{ display: 'block', marginTop: 2 }}>
          {gate.kind === 'canal' ? 'Canal' : 'Strait'}
        </span>
      </span>
    </Link>
  );
}

export function FlowDiagram({ waterBodyId, name }: { waterBodyId: string; name: string }) {
  const gates = gatesOf(waterBodyId);
  if (gates.length === 0) return null;

  // The signature case: two gates make the sea one leg of a longer thread.
  if (gates.length === 2 && gates[0] && gates[1]) {
    const [west, east] = gates;
    return (
      <Section label="The flow">
        <div className="flow">
          <SeaNode id={west.otherId} name={west.otherName ?? 'Open water'} />
          <span className="flow-link" />
          <StraitNode gate={west} />
          <span className="flow-link" />
          <span className="flow-node flow-node--here">
            <span className="flow-glyph" />
            <span>
              <span className="flow-name">{name}</span>
              <span className="flow-kind" style={{ display: 'block', marginTop: 2 }}>
                You are here
              </span>
            </span>
          </span>
          <span className="flow-link" />
          <StraitNode gate={east} />
          <span className="flow-link" />
          <SeaNode id={east.otherId} name={east.otherName ?? 'Open water'} />
        </div>
      </Section>
    );
  }

  return (
    <Section label="The flow">
      <div className="flow-gates">
        {gates.map((gate) => (
          <div key={gate.straitId} className="flow" style={{ padding: '22px 18px 14px' }}>
            <StraitNode gate={gate} />
            {gate.otherId && (
              <>
                <span className="flow-link" />
                <SeaNode id={gate.otherId} name={gate.otherName ?? ''} />
              </>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
