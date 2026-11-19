import { useEffect, useState } from 'react';
import {
  Footprints, ExternalLink, Loader2, AlertTriangle, MapPin, Clock, Lightbulb,
  MessageCircleQuestion, StickyNote, Plus, CheckCircle2, X, Users, BookOpen,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { VIRTUAL_TOURS, themeOf, type VirtualTour } from '@/data/tours';

type TourVisit = { id: string; tour_key: string; tour_title: string; class_impression: string | null; class_conclusion: string | null; visited_at: string };
type TourNote = { id: string; tour_key: string; note: string; created_at: string };

const IMPRESSIONS = ['Понравилось очень', 'Скорее понравилось', 'Средне', 'Не понравилось'];

function TourRoom({ tour, onExit }: { tour: VirtualTour; onExit: () => void }) {
  const [stage, setStage] = useState<'prepare' | 'discuss' | 'finish'>('prepare');
  const [notes, setNotes] = useState<TourNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [impression, setImpression] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState('');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error: err } = await supabase.from('tour_notes').select('id, tour_key, note, created_at').eq('tour_key', tour.key);
      if (err) setLoadError('Не удалось загрузить заметки.');
      else setNotes((data || []) as TourNote[]);
    })();
  }, [tour.key]);

  const addNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed || savingNote) return;
    setSavingNote(true);
    const { data, error: err } = await supabase
      .from('tour_notes')
      .insert({ tour_key: tour.key, note: trimmed })
      .select('id, tour_key, note, created_at')
      .single();
    if (err || !data) setLoadError('Не удалось сохранить заметку.');
    else { setNotes((prev) => [...prev, data as TourNote]); setNoteText(''); }
    setSavingNote(false);
  };

  const finishTour = async (imp: string) => {
    setImpression(imp);
    setFinishing(true);
    const { error: err } = await supabase.from('tour_visits').insert({
      tour_key: tour.key,
      tour_title: tour.title,
      class_impression: imp,
      class_conclusion: conclusion.trim() || null,
    });
    if (err) setLoadError('Не удалось сохранить итоги экскурсии.');
    setFinishing(false);
  };

  const theme = themeOf(tour);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Виртуальная экскурсия · {theme.label}</p>
          <h2 className="truncate font-display text-lg font-extrabold sm:text-2xl">{tour.title}</h2>
        </div>
        <button onClick={onExit} className="rounded-xl border border-pine-400/30 p-2 text-pine-100 transition hover:bg-pine-900" aria-label="Выход"><X size={18} /></button>
      </div>

      {loadError && <p className="mx-6 rounded-xl bg-terracotta-500/20 px-4 py-3 text-sm text-terracotta-100">{loadError}</p>}

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
        {stage === 'prepare' && (
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {tour.facts.map((fact, i) => (
                <div key={i} className="rounded-2xl border border-pine-400/25 bg-pine-900/60 p-5">
                  <Lightbulb size={18} className="text-gold-300" />
                  <p className="mt-3 text-sm leading-relaxed text-pine-100/90">{fact}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-gold-300/30 bg-pine-900/70 p-5">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold-300"><StickyNote size={14} /> Заметки педагога перед поездкой</p>
              {notes.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {notes.map((n) => <li key={n.id} className="text-sm leading-relaxed text-pine-100/85">— {n.note}</li>)}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void addNote(); }}
                  placeholder="Например: вспомнить правила поведения в музее…"
                  className="flex-1 rounded-lg border border-pine-400/30 bg-pine-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-pine-100/40 focus:border-gold-300/60"
                />
                <button onClick={addNote} disabled={savingNote || !noteText.trim()} className="rounded-lg bg-gold-300 px-3 text-pine-950 transition hover:bg-gold-200 disabled:opacity-50" aria-label="Сохранить заметку">
                  {savingNote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <a href={tour.tourUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setStage('discuss'), 800)} className="inline-flex items-center gap-2 rounded-2xl bg-gold-300 px-8 py-4 font-extrabold text-pine-950 transition hover:bg-gold-200">
                Открыть тур <ExternalLink size={18} />
              </a>
            </div>
            <p className="mt-3 text-center text-xs text-pine-100/50">Тур откроется в новой вкладке. Когда «поездка» закончится, вернитесь сюда для обсуждения.</p>
          </div>
        )}

        {stage === 'discuss' && (
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-4">
            <h3 className="text-center font-display text-3xl font-extrabold">Вопросы для обсуждения</h3>
            <p className="mt-2 text-center text-sm text-pine-100/60">Открывайте по одному и давайте классу время на размышление.</p>
            <div className="mt-8 space-y-4">
              {tour.questions.map((q) => (
                <details key={q.key} className="group rounded-2xl border border-pine-400/25 bg-pine-900/60 open:border-gold-300/40">
                  <summary className="flex cursor-pointer items-start gap-3 p-5 text-left text-base font-bold text-pine-50 marker:content-none">
                    <MessageCircleQuestion size={20} className="mt-0.5 shrink-0 text-gold-300" />
                    {q.question}
                  </summary>
                  <div className="border-t border-pine-400/20 px-5 py-4 pl-12">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold-300">Подсказка педагогу</p>
                    <p className="mt-2 text-sm leading-relaxed text-pine-100/80">{q.teacherHint}</p>
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="ghost" className="!bg-pine-900 !text-pine-100 !border-pine-400/30" onClick={() => setStage('prepare')}>Назад к туру</Button>
              <Button className="!bg-gold-300 !text-pine-950" onClick={() => setStage('finish')}>Завершить экскурсию</Button>
            </div>
          </div>
        )}

        {stage === 'finish' && (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-4 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gold-300 text-pine-950"><CheckCircle2 size={32} /></span>
            <h3 className="mt-5 font-display text-3xl font-extrabold">Экскурсия завершена</h3>
            <label className="mt-8 text-left">
              <span className="text-xs font-bold text-pine-100">Главный вывод класса после поездки (одним предложением)</span>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                rows={3}
                placeholder="Например: «Замок — не только стены, а история людей, которые их строили»."
                className="mt-1 w-full rounded-xl border border-pine-400/30 bg-pine-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-pine-100/40 focus:border-gold-300/60"
              />
            </label>
            <p className="mt-6 text-sm font-bold text-pine-100">Как прошло у класса? (анонимно)</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {IMPRESSIONS.map((imp) => (
                <button
                  key={imp}
                  onClick={() => void finishTour(imp)}
                  disabled={finishing || impression !== null}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${impression === imp ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/30 bg-pine-900/50 text-pine-100 hover:border-gold-300/50'}`}
                >
                  {imp}
                </button>
              ))}
            </div>
            <button onClick={onExit} className="mt-6 text-xs font-bold text-pine-100/60 underline-offset-4 hover:underline">Выйти без сохранения</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToursPage() {
  const [visits, setVisits] = useState<TourVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<VirtualTour | null>(null);

  const load = async () => {
    const { data, error: err } = await supabase
      .from('tour_visits')
      .select('id, tour_key, tour_title, class_impression, class_conclusion, visited_at')
      .order('visited_at', { ascending: false })
      .limit(20);
    if (err) setError('Не удалось загрузить историю экскурсий.');
    else setVisits((data || []) as TourVisit[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const closeShow = () => { setActive(null); setLoading(true); void load(); };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Виртуальные экскурсии"
        subtitle="Интерактивные туры по замкам, музеям и заповедникам Беларуси — от Мирского замка до Беловежской пущи. Откройте тур на интерактивной доске, «прогуляйтесь» вместе с классом, а готовые вопросы и подсказки педагога помогут превратить поездку в разговор."
        mentorTip="Самое ценное в виртуальной поездке — пауза: остановите тур у зала или экспозиции, которая зацепила класс, и дайте ученикам задать свой вопрос." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {VIRTUAL_TOURS.map((t) => {
              const theme = themeOf(t);
              return (
                <Card key={t.key} className="animate-fade-up flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${theme.color}`}><Footprints size={20} /></span>
                    <span className="rounded-full bg-ink-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">{theme.label}</span>
                  </div>
                  <h3 className="mt-4 font-bold leading-snug text-ink-900">{t.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-pine-600"><MapPin size={12} /> {t.place}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{t.audience} · <span className="inline-flex items-center gap-1"><Clock size={11} />≈{t.minutes} минут</span></p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{t.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-400">
                    <BookOpen size={13} /> {tourQuestionCount(t)} вопросов для обсуждения · <Users size={13} /> без персональных данных
                  </div>
                  <Button className="mt-4" onClick={() => setActive(t)}><Footprints size={16} /> Отправиться в поездку</Button>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Совершённые поездки</h3>
            {visits.length === 0 ? (
              <Card className="p-6 text-sm text-ink-400">Пока экскурсий не было. Отправьтесь в любую — история появится здесь.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visits.map((v, i) => (
                  <Card key={v.id} className={`animate-fade-up p-5 delay-${Math.min(i + 1, 4)}`}>
                    <p className="text-sm font-bold text-ink-800">{v.tour_title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {new Date(v.visited_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {v.class_conclusion && <p className="mt-2 text-xs italic leading-relaxed text-pine-800">Вывод класса: «{v.class_conclusion}»</p>}
                    {v.class_impression && <p className="mt-1 text-xs text-pine-700">Впечатление: {v.class_impression}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {active && <TourRoom tour={active} onExit={closeShow} />}
    </div>
  );
}

function tourQuestionCount(t: VirtualTour): number {
  return t.questions.length;
}
