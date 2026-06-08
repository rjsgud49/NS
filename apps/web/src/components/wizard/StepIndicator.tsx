interface Step { id: number; label: string; }

interface Props {
  steps: Step[];
  current: number;
  onGoto: (n: number) => void;
}

export function StepIndicator({ steps, current, onGoto }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => s.id <= current && onGoto(s.id)}
              className={`flex flex-col items-center gap-1.5 group ${s.id > current ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${active ? 'bg-brand-500 text-white ring-4 ring-brand-500/30' : ''}
                ${done ? 'bg-brand-600 text-white' : ''}
                ${!active && !done ? 'bg-gray-800 text-gray-500' : ''}
              `}>
                {done ? '✓' : s.id}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-brand-500' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? 'bg-brand-600' : 'bg-gray-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
