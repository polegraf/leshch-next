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
    test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.8a2.4 2.4 0 1 1 3.4 2.2c-.9.5-1 1-1 2"/><circle cx="12" cy="16.9" r=".35" fill="currentColor" stroke="none"/></svg>',
  };
  function lessonIcon(kind) { return ICONS[kind] || ICONS.video; }

  var KIND_LABEL = { video: 'Видео', doc: 'Текст', task: 'Задание', test: 'Тест' };
  function kindLabel(kind) { return KIND_LABEL[kind] || KIND_LABEL.video; }

  function accessLabel(c) {
    var a = c.access || { durationType: 'unlimited' };
    return a.durationType === 'timed' ? ('доступ ' + a.days + ' ' + plural(a.days, ['день', 'дня', 'дней'])) : 'доступ бессрочно';
  }
  function priceLabel(c) {
    return (c.access && c.access.free) ? 'Бесплатно' : fmtRub(c.price);
  }

  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5v13l11-6.5z"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + (String(iso).length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---- прохождение курса: общая логика для ученика, автора и каталога ---- */
  function flat(c) {
    var out = [];
    c.modules.forEach(function (m, mi) {
      m.lessons.forEach(function (l, li) { out.push({ module: m, mi: mi, lesson: l, li: li, idx: out.length }); });
    });
    return out;
  }
  function enrollment(courseId) {
    return (window.ENROLLMENTS || []).find(function (e) { return e.courseId === courseId; });
  }
  function submission(courseId, lessonId, student) {
    student = student || window.STUDENT_NAME;
    var list = (window.SUBMISSIONS || []).filter(function (s) { return s.courseId === courseId && s.lessonId === lessonId && s.student === student; });
    return list[list.length - 1];
  }
  /* done — пройден; pending — задание ждёт проверки; returned — задание на доработке;
     failed — тест не сдан, попытки закончились; todo — ещё не пройден */
  function lessonState(c, en, l) {
    if (!en) return 'todo';
    var inDone = en.done.indexOf(l.id) >= 0;
    if (l.kind === 'task') {
      var s = submission(c.id, l.id);
      if (!s) return 'todo';
      return s.status === 'accepted' ? 'done' : s.status === 'returned' ? 'returned' : 'pending';
    }
    if (l.kind === 'test') {
      var t = en.tests && en.tests[l.id];
      if (t && t.passed) return 'done';
      return inDone ? 'failed' : 'todo';
    }
    return inDone ? 'done' : 'todo';
  }
  /* урок «закрыт» для движения дальше, если он в done (видео/текст отмечены, задание отправлено, тест сдан или попытки кончились) */
  function progress(c, en) {
    var f = flat(c), done = 0, frontier = -1;
    f.forEach(function (x) {
      var ok = en && en.done.indexOf(x.lesson.id) >= 0;
      if (ok) done++; else if (frontier < 0) frontier = x.idx;
    });
    return { flat: f, total: f.length, done: done, pct: f.length ? Math.round(done / f.length * 100) : 0, frontier: frontier };
  }
  function certStatus(c, en) {
    var f = flat(c), p = progress(c, en), items = [];
    items.push({ label: 'Пройти все уроки', ok: p.total > 0 && p.done === p.total, note: p.done + ' из ' + p.total });
    var tests = f.filter(function (x) { return x.lesson.kind === 'test'; });
    if (c.certificate.requireTests && tests.length) {
      var passed = tests.filter(function (x) { return lessonState(c, en, x.lesson) === 'done'; }).length;
      items.push({ label: 'Сдать тесты', ok: passed === tests.length, note: passed + ' из ' + tests.length });
    }
    var tasks = f.filter(function (x) { return x.lesson.kind === 'task'; });
    if (c.certificate.requireTasks && tasks.length) {
      var acc = tasks.filter(function (x) { return lessonState(c, en, x.lesson) === 'done'; }).length;
      items.push({ label: 'Задания приняты автором', ok: acc === tasks.length, note: acc + ' из ' + tasks.length });
    }
    return { enabled: !!c.certificate.enabled, items: items, eligible: !!c.certificate.enabled && items.every(function (i) { return i.ok; }) };
  }
  function kindCounts(c) {
    var n = { video: 0, doc: 0, task: 0, test: 0 };
    flat(c).forEach(function (x) { n[x.lesson.kind] = (n[x.lesson.kind] || 0) + 1; });
    var parts = [];
    if (n.video) parts.push(n.video + ' видео');
    if (n.doc) parts.push(n.doc + ' ' + plural(n.doc, ['текст', 'текста', 'текстов']));
    if (n.task) parts.push(n.task + ' ' + plural(n.task, ['задание', 'задания', 'заданий']));
    if (n.test) parts.push(n.test + ' ' + plural(n.test, ['тест', 'теста', 'тестов']));
    return parts.join(' · ');
  }
  function accessUntil(c, en) {
    var a = c.access || {};
    if (a.durationType !== 'timed' || !en || !en.startedAt) return '';
    var d = new Date(en.startedAt + 'T12:00:00');
    d.setDate(d.getDate() + (a.days || 0));
    return d.toISOString().slice(0, 10);
  }
  function enroll(c) {
    var en = enrollment(c.id);
    if (en) return en;
    en = { courseId: c.id, status: 'active', startedAt: today(), done: [], tests: {} };
    window.ENROLLMENTS.push(en);
    c.students = (c.students || 0) + 1;
    if (!(c.access && c.access.free)) { c.revenueTotal = (c.revenueTotal || 0) + c.price; c.revenueMonth = (c.revenueMonth || 0) + c.price; }
    window.WISHLIST = (window.WISHLIST || []).filter(function (id) { return id !== c.id; });
    window.saveCourses();
    return en;
  }

  function certNumber(c, en) {
    return 'DJ-' + ('00' + c.id).slice(-3) + '-' + (en && en.startedAt ? en.startedAt.replace(/-/g, '').slice(2) : '000000');
  }
  function certHtml(c, name, date, number) {
    return '<div class="c-cert">'
      + '<p class="c-cert-eyebrow">Сертификат · Digital Jazz</p>'
      + '<p class="c-cert-name">' + esc(name) + '</p>'
      + '<p class="secondary">успешно завершил(а) курс</p>'
      + '<p class="c-cert-course">«' + esc(c.title) + '»</p>'
      + '<div class="c-cert-foot"><div>Автор курса<b>' + esc(c.instructor) + '</b></div><div>' + fmtDate(date) + '<b>№ ' + number + '</b></div></div>'
      + '</div>';
  }

  return {
    plural: plural, fmtRub: fmtRub, initials: initials, glyph: glyph, stageFor: stageFor,
    lessonIcon: lessonIcon, kindLabel: kindLabel, accessLabel: accessLabel, priceLabel: priceLabel,
    esc: esc, fmtDate: fmtDate, today: today, certNumber: certNumber, certHtml: certHtml,
    flat: flat, enrollment: enrollment, submission: submission, lessonState: lessonState,
    progress: progress, certStatus: certStatus, kindCounts: kindCounts, accessUntil: accessUntil, enroll: enroll,
    ICON_PLAY: ICON_PLAY, ICON_LOCK: ICON_LOCK, ICON_CHECK: ICON_CHECK,
  };
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
