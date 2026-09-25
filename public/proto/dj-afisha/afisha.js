'use strict';
/* Афиша зрителя. События, лайн-ап со временем сетов, типы билетов, цены и промокоды берутся из конструктора
   (dj-event-builder/eb.js → window.djEvents). В афише — только анонсированные события; до анонса — «Скоро».
   Покупка демонстрационная: заказ хранится в этом браузере и виден в профиле → «Мои билеты». */
(()=>{
const D=window.djEvents,TODAY=D.today,ALL=D.all(),EV=ALL.filter(e=>!e.draft&&e.name&&e.date&&e.date>=TODAY).sort((a,b)=>a.date-b.date);
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],MONN=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],WD=['вс','пн','вт','ср','чт','пт','сб'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rub=n=>Math.round(n||0).toLocaleString('ru-RU')+' ₽',dm=d=>d.getDate()+' '+MON[d.getMonth()],plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<10||h>=20)?b:c;};
const LS='dj-afisha-orders',RM='dj-afisha-reminders',load=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[];}catch{return [];}},save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
const ARR='<svg class="af-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const ava=(p,c='')=>p.img?`<img class="af-ava ${c}" src="${esc(p.img)}" alt="" loading="lazy">`:`<span class="af-ava af-ava-i ${c}" aria-hidden="true">${esc((p.name||'?')[0])}</span>`;
const artists=e=>e.scenes.flatMap(s=>s.sets);
const left=e=>Math.max(0,e.tickets.reduce((a,t)=>a+t.qty,0)-e.tickets.reduce((a,t)=>a+t.sold,0));
const tleft=t=>Math.max(0,t.qty-t.sold);
const profile=n=>'../digital-jazz-unified/public-profile/index.html?name='+encodeURIComponent(n);
let type='Все',when='all',cart={},code={},toast='';
const main=document.querySelector('#main');

/* ---------- лента ---------- */
const TYPES=[['Все','Все'],['Вечеринка','Вечеринки'],['Концерт','Концерты'],['Фестиваль','Фестивали'],['free','Бесплатно']];
function whenOpts(){const o=[['all','Все даты'],['week','Ближайшие 7 дней']];[...new Set(EV.map(e=>e.date.getFullYear()*12+e.date.getMonth()))].forEach(k=>o.push(['m'+k,MONN[k%12]]));return o;}
const inWhen=e=>when==='all'||(when==='week'?(e.date-TODAY)/864e5<=7:when==='m'+(e.date.getFullYear()*12+e.date.getMonth()));
const inType=e=>type==='Все'||(type==='free'?e.mode==='reg':e.type===type);
function status(e){if(!e.published)return [(e.mode==='reg'?'Регистрация с ':'Продажа с ')+dm(e.announce),'soon'];if(e.mode==='reg')return ['Вход по регистрации',''];const l=left(e),q=e.tickets.reduce((a,t)=>a+t.qty,0);if(!l)return ['Билеты распроданы','hot'];if(l<=q*.15)return [`Осталось ${l} ${plural(l,'билет','билета','билетов')}`,'hot'];return ['Билеты в продаже',''];}
function card(e){const [st,c]=status(e),A=artists(e);
 return `<a class="card af-card" href="#e/${e.id}">${e.cover?`<span class="af-cover"><img src="${esc(e.cover)}" alt="" loading="lazy"><em class="af-st ${c}">${st}</em></span>`:''}<span class="af-card-b">
 <span class="af-date">${dm(e.date)}, ${WD[e.date.getDay()]}</span><b class="af-name">${esc(e.name)}</b><span class="af-meta">${e.start} · ${esc(e.venue?.name||e.city)}</span>${e.desc?`<span class="af-desc">${esc(e.desc)}</span>`:''}
 ${A.length?`<span class="af-faces">${A.slice(0,4).map(p=>ava(p,'sm')).join('')}<span>${A.slice(0,3).map(p=>esc(p.name)).join(', ')}${A.length>3?` и ещё ${A.length-3}`:''}</span></span>`:''}
 <span class="af-foot"><b class="af-price">${e.mode==='reg'?'Бесплатно':e.min?'от '+rub(e.min):'Цена скоро'}</b>${ARR}</span></span></a>`;}
