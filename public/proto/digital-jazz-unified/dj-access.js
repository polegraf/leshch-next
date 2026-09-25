'use strict';
/* Вход и профили Digital Jazz — один аккаунт, несколько профилей.
   Вход спрашивается на действии (купить, напомнить, собрать событие) и возвращает к нему.
   Способы: Яндекс ID (демо-имитация, окно Яндекса не открывается) и код на email (тестовый код 123456).
   Личный профиль создаётся сам из имени; профессиональные — из меню аватарки: артист, организатор, компания, площадка.
   Профессии и типы бизнеса — из справочника поиска (search.js). Данные — только в этом браузере. */
(()=>{
const BASE=new URL('.',document.currentScript.src),url=p=>new URL(p,BASE).href,KEY='dj-account';
/* загрузчик: неоновый знак Digital Jazz, небольшой, на чёрном — один раз за сессию, пока грузится страница */
(()=>{let seen=false;try{seen=sessionStorage.getItem('dj-loader')==='1';sessionStorage.setItem('dj-loader','1');}catch{}if(seen)return;
 const calm=matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now(),el=document.createElement('div');el.className='dja-loader';el.setAttribute('role','status');el.setAttribute('aria-label','Загрузка');
 el.innerHTML=calm?`<img src="${url('assets/loader.png')}" alt="">`:`<video autoplay muted loop playsinline preload="auto" poster="${url('assets/loader.png')}"><source src="${url('assets/loader.webm')}" type="video/webm"><source src="${url('assets/loader.mp4')}" type="video/mp4"></video>`;
 document.body.append(el);const hide=()=>{const wait=Math.max(0,1400-(performance.now()-t0));setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),400);},wait);};
 if(document.readyState==='complete')hide();else addEventListener('load',hide,{once:true});setTimeout(hide,3500);})();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
/* справочник — копия из search.js, чтобы поиск и профили говорили одними словами */
const ROLES={'Диджей':['Хип-хоп','Электроника','Поп'],'Вокалист':['Поп','Джаз','Рок'],'Битмейкер':['Хип-хоп','Электроника'],'Композитор':['Поп','Классика','Кино'],'Ведущий':['Ведение мероприятий','Комик / Стендап','Аниматор'],'Танцор':['Хореография','Перформанс'],'Модель':['Подиум','Фотосъёмка'],'Блогер':['Видео','Стриминг'],'Звукорежиссёр':['Запись','Сведение','Мастеринг'],'Дизайнер':['Графический дизайн','Моушн-дизайн']};
const BIZ=['Студии','Репбазы','Лейблы','Агентства','Продакшн','Магазины','Школы','Прокат','Охрана','Клининг','Блог-агентства'];
const TYPES=[['artist','Артист / специалист','Портфолио, райдер, предложения'],['org','Организатор','События, лайн-ап, команда'],['company','Компания','Услуги, прокат, подрядчик событий'],['venue','Площадка','Вместимость, даты, техника']];
const TNAME=Object.fromEntries(TYPES.map(t=>[t[0],t[1]]));
let S=load(),sheet=null,after=null;
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.profiles))return v;}catch{}return {signed:false,profiles:[],active:null};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch{toast('Не удалось сохранить в браузере — вход действует до перезагрузки');}}
const active=()=>S.profiles.find(p=>p.id===S.active)||S.profiles[0]||null;
const personal=()=>S.profiles.find(p=>p.type==='personal');
/* дом: зритель — афиша; артист, организатор, компания, площадка — профиль с монитором */
const home=()=>{const a=S.signed&&active();return a&&a.type!=='personal'?url('profile/index.html'):url('../dj-afisha/index.html');};

