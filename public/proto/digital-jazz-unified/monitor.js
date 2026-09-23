'use strict';
/* v57 — монитор турнира Digital Jazz Cup для всех ролей, адрес #monitor на странице роли:
   organizer.html · participant.html · judge.html · index.html (зритель).
   Демо: 64 заявки → отбор → пирамида на 16; «сегодня» 13 окт, идёт судейство 1/4 финала.
   «Я»: участник — Лофи, судья — Судья Контур.
   Правила v57: промежуточный счёт пары видят только организатор и судья, уже выставивший свою оценку;
   участник и зритель видят счёт после решения всех трёх судей. Судья сначала слушает работу, потом ставит баллы. */
(() => {
const ROLE=document.body.dataset.tournamentRole||'Зритель';
const ME_PLAYER='Лофи',ME_JUDGE='Судья Контур';
const NAMES=['Нокс','Вольт','Сэмпл','Рифф','Лофи','Грув','Эхо','Кик','Снэр','Хэт','Октава','Дельта','Фейдер','Лууп','Тембр','Пэд',
 'Синк','Вайб','Спин','Флоу','Дроп','Хук','Бридж','Слэп','Фанк','Соул','Нуар','Неон','Кобальт','Кварц','Мираж','Орбит',
 'Пиксель','Шторм','Гейз','Туман','Зенит','Пульсар','Квазар','Винил','Кассета','Мьют','Сустейн','Атака','Релиз','Фильтр','Гейн','Панч',
 'Клэп','Шейкер','Том','Райд','Крэш','Бас','Скрэтч','Сабж','Дабл','Тейк','Сет','Микс','Фьюз','Альт','Кей','Лейбл'];
const JUDGES=['Судья Пульс','Судья Спектр','Судья Контур'];
const MY_J=JUDGES.indexOf(ME_JUDGE);
const CRITERIA=['Оригинальность','Техника','Подача'];
const STAGES=[
 {key:'qual',short:'Отбор',name:'Отбор',count:64,dates:'2–6 окт',state:'done',note:'Открытый раунд · проходят 16 лучших по сумме баллов'},
 {key:'r16',short:'1/8',name:'1/8 финала',count:16,dates:'7–10 окт',state:'done',note:'8 пар · посев 1–16 по итогам отбора'},
 {key:'qf',short:'1/4',name:'1/4 финала',count:8,dates:'11–14 окт',state:'live',note:'4 пары · работы приняты, идёт судейство'},
 {key:'sf',short:'1/2',name:'1/2 финала',count:4,dates:'15–17 окт',state:'next',note:'2 пары · задание откроется 15 окт в 12:00'},
 {key:'f',short:'Финал',name:'Финал',count:2,dates:'18–20 окт',state:'next',note:'Одна пара · итоги в эфире 20 окт в 20:00'}];

/* ---------- данные ---------- */
const QUAL=NAMES.map((name,i)=>({name,seed:i+1,score:i<16?[44,43,42,41,40,40,39,38,38,37,37,36,36,35,35,34][i]:Math.max(12,33-Math.floor((i-16)*0.45)-(i%3))}));
const seed=n=>QUAL[n-1];
const PORTRAIT={'Нокс':'a','Вольт':'b','Лофи':'c','Грув':'d','Рифф':'e','Эхо':'f','Хэт':'g','Сэмпл':'h'};
const R16=[[1,16,40,31],[8,9,33,36],[5,12,38,34],[4,13,37,35],[3,14,39,30],[6,11,36,33],[7,10,32,37],[2,15,41,32]]
 .map(([a,b,sa,sb])=>({a:seed(a),b:seed(b),sa,sb,judged:3,winner:sa>sb?seed(a):seed(b)}));
/* 1/4: оценка судьи — сумма трёх критериев (до 15) по каждому участнику; null — ещё не выставлена */
const QF=[
 {a:R16[0].winner,b:R16[1].winner,scores:[[13,12],[14,11],[12,13]]},
 {a:R16[2].winner,b:R16[3].winner,scores:[[12,14],[13,13],null]},
 {a:R16[4].winner,b:R16[5].winner,scores:[[12,12],null,null]},
 {a:R16[6].winner,b:R16[7].winner,scores:[[11,14],null,null]}];
QF.forEach((m,i)=>{m.works=[m.a,m.b].map((p,k)=>({p,src:`assets/judge-demo-${(i*2+k)%4}.wav`}));});
function tally(m){const d=m.scores.filter(Boolean);m.sa=d.reduce((s,x)=>s+x[0],0);m.sb=d.reduce((s,x)=>s+x[1],0);m.judged=d.length;m.winner=d.length===3?(m.sa>=m.sb?m.a:m.b):null;}
QF.forEach(tally);
const ratingsDone=()=>QF.reduce((s,m)=>s+m.judged,0);
const decided=()=>QF.filter(m=>m.winner).length;
const judgeLeft=()=>JUDGES.map((j,ji)=>({judge:j,left:QF.filter(m=>!m.scores[ji]).length}));
const myPair=()=>QF.findIndex(m=>m.a.name===ME_PLAYER||m.b.name===ME_PLAYER);
/* реакции зрителей — демо-счётчики на участника */
const BASE_REACT={'Нокс':41,'Снэр':18,'Лофи':56,'Рифф':49,'Сэмпл':23,'Грув':27,'Хэт':31,'Вольт':38};

/* ---------- состояние ---------- */
const LS=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}};
const state={view:2,follow:(()=>{const v=LS('djMonitorFollow:'+ROLE);return v!==null&&v!==undefined?v:ROLE==='Участник'?ME_PLAYER:'';})(),
 reminded:LS('djCupReminded')||{},reacted:LS('djCupReacted')||{},deadline:LS('djCupDeadline')||'14 окт, 18:00',confirm:null,published:false,
 rate:{},openWorks:null};
