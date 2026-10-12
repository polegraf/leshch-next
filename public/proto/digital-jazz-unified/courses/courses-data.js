'use strict';
/* Курсы: демо-датасет, общий для каталога, кабинета ученика и кабинета автора.
   Деньги — в рублях (как гонорары туров), не в Джазиксах магазина: курс — настоящая покупка, не косметика.

   Урок (lesson): { title, kind:'video'|'doc'|'task'|'test', min,
     video:{ note }                                   — кратко о чём видео (+ ссылка, когда есть)
     doc:{ text }                                      — текстовый материал урока
     task:{ task, deliverable }                         — что сделать + что прислать на проверку
     test:{ questions:[{q, options:[...], correct}], passScore } — проверочный тест
   }
   Условия доступа курса (access): { free, durationType:'unlimited'|'timed', days } — независимо от price:
   free=true — курс открыт без оплаты; durationType='timed' — доступ открыт на days дней с момента записи. */
window.fmtRub = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';

window.COURSES = [
  {
    id: 1, slug: 'scratch-zero', title: 'Скретч с нуля', instructor: 'DJ Контур',
    topic: 'Скретч', level: 'Начинающий', price: 4900, grad: 'var(--dj-avatar-6)',
    status: 'published', students: 214, revenueTotal: 1048600, revenueMonth: 93100, completion: 61,
    access: { free: false, durationType: 'unlimited', days: 0 },
    summary: 'Постановка руки, базовые скретчи, первый номер под бит — за 4 модуля с разбором чужих ошибок и видео-проверкой домашних заданий.',
    learn: ['Держать ритм без метронома на слух', 'Три базовых скретча и их склейки', 'Собрать 30-секундный номер под бит', 'Разбирать чужие сеты по технике'],
    modules: [
      { name: 'Матчасть и постановка руки', lessons: [
        { title: 'Пластинка, слипмат, игла — что от чего зависит', kind: 'video', min: 9,
          video: { note: 'Разбираем три влияющих на скретч параметра: вес иглы, скольжение слипмата, натяжение пластинки.' } },
        { title: 'Постановка руки: разбор частых ошибок', kind: 'video', min: 14,
          video: { note: 'Съёмка руки сверху в замедлении + три типичные ошибки новичков.' } },
        { title: 'Домашнее задание: видео постановки руки', kind: 'task', min: 5,
          task: { task: 'Снимите руку сверху 20 секунд baby scratch на свободном тайминге.', deliverable: 'Видео-файл или ссылка на загрузку' } },
      ]},
      { name: 'Baby scratch и chirp', lessons: [
        { title: 'Baby scratch — техника и ритм', kind: 'video', min: 11,
          video: { note: 'Движение вперёд-назад под метроном на 4 скорости.' } },
        { title: 'Chirp: добавляем щелчок кроссфейдером', kind: 'video', min: 13,
          video: { note: 'Синхронизация руки на пластинке с щелчком кроссфейдера.' } },
        { title: 'Материалы: разбор движения по кадрам', kind: 'doc', min: 4,
          doc: { text: 'Покадровая раскладка baby scratch и chirp.\n\n1. Рука толкает пластинку вперёд на полтакта — звук идёт вверх по тону.\n2. Возврат руки — звук идёт вниз. Кроссфейдер в это время держим открытым.\n3. Для chirp добавляем короткое закрытие кроссфейдера ровно в момент смены направления руки — получается щелчок.\n\nЧастая ошибка — щёлкать кроссфейдером с опережением. Тренируйте отдельно руку и отдельно фейдер, потом соединяйте.' } },
      ]},
      { name: 'Transformer и flare', lessons: [
        { title: 'Transformer scratch', kind: 'video', min: 16,
          video: { note: 'Рваный ритм кроссфейдером без движения пластинки.' } },
        { title: 'Flare: три варианта щелчка', kind: 'video', min: 15,
          video: { note: 'Flare на 2, 3 и 4 щелчка — от простого к сложному.' } },
      ]},
      { name: 'Собираем номер', lessons: [
        { title: 'Склейка скретчей в фразу', kind: 'video', min: 12,
          video: { note: 'Соединяем baby scratch, chirp и transformer во фразу на 8 тактов.' } },
        { title: 'Выбор бита под номер', kind: 'video', min: 8,
          video: { note: 'На что смотреть при выборе бита: темп, пустое место под скретч, тональность.' } },
        { title: 'Финальное задание: 30 секунд под бит', kind: 'task', min: 5,
          task: { task: 'Соберите номер на 30 секунд под любой бит, используя минимум 3 изученные техники.', deliverable: 'Видео или аудиозапись номера' } },
        { title: 'Финальный тест: термины и техника', kind: 'test', min: 6,
          test: {
            questions: [
              { q: 'Что отличает chirp от baby scratch?', options: ['Щелчок кроссфейдером в момент смены направления руки', 'Более тяжёлая игла', 'Скретч только одной рукой'], correct: 0 },
              { q: 'Transformer scratch делается в основном за счёт…', options: ['Движения пластинки вперёд-назад', 'Ритмичной работы кроссфейдером', 'Смены скорости вращения'], correct: 1 },
              { q: 'Сколько базовых вариантов щелчка разобрано в уроке про flare?', options: ['Два', 'Три', 'Пять'], correct: 1 },
            ],
            passScore: 70,
          } },
      ]},
    ],
  },
  {
    id: 2, slug: 'mixing-mastering', title: 'Сведение и мастеринг в Ableton', instructor: 'DJ Вектор',
    topic: 'Продюсирование', level: 'Средний', price: 7900, oldPrice: 9900, grad: 'var(--dj-avatar-3)',
    status: 'published', students: 89, revenueTotal: 703100, revenueMonth: 47400, completion: 48,
    access: { free: false, durationType: 'timed', days: 180 },
    summary: 'От сырого микса до трека, который не стыдно отдать на мастеринг: громкость, панорама, компрессия шины, референс-трек. Доступ открыт на 180 дней — курс обновляется под актуальную версию Ableton, старые записи закрываются.',
    learn: ['Выставлять громкость и панораму без перегруза шины', 'Компрессия и сайдчейн на практике', 'Работа с референс-треком', 'Чек-лист перед отправкой на мастеринг'],
    modules: [
      { name: 'Подготовка проекта', lessons: [
        { title: 'Гейн-стейджинг и шины', kind: 'video', min: 12, video: { note: 'Раскладка проекта по шинам и выставление стартовой громкости каждой партии.' } },
        { title: 'Референс-трек: как выбрать и использовать', kind: 'video', min: 10, video: { note: 'Подбор референса по жанру и сверка громкости через калибровку.' } },
      ]},
      { name: 'Сведение', lessons: [
        { title: 'EQ: расчистка частот между партиями', kind: 'video', min: 18, video: { note: 'Вычитающий эквалайзинг на примере кика и баса.' } },
        { title: 'Компрессия шины барабанов', kind: 'video', min: 14, video: { note: 'Настройка attack/release под сохранение атаки.' } },
        { title: 'Сайдчейн на баса и кик', kind: 'video', min: 9, video: { note: 'Классическая сайдчейн-цепочка без просадки низа.' } },
      ]},
      { name: 'Мастеринг', lessons: [
        { title: 'Лимитер и целевая громкость (LUFS)', kind: 'video', min: 11, video: { note: 'Целевые значения LUFS под стриминг-площадки.' } },
        { title: 'Проверка на разных колонках', kind: 'video', min: 7, video: { note: 'Чек-лист: студийные мониторы → наушники → телефон → машина.' } },
        { title: 'Домашнее задание: свести свой трек', kind: 'task', min: 5,
          task: { task: 'Сведите один свой трек, применив гейн-стейджинг, EQ-расчистку и сайдчейн из уроков.', deliverable: 'Файл WAV/MP3 + скринкаст сведения' } },
      ]},
    ],
  },
  {
    id: 3, slug: 'club-set', title: 'Как собрать сет для клуба', instructor: 'DJ Искра',
    topic: 'Диджеинг', level: 'Начинающий', price: 3500, grad: 'var(--dj-avatar-1)',
    status: 'published', students: 341, revenueTotal: 1193500, revenueMonth: 61200, completion: 74,
    access: { free: false, durationType: 'unlimited', days: 0 },
    summary: 'Драматургия сета от разогрева до пика, подбор трек-листа под формат площадки, живой разбор трёх реальных сетов.',
    learn: ['Строить драматургию сета по времени', 'Подбирать трек-лист под формат площадки', 'Переходы без потери энергии зала', 'Читать реакцию зала и менять план на ходу'],
    modules: [
      { name: 'Драматургия', lessons: [
        { title: 'Разогрев, пик, остывание — три фазы вечера', kind: 'video', min: 13, video: { note: 'Тайминг трёх фаз на примере вечера с 23:00 до 4:00.' } },
        { title: 'Разбор реального сета: клубный пик', kind: 'video', min: 19, video: { note: 'Трек-лист и переходы реального пикового часа с разбором решений.' } },
      ]},
      { name: 'Трек-лист', lessons: [
        { title: 'Подбор музыки под формат площадки', kind: 'video', min: 10, video: { note: 'Чем отличается трек-лист для бара, клуба и open air.' } },
        { title: 'Домашнее задание: собрать трек-лист на час', kind: 'task', min: 5,
          task: { task: 'Соберите трек-лист на час под конкретную площадку (укажите какую) с драматургией разогрев-пик-спад.', deliverable: 'Плейлист (ссылка) + таймкоды фаз' } },
      ]},
      { name: 'Переходы и зал', lessons: [
        { title: 'Переходы без провисания энергии', kind: 'video', min: 12, video: { note: 'Техники переходов, которые не сбрасывают энергию зала.' } },
        { title: 'Чтение зала и импровизация по ходу', kind: 'video', min: 11, video: { note: 'Сигналы от зала и как по ним перестраивать план сета на лету.' } },
      ]},
    ],
  },
  {
    id: 4, slug: 'booking-fees', title: 'Промо и бронирования: как получать гонорары', instructor: 'DJ Пульс',
    topic: 'Бизнес', level: 'Средний', price: 5200, grad: 'var(--dj-avatar-5)',
    status: 'enrolling', students: 12, revenueTotal: 62400, revenueMonth: 62400, completion: 0,
    access: { free: false, durationType: 'unlimited', days: 0 },
    summary: 'Пресс-кит, переговоры с промоутерами, райдер и договор — практический курс о стороне диджеинга, которую не преподают.',
    learn: ['Собрать пресс-кит, который открывают', 'Называть и отстаивать свой гонорар', 'Базовые пункты договора и райдера', 'Где искать промоутеров и как выходить на связь'],
    modules: [
      { name: 'Пресс-кит', lessons: [
        { title: 'Что должно быть в пресс-ките', kind: 'video', min: 9, video: { note: 'Структура пресс-кита: фото, биография, техрайдер, ссылки на сеты.' } },
        { title: 'Разбор чужих пресс-китов: что работает', kind: 'video', min: 12, video: { note: 'Пять реальных пресс-китов — что цепляет промоутера, что отталкивает.' } },
      ]},
      { name: 'Переговоры', lessons: [
        { title: 'Как называть гонорар и не продешевить', kind: 'video', min: 14, video: { note: 'Скрипты ответа на «а сколько вы хотите» в разных форматах площадок.' } },
        { title: 'Договор и райдер: обязательные пункты', kind: 'doc', min: 6,
          doc: { text: 'Минимальный набор пунктов договора на выступление.\n\n— Дата, время выхода, продолжительность сета.\n— Сумма гонорара, валюта, срок и способ оплаты (аванс/постоплата).\n— Условие отмены: кто и когда может отменить без штрафа.\n— Техрайдер — приложением, а не «на словах».\n— Проезд/проживание — отдельной строкой, если не включены в гонорар.\n\nБез письменной фиксации хотя бы этих пунктов — ссылаться не на что, если промоутер передвинет время или не заплатит вовремя.' } },
      ]},
    ],
  },
  {
    id: 5, slug: 'field-sound-rider', title: 'Полевой звук и райдер', instructor: 'DJ Контур',
    topic: 'Оборудование', level: 'Профи', price: 0, grad: 'var(--dj-avatar-2)',
    status: 'draft', students: 0, revenueTotal: 0, revenueMonth: 0, completion: 0,
    access: { free: true, durationType: 'unlimited', days: 0 },
    summary: 'Технический райдер под разные площадки, саундчек за 15 минут, что делать, если звук на площадке «не тот». Бесплатный вводный курс — без оплаты, доступ открыт сразу после записи.',
    learn: ['Составлять технический райдер под формат площадки', 'Быстрый саундчек', 'Решать проблемы со звуком на месте'],
    modules: [
      { name: 'Райдер', lessons: [
        { title: 'Технический райдер: структура', kind: 'video', min: 10, video: { note: 'Разделы райдера и что обязательно указывать под открытую и закрытую площадку.' } },
      ]},
      { name: 'На площадке', lessons: [
        { title: 'Саундчек за 15 минут', kind: 'video', min: 11, video: { note: 'Порядок проверки по чек-листу, укладывающийся в 15 минут.' } },
      ]},
    ],
  },
];

