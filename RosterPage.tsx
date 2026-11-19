import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Loader2, Info, CheckCircle2, Circle, ShieldCheck, Link2, KeyRound, TriangleAlert } from 'lucide-react';
import { SectionTitle, Card, Button, MentorTip } from '@/components/ui';
import CopyLinkButton from '@/components/CopyLinkButton';
import { supabase } from '@/lib/supabase';

type ClassProfileRow = {
  total_students: number; boys_count: number; girls_count: number;
  large_families: number; full_families: number; incomplete_families: number;
  disabled_children: number; guardian_children: number; at_risk_children: number;
};
type ClassRole = { id: string; title: string; filled: boolean };
type StudentCode = { id: string; code: string };
type MoodRow = { mood: 'great' | 'good' | 'ok' | 'hard'; created_at: string; student_code_id: string | null };
type ClassActivity = { id: string; title: string; students_count: number };

const PASSPORT_FIELDS = [
  { key: 'large_families', label: 'Многодетные семьи' },
  { key: 'full_families', label: 'Полные семьи' },
  { key: 'incomplete_families', label: 'Неполные семьи' },
  { key: 'disabled_children', label: 'Дети-инвалиды' },
  { key: 'guardian_children', label: 'Дети под опекой (гособеспечение)' },
  { key: 'at_risk_children', label: 'Дети в социально опасном положении' },
] as const;

type PassportKey = (typeof PASSPORT_FIELDS)[number]['key'];

const ACTIVITY_PRESETS = ['Спортивные секции', 'Объединения искусств (музыка, танцы, ИЗО)', 'Техническое творчество и робототехника', 'Туризм и краеведение', 'Добровольческие отряды', 'Кружки на базе школы (шестой школьный день)'];

const inputCls = 'mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100';

const ROLE_PRESETS = ['Дежурные', 'Староста', 'Библиотекарь', 'Цветоводы', 'Спортсмены-организаторы', 'Актив зон'];

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function CodeSignals({ moods, codeId }: { moods: MoodRow[]; codeId: string }) {
  const mine = moods.filter((m) => m.student_code_id === codeId);
  const hard = mine.filter((m) => m.mood === 'hard').length;
  const pos = mine.filter((m) => m.mood === 'great' || m.mood === 'good').length;
  return (
    <span className="text-[11px] text-ink-400">
      {mine.length === 0 ? 'нет ответов' : `${pos} из ${mine.length} «хорошо» и выше${hard >= 2 ? ' · сигнал: часто «Трудно»' : ''}`}
    </span>
  );
}

