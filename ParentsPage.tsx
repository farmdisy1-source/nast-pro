import { useState } from 'react';
import { ChevronDown, Download, GraduationCap } from 'lucide-react';
import { SectionTitle, Card, Medal, Button } from '@/components/ui';
import { PARENT_UNIVERSITY } from '@/data/content';
import { printAsPdf } from '@/lib/docgen';

const TIERS = [
  { key: '1-4', label: '1–4 классы', desc: 'Начальная школа: режим, привычки, первые самостоятельности' },
  { key: '5-9', label: '5–9 классы', desc: 'Подростковый возраст: доверие, границы, профилактика рисков' },
  { key: '10-11', label: '10–11 классы', desc: 'Выпускной класс: самоопределение, экзамены, взросление' },
] as const;

export default function ParentsPage() {
  const [tier, setTier] = useState<(typeof TIERS)[number]['key']>('1-4');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const briefs = PARENT_UNIVERSITY[tier];

  const downloadBrief = (title: string, points: string[]) => {
    const lines = [
      'РОДИТЕЛЬСКИЙ УНИВЕРСИТЕТ — памятка для семьи',
      title,
      '',
      ...points.map((p, i) => `${i + 1}. ${p}`),
      '',
      'Материал подготовлен в приложении «Настаўнік PRO». Персональные данные не обрабатываются.',
    ];
    printAsPdf(`Памятка: ${title}`, lines.join('\n'));
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Родительский университет"
        subtitle="Готовые педагогические брифы для семей: практические памятки, проверенные методические приёмы и конкретные формулировки для диалога с ребёнком. Каждую памятку можно скачать и использовать на родительском собрании."
        mentorTip="Выберите возраст детей, чтобы говорить с родителями на одном языке с их повседневными задачами — без лишней теории."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t, i) => {
          const isActive = tier === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTier(t.key); setOpenIdx(0); }}
              className={`animate-fade-up delay-${i + 1} rounded-2xl p-6 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-pine-600 text-white shadow-lift'
                  : 'border border-ink-200/80 bg-white text-ink-700 shadow-card hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-lift'
              }`}
            >
              <Medal tone={isActive ? 'gold' : 'pine'}>
                <GraduationCap size={22} />
              </Medal>
              <h3 className="mt-4 text-lg font-bold">{t.label}</h3>
              <p className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-pine-100/80' : 'text-ink-400'}`}>{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {briefs.map((b, i) => (
          <Card key={b.title} className={`animate-fade-up delay-${Math.min(i + 1, 6)} overflow-hidden`}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex w-full items-center justify-between px-7 py-6 text-left transition hover:bg-ink-50"
            >
              <div>
                <h4 className="text-lg font-bold text-ink-900">{b.title}</h4>
                <p className="mt-0.5 text-xs text-ink-400">{b.summary}</p>
              </div>
              <ChevronDown
                size={20}
                className={`shrink-0 text-ink-400 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}
              />
            </button>
            {openIdx === i && (
              <div className="animate-fade-in border-t border-ink-100 px-7 py-6">
                <ul className="space-y-4">
                  {b.points.map((p, j) => (
                    <li key={j} className="flex gap-3 text-sm leading-relaxed text-ink-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-50 text-[11px] font-bold text-pine-700">
                        {j + 1}
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => downloadBrief(b.title, b.points)} variant="ghost" className="mt-6">
                  <Download size={16} /> Сохранить в PDF
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
