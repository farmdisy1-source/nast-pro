import { useEffect, useMemo, useState } from 'react';
import {
  Wand2, FileText, ClipboardList, HeartPulse, Download, Loader2, Trash2,
  Save, AlertTriangle, CalendarRange, Users, ShieldCheck, FileCheck, FileEdit,
  Sparkles, Undo2,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { CYCLEGRAM } from '@/data/cyclegram';
import {
  loadFacts, buildQuarterReport, buildSelfAnalysis, buildMeetingProtocol,
  buildMoodDigest, buildParentsMeetingScript, buildClassCharacteristic,
  buildSocialPedagogicalCharacteristic, buildEducationPlan, buildOfficialParentProtocol,
  type ProtocolChoices,
  downloadDoc, downloadDocWord, loadOrgSettings, saveOrgSettings, letterheadHeader, letterheadFooter,
  applyLetterhead, type BuiltDoc, type CharacteristicChoices, type OrgSettings,
} from '@/lib/docgen';

type ClassProfile = { grade: string; letter: string; year: string } | null;
type SavedDoc = { id: string; doc_type: string; title: string; content: string; updated_at: string };
type Facts = Awaited<ReturnType<typeof loadFacts>>;

function useFacts() {
  const [facts, setFacts] = useState<Facts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const f = await loadFacts();
      if (f) setFacts(f);
      else setError('Не удалось собрать данные. Проверьте соединение и обновите страницу.');
      setLoading(false);
    })();
  }, []);

  return { facts, loading, error };
}

const MEETING_TOPICS = [
  'Итоги четверти и ключевые даты',
  'Настроение класса (по данным анонимного опроса)',
  'Занятия шестого школьного дня: что будет в следующем месяце',
  'Режим дня и цифровая гигиена',
  'Как помочь ребёнку в учёбе без давления',
];

const GENERATOR_META: Record<string, { icon: typeof FileText; title: string; desc: string }> = {
  'quarter-report': { icon: FileText, title: 'Отчёт за четверть', desc: 'Хронология собраний, состав класса числом, роли, динамика настроения — готовый текст отчёта.' },
  'self-analysis': { icon: ClipboardList, title: 'Самоанализ деятельности', desc: 'Фактура собирается автоматически, вам остаётся дописать два вывода и задачу.' },
  'mood-digest': { icon: HeartPulse, title: 'Анализ настроения класса', desc: 'Агрегированные результаты опроса за 7 дней с готовой интерпретацией и рекомендацией.' },
  'social-pedagogical-characteristic': { icon: Users, title: 'Социально-педагогическая характеристика класса', desc: 'Официальная таблица из образца: общие сведения и 14 социально-педагогических категорий.' },
  'social-passport': { icon: Users, title: 'Социальный паспорт и занятость', desc: 'Числовые показатели соцпаспорта и охват класса внеурочной занятостью — без персональных данных.' },
  'education-plan-official': { icon: CalendarRange, title: 'План воспитательной работы', desc: 'Официальная форма на полугодие или учебный год с мероприятиями, сроками, местом и ответственными.' },
};

