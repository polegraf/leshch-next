'use strict';
// Independent local prototype. No network writes, payments or real messages.
const $ = s => document.querySelector(s);
const people = [
 {name:'DJ Tactics',city:'Москва',role:'Диджей',genre:'Хип-хоп',initials:'DT'},
 {name:'Dj Chagin',city:'Москва',role:'Диджей',genre:'Электроника',initials:'DC'},
 {name:'Iv Kovalenko',city:'Санкт-Петербург',role:'Композитор',genre:'Поп',initials:'IK'},
 {name:'M Clis',city:'Москва',role:'Битмейкер',genre:'Хип-хоп',initials:'MC'},
 {name:'Арина Полонская',city:'Санкт-Петербург',role:'Вокалист',genre:'Поп',initials:'АП'},
 {name:'Sergey Sanchez',city:'Москва',role:'Диджей',genre:'Электроника',initials:'SS'}
];
const products=[
{id:'theme',name:'Digital Jazz',category:'Темы',price:0,owned:true,art:'classic',label:'DJ'},
{id:'night',name:'Violet Night',category:'Темы',price:120,art:'violet',label:'Night'},
{id:'acid',name:'Acid Stage',category:'Темы',price:120,art:'acid',label:'Acid'},
{id:'mono',name:'Mono',category:'Темы',price:80,art:'mono',label:'Mono'},
{id:'plan1',name:'Тайл — План 1',category:'Тайлы',price:null,art:'plan',label:'План 1'},
{id:'plan2',name:'Тайл — План 2',category:'Тайлы',price:null,art:'plan',label:'План 2'},
{id:'plan3',name:'Тайл — План 3',category:'Тайлы',price:null,art:'plan',label:'План 3'},
{id:'shirt-black',name:'Футболка · чёрная',category:'Мерч',price:null,art:'shirt',label:'DJ'},
{id:'shirt-white',name:'Футболка · белая',category:'Мерч',price:null,art:'shirt white',label:'DJ'},
{id:'cap-black',name:'Кепка · чёрная',category:'Мерч',price:null,art:'cap',label:'DJ'},
{id:'cap-lime',name:'Кепка · лайм',category:'Мерч',price:null,art:'cap lime',label:'DJ'}];
const shopState={activeTheme:'theme',activeTile:null,preview:null};

const tournaments=[{name:'Digital Jazz Scratch',category:'Диджеинг',format:'1 на 1',prize:'Призы от партнёров',id:0},{name:'Beat Session',category:'Аудиопродакшн',format:'Открытый',prize:'Призовой фонд · демо',id:1},{name:'Новый голос',category:'Вокал',format:'Пирамида',prize:'Запись в студии · демо',id:2}];
const state={section:'search',type:'Создатели',query:'',filters:{city:'',roles:[],genre:''},discovery:0,tournamentTab:'Все',category:'Все',shopTab:'Каталог',productCategory:'Все',cart:{},step:0,draft:{name:'',description:'',category:'Диджеинг',format:'1 на 1',count:'16',task:'',judging:'Жюри',prize:'',deadline:''},draftSaved:false};
const expandedTournaments = new Set();
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={filter:'<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'};
function tabs(items,current,action){return `<div class="${action==='type'?'search-types':'seg'}" ${action==='type'?'role="group" aria-label="Кого ищем"':''}>${items.map(x=>`<button data-action="${action}" data-value="${x}" aria-pressed="${x===current}">${x}</button>`).join('')}</div>`;}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
let panelOrigin=null;
function parkPanel(){const panel=$('#sheet');if(panel&&$('#main').contains(panel)){panel.hidden=true;document.body.append(panel);}}
function openSheet(title,content){
 const panel=$('#sheet');
 if(panel.hidden)panelOrigin=document.activeElement;
 const origin=panelOrigin;
 const shelf=origin?.closest('.shop-shelf');
 const wallet=$('.shop-wallet');
 const heading=$('#main .heading');
 if(title==='Корзина'||title==='Пополнить баланс') (wallet||heading||$('#main')).after(panel);
 else if(shelf) shelf.append(panel);
 else if(!$('#main').contains(panel)) (heading||$('#main')).after(panel);
 $('#sheet-title').textContent=title;$('#sheet-content').innerHTML=content;panel.hidden=false;
 document.querySelectorAll('[data-action="product"]').forEach(button=>button.setAttribute('aria-expanded',String(button===origin)));
}
function closeSheet(){const panel=$('#sheet');panel.hidden=true;document.querySelectorAll('[data-action="product"]').forEach(button=>button.setAttribute('aria-expanded','false'));if(panelOrigin?.isConnected)panelOrigin.focus({preventScroll:true});panelOrigin=null;}

