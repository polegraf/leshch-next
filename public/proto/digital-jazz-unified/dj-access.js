'use strict';
/* Вход и профили Digital Jazz — один аккаунт, несколько профилей.
   Вход спрашивается на действии (купить, напомнить, собрать событие) и возвращает к нему.
   Способы: Яндекс ID (демо-имитация, окно Яндекса не открывается) и код на email (тестовый код 123456).
   Личный профиль создаётся сам из имени; профессиональные — из меню аватарки: артист, организатор, компания, площадка.
   Профессии и типы бизнеса — из справочника поиска (search.js). Данные — только в этом браузере. */
(()=>{
const BASE=new URL('.',document.currentScript.src),url=p=>new URL(p,BASE).href,KEY='dj-account';
/* загрузчик: неоновый знак Digital Jazz, небольшой, на чёрном — один раз за сессию, пока грузится страница */
(()=>{let seen=false;try{seen=sessionStorage.getItem('dj-loader')==='1';}catch{}if(seen)return;
 const calm=matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now(),el=document.createElement('div');el.className='dja-loader';el.setAttribute('role','status');el.setAttribute('aria-label','Загрузка');
 el.innerHTML=calm?`<img src="${url('assets/loader-poster.png')}" alt="">`:`<video autoplay muted loop playsinline preload="auto" poster="${url('assets/loader-poster.png')}"><source src="${url('assets/loader.mp4')}" type="video/mp4"></video>`;
 document.body.append(el);
 /* держим загрузчик минимум один полный цикл ролика (rotter ≈ 5 с); отметку «видел» ставим только после показа — иначе редирект с index.html съедал загрузчик */
 const v=el.querySelector('video');let cycle=calm?1200:5100,loaded=document.readyState==='complete',gone=false;
 if(v)v.addEventListener('loadedmetadata',()=>{if(isFinite(v.duration)&&v.duration>0)cycle=v.duration*1000+100;},{once:true});
 const hide=force=>{if(gone||(!loaded&&!force))return;const wait=force?0:Math.max(0,cycle-(performance.now()-t0));setTimeout(()=>{if(gone)return;gone=true;try{sessionStorage.setItem('dj-loader','1');}catch{}el.classList.add('out');setTimeout(()=>el.remove(),400);},wait);};
 if(loaded)hide();else addEventListener('load',()=>{loaded=true;hide();},{once:true});setTimeout(()=>hide(true),9000);})();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
/* справочник — копия из search.js, чтобы поиск и профили говорили одними словами */
const ROLES={'Диджей':['Хип-хоп','Электроника','Поп'],'Вокалист':['Поп','Джаз','Рок'],'Битмейкер':['Хип-хоп','Электроника'],'Композитор':['Поп','Классика','Кино'],'Ведущий':['Ведение мероприятий','Комик / Стендап','Аниматор'],'Танцор':['Хореография','Перформанс'],'Модель':['Подиум','Фотосъёмка'],'Блогер':['Видео','Стриминг'],'Звукорежиссёр':['Запись','Сведение','Мастеринг'],'Дизайнер':['Графический дизайн','Моушн-дизайн']};
const BIZ=['Студии','Репбазы','Лейблы','Агентства','Продакшн','Магазины','Школы','Прокат','Охрана','Клининг','Блог-агентства'];
const TYPES=[['artist','Артист / специалист','Портфолио, райдер, предложения'],['org','Организатор','События, лайн-ап, команда'],['company','Компания','Услуги, прокат, подрядчик событий'],['venue','Площадка','Вместимость, даты, техника']];
const TNAME=Object.fromEntries(TYPES.map(t=>[t[0],t[1]]));
const TRIO=()=>({signed:true,via:'yandex',email:'dmitry@yandex.ru',active:'me',profiles:[{id:'me',type:'personal',name:'Дмитрий'},{id:'nox',type:'artist',name:'Нокс',roles:['Диджей'],genres:['Электроника'],city:'Москва'},{id:'org',type:'org',name:'Jazz Promo',city:'Москва'}]});
const DEMO_ORDER={id:'demo0yeti0000',ev:'yeti',name:'Yeti Disco',cover:'../dj-event-builder/covers/yeti-djs.jpg',dateText:'26 сентября, сб',iso:new Date(2026,8,26).toISOString(),time:'23:00',venue:'16 Тонн',reg:false,items:[{n:'Стандарт',q:2,price:1800}],count:2,disc:0,code:'',total:3600};
let S=load(),sheet=null,after=null;
/* по умолчанию прототип открывается вошедшим пользователем с тремя профилями: зритель, артист, промоутер.
   «Начать с нуля» в демо-меню переключает в гостя (флаг dj-guest). */
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.profiles))return v;if(localStorage.getItem('dj-guest')!=='1'){const t=TRIO();localStorage.setItem(KEY,JSON.stringify(t));if(!localStorage.getItem('dj-afisha-orders'))localStorage.setItem('dj-afisha-orders',JSON.stringify([DEMO_ORDER]));return t;}}catch{}return {signed:false,profiles:[],active:null};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));if(S.signed)localStorage.removeItem('dj-guest');}catch{toast('Не удалось сохранить в браузере — вход действует до перезагрузки');}}
const active=()=>S.profiles.find(p=>p.id===S.active)||S.profiles[0]||null;
const personal=()=>S.profiles.find(p=>p.type==='personal');
/* дом: зритель — афиша; артист, организатор, компания, площадка — профиль с монитором */
const home=()=>{const a=S.signed&&active();return a&&a.type!=='personal'?url('profile/index.html'):url('../dj-afisha/index.html');};
/* index.html без хэша — не лента турниров, а дом: гость → старт, зритель → афиша, профессионал → профиль. Турниры — index.html#tournaments */
if(new URL('index.html',BASE).pathname===location.pathname.replace(/\/$/,'/index.html')&&!location.hash){location.replace(S.signed?home():url('../dj-start/index.html'));return;}

