import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Gamepad2, Play, Plus, Trash2, Loader2, AlertTriangle, Download, Save,
  ChevronRight, CheckCircle2, XCircle, Trophy, RotateCcw, ShieldCheck, Timer,
  FileUp, ArrowUp, ArrowDown, Copy, Pencil, Wand2, Link2,
} from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import CopyLinkButton from '@/components/CopyLinkButton';
import ImagePicker from '@/components/ImagePicker';
import { supabase } from '@/lib/supabase';
import { printAsPdf } from '@/lib/docgen';
import { QUIZ_TEMPLATES, QUIZ_TOPICS, estimateMinutes, type QuizQuestion, type QuizTemplate } from '@/data/quizzes';
import { importQuizFile, QUIZ_IMPORT_TEMPLATE, type ImportedDraft } from '@/lib/quizImport';

type CustomQuiz = { id: string; title: string; topic_key: string; questions: QuizQuestion[]; access_code?: string | null; updated_at: string };
type QuizAnswerRow = { quiz_id: string; score: number; total: number };
type QuizSession = {
  id: string; quiz_title: string; topic_key: string; questions_count: number;
  team_score: number; team_name: string | null; class_impression: string | null; played_at: string;
};

const IMPRESSIONS = ['Понравилось очень', 'Скорее понравилось', 'Средне', 'Не понравилось'];

type EditorQuestion = QuizQuestion & { key: number };

let editorKey = 1;
const withKeys = (qs: QuizQuestion[]): EditorQuestion[] =>
  qs.map((q) => ({ ...q, key: editorKey++ }));

function emptyQuestion(): EditorQuestion {
  return { key: editorKey++, question: '', options: [''], answerIndex: 0, teacherNote: '', image: null };
}

