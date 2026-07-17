export interface ChainItem {
  id: string;
  name: string;
  state: 'done' | 'current' | 'ahead';
}

/**
 * The voyage as one connected chain — every stop, in order, with the
 * traveller's position lit. Answers "where am I, and why?" at a glance.
 */
export function JourneyChain({
  items,
  onSelect,
}: {
  items: readonly ChainItem[];
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="chain" aria-label="The journey so far">
      {items.map((item, index) => (
        <li key={item.id} className={`chain-item chain-item--${item.state}`}>
          {index > 0 && <span className="chain-flow" aria-hidden="true" />}
          <button
            type="button"
            className="chain-node"
            aria-current={item.state === 'current' ? 'step' : undefined}
            onClick={() => {
              onSelect(index);
            }}
          >
            <span className="chain-glyph" aria-hidden="true" />
            {item.name}
          </button>
        </li>
      ))}
    </ol>
  );
}
