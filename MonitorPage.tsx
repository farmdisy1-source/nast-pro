import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Gauge, Users, School, Copy, Check, Loader2, AlertTriangle, Vote, Square,
  RefreshCw, TrendingUp, MessageSquareQuote, History, Trash2, Timer, ListChecks, Plus, Link2,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import CopyLinkButton from '@/components/CopyLinkButton';
import ImagePicker from '@/components/ImagePicker';
import { supabase } from '@/lib/supabase';

type Poll = {
  id: string;
  title: string;
  metric: string;
  audience: string;
  scale_label_min: string | null;
  scale_label_max: string | null;
  scale_max: number;
  status: string;
  access_code: string;
  kind: string;
  created_at: string;
};

type Vote = { id: string; poll_id: string; score: number; voted_at: string };
type PollQuestion = { id: string; poll_id: string; position: number; text: string; options: string[]; correct_index: number | null; image_url: string | null };
type PollAnswer = { id: string; poll_id: string; question_id: string; option_index: number };

const AUDIENCES = [
  { key: 'students', label: 'Ученики', icon: School },
  { key: 'parents', label: 'Родители', icon: Users },
];

const QUICK_TEMPLATES = [
  { title: 'Уровень удовлетворенности питанием', metric: 'satisfaction', audience: 'students', min: 'Совершенно не доволен', max: 'Полностью доволен', scale: 5 },
  { title: 'Индекс климата в коллективе', metric: 'climate', audience: 'students', min: 'Чувствую себя плохо', max: 'Чувствую себя отлично', scale: 10 },
  { title: 'Удобство расписания для семьи', metric: 'custom', audience: 'parents', min: 'Очень неудобно', max: 'Очень удобно', scale: 5 },
  { title: 'Доступность классного руководителя', metric: 'satisfaction', audience: 'parents', min: 'Не доступен', max: 'Всегда на связи', scale: 5 },
];

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function fetchVotes(pollIds: string[]): Promise<Vote[]> {
  if (pollIds.length === 0) return [];
  const { data, error } = await supabase.from('poll_votes').select('id, poll_id, score, voted_at').in('poll_id', pollIds);
  if (error) throw error;
  return (data || []) as Vote[];
}

function scoreColor(ratio: number): string {
  if (ratio >= 0.8) return 'bg-pine-500';
  if (ratio >= 0.6) return 'bg-pine-400';
  if (ratio >= 0.4) return 'bg-gold-400';
  return 'bg-terracotta-400';
}

function scoreVerdict(avg: number | null, metric: string): string {
  if (avg === null) return 'Голоса ещё не собраны.';
  const t = avg / 5;
  if (metric === 'climate') {
    if (t >= 0.8) return 'Климат в коллективе здоровый — поддерживайте традиции класса.';
    if (t >= 0.6) return 'Климат в целом доброжелательный, но есть ученики в «группе риска» — присмотритесь к изолированным детям.';
    if (t >= 0.4) return 'Климат тревожный: стоит провести упражнение на сплочение и поговорить с активом класса.';
    return 'Климат неблагополучный — рекомендуется беседа с психологом и классный час «Наш класс — наша команда».';
  }
  if (t >= 0.8) return 'Показатель высокий — коллектив отмечает заметные успехи.';
  if (t >= 0.6) return 'Показатель хороший, но есть резервы — обсудите результаты на собрании.';
  if (t >= 0.4) return 'Показатель средний: нужна адресная работа с конкретной проблемой.';
  return 'Показатель низкий — требуется срочное вмешательство и план действий.';
}

