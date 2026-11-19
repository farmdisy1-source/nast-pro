import type { LucideIcon } from 'lucide-react';
import { HUBS, HUB_TOOLS } from '@/components/Sidebar';
import type { HubKey, TabKey } from '@/components/Sidebar';
import { SectionTitle } from '@/components/ui';

export default function HubPage({ hub, onNavigate }: { hub: HubKey; onNavigate: (t: TabKey) => void }) {
  const meta = HUBS.find((h) => h.key === hub)!;
  const { intro, tools } = HUB_TOOLS[hub as Exclude<HubKey, 'home' | 'about'>];

  return (
    <div>
      <SectionTitle title={meta.label} subtitle={intro} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((t, i) => {
          const Icon = t.icon as LucideIcon;
          return (
            <button
              key={t.key}
              onClick={() => onNavigate(t.key)}
              className={`group flex flex-col gap-3 rounded-xl border border-ink-200/80 bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-pine-300 hover:shadow-lift active:scale-[0.98] animate-fade-up delay-${Math.min(i, 5)}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-50 text-pine-600 transition group-hover:bg-pine-600 group-hover:text-white">
                <Icon size={19} />
              </span>
              <div>
                <span className="block text-[13px] font-bold text-ink-900 group-hover:text-pine-700">{t.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">{t.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
