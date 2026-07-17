import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="empty">
      Nothing charted at this address.{' '}
      <Link viewTransition to="/">
        Return to the chart.
      </Link>
    </div>
  );
}