/* черновик оценки судьи по паре: {sel, works:[{scores,submitted,heard}]} */
const rateOf=i=>state.rate[i]||(state.rate[i]={sel:0,works:[{scores:{},submitted:false,heard:false},{scores:{},submitted:false,heard:false}]});

/* ---------- утилиты ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const grad=n=>'var(--dj-avatar-'+(1+[...n].reduce((s,c)=>s+c.charCodeAt(0),0)%6)+')';
const ava=(p,size='')=>PORTRAIT[p.name]?`<span class="mon-ava ${size}"><img src="assets/portraits/participant-${PORTRAIT[p.name]}.png" alt="" loading="lazy"></span>`:`<span class="mon-ava ${size}" style="background:${grad(p.name)}" aria-hidden="true">${p.name[0]}</span>`;
const person=n=>`person.html?name=${encodeURIComponent(n)}&from=cup#tournaments`;
const nameLink=p=>`<a class="mon-name-link" href="${person(p.name)}">${esc(p.name)}</a>`;
const isF=p=>p&&state.follow===p.name;
const cls=p=>isF(p)?' is-follow':'';
const meTag=p=>ROLE==='Участник'&&p&&p.name===ME_PLAYER?'<em class="mon-me">ты</em>':'';
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c;};
const rule=(id,t,note='')=>`<div class="rule"><h2 class="t" id="${id}">${t}</h2><div class="line"></div>${note!==''?`<div class="note">${note}</div>`:''}</div>`;
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const chevron='<svg class="stage-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
/* кто видит промежуточный счёт */
const hidden=m=>!m.winner&&(ROLE==='Участник'||ROLE==='Зритель'||(ROLE==='Судья'&&!m.scores[MY_J]));
const hideNote=()=>ROLE==='Судья'?'Счёт коллег откроется после твоей оценки':'Счёт откроется, когда оценят все три судьи';
const reacts=p=>(BASE_REACT[p.name]||0)+(state.reacted[p.name]?1:0);
const now_=()=>new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});

/* ---------- блоки ---------- */
function head(){return `<a class="battle-back" href="#tournaments">← Все турниры</a>
<header class="mon-head"><p class="mon-eyebrow">Турнир · Битмейкинг${ROLE!=='Зритель'?` · ты ${({Организатор:'организатор',Участник:'участник',Судья:'судья'})[ROLE]}`:''}</p><h1>Digital Jazz Cup</h1>
<p class="secondary">64 участника · отбор и пирамида на 16 · 2–20 окт</p>
<p class="mon-status">${tournamentStatus(state.published?'Идёт · 1/2 финала':'Идёт · 1/4 финала','ready')}<span class="caption">сегодня 13 окт</span></p></header>`;}

function rail(interactive=true){return `<nav class="mon-rail${interactive?'':' static'}" aria-label="Этапы турнира"><div class="mon-rail-in"><div class="mon-wire" style="--done:50%"></div><div class="mon-nodes">${STAGES.map((s,i)=>{const inner=`<i></i><em>${s.short}</em><span>${s.state==='live'?'сейчас':s.count}</span>`;return interactive?`<button class="mon-node ${s.state}" data-mon-stage="${i}" aria-pressed="${state.view===i}"${s.state==='live'?' aria-current="step"':''}>${inner}</button>`:`<span class="mon-node ${s.state}">${inner}</span>`;}).join('')}</div></div></nav>`;}

function phases(){const p=[['Работы','8 из 8','done'],['Судейство',`${ratingsDone()} из 12 оценок`,'live'],['Итоги','15 окт','next']];
return `<div class="mon-phases" style="--judged:${Math.round(ratingsDone()/12*100)}%">${p.map(([t,v,s])=>`<div class="mon-phase ${s}"><b></b><span>${t}</span><small>${v}</small></div>`).join('')}</div>`;}
const stats=rows=>`<div class="mon-stats">${rows.map(([b,sm,sp,c])=>`<div class="${c||''}"><b>${b}${sm?`<small>${sm}</small>`:''}</b><span>${sp}</span></div>`).join('')}</div>`;

