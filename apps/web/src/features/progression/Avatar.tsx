import { AVATARS } from './avatars';

/** A captain's mark: the chosen ensign, or the unlocked portrait. */
export function Avatar({
  identity,
  size = 48,
}: {
  identity: { avatar: string; portrait?: string; name: string };
  size?: number;
}) {
  if (identity.portrait) {
    return (
      <span className="avatar avatar--portrait" style={{ width: size, height: size }}>
        <img src={identity.portrait} alt="" width={size} height={size} />
      </span>
    );
  }
  const spec = AVATARS.find((candidate) => candidate.id === identity.avatar) ?? AVATARS[0];
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 48 48"
        width={size - 2}
        height={size - 2}
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {spec?.draw}
      </svg>
    </span>
  );
}
