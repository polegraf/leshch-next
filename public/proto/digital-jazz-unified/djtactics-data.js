'use strict';
/* Реальный профиль артиста — снимок публичных данных Digital Jazz.
   Источник: https://app.digitaljazz.ru/djtactics (публичный API node.digitaljazz.ru, без входа):
   /profile/djtactics, /services/{id}, /services/{id}/discography. Снято 12.10.2026.
   Ничего не дописано: пустые поля в оригинале остаются пустыми (свет в райдере, вертикальные видео, кейсы).
   Тестовые записи календаря и турниров («TEST», «ЕУЫВЕ») в снимок не попали — это не данные артиста. */
window.DJ_REAL = window.DJ_REAL || {};
window.DJ_REAL.djtactics = {
  source: 'https://app.digitaljazz.ru/djtactics',
  snapshot: '2026-10-12',
  name: 'DJ Tactics',
  slug: 'djtactics',
  city: 'Москва',
  avatar: 'https://storage.yandexcloud.net/digitaljazz-avatars/40d11963-428a-4d05-847e-c256796422c1/avatar.jpg',
  avatarY: 27,
  level: 2,
  since: '2026-03-25',
  tags: ['Диджей', 'Битмейкинг', 'Музыкальное продюсирование', 'Музыкант'],
  vouches: { 'Диджей': 1, 'Битмейкинг': 1, 'Музыкальное продюсирование': 1, 'Музыкант': 1 },
  genres: ['Хип-Хоп/Рэп', 'Дрилл', 'Фанк', 'Лоу-фай хип-хоп', 'Регги', 'Трэп', 'Рок'],
  genreLevels: { 'Хип-Хоп/Рэп': 5, 'Дрилл': 5, 'Фанк': 4, 'Лоу-фай хип-хоп': 3, 'Регги': 3, 'Трэп': 3, 'Рок': 2 },

  pressKit: [
    'Его выступления — это уникальное путешествие по жанрам от хип-хопа, грайма и дрила до экспериментальной электронной музыки, фанка и соул.',
    'Карьера DJ Tactics началась в 1998 году в качестве диджея на локальных брейк-данс вечеринках в Москве. В последующем совместно с DJ Vinilkin, DJ Chagin и DJ Pirumov основалась культовая диджейская команда — Flammable Beats.',
    'DJ Tactics выступал на одной сцене и успел поработать со множеством российских и международных артистов: Wu-Tang Clan, Ghostface Killah, GZA, Method Man, Snoop Dogg, Mix Master Mike, Nas, Redman, De La Soul, Matisyahu, Paul Oakenfold, DJ Todd Terry, Xzibit, Afu-ra, Jeru The Damaja, Beat Junkies, Баста, Ligalize, Centr, Slimus, Гуф, Тимати, Крипл; с оркестром в Доме Союзов исполнил произведение «Concerto for Turntables».',
  ],
  quote: { text: 'Это диджей и продюсер, повернутый на жирных битах, заставляющих толпу качать головой под биты!', by: 'Александр Кондуков, главный редактор Rolling Stone Россия' },

  /* статистика площадок — как её собирает приложение; обновлено 17.09.2026 */
  stats: {
    updated: '2026-09-17',
    listeners: 11347,     // Яндекс Музыка + Spotify, в месяц
    followers: 12788,     // Instagram + TikTok + VK + Spotify
    platforms: [
      { name: 'Instagram', kind: 'подписчики', value: 11172 },
      { name: 'Яндекс Музыка', kind: 'слушатели в месяц', value: 10007 },
      { name: 'Spotify', kind: 'слушатели в месяц', value: 1340 },
      { name: 'VK', kind: 'подписчики', value: 1141 },
      { name: 'TikTok', kind: 'подписчики', value: 361 },
      { name: 'Spotify', kind: 'подписчики', value: 114 },
    ],
  },

  links: [
    { label: 'Instagram', url: 'https://www.instagram.com/djtactics' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@tactics.dj' },
    { label: 'VK', url: 'https://vk.com/djtactics' },
    { label: 'Яндекс Музыка', url: 'https://music.yandex.ru/artist/3688077' },
    { label: 'Spotify', url: 'https://open.spotify.com/artist/1DlJQ6JromkHnfJEEaE5Vn' },
  ],

  photos: [
    'https://storage.yandexcloud.net/digitaljazz-avatars/press-photos/1782324367195.jpeg',
    'https://storage.yandexcloud.net/digitaljazz-avatars/press-photos/1782324372385.jpeg',
    'https://storage.yandexcloud.net/digitaljazz-avatars/press-photos/1782324379254.jpeg',
    'https://storage.yandexcloud.net/digitaljazz-avatars/press-photos/1782324386024.jpeg',
    'https://storage.yandexcloud.net/digitaljazz-avatars/press-photos/1782324391877.jpeg',
  ],
  portfolioVideo: 'https://storage.yandexcloud.net/digitaljazz-avatars/profile-videos/1782381586631.mp4',
  pressVideoH: 'https://storage.yandexcloud.net/digitaljazz-avatars/press-h/1782324359871.mp4',

  /* райдер «Основной», обновлён 08.10.2026, открыт для всех */
  rider: {
    name: 'Основной',
    updated: '2026-10-08',
    tech: [
      { item: 'Виниловый проигрыватель', model: 'Pioneer PLX-CRSS-12', qty: 2 },
      { item: 'Микшерный пульт', model: 'Pioneer DJM-S11 или S7', qty: 1 },
      { item: 'Звуковой монитор', model: '', qty: 2 },
    ],
    light: [],
    staff: [
      { item: 'Звукорежиссёр', qty: 1 },
      { item: 'Техник', qty: 1 },
    ],
    other: [{ item: 'Аккредитация', qty: 5 }],
    /* схема DJ-стола из редактора райдера: координаты как в приложении */
    stage: {
      tables: [{ x: 77, y: 78, w: 212, h: 79 }],
      items: [
        { type: 'mixer2', x: 164, y: 123, rot: 0, scale: 0.4 },
        { type: 'turntable', x: 124, y: 117, rot: 270, scale: 0.51 },
        { type: 'turntable', x: 202, y: 117, rot: 270, scale: 0.51 },
        { type: 'laptop', x: 261, y: 120, rot: 45, scale: 0.42 },
        { type: 'monitor', x: 33, y: 154, rot: 315, scale: 0.71 },
        { type: 'monitor', x: 331, y: 152, rot: 45, scale: 0.72 },
      ],
    },
    backstage: [
      { item: 'Вода негазированная', qty: 6 }, { item: 'Вода газированная', qty: 6 }, { item: 'Ром', qty: 1 },
      { item: 'Кока-кола', qty: 4 }, { item: 'Бокалы', qty: 4 }, { item: 'Набор посуды', qty: 3 },
      { item: 'Лёд', qty: 9 }, { item: 'Закуски', qty: 1 }, { item: 'Maalox', qty: 4 },
      { item: 'Полотенца', qty: 2 }, { item: 'Сигареты', qty: 2 }, { item: 'Зеркало', qty: 1 },
    ],
    backstageNote: 'Мясная нарезка, сыры',
    travel: {
      tickets: 'Economy+, Business',
      hotel: '5★',
      transfer: 'Business',
      visa: 'нет',  // в райдере: us:false, eu:false, other:false
      note: '(СПБ) Сапсан — билеты бизнес у стола.\nВ туре:\n1. Трёхразовое питание (завтрак должен быть включён в гостинице)\n2. Обед или ужин рядом с гостиницей\n3. Минибар оплачивается организатором\n4. Стирка и глажка белья в гостинице оплачивается организатором',
    },
  },

  discography: [
    { title: 'Good Times Instrumentals', kind: 'Альбом', date: '2020-03-23', cover: 'https://cdn-images.dzcdn.net/images/cover/8b211e5650e0db0cf314cd79a99ff63f/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/987960091' },
    { title: 'По мотивам книги «Правила Мерджа»', kind: 'EP', date: '2023-09-21', cover: 'https://cdn-images.dzcdn.net/images/cover/f8955442d90b6e6beca5e8bd5d2678c2/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/987969011' },
    { title: 'Versus', kind: 'EP', date: '2020-10-01', cover: 'https://cdn-images.dzcdn.net/images/cover/360fe77ee2a20e300381723954b5c4ad/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/987960101' },
    { title: '40 строк, Ч. 2', kind: 'Сингл', date: '2026-07-31', cover: 'https://cdn-images.dzcdn.net/images/cover/4b44f2e62927601f2d66b69d080e2f55/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/1041187852' },
    { title: 'Я и она', kind: 'Сингл', date: '2026-07-24', cover: 'https://cdn-images.dzcdn.net/images/cover/151d3e9383d8ec6d017e219a7f400c57/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/1031826212' },
    { title: 'Умножай на 2', kind: 'Сингл', date: '2026-07-10', cover: 'https://cdn-images.dzcdn.net/images/cover/1bf30a4d69decdb46cc071e8f54932e5/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/1023105121' },
    { title: 'Шума', kind: 'Сингл', date: '2026-06-26', cover: 'https://cdn-images.dzcdn.net/images/cover/295d2b5c74b39acadba7cfbe6f9ba4e6/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/1012580441' },
    { title: 'Old Money', kind: 'Сингл', date: '2026-05-29', cover: 'https://cdn-images.dzcdn.net/images/cover/56f6be55913331b6b0302224b7e2a2de/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/991509421' },
    { title: 'Мумия', kind: 'Сингл', date: '2026-04-24', cover: 'https://cdn-images.dzcdn.net/images/cover/35aa03bb1875c4fc8ede451f96e9ac5b/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/965618221' },
    { title: 'Феникс', kind: 'Сингл', date: '2025-02-28', cover: 'https://cdn-images.dzcdn.net/images/cover/ce351a74667d7803801cc464c98c490e/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/720089681' },
    { title: 'City Life', kind: 'Сингл', date: '2020-10-22', cover: 'https://cdn-images.dzcdn.net/images/cover/fa03185795b3a996fa34a556ad1f5586/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/996394301' },
    { title: 'Wabi Sabi', kind: 'Сингл', date: '2020-10-01', cover: 'https://cdn-images.dzcdn.net/images/cover/df65cdbce37954ce0be57b1239078537/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/987949711' },
    { title: 'Telebeats', kind: 'Сингл', date: '2020-10-01', cover: 'https://cdn-images.dzcdn.net/images/cover/7ab69d928f281f8cb6235744a8362079/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/990738801' },
    { title: 'Ozz', kind: 'Сингл', date: '2020-09-22', cover: 'https://cdn-images.dzcdn.net/images/cover/68c4b356954fcb73bc308c391287cbbf/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/943214701' },
    { title: 'I used To', kind: 'Сингл', date: '2020-09-22', cover: 'https://cdn-images.dzcdn.net/images/cover/397b3b7e71503e7e94fee96b522c3659/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/995861151' },
    { title: 'OMG', kind: 'Сингл', date: '2020-09-20', cover: 'https://cdn-images.dzcdn.net/images/cover/465c7684721dde2a326774751fb72745/1000x1000-000000-80-0-0.jpg', url: 'https://www.deezer.com/album/995861171' },
  ],
};