function listing(){const R=load(RM),rows=EV.filter(e=>inType(e)&&inWhen(e)),O=load(LS);
 return `<div class="af-head"><div><h1>Афиша</h1><p class="secondary">${esc(EV[0]?.city||'Москва')} · события Digital Jazz</p></div>${O.length?`<a class="af-my" href="#my">Мои билеты <b>${O.length}</b></a>`:''}</div>
 <div class="af-chips" role="group" aria-label="Тип события">${TYPES.map(([k,l])=>`<button type="button" class="chip" data-af-type="${k}" aria-pressed="${type===k}">${l}</button>`).join('')}</div>
 <div class="af-chips" role="group" aria-label="Когда">${whenOpts().map(([k,l])=>`<button type="button" class="chip" data-af-when="${k}" aria-pressed="${when===k}">${l}</button>`).join('')}</div>
 ${rows.length?`<div class="af-list">${rows.map(card).join('')}</div>`:`<div class="card af-empty"><p class="secondary">По этим фильтрам событий нет.</p><button type="button" class="secondary-button" data-af-reset>Показать все</button></div>`}
 ${battles()}
 `;}

/* ---------- скоро баттлы: турниры прототипа (calendar-events.js), ближайшие по старту ---------- */
const U='../digital-jazz-unified/',BCOVER={0:'djs.png',1:'drum.png',2:'gerls.png',3:'gerls.png',4:'beat-video.png',5:'guinar.png',6:'dance.png',7:'rap.png',cup:'cup-hero.jpg'},BCAT={0:'Диджеинг',1:'Аудиопродакшн',2:'Вокал',3:'Вокал',4:'Аудиопродакшн',5:'Гитара',6:'Танцы',7:'Рэп',cup:'Диджеинг'};
const MSH={янв:0,фев:1,мар:2,апр:3,мая:4,май:4,июн:5,июл:6,авг:7,сен:8,окт:9,ноя:10,дек:11};
const bStart=d=>{const n=+(d.match(/\d+/)||[0])[0],m=(d.match(/[а-я]{3}/)||['окт'])[0];return new Date(2026,MSH[m]??9,n);};
const bHref=x=>U+(x.id==='cup'?'index.html#monitor':x.id===4?'battle.html#tournaments':x.id===2?'voice.html#tournaments':'event.html?id='+x.id+'#tournaments');
function battles(){const B=(window.djCalendarEvents||[]).map(x=>({...x,start:bStart(x.dates)})).filter(x=>x.start>TODAY).sort((a,b)=>a.start-b.start),R=load(RM);if(!B.length)return '';
 return `<section class="af-sec"><div class="af-sec-h"><h2>Скоро баттлы</h2><a class="text-button" href="${U}index.html#tournaments">Все →</a></div><ul class="card af-soon">${B.slice(0,5).map(x=>{const k='b-'+x.id,on=R.includes(k);return `<li><a class="af-soon-a" href="${bHref(x)}"><img src="${U}assets/battle/${BCOVER[x.id]||'djs.png'}" alt=""><span class="af-soon-t"><b>${esc(x.name)}</b><small>${BCAT[x.id]||'Баттл'} · с ${x.start.getDate()} ${MON[x.start.getMonth()].slice(0,3)}</small></span></a><button type="button" class="af-mini${on?' on':''}" data-af-remind="${k}" aria-pressed="${on}">${on?'Напомним':'Напомнить'}</button></li>`;}).join('')}</ul></section>`;}

