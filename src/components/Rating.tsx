type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
};

export default function Rating({
  value,
  onChange,
  min = 1,
  max = 5,
  lowLabel,
  highLabel,
}: Props) {
  const buttons = [];
  for (let i = min; i <= max; i++) buttons.push(i);

  return (
    <div>
      <div className="flex gap-2">
        {buttons.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 rounded-xl py-3 text-base font-semibold transition-colors active:scale-[0.98] ${
                active
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
              aria-pressed={active}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}