export default function RosterPage() {
  const [roles, setRoles] = useState<ClassRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState('');
  const [boys, setBoys] = useState('');
  const [passport, setPassport] = useState<Record<PassportKey, string>>({
    large_families: '', full_families: '', incomplete_families: '',
    disabled_children: '', guardian_children: '', at_risk_children: '',
  });
  const [activities, setActivities] = useState<ClassActivity[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [girls, setGirls] = useState('');
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [codes, setCodes] = useState<StudentCode[]>([]);
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [codesBusy, setCodesBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [profileRes, rolesRes, activitiesRes, codesRes, moodsRes] = await Promise.all([
        supabase.from('class_profile').select('total_students, boys_count, girls_count, large_families, full_families, incomplete_families, disabled_children, guardian_children, at_risk_children').eq('id', 1).maybeSingle(),
        supabase.from('class_roles').select('id, title, filled').order('created_at'),
        supabase.from('class_activities').select('id, title, students_count').order('created_at'),
        supabase.from('student_codes').select('id, code').order('created_at'),
        supabase.from('mood_checkins').select('mood, created_at, student_code_id').order('created_at', { ascending: false }).limit(500),
      ]);
      if (profileRes.error || rolesRes.error || activitiesRes.error || codesRes.error || moodsRes.error) {
        setError('Не удалось загрузить данные класса. Попробуйте обновить страницу.');
      } else {
        const p = profileRes.data as ClassProfileRow | null;
        if (p) {
          setTotal(String(p.total_students));
          setBoys(String(p.boys_count));
          setGirls(String(p.girls_count));
          setPassport({
            large_families: String(p.large_families ?? 0),
            full_families: String(p.full_families ?? 0),
            incomplete_families: String(p.incomplete_families ?? 0),
            disabled_children: String(p.disabled_children ?? 0),
            guardian_children: String(p.guardian_children ?? 0),
            at_risk_children: String(p.at_risk_children ?? 0),
          });
        }
        setRoles((rolesRes.data || []) as ClassRole[]);
        setActivities((activitiesRes.data || []) as ClassActivity[]);
        setCodes((codesRes.data || []) as StudentCode[]);
        setMoods((moodsRes.data || []) as MoodRow[]);
      }
      setLoading(false);
    })();
  }, []);

  const addActivity = async (title: string, students_count = 0) => {
    if (!title.trim()) return;
    const { data, error: err } = await supabase
      .from('class_activities')
      .insert({ title: title.trim(), students_count })
      .select('id, title, students_count')
      .single();
    if (err || !data) setError('Не удалось добавить направление занятости.');
    else {
      setActivities((prev) => [...prev, data as ClassActivity]);
      setNewActivity('');
      setError(null);
    }
  };

  const setActivityCount = async (act: ClassActivity, count: number) => {
    const next = Math.max(0, count);
    setActivities((list) => list.map((a) => (a.id === act.id ? { ...a, students_count: next } : a)));
    const { error: err } = await supabase.from('class_activities').update({ students_count: next }).eq('id', act.id);
    if (err) {
      setActivities((list) => list.map((a) => (a.id === act.id ? { ...a, students_count: act.students_count } : a)));
      setError('Не удалось сохранить охват направления.');
    }
  };

  const removeActivity = async (id: string) => {
    const prev = activities;
    setActivities((list) => list.filter((a) => a.id !== id));
    const { error: err } = await supabase.from('class_activities').delete().eq('id', id);
    if (err) {
      setActivities(prev);
      setError('Не удалось удалить направление.');
    }
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    const row = {
      id: 1,
      total_students: Math.max(0, Number(total) || 0),
      boys_count: Math.max(0, Number(boys) || 0),
      girls_count: Math.max(0, Number(girls) || 0),
      large_families: Math.max(0, Number(passport.large_families) || 0),
      full_families: Math.max(0, Number(passport.full_families) || 0),
      incomplete_families: Math.max(0, Number(passport.incomplete_families) || 0),
      disabled_children: Math.max(0, Number(passport.disabled_children) || 0),
      guardian_children: Math.max(0, Number(passport.guardian_children) || 0),
      at_risk_children: Math.max(0, Number(passport.at_risk_children) || 0),
    };
    const { error: err } = await supabase.from('class_profile').upsert(row);
    if (err) setError('Не удалось сохранить счётчики класса.');
    else setError(null);
    setSaving(false);
  };

  const addRole = async (title: string) => {
    if (!title.trim()) return;
    const { data, error: err } = await supabase
      .from('class_roles')
      .insert({ title: title.trim() })
      .select('id, title, filled')
      .single();
    if (err || !data) setError('Не удалось добавить роль.');
    else {
      setRoles((prev) => [...prev, data as ClassRole]);
      setNewRole('');
      setError(null);
    }
  };

  const toggleRole = async (role: ClassRole) => {
    const next = !role.filled;
    setRoles((list) => list.map((r) => (r.id === role.id ? { ...r, filled: next } : r)));
    const { error: err } = await supabase.from('class_roles').update({ filled: next }).eq('id', role.id);
    if (err) {
      setRoles((list) => list.map((r) => (r.id === role.id ? { ...r, filled: role.filled } : r)));
      setError('Не удалось изменить статус роли.');
    }
  };

  const removeRole = async (id: string) => {
    const prev = roles;
    setRoles((list) => list.filter((r) => r.id !== id));
    const { error: err } = await supabase.from('class_roles').delete().eq('id', id);
    if (err) {
      setRoles(prev);
      setError('Не удалось удалить роль.');
    }
  };

  const addCode = async () => {
    if (codesBusy) return;
    setCodesBusy(true);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error: err } = await supabase
        .from('student_codes')
        .insert({ code: generateCode() })
        .select('id, code')
        .single();
      if (!err && data) {
        setCodes((prev) => [...prev, data as StudentCode]);
        setError(null);
        setCodesBusy(false);
        return;
      }
      // код уже занят кем-то в стране — генерируем другой
      if (!err || (err as { code?: string }).code !== '23505') break;
    }
    setError('Не удалось добавить код. Попробуйте ещё раз.');
    setCodesBusy(false);
  };

  const removeCode = async (id: string) => {
    const prevCodes = codes;
    setCodes((list) => list.filter((c) => c.id !== id));
    const { error: err } = await supabase.from('student_codes').delete().eq('id', id);
    if (err) { setCodes(prevCodes); setError('Не удалось удалить код.'); }
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Инструменты класса"
        subtitle="Состав класса — только числами: сколько учащихся, сколько девочек и мальчиков. Роли и поручения — перечнем, без привязки к конкретным детям. Приложение не собирает никаких персональных данных об учащихся."
        mentorTip="Здесь не нужны фамилии и даты рождения — только цифры и перечень ролей. Этого достаточно для планирования воспитательной работы и отчётов." />

      <div className="flex items-start gap-3 rounded-xl border border-pine-200 bg-pine-50 px-5 py-4 text-sm leading-relaxed text-pine-900">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-pine-600" />
        Персональные данные учащихся не обрабатываются: в приложении нельзя ввести фамилию, имя или дату рождения ребёнка — и это соответствует Закону Республики Беларусь «О защите персональных данных».
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <Info size={18} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Card className="p-6"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка…</div></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="contents">
          <Card className="animate-fade-up delay-1 border-pine-200/80 p-6">
            <h3 className="flex items-center gap-2 font-bold text-ink-900">
              <Users size={18} className="text-pine-600" /> Состав класса — только числа
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Всего учащихся</span>
                <input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Девочек</span>
                <input type="number" min={0} value={girls} onChange={(e) => setGirls(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500">Мальчиков</span>
                <input type="number" min={0} value={boys} onChange={(e) => setBoys(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100" />
              </label>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="mt-4">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null} Сохранить состав и паспорт
            </Button>

            <div className="mt-8 border-t border-ink-100 pt-6">
              <h3 className="font-bold text-ink-900">Социальный паспорт класса</h3>
              <p className="mt-1 text-xs text-ink-400">Только числа, без семей и фамилий. Числа учитываются в документах — характеристике и отчётах.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PASSPORT_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs font-semibold text-ink-500">{f.label}</span>
                    <input
                      type="number" min={0}
                      value={passport[f.key]}
                      onChange={(e) => setPassport((p) => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
              <Button onClick={saveProfile} disabled={saving} className="mt-4">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null} Сохранить паспорт
              </Button>
            </div>

            <div className="mt-8 border-t border-ink-100 pt-6">
              <h3 className="font-bold text-ink-900">Внеурочная занятость</h3>
              {(() => {
                const totalN = Math.max(0, Number(total) || 0);
                const covered = activities.reduce((s, a) => s + (Number(a.students_count) || 0), 0);
                const pct = totalN ? Math.min(100, Math.round((covered / totalN) * 100)) : 0;
                return (
                  <div className="mt-4 rounded-xl bg-pine-50 p-4">
                    <p className="text-sm font-semibold text-ink-800">Охвачено внеурочной занятостью: {covered} из {totalN} учащихся</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-pine-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-ink-500">Охват — {pct}%.{totalN - covered > 0 ? ` Не охвачено: ${totalN - covered} (число, без списков).` : totalN ? ' Охвачен весь класс.' : ''}</p>
                  </div>
                );
              })()}
              {activities.length === 0 ? (
                <p className="mt-4 text-sm text-ink-400">Направлений пока нет. Добавьте типовые или свои.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {activities.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-2.5">
                      <span className="text-sm font-semibold text-ink-800">{a.title}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0}
                          value={a.students_count}
                          onChange={(e) => setActivityCount(a, Number(e.target.value))}
                          className="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                          aria-label={`Сколько учащихся занято: ${a.title}`}
                        />
                        <span className="text-[11px] text-ink-400">учащихся</span>
                        <button onClick={() => removeActivity(a.id)} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Удалить ${a.title}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 rounded-xl bg-ink-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_PRESETS.filter((p) => !activities.some((a) => a.title === p)).map((p) => (
                    <button key={p} onClick={() => addActivity(p)} className="rounded-full border border-pine-200 bg-white px-3 py-1.5 text-xs font-semibold text-pine-700 transition hover:bg-pine-50">
                      + {p}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addActivity(newActivity)}
                    placeholder="Своё направление (например, «ЮИД»)"
                    className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                  />
                  <Button onClick={() => addActivity(newActivity)} disabled={!newActivity.trim()}>
                    <Plus size={16} /> Добавить
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="animate-fade-up delay-2 border-t border-ink-100 pt-6 lg:border-t-0 lg:pt-6">
            <h3 className="font-bold text-ink-900">Роли и поручения в классе</h3>
              <p className="mt-1 text-xs text-ink-400">Перечень ролей без привязки к детям: отмечайте, занята ли роль в этом году.</p>
              {roles.length === 0 ? (
                <p className="mt-4 text-sm text-ink-400">Ролей пока нет. Добавьте типовые роли или свою.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {roles.map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-2.5">
                      <button onClick={() => toggleRole(r)} className="flex items-center gap-2.5 text-left text-sm font-semibold text-ink-800">
                        {r.filled ? <CheckCircle2 size={18} className="text-pine-600" /> : <Circle size={18} className="text-ink-300" />}
                        {r.title}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${r.filled ? 'bg-pine-50 text-pine-700' : 'bg-ink-100 text-ink-500'}`}>
                          {r.filled ? 'занята' : 'свободна'}
                        </span>
                        <button onClick={() => removeRole(r.id)} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Удалить роль ${r.title}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 rounded-xl bg-ink-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {ROLE_PRESETS.filter((p) => !roles.some((r) => r.title === p)).map((p) => (
                    <button key={p} onClick={() => addRole(p)} className="rounded-full border border-pine-200 bg-white px-3 py-1.5 text-xs font-semibold text-pine-700 transition hover:bg-pine-50">
                      + {p}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRole(newRole)}
                    placeholder="Своя роль (например, «Экологи»)"
                    className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
                  />
                  <Button onClick={() => addRole(newRole)} disabled={!newRole.trim()}>
                    <Plus size={16} /> Добавить
                  </Button>
                </div>
              </div>
            </div>

          <MentorTip tip="Числа вместо фамилий — самый надёжный способ заботиться о данных детей. Для анализа класса вам достаточно соотношения девочек и мальчиков, а роли удобнее видеть перечнем: так вы сразу видите, какие поручения ещё свободны." />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="animate-fade-up border-gold-200/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold text-ink-900"><KeyRound size={18} className="text-gold-600" /> Класс по кодам</h3>
                <Button onClick={addCode} disabled={codesBusy} className="!px-4 !py-2 !text-xs">
                  {codesBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Добавить код ученика
                </Button>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">
                Каждому ребёнку — случайный код вместо фамилии. Дайте код ученику (например, запишите на его тетради):
                по ссылке рядом с кодом он анонимно отмечает настроение, и вы видите сигнал именно по этому коду.
              </p>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-100/40 px-4 py-3 text-xs leading-relaxed text-gold-800">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                Расшифровку «код — фамилия» ведите только в бумажном журнале, не в приложении. Коды не связаны с порядком в классном журнале и не позволяют никому другому узнать ребёнка.
              </div>
              {codes.length === 0 ? (
                <p className="mt-4 text-sm text-ink-400">Кодов пока нет. Добавьте по одному на каждого ученика — фамилии не нужны.</p>
              ) : (
                <ul className="mt-4 grid gap-2 md:grid-cols-2">
                  {codes.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-2.5">
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-extrabold tracking-[0.14em] text-pine-800">{c.code}</span>
                        <div className="mt-0.5 flex items-center gap-1.5"><Link2 size={11} className="shrink-0 text-ink-300" /><CodeSignals moods={moods} codeId={c.id} /></div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <CopyLinkButton kind="mood-code" code={c.id} label="Ссылка" className="!py-1 !text-[11px]" />
                        <button onClick={() => removeCode(c.id)} className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Удалить код ${c.code}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
