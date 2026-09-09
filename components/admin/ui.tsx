'use client';
import { ReactNode, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function SectionHeader({
  title,
  subtitle,
  accent,
  right,
}: {
  title: string;
  subtitle?: string;
  accent?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {accent}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-500 sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white ${className}`}>{children}</div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1">
      <div className="flex w-max items-center rounded-xl bg-black/[0.04] p-1">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              value === o.key ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const max = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={`relative z-10 max-h-[88vh] w-full ${max} overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-t-3xl border border-black/[0.06] bg-white shadow-2xl sm:rounded-3xl`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ title, onClose, right }: { title: string; onClose: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-5 py-4 sm:px-6">
      <p className="text-lg font-bold tracking-tight text-neutral-900">{title}</p>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-800"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Toast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-16 text-center text-sm text-neutral-400">{message}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export const inputBase =
  'rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400';

// NOTE: never combine this with an explicit w-* class — a Tailwind cascade-order
// quirk lets w-full silently win over a later w-* utility. Use `inputBase` instead
// when a fixed/flex width is needed.
export const inputCls = `w-full ${inputBase}`;

// Two number inputs (From/To) plus a Years/Months toggle. Values are always
// carried in months — the toggle only changes how they're displayed/typed,
// so "2" + "Months" and "2" + "Years" both round-trip losslessly.
//
// The number inputs are backed by a <datalist> so clicking them pops a picker
// with the store's standard age steps for the active unit — but you can still
// type any value in range, which is why we didn't use a hard <select>.
//
// Range per unit:
//   Months: 0–24 (covers newborn/babywear sizes; beyond 24M use Years)
//   Years:  0–99
// Values typed above the max are clamped down (so a "18" typed in months
// mode becomes 18, not 12, but "50" in months becomes 24).
const AGE_LIMITS = {
  years:  { min: 0, max: 99, suggestions: [2, 3, 4, 6, 8, 10, 12, 14, 16, 18] },
  months: { min: 0, max: 24, suggestions: [3, 6, 9, 12, 18, 24] },
} as const;

// Pick the unit that's the most natural fit for the stored values:
// if every value is a clean multiple of 12, prefer Years (0, 12, 24, 36 → 0Y, 1Y, 2Y, 3Y).
// Otherwise, Months (so 6M / 18M don't get rounded).
function naturalUnit(minMonths?: number | null, maxMonths?: number | null): 'years' | 'months' {
  const vals = [minMonths, maxMonths].filter((v): v is number => v != null);
  if (vals.length === 0) return 'years';
  return vals.every((v) => v % 12 === 0) ? 'years' : 'months';
}

export function AgeRangeInput({
  minMonths,
  maxMonths,
  onChange,
}: {
  minMonths?: number | null;
  maxMonths?: number | null;
  onChange: (minMonths: number | null, maxMonths: number | null) => void;
}) {
  const [unit, setUnit] = useState<'years' | 'months'>(() => naturalUnit(minMonths, maxMonths));
  // useId keeps the datalist id unique per instance — Categories renders one
  // AgeRangeInput per department, and a shared static id produced duplicate
  // <datalist> ids in the DOM.
  const listId = `age-suggest${useId()}`;
  const limits = AGE_LIMITS[unit];
  const unitSize = unit === 'years' ? 12 : 1;

  // Ranges are stored HALF-OPEN in months ([min, max), max excluded), but the
  // user thinks INCLUSIVE ("0–2Y" means ages 0, 1, 2). So on the max only,
  // we add one unit going in and subtract one unit coming out — the user
  // types "2" for max, we store 36 months, we display "2" back.
  const toDisplayMin = (m?: number | null) => (m == null ? '' : String(m / unitSize));
  const toDisplayMax = (m?: number | null) => (m == null ? '' : String(m / unitSize - 1));

  const parse = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    return Math.min(Math.max(n, limits.min), limits.max);
  };
  const toStoredMin = (raw: string): number | null => {
    const n = parse(raw);
    return n == null ? null : n * unitSize;
  };
  const toStoredMax = (raw: string): number | null => {
    const n = parse(raw);
    return n == null ? null : (n + 1) * unitSize;
  };

  return (
    <div className="flex items-center gap-1.5">
      <datalist id={listId}>
        {limits.suggestions.map((v) => <option key={v} value={v} />)}
      </datalist>
      <input
        type="number"
        min={limits.min}
        max={limits.max}
        list={listId}
        className={`${inputBase} !w-16 !px-2 !py-1.5 text-xs`}
        placeholder="From"
        value={toDisplayMin(minMonths)}
        onChange={(e) => onChange(toStoredMin(e.target.value), maxMonths ?? null)}
      />
      <span className="text-xs text-neutral-400">–</span>
      <input
        type="number"
        min={limits.min}
        max={limits.max}
        list={listId}
        className={`${inputBase} !w-16 !px-2 !py-1.5 text-xs`}
        placeholder="To"
        value={toDisplayMax(maxMonths)}
        onChange={(e) => onChange(minMonths ?? null, toStoredMax(e.target.value))}
      />
      <div className="flex overflow-hidden rounded-md border border-black/[0.1]">
        {(['years', 'months'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`px-1.5 py-1 text-[9px] font-bold uppercase transition-colors ${unit === u ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
          >
            {u === 'years' ? 'Yr' : 'Mo'}
          </button>
        ))}
      </div>
    </div>
  );
}
