type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
};

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div>
      {label && <div className="label">{label}</div>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="h-12 w-12 rounded-xl bg-neutral-800 text-2xl font-semibold text-neutral-100 active:bg-neutral-700"
          aria-label="decrease"
        >
          −
        </button>
        <div className="flex-1 rounded-xl bg-neutral-900 py-3 text-center text-2xl font-semibold tabular-nums">
          {value}
        </div>
        <button
          type="button"
          onClick={inc}
          className="h-12 w-12 rounded-xl bg-neutral-800 text-2xl font-semibold text-neutral-100 active:bg-neutral-700"
          aria-label="increase"
        >
          +
        </button>
      </div>
    </div>
  );
}
