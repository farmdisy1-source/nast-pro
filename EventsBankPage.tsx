import { useEffect, useMemo, useState } from 'react';
import { Box, Plus, Trash2, CheckCircle2, Loader2, Info, Sparkles, Landmark, Users, Presentation, CalendarDays, Flag } from 'lucide-react';
import { SectionTitle, Card, Medal, Button, Pill } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { HOLIDAY_CALENDAR, MONTH_NAMES, CALENDAR_YEAR } from '@/data/calendarDates';

type BankEvent = {
  id: string;
  title: string;
  category: string;
  audience: string;
  summary: string;
  steps: string[];
  author_note: string;
  applied_count: number;
};

const CATEGORY_META: Record<string, { icon: typeof Sparkles; chip: string }> = {
  'шаг': { icon: Sparkles, chip: 'bg-pine-50 text-pine-700 border-pine-200' },
  'родительский': { icon: Users, chip: 'bg-gold-100 text-gold-700 border-gold-200' },
  'патриотический': { icon: Landmark, chip: 'bg-ink-100 text-ink-700 border-ink-200' },
  'классный час': { icon: Presentation, chip: 'bg-pine-50 text-pine-700 border-pine-200' },
};

const CATEGORIES = ['все', 'шаг', 'классный час', 'родительский', 'патриотический'];

const TABS = [
  { key: 'events', label: 'Мероприятия', icon: Sparkles },
  { key: 'calendar', label: 'Календарь праздников и памятных дат', icon: CalendarDays },
] as const;

type Tab = (typeof TABS)[number]['key'];

const EMPTY_FORM = { title: '', category: 'классный час', audience: '', summary: '', steps: '', author_note: '' };

