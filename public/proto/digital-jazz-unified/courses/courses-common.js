'use strict';
/* Курсы: общее для каталога, кабинета ученика и кабинета автора — экран-переключатель,
   тост, склонение числительных, статус курса, значки уроков. Ничего из dj-ui.css не дублируем. */

window.go = function (id) {
  Array.prototype.slice.call(document.querySelectorAll('.screen')).forEach(function (s) {
    s.classList.toggle('is-on', s.id === id);
  });
  window.scrollTo(0, 0);
};

(function () {
  var timer;
  window.say = function (html) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = html;
    t.classList.add('visible');
    clearTimeout(timer);
    timer = setTimeout(function () { t.classList.remove('visible'); }, 2600);
  };
})();

window.DJC = (function () {
  function plural(n, forms) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  function fmtRub(n) { return Math.round(n || 0).toLocaleString('ru-RU') + ' ₽'; }

  function initials(name) {
    var n = String(name || '').replace(/^DJ\s+/i, '');
    return n.slice(0, 2).toUpperCase();
  }

  var GLYPHS = { 'Скретч': 'DJ', 'Продюсирование': 'PR', 'Диджеинг': 'MIX', 'Бизнес': '$', 'Оборудование': 'EQ' };
  function glyph(topic) { return '<span class="c-mono">' + (GLYPHS[topic] || 'DJ') + '</span>'; }

  function stageFor(c) {
    if (c.status === 'draft') return { label: 'Черновик', tone: 'pending', kind: 'announce' };
    if (c.status === 'enrolling') return { label: 'Идёт набор', tone: 'open', kind: 'ready' };
    return { label: 'Опубликован', tone: 'ready', kind: 'ready' };
  }

  var ICONS = {
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="14" height="13" rx="2.5"/><path d="M17 10.2l4-2.4v8.4l-4-2.4"/></svg>',
    task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l1-4L15 6l3 3-9.5 9.5-4 1Z"/><path d="M13 8l3 3"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4"/></svg>',
  };
  function lessonIcon(kind) { return ICONS[kind] || ICONS.video; }

  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5v13l11-6.5z"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  return { plural: plural, fmtRub: fmtRub, initials: initials, glyph: glyph, stageFor: stageFor, lessonIcon: lessonIcon, ICON_PLAY: ICON_PLAY, ICON_LOCK: ICON_LOCK, ICON_CHECK: ICON_CHECK };
})();

/* Открытие/закрытие шапочного и сервисного меню — свой минимальный вариант shell.js:
   тот рассчитан на поиск/дискавери/турниры/магазин (хэш-секции, #searchMenu), которых здесь нет. */
(function () {
  var menus = { more: document.getElementById('moreMenu'), services: document.getElementById('servicesMenu') };
  var buttons = { more: document.getElementById('moreBtn'), services: document.getElementById('services') };
  function closeShell() {
    Object.keys(menus).forEach(function (k) {
      if (!menus[k]) return;
      menus[k].hidden = true; menus[k].classList.remove('open');
      if (buttons[k]) { buttons[k].classList.remove('is-open'); buttons[k].setAttribute('aria-expanded', 'false'); }
    });
    var ss = document.getElementById('servicesScrim'); if (ss) ss.classList.remove('open');
    var nb = document.getElementById('navBackdrop'); if (nb) nb.classList.remove('open');
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-shell]');
    if (trigger) {
      e.preventDefault(); e.stopImmediatePropagation();
      var key = trigger.dataset.shell;
      if (!menus[key]) return;
      var wasOpen = !menus[key].hidden;
      closeShell();
      if (!wasOpen) {
        menus[key].hidden = false; menus[key].classList.add('open');
        trigger.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true');
        var scrim = document.getElementById(key === 'more' ? 'navBackdrop' : 'servicesScrim');
        if (scrim) scrim.classList.add('open');
      }
      return;
    }
    if (e.target.id === 'servicesScrim' || e.target.id === 'navBackdrop') closeShell();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeShell(); });
  closeShell();
})();
