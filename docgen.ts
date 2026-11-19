import { supabase } from '@/lib/supabase';

type Meeting = { id: string; meeting_date: string; topic: string; decisions: string | null };
type SurveyMetric = { survey_key: string; option_label: string; option_value: number };
type MoodVote = { mood: string; created_at: string };
type ClassProfile = {
  total_students: number; boys_count: number; girls_count: number;
  large_families: number; full_families: number; incomplete_families: number;
  disabled_children: number; guardian_children: number; at_risk_children: number;
} | null;
type ClassRole = { title: string; filled: boolean };
type ClassActivity = { title: string; students_count: number };
type PlanItem = { month: string; event: string; place: string; participants: string; responsible: string; done: string };

export type BuiltDoc = { type: string; title: string; content: string; dataNote: string; needsData: string[] };

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const ruDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`;
};

export type Facts = {
  meetings: Meeting[];
  metrics: SurveyMetric[];
  moodVotes: MoodVote[];
  profile: ClassProfile;
  roles: ClassRole[];
  activities: ClassActivity[];
};

export async function loadFacts(): Promise<Facts | null> {
  const [meetingsRes, metricsRes, moodRes, profileRes, rolesRes, activitiesRes] = await Promise.all([
    supabase.from('meetings').select('id, meeting_date, topic, decisions').order('meeting_date', { ascending: true }),
    supabase.from('survey_metrics').select('survey_key, option_label, option_value'),
    supabase.from('mood_checkins').select('mood, created_at'),
    supabase.from('class_profile').select('total_students, boys_count, girls_count, large_families, full_families, incomplete_families, disabled_children, guardian_children, at_risk_children').eq('id', 1).maybeSingle(),
    supabase.from('class_roles').select('title, filled').order('created_at'),
    supabase.from('class_activities').select('title, students_count').order('created_at'),
  ]);
  if (meetingsRes.error || metricsRes.error || moodRes.error || profileRes.error || rolesRes.error || activitiesRes.error) return null;
  return {
    meetings: (meetingsRes.data || []) as Meeting[],
    metrics: (metricsRes.data || []) as SurveyMetric[],
    moodVotes: (moodRes.data || []) as MoodVote[],
    profile: (profileRes.data || null) as ClassProfile,
    roles: (rolesRes.data || []) as ClassRole[],
    activities: (activitiesRes.data || []) as ClassActivity[],
  };
}

export function buildQuarterReport(f: Facts, classLabel: string, year: string): BuiltDoc {
  const parts: string[] = [];
  parts.push(`ОТЧЁТ КЛАССНОГО РУКОВОДИТЕЛЯ ${classLabel} О ВОСПИТАТЕЛЬНОЙ РАБОТЕ ЗА ${year} УЧЕБНЫЙ ГОД`);
  parts.push('');
  if (f.profile) {
    parts.push(`1. Состав класса: всего ${f.profile.total_students} учащихся, из них ${f.profile.girls_count} девочек и ${f.profile.boys_count} мальчиков.`);
  } else {
    parts.push('1. Состав класса: не заполнен (внесите числа в разделе «Инструменты класса»).');
  }
  const filled = f.roles.filter((r) => r.filled);
  parts.push(`2. Самоуправление: из ${f.roles.length} ролей класса занято ${filled.length}${filled.length ? ` (${filled.map((r) => r.title.toLowerCase()).join(', ')})` : ''}.`);
  parts.push('');
  if (f.meetings.length) {
    parts.push(`3. Работа с родителями — проведено собраний: ${f.meetings.length}.`);
    parts.push('Хронология:');
    for (const m of f.meetings) {
      parts.push(`  — ${ruDate(m.meeting_date)}: ${m.topic}${m.decisions ? `. Решения: ${m.decisions}` : ''}`);
    }
  } else {
    parts.push('3. Работа с родителями: собрания в журнал не внесены.');
  }
  parts.push('');
  if (f.moodVotes.length) {
    const total = f.moodVotes.length;
    const hard = f.moodVotes.filter((v) => v.mood === 'hard').length;
    const good = f.moodVotes.filter((v) => v.mood === 'great' || v.mood === 'good').length;
    parts.push(`4. Диагностика настроения: всего ${total} анонимных ответов за период ведения опроса. Ответы «Отлично» или «Хорошо» — ${Math.round((good / total) * 100)}%, доля сигналов «Трудно» — ${Math.round((hard / total) * 100)}%.`);
  } else {
    parts.push('4. Диагностика настроения: опрос не проводился.');
  }
  parts.push('');
  parts.push('5. Выводы и задачи на следующий период формулируются в документе «Самоанализ».');

  return {
    type: 'quarter-report',
    title: `Отчёт о воспитательной работе · ${classLabel}`,
    content: parts.join('\n'),
    dataNote: 'Собран из журнала собраний, счётчиков класса, ролей и опроса настроения.',
    needsData: ['journal', 'roster', 'mood'],
  };
}

export function buildSelfAnalysis(f: Facts, classLabel: string, year: string): BuiltDoc {
  const parts: string[] = [];
  parts.push(`САМООНАЛИЗ ДЕЯТЕЛЬНОСТИ КЛАССНОГО РУКОВОДИТЕЛЯ ${classLabel} ЗА ${year} УЧЕБНЫЙ ГОД`);
  parts.push('');
  if (f.meetings.length) {
    parts.push(`Что сделано: проведено родительских собраний — ${f.meetings.length}. Основные темы: ${f.meetings.slice(0, 3).map((m) => `«${m.topic}»`).join(', ')}${f.meetings.length > 3 ? ' и другие' : ''}.`);
  } else {
    parts.push('Что сделано: по данным журнала, собрания не проводились — внесите фактуру в раздел «Журнал собраний».');
  }
  if (f.roles.length) {
    const filled = f.roles.filter((r) => r.filled).length;
    parts.push(`Самоуправление: организована система из ${f.roles.length} ролей, занято ${filled}.`);
  }
  if (f.moodVotes.length) {
    const total = f.moodVotes.length;
    const good = f.moodVotes.filter((v) => v.mood === 'great' || v.mood === 'good').length;
    parts.push(`Психологический климат: по данным анонимного опроса настроения (${total} ответов), ${Math.round((good / total) * 100)}% ответов — «Отлично» или «Хорошо».`);
  }
  parts.push('');
  parts.push('ВЫВОД 1 (что получилось):');
  parts.push('— [допишите: какое дело года или приём сработал лучше всего и почему]');
  parts.push('');
  parts.push('ВЫВОД 2 (что требует внимания):');
  parts.push('— [допишите: какая зона роста видна по данным диагностики или журнала]');
  parts.push('');
  parts.push('ЗАДАЧА НА СЛЕДУЮЩИЙ ГОД:');
  parts.push('— [сформулируйте одну конкретную задачу: направление + измеримый результат]');

  return {
    type: 'self-analysis',
    title: `Самоанализ деятельности · ${classLabel}`,
    content: parts.join('\n'),
    dataNote: 'Автоматически собирает фактуру; выводы и задача — с вашими уточнениями.',
    needsData: ['journal', 'roster', 'mood'],
  };
}

export type ProtocolChoices = {
  orgName: string;
  classLabel: string;
  date: string;
  number: string;
  chair: string;
  secretary: string;
  present: string;
  agenda: string[];
  discussions: string[];
  decisions: string[];
  responsible: string[];
  deadlines: string[];
};

export function buildOfficialParentProtocol(c: ProtocolChoices): BuiltDoc {
  const rows = c.agenda.map((topic, i) => [
    `${i + 1}. СЛУШАЛИ по ${i === 0 ? 'первому' : i === 1 ? 'второму' : `${i + 1}-му`} вопросу:`,
    c.discussions[i] || '____________________________________________________________',
    `РЕШИЛИ по ${i === 0 ? 'первому' : i === 1 ? 'второму' : `${i + 1}-му`} вопросу:`,
    c.decisions[i] || '____________________________________________________________',
    `Ответственный — ${c.responsible[i] || '____________________'}`,
    `Срок: ${c.deadlines[i] || '____________________'}`,
  ]);
  const parts = [
    c.orgName || 'Государственное учреждение образования «____________________________»',
    `Класс ${c.classLabel || '____'}`,
    '',
    'ПРОТОКОЛ',
    'родительского собрания',
    `${c.date || '____.____.20__'}    № ${c.number || '____'}`,
    '',
    `Председатель — ${c.chair || '____________________________'}`,
    `Секретарь — ${c.secretary || '____________________________'}`,
    `Присутствовали — ${c.present || '____'} человек`,
    '',
    'Повестка дня:',
    ...c.agenda.map((topic, i) => `${i + 1}. ${topic || '____________________________________________'}`),
    '',
    ...rows.flat(),
    '',
    'Председатель ____________________    ФИО ____________________',
    'Секретарь      ____________________    ФИО ____________________',
  ];
  return {
    type: 'parent-protocol-official',
    title: `Протокол родительского собрания · ${c.date || 'новый'}`,
    content: parts.join('\n'),
    dataNote: 'Форма собрана по образцу из приложения 3: реквизиты, повестка, слушали, решили, ответственные и сроки.',
    needsData: [],
  };
}

export function buildMeetingProtocol(meetings: Meeting[]): BuiltDoc[] {
  return meetings.map((m) => buildOfficialParentProtocol({
    orgName: '', classLabel: '', date: ruDate(m.meeting_date), number: '', chair: '', secretary: '', present: '',
    agenda: [m.topic], discussions: [''], decisions: [m.decisions || ''], responsible: [''], deadlines: [''],
  }));
}

export function buildMoodDigest(f: Facts, classLabel: string): BuiltDoc {
  const now = new Date();
  const week = f.moodVotes.filter((v) => new Date(v.created_at) >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const total = week.length;
  const c: Record<string, number> = { great: 0, good: 0, ok: 0, hard: 0 };
  for (const v of week) if (v.mood in c) c[v.mood] += 1;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const wellbeing = total
    ? Math.round(((c.great + c.good * 0.75 + c.ok * 0.5 + c.hard * 0.25) / total) * 100)
    : null;

  const parts: string[] = [];
  parts.push(`АНАЛИЗ НАСТРОЕНИЯ КЛАССА ${classLabel} (по данным анонимного опроса за 7 дней)`);
  parts.push('');
  if (!total) {
    parts.push('За последние 7 дней ответы отсутствуют. Дайте классу проголосовать в разделе «Настроение» и повторите формирование документа.');
  } else {
    parts.push(`В опросе получено ${total} анонимных ответов. Распределение: «Отлично» — ${pct(c.great)}%, «Хорошо» — ${pct(c.good)}%, «Обычно» — ${pct(c.ok)}%, «Трудно» — ${pct(c.hard)}%.`);
    parts.push(`Индекс благополучия класса за неделю — ${wellbeing} из 100.`);
    parts.push('');
    parts.push(wellbeing! >= 55
      ? 'Интерпретация: показатели в пределах нормы. Целесообразно продолжить текущий ритм: еженедельный опрос и коллективные дела по плану.'
      : 'Интерпретация: индекс ниже 55 — класс просит внимания. Рекомендуется: разговор с классом о причинах, сплочающее дело шестого школьного дня (сценарий — в планировщике ШАГ), повторный замер через неделю.');
    parts.push('');
    parts.push('Результаты представлены исключительно в агрегированном виде, без сведений об участниках опроса — в соответствии с законодательством о защите персональных данных.');
  }

  return {
    type: 'mood-digest',
    title: 'Анализ настроения класса · 7 дней',
    content: parts.join('\n'),
    dataNote: 'Собран из анонимного опроса настроения (агрегированно).',
    needsData: ['mood'],
  };
}

export function buildParentsMeetingScript(classLabel: string, topics: string[]): BuiltDoc {
  const blocks = topics.map((t, i) => `${i + 1}. ${t} — 6–8 минут`);
  const parts = [
    `СТРУКТУРА ВЫСТУПЛЕНИЯ НА РОДИТЕЛЬСКОМ СОБРАНИИ (класс ${classLabel})`,
    'Общая продолжительность: 20–25 минут, далее — вопросы и индивидуальные консультации.',
    '',
    ...blocks,
    '',
    'Рекомендуемая последовательность:',
    '— Начните с успехов класса (конкретика, без имён): 1–2 примера дел.',
    '— Озвучьте ключевые даты следующего месяца.',
    '— Один вопрос к родителям: что им нужно от класса в ближайший месяц.',
    '',
    'Памятки для семей: готовые материалы — в разделе «Родительский университет».',
  ];
  return {
    type: 'parents-meeting',
    title: 'Сценарий родительского собрания',
    content: parts.join('\n'),
    dataNote: 'Собирается из выбранных тем; не требует данных.',
    needsData: [],
  };
}

export type CharacteristicChoices = {
  performance: string;
  character: string;
  participation: string;
  attitude: string;
  mutualHelp: string;
  cohesion: string;
  yearTheme: string;
};

const CHAR_PARAGRAPHS: Record<Exclude<keyof CharacteristicChoices, 'yearTheme'>, Record<string, string>> = {
  performance: {
    high: 'Учебные достижения коллектива преимущественно высокие: учащиеся демонстрируют устойчивую познавательную мотивацию, ответственно относятся к текущей и итоговой аттестации.',
    medium: 'Успеваемость класса оценивается как средняя: учебные результаты стабильны, однако требуют системного применения дифференцированного подхода и индивидуальной поддержки отдельных учащихся.',
    below: 'Успеваемость класса находится ниже ожидаемого уровня, что требует усиления индивидуальной работы, вовлечения родителей в контроль учебной деятельности и организации взаимопомощи на уроках.',
    mixed: 'Успеваемость класса неоднородна: наряду с успешно обучающимися учащимися выделяется группа, нуждающаяся в дополнительной педагогической поддержке; целесообразно применение уровневой дифференциации.',
  },
  character: {
    calm: 'Психологический климат класса спокойный и доброжелательный: учащиеся уравновешенны, соблюдают принятые нормы поведения, конфликты возникают редко и разрешаются конструктивно.',
    active: 'Класс отличается активным, энергичным характером: учащиеся инициативны, охотно включаются в коллективные дела, что требует грамотного направления энергии в социально значимое русло.',
    contrast: 'Коллектив контрастен по составу: сочетаются спокойные и активные учащиеся, что позволяет выстраивать работу по принципу наставничества и парного взаимодействия.',
    closed: 'Класс характеризуется сдержанностью в проявлении эмоций: учащиеся не всегда открыто выражают мнение, поэтому целесообразны интерактивные формы работы, раскрывающие потенциал каждого.',
  },
  participation: {
    active: 'Участие в жизни класса активное: учащиеся охотно берут на себя поручения, выступают инициаторами коллективных дел, класс занимает заметное место в жизни учреждения образования.',
    moderate: 'Участие в жизни класса умеренное: учащиеся принимают участие в запланированных делах, однако инициатива чаще исходит от педагога и актива класса.',
    passive: 'Участие в жизни класса пока пассивное: включение учащихся в коллективные дела требует дополнительной мотивации, использования игровых и соревновательных форм работы.',
  },
  attitude: {
    responsible: 'Отношение к делам класса ответственное: поручения выполняются добросовестно и доводятся до конца, сформировано чувство причастности к общему результату.',
    selective: 'Отношение к делам класса избирательное: учащиеся откликаются на интересные для них дела, что необходимо учитывать при планировании воспитательной работы.',
    indifferent: 'Отношение к делам класса требует коррекции: значительная часть учащихся не проявляет заинтересованности, целесообразно вовлечение через малые группы и личные поручения.',
  },
  mutualHelp: {
    developed: 'Взаимопомощь и поддержка в коллективе развиты: учащиеся оказывают помощь друг другу в учебной и внеучебной деятельности, чему способствует целенаправленная работа классного руководителя.',
    situational: 'Взаимопомощь носит ситуативный характер: учащиеся помогают друг другу преимущественно в знакомых ситуациях, требуется систематическое создание ситуаций сотрудничества.',
    weak: 'Навыки взаимопомощи сформированы недостаточно: целесообразно применение коллективных творческих дел, формирующих опыт совместной деятельности и взаимной ответственности.',
  },
  cohesion: {
    high: 'Уровень сплочённости коллектива высокий: класс представляет собой устойчивую группу с общими ценностями и традициями, что создаёт благоприятную основу для воспитательной работы.',
    medium: 'Уровень сплочённости коллектива средний: отдельные микрогруппы объединены общими интересами, задача классного руководителя — укрепление общеклассных традиций и совместных дел.',
    low: 'Уровень сплочённости коллектива находится в стадии формирования: целесообразно проведение сплочающих мероприятий, коллективного планирования и цикла дел, объединяющих весь класс.',
  },
};

export function buildClassCharacteristic(
  c: CharacteristicChoices,
  f: Facts | null,
  classLabel: string,
  year: string,
): BuiltDoc {
  const parts: string[] = [];
  parts.push(`ПЕДАГОГИЧЕСКАЯ ХАРАКТЕРИСТИКА КЛАССА ${classLabel} (${year} УЧЕБНЫЙ ГОД)`);
  parts.push('');
  if (f?.profile) {
    parts.push(`Количественный состав: всего ${f.profile.total_students} учащихся, из них ${f.profile.girls_count} девочек и ${f.profile.boys_count} мальчиков. Данные о персональном составе не собираются и не хранятся.`);
  } else {
    parts.push('Количественный состав класса: [укажите число учащихся в разделе «Инструменты класса» — оно будет автоматически вставлено при следующем формировании].');
  }
  parts.push('');
  parts.push('Учебная деятельность.');
  parts.push(CHAR_PARAGRAPHS.performance[c.performance] ?? `[успеваемость: ${c.performance}]`);
  parts.push('');
  parts.push('Характер коллектива.');
  parts.push(CHAR_PARAGRAPHS.character[c.character] ?? `[характер: ${c.character}]`);
  if (c.yearTheme.trim()) {
    parts.push(`Воспитательная работа в текущем году выстроена в рамках направления «${c.yearTheme.trim()}».`);
  }
  parts.push('');
  parts.push('Включённость в жизнь класса.');
  parts.push(CHAR_PARAGRAPHS.participation[c.participation] ?? `[участие: ${c.participation}]`);
  parts.push(CHAR_PARAGRAPHS.attitude[c.attitude] ?? `[отношение: ${c.attitude}]`);
  parts.push('');
  parts.push('Межличностные отношения.');
  parts.push(CHAR_PARAGRAPHS.mutualHelp[c.mutualHelp] ?? `[взаимопомощь: ${c.mutualHelp}]`);
  parts.push(CHAR_PARAGRAPHS.cohesion[c.cohesion] ?? `[сплочённость: ${c.cohesion}]`);
  if (f?.moodVotes.length) {
    const total = f.moodVotes.length;
    const good = f.moodVotes.filter((v) => v.mood === 'great' || v.mood === 'good').length;
    parts.push(`По данным анонимного опроса настроения (${total} ответов), ${Math.round((good / total) * 100)}% ответов являются позитивными, что согласуется с общей картиной психологического климата.`);
  }
  parts.push('');
  parts.push('ВЫВОД.');
  parts.push('Коллектив класса обладает потенциалом для дальнейшего развития. Задачи на следующий период: [допишите 1–2 задачи с учётом разделов выше — например, укрепление традиций класса, развитие взаимопомощи через совместные дела].');
  parts.push('');
  parts.push('Классный руководитель: ____________________');

  return {
    type: 'class-characteristic',
    title: `Педагогическая характеристика · ${classLabel}`,
    content: parts.join('\n'),
    dataNote: 'Собран из ваших выборов и агрегированных данных платформы (состав числом, настроение). Без персональных данных.',
    needsData: [],
  };
}

export function buildSocialPedagogicalCharacteristic(f: Facts, classLabel: string, orgName: string, teacherName: string, firstDate = '01.09.20__', secondDate = '01.01.20__'): BuiltDoc {
  const p = f.profile;
  const value = (n: number | undefined) => n === undefined ? '' : String(n);
  const rows = [
    ['1. Общие сведения о классном коллективе', '', ''],
    ['Количество всех учащихся в классе', value(p?.total_students), value(p?.total_students)],
    ['Количество мальчиков', value(p?.boys_count), value(p?.boys_count)],
    ['Количество девочек', value(p?.girls_count), value(p?.girls_count)],
    ['Вновь прибывшие (ФИ)', '', ''],
    ['Переведённые из других классов (ФИ)', '', ''],
    ['2. Несовершеннолетние, с которыми реализуется программа индивидуальной профилактической работы', '', ''],
    ['3. Несовершеннолетние, в семьях которых выявлены критерии и показатели социально опасного положения', value(p?.at_risk_children), value(p?.at_risk_children)],
    ['4. Несовершеннолетние, отобранные у родителей и признанные нуждающимися в государственной защите', '', ''],
    ['5. Обучающиеся, воспитывающиеся в многодетных семьях', value(p?.large_families), value(p?.large_families)],
    ['6. Дети-инвалиды', value(p?.disabled_children), value(p?.disabled_children)],
    ['7. Обучающиеся, у которых родители (один из родителей) являются инвалидами', '', ''],
    ['8. Несовершеннолетние, с которыми реализуется индивидуальная реабилитационная программа', '', ''],
    ['9. Несовершеннолетние, вернувшиеся из специальных воспитательных учреждений', '', ''],
    ['10. Обучающиеся, воспитывающиеся в малообеспеченных семьях', '', ''],
    ['11. Обучающиеся, родители которых не являются гражданами Республики Беларусь', '', ''],
    ['12. Обучающиеся, воспитывающиеся в замещающих семьях', value(p?.guardian_children), value(p?.guardian_children)],
    ['13. Обучающиеся, воспитывающиеся в семьях, где родители имеют статус пострадавших от аварии на ЧАЭС', '', ''],
    ['14. Обучающиеся, воспитывающиеся в семьях, где родители имеют статус воинов-интернационалистов', '', ''],
  ];
  const parts = [
    `Форма социально-педагогической характеристики ${classLabel || '____'} класса ${orgName || 'ГУО ____________________'}`,
    `ФИО (кл. рук.) ${teacherName || '____________________________'}`,
    '',
    'Таблица социально-педагогической характеристики класса',
    `Показатель | на ${firstDate} | на ${secondDate}`,
    ...rows.map((r) => r.join(' | ')),
    '',
    'Примечание: в таблице указываются количественные показатели и ФИО только в предусмотренных учреждением случаях.',
  ];
  return {
    type: 'social-pedagogical-characteristic',
    title: `Социально-педагогическая характеристика · ${classLabel || 'класс'}`,
    content: parts.join('\n'),
    dataNote: 'Табличная форма собрана по образцу из приложения 3 и использует числовые данные социального паспорта.',
    needsData: ['roster'],
  };
}

export function buildEducationPlan(classLabel: string, orgName: string, teacherName: string, year: string, period: string, items: PlanItem[]): BuiltDoc {
  const rows = items.length ? items : [{ month: '____', event: '____________________________________________', place: '________', participants: '________', responsible: '________________', done: '____' }];
  const parts = [
    `ПЛАН ВОСПИТАТЕЛЬНОЙ РАБОТЫ В ${classLabel || '«____»'} КЛАССЕ`,
    orgName || 'ГУО «____________________________________________»',
    `на ${period || 'полугодие'} ${year} учебного года`,
    `ФИО классного руководителя ${teacherName || '____________________________'}`,
    '',
    '№ п/п | Мероприятия | Сроки | Место | Участники | Лица, ответственные за проведение | Отметка о выполнении',
    '1. | Мероприятия по реализации составляющих воспитания: | | | | |',
    '1.1. | Идеологическое воспитание и далее | | | | |',
    ...rows.map((r, i) => `${i + 2}. | ${r.event} | ${r.month} | ${r.place} | ${r.participants} | ${r.responsible} | ${r.done}`),
    '',
    'Примечание.',
    '1. В течение полугодия в плане воспитательной работы возможны изменения и дополнения.',
    '2. Классное руководство включает в себя часы организационно-воспитательной работы и иные воспитательные мероприятия.',
  ];
  return {
    type: 'education-plan-official',
    title: `План воспитательной работы · ${classLabel || 'класс'} · ${period || 'период'}`,
    content: parts.join('\n'),
    dataNote: 'Табличная форма собрана по образцу из приложения 3; мероприятия передаются отдельными строками с ответственными и отметкой выполнения.',
    needsData: [],
  };
}

export function buildSocialPassport(f: Facts, classLabel: string, year: string): BuiltDoc {
  const p = f.profile;
  const total = p?.total_students ?? 0;
  const covered = f.activities.reduce((sum, a) => sum + a.students_count, 0);
  const percent = total ? Math.min(100, Math.round((covered / total) * 100)) : 0;
  const parts = [
    `СОЦИАЛЬНЫЙ ПАСПОРТ И ВНЕУРОЧНАЯ ЗАНЯТОСТЬ КЛАССА ${classLabel} (${year} УЧЕБНЫЙ ГОД)`,
    '',
    p ? `В классе ${total} учащихся: ${p.girls_count} девочек и ${p.boys_count} мальчиков.` : 'Состав класса не заполнен — внесите числа в разделе «Инструменты класса».',
    '',
    'Социальные категории (количественные показатели):',
    `— многодетные семьи: ${p?.large_families ?? 0};`,
    `— полные семьи: ${p?.full_families ?? 0};`,
    `— неполные семьи: ${p?.incomplete_families ?? 0};`,
    `— дети-инвалиды: ${p?.disabled_children ?? 0};`,
    `— дети под опекой (гособеспечение): ${p?.guardian_children ?? 0};`,
    `— дети в социально опасном положении: ${p?.at_risk_children ?? 0}.`,
    '',
    `Внеурочной занятостью охвачено ${covered} учащихся из ${total} (ориентировочный суммарный охват — ${percent}%).`,
    f.activities.length ? 'Направления занятости:' : 'Направления занятости ещё не заполнены.',
    ...f.activities.map((a) => `— ${a.title}: ${a.students_count} учащихся.`),
    '',
    'Примечание: документ содержит только агрегированные числовые показатели и не включает фамилии, адреса и иные персональные данные.',
  ];
  return {
    type: 'social-passport',
    title: `Социальный паспорт · ${classLabel}`,
    content: parts.join('\n'),
    dataNote: 'Собран из числовых показателей социального паспорта и внеурочной занятости.',
    needsData: ['roster'],
  };
}

export type OrgSettings = {
  org_name: string;
  teacher_name: string;
  teacher_position: string;
  city: string;
};

export async function loadOrgSettings(): Promise<OrgSettings> {
  const { data } = await supabase.from('org_settings').select('org_name, teacher_name, teacher_position, city').eq('id', 1).maybeSingle();
  return (data as OrgSettings) ?? { org_name: '', teacher_name: '', teacher_position: 'Классный руководитель', city: '' };
}

export async function saveOrgSettings(s: OrgSettings): Promise<boolean> {
  const { error } = await supabase
    .from('org_settings')
    .update({ org_name: s.org_name, teacher_name: s.teacher_name, teacher_position: s.teacher_position || 'Классный руководитель', city: s.city, updated_at: new Date().toISOString() })
    .eq('id', 1);
  return !error;
}

export function letterheadHeader(s: OrgSettings, docKind: string, classLabel: string): string {
  const parts: string[] = [];
  if (s.org_name.trim()) parts.push(s.org_name.trim());
  if (s.city.trim() || s.org_name.trim()) {
    const addr = [s.city.trim(), s.org_name.trim() ? 'тел. ____' : null].filter(Boolean).join(', ');
    parts.push(`Адрес: ${addr}`);
  }
  parts.push('');
  parts.push(docKind.toUpperCase());
  parts.push(`по классу ${classLabel}`);
  parts.push('');
  return parts.join('\n');
}

export function letterheadFooter(s: OrgSettings): string {
  const today = new Date();
  const d = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
  const lines = ['', '', 'Составитель:'];
  if (s.teacher_position.trim()) lines.push(`  ${s.teacher_position.trim()} ____________________`);
  if (s.teacher_name.trim()) lines.push(`  ${s.teacher_name.trim()}`);
  lines.push(`«____» ____________ ${today.getFullYear()} г.    Дата составления: ${d}`);
  return lines.join('\n');
}

export function applyLetterhead(content: string, header: string, footer: string): string {
  if (content.startsWith('[[no-letterhead]]')) return content.replace('[[no-letterhead]]', '');
  return `${header}${content}${footer}`;
}

const printStyles = `
  @page { size: A4; margin: 20mm 10mm 20mm 30mm; }
  body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; text-align: justify; }
  p { margin: 0 0 8pt 0; text-indent: 1.25cm; }
  p.first { text-indent: 0; }
