import { supabase } from '@/lib/supabase';

/**
 * Demo mode: fills (and clears) sample data so the platform can be shown
 * with live content. All demo rows are marked with the demo_prefix tag in
 * free-text fields so cleanup removes only demo records.
 */
export const DEMO_TAG = '[демо]';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function fillDemoData(): Promise<{ ok: boolean; message: string }> {
  const results = await Promise.allSettled([
    supabase.from('class_profile').upsert({
      id: 1,
      total_students: 26,
      boys_count: 12,
      girls_count: 14,
      large_families: 4,
      full_families: 18,
      incomplete_families: 6,
      disabled_children: 1,
      guardian_children: 1,
      at_risk_children: 0,
    }),
    supabase.from('meetings').insert([
      { meeting_date: daysAgo(96), topic: `${DEMO_TAG} Адаптация класса в новом учебном году`, decisions: 'Утверждён план воспитательной работы. Родители предложили экскурсию в музей — ответственная взята на себя родительским комитетом.' },
      { meeting_date: daysAgo(48), topic: `${DEMO_TAG} Итоги первой четверти и режим дня`, decisions: 'Согласованы единые требования к режиму дня. Принято решение о консультации школьного психолога по запросам семей.' },
      { meeting_date: daysAgo(9), topic: `${DEMO_TAG} Итоги второй четверти и зимние каникулы`, decisions: 'Обсуждены итоги полугодия, план работы на каникулах. Родители поддержали участие класса в акции «Чистый обелиск».' },
    ]),
    supabase.from('mood_checkins').insert(
      [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 6].map((d, i) => ({
        mood: (['great', 'good', 'good', 'ok', 'good', 'hard', 'great', 'good', 'ok', 'good', 'great', 'good', 'ok', 'hard'] as const)[i],
        created_at: isoDaysAgo(d, 9 + (i % 6)),
      })),
    ),
    supabase.from('class_roles').insert([
      { title: `${DEMO_TAG} Староста`, filled: true },
      { title: `${DEMO_TAG} Дежурные`, filled: true },
      { title: `${DEMO_TAG} Библиотекарь`, filled: false },
      { title: `${DEMO_TAG} Актив зон`, filled: true },
    ]),
    supabase.from('class_activities').insert([
      { title: `${DEMO_TAG} Спортивные секции`, students_count: 11 },
      { title: `${DEMO_TAG} Объединения искусств (музыка, танцы, ИЗО)`, students_count: 8 },
      { title: `${DEMO_TAG} Туризм и краеведение`, students_count: 4 },
      { title: `${DEMO_TAG} Кружки на базе школы (шестой школьный день)`, students_count: 2 },
    ]),
  ]);

  const failed = results.filter((r) => r.status === 'rejected');
  return failed.length === 0
    ? { ok: true, message: 'Демо-данные загружены: паспорт, журнал собраний, опросы, занятость и роли.' }
    : { ok: false, message: 'Часть демо-данных не сохранилась. Попробуйте ещё раз.' };
}

export async function clearDemoData(): Promise<{ ok: boolean; message: string }> {
  const results = await Promise.allSettled([
    supabase.from('meetings').delete().like('topic', `${DEMO_TAG}%`),
    supabase.from('mood_checkins').delete().gte('created_at', isoDaysAgo(6, 0)),
    supabase.from('class_roles').delete().like('title', `${DEMO_TAG}%`),
    supabase.from('class_activities').delete().like('title', `${DEMO_TAG}%`),
  ]);
  const failed = results.filter((r) => r.status === 'rejected');
  return failed.length === 0
    ? { ok: true, message: 'Демо-данные удалены. Ваши настоящие записи не тронуты.' }
    : { ok: false, message: 'Не удалось удалить часть демо-данных.' };
}