function results(){return state.type==='Создатели'?people.filter(p=>(p.name+' '+p.role).toLowerCase().includes(state.query.toLowerCase())&&(!state.filters.city||p.city===state.filters.city)&&(!state.filters.roles.length||state.filters.roles.includes(p.role))&&(!state.filters.genre||p.genre===state.filters.genre)):[];}
function filterCount(){return Number(!!state.filters.city)+state.filters.roles.length+Number(!!state.filters.genre);}
function filterChips(){const values=[state.filters.city,...state.filters.roles,state.filters.genre].filter(Boolean);return values.length?`<div class="chips">${values.map(x=>`<button class="chip active" data-action="remove-filter" data-value="${esc(x)}" aria-label="Убрать фильтр ${esc(x)}">${esc(x)} ×</button>`).join('')}<button class="text-button" data-action="reset-filters">Сбросить</button></div>`:'';}
function peopleCards(){const rows=results();return rows.length?rows.map((p)=>`<button class="card person" data-action="person" data-value="${people.indexOf(p)}"><span class="portrait ${people.indexOf(p)%2?'alt':''}">${p.initials}</span><span class="info"><h3>${p.name}</h3><span class="secondary">${p.role}</span><span class="caption">${p.city} · ${p.genre}</span></span><svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`).join(''):`<div class="card empty"><h3>${state.type==='Создатели'?'Никого не нашли':'Пока нет профилей'}</h3><p class="secondary">${state.type==='Создатели'?'Попробуй убрать часть фильтров или изменить запрос.':'В этой демоверсии представлены создатели.'}</p><button class="secondary-button" data-action="reset-search">Сбросить поиск</button></div>`;}
function renderSearch(){return `<div class="heading"><h1>Поиск</h1><a class="text-button" href="#discovery">Дискавери ↗</a></div>${tabs(['Создатели','Компании','Менеджмент'],state.type,'type')}<div class="search-row"><input id="query" class="input" type="search" aria-label="Имя или профессия" placeholder="Имя или профессия" value="${esc(state.query)}"></div>${filterCard()}${filterChips()}<div class="section-title"><h2>Результаты</h2><span class="caption" id="result-count">${results().length} ${state.type==='Компании'?'компаний':'профилей'}</span></div><div class="stack" id="results">${peopleCards()}</div>`;}
function renderDiscovery(){const list=results();const p=list[state.discovery%Math.max(1,list.length)];return `<div class="heading"><h1>Дискавери</h1></div>${filterCard()}${filterChips()}${p?`<article class="discovery-card"><div class="discovery-monogram" aria-hidden="true">${p.initials}</div><div class="discovery-content"><span class="caption">Открой нового человека</span><h2>${p.name}</h2><p class="secondary">${p.city} · ${p.role}</p><div class="chips"><span class="chip active">${p.genre}</span></div><button class="primary full" data-action="person" data-value="${people.indexOf(p)}">Открыть профиль ↗</button></div></article><div class="discovery-controls"><button class="icon" data-action="previous" aria-label="Предыдущий профиль"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><span class="caption">${state.discovery%list.length+1} из ${list.length}</span><button class="icon" data-action="next" aria-label="Следующий профиль"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div><p class="caption progress-note">Подборка по твоим фильтрам. Фотографии заменены демозаглушками.</p>`:`<div class="card empty"><h3>Подборка пуста</h3><p class="secondary">Измени условия, чтобы увидеть людей.</p><button class="secondary-button" data-action="reset-search">Сбросить условия</button></div>`}`;}
function renderTournaments(){let list=tournaments.filter(t=>state.category==='Все'||t.category===state.category);return `<div class="heading"><h1>Турниры</h1><button class="icon filter-button" data-action="create" aria-label="Создать турнир">${icons.plus}</button></div>${tabs(['Все','Мои'],state.tournamentTab,'tournament-tab')}${state.tournamentTab==='Все'?`<div class="chips">${['Все','Диджеинг','Аудиопродакшн','Инструменты','Вокал'].map(c=>`<button class="chip" data-action="tournament-category" data-value="${c}" aria-pressed="${state.category===c}">${c}</button>`).join('')}</div><div class="section-title"><h2>Приём заявок</h2><span class="caption">${list.length}</span></div><div class="stack">${list.length?list.map(t=>`<article class="card tournament-fold" data-tournament-id="${t.id}"><button class="drag-handle" aria-label="Переместить ${t.name}" title="Перетащи или используй стрелки вверх и вниз"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></button><details ${expandedTournaments.has(t.id)?'open':''}><summary><span class="tournament-title"><strong>${t.name}</strong><span class="caption">${t.category} · ${t.format}</span></span><span class="dot lime" role="img" aria-label="Приём заявок" title="Приём заявок"></span><svg class="fold-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="tournament-content"><p class="secondary">${t.prize}</p><p class="caption">Сроки уточняются · демо</p><div class="tournament-rules"><h3>Правила участия</h3><p class="secondary">Это демонстрационный турнир. Здесь будут задание, сроки, критерии оценки и состав жюри.</p></div><button class="primary full" data-action="apply">Подать заявку</button></div></details></article>`).join(''):'<div class="card empty"><h3>Турниров пока нет</h3><button class="text-button" data-action="tournament-category" data-value="Все">Все категории</button></div>'}</div>`:`${state.draftSaved?`<button class="card tournament full" data-action="create"><div class="row"><h3>${esc(state.draft.name||'Новый турнир')}</h3><span class="dot" role="img" aria-label="Черновик" title="Черновик"></span></div><p class="secondary">Продолжить создание →</p></button>`:`<div class="card empty"><h2>Твой первый турнир</h2><p class="secondary">Здесь будут твои турниры и участия.</p><button class="primary" data-action="create">Создать турнир</button></div>`}`}`;}
const field=(label,name,type='text',placeholder='')=>`<label class="field"><span>${label}</span><input class="input" name="${name}" type="${type}" value="${esc(state.draft[name])}" placeholder="${placeholder}" ${name==='count'?'min="2" max="128"':''}></label>`;
function selectField(label,name,options){return `<label class="field"><span>${label}</span><select name="${name}">${options.map(x=>`<option ${state.draft[name]===x?'selected':''}>${x}</option>`).join('')}</select></label>`;}
function renderCreate(){const titles=['Основное','Формат и задание','Оценка и призы','Проверка'];let body='';if(state.step===0)body=field('Название турнира','name','text','Например, Digital Jazz Scratch')+selectField('Категория','category',['Диджеинг','Аудиопродакшн','Инструменты','Вокал'])+`<label class="field"><span>Описание · необязательно</span><textarea name="description" rows="3" placeholder="Для кого этот турнир">${esc(state.draft.description)}</textarea></label><p class="caption">Обложку и партнёров можно добавить позже. Сначала — суть турнира.</p>`;
if(state.step===1)body=selectField('Формат','format',['1 на 1','Пирамида','Открытый'])+field('Количество участников','count','number')+`<label class="field"><span>Задание участникам</span><textarea name="task" rows="4" placeholder="Что подготовить и в каком формате">${esc(state.draft.task)}</textarea></label>`;
if(state.step===2)body=selectField('Кто оценивает','judging',['Жюри','Зрители','Жюри и зрители'])+field('Призы · необязательно','prize','text','Что получает победитель')+field('Приём заявок до','deadline','date');
if(state.step===3)body=`<div class="card summary-list">${[['Название',state.draft.name],['Категория',state.draft.category],['Формат',state.draft.format+' · '+state.draft.count+' участников'],['Задание',state.draft.task],['Оценка',state.draft.judging],['Приз',state.draft.prize||'Не указан'],['Заявки до',state.draft.deadline]].map(([k,v])=>`<div><span class="caption">${k}</span><p>${esc(v)}</p></div>`).join('')}</div><p class="caption progress-note">В прототипе сохранится только локальный черновик. Публикации на платформе не будет.</p>`;
return `<div class="heading"><button class="icon" data-action="exit-create" aria-label="К турнирам"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><h2>Новый турнир</h2><button class="icon" data-action="save-draft" aria-label="Сохранить черновик">✓</button></div><div class="steps">${titles.map((_,i)=>`<span class="${i<=state.step?'done':''}"></span>`).join('')}</div><div class="form-intro"><p class="caption">Шаг ${state.step+1} из 4</p><h1>${titles[state.step]}</h1></div><form id="tournament-form">${body}<p id="form-error" class="error" role="alert" hidden></p><div class="actions">${state.step?'<button type="button" class="secondary-button" data-action="step-back">Назад</button>':''}<button class="primary" type="submit">${state.step===3?'Сохранить черновик':'Далее'}</button></div></form>`;}
function cartCount(){return Object.values(state.cart).reduce((a,b)=>a+b,0);}
function priceLabel(p){return p.price===null?'Цена уточняется':p.price+' Джазиксов';}
function productPreview(p){if(p.category==='Мерч')return `<div class="merch-preview ${p.art}" aria-hidden="true"><svg viewBox="0 0 200 150">${p.art.startsWith('shirt')?'<path class="garment" d="M65 20 35 35 15 67 47 83 57 65 57 135 143 135 143 65 153 83 185 67 165 35 135 20Q100 42 65 20Z"/>':'<path class="garment" d="M45 95Q40 28 105 25Q163 27 160 97Z"/><path class="garment" d="M45 95Q110 80 160 97L188 118Q103 141 30 114Z"/>'}<image class="merch-logo" href="assets/logo.webp" x="81" y="52" width="38" height="38" preserveAspectRatio="xMidYMid meet"/></svg><small>DIGITAL JAZZ</small></div>`;if(p.category==='Тайлы')return `<div class="tile-preview plan-preview"><small>ТАЙЛ</small><strong>${p.label}</strong></div>`;return p.category==='Темы'?`<div class="theme-preview look-${p.art}" aria-hidden="true"><div class="preview-cover"></div><div class="preview-person"><span class="preview-avatar"><img src="assets/logo.webp" alt=""></span><span><b>Твой профиль</b><small>Музыка — это ты</small></span></div><div class="preview-tags"><i>Диджей</i><i>Продюсер</i></div><div class="preview-lines"><i></i><i></i></div></div>`:`<div class="tile-preview look-${p.art}" aria-hidden="true"><span class="tile-signal"><i></i><i></i><i></i><i></i><i></i></span><strong>${p.label}</strong><small>DIGITAL JAZZ</small></div>`;}
function shopProduct(p){const active=p.id===shopState.activeTheme||p.id===shopState.activeTile;return `<button class="shop-product" data-action="product" data-value="${p.id}" aria-controls="sheet" aria-expanded="false" aria-label="${p.name}, ${p.owned?'в коллекции':priceLabel(p)}">${productPreview(p)}<span class="shop-product-name">${p.name}</span><span class="shop-product-price">${active?'<i class="dot lime"></i>Активна':p.owned?'В коллекции':priceLabel(p)}</span></button>`;}
function shopShelf(category,title,description){return `<section class="shop-shelf" aria-label="${title}"><div class="shelf-heading"><div><h2>${title}</h2><p class="caption">${description}</p></div><div class="shelf-arrows"><button class="icon" data-action="shelf-prev" aria-label="${title}: назад"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button><button class="icon" data-action="shelf-next" aria-label="${title}: дальше"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button></div></div><div class="shop-rail" tabindex="0" aria-label="${title}, горизонтальная прокрутка">${products.filter(p=>p.category===category).map(shopProduct).join('')}</div></section>`;}
function renderShop(){return `<div class="heading"><h1>Магазин</h1><button class="icon shop-cart" data-action="cart" aria-label="Корзина: ${cartCount()} товаров"><svg viewBox="0 0 24 24"><path d="M3 4h2l2 12h11l3-9H6M9 20h.01M17 20h.01"/></svg>${cartCount()?`<span class="cart-count">${cartCount()}</span>`:''}</button></div><div class="shop-wallet"><span>0 <span class="caption">Джазиксов</span></span><button class="text-button" data-action="topup">Пополнить</button></div>${tabs(['Каталог','Мои покупки'],state.shopTab,'shop-tab')}${state.shopTab==='Каталог'?`<div class="shop-intro"><h2>Твой звук. Твой стиль.</h2><p class="secondary">Темы профиля, тайлы и мерч.</p></div>${shopShelf('Темы','Темы профиля','Цвет и настроение всей страницы')}${shopShelf('Тайлы','Тайл','План 1, 2, 3')}${shopShelf('Мерч','Мерч','Футболки и кепки Digital Jazz')}<p class="caption shop-demo">Демонстрационная коллекция. Покупки не списывают средства.</p>`:`<section class="shop-shelf"><div class="shelf-heading"><div><h2>Твоя коллекция</h2><p class="caption">Купленное оформление остаётся здесь</p></div></div><div class="shop-rail">${products.filter(p=>p.owned).map(shopProduct).join('')}</div></section>`}`;}
function showShopProduct(id,tryOn=false){const p=products.find(p=>p.id===id);if(!p)return;shopState.preview=tryOn?p.id:null;openSheet(tryOn?'Примерка':p.name,`<div class="shop-detail">${tryOn?`<div class="tryon-caption"><span class="dot lime"></span>Предпросмотр · изменения не сохранены</div>`:''}${productPreview(p)}<div><h3>${p.name}</h3><p class="secondary">${p.category==='Темы'?'Палитра и обложка твоего профиля.':p.category==='Тайлы'?'Состав и условия плана будут добавлены.':'Демонстрационный товар. Размеры и наличие будут добавлены.'}</p></div><p class="caption">${p.owned?'Уже в твоей коллекции':priceLabel(p)}</p><div class="shop-detail-actions">${!tryOn&&p.category==='Темы'?`<button class="secondary-button" data-action="try-product" data-value="${p.id}">Примерить</button>`:''}${p.owned?`<button class="primary" data-action="apply-product" data-value="${p.id}">Применить</button>`:`<button class="primary" data-action="add-cart" data-value="${p.id}">${state.cart[p.id]?'В корзине':'В корзину'}</button>`}</div><p class="caption">${p.category==='Темы'?'Примерка на демонстрационном профиле.':'Цена и условия покупки пока не заданы.'}</p></div>`);}

