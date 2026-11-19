import { useEffect, useMemo, useState } from 'react';
import {
  Compass, ListChecks, CalendarClock, DraftingCompass, Download, Loader2, Trash2,
  Circle, CheckCircle2, Save, FileText, AlertTriangle,
} from 'lucide-react';
import { SectionTitle, Card, Medal, Button, MentorTip } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { printAsPdf } from '@/lib/docgen';
import { GUIDES, CHECKLISTS, CYCLOGRAMS, PLAN_DIRECTIONS, PLAN_INTRO } from '@/data/rookie';

type SubTab = 'overview' | 'guides' | 'checklists' | 'cyclograms' | 'constructor';

const SUBTABS: { key: SubTab; label: string; icon: typeof Compass }[] = [
  { key: 'guides', label: 'Пошаговые гайды', icon: Compass },
  { key: 'checklists', label: 'Чек-листы на каждый день', icon: ListChecks },
  { key: 'cyclograms', label: 'Циклограммы', icon: CalendarClock },
  { key: 'constructor', label: 'Конструктор плана', icon: DraftingCompass },
];

type PlanDraft = { id: string; title: string; directions: string[]; content: string; updated_at: string };

function useToggleSet(table: 'guide_progress' | 'checklist_state', column: 'step_key' | 'item_key') {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from(table).select(column);
      if (!error && data) setKeys(new Set((data as Record<string, string>[]).map((r) => r[column])));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (key: string) => {
    const has = keys.has(key);
    setKeys((prev) => {
      const next = new Set(prev);
      if (has) next.delete(key); else next.add(key);
      return next;
    });
    const { error } = has
      ? await supabase.from(table).delete().eq(column, key)
      : await supabase.from(table).insert({ [column]: key });
    if (error) {
      setKeys((prev) => {
        const next = new Set(prev);
        if (has) next.add(key); else next.delete(key);
        return next;
      });
    }
  };

  return { keys, toggle, loading };
}

