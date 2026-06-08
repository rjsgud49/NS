interface Props {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ label, description, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all
        ${selected
          ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
          ${selected ? 'border-brand-500' : 'border-gray-600'}`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-brand-500" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-100">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
    </button>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full text-left p-4 rounded-xl border transition-all
        ${checked
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-100">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0
          ${checked ? 'bg-brand-500' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </div>
      </div>
    </button>
  );
}