function PollCard({ poll, votes, onClosed, onDeleted, onVote }: {
  poll: Poll;
  votes: Vote[];
  onClosed: () => void;
  onDeleted: () => void;
  onVote: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const scores = votes.map((v) => v.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const ratio = avg !== null ? avg / poll.scale_max : 0;
  const isOpen = poll.status === 'open';

  const distribution = useMemo(() => {
    const counts = new Array(poll.scale_max).fill(0) as number[];
    for (const s of scores) if (s >= 1 && s <= poll.scale_max) counts[s - 1] += 1;
    return counts;
  }, [scores, poll.scale_max]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(poll.access_code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };

  const close = async () => {
    await supabase.from('polls').update({ status: 'closed' }).eq('id', poll.id);
    onClosed();
  };

  const remove = async () => {
    await supabase.from('polls').delete().eq('id', poll.id);
    onDeleted();
  };

  return (
    <Card className="animate-fade-up p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug text-ink-900">{poll.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-400">
            <span className="inline-flex items-center gap-1">{poll.audience === 'parents' ? <Users size={12} /> : <School size={12} />} {poll.audience === 'parents' ? 'Родители' : 'Ученики'}</span>
            · <span className="inline-flex items-center gap-1"><Timer size={12} /> {new Date(poll.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            · <span className={`font-bold ${isOpen ? 'text-pine-600' : 'text-ink-400'}`}>{isOpen ? 'Идёт голосование' : 'Завершён'}</span>
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${poll.metric === 'climate' ? 'bg-gold-500' : 'bg-pine-600'}`}>
          <Gauge size={20} />
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-pine-50 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pine-700">Код доступа</span>
          <span className="font-mono text-lg font-extrabold tracking-[0.2em] text-pine-900">{poll.access_code}</span>
          <button onClick={copy} className="ml-auto rounded-lg p-1.5 text-pine-600 transition hover:bg-pine-100" aria-label="Скопировать код">
            {copied ? <Check size={16} className="text-pine-700" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 px-4 py-2.5">
        <Link2 size={14} className="shrink-0 text-ink-400" />
        <span className="truncate text-[11px] text-ink-500">Ссылка для учеников: открыть на любом компьютере</span>
        <CopyLinkButton kind="poll" code={poll.access_code} label="Копировать" className="ml-auto shrink-0 !py-1 !text-[11px]" />
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
            {avg !== null ? `Средний балл: ${avg.toFixed(1)} из ${poll.scale_max}` : 'Пока нет голосов'}
          </p>
          <p className="text-xs font-semibold text-pine-600">{scores.length} голос(ов)</p>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-ink-100">
          <div className={`h-full rounded-full transition-all duration-700 ${scoreColor(ratio)}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-ink-400">
          <span>{poll.scale_label_min || '1'}</span>
          <span>{poll.scale_label_max || String(poll.scale_max)}</span>
        </div>
      </div>

      {scores.length > 0 && (
        <div className="mt-4 flex items-end gap-1.5" aria-hidden>
          {distribution.map((count, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-ink-400">{count || ''}</span>
              <div className={`w-full rounded-t-md transition-all duration-500 ${scoreColor((i + 1) / poll.scale_max)}`} style={{ height: `${Math.max(4, (count / Math.max(...distribution, 1)) * 56)}px` }} />
              <span className="text-[10px] text-ink-400">{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {scores.length > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-pine-50 px-4 py-3 text-xs leading-relaxed text-pine-800">
          <TrendingUp size={15} className="mt-0.5 shrink-0" /> {scoreVerdict(avg, poll.metric)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {isOpen && <Button onClick={onVote} className="!px-4 !py-2 !text-xs"><Vote size={14} /> Экран голосования</Button>}
        {isOpen && <Button variant="ghost" onClick={close} className="!px-4 !py-2 !text-xs"><Square size={14} /> Завершить</Button>}
        <Button variant="ghost" onClick={remove} className="!px-4 !py-2 !text-xs !text-terracotta-600 hover:!border-terracotta-300 hover:!bg-terracotta-50"><Trash2 size={14} /> Удалить</Button>
      </div>
    </Card>
  );
}

function VoteScreen({ poll, onExit }: { poll: Poll; onExit: () => void }) {
  const [scores, setScores] = useState<Vote[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchVotes([poll.id]);
      setScores(list);
    } catch {
      setError('Не удалось обновить результаты.');
    }
  }, [poll.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  const vote = async (score: number) => {
    if (myScore !== null || sending) return;
    setSending(true);
    const { error: err } = await supabase.from('poll_votes').insert({ poll_id: poll.id, score });
    if (err) setError('Не удалось учесть голос. Проверьте связь и попробуйте снова.');
    else { setMyScore(score); void load(); }
    setSending(false);
  };

  const avg = scores.length ? scores.reduce((a, b) => a + b.score, 0) / scores.length : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Экспресс-голосование · код {poll.access_code}</p>
          <h2 className="font-display text-lg font-extrabold sm:text-2xl">{poll.title}</h2>
        </div>
        <button onClick={onExit} className="rounded-xl border border-pine-400/30 px-4 py-2 text-xs font-bold text-pine-100 transition hover:bg-pine-900">Закрыть</button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-8">
        {myScore !== null && (
          <p className="animate-fade-up flex items-center gap-2 rounded-full bg-gold-300 px-6 py-3 text-sm font-extrabold text-pine-950">
            <Check size={18} /> Голос учтён, спасибо!
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {Array.from({ length: poll.scale_max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => void vote(n)}
              disabled={myScore !== null || sending}
              className={`flex h-16 w-16 items-center justify-center rounded-3xl border-2 text-2xl font-extrabold transition-all duration-200 sm:h-20 sm:w-20 sm:text-3xl ${myScore !== null ? (n === myScore ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/20 bg-pine-900/40 text-pine-100/40') : 'border-pine-400/40 bg-pine-900/60 text-white hover:-translate-y-1 hover:border-gold-300 hover:bg-pine-900'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-xl justify-between text-xs font-bold text-pine-100/70">
          <span>{poll.scale_label_min || 'Минимум'}</span>
          <span>{poll.scale_label_max || 'Максимум'}</span>
        </div>

        {avg !== null && (
          <p className="flex items-center gap-2 text-sm text-pine-100/80"><TrendingUp size={16} className="text-gold-300" /> Проголосовало: {scores.length} · текущий средний балл: {avg.toFixed(1)} из {poll.scale_max}</p>
        )}
        {error && <p className="flex items-center gap-2 text-sm text-terracotta-300"><AlertTriangle size={15} /> {error}</p>}
        {myScore !== null && <p className="text-[11px] text-pine-100/50">Опрос анонимный: кто как голосовал, не видно никому.</p>}
      </div>
    </div>
  );
}

function QuestionsVoteScreen({ poll, onExit }: { poll: Poll; onExit: () => void }) {
  const [questions, setQuestions] = useState<PollQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [current, setCurrent] = useState(0);
  const [myPicks, setMyPicks] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [qRes, aRes] = await Promise.all([
      supabase.from('poll_questions').select('id, poll_id, position, text, options, correct_index, image_url').eq('poll_id', poll.id).order('position'),
      supabase.from('poll_answers').select('id, poll_id, question_id, option_index').eq('poll_id', poll.id),
    ]);
    if (qRes.error || aRes.error) { setError('Не удалось обновить результаты.'); return; }
    setQuestions((qRes.data || []) as PollQuestion[]);
    const map: Record<string, number[]> = {};
    for (const a of (aRes.data || []) as PollAnswer[]) (map[a.question_id] ||= []).push(a.option_index);
    setAnswers(map);
  }, [poll.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => void load(), 6000);
    return () => clearInterval(id);
  }, [load]);

  const q = questions[current];
  const total = questions.length;

  const vote = async (qi: PollQuestion, oi: number) => {
    if (myPicks[qi.id] !== undefined) return;
    setMyPicks((p) => ({ ...p, [qi.id]: oi }));
    const { error: err } = await supabase.from('poll_answers').insert({ poll_id: poll.id, question_id: qi.id, option_index: oi });
    if (err) setError('Не удалось учесть голос. Попробуйте снова.');
    else void load();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pine-950 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Экспресс-опрос · код {poll.access_code}</p>
          <h2 className="font-display text-lg font-extrabold sm:text-2xl">{poll.title}</h2>
        </div>
        <button onClick={onExit} className="rounded-xl border border-pine-400/30 px-4 py-2 text-xs font-bold text-pine-100 transition hover:bg-pine-900">Закрыть</button>
      </div>

      {total > 1 && (
        <div className="mx-6 flex gap-1.5">
          {questions.map((qq, i) => (
            <div key={qq.id} className={`h-1.5 flex-1 rounded-full ${i < current ? 'bg-gold-300' : i === current ? 'bg-gold-300/60' : 'bg-pine-900'}`} />
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
        {error && <p className="flex items-center gap-2 text-sm text-terracotta-300"><AlertTriangle size={15} /> {error}</p>}
        {!q && !error && <p className="text-sm text-pine-100/60"><Loader2 size={16} className="inline animate-spin" /> Загрузка вопросов…</p>}
        {q && (
          <div className="w-full max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-pine-100/60">Вопрос {current + 1} из {total}</p>
            {q.image_url && <img src={q.image_url} alt="" className="animate-fade-in mx-auto mt-4 max-h-56 rounded-2xl border border-pine-400/30 object-cover" />}
            <p className="mt-4 font-display text-2xl font-extrabold leading-snug sm:text-3xl">{q.text}</p>
            <div className={`mt-6 grid gap-3 ${q.image_url ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-2'}`}>
              {q.options.map((opt, oi) => {
                const picked = myPicks[q.id] === oi;
                const count = (answers[q.id] || []).filter((x) => x === oi).length;
                const all = (answers[q.id] || []).length || 1;
                return (
                  <button
                    key={oi}
                    onClick={() => void vote(q, oi)}
                    disabled={myPicks[q.id] !== undefined}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left text-sm font-bold transition-all duration-300 ${
                      picked ? 'border-gold-300 bg-gold-300/20' : 'border-pine-400/30 bg-pine-900/50 hover:-translate-y-0.5 hover:border-gold-300/60'
                    }`}
                  >
                    {count > 0 && (
                      <span className="absolute inset-y-0 left-0 bg-gold-300/15 transition-all duration-700" style={{ width: `${Math.round((count / all) * 100)}%` }} />
                    )}
                    <span className="relative flex items-center justify-between gap-3">
                      <span>{opt}</span>
                      {count > 0 && <span className="shrink-0 text-xs text-gold-300">{Math.round((count / all) * 100)}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="rounded-xl border border-pine-400/30 px-4 py-2 text-xs font-bold text-pine-100 transition hover:bg-pine-900 disabled:opacity-30"
              >
                Назад
              </button>
              <button
                onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                disabled={current >= total - 1}
                className="rounded-xl bg-gold-300 px-5 py-2 text-xs font-bold text-pine-950 transition hover:bg-gold-200 disabled:opacity-30"
              >
                Следующий вопрос
              </button>
            </div>
            <p className="mt-4 text-[11px] text-pine-100/50">Опрос анонимный: кто как голосовал, не видно никому.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomPollBuilder({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('students');
  const [questions, setQuestions] = useState([{ text: '', options: [''], image: null as string | null }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setQ = (i: number, patch: Partial<(typeof questions)[number]>) =>
    setQuestions((qs) => qs.map((q, qi) => (qi === i ? { ...q, ...patch } : q)));

  const create = async () => {
    if (saving) return;
    const clean = questions
      .map((q) => ({ ...q, text: q.text.trim(), options: q.options.map((o) => o.trim()).filter(Boolean) }))
      .filter((q) => q.text && q.options.length >= 2);
    if (!title.trim() || clean.length === 0) {
      setError('В каждом вопросе должно быть хотя бы два варианта ответа.');
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('polls')
      .insert({ title: title.trim(), metric: 'custom', audience, kind: 'questions', access_code: makeCode(), scale_max: 5 })
      .select('id')
      .single();
    if (err || !data) {
      setError('Не удалось создать опрос. Попробуйте ещё раз.');
      setSaving(false);
      return;
    }
    const { error: qErr } = await supabase.from('poll_questions').insert(
      clean.map((q, i) => ({
        poll_id: (data as { id: string }).id,
        position: i,
        text: q.text,
        options: q.options,
        correct_index: null,
        image_url: q.image,
      })),
    );
    if (qErr) setError('Опрос создан, но вопросы не сохранились полностью.');
    else { setOpen(false); setTitle(''); setQuestions([{ text: '', options: [''], image: null }]); onCreated(); }
    setSaving(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-pine-700 transition hover:border-pine-300">
        <Plus size={15} /> Свой опрос с вопросами
      </button>
    );
  }

  return (
    <Card className="animate-fade-up border-pine-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-pine-700"><ListChecks size={16} /> Свой опрос с вопросами</h3>
        <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-500 transition hover:bg-ink-100">Закрыть</button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label className="lg:col-span-2">
          <span className="text-xs font-bold text-ink-500">Название опроса</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Уроки шестого школьного дня — что выбираем?"
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
        </label>
        <div>
          <span className="text-xs font-bold text-ink-500">Кому опрос</span>
          <div className="mt-1 flex gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a.key}
                onClick={() => setAudience(a.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${audience === a.key ? 'border-pine-700 bg-pine-50 text-pine-800' : 'border-ink-200 text-ink-500 hover:border-pine-300'}`}
              >
                <a.icon size={16} /> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-pine-700">Вопрос {i + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => setQuestions((qs) => qs.filter((_, qi) => qi !== i))} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Удалить вопрос"><Trash2 size={15} /></button>
              )}
            </div>
            <input
              value={q.text}
              onChange={(e) => setQ(i, { text: e.target.value })}
              placeholder="Текст вопроса"
              className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => setQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                    placeholder={`Вариант ответа ${oi + 1}`}
                    className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                  />
                  <button
                    onClick={() => q.options.length > 1 && setQ(i, { options: q.options.filter((_, x) => x !== oi) })}
                    disabled={q.options.length <= 1}
                    className="shrink-0 rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    aria-label="Удалить вариант ответа"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            {q.options.length < 6 && (
              <button onClick={() => setQ(i, { options: [...q.options, ''] })} className="mt-2 text-xs font-bold text-pine-600 transition hover:text-pine-700">+ вариант ответа</button>
            )}
            <div className="mt-3">
              <ImagePicker value={q.image} onChange={(url) => setQ(i, { image: url })} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => questions.length < 12 && setQuestions((qs) => [...qs, { text: '', options: [''], image: null }])}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-pine-700 transition hover:border-pine-300"
        >
          <Plus size={15} /> Добавить вопрос
        </button>
        <Button onClick={create} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Vote size={16} />} Создать и запустить
        </Button>
        {error && <span className="text-xs font-bold text-terracotta-600">{error}</span>}
      </div>
    </Card>
  );
}

export default function MonitorPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Record<string, Vote[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [votePoll, setVotePoll] = useState<Poll | null>(null);

  const [form, setForm] = useState({ title: '', audience: 'students', min: '', max: '', scale: 5 });

  const load = async () => {
    const { data, error: err } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
    if (err) { setError('Не удалось загрузить опросы.'); setLoading(false); return; }
    const list = (data || []) as Poll[];
    setPolls(list);
    try {
      const allVotes = await fetchVotes(list.map((p) => p.id));
      const map: Record<string, Vote[]> = {};
      for (const v of allVotes) (map[v.poll_id] ||= []).push(v);
      setVotes(map);
      setError(null);
    } catch {
      setError('Не удалось загрузить голоса.');
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    const title = form.title.trim();
    if (!title || creating) return;
    setCreating(true);
    const { data, error: err } = await supabase
      .from('polls')
      .insert({
        title,
        metric: QUICK_TEMPLATES.find((t) => t.title === title)?.metric || 'custom',
        audience: form.audience,
        scale_label_min: form.min.trim() || null,
        scale_label_max: form.max.trim() || null,
        scale_max: form.scale,
        access_code: makeCode(),
      })
      .select()
      .single();
    if (err || !data) setError('Не удалось создать опрос. Попробуйте ещё раз.');
    else { setForm({ title: '', audience: 'students', min: '', max: '', scale: 5 }); void load(); }
    setCreating(false);
  };

  const activePolls = polls.filter((p) => p.status === 'open');
  const pastPolls = polls.filter((p) => p.status !== 'open');

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Экспресс-мониторинг"
        subtitle="Мгновенные анонимные опросы для учеников и родителей с автоматической инфографикой. Запустите опрос, покажите на доске код — класс голосует, а результаты и выводы появляются здесь в реальном времени."
        mentorTip="Голосование работает и с телефонов: ученики или родители вводят код на главном экране приложения. Анонимность обязательна — так ответы честнее." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-pine-700"><Gauge size={16} /> Новый опрос</h3>
          <CustomPollBuilder onCreated={() => { void load(); }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.title}
              onClick={() => setForm({ title: t.title, audience: t.audience, min: t.min, max: t.max, scale: t.scale })}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${form.title === t.title ? 'border-pine-700 bg-pine-700 text-white' : 'border-ink-200 bg-white text-ink-500 hover:border-pine-300'}`}
            >
              {t.title}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="lg:col-span-2">
            <span className="text-xs font-bold text-ink-500">Название опроса</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Например: Уровень удовлетворенности питанием"
              className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
          </label>
          <div>
            <span className="text-xs font-bold text-ink-500">Кому опрос</span>
            <div className="mt-1 flex gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setForm((f) => ({ ...f, audience: a.key }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${form.audience === a.key ? 'border-pine-700 bg-pine-50 text-pine-800' : 'border-ink-200 text-ink-500 hover:border-pine-300'}`}
                >
                  <a.icon size={16} /> {a.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-ink-500">Шкала оценки</span>
            <div className="mt-1 flex gap-2">
              {[5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, scale: n }))}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${form.scale === n ? 'border-pine-700 bg-pine-50 text-pine-800' : 'border-ink-200 text-ink-500 hover:border-pine-300'}`}
                >
                  от 1 до {n}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className="text-xs font-bold text-ink-500">Подпись левой границы шкалы (необязательно)</span>
            <input
              value={form.min}
              onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))}
              placeholder="Совершенно не доволен"
              className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
          </label>
          <label>
            <span className="text-xs font-bold text-ink-500">Подпись правой границы шкалы (необязательно)</span>
            <input
              value={form.max}
              onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
              placeholder="Полностью доволен"
              className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
          </label>
        </div>
        <div className="mt-5">
          <Button onClick={create} disabled={creating || !form.title.trim()}>
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Vote size={16} />} Запустить опрос
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
      ) : (
        <>
          {activePolls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Идут сейчас</h3>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activePolls.map((p) => (
                  <PollCard key={p.id} poll={p} votes={votes[p.id] || []} onClosed={load} onDeleted={load} onVote={() => setVotePoll(p)} />
                ))}
              </div>
            </div>
          )}

          {pastPolls.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400"><History size={14} /> Завершённые опросы</h3>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pastPolls.map((p) => (
                  <PollCard key={p.id} poll={p} votes={votes[p.id] || []} onClosed={load} onDeleted={load} onVote={() => setVotePoll(p)} />
                ))}
              </div>
            </div>
          )}

          {polls.length === 0 && (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-pine-50 text-pine-600"><MessageSquareQuote size={26} /></span>
              <p className="font-bold text-ink-800">Опросов пока нет</p>
              <p className="max-w-md text-sm leading-relaxed text-ink-500">Выберите готовый шаблон выше — например, «Индекс климата в коллективе» — и запустите первый опрос. Результаты появятся здесь сразу после первых голосов.</p>
              <Button variant="ghost" onClick={load}><RefreshCw size={14} /> Обновить</Button>
            </Card>
          )}
        </>
      )}

      {votePoll && (votePoll.kind === 'questions'
        ? <QuestionsVoteScreen poll={votePoll} onExit={() => { setVotePoll(null); void load(); }} />
        : <VoteScreen poll={votePoll} onExit={() => { setVotePoll(null); void load(); }} />)}
    </div>
  );
}