function now(){let title='Судейство',sub=`До ${state.deadline}`,st;
if(ROLE==='Участник'){const m=QF[myPair()],opp=m.a.name===ME_PLAYER?m.b:m.a;
 title=m.winner?(m.winner.name===ME_PLAYER?'Ты в 1/2 финала':'Турнир для тебя завершён'):'Твоя пара на оценке';
 sub=m.winner?'Итоги 1/4 опубликуют 15 окт в 12:00':`Против ${opp.name} · счёт откроется, когда оценят все три судьи`;
 st=stats([[m.judged,'/3','судей оценили'],['15','окт','итоги 1/4'],['#'+QUAL.find(p=>p.name===ME_PLAYER).seed,'','твой посев']]);}
else if(ROLE==='Судья'){const left=QF.filter(m=>!m.scores[MY_J]).length;title=left?'Твои оценки':'Ты оценил все пары';sub=left?`Осталось ${left} ${plural(left,'пара','пары','пар')} · до ${state.deadline}`:`Оценки можно изменить до ${state.deadline}`;
 st=stats([[4-left,'/4','твоих пар',left?'':'lime'],[ratingsDone(),'/12','оценок всего'],[decided(),'/4','пар решено',decided()?'lime':'']]);}
else if(ROLE==='Зритель'){sub='Итоги 1/4 — 15 окт в 12:00 · финал в эфире 20 окт в 20:00';
 st=stats([['8','','в игре'],['4','','пары'],[decided(),'/4','решено',decided()?'lime':'']]);}
else{sub=`До ${state.deadline} · осталось ${state.deadline.startsWith('15')?'2 д 6 ч':'1 д 6 ч'}`;st=stats([['8','/8','работ'],[ratingsDone(),'/12','оценок'],[decided(),'/4','пар решено',decided()?'lime':'']]);}
return `<section class="card mon-now" aria-labelledby="mon-now-t"><p class="mon-live"><i></i>Сейчас · 1/4 финала</p><h2 id="mon-now-t">${title}</h2><p class="secondary">${sub}</p>${phases()}${st}</section>`;}

/* подтверждение прямо на месте — без системных окон */
const confirmRow=(key,text,yes)=>`<div class="mon-confirm" role="group" aria-label="Подтверждение"><p>${text}</p><div class="mon-confirm-actions"><button class="primary" data-mon-yes="${key}">${yes}</button><button class="secondary-button" data-mon-no>Отмена</button></div></div>`;

function organizerBlock(){const jl=judgeLeft().filter(j=>j.left);
 const rows=jl.map(j=>{const sent=state.reminded[j.judge];return `<li class="mon-alert"><span class="mon-alert-dot" aria-hidden="true"></span><div><strong>${esc(j.judge)}</strong><span class="caption">${j.left} ${plural(j.left,'оценка не выставлена','оценки не выставлены','оценок не выставлено')} · срок ${state.deadline}</span></div><button class="secondary-button" data-mon-remind="${esc(j.judge)}"${sent?` aria-disabled="true"`:''}>${sent?'Отправлено · '+sent:'Напомнить'}</button></li>`;}).join('');
 const tie=QF.map((m,i)=>({m,i})).filter(x=>!x.m.winner&&x.m.judged&&x.m.sa===x.m.sb).map(x=>`<li class="mon-alert info"><span class="mon-alert-dot" aria-hidden="true"></span><div><strong>Пара ${x.i+1} идёт вровень</strong><span class="caption">${x.m.sa} : ${x.m.sb} после ${x.m.judged} из 3 судей — решат оставшиеся</span></div></li>`).join('');
 const all=ratingsDone()===12,extended=state.deadline.startsWith('15');
 const publish=state.published?`<p class="mon-manage-done">${tournamentStatus('Итоги 1/4 опубликованы','ready')}</p>`:state.confirm==='publish'?confirmRow('publish','Опубликовать итоги 1/4? Победители перейдут в 1/2, судьи больше не смогут менять оценки.','Опубликовать'):`<button class="primary full" data-mon-ask="publish"${all?'':' disabled'}>Опубликовать итоги 1/4</button><p class="caption">${all?'Все судьи оценили все пары.':`Станет доступно, когда судьи выставят все оценки · ${ratingsDone()} из 12`}</p>`;
 const extend=state.confirm==='extend'?confirmRow('extend','Продлить судейство 1/4 до 15 окт, 18:00? Итоги и старт 1/2 сдвинутся на сутки, участники получат уведомление.','Продлить'):extended?`<div class="mon-manage-row"><span class="caption">Срок продлён до 15 окт, 18:00</span><button class="text-button" data-mon-undo-extend>Вернуть 14 окт</button></div>`:`<button class="secondary-button full" data-mon-ask="extend">Продлить судейство на сутки</button>`;
 return `${rows||tie?`<section class="mon-section" aria-labelledby="mon-rb">${rule('mon-rb','Требует внимания',jl.length)}<ul class="mon-alerts">${rows}${tie}</ul></section>`:''}
<section class="mon-section" aria-labelledby="mon-mg">${rule('mon-mg','Управление этапом','1/4')}<div class="card mon-manage">${publish}${extend}</div></section>`;}

