'use client';
import { ReactNode } from 'react';
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
  size?: 'sm' | 'md' | 'lg';
}) {
  const max = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
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
            className={`relative z-10 max-h-[88vh] w-full ${max} overflow-y-auto rounded-t-3xl border border-black/[0.06] bg-white shadow-2xl sm:rounded-3xl`}
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
