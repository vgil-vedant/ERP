import { useState } from 'react';
import { Icon } from '../../shared/icons';
import type { FieldDef } from './types';

interface Props { def: FieldDef; value: string; error: string; onChange: (v: string) => void; revealed: boolean; onReveal: (v: boolean) => void }

export function Field({ def, value, error, onChange, revealed, onReveal }: Props) {
  const [focused] = useState(false);
  void focused;
  const type = def.password ? (revealed ? 'text' : 'password') : def.type ?? 'text';
  return (
    <div className="lg-group mb-[14px]">
      <div className={`lg-field relative h-[54px] rounded-lg border-[1.5px] bg-lg-input transition-[border-color,box-shadow] duration-200 focus-within:border-lg-focus focus-within:[box-shadow:0_0_0_4px_var(--lg-ring)] max-[480px]:h-[52px] ${error ? 'is-bad border-lg-danger' : 'border-lg-input-line'}`}>
        <span className="lg-fic pointer-events-none absolute bottom-0 left-0 top-0 z-[1] m-[1px_0_1px_1px] grid w-[50px] place-items-center rounded-l-md border-r border-lg-line bg-lg-card text-lg-muted [&_svg]:h-4 [&_svg]:w-4">
          <Icon n={def.icon} />
        </span>
        <input
          id={def.id} name={def.name} type={type} placeholder=" " value={value}
          onChange={(e) => onChange(e.target.value)}
          required={def.required} data-required={def.required ? '1' : undefined}
          autoComplete={def.autoComplete} maxLength={def.maxLength} inputMode={def.inputMode} autoFocus={def.autoFocus}
          aria-invalid={error ? 'true' : 'false'} aria-describedby={`${def.id}-err`}
        />
        <label htmlFor={def.id} className="pointer-events-none absolute left-[62px] top-1/2 -translate-y-1/2 text-[12px] text-lg-muted transition-opacity duration-150">{def.label}</label>
        {def.password && (
          <button
            type="button" aria-pressed={revealed} aria-label={revealed ? 'Hide password' : 'Show password'}
            onClick={() => onReveal(!revealed)}
            className="lg-eye absolute right-2 top-[11px] grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-lg-muted hover:text-lg-text [&_svg]:h-[18px] [&_svg]:w-[18px]"
          >
            <span><Icon n={revealed ? 'eyeoff' : 'eye'} /></span>
          </button>
        )}
      </div>
      <p className={`lg-err mt-[5px] min-h-0 text-[12px] text-lg-danger ${error ? '' : 'hidden'}`} id={`${def.id}-err`} role="alert">{error}</p>
    </div>
  );
}
