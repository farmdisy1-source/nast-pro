import { useState } from 'react';
import { Activity, KeyRound, Loader2, ShieldCheck, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

const STORAGE_KEY = 'nastawnik-teacher-code';

export function getStoredCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type Stage = 'enter' | 'generated';

export default function AuthScreen({ onSuccess }: { onSuccess: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('enter');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const { error: err } = await supabase.from('teacher_codes').insert({ code: candidate }).select('code').single();
      if (!err) {
        setGeneratedCode(candidate);
        setStage('generated');
        setBusy(false);
        return;
      }
      if ((err as { code?: string }).code !== '23505') break;
    }

    setError('Не удалось сгенерировать код. Попробуйте ещё раз.');
    setBusy(false);
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('teacher_codes')
      .select('code')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();

    if (err) {
      setError('Не удалось проверить код. Проверьте подключение.');
      setBusy(false);
      return;
    }

    if (data) {
      const validCode = data.code as string;
      try { localStorage.setItem(STORAGE_KEY, validCode); } catch { /* ignore */ }
      onSuccess(validCode);
    } else {
      setError('Код не найден. Проверьте правильность ввода или сгенерируйте новый.');
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard?.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnterGenerated = () => {
    if (generatedCode) {
      try { localStorage.setItem(STORAGE_KEY, generatedCode); } catch { /* ignore */ }
      onSuccess(generatedCode);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#eaf3f7]">
      <div className="relative w-full max-w-[1440px] aspect-[720/405] overflow-hidden">
        <img
          src="/S8sQxR-BbX9oX82LpGHSU.jpg"
          alt="Учительница держит планшет в классе"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute left-[38.4%] top-[55.4%] h-[32.6%] w-[23.4%] overflow-hidden rounded-[1.2%] bg-white shadow-[0_1px_5px_rgba(15,23,42,0.12)]">
          <div className="flex h-full flex-col overflow-hidden px-[5%] py-[3%] text-[clamp(4px,0.62vw,10px)] text-ink-900">
            {stage === 'enter' ? (
              <>
                <div className="flex items-center gap-[3%] border-b border-ink-100 pb-[3%]">
                  <span className="flex h-[15%] w-[10%] min-h-3 min-w-3 items-center justify-center rounded-[20%] bg-sky-600 text-white">
                    <Activity className="h-[70%] w-[70%]" strokeWidth={2.4} />
                  </span>
                  <div className="leading-none">
                    <h1 className="font-extrabold tracking-tight text-sky-800">Настаўнік<span className="text-pine-600">PRO</span></h1>
                    <p className="mt-[3%] text-[0.72em] text-ink-500">Классный руководитель</p>
                  </div>
                </div>
                <h2 className="mt-[5%] font-bold">Вход в кабинет</h2>
                <p className="mt-[2%] text-[0.72em] leading-snug text-ink-500">Введите код доступа, чтобы открыть рабочий стол.</p>
                <form onSubmit={handleEnter} className="mt-[3%] space-y-[2.5%]">
                  <label className="block">
                    <span className="text-[0.72em] font-semibold text-ink-600">Код доступа</span>
                    <div className="mt-[2%] flex items-center gap-[3%] rounded-[8%] border border-ink-200 px-[4%] py-[3%] focus-within:border-pine-400">
                      <KeyRound className="h-[0.9em] w-[0.9em] shrink-0 text-ink-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="min-w-0 w-full bg-transparent font-bold tracking-[0.15em] text-ink-800 outline-none placeholder:text-ink-300 placeholder:tracking-normal placeholder:font-normal"
                      />
                    </div>
                  </label>
                  {error && <div className="rounded border border-gold-200 bg-gold-100/50 px-[3%] py-[2%] text-[0.72em] text-gold-800">{error}</div>}
                  <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-[3%] rounded-[8%] bg-pine-700 px-[3%] py-[3%] font-bold text-white transition hover:bg-pine-800 disabled:opacity-60">
                    {busy ? <Loader2 className="h-[0.9em] w-[0.9em] animate-spin" /> : <>Войти <ArrowRight className="h-[0.9em] w-[0.9em]" /></>}
                  </button>
                </form>
                <div className="mt-[3%] shrink-0 border-t border-ink-100 pt-[2%] text-center">
                  <p className="text-[0.72em] text-ink-500">Нет кода?</p>
                  <button onClick={handleGenerate} disabled={busy} className="mt-[1%] inline-flex items-center gap-[3%] rounded-[8%] bg-gold-100 px-[4%] py-[2%] text-[0.68em] font-bold text-gold-800 disabled:opacity-60"><Sparkles className="h-[0.9em] w-[0.9em]" />Сгенерировать код</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-[3%]"><Sparkles className="h-[1.2em] w-[1.2em] text-gold-700" /><div><h2 className="font-bold">Код готов!</h2><p className="text-[0.72em] text-ink-500">Запишите его</p></div></div>
                <div className="mt-[5%] rounded border border-dashed border-gold-300 bg-gold-100/40 p-[4%] text-center"><p className="text-[0.65em] font-bold uppercase text-ink-400">Ваш код</p><p className="mt-[2%] text-[1.8em] font-extrabold tracking-[0.12em] text-pine-800">{generatedCode}</p><button onClick={handleCopy} className="mt-[2%] inline-flex items-center gap-[3%] rounded border border-ink-200 bg-white px-[3%] py-[2%] text-[0.7em] font-bold text-ink-600">{copied ? <Check className="h-[0.9em] w-[0.9em] text-pine-600" /> : <Copy className="h-[0.9em] w-[0.9em]" />}{copied ? 'Скопировано' : 'Копировать'}</button></div>
                {error && <div className="mt-[3%] rounded border border-gold-200 bg-gold-100/50 px-[3%] py-[2%] text-[0.72em] text-gold-800">{error}</div>}
                <button onClick={handleEnterGenerated} disabled={busy} className="mt-auto flex w-full items-center justify-center gap-[3%] rounded-[8%] bg-pine-700 px-[3%] py-[3%] font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-[0.9em] w-[0.9em] animate-spin" /> : <>Войти в кабинет <ArrowRight className="h-[0.9em] w-[0.9em]" /></>}</button>
                <button onClick={() => { setStage('enter'); setGeneratedCode(null); setError(null); }} className="mt-[2%] text-center text-[0.72em] font-bold text-ink-400">У меня уже есть код</button>
              </>
            )}
            <div className="mt-[2%] flex min-h-[1.4em] shrink-0 items-center gap-[2%] rounded bg-pine-50 px-[2.5%] py-[1%] text-[0.6em] leading-none text-ink-500"><ShieldCheck className="h-[1.1em] w-[1.1em] shrink-0 text-pine-600" /><span className="whitespace-nowrap">Данные защищены</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
