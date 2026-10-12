'use strict';
/* Каталог курсов: список → страница курса (цена, доступ, как устроено обучение, программа,
   бесплатный предпросмотр первого урока) → оформление (оплата — демо) → «Вы записаны».
   index.html?course=ID открывает страницу курса сразу, в том числе черновик — для предпросмотра автором. */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var esc = DJC.esc;
  var TOPICS = ['Все', 'Скретч', 'Продюсирование', 'Диджеинг', 'Бизнес', 'Оборудование'];
  var activeTopic = 'Все';

  function back(target) { return '<div class="row" style="margin-bottom:16px"><button class="icon" data-go="' + target + '" aria-label="Назад">←</button></div>'; }
  function publicCourses() { return window.COURSES.filter(function (c) { return c.status !== 'draft'; }); }
  function priceBlock(c) {
    var free = c.access && c.access.free;
    return '<span style="display:flex;align-items:baseline;gap:10px;min-width:0"><span class="c-price' + (free ? ' is-free' : '') + '">' + DJC.priceLabel(c) + '</span>'
      + (!free && c.oldPrice > c.price ? '<span class="c-old-price">' + DJC.fmtRub(c.oldPrice) + '</span>' : '') + '</span>';
  }

  function renderChips() {
    var used = TOPICS.filter(function (t) { return t === 'Все' || publicCourses().some(function (c) { return c.topic === t; }); });
    var box = $('#topicChips'); box.innerHTML = '';
    used.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.textContent = t;
      b.setAttribute('aria-pressed', String(t === activeTopic));
      b.addEventListener('click', function () { activeTopic = t; renderChips(); renderCatalog(); });
      box.appendChild(b);
    });
  }
  function cardFor(c) {
    var stage = DJC.stageFor(c), en = DJC.enrollment(c.id);
    var lessons = DJC.flat(c).length;
    return window.djCourseCard({
      id: c.id, href: '#', kind: stage.kind, grad: c.grad, glyph: DJC.glyph(c.topic),
      stageLabel: stage.label, stageTone: stage.tone, topic: c.topic, level: c.level, title: c.title,
      big: DJC.priceLabel(c),
      facts: [['Автор', c.instructor], ['Уроков', String(lessons)]],
      role: en ? 'Вы учитесь · ' + DJC.progress(c, en).pct + '%'
        : c.status === 'enrolling' ? 'Набор только открылся'
        : c.students + ' ' + DJC.plural(c.students, ['ученик', 'ученика', 'учеников']),
    });
  }
  function renderCatalog() {
    var list = publicCourses().filter(function (c) { return activeTopic === 'Все' || c.topic === activeTopic; });
    $('#catalogList').innerHTML = list.map(cardFor).join('') || '<div class="empty"><p class="secondary">Пока нет курсов по этой теме</p></div>';
  }

  /* ---- страница курса ---- */
  function howItWorks(c) {
    var rows = [];
    var f = DJC.flat(c);
    rows.push(['Уроки', DJC.kindCounts(c) || 'скоро появятся']);
    rows.push(['Порядок', 'уроки открываются по очереди']);
    if (f.some(function (x) { return x.lesson.kind === 'task'; })) rows.push(['Задания', c.grading.reviewTasks ? 'проверяет автор, с комментарием' : 'засчитываются сразу']);
    if (f.some(function (x) { return x.lesson.kind === 'test'; })) rows.push(['Тесты', c.grading.testAttempts ? c.grading.testAttempts + ' ' + DJC.plural(c.grading.testAttempts, ['попытка', 'попытки', 'попыток']) + ' на тест' : 'пересдавать можно без ограничений']);
    rows.push(['Доступ', DJC.accessLabel(c).replace('доступ ', '') + (c.access.durationType === 'timed' ? ' с момента записи' : '')]);
    if (c.certificate.enabled) {
      var cond = ['все уроки'];
      if (c.certificate.requireTests && f.some(function (x) { return x.lesson.kind === 'test'; })) cond.push('сданы тесты');
      if (c.certificate.requireTasks && f.some(function (x) { return x.lesson.kind === 'task'; })) cond.push('приняты задания');
      rows.push(['Сертификат', 'когда пройдены ' + cond.join(', ')]);
    }
    return '<div class="card"><h3 style="font-size:19px;margin-bottom:6px">Как проходит обучение</h3>'
      + rows.map(function (r) { return '<div class="c-price-row" style="padding:8px 0;border-top:1px solid var(--dj-line);margin:0"><span class="caption" style="flex:0 0 96px">' + r[0] + '</span><span style="font-size:16px;color:var(--dj-text-body);text-align:right;min-width:0">' + r[1] + '</span></div>'; }).join('')
      + '</div>';
  }

  function renderDetail(c) {
    var stage = DJC.stageFor(c), en = DJC.enrollment(c.id), draft = c.status === 'draft';
    var free = c.access && c.access.free;
    var p = DJC.flat(c);
    var firstId = p.length ? p[0].lesson.id : null;
    var saved = (window.WISHLIST || []).indexOf(c.id) >= 0;
    var modulesHtml = c.modules.map(function (m) {
      return '<div class="card c-module"><div class="c-module-head"><h3>' + esc(m.name) + '</h3><span class="caption">' + m.lessons.length + ' ' + DJC.plural(m.lessons.length, ['урок', 'урока', 'уроков']) + '</span></div>'
        + m.lessons.map(function (l) {
            var open = l.id === firstId || !!en;
            return '<div class="c-lesson' + (open ? '' : ' is-locked') + '" role="button" tabindex="0" data-lesson-id="' + l.id + '"' + (open ? '' : ' data-locked="1"') + '>'
              + '<span class="c-lesson-icon">' + DJC.lessonIcon(l.kind) + '</span>'
              + '<span class="c-lesson-body"><span class="c-lesson-title">' + esc(l.title) + '</span><span class="c-lesson-meta">' + DJC.kindLabel(l.kind) + ' · ' + l.min + ' мин' + (l.id === firstId && !en ? ' · бесплатный просмотр' : '') + '</span></span>'
              + '<span class="c-lesson-trail">' + (open ? DJC.ICON_PLAY : DJC.ICON_LOCK) + '</span></div>';
          }).join('')
        + '</div>';
    }).join('');

    var action;
    if (en) action = '<a class="primary full" href="student.html?course=' + c.id + '">Перейти к обучению →</a>';
    else if (draft) action = '<p class="caption">Это предпросмотр черновика — записаться можно будет после публикации.</p>';
    else action = '<button class="primary full" id="enrollBtn">' + (free ? 'Записаться бесплатно' : 'Купить за ' + DJC.fmtRub(c.price)) + '</button>'
      + '<button class="text-button" id="saveBtn" style="width:100%;margin-top:4px">' + (saved ? 'Убрать из сохранённых' : 'Сохранить на потом') + '</button>';

    $('#c-course').innerHTML =
      back('c-catalog')
      + '<div class="c-hero-cover" style="background:' + c.grad + '"><span class="aud-badge">' + tournamentStatus(draft ? 'Черновик · предпросмотр' : stage.label, stage.tone) + '</span></div>'
      + '<div class="stack" style="margin-top:18px">'
        + '<div><p class="caption">' + esc(c.topic) + ' · ' + esc(c.level) + '</p><h1 style="margin-top:4px">' + esc(c.title) + '</h1></div>'
        + '<div class="c-instructor"><span class="portrait alt">' + DJC.initials(c.instructor) + '</span><div><h3 style="font-size:17px">' + esc(c.instructor) + '</h3><p class="caption">' + c.students + ' ' + DJC.plural(c.students, ['ученик', 'ученика', 'учеников']) + '</p></div></div>'
        + '<div class="card">'
          + '<div class="c-price-row">' + priceBlock(c) + '</div>'
          + '<p class="caption" style="margin:6px 0 14px">' + DJC.accessLabel(c) + (c.certificate.enabled ? ' · сертификат по окончании' : '') + '</p>'
          + action
        + '</div>'
        + (c.summary ? '<p class="secondary">' + esc(c.summary) + '</p>' : '')
        + (c.learn.length ? '<div><h2 style="margin-bottom:12px">Чему научишься</h2><ul class="c-learn">' + c.learn.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' : '')
        + howItWorks(c)
        + '<div><h2 style="margin-bottom:12px">Программа курса</h2>' + modulesHtml + '</div>'
      + '</div>';

    var btn = $('#enrollBtn');
    if (btn) btn.addEventListener('click', function () {
      if (free) { DJC.enroll(c); renderDone(c); go('c-done'); }
      else { renderCheckout(c); go('c-checkout'); }
    });
    var sv = $('#saveBtn');
    if (sv) sv.addEventListener('click', function () {
      if (saved) window.WISHLIST = window.WISHLIST.filter(function (id) { return id !== c.id; });
      else window.WISHLIST.push(c.id);
      window.saveCourses();
      window.say(saved ? 'Убрано из сохранённых' : 'Сохранено — курс в «Мои курсы → Сохранённые»');
      renderDetail(c);
    });
    $$('#c-course .c-lesson').forEach(function (row) {
      row.addEventListener('click', function () {
        if (row.dataset.locked) { window.say(free ? 'Запишитесь бесплатно, чтобы открыть все уроки' : 'Урок откроется после покупки курса'); return; }
        if (en) { location.href = 'student.html?course=' + c.id; return; }
        renderPreview(c, row.dataset.lessonId); go('c-preview');
      });
    });
  }

  /* ---- бесплатный предпросмотр первого урока ---- */
  function renderPreview(c, lessonId) {
    var l = DJC.flat(c).find(function (x) { return x.lesson.id === lessonId; }).lesson;
    var body;
    if (l.kind === 'video') body = '<div class="c-player"><div class="c-player-play">' + DJC.ICON_PLAY.replace('width="16" height="16"', 'width="24" height="24"') + '</div><span class="c-player-time">0:00 / ' + l.min + ':00</span></div>' + (l.video && l.video.note ? '<p class="secondary" style="margin-top:12px">' + esc(l.video.note) + '</p>' : '');
    else if (l.kind === 'doc') body = '<div class="card"><p class="secondary" style="white-space:pre-line;color:var(--dj-text-body)">' + esc(l.doc.text) + '</p></div>';
    else if (l.kind === 'task') body = '<div class="card"><p class="caption" style="margin-bottom:6px">Задание</p><p class="secondary">' + esc(l.task.task) + '</p></div>';
    else body = '<div class="card"><p class="secondary">Тест из ' + l.test.questions.length + ' ' + DJC.plural(l.test.questions.length, ['вопроса', 'вопросов', 'вопросов']) + ', проходной балл ' + l.test.passScore + '%. Доступен после записи.</p></div>';
    $('#c-preview').innerHTML = back('c-course')
      + '<p class="caption">Бесплатный просмотр · ' + DJC.kindLabel(l.kind) + ' · ' + l.min + ' мин</p><h1 style="margin:4px 0 16px;font-size:26px">' + esc(l.title) + '</h1>'
      + body
      + '<div class="card" style="margin-top:18px"><p class="secondary">Остальные ' + (DJC.flat(c).length - 1) + ' уроков — после записи.</p>'
      + (c.status === 'draft' ? '' : '<button class="primary full" style="margin-top:12px" data-go="c-course">' + ((c.access && c.access.free) ? 'Записаться бесплатно' : 'Купить за ' + DJC.fmtRub(c.price)) + '</button>') + '</div>';
  }

  /* ---- оформление (оплата — демо) ---- */
  function renderCheckout(c) {
    var until = c.access.durationType === 'timed' ? c.access.days + ' ' + DJC.plural(c.access.days, ['день', 'дня', 'дней']) + ' с момента оплаты' : 'бессрочно';
    var discount = c.oldPrice > c.price ? c.oldPrice - c.price : 0;
    function row(a, b, strong) {
      return '<div class="c-price-row" style="margin:0;padding:10px 0;border-top:1px solid var(--dj-line);align-items:baseline"><span class="secondary" style="flex-shrink:0">' + a + '</span>'
        + '<span style="min-width:0;text-align:right;font-size:' + (strong ? '22px;font-weight:600;color:var(--dj-lime);white-space:nowrap' : '17px;color:var(--dj-text-body)') + '">' + b + '</span></div>';
    }
    $('#c-checkout').innerHTML = back('c-course')
      + '<div class="heading"><h1 style="font-size:26px">Оформление</h1></div>'
      + '<div class="card"><p class="caption">' + esc(c.instructor) + '</p><h3 style="font-size:19px;margin:2px 0 12px">' + esc(c.title) + '</h3>'
        + (discount ? row('Цена', DJC.fmtRub(c.oldPrice)) + row('Скидка', '− ' + DJC.fmtRub(discount)) : '')
        + row('К оплате', DJC.fmtRub(c.price), true)
      + '</div>'
      + '<div class="card" style="margin-top:14px">'
        + row('Доступ', until).replace('border-top:1px solid var(--dj-line)', 'border-top:0')
        + row('Уроков', String(DJC.flat(c).length))
        + (c.certificate.enabled ? row('Сертификат', 'по окончании') : '')
      + '</div>'
      + '<button class="primary full" id="payBtn" style="margin-top:18px">Оплатить ' + DJC.fmtRub(c.price) + '</button>'
      + '<p class="caption" style="margin-top:8px;text-align:center">Демо-оплата: деньги не списываются</p>';
    $('#payBtn').addEventListener('click', function () { DJC.enroll(c); renderDone(c); go('c-done'); });
  }
  function renderDone(c) {
    var en = DJC.enrollment(c.id), until = DJC.accessUntil(c, en);
    $('#c-done').innerHTML =
      '<div class="empty" style="padding-top:40px"><span class="c-step-num is-ok" style="width:56px;height:56px;flex-basis:56px">' + DJC.ICON_CHECK + '</span>'
      + '<h1 style="font-size:28px">Вы записаны</h1><p class="secondary">«' + esc(c.title) + '» уже в «Мои курсы».' + (until ? ' Доступ до ' + DJC.fmtDate(until) + '.' : '') + '</p></div>'
      + '<a class="primary full" href="student.html?course=' + c.id + '">Начать обучение</a>'
      + '<button class="text-button" data-go="c-catalog" style="width:100%;margin-top:6px">Вернуться в каталог</button>';
    renderCatalog();
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('.t-card-link');
    if (link) {
      var card = link.closest('[data-course-id]');
      if (card) { e.preventDefault(); var c = window.courseById(card.dataset.courseId); if (c) { renderDetail(c); go('c-course'); } }
      return;
    }
    var b = e.target.closest('[data-go]');
    if (b) {
      if (b.dataset.go === 'c-catalog') { renderChips(); renderCatalog(); }
      go(b.dataset.go);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderChips(); renderCatalog();
    var m = location.search.match(/course=(\d+)/);
    if (m) { var c = window.courseById(m[1]); if (c) { renderDetail(c); go('c-course'); } }
  });
})();
