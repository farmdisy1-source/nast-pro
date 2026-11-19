import { useEffect, useMemo, useState } from 'react';
import { Laugh, Smile, Meh, CloudRain, Check, Loader2, ShieldCheck, TrendingUp, Link2 } from 'lucide-react';
import { SectionTitle, Card } from '@/components/ui';
import CopyLinkButton from '@/components/CopyLinkButton';
import { supabase } from '@/lib/supabase';

type Mood = 'great' | 'good' | 'ok' | 'hard';

const MOODS: { key: Mood; label: string; emoji: string; icon: typeof Laugh; color: string; ring: string }[] = [
  { key: 'great', label: 'Отлично!', emoji: 'Класс!', icon: Laugh, color: 'bg-pine-600', ring: 'hover:border-pine-400 hover:bg-pine-50' },
  { key: 'good', label: 'Хорошо', emoji: 'Нормально', icon: Smile, color: 'bg-pine-400', ring: 'hover:border-pine-300 hover:bg-pine-50' },
  { key: 'ok', label: 'Обычно', emoji: 'Так себе', icon: Meh, color: 'bg-gold-400', ring: 'hover:border-gold-300 hover:bg-gold-100/40' },
  { key: 'hard', label: 'Трудно', emoji: 'Тяжело', icon: CloudRain, color: 'bg-ink-400', ring: 'hover:border-ink-300 hover:bg-ink-100' },
];

const MOOD_LABELS: Record<Mood, string> = {
  great: 'Отлично',
  good: 'Хорошо',
  ok: 'Обычно',
  hard: 'Трудно',
};

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

type Vote = { mood: Mood; created_at: string };

