import { useState } from 'react';
import { FileText, ShieldCheck, Sparkles } from 'lucide-react';
import type { TabKey } from '@/components/Sidebar';

type ClassProfile = { grade: string; letter: string; year: string } | null;

type DashboardCard = {
  title: string;
  image: string;
  tab: TabKey;
};

const GRADE_OPTIONS = ['1–4', '5–7', '8–9', '10–11 классы'];

const DASHBOARD_CARDS: DashboardCard[] = [
  { title: 'Планирование', image: '/cabinet-planning.jpg', tab: 'planner' },
  { title: 'Конспекты', image: '/cabinet-notes.jpg', tab: 'bank' },
  { title: 'Мероприятия', image: '/cabinet-events.jpg', tab: 'lessons' },
  { title: 'Профилактика', image: '/cabinet-safety.jpg', tab: 'patriot' },
  { title: 'Родителям', image: '/cabinet-parents.jpg', tab: 'parents' },
  { title: 'Аналитика', image: '/cabinet-analytics.jpg', tab: 'diagnostics' },
];

export default function HomePage({ classProfile, onNavigate }: { classProfile: ClassProfile; onNavigate: (tab: TabKey) => void }) {
  const [selectedGrade, setSelectedGrade] = useState(classProfile?.grade || '1–4');
  const [message, setMessage] = useState<string | null>(null);

  const handlePdf = (title: string) => {
    setMessage(`Материалы «${title}» подготовлены для печати. В окне печати можно выбрать «Сохранить как PDF».`);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#f2f7ff] px-1 py-1 sm:px-3 sm:py-3">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-7">
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#101c35] sm:text-[32px]">Добро пожаловать в НастаўнікPRO!</h1>
            <p className="mt-1 text-sm text-[#66738b]">Ваше рабочее пространство для классного руководителя</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#d9f8e8] px-4 py-2 text-xs font-bold text-[#258354] shadow-[0_8px_20px_rgba(70,180,120,0.12)]">
            <ShieldCheck size={17} strokeWidth={2.2} />
            Анонимный доступ по коду
          </div>
        </div>

        <div className="mb-7 rounded-full bg-white p-1.5 shadow-[0_8px_24px_rgba(31,66,120,0.1)]">
          <div className="grid grid-cols-4 gap-1">
            {GRADE_OPTIONS.map((grade: string) => {
              const active = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`rounded-full px-2 py-3 text-xs font-extrabold transition-all duration-200 sm:text-base ${active ? 'bg-[#2f70e8] text-white shadow-[0_6px_14px_rgba(47,112,232,0.28)]' : 'text-[#17223a] hover:bg-[#edf4ff]'}`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
        </div>

        {message && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-[#b9d2ff] bg-white px-4 py-3 text-sm text-[#31527f] shadow-sm">
            <p>{message}</p>
            <button onClick={() => setMessage(null)} className="shrink-0 font-bold text-[#2f70e8] hover:text-[#1457c5]">Закрыть</button>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_CARDS.map((card: DashboardCard, index: number) => (
            <article key={card.title} className="group flex min-h-[294px] flex-col rounded-[24px] border border-[#e5edf8] bg-white p-5 shadow-[0_8px_24px_rgba(31,66,120,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(31,66,120,0.14)]">
              <h2 className="px-1 text-xl font-extrabold tracking-[-0.03em] text-[#121d35]">{card.title}</h2>
              <div className="flex flex-1 items-center justify-center py-2">
                <img src={card.image} alt="" className="h-[142px] w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-3 px-1">
                <button onClick={() => onNavigate(card.tab)} className="flex-1 rounded-full bg-[#2f70e8] px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_12px_rgba(47,112,232,0.22)] transition hover:bg-[#145dcc] active:scale-[0.98]">Открыть</button>
                <button onClick={() => handlePdf(card.title)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#b8c9dd] bg-white px-4 py-2.5 text-sm font-bold text-[#3971b5] transition hover:border-[#2f70e8] hover:bg-[#f3f8ff] active:scale-[0.98]"><FileText size={16} /> PDF</button>
              </div>
              {index === 0 && <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#8a97aa]"><Sparkles size={12} /> Материалы для {selectedGrade} классов</div>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
