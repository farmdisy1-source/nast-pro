import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Sparkles, Users, Info, HeartPulse, Gauge, BarChart3, Box, Gamepad2, Presentation, Footprints, Landmark, Podcast, Compass, MessagesSquare, NotebookPen, Wand2, BookMarked, CalendarRange, CalendarClock, CalendarDays, Star, Download, Settings } from 'lucide-react';

export type TabKey = 'home' | 'roster' | 'mood' | 'planner' | 'bank' | 'journal' | 'diagnostics' | 'parents' | 'patriot' | 'legal' | 'about' | 'rookie' | 'master' | 'automation' | 'quiz' | 'visuals' | 'tours' | 'monitor' | 'course' | 'yearplan' | 'cyclegram' | 'class' | 'lessons' | 'people' | 'docs';
export type HubKey = 'home' | 'class' | 'lessons' | 'people' | 'docs' | 'about';

export const HUBS: { key: HubKey; label: string; icon: LucideIcon; hint: string }[] = [
  { key: 'home', label: 'Главная', icon: LayoutDashboard, hint: 'Ваш рабочий день' },
  { key: 'class', label: 'Мой класс', icon: ClipboardList, hint: 'Состав, настроение, роли' },
  { key: 'docs', label: 'Планирование', icon: CalendarRange, hint: 'План, календарь, журнал' },
  { key: 'lessons', label: 'Мероприятия', icon: Sparkles, hint: 'Сценарии, квизы, экскурсии' },
  { key: 'people', label: 'Сообщество', icon: Users, hint: 'Родители и поддержка' },
  { key: 'about', label: 'Помощь', icon: Info, hint: 'О платформе и подсказки' },
];

type Tool = { key: TabKey; label: string; desc: string; icon: LucideIcon };

export const HUB_TOOLS: Record<Exclude<HubKey, 'home' | 'about'>, { intro: string; tools: Tool[] }> = {
  class: {
    intro: 'Всё о вашем классе: состав числом, анонимное настроение и мгновенные опросы.',
    tools: [
      { key: 'roster', label: 'Инструменты класса', desc: 'Состав числом, роли и поручения — без персональных данных', icon: ClipboardList },
      { key: 'mood', label: 'Настроение класса', desc: 'Анонимный опрос в один клик и живая аналитика', icon: HeartPulse },
      { key: 'monitor', label: 'Экспресс-мониторинг', desc: 'Мгновенный опрос класса или родителей', icon: Gauge },
      { key: 'diagnostics', label: 'Диагностика', desc: 'Аналитика опросов и рекомендации', icon: BarChart3 },
    ],
  },
  lessons: {
    intro: 'Готовые материалы для шестого школьного дня и классных часов.',
    tools: [
      { key: 'planner', label: 'Планировщик ШАГ', desc: 'Конструктор занятий шестого школьного дня', icon: Sparkles },
      { key: 'bank', label: 'Методическая копилка', desc: 'Апробированные мероприятия с ходом по минутам', icon: Box },
      { key: 'quiz', label: 'Игры и квизы', desc: 'Квизы для класса', icon: Gamepad2 },
      { key: 'visuals', label: 'Таймлайны и плакаты', desc: 'Для интерактивной доски', icon: Presentation },
      { key: 'tours', label: 'Виртуальные экскурсии', desc: 'Туры по Беларуси', icon: Footprints },
      { key: 'patriot', label: 'Патриотический хаб', desc: 'Маршрут «Дорогами памяти»', icon: Landmark },
    ],
  },
  people: {
    intro: 'Работа с родителями и собственное профессиональное развитие.',
    tools: [
      { key: 'parents', label: 'Родительский университет', desc: 'Готовые памятки для семей', icon: Users },
      { key: 'course', label: 'Курс для родителей', desc: 'Подкаст «Психология подростка»', icon: Podcast },
      { key: 'rookie', label: 'Молодой специалист', desc: 'Трек первого года в классном руководстве', icon: Compass },
      { key: 'master', label: 'Трек мастера', desc: 'Кейсы и обмен опытом', icon: MessagesSquare },
    ],
  },
  docs: {
    intro: 'Документы и отчётность: от плана воспитательной работы до нормативной базы.',
    tools: [
      { key: 'yearplan', label: 'Годовой план воспитательной работы', desc: 'Конструктор главного документа по направлениям и месяцам', icon: CalendarRange },
      { key: 'cyclegram', label: 'Календарь и циклограмма', desc: 'Недели, обязательные темы и безопасные форматы участия', icon: CalendarClock },
      { key: 'journal', label: 'Журнал собраний', desc: 'Повестка, решения и дата каждого собрания', icon: NotebookPen },
      { key: 'automation', label: 'Центр автоматизации', desc: 'Документы в один клик', icon: Wand2 },
      { key: 'legal', label: 'Нормативная база', desc: 'Документы и письма с выжимками', icon: BookMarked },
    ],
  },
};

const HUB_COLORS: Record<HubKey, string> = {
  home: 'bg-gold-100 text-gold-700',
  class: 'bg-pine-50 text-pine-700',
  docs: 'bg-ink-100 text-ink-600',
  lessons: 'bg-gold-100/60 text-gold-700',
  people: 'bg-pine-50 text-pine-600',
  about: 'bg-ink-100 text-ink-500',
};

const QUICK_LINKS: { label: string; key: TabKey; icon: LucideIcon }[] = [
  { label: 'Главная', key: 'home', icon: LayoutDashboard },
  { label: 'Планирование', key: 'planner', icon: CalendarRange },
  { label: 'Конспекты', key: 'bank', icon: NotebookPen },
  { label: 'Мероприятия', key: 'lessons', icon: CalendarDays },
  { label: 'Профилактика', key: 'patriot', icon: HeartPulse },
  { label: 'Родителям', key: 'parents', icon: Users },
  { label: 'Аналитика', key: 'diagnostics', icon: BarChart3 },
];

export function Sidebar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="flex h-full flex-col bg-white px-3 py-5">
      <button onClick={() => onChange('home')} className="mb-7 flex items-center gap-3 px-2 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#2f70e8] shadow-sm"><LayoutDashboard size={23} strokeWidth={2.3} /></span>
        <span className="text-[17px] font-extrabold tracking-[-0.04em] text-[#17223a]">Настаўнік<span className="text-[#2f70e8]">PRO</span></span>
      </button>

      <div className="space-y-1">
        {QUICK_LINKS.map(({ label, key, icon: Icon }) => {
          const isActive = key === active || (key === 'home' && active === 'home');
          return (
            <button key={key} onClick={() => onChange(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-[#2f70e8] text-white shadow-[0_7px_14px_rgba(47,112,232,0.2)]' : 'text-[#66738b] hover:bg-[#f0f5fc] hover:text-[#245ab1]'}`}>
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="my-6 h-px bg-[#edf0f4]" />
      <div className="mt-auto space-y-1">
        <button onClick={() => onChange('home')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-[#66738b] transition hover:bg-[#f0f5fc] hover:text-[#245ab1]"><Star size={19} /> Избранное</button>
        <button onClick={() => onChange('automation')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-[#66738b] transition hover:bg-[#f0f5fc] hover:text-[#245ab1]"><Download size={19} /> Загрузки</button>
        <button onClick={() => onChange('about')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-[#66738b] transition hover:bg-[#f0f5fc] hover:text-[#245ab1]"><Settings size={19} /> Настройки</button>
      </div>
    </nav>
  );
}

export const NAV_GROUPS = HUBS.map((h) => ({ label: h.label, key: h.key, icon: h.icon, hint: h.hint }));
