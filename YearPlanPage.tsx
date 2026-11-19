import { useEffect, useState } from 'react';
import { CalendarRange, Plus, Trash2, Loader2, Info, Download, Wand2 } from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type PlanItem = { id: string; month: number; direction: string; title: string };

const SCHOOL_YEAR_MONTHS = ['Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август'];

const DIRECTIONS = [
  'Идейно-нравственное воспитание',
  'Гражданско-патриотическое воспитание',
  'Социально-коммуникативное воспитание',
  'Здоровьесберегающее воспитание',
  'Трудовое и профориентационное воспитание',
  'Экологическое воспитание',
  'Культура безопасной жизнедеятельности',
  'Воспитание культуры быта и досуга',
];

const SUGGESTIONS: Record<string, { month: number; title: string }[]> = {
  'Идейно-нравственное воспитание': [
    { month: 0, title: 'Единый урок «Беларусь — наша Родина» ко Дню народного единства' },
    { month: 1, title: 'Час общения «Семейные ценности» ко Дню матери' },
  ],
  'Гражданско-патриотическое воспитание': [
    { month: 5, title: 'Урок мужества ко Дню защитника Отечества' },
    { month: 8, title: 'Акция «Чистый обелиск» и вахта Памяти ко Дню Победы' },
  ],
  'Социально-коммуникативное воспитание': [
    { month: 0, title: 'Игровой тренинг «Давайте познакомимся» — сплочение коллектива' },
    { month: 2, title: 'Дискуссия «Мой класс — моя команда»' },
  ],
  'Здоровьесберегающее воспитание': [
    { month: 0, title: 'Единый день здоровья: поход и подвижные игры' },
    { month: 9, title: 'Час здоровья «Безопасные каникулы»' },
  ],
  'Трудовое и профориентационное воспитание': [
    { month: 1, title: 'Экскурсия на предприятие города (профориентация)' },
    { month: 5, title: 'Операция «Чистый кабинет» — дежурство и трудовой десант' },
  ],
  'Экологическое воспитание': [
    { month: 7, title: 'Акция «Посади дерево» и уборка памятных мест' },
    { month: 0, title: 'Экологический марафон «Земля — наш дом»' },
  ],
  'Культура безопасной жизнедеятельности': [
    { month: 0, title: 'Инструктаж и игра по правилам безопасного поведения' },
    { month: 6, title: 'Встреча с работниками МЧС «Безопасность — это важно»' },
  ],
  'Воспитание культуры быта и досуга': [
    { month: 3, title: 'Новогодняя программа класса и вечер отдыха' },
    { month: 8, title: 'Итоговое классное дело «Год живёт — класс гордится»' },
  ],
};

const selectCls = 'rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100';