function GuidesTab() {
  const { keys, toggle, loading } = useToggleSet('guide_progress', 'step_key');
  const doneCount = keys.size;
  const totalCount = GUIDES.reduce((n, g) => n + g.steps.length, 0);

  return (
    <div className="space-y-6">
      <MentorTip tip={`Отмечайте пройденные шаги — прогресс сохраняется. Пройдено ${doneCount} из ${totalCount} шагов. Главное для молодого специалиста — не сделать всё сразу, а делать по порядку.`} />
      {GUIDES.map((g, gi) => {
        const done = g.steps.filter((s) => keys.has(s.key)).length;
        return (
          <Card key={g.id} className={`animate-fade-up overflow-hidden p-6 ${gi > 2 ? 'delay-2' : `delay-${gi + 1}`}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-ink-900">{g.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{g.desc}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${done === g.steps.length ? 'bg-pine-600 text-white' : 'bg-pine-50 text-pine-700'}`}>
                {done}/{g.steps.length}
              </span>
            </div>
            <ol className="mt-5 space-y-3">
              {g.steps.map((s) => {
                const checked = keys.has(s.key);
                return (
                  <li key={s.key} className={`rounded-xl border px-4 py-3.5 transition ${checked ? 'border-pine-200 bg-pine-50/60' : 'border-ink-100 bg-white'}`}>
                    <button onClick={() => toggle(s.key)} className="flex items-start gap-3 text-left">
                      {loading ? (
                        <Loader2 size={20} className="mt-0.5 shrink-0 animate-spin text-ink-300" />
                      ) : checked ? (
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-pine-600" />
                      ) : (
                        <Circle size={20} className="mt-0.5 shrink-0 text-ink-300" />
                      )}
                      <span>
                        <span className={`block text-sm font-bold ${checked ? 'text-pine-900' : 'text-ink-800'}`}>{s.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-ink-500">{s.why}</span>
                        <span className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-gold-700">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> Типичная ошибка: {s.pitfall}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>
        );
      })}
    </div>
  );
}

function ChecklistsTab() {
  const { keys, toggle, loading } = useToggleSet('checklist_state', 'item_key');

  return (
    <div className="space-y-6">
      <MentorTip tip="Отметки сохраняются автоматически и обнуляются по мере надобности — просто снимите галочку, чтобы начать новый день или неделю." />
      <div className="grid gap-5 lg:grid-cols-3">
        {CHECKLISTS.map((c, ci) => {
          const done = c.items.filter((i) => keys.has(i.key)).length;
          return (
            <Card key={c.id} className={`animate-fade-up p-6 delay-${ci + 1}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink-900">{c.title}</h3>
                <span className="rounded-full bg-ink-100 px-3 py-1 text-[11px] font-bold text-ink-500">{done}/{c.items.length}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">{c.period}</p>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => {
                  const checked = keys.has(i.key);
                  return (
                    <li key={i.key}>
                      <button onClick={() => toggle(i.key)} className="flex items-start gap-2.5 text-left">
                        {loading ? (
                          <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-ink-300" />
                        ) : checked ? (
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-pine-600" />
                        ) : (
                          <Circle size={18} className="mt-0.5 shrink-0 text-ink-300" />
                        )}
                        <span className={`text-sm leading-snug ${checked ? 'text-pine-900 line-through decoration-pine-300' : 'text-ink-700'}`}>{i.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CyclogramsTab() {
  return (
    <div className="space-y-6">
      <MentorTip tip="Циклограмма — это ритм, а не расписание-должник. Если что-то не успели, просто перенесите: главное, чтобы ключевые дела четверти не терялись." />
      <div className="grid gap-5 lg:grid-cols-2">
        {CYCLOGRAMS.map((c, ci) => (
          <Card key={c.id} className={`animate-fade-up p-6 delay-${Math.min(ci + 1, 3)}`}>
            <h3 className="font-bold text-ink-900">{c.title}</h3>
            <p className="mt-1 text-sm text-ink-500">{c.desc}</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-ink-100">
              {c.rows.map((r, ri) => (
                <div key={ri} className={`px-4 py-3 ${ri % 2 === 0 ? 'bg-ink-50/70' : 'bg-white'}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-pine-700">{r.when}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-800">{r.what}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{r.note}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function buildPlanText(classLabel: string, year: string, chosen: string[]): string {
  const dirLines = PLAN_DIRECTIONS.filter((d) => chosen.includes(d.key))
    .map((d) => `${d.title}:\n${d.blocks.map((b) => `  — ${b}`).join('\n')}`)
    .join('\n\n');
  return `${PLAN_INTRO(year)}

Класс: ${classLabel}

Цель: создание условий для воспитания активной, творческой личности через систему ключевых дел класса.

Задачи:
  1. Обеспечить участие каждого ученика в коллективных творческих делах.
  2. Развивать самоуправление через систему ролей и поручений.
  3. Отслеживать настроение класса через анонимную диагностику.

Направления и ключевые дела:

${dirLines}

Работа с семьями: памятки «Родительского университета», собрания по итогам четверти.

Анализ эффективности: сравнение замеров настроения в начале и конце полугодия, журнал собраний.`;
}

function ConstructorTab({ classProfile }: { classProfile: { grade: string; letter: string; year: string } | null }) {
  const year = classProfile?.year || String(new Date().getFullYear());
  const classLabel = classProfile ? `${classProfile.grade} «${classProfile.letter}»` : '— класс';
  const [chosen, setChosen] = useState<string[]>(['patriot', 'moral', 'health']);
  const [drafts, setDrafts] = useState<PlanDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('plan_drafts').select('id, title, directions, content, updated_at').order('updated_at', { ascending: false });
      if (err) setError('Не удалось загрузить черновики планов.');
      else setDrafts((data || []) as PlanDraft[]);
    })();
  }, []);

  const preview = useMemo(() => buildPlanText(classLabel, year, chosen), [classLabel, year, chosen]);

  const toggleDir = (key: string) => {
    setChosen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const saveDraft = async () => {
    if (saving || chosen.length === 0) return;
    setSaving(true);
    const { data, error: err } = await supabase
      .from('plan_drafts')
      .insert({ title: `План класса ${classLabel} · ${year}`, directions: chosen, content: preview })
      .select('id, title, directions, content, updated_at')
      .single();
    if (err || !data) setError('Не удалось сохранить черновик.');
    else {
      setDrafts((prev) => [data as PlanDraft, ...prev]);
      setError(null);
    }
    setSaving(false);
  };

  const removeDraft = async (id: string) => {
    const prev = drafts;
    setDrafts((list) => list.filter((d) => d.id !== id));
    const { error: err } = await supabase.from('plan_drafts').delete().eq('id', id);
    if (err) {
      setDrafts(prev);
      setError('Не удалось удалить черновик.');
    }
  };

  const download = (draft?: PlanDraft) => {
    const text = draft ? draft.content : preview;
    printAsPdf(draft ? draft.title : `План воспитательной работы ${year}`, text);
  };

  return (
    <div className="space-y-6">
      <MentorTip tip="Выберите 3–4 направления — этого достаточно для исполняемого плана. Черновик сохраняется в приложении, и его можно доработать после замечаний замдиректора." />
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="animate-fade-up delay-1 p-6">
          <h3 className="font-bold text-ink-900">Направления воспитания</h3>
          <p className="mt-1 text-sm text-ink-500">Отметьте приоритетные направления — справа соберётся черновик плана.</p>
          <ul className="mt-4 space-y-2">
            {PLAN_DIRECTIONS.map((d) => {
              const on = chosen.includes(d.key);
              return (
                <li key={d.key}>
                  <button
                    onClick={() => toggleDir(d.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${on ? 'border-pine-400 bg-pine-50 text-pine-900' : 'border-ink-200 bg-white text-ink-700 hover:border-pine-300'}`}
                  >
                    {on ? <CheckCircle2 size={18} className="shrink-0 text-pine-600" /> : <Circle size={18} className="shrink-0 text-ink-300" />}
                    {d.title}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={saveDraft} disabled={saving || chosen.length === 0}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить черновик
            </Button>
            <Button variant="ghost" onClick={() => download()}>
              <Download size={16} /> Сохранить в PDF
            </Button>
          </div>
          {chosen.length === 0 && <p className="mt-3 text-xs text-gold-700">Выберите хотя бы одно направление.</p>}
        </Card>

        <div className="space-y-5">
          <Card className="animate-fade-up delay-2 p-6">
            <h3 className="flex items-center gap-2 font-bold text-ink-900"><FileText size={18} className="text-pine-600" /> Предпросмотр плана</h3>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-ink-50 p-4 text-xs leading-relaxed text-ink-700">{preview}</pre>
          </Card>

          {drafts.length > 0 && (
            <Card className="animate-fade-up delay-3 p-6">
              <h3 className="font-bold text-ink-900">Мои черновики</h3>
              <ul className="mt-4 space-y-2">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-800">{d.title}</p>
                      <p className="text-[11px] text-ink-400">{new Date(d.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => download(d)} className="rounded-lg p-2 text-ink-400 transition hover:bg-pine-50 hover:text-pine-600" aria-label="Скачать черновик"><Download size={15} /></button>
                      <button onClick={() => removeDraft(d.id)} className="rounded-lg p-2 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Удалить черновик"><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RookiePage({ classProfile }: { classProfile: { grade: string; letter: string; year: string } | null }) {
  const [sub, setSub] = useState<SubTab>('overview');

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Трек молодого специалиста"
        subtitle="Пошаговое сопровождение первого года работы классным руководителем: гайды с типичными ошибками, чек-листы на каждый день, готовые циклограммы и интерактивный конструктор плана воспитательной работы."
        mentorTip="Не пытайтесь освоить всё сразу. Начните с чек-листа «Каждый день» — он займёт 10 минут, а гайды проходите по мере необходимости." />

      {sub === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {SUBTABS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSub(s.key)}
                  className={`animate-fade-up delay-${i + 1} group flex items-start gap-4 rounded-[1.25rem] border border-ink-200/80 border-l-4 border-l-gold-400 bg-white p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-gold-300 hover:shadow-lift`}
                >
                  <Medal tone="gold"><Icon size={20} /></Medal>
                  <span>
                    <span className="block font-bold text-ink-900 group-hover:text-pine-700">{s.label}</span>
                    <span className="mt-1 block text-sm text-ink-500">{OVERVIEW_DESC[s.key as Exclude<SubTab, 'overview'>]}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <Card className="animate-fade-up delay-2 bg-gradient-to-br from-white to-pine-50/50 p-6">
            <h3 className="font-bold text-ink-900">Как устроен трек</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {[
                { n: '1', t: 'Гайды', d: 'Разберитесь с ключевыми задачами первого года — по 4 шага каждый.' },
                { n: '2', t: 'Чек-листы', d: 'Введите рутину в привычный ритм: день, неделя, мероприятие.' },
                { n: '3', t: 'Циклограммы', d: 'Держите в голове картину недели, месяца, четверти и года.' },
                { n: '4', t: 'Конструктор', d: 'Соберите черновик плана воспитательной работы за один вечер.' },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border border-pine-100 bg-white p-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-600 text-xs font-extrabold text-white">{s.n}</span>
                  <p className="mt-2.5 text-sm font-bold text-ink-800">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.d}</p>
                </div>
              ))}
            </div>
            <Button className="mt-6" onClick={() => setSub('guides')}>Начать с гайдов</Button>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSub('overview')} className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-600 transition hover:border-pine-300 hover:bg-pine-50">
              ← Обзор трека
            </button>
            {SUBTABS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSub(s.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${sub === s.key ? 'bg-pine-700 text-white shadow-lift' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:bg-pine-50'}`}
                >
                  <Icon size={14} /> {s.label}
                </button>
              );
            })}
          </div>
          {sub === 'guides' && <GuidesTab />}
          {sub === 'checklists' && <ChecklistsTab />}
          {sub === 'cyclograms' && <CyclogramsTab />}
          {sub === 'constructor' && <ConstructorTab classProfile={classProfile} />}
        </div>
      )}
    </div>
  );
}

const OVERVIEW_DESC: Record<Exclude<SubTab, 'overview'>, string> = {
  guides: 'Пошаговые инструкции первого года с пояснениями и типичными ошибками новичков.',
  checklists: 'Ежедневные и еженедельные рутины плюс чек-лист готовности к мероприятию.',
  cyclograms: 'Готовые ритмы работы: неделя, месяц, четверть и весь учебный год.',
  constructor: 'Соберите черновик плана воспитательной работы и скачайте готовый текст.',
};