/* ---------- лист ---------- */
function mount(){let r=document.querySelector('#dja-root');if(!r){r=document.createElement('div');r.id='dja-root';document.body.append(r);}return r;}
function open(s){sheet=s;draw();setTimeout(()=>mount().querySelector('.dja-sheet input:not([type=hidden]),.dja-sheet .dja-first')?.focus?.(),30);}
function close(){const relock=lockWait;sheet=null;after=null;draw();if(relock){lockWait=false;S.signed=true;lock();}}
function toast(t){const r=mount();let n=r.querySelector('.dja-toast');if(!n){n=document.createElement('div');n.className='dja-toast';n.setAttribute('role','status');r.append(n);}n.textContent=t;n.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{n.hidden=true;},2600);}
function done(){const cb=after;sheet=null;after=null;draw();chip();if(cb)cb(active());}
const chipsHTML=(name,opts,sel,multi)=>`<div class="dja-chips">${opts.map(o=>`<button type="button" class="dja-chip" data-dja-pick="${name}" data-v="${esc(o)}" data-multi="${multi?1:''}" aria-pressed="${multi?(sel||[]).includes(o):sel===o}">${esc(o)}</button>`).join('')}</div>`;
function body(){const s=sheet;
 if(s.v==='auth')return `<p class="dja-cap">Вход в Digital Jazz</p><h2 id="dja-t">${esc(s.reason||'Войди, чтобы продолжить')}</h2><p class="dja-sub">Один аккаунт — все твои профили: личный, артиста, организатора, площадки.</p>
  <button type="button" class="dja-ya dja-first" data-dja="yandex">Войти с Яндекс ID</button>
  <button type="button" class="secondary-button dja-btn" data-dja="email">Войти по email</button>
  <p class="dja-note">Без пароля. Продолжая, соглашаешься с правилами сервиса. Демо: данные остаются в этом браузере.</p>`;
 if(s.v==='yandex-wait')return `<p class="dja-cap">Яндекс ID</p><h2 id="dja-t">Подключаем Яндекс ID…</h2><div class="dja-spin" aria-hidden="true"></div><p class="dja-note">В рабочей версии здесь откроется окно Яндекса для подтверждения. В демо оно не открывается.</p>`;
 if(s.v==='yandex-ok')return `<p class="dja-cap">Яндекс ID</p><h2 id="dja-t">Яндекс ID передаст нам</h2><ul class="dja-kv"><li><span>Имя</span><input class="input" data-dja-name value="${esc(s.name)}" aria-label="Имя"></li><li><span>Email</span><b>${esc(s.email)}</b></li><li><span>Аватар</span><b>из Яндекс ID</b></li></ul><p class="dja-note">Имя можно поправить. Телефон и остальные данные не запрашиваем.</p><button type="button" class="primary dja-btn" data-dja="yandex-go">Продолжить</button>`;
 if(s.v==='email')return `<p class="dja-cap">Вход по email</p><h2 id="dja-t">Пришлём код на почту</h2><form data-dja-form="email"><label class="field"><span>Email</span><input class="input" name="email" type="email" required autocomplete="email" value="${esc(s.email||'')}"></label><button class="primary dja-btn">Получить код</button></form><button type="button" class="text-button dja-link" data-dja="back-auth">← Другие способы</button>`;
 if(s.v==='code')return `<p class="dja-cap">Вход по email</p><h2 id="dja-t">Код из письма</h2><p class="dja-sub">Отправили на ${esc(s.email)}. Демо: код <b>123456</b>.</p><form data-dja-form="code"><label class="field"><span>Код</span><input class="input dja-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label>${s.err?`<p class="dja-err" role="alert">${esc(s.err)}</p>`:''}${S.profiles.length?'':`<label class="field"><span>Как тебя зовут</span><input class="input" name="name" required autocomplete="given-name" maxlength="40" value="${esc(s.name||'')}"></label>`}<button class="primary dja-btn">Войти</button></form><button type="button" class="text-button dja-link" data-dja="email">Изменить email</button>`;
 if(s.v==='demo')return demoBody();
 if(s.v==='del'){const p=S.profiles.find(x=>x.id===s.id),I=impact(p),ok=(s.typed||'').trim().toLowerCase()===p.name.trim().toLowerCase();return `<p class="dja-cap dja-cap-hot">Удаление профиля</p><h2 id="dja-t">Удалить «${esc(p.name)}»?</h2>
  <div class="dja-warn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.2v.1"/></svg><div><b>Это заметят другие.</b><ul>${I.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>
  <p class="dja-sub">Профиль можно восстановить в течение 30 дней в настройках аккаунта. Личный профиль и билеты останутся.</p>
  <label class="field"><span>Чтобы подтвердить, введи название профиля</span><input class="input" data-dja-typed value="${esc(s.typed||'')}" placeholder="${esc(p.name)}" autocomplete="off"></label>
  <button type="button" class="dja-danger dja-btn" data-dja="del-go"${ok?'':' disabled'}>Удалить профиль</button><button type="button" class="text-button dja-link" data-dja="profiles">Отмена</button>`;}
 if(s.v==='profiles'){const a=active();return `<p class="dja-cap">${S.via==='yandex'?'Вход через Яндекс ID':'Вход по email'} · ${esc(S.email||'')}</p><h2 id="dja-t">Твои профили</h2>
  <ul class="dja-list">${S.profiles.map(p=>`<li><button type="button" class="dja-prof${p.id===a?.id?' on':''}" data-dja-use="${p.id}" aria-pressed="${p.id===a?.id}"><span class="dja-ava">${esc((p.name||'?')[0])}</span><span class="dja-prof-t"><b>${esc(p.name)}</b><small>${p.type==='personal'?'Личный · билеты, друзья, интересы':esc(TNAME[p.type])+(p.roles?.length?' · '+esc(p.roles.join(', ')):'')+(p.biz?' · '+esc(p.biz):'')+(p.cap?' · до '+p.cap+' гостей':'')}</small></span>${p.id===a?.id?'<svg class="dja-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>':''}</button>${p.type==='personal'?'':`<button type="button" class="dja-del" data-dja-del="${p.id}" aria-label="Удалить профиль ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg></button>`}</li>`).join('')}</ul><p class="dja-note">Личный профиль — это твой аккаунт, его не удалить отсюда. Профессиональные — корзина справа.</p>
  <a class="primary dja-btn" href="${home()}">${a?.type==='personal'?'Открыть афишу':'Открыть профиль '+esc(a?.name||'')}</a>
  <button type="button" class="secondary-button dja-btn" data-dja="create">+ Новый профиль</button>
  <button type="button" class="text-button dja-link" data-dja="logout">Выйти</button>`;}
 if(s.v==='create'){const t=s.type||'artist',roles=s.roles||[],gen=[...new Set(roles.flatMap(r=>ROLES[r]||[]))];
  return `<p class="dja-cap">Новый профиль · ${esc(S.email||'')}</p><h2 id="dja-t">${esc(s.title||'Профессиональный профиль')}</h2><p class="dja-sub">Отдельное имя или бренд. Переключаться — по аватарке внизу.</p>
  <form data-dja-form="create"><fieldset class="dja-fs"><legend>Кто ты здесь</legend><div class="dja-types">${TYPES.map(([k,l,d])=>`<button type="button" class="dja-type" data-dja-type="${k}" aria-pressed="${t===k}"><b>${l}</b><small>${d}</small></button>`).join('')}</div></fieldset>
  <label class="field"><span>${t==='artist'?'Сценическое имя':t==='venue'?'Название площадки':t==='company'?'Название компании':'Имя или название'}</span><input class="input" name="name" required maxlength="60" value="${esc(s.name||'')}"></label>
  ${t==='artist'?`<fieldset class="dja-fs"><legend>Профессия · можно несколько</legend>${chipsHTML('roles',Object.keys(ROLES),roles,true)}</fieldset>${gen.length?`<fieldset class="dja-fs"><legend>Жанр / специальность</legend>${chipsHTML('genres',gen,s.genres||[],true)}</fieldset>`:''}`:''}
  ${t==='company'?`<fieldset class="dja-fs"><legend>Тип бизнеса</legend>${chipsHTML('biz',BIZ,s.biz||'',false)}</fieldset>`:''}
  ${t==='venue'?`<label class="field"><span>Вместимость, гостей</span><input class="input" name="cap" inputmode="numeric" value="${esc(s.cap||'')}" placeholder="Например, 350"></label><p class="dja-note">По вместимости и занятым датам площадку подбирает конструктор событий.</p>`:''}
  <label class="field"><span>Город</span><input class="input" name="city" value="${esc(s.city||'Москва')}"></label>
  ${s.err?`<p class="dja-err" role="alert">${esc(s.err)}</p>`:''}<button class="primary dja-btn">Создать профиль</button></form>
  ${t==='company'||t==='venue'?'<p class="dja-note">Команду с правами можно будет пригласить из профиля.</p>':''}`;}
 return '';}
