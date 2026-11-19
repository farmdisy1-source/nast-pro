import { useEffect, useState } from 'react';
import { Landmark, MapPin, Target, CheckCircle2, Circle, Download } from 'lucide-react';
import { SectionTitle, Card, Pill, Medal, Button } from '@/components/ui';
import { MEMORIALS } from '@/data/content';
import { supabase } from '@/lib/supabase';
import { printAsPdf } from '@/lib/docgen';

export default function PatriotPage() {
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('memorial_visits').select('memorial_key, visited');
      if (err) {
        setError('Не удалось загрузить отметки посещения.');
      } else if (data) {
        const map: Record<string, boolean> = {};
        for (const row of data as { memorial_key: string; visited: boolean }[]) {
          map[row.memorial_key] = row.visited;
        }
        setVisited(map);
      }
      setLoading(false);
    })();
  }, []);

  const toggleVisit = async (key: string) => {
    const next = !visited[key];
    setVisited((prev) => ({ ...prev, [key]: next }));
    const { error: err } = await supabase
      .from('memorial_visits')
      .update({ visited: next })
      .eq('memorial_key', key);
    if (err) {
      setVisited((prev) => ({ ...prev, [key]: !next }));
      setError('Не удалось сохранить отметку. Проверьте соединение.');
    }
  };

  const doneCount = MEMORIALS.filter((m) => visited[m.key]).length;
  const progress = Math.round((doneCount / MEMORIALS.length) * 100);

  const downloadPlan = () => {
    const lines = [
      'МАРШРУТ ШЕСТОГО ШКОЛЬНОГО ДНЯ «ДОРОГАМИ ПАМЯТИ»',
      'Гомельская область: мемориальные комплексы',
      '',
      ...MEMORIALS.flatMap((m) => [
        `${m.name} (${m.location})`,
        `Статус: ${visited[m.key] ? 'посещено' : 'в плане'}`,
        'Образовательные цели:',
        ...m.goals.map((g, i) => `  ${i + 1}. ${g}`),
        '',
      ]),
    ];
    printAsPdf('Дорогами памяти — план маршрута', lines.join('\n'));
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Патриотический хаб"
        subtitle="Чек-лист мемориальных комплексов Гомельской области для организации шестого школьного дня. Отмечайте посещения — маршрут и образовательные цели можно скачать готовым планом."
        mentorTip="Перед поездкой выберите одну образовательную цель и подготовьте вопрос для ребят. Так посещение станет разговором, а не просто пунктом маршрута."
      />

      <Card className="animate-fade-up p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Medal tone="gold"><Landmark size={20} /></Medal>
            <div>
              <h3 className="font-bold text-ink-900">Готовность маршрута «Дорогами памяти»</h3>
              <p className="text-xs text-ink-400">
                {doneCount} из {MEMORIALS.length} комплексов внесено в программу класса
              </p>
            </div>
          </div>
          <Button onClick={downloadPlan} variant="ghost">
            <Download size={16} /> Сохранить план в PDF
          </Button>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pine-500 to-gold-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">{error}</div>
      )}

      <div className="space-y-5">
        {MEMORIALS.map((m, i) => (
          <Card key={m.key} className={`animate-fade-up delay-${Math.min(i + 1, 6)} p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <Medal tone={visited[m.key] ? 'gold' : 'pine'}><Landmark size={20} /></Medal>
                <div>
                  <h3 className="text-lg font-bold text-ink-900">{m.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                    <MapPin size={12} className="text-gold-600" /> {m.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleVisit(m.key)}
                disabled={loading}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  visited[m.key]
                    ? 'bg-pine-600 text-white shadow-sm'
                    : 'border border-pine-300 text-pine-700 hover:bg-pine-50'
                }`}
              >
                {visited[m.key] ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {visited[m.key] ? 'Посещено' : 'Отметить посещение'}
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-600">{m.description}</p>

            <div className="mt-5 rounded-xl bg-pine-50/70 p-5">
              <Pill>
                <Target size={13} /> Образовательные цели шестого школьного дня
              </Pill>
              <ul className="mt-3 space-y-2.5">
                {m.goals.map((g, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine-400" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
