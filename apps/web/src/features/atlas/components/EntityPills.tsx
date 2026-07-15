import { Link } from 'react-router';

import type { EntityNode } from '@fathom/data';

import { entityPath } from '../lib/entityPaths';

/** Pills for a list of entities; each links to its page when one exists. */
export function EntityPills({ entities }: { entities: readonly EntityNode[] }) {
  return (
    <div className="pills">
      {entities.map((entity) => {
        const path = entityPath(entity);
        return path ? (
          <Link key={entity.entityId} className="pill" to={path}>
            {entity.name}
          </Link>
        ) : (
          <span key={entity.entityId} className="pill">
            {entity.name}
          </span>
        );
      })}
    </div>
  );
}