function DocPreview({ doc, onClose, classLabel }: { doc: BuiltDoc; onClose: () => void; classLabel: string }) {
  const [content, setContent] = useState(doc.content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  useEffect(() => setContent(doc.content), [doc]);
  useEffect(() => { void loadOrgSettings().then(setOrg); }, []);

  const improveWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setOriginalContent(content);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'document', prompt: { docType: doc.title, text: content } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.text) setContent(data.text);
    } catch {
      setAiError('ИИ временно недоступен. Попробуйте позже.');
      setOriginalContent(null);
    }
    setAiLoading(false);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const title = `${doc.title} · ${new Date().toLocaleDateString('ru-RU')}`;
    const { data, error } = await supabase
      .from('generated_docs')
      .insert({ doc_type: doc.type, title, content })
      .select('id, doc_type, title, content, updated_at')
      .single();
    if (error || !data) setSaveError('Не удалось сохранить черновик.');
    else {
      setSaved(true);
      setSaveError(null);
    }
    setSaving(false);
  };

  const exportContent = org
    ? applyLetterhead(content, letterheadHeader(org, doc.title, classLabel), letterheadFooter(org))
    : content;
  const changed = content !== doc.content;

  return (
    <Card className="animate-fade-up border-pine-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-ink-900"><FileCheck size={18} className="text-pine-600" /> {doc.title}</h3>
          <p className="mt-1 text-xs text-ink-400">{doc.dataNote}</p>
        </div>
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-500 transition hover:bg-ink-100">Закрыть</button>
      </div>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        rows={18}
        className="mt-4 w-full rounded-xl border border-ink-200 bg-ink-50 p-4 font-mono text-xs leading-relaxed text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={() => downloadDoc(doc.title, exportContent)}><Download size={16} /> Сохранить в PDF</Button>
        <Button onClick={() => downloadDocWord(doc.title, exportContent)} variant="ghost"><FileText size={16} /> Скачать в Word</Button>
        <Button variant="ghost" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saved ? 'Черновик сохранён' : 'Сохранить черновик'}
        </Button>
        <Button variant="ghost" onClick={improveWithAI} disabled={aiLoading} className="border-pine-200 text-pine-700 hover:bg-pine-50">
          {aiLoading ? <><Loader2 size={16} className="animate-spin" /> ИИ улучшает текст…</> : <><Sparkles size={16} /> Улучшить с ИИ</>}
        </Button>
        {originalContent && (
          <Button variant="ghost" onClick={() => { setContent(originalContent); setOriginalContent(null); }} className="text-ink-500">
            <Undo2 size={16} /> Вернуть исходный
          </Button>
        )}
        {changed && !saved && <span className="text-xs text-ink-400">Формулировки изменены — скачается ваша правка.</span>}
      </div>
      {saveError && <p className="mt-2 flex items-center gap-2 text-sm text-gold-700"><AlertTriangle size={14} /> {saveError}</p>}
      {aiError && <p className="mt-2 flex items-center gap-2 text-sm text-gold-700"><AlertTriangle size={14} /> {aiError}</p>}
    </Card>
  );
}

function GeneratorCard({ doc, onGenerate, hasData }: { doc: BuiltDoc; onGenerate: () => void; hasData: boolean }) {
  const meta = GENERATOR_META[doc.type];
  const Icon = meta?.icon ?? FileText;
  return (
    <Card className="animate-fade-up flex flex-col p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-pine-600"><Icon size={20} /></span>
        <div>
          <h3 className="font-bold text-ink-900">{meta?.title ?? doc.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{meta?.desc}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-400">
        <ShieldCheck size={13} className="shrink-0 text-pine-500" /> Только агрегированные данные, без персональных сведений
      </div>
      <div className="mt-auto pt-5">
        <Button onClick={onGenerate} disabled={!hasData}>{hasData ? <><Wand2 size={16} /> Собрать документ</> : 'Нет данных'}</Button>
        {!hasData && <p className="mt-2 text-xs text-ink-400">Данные ещё не внесены в соответствующих разделах.</p>}
      </div>
    </Card>
  );
}

type CharKey = keyof CharacteristicChoices;

const CHAR_OPTIONS: { key: CharKey; label: string; hint: string; options: { value: string; label: string }[] }[] = [
  { key: 'performance', label: 'Успеваемость', hint: 'Общая картина учебных результатов', options: [
    { value: 'high', label: 'Высокая' }, { value: 'medium', label: 'Средняя' }, { value: 'below', label: 'Ниже среднего' }, { value: 'mixed', label: 'Неоднородная' },
  ] },
  { key: 'character', label: 'Характер класса', hint: 'Психологический климат коллектива', options: [
    { value: 'calm', label: 'Спокойный' }, { value: 'active', label: 'Активный' }, { value: 'contrast', label: 'Контрастный' }, { value: 'closed', label: 'Замкнутый' },
  ] },
  { key: 'participation', label: 'Участие в жизни класса', hint: 'Насколько класс включён в дела', options: [
    { value: 'active', label: 'Активное' }, { value: 'moderate', label: 'Умеренное' }, { value: 'passive', label: 'Пассивное' },
  ] },
  { key: 'attitude', label: 'Отношение к делам класса', hint: 'Как выполняются поручения', options: [
    { value: 'responsible', label: 'Ответственное' }, { value: 'selective', label: 'Избирательное' }, { value: 'indifferent', label: 'Безразличное' },
  ] },
  { key: 'mutualHelp', label: 'Взаимопомощь', hint: 'Поддержка друг друга в учёбе и делах', options: [
    { value: 'developed', label: 'Развита' }, { value: 'situational', label: 'Ситуативная' }, { value: 'weak', label: 'Слабая' },
  ] },
  { key: 'cohesion', label: 'Сплочённость', hint: 'Уровень единства коллектива', options: [
    { value: 'high', label: 'Высокая' }, { value: 'medium', label: 'Средняя' }, { value: 'low', label: 'Низкая' },
  ] },
];

const DEFAULT_CHOICES: CharacteristicChoices = {
  performance: 'medium', character: 'calm', participation: 'moderate',
  attitude: 'responsible', mutualHelp: 'situational', cohesion: 'medium', yearTheme: '',
};

function CharacteristicBuilder({ classLabel, year, facts, onBuild }: { classLabel: string; year: string; facts: Facts; onBuild: (doc: BuiltDoc) => void }) {
  const [choices, setChoices] = useState<CharacteristicChoices>(DEFAULT_CHOICES);
  const set = (k: CharKey, v: string) => setChoices((c) => ({ ...c, [k]: v }));

  return (
    <Card className="animate-fade-up delay-3 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-600"><FileEdit size={20} /></span>
        <div>
          <h3 className="font-bold text-ink-900">Конструктор характеристики класса</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">Выберите характеристики в списках — соберётся связный педагогический текст характеристики класса {classLabel}. Состав числом подтянется автоматически.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {CHAR_OPTIONS.map((f2) => (
          <label key={f2.key} className="block">
            <span className="block text-xs font-bold text-ink-700">{f2.label}</span>
            <span className="block text-[11px] text-ink-400">{f2.hint}</span>
            <select
              value={choices[f2.key]}
              onChange={(e) => set(f2.key, e.target.value)}
              className="mt-1.5 w-full min-h-[44px] rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            >
              {f2.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        ))}
        <label className="block sm:col-span-2">
          <span className="block text-xs font-bold text-ink-700">Особенность года (необязательно)</span>
          <span className="block text-[11px] text-ink-400">Например: «Год качества», «Год белорусской женщины» — вплетётся в текст</span>
          <input
            type="text"
            value={choices.yearTheme}
            onChange={(e) => set('yearTheme', e.target.value)}
            placeholder="Направление воспитательной работы"
            className="mt-1.5 w-full min-h-[44px] rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-800 outline-none transition placeholder:font-normal placeholder:text-ink-400 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
        </label>
      </div>
      <Button className="mt-5" onClick={() => onBuild(buildClassCharacteristic(choices, facts, classLabel, year))}>
        <Wand2 size={16} /> Собрать характеристику
      </Button>
    </Card>
  );
}