function draw(){const r=mount();r.querySelector('.dja-scrim')?.remove();r.querySelector('.dja-sheet')?.remove();if(!sheet)return;
 r.insertAdjacentHTML('afterbegin',`<div class="dja-scrim" data-dja="close"></div><section class="dja-sheet" role="dialog" aria-modal="true" aria-labelledby="dja-t"><div class="dja-grab" aria-hidden="true"></div><button type="button" class="dja-x" data-dja="close" aria-label="Закрыть">×</button>${body()}</section>`);}

/* ---------- вход ---------- */
function impact(p){const D=window.djEvents,L=[],mine=n=>String(n||'').toLowerCase()===p.name.toLowerCase();
 if(D){const T=D.today,EV=D.all().filter(e=>e.name);
  if(p.type==='org'){const live=EV.filter(e=>!e.fresh&&e.date&&e.date>=T),sold=live.reduce((a,e)=>a+(e.mode==='sale'?e.sold:0),0);if(live.length)L.push(`${live.length} ${live.length===1?'событие':live.length<5?'события':'событий'} в работе — их нужно передать другому организатору или отменить`);if(sold)L.push(`${sold} проданных билетов — зрителям уйдут возвраты`);const dr=EV.filter(e=>e.fresh).length;if(dr)L.push(`черновики (${dr}) удалятся`);}
  if(p.type==='artist'){const G=EV.flatMap(e=>e.people.filter(x=>x.group==='artist'&&mine(x.name)&&x.stage>=0&&e.date&&e.date>=T).map(x=>[e,x]));const c=G.filter(([e,x])=>x.stage>=1),i=G.filter(([e,x])=>x.stage===0);if(c.length)L.push(`подтверждённые сеты: ${c.map(([e])=>e.name).join(', ')} — организаторы получат отказ`);if(i.length)L.push(`приглашения (${i.length}) закроются без ответа`);}
  if(p.type==='venue'||p.type==='company'){const B=EV.flatMap(e=>e.people.filter(x=>(x.group==='venue'||x.group==='vendor')&&mine(x.name)&&x.stage>=0).map(x=>e.name));if(B.length)L.push(`брони и договоры: ${B.join(', ')}`);}}
 L.push(p.type==='artist'?'портфолио, райдер и отзывы пропадут из поиска':'страница профиля пропадёт из поиска и афиши');
 return L;}