export default function YearPlanPage() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(0);
  const [direction, setDirection] = useState(DIRECTIONS[0]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [openMonths, setOpenMonths] = useState<number[]>([0]);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('year_plan_items')
        .select('id, month, direction, title')
        .order('month')
        .order('created_at');
      if (err) setError('Не удалось загрузить план.');
      else setItems((data || []) as PlanItem[]);
      setLoading(false);
    })();
  }, []);

  const addItem = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const { data, error: err } = await supabase
      .from('year_plan_items')
      .insert({ month, direction, title: title.trim() })
      .select('id, month, direction, title')
      .single();
    if (err || !data) setError('Не удалось сохранить мероприятие.');
    else {
      setItems((prev) => [...prev, data as PlanItem]);
      setTitle('');
      setError(null);
    }
    setSaving(false);
  };

  const removeItem = async (id: string) => {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    const { error: err } = await supabase.from('year_plan_items').delete().eq('id', id);
    if (err) {
      setItems(prev);
      setError('Не удалось удалить мероприятие.');
    }
  };

  const addSuggestions = async (dir: string) => {
    const sugg = SUGGESTIONS[dir] ?? [];
    if (!sugg.length) return;
    setSaving(true);
    const rows = sugg.map((s) => ({ month: s.month, direction: dir, title: s.title }));
    const { data, error: err } = await supabase.from('year_plan_items').insert(rows).select('id, month, direction, title');
    if (err || !data) setError('Не удалось добавить типовые мероприятия.');
    else {
      setItems((prev) => [...prev, ...(data as PlanItem[])]);
      setError(null);
    }
    setSaving(false);
  };

  const downloadPlan = () => {
    const lines = [
      `ПЛАН ИДЕОЛОГИЧЕСКОЙ И ВОСПИТАТЕЛЬНОЙ РАБОТЫ НА УЧЕБНЫЙ ГОД`,
      '',
      ...SCHOOL_YEAR_MONTHS.filter((_, m) => items.some((i) => i.month === m)).flatMap((mName) => {
        const m = SCHOOL_YEAR_MONTHS.indexOf(mName);
        return [
          `${mName}:`,
          ...items.filter((i) => i.month === m).map((i) => `  — [${i.direction}] ${i.title}`),
          '',
        ];
      }),
      items.length === 0 ? 'План пока не заполнен.' : '',
      'Подготовлено в приложении «Настаўнік PRO»',
    ];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Годовой план воспитательной работы</title>
<style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;}p{margin:0 0 6pt 0;}</style></head>
<body>${lines
      .map((l) => (l.trim() ? `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '<p>&nbsp;</p>'))
      .join('')}</body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const total = items.length;

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Годовой план воспитательной работы"
        subtitle="Главный документ классного руководителя: мероприятия по направлениям воспитания и месяцам учебного года. Формируйте план из типовых предложений или добавляйте свои дела — и скачивайте готовый документ."
        mentorTip="Начните с типовых мероприятий по каждому направлению — а потом замените часть своими делами класса. Хороший план — это 2–3 дела в месяц, которые действительно состоятся." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <Info size={18} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card className="animate-fade-up p-6">
            <h3 className="flex items-center gap-2 font-bold text-ink-900">
              <Plus size={18} className="text-pine-600" /> Добавить мероприятие
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Месяц</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={`mt-1 w-full ${selectCls}`}>
                  {SCHOOL_YEAR_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Направление воспитания</span>
                <select value={direction} onChange={(e) => setDirection(e.target.value)} className={`mt-1 w-full ${selectCls}`}>
                  {DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Мероприятие</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Например, «Экскурсия в краеведческий музей»"
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                />
              </label>
              <Button onClick={addItem} disabled={!title.trim() || saving} className="w-full">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} В план
              </Button>
            </div>
          </Card>

          <Card className="animate-fade-up delay-1 p-6">
            <h3 className="flex items-center gap-2 font-bold text-ink-900">
              <Wand2 size={18} className="text-gold-600" /> Типовые мероприятия
            </h3>
            <p className="mt-1 text-xs text-ink-400">Добавьте проверенные дела по направлению одним кликом — затем отредактируйте под свой класс.</p>
            <div className="mt-4 flex flex-col gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => addSuggestions(d)}
                  disabled={saving}
                  className="rounded-full border border-pine-200 bg-white px-3 py-2 text-left text-xs font-semibold text-pine-700 transition hover:bg-pine-50 disabled:opacity-60"
                >
                  + {d}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="animate-fade-up flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-bold text-ink-900">В плане {total} мероприятий</p>
              <p className="text-xs text-ink-400">Сентябрь — август учебного года</p>
            </div>
            <Button onClick={downloadPlan} disabled={total === 0} variant="ghost">
              {total === 0 ? <CalendarRange size={16} /> : <Download size={16} />} Сохранить в PDF
            </Button>
          </Card>

          {loading ? (
            <Card className="p-6"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
          ) : total === 0 ? (
            <Card className="p-8 text-center text-sm text-ink-400">
              План пуст. Добавьте типовые мероприятия — и распределите их по месяцам.
            </Card>
          ) : (
            SCHOOL_YEAR_MONTHS.map((mName, m) => {
              const monthItems = items.filter((i) => i.month === m);
              if (!monthItems.length) return null;
              const open = openMonths.includes(m);
              return (
                <Card key={mName} className="animate-fade-up overflow-hidden">
                  <button
                    onClick={() => setOpenMonths((prev) => (open ? prev.filter((x) => x !== m) : [...prev, m]))}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-ink-50"
                  >
                    <span className="font-bold text-ink-900">{mName}</span>
                    <span className="rounded-full bg-pine-50 px-3 py-1 text-[11px] font-bold text-pine-700">{monthItems.length}</span>
                  </button>
                  {open && (
                    <ul className="border-t border-ink-100 px-6 py-4">
                      {monthItems.map((i) => (
                        <li key={i.id} className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <p className="text-sm leading-relaxed text-ink-800">{i.title}</p>
                            <span className="mt-1 inline-block rounded-full bg-pine-50 px-2.5 py-0.5 text-[11px] font-semibold text-pine-700">{i.direction}</span>
                          </div>
                          <button onClick={() => removeItem(i.id)} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Удалить ${i.title}`}>
                            <Trash2 size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