/* ---------- событие ---------- */
function eventPage(e){const [st,c]=status(e),soldout=e.mode!=='reg'&&!left(e),multi=e.scenes.length>1;
 return `<a class="af-back" href="#">← Афиша</a>
 <header class="af-hero">${e.cover?`<img src="${esc(e.cover)}" alt="">`:''}<div class="af-hero-c"><p class="af-eyebrow">${esc(e.type)} · ${esc(e.city)}</p><h1>${esc(e.name)}</h1><p class="af-date lg">${dm(e.date)}, ${WD[e.date.getDay()]}</p><p class="af-meta">${e.start}–${e.end} · ${esc(e.venue?.name||'')}</p></div></header>
 <div class="af-cta">${!e.published?(()=>{const on=load(RM).includes(e.id);return `<button type="button" class="${on?'secondary-button':'primary'} af-btn" data-af-remind="${e.id}" aria-pressed="${on}">${on?'Напомним об открытии':'Напомнить об открытии '+(e.mode==='reg'?'регистрации':'продаж')}</button>`;})():soldout?`<button type="button" class="secondary-button af-btn" disabled>Билеты распроданы</button>`:`<a class="primary af-btn" href="#t/${e.id}">${e.mode==='reg'?'Зарегистрироваться':'Билеты от '+rub(e.min)}</a>`}<p class="af-st-line ${c}">${st}</p></div>
 ${e.desc?`<p class="af-about">${esc(e.desc)}</p>`:''}
 ${e.scenes.length?`<section class="af-sec"><h2>Лайн-ап</h2>${e.scenes.map(sc=>`${multi?`<p class="af-gt">${esc(sc.n)}</p>`:''}<ul class="card af-lu">${sc.sets.map(p=>`<li><a href="${profile(p.name)}"><span class="af-time">${p.set||'—'}<small>${p.end?'до '+p.end:''}</small></span>${ava(p)}<span class="af-lu-t"><b>${esc(p.name)}</b><small>${esc((p.role||'').split(' · ')[0]||'Артист')}</small></span>${ARR}</a></li>`).join('')}</ul>`).join('')}</section>`:''}
 <section class="af-sec"><h2>${e.mode==='reg'?'Вход':'Билеты'}</h2><ul class="card af-types">${e.tickets.map(t=>{const l=tleft(t);return `<li class="${l?'':'off'}"><span class="af-type-t"><b>${esc(t.n)}</b>${t.desc?`<small>${esc(t.desc)}</small>`:''}${e.mode!=='reg'?`<small class="${!l||l<=t.qty*.15?'eb-hot':''}">${!l?'распродан':l<=t.qty*.15?'осталось '+l:'в продаже'}</small>`:''}</span><b class="af-type-p">${t.price?rub(t.price):'Бесплатно'}</b></li>`;}).join('')}</ul></section>
 <section class="af-sec"><h2>Площадка</h2><div class="card af-place"><b>${esc(e.venue?.name||'Уточняется')}</b><small>${esc(e.city)}${e.venue?.cap?` · до ${e.venue.cap} гостей`:''} · двери в ${e.start}</small></div></section>
 <section class="af-sec"><h2>Организатор</h2><div class="card af-place"><b>Digital Jazz</b><small>Вопросы по билетам — в чате организатора</small></div></section>`;}

