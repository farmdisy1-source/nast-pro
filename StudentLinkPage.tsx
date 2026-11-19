import { useCallback, useEffect, useState } from 'react';
import {
  Activity, Check, Loader2, AlertTriangle, ClipboardList, Heart,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { QuizQuestion } from '@/data/quizzes';

type Route =
  | { kind: 'poll'; code: string }
  | { kind: 'quiz'; code: string }
  | { kind: 'mood' }
  | { kind: 'mood-code'; id: string }
  | { kind: 'not-found' };

function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 's') {
    if (parts[1] === 'mood') return parts[2] ? { kind: 'mood-code', id: parts[2] } : { kind: 'mood' };
    if (parts[1] === 'poll' && parts[2]) return { kind: 'poll', code: parts[2].toUpperCase() };
    if (parts[1] === 'quiz' && parts[2]) return { kind: 'quiz', code: parts[2].toUpperCase() };
    return { kind: 'not-found' };
  }
  return { kind: 'not-found' };
}

type Poll = {
  id: string; title: string; status: string; access_code: string;
  scale_label_min: string | null; scale_label_max: string | null; scale_max: number; kind: string;
};
type PollQuestion = { id: string; position: number; text: string; options: string[]; image_url: string | null };

function ThankYou({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pine-600 text-white">
        <Check size={40} strokeWidth={3} />
      </span>
      <h2 className="font-display text-3xl font-extrabold">Ответ принят</h2>
      <p className="max-w-sm text-sm leading-relaxed text-pine-100/70">{text}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-pine-950 text-white">
      <header className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-300 text-pine-950"><Activity size={18} strokeWidth={2.4} /></span>
        <div>
          <p className="font-display text-sm font-extrabold leading-tight">Настаўнік <span className="text-gold-300">PRO</span></p>
          <p className="text-[10px] text-pine-100/50">Страница для ученика</p>
        </div>
      </header>
      {children}
      <footer className="px-6 pb-6 pt-2 text-center text-[10px] leading-relaxed text-pine-100/40">
        Опрос анонимный: имя не спрашивается и не сохраняется.
      </footer>
    </div>
  );
}

function ScalePollScreen({ poll }: { poll: Poll }) {
  const [myScore, setMyScore] = useState<number | null>(() => {
    try { return localStorage.getItem(`pk-voted-${poll.id}`) ? Number(localStorage.getItem(`pk-voted-${poll.id}`)) : null; } catch { return null; }
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (score: number) => {
    if (myScore !== null || sending) return;
    setSending(true);
    const { error: err } = await supabase.from('poll_votes').insert({ poll_id: poll.id, score });
    if (err) {
      setError('Не удалось учесть голос. Проверьте связь и попробуйте снова.');
    } else {
      try { localStorage.setItem(`pk-voted-${poll.id}`, String(score)); } catch { /* storage unavailable */ }
      setMyScore(score);
      setError(null);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-10 text-center">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Голосование</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{poll.title}</h1>
      </div>
      {myScore !== null ? (
        <ThankYou text="Ваш голос учтён. Можно закрыть страницу." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Array.from({ length: poll.scale_max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => void vote(n)}
                disabled={sending}
                className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-pine-400/40 bg-pine-900/60 text-2xl font-extrabold transition-all duration-200 hover:-translate-y-1 hover:border-gold-300 hover:bg-pine-900 disabled:opacity-50 sm:h-20 sm:w-20 sm:text-3xl"
              >
                {sending ? <Loader2 size={22} className="animate-spin" /> : n}
              </button>
            ))}
          </div>
          <div className="flex w-full max-w-md justify-between text-xs font-bold text-pine-100/70">
            <span>{poll.scale_label_min || 'Минимум'}</span>
            <span>{poll.scale_label_max || 'Максимум'}</span>
          </div>
          {error && <p className="flex items-center gap-2 text-sm text-terracotta-300"><AlertTriangle size={15} /> {error}</p>}
        </>
      )}
    </div>
  );
}

function QuestionsPollScreen({ poll }: { poll: Poll }) {
  const [questions, setQuestions] = useState<PollQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [myPicks, setMyPicks] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('poll_questions')
        .select('id, poll_id, position, text, options, correct_index, image_url')
        .eq('poll_id', poll.id)
        .order('position');
      if (err) setError('Не удалось загрузить вопросы.');
      else setQuestions((data || []) as PollQuestion[]);
    })();
  }, [poll.id]);

  const q = questions[current];
  const total = questions.length;

  const vote = async (question: PollQuestion, oi: number) => {
    if (myPicks[question.id] !== undefined) return;
    setMyPicks((p) => ({ ...p, [question.id]: oi }));
    const { error: err } = await supabase.from('poll_answers').insert({ poll_id: poll.id, question_id: question.id, option_index: oi });
    if (err) setError('Не удалось учесть голос. Попробуйте снова.');
    if (current + 1 >= total) setDone(true);
    else setCurrent((c) => c + 1);
  };

  if (done) return <ThankYou text="Все ответы сохранены. Можно закрыть страницу." />;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-6 text-center">
      {error && <p className="flex items-center gap-2 text-sm text-terracotta-300"><AlertTriangle size={15} /> {error}</p>}
      {!q && !error && <p className="text-sm text-pine-100/60"><Loader2 size={16} className="inline animate-spin" /> Загрузка вопросов…</p>}
      {q && (
        <div className="w-full max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-pine-100/60">Вопрос {current + 1} из {total}</p>
          {q.image_url && <img src={q.image_url} alt="" className="animate-fade-in mx-auto mt-4 max-h-52 rounded-2xl border border-pine-400/30 object-cover" />}
          <p className="mt-4 font-display text-2xl font-extrabold leading-snug">{q.text}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => void vote(q, oi)}
                disabled={myPicks[q.id] !== undefined}
                className="rounded-2xl border-2 border-pine-400/30 bg-pine-900/50 p-4 text-left text-sm font-bold leading-relaxed transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300/60 disabled:opacity-50"
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-pine-100/50">Прогресс сохраняется сразу после каждого ответа.</p>
        </div>
      )}
    </div>
  );
}