export default function MoodPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<Mood | null>(null);
  const [voted, setVoted] = useState<Mood | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('mood_checkins')
        .select('mood, created_at')
        .order('created_at', { ascending: false });
      if (err) setError('Не удалось загрузить результаты опроса.');
      else setVotes((data || []) as Vote[]);
      setLoading(false);
    })();
  }, []);

  const vote = async (mood: Mood) => {
    if (voting) return;
    setVoting(mood);
    const { error: err } = await supabase.from('mood_checkins').insert({ mood });
    if (err) {
      setError('Не удалось сохранить ответ. Попробуйте ещё раз.');
    } else {
      setVotes((prev) => [{ mood, created_at: new Date().toISOString() }, ...prev]);
      setVoted(mood);
      setError(null);
    }
    setVoting(null);
  };

  const last7 = useMemo(() => {
    const now = new Date();
    const cut = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return votes.filter((v) => new Date(v.created_at) >= cut);
  }, [votes]);

  const counts = useMemo(() => {
    const c: Record<Mood, number> = { great: 0, good: 0, ok: 0, hard: 0 };
    for (const v of last7) c[v.mood] += 1;
    return c;
  }, [last7]);

  const total = last7.length;
  // Индекс благополучия: отлично=1, хорошо=0.75, обычно=0.5, трудно=0.25 — нормируется к 100
  const wellbeing = total
    ? Math.round(
        ((counts.great * 1 + counts.good * 0.75 + counts.ok * 0.5 + counts.hard * 0.25) / total) * 100,
      )
    : null;

  const byDay = useMemo(() => {
    const days: { label: string; positive: number; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayVotes = votes.filter((v) => {
        const vd = new Date(v.created_at);
        return (
          vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth() && vd.getDate() === d.getDate()
        );
      });
      const pos = dayVotes.filter((v) => v.mood === 'great' || v.mood === 'good').length;
      days.push({ label: WEEKDAYS[d.getDay()], positive: pos, total: dayVotes.length });
    }
    return days;
  }, [votes]);

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Настроение класса"
        subtitle="Быстрый анонимный опрос: один клик — и вы видите состояние коллектива. Никаких имён и входа: ответ невозможно связать с учеником, результаты показываются только в агрегированном виде."
        mentorTip="Проведите голосование в начале шестого школьного дня — это займёт одну минуту. Главный ориентир — не средний балл, а доля ответов «Трудно»: если она растёт два дня подряд, это сигнал поговорить с классом."
      />

      {error && (
        <div className="rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <Card className="animate-fade-up overflow-hidden border-pine-200/80 p-7">
          <h3 className="font-bold text-ink-900">Как ты сегодня?</h3>
          {voted ? (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-pine-50 px-6 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pine-600 text-white">
                <Check size={32} strokeWidth={3} />
              </span>
              <p className="text-lg font-bold text-pine-800">Спасибо, ответ сохранён!</p>
              <p className="text-sm text-ink-500">
                Ты выбрал «{MOOD_LABELS[voted]}». Это анонимно — ваше имя нигде не сохраняется.
              </p>
              <button
                onClick={() => setVoted(null)}
                className="text-sm font-semibold text-pine-600 underline-offset-4 hover:underline"
              >
                Ответить снова
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {MOODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    onClick={() => vote(m.key)}
                    disabled={voting !== null}
                    className={`group flex flex-col items-center gap-3 rounded-2xl border-2 border-ink-100 bg-white px-4 py-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98] disabled:opacity-60 ${m.ring}`}
                  >
                    {voting === m.key ? (
                      <Loader2 size={40} className="animate-spin text-pine-600" />
                    ) : (
                      <Icon size={40} strokeWidth={1.6} className="text-ink-500 transition-colors group-hover:text-pine-600" />
                    )}
                    <span className="text-sm font-bold text-ink-800">{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
            <ShieldCheck size={16} className="shrink-0 text-pine-600" />
            Голосование анонимно: система не спрашивает имя и не хранит сведения об отвечающем.
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-pine-50 px-4 py-3">
            <Link2 size={14} className="shrink-0 text-pine-600" />
            <span className="text-[11px] font-semibold leading-snug text-pine-800">Ссылка для учеников: они могут проголосовать со своего компьютера</span>
            <CopyLinkButton kind="mood" label="Копировать" className="ml-auto shrink-0 !py-1 !text-[11px]" />
          </div>
        </Card>

        <Card className="animate-fade-up delay-1 overflow-hidden border-gold-200/80 p-7">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Настроение за 7 дней</h3>
            <span className="text-xs text-ink-400">{total} ответов</span>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center gap-2 text-sm text-ink-400">
              <Loader2 size={16} className="animate-spin" /> Загрузка…
            </div>
          ) : total === 0 ? (
            <p className="mt-8 text-sm text-ink-400">Пока нет ответов. Дайте классу проголосовать — график появится здесь.</p>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-5 rounded-2xl bg-pine-50 px-5 py-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e3ece3" strokeWidth="10" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="#2c6e37"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(wellbeing! / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-pine-700">
                    {wellbeing}
                  </span>
                </div>
                <div>
                  <p className="flex items-center gap-2 font-bold text-pine-800">
                    <TrendingUp size={16} /> Индекс благополучия класса
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    От 0 до 100 по ответам за неделю. Ниже 55 — класс просит внимания: планируйте разговор и сплочающее дело.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  {(['great', 'good', 'ok', 'hard'] as Mood[]).map((m) => {
                    const n = counts[m];
                    const pct = total ? (n / total) * 100 : 0;
                    const color = m === 'great' ? 'bg-pine-600' : m === 'good' ? 'bg-pine-400' : m === 'ok' ? 'bg-gold-400' : 'bg-ink-400';
                    return (
                      <div key={m} className="flex items-center gap-3">
                        <span className="w-16 text-xs font-semibold text-ink-600">{MOOD_LABELS[m]}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-14 text-right text-xs font-bold text-ink-700">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-end justify-between gap-2 border-t border-ink-100 pt-4">
                  {byDay.map((d, i) => {
                    const h = d.total ? Math.max((d.positive / d.total) * 48, 6) : 4;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="flex h-12 w-6 items-end">
                          <div
                            className={`w-full rounded-t-md ${d.total ? 'bg-pine-400' : 'bg-ink-100'}`}
                            style={{ height: `${h}px` }}
                            title={d.total ? `${d.positive} из ${d.total} — «хорошо» или выше` : 'нет ответов'}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-ink-400">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