function OfficialProtocolBuilder({ classLabel, onBuild }: { classLabel: string; onBuild: (doc: BuiltDoc) => void }) {
  const [choices, setChoices] = useState<ProtocolChoices>({
    orgName: '', classLabel, date: '', number: '', chair: '', secretary: '', present: '',
    agenda: ['Итоги четверти и ключевые даты', 'О воспитательной работе класса'],
    discussions: ['', ''], decisions: ['', ''], responsible: ['', ''], deadlines: ['', ''],
  });
  const update = (key: keyof ProtocolChoices, value: string) => setChoices((prev) => ({ ...prev, [key]: value }));
  return (
    <Card className="animate-fade-up p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700"><FileCheck size={20} /></span>
        <div><h3 className="font-bold text-ink-900">Протокол по официальной форме</h3><p className="mt-1 text-sm leading-relaxed text-ink-500">Заполните реквизиты и вопросы — документ будет собран с блоками «Слушали» и «Решили».</p></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {([['orgName', 'Учреждение'], ['date', 'Дата'], ['number', '№ протокола'], ['chair', 'Председатель'], ['secretary', 'Секретарь'], ['present', 'Присутствовали, человек']] as const).map(([key, label]) => (
          <label key={key} className="block"><span className="text-xs font-bold text-ink-600">{label}</span><input value={String(choices[key])} onChange={(e) => update(key, e.target.value)} className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-pine-400" /></label>
        ))}
        {choices.agenda.map((topic, i) => (
          <label key={`topic-${i}`} className="block sm:col-span-2"><span className="text-xs font-bold text-ink-600">Вопрос повестки {i + 1}</span><input value={topic} onChange={(e) => setChoices((prev) => ({ ...prev, agenda: prev.agenda.map((x, j) => j === i ? e.target.value : x) }))} className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-pine-400" /></label>
        ))}
      </div>
      <Button className="mt-5" onClick={() => onBuild(buildOfficialParentProtocol(choices))}><Wand2 size={16} /> Собрать официальный протокол</Button>
    </Card>
  );
}