function QuizLinkScreen({ code }: { code: string }) {
  const [quiz, setQuiz] = useState<{ title: string; questions: QuizQuestion[] } | null>(null);
  const [quizRowId, setQuizRowId] = useState('');
  const [status, setStatus] = useState<'loading' | 'open' | 'closed' | 'missing'>('loading');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('custom_quizzes')
        .select('id, title, questions, status')
        .eq('access_code', code)
        .maybeSingle();
      if (err || !data) { setStatus('missing'); return; }
      const row = data as { id: string; title: string; questions: QuizQuestion[]; status: string };
      setQuizRowId(row.id);
      setQuiz({ title: row.title, questions: row.questions || [] });
      setStatus(row.status === 'closed' ? 'closed' : 'open');
    })();
  }, [code]);

  const q = quiz?.questions[index];
  const total = quiz?.questions.length ?? 0;

  const finish = useCallback(async (finalScore: number) => {
    const { error: err } = await supabase.from('quiz_answers').insert({ quiz_id: quizRowId, score: finalScore, total });
    if (err) setSaveError('Не удалось сохранить результат.');
  }, [quizRowId, total]);

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (q && i === q.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      void finish(score);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  if (status === 'loading') {
    return <div className="flex flex-1 items-center justify-center text-sm text-pine-100/60"><Loader2 size={18} className="inline animate-spin" /> Загрузка…</div>;
  }
  if (status === 'missing') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <ClipboardList size={44} className="text-pine-100/40" />
        <h2 className="font-display text-2xl font-extrabold">Квиз не найден</h2>
        <p className="max-w-sm text-sm text-pine-100/60">Проверьте ссылку — возможно, она была скопирована не полностью.</p>
      </div>
    );
  }
  if (status === 'closed') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle size={44} className="text-gold-300" />
        <h2 className="font-display text-2xl font-extrabold">Опрос завершён</h2>
        <p className="max-w-sm text-sm text-pine-100/60">Учитель уже закрыл этот квиз. Ответы больше не принимаются.</p>
      </div>
    );
  }

  if (finished) {
    const ratio = total ? score / total : 0;
    const verdict = ratio >= 0.8
      ? 'Отлично! Тема освоена.'
      : ratio >= 0.5
        ? 'Хорошая попытка! Обсудим на занятии.'
        : 'Спасибо за участие! Разберём тему вместе.';
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-300 text-pine-950"><Check size={40} strokeWidth={3} /></span>
        <h2 className="font-display text-3xl font-extrabold">Готово!</h2>
        <p className="rounded-2xl border border-pine-400/25 bg-pine-900/60 px-6 py-4 text-lg font-bold text-gold-300">{score} / {total}</p>
        <p className="max-w-sm text-sm leading-relaxed text-pine-100/70">{verdict}</p>
        {saveError && <p className="text-sm text-terracotta-300">{saveError}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-6 text-center">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">Викторина · вопрос {index + 1} из {total}</p>
        <h1 className="mt-2 font-display text-xl font-extrabold sm:text-2xl">{quiz?.title}</h1>
      </div>
      {q && (
        <div className="w-full max-w-2xl">
          {q.image && <img src={q.image} alt="" className="animate-fade-in mx-auto mb-4 max-h-52 rounded-2xl border border-pine-400/30 object-cover" />}
          <p className="font-display text-2xl font-extrabold leading-snug">{q.question}</p>
          <div className={`mt-6 grid gap-3 ${q.image ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={picked !== null}
                className={`rounded-2xl border-2 p-4 text-left text-sm font-bold leading-relaxed transition-all duration-300 ${
                  picked === i ? 'border-gold-300 bg-gold-300/20' : 'border-pine-400/25 bg-pine-900/50 hover:-translate-y-0.5 hover:border-gold-300/60'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {picked !== null && (
            <button onClick={next} className="mt-6 rounded-xl bg-gold-300 px-6 py-3 text-sm font-extrabold text-pine-950 transition hover:bg-gold-200">
              {index + 1 >= total ? 'Завершить' : 'Следующий вопрос'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MoodLinkScreen({ codeId }: { codeId?: string }) {
  const moods = [
    { key: 'great', label: 'Отлично' },
    { key: 'good', label: 'Хорошо' },
    { key: 'ok', label: 'Обычно' },
    { key: 'hard', label: 'Трудно' },
  ];
  const [voted, setVoted] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vote = async (mood: string) => {
    setSending(mood);
    const { error: err } = await supabase.from('mood_checkins').insert(codeId ? { mood, student_code_id: codeId } : { mood });
    if (err) setError('Не удалось сохранить ответ. Попробуйте ещё раз.');
    else { setVoted(true); setError(null); }
    setSending(null);
  };

  if (voted) return <ThankYou text="Ваше настроение записано. Спасибо!" />;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-10 text-center">
      <Heart size={40} className="text-gold-300" />
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Как тебе сегодня?</h1>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {moods.map((m) => (
          <button
            key={m.key}
            onClick={() => void vote(m.key)}
            disabled={sending !== null}
            className="rounded-2xl border-2 border-pine-400/30 bg-pine-900/50 px-4 py-7 text-sm font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300/60 disabled:opacity-50"
          >
            {sending === m.key ? <Loader2 size={20} className="mx-auto animate-spin" /> : m.label}
          </button>
        ))}
      </div>
      {error && <p className="flex items-center gap-2 text-sm text-terracotta-300"><AlertTriangle size={15} /> {error}</p>}
    </div>
  );
}

export default function StudentLinkPage() {
  const [route, setRoute] = useState<Route>(parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <Shell>
      {route.kind === 'poll' && <PollById code={route.code} />}
      {route.kind === 'quiz' && <QuizLinkScreen code={route.code} />}
      {route.kind === 'mood' && <MoodLinkScreen />}
      {route.kind === 'mood-code' && <MoodLinkScreen codeId={route.id} />}
      {route.kind === 'not-found' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle size={44} className="text-gold-300" />
          <h2 className="font-display text-2xl font-extrabold">Ссылка недействительна</h2>
          <p className="max-w-sm text-sm text-pine-100/60">Проверьте адрес — похоже, он скопирован не полностью.</p>
        </div>
      )}
    </Shell>
  );
}

function PollById({ code }: { code: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('polls').select('id, title, status, access_code, scale_label_min, scale_label_max, scale_max, kind').eq('access_code', code).maybeSingle();
      if (err || !data) { setState('missing'); return; }
      setPoll(data as Poll);
      setState('ready');
    })();
  }, [code]);

  if (state === 'loading') return <div className="flex flex-1 items-center justify-center text-sm text-pine-100/60"><Loader2 size={18} className="inline animate-spin" /> Загрузка…</div>;
  if (state === 'missing' || !poll || poll.status !== 'open') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle size={44} className="text-gold-300" />
        <h2 className="font-display text-2xl font-extrabold">{state === 'missing' ? 'Опрос не найден' : 'Опрос завершён'}</h2>
        <p className="max-w-sm text-sm text-pine-100/60">{state === 'missing' ? 'Проверьте ссылку — возможно, она скопирована не полностью.' : 'Учитель уже закрыл этот опрос. Ответы больше не принимаются.'}</p>
      </div>
    );
  }
  return poll.kind === 'questions' ? <QuestionsPollScreen poll={poll} /> : <ScalePollScreen poll={poll} />;
}