function roleBlock(){
if(ROLE==='Организатор')return organizerBlock();
if(ROLE==='Участник'){const m=QF[myPair()],other=QF[myPair()^1];
 const items=m.winner?[[m.winner.name===ME_PLAYER?'ready':'','Итог 1/4',m.winner.name===ME_PLAYER?'Ты прошёл в 1/2 финала':'Выбыл из турнира · работы остаются в профиле']]:[['ready','Работа принята','12 окт · сейчас ничего делать не нужно'],['','Если пройдёшь','Задание 1/2 откроется 15 окт в 12:00 · загрузка до 16 окт, 23:59'],['','Соперник в 1/2',other.winner?other.winner.name:`${other.a.name} или ${other.b.name}`]];
 return `<section class="mon-section" aria-labelledby="mon-rb">${rule('mon-rb','Что дальше для тебя')}<ul class="mon-notes">${items.map(([s,t,c])=>`<li class="${s}"><i aria-hidden="true"></i><div><strong>${t}</strong><span class="caption">${esc(c)}</span></div></li>`).join('')}</ul></section>`;}
if(ROLE==='Судья'){const pend=QF.map((m,i)=>({m,i})).filter(x=>!x.m.scores[MY_J]);
 if(!pend.length)return `<section class="mon-section" aria-labelledby="mon-rb">${rule('mon-rb','Твоя очередь')}<ul class="mon-notes"><li class="ready"><i aria-hidden="true"></i><div><strong>Все пары 1/4 оценены</strong><span class="caption">Изменить оценку можно до ${state.deadline} · следующая очередь — 1/2 финала</span></div></li></ul></section>`;
 return `<section class="mon-section" aria-labelledby="mon-rb">${rule('mon-rb','Ждут твоей оценки',pend.length)}<ul class="mon-alerts">${pend.map(x=>`<li class="mon-alert"><span class="mon-alert-dot" aria-hidden="true"></span><div><strong>Пара ${x.i+1} · ${esc(x.m.a.name)} — ${esc(x.m.b.name)}</strong><span class="caption">Две работы · срок ${state.deadline}</span></div><button class="primary mon-go" data-mon-rate="${x.i}">Оценить</button></li>`).join('')}</ul></section>`;}
/* Зритель: пара, которую слушают больше всего */
const open=QF.map((m,i)=>({m,i})).filter(x=>!x.m.winner);if(!open.length)return '';
const best=open.sort((x,y)=>(reacts(y.m.a)+reacts(y.m.b))-(reacts(x.m.a)+reacts(x.m.b)))[0];
return `<section class="mon-section" aria-labelledby="mon-rb">${rule('mon-rb','Слушают больше всего')}<article class="card mon-hot"><p class="caption">Пара ${best.i+1} · ${best.m.judged} из 3 судей оценили</p><div class="mon-hot-score"><span>${ava(best.m.a)}<b>${esc(best.m.a.name)}</b><small>🔥 ${reacts(best.m.a)}</small></span><strong>vs</strong><span>${ava(best.m.b)}<b>${esc(best.m.b.name)}</b><small>🔥 ${reacts(best.m.b)}</small></span></div><button class="primary full" data-mon-listen="${best.i}">Слушать работы</button><p class="caption">Счёт откроется, когда оценят все три судьи.</p></article></section>`;}

function judgesLine(m){return `<div class="mon-judges" aria-label="Судьи">${JUDGES.map((j,ji)=>`<a class="mon-judge ${m.scores[ji]?'done':''}" href="${person(j)}" title="${j}: ${m.scores[ji]?'оценил':'ждём оценку'}" aria-label="${j}: ${m.scores[ji]?'оценил':'ждём оценку'}">${djPortrait(j,false)}<i aria-hidden="true"></i></a>`).join('')}<span class="caption">${m.judged} из 3 судей</span></div>`;}

/* работы пары — для всех, кроме судьи до его оценки (у судьи плееры внутри формы) */
function worksBlock(m,i){const open=state.openWorks===i;
 return `<details class="stage-disclosure mon-works" id="mon-works-${i}"${open?' open':''}><summary><span>Работы пары</span>${chevron}</summary><div class="mon-works-list">${m.works.map(w=>`<div class="mon-work"><div class="mon-work-head">${ava(w.p,'sm')}<span class="mon-name">${nameLink(w.p)}${meTag(w.p)}</span>${ROLE==='Зритель'?`<button class="chip mon-react" data-mon-react="${esc(w.p.name)}" aria-pressed="${!!state.reacted[w.p.name]}" aria-label="Поддержать: ${esc(w.p.name)}">🔥 ${reacts(w.p)}</button>`:''}</div><audio controls preload="metadata" src="${w.src}" aria-label="Работа: ${esc(w.p.name)}"></audio></div>`).join('')}<p class="caption">Реакции поддерживают артиста и не меняют оценки судей.</p></div></details>`;}

