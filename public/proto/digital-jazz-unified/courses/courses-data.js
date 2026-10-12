'use strict';
/* Курсы: демо-датасет, общий для каталога, кабинета ученика и кабинета автора.
   Деньги — в рублях (как гонорары туров), не в Джазиксах магазина: курс — настоящая покупка, не косметика. */
window.fmtRub = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';

window.COURSES = [
  {
    id: 1, slug: 'scratch-zero', title: 'Скретч с нуля', instructor: 'DJ Контур',
    topic: 'Скретч', level: 'Начинающий', price: 4900, grad: 'var(--dj-avatar-6)',
    status: 'published', students: 214, revenueTotal: 1048600, revenueMonth: 93100, completion: 61,
    summary: 'Постановка руки, базовые скретчи, первый номер под бит — за 8 модулей с разбором чужих ошибок и видео-проверкой домашних заданий.',
    learn: ['Держать ритм без метронома на слух', 'Три базовых скретча и их склейки', 'Собрать 30-секундный номер под бит', 'Разбирать чужие сеты по технике'],
    modules: [
      { name: 'Матчасть и постановка руки', lessons: [
        { title: 'Пластинка, слипмат, игла — что от чего зависит', kind: 'video', min: 9 },
        { title: 'Постановка руки: разбор частых ошибок', kind: 'video', min: 14 },
        { title: 'Домашнее задание: видео постановки руки', kind: 'task', min: 5 },
      ]},
      { name: 'Baby scratch и chirp', lessons: [
        { title: 'Baby scratch — техника и ритм', kind: 'video', min: 11 },
        { title: 'Chirp: добавляем щелчок кроссфейдером', kind: 'video', min: 13 },
        { title: 'Материалы: разбор движения по кадрам', kind: 'doc', min: 4 },
      ]},
      { name: 'Transformer и flare', lessons: [
        { title: 'Transformer scratch', kind: 'video', min: 16 },
        { title: 'Flare: три варианта щелчка', kind: 'video', min: 15 },
      ]},
      { name: 'Собираем номер', lessons: [
        { title: 'Склейка скретчей в фразу', kind: 'video', min: 12 },
        { title: 'Выбор бита под номер', kind: 'video', min: 8 },
        { title: 'Финальное задание: 30 секунд под бит', kind: 'task', min: 5 },
      ]},
    ],
  },
  {
    id: 2, slug: 'mixing-mastering', title: 'Сведение и мастеринг в Ableton', instructor: 'DJ Вектор',
    topic: 'Продюсирование', level: 'Средний', price: 7900, grad: 'var(--dj-avatar-3)',
    status: 'published', students: 89, revenueTotal: 703100, revenueMonth: 47400, completion: 48,
    summary: 'От сырого микса до трека, который не стыдно отдать на мастеринг: громкость, панорама, компрессия шины, референс-трек.',
    learn: ['Выставлять громкость и панораму без перегруза шины', 'Компрессия и сайдчейн на практике', 'Работа с референс-треком', 'Чек-лист перед отправкой на мастеринг'],
    modules: [
      { name: 'Подготовка проекта', lessons: [
        { title: 'Гейн-стейджинг и шины', kind: 'video', min: 12 },
        { title: 'Референс-трек: как выбрать и использовать', kind: 'video', min: 10 },
      ]},
      { name: 'Сведение', lessons: [
        { title: 'EQ: расчистка частот между партиями', kind: 'video', min: 18 },
        { title: 'Компрессия шины барабанов', kind: 'video', min: 14 },
        { title: 'Сайдчейн на баса и кик', kind: 'video', min: 9 },
      ]},
      { name: 'Мастеринг', lessons: [
        { title: 'Лимитер и целевая громкость (LUFS)', kind: 'video', min: 11 },
        { title: 'Проверка на разных колонках', kind: 'video', min: 7 },
        { title: 'Домашнее задание: свести свой трек', kind: 'task', min: 5 },
      ]},
    ],
  },
  {
    id: 3, slug: 'club-set', title: 'Как собрать сет для клуба', instructor: 'DJ Искра',
    topic: 'Диджеинг', level: 'Начинающий', price: 3500, grad: 'var(--dj-avatar-1)',
    status: 'published', students: 341, revenueTotal: 1193500, revenueMonth: 61200, completion: 74,
    summary: 'Драматургия сета от разогрева до пика, подбор трек-листа под формат площадки, живой разбор трёх реальных сетов.',
    learn: ['Строить драматургию сета по времени', 'Подбирать трек-лист под формат площадки', 'Переходы без потери энергии зала', 'Читать реакцию зала и менять план на ходу'],
    modules: [
      { name: 'Драматургия', lessons: [
        { title: 'Разогрев, пик, остывание — три фазы вечера', kind: 'video', min: 13 },
        { title: 'Разбор реального сета: клубный пик', kind: 'video', min: 19 },
      ]},
      { name: 'Трек-лист', lessons: [
        { title: 'Подбор музыки под формат площадки', kind: 'video', min: 10 },
        { title: 'Домашнее задание: собрать трек-лист на час', kind: 'task', min: 5 },
      ]},
      { name: 'Переходы и зал', lessons: [
        { title: 'Переходы без провисания энергии', kind: 'video', min: 12 },
        { title: 'Чтение зала и импровизация по ходу', kind: 'video', min: 11 },
      ]},
    ],
  },
  {
    id: 4, slug: 'booking-fees', title: 'Промо и бронирования: как получать гонорары', instructor: 'DJ Пульс',
    topic: 'Бизнес', level: 'Средний', price: 5200, grad: 'var(--dj-avatar-5)',
    status: 'enrolling', students: 12, revenueTotal: 62400, revenueMonth: 62400, completion: 0,
    summary: 'Пресс-кит, переговоры с промоутерами, райдер и договор — практический курс о стороне диджеинга, которую не преподают.',
    learn: ['Собрать пресс-кит, который открывают', 'Называть и отстаивать свой гонорар', 'Базовые пункты договора и райдера', 'Где искать промоутеров и как выходить на связь'],
    modules: [
      { name: 'Пресс-кит', lessons: [
        { title: 'Что должно быть в пресс-ките', kind: 'video', min: 9 },
        { title: 'Разбор чужих пресс-китов: что работает', kind: 'video', min: 12 },
      ]},
      { name: 'Переговоры', lessons: [
        { title: 'Как называть гонорар и не продешевить', kind: 'video', min: 14 },
        { title: 'Договор и райдер: обязательные пункты', kind: 'doc', min: 6 },
      ]},
    ],
  },
  {
    id: 5, slug: 'field-sound-rider', title: 'Полевой звук и райдер', instructor: 'DJ Контур',
    topic: 'Оборудование', level: 'Профи', price: 6400, grad: 'var(--dj-avatar-2)',
    status: 'draft', students: 0, revenueTotal: 0, revenueMonth: 0, completion: 0,
    summary: 'Технический райдер под разные площадки, саундчек за 15 минут, что делать, если звук на площадке «не тот».',
    learn: ['Составлять технический райдер под формат площадки', 'Быстрый саундчек', 'Решать проблемы со звуком на месте'],
    modules: [
      { name: 'Райдер', lessons: [
        { title: 'Технический райдер: структура', kind: 'video', min: 10 },
      ]},
      { name: 'На площадке', lessons: [
        { title: 'Саундчек за 15 минут', kind: 'video', min: 11 },
      ]},
    ],
  },
];

window.courseById = id => window.COURSES.find(c => String(c.id) === String(id));

/* Запись ученика DJ Леший (демо-профиль этой сборки) на курсы — общее состояние для student.html */
window.ENROLLMENTS = [
  { courseId: 1, progress: 42, status: 'active', lastLesson: { module: 1, lesson: 1 }, nextLesson: { module: 2, lesson: 1 } },
  { courseId: 3, progress: 100, status: 'done' },
];
window.WISHLIST = [2];

/* Ростер — выборка последних активных учеников (демо, не весь список) */
window.ROSTER = {
  1: [
    { name: 'Аня К.', progress: 78, last: '2 дня назад' },
    { name: 'Тимур С.', progress: 42, last: 'сегодня' },
    { name: 'Оля Д.', progress: 100, last: 'неделю назад' },
    { name: 'Денис П.', progress: 15, last: 'вчера' },
    { name: 'Марго Л.', progress: 60, last: 'сегодня' },
    { name: 'Рустам Ж.', progress: 8, last: '3 дня назад' },
  ],
  5: [],
};