function signIn(via,email,name){unlocked();S.signed=true;S.via=via;S.email=email;if(!personal()){const p={id:uid(),type:'personal',name:name||email.split('@')[0]};S.profiles.unshift(p);S.active=p.id;}save();}
function createProfile(f){const t=f.type||'artist',p={id:uid(),type:t,name:f.name.trim(),city:(f.city||'').trim()};if(t==='artist'){p.roles=f.roles||[];p.genres=f.genres||[];}if(t==='company')p.biz=f.biz||'';if(t==='venue')p.cap=+String(f.cap||'').replace(/\D/g,'')||0;S.profiles.push(p);S.active=p.id;save();return p;}

/* ---------- отметка «действуешь от имени» в хидере ---------- */
const PORTRAIT={'Нокс':'a','Вольт':'b','Лофи':'c','Грув':'d','Рифф':'e','Эхо':'f','Хэт':'g','Сэмпл':'h'};
const TLABEL={personal:'зритель',artist:'артист',org:'промоутер',company:'компания',venue:'площадка'};
const avaSrc=p=>p.type==='personal'?url('assets/nav.jpg'):PORTRAIT[p.name]?url('assets/portraits/participant-'+PORTRAIT[p.name]+'.png'):null;
const avaHTML=(p,cls)=>{const s=avaSrc(p);return s?`<img class="${cls}" src="${s}" alt="">`:`<span class="${cls} dja-ini">${esc((p.name||'?')[0])}</span>`;};
function chip(){document.querySelectorAll('.dja-as').forEach(n=>n.remove());const a=active();if(!S.signed||!a||a.type==='personal')return;
 /* от чьего имени — видно на аватарке в нижней навигации: портрет или буква активного профиля */
 document.querySelectorAll('.nav-avatar').forEach(av=>{av.insertAdjacentHTML('beforeend',avaHTML(a,'dja-as'));av.setAttribute('aria-label','Профиль: '+a.name+' · сменить');});}