window.courseById = id => window.COURSES.find(c => String(c.id) === String(id));

/* Демо-профиль ученика этой сборки */
window.STUDENT_NAME = 'DJ Леший';

/* Настройки по умолчанию + постоянные id уроков (прогресс и сдачи привязаны к id, а не к порядку,
   поэтому автор может переставлять уроки, не ломая прогресс учеников).
   grading:     { reviewTasks — задания проверяет автор (иначе засчитываются сразу), testAttempts — попыток на тест, 0 = без ограничений }
   certificate: { enabled, requireTests — все тесты сданы, requireTasks — все задания приняты } */
window.normalizeCourses = function () {
  window.COURSES.forEach(function (c) {
    c.access = c.access || { free: false, durationType: 'unlimited', days: 30 };
    c.grading = c.grading || { reviewTasks: true, testAttempts: 0 };
    c.certificate = c.certificate || { enabled: true, requireTests: true, requireTasks: true };
    c.learn = c.learn || [];
    c.modules.forEach(function (m, mi) {
      m.lessons.forEach(function (l, li) { if (!l.id) l.id = c.id + '-' + mi + '-' + li; });
    });
  });
};
window.normalizeCourses();
window.COURSES[1].grading.testAttempts = 3;

/* Запись ученика на курсы: done — id пройденных уроков, tests — результаты тестов по id урока */
window.ENROLLMENTS = [
  { courseId: 1, status: 'active', startedAt: '2026-09-02', done: ['1-0-0', '1-0-1', '1-0-2', '1-1-0', '1-1-1'], tests: {} },
  { courseId: 3, status: 'done', startedAt: '2026-08-10', done: ['3-0-0', '3-0-1', '3-1-0', '3-1-1', '3-2-0', '3-2-1'], tests: {}, certAt: '2026-09-28' },
];
window.WISHLIST = [2];

