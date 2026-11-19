import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, Compass, ExternalLink, Filter, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionTitle, Card, Pill } from '@/components/ui';
import { CYCLEGRAM, INTEREST_TRACKS } from '@/data/cyclegram';
import type { TabKey } from '@/components/Sidebar';

type CyclegramPageProps = { onNavigate: (tab: TabKey) => void };

const kinds = ['Все', 'Единый урок', 'Информационный час', 'Классный час', 'Неделя / декада', 'Акция / проект'] as const;

type KindFilter = (typeof kinds)[number];

export default function CyclegramPage({ onNavigate }: CyclegramPageProps) {
  const [activeMonth, setActiveMonth] = useState(0);
  const [kind, setKind] = useState<KindFilter>('Все');
  const [openWeeks, setOpenWeeks] = useState<string[]>(['Сентябрь-01–06.09', 'Сентябрь-07–13.09']);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const month = CYCLEGRAM[activeMonth];
  const visibleWeeks = useMemo(() => month.weeks.map((week) => ({
    ...week,
    items: kind === 'Все' ? week.items : week.items.filter((item) => item.kind === kind),
  })).filter((week) => week.items.length > 0), [kind, month]);

  const toggleWeek = (key: string) => setOpenWeeks((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const selected = INTEREST_TRACKS.find((track) => track.name === selectedTrack);

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Календарь воспитательной работы"
        subtitle="Циклограмма на 2026/2027 учебный год: единые уроки, информационные и классные часы, тематические недели, акции и проекты. Выберите неделю, чтобы быстро понять нагрузку и подходящий формат для класса."
        mentorTip="Сначала смотрите на неделю целиком. Так легче не перегрузить класс и связать обязательную тему с живым делом: творческим, спортивным, туристическим или волонтёрским."
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <Card className="animate-fade-up overflow-hidden p-0">
          <div className="border-b border-ink-100 bg-pine-950 p-5 text-white">
            <div className="flex items-center gap-3"><CalendarDays size={21} className="text-gold-300" /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine-200">Учебный год</p><h3 className="mt-1 text-xl font-extrabold">2026 / 2027</h3></div></div>
            <p className="mt-3 text-sm leading-relaxed text-pine-100/75">Обязательные даты уже собраны по неделям. Ваши мероприятия можно дополнить в годовом плане.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-2">
            {CYCLEGRAM.map((item, index) => <button key={item.name} onClick={() => setActiveMonth(index)} className={`rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeMonth === index ? 'bg-pine-700 text-white shadow-sm' : 'bg-ink-50 text-ink-600 hover:bg-pine-50 hover:text-pine-800'}`}><span className="block text-[10px] uppercase tracking-[0.12em] opacity-60">{String(index + 1).padStart(2, '0')}</span>{item.name}</button>)}
          </div>
          <div className="border-t border-ink-100 p-4"><button onClick={() => onNavigate('yearplan')} className="flex w-full items-center justify-between rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-left text-sm font-bold text-pine-800 transition hover:bg-pine-100"><span>Открыть годовой план</span><ExternalLink size={16} /></button></div>
        </Card>

        <Card className="animate-fade-up delay-1 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><Pill><CalendarDays size={13} /> {month.name}</Pill><h3 className="mt-3 text-2xl font-extrabold text-ink-950">Недели месяца</h3><p className="mt-1 text-sm text-ink-500">{visibleWeeks.reduce((total, week) => total + week.items.length, 0)} пунктов в выбранном представлении</p></div><div className="flex items-center gap-2 text-xs font-semibold text-ink-400"><Filter size={14} /> Фильтр</div></div>
          <div className="mt-5 flex flex-wrap gap-2">{kinds.map((item) => <button key={item} onClick={() => setKind(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${kind === item ? 'bg-pine-700 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:text-pine-700'}`}>{item}</button>)}</div>
          <div className="mt-5 space-y-3">{visibleWeeks.length === 0 && <div className="rounded-2xl bg-ink-50 p-6 text-center text-sm text-ink-500">В этом месяце нет пунктов выбранного типа.</div>}{visibleWeeks.map((week) => { const key = `${month.name}-${week.range}`; const open = openWeeks.includes(key); return <div key={key} className="overflow-hidden rounded-2xl border border-ink-100"><button onClick={() => toggleWeek(key)} className="flex w-full items-center justify-between gap-4 bg-ink-50/70 px-4 py-3 text-left transition hover:bg-pine-50"><span className="text-sm font-extrabold text-ink-800">{week.range}</span><ChevronDown size={17} className={`text-ink-400 transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="divide-y divide-ink-100">{week.items.map((item) => <div key={`${item.kind}-${item.title}`} className="flex gap-3 px-4 py-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-700"><CheckCircle2 size={15} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-pine-600">{item.kind}</span><span className="text-[10px] font-semibold text-ink-400">{item.audience}</span></div><p className="mt-1 text-sm font-bold leading-snug text-ink-800">{item.title}</p>{item.note && <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.note}</p>}</div></div>)}</div>}</div>})}</div>
        </Card>
      </div>

      <div className="border-t border-ink-200/70 pt-8">
        <SectionTitle title="Интересы как ресурс" subtitle="Безопасные альтернативы для социализации и самореализации. Здесь интерес ребёнка не становится ярлыком: он помогает подобрать подходящее дело, роль и поддержку." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{INTEREST_TRACKS.map((track, index) => <button key={track.name} onClick={() => setSelectedTrack(track.name)} className={`animate-fade-up delay-${Math.min(index + 1, 6)} group rounded-[1.25rem] border border-ink-200/80 bg-white p-5 text-left shadow-card transition hover:-translate-y-1 hover:border-pine-300 hover:shadow-lift ${selectedTrack === track.name ? 'ring-2 ring-pine-200' : ''}`}><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${track.tone}`}>Интерес и потенциал</span><h3 className="mt-3 font-extrabold text-ink-900 group-hover:text-pine-700">{track.name}</h3><p className="mt-2 text-sm leading-relaxed text-ink-500">{track.trait}</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pine-700">Посмотреть идеи <ChevronDown size={14} className="-rotate-90 transition group-hover:translate-x-0.5" /></span></button>)}</div>
      </div>

      {selected && <Card className="animate-fade-in border-pine-200 bg-pine-50/60 p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><div className="flex items-center gap-2"><HeartHandshake size={19} className="text-pine-700" /><Pill>{selected.name}</Pill></div><p className="mt-4 text-sm leading-relaxed text-ink-700"><strong>Особенности:</strong> {selected.trait}</p><p className="mt-2 text-sm leading-relaxed text-ink-700"><strong>Что важно учесть:</strong> {selected.risk}</p></div><button onClick={() => setSelectedTrack(null)} className="text-xs font-bold text-pine-700 hover:text-pine-950">Скрыть</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{selected.alternatives.map((alternative) => <div key={alternative} className="rounded-xl border border-pine-200 bg-white p-4"><Sparkles size={16} className="text-gold-600" /><p className="mt-2 text-sm font-bold leading-snug text-ink-800">{alternative}</p></div>)}</div><div className="mt-5 flex items-start gap-3 rounded-xl border border-pine-200 bg-white/80 p-4 text-xs leading-relaxed text-ink-600"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-pine-700" /> Не фиксируйте принадлежность к группе как характеристику ученика. Используйте эти идеи только для добровольного выбора занятий и поддержки интересов.</div></Card>}

      <Card className="flex flex-wrap items-center justify-between gap-4 border-gold-200 bg-gold-100/40 p-5"><div className="flex items-start gap-3"><Compass size={20} className="mt-0.5 shrink-0 text-gold-700" /><p className="max-w-2xl text-sm leading-relaxed text-ink-700"><strong>Принцип планирования:</strong> обязательную тему лучше соединять с конкретным действием класса — творческим делом, туристическим маршрутом, спортивной встречей, медиапроектом или волонтёрской акцией.</p></div><button onClick={() => onNavigate('bank')} className="inline-flex items-center gap-2 rounded-xl border border-gold-300 bg-white px-4 py-2.5 text-xs font-bold text-gold-700 transition hover:bg-gold-50">Открыть копилку <ExternalLink size={14} /></button></Card>
    </div>
  );
}
