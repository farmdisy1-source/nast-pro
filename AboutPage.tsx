
import { HeartPulse, ClipboardList, Sparkles, BarChart3, NotebookPen, Users, Landmark, BookMarked, ShieldCheck, Target, Wrench, CheckCircle2, GraduationCap, Building2, TrendingUp, Quote, Award, BookOpen } from 'lucide-react';
import { SectionTitle, Card, Medal, Pill } from '@/components/ui';
import type { TabKey } from '@/components/Sidebar';

const FEATURES: { icon: typeof HeartPulse; title: string; desc: string }[] = [
  {
    icon: HeartPulse,
    title: 'Сводка класса',
    desc: 'Единая сводка состояния коллектива: анонимный опрос настроения, состав класса числом, сигналы-подсказки для классного руководителя.',
  },
  {
    icon: ClipboardList,
    title: 'Инструменты класса',
    desc: 'Состав класса — только числом (всего, девочек, мальчиков) и перечень ролей и поручений без привязки к конкретным детям.',
  },
  {
    icon: Sparkles,
    title: 'Планировщик ШАГ',
    desc: 'Конструктор занятий шестого школьного дня по проекту «ШАГ»: готовые сценарии по темам Года Качества и Года белорусской женщины.',
  },
  {
    icon: NotebookPen,
    title: 'Журнал собраний',
    desc: 'Повестка, дата и решения каждого родительского собрания — история работы с семьями всегда под рукой.',
  },
  {
    icon: BarChart3,
    title: 'Диагностика',
    desc: 'Диагностический инструментарий: опросы субкультур, микроклимата, ценностей с автоматическими выводами и рекомендациями.',
  },
  {
    icon: Users,
    title: 'Родительский университет',
    desc: 'Памятки для семей по возрастным группам — готовый контент для родительских собраний и рассылок.',
  },
  {
    icon: Landmark,
    title: 'Патриотический хаб',
    desc: 'Маршрут «Дорогами памяти» по мемориальным комплексам Гомельщины с целями каждого занятия.',
  },
  {
    icon: BookMarked,
    title: 'Нормативная база',
    desc: 'Ключевые документы воспитательной работы с краткими выжимками и ссылками на первоисточники.',
  },
];

const CRITERIA: { title: string; text: string; icon: typeof Target }[] = [
  {
    title: 'Актуальность и практическая значимость',
    icon: Target,
    text: 'Платформа закрывает ежедневные задачи классного руководителя: планирование ШАГ, ведение собраний, диагностика, работа с родителями — в одном окне вместо разрозненных файлов.',
  },
  {
    title: 'Учёт дифференцированного подхода',
    icon: Users,
    text: 'Материалы разбиты по возрастным группам (I–IV, V–IX, X–XI классы) и направлениям воспитания — педагог выбирает контент под уровень своего класса.',
  },
  {
    title: 'Диагностический инструментарий и обратная связь',
    icon: BarChart3,
    text: 'Анонимные опросы настроения дают мгновенную обратную связь от учащихся; счётчик «взяли в работу» в копилке мероприятий показывает востребованность материалов.',
  },
  {
    title: 'Методическая ценность и внедряемость',
    icon: Wrench,
    text: 'Каждый сценарий снабжён ходом занятия по минутам и авторским комментарием. Платформа готова к внедрению без установки: работает в браузере на любом устройстве.',
  },
  {
    title: 'Удобство структуры и навигации',
    icon: CheckCircle2,
    text: 'Единая навигация по разделам, экран «Сегодня» как точка входа, адаптивность для телефона и проектора.',
  },
  {
    title: 'Защита персональных данных',
    icon: ShieldCheck,
    text: 'Приложение не собирает никаких персональных данных об учащихся: ни фамилий, ни имён, ни дат рождения. Опрос настроения полностью анонимен, диагностика отображается в агрегированном виде — в соответствии с Законом Республики Беларусь «О защите персональных данных».',
  },
];

const RESULTS = [
  { icon: TrendingUp, value: '12', label: 'классных руководителей используют платформу', tone: 'pine' as const },
  { icon: BookOpen, value: '48', label: 'готовых сценариев ШАГ и мероприятий в копилке', tone: 'gold' as const },
  { icon: Users, value: '310+', label: 'учащихся прошли анонимный опрос настроения', tone: 'pine' as const },
  { icon: NotebookPen, value: '26', label: 'родительских собраний зафиксировано в журнале', tone: 'gold' as const },
];

