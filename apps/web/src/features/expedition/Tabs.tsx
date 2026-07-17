import { useState, type ReactNode } from 'react';

export interface TabSpec {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * A quiet tab strip — the expedition pattern's answer to long scrolling.
 * Generic on purpose: journey stops today, story and expedition modes
 * tomorrow.
 */
export function Tabs({ tabs, idBase }: { tabs: readonly TabSpec[]; idBase: string }) {
  const [active, setActive] = useState(0);
  const current = Math.min(active, tabs.length - 1);
  if (tabs.length === 0) return null;

  return (
    <div className="xp-tabs">
      <div className="xp-tablist" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${idBase}-tab-${tab.key}`}
            aria-selected={index === current}
            aria-controls={`${idBase}-panel-${tab.key}`}
            className={index === current ? 'xp-tab is-active' : 'xp-tab'}
            onClick={() => {
              setActive(index);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') setActive((index + 1) % tabs.length);
              if (event.key === 'ArrowLeft') setActive((index - 1 + tabs.length) % tabs.length);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${idBase}-panel-${tab.key}`}
          aria-labelledby={`${idBase}-tab-${tab.key}`}
          hidden={index !== current}
          className="xp-tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