function QuestionEditor({ q, index, total, onChange, onRemove, onMove, onDuplicate }: {
  q: EditorQuestion;
  index: number;
  total: number;
  onChange: (q: EditorQuestion) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
}) {
  const setOption = (oi: number, v: string) => {
    const options = q.options.slice();
    options[oi] = v;
    onChange({ ...q, options });
  };
  const addOption = () => {
    if (q.options.length >= 6) return;
    onChange({ ...q, options: [...q.options, ''] });
  };
  const removeOption = (oi: number) => {
    if (q.options.length <= 1) return;
    const options = q.options.filter((_, i) => i !== oi);
    const answerIndex = Math.min(q.answerIndex, options.length - 1);
    onChange({ ...q, options, answerIndex: oi < q.answerIndex ? answerIndex - 1 : answerIndex });
  };

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pine-100 text-xs font-extrabold text-pine-700">{index + 1}</span>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 disabled:opacity-30" aria-label="Выше"><ArrowUp size={15} /></button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 disabled:opacity-30" aria-label="Ниже"><ArrowDown size={15} /></button>
          <button onClick={onDuplicate} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100" aria-label="Дублировать"><Copy size={15} /></button>
          <button onClick={onRemove} disabled={total <= 1} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Удалить"><Trash2 size={15} /></button>
        </div>
      </div>
      <textarea
        value={q.question}
        onChange={(e) => onChange({ ...q, question: e.target.value })}
        rows={2}
        placeholder="Текст вопроса"
        className="mt-3 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
      />
      <div className="mt-3 space-y-2">
        {q.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <button
              onClick={() => onChange({ ...q, answerIndex: oi })}
              title="Отметить правильным"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-extrabold transition ${q.answerIndex === oi ? 'border-pine-500 bg-pine-600 text-white' : 'border-ink-200 text-ink-400 hover:border-pine-300'}`}
            >
              {oi + 1}
            </button>
            <input
              value={opt}
              onChange={(e) => setOption(oi, e.target.value)}
              placeholder={`Вариант ответа ${oi + 1}`}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
            <button onClick={() => removeOption(oi)} disabled={q.options.length <= 1} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Удалить вариант ответа"><XCircle size={16} /></button>
          </div>
        ))}
        {q.options.length < 6 && (
          <button onClick={addOption} className="text-xs font-bold text-pine-600 transition hover:text-pine-700">+ вариант ответа</button>
        )}
      </div>
      <input
        value={q.teacherNote}
        onChange={(e) => onChange({ ...q, teacherNote: e.target.value })}
        placeholder="Комментарий классному руководителю (показывается после ответа)"
        className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
      />
      <div className="mt-3">
        <ImagePicker value={q.image ?? null} onChange={(url) => onChange({ ...q, image: url })} />
      </div>
    </li>
  );
}

function ImportPanel({ onImported }: { onImported: (draft: ImportedDraft, name: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const draft = await importQuizFile(file);
      onImported(draft, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось прочитать файл.');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-gold-300/60 bg-gold-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-ink-900"><FileUp size={16} className="text-gold-600" /> Импорт вопросов из документа</h4>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-500">
            Загрузите файл .doc, .docx или .pdf: строка «Вопрос: …», ниже варианты (по одному в строке), звёздочка <b>*</b> или плюс <b>+</b> перед правильным ответом. Перед импортом всё проверяется — ничего не сохранится без вашей проверки.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-pine-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-pine-600 disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />} Выбрать файл
          </button>
        </div>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-[11px] leading-relaxed text-ink-600">{QUIZ_IMPORT_TEMPLATE}</pre>
      {error && <p className="mt-3 flex items-center gap-2 rounded-xl bg-terracotta-50 px-4 py-3 text-sm text-terracotta-700"><AlertTriangle size={15} className="shrink-0" /> {error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept=".doc,.docx,.pdf,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function PlayMode({ quiz, onExit }: { quiz: { title: string; questions: QuizQuestion[]; topicKey: string }; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [impression, setImpression] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const q = quiz.questions[index];
  const total = quiz.questions.length;

  const finish = async (finalScore: number, finalImpression: string | null) => {
    setSaving(true);
    const { error } = await supabase.from('quiz_sessions').insert({
      quiz_title: quiz.title,
      topic_key: quiz.topicKey,
      questions_count: total,
      team_score: finalScore,
      team_name: teamNameInput.trim() || null,
      class_impression: finalImpression,
    });
    if (error) setSaveError('Не удалось сохранить итоги игры.');
    setSaving(false);
  };

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      void finish(score, null);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIndex(0); setPicked(null); setScore(0); setFinished(false); setImpression(null); setSaveError(null); setTeamNameInput('');
  };

  if (finished) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950 p-6 text-white">
        <div className="w-full max-w-2xl text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-300 text-pine-950"><Trophy size={40} /></span>
          <h2 className="mt-6 font-display text-4xl font-extrabold">Игра завершена!</h2>
          <p className="mt-3 text-pine-100/80">«{quiz.title}» · {total} вопросов</p>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-pine-400/25 bg-pine-900/60 p-8">
            <p className="text-6xl font-extrabold text-gold-300">{score} <span className="text-2xl text-pine-100/70">/ {total}</span></p>
            <label className="mt-6 block text-left">
              <span className="text-xs font-bold text-pine-100">Название команды (не обязательно)</span>
              <input
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                placeholder="например, «Искатели»"
                className="mt-1 w-full rounded-xl border border-pine-400/30 bg-pine-950/60 px-4 py-2.5 text-sm font-bold text-white outline-none transition placeholder:text-pine-100/40 focus:border-gold-300/60"
              />
            </label>
            {teamNameInput.trim() && <p className="mt-2 text-center font-bold text-pine-100">Команда «{teamNameInput.trim()}»</p>}
            <p className="mt-3 text-xs text-pine-100/60">Счёт команды — без имён и оценок отдельных учеников.</p>
          </div>
          {saveError && <p className="mt-4 text-sm text-terracotta-300">{saveError}</p>}
          <div className="mt-8">
            <p className="text-sm font-bold text-pine-100">Как прошло у класса? (анонимно)</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {IMPRESSIONS.map((imp) => (
                <button
                  key={imp}
                  onClick={() => { setImpression(imp); void finish(score, imp); }}
                  disabled={saving || impression !== null}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${impression === imp ? 'border-gold-300 bg-gold-300 text-pine-950' : 'border-pine-400/30 bg-pine-900/50 text-pine-100 hover:border-gold-300/50'}`}
                >
                  {imp}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={restart}><RotateCcw size={16} /> Играть снова</Button>
            <Button variant="ghost" onClick={onExit}>Выйти</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-pine-950 p-4 text-white sm:p-8">
      <div className="mx-auto flex h-full max-w-4xl flex-col">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">{QUIZ_TOPICS[quiz.topicKey]?.label ?? 'Игра'}</p>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">{quiz.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-pine-400/30 bg-pine-900/60 px-4 py-2 text-sm font-bold">Вопрос {index + 1} / {total}</span>
            <button onClick={onExit} className="rounded-xl border border-pine-400/30 px-4 py-2 text-xs font-bold text-pine-100 transition hover:bg-pine-900">Выход</button>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pine-900">
          <div className="h-full rounded-full bg-gold-300 transition-all duration-500" style={{ width: `${((index + (picked !== null ? 1 : 0)) / total) * 100}%` }} />
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
          {q.image && (
            <div className="animate-fade-in mb-5 overflow-hidden rounded-2xl border border-pine-400/30">
              <img src={q.image} alt="" className="max-h-64 w-full object-cover" />
            </div>
          )}
          <p className="font-display text-2xl font-extrabold leading-snug sm:text-4xl">{q.question}</p>
          <div className={`mt-8 grid gap-3 ${q.image ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answerIndex;
              const revealed = picked !== null;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={revealed}
                  className={`rounded-2xl border-2 p-5 text-left text-sm font-bold leading-relaxed transition-all duration-300 sm:min-h-[120px] ${
                    revealed && isAnswer ? 'border-pine-400 bg-pine-700/70' :
                    revealed && picked === i ? 'border-terracotta-400 bg-terracotta-500/25' :
                    revealed ? 'border-pine-400/15 opacity-50' :
                    'border-pine-400/25 bg-pine-900/50 hover:-translate-y-0.5 hover:border-gold-300/60'
                  }`}
                >
                  <span className="mb-2 flex items-center gap-2">
                    {revealed && isAnswer ? <CheckCircle2 size={18} className="text-pine-300" /> : revealed && picked === i ? <XCircle size={18} className="text-terracotta-300" /> : <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pine-800 text-xs">{i + 1}</span>}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="mt-6 animate-fade-in rounded-2xl border border-gold-300/30 bg-pine-900/70 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-300">Классному руководителю</p>
              <p className="mt-2 text-sm leading-relaxed text-pine-100/90">{q.teacherNote}</p>
              <button onClick={next} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-300 px-5 py-2.5 text-sm font-bold text-pine-950 transition hover:bg-gold-200">
                {index + 1 >= total ? 'Итоги' : 'Следующий вопрос'} <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [savedQuizzes, setSavedQuizzes] = useState<CustomQuiz[]>([]);
  const [linkStats, setLinkStats] = useState<Record<string, { count: number; avg: number | null }>>({});
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playQuiz, setPlayQuiz] = useState<{ title: string; questions: QuizQuestion[]; topicKey: string } | null>(null);
  const [builderTemplate, setBuilderTemplate] = useState<QuizTemplate | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderSelected, setBuilderSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [customEditor, setCustomEditor] = useState<{ title: string; questions: EditorQuestion[]; editingId: string | null } | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const openNewEditor = () => {
    setBuilderTemplate(null);
    setImportWarnings([]);
    setEditorError(null);
    setCustomEditor({ title: '', questions: [emptyQuestion()], editingId: null });
  };

  const openEditorForQuiz = (q: CustomQuiz) => {
    setBuilderTemplate(null);
    setImportWarnings([]);
    setEditorError(null);
    setCustomEditor({ title: q.title, questions: withKeys(q.questions), editingId: q.id });
  };

  const updateEditorQuestion = (key: number, next: EditorQuestion) => {
    setCustomEditor((c) => c ? { ...c, questions: c.questions.map((q) => (q.key === key ? next : q)) } : c);
  };

  const moveEditorQuestion = (key: number, dir: -1 | 1) => {
    setCustomEditor((c) => {
      if (!c) return c;
      const idx = c.questions.findIndex((q) => q.key === key);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= c.questions.length) return c;
      const questions = c.questions.slice();
      [questions[idx], questions[swap]] = [questions[swap], questions[idx]];
      return { ...c, questions };
    });
  };

  const duplicateEditorQuestion = (key: number) => {
    setCustomEditor((c) => {
      if (!c) return c;
      const idx = c.questions.findIndex((q) => q.key === key);
      if (idx < 0) return c;
      const copy = { ...c.questions[idx], key: editorKey++ };
      const questions = c.questions.slice();
      questions.splice(idx + 1, 0, copy);
      return { ...c, questions };
    });
  };

  const removeEditorQuestion = (key: number) => {
    setCustomEditor((c) => {
      if (!c || c.questions.length <= 1) return c;
      return { ...c, questions: c.questions.filter((q) => q.key !== key) };
    });
  };

  const saveCustomQuiz = async () => {
    if (!customEditor || editorSaving) return;
    const title = customEditor.title.trim();
    const questions: QuizQuestion[] = customEditor.questions
      .filter((q) => q.question.trim() && q.options.map((o) => o.trim()).filter(Boolean).length >= 2)
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        answerIndex: Math.min(q.answerIndex, q.options.map((o) => o.trim()).filter(Boolean).length - 1),
        teacherNote: q.teacherNote.trim(),
        image: q.image || null,
      }));
    if (!title || questions.length === 0) {
      setEditorError('В каждом вопросе должно быть хотя бы два варианта ответа.');
      return;
    }
    setEditorSaving(true);
    setEditorError(null);
    const payload = { title, topic_key: 'custom', questions };
    const { data, error: err } = customEditor.editingId
      ? await supabase.from('custom_quizzes').update(payload).eq('id', customEditor.editingId)
        .select('id, title, topic_key, questions, access_code, updated_at').single()
      : await supabase.from('custom_quizzes').insert(payload)
        .select('id, title, topic_key, questions, access_code, updated_at').single();
    if (err || !data) {
      setEditorError('Не удалось сохранить игру. Попробуйте ещё раз.');
    } else {
      const saved = data as CustomQuiz;
      setSavedQuizzes((prev) => customEditor.editingId
        ? prev.map((q) => (q.id === saved.id ? saved : q))
        : [saved, ...prev]);
      setCustomEditor(null);
    }
    setEditorSaving(false);
  };

  const handleImport = (draft: ImportedDraft, fileName: string) => {
    setImportWarnings(draft.warnings);
    if (draft.questions.length === 0) return;
    setCustomEditor((c) => {
      const base = c ?? { title: '', editingId: null, questions: [] as EditorQuestion[] };
      const imported = withKeys(draft.questions);
      const kept = base.questions.filter((q) => q.question.trim() || q.options.some((o) => o.trim()));
      return { ...base, title: base.title || fileName.replace(/\.(docx?|pdf|txt)$/i, ''), questions: [...kept, ...imported] };
    });
  };

  const load = async () => {
    const [quizzesRes, sessionsRes, answersRes] = await Promise.all([
      supabase.from('custom_quizzes').select('id, title, topic_key, questions, access_code, updated_at').order('updated_at', { ascending: false }),
      supabase.from('quiz_sessions').select('id, quiz_title, topic_key, questions_count, team_score, team_name, class_impression, played_at').order('played_at', { ascending: false }).limit(20),
      supabase.from('quiz_answers').select('quiz_id, score, total'),
    ]);
    if (quizzesRes.error || sessionsRes.error || answersRes.error) setError('Не удалось загрузить данные генератора.');
    else {
      setSavedQuizzes((quizzesRes.data || []) as CustomQuiz[]);
      setSessions((sessionsRes.data || []) as QuizSession[]);
      const stats: Record<string, { count: number; avg: number | null }> = {};
      for (const a of (answersRes.data || []) as QuizAnswerRow[]) {
        const s = (stats[a.quiz_id] ||= { count: 0, avg: null });
        s.avg = s.avg === null ? a.score : (s.avg * s.count + a.score) / (s.count + 1);
        s.count += 1;
      }
      setLinkStats(stats);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const startBuilder = (t: QuizTemplate) => {
    setBuilderTemplate(t);
    setBuilderTitle(t.title);
    setBuilderSelected(t.questions.map((_, i) => i));
  };

  const toggleQuestion = (i: number) => {
    setBuilderSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const selectedMinutes = estimateMinutes(builderSelected.length);

  const saveQuiz = async () => {
    if (!builderTemplate || !builderTitle.trim() || saving || builderSelected.length === 0) return;
    setSaving(true);
    const questions = builderSelected.map((i) => builderTemplate.questions[i]);
    const { data, error: err } = await supabase
      .from('custom_quizzes')
      .insert({ title: builderTitle.trim(), topic_key: builderTemplate.topic, questions })
      .select('id, title, topic_key, questions, access_code, updated_at')
      .single();
    if (err || !data) setError('Не удалось сохранить игру.');
    else {
      setSavedQuizzes((prev) => [data as CustomQuiz, ...prev]);
      setBuilderTemplate(null);
    }
    setSaving(false);
  };

  const removeQuiz = async (id: string) => {
    const prev = savedQuizzes;
    setSavedQuizzes((list) => list.filter((q) => q.id !== id));
    const { error: err } = await supabase.from('custom_quizzes').delete().eq('id', id);
    if (err) { setSavedQuizzes(prev); setError('Не удалось удалить игру.'); }
  };

  const downloadQuiz = (title: string, questions: QuizQuestion[]) => {
    const lines = [title, '='.repeat(title.length), ''];
    questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      q.options.forEach((o, oi) => lines.push(`   ${oi + 1}) ${o}${oi === q.answerIndex ? ' ✓' : ''}`));
      lines.push(`   Комментарий педагогу: ${q.teacherNote}`);
      lines.push('');
    });
    printAsPdf(title, lines.join('\n'));
  };

  const stats = useMemo(() => {
    const played = sessions.length;
    const avgImpression = sessions.filter((s) => s.class_impression === IMPRESSIONS[0] || s.class_impression === IMPRESSIONS[1]).length;
    return { played, liked: avgImpression };
  }, [sessions]);

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Генератор игр и квизов"
        subtitle="Готовые шаблоны воспитательных квизов — медиаграмотность, безопасность в сети, семейные ценности. Соберите свой вариант из вопросов шаблона, запустите на проекторе и проведите игру на пять минут до звонка или на занятии шестого школьного дня."
        mentorTip="Квиз работает лучше, когда после каждого ответа педагог делает паузу и обсуждает комментарий — не спешите к следующему вопросу ради счёта." />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {QUIZ_TEMPLATES.map((t, i) => (
              <Card key={t.key} className={`animate-fade-up flex flex-col p-6 delay-${i + 1}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${QUIZ_TOPICS[t.topic].color}`}><Gamepad2 size={20} /></span>
                <h3 className="mt-4 font-bold text-ink-900">{t.title}</h3>
                <p className="mt-1 text-xs font-semibold text-pine-600">{t.audience}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{t.description}</p>
                <p className="mt-3 flex items-center gap-2 text-[11px] text-ink-400"><Timer size={13} /> {t.questions.length} вопросов · ≈{estimateMinutes(t.questions.length)} минут</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setPlayQuiz({ title: t.title, questions: t.questions, topicKey: t.topic })}><Play size={16} /> Играть</Button>
                  <Button variant="ghost" onClick={() => startBuilder(t)}><Plus size={16} /> Свой вариант</Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={openNewEditor}><Wand2 size={16} /> Создать свой квиз</Button>
            <p className="text-xs text-ink-400">Свои вопросы, картинки с компьютера или из галереи, импорт из документа — и игра на проекторе.</p>
          </div>

          {customEditor && (
            <Card className="animate-fade-up border-pine-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold text-ink-900">
                  <Pencil size={18} className="text-pine-600" />
                  {customEditor.editingId ? 'Редактирование игры' : 'Новая своя игра'}
                </h3>
                <button onClick={() => setCustomEditor(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-500 transition hover:bg-ink-100">Закрыть</button>
              </div>
              <input
                value={customEditor.title}
                onChange={(e) => setCustomEditor((c) => c ? { ...c, title: e.target.value } : c)}
                className="mt-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                placeholder="Название игры"
              />

              <div className="mt-4">
                <ImportPanel onImported={handleImport} />
              </div>
              {importWarnings.length > 0 && (
                <div className="mt-3 rounded-xl border border-gold-200 bg-gold-100/50 px-4 py-3 text-xs leading-relaxed text-gold-700">
                  <p className="flex items-center gap-2 font-bold"><AlertTriangle size={14} /> Проверьте импорт ({importWarnings.length})</p>
                  <ul className="mt-1 list-disc pl-5">
                    {importWarnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <ul className="mt-4 space-y-4">
                {customEditor.questions.map((q, i) => (
                  <QuestionEditor
                    key={q.key}
                    q={q}
                    index={i}
                    total={customEditor.questions.length}
                    onChange={(next) => updateEditorQuestion(q.key, next)}
                    onRemove={() => removeEditorQuestion(q.key)}
                    onMove={(dir) => moveEditorQuestion(q.key, dir)}
                    onDuplicate={() => duplicateEditorQuestion(q.key)}
                  />
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCustomEditor((c) => c ? { ...c, questions: [...c.questions, emptyQuestion()] } : c)}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-pine-700 transition hover:border-pine-300"
                >
                  <Plus size={15} /> Добавить вопрос
                </button>
                <Button onClick={saveCustomQuiz} disabled={editorSaving}>
                  {editorSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить игру
                </Button>
                {editorError && <span className="text-xs font-bold text-terracotta-600">{editorError}</span>}
              </div>
            </Card>
          )}

          {builderTemplate && (
            <Card className="animate-fade-up border-pine-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold text-ink-900"><Plus size={18} className="text-pine-600" /> Свой вариант на базе: {builderTemplate.title}</h3>
                <button onClick={() => setBuilderTemplate(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-500 transition hover:bg-ink-100">Отменить</button>
              </div>
              <input
                value={builderTitle}
                onChange={(e) => setBuilderTitle(e.target.value)}
                className="mt-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                placeholder="Название игры"
              />
              <ul className="mt-4 space-y-2">
                {builderTemplate.questions.map((q, i) => {
                  const on = builderSelected.includes(i);
                  return (
                    <li key={i}>
                      <button
                        onClick={() => toggleQuestion(i)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${on ? 'border-pine-300 bg-pine-50' : 'border-ink-200 bg-white opacity-60 hover:opacity-100'}`}
                      >
                        <span className="flex items-start gap-3">
                          <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${on ? 'text-pine-600' : 'text-ink-300'}`} />
                          <span>
                            <span className="font-semibold text-ink-800">{q.question}</span>
                            <span className="mt-1 block text-xs text-ink-400">Правильный ответ: {q.options[q.answerIndex]}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={saveQuiz} disabled={!builderTitle.trim() || builderSelected.length === 0 || saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить игру
                </Button>
                <span className="text-xs text-ink-400">{builderSelected.length} вопросов · ≈{selectedMinutes} минут игры</span>
              </div>
            </Card>
          )}

          {savedQuizzes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Мои игры ({savedQuizzes.length})</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {savedQuizzes.map((q) => (
                  <Card key={q.id} className="animate-fade-up p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-800">{q.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">{QUIZ_TOPICS[q.topic_key]?.label} · {q.questions.length} вопросов</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button onClick={() => openEditorForQuiz(q)} className="rounded-lg p-2 text-ink-400 transition hover:bg-pine-50 hover:text-pine-600" aria-label="Редактировать"><Pencil size={15} /></button>
                        <button onClick={() => downloadQuiz(q.title, q.questions)} className="rounded-lg p-2 text-ink-400 transition hover:bg-pine-50 hover:text-pine-600" aria-label="Сохранить в PDF"><Download size={15} /></button>
                        <button onClick={() => removeQuiz(q.id)} className="rounded-lg p-2 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Удалить"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <Button className="mt-4" onClick={() => setPlayQuiz({ title: q.title, questions: q.questions, topicKey: q.topic_key })}><Play size={16} /> Играть</Button>
                    {q.access_code && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2">
                        <Link2 size={13} className="shrink-0 text-ink-400" />
                        <span className="truncate text-[11px] text-ink-500">
                          {linkStats[q.id]?.count
                            ? `По ссылке прошли: ${linkStats[q.id].count} · средний результат ${(linkStats[q.id].avg ?? 0).toFixed(1)} из ${q.questions.length}`
                            : 'Ссылка для учеников'}
                        </span>
                        <CopyLinkButton kind="quiz" code={q.access_code} label="Копировать" className="ml-auto shrink-0 !py-1 !text-[11px]" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-pine-200 bg-pine-50 px-5 py-4 text-sm leading-relaxed text-pine-900">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-pine-600" />
            Игра ведётся по принципу «класс — одна команда»: сохраняются только общий счёт и анонимное впечатление класса. Имена участников не собираются.
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-400">Проведённые игры</h3>
              <span className="text-xs text-ink-400">{stats.played} игр · в {stats.liked} классу «понравилось» или «скорее понравилось»</span>
            </div>
            {sessions.length === 0 ? (
              <Card className="p-6 text-sm text-ink-400">Пока игр не было. Запустите любой шаблон — итоги появятся здесь.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sessions.map((s, i) => (
                  <Card key={s.id} className={`animate-fade-up p-5 delay-${Math.min(i + 1, 4)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-800">{s.quiz_title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {new Date(s.played_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · {s.questions_count} вопросов
                          {s.team_name ? ` · команда «${s.team_name}»` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-700">{s.team_score}/{s.questions_count}</span>
                    </div>
                    {s.class_impression && <p className="mt-2 text-xs text-pine-700">Впечатление класса: {s.class_impression}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {playQuiz && (
        <PlayMode
          quiz={playQuiz}
          onExit={() => { setPlayQuiz(null); setLoading(true); void load(); }}
        />
      )}
    </div>
  );
}