/* Сдачи заданий: status 'pending' (ждёт проверки) | 'accepted' (принято) | 'returned' (на доработку) */
window.SUBMISSIONS = [
  { id: 's1', courseId: 1, lessonId: '1-0-2', student: 'DJ Леший', at: '2026-09-04', status: 'accepted',
    answer: 'Снял сверху на телефон, 20 секунд baby scratch: youtu.be/demo-hand',
    comment: 'Рука стоит ровно, кисть расслаблена — принято. Следи за локтем на быстрых движениях.' },
  { id: 's2', courseId: 3, lessonId: '3-1-1', student: 'DJ Леший', at: '2026-08-20', status: 'accepted',
    answer: 'Трек-лист на час для бара «Ласточка»: open.spotify.com/demo — разогрев до 0:20, пик 0:20–0:45, спад после.',
    comment: 'Хорошая драматургия, пик чуть затянут — но засчитываю.' },
  { id: 's3', courseId: 1, lessonId: '1-0-2', student: 'Аня К.', at: '2026-10-11', status: 'pending',
    answer: 'Видео постановки руки: drive.google.com/demo-anya — снимала сверху, 20 секунд, темп 90.' },
  { id: 's4', courseId: 1, lessonId: '1-0-2', student: 'Тимур С.', at: '2026-10-12', status: 'pending',
    answer: 'youtu.be/demo-timur — на быстром темпе рука уходит в сторону, не могу удержать.' },
  { id: 's5', courseId: 1, lessonId: '1-3-2', student: 'Оля Д.', at: '2026-10-05', status: 'accepted',
    answer: 'Номер на 30 секунд под бит 92 BPM: youtu.be/demo-olya', comment: 'Чисто, flare уверенный. Принято!' },
  { id: 's6', courseId: 1, lessonId: '1-3-2', student: 'Марго Л.', at: '2026-10-09', status: 'returned',
    answer: 'youtu.be/demo-margo', comment: 'Только две техники из трёх — добавь transformer и пришли снова.' },
];

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

/* Демо-состояние живёт в браузере (localStorage): созданный автором курс, правки программы, цена,
   оценки, запись, прогресс и сдачи заданий не пропадают при переходе между каталогом,
   кабинетом автора и кабинетом ученика. resetCourses() возвращает исходные демо-данные. */
(function () {
  var KEY = 'dj-courses-v2';
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Array.isArray(saved.courses)) {
      window.COURSES = saved.courses;
      if (Array.isArray(saved.enrollments)) window.ENROLLMENTS = saved.enrollments;
      if (Array.isArray(saved.wishlist)) window.WISHLIST = saved.wishlist;
      if (Array.isArray(saved.submissions)) window.SUBMISSIONS = saved.submissions;
      window.normalizeCourses();
    }
  } catch (e) {}
  window.saveCourses = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        courses: window.COURSES, enrollments: window.ENROLLMENTS,
        wishlist: window.WISHLIST, submissions: window.SUBMISSIONS,
      }));
    } catch (e) {}
  };
  window.resetCourses = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };
})();