/* ---------- выбор билетов ---------- */
const qtyOf=(e,t)=>(cart[e.id]||{})[t.id]||0,count=e=>Object.values(cart[e.id]||{}).reduce((a,b)=>a+b,0);
const sub=e=>e.tickets.reduce((a,t)=>a+qtyOf(e,t)*t.price,0),disc=e=>{const c=code[e.id];return c&&c.pct?Math.round(sub(e)*c.pct/100):0;};
function ticketsPage(e){const n=count(e),c=code[e.id],reg=e.mode==='reg';
 return `<a class="af-back" href="#e/${e.id}">← ${esc(e.name)}</a><h1 class="af-h1">${reg?'Регистрация':'Билеты'}</h1><p class="secondary">${dm(e.date)}, ${WD[e.date.getDay()]} · ${e.start} · ${esc(e.venue?.name||'')}</p>
 <ul class="af-pick">${e.tickets.map(t=>{const l=tleft(t),q=qtyOf(e,t);return `<li class="card${l?'':' off'}"><span class="af-type-t"><b>${esc(t.n)}</b>${t.desc?`<small>${esc(t.desc)}</small>`:''}<small class="${!l||l<=t.qty*.15?'eb-hot':''}">${!l?'распродан':reg?'':l<=t.qty*.15?'осталось '+l:''}</small></span><b class="af-type-p">${t.price?rub(t.price):'Бесплатно'}</b>
 <span class="af-step"><button type="button" data-af-q="${t.id}:-1" aria-label="Меньше: ${esc(t.n)}"${q?'':' disabled'}>−</button><b aria-live="polite">${q}</b><button type="button" data-af-q="${t.id}:1" aria-label="Больше: ${esc(t.n)}"${!l||q>=l||n>=6?' disabled':''}>+</button></span></li>`;}).join('')}</ul>
 <p class="caption">До 6 ${reg?'мест':'билетов'} в одном заказе.</p>
 ${reg?'':`<form class="af-code" data-af-code><label class="field"><span>Промокод</span><span class="af-code-row"><input class="input" name="c" value="${esc(c?.code||'')}" placeholder="Например, JAZZ15" autocapitalize="characters" autocomplete="off"><button class="secondary-button">Применить</button></span></label>${c?`<p class="af-code-m ${c.bad?'eb-hot':c.pct?'ok':''}">${c.bad?'Такого кода нет':c.pct?`${esc(c.code)} — скидка ${c.pct}%`:`Код ${esc(c.code)} принят — скидки нет, но покупка засчитается партнёру`}</p>`:''}</form>`}
 <div class="card af-sum"><div><span>${n} ${plural(n,reg?'место':'билет',reg?'места':'билета',reg?'мест':'билетов')}</span><b>${rub(sub(e))}</b></div>${disc(e)?`<div><span>Скидка ${c.pct}%</span><b>−${rub(disc(e))}</b></div>`:''}<div class="tot"><span>Итого</span><b>${rub(sub(e)-disc(e))}</b></div></div>
 <a class="primary af-btn${n?'':' is-off'}" href="${n?'#c/'+e.id:'#t/'+e.id}" aria-disabled="${!n}">${n?(reg?'Продолжить':'Продолжить · '+rub(sub(e)-disc(e))):'Выбери '+(reg?'количество':'билеты')}</a>`;}

/* ---------- оформление и заказ ---------- */
function checkout(e){const n=count(e),reg=e.mode==='reg',tot=sub(e)-disc(e);if(!n){location.hash='t/'+e.id;return '';}
 return `<a class="af-back" href="#t/${e.id}">← ${reg?'Регистрация':'Билеты'}</a><h1 class="af-h1">Оформление</h1>
 <div class="card af-sum"><p class="af-sum-h"><b>${esc(e.name)}</b><small>${dm(e.date)} · ${e.start} · ${esc(e.venue?.name||'')}</small></p>${e.tickets.filter(t=>qtyOf(e,t)).map(t=>`<div><span>${esc(t.n)} × ${qtyOf(e,t)}</span><b>${rub(qtyOf(e,t)*t.price)}</b></div>`).join('')}${disc(e)?`<div><span>Промокод ${esc(code[e.id].code)}</span><b>−${rub(disc(e))}</b></div>`:''}<div class="tot"><span>Итого</span><b>${rub(tot)}</b></div></div>
 <form class="af-form" data-af-pay="${e.id}"><label class="field"><span>Имя на билете</span><input class="input" name="n" required autocomplete="name"></label><label class="field"><span>Email для билетов</span><input class="input" name="m" type="email" required autocomplete="email"></label>
 <p class="caption">Демо: деньги не списываются, email никуда не отправляется и не сохраняется.</p><p class="af-err eb-hot" role="alert" hidden></p><button class="primary af-btn">${reg?'Зарегистрироваться':tot?'Оплатить '+rub(tot):'Получить билеты'}</button></form>`;}