/* оценка пары судьёй — тот же компонент, что в остальных турнирах: работа за работой */
function ratePanel(m,i){const r=rateOf(i),w=m.works[r.sel],cur=r.works[r.sel];
 return `<details class="stage-disclosure mon-rate" id="mon-rate-${i}"${state.openRate===i?' open':''}><summary><span>Оценить пару</span>${chevron}</summary><div class="judge-monitor mon-rate-body"><div class="queue-participants">${m.works.map((x,k)=>`<button type="button" class="secondary-button" data-mon-sel="${i}:${k}" aria-pressed="${r.sel===k}">${ava(x.p,'sm')}${esc(x.p.name)}<span class="caption">${tournamentStatus(r.works[k].submitted?'Оценено':'К оценке',r.works[k].submitted?'ready':'action')}</span></button>`).join('')}</div>${djScoreForm({attrs:`data-mon-form="${i}"`,name:esc(w.p.name),portrait:ava(w.p),media:`<audio controls preload="metadata" src="${w.src}" aria-label="Работа: ${esc(w.p.name)}"></audio>`,criteria:CRITERIA,scores:cur.scores,submitted:cur.submitted,editable:false,heard:cur.heard,submitLabel:(r.works[r.sel^1].submitted?'Подтвердить оценку пары':'Подтвердить: '+esc(w.p.name))})}</div></details>`;}

function pairCard(m,i,stage){const a=m.a,b=m.b,hide=stage==='qf'&&hidden(m);const lead=hide||m.sa===m.sb?null:(m.sa>m.sb?a:b);
const mine=ROLE==='Судья'&&m.scores[MY_J];
const st=m.winner?tournamentStatus('Решено','ready'):ROLE==='Судья'&&!m.scores[MY_J]?tournamentStatus('Ждёт твоей оценки','action'):m.judged?tournamentStatus('На оценке'):tournamentStatus('Ждём судей','action');
const row=(p,s)=>`<div class="mon-row${cls(p)}${m.winner&&m.winner!==p?' lost':''}${m.winner===p?' won':''}">${ava(p)}<span class="mon-name">${nameLink(p)}${meTag(p)}<small>#${p.seed}</small></span><b class="mon-score${!m.winner&&lead===p?' lead':''}">${m.judged&&!hide?s:'—'}</b></div>`;
let foot='';
if(stage==='qf'){foot=`<p class="caption mon-next">${hide?hideNote():'Победитель → 1/2 финала, пара '+(Math.floor(i/2)+1)}</p>`;
 if(ROLE==='Судья'&&!m.scores[MY_J])foot+=ratePanel(m,i);
 else{if(mine&&!state.published)foot+=`<div class="mon-manage-row"><span class="caption">Твоя оценка: ${m.scores[MY_J][0]} : ${m.scores[MY_J][1]}</span><button class="text-button" data-mon-rerate="${i}">Изменить</button></div>`;foot+=worksBlock(m,i);}}
return `<article class="card mon-pair${(isF(a)||isF(b))?' has-follow':''}" id="mon-pair-${stage}-${i}"><div class="mon-pair-head"><span class="caption">Пара ${i+1}</span>${st}</div>${row(a,m.sa)}${row(b,m.sb)}${m.scores?judgesLine(m):''}${foot}</article>`;}

function futurePair(i,stage){const src=stage==='sf'?[QF[i*2],QF[i*2+1]]:null;
const slot=m=>m.winner?`<div class="mon-row${cls(m.winner)}">${ava(m.winner)}<span class="mon-name">${nameLink(m.winner)}${meTag(m.winner)}<small>#${m.winner.seed}</small></span><b class="mon-score">—</b></div>`:`<div class="mon-row tbd${(isF(m.a)||isF(m.b))?' is-follow':''}"><span class="mon-ava ghost" aria-hidden="true">?</span><span class="mon-name">${esc(m.a.name)} или ${esc(m.b.name)}<small>решается в 1/4</small></span></div>`;
if(stage==='sf')return `<article class="card mon-pair future"><div class="mon-pair-head"><span class="caption">Пара ${i+1}</span>${tournamentStatus('15 окт','upcoming')}</div>${slot(src[0])}${slot(src[1])}</article>`;
const g=`<div class="mon-row tbd"><span class="mon-ava ghost" aria-hidden="true">?</span><span class="mon-name">Победитель пары N<small>1/2 финала</small></span></div>`;
return `<article class="card mon-pair future"><div class="mon-pair-head"><span class="caption">Финал</span>${tournamentStatus('18 окт','upcoming')}</div>${g.replace('N','1')}${g.replace('N','2')}</article>`;}

function board(){const top=QUAL.slice(0,16),rest=QUAL.slice(16);const row=p=>`<li class="mon-lb${cls(p)}${p.seed>16?' out':''}"><span class="mon-rank">${p.seed}</span>${ava(p,'sm')}<span class="mon-name">${nameLink(p)}${meTag(p)}</span><b>${p.score}<small>/45</small></b></li>`;
return `<ol class="mon-board">${top.map(row).join('')}<li class="mon-cut" aria-label="Граница прохода"><span>Проходят 16 · порог 34 балла</span></li>${rest.slice(0,4).map(row).join('')}</ol>
<details class="stage-disclosure mon-more"><summary><span>Все 64 участника</span>${chevron}</summary><ol class="mon-board">${rest.slice(4).map(row).join('')}</ol></details>`;}