`;

function docHtml(title: string, content: string): string {
  const escape = (l: string) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = content.split('\n');
  const body: string[] = [];
  let table: string[][] = [];
  const flush = () => {
    if (!table.length) return;
    body.push(`<table><tbody>${table.map((row, i) => `<tr>${row.map((cell) => `${i === 0 ? '<th>' : '<td>'}${escape(cell.trim())}${i === 0 ? '</th>' : '</td>'}`).join('')}</tr>`).join('')}</tbody></table>`);
    table = [];
  };
  lines.forEach((line, i) => {
    if (line.includes(' | ')) { table.push(line.split('|')); return; }
    flush();
    body.push(`<p class="${i === 0 ? 'first' : ''}">${line.trim() ? escape(line) : '&nbsp;'}</p>`);
  });
  flush();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>${printStyles} table{width:100%;border-collapse:collapse;font-size:10pt;line-height:1.2;text-align:left}th,td{border:1px solid #222;padding:5px;vertical-align:top}th{font-weight:bold;text-align:center}</style></head><body>${body.join('')}</body></html>`;
}

export function printAsPdf(title: string, content: string) {
  const html = docHtml(title, content);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

export function downloadDoc(title: string, content: string) {
  printAsPdf(title, content);
}

export function downloadDocWord(title: string, content: string) {
  const html = docHtml(title, content).replace('<html>', '<html xmlns:w="urn:schemas-microsoft-com:office:word">');
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