function qr(seed){let h=0;for(const ch of seed)h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;const N=21,cells=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fin=(x<7&&y<7)||(x>=N-7&&y<7)||(x<7&&y>=N-7);let on;if(fin){const dx=x<7?x:x-(N-7),dy=y<7?y:y-(N-7);on=dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4);}else{h=(Math.imul(h,1103515245)+12345)>>>0;on=(h>>>16)&1;}if(on)cells.push(`<rect class="q" x="${x}" y="${y}" width="1.02" height="1.02"/>`);}return `<svg class="af-qr" viewBox="-1 -1 23 23" role="img" aria-label="QR-код билета (демо)"><rect class="bg" x="-1" y="-1" width="23" height="23"/><g>${cells.join('')}</g></svg>`;}
function orderPage(o){if(!o){location.hash='my';return '';}
 return `<a class="af-back" href="#my">← Мои билеты</a><h1 class="af-h1">${o.reg?'Ты в списке':'Билеты твои'}</h1>
 <div class="card af-ticket"><div class="af-ticket-top">${o.cover?`<img src="${esc(o.cover)}" alt="">`:''}<div><p class="af-date">${esc(o.dateText)}</p><b>${esc(o.name)}</b><small>${esc(o.time)} · ${esc(o.venue)}</small></div></div>
 <div class="af-ticket-cut" aria-hidden="true"></div>${qr(o.id)}<p class="af-ticket-code">${esc(o.id.slice(0,4).toUpperCase())}-${esc(o.id.slice(4,8).toUpperCase())}</p>
 <ul class="af-ticket-items">${o.items.map(i=>`<li><span>${esc(i.n)} × ${i.q}</span><b>${i.price?rub(i.price*i.q):'бесплатно'}</b></li>`).join('')}${o.disc?`<li><span>Промокод ${esc(o.code)}</span><b>−${rub(o.disc)}</b></li>`:''}<li class="tot"><span>${o.reg?'Мест':'Оплачено'}</span><b>${o.reg?o.count:rub(o.total)}</b></li></ul>
 <p class="caption">Демобилет: QR не действителен для входа.</p></div>
 <a class="secondary-button af-btn" href="../digital-jazz-unified/profile/index.html#tickets">Все билеты — в профиле</a><a class="text-button af-link" href="#e/${esc(o.ev)}">К событию</a>`;}
function myPage(){const O=load(LS);
 return `<a class="af-back" href="#">← Афиша</a><h1 class="af-h1">Мои билеты</h1>${O.length?`<ul class="card af-soon af-mine">${O.map(o=>`<li><a href="#o/${o.id}">${o.cover?`<img src="${esc(o.cover)}" alt="">`:'<span></span>'}<span class="af-soon-t"><b>${esc(o.name)}</b><small>${esc(o.dateText)} · ${o.count} ${plural(o.count,o.reg?'место':'билет',o.reg?'места':'билета',o.reg?'мест':'билетов')}</small></span>${ARR}</a></li>`).join('')}</ul><p class="caption">Эти же билеты — в профиле, в карточке «Мои билеты».</p>`:`<div class="card af-empty"><p class="secondary">Билетов пока нет.</p><a class="primary af-btn" href="#">В афишу</a></div>`}`;}

