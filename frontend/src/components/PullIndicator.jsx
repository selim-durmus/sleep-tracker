export default function PullIndicator({ pull, refreshing, threshold = 70 }) {
  const height = refreshing ? threshold : pull;
  const label = refreshing
    ? 'Refreshing…'
    : pull >= threshold ? 'Release to refresh' : 'Pull to refresh';
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center overflow-hidden text-[11px] uppercase tracking-wider text-neutral-500"
      style={{
        height,
        transition: pull ? 'none' : 'height 200ms ease-out'
      }}
    >
      <span className={refreshing ? 'animate-pulse' : ''}>{label}</span>
    </div>
  );
}
