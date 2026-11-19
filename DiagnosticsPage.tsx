import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Info, ShieldCheck, Lightbulb } from 'lucide-react';
import { SectionTitle, Card, Medal } from '@/components/ui';
import { SURVEYS } from '@/data/content';
import { supabase } from '@/lib/supabase';
import { printAsPdf } from '@/lib/docgen';

type Metric = { option_label: string; option_value: number; sort_order: number };

const SERIES_COLORS = ['#c9a13a', '#5aa662', '#e9d492', '#8cc690', '#a8832c', '#3a8a45'];

function AreaChart({ data }: { data: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 240;
  const PAD = 24;
  const max = Math.max(...data.map((d) => d.value), 1);

  const pts = data.map((d, i) => ({
    x: PAD + (i * (W - PAD * 2)) / Math.max(data.length - 1, 1),
    y: H - PAD - (d.value / max) * (H - PAD * 2),
    ...d,
  }));

  const line = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const curve = line(pts);
  const area = `${curve} L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" key={data.map((d) => d.value).join('-')}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5aa662" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#5aa662" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2c6e37" />
            <stop offset="100%" stopColor="#c9a13a" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke="rgba(47,53,66,0.08)" strokeDasharray="4 6" />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={curve} fill="none" stroke="url(#lineStroke)" strokeWidth="3" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={hover === i ? 7 : 5} fill="#ffffff" stroke="#2c6e37" strokeWidth="2.5" className="transition-all duration-200" />
            <text x={p.x} y={H - 6} textAnchor="middle" fill="rgba(47,53,66,0.55)" fontSize="10">
              {p.label.length > 22 ? `${p.label.slice(0, 20)}…` : p.label}
            </text>
            {hover === i && (
              <g>
                <rect x={Math.min(Math.max(p.x - 70, 4), W - 144)} y={p.y - 44} width="140" height="32" rx="8" fill="#2f3542" />
                <text x={Math.min(Math.max(p.x - 70, 4), W - 144) + 70} y={p.y - 23} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                  {p.value} ответов
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; pct: number; color: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative h-52 w-52">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="#eceef2" strokeWidth="20" />
          {segments.map((s, i) => (
            <circle
              key={s.label}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? 26 : 20}
              strokeDasharray={`${(s.pct / 100) * C} ${C}`}
              strokeDashoffset={-((segments.slice(0, i).reduce((a, x) => a + x.pct, 0) / 100) * C)}
              strokeLinecap="butt"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer transition-all duration-300"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-white">
          {hover !== null && segments[hover] ? (
            <div className="animate-fade-in px-3 text-center">
              <span className="text-2xl font-bold text-pine-700">{segments[hover].pct.toFixed(0)}%</span>
              <p className="mt-0.5 text-[9px] leading-tight text-ink-500">{segments[hover].label}</p>
            </div>
          ) : (
            <>
              <span className="text-2xl font-bold text-ink-900">{segments.reduce((a, s) => a + s.value, 0)}</span>
              <span className="text-[10px] text-ink-400">ответов</span>
            </>
          )}
        </div>
      </div>
      <ul className="w-full space-y-2">
        {segments.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex cursor-default items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${hover === i ? 'bg-ink-100' : ''}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-ink-700">{s.label}</span>
            <span className="font-bold text-pine-700">{s.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiagnosticsPage() {
  const [surveyKey, setSurveyKey] = useState(SURVEYS[0].key);
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('survey_metrics')
        .select('survey_key, option_label, option_value, sort_order');
      if (err) {
        setError('Не удалось загрузить данные диагностики. Попробуйте обновить страницу.');
      } else if (data) {
        const grouped: Record<string, Metric[]> = {};
        for (const row of data as (Metric & { survey_key: string })[]) {
          (grouped[row.survey_key] ||= []).push({
            option_label: row.option_label,
            option_value: row.option_value,
            sort_order: row.sort_order,
          });
        }
        for (const key of Object.keys(grouped)) {
          grouped[key].sort((a, b) => a.sort_order - b.sort_order);
        }
        setMetrics(grouped);
      }
      setLoading(false);
    })();
  }, []);

  const survey = SURVEYS.find((s) => s.key === surveyKey)!;
  const data = metrics[surveyKey] || [];
  const total = useMemo(() => data.reduce((s, d) => s + d.option_value, 0), [data]);

  const downloadReport = () => {
    const lines = [
      `ОТЧЁТ ПО ДИАГНОСТИКЕ: ${survey.title}`,
      `Количество участников: ${survey.respondents}`,
      '',
      'Результаты (обезличенные, в агрегированном виде):',
      ...data.map((d, i) => `${i + 1}. ${d.option_label}: ${d.option_value} (${total ? Math.round((d.option_value / total) * 100) : 0}%)`),
      '',
      `Вывод: ${survey.insight}`,
      `Рекомендация: ${survey.recommendation}`,
    ];
    printAsPdf(`Отчёт по диагностике: ${survey.title}`, lines.join('\n'));
  };

  const segments = data.map((d, i) => ({
    label: d.option_label,
    value: d.option_value,
    pct: total ? (d.option_value / total) * 100 : 0,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Диагностика класса"
        subtitle="Аналитика классных диагностических опросов. Все данные представлены исключительно в обезличенном агрегированном виде — без указания сведений об участниках."
        mentorTip="Смотрите не только на самый большой показатель. Важнее заметить ответы, которые сигнализируют о трудности, и выбрать один небольшой шаг поддержки."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {SURVEYS.map((s, i) => {
          const isActive = surveyKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSurveyKey(s.key)}
              className={`animate-fade-up delay-${i + 1} rounded-2xl p-6 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-pine-600 text-white shadow-lift'
                  : 'border border-ink-200/80 bg-white text-ink-700 shadow-card hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-lift'
              }`}
            >
              <Medal tone={isActive ? 'gold' : 'pine'}>
                <BarChart3 size={20} />
              </Medal>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-pine-100/80' : 'text-ink-400'}`}>{s.subtitle}</p>
              <p className={`mt-3 text-xs font-semibold ${isActive ? 'text-gold-200' : 'text-pine-600'}`}>
                {s.respondents} участников
              </p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <Info className="mx-auto text-gold-600" size={28} />
          <p className="mt-3 text-ink-700">{error}</p>
        </Card>
      ) : (
        <div key={surveyKey} className="animate-fade-in space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink-900">Распределение ответов</h3>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-pine-300 hover:bg-pine-50"
                >
                  <Download size={14} /> Сохранить в PDF
                </button>
              </div>
              <div className="mt-6">
                <AreaChart data={data.map((d) => ({ label: d.option_label, value: d.option_value }))} />
              </div>
            </Card>

            <Card className="p-7">
              <h3 className="font-bold text-ink-900">Структура ответов</h3>
              <div className="mt-6">
                <DonutChart segments={segments} />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-pine-500 p-7">
              <h4 className="flex items-center gap-2 font-bold text-ink-900">
                <BarChart3 size={18} className="text-pine-600" /> Педагогический вывод
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{survey.insight}</p>
            </Card>
            <Card className="border-l-4 border-l-gold-400 p-7">
              <h4 className="flex items-center gap-2 font-bold text-ink-900">
                <Lightbulb size={18} className="text-gold-600" /> Рекомендация классному руководителю
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{survey.recommendation}</p>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-pine-200 bg-pine-50 px-6 py-4 text-sm text-pine-800">
        <ShieldCheck size={18} className="shrink-0 text-pine-600" />
        Данные обезличены: результаты представлены в агрегированном виде в соответствии с Законом Республики Беларусь «О защите персональных данных».
      </div>
    </div>
  );
}