function OfficialPlanBuilder({ classLabel, year, onBuild }: { classLabel: string; year: string; onBuild: (doc: BuiltDoc) => void }) {
  const [period, setPeriod] = useState('полугодие');
  const build = () => {
    const selectedMonths = period === 'полугодие' ? CYCLEGRAM.slice(0, 5) : CYCLEGRAM;
    const items = selectedMonths.flatMap((month) => month.weeks.flatMap((week) => week.items.map((item) => ({ month: week.range, event: `${item.kind}: ${item.title}`, place: 'учреждение образования', participants: item.audience, responsible: 'классный руководитель', done: '____' }))));
    onBuild(buildEducationPlan(classLabel, '', '', year, period, items));
  };
  return (
    <Card className="animate-fade-up p-6">
      <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-pine-600"><CalendarRange size={20} /></span><div><h3 className="font-bold text-ink-900">План воспитательной работы по форме из PDF</h3><p className="mt-1 text-sm leading-relaxed text-ink-500">Мероприятия берутся из встроенной циклограммы, а результат оформляется официальной таблицей.</p></div></div>
      <div className="mt-5 flex flex-wrap items-end gap-3"><label className="block"><span className="text-xs font-bold text-ink-600">Период</span><select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 min-h-[44px] rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-800"><option value="полугодие">Полугодие</option><option value="учебный год">Учебный год</option></select></label><Button onClick={build}><Wand2 size={16} /> Собрать план</Button></div>
    </Card>
  );
}