function render(){parkPanel();let section=location.hash.slice(1)||'tournaments';if(!['search','discovery','tournaments','shop','create'].includes(section))section='search';state.section=section;$('#main').innerHTML=({search:renderSearch,discovery:renderDiscovery,tournaments:renderTournaments,shop:renderShop,create:renderCreate})[section]();document.querySelectorAll('[data-nav]').forEach(a=>{const on=a.dataset.nav===section;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});$('#services').classList.toggle('active',['tournaments','shop','create'].includes(section));document.title='Digital Jazz · '+({search:'Поиск',discovery:'Дискавери',tournaments:'Турниры',shop:'Магазин',create:'Создать турнир'})[section];}
function filterCard(){return `<details class="card filter-card"><summary><span>Фильтры${filterCount()?` · ${filterCount()}`:''}</span><svg class="fold-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="filter-content">${filterForm()}</div></details>`;}
function filterForm(){return `<form id="filter-form">${selectFieldCustom('Город','city',['Любой город','Москва','Санкт-Петербург'],state.filters.city||'Любой город')}<fieldset><legend>Профессия</legend><div class="checks">${['Диджей','Вокалист','Битмейкер','Композитор'].map(x=>`<label><input type="checkbox" name="roles" value="${x}" ${state.filters.roles.includes(x)?'checked':''}>${x}</label>`).join('')}</div></fieldset>${selectFieldCustom('Жанр','genre',['Любой жанр','Хип-хоп','Электроника','Поп'],state.filters.genre||'Любой жанр')}<p class="caption">Одни условия для поиска и дискавери.</p><div class="actions"><button type="button" class="secondary-button" data-action="clear-filter-form">Сбросить</button><button type="submit" class="primary">Показать</button></div></form>`;}

