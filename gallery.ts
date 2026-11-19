export type GalleryImage = { url: string; label: string };

export type GalleryCategory = { key: string; label: string; images: GalleryImage[] };

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  {
    key: 'belarus',
    label: 'Беларусь',
    images: [
      { url: '/gallery-belarus-fields.webp', label: 'Поля и аист' },
      { url: '/gallery-belarus-cornflowers.webp', label: 'Васильковое поле' },
      { url: '/gallery-belarus-lakes.webp', label: 'Лесное озеро' },
      { url: '/gallery-belarus-castle.webp', label: 'Старинный замок' },
      { url: '/gallery-belarus-storks.webp', label: 'Аисты на лугу' },
    ],
  },
  {
    key: 'family',
    label: 'Моя семья',
    images: [
      { url: '/gallery-family-table.webp', label: 'Семейный ужин' },
      { url: '/gallery-family-walk.webp', label: 'Прогулка всей семьёй' },
      { url: '/gallery-family-grandparents.webp', label: 'Бабушка и дедушка с внуком' },
      { url: '/gallery-family-tea.webp', label: 'Готовим вместе' },
      { url: '/gallery-family-evening.webp', label: 'Вечерняя сказка' },
    ],
  },
  {
    key: 'health',
    label: 'Моё здоровье',
    images: [
      { url: '/gallery-health-bike.webp', label: 'Велопрогулка' },
      { url: '/gallery-health-exercise.webp', label: 'Зарядка' },
      { url: '/gallery-health-food.webp', label: 'Здоровый завтрак' },
      { url: '/gallery-health-sleep.webp', label: 'Крепкий сон' },
      { url: '/gallery-health-outdoors.webp', label: 'Игры на воздухе' },
    ],
  },
  {
    key: 'homeland',
    label: 'Моя родина',
    images: [
      { url: '/gallery-homeland-village.webp', label: 'Родная деревня' },
      { url: '/gallery-homeland-river.webp', label: 'Река детства' },
      { url: '/gallery-homeland-sunset.webp', label: 'Закат над полями' },
      { url: '/gallery-homeland-birches.webp', label: 'Берёзовая роща' },
      { url: '/gallery-homeland-forest.webp', label: 'Лесная тропинка' },
    ],
  },
  {
    key: 'wellbeing',
    label: 'Психологическое благополучие',
    images: [
      { url: '/gallery-wellbeing-talk.webp', label: 'Разговор по душам' },
      { url: '/gallery-wellbeing-breathing.webp', label: 'Спокойное дыхание' },
      { url: '/gallery-wellbeing-friends.webp', label: 'Поддержка друга' },
      { url: '/gallery-wellbeing-morning.webp', label: 'Тихое утро' },
      { url: '/gallery-wellbeing-nature.webp', label: 'Отдых на природе' },
    ],
  },
  {
    key: 'school',
    label: 'Школа и учёба',
    images: [
      { url: '/gallery-school-board.webp', label: 'Урок в классе' },
      { url: '/gallery-school-desks.webp', label: 'Работа в тетрадях' },
      { url: '/gallery-school-reading.webp', label: 'Чтение в библиотеке' },
      { url: '/gallery-school-group.webp', label: 'Работа в группе' },
      { url: '/gallery-school-supplies.webp', label: 'Школьные принадлежности' },
    ],
  },
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
