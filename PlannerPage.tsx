import { useState } from 'react';
import { Sparkles, ChevronDown, Download, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { SectionTitle, Card, Pill, Medal, Button } from '@/components/ui';
import { SCENARIO_TOPICS } from '@/data/content';
import { supabase } from '@/lib/supabase';
import { printAsPdf } from '@/lib/docgen';
import type { GeneratedScenario, ScenarioStep } from '@/data/content';

const GRADES = ['I–IV классы', 'V–VII классы', 'VIII–IX классы', 'X–XI классы'];

export function downloadScenario(sc: GeneratedScenario) {
  const lines = [
    `СЦЕНАРИЙ ЗАНЯТИЯ ШАГ`,
    `Тема: ${sc.topicTitle}`,
    `Аудитория: ${sc.gradeLabel}`,
    '',
    ...sc.steps.flatMap((s, i) => [
      `${i + 1}. ${s.title} (${s.duration})`,
      ...s.content.map((c) => `   • ${c}`),
      '',
    ]),
    'Подготовлено в приложении «Настаўнік PRO» с применением технологий ИИ',
  ];
  printAsPdf(`Сценарий ШАГ: ${sc.topicTitle}`, lines.join('\n'));
}

const STAGES = [
  'Анализирую тему и возрастную группу…',
  'Отбираю методики активного обучения…',
  'Формирую блок «Мы узнаем»…',
  'Проектирую блок «Мы размышляем»…',
  'Завершаю блок «Мы действуем»…',
];

async function generateScenarioAI(topic: string, grade: string, description: string): Promise<ScenarioStep[]> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'scenario',
      prompt: { topic, grade, description },
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.steps || !Array.isArray(data.steps)) throw new Error('PARSE_ERROR');
  return data.steps as ScenarioStep[];
}

