import { useState } from 'react';
import { BookMarked, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionTitle, Card, Medal } from '@/components/ui';

type Doc = {
  title: string;
  kind: string;
  year: string;
  summary: string;
  points: string[];
  url: string;
};

const DOCS: Doc[] = [
  {
    title: 'Инструктивно-методическое письмо «О деятельности классного руководителя»',
    kind: 'Инструктивно-методическое письмо',
    year: 'Министерство образования Республики Беларусь',
    summary:
      'Базовый документ, определяющий функции, содержание и методику работы классного руководителя: планирование воспитательной работы, шестой школьный день, взаимодействие с семьями.',
    points: [
      'Содержание воспитательной работы на протяжении учебного года и в шестой школьный день.',
      'Требования к плану воспитательной работы класса и его анализу.',
      'Взаимодействие с законными представителями и педагогом-психологом.',
    ],
    url: 'https://adu.by/ru/organizatsiya-obrazovatelnogo-protsessa/instruktivno-metodicheskie-pisma',
  },
  {
    title: 'Кодекс Республики Беларусь об образовании',
    kind: 'Кодекс',
    year: 'Глава о воспитании обучающихся',
    summary:
      'Правовая основа воспитательной работы: права и обязанности обучающихся и законных представителей, структура воспитательной деятельности учреждений образования.',
    points: [
      'Основные термины: воспитание, обучающийся, законный представитель.',
      'Права и обязанности участников образовательного процесса.',
      'Идеологическое, патриотическое и нравственное направления воспитания.',
    ],
    url: 'https://prd.by/ru/education/kodeks-respubliki-belarus-ob-obrazovanii',
  },
  {
    title: 'Положение об идеологическом и патриотическом воспитании',
    kind: 'Положение',
    year: 'Министерство образования',
    summary:
      'Определяет единые подходы к организации идеологической и патриотической работы: информационные часы, проект «ШАГ», взаимодействие с общественными объединениями.',
    points: [
      'Структура информационного часа и работа с информационными материалами.',
      'Организация мероприятий гражданско-патриотической направленности.',
      'Роль первичных молодёжных организаций в жизни класса.',
    ],
    url: 'https://edu.gov.by',
  },
  {
    title: 'Республиканский проект «ШАГ» — шестой школьный день',
    kind: 'Проект',
    year: 'Министерство образования',
    summary:
      'Методические рекомендации по организации шестого школьного дня: моделирование занятий, тематические модули, участие учащихся в планировании.',
    points: [
      'Принципы построения занятий шестого школьного дня.',
      'Тематические модули: краеведение, здоровье, профориентация, безопасность.',
      'Формы самоуправления и вовлечения учащихся в планирование.',
    ],
    url: 'https://edu.gov.by',
  },
  {
    title: 'Закон Республики Беларусь «О защите персональных данных»',
    kind: 'Закон',
    year: 'Опора на закон в работе платформы',
    summary:
      'Платформа «Настаўнік PRO» не собирает персональные данные учащихся: опрос настроения анонимен, диагностика показывается в агрегированном виде, состав класса — только числом.',
    points: [
      'Опрос настроения класса не собирает имён и не связывает ответ с учеником.',
      'Диагностические результаты отображаются только в агрегированном виде.',
      'Дни рождения используются исключительно для планирования поздравлений класса.',
    ],
    url: 'https://www.pravo.by',
  },
];

function DocCard({ doc, index }: { doc: Doc; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className={`animate-fade-up delay-${Math.min(index + 1, 6)} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-ink-50/60">
        <Medal tone={index % 2 === 0 ? 'pine' : 'gold'}>
          <FileText size={20} />
        </Medal>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-pine-600">{doc.kind}</p>
          <h3 className="mt-1 font-bold leading-snug text-ink-900">{doc.title}</h3>
          <p className="mt-1 text-xs text-ink-400">{doc.year}</p>
        </div>
        {open ? <ChevronUp size={20} className="mt-1 shrink-0 text-ink-400" /> : <ChevronDown size={20} className="mt-1 shrink-0 text-ink-400" />}
      </button>
      {open && (
        <div className="animate-fade-in border-t border-ink-100 bg-ink-50/50 px-6 py-5">
          <p className="text-sm leading-relaxed text-ink-600">{doc.summary}</p>
          <ul className="mt-4 space-y-2">
            {doc.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm text-ink-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine-400" />
                {p}
              </li>
            ))}
          </ul>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pine-700 underline-offset-4 hover:underline"
          >
            <BookMarked size={15} /> Перейти к первоисточнику
          </a>
        </div>
      )}
    </Card>
  );
}

export default function LegalPage() {
  return (
    <div className="space-y-8">
      <SectionTitle
        title="Нормативно-правовая база"
        subtitle="Ключевые документы для организации воспитательной работы класса — собранные, структурированные и прокомментированные для быстрого доступа. Откройте документ и сразу увидите, какие из его положений применяются в работе платформы."
        mentorTip="Не читайте документы целиком перед собранием — воспользуйтесь краткой выжимкой. Ссылки ведут на официальные источники, а комментарии показывают, как документ применим именно в вашей классной работе."
      />
      <div className="space-y-4">
        {DOCS.map((d, i) => (
          <DocCard key={d.title} doc={d} index={i} />
        ))}
      </div>
    </div>
  );
}
