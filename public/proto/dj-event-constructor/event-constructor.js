'use strict';
/* Предложение: конструктор события Digital Jazz.
   Обзор — «что дальше», готовность по трём фазам, деньги одним блоком, тайминг, люди.
   Пошагово — те же 10 разделов, один экран на раздел, шаги-чипы сверху. */
(()=>{
const EV={title:'Демо-событие',kind:'Вечеринка',city:'Москва',venue:'Площадка не выбрана',cap:500,date:'14 июня',weekday:'сб',time:'23:00 – 06:00'};
/* status: done | todo | blocked | locked */
const SECTIONS=[
 {id:'date',group:'Основа',title:'Дата и место',status:'done',note:'14 июня · 500 гостей'},
 {id:'lineup',group:'Основа',title:'Лайн-ап',status:'todo',note:'Артисты не добавлены'},
 {id:'budget',group:'Основа',title:'Бюджет',status:'todo',note:'Смета не собрана'},
 {id:'tickets',group:'Продажи',title:'Билеты',status:'blocked',note:'Не настроены — без них нельзя анонсировать'},
 {id:'map',group:'Продажи',title:'Схема площадки',status:'locked',note:'Откроется после билетов'},
 {id:'pr',group:'Продажи',title:'PR-кампания',status:'todo',note:'План не собран'},
 {id:'partners',group:'Продажи',title:'Партнёры и мерч',status:'todo',note:'Партнёров нет'},
 {id:'team',group:'День события',title:'Команда',status:'todo',note:'Позиций нет'},
 {id:'rider',group:'День события',title:'Тех. райдер',status:'todo',note:'Не заполнен'},
 {id:'bar',group:'День события',title:'Бар и еда',status:'todo',note:'Не заполнен'}];
const GROUPS=['Основа','Продажи','День события'];
const TIMING=[['Подготовка',[['за 28 дней','17 мая','12:00','Анонс события'],['за 2 дня','12 июня','18:00','Закрыть гостевой список']]],['День события',[['14 июня','','19:00','Брифинг охраны']]],['После',[['+1 день','15 июня','14:00','Расчёты и отчёт']]]];
const added=new Set();
const tiers=[{name:'Входной',price:1500,count:400},{name:'VIP',price:4000,count:100}];

const ico={
 done:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.2 3 3 6-6.4"/></svg>',
 todo:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/></svg>',
 blocked:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5M12 16.4v.1"/></svg>',
 locked:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
 chev:'<svg class="ec-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'};
const done=()=>SECTIONS.filter(s=>s.status==='done').length;
const rub=n=>n.toLocaleString('ru-RU')+' ₽';
const stateLabel={done:'Готово',todo:'Не начато',blocked:'Блокирует анонс',locked:'Позже'};

function hero(){const d=done(),n=SECTIONS.length;
 return `<header class="ec-hero card"><p class="ec-eyebrow">Событие · ${EV.kind}</p><h1>${EV.title}</h1>
 <p class="ec-date">${EV.date}, ${EV.weekday}</p><p class="ec-time">${EV.time}</p>
 <div class="ec-chips"><span class="chip">${EV.city}</span><span class="chip">${EV.cap} гостей</span></div>
 <div class="ec-progress" role="img" aria-label="Готово ${d} из ${n} разделов"><div class="ec-progress-head"><span>Черновик</span><span><b>${d}</b> из ${n} готово</span></div><div class="ec-bar"><i style="width:${d/n*100}%"></i></div></div></header>`;}

function seg(active){return `<nav class="seg ec-seg" aria-label="Режим конструктора"><a href="#overview"${active==='overview'?' aria-current="page"':''}>Обзор</a><a href="#tasks"${active==='tasks'?' aria-current="page"':''}>Задачи</a><a href="#step/${SECTIONS.findIndex(s=>s.status!=='done')}"${active==='step'?' aria-current="page"':''}>Пошагово</a></nav>`;}

function nextAction(){const s=SECTIONS.find(x=>x.status==='blocked')||SECTIONS.find(x=>x.status==='todo');if(!s)return '';const i=SECTIONS.indexOf(s);
 return `<section class="ec-next card" aria-labelledby="ec-next-t"><p class="caption">Следующий шаг</p><h2 id="ec-next-t">${s.status==='blocked'?'Настрой билеты':'Заполни: '+s.title}</h2><p class="ec-next-text">${s.status==='blocked'?'Без билетов событие нельзя анонсировать. Схема площадки откроется сразу после них.':s.note}</p><a class="primary ec-btn" href="#step/${i}">${s.status==='blocked'?'Настроить билеты':'Открыть раздел'}</a></section>`;}

function row(s){const i=SECTIONS.indexOf(s);const lock=s.status==='locked';
 return `<li><${lock?'div':'a href="#step/'+i+'"'} class="ec-row ${s.status}"${lock?' aria-disabled="true"':''}><span class="ec-state">${ico[s.status]}</span><span class="ec-row-text"><strong>${s.title}</strong><span>${s.note}</span></span><span class="visually-hidden">${stateLabel[s.status]}</span>${lock?'':ico.chev}</${lock?'div':'a'}></li>`;}

function readiness(){return `<section class="ec-section" aria-labelledby="ec-ready"><div class="ec-head"><h2 id="ec-ready">Готовность</h2><span class="caption">${done()} из ${SECTIONS.length}</span></div>${GROUPS.map(g=>{const list=SECTIONS.filter(s=>s.group===g);const d=list.filter(s=>s.status==='done').length;return `<div class="ec-group"><p class="ec-group-title">${g}<span>${d} / ${list.length}</span></p><ul class="ec-list card">${list.map(row).join('')}</ul></div>`;}).join('')}</section>`;}

function money(){return `<section class="ec-section" aria-labelledby="ec-money"><div class="ec-head"><h2 id="ec-money">Деньги</h2><span class="caption">по плану</span></div><div class="card ec-money"><dl><div><dt>Расходы</dt><dd>${rub(0)}</dd></div><div><dt>Доход</dt><dd>${rub(0)}</dd></div><div><dt>Баланс</dt><dd class="ec-zero">${rub(0)}</dd></div></dl><p class="caption">Смета не собрана. Доход считается из билетов и бара.</p><a class="text-button" href="#step/2">Собрать смету →</a></div></section>`;}

function timing(){const all=TIMING.flatMap(([,r])=>r);const left=all.filter(r=>!added.has(r[3])).length;
 return `<section class="ec-section" aria-labelledby="ec-time"><div class="ec-head"><h2 id="ec-time">Тайминг</h2><span class="caption">${added.size} в плане</span></div><div class="card ec-timing"><div class="ec-timing-top"><p class="caption">Рекомендуем добавить${left?` · ${left}`:''}</p>${left?'<button type="button" class="text-button" data-add-all>Добавить все</button>':''}</div>${TIMING.map(([g,rows])=>`<p class="ec-group-title">${g}</p><ul class="ec-tlist">${rows.map(r=>{const on=added.has(r[3]);return `<li class="ec-trow${on?' on':''}"><span class="ec-when"><b>${r[2]}</b><span>${r[1]||r[0]}</span></span><span class="ec-what">${r[3]}</span><button type="button" class="ec-add" data-add="${r[3]}" aria-pressed="${on}" aria-label="${on?'Убрать из плана':'Добавить в план'}: ${r[3]}">${on?ico.done:ico.plus}</button></li>`;}).join('')}</ul>`).join('')}<button type="button" class="secondary-button ec-full">Свой пункт</button></div></section>`;}

function people(){return `<section class="ec-section" aria-labelledby="ec-people"><div class="ec-head"><h2 id="ec-people">Люди</h2><span class="caption">1 участник</span></div><div class="card ec-people"><a class="ec-row" href="#chat"><span class="ec-chat" aria-hidden="true">#</span><span class="ec-row-text"><strong>Чат события</strong><span>5 тем · сообщений пока нет</span></span>${ico.chev}</a><label class="field ec-coauthor"><span>Соавторы</span><input class="input" placeholder="Имя на платформе"></label><p class="caption">Соавтор правит любой раздел. Если двое правили один раздел, остаётся последнее сохранение.</p></div></section>`;}

function after(){return `<section class="ec-section"><details class="card ec-after"><summary><span><strong>Итоги события</strong><span class="caption">Появятся после 14 июня: гости, заполняемость, фактическая смета</span></span><svg class="ec-fold" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><p class="secondary">Итоги собираются из фактических сумм в смете и отметок на входе. Пока событие не прошло, здесь пусто.</p></details><div class="ec-foot"><a class="ec-row" href="#export"><span class="ec-row-text"><strong>Пакет и экспорт</strong><span>Печать · ссылки по ролям · смета</span></span>${ico.chev}</a><button type="button" class="text-button">Создать следующее по этому образцу</button></div></section>`;}

function overview(){return `<div class="ec">${hero()}${seg('overview')}${nextAction()}${readiness()}${money()}${timing()}${people()}${after()}</div>`;}

/* ---- пошагово ---- */
function stepper(i){return `<nav class="ec-steps" aria-label="Разделы события">${SECTIONS.map((s,k)=>`<a class="ec-step ${s.status}" href="${s.status==='locked'?'#step/'+i:'#step/'+k}"${k===i?' aria-current="step"':''}${s.status==='locked'?' aria-disabled="true"':''}><span class="ec-state">${ico[s.status]}</span>${s.title}</a>`).join('')}</nav>`;}

function ticketsForm(){const total=tiers.reduce((a,t)=>a+Number(t.count||0),0);const sum=tiers.reduce((a,t)=>a+t.price*t.count,0);
 return `<div class="ec-form"><p class="ec-lead">Категории билетов. Вместимость площадки — ${EV.cap} гостей.</p>${tiers.map((t,k)=>`<fieldset class="card ec-tier"><legend class="visually-hidden">Категория ${k+1}</legend><label class="field"><span>Название</span><input class="input" data-tier="${k}" data-k="name" value="${t.name}"></label><div class="ec-two"><label class="field"><span>Цена, ₽</span><input class="input" inputmode="numeric" data-tier="${k}" data-k="price" value="${t.price}"></label><label class="field"><span>Количество</span><input class="input" inputmode="numeric" data-tier="${k}" data-k="count" value="${t.count}"></label></div></fieldset>`).join('')}<button type="button" class="secondary-button ec-full" data-tier-add>Добавить категорию</button>
 <div class="card ec-sum ${total>EV.cap?'over':''}"><div><span class="caption">Билетов</span><b>${total} / ${EV.cap}</b></div><div><span class="caption">Выручка при солдауте</span><b>${rub(sum)}</b></div>${total>EV.cap?'<p class="ec-warn">Билетов больше, чем мест на площадке.</p>':''}</div>
 <div class="ec-head"><h2>Продажи</h2></div><div class="ec-two"><label class="field"><span>Старт продаж</span><input class="input" type="date" value="2026-05-17"></label><label class="field"><span>Конец продаж</span><input class="input" type="date" value="2026-06-14"></label></div></div>`;}

function genericForm(s){return `<div class="ec-form"><p class="ec-lead">${s.note}.</p><div class="card ec-empty"><p class="secondary">Здесь — поля раздела «${s.title}», как в текущем конструкторе. В предложении подробно разобран шаг «Билеты».</p><a class="text-button" href="#step/3">Открыть «Билеты» →</a></div></div>`;}

function step(i){const s=SECTIONS[i];if(!s)return overview();const prev=i-1,nextIdx=SECTIONS.findIndex((x,k)=>k>i&&x.status!=='locked');
 return `<div class="ec">${seg('step')}<a class="ec-back" href="#overview">← ${EV.title}, ${EV.date}</a>${stepper(i)}<header class="ec-step-head"><p class="caption">Шаг ${i+1} из ${SECTIONS.length} · ${s.group}</p><h1>${s.title}</h1>${s.status==='blocked'?'<p class="ec-warn">Блокирует анонс события</p>':''}</header>${s.id==='tickets'?ticketsForm():genericForm(s)}<div class="ec-actions">${prev>=0?`<a class="secondary-button" href="#step/${prev}">Назад</a>`:'<a class="secondary-button" href="#overview">К обзору</a>'}<button type="button" class="primary ec-btn" data-save="${i}">${nextIdx>0?'Сохранить и дальше':'Сохранить'}</button></div></div>`;}

function render(){const h=location.hash.slice(1)||'overview';const m=h.match(/^step\/(\d+)$/);document.querySelector('#main').innerHTML=h==='tasks'&&window.ecTasks?`<div class="ec">${hero()}${seg('tasks')}${window.ecTasks()}</div>`:m?step(Number(m[1])):overview();
 const cur=document.querySelector('.ec-step[aria-current]');if(cur)cur.scrollIntoView({inline:'center',block:'nearest'});}
addEventListener('hashchange',()=>{render();scrollTo(0,0);});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-add]');if(a){const k=a.dataset.add;added.has(k)?added.delete(k):added.add(k);render();return;}
 if(e.target.closest('[data-add-all]')){TIMING.flatMap(([,r])=>r).forEach(r=>added.add(r[3]));render();return;}
 if(e.target.closest('[data-tier-add]')){tiers.push({name:'Новая категория',price:0,count:0});render();return;}
 const sv=e.target.closest('[data-save]');if(sv){const i=Number(sv.dataset.save);const s=SECTIONS[i];if(s.status!=='done'){s.status='done';s.note=s.id==='tickets'?`${tiers.length} категории · ${tiers.reduce((a,t)=>a+Number(t.count||0),0)} билетов`:'Заполнено';if(s.id==='tickets'){const m=SECTIONS.find(x=>x.id==='map');m.status='todo';m.note='Можно строить';}}
  const n=SECTIONS.findIndex((x,k)=>k>i&&x.status!=='locked'&&x.status!=='done');location.hash=n>0?'step/'+n:'overview';}
 if(e.target.closest('.ec-step[aria-disabled]')||e.target.closest('[aria-disabled="true"]'))e.preventDefault();});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.tier===undefined)return;const v=t.dataset.k==='name'?t.value:Number(t.value.replace(/\D/g,''))||0;tiers[t.dataset.tier][t.dataset.k]=v;
 const total=tiers.reduce((a,x)=>a+Number(x.count||0),0),sum=tiers.reduce((a,x)=>a+x.price*x.count,0);const box=document.querySelector('.ec-sum');if(box){box.classList.toggle('over',total>EV.cap);box.querySelectorAll('b')[0].textContent=`${total} / ${EV.cap}`;box.querySelectorAll('b')[1].textContent=rub(sum);}});
window.ecRender=render;
render();
})();