/* тап по аватарке — над ней выезжают аватарки других профилей с подписями, как меню сервисов */
function fan(av){const old=document.querySelector('.dja-fan');if(old){closeFan();return;}const a=active(),others=S.profiles.filter(p=>p.id!==a?.id);
 const r=av.getBoundingClientRect(),w=document.createElement('div');w.className='dja-fan';w.style.left=Math.round(r.left)+'px';w.style.bottom=Math.round(innerHeight-r.top+12)+'px';
 w.innerHTML=`<a class="dja-fan-all dja-fan-me" href="${url('profile/index.html')}">Мой профиль · ${esc(a?.name||'')}</a>`+others.map(p=>`<button type="button" class="dja-fan-row" data-dja-use="${p.id}"><span class="dja-fan-c" style="width:${Math.round(r.width*.86)}px;height:${Math.round(r.width*.86)}px">${avaHTML(p,'dja-fan-img')}</span><span class="dja-fan-l"><b>${esc(p.name)}</b><small>${TLABEL[p.type]||''}</small></span></button>`).join('')+`<button type="button" class="dja-fan-all" data-dja="profiles">Все профили</button>`;
 const sc=document.createElement('div');sc.className='dja-fan-scrim';sc.addEventListener('click',closeFan);document.body.append(sc,w);av.classList.add('dja-open');requestAnimationFrame(()=>{sc.classList.add('open');w.classList.add('open');});}
function closeFan(){document.querySelectorAll('.dja-fan,.dja-fan-scrim').forEach(n=>n.remove());document.querySelectorAll('.nav-avatar.dja-open').forEach(n=>n.classList.remove('dja-open'));}

/* ---------- события ---------- */
document.addEventListener('click',e=>{const t=e.target;
 const pick=t.closest('[data-dja-pick]');if(pick){const k=pick.dataset.djaPick,v=pick.dataset.v;syncForm();if(pick.dataset.multi){const a=sheet[k]||[];sheet[k]=a.includes(v)?a.filter(x=>x!==v):[...a,v];if(k==='roles'){const g=new Set((sheet.roles||[]).flatMap(r=>ROLES[r]||[]));sheet.genres=(sheet.genres||[]).filter(x=>g.has(x));}}else sheet[k]=sheet[k]===v?'':v;draw();return;}
 const ty=t.closest('[data-dja-type]');if(ty){syncForm();sheet.type=ty.dataset.djaType;draw();return;}
 const dl=t.closest('[data-dja-del]');if(dl){open({v:'del',id:dl.dataset.djaDel,typed:''});return;}
 const use=t.closest('[data-dja-use]');if(use){closeFan();const was=S.active;S.active=use.dataset.djaUse;save();close();chip();if(was!==S.active){location.href=home();return;}toast('Ты действуешь как '+active().name);return;}
 const b=t.closest('[data-dja]');if(!b)return;const a=b.dataset.dja;
 if(a==='close'){close();return;}
 if(a==='yandex'){open({...sheet,v:'yandex-wait'});setTimeout(()=>{if(sheet&&sheet.v==='yandex-wait')open({...sheet,v:'yandex-ok',name:'Дмитрий',email:'dmitry@yandex.ru'});},900);return;}
 if(a==='yandex-go'){const n=(mount().querySelector('[data-dja-name]')?.value||'').trim()||'Друг';signIn('yandex',sheet.email,n);next();return;}
 if(a==='email'){open({...sheet,v:'email',err:''});return;}
 if(a==='back-auth'){open({...sheet,v:'auth'});return;}
 if(a==='profiles'){closeFan();if(!S.signed){require('Войди, чтобы у тебя был профиль',()=>open({v:'profiles'}));return;}open({v:'profiles'});return;}
 if(a==='create'){open({v:'create',type:'artist'});return;}
 if(a==='del-go'){const p=S.profiles.find(x=>x.id===sheet.id),was=S.active===p.id,idx=S.profiles.indexOf(p);S.profiles=S.profiles.filter(x=>x!==p);if(was)S.active=(personal()||S.profiles[0]).id;save();close();closeFan();chip();
  const n=mount();let t=n.querySelector('.dja-toast');if(!t){t=document.createElement('div');t.className='dja-toast';t.setAttribute('role','status');n.append(t);}t.hidden=false;t.innerHTML=`Профиль «${esc(p.name)}» удалён <button type="button" class="dja-undo">Вернуть</button>`;clearTimeout(toast.t);
  t.querySelector('.dja-undo').onclick=()=>{clearTimeout(toast.t);S.profiles.splice(idx,0,p);if(was)S.active=p.id;save();t.hidden=true;chip();toast(`«${p.name}» восстановлен`);document.dispatchEvent(new CustomEvent('dj-access'));};
  toast.t=setTimeout(()=>{t.hidden=true;if(was)location.href=home();},5000);document.dispatchEvent(new CustomEvent('dj-access'));return;}
 if(a==='logout'){S={signed:false,profiles:[],active:null};save();close();chip();toast('Ты вышел из аккаунта');document.dispatchEvent(new CustomEvent('dj-access'));return;}});