function layout(){const s=STAGES[state.view];let body;
if(s.key==='qual')body=board();
else if(s.key==='r16')body=`<div class="mon-pairs">${R16.map((m,i)=>pairCard(m,i,'r16')).join('')}</div>`;
else if(s.key==='qf')body=`<div class="mon-pairs">${QF.map((m,i)=>pairCard(m,i,'qf')).join('')}</div>`;
else if(s.key==='sf')body=`<div class="mon-pairs">${[0,1].map(i=>futurePair(i,'sf')).join('')}</div>`;
else body=`<div class="mon-pairs">${futurePair(0,'f')}</div>`;
return `<section class="mon-section" id="mon-layout" aria-labelledby="mon-lay">${rule('mon-lay','Расклад · '+s.name,s.dates)}<p class="caption mon-note">${s.note}</p>${body}</section>`;}

function mini(){const cell=(a,b,w,future)=>{const n=p=>p?`<span class="${w&&w!==p?'lost':''}${w===p?' won':''}${isF(p)?' f':''}">${esc(p.name)}</span>`:'<span class="tbd">—</span>';return `<div class="mb-slot"><div class="mb-cell${future?' future':''}${(isF(a)||isF(b))?' f':''}">${n(a)}${n(b)}</div></div>`;};
const cols=[['1/8',R16.map(m=>cell(m.a,m.b,m.winner))],['1/4',QF.map(m=>cell(m.a,m.b,m.winner))],['1/2',[0,1].map(i=>cell(QF[i*2].winner,QF[i*2+1].winner,null,true))],['Финал',[cell(null,null,null,true)]]];
return `<section class="mon-section" aria-labelledby="mon-mb">${rule('mon-mb','Вся сетка','16 → 1')}<div class="mon-bracket">${cols.map(([t,c],ci)=>`<div class="mb-col${ci===1?' live':''}"><p class="mb-title">${t}</p><div class="mb-cells">${c.join('')}</div></div>`).join('')}</div></section>`;}

function pathOf(name){const q=QUAL.find(p=>p.name===name);if(!q)return '';const steps=[];const you=ROLE==='Участник'&&name===ME_PLAYER;
steps.push({t:'Отбор',s:q.seed<=16?'done':'out',v:`${q.seed}-е место · ${q.score} из 45`});
if(q.seed<=16){const m=R16.find(m=>m.a===q||m.b===q);const me=m.a===q,opp=me?m.b:m.a,won=m.winner===q;
 steps.push({t:'1/8 финала',s:won?'done':'out',v:`${won?'победа над':'поражение от'} ${opp.name} · ${me?m.sa:m.sb} : ${me?m.sb:m.sa}`});
 if(won){const k=QF.findIndex(m=>m.a===q||m.b===q),x=QF[k],me2=x.a===q,opp2=me2?x.b:x.a,hide=hidden(x);
  steps.push({t:'1/4 финала',s:x.winner?(x.winner===q?'done':'out'):'live',v:x.winner?`${x.winner===q?'победа над':'поражение от'} ${opp2.name} · ${me2?x.sa:x.sb} : ${me2?x.sb:x.sa}`:hide?(ROLE==='Судья'?`против ${opp2.name} · ждёт твоей оценки`:`против ${opp2.name} · оценили ${x.judged} из 3 судей`):`против ${opp2.name} · ${me2?x.sa:x.sb} : ${me2?x.sb:x.sa} после ${x.judged} из 3 судей`});
  if(!x.winner||x.winner===q){const px=QF[k^1];steps.push({t:'1/2 финала',s:'next',v:`15–17 окт · против ${px.winner?px.winner.name:px.a.name+' или '+px.b.name}`});steps.push({t:'Финал',s:'next',v:'18–20 окт'});}}}
const out=steps.some(s=>s.s==='out');
return `<ol class="mon-path">${steps.map(s=>`<li class="${s.s}"><i></i><div><strong>${s.t}</strong><span class="caption">${esc(s.v)}</span></div></li>`).join('')}</ol>${out?`<p class="caption">${you?'Ты выбыл':'Выбыл(а)'} из турнира. Работы остаются в профиле.</p>`:''}`;}

function follow(){const t={Участник:['Твой путь','Показать путь'],Зритель:['Болею за','Выбери участника'],Судья:['Путь участника','Следить за'],Организатор:['Путь участника','Следить за']}[ROLE];
const opts=QUAL.map(p=>`<option value="${esc(p.name)}"${state.follow===p.name?' selected':''}>${p.seed}. ${esc(p.name)}${ROLE==='Участник'&&p.name===ME_PLAYER?' (ты)':''}</option>`).join('');
const empty=ROLE==='Зритель'?'Выбери, за кого болеешь, — его пары подсветятся в раскладе и сетке, а здесь появится путь до финала.':'Выбери участника — его пары подсветятся в раскладе и сетке, а здесь появится путь до финала.';
return `<section class="mon-section" aria-labelledby="mon-fw">${rule('mon-fw',t[0])}<label class="field"><span>${t[1]}</span><select data-mon-follow><option value="">Никого не выбрано</option>${opts}</select></label>${state.follow?pathOf(state.follow):`<p class="caption">${empty}</p>`}</section>`;}

