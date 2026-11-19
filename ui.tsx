import type { ReactNode } from 'react';
import { MentorTip } from '@/components/Mentor';

export { MentorTip };

export function SectionTitle({ title, subtitle, mentorTip }: { title: string; subtitle: string; mentorTip?: string }) {
  return (
    <div className="animate-fade-up mb-9 border-b border-ink-200/70 pb-7">
      <div className="flex items-start gap-4">
        <span className="mt-2 h-10 w-1 shrink-0 rounded-full bg-terracotta-400" />
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-pine-600">Рабочее пространство</p>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ink-950 sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink-600">{subtitle}</p>
        </div>
      </div>
      {mentorTip && <MentorTip tip={mentorTip} compact />}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.25rem] border border-ink-200/80 bg-white shadow-card ${className}`}>{children}</div>;
}

export function Medal({ children, tone = 'pine' }: { children: ReactNode; tone?: 'pine' | 'gold' }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone === 'gold' ? 'bg-gold-100 text-gold-600' : 'bg-pine-50 text-pine-600'}`}>
      {children}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-pine-200 bg-pine-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pine-700">{children}</span>;
}

export function Button({ children, onClick, variant = 'primary', disabled, className = '' }: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';
  const styles = variant === 'primary'
    ? 'bg-pine-700 text-white shadow-[0_6px_18px_-8px_rgba(32,70,40,0.8)] hover:-translate-y-0.5 hover:bg-pine-800'
    : 'border border-ink-200 bg-white text-ink-700 hover:border-pine-300 hover:bg-pine-50';
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>{children}</button>;
}
