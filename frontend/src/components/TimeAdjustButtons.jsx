import { buzz } from '../lib/haptic.js';

export default function TimeAdjustButtons({ value, onChange, disabled }) {
  const adjust = (mins) => () => {
    if (value == null || disabled) return;
    buzz(5);
    onChange(value + mins * 60 * 1000);
  };
  return (
    <div className="flex items-center gap-1">
      <AdjustButton onClick={adjust(-5)} disabled={disabled || value == null} label="−5" />
      <AdjustButton onClick={adjust(+5)} disabled={disabled || value == null} label="+5" />
    </div>
  );
}

function AdjustButton({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-7 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium tabular-nums active:bg-neutral-700 disabled:opacity-40"
    >
      {label}
    </button>
  );
}