function syncForm(){const f=mount().querySelector('[data-dja-form="create"]');if(!f||!sheet)return;const d=new FormData(f);['name','city','cap'].forEach(k=>{if(d.has(k))sheet[k]=d.get(k);});}
function next(){if(sheet&&sheet.need&&!sheet.need.includes(active()?.type)){const want=sheet.need.includes('org')?'org':sheet.need[0],match=S.profiles.find(p=>sheet.need.includes(p.type));if(match){S.active=match.id;save();done();return;}open({...sheet,v:'create',type:want,name:'',city:'Москва',err:'',title:sheet.needTitle||'Нужен профиль организатора'});return;}done();}
document.addEventListener('submit',e=>{const f=e.target.closest('[data-dja-form]');if(!f)return;e.preventDefault();const d=new FormData(f),k=f.dataset.djaForm;
 if(k==='email'){open({...sheet,v:'code',email:d.get('email').trim(),err:''});return;}
 if(k==='code'){if(d.get('code')!=='123456'){sheet.name=d.get('name')||sheet.name;sheet.err='Неверный код. В демо — 123456';draw();return;}signIn('email',sheet.email,(d.get('name')||'').trim());next();return;}
 if(k==='create'){syncForm();if(!(sheet.name||'').trim()){sheet.err='Нужно имя или название';draw();return;}if(sheet.type==='artist'&&!(sheet.roles||[]).length){sheet.err='Отметь хотя бы одну профессию';draw();return;}const p=createProfile(sheet);toast(`Профиль «${p.name}» создан — ты действуешь от его имени`);document.dispatchEvent(new CustomEvent('dj-access'));if(!after){sheet=null;draw();location.href=home();return;}done();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet)close();});
document.addEventListener('input',e=>{if(!e.target.matches('[data-dja-typed]')||!sheet)return;sheet.typed=e.target.value;const p=S.profiles.find(x=>x.id===sheet.id);const b=mount().querySelector('[data-dja="del-go"]');if(b&&p)b.disabled=sheet.typed.trim().toLowerCase()!==p.name.trim().toLowerCase();});
/* аватарка в нижней навигации — меню профилей (перехватываем раньше общих переходов прототипа) */
/* клик по лого: один полный цикл загрузчика, потом переход на главную */
function loaderThen(go){if(document.querySelector('.dja-loader'))return;const calm=matchMedia('(prefers-reduced-motion: reduce)').matches,el=document.createElement('div');el.className='dja-loader';el.setAttribute('role','status');el.setAttribute('aria-label','Загрузка');
 el.innerHTML=calm?`<img src="${url('assets/loader-poster.png')}" alt="">`:`<video autoplay muted playsinline preload="auto" poster="${url('assets/loader-poster.png')}"><source src="${url('assets/loader.mp4')}" type="video/mp4"></video>`;
 el.style.opacity='0';document.body.append(el);requestAnimationFrame(()=>{el.style.opacity='';});
 try{sessionStorage.setItem('dj-loader','1');}catch{}
 let left=false;const leave=()=>{if(left)return;left=true;go();};const v=el.querySelector('video');
 if(v){v.addEventListener('ended',leave,{once:true});v.addEventListener('error',()=>setTimeout(leave,600),{once:true});setTimeout(leave,9000);}else setTimeout(leave,1200);}
addEventListener('click',e=>{const lg=e.target.closest('.topbar-logo');if(!lg)return;e.preventDefault();e.stopImmediatePropagation();const to=home();loaderThen(()=>{location.href=to;});},true);
addEventListener('click',e=>{const av=e.target.closest('.nav-avatar');if(!av)return;e.preventDefault();e.stopImmediatePropagation();if(S.signed)fan(av);else require('Войди, чтобы у тебя был профиль',()=>open({v:'profiles'}));},true);

/* ---------- демо: сброс, готовые аккаунты, сценарии показа ---------- */
const P0={id:'me',type:'personal',name:'Дмитрий'};
const PERSONAS=[['trio','Дмитрий · три профиля','Зритель, артист Нокс и промоутер Jazz Promo — как по умолчанию',TRIO().profiles,'me'],
 ['viewer','Зритель · Дмитрий','Личный профиль, один купленный билет',[P0],'me'],
 ['org','Организатор · Jazz Promo','5 событий в мониторе, дела, продажи',[P0,{id:'org',type:'org',name:'Jazz Promo',city:'Москва'}],'org'],
 ['artist','Артист · Нокс','Сеты, оплата, турнир Digital Jazz Cup',[P0,{id:'nox',type:'artist',name:'Нокс',roles:['Диджей'],genres:['Электроника'],city:'Москва'}],'nox'],
 ['riff','Артист · Рифф','Приглашение с гонораром — принять или отказаться',[P0,{id:'riff',type:'artist',name:'Рифф',roles:['Вокалист'],genres:['Рок'],city:'Москва'}],'riff'],
 ['venue','Площадка · Цех 01','Бронь на 24 октября, договор на подписи',[P0,{id:'ceh',type:'venue',name:'Цех 01',cap:350,city:'Москва'}],'ceh'],
 ['vendor','Подрядчик · Звуковой склад','Запросы от событий и договоры',[P0,{id:'snd',type:'company',name:'Звуковой склад',biz:'Прокат',city:'Москва'}],'snd']];