function selectFieldCustom(label,name,options,value){return `<label class="field"><span>${label}</span><select name="${name}">${options.map(x=>`<option ${value===x?'selected':''}>${x}</option>`).join('')}</select></label>`;}
function persistDraft(){try{sessionStorage.setItem('dj-ui-draft',JSON.stringify(state.draft));state.draftSaved=true;return true;}catch{notify('Не удалось сохранить: хранилище браузера недоступно.');return false;}}
try{const saved=JSON.parse(sessionStorage.getItem('dj-ui-draft'));if(saved&&typeof saved==='object'){for(const k of Object.keys(state.draft))if(typeof saved[k]==='string')state.draft[k]=saved[k];state.draftSaved=true;}}catch{}
function showCart(){const entries=products.filter(p=>state.cart[p.id]);openSheet('Корзина',entries.length?`<div class="stack">${entries.map(p=>`<div class="card cart-item"><div class="info"><h3>${p.name}</h3><p class="secondary">${priceLabel(p)}</p></div><button class="icon" data-action="remove-cart" data-value="${p.id}" aria-label="Убрать ${p.name}">×</button></div>`).join('')}</div><div class="section-title"><h2>Итого</h2><span>${entries.some(p=>p.price===null)?'Стоимость уточняется':entries.reduce((n,p)=>n+p.price*state.cart[p.id],0)+' Дж.'}</span></div>${entries.some(p=>p.price===null)?'<p class="secondary">Для товаров без цены стоимость и условия заказа будут добавлены позже.</p>':'<p class="secondary">Баланс: 0 Джазиксов.</p><button class="primary full actions" data-action="topup">Пополнить баланс</button>'}`:`<div class="empty"><h2>Пока пусто</h2><p class="secondary">Выбери оформление для профиля или мерч.</p><button class="primary" data-action="back-catalog">Открыть каталог</button></div>`);}
document.addEventListener('input',e=>{if(e.target.id==='query'){state.query=e.target.value;$('#results').innerHTML=peopleCards();$('#result-count').textContent=results().length+(state.type==='Компании'?' компаний':' профилей');}if(e.target.closest('#tournament-form')&&e.target.name)state.draft[e.target.name]=e.target.value;});
document.addEventListener('change',e=>{if(e.target.closest('#tournament-form')&&e.target.name)state.draft[e.target.name]=e.target.value;});
document.addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='filter-form'){const data=new FormData(e.target);state.filters={city:data.get('city')==='Любой город'?'':data.get('city'),roles:data.getAll('roles'),genre:data.get('genre')==='Любой жанр'?'':data.get('genre')};state.discovery=0;render();document.querySelector(".filter-card summary")?.focus({preventScroll:true});}if(e.target.id==='tournament-form'){let error='';if(state.step===0&&!state.draft.name.trim())error='Укажи название турнира.';if(state.step===1&&(!state.draft.task.trim()||Number(state.draft.count)<2||Number(state.draft.count)>128))error='Добавь задание и количество участников от 2 до 128.';if(state.step===2&&!state.draft.deadline)error='Укажи срок приёма заявок.';if(error){$('#form-error').hidden=false;$('#form-error').innerHTML='<span class="dot magenta"></span>'+error;return;}if(state.step===3){if(persistDraft()){state.tournamentTab='Мои';location.hash='tournaments';notify('Черновик сохранён в этом браузере.');}}else{state.step++;render();window.scrollTo(0,0);}}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,value}=b.dataset;
 switch(action){case'close':closeSheet();break;case'type':state.type=value;render();break;case'reset-filters':state.filters={city:'',roles:[],genre:''};render();break;case'reset-search':state.type='Создатели';state.query='';state.filters={city:'',roles:[],genre:''};render();break;case'remove-filter':if(state.filters.city===value)state.filters.city='';if(state.filters.genre===value)state.filters.genre='';state.filters.roles=state.filters.roles.filter(x=>x!==value);render();break;case'clear-filter-form':$('#filter-form').reset();$('#filter-form').querySelectorAll('select').forEach(el=>el.selectedIndex=0);$('#filter-form').querySelectorAll('input').forEach(el=>el.checked=false);break;
 case'person':location.href='public-profile/index.html';break;
 case'next':state.discovery=(state.discovery+1)%results().length;render();break;case'previous':state.discovery=(state.discovery+results().length-1)%results().length;render();break;
 case'services':$('#services').setAttribute('aria-expanded','true');openSheet('Сервисы','<div class="menu-links"><a href="#tournaments">Турниры <span>↗</span></a><a href="#shop">Магазин <span>↗</span></a></div>');break;
 case'tournament-tab':state.tournamentTab=value;render();break;case'tournament-category':state.category=value;render();break;case'create':state.step=0;location.hash='create';break;case'exit-create':location.hash='tournaments';break;case'step-back':state.step--;render();break;case'save-draft':if(persistDraft())notify('Черновик сохранён в этом браузере.');break;
 case'apply':notify('Демо: заявка не отправляется.');break;case'shop-tab':state.shopTab=value;render();break;case'product-category':state.productCategory=value;render();break;
 case'product':if(!$('#sheet').hidden&&panelOrigin===b){closeSheet();}else{panelOrigin=b;showShopProduct(value);}break;
 case'try-product':showShopProduct(value,true);break;
 case'apply-product':{const p=products.find(p=>p.id===value);if(p?.owned){if(p.category==='Темы')shopState.activeTheme=value;else shopState.activeTile=value;closeSheet();render();notify('Применено в прототипе.');}break;}
 case'shelf-prev':case'shelf-next':{const rail=b.closest('.shop-shelf').querySelector('.shop-rail');rail.scrollBy({left:(action==='shelf-next'?1:-1)*rail.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});break;}
 case'add-cart':state.cart[value]=1;closeSheet();render();notify('Добавлено в демо-корзину.');break;case'cart':showCart();break;case'remove-cart':delete state.cart[value];closeSheet();render();showCart();break;case'back-catalog':closeSheet();state.shopTab='Каталог';state.productCategory='Все';if(state.section==='shop')render();else location.hash='shop';break;
 case'topup':if(!$('#sheet').hidden)closeSheet();openSheet('Пополнить баланс',`<p class="secondary">Выбери пакет Джазиксов. Цены взяты с просмотренной витрины.</p><div class="stack progress-note">${[[100,'99'],[500,'449'],[1500,'1 190']].map(([n,price])=>`<button class="card balance" data-action="demo-pay"><span>${n} Джазиксов</span><span class="status">${price} ₽ <span>↗</span></span></button>`).join('')}</div><p class="caption">Демоэкран: оплаты и списаний нет.</p>`);break;
 case'demo-pay':notify('Демонстрация: переход к оплате не подключён.');break;case'about':openSheet('Digital Jazz','<div class="menu-links"><a href="#search">Поиск ↗</a><a href="#discovery">Дискавери ↗</a><a href="#tournaments">Турниры ↗</a><a href="#shop">Магазин ↗</a></div>');break;case'notifications':notify('В демоверсии новых уведомлений нет.');break;case'pro':notify('PRO — вне этого прототипа.');break;case'profile':notify('Профиль сохраняет ранее согласованный дизайн.');break;case'chat':notify('Демо: сообщения не отправляются.');break;
 }});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheet').hidden){closeSheet();}});