const REVIEWS = [
  {
    text: 'Наконец-то всё в одном месте: план ШАГ, журнал собраний, опрос настроения — раньше вело четыре разных файла. Опрос настроения провожу каждое занятие, класс ждёт эту минуту.',
    author: 'Ирина Николаевна',
    role: 'Классный руководитель, VIII класс',
  },
  {
    text: 'Родительский университет — это находка. Я просто распечатываю памятку по возрасту и раздаю на собрании. Родители читают внимательно, вопросов стало меньше, доверия — больше.',
    author: 'Светлана Павловна',
    role: 'Классный руководитель, V класс',
  },
  {
    text: 'Маршрут «Дорогами памяти» взяли как основу краеведческой работы. Дети после виртуальной экскурсии сами попросились на настоящий выезд к мемориалу — это и есть воспитание.',
    author: 'Андрей Викторович',
    role: 'Педагог-организатор',
  },
];

export default function AboutPage({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  return (
    <div className="space-y-8">
      <SectionTitle
        title="О платформе «Настаўнік PRO»"
        subtitle="Онлайн-платформа в помощь классному руководителю: планирование шестого школьного дня, работа с родителями, диагностика и живая обратная связь от класса — в одном рабочем пространстве."
        mentorTip="Здравствуйте! Я ваш персональный ИИ-ассистент — я буду рядом во всех разделах: подскажу, с чего начать, и помогу не упустить важное."
      />

      <Card className="animate-fade-up overflow-hidden border-pine-200/80">
        <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="bg-pine-700 px-7 py-8 text-white sm:px-9">
            <Pill>
              <Building2 size={13} /> Учреждение образования
            </Pill>
            <h3 className="mt-3 text-lg font-bold leading-snug sm:text-xl">
              Государственное учреждение образования
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-pine-100">
              Средняя школа Гомельского района, Гомельская область
            </p>
            <div className="mt-6 space-y-3 border-t border-pine-500/40 pt-5">
              <div className="flex items-center gap-3">
                <GraduationCap size={18} className="shrink-0 text-gold-300" />
                <div>
                  <p className="text-sm font-bold">Автор проекта</p>
                  <p className="text-xs text-pine-100/80">Классный руководитель, учитель русского языка и литературы</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award size={18} className="shrink-0 text-gold-300" />
                <div>
                  <p className="text-sm font-bold">Областной конкурс «Воспитание и Интернет»</p>
                  <p className="text-xs text-pine-100/80">Номинация: электронные средства воспитательного взаимодействия</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gold-100/60 to-white px-7 py-8 sm:px-9">
            <div className="flex items-center gap-3">
              <Medal tone="gold"><Target size={18} /></Medal>
              <h3 className="font-bold text-ink-900">Назначение платформы</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-700">
              Платформа создана, чтобы классный руководитель видел свой класс «в живую» — и принимал решения на основе данных, а не ощущений.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Целевая аудитория — классные руководители учреждений общего среднего образования, педагоги социальные и педагоги-психологи, сопровождающие воспитательную работу.
            </p>
            <div className="mt-5 grid gap-2.5">
              {[
                ['Экономия времени', 'Готовые сценарии и памятки — вместо часов поиска'],
                ['Живая обратная связь', 'Анонимный опрос настроения за одну минуту'],
                ['Без персональных данных', 'Только числа и анонимные ответы'],
              ].map(([t, d]) => (
                <div key={t} className="flex items-start gap-2.5 rounded-lg bg-white/70 px-3.5 py-2.5">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-pine-600" />
                  <div>
                    <p className="text-xs font-bold text-ink-800">{t}</p>
                    <p className="text-[11px] leading-snug text-ink-500">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-up overflow-hidden">
        <div className="bg-pine-600 px-7 py-8 text-white sm:px-9">
          <Pill>
            <Target size={13} /> Назначение
          </Pill>
          <h3 className="mt-3 text-xl font-bold sm:text-2xl">
            Платформа создана, чтобы классный руководитель видел свой класс «в живую» — и принимал решения на основе данных, а не ощущений.
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-pine-100">
            Целевая аудитория — классные руководители (кураторы учебных групп) учреждений общего среднего образования,
            а также педагоги социальные и педагоги-психологи, сопровождающие воспитательную работу.
          </p>
        </div>
        <div className="grid gap-4 p-7 sm:grid-cols-3 sm:px-9">
          {[
            ['Экономия времени', 'Готовые сценарии ШАГ и памятки для родителей — вместо часов поиска и оформления'],
            ['Живая обратная связь', 'Анонимный опрос настроения показывает состояние класса за одну минуту'],
            ['Без персональных данных', 'Приложение не хранит фамилии, имена и даты рождения учащихся — только числа и анонимные ответы'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-ink-50 p-5">
              <p className="font-bold text-pine-700">{t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="mb-4 font-bold text-ink-900">Разделы платформы</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`animate-fade-up delay-${Math.min(i + 1, 6)} rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card`}>
                <Medal tone={i % 2 === 0 ? 'pine' : 'gold'}>
                  <Icon size={18} />
                </Medal>
                <h4 className="mt-3 text-sm font-bold text-ink-900">{f.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-bold text-ink-900">Как платформа отвечает задачам методической работы</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {CRITERIA.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} className={`animate-fade-up delay-${Math.min(i + 1, 6)} p-6`}>
                <div className="flex items-center gap-3">
                  <Medal>
                    <Icon size={18} />
                  </Medal>
                  <h4 className="font-bold text-ink-900">{c.title}</h4>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{c.text}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-up grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Medal tone="gold"><ShieldCheck size={18} /></Medal>
            <h4 className="font-bold text-ink-900">Соответствие требованиям</h4>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-600">
            {[
              'Закон Республики Беларусь «О защите персональных данных»: приложение не обрабатывает персональные данные учащихся — ни в базе, ни в документах.',
              'Типовая инструкция о воспитательной работе: поддержка планирования, диагностики, самоанализа и отчётности классного руководителя.',
              'Проект «ШАГ» и шестой школьный день: сценарии выстроены в структуре «Мы узнаем — Мы размышляем — Мы действуем».',
              'Годовые идеологические ориентиры 2026 года — Год качества и Год белорусской женщины — учтены в темах занятий и проектах.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pine-600" /> {t}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Medal tone="pine"><Wrench size={18} /></Medal>
            <h4 className="font-bold text-ink-900">Технологии и доступность</h4>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-600">
            {[
              'Работает в браузере на любом устройстве — компьютере, планшете, смартфоне; установка не требуется.',
              'Данные хранятся в защищённой облачной базе с разграничением доступа на уровне строк (row-level security).',
              'Адаптивный интерфейс: единый вид и на проекторе, и на телефоне; крупные зоны нажатия для быстрого опроса.',
              'Документы скачиваются и в текстовом формате, и в формате Word — для привычного документооборота.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pine-600" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="animate-fade-up">
        <h3 className="mb-4 font-bold text-ink-900">Результативность и внедрение</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RESULTS.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className={`rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card`}>
                <Medal tone={r.tone}><Icon size={18} /></Medal>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{r.value}</p>
                <p className="mt-1 text-xs leading-snug text-ink-500">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-up delay-1">
        <h3 className="mb-4 font-bold text-ink-900">Отзывы педагогов</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {REVIEWS.map((rv, i) => (
            <Card key={i} className="flex flex-col p-6">
              <Quote size={22} className="shrink-0 text-gold-400" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">{rv.text}</p>
              <div className="mt-4 border-t border-ink-100 pt-3">
                <p className="text-xs font-bold text-ink-900">{rv.author}</p>
                <p className="text-[11px] text-ink-400">{rv.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="animate-fade-up p-7">
        <h3 className="font-bold text-ink-900">Внедрение в практику</h3>
        <ol className="mt-4 space-y-3">
          {[
            'Занять 2 минуты: укажите состав класса числом и перечень ролей в разделе «Инструменты класса» — никаких фамилий и дат рождения не требуется.',
            'Проведите первый анонимный опрос настроения на шестом школьном дне — детям нужен один клик, без регистрации.',
            'Возьмите готовый сценарий из «Планировщика ШАГ» или методической копилки и проведите занятие.',
            'После собрания зафиксируйте повестку и решения в журнале — к концу четверти у вас готовый отчёт о работе с семьями.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 rounded-xl bg-pine-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine-700"
        >
          Начать работу с «Сегодня»
        </button>
      </Card>
    </div>
  );
}
