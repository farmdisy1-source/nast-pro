import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Podcast, Play, Pause, CheckCircle2, Circle, Loader2, AlertTriangle, Clock,
  Lightbulb, MessageSquareQuote, ShieldAlert, Sparkles, StickyNote, X,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Block = { heading: string; text: string };

type Episode = {
  id: string;
  episode_key: string;
  position: number;
  title: string;
  summary: string;
  minutes: number;
  blocks: Block[];
  takeaways: string[];
  homework: string;
  mistakes: string[];
  phrase: string;
};

type Progress = { id: string; episode_key: string; done: boolean; note: string | null };

function speak(text: string, onEnd: () => void): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = 1;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
  return u;
}

function EpisodePlayer({ episode, progress, onDone, onNote, onClose }: {
  episode: Episode;
  progress: Progress | undefined;
  onDone: (key: string, done: boolean) => void;
  onNote: (key: string, note: string) => void;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [blockIndex, setBlockIndex] = useState(0);
  const [note, setNote] = useState(progress?.note || '');
  const [saved, setSaved] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  const stopSpeech = useCallback(() => {
    if (voiceSupported) window.speechSynthesis.cancel();
    utterRef.current = null;
    setPlaying(false);
  }, [voiceSupported]);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const block: Block | undefined = episode.blocks[blockIndex];

  const toggle = () => {
    if (playing) { stopSpeech(); return; }
    if (!block) return;
    if (!voiceSupported) { setPlaying(true); return; }
    const u = speak(block.text, () => {
      setPlaying(false);
      utterRef.current = null;
    });
    utterRef.current = u;
    setPlaying(true);
  };

  const next = () => {
    stopSpeech();
    if (blockIndex + 1 < episode.blocks.length) setBlockIndex((i) => i + 1);
    else if (progress && !progress.done) onDone(episode.episode_key, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Серия {episode.position} из 8</p>
          <h2 className="truncate font-display text-lg font-extrabold sm:text-2xl">{episode.title}</h2>
        </div>
        <button onClick={() => { stopSpeech(); onClose(); }} className="rounded-xl border border-pine-400/30 p-2 text-pine-100 transition hover:bg-pine-900" aria-label="Закрыть"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-2">
            {episode.blocks.map((_, i) => (
              <button
                key={i}
                onClick={() => { stopSpeech(); setBlockIndex(i); }}
                aria-label={`Блок ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === blockIndex ? 'w-10 bg-gold-300' : i < blockIndex ? 'w-4 bg-gold-300/60' : 'w-4 bg-pine-100/20'}`}
              />
            ))}
          </div>

          {block && (
            <div key={blockIndex} className="animate-fade-up mt-8 text-center">
              <h3 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">{block.heading}</h3>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pine-100/85 sm:text-lg">{block.text}</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={toggle}
              disabled={!voiceSupported}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-300 text-pine-950 shadow-lg transition hover:scale-105 disabled:opacity-40"
              aria-label={playing ? 'Пауза' : 'Слушать'}
            >
              {playing ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
            </button>
            <Button variant="ghost" className="!border-pine-400/30 !bg-pine-900/60 !text-pine-100" onClick={next}>
              {blockIndex + 1 < episode.blocks.length ? 'Следующий блок' : 'Завершить серию'}
            </Button>
          </div>
          {!voiceSupported && (
            <p className="mt-4 text-center text-xs text-pine-100/60">Озвучка недоступна в этом браузере — серия доступна в текстовом виде.</p>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold-300/25 bg-pine-900/60 p-5">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold-300"><Lightbulb size={14} /> Главное</p>
              <ul className="mt-3 space-y-2">
                {episode.takeaways.map((t, i) => <li key={i} className="text-sm leading-relaxed text-pine-100/85">• {t}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-terracotta-400/25 bg-pine-900/60 p-5">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-terracotta-200"><ShieldAlert size={14} /> Типичные ошибки</p>
              <ul className="mt-3 space-y-2">
                {episode.mistakes.map((m, i) => <li key={i} className="text-sm leading-relaxed text-pine-100/85">• {m}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-pine-400/25 bg-pine-900/60 p-5">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-pine-300"><Sparkles size={14} /> Фраза недели — скажите ребёнку</p>
            <p className="mt-3 text-base font-bold leading-relaxed text-white">«{episode.phrase}»</p>
          </div>

          <div className="mt-4 rounded-2xl border border-gold-300/25 bg-pine-900/60 p-5">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold-300"><MessageSquareQuote size={14} /> Практика недели</p>
            <p className="mt-3 text-sm leading-relaxed text-pine-100/85">{episode.homework}</p>
            <div className="mt-4 flex gap-2">
              <input
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                placeholder="Как получилось? Заметка для себя…"
                className="flex-1 rounded-lg border border-pine-400/30 bg-pine-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-pine-100/40 focus:border-gold-300/60"
              />
              <button
                onClick={() => { onNote(episode.episode_key, note); setSaved(true); }}
                disabled={!note.trim()}
                className="rounded-lg bg-gold-300 px-3 text-pine-950 transition hover:bg-gold-200 disabled:opacity-50"
                aria-label="Сохранить заметку"
              >
                <StickyNote size={16} />
              </button>
            </div>
            {saved && <p className="mt-2 text-xs text-gold-300">Заметка сохранена.</p>}
          </div>

          <div className="mt-6 flex justify-center pb-4">
            <Button
              className={progress?.done ? '!bg-pine-800' : '!bg-gold-300 !text-pine-950'}
              onClick={() => onDone(episode.episode_key, !progress?.done)}
            >
              {progress?.done ? <><CheckCircle2 size={16} /> Серия пройдена</> : <><Circle size={16} /> Отметить пройденной</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentCoursePage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Episode | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('course_episodes').select('*').order('position');
    if (err) { setError('Не удалось загрузить курс.'); setLoading(false); return; }
    setEpisodes(((data || []) as Episode[]).map((e) => ({ ...e, blocks: e.blocks || [], takeaways: e.takeaways || [], mistakes: e.mistakes || [] })));
    const { data: pData, error: pErr } = await supabase.from('course_progress').select('id, episode_key, done, note');
    if (pErr) setError('Не удалось загрузить прогресс.');
    else {
      const map: Record<string, Progress> = {};
      for (const p of (pData || []) as Progress[]) map[p.episode_key] = p;
      setProgress(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setDone = async (key: string, done: boolean) => {
    const existing = progress[key];
    if (existing) {
      await supabase.from('course_progress').update({ done, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      const { data } = await supabase.from('course_progress').insert({ episode_key: key, done }).select('id, episode_key, done, note').single();
      if (data) setProgress((p) => ({ ...p, [key]: data as Progress }));
      return;
    }
    setProgress((p) => ({ ...p, [key]: { ...p[key], done } }));
  };

  const setNote = async (key: string, note: string) => {
    const existing = progress[key];
    if (existing) {
      await supabase.from('course_progress').update({ note }).eq('id', existing.id);
      setProgress((p) => ({ ...p, [key]: { ...p[key], note } }));
    } else {
      await setDone(key, false);
      const { data } = await supabase.from('course_progress').insert({ episode_key: key, done: false, note }).select('id, episode_key, done, note').single();
      if (data) setProgress((p) => ({ ...p, [key]: data as Progress }));
    }
  };

  const doneCount = useMemo(() => episodes.filter((e) => progress[e.episode_key]?.done).length, [episodes, progress]);
  const percent = episodes.length ? Math.round((doneCount / episodes.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Курс для родителей: «Психология подростка: инструкция по выживанию»"
        subtitle="Авторский курс-подкаст из 8 серий для родителей вашего класса. Каждую серию можно включить как аудио или прочитать, а после — отдать родителям фразу недели и практическое задание. Отмечайте пройденное и рекомендуйте серии точечно, под ситуацию в классе."
        mentorTip="Лучший формат рекомендации — точечный: «Вам сейчас с этим трудно? Послушайте серию 2 — там про такие ссоры». Адресная рекомендация работает лучше массовой рассылки." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка курса…</div></Card>
      ) : (
        <>
          <Card className="relative overflow-hidden border-none bg-pine-800 p-7 text-white sm:p-9">
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gold-300 text-pine-950 shadow-lg"><Podcast size={38} /></span>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-extrabold sm:text-3xl">Инструкция по выживанию</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pine-100/80">8 серий по 10–13 минут: от гормональной бури до разговора о вредных привычках. Каждая серия — наука, практика, ошибки и готовая фраза для разговора с ребёнком.</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2.5 w-48 overflow-hidden rounded-full bg-pine-950/50">
                    <div className="h-full rounded-full bg-gold-300 transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs font-bold text-pine-100">{doneCount} из {episodes.length} серий · {percent}%</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {episodes.map((ep) => {
              const p = progress[ep.episode_key];
              return (
                <Card key={ep.id} className={`animate-fade-up flex flex-col p-6 ${p?.done ? 'border-pine-300 bg-pine-50/60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-extrabold ${p?.done ? 'bg-pine-600 text-white' : 'bg-ink-100 text-ink-500'}`}>
                      {p?.done ? <CheckCircle2 size={20} /> : `0${ep.position}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400"><Clock size={12} /> ≈{ep.minutes} мин</span>
                  </div>
                  <h3 className="mt-4 font-bold leading-snug text-ink-900">{ep.title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-500">{ep.summary}</p>
                  {p?.note && (
                    <p className="mt-3 rounded-lg bg-gold-100/60 px-3 py-2 text-xs leading-relaxed text-gold-800"><span className="font-bold">Заметка:</span> {p.note}</p>
                  )}
                  <Button className="mt-4" variant={p?.done ? 'ghost' : 'primary'} onClick={() => setActive(ep)}>
                    {p?.done ? 'Послушать снова' : 'Слушать серию'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {active && (
        <EpisodePlayer
          episode={active}
          progress={progress[active.episode_key]}
          onDone={setDone}
          onNote={setNote}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
