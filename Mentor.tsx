import { useEffect, useState } from 'react';

const POSES = [
  '/mentor-explain.webp',
  '/mentor-point.webp',
  '/mentor-smile.webp',
] as const;

function usePose(src?: string, swapMs = 7000) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (src) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % POSES.length), swapMs);
    return () => clearInterval(id);
  }, [src, swapMs]);
  return src || POSES[idx];
}

export function MentorAvatar({ src, size = 64, talking = true, className = '' }: {
  src?: string;
  size?: number;
  talking?: boolean;
  className?: string;
}) {
  const pose = usePose(src);
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-xl border border-pine-200 bg-pine-50">
        <img
          src={pose}
          alt="ИИ-ассистент Настаўніка PRO"
          className={`h-full w-full object-cover object-top ${talking ? 'animate-mentor-breathe' : ''}`}
        />
      </span>
      {talking && (
        <span className="absolute -bottom-1 -right-1 flex h-5 items-center gap-0.5 rounded-full border border-pine-200 bg-white px-1.5 shadow-sm">
          <span className="dot-talk h-1 w-1 rounded-full bg-pine-500" style={{ animationDelay: '0ms' }} />
          <span className="dot-talk h-1 w-1 rounded-full bg-pine-500" style={{ animationDelay: '150ms' }} />
          <span className="dot-talk h-1 w-1 rounded-full bg-pine-500" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </span>
  );
}

export function MentorTip({ tip, compact = false }: { tip: string; compact?: boolean }) {
  return (
    <div className={`mt-5 flex items-end gap-3 rounded-2xl border border-pine-200 bg-pine-50/70 ${compact ? 'max-w-3xl p-3 pr-4' : 'p-4 pr-5'}`}>
      <MentorAvatar size={compact ? 64 : 88} />
      <div className="pb-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-pine-600">Совет ИИ-ассистента</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-700">{tip}</p>
      </div>
    </div>
  );
}