export default function PlannerPage({
  classProfile,
  onClassProfileChange,
}: {
  classProfile: { grade: string; letter: string; year: string } | null;
  onClassProfileChange: (p: { grade: string; letter: string; year: string } | null) => void;
}) {
  const [topicKey, setTopicKey] = useState(SCENARIO_TOPICS[0].key);
  const [gradeLabel, setGradeLabel] = useState(GRADES[1]);
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle');
  const [genStep, setGenStep] = useState(0);
  const [scenario, setScenario] = useState<GeneratedScenario | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [openSteps, setOpenSteps] = useState<number[]>([0, 1, 2]);

  const topic = SCENARIO_TOPICS.find((t) => t.key === topicKey)!;

  const setProfile = (grade: string, letter: string, year: string) =>
    onClassProfileChange({ grade, letter, year });

  const generate = async () => {
    setPhase('generating');
    setGenStep(0);
    setScenario(null);
    setSaved(false);
    setSaveError(false);
    setGenError(null);

    const tick = () => {
      setGenStep((prev) => {
        const next = prev + 1;
        return next < STAGES.length ? next : prev;
      });
    };
    const interval = setInterval(tick, 1200);

    try {
      const steps = await generateScenarioAI(topic.title, gradeLabel, topic.description);
      clearInterval(interval);
      setGenStep(STAGES.length);
      setScenario({ topicKey: topic.key, topicTitle: topic.title, gradeLabel, steps });
      setPhase('done');
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setGenError(msg);
      setPhase('idle');
    }
  };

  const saveScenario = async () => {
    if (!scenario) return;
    const { error } = await supabase.from('saved_scenarios').insert({
      topic_key: scenario.topicKey,
      topic_title: scenario.topicTitle,
      grade_label: scenario.gradeLabel,
      content: scenario,
    });
    if (!error) {
      setSaved(true);
    } else {
      setSaveError(true);
    }
  };

  const toggleStep = (i: number) =>
    setOpenSteps((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const selectCls =
    'rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100';

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Планировщик ШАГ"
        subtitle="Конструктор занятий шестого школьного дня: выберите тему и возрастную группу — ИИ генерирует методически выверенный сценарий по структуре «Мы узнаем — Мы размышляем — Мы действуем»."
        mentorTip="Выбирайте тему от реальной задачи класса, а не только от календарной даты. Тогда блок «Мы действуем» получится особенно полезным."
      />

      <Card className="animate-fade-up p-6">
        <h3 className="font-bold text-ink-900">Профиль класса</h3>
        <p className="mt-1 text-sm text-ink-500">
          Хранится только на этом устройстве. Персональные данные не используются.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={classProfile?.grade || '7'}
            onChange={(e) => setProfile(e.target.value, classProfile?.letter || 'А', classProfile?.year || '2026')}
            className={selectCls}
          >
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={String(g)}>{g} класс</option>
            ))}
          </select>
          <select
            value={classProfile?.letter || 'А'}
            onChange={(e) => setProfile(classProfile?.grade || '7', e.target.value, classProfile?.year || '2026')}
            className={selectCls}
          >
            {['А', 'Б', 'В', 'Г'].map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            value={classProfile?.year || '2026'}
            onChange={(e) => setProfile(classProfile?.grade || '7', classProfile?.letter || 'А', e.target.value)}
            className={selectCls}
          >
            {['2025', '2026', '2027'].map((y) => (
              <option key={y} value={y}>{y}/{Number(y) + 1}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up delay-1 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-pine-600" size={20} />
            <h3 className="font-bold text-ink-900">Конструктор занятия</h3>
          </div>
          <label className="mt-5 block text-sm font-semibold text-ink-700">Тема занятия</label>
          <div className="relative mt-2">
            <select
              value={topicKey}
              onChange={(e) => { setTopicKey(e.target.value); setPhase('idle'); setScenario(null); setGenError(null); }}
              className="w-full appearance-none rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            >
              {SCENARIO_TOPICS.map((t) => (
                <option key={t.key} value={t.key}>{t.title}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink-700">Возрастная группа</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGradeLabel(g)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  gradeLabel === g
                    ? 'bg-pine-600 text-white shadow-sm'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-pine-50 p-4 text-sm leading-relaxed text-ink-600">
            <Pill>{topic.audience}</Pill>
            <p className="mt-2">{topic.description}</p>
          </div>

          {genError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold-200 bg-gold-100/50 px-4 py-3 text-sm text-gold-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Не удалось сгенерировать сценарий</p>
                <p className="mt-0.5 text-xs text-gold-700">ИИ временно недоступен. Попробуйте ещё раз через минуту.</p>
              </div>
            </div>
          )}

          <Button onClick={generate} disabled={phase === 'generating'} className="mt-5 w-full">
            {phase === 'generating' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> ИИ генерирует сценарий…
              </>
            ) : (
              <>
                <Sparkles size={18} /> Сгенерировать сценарий (ИИ)
              </>
            )}
          </Button>
        </Card>

        <Card className="animate-fade-up delay-2 p-6">
          {phase === 'idle' && !genError && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <div className="rounded-full bg-pine-50 p-5">
                <Sparkles size={32} className="text-pine-500" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-ink-400">
                Выберите тему и нажмите «Сгенерировать сценарий» — ИИ построит уникальный план занятия по структуре ШАГ.
              </p>
            </div>
          )}

          {phase === 'generating' && (
            <div className="flex h-full min-h-[280px] flex-col justify-center space-y-3">
              {STAGES.map((s, i) => (
                <div key={s} className={`flex items-center gap-3 text-sm transition-opacity ${i <= genStep ? 'opacity-100' : 'opacity-30'}`}>
                  {i < genStep ? (
                    <CheckCircle2 size={18} className="text-pine-600" />
                  ) : i === genStep ? (
                    <Loader2 size={18} className="animate-spin text-pine-500" />
                  ) : (
                    <span className="h-[18px] w-[18px] rounded-full border border-ink-200" />
                  )}
                  <span className="text-ink-700">{s}</span>
                </div>
              ))}
            </div>
          )}

          {phase === 'done' && scenario && (
            <div className="animate-fade-in">
              <Pill>{scenario.gradeLabel}</Pill>
              <h3 className="mt-2 font-bold text-ink-900">{scenario.topicTitle}</h3>
              <p className="mt-1 text-xs text-ink-400">Сценарий сгенерирован ИИ. При необходимости сохраните его в архив.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={saveScenario} disabled={saved} variant="ghost">
                  {saved ? <><CheckCircle2 size={16} /> Сохранено в архив</> : <><Save size={16} /> Сохранить в архив</>}
                </Button>
                <Button onClick={() => downloadScenario(scenario)} variant="ghost">
                  <Download size={16} /> Сохранить в PDF
                </Button>
              </div>
              {saveError && (
                <p className="mt-3 text-xs text-gold-700">Не удалось сохранить в архив, но сценарий можно скачать.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {scenario && (
        <div className="space-y-4">
          {scenario.steps.map((step, i) => (
            <Card key={step.title} className="animate-fade-up overflow-hidden">
              <button
                onClick={() => toggleStep(i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-ink-50"
              >
                <div className="flex items-center gap-4">
                  <Medal>{i + 1}</Medal>
                  <div>
                    <h4 className="font-bold text-ink-900">{step.title}</h4>
                    <p className="text-xs text-ink-400">{step.duration}</p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-ink-400 transition-transform duration-300 ${openSteps.includes(i) ? 'rotate-180' : ''}`}
                />
              </button>
              {openSteps.includes(i) && (
                <div className="animate-fade-in border-t border-ink-100 px-6 py-5">
                  <ul className="space-y-3">
                    {step.content.map((c, j) => (
                      <li key={j} className="flex gap-3 text-sm leading-relaxed text-ink-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