/* ---------- маршруты ---------- */
function render(){const [r,id]=location.hash.slice(1).split('/'),e=ALL.find(x=>x.id===id&&x.published),ev=EV.find(x=>x.id===id);let h;
 if(r==='e'&&ev)h=eventPage(ev);else if(r==='t'&&e)h=ticketsPage(e);else if(r==='c'&&e)h=checkout(e);else if(r==='o')h=orderPage(load(LS).find(o=>o.id===id));else if(r==='my')h=myPage();
 else if(['e','t','c'].includes(r)&&id){const s=ALL.find(x=>x.id===id);h=`<a class="af-back" href="#">← Афиша</a><div class="card af-empty"><p class="secondary">${s&&s.announce&&!s.draft?`${s.mode==='reg'?'Регистрация':'Продажа билетов'} на «${esc(s.name)}» откроется ${dm(s.announce)}.`:'Такого события в афише нет.'}</p><a class="primary af-btn" href="${s&&!s.draft?'#e/'+s.id:'#'}">${s&&!s.draft?'К событию':'В афишу'}</a></div>`;}
 else h=listing();
 if(h==='')return;main.innerHTML=`<div class="af">${h}</div>${toast?`<div class="eb-toast af-toast" role="status">${esc(toast)}</div>`:''}`;}
const say=t=>{toast=t;render();clearTimeout(say.t);say.t=setTimeout(()=>{toast='';render();},2600);};
addEventListener('hashchange',()=>{render();scrollTo(0,0);});
document.addEventListener('click',ev=>{const b=ev.target.closest('button,a');if(!b)return;const d=b.dataset;
 if(d.afType){type=d.afType;render();return;}
 if(d.afWhen){when=d.afWhen;render();return;}
 if('afReset' in d){type='Все';when='all';render();return;}
 if(d.afRemind){let R=load(RM);const on=R.includes(d.afRemind);R=on?R.filter(x=>x!==d.afRemind):[...R,d.afRemind];save(RM,R);const s=ALL.find(x=>x.id===d.afRemind),bt=(window.djCalendarEvents||[]).find(x=>'b-'+x.id===d.afRemind);say(on?'Напоминание снято':s?`Напомним ${dm(s.announce)}, когда откроется ${s.mode==='reg'?'регистрация':'продажа'}`:`Напомним о старте «${bt?.name||'баттла'}» ${bt?dm(bStart(bt.dates)):''}`);return;}
 if(d.afQ){const [tid,dl]=d.afQ.split(':'),e=ALL.find(x=>x.id===location.hash.split('/')[1]);cart[e.id]=cart[e.id]||{};cart[e.id][tid]=Math.max(0,(cart[e.id][tid]||0)+ +dl);const y=scrollY;render();scrollTo(0,y);return;}
 if(b.getAttribute('aria-disabled')==='true'){ev.preventDefault();return;}});
document.addEventListener('submit',ev=>{const f=ev.target;
 if(f.matches('[data-af-code]')){ev.preventDefault();const e=ALL.find(x=>x.id===location.hash.split('/')[1]),v=new FormData(f).get('c').trim().toUpperCase();if(!v){delete code[e.id];render();return;}const m=e.codes.find(c=>c.code.toUpperCase()===v);code[e.id]=m?{code:m.code,pct:m.pct}:e.track.map(x=>x.toUpperCase()).includes(v)?{code:v,pct:0}:{code:v,bad:true};const y=scrollY;render();scrollTo(0,y);return;}
 if(f.matches('[data-af-pay]')){ev.preventDefault();const e=ALL.find(x=>x.id===f.dataset.afPay),c=code[e.id];
  const o={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()).replace(/-/g,''),ev:e.id,name:e.name,cover:e.cover,dateText:`${dm(e.date)}, ${WD[e.date.getDay()]}`,iso:e.date.toISOString(),time:e.start,venue:e.venue?.name||e.city,reg:e.mode==='reg',
   items:e.tickets.filter(t=>qtyOf(e,t)).map(t=>({n:t.n,q:qtyOf(e,t),price:t.price})),count:count(e),disc:c&&!c.bad?disc(e):0,code:c&&!c.bad?c.code:'',total:sub(e)-(c&&!c.bad?disc(e):0)};
  if(!save(LS,[o,...load(LS)])){const er=f.querySelector('.af-err');er.hidden=false;er.textContent='Не удалось сохранить билет в этом браузере. Проверь, не включён ли приватный режим.';return;}
  delete cart[e.id];delete code[e.id];location.hash='o/'+o.id;}});
render();
})();
