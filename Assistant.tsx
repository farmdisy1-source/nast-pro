import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Msg = { role: 'user' | 'ai'; text: string };

const QUICK_ASKS = [
  'Как настроение класса?',
  'Что сделать на этой неделе?',
  'Куда записать собрание?',
  'Идея для шестого дня',
];

const GREETING = 'Здравствуйте! Я ваш персональный ИИ-ассистент. Спросите о настроении класса, планировании ШАГ, собраниях или документах — я помогу советом.';

type Facts = {
  classSize: number | null;
  votes7d: number;
  hardPct: number;
  positivePct: number | null;
  meetings: number;
  scenarios: number;
};

async function loadFacts(): Promise<Facts> {
  const [moodRes, profileRes, meetingsRes, scenariosRes] = await Promise.all([
    supabase.from('mood_checkins').select('mood, created_at').order('created_at', { ascending: false }),
    supabase.from('class_profile').select('total_students').eq('id', 1).maybeSingle(),
    supabase.from('meetings').select('id', { count: 'exact', head: true }),
    supabase.from('saved_scenarios').select('id', { count: 'exact', head: true }),
  ]);
  const now = new Date();
  const cut = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const votes = ((moodRes.data || []) as { mood: string; created_at: string }[]).filter((v) => new Date(v.created_at) >= cut);
  const hard = votes.filter((v) => v.mood === 'hard').length;
  const positive = votes.filter((v) => v.mood === 'great' || v.mood === 'good').length;
  return {
    classSize: profileRes.data?.total_students ?? null,
    votes7d: votes.length,
    hardPct: votes.length ? Math.round((hard / votes.length) * 100) : 0,
    positivePct: votes.length ? Math.round((positive / votes.length) * 100) : null,
    meetings: meetingsRes.count ?? 0,
    scenarios: scenariosRes.count ?? 0,
  };
}

const FALLBACK_REPLY = 'Я пока не могу ответить — ИИ временно недоступен. Попробуйте переформулировать вопрос или загляните в разделы платформы через меню слева.';

async function askAI(prompt: string, history: Msg[], facts: Facts | null): Promise<string> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const context = facts ? {
    classSize: facts.classSize,
    positivePct: facts.positivePct,
    hardPct: facts.hardPct,
    meetings: facts.meetings,
    scenarios: facts.scenarios,
  } : null;

  const historyForAI = history.slice(-8).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'chat', prompt, history: historyForAI, context }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.reply) throw new Error('EMPTY_REPLY');
  return data.reply as string;
}

export default function Assistant() {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'ai', text: GREETING }]);
  const [typing, setTyping] = useState(false);
  const [facts, setFacts] = useState<Facts | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadFacts().then(setFacts).catch(() => setFacts(null)); }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing, expanded]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setTyping(true);
    setError(false);
    setExpanded(true);

    try {
      const reply = await askAI(q, msgs, facts);
      setMsgs((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setError(true);
      setMsgs((m) => [...m, { role: 'ai', text: FALLBACK_REPLY }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Input row — always visible in the banner */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void ask(input); } }}
          placeholder="Спросите ИИ-ассистента…"
          className="h-10 flex-1 rounded-xl border border-pine-700/50 bg-pine-900/60 px-3.5 text-[13px] text-white outline-none transition placeholder:text-pine-200/50 focus:border-gold-300/60 focus:bg-pine-900/80"
        />
        <button
          onClick={() => void ask(input)}
          disabled={!input.trim() || typing}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-300 text-pine-950 transition hover:bg-gold-200 disabled:opacity-40"
          aria-label="Отправить вопрос"
        >
          {typing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* Quick-ask chips */}
      {!expanded && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ASKS.map((q) => (
            <button
              key={q}
              onClick={() => void ask(q)}
              disabled={typing}
              className="shrink-0 rounded-full border border-pine-600/40 bg-pine-800/50 px-2.5 py-1 text-[11px] font-semibold text-pine-100/90 transition hover:bg-pine-700/60 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Conversation panel — expands below the banner */}
      {expanded && (
        <div className="animate-fade-up overflow-hidden rounded-xl border border-pine-700/40 bg-pine-950/90">
          <div ref={bodyRef} className="max-h-[320px] space-y-2.5 overflow-y-auto px-3.5 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-gold-300/90 text-pine-950'
                    : 'rounded-bl-md border border-pine-700/50 bg-pine-900/80 text-pine-50'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-pine-700/50 bg-pine-900/80 px-4 py-2.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="dot-talk h-1.5 w-1.5 rounded-full bg-gold-300/70" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-[11px] text-gold-200">
                <AlertCircle size={13} className="shrink-0" /> ИИ временно недоступен — показан запасной ответ
              </div>
            )}
          </div>

          {/* Quick-ask chips inside expanded panel */}
          <div className="flex flex-wrap gap-1.5 border-t border-pine-800/60 px-3.5 py-2">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                onClick={() => void ask(q)}
                disabled={typing}
                className="shrink-0 rounded-full border border-pine-600/40 bg-pine-800/50 px-2.5 py-1 text-[11px] font-semibold text-pine-100/90 transition hover:bg-pine-700/60 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => { setExpanded(false); setMsgs([{ role: 'ai', text: GREETING }]); }}
              className="ml-auto shrink-0 text-[11px] font-bold text-pine-300/60 transition hover:text-pine-100"
            >
              Свернуть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