export default function EventsBankPage() {
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<BankEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('events_bank')
        .select('id, title, category, audience, summary, steps, author_note, applied_count')
        .order('applied_count', { ascending: false });
      if (err) setError('Не удалось загрузить копилку мероприятий.');
      else setEvents((data || []) as BankEvent[]);
      setLoading(false);
    })();
  }, []);

  const addEvent = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const steps = form.steps.split('\n').map((s) => s.trim()).filter(Boolean);
    const { data, error: err } = await supabase
      .from('events_bank')
      .insert({
        title: form.title.trim(),
        category: form.category,
        audience: form.audience.trim(),
        summary: form.summary.trim(),
        steps,
        author_note: form.author_note.trim(),
      })
      .select('id, title, category, audience, summary, steps, author_note, applied_count')
      .single();
    if (err || !data) {
      setError('Не удалось сохранить мероприятие. Проверьте заполнение.');
    } else {
      setEvents((prev) => [data as BankEvent, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setError(null);
    }
    setSaving(false);
  };

  const apply = async (ev: BankEvent) => {
    const next = ev.applied_count + 1;
    setApplied((prev) => ({ ...prev, [ev.id]: next }));
    const { error: err } = await supabase.from('events_bank').update({ applied_count: next }).eq('id', ev.id);
    if (err) {
      setApplied((prev) => {
        const copy = { ...prev };
        delete copy[ev.id];
        return copy;
      });
      setError('Не удалось отметить «взяли в работу».');
    }
  };

  const remove = async (id: string) => {
    const prev = events;
    setEvents((list) => list.filter((e) => e.id !== id));
    const { error: err } = await supabase.from('events_bank').delete().eq('id', id);
    if (err) {
      setEvents(prev);
      setError('Не удалось удалить мероприятие.');
    }
  };

  const visible = useMemo(() => events, [events]);

  if (tab === 'calendar') {
    const today = new Date();
    const nowMonth = today.getFullYear() === CALENDAR_YEAR ? today.getMonth() : null;
    const todayDay = today.getDate();
    return (
      <div className="space-y-8">
        <SectionTitle
          title="Календарь государственных праздников и памятных дат Республики Беларусь"
          subtitle={`Ключевые даты ${CALENDAR_YEAR} года для планирования воспитательной работы: государственные праздники и памятные даты, к которым удобно привязать классный час или дело шестого школьного дня.`}
          mentorTip="Планируйте дела по датам заранее: за две-три недели до памятной даты выберите мероприятие из копилки — так подготовка пройдёт без спешки."
        />
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  t.key === tab
                    ? 'bg-pine-600 text-white shadow-sm'
                    : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:text-pine-700'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MONTH_NAMES.map((mn, mi) => {
            const dates = HOLIDAY_CALENDAR[mi] || [];
            const isNow = nowMonth === mi;
            return (
              <Card key={mn} className={`animate-fade-up overflow-hidden p-0 ${isNow ? 'border-pine-400 ring-2 ring-pine-100' : ''}`}>
                <div className={`flex items-center justify-between px-5 py-3 ${isNow ? 'bg-pine-700 text-white' : 'bg-ink-50/70 text-ink-800'}`}>
                  <span className="text-sm font-extrabold capitalize">{mn}</span>
                  {isNow && <Pill><span className="text-pine-700">текущий месяц</span></Pill>}
                </div>
                <ul className="divide-y divide-ink-100 px-5 py-2">
                  {dates.length === 0 && <li className="py-3 text-xs text-ink-400">Значимых дат нет</li>}
                  {dates.map((d, di) => {
                    const isToday = isNow && d.day === todayDay;
                    return (
                      <li key={`${d.day}-${di}`} className={`flex items-start gap-3 py-2.5 ${isToday ? 'rounded-lg bg-gold-100/50' : ''}`}>
                        <span className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-bold leading-none ${d.kind === 'state' ? 'bg-pine-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                          {d.day}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold leading-snug text-ink-800">{d.title}</span>
                          <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wide ${d.kind === 'state' ? 'text-pine-600' : 'text-ink-400'}`}>
                            {d.kind === 'state' ? 'Государственный праздник' : 'Памятная дата'}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
        <Card className="flex items-start gap-3 p-5 text-sm leading-relaxed text-ink-500">
          <Flag size={18} className="mt-0.5 shrink-0 text-pine-600" />
          Государственные праздники — нерабочие дни по Указу Президента Республики Беларусь. Памятные даты отмечаются мероприятиями воспитательной направленности. Список включает основные даты — дополните его локальными традициями вашего учреждения образования.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Методическая копилка"
        subtitle="Обмен апробированными воспитательными мероприятиями. Каждый материал — с ходом занятия по минутам и авторским комментарием. Отмечайте «взяли в работу»: чем выше счётчик, тем заметнее востребованность материала методистам и жюри."
        mentorTip="Начните с материалов с наибольшим счётчиком «взяли в работу» — они уже проверены коллегами. Свой опыт обязательно добавьте: именно живой обмен делает копилку настоящей."
      />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <Info size={18} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  t.key === tab
                    ? 'bg-pine-600 text-white shadow-sm'
                    : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:text-pine-700'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Скрыть форму' : <><Plus size={16} /> Поделиться материалом</>}
        </Button>
      </div>

      {tab === 'events' && showForm && (
        <Card className="animate-fade-up p-6">
          <h3 className="font-bold text-ink-900">Новый материал в копилку</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Название мероприятия"
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100 sm:col-span-2"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-pine-400"
            >
              {CATEGORIES.filter((c) => c !== 'все').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              placeholder="Аудитория (например, V–IX классы)"
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Краткое описание"
              rows={2}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100 sm:col-span-2"
            />
            <textarea
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              placeholder={'Ход занятия — по одному шагу на строку:\nБеседа «Что такое качество» (10 мин)\nРабота в группах (12 мин)\nРефлексия (8 мин)'}
              rows={4}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100 sm:col-span-2"
            />
            <input
              value={form.author_note}
              onChange={(e) => setForm({ ...form, author_note: e.target.value })}
              placeholder="Авторский комментарий (как это прошло у вас)"
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100 sm:col-span-2"
            />
          </div>
          <Button onClick={addEvent} disabled={!form.title.trim() || saving} className="mt-4">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Сохранить в копилку
          </Button>
        </Card>
      )}

      {tab === 'events' && (loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-52 rounded-2xl" />
          <div className="skeleton h-52 rounded-2xl" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center">
          <Box className="mx-auto text-ink-300" size={32} />
          <p className="mt-3 text-sm text-ink-500">В этой категории пока пусто. Поделитесь первым материалом!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">          {visible.map((ev, i) => {
            const meta = CATEGORY_META[ev.category] || CATEGORY_META['классный час'];
            const Icon = meta.icon;
            const count = applied[ev.id] ?? ev.applied_count;
            return (
              <Card key={ev.id} className={`animate-fade-up delay-${Math.min(i + 1, 6)} flex flex-col p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Medal tone={count >= 10 ? 'gold' : 'pine'}>
                      <Icon size={18} />
                    </Medal>
                    <div>
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.chip}`}>
                        {ev.category}
                      </span>
                      {ev.audience && <p className="mt-1 text-[11px] text-ink-400">{ev.audience}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(ev.id)}
                    className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Удалить ${ev.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 className="mt-3 font-bold leading-snug text-ink-900">{ev.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{ev.summary}</p>

                {ev.steps.length > 0 && (
                  <ol className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4">
                    {ev.steps.map((s, si) => (
                      <li key={si} className="flex gap-2.5 text-xs leading-relaxed text-ink-700">
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-pine-600 text-[9px] font-bold text-white" style={{ height: 18, width: 18 }}>
                          {si + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                )}

                {ev.author_note && (
                  <p className="mt-3 border-l-2 border-gold-300 pl-3 text-xs italic leading-relaxed text-ink-500">
                    {ev.author_note}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-4">
                  <button
                    onClick={() => apply(ev)}
                    className="flex items-center gap-2 rounded-lg border border-pine-200 bg-pine-50 px-3.5 py-2 text-xs font-bold text-pine-700 transition hover:bg-pine-100 active:scale-[0.98]"
                  >
                    <CheckCircle2 size={14} /> Взяли в работу
                  </button>
                  <span className="text-xs font-bold text-ink-500">{count} {count === 1 ? 'раз' : 'раз'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}