function ahead(){const ext=state.deadline.startsWith('15');const rows=[[ext?'16 окт, 12:00':'15 окт, 12:00','Итоги 1/4 и задание 1/2 финала','4 участника · 2 пары'],[ext?'16–18 окт':'15–17 окт','1/2 финала','Загрузка работ и судейство'],['18–20 окт','Финал','Одна пара · три судьи'],['20 окт, 20:00','Итоги в эфире','Призы: 1 место — запись в студии, 2 — наушники, 3 — сертификат']];
return `<section class="mon-section" aria-labelledby="mon-ah">${rule('mon-ah','Что впереди','7 дней')}<ol class="mon-ahead">${rows.map(([d,t,n])=>`<li><time>${d}</time><div><strong>${t}</strong><span class="caption">${n}</span></div></li>`).join('')}</ol></section>`;}

function view(){return `<div class="mon">${head()}${rail()}${now()}${roleBlock()}${layout()}${follow()}${mini()}${ahead()}<p class="caption mon-demo">Демотурнир: имена, баллы и даты — примеры для проверки интерфейса.</p></div>`;}

/* ---------- карточка в списке турниров роли ---------- */
function promo(){let line;
if(ROLE==='Организатор'){const n=judgeLeft().filter(j=>j.left).length;line=n?tournamentStatus(`${n} ${plural(n,'судья не закончил','судьи не закончили','судей не закончили')} оценку`,'action'):tournamentStatus('Все оценки 1/4 выставлены','ready');}
else if(ROLE==='Участник'){const m=QF[myPair()];line=tournamentStatus(`Ты в 1/4 · оценили ${m.judged} из 3 судей`,'pending');}
else if(ROLE==='Судья'){const n=QF.filter(m=>!m.scores[MY_J]).length;line=n?tournamentStatus(`Ждут твоей оценки: ${n} ${plural(n,'пара','пары','пар')}`,'action'):tournamentStatus('Твои оценки 1/4 выставлены','ready');}
else line=tournamentStatus('8 участников в игре · итоги 15 окт','pending');
return djTournamentCard({href:'#monitor',cover:'assets/battle/cup.svg',stage:{label:'Идёт · 1/4 финала',tone:'ready',kind:'live'},category:'Биты',format:'Отбор и пирамида',count:64,name:'Digital Jazz Cup',judges:JUDGES,prize:'Запись в студии',dates:'2–20 окт',role:line,attrs:' data-cup'});}
window.djCupPromo=promo;
function insertPromo(){const main=document.querySelector('#main');if(!main||main.querySelector('[data-cup]')||main.querySelector('.aud-stage'))return;
if(ROLE==='Участник'&&typeof participationTab!=='undefined'&&participationTab!=='Мои участия')return;
const tmp=document.createElement('template');tmp.innerHTML=promo();const card=tmp.content.firstElementChild;
const stack=main.querySelector(':scope>.stack');const intro=main.querySelector(':scope>.role-dashboard-intro');
if(stack){/* участнику сначала то, где нужно его действие */const urgent=ROLE==='Участник'?[...stack.children].filter(c=>c.dataset.urgent==='true'):[];(urgent.length?urgent[urgent.length-1].after(card):stack.prepend(card));}
else if(intro)intro.after(card);}

/* для счётчиков на странице судьи */
window.djCup={judgeWorks:()=>({done:QF.filter(m=>m.scores[MY_J]).length*2,total:8}),judgePending:()=>QF.filter(m=>!m.scores[MY_J]).length};

/* ---------- встраивание в страницу ---------- */
const prevRender=render;
render=function(){
 if(location.hash==='#monitor'){if(typeof parkPanel==='function')parkPanel();document.querySelector('#main').innerHTML=view();document.title='Digital Jazz · Digital Jazz Cup';
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});document.querySelector('#services')?.classList.add('active');return;}
 prevRender();
 if(!location.hash||location.hash==='#tournaments')insertPromo();
};
function rerender(focusSel){const y=scrollY;render();scrollTo(0,y);if(focusSel)requestAnimationFrame(()=>document.querySelector(focusSel)?.focus({preventScroll:true}));}
const toPair=i=>document.getElementById('mon-pair-qf-'+i)?.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});

