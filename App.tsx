import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Menu, X, LogOut } from 'lucide-react';
import { Sidebar, HUBS, HUB_TOOLS } from '@/components/Sidebar';
import type { TabKey, HubKey } from '@/components/Sidebar';
import AuthScreen, { getStoredCode, clearStoredCode } from '@/components/AuthScreen';
import HomePage from '@/pages/HomePage';
import HubPage from '@/pages/HubPage';
import RosterPage from '@/pages/RosterPage';
import MoodPage from '@/pages/MoodPage';
import LegalPage from '@/pages/LegalPage';
import AboutPage from '@/pages/AboutPage';
import EventsBankPage from '@/pages/EventsBankPage';
import PlannerPage from '@/pages/PlannerPage';
import YearPlanPage from '@/pages/YearPlanPage';
import JournalPage from '@/pages/JournalPage';
import DiagnosticsPage from '@/pages/DiagnosticsPage';
import ParentsPage from '@/pages/ParentsPage';
import PatriotPage from '@/pages/PatriotPage';
import RookiePage from '@/pages/RookiePage';
import MasterPage from '@/pages/MasterPage';
import AutomationPage from '@/pages/AutomationPage';
import QuizPage from '@/pages/QuizPage';
import VisualsPage from '@/pages/VisualsPage';
import ToursPage from '@/pages/ToursPage';
import MonitorPage from '@/pages/MonitorPage';
import CoursePage from '@/pages/CoursePage';
import StudentLinkPage from '@/pages/StudentLinkPage';
import CyclegramPage from '@/pages/CyclegramPage';

const CLASS_PROFILE_STORAGE_KEY = 'pulse-klassa-class-profile';
type ClassProfile = { grade: string; letter: string; year: string } | null;