const SCEN=[['s-view','Зритель покупает билет','Старт → афиша → событие → «Билеты» → вход с Яндекс ID → оплата → билет → «Мои билеты» в профиле','start','Нажми «Смотреть афишу», выбери событие и купи билет — вход спросим на оплате'],
 ['s-org','Организатор собирает событие','Старт → «Собрать событие» → вход по email (код 123456) → профиль организатора → монитор → «Все события и новое»','start','Нажми «Собрать событие». Код из письма в демо — 123456'],
 ['s-art','Артист заводит профиль','Старт → «Показать себя» → Яндекс ID → профиль артиста «Нокс» (Диджей) → монитор с сетами и турниром','start','Нажми «Показать себя…». Назови профиль «Нокс» — в мониторе появятся его сеты'],
 ['s-multi','Несколько профилей','Зритель → аватарка → «+ Новый профиль» → площадка «Цех 01» → дом меняется на профиль с бронями → обратно на личный','multi','Нажми аватарку внизу → «+ Новый профиль» → Площадка, имя «Цех 01»']];
function wipe(){['dj-account','dj-afisha-orders','dj-afisha-reminders'].forEach(k=>{try{localStorage.removeItem(k);}catch{}});try{localStorage.setItem('dj-guest','1');}catch{}try{sessionStorage.removeItem('dj-loader');}catch{}S={signed:false,profiles:[],active:null};}
function seed(k){const p=PERSONAS.find(x=>x[0]===k);wipe();S={signed:true,via:'yandex',email:'dmitry@yandex.ru',profiles:JSON.parse(JSON.stringify(p[3])),active:p[4]};save();
 if(k==='viewer'||k==='trio'){try{localStorage.setItem('dj-afisha-orders',JSON.stringify([{id:'demo0yeti0000',ev:'yeti',name:'Yeti Disco',cover:'../dj-event-builder/covers/yeti-djs.jpg',dateText:'26 сентября, сб',iso:new Date(2026,8,26).toISOString(),time:'23:00',venue:'16 Тонн',reg:false,items:[{n:'Стандарт',q:2,price:1800}],count:2,disc:0,code:'',total:3600}]));}catch{}}}
