'use strict';
/* Задачи события — как в хорошем трекере: сроки считаются от даты события, у задачи есть раздел, ответственный,
   зависимость («ждёт» / «блокирует»), подзадачи. Группы по времени, сверху таймлайн с вехами и отметкой «сегодня». */
(()=>{
const TODAY=new Date(2026,4,22),EVENT=new Date(2026,5,14);
const P='../digital-jazz-unified/assets/portraits/';
const TEAM={me:{name:'Ты',img:null},iskra:{name:'Искра',role:'PR',img:P+'judge-arina.png'},spektr:{name:'Спектр',role:'продакшн',img:P+'judge-chagin.png'},puls:{name:'Пульс',role:'звук',img:P+'judge-mclis.png'},kontur:{name:'Контур',role:'бар',img:P+'judge-iv.png'}};
const d=(m,day)=>new Date(2026,m-1,day);
/* раздел = один из 10 разделов конструктора */
const T=[
 {id:1,t:'Подтвердить площадку и дату',sec:'Дата и место',due:d(5,15),who:'me',done:true},
 {id:2,t:'Утвердить хедлайнера',sec:'Лайн-ап',due:d(5,20),who:'me',sub:[['Шорт-лист из 3 артистов',true],['Запрос гонорара и райдера',true],['Подписать оффер',false]]},
 {id:3,t:'Смета: аренда, звук, охрана',sec:'Бюджет',due:d(5,21),who:'spektr',sub:[['Аренда площадки',true],['Звук и свет',false],['Охрана',false]]},
 {id:4,t:'Настроить категории билетов',sec:'Билеты',due:d(5,24),who:'me',blocks:[5,6,7]},
 {id:5,t:'Тексты и визуал анонса',sec:'PR-кампания',due:d(5,26),who:'iskra',waits:[2]},
 {id:6,t:'Анонс и старт продаж',sec:'PR-кампания',due:d(5,28),time:'12:00',who:'iskra',waits:[4,5],milestone:true},
 {id:7,t:'Схема площадки и зоны',sec:'Схема площадки',due:d(6,1),who:'spektr',waits:[4]},
 {id:8,t:'Технический райдер хедлайнера',sec:'Тех. райдер',due:d(6,2),who:'puls',waits:[2]},
 {id:9,t:'Партнёр по бару',sec:'Партнёры и мерч',due:d(6,3),who:'kontur'},
 {id:10,t:'Меню и закупка бара',sec:'Бар и еда',due:d(6,7),who:'kontur',waits:[9]},
 {id:11,t:'Смены охраны и входа',sec:'Команда',due:d(6,8),who:'spektr'},
 {id:12,t:'Закрыть гостевой список',sec:'Билеты',due:d(6,12),time:'18:00',who:'me'},
 {id:13,t:'Саундчек',sec:'Тех. райдер',due:d(6,14),time:'18:00',who:'puls'},
 {id:14,t:'Брифинг охраны',sec:'Команда',due:d(6,14),time:'19:00',who:'spektr'},
 {id:15,t:'Открытие дверей',sec:'Дата и место',due:d(6,14),time:'23:00',who:'me',milestone:true},
 {id:16,t:'Расчёты и отчёт',sec:'Бюджет',due:d(6,15),time:'14:00',who:'me'}];
let filter='Все',open=null;
const M=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const fmt=x=>`${x.getDate()} ${M[x.getMonth()]}`;
const days=(a,b)=>Math.round((b-a)/864e5);
const byId=id=>T.find(x=>x.id===id);
const waiting=x=>(x.waits||[]).filter(id=>!byId(id).done);
const overdue=x=>!x.done&&x.due<TODAY;
const blocking=x=>!x.done&&(x.blocks||T.filter(y=>(y.waits||[]).includes(x.id)).map(y=>y.id)).some(id=>!byId(id).done);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ava=(k,size='')=>{const p=TEAM[k];return p.img?`<img class="tk-ava ${size}" src="${p.img}" alt="">`:`<span class="tk-ava tk-me ${size}" aria-hidden="true">Я</span>`;};
const check='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.2 3 3 6-6.4"/></svg>';
const diamond='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/></svg>';

/* таймлайн: от сегодня до дня после события, вехи точками, «сегодня» — лайм */
function timeline(){const marks=[{x:TODAY,l:'Сегодня',k:'today'},{x:d(5,28),l:'Анонс',k:byId(6).done?'done':''},{x:d(6,12),l:'Гостевой',k:byId(12).done?'done':''},{x:EVENT,l:'Событие',k:'event'},{x:d(6,15),l:'Отчёт',k:''}];
 return `<section class="tk-tl card" aria-label="Вехи подготовки"><div class="tk-tl-head"><span class="caption">До события</span><b>${days(TODAY,EVENT)} дня</b></div><ol class="tk-rail">${marks.map(m=>`<li class="${m.k}"><i></i><em>${m.l}</em><small>${m.x.getDate()} ${M[m.x.getMonth()].slice(0,3)}</small></li>`).join('')}</ol></section>`;}

function bucket(x){if(x.done)return 'Готово';if(x.due<TODAY)return 'Просрочено';const n=days(TODAY,x.due);if(+x.due===+EVENT)return 'День события';if(x.due>EVENT)return 'После';if(n<=6)return 'Эта неделя';if(n<=13)return 'Следующая неделя';return 'Позже';}
const ORDER=['Просрочено','Эта неделя','Следующая неделя','Позже','День события','После','Готово'];

function row(x){const w=waiting(x),sub=x.sub?`${x.sub.filter(s=>s[1]).length}/${x.sub.length}`:'';const od=overdue(x);
 return `<li class="tk-row${x.done?' done':''}${od?' overdue':''}${w.length?' waiting':''}"><button type="button" class="tk-check${x.milestone?' ms':''}" data-done="${x.id}" aria-pressed="${!!x.done}" aria-label="${x.done?'Вернуть в работу':'Готово'}: ${esc(x.t)}">${x.milestone?diamond:check}</button><button type="button" class="tk-main" data-open="${x.id}"><span class="tk-title">${esc(x.t)}</span><span class="tk-meta"><span class="tk-sec">${x.sec}</span>${sub?`<span class="tk-sub">${sub}</span>`:''}${w.length?`<span class="tk-wait">ждёт: ${w.map(id=>esc(byId(id).t)).join(', ')}</span>`:blocking(x)?'<span class="tk-block">блокирует</span>':''}</span></button><span class="tk-right"><span class="tk-due${od?' od':''}">${x.time&&+x.due===+EVENT?x.time:fmt(x.due)}</span>${ava(x.who)}</span></li>`;}

function list(){const pick=T.filter(x=>filter==='Все'?true:filter==='Мои'?x.who==='me':filter==='Просрочено'?overdue(x):filter==='Блокируют'?blocking(x):true);
 return ORDER.map(g=>{const items=pick.filter(x=>bucket(x)===g).sort((a,b)=>a.due-b.due);if(!items.length)return '';const fold=g==='Готово';
  const body=`<ul class="tk-list">${items.map(row).join('')}</ul>`;
  return fold?`<details class="tk-group tk-donegroup"><summary><span class="tk-gt">Готово</span><span class="caption">${items.length}</span></summary>${body}</details>`:`<section class="tk-group"><p class="tk-gt${g==='Просрочено'?' od':''}">${g}<span>${items.length}</span></p>${body}</section>`;}).join('')||'<div class="card"><p class="secondary">По этому фильтру задач нет.</p></div>';}

function sheet(){const x=byId(open);if(!x)return '';const w=waiting(x);const blocks=(x.blocks||T.filter(y=>(y.waits||[]).includes(x.id)).map(y=>y.id));
 return `<div class="tk-scrim" data-close></div><section class="tk-sheet" role="dialog" aria-modal="true" aria-labelledby="tk-st"><span class="tk-grab" aria-hidden="true"></span><p class="caption">${x.sec}${x.milestone?' · веха':''}</p><h2 id="tk-st">${esc(x.t)}</h2>
 <dl class="tk-props"><div><dt>Срок</dt><dd class="tk-due-big${overdue(x)?' od':''}">${fmt(x.due)}${x.time?', '+x.time:''}<small>${overdue(x)?'просрочено на '+days(x.due,TODAY)+' дн.':+x.due===+EVENT?'день события':days(x.due,EVENT)>0?'за '+days(x.due,EVENT)+' дн. до события':'после события'}</small></dd></div>
 <div><dt>Ответственный</dt><dd class="tk-who">${ava(x.who,'lg')}<span>${TEAM[x.who].name}${TEAM[x.who].role?` · ${TEAM[x.who].role}`:''}</span></dd></div>
 ${w.length?`<div><dt>Ждёт</dt><dd>${w.map(id=>`<button type="button" class="tk-link" data-open="${id}">${esc(byId(id).t)}</button>`).join('')}</dd></div>`:''}
 ${blocks.length?`<div><dt>Блокирует</dt><dd>${blocks.map(id=>`<button type="button" class="tk-link" data-open="${id}">${esc(byId(id).t)}</button>`).join('')}</dd></div>`:''}</dl>
 ${x.sub?`<div class="tk-subs"><p class="tk-gt">Подзадачи<span>${x.sub.filter(s=>s[1]).length}/${x.sub.length}</span></p>${x.sub.map((s,i)=>`<label class="tk-subrow${s[1]?' on':''}"><input type="checkbox" data-sub="${x.id}:${i}"${s[1]?' checked':''}><span>${esc(s[0])}</span></label>`).join('')}</div>`:''}
 <button type="button" class="primary ec-btn" data-done="${x.id}">${x.done?'Вернуть в работу':w.length?'Готово, хотя ждёт '+w.length:'Готово'}</button></section>`;}

window.ecTasks=()=>{const left=T.filter(x=>!x.done).length,od=T.filter(overdue).length;
 const chips=['Все','Мои','Просрочено','Блокируют'].map(c=>`<button type="button" class="chip tk-chip" data-filter="${c}" aria-pressed="${filter===c}">${c}${c==='Просрочено'&&od?` · ${od}`:''}</button>`).join('');
 return `${timeline()}<div class="tk-sum"><span><b>${left}</b> в работе</span>${od?`<span class="od"><b>${od}</b> просрочено</span>`:''}<span><b>${T.length-left}</b> готово</span></div><div class="tk-chips">${chips}</div><form class="tk-add" data-add><input class="input" name="t" placeholder="Новая задача — Enter" aria-label="Новая задача"></form>${list()}${sheet()}`;};

const rerender=()=>window.ecRender&&window.ecRender();
document.addEventListener('click',e=>{if(location.hash!=='#tasks')return;
 const dn=e.target.closest('[data-done]');if(dn){const x=byId(+dn.dataset.done);x.done=!x.done;if(x.sub&&x.done)x.sub.forEach(s=>s[1]=true);if(dn.closest('.tk-sheet'))open=null;rerender();return;}
 const op=e.target.closest('[data-open]');if(op){open=+op.dataset.open;rerender();document.querySelector('.tk-sheet h2')?.focus?.();return;}
 if(e.target.closest('[data-close]')){open=null;rerender();return;}
 const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;rerender();}});
document.addEventListener('change',e=>{const s=e.target.dataset?.sub;if(!s)return;const [id,i]=s.split(':').map(Number);const x=byId(id);x.sub[i][1]=e.target.checked;if(x.sub.every(z=>z[1]))x.done=true;rerender();});
document.addEventListener('submit',e=>{if(!e.target.matches('[data-add]'))return;e.preventDefault();const v=e.target.t.value.trim();if(!v)return;T.push({id:Math.max(...T.map(x=>x.id))+1,t:v,sec:'Без раздела',due:d(5,27),who:'me'});rerender();document.querySelector('.tk-add input')?.focus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=null;rerender();}});
})();