function SavedDrafts({ reloadKey, onRemoved }: { reloadKey: number; onRemoved: () => void }) {
  const [drafts, setDrafts] = useState<SavedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('generated_docs').select('id, doc_type, title, content, updated_at').order('updated_at', { ascending: false });
      setDrafts((data || []) as SavedDoc[]);
      setLoading(false);
    })();
  }, [reloadKey]);

  const remove = async (id: string) => {
    const prev = drafts;
    setDrafts((list) => list.filter((d) => d.id !== id));
    const { error } = await supabase.from('generated_docs').delete().eq('id', id);
    if (error) {
      setDrafts(prev);
    } else {
      onRemoved();
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Черновики документов ({drafts.length})</h3>
      {drafts.length === 0 ? (
        <Card className="p-6 text-sm text-ink-400">Черновиков пока нет. Соберите документ и сохраните — он появится здесь.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drafts.map((d, i) => (
            <Card key={d.id} className={`animate-fade-up p-5 delay-${Math.min(i + 1, 3)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-800">{d.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{new Date(d.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => { void loadOrgSettings().then((o) => downloadDoc(d.title, applyLetterhead(d.content, letterheadHeader(o, d.title, '—'), letterheadFooter(o)))); }} className="rounded-lg p-2 text-ink-400 transition hover:bg-pine-50 hover:text-pine-600" aria-label="Скачать"><Download size={15} /></button>
                  <button onClick={() => remove(d.id)} className="rounded-lg p-2 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Удалить"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-500">{d.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgSettingsForm() {
  const [s, setS] = useState<OrgSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => { void loadOrgSettings().then(setS); }, []);

  if (!s) return null;

  return (
    <Card className="animate-fade-up p-6">
      <h3 className="font-bold text-ink-900">Реквизиты документов</h3>
      <p className="mt-1 text-sm text-ink-500">Однократно заполните данные учреждения и подпись — они автоматически подставляются в шапку и подписной блок всех документов.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-xs font-bold text-ink-500">Учреждение образования (шапка)</span>
          <input value={s.org_name} onChange={(e) => setS({ ...s, org_name: e.target.value })} placeholder="ГУО «Средняя школа № ___ г. ___»" className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
        </label>
        <label>
          <span className="text-xs font-bold text-ink-500">ФИО классного руководителя</span>
          <input value={s.teacher_name} onChange={(e) => setS({ ...s, teacher_name: e.target.value })} placeholder="Иванова Анна Петровна" className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
        </label>
        <label>
          <span className="text-xs font-bold text-ink-500">Должность</span>
          <input value={s.teacher_position} onChange={(e) => setS({ ...s, teacher_position: e.target.value })} className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
        </label>
        <label>
          <span className="text-xs font-bold text-ink-500">Город</span>
          <input value={s.city} onChange={(e) => setS({ ...s, city: e.target.value })} placeholder="Минск" className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="ghost" disabled={saving} onClick={async () => { setSaving(true); setSavedOk(await saveOrgSettings(s)); setSaving(false); }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить реквизиты
        </Button>
        {savedOk && <span className="text-xs font-bold text-pine-600">Сохранено</span>}
      </div>
    </Card>
  );
}

export default function AutomationPage({ classProfile }: { classProfile: ClassProfile }) {
  const { facts, loading, error } = useFacts();
  const [doc, setDoc] = useState<BuiltDoc | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [topics, setTopics] = useState<string[]>([MEETING_TOPICS[0], MEETING_TOPICS[1]]);

  const classLabel = classProfile ? `${classProfile.grade} «${classProfile.letter}»` : '— класс';
  const year = classProfile?.year || String(new Date().getFullYear());

  const docs = useMemo(() => {
    if (!facts) return [];
    const quarter = buildQuarterReport(facts, classLabel, year);
    const self = buildSelfAnalysis(facts, classLabel, year);
    const mood = buildMoodDigest(facts, classLabel);
    const social = buildSocialPedagogicalCharacteristic(facts, classLabel, '', '');
    return [quarter, self, mood, social];
  }, [facts, classLabel, year]);

  const hasJournal = !!facts && facts.meetings.length > 0;
  const hasMood = !!facts && facts.moodVotes.length > 0;

  const generateMeetingProtocols = () => {
    if (!facts) return;
    const protocols = buildMeetingProtocol(facts.meetings);
    if (protocols.length === 1) setDoc(protocols[0]);
    else setDoc({
      type: 'meeting-protocol',
      title: 'Протоколы всех собраний',
      content: protocols.map((p) => `${p.content}\n\n${'—'.repeat(40)}\n`).join('\n'),
      dataNote: `Собрано из ${protocols.length} записей журнала собраний.`,
      needsData: ['journal'],
    });
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Центр автоматизации"
        subtitle="Документы собираются сами из данных, которые уже есть в приложении: журнал собраний, счётчики класса, роли, опросы. Один клик — готовый текст, который можно отредактировать, скачать или сохранить черновиком."
        mentorTip="Главное правило отчёта: он пишется из фактуры, а не из памяти. Если документ собрался «пустым» — сначала внесите данные в журнал собраний и опросы, потом вернитесь сюда." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Собираем данные класса…</div></Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((d, i) => (
              <div key={d.type} className={`animate-fade-up delay-${i + 1}`}>
                <GeneratorCard
                  doc={d}
                  hasData={d.type === 'mood-digest' ? hasMood : !!facts}
                  onGenerate={() => setDoc(d)}
                />
              </div>
            ))}
            <Card className="animate-fade-up delay-3 p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-pine-600"><Users size={20} /></span>
                <div>
                  <h3 className="font-bold text-ink-900">Протоколы собраний</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">Готовый протокол из каждой записи журнала — с датой, повесткой и решениями.</p>
                </div>
              </div>
              <div className="mt-auto pt-5">
                <Button onClick={generateMeetingProtocols} disabled={!hasJournal}>
                  {hasJournal ? <><Wand2 size={16} /> Собрать протокол{facts!.meetings.length > 1 ? 'ы' : ''}</> : 'Нет данных'}
                </Button>
                {!hasJournal && <p className="mt-2 text-xs text-ink-400">Внесите первое собрание в «Журнал собраний».</p>}
              </div>
            </Card>
          </div>

          <Card className="animate-fade-up delay-2 p-6">
            <h3 className="font-bold text-ink-900">Сценарий родительского собрания</h3>
            <p className="mt-1 text-sm text-ink-500">Выберите 2–4 темы — соберётся структура выступления с таймингом.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {MEETING_TOPICS.map((t) => {
                const on = topics.includes(t);
                return (
                  <li key={t}>
                    <button
                      onClick={() => setTopics((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${on ? 'border-pine-400 bg-pine-50 text-pine-900' : 'border-ink-200 bg-white text-ink-700 hover:border-pine-300'}`}
                    >
                      {t}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button
              className="mt-4"
              disabled={topics.length === 0}
              onClick={() => setDoc(buildParentsMeetingScript(classLabel, topics))}
            >
              <Wand2 size={16} /> Собрать сценарий
            </Button>
          </Card>

          <CharacteristicBuilder classLabel={classLabel} year={year} facts={facts} onBuild={setDoc} />

          <OfficialPlanBuilder classLabel={classLabel} year={year} onBuild={setDoc} />

          <OfficialProtocolBuilder classLabel={classLabel} onBuild={setDoc} />

          <OrgSettingsForm />

          {doc && <DocPreview doc={doc} onClose={() => setDoc(null)} classLabel={classLabel} />}

          <SavedDrafts reloadKey={reloadKey} onRemoved={() => setReloadKey((k) => k + 1)} />
        </>
      )}
    </div>
  );
}
