'use strict';
/* Кабинет автора курсов.
   Курс настраивается по шагам: 1 описание и обложка → 2 программа и уроки (видео/текст/задание/тест)
   → 3 оценки и сертификат → 4 цена и доступ → публикация. После публикации — проверка заданий,
   ученики, доход. Все изменения сразу сохраняются (window.saveCourses), поэтому каталог
   и кабинет ученика видят новый курс и правки. */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var esc = DJC.esc;
  var AUTHOR = 'DJ Контур';
  var cur = null;          // открытый курс
  var reviewSeg = 'pending';
  var reviewScope = null;  // { ids:[...], back:'t-course'|'t-mine' }

  function save(msg) { window.saveCourses(); if (msg) window.say(msg); }
  function myCourses() { return window.COURSES.filter(function (c) { return c.instructor === AUTHOR; }); }
  function lessonsCount(c) { return c.modules.reduce(function (n, m) { return n + m.lessons.length; }, 0); }
  function pendingFor(ids) { return (window.SUBMISSIONS || []).filter(function (s) { return ids.indexOf(s.courseId) >= 0 && s.status === 'pending'; }); }
  function findLesson(c, id) { var x = DJC.flat(c).find(function (f) { return f.lesson.id === id; }); return x ? x.lesson : null; }

  var TOPICS = ['Скретч', 'Продюсирование', 'Диджеинг', 'Бизнес', 'Оборудование'];
  var LEVELS = ['Начинающий', 'Средний', 'Профи'];
  var GRADS = ['var(--dj-avatar-1)', 'var(--dj-avatar-2)', 'var(--dj-avatar-3)', 'var(--dj-avatar-4)', 'var(--dj-avatar-5)', 'var(--dj-avatar-6)'];
  var HANDLE = '<span class="dj-handle" data-drag-handle aria-label="Перетащить"><svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>';

  function back(target) { return '<div class="row" style="margin-bottom:16px"><button class="icon" data-go="' + target + '" aria-label="Назад">←</button></div>'; }
  function title(text, sub) {
    return '<div class="heading" style="margin-bottom:' + (sub ? '6' : '18') + 'px"><h1 style="font-size:26px">' + text + '</h1></div>'
      + (sub ? '<p class="caption" style="margin-bottom:18px">' + sub + '</p>' : '');
  }
  function switchRow(id, label, checked, note) {
    return '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px">'
      + '<label for="' + id + '" style="flex:1;min-width:0"><span style="display:block;font-size:17px;color:var(--dj-text-body)">' + label + '</span>'
      + (note ? '<span class="caption" style="display:block;margin-top:4px;line-height:1.3">' + note + '</span>' : '') + '</label>'
      + '<span class="switch" style="margin-top:2px"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '><i></i></span></div>';
  }

  /* ================= главный экран кабинета ================= */
  function renderStats() {
    var mine = myCourses();
    var students = mine.reduce(function (n, c) { return n + c.students; }, 0);
    var month = mine.reduce(function (n, c) { return n + c.revenueMonth; }, 0);
    var total = mine.reduce(function (n, c) { return n + c.revenueTotal; }, 0);
    $('#authorStats').innerHTML =
      '<div class="card c-stat"><b>' + students + '</b><span>УЧЕНИКОВ</span></div>'
      + '<div class="card c-stat"><b>' + DJC.fmtRub(month) + '</b><span>ЗА МЕСЯЦ</span></div>'
      + '<div class="card c-stat"><b>' + DJC.fmtRub(total) + '</b><span>ВСЕГО</span></div>';
  }
  function cardFor(c) {
    var stage = DJC.stageFor(c);
    var pend = pendingFor([c.id]).length;
    return window.djCourseCard({
      id: c.id, href: '#', kind: stage.kind, grad: c.grad, glyph: DJC.glyph(c.topic),
      stageLabel: stage.label, stageTone: stage.tone, topic: c.topic, level: c.level, title: c.title,
      big: c.status === 'draft' ? 'Не опубликован' : DJC.fmtRub(c.revenueMonth) + ' в мес.',
      facts: [['Уроков', String(lessonsCount(c))], ['Учеников', String(c.students)]],
      role: c.status === 'draft' ? 'Продолжить настройку' : (pend ? pend + ' ' + DJC.plural(pend, ['задание ждёт', 'задания ждут', 'заданий ждут']) + ' проверки' : 'Открыть курс'),
    });
  }
  function renderMine() {
    var mine = myCourses();
    var pend = pendingFor(mine.map(function (c) { return c.id; })).length;
    $('#reviewBox').innerHTML = pend
      ? '<div class="menu-links" style="margin-bottom:24px"><a href="#" id="reviewAllBtn"><div><h3 style="font-size:19px">Проверка заданий</h3><p class="caption" style="margin-top:3px"><span class="c-tag">' + pend + ' ' + DJC.plural(pend, ['ответ ждёт', 'ответа ждут', 'ответов ждут']) + ' проверки</span></p></div><span class="chevron">→</span></a></div>'
      : '';
    var rb = $('#reviewAllBtn');
    if (rb) rb.addEventListener('click', function (e) {
      e.preventDefault();
      reviewSeg = 'pending';
      renderReview({ ids: mine.map(function (c) { return c.id; }), back: 't-mine' }); go('t-review');
    });
    $('#mineList').innerHTML = mine.map(cardFor).join('');
  }

  /* ================= страница курса: шаги настройки ================= */
  function gradingNote(c) {
    var parts = [];
    var tests = DJC.flat(c).filter(function (x) { return x.lesson.kind === 'test'; }).length;
    if (tests) parts.push(c.grading.testAttempts ? c.grading.testAttempts + ' ' + DJC.plural(c.grading.testAttempts, ['попытка', 'попытки', 'попыток']) + ' на тест' : 'попыток без ограничений');
    parts.push(c.grading.reviewTasks ? 'задания проверяете вы' : 'задания засчитываются сразу');
    parts.push(c.certificate.enabled ? 'сертификат выдаётся' : 'без сертификата');
    return parts.join(' · ');
  }
  function renderCourse(c) {
    cur = c;
    var n = lessonsCount(c), stage = DJC.stageFor(c), draft = c.status === 'draft';
    var free = c.access && c.access.free;
    var steps = [
      { key: 'info', title: 'Описание и обложка', ok: !!(c.title && c.summary),
        note: c.summary ? c.topic + ' · ' + c.level + (c.learn.length ? ' · ' + c.learn.length + ' ' + DJC.plural(c.learn.length, ['пункт', 'пункта', 'пунктов']) + ' «чему научитесь»' : '') : 'Добавьте описание — его видно в каталоге' },
      { key: 'editor', title: 'Программа и уроки', ok: n > 0,
        note: n ? c.modules.length + ' ' + DJC.plural(c.modules.length, ['модуль', 'модуля', 'модулей']) + ' · ' + DJC.kindCounts(c) : 'Пока нет уроков — добавьте видео, текст, задание или тест' },
      { key: 'grading', title: 'Оценки и сертификат', ok: true, note: gradingNote(c) },
      { key: 'price', title: 'Цена и доступ', ok: true,
        note: DJC.priceLabel(c) + (!free && c.oldPrice > c.price ? ' вместо ' + DJC.fmtRub(c.oldPrice) : '') + ' · ' + DJC.accessLabel(c) },
    ];
    var pend = pendingFor([c.id]).length;

    $('#t-course').innerHTML =
      back('t-mine')
      + '<div class="c-hero-cover" style="background:' + c.grad + '"><span class="aud-badge">' + tournamentStatus(stage.label, stage.tone) + '</span></div>'
      + '<div class="stack" style="margin-top:18px">'
        + '<div><p class="caption">' + esc(c.topic) + ' · ' + esc(c.level) + '</p><h1 style="margin-top:4px">' + esc(c.title) + '</h1></div>'
        + (draft ? '<p class="secondary">Черновик виден только вам. Пройдите шаги 1–4 и опубликуйте — курс появится в каталоге.</p>'
                 : '<div class="c-stat-row"><div class="card c-stat"><b>' + c.students + '</b><span>УЧЕНИКОВ</span></div><div class="card c-stat"><b>' + c.completion + '%</b><span>ДОХОДИМОСТЬ</span></div><div class="card c-stat"><b>' + DJC.fmtRub(c.revenueTotal) + '</b><span>ЗАРАБОТАНО</span></div></div>')
        + (draft ? '' : '<div class="menu-links">'
            + '<a href="#" data-open="review"><div><h3 style="font-size:19px">Проверка заданий</h3><p class="caption" style="margin-top:3px">' + (pend ? '<span class="c-tag">' + pend + ' ' + DJC.plural(pend, ['ответ ждёт', 'ответа ждут', 'ответов ждут']) + ' проверки</span>' : 'Новых ответов нет') + '</p></div><span class="chevron">→</span></a>'
            + '<a href="#" data-open="students"><div><h3 style="font-size:19px">Ученики</h3><p class="caption" style="margin-top:3px">Кто записан и как идёт</p></div><span class="chevron">→</span></a>'
            + '<a href="#" data-open="earnings"><div><h3 style="font-size:19px">Доход</h3><p class="caption" style="margin-top:3px">' + DJC.fmtRub(c.revenueMonth) + ' за этот месяц</p></div><span class="chevron">→</span></a>'
          + '</div>')
        + '<h2 style="font-size:20px;margin-top:8px">Настройка курса</h2>'
        + '<div class="menu-links c-steps">'
          + steps.map(function (s, i) {
              return '<a href="#" data-open="' + s.key + '"><span class="c-step-num' + (s.ok ? ' is-ok' : '') + '">' + (s.ok ? DJC.ICON_CHECK : i + 1) + '</span>'
                + '<div><h3 style="font-size:19px">' + s.title + '</h3><p class="caption" style="margin-top:3px">' + s.note + '</p></div><span class="chevron">→</span></a>';
            }).join('')
        + '</div>'
        + '<a class="secondary-button full" href="index.html?course=' + c.id + '">Посмотреть как ученик</a>'
        + '<button class="' + (draft ? 'primary' : 'secondary-button') + ' full" id="publishBtn">' + (draft ? 'Опубликовать курс' : 'Снять с публикации') + '</button>'
      + '</div>';

    $$('#t-course [data-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var k = a.dataset.open;
        if (k === 'info') { renderInfo(c); go('t-info'); }
        if (k === 'editor') { renderEditor(c); go('t-editor'); }
        if (k === 'grading') { renderGrading(c); go('t-grading'); }
        if (k === 'price') { renderPrice(c); go('t-price'); }
        if (k === 'review') { reviewSeg = 'pending'; renderReview({ ids: [c.id], back: 't-course' }); go('t-review'); }
        if (k === 'students') { renderStudents(c); go('t-students'); }
        if (k === 'earnings') { renderEarnings(c); go('t-earnings'); }
      });
    });
    $('#publishBtn').addEventListener('click', function () {
      if (c.status === 'draft') {
        if (!lessonsCount(c)) { window.say('Сначала добавьте хотя бы один урок — шаг 2'); return; }
        var emptyTest = DJC.flat(c).find(function (x) { return x.lesson.kind === 'test' && !(x.lesson.test && x.lesson.test.questions.length); });
        if (emptyTest) { window.say('В тесте «' + esc(emptyTest.lesson.title) + '» нет вопросов'); return; }
        c.status = 'published';
        save('Курс опубликован — он уже в каталоге');
      } else {
        c.status = 'draft';
        save('Курс снят с публикации');
      }
      renderCourse(c);
    });
  }

  /* ================= шаг 1: описание и обложка (и создание нового курса) ================= */
  function renderInfo(c) {
    var isNew = !c;
    var d = c || { title: '', topic: TOPICS[0], level: LEVELS[0], summary: '', learn: [], grad: GRADS[5] };
    var grad = d.grad;
    $('#t-info').innerHTML =
      back(isNew ? 't-mine' : 't-course')
      + title(isNew ? 'Новый курс' : 'Описание и обложка', isNew ? 'Шаг 1 из 4. Потом — программа с уроками, оценки и сертификат, цена и доступ.' : '')
      + '<div class="c-hero-cover" id="ciCover" style="background:' + grad + ';aspect-ratio:16/7;margin-bottom:12px"></div>'
      + '<div class="field"><span>Цвет обложки</span><div class="c-swatches" id="ciGrads">'
        + GRADS.map(function (g) { return '<button type="button" data-grad="' + g + '" aria-pressed="' + (g === grad) + '" aria-label="Цвет обложки" style="background:' + g + '"></button>'; }).join('')
      + '</div></div>'
      + '<div class="field"><label for="ciTitle">Название курса</label><input class="input" id="ciTitle" type="text" value="' + esc(d.title) + '" placeholder="Например: Скретч с нуля"></div>'
      + '<div class="row" style="gap:10px;align-items:stretch">'
        + '<div class="field" style="flex:1;min-width:0"><label for="ciTopic">Тема</label><select id="ciTopic">' + TOPICS.map(function (t) { return '<option' + (t === d.topic ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>'
        + '<div class="field" style="flex:1;min-width:0"><label for="ciLevel">Уровень</label><select id="ciLevel">' + LEVELS.map(function (t) { return '<option' + (t === d.level ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>'
      + '</div>'
      + '<div class="field"><label for="ciSummary">Коротко о курсе</label><textarea id="ciSummary" rows="4" placeholder="Что за курс и для кого — это видно в каталоге">' + esc(d.summary) + '</textarea></div>'
      + '<div class="field"><label for="ciLearn">Чему научится ученик — каждый пункт с новой строки</label><textarea id="ciLearn" rows="4" placeholder="Держать ритм без метронома">' + esc((d.learn || []).join('\n')) + '</textarea></div>'
      + '<button class="primary full" id="ciSave">' + (isNew ? 'Создать курс' : 'Сохранить') + '</button>';

    $$('#ciGrads button').forEach(function (b) {
      b.addEventListener('click', function () {
        grad = b.dataset.grad;
        $$('#ciGrads button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $('#ciCover').style.background = grad;
      });
    });
    $('#ciSave').addEventListener('click', function () {
      var t = $('#ciTitle').value.trim();
      if (!t) { window.say('Введите название курса'); $('#ciTitle').focus(); return; }
      var fields = {
        title: t, topic: $('#ciTopic').value, level: $('#ciLevel').value, grad: grad,
        summary: $('#ciSummary').value.trim(),
        learn: $('#ciLearn').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      };
      if (isNew) {
        var id = window.COURSES.reduce(function (n, x) { return Math.max(n, x.id); }, 0) + 1;
        var nc = Object.assign({
          id: id, slug: 'course-' + id, instructor: AUTHOR, price: 3000, status: 'draft',
          students: 0, revenueTotal: 0, revenueMonth: 0, completion: 0,
          access: { free: false, durationType: 'unlimited', days: 30 },
          grading: { reviewTasks: true, testAttempts: 0 },
          certificate: { enabled: true, requireTests: true, requireTasks: true },
          modules: [{ name: 'Модуль 1', lessons: [] }],
        }, fields);
        window.COURSES.push(nc);
        save('Курс создан. Шаг 2 — добавьте уроки в программу');
        renderStats(); renderMine(); renderCourse(nc); go('t-course');
      } else {
        Object.assign(c, fields);
        save('Описание сохранено');
        renderCourse(c); go('t-course');
      }
    });
  }

  /* ================= шаг 3: оценки и сертификат ================= */
  function renderGrading(c) {
    var tests = DJC.flat(c).filter(function (x) { return x.lesson.kind === 'test'; });
    var g = c.grading, cert = c.certificate;
    $('#t-grading').innerHTML =
      back('t-course') + title('Оценки и сертификат')
      + '<div class="card"><h3 style="font-size:19px">Тесты</h3><p class="caption" style="margin:4px 0 10px">Вопросы и проходной балл задаются в самом тесте</p>'
        + (tests.length ? tests.map(function (x) {
            var q = (x.lesson.test && x.lesson.test.questions.length) || 0;
            return '<a href="#" class="c-lesson" data-test-mi="' + x.mi + '" data-test-li="' + x.li + '"><span class="c-lesson-icon">' + DJC.lessonIcon('test') + '</span>'
              + '<span class="c-lesson-body"><span class="c-lesson-title">' + esc(x.lesson.title) + '</span><span class="c-lesson-meta">проходной балл ' + ((x.lesson.test && x.lesson.test.passScore) || 70) + '% · ' + q + ' ' + DJC.plural(q, ['вопрос', 'вопроса', 'вопросов']) + '</span></span><span class="c-lesson-trail">→</span></a>';
          }).join('') : '<p class="secondary" style="margin-bottom:10px">В программе пока нет тестов — добавьте урок с типом «Тест»</p>')
        + '<div class="field" style="margin:14px 0 0"><label for="grAttempts">Попыток на каждый тест</label><select id="grAttempts">'
          + [[0, 'Без ограничений'], [1, '1 попытка'], [2, '2 попытки'], [3, '3 попытки'], [5, '5 попыток']].map(function (o) { return '<option value="' + o[0] + '"' + (g.testAttempts === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('')
        + '</select></div>'
      + '</div>'
      + '<div class="card" style="margin-top:14px"><h3 style="font-size:19px;margin-bottom:12px">Задания</h3>'
        + switchRow('grReview', 'Задания проверяю я', g.reviewTasks, 'Ответы учеников приходят в «Проверку заданий»: вы принимаете или возвращаете на доработку с комментарием. Если выключить — задание засчитывается сразу после отправки.')
      + '</div>'
      + '<div class="card" style="margin-top:14px"><h3 style="font-size:19px;margin-bottom:12px">Сертификат</h3>'
        + switchRow('crtOn', 'Выдавать сертификат', cert.enabled, 'Ученик получит его, как только выполнит условия ниже')
        + '<div id="crtBody"' + (cert.enabled ? '' : ' hidden') + '>'
          + '<div class="checks" style="flex-direction:column;align-items:stretch;margin-top:14px">'
            + '<label><input type="checkbox" checked disabled> Пройдены все уроки</label>'
            + '<label><input type="checkbox" id="crtTests"' + (cert.requireTests ? ' checked' : '') + '> Сданы все тесты</label>'
            + '<label><input type="checkbox" id="crtTasks"' + (cert.requireTasks ? ' checked' : '') + '> Все задания приняты автором</label>'
          + '</div>'
          + '<p class="caption" style="margin:18px 0 10px">Так выглядит сертификат</p>'
          + DJC.certHtml(c, 'Имя ученика', DJC.today(), DJC.certNumber(c, null))
        + '</div>'
      + '</div>';

    $$('#t-grading [data-test-mi]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        renderLessonEdit(c, +a.dataset.testMi, +a.dataset.testLi, 't-grading'); go('t-lesson-edit');
      });
    });
    $('#grAttempts').addEventListener('change', function (e) {
      g.testAttempts = +e.target.value;
      save(g.testAttempts ? 'На каждый тест — ' + e.target.selectedOptions[0].textContent.toLowerCase() : 'Тесты можно пересдавать без ограничений');
    });
    $('#grReview').addEventListener('change', function (e) {
      g.reviewTasks = e.target.checked;
      save(g.reviewTasks ? 'Задания будут приходить вам на проверку' : 'Задания засчитываются сразу после отправки');
    });
    $('#crtOn').addEventListener('change', function (e) {
      cert.enabled = e.target.checked;
      $('#crtBody').hidden = !cert.enabled;
      save(cert.enabled ? 'Сертификат включён' : 'Курс без сертификата');
    });
    $('#crtTests').addEventListener('change', function (e) { cert.requireTests = e.target.checked; save('Условия сертификата сохранены'); });
    $('#crtTasks').addEventListener('change', function (e) { cert.requireTasks = e.target.checked; save('Условия сертификата сохранены'); });
  }

  /* ================= шаг 4: цена и доступ ================= */
  function pricePreview(c) {
    var free = c.access.free;
    return '<div class="c-price-row"><span style="display:flex;align-items:baseline;gap:10px;min-width:0">'
        + '<span class="c-price' + (free ? ' is-free' : '') + '">' + DJC.priceLabel(c) + '</span>'
        + (!free && c.oldPrice > c.price ? '<span class="c-old-price">' + DJC.fmtRub(c.oldPrice) + '</span>' : '')
      + '</span></div>'
      + '<p class="caption" style="margin-top:6px">' + DJC.accessLabel(c) + (c.certificate.enabled ? ' · сертификат по окончании' : '') + '</p>'
      + '<button class="primary full" style="margin-top:14px;pointer-events:none" tabindex="-1">' + (free ? 'Записаться бесплатно' : 'Купить за ' + DJC.fmtRub(c.price)) + '</button>';
  }
  function renderPrice(c) {
    var a = c.access, timed = a.durationType === 'timed';
    $('#t-price').innerHTML =
      back('t-course') + title('Цена и доступ')
      + '<div class="card">'
        + switchRow('prFree', 'Бесплатный курс', a.free, 'Записаться можно без оплаты')
        + '<div id="prPaid" style="margin-top:16px"' + (a.free ? ' hidden' : '') + '>'
          + '<div class="field"><label for="prPrice">Цена, ₽</label><input class="input" id="prPrice" type="number" inputmode="numeric" min="0" step="100" value="' + c.price + '"></div>'
          + '<div class="field" style="margin-bottom:0"><label for="prOld">Цена до скидки, ₽ — необязательно</label><input class="input" id="prOld" type="number" inputmode="numeric" min="0" step="100" value="' + (c.oldPrice || '') + '" placeholder="Покажется зачёркнутой"></div>'
        + '</div>'
      + '</div>'
      + '<div class="card" style="margin-top:14px">'
        + switchRow('prTimed', 'Ограничить доступ по времени', timed, 'Отсчёт с момента записи. Когда срок выйдет, уроки закроются, а полученный сертификат останется.')
        + '<div class="field" id="prDaysField" style="margin:16px 0 0"' + (timed ? '' : ' hidden') + '><label for="prDays">Сколько дней открыт доступ</label><input class="input" id="prDays" type="number" inputmode="numeric" min="1" value="' + (a.days || 30) + '"></div>'
      + '</div>'
      + '<p class="caption" style="margin:22px 0 10px">Так это увидит ученик на странице курса</p>'
      + '<div class="card" id="prPreview">' + pricePreview(c) + '</div>';

    function refresh() { $('#prPreview').innerHTML = pricePreview(c); }
    $('#prFree').addEventListener('change', function (e) {
      a.free = e.target.checked; $('#prPaid').hidden = a.free; refresh();
      save(a.free ? 'Курс бесплатный' : 'Курс платный — ' + DJC.fmtRub(c.price));
    });
    $('#prPrice').addEventListener('change', function (e) {
      c.price = Math.max(0, parseInt(e.target.value, 10) || 0); refresh(); save('Цена: ' + DJC.fmtRub(c.price));
    });
    $('#prOld').addEventListener('change', function (e) {
      var v = parseInt(e.target.value, 10) || 0;
      if (v && v <= c.price) { window.say('Цена до скидки должна быть больше цены курса'); }
      c.oldPrice = v > c.price ? v : 0; if (!c.oldPrice) e.target.value = ''; refresh(); save(c.oldPrice ? 'Скидка: было ' + DJC.fmtRub(c.oldPrice) : '');
    });
    $('#prTimed').addEventListener('change', function (e) {
      a.durationType = e.target.checked ? 'timed' : 'unlimited'; $('#prDaysField').hidden = !e.target.checked; refresh();
      save(e.target.checked ? 'Доступ на ' + a.days + ' дн. с момента записи' : 'Доступ бессрочный');
    });
    $('#prDays').addEventListener('change', function (e) {
      a.days = Math.max(1, parseInt(e.target.value, 10) || 30); e.target.value = a.days; refresh(); save('Доступ на ' + a.days + ' дн. с момента записи');
    });
  }

  /* ================= шаг 2: программа — модули и уроки ================= */
  /* Перетаскивание карточек за ручку [data-drag-handle] внутри list — общий код для модулей и уроков (как в турах). */
  function makeSortable(list, itemSelector, onReorder) {
    var dragging = null, startY = 0, startTop = 0;
    function rects() { return $$(':scope > ' + itemSelector, list).map(function (el) { var r = el.getBoundingClientRect(); return { el: el, top: r.top, bottom: r.bottom }; }); }
    function onDown(e) {
      var handle = e.target.closest('[data-drag-handle]'); if (!handle) return;
      var card = handle.closest(itemSelector); if (!card || card.parentNode !== list) return;
      e.preventDefault();
      dragging = card; startY = e.clientY; startTop = card.getBoundingClientRect().top;
      card.classList.add('dragging'); card.style.position = 'relative'; card.style.zIndex = 50;
      handle.classList.add('is-dragging'); handle.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
    }
    function onMove(e) {
      if (!dragging) return;
      var dy = e.clientY - startY;
      dragging.style.transform = 'translateY(' + dy + 'px)';
      var rr = rects(); var dr = dragging.getBoundingClientRect(); var mid = dr.top + dr.height / 2;
      for (var i = 0; i < rr.length; i++) {
        var r = rr[i]; if (r.el === dragging) continue;
        if (mid > r.top && mid < r.bottom) {
          var di = Array.prototype.indexOf.call(list.children, dragging);
          var ti = Array.prototype.indexOf.call(list.children, r.el);
          if (di < ti) list.insertBefore(dragging, r.el.nextSibling); else list.insertBefore(dragging, r.el);
          var newTop = dragging.getBoundingClientRect().top; var visualTop = startTop + dy;
          startTop = newTop; startY = e.clientY; dragging.style.transform = 'translateY(' + (visualTop - newTop) + 'px)';
          break;
        }
      }
    }
    function onUp() {
      if (!dragging) return;
      var card = dragging; card.style.transform = 'translateY(0px)'; card.classList.remove('dragging'); card.style.zIndex = '';
      var h = card.querySelector('[data-drag-handle]'); if (h) h.classList.remove('is-dragging');
      dragging = null;
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp);
      card.style.position = '';
      var order = $$(':scope > ' + itemSelector, list).map(function (el) { return parseInt(el.dataset.idx, 10); });
      $$(':scope > ' + itemSelector, list).forEach(function (el, i) { el.dataset.idx = i; });
      onReorder(order);
    }
    list.addEventListener('pointerdown', onDown);
  }

  function renderEditor(c) {
    var n = lessonsCount(c);
    $('#t-editor').innerHTML =
      back('t-course')
      + title('Программа курса', n ? c.modules.length + ' ' + DJC.plural(c.modules.length, ['модуль', 'модуля', 'модулей']) + ' · ' + DJC.kindCounts(c) : 'Курс состоит из модулей, в модуле — уроки. Откройте модуль и добавьте уроки: видео, текст, задание или тест.')
      + '<div class="stack" id="modulesList">'
      + c.modules.map(function (m, i) {
          return '<div class="dj-card card c-editor-module" data-idx="' + i + '">' + HANDLE
            + '<span class="grow" data-open-module="' + i + '" role="button" tabindex="0"><h3>' + esc(m.name) + '</h3><p class="caption">' + (m.lessons.length ? m.lessons.length + ' ' + DJC.plural(m.lessons.length, ['урок', 'урока', 'уроков']) : 'Нет уроков — откройте и добавьте') + '</p></span>'
            + '<span class="chevron" data-open-module="' + i + '" role="button" tabindex="0">→</span>'
            + '</div>';
        }).join('')
      + '</div>'
      + '<button class="text-button" id="addModuleBtn" style="margin-top:8px">+ Добавить модуль</button>'
      + '<p class="caption" style="margin-top:14px">Порядок меняется перетаскиванием за ручку слева</p>';

    $$('#modulesList [data-open-module]').forEach(function (el) {
      el.addEventListener('click', function () { renderModule(c, parseInt(el.dataset.openModule, 10)); go('t-module'); });
    });
    $('#addModuleBtn').addEventListener('click', function () {
      c.modules.push({ name: 'Модуль ' + (c.modules.length + 1), lessons: [] });
      save('Модуль добавлен — назовите его и добавьте уроки');
      renderEditor(c); renderModule(c, c.modules.length - 1); go('t-module');
    });
    makeSortable($('#modulesList'), '.c-editor-module', function (order) {
      c.modules = order.map(function (i) { return c.modules[i]; });
      save('Порядок модулей обновлён');
    });
  }

  function renderModule(c, mi) {
    var m = c.modules[mi];
    $('#t-module').innerHTML =
      '<div class="row" style="margin-bottom:16px"><button class="icon" id="moduleBack" aria-label="Назад">←</button></div>'
      + '<div class="field" style="margin-bottom:18px"><label for="moduleName">Название модуля</label><input class="input" id="moduleName" type="text" value="' + esc(m.name) + '" style="font-size:19px;font-weight:600"></div>'
      + '<div class="stack" id="lessonsList">'
      + (m.lessons.length ? m.lessons.map(function (l, li) {
          return '<div class="dj-card card c-editor-module" data-idx="' + li + '">' + HANDLE
            + '<span class="c-lesson-icon" aria-hidden="true">' + DJC.lessonIcon(l.kind) + '</span>'
            + '<span class="grow" data-open-lesson="' + li + '" role="button" tabindex="0"><h3 style="font-size:17px">' + esc(l.title) + '</h3><p class="caption">' + DJC.kindLabel(l.kind) + ' · ' + l.min + ' мин</p></span>'
            + '<span class="chevron" data-open-lesson="' + li + '" role="button" tabindex="0">→</span>'
            + '</div>';
        }).join('') : '<div class="card"><p class="secondary">В модуле пока нет уроков. Урок бывает четырёх типов: <b>видео</b> — ролик с описанием, <b>текст</b> — материал для чтения, <b>задание</b> — ученик присылает ответ вам на проверку, <b>тест</b> — вопросы с вариантами и проходным баллом.</p></div>')
      + '</div>'
      + '<button class="primary full" id="addLessonBtn" style="margin-top:14px">+ Добавить урок</button>'
      + '<button class="secondary-button full" id="deleteModuleBtn" style="margin-top:12px">Удалить модуль</button>';

    $('#moduleBack').addEventListener('click', function () { renderEditor(c); go('t-editor'); });
    $('#moduleName').addEventListener('change', function (e) { m.name = e.target.value.trim() || 'Модуль'; save('Название модуля сохранено'); });
    $$('#lessonsList [data-open-lesson]').forEach(function (el) {
      el.addEventListener('click', function () { renderLessonEdit(c, mi, parseInt(el.dataset.openLesson, 10)); go('t-lesson-edit'); });
    });
    $('#addLessonBtn').addEventListener('click', function () { renderLessonEdit(c, mi, null); go('t-lesson-edit'); });
    $('#deleteModuleBtn').addEventListener('click', function () {
      if (m.lessons.length && !$('#deleteModuleBtn').dataset.sure) {
        $('#deleteModuleBtn').dataset.sure = '1';
        $('#deleteModuleBtn').textContent = 'Удалить модуль вместе с ' + m.lessons.length + ' ' + DJC.plural(m.lessons.length, ['уроком', 'уроками', 'уроками']) + '?';
        return;
      }
      c.modules.splice(mi, 1);
      save('Модуль удалён');
      renderEditor(c); go('t-editor');
    });
    if (m.lessons.length) {
      makeSortable($('#lessonsList'), '.c-editor-module', function (order) {
        m.lessons = order.map(function (i) { return m.lessons[i]; });
        save('Порядок уроков обновлён');
      });
    }
  }

  /* ---- урок: тип, длительность, содержимое по типу ---- */
  var KIND_HINT = {
    video: 'Ученик смотрит ролик и отмечает «Просмотрено».',
    doc: 'Ученик читает материал и отмечает «Прочитано».',
    task: 'Ученик присылает ответ — он придёт вам в «Проверку заданий».',
    test: 'Ученик отвечает на вопросы. Сдал, если набрал проходной балл. Число попыток — в «Оценки и сертификат».',
  };
  function lessonContentFields(l) {
    var hint = '<p class="caption" style="margin:-6px 0 18px">' + KIND_HINT[l.kind] + '</p>';
    if (l.kind === 'doc') {
      var d = l.doc || {};
      return hint + '<div class="field"><label for="lfDocText">Текст урока</label><textarea id="lfDocText" rows="9" placeholder="Материал, который читает ученик. Пустая строка — новый абзац.">' + esc(d.text) + '</textarea></div>';
    }
    if (l.kind === 'task') {
      var t = l.task || {};
      return hint + '<div class="field"><label for="lfTaskText">Что нужно сделать</label><textarea id="lfTaskText" rows="5" placeholder="Например: снимите руку сверху 20 секунд baby scratch">' + esc(t.task) + '</textarea></div>'
        + '<div class="field"><label for="lfTaskDeliverable">Что прислать на проверку</label><input class="input" id="lfTaskDeliverable" type="text" value="' + esc(t.deliverable) + '" placeholder="Видео, ссылка, файл…"></div>';
    }
    if (l.kind === 'test') {
      var qs = (l.test && l.test.questions) || [];
      var pass = (l.test && l.test.passScore) || 70;
      return hint + '<div class="field"><label for="lfPassScore">Проходной балл, % правильных ответов</label><input class="input" id="lfPassScore" type="number" min="1" max="100" value="' + pass + '"></div>'
        + '<p class="caption" style="margin:-8px 0 12px">Отметьте кружком правильный вариант в каждом вопросе</p>'
        + '<div class="stack" id="questionsList">' + qs.map(questionRow).join('') + '</div>'
        + '<button class="text-button" id="addQuestionBtn" style="margin:4px 0 14px">+ Добавить вопрос</button>';
    }
    var v = l.video || {};
    return hint + '<div class="field"><label for="lfVideoUrl">Ссылка на видео</label><input class="input" id="lfVideoUrl" type="text" value="' + esc(v.url) + '" placeholder="YouTube, Vimeo, Kinescope…"></div>'
      + '<div class="field"><label for="lfVideoNote">О чём видео</label><textarea id="lfVideoNote" rows="4" placeholder="Коротко — ученик увидит это под плеером">' + esc(v.note) + '</textarea></div>';
  }
  function questionRow(q, qi) {
    q = q || { q: '', options: ['', '', ''], correct: 0 };
    return '<div class="card" data-question="' + qi + '" style="padding:14px">'
      + '<div class="field" style="margin-bottom:10px"><label>Вопрос ' + (qi + 1) + '</label><input class="input lfq-text" type="text" value="' + esc(q.q) + '" placeholder="Текст вопроса"></div>'
      + '<div class="stack" style="gap:8px">'
      + [0, 1, 2].map(function (oi) {
          return '<label class="row" style="gap:10px"><input type="radio" name="correct-' + qi + '" class="lfq-correct" value="' + oi + '"' + (q.correct === oi ? ' checked' : '') + ' aria-label="Правильный ответ">'
            + '<input class="input lfq-option" type="text" style="flex:1;min-width:0" value="' + esc(q.options && q.options[oi]) + '" placeholder="Вариант ' + (oi + 1) + '"></label>';
        }).join('')
      + '</div>'
      + '<button class="text-button lfq-remove" style="margin-top:8px">Удалить вопрос</button>'
      + '</div>';
  }
  function readQuestionsFromDom() {
    return $$('#questionsList [data-question]').map(function (card) {
      var correct = 0;
      $$('.lfq-correct', card).forEach(function (r) { if (r.checked) correct = parseInt(r.value, 10); });
      return { q: $('.lfq-text', card).value.trim(), options: $$('.lfq-option', card).map(function (i) { return i.value.trim(); }), correct: correct };
    });
  }
  function renumberQuestions() {
    $$('#questionsList [data-question]').forEach(function (card, i) {
      card.dataset.question = i;
      card.querySelector('label').textContent = 'Вопрос ' + (i + 1);
      $$('.lfq-correct', card).forEach(function (r) { r.name = 'correct-' + i; });
    });
  }

  function renderLessonEdit(c, mi, li, backTo) {
    var isNew = li === null || li === undefined;
    var orig = isNew ? null : c.modules[mi].lessons[li];
    var l = orig || { title: '', kind: 'video', min: 10, video: { note: '', url: '' } };
    $('#t-lesson-edit').innerHTML =
      '<div class="row" style="margin-bottom:16px"><button class="icon" id="lessonBack" aria-label="Назад">←</button></div>'
      + title(isNew ? 'Новый урок' : 'Урок', esc(c.modules[mi].name))
      + '<div class="field"><label for="lfTitle">Название урока</label><input class="input" id="lfTitle" type="text" value="' + esc(l.title) + '" placeholder="Например: Постановка руки"></div>'
      + '<div class="row" style="gap:10px;align-items:stretch">'
        + '<div class="field" style="flex:1;min-width:0"><label for="lfKind">Тип урока</label><select id="lfKind">'
          + ['video', 'doc', 'task', 'test'].map(function (k) { return '<option value="' + k + '"' + (l.kind === k ? ' selected' : '') + '>' + DJC.kindLabel(k) + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="field" style="width:110px;flex:0 0 110px"><label for="lfMin">Минут</label><input class="input" id="lfMin" type="number" min="1" value="' + (l.min || 10) + '"></div>'
      + '</div>'
      + '<div id="lessonContentFields">' + lessonContentFields(l) + '</div>'
      + '<button class="primary full" id="saveLessonBtn">Сохранить урок</button>'
      + (isNew ? '' : '<button class="secondary-button full" id="deleteLessonBtn" style="margin-top:12px">Удалить урок</button>');

    function wireContent() {
      $$('#questionsList .lfq-remove').forEach(function (btn) {
        btn.onclick = function () { btn.closest('[data-question]').remove(); renumberQuestions(); };
      });
      var add = $('#addQuestionBtn');
      if (add) add.onclick = function () {
        var list = $('#questionsList');
        list.insertAdjacentHTML('beforeend', questionRow(null, list.children.length));
        wireContent();
        $('.lfq-text', list.lastElementChild).focus();
      };
    }
    wireContent();

    function goBack() {
      if (backTo === 't-grading') { renderGrading(c); go('t-grading'); }
      else { renderModule(c, mi); go('t-module'); }
    }
    $('#lessonBack').addEventListener('click', goBack);
    $('#lfKind').addEventListener('change', function (e) {
      l = Object.assign({}, l, { kind: e.target.value });
      $('#lessonContentFields').innerHTML = lessonContentFields(l);
      wireContent();
      if (l.kind === 'test' && !$('#questionsList').children.length) $('#addQuestionBtn').click();
    });
    $('#saveLessonBtn').addEventListener('click', function () {
      var kind = $('#lfKind').value;
      var lesson = {
        id: orig ? orig.id : 'n' + Date.now().toString(36),
        title: $('#lfTitle').value.trim(), kind: kind, min: Math.max(1, parseInt($('#lfMin').value, 10) || 10),
      };
      if (!lesson.title) { window.say('Введите название урока'); $('#lfTitle').focus(); return; }
      if (kind === 'video') lesson.video = { url: $('#lfVideoUrl').value.trim(), note: $('#lfVideoNote').value.trim() };
      if (kind === 'doc') {
        lesson.doc = { text: $('#lfDocText').value.trim() };
        if (!lesson.doc.text) { window.say('Добавьте текст урока'); return; }
      }
      if (kind === 'task') {
        lesson.task = { task: $('#lfTaskText').value.trim(), deliverable: $('#lfTaskDeliverable').value.trim() };
        if (!lesson.task.task) { window.say('Опишите, что нужно сделать'); return; }
      }
      if (kind === 'test') {
        var qs = readQuestionsFromDom();
        if (!qs.length) { window.say('Добавьте хотя бы один вопрос'); return; }
        for (var i = 0; i < qs.length; i++) {
          if (!qs[i].q) { window.say('Заполните текст вопроса ' + (i + 1)); return; }
          if (qs[i].options.filter(Boolean).length < 2) { window.say('В вопросе ' + (i + 1) + ' нужно минимум 2 варианта'); return; }
          if (!qs[i].options[qs[i].correct]) { window.say('В вопросе ' + (i + 1) + ' отмечен пустой вариант'); return; }
        }
        qs.forEach(function (q) {
          var right = q.options[q.correct];
          q.options = q.options.filter(Boolean);
          q.correct = q.options.indexOf(right);
        });
        lesson.test = { questions: qs, passScore: Math.min(100, Math.max(1, parseInt($('#lfPassScore').value, 10) || 70)) };
      }
      if (isNew) c.modules[mi].lessons.push(lesson); else c.modules[mi].lessons[li] = lesson;
      save(isNew ? 'Урок добавлен' : 'Урок сохранён');
      goBack();
    });
    var del = $('#deleteLessonBtn');
    if (del) del.addEventListener('click', function () {
      if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Точно удалить урок?'; return; }
      c.modules[mi].lessons.splice(li, 1);
      save('Урок удалён');
      goBack();
    });
  }

  /* ================= проверка заданий ================= */
  function renderReview(scope) {
    reviewScope = scope;
    var all = (window.SUBMISSIONS || []).filter(function (s) { return scope.ids.indexOf(s.courseId) >= 0; });
    var pending = all.filter(function (s) { return s.status === 'pending'; });
    var list = (reviewSeg === 'pending' ? pending : all.filter(function (s) { return s.status !== 'pending'; }))
      .slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });

    $('#t-review').innerHTML =
      back(scope.back) + title('Проверка заданий', 'Ответы учеников на уроки-задания. Примите или верните на доработку — ученик увидит ваш комментарий.')
      + '<div class="seg" id="reviewSeg"><button type="button" data-seg="pending" aria-pressed="' + (reviewSeg === 'pending') + '">На проверке · ' + pending.length + '</button><button type="button" data-seg="done" aria-pressed="' + (reviewSeg === 'done') + '">Проверено</button></div>'
      + '<div class="stack">'
      + (list.length ? list.map(function (s) {
          var c = window.courseById(s.courseId), l = findLesson(c, s.lessonId);
          return '<div class="card" data-sub="' + s.id + '">'
            + '<div class="c-review-head"><span class="portrait">' + DJC.initials(s.student) + '</span><div><h3 style="font-size:17px">' + esc(s.student) + '</h3><p class="caption">' + DJC.fmtDate(s.at).replace(/ \d{4}.*$/, '') + (scope.ids.length > 1 ? ' · ' + esc(c.title) : '') + '</p></div></div>'
            + '<p class="secondary" style="color:var(--dj-text-body);margin-bottom:4px">' + esc(l ? l.title : 'Урок удалён') + '</p>'
            + (l && l.task ? '<p class="caption" style="margin-bottom:8px">Задание: ' + esc(l.task.task) + '</p>' : '')
            + '<div class="c-answer">' + esc(s.answer) + '</div>'
            + (s.status === 'pending'
              ? '<div class="field" style="margin:14px 0 12px"><label for="rv-' + s.id + '">Комментарий ученику</label><textarea id="rv-' + s.id + '" rows="3" placeholder="Что получилось, что поправить"></textarea></div>'
                + '<div class="actions" style="margin-top:0"><button class="secondary-button" data-rv="returned">На доработку</button><button class="primary" data-rv="accepted">Принять</button></div>'
              : '<p style="margin-top:12px"><span class="c-tag ' + (s.status === 'accepted' ? 'is-ok' : 'is-warn') + '">' + (s.status === 'accepted' ? 'Принято' : 'Возвращено на доработку') + '</span></p>'
                + (s.comment ? '<p class="c-note' + (s.status === 'returned' ? ' is-warn' : '') + '" style="margin-top:10px">' + esc(s.comment) + '</p>' : ''))
            + '</div>';
        }).join('') : '<div class="empty"><p class="secondary">' + (reviewSeg === 'pending' ? 'Новых ответов нет — всё проверено' : 'Пока ничего не проверено') + '</p></div>')
      + '</div>';

    $$('#reviewSeg button').forEach(function (b) {
      b.addEventListener('click', function () { reviewSeg = b.dataset.seg; renderReview(scope); });
    });
    $$('#t-review [data-rv]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('[data-sub]');
        var s = window.SUBMISSIONS.find(function (x) { return x.id === card.dataset.sub; });
        var comment = $('textarea', card).value.trim();
        if (b.dataset.rv === 'returned' && !comment) { window.say('Напишите, что поправить'); $('textarea', card).focus(); return; }
        s.status = b.dataset.rv; s.comment = comment; s.reviewedAt = DJC.today();
        save(s.status === 'accepted' ? 'Принято — ' + esc(s.student) + ' увидит отметку' : 'Возвращено на доработку с комментарием');
        renderReview(scope);
      });
    });
  }

  /* ================= ученики и доход ================= */
  function renderStudents(c) {
    var roster = (window.ROSTER[c.id] || []).slice();
    var en = DJC.enrollment(c.id);
    if (en) roster.unshift({ name: window.STUDENT_NAME + ' (демо-ученик)', progress: DJC.progress(c, en).pct, last: 'недавно' });
    $('#t-students').innerHTML =
      back('t-course') + title('Ученики', roster.length ? 'Последние активные из ' + c.students : '')
      + (roster.length ? '<div class="card">'
        + roster.map(function (s) {
            return '<div class="c-student-row"><span class="portrait">' + DJC.initials(s.name) + '</span>'
              + '<span class="c-student-info"><span style="font-size:17px">' + esc(s.name) + '</span>'
              + '<span class="c-student-progress"><span class="c-progress"><i style="width:' + s.progress + '%"></i></span><span>' + s.progress + '%</span></span></span>'
              + '<span class="caption">' + s.last + '</span></div>';
          }).join('')
        + '</div>' : '<div class="empty"><p class="secondary">Пока никто не записался</p></div>');
  }
  function renderEarnings(c) {
    $('#t-earnings').innerHTML =
      back('t-course') + title('Доход')
      + '<div class="card"><p class="caption">Всего заработано на «' + esc(c.title) + '»</p><p class="c-price" style="margin:6px 0 14px">' + DJC.fmtRub(c.revenueTotal) + '</p><button class="secondary-button full" id="payoutBtn">Вывести</button></div>'
      + '<div class="card" style="margin-top:14px"><div class="c-price-row"><span class="secondary">За этот месяц</span><span class="c-price">' + DJC.fmtRub(c.revenueMonth) + '</span></div><p class="caption" style="margin-top:8px">' + c.students + ' ' + DJC.plural(c.students, ['ученик', 'ученика', 'учеников']) + ' · ' + DJC.priceLabel(c) + ' за курс · ' + DJC.accessLabel(c) + '</p></div>';
    $('#payoutBtn').addEventListener('click', function () { window.say('Вывод средств — демо, без реальной выплаты'); });
  }

  /* ================= навигация ================= */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.t-card-link');
    if (link) {
      var card = link.closest('[data-course-id]');
      if (card) { e.preventDefault(); var c = window.courseById(card.dataset.courseId); if (c) { renderCourse(c); go('t-course'); } }
      return;
    }
    var b = e.target.closest('[data-go]');
    if (b) {
      if (b.dataset.go === 't-course' && cur) renderCourse(cur);
      if (b.dataset.go === 't-mine') { renderStats(); renderMine(); }
      go(b.dataset.go);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    $('#newCourseBtn').addEventListener('click', function () { renderInfo(null); go('t-info'); });
    $('#resetDemoBtn').addEventListener('click', function () { window.resetCourses(); });
    renderStats(); renderMine();
    var m = location.search.match(/course=(\d+)/);
    if (m) { var c = window.courseById(m[1]); if (c && c.instructor === AUTHOR) { renderCourse(c); go('t-course'); } }
  });
})();