const hint=t=>{try{sessionStorage.setItem('dja-hint',t);}catch{}};
function demoBody(){return `<p class="dja-cap">Демо · вход и профили</p><h2 id="dja-t">Показать прототип</h2>
 <button type="button" class="primary dja-btn" data-dja-demo="fresh">Начать с нуля</button><p class="dja-note">Сотрёт вход, билеты и напоминания в этом браузере и снова покажет загрузчик.</p>
 <p class="dja-gt">Сценарии показа</p><ul class="dja-list">${SCEN.map(([k,t,d])=>`<li><button type="button" class="dja-prof" data-dja-demo="${k}"><span class="dja-ava">${SCEN.findIndex(x=>x[0]===k)+1}</span><span class="dja-prof-t"><b>${t}</b><small class="wrap">${d}</small></span></button></li>`).join('')}</ul>
 <p class="dja-gt">Войти как</p><ul class="dja-list">${PERSONAS.map(([k,t,d])=>`<li><button type="button" class="dja-prof" data-dja-demo="as:${k}"><span class="dja-ava">${esc(t.split('· ')[1][0])}</span><span class="dja-prof-t"><b>${t}</b><small>${d}</small></span></button></li>`).join('')}</ul>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dja-demo]');if(!b)return;const k=b.dataset.djaDemo;
 if(k==='open'){if(typeof closeShell==='function')closeShell();document.querySelector('#moreMenu')?.classList.remove('open');document.querySelector('#navBackdrop')?.classList.remove('open');open({v:'demo'});return;}
 if(k==='fresh'){wipe();location.href=url('../dj-start/index.html');return;}
 if(k.startsWith('as:')){seed(k.slice(3));hint('Ты вошёл как '+active().name);location.href=home();return;}
 const sc=SCEN.find(x=>x[0]===k);if(sc){if(sc[3]==='multi'){seed('viewer');hint(sc[4]);location.href=home();return;}wipe();hint(sc[4]);location.href=url('../dj-start/index.html');}});
function demoMenu(){const m=document.querySelector('#moreMenu');if(!m||m.querySelector('.dja-menu'))return;const g=document.createElement('nav');g.className='proto-menu-group dja-menu';g.setAttribute('aria-label','Демо');
 g.innerHTML=`<p class="proto-menu-label">Демо</p><a class="proto-menu-link" href="${url('../dj-start/index.html')}#stay">Старт</a><a class="proto-menu-link" href="${url('../dj-afisha/index.html')}">Афиша</a><a class="proto-menu-link" href="${url('../dj-event-builder/index.html')}#events">Конструктор</a><a class="proto-menu-link" href="${url('judge.html')}#tournaments">Судейство (роль судьи)</a><button type="button" class="proto-menu-link dja-menu-b" data-dja-demo="open">Вход, профили, сценарии…</button>`;m.prepend(g);m.style.maxHeight='75dvh';m.style.overflowY='auto';}

/* ---------- роль в турнирах следует из профиля: зритель смотрит, артист участвует, промоутер организует ---------- */
const HUB={personal:'index.html',artist:'participant.html',org:'organizer.html',company:'index.html',venue:'index.html'};
const hubUrl=()=>url((S.signed&&HUB[active()?.type])||'index.html');
(()=>{const file=location.pathname.split('/').pop()||'index.html',hubs=['index.html','participant.html','organizer.html'],inUni=new URL('.',location.href).href===BASE.href;if(!inUni||!S.signed||!hubs.includes(file))return;
 const want=HUB[active()?.type]||'index.html',h=location.hash;if(want!==file&&(!h||h==='#tournaments'||h==='#monitor'||/^#t\/\d+$/.test(h))){location.replace(url(want)+(h||'#tournaments'));}})();
addEventListener('click',e=>{const sv=e.target.closest('[data-service="турниры"]');if(!sv||!S.signed)return;e.preventDefault();e.stopImmediatePropagation();location.href=hubUrl()+'#tournaments';},true);
const hideRole=()=>{if(S.signed)document.querySelectorAll('.role-wrap').forEach(n=>n.remove());};

/* ---------- API ---------- */
function require(reason,cb,opt={}){after=cb||null;if(S.signed){if(opt.need){sheet={need:opt.need,needTitle:opt.needTitle};next();return;}done();return;}open({v:'auth',reason,need:opt.need,needTitle:opt.needTitle});}
window.djAccess={home,get signed(){return S.signed;},active,profiles:()=>S.profiles.slice(),email:()=>S.email||'',require,profilesMenu:()=>open({v:'profiles'}),create:(type,cb,title)=>{after=cb||null;open({v:'create',type,title});}};
const st=document.createElement('link');st.rel='stylesheet';st.href=url('dj-access.css?v=10');document.head.append(st);
/* ---------- вход вернувшегося пользователя: Face ID, раз за сессию (имитация в демо) ---------- */
let lockWait=false;
const unlocked=()=>{try{sessionStorage.setItem('dj-unlocked','1');}catch{}};
const isUnlocked=()=>{try{return sessionStorage.getItem('dj-unlocked')==='1';}catch{return true;}};
const FACE='<svg viewBox="0 0 64 64" aria-hidden="true"><path class="c" d="M6 20V12a6 6 0 0 1 6-6h8M44 6h8a6 6 0 0 1 6 6v8M58 44v8a6 6 0 0 1-6 6h-8M20 58h-8a6 6 0 0 1-6-6v-8"/><g class="f"><circle cx="32" cy="30" r="13"/><path d="M26 38c3 3 9 3 12 0"/></g><path class="ok" d="m22 33 7 7 14-15"/></svg>';
function lock(){if(!S.signed||isUnlocked()||document.querySelector('.dja-lock'))return;const p=personal()||active(),el=document.createElement('div');el.className='dja-lock';el.setAttribute('role','dialog');el.setAttribute('aria-label','Вход через Face ID');
 el.innerHTML=`<div class="dja-lock-c"><div class="dja-face">${FACE}</div><p class="dja-lock-n">${esc(p?.name||'')}</p><p class="dja-lock-s" aria-live="polite">Вход через Face ID</p></div><button type="button" class="text-button dja-lock-alt">Войти другим способом</button><p class="dja-lock-demo">Демо: Face ID имитируется</p>`;
 document.body.append(el);const st=el.querySelector('.dja-lock-s'),face=el.querySelector('.dja-face');
 const run=()=>{face.classList.add('scan');setTimeout(()=>{face.classList.remove('scan');face.classList.add('done');st.textContent='Готово';unlocked();setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),350);},550);},1300);};
 const ld=document.querySelector('.dja-loader');setTimeout(run,ld?1700:350);
 el.querySelector('.dja-lock-alt').addEventListener('click',()=>{el.remove();lockWait=true;S.signed=false;require('Вход в аккаунт '+(p?.name||''),()=>{lockWait=false;unlocked();});});}
const boot=()=>{lock();chip();demoMenu();hideRole();let h='';try{h=sessionStorage.getItem('dja-hint')||'';sessionStorage.removeItem('dja-hint');}catch{}if(h)setTimeout(()=>toast(h),1500);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