document.addEventListener('click',e=>{
 if(location.hash!=='#monitor')return;
 const n=e.target.closest('[data-mon-stage]');if(n){state.view=Number(n.dataset.monStage);rerender();const t=document.getElementById('mon-layout');const r=t.getBoundingClientRect();if(r.top<0||r.top>innerHeight*.6)t.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});document.querySelector(`[data-mon-stage="${state.view}"]`)?.focus({preventScroll:true});return;}
 const rm=e.target.closest('[data-mon-remind]');if(rm){const j=rm.dataset.monRemind;if(state.reminded[j]){notify(`Напоминание уже отправлено в ${state.reminded[j]}.`);return;}state.reminded[j]=now_();LS('djCupReminded',state.reminded);rerender(`[data-mon-remind="${j}"]`);notify(`Напоминание ушло: ${j}.`);return;}
 const ask=e.target.closest('[data-mon-ask]');if(ask){state.confirm=ask.dataset.monAsk;rerender('[data-mon-yes]');return;}
 if(e.target.closest('[data-mon-no]')){const k=state.confirm;state.confirm=null;rerender(`[data-mon-ask="${k}"]`);return;}
 const yes=e.target.closest('[data-mon-yes]');if(yes){const k=yes.dataset.monYes;state.confirm=null;
  if(k==='extend'){state.deadline='15 окт, 18:00';LS('djCupDeadline',state.deadline);rerender('[data-mon-undo-extend]');notify('Судейство продлено до 15 окт, 18:00.');}
  if(k==='publish'){state.published=true;rerender();notify('Итоги 1/4 опубликованы.');}return;}
 if(e.target.closest('[data-mon-undo-extend]')){state.deadline='14 окт, 18:00';LS('djCupDeadline',state.deadline);rerender('[data-mon-ask="extend"]');notify('Срок возвращён: 14 окт, 18:00.');return;}
 const g=e.target.closest('[data-mon-rate]');if(g){const i=Number(g.dataset.monRate);state.view=2;state.openRate=i;rerender();toPair(i);requestAnimationFrame(()=>document.querySelector(`#mon-rate-${i} .dj-player-btn`)?.focus({preventScroll:true}));return;}
 const sel=e.target.closest('[data-mon-sel]');if(sel){const [i,k]=sel.dataset.monSel.split(':').map(Number);rateOf(i).sel=k;state.openRate=i;rerender(`[data-mon-form="${i}"] [data-score-title]`);return;}
 const rr=e.target.closest('[data-mon-rerate]');if(rr){const i=Number(rr.dataset.monRerate),m=QF[i],r=rateOf(i);r.works.forEach(w=>{w.submitted=false;w.heard=true;});r.sel=0;m.scores[MY_J]=null;tally(m);state.openRate=i;rerender(`[data-mon-form="${i}"] .score-slider input`);return;}
 const l=e.target.closest('[data-mon-listen]');if(l){const i=Number(l.dataset.monListen);state.view=2;state.openWorks=i;rerender();toPair(i);requestAnimationFrame(()=>document.querySelector(`#mon-works-${i} .dj-player-btn`)?.focus({preventScroll:true}));return;}
 const x=e.target.closest('[data-mon-react]');if(x){const nm=x.dataset.monReact;state.reacted[nm]=!state.reacted[nm];LS('djCupReacted',state.reacted);x.setAttribute('aria-pressed',String(!!state.reacted[nm]));x.textContent='🔥 '+reacts({name:nm});return;}
});
/* раскрытие «Работы пары» / «Оценить пару» переживает перерисовку */
document.addEventListener('toggle',e=>{const d=e.target;if(!(d instanceof HTMLDetailsElement))return;const w=d.id.match(/^mon-(works|rate)-(\d)$/);if(!w)return;const i=Number(w[2]);if(w[1]==='works')state.openWorks=d.open?i:(state.openWorks===i?null:state.openWorks);else state.openRate=d.open?i:(state.openRate===i?null:state.openRate);},true);
document.addEventListener('play',e=>{const f=e.target.closest?.('[data-mon-form]');if(!f)return;const i=Number(f.dataset.monForm),r=rateOf(i);r.works[r.sel].heard=true;},true);
document.addEventListener('input',e=>{const f=e.target.closest('[data-mon-form]');if(!f||!e.target.name)return;const i=Number(f.dataset.monForm),r=rateOf(i);r.works[r.sel].scores[e.target.name]=Number(e.target.value);});
document.addEventListener('change',e=>{const s=e.target.closest('[data-mon-follow]');if(!s)return;state.follow=s.value;LS('djMonitorFollow:'+ROLE,s.value);rerender();});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-mon-form]');if(!f)return;e.preventDefault();e.stopImmediatePropagation();
 const i=Number(f.dataset.monForm),m=QF[i],r=rateOf(i),cur=r.works[r.sel];if(CRITERIA.some(c=>cur.scores[c]===undefined))return;
 cur.submitted=true;const other=r.sel^1;
 if(!r.works[other].submitted){r.sel=other;rerender(`[data-mon-form="${i}"] .dj-player-btn`);document.querySelector(`[data-mon-form="${i}"] .judge-participant`)?.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});notify(`Оценка «${m.works[r.sel^1].p.name}» сохранена. Дальше — ${m.works[other].p.name}.`);return;}
 const sum=k=>CRITERIA.reduce((s,c)=>s+r.works[k].scores[c],0);m.scores[MY_J]=[sum(0),sum(1)];tally(m);state.openRate=null;
 rerender(`#mon-pair-qf-${i} [data-mon-rerate]`);toPair(i);notify(`Оценка пары ${i+1} сохранена: ${m.a.name} ${m.scores[MY_J][0]} — ${m.b.name} ${m.scores[MY_J][1]}. Изменить можно до ${state.deadline}.`);},true);
render();
})();