window.addEventListener('hashchange',()=>{if(!$('#sheet').hidden)closeSheet();render();window.scrollTo(0,0);$('#main').focus({preventScroll:true});});
render();

// Local ordering is shared across category filters and survives reloads.
try {
  const order = JSON.parse(localStorage.getItem('dj-tournament-order') || '[]');
  if (Array.isArray(order)) tournaments.sort((a,b) => {
    const rank = id => order.includes(id) ? order.indexOf(id) : order.length + id;
    return rank(a.id) - rank(b.id);
  });
} catch {}
function saveTournamentOrder(list) {
  const visible = Array.from(list.querySelectorAll('[data-tournament-id]')).map(el => Number(el.dataset.tournamentId));
  const reordered = visible.map(id => tournaments.find(t => t.id === id));
  let i = 0;
  const next = tournaments.map(t => visible.includes(t.id) ? reordered[i++] : t);
  tournaments.splice(0, tournaments.length, ...next);
  try { localStorage.setItem('dj-tournament-order', JSON.stringify(tournaments.map(t=>t.id))); }
  catch { notify('Порядок изменён. Сохранение после перезагрузки недоступно.'); }
}
document.addEventListener('toggle', e => {
  const card = e.target.closest('[data-tournament-id]');
  if (!card || e.target.tagName !== 'DETAILS') return;
  const id = Number(card.dataset.tournamentId);
  if (e.target.open) expandedTournaments.add(id); else expandedTournaments.delete(id);
}, true);
document.addEventListener('keydown', e => {
  const handle = e.target.closest('.drag-handle');
  if (!handle || !['ArrowUp','ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const card = handle.closest('[data-tournament-id]'), list = card.parentElement;
  const sibling = e.key === 'ArrowUp' ? card.previousElementSibling : card.nextElementSibling;
  if (!sibling) return;
  if (e.key === 'ArrowUp') list.insertBefore(card, sibling); else list.insertBefore(sibling, card);
  saveTournamentOrder(list); handle.focus();
  card.scrollIntoView({block:'nearest'});
});
document.addEventListener('pointerdown', e => {
  const handle=e.target.closest('.drag-handle');
  if(!handle||e.button!==0||!e.isPrimary)return;
  const card=handle.closest('[data-tournament-id]');if(!card)return;
  e.preventDefault();
  const list=card.parentElement, original=Array.from(list.children);
  const grabOffset=e.clientY-card.getBoundingClientRect().top;
  let y=e.clientY, frame, active=true;
  card.classList.remove('settling');card.classList.add('is-dragging');
  handle.setPointerCapture(e.pointerId);
  function position(){
    const naturalTop=card.getBoundingClientRect().top-(parseFloat(card.dataset.dragOffset)||0);
    const offset=y-grabOffset-naturalTop;
    card.dataset.dragOffset=offset;card.style.transform=`translateY(${offset}px)`;
  }
  function update(){
    position();
    const rect=card.getBoundingClientRect(),mid=rect.top+rect.height/2;
    const siblings=Array.from(list.children);
    const target=siblings.find(el=>{if(el===card)return false;const r=el.getBoundingClientRect();return mid>r.top&&mid<r.bottom;});
    if(target){
      const beforeTop=card.getBoundingClientRect().top;
      if(siblings.indexOf(card)<siblings.indexOf(target))list.insertBefore(card,target.nextSibling);else list.insertBefore(card,target);
      // Keep the visual card anchored to the finger when its layout slot changes.
      const shift=beforeTop-card.getBoundingClientRect().top;
      const offset=(parseFloat(card.dataset.dragOffset)||0)+shift;
      card.dataset.dragOffset=offset;card.style.transform=`translateY(${offset}px)`;
    }
  }
  function move(event){if(event.pointerId!==e.pointerId)return;y=event.clientY;update();}
  function tick(){if(!active)return;if(y<90)window.scrollBy(0,-8);else if(y>window.innerHeight-112)window.scrollBy(0,8);update();frame=requestAnimationFrame(tick);}
  function finish(event){
    if(!active)return;active=false;cancelAnimationFrame(frame);
    if(event.type==='pointercancel'){original.forEach(el=>list.appendChild(el));position();}else saveTournamentOrder(list);
    card.classList.remove('is-dragging');card.classList.add('settling');card.style.transform='translateY(0px)';delete card.dataset.dragOffset;
    document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',finish);document.removeEventListener('pointercancel',finish);handle.removeEventListener('lostpointercapture',finish);
    if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
    setTimeout(()=>{if(!card.classList.contains('is-dragging')){card.classList.remove('settling');card.style.transform='';}},240);
  }
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);
  frame=requestAnimationFrame(tick);
});

render();
