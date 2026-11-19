import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Star, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Period = 'day' | 'week' | 'month';

type Task = {
  id: string;
  title: string;
  due_date: string;
  period: Period;
  priority: 'normal' | 'important';
  done: boolean;
  created_at: string;
};

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
};

const TASK_TEMPLATES = [
  'Провести опрос настроения',
  'Заполнить журнал собраний',
  'Подготовить сценарий ШАГ',
  'Позвонить родителю',
  'Заполнить план на месяц',
];

function periodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (period === 'day') end.setDate(end.getDate() + 1);
  else if (period === 'week') end.setDate(end.getDate() + 7);
  else if (period === 'month') end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('day');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [important, setImportant] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { start, end } = periodRange(period);
    const { data, error } = await supabase
      .from('teacher_tasks')
      .select('*')
      .gte('due_date', formatDate(start))
      .lt('due_date', formatDate(end))
      .order('done', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { start } = periodRange(period);
    const { data, error } = await supabase
      .from('teacher_tasks')
      .insert({ title, due_date: formatDate(start), period, priority: important ? 'important' : 'normal' })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [...prev, data as Task]);
      setNewTitle('');
      setImportant(false);
    }
    setAdding(false);
  };

  const toggleDone = async (task: Task) => {
    const { error } = await supabase.from('teacher_tasks').update({ done: !task.done }).eq('id', task.id);
    if (!error) setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('teacher_tasks').delete().eq('id', id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTemplate = async (title: string) => {
    setAdding(true);
    const { start } = periodRange(period);
    const { data, error } = await supabase
      .from('teacher_tasks')
      .insert({ title, due_date: formatDate(start), period, priority: 'normal' })
      .select()
      .single();
    if (!error && data) setTasks((prev) => [...prev, data as Task]);
    setAdding(false);
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const activeCount = tasks.length - doneCount;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-pine-200/80 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-pine-600" />
          <h3 className="text-sm font-bold text-ink-900">Планер задач</h3>
        </div>
        <span className="rounded-full bg-pine-50 px-2 py-0.5 text-[10px] font-bold text-pine-700">
          {activeCount > 0 ? `${doneCount}/${tasks.length}` : 'готово'}
        </span>
      </div>

      <div className="flex gap-1 px-4 pt-3">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${period === p ? 'bg-pine-600 text-white shadow-sm' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-4 py-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
          placeholder="Новая задача…"
          className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 outline-none transition focus:border-pine-400 focus:ring-1 focus:ring-pine-300"
        />
        <button
          onClick={() => setImportant((v) => !v)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${important ? 'bg-gold-100 text-gold-600' : 'bg-ink-50 text-ink-300 hover:text-ink-500'}`}
          title="Важная задача"
        >
          <Star size={16} fill={important ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={addTask}
          disabled={adding || !newTitle.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pine-600 text-white transition hover:bg-pine-700 disabled:opacity-50"
          title="Добавить"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-ink-400"><Loader2 size={14} className="animate-spin" /> Загрузка…</div>
        ) : tasks.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-ink-400">Задач на {PERIOD_LABELS[period].toLowerCase()} нет</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {TASK_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => addTemplate(t)}
                  className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[10px] font-semibold text-ink-500 transition hover:border-pine-300 hover:bg-pine-50 hover:text-pine-700"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${task.done ? 'border-ink-100 bg-ink-50/50' : task.priority === 'important' ? 'border-gold-200 bg-gold-100/30' : 'border-ink-100 bg-white hover:border-pine-200'}`}
              >
                <button
                  onClick={() => toggleDone(task)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${task.done ? 'border-pine-600 bg-pine-600 text-white' : 'border-ink-300 hover:border-pine-500'}`}
                >
                  {task.done && <Check size={12} strokeWidth={3} />}
                </button>
                <span className={`min-w-0 flex-1 text-[13px] leading-tight ${task.done ? 'text-ink-400 line-through' : 'text-ink-800'}`}>
                  {task.title}
                </span>
                {task.priority === 'important' && !task.done && (
                  <Star size={13} className="shrink-0 text-gold-500" fill="currentColor" />
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 text-ink-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
