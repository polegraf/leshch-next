'use strict';
/* Реальный профиль артиста в прототипе (данные — djtactics-data.js, снимок app.digitaljazz.ru).
   Где включается:
   - public-profile/index.html без ?name — публичная страница DJ Tactics;
   - profile/index.html, когда в демо выбран «Артист · DJ Tactics» (•••  → Вход, профили, сценарии → Войти как).
   Карточки заполняются существующими компонентами страниц (stat-tile, genre-row, discog-item, quote-block,
   vframe, photo-grid, tag); новые — только строки райдера и схема DJ-стола.
   Подключать ДО profile-calendar.js и profile-tournaments.js: они читают имя со страницы при загрузке. */
(function () {
  var R = window.DJ_REAL && window.DJ_REAL.djtactics;
  if (!R) return;
  var isPublic = location.pathname.indexOf('/public-profile/') >= 0;
  var own = false;
  if (isPublic) {
    if (new URLSearchParams(location.search).get('name')) return; // демо-люди турниров — своя логика (public-person.js)
  } else {
    try {
      var S = JSON.parse(localStorage.getItem('dj-account') || 'null');
      var a = S && S.signed && S.profiles && S.profiles.find(function (p) { return p.id === S.active; });
      own = !!(a && a.real === 'djtactics');
    } catch (e) { own = false; }
    if (!own) return;
  }
  window.DJ_REAL_ACTIVE = R;

  /* имя — сразу, до календаря и турниров */
  var nameEl = document.querySelector('.name');
  if (nameEl) nameEl.textContent = R.name;
  document.title = R.name + (isPublic ? ' · Публичный профиль' : ' · Профиль');

  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var num = function (n) { return Math.round(n).toLocaleString('ru-RU'); };
  var date = function (iso, opts) { return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', opts || { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', ''); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var card = function (id) { return $('[data-id="' + id + '"]'); };
  var body = function (id) { var c = card(id); return c && $('.card-body', c); };
  var meta = function (id, t) { var c = card(id); var m = c && $('[data-meta]', c); if (m) m.textContent = t; };

  function sourceNote() {
    return '<p class="rp-source">Реальный профиль · <a href="' + R.source + '" target="_blank" rel="noopener">app.digitaljazz.ru/' + R.slug + '</a> · данные на ' + date(R.snapshot) + '</p>';
  }

  function fillProfile() {
    var b = body('profile'); if (!b) return;
    var img = $('.cover img', b);
    if (img) { img.src = R.avatar; img.alt = R.name; img.style.objectPosition = 'center ' + R.avatarY + '%'; }
    if (nameEl) nameEl.textContent = R.name;
    var online = $('.online-row', b);
    if (online) online.innerHTML = '<span>' + esc(R.city) + ' · в Digital Jazz с ' + date(R.since) + '</span>';
    var tags = $('[data-tags]', b);
    if (tags) tags.innerHTML = R.tags.map(function (t, i) {
      return '<div class="tag"><div class="dot" style="background:' + (i ? '#A375FF' : '#C0FA35') + ';"></div><span>' + esc(t) + '</span><span class="n">' + ('0' + (R.vouches[t] || 0)).slice(-2) + '</span></div>';
    }).join('');
    b.querySelectorAll('.write-hint').forEach(function (el) { el.textContent = el.textContent.replace(/Судья Вектор|Нокс/g, R.name); });
    if (!$('.rp-links', b)) {
      b.insertAdjacentHTML('beforeend',
        '<div class="rp-links">' + R.links.map(function (l) { return '<a class="tag" href="' + esc(l.url) + '" target="_blank" rel="noopener"><span>' + esc(l.label) + '</span><span class="n">↗</span></a>'; }).join('') + '</div>'
        + sourceNote());
    }
  }

  function fillStats() {
    var b = body('stats'); if (!b) return;
    var s = R.stats;
    b.innerHTML =
      '<div class="stat-row">'
        + '<div class="stat-tile"><div class="stat-label">СЛУШАТЕЛЕЙ</div><div class="stat-num">' + num(s.listeners) + '</div><div class="stat-date">в месяц</div></div>'
        + '<div class="stat-tile"><div class="stat-label">ПОДПИСЧИКОВ</div><div class="stat-num">' + num(s.followers) + '</div><div class="stat-date">всего</div></div>'
      + '</div>'
      + '<div class="field-label">По площадкам</div>'
      + s.platforms.map(function (p) { return '<div class="rp-row"><span>' + esc(p.name) + ' <small>' + esc(p.kind) + '</small></span><b>' + num(p.value) + '</b></div>'; }).join('')
      + '<p class="rp-note">Обновлено ' + date(s.updated) + '. Слушатели — Яндекс Музыка и Spotify, подписчики — Instagram, VK, TikTok и Spotify.</p>';
    meta('stats', (s.listeners / 1000).toFixed(1).replace('.', ',') + 'K / ' + (s.followers / 1000).toFixed(1).replace('.', ',') + 'K');
  }

  function genresHtml() {
    return '<div class="genre-list">' + R.genres.map(function (g) {
      var lv = R.genreLevels[g] || 0, bars = '';
      for (var i = 0; i < 5; i++) bars += '<div' + (i < lv ? ' style="background:#C0FA35;"' : '') + '></div>';
      return '<div class="genre-row"><span>' + esc(g) + '</span><div class="genre-bars" aria-label="уровень ' + lv + ' из 5">' + bars + '</div></div>';
    }).join('') + '</div>';
  }
  function fillGenres() {
    var c = card('genres');
    if (!c && isPublic) {
      var stats = card('stats'); if (!stats) return;
      var tpl = stats.cloneNode(true);
      tpl.dataset.id = 'genres';
      $('.card-title', tpl).textContent = 'ЖАНРЫ';
      stats.insertAdjacentElement('afterend', tpl);
      $('[data-toggle]', tpl).addEventListener('click', function () { tpl.classList.toggle('collapsed'); });
      c = tpl;
    }
    if (!c) return;
    $('.card-body', c).innerHTML = genresHtml();
    meta('genres', R.genres.length + ' выбрано');
  }

  function fillBio() {
    var b = body('pressbio'); if (!b) return;
    b.innerHTML =
      '<div class="quote-block"><div class="quote-text">«' + esc(R.quote.text) + '»</div><div class="quote-attr">— ' + esc(R.quote.by) + '</div></div>'
      + R.pressKit.map(function (p) { return '<p class="bio-text rp-bio">' + esc(p) + '</p>'; }).join('')
      + '<div class="vframe rp-video"><video src="' + R.portfolioVideo + '" controls preload="metadata" playsinline></video></div>';
    meta('pressbio', 'Заполнено');
  }

  function fillMusic() {
    var b = body('music'); if (!b) return;
    b.innerHTML =
      '<div class="empty-hint">Треки не добавлены — в профиле только дискография.</div>'
      + '<div class="field-label">Дискография · ' + R.discography.length + '</div>'
      + '<div class="discog-grid">' + R.discography.map(function (r) {
          return '<a class="discog-item" href="' + esc(r.url) + '" target="_blank" rel="noopener" title="' + esc(r.title) + '"><img src="' + esc(r.cover) + '" alt="" loading="lazy"><div class="discog-title">' + esc(r.title) + '</div><div class="discog-year">' + r.kind + ' · ' + r.date.slice(0, 4) + '</div></a>';
        }).join('') + '</div>';
    meta('music', R.discography.length + ' релизов');
  }

  /* схема DJ-стола из редактора райдера: стол и позиции — как в приложении */
  function stageSvg() {
    var st = R.rider.stage;
    var shape = function (it) {
      var t = 'translate(' + it.x + ' ' + it.y + ') rotate(' + it.rot + ')';
      if (it.type === 'turntable') return '<g transform="' + t + '"><rect x="-21" y="-17" width="42" height="34" rx="4" class="rp-gear"/><circle cx="-3" cy="0" r="12" class="rp-gear-in"/><circle cx="-3" cy="0" r="2" class="rp-dot"/></g>';
      if (it.type === 'mixer2') return '<g transform="' + t + '"><rect x="-9" y="-16" width="18" height="32" rx="3" class="rp-gear"/><path d="M-4 -8v6M4 -8v6M-5 9h10" class="rp-line"/></g>';
      if (it.type === 'laptop') return '<g transform="' + t + '"><rect x="-13" y="-9" width="26" height="18" rx="2" class="rp-gear"/><path d="M-15 11h30" class="rp-line"/></g>';
      if (it.type === 'monitor') return '<g transform="' + t + '"><path d="M-14 -16h28l-5 32h-18z" class="rp-mon"/><circle cx="0" cy="-3" r="6" class="rp-gear-in"/></g>';
      return '';
    };
    return '<svg class="rp-stage" viewBox="0 55 365 135" role="img" aria-label="Схема DJ-стола: два проигрывателя, пульт, ноутбук, два монитора">'
      + st.tables.map(function (t) { return '<rect x="' + t.x + '" y="' + t.y + '" width="' + t.w + '" height="' + t.h + '" rx="6" class="rp-table"/>'; }).join('')
      + st.items.map(shape).join('') + '</svg>'
      + '<p class="rp-note">По схеме из райдера: два проигрывателя, пульт посередине, ноутбук справа, мониторы по бокам и развёрнуты к артисту.</p>';
  }
  function rows(list, model) {
    return list.map(function (r) {
      return '<div class="rp-row"><span>' + esc(r.item) + (model && r.model ? ' <small>' + esc(r.model) + '</small>' : '') + '</span><b>× ' + r.qty + '</b></div>';
    }).join('');
  }
  function fillRider() {
    var b = body('rider'); if (!b) return;
    var r = R.rider, t = r.travel;
    b.innerHTML =
      '<p class="rp-note" style="margin-top:0">Райдер «' + esc(r.name) + '» · обновлён ' + date(r.updated) + ' · открыт для всех</p>'
      + '<div class="field-label">Техника</div>' + rows(r.tech, true)
      + '<div class="field-label">Свет</div><div class="empty-hint">Не указан</div>'
      + '<div class="field-label">Персонал</div>' + rows(r.staff)
      + '<div class="field-label">Другое</div>' + rows(r.other)
      + '<div class="field-label">Схема DJ-стола</div>' + stageSvg()
      + '<div class="field-label">Бэкстейдж</div>' + rows(r.backstage)
      + (r.backstageNote ? '<p class="rp-note">' + esc(r.backstageNote) + '</p>' : '')
      + '<div class="field-label">Поездки</div>'
      + '<div class="rp-row"><span>Билеты</span><b>' + esc(t.tickets) + '</b></div>'
      + '<div class="rp-row"><span>Отель</span><b>' + esc(t.hotel) + '</b></div>'
      + '<div class="rp-row"><span>Трансфер</span><b>' + esc(t.transfer) + '</b></div>'
      + '<div class="rp-row"><span>Визы <small>США, ЕС, другие страны</small></span><b>' + esc(t.visa) + '</b></div>'
      + '<p class="rp-note rp-pre">' + esc(t.note) + '</p>';
    meta('rider', '«' + r.name + '» · ' + date(r.updated, { day: 'numeric', month: 'short' }));
  }

  function fillPress() {
    var b = body('pressmaterials'); if (!b) return;
    b.innerHTML =
      '<div class="pm-group"><div class="pm-group-head"><span class="pm-label">Горизонтальные видео</span></div><div class="vframe rp-video"><video src="' + R.pressVideoH + '" controls preload="metadata" playsinline></video></div></div>'
      + '<div class="pm-divider"></div>'
      + '<div class="pm-group"><div class="pm-group-head"><span class="pm-label">Вертикальные видео</span></div><div class="empty-hint">Нет видео.</div></div>'
      + '<div class="pm-divider"></div>'
      + '<div class="pm-group"><div class="pm-group-head"><span class="pm-label">Фото Hi-res · ' + R.photos.length + '</span></div><div class="photo-grid">'
        + R.photos.map(function (u) { return '<a href="' + u + '" target="_blank" rel="noopener"><img src="' + u + '" alt="" loading="lazy"></a>'; }).join('') + '</div></div>';
    meta('pressmaterials', '2 видео · ' + R.photos.length + ' фото');
  }

  function hideDemoOnly() {
    document.querySelectorAll('.profile-tournament-card').forEach(function (n) { n.hidden = true; });
  }

  function render() {
    fillProfile(); fillStats(); fillGenres(); fillBio(); fillMusic(); fillRider(); fillPress(); hideDemoOnly();
  }
  /* в кабинете profile-monitor.js перерисовывает шапку профиля — заполняем после него */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  window.addEventListener('load', function () { fillProfile(); hideDemoOnly(); });
  document.addEventListener('dj-access', function () { fillProfile(); });
})();