function loadClassProfile(): ClassProfile {
  try {
    const raw = localStorage.getItem(CLASS_PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClassProfile) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');
  const [classProfile, setClassProfile] = useState<ClassProfile>(loadClassProfile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStudentLink] = useState(() => window.location.hash.startsWith('#/s/'));
  const [teacherCode, setTeacherCode] = useState<string | null>(getStoredCode());
  const [authLoading, setAuthLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const signOut = () => {
    clearStoredCode();
    setTeacherCode(null);
    setTab('home');
  };

  useEffect(() => {
    if (classProfile) localStorage.setItem(CLASS_PROFILE_STORAGE_KEY, JSON.stringify(classProfile));
  }, [classProfile]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const navigate = (t: TabKey) => { setMenuOpen(false); setTab(t); };

  const TOOL_TO_HUB: Partial<Record<TabKey, HubKey>> = {};
  for (const h of HUBS) {
    if (h.key !== 'home' && h.key !== 'about') {
      for (const t of HUB_TOOLS[h.key].tools) TOOL_TO_HUB[t.key] = h.key;
    }
  }
  const activeHub: HubKey = TOOL_TO_HUB[tab] ?? (tab === 'about' ? 'about' : tab === 'home' ? 'home' : 'class');

  return (
    <div className="min-h-screen bg-ink-50">
      {isStudentLink && <StudentLinkPage />}
      {!isStudentLink && (
      <>
      {authLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-pine-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pine-700 border-t-gold-300" />
        </div>
      ) : !teacherCode ? (
        <AuthScreen onSuccess={(code) => setTeacherCode(code)} />
      ) : (
      <>
      <header className="sticky top-0 z-40 border-b border-pine-900/20 bg-pine-950 text-white shadow-[0_4px_20px_-16px_rgba(15,39,22,0.8)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-pine-400/30 bg-pine-900/60 text-pine-100 transition hover:bg-pine-900 lg:hidden"
              aria-label="Открыть меню"
            >
              <Menu size={18} />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-300 text-pine-950 shadow-sm"><Activity size={17} strokeWidth={2.4} /></span>
            <h1 className="font-display text-base font-extrabold tracking-[-0.03em] sm:text-lg">Настаўнік <span className="text-gold-300">PRO</span></h1>
            <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-pine-400/30 bg-pine-900/50 px-2.5 py-1 text-[10px] font-semibold text-pine-100/80 sm:inline-flex">Кабинет: {teacherCode}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-1.5 text-[11px] text-pine-100/75 md:flex"><CalendarDays size={13} /> {now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}, {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-full border border-pine-400/30 bg-pine-900/50 px-2.5 py-1.5 text-[11px] font-semibold text-pine-100 transition hover:bg-pine-800" title="Выйти">
              <LogOut size={13} /> <span className="hidden sm:inline">Выход</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-3 py-4 lg:flex-row lg:px-6 lg:py-5">
        <aside className="hidden shrink-0 lg:sticky lg:top-[68px] lg:block lg:h-[calc(100vh-80px)] lg:w-[220px]"><div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-[#fbfaf6] shadow-card h-full"><Sidebar active={activeHub} onChange={navigate} /></div></aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-16">
          {tab === 'home' && <HomePage classProfile={classProfile} onNavigate={navigate} />}
          {tab === 'class' && <HubPage hub="class" onNavigate={navigate} />}
          {tab === 'lessons' && <HubPage hub="lessons" onNavigate={navigate} />}
          {tab === 'people' && <HubPage hub="people" onNavigate={navigate} />}
          {tab === 'docs' && <HubPage hub="docs" onNavigate={navigate} />}
          {tab === 'roster' && <RosterPage />}
          {tab === 'mood' && <MoodPage />}
          {tab === 'planner' && <PlannerPage classProfile={classProfile} onClassProfileChange={setClassProfile} />}
          {tab === 'bank' && <EventsBankPage />}
          {tab === 'journal' && <JournalPage />}
          {tab === 'yearplan' && <YearPlanPage />}
          {tab === 'cyclegram' && <CyclegramPage onNavigate={navigate} />}
          {tab === 'diagnostics' && <DiagnosticsPage />}
          {tab === 'parents' && <ParentsPage />}
          {tab === 'patriot' && <PatriotPage />}
          {tab === 'rookie' && <RookiePage classProfile={classProfile} />}
          {tab === 'master' && <MasterPage />}
          {tab === 'automation' && <AutomationPage classProfile={classProfile} />}
          {tab === 'quiz' && <QuizPage />}
          {tab === 'visuals' && <VisualsPage />}
          {tab === 'tours' && <ToursPage />}
          {tab === 'monitor' && <MonitorPage />}
          {tab === 'course' && <CoursePage />}
          {tab === 'legal' && <LegalPage />}
          {tab === 'about' && <AboutPage onNavigate={navigate} />}
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-pine-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[72vw] max-w-[280px] flex-col bg-[#fbfaf6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900"><Activity size={16} className="text-pine-700" /> Настаўнік PRO</p>
              <button onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-ink-400 transition hover:bg-ink-100" aria-label="Закрыть меню"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2"><Sidebar active={activeHub} onChange={navigate} /></div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {HUBS.slice(0, 4).map((hub) => {
            const Icon = hub.icon;
            const isActive = hub.key === activeHub;
            return (
              <button key={hub.key} onClick={() => navigate(hub.key)} className={`flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition ${isActive ? 'text-pine-800' : 'text-ink-400'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="max-w-full truncate text-[9px] font-bold">{hub.label}</span>
              </button>
            );
          })}
          <button onClick={() => setMenuOpen(true)} className="flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-ink-400 transition">
            <Menu size={18} />
            <span className="text-[9px] font-bold">Ещё</span>
          </button>
        </div>
      </nav>

      <footer className="border-t border-ink-200/80 bg-white py-7"><div className="mx-auto max-w-3xl px-6"><p className="text-center text-xs leading-relaxed text-ink-400">«Настаўнік PRO» · Рабочее место педагога Беларуси. Приложение не собирает персональные данные учащихся в соответствии с Законом Республики Беларусь «О защите персональных данных».</p></div></footer>
      </>) }
      </>
      )}
    </div>
  );
}
