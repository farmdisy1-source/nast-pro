import { useEffect, useMemo, useState } from 'react';
import {
  Map, Image as ImageIcon, Plus, Loader2, AlertTriangle, ChevronLeft, ChevronRight,
  X, MessageCircleQuestion, StickyNote, CheckCircle2, Lightbulb, MonitorPlay,
  Sparkles, Download,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { VISUAL_MATERIALS, toneClass, type VisualMaterial, type TimelineEvent, type PosterZone } from '@/data/visuals';

type VisualNote = { id: string; material_key: string; point_key: string; note: string; created_at: string };
type VisualShow = { id: string; material_key: string; material_title: string; kind: string; class_impression: string | null; shown_at: string };

const IMPRESSIONS = ['Понравилось очень', 'Скорее понравилось', 'Средне', 'Не понравилось'];

type PointKey = string;

function useNotes(materialKey: string | null) {
  const [notes, setNotes] = useState<Record<PointKey, string[]>>({});
  useEffect(() => {
    if (!materialKey) return;
    void (async () => {
      const { data } = await supabase.from('visual_notes').select('id, material_key, point_key, note, created_at').eq('material_key', materialKey);
      const map: Record<PointKey, string[]> = {};
      for (const n of (data || []) as VisualNote[]) {
        (map[n.point_key] ||= []).push(n.note);
      }
      setNotes(map);
    })();
  }, [materialKey]);
  return notes;
}

async function addNote(materialKey: string, pointKey: string, note: string) {
  const { data, error } = await supabase
    .from('visual_notes')
    .insert({ material_key: materialKey, point_key: pointKey, note })
    .select('id, material_key, point_key, note, created_at')
    .single();
  if (error || !data) return null;
  return data as VisualNote;
}

async function recordShow(m: VisualMaterial, impression: string | null) {
  const { error } = await supabase.from('visual_shows').insert({
    material_key: m.key, material_title: m.title, kind: m.kind, class_impression: impression,
  });
  return !error;
}

function NoteBox({ materialKey, pointKey, notes, onAdded }: {
  materialKey: string; pointKey: string; notes: string[]; onAdded: (n: VisualNote) => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const saved = await addNote(materialKey, pointKey, trimmed);
    if (saved) { onAdded(saved); setText(''); }
    setSaving(false);
  };

  return (
    <div className="mt-4 rounded-2xl border border-gold-200 bg-gold-100/40 p-4">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold-700"><StickyNote size={14} /> Заметки педагога к этому событию</p>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {notes.map((n, i) => <li key={i} className="text-sm leading-relaxed text-gold-800">— {n}</li>)}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void save(); }}
          placeholder="Что рассказать или спросить у класса…"
          className="flex-1 rounded-lg border border-gold-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-100"
        />
        <button onClick={save} disabled={saving || !text.trim()} className="rounded-lg bg-gold-500 px-3 text-white transition hover:bg-gold-600 disabled:opacity-50" aria-label="Сохранить заметку">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </div>
    </div>
  );
}

function TimelineShow({ material, onExit }: { material: VisualMaterial; onExit: () => void }) {
  const events = material.events ?? [];
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showRecorded, setShowRecorded] = useState(false);
  const [extraNotes, setExtraNotes] = useState<Record<PointKey, string[]>>({});
  const notesByPoint = useNotes(showNotes ? material.key : null);

  const event: TimelineEvent = events[index];

  const exit = () => { setShowNotes(false); onExit(); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Таймлайн</p>
          <h2 className="font-display text-lg font-extrabold sm:text-2xl">{material.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotes((v) => !v)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${showNotes ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/30 text-pine-100 hover:bg-pine-900'}`}>
            <span className="flex items-center gap-2"><StickyNote size={15} /> Заметки</span>
          </button>
          <button onClick={exit} className="rounded-xl border border-pine-400/30 p-2 text-pine-100 transition hover:bg-pine-900" aria-label="Выход"><X size={18} /></button>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6">
        <div className="relative mb-10">
          <div className="h-1.5 rounded-full bg-pine-900">
            <div className="h-full rounded-full bg-gold-300 transition-all duration-500" style={{ width: `${((index + 1) / events.length) * 100}%` }} />
          </div>
          <div className="mt-0 flex justify-between">
            {events.map((e, i) => (
              <button key={e.key} onClick={() => setIndex(i)} className="group relative pt-3" style={{ width: `${100 / events.length}%` }}>
                <span className={`mx-auto flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300 ${i <= index ? 'border-gold-300 bg-gold-300' : 'border-pine-400/40 bg-pine-950 group-hover:border-gold-300/60'}`} />
                <span className={`mt-2 block truncate text-center text-[11px] font-bold transition sm:text-xs ${i === index ? 'text-gold-300' : i < index ? 'text-pine-100/80' : 'text-pine-100/40'}`}>{e.when}</span>
              </button>
            ))}
          </div>
        </div>

        <div key={event.key} className="animate-fade-up text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-gold-300">{event.when}</p>
          <h3 className="mx-auto mt-3 max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">{event.title}</h3>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-pine-100/85 sm:text-xl">{event.text}</p>
          {event.classQuestion && (
            <p className="mx-auto mt-6 flex max-w-2xl items-start justify-center gap-2 rounded-2xl border border-gold-300/30 bg-pine-900/60 px-6 py-4 text-left text-sm font-bold text-gold-100 sm:text-base">
              <MessageCircleQuestion size={20} className="mt-0.5 shrink-0 text-gold-300" /> {event.classQuestion}
            </p>
          )}
        </div>

        {showNotes && (
          <div className="mx-auto mt-4 w-full max-w-3xl">
            <NoteBox
              materialKey={material.key}
              pointKey={event.key}
              notes={[...(notesByPoint[event.key] || []), ...(extraNotes[event.key] || [])]}
              onAdded={(n) => setExtraNotes((prev) => ({ ...prev, [event.key]: [...(prev[event.key] || []), n.note] }))}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 px-6 pb-6">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="flex items-center gap-2 rounded-2xl border border-pine-400/30 px-6 py-4 text-sm font-bold transition enabled:hover:bg-pine-900 disabled:opacity-30">
          <ChevronLeft size={20} /> Назад
        </button>
        <span className="text-xs font-bold text-pine-100/50">{index + 1} / {events.length}</span>
        {index + 1 < events.length ? (
          <button onClick={() => setIndex((i) => i + 1)} className="flex items-center gap-2 rounded-2xl bg-gold-300 px-6 py-4 text-sm font-extrabold text-pine-950 transition hover:bg-gold-200">
            Дальше <ChevronRight size={20} />
          </button>
        ) : (
          <button onClick={() => setShowRecorded(true)} className="flex items-center gap-2 rounded-2xl bg-gold-300 px-6 py-4 text-sm font-extrabold text-pine-950 transition hover:bg-gold-200">
            <CheckCircle2 size={18} /> Завершить показ
          </button>
        )}
      </div>

      {showRecorded && <FinishOverlay material={material} onDone={() => { setShowRecorded(false); exit(); }} />}
    </div>
  );
}

function FinishOverlay({ material, onDone }: { material: VisualMaterial; onDone: () => void }) {
  const [impression, setImpression] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (imp: string) => {
    setImpression(imp);
    setSaving(true);
    await recordShow(material, imp);
    setSaving(false);
    setTimeout(onDone, 600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-pine-950/95 p-6 text-white">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gold-300 text-pine-950"><CheckCircle2 size={32} /></span>
        <h3 className="mt-5 font-display text-3xl font-extrabold">Показ завершён</h3>
        <p className="mt-2 text-sm text-pine-100/70">«{material.title}»</p>
        <p className="mt-6 text-sm font-bold text-pine-100">Как прошло у класса? (анонимно)</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {IMPRESSIONS.map((imp) => (
            <button
              key={imp}
              onClick={() => void pick(imp)}
              disabled={saving || impression !== null}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${impression === imp ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/30 bg-pine-900/50 text-pine-100 hover:border-gold-300/50'}`}
            >
              {imp}
            </button>
          ))}
        </div>
        <button onClick={onDone} className="mt-6 text-xs font-bold text-pine-100/60 underline-offset-4 hover:underline">Пропустить</button>
      </div>
    </div>
  );
}

function PosterShow({ material, onExit }: { material: VisualMaterial; onExit: () => void }) {
  const zones = material.zones ?? [];
  const [openKey, setOpenKey] = useState<PointKey | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showRecorded, setShowRecorded] = useState(false);
  const [extraNotes, setExtraNotes] = useState<Record<PointKey, string[]>>({});
  const notesByPoint = useNotes(showNotes ? material.key : null);

  const open: PosterZone | undefined = zones.find((z) => z.key === openKey);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Интерактивный плакат</p>
          <h2 className="font-display text-lg font-extrabold sm:text-2xl">{material.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotes((v) => !v)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${showNotes ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/30 text-pine-100 hover:bg-pine-900'}`}>
            <span className="flex items-center gap-2"><StickyNote size={15} /> Заметки</span>
          </button>
          <button onClick={onExit} className="rounded-xl border border-pine-400/30 p-2 text-pine-100 transition hover:bg-pine-900" aria-label="Выход"><X size={18} /></button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-8">
        <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((z) => (
            <button
              key={z.key}
              onClick={() => setOpenKey(z.key)}
              className={`group flex min-h-[150px] flex-col items-start justify-between rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 ${toneClass(z.tone)}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Lightbulb size={20} className="text-white" /></span>
              <span>
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">{z.label}</span>
                <span className="mt-1 block font-display text-xl font-extrabold">{z.title}</span>
              </span>
            </button>
          ))}
        </div>

        {open && (
          <div className="animate-fade-up w-full max-w-3xl rounded-3xl border border-gold-300/30 bg-pine-900/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold-300">{open.label}</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold">{open.title}</h3>
              </div>
              <button onClick={() => setOpenKey(null)} className="rounded-lg p-1 text-pine-100/60 transition hover:text-white" aria-label="Закрыть"><X size={18} /></button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-pine-100/90 sm:text-base">{open.text}</p>
            {open.classQuestion && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-pine-950/60 px-4 py-3 text-sm font-bold text-gold-100">
                <MessageCircleQuestion size={18} className="mt-0.5 shrink-0 text-gold-300" /> {open.classQuestion}
              </p>
            )}
            {showNotes && (
              <NoteBox
                materialKey={material.key}
                pointKey={open.key}
                notes={[...(notesByPoint[open.key] || []), ...(extraNotes[open.key] || [])]}
                onAdded={(n) => setExtraNotes((prev) => ({ ...prev, [open.key]: [...(prev[open.key] || []), n.note] }))}
              />
            )}
          </div>
        )}

        <button onClick={() => setShowRecorded(true)} className="rounded-2xl bg-gold-300 px-6 py-3.5 text-sm font-extrabold text-pine-950 transition hover:bg-gold-200">
          <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Завершить показ</span>
        </button>
      </div>

      {showRecorded && <FinishOverlay material={material} onDone={onExit} />}
    </div>
  );
}

const IMAGE_PRESETS = [
  { key: 'safety', label: 'Безопасность в интернете', prompt: 'Плакат о безопасности в интернете для школьников: щит, замок, предупреждающие знаки' },
  { key: 'values', label: 'Ценности класса', prompt: 'Плакат «Ценности нашего класса»: честность, уважение, доброта — символы в круге' },
  { key: 'friendship', label: 'Дружба и коллектив', prompt: 'Плакат о дружбе и коллективе: дети держатся за руки, солнце, дерево дружбы' },
  { key: 'memory', label: 'Память и Родина', prompt: 'Плакат о памяти и Родине: белорусский пейзаж, васильки, звезда, книга памяти' },
  { key: 'health', label: 'Здоровый образ жизни', prompt: 'Плакат о здоровом образе жизни: спорт, витамины, режим дня, активные дети' },
  { key: 'ecology', label: 'Экология и природа', prompt: 'Плакат об экологии: беречь природу, переработка, зелёная планета, деревья' },
];

type GeneratedImage = { base64: string; mimeType: string; prompt: string };

export default function VisualsPage() {
  const [shows, setShows] = useState<VisualShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<VisualMaterial | null>(null);
  const [filter, setFilter] = useState<'all' | 'timeline' | 'poster'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImage, setAiImage] = useState<GeneratedImage | null>(null);
  const [aiTopic, setAiTopic] = useState(IMAGE_PRESETS[0].key);
  const [customPrompt, setCustomPrompt] = useState('');

  const load = async () => {
    const { data, error: err } = await supabase
      .from('visual_shows')
      .select('id, material_key, material_title, kind, class_impression, shown_at')
      .order('shown_at', { ascending: false })
      .limit(20);
    if (err) setError('Не удалось загрузить историю показов.');
    else setShows((data || []) as VisualShow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(
    () => VISUAL_MATERIALS.filter((m) => filter === 'all' || m.kind === filter),
    [filter],
  );

  const closeShow = () => { setActive(null); setLoading(true); void load(); };

  const generateImage = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiImage(null);
    const preset = IMAGE_PRESETS.find((p) => p.key === aiTopic);
    const topic = customPrompt.trim() || preset?.prompt || 'образовательный плакат для школы';
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'image', prompt: { topic, style: 'плоский векторный стиль, яркие цвета, чёткие формы, подходит для интерактивной доски в школе' } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.image) throw new Error('NO_IMAGE');
      setAiImage({ base64: data.image, mimeType: data.mimeType || 'image/png', prompt: topic });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setAiError(msg.includes('IMAGE_ERROR_429') ? 'Дневной лимит генерации изображений исчерпан. Попробуйте завтра — лимит обновится автоматически.' : 'ИИ не смог создать изображение. Попробуйте другую тему или повторите позже.');
    }
    setAiLoading(false);
  };

  const downloadImage = () => {
    if (!aiImage) return;
    const link = document.createElement('a');
    link.href = `data:${aiImage.mimeType};base64,${aiImage.base64}`;
    link.download = `poster-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Таймлайны и плакаты"
        subtitle="Готовые визуальные решения для интерактивной доски: хроники для разговоров о памяти и семье, карты рисков и плакаты ценностей. Откройте материал, ведите классный час — заметки педагога и вопросы классу уже встроены."
        mentorTip="Интерактив работает, когда зону открывает сам ученик — пригласите к доске и дайте нажать. Обсуждение важнее скорости просмотра." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
      ) : (
        <>
          <div className="flex gap-2">
            {([['all', 'Все'], ['timeline', 'Таймлайны'], ['poster', 'Плакаты']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${filter === key ? 'border-pine-700 bg-pine-700 text-white' : 'border-ink-200 bg-white text-ink-500 hover:border-pine-300'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <Card key={m.key} className="animate-fade-up flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${m.kind === 'timeline' ? 'bg-pine-600' : 'bg-terracotta-500'}`}>
                    {m.kind === 'timeline' ? <Map size={20} /> : <ImageIcon size={20} />}
                  </span>
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                    {m.kind === 'timeline' ? 'Таймлайн' : 'Плакат'}
                  </span>
                </div>
                <h3 className="mt-4 font-bold leading-snug text-ink-900">{m.title}</h3>
                <p className="mt-1 text-xs font-semibold text-pine-600">{m.audience} · ≈{m.minutes} минут</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{m.description}</p>
                <Button className="mt-4" onClick={() => setActive(m)}><MonitorPlay size={16} /> Открыть на доске</Button>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Проведённые показы</h3>
            {shows.length === 0 ? (
              <Card className="p-6 text-sm text-ink-400">Пока показов не было. Откройте любой материал — история появится здесь.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {shows.map((s, i) => (
                  <Card key={s.id} className={`animate-fade-up p-5 delay-${Math.min(i + 1, 4)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-800">{s.material_title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {new Date(s.shown_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · {s.kind === 'timeline' ? 'таймлайн' : 'плакат'}
                        </p>
                      </div>
                    </div>
                    {s.class_impression && <p className="mt-2 text-xs text-pine-700">Впечатление класса: {s.class_impression}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Card className="animate-fade-up border-pine-200 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-pine-600"><Sparkles size={20} /></span>
          <div>
            <h3 className="font-bold text-ink-900">ИИ-генератор плакатов</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">Опишите тему — ИИ создаст уникальную иллюстрацию для интерактивной доски. Готовое изображение можно скачать и использовать на классном часе.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {IMAGE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => { setAiTopic(p.key); setCustomPrompt(''); setAiImage(null); setAiError(null); }}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${aiTopic === p.key && !customPrompt ? 'border-pine-600 bg-pine-600 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-pine-300'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => { setCustomPrompt(e.target.value); setAiImage(null); setAiError(null); }}
            placeholder="Или введите свою тему для плаката…"
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
          <Button onClick={generateImage} disabled={aiLoading}>
            {aiLoading ? <><Loader2 size={18} className="animate-spin" /> ИИ рисует плакат…</> : <><Sparkles size={18} /> Создать плакат с ИИ</>}
          </Button>
        </div>
        {aiError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold-200 bg-gold-100/50 px-4 py-3 text-sm text-gold-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Не удалось создать изображение</p>
              <p className="mt-0.5 text-xs text-gold-700">{aiError}</p>
            </div>
          </div>
        )}
        {aiImage && (
          <div className="mt-5 animate-fade-up">
            <div className="overflow-hidden rounded-2xl border border-pine-200 bg-ink-50">
              <img src={`data:${aiImage.mimeType};base64,${aiImage.base64}`} alt="ИИ-плакат" className="w-full" />
            </div>
            <p className="mt-2 text-xs text-ink-400">Тема: {aiImage.prompt}</p>
            <div className="mt-3 flex gap-3">
              <Button variant="ghost" onClick={downloadImage}><Download size={16} /> Скачать изображение</Button>
              <Button variant="ghost" onClick={generateImage} disabled={aiLoading} className="text-pine-700"><Sparkles size={16} /> Создать ещё</Button>
            </div>
          </div>
        )}
      </Card>

      {active && (active.kind === 'timeline'
        ? <TimelineShow material={active} onExit={closeShow} />
        : <PosterShow material={active} onExit={closeShow} />)}
    </div>
  );
}
