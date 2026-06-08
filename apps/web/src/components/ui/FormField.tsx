interface Props {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        placeholder:text-gray-600 ${props.className ?? ''}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${props.className ?? ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
