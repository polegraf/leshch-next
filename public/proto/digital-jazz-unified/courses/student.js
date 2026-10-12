'use strict';
/* Кабинет ученика: прохождение курса.
   Уроки открываются по очереди. Видео — «Просмотрено», текст — «Прочитано», задание — ответ уходит
   автору на проверку (статус и комментарий автора видны здесь), тест — вопросы, проходной балл,
   ограничение попыток. Когда условия курса выполнены — выдаётся сертификат (печать в PDF). */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var esc = DJC.esc;
  var ME = window.STUDENT_NAME;
  var seg = 'active';
  var cur = null;

  function back(attrs) { return '<div class="row" style="margin-bottom:16px"><button class="icon" ' + attrs + ' aria-label="Назад">←</button></div>'; }
  function tag(text, tone) { return '<span class="c-tag' + (tone ? ' is-' + tone : '') + '">' + text + '</span>'; }
  function isDone(en, l) { return en.done.indexOf(l.id) >= 0; }

  /* после любого действия: статус курса, выдача сертификата, сохранение */
  function afterChange(c, en) {
    var p = DJC.progress(c, en);
    en.status = p.total && p.done === p.total ? 'done' : 'active';
    var cs = DJC.certStatus(c, en);
    var newCert = cs.eligible && !en.certAt;
    if (newCert) en.certAt = DJC.today();
    window.saveCourses();
    return newCert;
  }

  /* ================= мои курсы ================= */
  function mineCard(c) {
    if (seg === 'saved') {
      return window.djCourseCard({
        id: c.id, href: 'index.html?course=' + c.id, kind: 'announce', grad: c.grad, glyph: DJC.glyph(c.topic),
        topic: c.topic, level: c.level, title: c.title, big: DJC.priceLabel(c),
        facts: [['Автор', c.instructor]], role: 'Сохранён из каталога',
        attrs: ' data-saved="1"',
      });
    }
    var en = DJC.enrollment(c.id), p = DJC.progress(c, en), cs = DJC.certStatus(c, en);
    var returned = p.flat.filter(function (x) { return DJC.lessonState(c, en, x.lesson) === 'returned'; }).length;
    var pending = p.flat.filter(function (x) { return DJC.lessonState(c, en, x.lesson) === 'pending'; }).length;
    var next = p.frontier >= 0 ? p.flat[p.frontier].lesson.title : '';
    return window.djCourseCard({
      id: c.id, href: '#', kind: p.pct >= 100 ? 'done' : 'ready', grad: c.grad, glyph: DJC.glyph(c.topic),
      topic: c.topic, level: c.level, title: c.title, big: p.pct + '%',
      facts: [['Автор', c.instructor], ['Пройдено', p.done + ' из ' + p.total]],
      role: en.certAt ? 'Сертификат получен'
        : returned ? 'Задание вернули на доработку'
        : next ? 'Дальше: ' + esc(next)
        : pending ? 'Задание на проверке у автора' : 'Курс пройден',
    });
  }
  function renderMine() {
    var ids = seg === 'saved' ? window.WISHLIST.slice()
      : window.ENROLLMENTS.filter(function (e) { return (e.status || 'active') === seg; }).map(function (e) { return e.courseId; });
    var list = ids.map(window.courseById).filter(Boolean);
    $('#mineList').innerHTML = list.map(mineCard).join('')
      || '<div class="empty"><p class="secondary">' + (seg === 'saved' ? 'Пока ничего не сохранено' : seg === 'done' ? 'Завершённых курсов пока нет' : 'Нет курсов в процессе — выберите в каталоге') + '</p></div>';
  }

  /* ================= страница курса ================= */
  function renderCourseHome(c) {
    cur = c;
    var en = DJC.enrollment(c.id);
    /* автор мог принять задания, пока ученика не было, — сертификат выдаём при входе в курс */
    if (afterChange(c, en)) window.say('Все условия выполнены — сертификат получен!');
    var p = DJC.progress(c, en), cs = DJC.certStatus(c, en);
    var until = DJC.accessUntil(c, en);
    var returned = p.flat.filter(function (x) { return DJC.lessonState(c, en, x.lesson) === 'returned'; });

    var modulesHtml = c.modules.map(function (m) {
      return '<div class="card c-module"><div class="c-module-head"><h3>' + esc(m.name) + '</h3></div>'
        + m.lessons.map(function (l) {
            var x = p.flat.find(function (f) { return f.lesson.id === l.id; });
            var st = DJC.lessonState(c, en, l);
            var locked = !isDone(en, l) && p.frontier >= 0 && x.idx > p.frontier;
            var cls = st === 'done' ? 'is-done' : x.idx === p.frontier ? 'is-current' : locked ? 'is-locked' : '';
            var trail = st === 'done' ? DJC.ICON_CHECK : locked ? DJC.ICON_LOCK : DJC.ICON_PLAY;
            var extra = st === 'pending' ? ' · ' + tag('на проверке')
              : st === 'returned' ? ' · ' + tag('на доработку', 'warn')
              : st === 'failed' ? ' · ' + tag('тест не сдан', 'warn') : '';
            return '<div class="c-lesson ' + cls + '" role="button" tabindex="0" data-lesson="' + x.idx + '"' + (locked ? ' data-locked="1"' : '') + '>'
              + '<span class="c-lesson-icon">' + DJC.lessonIcon(l.kind) + '</span>'
              + '<span class="c-lesson-body"><span class="c-lesson-title">' + esc(l.title) + '</span><span class="c-lesson-meta">' + DJC.kindLabel(l.kind) + ' · ' + l.min + ' мин' + extra + '</span></span>'
              + '<span class="c-lesson-trail">' + trail + '</span></div>';
          }).join('')
        + '</div>';
    }).join('');

    $('#s-course').innerHTML =
      back('data-go="s-mine"')
      + '<div class="c-hero-cover" style="background:' + c.grad + '"></div>'
      + '<div class="stack" style="margin-top:18px">'
        + '<div><p class="caption">' + esc(c.topic) + ' · ' + esc(c.instructor) + '</p><h1 style="margin-top:4px">' + esc(c.title) + '</h1></div>'
        + '<div class="card">'
          + '<div class="c-progress-row"><span class="secondary">' + (p.pct >= 100 ? 'Все уроки пройдены' : 'Пройдено ' + p.done + ' из ' + p.total) + '</span><b>' + p.pct + '%</b></div>'
          + '<div class="c-progress"><i style="width:' + p.pct + '%"></i></div>'
          + '<p class="caption" style="margin-top:10px">' + (until ? 'Доступ до ' + DJC.fmtDate(until) : 'Доступ бессрочный') + '</p>'
          + (p.frontier >= 0
              ? '<p class="caption" style="margin:12px 0 10px">Дальше: ' + esc(p.flat[p.frontier].lesson.title) + '</p><button class="primary full" id="continueBtn">' + (p.done ? 'Продолжить' : 'Начать курс') + '</button>'
              : '')
        + '</div>'
        + (returned.length ? '<div class="card"><p class="c-note is-warn">Автор вернул на доработку: «' + esc(returned[0].lesson.title) + '». Посмотрите комментарий и отправьте ответ снова.</p><button class="secondary-button full" style="margin-top:12px" data-open-lesson="' + returned[0].idx + '">Открыть задание</button></div>' : '')
        + (cs.enabled ? '<div class="card"><div class="c-progress-row" style="margin-bottom:6px"><h3 style="font-size:19px">Сертификат</h3>' + (en.certAt ? tag('получен', 'ok') : '') + '</div>'
            + cs.items.map(function (i) {
                return '<div class="c-cond' + (i.ok ? ' is-ok' : '') + '"><i>' + (i.ok ? DJC.ICON_CHECK : '') + '</i><span>' + i.label + '</span><span class="caption">' + i.note + '</span></div>';
              }).join('')
            + (en.certAt ? '<button class="primary full" id="certBtn" style="margin-top:12px">Открыть сертификат</button>'
                         : '<p class="caption" style="margin-top:8px">Выполните условия — сертификат появится здесь</p>')
          + '</div>' : '')
        + '<div><h2 style="margin-bottom:12px">Программа курса</h2>' + modulesHtml + '</div>'
      + '</div>';

    var cont = $('#continueBtn'); if (cont) cont.addEventListener('click', function () { openLesson(c, p.frontier); });
    var cert = $('#certBtn'); if (cert) cert.addEventListener('click', function () { renderCert(c); go('s-cert'); });
    $$('#s-course [data-open-lesson]').forEach(function (b) { b.addEventListener('click', function () { openLesson(c, +b.dataset.openLesson); }); });
    $$('#s-course .c-lesson').forEach(function (row) {
      row.addEventListener('click', function () {
        var idx = +row.dataset.lesson;
        if (row.dataset.locked) { window.say('Урок откроется после «' + esc(p.flat[p.frontier].lesson.title) + '»'); return; }
        openLesson(c, idx);
      });
    });
  }

  /* ================= урок ================= */
  function lessonBody(c, en, l) {
    var st = DJC.lessonState(c, en, l);
    if (l.kind === 'video') {
      var v = l.video || {};
      return '<div class="c-player"><div class="c-player-play">' + DJC.ICON_PLAY.replace('width="16" height="16"', 'width="24" height="24"') + '</div><span class="c-player-time">0:00 / ' + l.min + ':00</span></div>'
        + (v.note ? '<p class="secondary" style="margin-top:12px">' + esc(v.note) + '</p>' : '')
        + (v.url ? '<p style="margin-top:8px"><a class="text-button" href="' + esc(v.url) + '" target="_blank" rel="noopener">Открыть видео по ссылке ↗</a></p>' : '')
        + '<div style="margin-top:16px">' + (st === 'done' ? tag('Просмотрено', 'ok') : '<button class="primary full" data-mark>Отметить просмотренным</button>') + '</div>';
    }
    if (l.kind === 'doc') {
      var d = l.doc || {};
      return '<div class="card"><p class="secondary" style="white-space:pre-line;color:var(--dj-text-body);line-height:1.4">' + esc(d.text || 'Материал урока скоро появится.') + '</p></div>'
        + '<div style="margin-top:16px">' + (st === 'done' ? tag('Прочитано', 'ok') : '<button class="primary full" data-mark>Прочитано</button>') + '</div>';
    }
    if (l.kind === 'task') {
      var t = l.task || {}, s = DJC.submission(c.id, l.id);
      var html = '<div class="card"><p class="caption" style="margin-bottom:6px">Задание</p><p class="secondary" style="color:var(--dj-text-body)">' + esc(t.task || '') + '</p>'
        + (t.deliverable ? '<p class="caption" style="margin-top:10px">Что прислать: ' + esc(t.deliverable) + '</p>' : '') + '</div>';
      var form = function (label, value) {
        return '<div class="field" style="margin:16px 0 12px"><label for="taskAnswer">Ваш ответ</label><textarea id="taskAnswer" rows="4" placeholder="Текст ответа или ссылка на видео/аудио/файл">' + esc(value || '') + '</textarea></div>'
          + '<button class="primary full" id="submitTaskBtn">' + label + '</button>';
      };
      if (st === 'todo') return html + form(c.grading.reviewTasks ? 'Отправить на проверку' : 'Сдать задание');
      if (st === 'pending') return html + '<div style="margin-top:16px">' + tag('Отправлено · ждёт проверки автором') + '</div><div class="c-answer" style="margin-top:10px">' + esc(s.answer) + '</div><p class="caption" style="margin-top:10px">Следующие уроки уже открыты — можно идти дальше, пока автор проверяет.</p>';
      if (st === 'returned') return html + '<div style="margin-top:16px">' + tag('Автор вернул на доработку', 'warn') + '</div>'
        + (s.comment ? '<p class="c-note is-warn" style="margin-top:10px">' + esc(s.comment) + '</p>' : '')
        + form('Отправить снова', s.answer);
      return html + '<div style="margin-top:16px">' + tag('Принято автором', 'ok') + '</div>'
        + (s.comment ? '<p class="c-note" style="margin-top:10px">' + esc(s.comment) + '</p>' : '')
        + '<div class="c-answer" style="margin-top:10px">' + esc(s.answer) + '</div>';
    }
    /* тест */
    var test = l.test || { questions: [], passScore: 70 };
    var r = (en.tests && en.tests[l.id]) || { attempts: 0, best: 0, passed: false };
    var limit = c.grading.testAttempts || 0;
    var info = '<p class="caption" style="margin-bottom:12px">' + test.questions.length + ' ' + DJC.plural(test.questions.length, ['вопрос', 'вопроса', 'вопросов'])
      + ' · проходной балл ' + test.passScore + '% · ' + (limit ? 'попыток: ' + r.attempts + ' из ' + limit : 'попыток без ограничений') + '</p>';
    if (r.passed) return info + '<div class="card">' + tag('Тест сдан', 'ok') + '<p class="secondary" style="margin-top:8px">Лучший результат: <b style="color:var(--dj-lime)">' + r.best + '%</b></p></div>';
    if (limit && r.attempts >= limit) return info + '<div class="card">' + tag('Попытки закончились', 'warn') + '<p class="secondary" style="margin-top:8px">Лучший результат: ' + r.best + '% при проходном ' + test.passScore + '%. Тест не засчитан' + (c.certificate.enabled && c.certificate.requireTests ? ' — без него сертификат не выдаётся' : '') + '.</p></div>';
    return info + '<div class="stack" id="testForm">'
      + test.questions.map(function (q, qi) {
          return '<div class="card" data-q="' + qi + '"><p class="secondary" style="margin-bottom:10px;color:var(--dj-text-body)">' + (qi + 1) + '. ' + esc(q.q) + '</p><div class="stack" style="gap:8px">'
            + q.options.map(function (opt, oi) { return '<label class="row" style="gap:10px"><input type="radio" name="test-q' + qi + '" class="tq-opt" value="' + oi + '"><span>' + esc(opt) + '</span></label>'; }).join('')
            + '</div><p class="caption tq-verdict" style="margin-top:8px" hidden></p></div>';
        }).join('')
      + '<button class="primary full" id="checkTestBtn">' + (r.attempts ? 'Проверить · попытка ' + (r.attempts + 1) : 'Проверить ответы') + '</button>'
      + '<div id="testResult"></div></div>';
  }

  function openLesson(c, idx) {
    cur = c;
    var en = DJC.enrollment(c.id), p = DJC.progress(c, en), x = p.flat[idx];
    if (!x) return;
    var l = x.lesson;
    var nextOpen = idx + 1 < p.total && isDone(en, l);

    $('#s-lesson').innerHTML =
      back('data-course-home="' + c.id + '"')
      + '<p class="caption">' + esc(x.module.name) + ' · ' + DJC.kindLabel(l.kind) + ' · ' + l.min + ' мин · урок ' + (idx + 1) + ' из ' + p.total + '</p>'
      + '<h1 style="margin:4px 0 16px;font-size:26px">' + esc(l.title) + '</h1>'
      + lessonBody(c, en, l)
      + '<div class="row" style="margin-top:22px">'
        + (idx > 0 ? '<button class="secondary-button" data-nav="' + (idx - 1) + '">← Назад</button>' : '')
        + (nextOpen ? '<button class="secondary-button" style="margin-left:auto" data-nav="' + (idx + 1) + '">Следующий урок →</button>' : '')
      + '</div>';

    /* видео / текст */
    var mark = $('#s-lesson [data-mark]');
    if (mark) mark.addEventListener('click', function () {
      if (!isDone(en, l)) en.done.push(l.id);
      var cert = afterChange(c, en);
      if (cert) { window.say('Все условия выполнены — сертификат получен!'); renderCert(c); go('s-cert'); return; }
      if (idx + 1 < p.total) { window.say(l.kind === 'doc' ? 'Отмечено как прочитанное' : 'Отмечено как просмотренное'); openLesson(c, idx + 1); }
      else { window.say('Все уроки пройдены'); renderCourseHome(c); go('s-course'); }
    });

    /* задание */
    var submit = $('#submitTaskBtn');
    if (submit) submit.addEventListener('click', function () {
      var answer = $('#taskAnswer').value.trim();
      if (!answer) { window.say('Напишите ответ или вставьте ссылку'); $('#taskAnswer').focus(); return; }
      window.SUBMISSIONS.push({
        id: 's' + Date.now().toString(36), courseId: c.id, lessonId: l.id, student: ME, at: DJC.today(),
        status: c.grading.reviewTasks ? 'pending' : 'accepted', answer: answer,
      });
      if (!isDone(en, l)) en.done.push(l.id);
      var cert = afterChange(c, en);
      window.say(cert ? 'Сертификат получен!' : c.grading.reviewTasks ? 'Отправлено автору на проверку' : 'Задание сдано');
      openLesson(c, idx);
    });

    /* тест */
    var check = $('#checkTestBtn');
    if (check) check.addEventListener('click', function () {
      var test = l.test, picks = [];
      for (var i = 0; i < test.questions.length; i++) {
        var r0 = $('input[name="test-q' + i + '"]:checked');
        if (!r0) { window.say('Ответьте на вопрос ' + (i + 1)); $('[data-q="' + i + '"]').scrollIntoView({ block: 'center' }); return; }
        picks.push(+r0.value);
      }
      var right = picks.filter(function (pk, i) { return pk === test.questions[i].correct; }).length;
      var score = Math.round(right / test.questions.length * 100);
      en.tests = en.tests || {};
      var r = en.tests[l.id] = en.tests[l.id] || { attempts: 0, best: 0, passed: false };
      r.attempts++; r.best = Math.max(r.best, score);
      var passed = score >= test.passScore;
      var limit = c.grading.testAttempts || 0;
      var exhausted = !passed && limit && r.attempts >= limit;
      if (passed) r.passed = true;
      if ((passed || exhausted) && !isDone(en, l)) en.done.push(l.id);
      var cert = afterChange(c, en);

      $$('#testForm [data-q]').forEach(function (card, i) {
        var ok = picks[i] === test.questions[i].correct;
        card.classList.add(ok ? 'is-right' : 'is-wrong');
        var v = $('.tq-verdict', card); v.hidden = false; v.innerHTML = ok ? tag('верно', 'ok') : tag('неверно', 'warn');
        $$('input', card).forEach(function (inp) { inp.disabled = true; });
      });
      check.remove();
      var left = limit ? limit - r.attempts : 0;
      $('#testResult').innerHTML = '<div class="card">'
        + '<p class="secondary">Результат: <b style="color:' + (passed ? 'var(--dj-lime)' : 'var(--dj-magenta)') + '">' + score + '%</b> · ' + right + ' из ' + test.questions.length + ' · нужно ' + test.passScore + '%</p>'
        + '<p style="margin-top:8px">' + (passed ? tag('Тест сдан', 'ok') : exhausted ? tag('Не сдан · попытки закончились', 'warn') : tag('Не сдан' + (limit ? ' · осталось попыток: ' + left : ''), 'warn')) + '</p>'
        + (!passed && !exhausted ? '<button class="secondary-button full" id="retryBtn" style="margin-top:12px">Пройти ещё раз</button>' : '')
        + (passed || exhausted ? (idx + 1 < p.total ? '<button class="primary full" data-nav="' + (idx + 1) + '" style="margin-top:12px">Следующий урок →</button>' : '<button class="primary full" data-course-home="' + c.id + '" style="margin-top:12px">К курсу</button>') : '')
        + '</div>';
      var retry = $('#retryBtn'); if (retry) retry.addEventListener('click', function () { openLesson(c, idx); });
      if (cert) window.say('Все условия выполнены — сертификат получен!');
      else window.say(passed ? 'Тест сдан' : 'Тест не сдан');
    });

    go('s-lesson');
  }

  /* ================= сертификат ================= */
  function renderCert(c) {
    var en = DJC.enrollment(c.id);
    $('#s-cert').innerHTML =
      back('data-course-home="' + c.id + '"')
      + '<div class="heading"><h1 style="font-size:26px">Сертификат</h1></div>'
      + DJC.certHtml(c, ME, en.certAt, DJC.certNumber(c, en))
      + '<button class="primary full" id="printCert" style="margin-top:18px">Сохранить в PDF</button>'
      + '<p class="caption" style="margin-top:8px;text-align:center">Откроется окно печати — выберите «Сохранить как PDF»</p>';
    $('#printCert').addEventListener('click', function () { window.print(); });
  }

  /* ================= навигация ================= */
  $$('#mineSeg button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#mineSeg button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      seg = b.dataset.seg; renderMine();
    });
  });
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.t-card-link');
    if (link) {
      var card = link.closest('[data-course-id]');
      if (card && !card.dataset.saved) { e.preventDefault(); var c = window.courseById(card.dataset.courseId); if (c) { renderCourseHome(c); go('s-course'); } }
      return;
    }
    var g = e.target.closest('[data-go]');
    if (g) { if (g.dataset.go === 's-mine') renderMine(); go(g.dataset.go); return; }
    var h = e.target.closest('[data-course-home]');
    if (h) { var c2 = window.courseById(h.dataset.courseHome); if (c2) { renderCourseHome(c2); go('s-course'); } return; }
    var n = e.target.closest('[data-nav]');
    if (n && cur) openLesson(cur, +n.dataset.nav);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var m = location.search.match(/course=(\d+)/);
    if (m) {
      var c = window.courseById(m[1]);
      if (c && DJC.enrollment(c.id)) { seg = DJC.enrollment(c.id).status || 'active'; renderCourseHome(c); go('s-course'); }
      else if (c) { location.replace('index.html?course=' + c.id); return; }
    }
    $$('#mineSeg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.seg === seg)); });
    renderMine();
  });
})();
