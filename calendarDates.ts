export type CalendarDate = { day: number; title: string; kind: 'state' | 'commemorate' };

// Государственные праздники и памятные даты Республики Беларусь.
// kind: 'state' — государственный праздник (нерабочий день), 'commemorate' — памятная дата.
export const CALENDAR_YEAR = 2026;

export const HOLIDAY_CALENDAR: Record<number, CalendarDate[]> = {
  0: [
    { day: 1, title: 'Новый год', kind: 'state' },
    { day: 8, title: 'День науки', kind: 'commemorate' },
    { day: 15, title: 'День образования ДОСААФ Беларуси', kind: 'commemorate' },
    { day: 19, title: 'Крещение Господне (православное)', kind: 'commemorate' },
    { day: 31, title: 'День белорусской киноискусства', kind: 'commemorate' },
  ],
  1: [
    { day: 15, title: 'День памяти воинов-интернационалистов', kind: 'commemorate' },
    { day: 21, title: 'Международный день родного языка', kind: 'commemorate' },
    { day: 23, title: 'День защитника Отечества', kind: 'commemorate' },
  ],
  2: [
    { day: 8, title: 'День белорусской милиции', kind: 'commemorate' },
    { day: 8, title: 'Международный женский день', kind: 'state' },
    { day: 15, title: 'День Конституции Республики Беларусь', kind: 'commemorate' },
    { day: 25, title: 'День работника культуры', kind: 'commemorate' },
  ],
  3: [
    { day: 2, title: 'День единения народов Беларуси и России', kind: 'commemorate' },
    { day: 7, title: 'День пожарной службы', kind: 'commemorate' },
    { day: 26, title: 'День Чернобыльской трагедии', kind: 'commemorate' },
  ],
  4: [
    { day: 1, title: 'Праздник труда', kind: 'state' },
    { day: 9, title: 'День Победы', kind: 'state' },
    { day: 15, title: 'Международный день семьи', kind: 'commemorate' },
    { day: 18, title: 'День государственной символики Республики Беларусь', kind: 'commemorate' },
  ],
  5: [
    { day: 1, title: 'Международный день защиты детей', kind: 'commemorate' },
    { day: 22, title: 'День скорби (начало Великой Отечественной войны, 1941)', kind: 'commemorate' },
  ],
  6: [
    { day: 3, title: 'День Независимости Республики Беларусь', kind: 'state' },
    { day: 21, title: 'День Национального собрания Беларуси (первое заседание, 1996)', kind: 'commemorate' },
  ],
  7: [
    { day: 2, title: 'День десантно-штурмовых войск', kind: 'commemorate' },
    { day: 16, title: 'День строителя', kind: 'commemorate' },
  ],
  8: [
    { day: 1, title: 'День знаний', kind: 'commemorate' },
    { day: 3, title: 'День белорусской письменности', kind: 'commemorate' },
    { day: 21, title: 'Международный день мира', kind: 'commemorate' },
  ],
  9: [
    { day: 1, title: 'Международный день пожилых людей', kind: 'commemorate' },
    { day: 4, title: 'День учителя', kind: 'commemorate' },
    { day: 14, title: 'День матери', kind: 'state' },
  ],
  10: [
    { day: 7, title: 'День Октябрьской революции', kind: 'state' },
    { day: 21, title: 'Всебелорусский день письменности', kind: 'commemorate' },
  ],
  11: [
    { day: 25, title: 'Рождество Христово (католическое)', kind: 'state' },
  ],
};

export const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
