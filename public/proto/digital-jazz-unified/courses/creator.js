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
  /* Цифры строками: подпись слева, значение справа целиком (как «Гонорары … 1 190 000 ₽» в турах) —
     сумма в рублях никогда не переносится посередине. money — лаймовым. */
  function kpi(rows) {
    return '<div class="card c-kpi">' + rows.map(function (r) {
      return '<div class="c-kpi-row"><span>' + r[0] + '</span><b' + (r[2] ? ' class="is-money"' : '') + '>' + r[1] + '</b></div>';
    }).join('') + '</div>';
  }
  function renderStats() {
    var mine = myCourses();
    var students = mine.reduce(function (n, c) { return n + c.students; }, 0);
    var month = mine.reduce(function (n, c) { return n + c.revenueMonth; }, 0);
    var total = mine.reduce(function (n, c) { return n + c.revenueTotal; }, 0);
    $('#authorStats').innerHTML = kpi([
      ['Учеников', students],
      ['За месяц', DJC.fmtRub(month), true],
      ['Заработано', DJC.fmtRub(total), true],
    ]);
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
    var tests = DJC.allBlocks(c, 'test').length;
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
        note: n ? c.modules.length + ' ' + DJC.plural(c.modules.length, ['модуль', 'модуля', 'модулей']) + ' · ' + DJC.kindCounts(c) : 'Пока нет уроков — добавьте урок и соберите его из блоков' },
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
                 : kpi([['Учеников', c.students], ['Доходят до конца', c.completion + '%'], ['Заработано', DJC.fmtRub(c.revenueTotal), true]]))
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
        var emptyLesson = DJC.flat(c).find(function (x) { return !DJC.blocksOf(x.lesson).length; });
        if (emptyLesson) { window.say('Урок «' + esc(emptyLesson.lesson.title) + '» пустой — добавьте в него блоки'); return; }
        var emptyTest = DJC.allBlocks(c, 'test').find(function (t) { return !(t.block.questions && t.block.questions.length); });
        if (emptyTest) { window.say('В тесте урока «' + esc(emptyTest.lesson.title) + '» нет вопросов'); return; }
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
    var tests = DJC.allBlocks(c, 'test');
    var g = c.grading, cert = c.certificate;
    $('#t-grading').innerHTML =
      back('t-course') + title('Оценки и сертификат')
      + '<div class="card"><h3 style="font-size:19px">Тесты</h3><p class="caption" style="margin:4px 0 10px">Вопросы и проходной балл задаются в самом тесте</p>'
        + (tests.length ? tests.map(function (t) {
            var q = (t.block.questions || []).length;
            return '<a href="#" class="c-lesson" data-test-mi="' + t.x.mi + '" data-test-li="' + t.x.li + '"><span class="c-lesson-icon">' + DJC.lessonIcon('test') + '</span>'
              + '<span class="c-lesson-body"><span class="c-lesson-title">' + esc(t.lesson.title) + '</span><span class="c-lesson-meta">проходной балл ' + (t.block.passScore || 70) + '% · ' + q + ' ' + DJC.plural(q, ['вопрос', 'вопроса', 'вопросов']) + '</span></span><span class="c-lesson-trail">→</span></a>';
          }).join('') : '<p class="secondary" style="margin-bottom:10px">В уроках пока нет тестов — добавьте блок «Тест» в нужный урок</p>')
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
    /* карточка едет за пальцем; у края экрана страница прокручивается сама —
       блоки урока высокие, иначе их не перетащить дальше одного экрана */
    var dragging = null, grabOffset = 0, lastY = 0, raf = 0;
    function items() { return $$(':scope > ' + itemSelector, list); }
    function update() {
      if (!dragging) return;
      dragging.style.transform = '';
      var natural = dragging.getBoundingClientRect().top;
      var desired = lastY - grabOffset;
      dragging.style.transform = 'translateY(' + (desired - natural) + 'px)';
      var mid = desired + dragging.offsetHeight / 2;
      var others = items();
      for (var i = 0; i < others.length; i++) {
        var el = others[i]; if (el === dragging) continue;
        var r = el.getBoundingClientRect();
        if (mid > r.top && mid < r.bottom) {
          var di = others.indexOf(dragging), ti = i;
          if (di < ti && mid > r.top + r.height / 2) { list.insertBefore(dragging, el.nextSibling); update(); return; }
          if (di > ti && mid < r.top + r.height / 2) { list.insertBefore(dragging, el); update(); return; }
        }
      }
    }
    function autoscroll() {
      if (!dragging) return;
      var top = 90, bottom = window.innerHeight - 170, v = 0;
      if (lastY < top) v = -Math.min(18, (top - lastY) / 3 + 3);
      else if (lastY > bottom) v = Math.min(18, (lastY - bottom) / 3 + 3);
      if (v) { window.scrollBy(0, v); update(); }
      raf = requestAnimationFrame(autoscroll);
    }
    function onDown(e) {
      var handle = e.target.closest('[data-drag-handle]'); if (!handle) return;
      var card = handle.closest(itemSelector); if (!card || card.parentNode !== list) return;
      e.preventDefault();
      dragging = card; lastY = e.clientY; grabOffset = e.clientY - card.getBoundingClientRect().top;
      card.classList.add('dragging'); card.style.position = 'relative'; card.style.zIndex = 50;
      handle.classList.add('is-dragging'); handle.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', onUp);
      raf = requestAnimationFrame(autoscroll);
    }
    function onMove(e) { if (!dragging) return; lastY = e.clientY; update(); }
    function onUp() {
      if (!dragging) return;
      cancelAnimationFrame(raf);
      var card = dragging; dragging = null;
      card.style.transform = ''; card.style.position = ''; card.style.zIndex = '';
      card.classList.remove('dragging');
      var h = card.querySelector('[data-drag-handle]'); if (h) h.classList.remove('is-dragging');
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp);
      var order = items().map(function (el) { return parseInt(el.dataset.idx, 10); });
      items().forEach(function (el, i) { el.dataset.idx = i; });
      if (order.some(function (v, i) { return v !== i; })) onReorder(order);
    }
    list.addEventListener('pointerdown', onDown);
  }

  function renderEditor(c) {
    var n = lessonsCount(c);
    $('#t-editor').innerHTML =
      back('t-course')
      + title('Программа курса', n ? c.modules.length + ' ' + DJC.plural(c.modules.length, ['модуль', 'модуля', 'модулей']) + ' · ' + DJC.kindCounts(c) : 'Курс → модули → уроки. Урок собирается из блоков: видео, текст, задание, тест. Откройте модуль и добавьте урок.')
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
            + '<span class="c-lesson-icon" aria-hidden="true">' + DJC.lessonIcon(l) + '</span>'
            + '<span class="grow" data-open-lesson="' + li + '" role="button" tabindex="0"><h3 style="font-size:17px">' + esc(l.title) + '</h3><p class="caption">' + DJC.lessonMeta(l) + ' · ' + l.min + ' мин</p></span>'
            + '<span class="chevron" data-open-lesson="' + li + '" role="button" tabindex="0">→</span>'
            + '</div>';
        }).join('') : '<div class="card"><p class="secondary">В модуле пока нет уроков. Каждый урок собирается из блоков: <b>видео</b>, <b>текст</b>, <b>задание</b> (ответ придёт вам на проверку) и <b>тест</b> (вопросы с проходным баллом) — в любом порядке и количестве.</p></div>')
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

  /* ---- урок = лента блоков: видео, текст, задание, тест в любом порядке и количестве ---- */
  var BLOCK_HINT = {
    video: 'Ролик со ссылкой и коротким описанием под плеером.',
    doc: 'Материал для чтения. Пустая строка — новый абзац.',
    task: 'Ученик пишет ответ или присылает ссылку — ответ придёт вам в «Проверку заданий».',
    test: 'Вопросы с вариантами. Отметьте кружком правильный ответ. Число попыток — в «Оценки и сертификат».',
  };
  function newBlock(type) {
    var b = { id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: type };
    if (type === 'video') { b.url = ''; b.note = ''; }
    if (type === 'doc') b.text = '';
    if (type === 'task') { b.task = ''; b.deliverable = ''; }
    if (type === 'test') { b.passScore = 70; b.questions = [{ q: '', options: ['', '', ''], correct: 0 }]; }
    return b;
  }
  function questionRow(b, q, qi) {
    var opts = (q.options || []).slice(); while (opts.length < 3) opts.push('');
    return '<div class="c-question" data-question="' + qi + '">'
      + '<div class="field" style="margin-bottom:10px"><label>Вопрос ' + (qi + 1) + '</label><input class="input bq-text" type="text" value="' + esc(q.q) + '" placeholder="Текст вопроса"></div>'
      + '<div class="stack" style="gap:8px">'
      + [0, 1, 2].map(function (oi) {
          return '<label class="row" style="gap:10px"><input type="radio" name="correct-' + b.id + '-' + qi + '" class="lfq-correct" value="' + oi + '"' + (q.correct === oi ? ' checked' : '') + ' aria-label="Правильный ответ">'
            + '<input class="input bq-option" type="text" style="flex:1;min-width:0" value="' + esc(opts[oi]) + '" placeholder="Вариант ' + (oi + 1) + '"></label>';
        }).join('')
      + '</div>'
      + '<button type="button" class="text-button" data-q-remove="' + qi + '" style="margin-top:6px">Удалить вопрос</button>'
      + '</div>';
  }
  function blockFields(b) {
    if (b.type === 'doc') return '<div class="field" style="margin:0"><label>Текст</label><textarea class="bf-text" rows="7" placeholder="Материал, который читает ученик">' + esc(b.text) + '</textarea></div>';
    if (b.type === 'task') return '<div class="field"><label>Что нужно сделать</label><textarea class="bf-task" rows="4" placeholder="Например: снимите руку сверху 20 секунд baby scratch">' + esc(b.task) + '</textarea></div>'
      + '<div class="field" style="margin:0"><label>Что прислать на проверку</label><input class="input bf-deliv" type="text" value="' + esc(b.deliverable) + '" placeholder="Видео, ссылка, файл…"></div>';
    if (b.type === 'test') return '<div class="field"><label>Проходной балл, % правильных ответов</label><input class="input bf-pass" type="number" min="1" max="100" value="' + (b.passScore || 70) + '"></div>'
      + '<div class="stack" style="gap:18px">' + (b.questions || []).map(function (q, qi) { return questionRow(b, q, qi); }).join('') + '</div>'
      + '<button type="button" class="text-button" data-q-add style="margin-top:6px">+ Добавить вопрос</button>';
    return '<div class="field"><label>Ссылка на видео</label><input class="input bf-url" type="text" value="' + esc(b.url) + '" placeholder="YouTube, Vimeo, Kinescope…"></div>'
      + '<div class="field" style="margin:0"><label>О чём видео</label><textarea class="bf-note" rows="3" placeholder="Коротко — ученик увидит это под плеером">' + esc(b.note) + '</textarea></div>';
  }
  function blockCard(b, i) {
    return '<div class="card c-block" data-idx="' + i + '" data-bid="' + b.id + '">'
      + '<div class="c-block-head">' + HANDLE
        + '<span class="c-lesson-icon" aria-hidden="true">' + DJC.lessonIcon(b.type) + '</span>'
        + '<b>' + (i + 1) + '. ' + DJC.kindLabel(b.type) + '</b>'
        + '<button type="button" class="text-button" data-b-remove style="color:var(--dj-text-faint)">Удалить</button>'
      + '</div>'
      + '<p class="caption" style="margin:-4px 0 14px">' + BLOCK_HINT[b.type] + '</p>'
      + blockFields(b)
      + '</div>';
  }

  function renderLessonEdit(c, mi, li, backTo) {
    var isNew = li === null || li === undefined;
    var orig = isNew ? null : c.modules[mi].lessons[li];
    var draft = orig ? JSON.parse(JSON.stringify(orig.blocks || [])) : [];

    $('#t-lesson-edit').innerHTML =
      '<div class="row" style="margin-bottom:16px"><button class="icon" id="lessonBack" aria-label="Назад">←</button></div>'
      + title(isNew ? 'Новый урок' : 'Урок', esc(c.modules[mi].name))
      + '<div class="row" style="gap:10px;align-items:stretch">'
        + '<div class="field" style="flex:1;min-width:0"><label for="lfTitle">Название урока</label><input class="input" id="lfTitle" type="text" value="' + esc(orig ? orig.title : '') + '" placeholder="Например: Постановка руки"></div>'
        + '<div class="field" style="width:96px;flex:0 0 96px"><label for="lfMin">Минут</label><input class="input" id="lfMin" type="number" min="1" value="' + ((orig && orig.min) || 10) + '"></div>'
      + '</div>'
      + '<h2 style="font-size:20px;margin:8px 0 4px">Содержание урока</h2>'
      + '<p class="caption" style="margin-bottom:14px">Урок собирается из блоков — ученик проходит их сверху вниз. Порядок меняется за ручку слева.</p>'
      + '<div class="stack" id="blocksList"></div>'
      + '<p class="caption" style="margin:18px 0 10px">Добавить блок</p>'
      + '<div class="c-add-blocks">'
        + ['video', 'doc', 'task', 'test'].map(function (t) { return '<button type="button" class="secondary-button" data-add-block="' + t + '"><span class="c-lesson-icon" aria-hidden="true">' + DJC.lessonIcon(t) + '</span>' + DJC.kindLabel(t) + '</button>'; }).join('')
      + '</div>'
      + '<button class="primary full" id="saveLessonBtn" style="margin-top:24px">Сохранить урок</button>'
      + (isNew ? '' : '<button class="secondary-button full" id="deleteLessonBtn" style="margin-top:12px">Удалить урок</button>');

    var list = $('#blocksList');

    /* значения полей → черновик (до любого перерисовывания) */
    function sync() {
      $$('.c-block', list).forEach(function (card) {
        var b = draft.find(function (x) { return x.id === card.dataset.bid; }); if (!b) return;
        if (b.type === 'video') { b.url = $('.bf-url', card).value.trim(); b.note = $('.bf-note', card).value.trim(); }
        if (b.type === 'doc') b.text = $('.bf-text', card).value.trim();
        if (b.type === 'task') { b.task = $('.bf-task', card).value.trim(); b.deliverable = $('.bf-deliv', card).value.trim(); }
        if (b.type === 'test') {
          b.passScore = Math.min(100, Math.max(1, parseInt($('.bf-pass', card).value, 10) || 70));
          b.questions = $$('.c-question', card).map(function (qc) {
            var correct = 0;
            $$('.lfq-correct', qc).forEach(function (r) { if (r.checked) correct = +r.value; });
            return { q: $('.bq-text', qc).value.trim(), options: $$('.bq-option', qc).map(function (i) { return i.value.trim(); }), correct: correct };
          });
        }
      });
    }
    function renderBlocks() {
      list.innerHTML = draft.length ? draft.map(blockCard).join('')
        : '<div class="card"><p class="secondary">Урок пока пустой. Добавьте блоки ниже — например, видео, под ним текст-конспект и в конце задание или тест.</p></div>';
      $$('.c-block', list).forEach(function (card) {
        var b = draft.find(function (x) { return x.id === card.dataset.bid; });
        var rm = $('[data-b-remove]', card);
        rm.addEventListener('click', function () {
          if (!rm.dataset.sure) { rm.dataset.sure = '1'; rm.textContent = 'Точно удалить?'; rm.style.color = 'var(--dj-magenta)'; return; }
          sync(); draft = draft.filter(function (x) { return x !== b; }); renderBlocks();
        });
        var addQ = $('[data-q-add]', card);
        if (addQ) addQ.addEventListener('click', function () {
          sync(); b.questions.push({ q: '', options: ['', '', ''], correct: 0 }); renderBlocks();
          var qs = $$('[data-bid="' + b.id + '"] .bq-text', list); qs[qs.length - 1].focus();
        });
        $$('[data-q-remove]', card).forEach(function (btn) {
          btn.addEventListener('click', function () { sync(); b.questions.splice(+btn.dataset.qRemove, 1); renderBlocks(); });
        });
      });
    }
    renderBlocks();
    makeSortable(list, '.c-block', function (order) {
      sync(); draft = order.map(function (i) { return draft[i]; }); renderBlocks();
    });

    $$('[data-add-block]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sync();
        var b = newBlock(btn.dataset.addBlock);
        draft.push(b); renderBlocks();
        var card = $('[data-bid="' + b.id + '"]', list);
        card.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var f = $('input, textarea', card); if (f) f.focus({ preventScroll: true });
      });
    });

    function goBack() {
      if (backTo === 't-grading') { renderGrading(c); go('t-grading'); }
      else { renderModule(c, mi); go('t-module'); }
    }
    $('#lessonBack').addEventListener('click', goBack);

    $('#saveLessonBtn').addEventListener('click', function () {
      sync();
      var t = $('#lfTitle').value.trim();
      if (!t) { window.say('Введите название урока'); $('#lfTitle').focus(); return; }
      if (!draft.length) { window.say('Добавьте в урок хотя бы один блок'); return; }
      for (var i = 0; i < draft.length; i++) {
        var b = draft[i], n = 'Блок ' + (i + 1) + ' (' + DJC.kindLabel(b.type).toLowerCase() + '): ';
        if (b.type === 'doc' && !b.text) { window.say(n + 'добавьте текст'); return; }
        if (b.type === 'task' && !b.task) { window.say(n + 'опишите, что сделать'); return; }
        if (b.type === 'test') {
          if (!b.questions.length) { window.say(n + 'добавьте вопрос'); return; }
          for (var q = 0; q < b.questions.length; q++) {
            var qq = b.questions[q];
            if (!qq.q) { window.say(n + 'заполните вопрос ' + (q + 1)); return; }
            if (qq.options.filter(Boolean).length < 2) { window.say(n + 'в вопросе ' + (q + 1) + ' нужно минимум 2 варианта'); return; }
            if (!qq.options[qq.correct]) { window.say(n + 'в вопросе ' + (q + 1) + ' отмечен пустой вариант'); return; }
          }
        }
      }
      draft.forEach(function (b) {
        if (b.type !== 'test') return;
        b.questions.forEach(function (q) { var right = q.options[q.correct]; q.options = q.options.filter(Boolean); q.correct = q.options.indexOf(right); });
      });
      var lesson = { id: orig ? orig.id : 'n' + Date.now().toString(36), title: t, min: Math.max(1, parseInt($('#lfMin').value, 10) || 10), blocks: draft };
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
      back(scope.back) + title('Проверка заданий', 'Ответы учеников на задания в уроках. Примите или верните на доработку — ученик увидит ваш комментарий.')
      + '<div class="seg" id="reviewSeg"><button type="button" data-seg="pending" aria-pressed="' + (reviewSeg === 'pending') + '">На проверке · ' + pending.length + '</button><button type="button" data-seg="done" aria-pressed="' + (reviewSeg === 'done') + '">Проверено</button></div>'
      + '<div class="stack">'
      + (list.length ? list.map(function (s) {
          var c = window.courseById(s.courseId), l = findLesson(c, s.lessonId);
          var tb = l && DJC.blocksOf(l).find(function (b) { return b.id === s.blockId; });
          return '<div class="card" data-sub="' + s.id + '">'
            + '<div class="c-review-head"><span class="portrait">' + DJC.initials(s.student) + '</span><div><h3 style="font-size:17px">' + esc(s.student) + '</h3><p class="caption">' + DJC.fmtDate(s.at).replace(/ \d{4}.*$/, '') + (scope.ids.length > 1 ? ' · ' + esc(c.title) : '') + '</p></div></div>'
            + '<p class="secondary" style="color:var(--dj-text-body);margin-bottom:4px">' + esc(l ? l.title : 'Урок удалён') + '</p>'
            + (tb ? '<p class="caption" style="margin-bottom:8px">Задание: ' + esc(tb.task) + '</p>' : '')
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