/* ---------- лист ---------- */
function mount(){let r=document.querySelector('#dja-root');if(!r){r=document.createElement('div');r.id='dja-root';document.body.append(r);}return r;}
function open(s){sheet=s;draw();setTimeout(()=>mount().querySelector('.dja-sheet input:not([type=hidden]),.dja-sheet .dja-first')?.focus?.(),30);}
function close(){sheet=null;after=null;draw();}
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
 if(s.v==='profiles'){const a=active();return `<p class="dja-cap">${S.via==='yandex'?'Вход через Яндекс ID':'Вход по email'} · ${esc(S.email||'')}</p><h2 id="dja-t">Твои профили</h2>
  <ul class="dja-list">${S.profiles.map(p=>`<li><button type="button" class="dja-prof${p.id===a?.id?' on':''}" data-dja-use="${p.id}" aria-pressed="${p.id===a?.id}"><span class="dja-ava">${esc((p.name||'?')[0])}</span><span class="dja-prof-t"><b>${esc(p.name)}</b><small>${p.type==='personal'?'Личный · билеты, друзья, интересы':esc(TNAME[p.type])+(p.roles?.length?' · '+esc(p.roles.join(', ')):'')+(p.biz?' · '+esc(p.biz):'')+(p.cap?' · до '+p.cap+' гостей':'')}</small></span>${p.id===a?.id?'<svg class="dja-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>':''}</button></li>`).join('')}</ul>
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
function signIn(via,email,name){S.signed=true;S.via=via;S.email=email;if(!personal()){const p={id:uid(),type:'personal',name:name||email.split('@')[0]};S.profiles.unshift(p);S.active=p.id;}save();}
function createProfile(f){const t=f.type||'artist',p={id:uid(),type:t,name:f.name.trim(),city:(f.city||'').trim()};if(t==='artist'){p.roles=f.roles||[];p.genres=f.genres||[];}if(t==='company')p.biz=f.biz||'';if(t==='venue')p.cap=+String(f.cap||'').replace(/\D/g,'')||0;S.profiles.push(p);S.active=p.id;save();return p;}

/* ---------- отметка «действуешь от имени» в хидере ---------- */
function chip(){document.querySelectorAll('.dja-as').forEach(n=>n.remove());const a=active();if(!S.signed||!a||a.type==='personal')return;
 /* от чьего имени — видно на аватарке в нижней навигации: вместо фото — буква профиля */
 document.querySelectorAll('.nav-avatar').forEach(av=>{av.insertAdjacentHTML('beforeend',`<span class="dja-as" aria-hidden="true">${esc(a.name[0])}</span>`);av.setAttribute('aria-label','Профиль: '+a.name+' · сменить');});}

/* ---------- события ---------- */
document.addEventListener('click',e=>{const t=e.target;
 const pick=t.closest('[data-dja-pick]');if(pick){const k=pick.dataset.djaPick,v=pick.dataset.v;syncForm();if(pick.dataset.multi){const a=sheet[k]||[];sheet[k]=a.includes(v)?a.filter(x=>x!==v):[...a,v];if(k==='roles'){const g=new Set((sheet.roles||[]).flatMap(r=>ROLES[r]||[]));sheet.genres=(sheet.genres||[]).filter(x=>g.has(x));}}else sheet[k]=sheet[k]===v?'':v;draw();return;}
 const ty=t.closest('[data-dja-type]');if(ty){syncForm();sheet.type=ty.dataset.djaType;draw();return;}
 const use=t.closest('[data-dja-use]');if(use){const was=S.active;S.active=use.dataset.djaUse;save();close();chip();if(was!==S.active){location.href=home();return;}toast('Ты действуешь как '+active().name);return;}
 const b=t.closest('[data-dja]');if(!b)return;const a=b.dataset.dja;
 if(a==='close'){close();return;}
 if(a==='yandex'){open({...sheet,v:'yandex-wait'});setTimeout(()=>{if(sheet&&sheet.v==='yandex-wait')open({...sheet,v:'yandex-ok',name:'Дмитрий',email:'dmitry@yandex.ru'});},900);return;}
 if(a==='yandex-go'){const n=(mount().querySelector('[data-dja-name]')?.value||'').trim()||'Друг';signIn('yandex',sheet.email,n);next();return;}
 if(a==='email'){open({...sheet,v:'email',err:''});return;}
 if(a==='back-auth'){open({...sheet,v:'auth'});return;}
 if(a==='profiles'){if(!S.signed){require('Войди, чтобы у тебя был профиль',()=>open({v:'profiles'}));return;}open({v:'profiles'});return;}
 if(a==='create'){open({v:'create',type:'artist'});return;}
 if(a==='logout'){S={signed:false,profiles:[],active:null};save();close();chip();toast('Ты вышел из аккаунта');document.dispatchEvent(new CustomEvent('dj-access'));return;}});
function syncForm(){const f=mount().querySelector('[data-dja-form="create"]');if(!f||!sheet)return;const d=new FormData(f);['name','city','cap'].forEach(k=>{if(d.has(k))sheet[k]=d.get(k);});}
function next(){if(sheet&&sheet.need&&!sheet.need.includes(active()?.type)){const want=sheet.need.includes('org')?'org':sheet.need[0],match=S.profiles.find(p=>sheet.need.includes(p.type));if(match){S.active=match.id;save();done();return;}open({...sheet,v:'create',type:want,name:'',city:'Москва',err:'',title:sheet.needTitle||'Нужен профиль организатора'});return;}done();}
document.addEventListener('submit',e=>{const f=e.target.closest('[data-dja-form]');if(!f)return;e.preventDefault();const d=new FormData(f),k=f.dataset.djaForm;
 if(k==='email'){open({...sheet,v:'code',email:d.get('email').trim(),err:''});return;}
 if(k==='code'){if(d.get('code')!=='123456'){sheet.name=d.get('name')||sheet.name;sheet.err='Неверный код. В демо — 123456';draw();return;}signIn('email',sheet.email,(d.get('name')||'').trim());next();return;}
 if(k==='create'){syncForm();if(!(sheet.name||'').trim()){sheet.err='Нужно имя или название';draw();return;}if(sheet.type==='artist'&&!(sheet.roles||[]).length){sheet.err='Отметь хотя бы одну профессию';draw();return;}const p=createProfile(sheet);toast(`Профиль «${p.name}» создан — ты действуешь от его имени`);document.dispatchEvent(new CustomEvent('dj-access'));if(!after){sheet=null;draw();location.href=home();return;}done();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet)close();});
/* аватарка в нижней навигации — меню профилей (перехватываем раньше общих переходов прототипа) */
addEventListener('click',e=>{const lg=e.target.closest('.topbar-logo');if(!lg)return;e.preventDefault();e.stopImmediatePropagation();location.href=home();},true);
addEventListener('click',e=>{const av=e.target.closest('.nav-avatar');if(!av)return;e.preventDefault();e.stopImmediatePropagation();if(S.signed)open({v:'profiles'});else require('Войди, чтобы у тебя был профиль',()=>open({v:'profiles'}));},true);

/* ---------- API ---------- */
function require(reason,cb,opt={}){after=cb||null;if(S.signed){if(opt.need){sheet={need:opt.need,needTitle:opt.needTitle};next();return;}done();return;}open({v:'auth',reason,need:opt.need,needTitle:opt.needTitle});}
window.djAccess={home,get signed(){return S.signed;},active,profiles:()=>S.profiles.slice(),email:()=>S.email||'',require,profilesMenu:()=>open({v:'profiles'}),create:(type,cb,title)=>{after=cb||null;open({v:'create',type,title});}};
const st=document.createElement('link');st.rel='stylesheet';st.href=url('dj-access.css?v=2');document.head.append(st);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',chip);else chip();
})();
