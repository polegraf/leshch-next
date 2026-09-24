'use strict';
/* Событие: БИЛДЕР (собрать с нуля, шаг за шагом) и МОНИТОР (следить и править всё на месте).
   Билдер: Основа → Площадка → Лайн-ап → Команда → Деньги → Проверка. Добавленные люди попадают в шорт-лист,
   офферы уходят одним действием в конце. Монитор: Сводка · Люди · Деньги · День — каждая строка открывает
   карточку с правкой, в каждой вкладке есть «Добавить». Любой шаг билдера доступен из монитора («Настроить»). */
(()=>{
const A='../digital-jazz-unified/assets/';
const TODAY=new Date(2026,8,23);
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD=['вс','пн','вт','ср','чт','пт','сб'];
const dm=d=>`${d.getDate()} ${MON[d.getMonth()]}`;
const days=(a,b)=>Math.round((b-a)/864e5);
const rub=n=>Math.round(n||0).toLocaleString('ru-RU')+' ₽';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?b:c;
const num=v=>Number(String(v??'').replace(/[^\d]/g,''))||0;
const uid=()=>Math.random().toString(36).slice(2,9);
const iso=d=>d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';
const addMin=(t,m)=>{const [h,mm]=t.split(':').map(Number),x=(h*60+mm+m)%1440;return `${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`;};

/* ---------------- каталог Digital Jazz ---------------- */
const CAT={
 artist:[...[['Нокс','a'],['Вольт','b'],['Лофи','c'],['Грув','d'],['Рифф','e'],['Эхо','f'],['Хэт','g'],['Сэмпл','h']].map(([n,l])=>({name:n,role:'Артист · Digital Jazz Cup',img:A+'portraits/participant-'+l+'.png',city:'Москва'})),
  ...[['Судья Вектор','Диджей','tactics','Москва'],['Судья Спектр','Диджей','chagin','Москва'],['Судья Контур','Композитор','iv','Санкт-Петербург'],['Судья Пульс','Битмейкер','mclis','Москва'],['Судья Искра','Вокалист','arina','Санкт-Петербург']].map(([n,r,k,c])=>({name:n,role:r,img:A+'portraits/judge-'+k+'.png',city:c}))],
 crew:[['Такт','Продюсер'],['Фейдер','Звукорежиссёр'],['Сайд','Мониторный инженер'],['Луч','Световой инженер'],['Кью','Стейдж-менеджер'],['Кадр','Видеоинженер'],['Форма','Художник-постановщик']].map(([n,r])=>({name:n,role:r,city:'Москва'})),
 vendor:[['Звуковой склад','Звук'],['Сценический прокат','Сцена и свет'],['DJ-комплект','DJ-оборудование'],['Периметр','Охрана'],['Вкус','Кейтеринг'],['Барная линия','Бар'],['Конструкция','Монтаж сцены'],['Чистая смена','Клининг'],['Маршрут','Логистика']].map(([n,r])=>({name:n,role:r,city:'Москва'})),
 venue:[{name:'Цех 01',role:'Площадка',cap:350,city:'Москва'},{name:'16 Тонн',role:'Клуб',city:'Москва'},{name:'Atlas Club',role:'Клуб',city:'Москва'},{name:'ARCHILOFT',role:'Лофт',city:'Москва'},{name:'Aglomerat',role:'Площадка',city:'Москва'},{name:'90Floor',role:'Площадка',city:'Москва'},{name:'Art House',role:'Клуб',city:'Раменское'}]};
const GROUP={venue:'Площадка',artist:'Артисты',crew:'Команда',vendor:'Подрядчики'};
const ONE={venue:'площадку',artist:'артиста',crew:'человека в команду',vendor:'подрядчика'};
const FEE_LABEL={venue:'Аренда',artist:'Гонорар',crew:'Гонорар',vendor:'Смета'};
/* роли, которые обычно нужны, — по типу события */
const ROLES={crew:['Продюсер','Звукорежиссёр','Световой инженер','Стейдж-менеджер'],vendor:['Звук','Охрана','Бар','Клининг']};
const ROLES_BIG={crew:['Продюсер','Звукорежиссёр','Мониторный инженер','Световой инженер','Стейдж-менеджер','Видеоинженер','Художник-постановщик'],vendor:['Звук','Сцена и свет','DJ-оборудование','Охрана','Кейтеринг','Бар','Монтаж сцены','Клининг','Логистика']};
/* ---------------- райдеры и запросы ---------------- */
/* Райдер приходит тремя путями: из профиля артиста в Digital Jazz (сразу), по запросу вместе с оффером (артист загружает),
   или организатор вставляет текст — разбор ниже раскладывает строки на технику, бытовое и заметки. */
const PROFILE_RIDERS={"Нокс": {"f": "DJ-сет", "t": [["cdj", "CDJ-3000", 2], ["mixer", "DJM-900NXS2", 1], ["monitor", "Сценический монитор", 1]], "h": ["Вода без газа — 2 бутылки", "Закрываемая гримёрная"], "n": "Саундчек 20 минут. USB-носители и наушники привозит артист."}, "Вольт": {"f": "DJ-сет на четырёх деках", "t": [["cdj", "CDJ-3000", 4], ["mixer", "DJM-900NXS2", 1], ["monitor", "Сценический монитор", 2]], "h": ["Вода без газа — 4 бутылки", "Питание для 2 человек, предпочтения уточнить"], "n": "Саундчек 30 минут. Четыре проигрывателя обязательны; замены согласовать."}, "Лофи": {"f": "Электронный live", "t": [["stereo-di", "Стерео DI-box", 1], ["monitor", "Сценический монитор", 1], ["table", "Стол для оборудования", 1]], "h": ["Вода без газа — 2 бутылки", "Место для хранения кейсов"], "n": "Саундчек 30 минут. Ноутбук, контроллер и интерфейс привозит артист."}, "Грув": {"f": "Вокал и битбокс", "t": [["sm58", "Shure SM58", 2], ["micstand", "Микрофонная стойка", 2], ["monitor", "Сценический монитор", 2]], "h": ["Вода комнатной температуры — 4 бутылки", "Тихое помещение для разминки"], "n": "Саундчек 25 минут. Два отдельных микрофонных канала."}, "Эхо": {"f": "Вокальный сет", "t": [["sm58", "Shure SM58", 1], ["micstand", "Микрофонная стойка", 1], ["stereo-di", "Стерео DI-box", 1], ["monitor", "Сценический монитор", 2]], "h": ["Вода комнатной температуры — 2 бутылки", "Отдельная гримёрная"], "n": "Саундчек 25 минут. Фонограммы предоставляет артист."}, "Хэт": {"f": "Барабанный live", "t": [["drumkit", "Ударная установка", 1], ["drum-mics", "Комплект микрофонов для барабанов", 1], ["monitor", "Сценический монитор", 2]], "h": ["Вода без газа — 4 бутылки", "Полотенца — 2 штуки"], "n": "Монтаж 45 минут, саундчек 40 минут. Состав установки согласовать; палочки привозит артист."}, "Сэмпл": {"f": "Сэмплерный live", "t": [["stereo-di", "Стерео DI-box", 2], ["table", "Стол для оборудования", 1], ["monitor", "Сценический монитор", 1]], "h": ["Вода без газа — 2 бутылки", "Место для хранения оборудования"], "n": "Саундчек 30 минут. Сэмплеры и блоки питания привозит артист."}};
const DICT=[['power','Линия 220 В у сцены',/220|розетк|электропит/i,'Площадка'],['cdj','CDJ-3000',/cdj|проигрыват/i,'DJ-оборудование'],['mixer','DJM-900NXS2',/djm|микшер/i,'DJ-оборудование'],['sm58','Shure SM58',/sm\s?58/i,'Звук'],['sm57','Shure SM57',/sm\s?57/i,'Звук'],['drum-mics','Комплект микрофонов для барабанов',/микрофон\S* (для|на) барабан/i,'Звук'],['micstand','Микрофонная стойка',/стойк/i,'Звук'],['stereo-di','Стерео DI-box',/\bdi\b|di-box|ди-бокс/i,'Звук'],['monitor','Сценический монитор',/монитор|wedge/i,'Звук'],['guitar-amp','Гитарный усилитель',/комбо|усилител|\bamp\b|fender|marshall/i,'Сцена и свет'],['drumkit','Ударная установка',/ударн|барабан/i,'Сцена и свет'],['table','Стол для оборудования',/стол/i,'Сцена и свет']];
const HOSP=[[/вода|напит|чай|кофе/i,'Бар'],[/питани|еда|ужин|кейтер/i,'Кейтеринг'],[/гримёр|гример|помещени|хранени|кейс|полотен/i,'Площадка'],[/трансфер|такси|отел|прожив/i,'Логистика']];
const NOTE=/саундчек|монтаж|привоз|согласовать|предоставляет/i;
function parseRider(text){const tech=[],hosp=[],notes=[],unknown=[];
 text.split(/\n+/).map(l=>l.trim()).filter(Boolean).forEach(line=>{const m=line.match(/(?:[x×х*]\s*(\d+))|(\d+)\s*(?:шт|штук|pcs|бут)|[—–-]\s*(\d+)\s*$|\s(\d+)\s*$/i);const qty=m?+(m[1]||m[2]||m[3]||m[4]):1;
  const d=DICT.find(x=>x[2].test(line));if(d){tech.push([d[0],d[1],qty,line]);return;}
  if(HOSP.some(h=>h[0].test(line))){hosp.push(line);return;}
  if(NOTE.test(line)){notes.push(line);return;}unknown.push(line);});
 return {tech,hosp,notes,unknown};}
const VENUE_KIT={'Цех 01':{monitor:4,sm58:2,micstand:4,table:2}};
const BASE_REQ={Звук:'Порталы и сабы на 350 гостей, пульт FOH, мониторная линия',ДЖ:'',Охрана:'Посты: вход, сцена, бар · с 17:30 до 02:00',Бар:'Бар на 350 гостей, 3 бармена · вода на сцену',Кейтеринг:'Питание команды и артистов на 35 человек',Клининг:'Смена во время события и после демонтажа','Сцена и свет':'Свет сцены, ферма, операторская позиция',Логистика:'Трансфер артистов: аэропорт/вокзал — площадка',Монтаж:''};

/* продвижение: каналы с промокодом — по коду видно, какой канал продаёт */
const CHANNELS=[['Соцсети Digital Jazz','Свои','DJ',0],['Артисты у себя','Свои','ART',0],['Рассылка прошлым гостям','Свои','MAIL',2000],['Telegram-каналы · посевы','Платные','TG',15000],['Таргет ВКонтакте','Платные','VK',20000],['Яндекс Директ','Платные','YA',15000],['Яндекс Афиша и KudaGo','Афиши','AF',0],['Медиа-партнёр','Партнёры','MED',0],['Промоутеры · флаеры','Офлайн','PRM',8000]];
const ASSETS=[['poster','Афиша 1:1 и 9:16'],['teaser','Тизер-видео 15 секунд'],['press','Пресс-релиз'],['photos','Фото и био артистов'],['links','Ссылки и промокоды по каналам']];
function assetState(k){const a=E.assets||{},A=list('artist');
 if(k==='poster')return a.poster?[1,a.poster==='gen'?'собрана из обложки и лайн-апа':'загружена своя']:[0,E.cover?'соберём из обложки за секунду':'сначала выбери обложку'];
 if(k==='teaser')return a.teaser?[1,a.teaser.name||a.teaser.url]:[0,'не загружено'];
 if(k==='press')return a.press?[1,'готов · '+a.press.split(/\s+/).length+' слов']:[0,'черновик соберём из данных события'];
 if(k==='photos'){const ok=A.filter(p=>p.img).length;return [A.length&&ok===A.length?1:0,A.length?`${ok} из ${A.length} из профилей`+(ok<A.length?' · остальных запросим':''):'нет артистов'];}
 if(k==='links'){const n=(E.channels||[]).length;return [n?1:0,n?`${n} ${plural(n,'ссылка','ссылки','ссылок')} с промокодами — создаются сами`:'появятся, когда выберешь каналы'];}}
function materials(){const done=ASSETS.filter(([k])=>assetState(k)[0]).length;
 return `<ul class="card eb-assets">${ASSETS.map(([k,l])=>{const [ok,t]=assetState(k);return `<li><button type="button" data-cmd="asset:${k}"><span class="eb-ck${ok?' ok':''}" aria-hidden="true">${ok?'✓':''}</span><span class="eb-need-t"><b>${l}</b><small>${esc(t)}</small></span><span class="eb-mini">${ok?'Открыть':k==='teaser'?'Загрузить':k==='photos'||k==='links'?'Открыть':'Собрать'}</span></button></li>`;}).join('')}</ul>`;}
/* макеты постов: тип по теме публикации, собираются из данных события — обложка, лайн-ап, сет-тайм, билеты */
function postKind(p){const t=p.t||'';return /^Анонс/.test(t)?'poster':/Лайн-ап/i.test(t)?'lineup':/Сет-тайм/i.test(t)?'times':/Старт продаж/i.test(t)?'sale':/Последние|заканчиваются/i.test(t)?'tickets':/^Сегодня/i.test(t)?'today':/Фото|видео/i.test(t)?'after':'poster';}
function postMock(p,cls=''){if(p.own)return `<div class="eb-mock own ${cls}"><span>Свой макет</span><small>${esc(p.own)}</small></div>`;
 const k=postKind(p),A=list('artist'),bg=E.cover?`<img src="${coverSrc(E.cover)}" alt="">`:'',date=E.date?dm(E.date):'дата',left=Math.max(0,cap()-soldTotal());
 const body={poster:`${bg}<div class="eb-mock-c"><span>Digital Jazz</span><b>${esc(E.name)}</b><em>${date} · ${esc(venue()?.name||E.city)}</em></div>`,
  lineup:`<div class="eb-mock-grid">${A.slice(0,4).map(a=>a.img?`<img src="${a.img}" alt="">`:`<i>${esc(a.name[0])}</i>`).join('')}</div><div class="eb-mock-c"><span>Лайн-ап</span><b>${A.slice(0,4).map(a=>esc(a.name)).join(' · ')||'Лайн-ап'}</b><em>${date}</em></div>`,
  times:`<div class="eb-mock-c top"><span>Сет-тайм · ${date}</span><ul>${sets().slice(0,6).map(a=>`<li><b>${a.set}</b> ${esc(a.name)}</li>`).join('')||'<li>сеты появятся</li>'}</ul></div>`,
  sale:`${bg}<div class="eb-mock-c"><span>Билеты в продаже</span><b>${E.price?'от '+rub(E.price):'Регистрация'}</b><em>${esc(E.name)} · ${date}</em></div>`,
  tickets:`<div class="eb-mock-c mid"><span>${esc(E.name)}</span><b class="big">${E.sales&&E.sales.length?'Осталось '+left:'Последние билеты'}</b><em>${date}</em></div>`,
  today:`${bg}<div class="eb-mock-c"><span>Сегодня</span><b>Двери ${E.start}</b><em>${esc(venue()?.name||E.city)}</em></div>`,
  after:`<div class="eb-mock-c mid dashed"><span>После вечера</span><b>Фото и видео</b><em>загрузит фотограф</em></div>`}[k];
 return `<div class="eb-mock ${k} ${cls}">${body}</div>`;}
function captionFor(p){const k=postKind(p),A=list('artist').map(a=>a.name).join(', ');return {poster:`${E.name} — ${E.date?dm(E.date):'скоро'}, ${venue()?.name||E.city}. Лайн-ап и билеты — по ссылке в профиле.`,lineup:`Кто играет на ${E.name}: ${A}. ${E.date?dm(E.date):''}.`,times:`Сет-тайм ${E.name}: ${sets().map(a=>a.set+' '+a.name).join(', ')}. Двери в ${E.start}.`,sale:`Билеты на ${E.name} уже в продаже${E.price?' — от '+rub(E.price):''}. Ранние — ограничены.`,tickets:`Последние билеты на ${E.name}. Дальше — только на входе, если останутся.`,today:`Сегодня! ${E.name}, двери в ${E.start}. Увидимся.`,after:`Спасибо, что были с нами на ${E.name}. Ищите себя на фото.`}[k];}
function pressDraft(){const A=list('artist').map(p=>p.name);return `${E.name} — ${E.type.toLowerCase()} Digital Jazz${E.date?' '+dm(E.date):''}${venue()?' в '+venue().name:''}, ${E.city}. Начало в ${E.start}.\n\nВ лайн-апе: ${A.join(', ')||'объявим скоро'}.\n\n${E.ticketMode==='sale'&&E.price?'Билеты от '+rub(E.price)+' — на digitaljazz.ru/e/'+E.id+'.':'Вход свободный по регистрации.'}\n\nКонтакт для прессы: Digital Jazz, press@digitaljazz.ru`;}
function planPosts(E){const A=E.announce,D=E.date;if(!A||!D)return [];const at=(base,dd)=>new Date(base.getTime()+dd*864e5);
 return [[A,0,'Анонс: дата, площадка, хедлайнер','Соцсети · Telegram'],[A,0,'Старт продаж · ранние билеты','Соцсети · Рассылка'],[A,6,'Лайн-ап целиком','Соцсети · артисты'],[D,-14,'Ранние билеты заканчиваются','Соцсети · Telegram'],[D,-7,'Сет-тайм и как добраться','Соцсети'],[D,-2,'Последние билеты','Все каналы'],[D,0,'Сегодня: двери '+E.start,'Соцсети · сторис'],[D,3,'Фото и видео с вечера','Соцсети · артисты']]
  .map(([b,dd,t,ch])=>({id:uid(),d:at(b,dd),t,ch,who:'Ты',st:'plan'}));}
const COVERS=['jazz-band','yeti-djs','zombie-djs','vinyl-bite','pool-party','aliens-pool','stripes-arch','stripes-planet'];
const TYPES=['Вечеринка','Концерт','Фестиваль','Лекция','Частное'];
const ZONES_BASE=['Вход','Бар','Штаб'];
const zones=()=>[...(E.scenes||[]).map(s=>s.n),...ZONES_BASE];
const COST_G=['Продвижение','Техника','Печать','Транспорт','Прочее'];

/* ---------------- события ---------------- */
const riderFor=n=>{const r=PROFILE_RIDERS[n];return r&&n!=='Рифф'?{src:'profile',f:r.f,t:r.t.map(x=>[...x]),h:[...r.h],n:r.n}:null;};
function demo(){const E={reqOver:{},id:'demo',name:'Digital Jazz Night',type:'Фестиваль',date:new Date(2026,9,24),start:'18:00',end:'23:30',city:'Москва',cover:'jazz-band',announce:new Date(2026,9,3),ticketMode:'reg',price:1800,reserve:.1,people:[],costs:[],incomes:[],stages:[],slots:{crew:[...ROLES_BIG.crew],vendor:[...ROLES_BIG.vendor]}};
 const P=o=>E.people.push({id:uid(),paid:0,wait:'',...o});
 P({group:'venue',name:'Цех 01',role:'Площадка',cap:350,fee:60000,stage:0,paid:5000,wait:'Ждём подписанный договор и точный адрес'});
 E.scenes=[{id:'main',n:'Главная сцена'},{id:'small',n:'Малая сцена'}];
 const SC={Нокс:['main','18:30'],Вольт:['main','19:30'],Грув:['main','20:30'],Хэт:['main','21:30'],Лофи:['small','19:00'],Рифф:['small','20:00'],Эхо:['small','21:00'],Сэмпл:['small','22:00']};
 CAT.artist.slice(0,8).forEach((a,i)=>P({group:'artist',name:a.name,role:'Артист',img:a.img,scene:SC[a.name][0],set:SC[a.name][1],len:50,fee:15000,stage:a.name==='Рифф'?0:2,paid:[2,5].includes(i)?5000:0,wait:a.name==='Рифф'?'Думает над оффером':'',rider:riderFor(a.name),riderAsked:a.name==='Рифф'?'20 сен':''}));
 CAT.crew.forEach((c,i)=>P({group:'crew',name:c.name,role:c.role,fee:15000,stage:['Сайд','Такт'].includes(c.name)?0:2,paid:[0,3,6].includes(i)?5000:0,wait:['Сайд','Такт'].includes(c.name)?'Не ответил на оффер':''}));
 CAT.vendor.forEach((c,i)=>P({group:'vendor',name:c.name,role:c.role,fee:25000,stage:c.name==='Вкус'?0:2,paid:[2,5,8].includes(i)?5000:0,wait:c.name==='Вкус'?'Ждём смету по питанию команды':''}));
 [['Печать','Навигация и бейджи',8000]].forEach(([g,n,a])=>E.costs.push({id:uid(),g,n,a}));
 E.incomes.push({id:uid(),n:'Городской звук',kind:'Спонсор',a:150000,ok:false});
 E.channels=[['Соцсети Digital Jazz','Свои','DJ',12000],['Таргет ВКонтакте','Платные','VK',30000],['Рассылка прошлым гостям','Свои','MAIL',2000],['Артисты у себя','Свои','ART',0],['Медиа-партнёр','Партнёры','MED',0]].map(([k,kind,code,budget])=>({id:uid(),k,kind,code,budget,sold:0,note:k==='Медиа-партнёр'?'«Музыкальная среда» · две публикации':''}));
 E.reqSt={'Звуковой склад':'ok','DJ-комплект':'sent'};E.posts=planPosts(E);E.posts[0].st='ready';E.assets={poster:'gen'};E.sales=[];
 [['09:00','09:30','Приёмка площадки','Главная сцена','Такт'],['09:30','12:00','Монтаж сцены, звука и света','Главная сцена','Кью'],['09:30','11:30','Монтаж малой сцены','Малая сцена','Форма'],['12:00','14:00','Саундчеки','Главная сцена','Фейдер',1],['12:00','14:00','Саундчеки','Малая сцена','Сайд',1],['16:30','17:00','Брифинг команды','Штаб','Такт'],['18:00','18:30','Двери · вход гостей','Вход','Периметр'],['18:00','23:30','Бар и питание','Бар','Барная линия'],['23:30','02:00','Демонтаж и сдача площадки','Главная сцена','Кью']]
  .forEach(([t,e,n,z,w,sc])=>E.stages.push({id:uid(),t,e,n,z,who:w,soundcheck:!!sc}));
 return E;}
function blank(){return {scenes:[{id:'main',n:'Главная сцена'}],assets:{},reqSt:{},reqOver:{},channels:[],posts:[],assets:{},sales:[],id:uid(),name:'',type:'Вечеринка',date:null,start:'23:00',end:'06:00',city:'Москва',cover:null,announce:null,ticketMode:'sale',price:0,reserve:.1,people:[],costs:[],incomes:[],stages:[],slots:{crew:[...ROLES.crew],vendor:[...ROLES.vendor]},fresh:true};}
function demoSale(){const E={reqSt:{'Звуковой склад':'ok','Периметр':'ok','Барная линия':'ok',Вкус:'ok'},reqOver:{},id:'sale',name:'Digital Jazz Session',type:'Концерт',date:new Date(2026,9,3),start:'20:00',end:'23:30',city:'Москва',cover:'stripes-planet',announce:new Date(2026,8,5),ticketMode:'sale',price:1500,reserve:.1,scenes:[{id:'main',n:'Сцена'}],people:[],costs:[],incomes:[],stages:[],slots:{crew:[...ROLES.crew],vendor:[...ROLES.vendor]}};
 const P=o=>E.people.push({id:uid(),paid:0,wait:'',...o});
 P({group:'venue',name:'16 Тонн',role:'Клуб',cap:250,fee:50000,paid:50000,stage:2});
 [CAT.artist[2],CAT.artist[5],CAT.artist[12]].forEach((a,i)=>P({group:'artist',scene:'main',len:45,rider:riderFor(a.name)||{src:'text',f:'Вокальный сет',t:[['sm58','Shure SM58',1],['micstand','Микрофонная стойка',1],['monitor','Сценический монитор',1]],h:['Вода комнатной температуры — 2 бутылки'],n:''},name:a.name,role:'Артист',img:a.img,set:addMin('20:30',i*50),fee:20000,paid:10000,stage:2}));
 [['Фейдер','Звукорежиссёр'],['Кью','Стейдж-менеджер']].forEach(([n,r])=>P({group:'crew',name:n,role:r,fee:12000,stage:2}));
 [['Периметр','Охрана'],['Барная линия','Бар']].forEach(([n,r])=>P({group:'vendor',name:n,role:r,fee:18000,stage:2}));
 E.sales=[21,8,6,5,4,6,3,4,5,4,7,11,5,4,3,8,10,13];
 const sold={DJ:31,VK:36,TG:28,ART:22,AF:4};
 E.channels=[['Соцсети Digital Jazz','Свои','DJ',8000],['Таргет ВКонтакте','Платные','VK',25000],['Telegram-каналы · посевы','Платные','TG',15000],['Артисты у себя','Свои','ART',0],['Яндекс Афиша и KudaGo','Афиши','AF',0]].map(([k,kind,code,budget])=>({id:uid(),k,kind,code,budget,sold:sold[code]}));
 E.posts=planPosts(E);E.posts.forEach(p=>{if(p.d<TODAY)p.st='out';});E.posts[3].st='plan';E.assets={poster:'gen',teaser:{name:'teaser-session.mp4'},press:null};
 [['18:00','19:30','Монтаж и саундчек','Сцена','Кью',1],['19:30','20:00','Двери · вход гостей','Вход','Периметр']].forEach(([t,e,n,z,w,sc])=>E.stages.push({id:uid(),t,e,n,z,who:w,soundcheck:!!sc}));
 return E;}
const ART=n=>CAT.artist.find(a=>a.name===n);
const mk=(o)=>({...blank(),fresh:false,...o});
/* почти солдаут: через 3 дня, всё подписано и оплачено */
function demoYeti(){const E=mk({id:'yeti',name:'Yeti Disco',type:'Вечеринка',date:new Date(2026,8,26),start:'23:00',end:'06:00',cover:'yeti-djs',announce:new Date(2026,7,29),price:1800,scenes:[{id:'main',n:'Танцпол'}],reqSt:{'16 Тонн':'ok','Звуковой склад':'ok','DJ-комплект':'ok','Периметр':'ok','Барная линия':'ok','Чистая смена':'ok'}});
 const P=o=>E.people.push({id:uid(),paid:0,wait:'',...o});
 P({group:'venue',name:'16 Тонн',role:'Клуб',cap:300,fee:70000,paid:70000,stage:2});
 [['Нокс','23:30'],['Вольт','01:00'],['Судья Вектор','02:30'],['Судья Спектр','04:00']].forEach(([n,t])=>{const a=ART(n);P({group:'artist',name:n,role:a.role,img:a.img,scene:'main',set:t,len:90,fee:18000,paid:18000,stage:2,rider:riderFor(n)||{src:'profile',f:'DJ-сет',t:[['cdj','CDJ-3000',2],['mixer','DJM-900NXS2',1],['monitor','Сценический монитор',1]],h:['Вода без газа — 2 бутылки'],n:''}});});
 [['Такт','Продюсер'],['Фейдер','Звукорежиссёр'],['Луч','Световой инженер'],['Кью','Стейдж-менеджер']].forEach(([n,r])=>P({group:'crew',name:n,role:r,fee:12000,paid:12000,stage:2}));
 [['Звуковой склад','Звук'],['DJ-комплект','DJ-оборудование'],['Периметр','Охрана'],['Барная линия','Бар'],['Чистая смена','Клининг']].forEach(([n,r])=>P({group:'vendor',name:n,role:r,fee:20000,paid:20000,stage:2}));
 E.sales=[34,12,9,7,6,5,8,6,4,5,7,6,9,11,6,5,7,8,10,12,9,14,16,18,22];
 const sold={DJ:58,VK:74,TG:41,ART:39,MAIL:22};
 E.channels=[['Соцсети Digital Jazz','Свои','DJ',10000],['Таргет ВКонтакте','Платные','VK',30000],['Telegram-каналы · посевы','Платные','TG',15000],['Артисты у себя','Свои','ART',0],['Рассылка прошлым гостям','Свои','MAIL',2000]].map(([k,kind,code,budget])=>({id:uid(),k,kind,code,budget,sold:sold[code]}));
 E.posts=planPosts(E);E.posts.forEach(p=>{p.st=p.d<TODAY?'out':'ready';});E.assets={poster:'gen',teaser:{name:'yeti-teaser.mp4'},press:'Yeti Disco — ночь диско и хауса в 16 Тонн.'};
 [['20:00','21:30','Монтаж и саундчек','Танцпол','Кью',1],['22:00','22:30','Брифинг команды','Штаб','Такт'],['23:00','23:30','Двери · вход гостей','Вход','Периметр'],['23:00','05:30','Бар','Бар','Барная линия'],['05:30','06:00','Закрытие и выход гостей','Вход','Периметр']].forEach(([t,e,n,z,w,sc])=>E.stages.push({id:uid(),t,e,n,z,who:w,soundcheck:!!sc}));
 return E;}
/* середина подготовки: площадка подписана, лайн-ап не весь, анонс через месяц */
function demoPool(){const E=mk({id:'pool',name:'Neon Pool',type:'Вечеринка',date:new Date(2026,10,14),start:'16:00',end:'23:00',cover:'pool-party',announce:new Date(2026,9,24),price:2000,scenes:[{id:'main',n:'У бассейна'},{id:'roof',n:'Крыша'}],reqSt:{ARCHILOFT:'sent','Барная линия':'ok'}});
 const P=o=>E.people.push({id:uid(),paid:0,wait:'',...o});
 P({group:'venue',name:'ARCHILOFT',role:'Лофт с бассейном',cap:400,fee:150000,paid:45000,stage:2});
 [['Лофи','main','16:30',2],['Эхо','main','18:00',2],['Грув','roof','19:00',1],['Судья Искра','main','20:30',0]].forEach(([n,sc,t,st])=>{const a=ART(n);P({group:'artist',name:n,role:a.role,img:a.img,scene:sc,set:t,len:75,fee:25000,paid:st>=2?8000:0,stage:st,wait:st===0?'Ответит до 1 октября':'',rider:riderFor(n)});});
 [['Такт','Продюсер',2],['Фейдер','Звукорежиссёр',2],['Сайд','Мониторный инженер',0]].forEach(([n,r,st])=>P({group:'crew',name:n,role:r,fee:15000,stage:st,wait:st===0?'Не ответил на оффер':''}));
 [['Барная линия','Бар',2],['Периметр','Охрана',-1]].forEach(([n,r,st])=>P({group:'vendor',name:n,role:r,fee:30000,stage:st}));
 E.costs=[{id:uid(),g:'Прочее',n:'Надувные круги и декор бассейна',a:25000},{id:uid(),g:'Прочее',n:'Спасатель на смену',a:12000}];
 E.incomes=[{id:uid(),n:'Лаймовый тоник',kind:'Спонсор',a:80000,ok:true}];
 E.channels=[['Соцсети Digital Jazz','Свои','DJ',10000],['Таргет ВКонтакте','Платные','VK',40000],['Артисты у себя','Свои','ART',0]].map(([k,kind,code,budget])=>({id:uid(),k,kind,code,budget,sold:0}));
 E.posts=planPosts(E);E.assets={photos:true};
 [['12:00','15:00','Монтаж у бассейна','У бассейна','Такт'],['15:30','16:00','Двери · вход гостей','Вход','Периметр']].forEach(([t,e,n,z,w])=>E.stages.push({id:uid(),t,e,n,z,who:w}));
 return E;}
/* черновик: только идея, дата и площадка в шорт-листе */
function demoZombie(){const E={...blank(),id:'zombie',name:'Zombie Rave',type:'Вечеринка',date:new Date(2026,9,31),start:'23:00',end:'06:00',cover:'zombie-djs',announce:new Date(2026,9,10),price:0,fresh:true};
 E.people.push({id:uid(),group:'venue',name:'Atlas Club',role:'Клуб',cap:600,fee:0,paid:0,stage:-1,wait:''});
 ['Хэт','Сэмпл'].forEach((n,i)=>{const a=ART(n);E.people.push({id:uid(),group:'artist',name:n,role:a.role,img:a.img,scene:'main',set:addMin('23:30',i*95),len:90,fee:0,paid:0,stage:-1,wait:'',rider:riderFor(n)});});
 return E;}
const EVENTS=[demoYeti(),demoSale(),demo(),demoPool(),demoZombie()];
EVENTS.forEach(ev=>ev.people.forEach(norm));let E=EVENTS[2];

/* ---------------- расчёты ---------------- */
const venue=()=>E.people.find(p=>p.group==='venue');
const cap=()=>venue()?.cap||0;
const list=g=>E.people.filter(p=>p.group===g);
const waiting=()=>E.people.filter(p=>p.stage===0);
const shortlist=()=>E.people.filter(p=>p.stage===-1);
const cost=()=>{const deals=E.people.reduce((a,p)=>a+p.fee,0),other=E.costs.reduce((a,c)=>a+c.a,0)+promoBudget(),base=deals+other;return {deals,other,base,reserve:base*E.reserve,total:base*(1+E.reserve)};};
const promoBudget=()=>(E.channels||[]).reduce((a,c)=>a+c.budget,0);
const soldTotal=()=>(E.sales||[]).reduce((a,x)=>a+x,0);
const phase=()=>!E.announce||TODAY<E.announce?0:!E.date||TODAY<E.date?2:4;
const overdue=p=>p.st!=='out'&&p.d<TODAY;
/* сводная потребность: на одной сцене сеты идут подряд — одинаковая позиция считается по максимуму, не суммой */
const provFor=cat=>E.people.find(p=>p.group==='vendor'&&p.role===cat);
function needs(){const map=new Map();list('artist').filter(p=>p.rider).forEach(p=>{const sc=sceneOf(p.scene);p.rider.t.forEach(([k,l,q])=>{const o=map.get(k)||{key:k,label:l,qty:0,src:[],by:{}};o.by[sc.n]=Math.max(o.by[sc.n]||0,q);o.src.push(p.name);map.set(k,o);});});
 map.forEach(o=>{o.qty=Object.values(o.by).reduce((a,x)=>a+x,0);});
 const v=venue(),kit=v&&VENUE_KIT[v.name]||{};
 return [...map.values()].map(n=>{const ov=(E.reqOver||{})[n.key]||{};const qty=ov.qty??n.qty;const cat=(DICT.find(d=>d[0]===n.key)||[])[3]||'Звук';const fromVenue=Math.min(qty,kit[n.key]||0);
  let prov=ov.prov;if(!prov)prov=cat==='Площадка'&&v?v.name:fromVenue>=qty&&v?v.name:(provFor(cat)?.name||'');return {...n,qty,cat,fromVenue:prov===v?.name?qty:fromVenue,prov};});}
function hospNeeds(){const out=[];list('artist').filter(p=>p.rider).forEach(p=>p.rider.h.forEach(line=>{const h=HOSP.find(x=>x[0].test(line));const cat=h?h[1]:'Площадка';const prov=cat==='Площадка'?venue()?.name||'':provFor(cat)?.name||'';out.push({line,who:p.name,cat,prov});}));return out;}
function reqs(){const N=needs(),H=hospNeeds(),v=venue();const provs=[...(v?[v]:[]),...list('vendor')];
 return provs.map(p=>{const tech=N.filter(n=>n.prov===p.name||(p===v&&n.fromVenue&&n.prov!==p.name));const hosp=H.filter(h=>h.prov===p.name);const base=p.group==='venue'?'Техпаспорт площадки, электричество, гримёрные, график монтажа':BASE_REQ[p.role]||'';
  return {name:p.name,role:p.role,p,tech,hosp,base,st:(E.reqSt||{})[p.name]||'draft'};}).filter(r=>r.tech.length||r.hosp.length||r.base);}
const REQ_ST={draft:['Не отправлен',''],sent:['Ждём ответ','wait'],ok:['Подтверждено','ok'],change:['Нужна замена','od']};
const paidSum=()=>E.people.reduce((a,p)=>a+p.paid,0);
const income=all=>E.incomes.filter(i=>all||i.ok).reduce((a,i)=>a+i.a,0);
const breakEven=all=>E.price?Math.ceil(Math.max(0,cost().total-income(all))/E.price):null;
const tkey=t=>(t<'06:00'?'2':'1')+t;
const sceneOf=id=>(E.scenes||[]).find(s=>s.id===id)||(E.scenes||[])[0]||{id:'main',n:'Сцена'};
const setEnd=p=>addMin(p.set,p.len||45);
const sets=sc=>list('artist').filter(p=>p.set&&(!sc||sceneOf(p.scene).id===sc)).sort((a,b)=>tkey(a.set).localeCompare(tkey(b.set)));
/* пересечения сетов внутри одной сцены */
function clashes(){const out=[];(E.scenes||[]).forEach(sc=>{const L=sets(sc.id);for(let i=1;i<L.length;i++)if(tkey(L[i].set)<tkey(setEnd(L[i-1])))out.push([L[i-1],L[i],sc]);});return out;}
const deadline=()=>E.date?new Date(E.date.getTime()-7*864e5):null;

/* ---------------- интерфейс: состояние ---------------- */
let sheet=null,toast='',peopleFilter='all',zone='Все',sold=0;
const route=()=>{const h=location.hash.slice(1)||'summary';const b=h.match(/^build\/(\d)$/);return b?{v:'build',step:+b[1]}:{v:['events','summary','place','people','req','promo','money','day'].includes(h)?h:'summary'};};
const coverSrc=c=>c?'covers/'+c+'.jpg':null;
const avaColor=s=>1+[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%6;
const ava=(p,cls='')=>p.img?`<img class="eb-ava ${cls}" src="${p.img}" alt="">`:`<span class="eb-ava eb-ava-i ${cls}" style="background:var(--dj-avatar-${avaColor(p.name||'?')})" aria-hidden="true">${esc((p.name||'?')[0])}</span>`;
const plus='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const addBtn=(label,cmd)=>`<button type="button" class="eb-add" data-cmd="${cmd}">${plus}${label}</button>`;

/* ================= БИЛДЕР ================= */
const STEPS=['Основа','Площадка','Лайн-ап','Команда','Запросы','Деньги','Продвижение','Проверка'];
function stepDone(i){return [!!E.name&&!!E.date,!!venue(),list('artist').length>0,E.slots.crew.concat(E.slots.vendor).every(r=>E.people.some(p=>p.role===r))&&E.people.some(p=>p.group==='crew'),reqs().length>0&&reqs().every(r=>r.st!=='draft')&&list('artist').every(p=>p.rider),E.ticketMode==='reg'||E.price>0,(E.channels||[]).length>0&&(E.posts||[]).length>0,false][i];}
function build(step){const monitor=!E.fresh;
 const head=`<div class="eb-bhead">${monitor?`<a class="eb-back plain" href="#summary">← К монитору</a>`:`<a class="eb-back plain" href="#events">← Мои события</a>`}<span class="caption">${monitor?'Настройка события':'Новое событие'}</span></div>
 <nav class="eb-bsteps" aria-label="Шаги">${STEPS.map((s,i)=>`<a href="#build/${i}" class="${i===step?'now':''}${stepDone(i)?' done':''}"${i===step?' aria-current="step"':''}><i aria-hidden="true">${stepDone(i)?'✓':i+1}</i>${s}</a>`).join('')}</nav>
 <h1 class="eb-h1">${STEPS[step]}</h1>`;
 const body=[bBasic,bVenue,bLineup,bTeam,bRequests,bMoney,bPromo,bReview][step]();
 const foot=step<7?`<div class="eb-bfoot">${step?`<a class="secondary-button eb-btn" href="#build/${step-1}">Назад</a>`:'<span></span>'}<button type="button" class="primary eb-btn" data-cmd="next:${step}">${step===6?'К проверке':'Дальше'}</button></div>`:'';
 return head+`<div class="eb-bbody">${body}</div>`+foot;}

function bBasic(){return `<label class="field"><span>Название</span><input class="input" data-bind="E.name" value="${esc(E.name)}" placeholder="Digital Jazz Night"></label>
 <fieldset class="eb-fs"><legend>Тип</legend><div class="eb-chips wrap">${TYPES.map(t=>`<button type="button" class="chip" data-set="type:${t}" aria-pressed="${E.type===t}">${t}</button>`).join('')}</div></fieldset>
 <div class="eb-two"><label class="field"><span>Дата</span><input class="input" type="date" data-bind="E.date" value="${iso(E.date)}"></label><label class="field"><span>Город</span><input class="input" data-bind="E.city" value="${esc(E.city)}"></label></div>
 <div class="eb-two"><label class="field"><span>Начало</span><input class="input" type="time" data-bind="E.start" value="${E.start}"></label><label class="field"><span>Конец</span><input class="input" type="time" data-bind="E.end" value="${E.end}"></label></div>
 <p class="caption">Нет даты — сохраним черновик, сроки появятся позже.</p>
 <fieldset class="eb-fs"><legend>Обложка</legend><div class="eb-covers">${COVERS.map(c=>`<button type="button" data-set="cover:${c}" aria-pressed="${E.cover===c}" aria-label="Обложка ${c}"><img src="${coverSrc(c)}" alt=""></button>`).join('')}<button type="button" class="eb-cover-up" data-cmd="demo">${plus}<span>Своя</span></button></div></fieldset>`;}

function pcard(p,extra=''){return `<div class="card eb-pcard">${ava(p)}<div class="eb-pcard-t"><b>${esc(p.name)}</b><small>${esc(p.role)}${p.cap?' · '+p.cap+' мест':''}</small></div><button type="button" class="eb-x" data-cmd="remove:${p.id}" aria-label="Убрать ${esc(p.name)}">×</button>${extra}</div>`;}
function bVenue(){const v=venue();
 return v?`${pcard(v,`<div class="eb-two eb-pcard-f"><label class="field"><span>Вместимость</span><input class="input" inputmode="numeric" data-bind="p:${v.id}.cap" value="${v.cap||''}"></label><label class="field"><span>Аренда, ₽</span><input class="input" inputmode="numeric" data-bind="p:${v.id}.fee" value="${v.fee||''}"></label></div>`)}<button type="button" class="secondary-button eb-btn eb-full" data-cmd="pick:venue">Выбрать другую</button>`
 :`<p class="secondary">Выбери из каталога Digital Jazz или добавь свою. Вместимость площадки — это потолок продаж.</p>${pickList('venue','')}<button type="button" class="text-button" data-cmd="manual:venue">Моей площадки нет в каталоге</button>`;}

function bLineup(){const multi=E.scenes.length>1,cl=clashes();
 return `<p class="secondary">${list('artist').length?'Время сета и гонорар — прямо в строке. Сеты сами встанут в тайминг своей сцены.':'Добавь артистов на сцену — время расставим подряд, поменяешь здесь же.'}</p>
 ${E.scenes.map(sc=>{const L=sets(sc.id).concat(list('artist').filter(p=>!p.set&&sceneOf(p.scene).id===sc.id));return `<section class="eb-sec"><div class="eb-scene-h"><b>${esc(sc.n)}</b><span class="caption">${L.length} ${plural(L.length,'сет','сета','сетов')}${L.length?' · '+L[0].set+'–'+setEnd(L[L.length-1]):''}</span><button type="button" class="eb-x" data-cmd="scene:${sc.id}" aria-label="Переименовать или убрать сцену">⋯</button></div>
 ${L.length?`<ul class="card eb-edit">${L.map(p=>`<li>${ava(p,'sm')}<span class="eb-edit-n">${esc(p.name)}</span><label><span class="visually-hidden">Сет ${esc(p.name)}</span><input class="input eb-t" type="time" data-bind="p:${p.id}.set" value="${p.set||''}"></label><label><span class="visually-hidden">Гонорар ${esc(p.name)}</span><input class="input eb-m" inputmode="numeric" data-bind="p:${p.id}.fee" value="${p.fee||''}" placeholder="₽"></label><button type="button" class="eb-x" data-cmd="remove:${p.id}" aria-label="Убрать">×</button></li>`).join('')}</ul>`:''}
 ${cl.filter(c=>c[2].id===sc.id).map(([x,y])=>`<p class="eb-warn">${esc(x.name)} до ${setEnd(x)} и ${esc(y.name)} с ${y.set} пересекаются</p>`).join('')}
 ${addBtn('Добавить артиста','pickscene:'+sc.id)}</section>`;}).join('')}
 <div class="eb-act-btns">${addBtn('Сцена','addscene')}<button type="button" class="text-button" data-cmd="manual:artist">Артиста нет в Digital Jazz</button></div>`;}
function bTeam(){const row=(g,r)=>{const p=E.people.find(x=>x.group===g&&x.role===r);return `<li class="${p?'on':''}"><span class="eb-slot-r">${esc(r)}</span>${p?`<button type="button" class="eb-slot-p" data-open="${p.id}">${ava(p,'sm')}${esc(p.name)}</button>`:`<button type="button" class="eb-mini" data-cmd="pick:${g}:${r}">Найти</button>`}<button type="button" class="eb-x" data-cmd="${p?'remove:'+p.id:'unslot:'+g+':'+r}" aria-label="${p?'Убрать':'Роль не нужна'}">×</button></li>`;};
 return `<p class="secondary">Роли, которые обычно нужны на ${E.type.toLowerCase()==='фестиваль'?'фестивале':'событии такого типа'}. Лишнее убери крестиком.</p>
 ${['crew','vendor'].map(g=>`<section class="eb-sec"><p class="eb-gt">${g==='crew'?'Люди':'Компании'}<span>${E.slots[g].filter(r=>E.people.some(p=>p.group===g&&p.role===r)).length} / ${E.slots[g].length}</span></p><ul class="card eb-slots">${E.slots[g].map(r=>row(g,r)).join('')}</ul>${addBtn('Своя роль','slot:'+g)}</section>`).join('')}`;}

function bMoney(){return `<fieldset class="eb-fs"><legend>Вход</legend><div class="seg eb-seg2">${[['sale','Продажа билетов'],['reg','Бесплатно']].map(([k,l])=>`<button type="button" data-set="ticketMode:${k}" aria-pressed="${E.ticketMode===k}">${l}</button>`).join('')}</div></fieldset>
 ${E.ticketMode==='sale'?`<div class="eb-two"><label class="field"><span>Цена билета, ₽</span><input class="input" inputmode="numeric" data-bind="E.price" value="${E.price||''}"></label><label class="field"><span>Мест</span><input class="input" value="${cap()||'нет площадки'}" disabled></label></div>`:''}
 <section class="eb-sec"><p class="eb-gt">Другие расходы<span data-calc="costsum">${rub(E.costs.reduce((a,c)=>a+c.a,0))}</span></p>${E.costs.length?`<ul class="card eb-edit">${E.costs.map(c=>`<li><input class="input eb-name" data-bind="c:${c.id}.n" value="${esc(c.n)}" aria-label="Статья"><input class="input eb-m" inputmode="numeric" data-bind="c:${c.id}.a" value="${c.a||''}" placeholder="₽" aria-label="Сумма"><button type="button" class="eb-x" data-cmd="delcost:${c.id}" aria-label="Удалить">×</button></li>`).join('')}</ul>`:''}${addBtn('Расход','addcost')}</section>
 <section class="eb-sec"><p class="eb-gt">Спонсоры и партнёры<span>${rub(income(true))}</span></p>${E.incomes.length?`<ul class="card eb-edit">${E.incomes.map(i=>`<li><input class="input eb-name" data-bind="i:${i.id}.n" value="${esc(i.n)}" aria-label="Название"><input class="input eb-m" inputmode="numeric" data-bind="i:${i.id}.a" value="${i.a||''}" placeholder="₽" aria-label="Сумма"><button type="button" class="eb-x" data-cmd="delinc:${i.id}" aria-label="Удалить">×</button></li>`).join('')}</ul>`:''}${addBtn('Спонсор','addinc')}</section>
 <div class="card eb-calc" data-calc="summary">${calcSummary()}</div>`;}
function calcSummary(){const c=cost(),be=breakEven(false);return `<div><span class="caption">Расходы с резервом 10%</span><b>${rub(c.total)}</b></div><div><span class="caption">Окупаемость</span><b>${E.ticketMode==='reg'?'<span class="eb-hot">нет билетов</span>':be===null?'—':be+' '+plural(be,'билет','билета','билетов')}</b>${cap()&&be>cap()?`<small class="eb-hot">больше, чем мест (${cap()})</small>`:''}</div>`;}

function bReview(){const sl=shortlist();const items=STEPS.slice(0,7).map((s,i)=>[s,stepDone(i),i]);
 return `<ul class="card eb-review">${items.map(([s,ok,i])=>`<li><a href="#build/${i}"><span class="eb-ck${ok?' ok':''}" aria-hidden="true">${ok?'✓':''}</span><span><b>${s}</b><small>${[E.date?`${dm(E.date)}, ${E.start}–${E.end} · ${E.city}`:'дата не выбрана',venue()?`${venue().name} · ${cap()} мест`:'не выбрана',`${list('artist').length} ${plural(list('artist').length,'артист','артиста','артистов')}`,`${list('crew').length+list('vendor').length} в команде`,`${list('artist').filter(p=>p.rider).length} из ${list('artist').length} райдеров · ${reqs().filter(r=>r.st!=='draft').length} из ${reqs().length} запросов отправлено`,E.ticketMode==='reg'?'вход бесплатный':E.price?`билет ${rub(E.price)}`:'цена не задана',`${(E.channels||[]).length} ${plural((E.channels||[]).length,'канал','канала','каналов')} · ${rub(promoBudget())} · ${(E.posts||[]).length} публикаций`][i]}</small></span><span class="eb-chev">→</span></a></li>`).join('')}</ul>
 ${sl.length?`<div class="card eb-send"><h2>Офферы</h2><p>${sl.length} ${plural(sl.length,'человек','человека','человек')} в шорт-листе: ${sl.map(p=>esc(p.name)).join(', ')}. Каждому уйдёт приглашение с датой, временем и суммой.</p><button type="button" class="primary eb-btn eb-full" data-cmd="sendall">Отправить офферы и открыть монитор</button><button type="button" class="text-button" data-cmd="finish">Открыть монитор, офферы позже</button></div>`:`<button type="button" class="primary eb-btn eb-full" data-cmd="finish">Открыть монитор</button>`}`;}

function bPromo(){const on=new Set(E.channels.map(c=>c.k));
 return `<p class="secondary">Где рассказываем о событии. У каждого канала свой промокод — в мониторе видно, какой канал продаёт билеты.</p>
 <section class="eb-sec"><p class="eb-gt">Каналы<span data-calc="promo">${rub(promoBudget())}</span></p><ul class="card eb-chan">${CHANNELS.map(([k,kind,code,b])=>{const c=E.channels.find(x=>x.k===k);return `<li class="${c?'on':''}"><button type="button" class="eb-tog" data-cmd="chan:${encodeURIComponent(k)}" aria-pressed="${!!c}" aria-label="${esc(k)}"><i></i></button><span class="eb-chan-t"><b>${esc(k)}</b><small>${kind} · код ${code}</small></span>${c?`<input class="input eb-m" inputmode="numeric" data-bind="ch:${c.id}.budget" value="${c.budget||''}" placeholder="0 ₽" aria-label="Бюджет ${esc(k)}">`:'<span></span>'}</li>`;}).join('')}</ul></section>
 <section class="eb-sec"><p class="eb-gt">Контент-план<span>${E.posts.length}</span></p>${E.posts.length?`<ul class="card eb-edit eb-posts">${E.posts.sort((a,b)=>a.d-b.d).map(p=>`<li><input class="input eb-d" type="date" data-bind="po:${p.id}.d" value="${iso(p.d)}" aria-label="Дата"><input class="input eb-name" data-bind="po:${p.id}.t" value="${esc(p.t)}" aria-label="Публикация"><button type="button" class="eb-x" data-cmd="delpost:${p.id}" aria-label="Удалить">×</button></li>`).join('')}</ul>${addBtn('Публикация','addpost')}`:`<div class="card eb-empty"><p class="secondary">${E.date?'Соберём 8 публикаций от даты анонса до фото после вечера — потом поправишь.':'Сначала выбери дату — план строится от неё.'}</p>${E.date?'<button type="button" class="primary eb-btn" data-cmd="plan">Собрать план по шаблону</button>':'<button type="button" class="secondary-button eb-btn" data-cmd="goto:0">Выбрать дату</button>'}</div>`}</section>
 <section class="eb-sec"><p class="eb-gt">Материалы<span>${ASSETS.filter(([k])=>assetState(k)[0]).length} / ${ASSETS.length}</span></p>${materials()}</section>`;}

/* ---- каталог: список с поиском ---- */
function pickList(group,role,q=''){const have=new Set(E.people.map(p=>p.name));const rows=CAT[group].filter(x=>(!role||x.role===role)&&(x.name+' '+x.role).toLowerCase().includes(q.toLowerCase()));
 return `<ul class="card eb-pick" id="eb-pick">${rows.length?rows.map(x=>{const on=have.has(x.name);return `<li>${ava(x)}<span class="eb-pick-t"><b>${esc(x.name)}</b><small>${esc(x.role)}${x.cap?' · '+x.cap+' мест':''} · ${esc(x.city)}</small></span><button type="button" class="eb-mini${on?' on':''}" data-cmd="${on?'noop':'take:'+group+':'+encodeURIComponent(x.name)+(role?':'+encodeURIComponent(role):'')}"${on?' aria-disabled="true"':''}>${on?'Добавлен':group==='venue'?'Выбрать':'Добавить'}</button></li>`;}).join(''):'<li class="eb-pick-empty">Никого не нашли.</li>'}</ul>`;}

/* ================= МОНИТОР ================= */
function header(){const d=E.date,left=d?days(TODAY,d):null;const PH=[['Подготовка','с '+(E.id==='sale'?'авг':'сен')],['Анонс',E.announce?E.announce.getDate()+' '+MON[E.announce.getMonth()].slice(0,3):'—'],['Продажи',E.announce?'с '+E.announce.getDate()+' '+MON[E.announce.getMonth()].slice(0,3):'—'],['День',d?d.getDate()+' '+MON[d.getMonth()].slice(0,3):'—'],['Итоги',d?(d.getDate()+1)+' '+MON[d.getMonth()].slice(0,3):'—']];
 return `<header class="eb-hero${E.cover?'':' nocover'}">${E.cover?`<img src="${coverSrc(E.cover)}" alt="">`:''}<a class="eb-back" href="#events">← Мои события</a><a class="eb-edit-btn" href="#build/0">Настроить</a><div class="eb-hero-copy"><p class="eb-eyebrow">${esc(E.type)} · ${esc(E.city)}</p><h1>${esc(E.name||'Без названия')}</h1>${d?`<p class="eb-date">${dm(d)}, ${WD[d.getDay()]}</p><p class="eb-sub">${E.start}–${E.end}${venue()?' · '+esc(venue().name):''}${E.scenes.length>1?' · '+E.scenes.length+' '+plural(E.scenes.length,'сцена','сцены','сцен'):''} · через ${left} ${plural(left,'день','дня','дней')}</p>`:`<button type="button" class="eb-date eb-nodate" data-cmd="goto:0">Выбрать дату</button>`}</div></header>
 <ol class="eb-rail" aria-label="Этапы события">${PH.map((p,i)=>{const ph=phase();return `<li class="${i===ph?'now':i<ph?'past':''}"${i===ph?' aria-current="step"':''}><i></i><b>${p[0]}</b><span>${i===ph?'сейчас':p[1]}</span></li>`;}).join('')}</ol>
 <div class="eb-tabs-wrap" data-tabs-wrap><nav class="seg eb-tabs" aria-label="Разделы">${[['summary','Сводка'],['place','Место'],['people','Люди'],['req','Запросы'],['promo','Промо'],['money','Деньги'],['day','День']].map(([k,l])=>`<a href="#${k}"${route().v===k?' aria-current="page"':''}>${l}${k==='people'&&crowd().filter(p=>p.stage<=0).length?`<em>${crowd().filter(p=>p.stage<=0).length}</em>`:''}${k==='place'&&(!venue()||!signed(venue()))?'<em>!</em>':''}</a>`).join('')}</nav><button type="button" class="eb-tabs-more l" data-tabs-go="-1" aria-label="Предыдущие разделы" tabindex="-1"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button><button type="button" class="eb-tabs-more r" data-tabs-go="1" aria-label="Ещё разделы" tabindex="-1"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button></div>`;}

/* ---- сводка ---- */
function gate(){const v=venue(),a=list('artist'),aok=a.filter(p=>p.stage>=1).length;
 const items=[[!!E.cover&&!!E.name,'Обложка и название',E.cover?'готово':'обложки нет','goto:0','Выбрать'],[!!E.date,'Дата',E.date?`${dm(E.date)}, ${E.start}`:'не выбрана','goto:0','Выбрать'],
  [!!v&&signed(v),'Площадка подтверждена',!v?'не выбрана':signed(v)?'договор подписан':`${v.name}: ${v.stage===-1?'оффер не отправлен':v.contract==='sent'?'договор на подписании':'договор не подписан'}`,v?'open:'+v.id:'goto:1',v?'Открыть':'Выбрать'],
  [a.length>0&&aok===a.length,'Лайн-ап подтверждён',!a.length?'артистов нет':`${aok} из ${a.length}`+(aok<a.length?' · ждём '+a.filter(p=>p.stage<1).map(p=>p.name).join(', '):''),a.length?'people:artist':'goto:2',a.length?'Открыть':'Добавить'],
  [(E.posts||[]).some(p=>/^Анонс/.test(p.t)&&p.st!=='plan')&&!!(E.assets||{}).poster,'Анонс-пост и афиша',(E.posts||[]).some(p=>/^Анонс/.test(p.t)&&p.st!=='plan')?((E.assets||{}).poster?'готово':'нет афиши'):'пост не готов','tab:promo','Открыть'],
  [E.ticketMode==='sale'&&E.price>0,'Билеты',E.ticketMode==='reg'?'сейчас вход бесплатный':E.price?`${rub(E.price)} · ${cap()||'?'} мест`:'цена не задана','goto:5','Настроить']];
 const miss=items.filter(i=>!i[0]).length;
 if(phase()>=2)return `<section class="card eb-gate"><div class="eb-gate-head"><h2>Анонс вышел ${dm(E.announce)}</h2><span class="eb-count">идут продажи</span></div><p class="eb-line">Продано <b>${soldTotal()}</b> из ${cap()} · до события ${days(TODAY,E.date)} ${plural(days(TODAY,E.date),'день','дня','дней')}</p><button type="button" class="secondary-button eb-btn" data-cmd="tab:promo">Продажи и промо</button></section>`;
 return `<section class="card eb-gate" aria-labelledby="eb-g"><div class="eb-gate-head"><h2 id="eb-g">${E.announce?'Анонс '+dm(E.announce):'Готовность к анонсу'}</h2><span class="eb-count">${miss?`осталось ${miss}`:'можно анонсировать'}</span></div>
 <ul class="eb-checks">${items.map(([k,t,s,cmd,b])=>`<li class="${k?'ok':'no'}"><span class="eb-ck" aria-hidden="true">${k?'✓':''}</span><span><b>${t}</b><small>${esc(s)}</small></span>${k?'':`<button type="button" class="eb-mini" data-cmd="${cmd}">${b}</button>`}</li>`).join('')}</ul>
 <button type="button" class="${miss?'secondary-button':'primary'} eb-btn" data-cmd="announce">${miss?'Анонсировать всё равно':'Анонсировать'}</button></section>`;}

function actions(){const L=[],v=venue(),sl=shortlist(),w=waiting().filter(p=>p.group!=='venue');
 if(sl.length)L.push({t:`${sl.length} в шорт-листе`,s:`Офферы не отправлены: ${sl.map(p=>p.name).join(', ')}`,b:'Отправить офферы',cmd:'sendall'});
 if(!v)L.push({t:'Нет площадки',s:'Без площадки нет вместимости, а значит — плана продаж.',b:'Выбрать площадку',cmd:'goto:1'});
 else if(!signed(v)&&v.stage>=0)L.push({t:'Площадка не подписала договор',s:`Без договора анонс — риск переноса. Оплачено ${rub(v.paid)} из ${rub(v.fee)}.`,b:'Напомнить площадке',cmd:'nudge:'+v.id,g:'Открыть',go:'open:'+v.id});
 if(E.ticketMode==='reg'&&cost().total>0)L.push({t:'Вход бесплатный, а смета — нет',s:`Расходы ${rub(cost().total)}. Без продажи билетов событие уходит в минус на всю сумму.`,b:'Включить продажу билетов',cmd:'tickets'});
 if(w.length)L.push({t:`${w.length} ${plural(w.length,'человек','человека','человек')} не ответили`,s:w.map(p=>p.name).join(', ')+(deadline()?' · ответ нужен до '+dm(deadline()):''),b:'Напомнить всем',cmd:'nudge:all',g:'Список',go:'people:wait'});
 const cl=clashes();if(cl.length)L.push({t:'Сеты пересекаются',s:cl.map(([x,y,sc])=>`${sc.n}: ${x.name} до ${setEnd(x)}, ${y.name} с ${y.set}`).join('; '),b:'Поправить',cmd:'goto:2'});
 const noR=list('artist').filter(p=>!p.rider);if(noR.length)L.push({t:noR.length===1?'Нет райдера: '+noR[0].name:'Нет райдеров: '+noR.length,s:'Без райдера не собрать запрос по технике и бытовому.',b:'Напомнить',cmd:'askrider:'+noR[0].id,g:'Вставить текст',go:'parse:'+noR[0].id});
 const dr=reqs().filter(r=>r.st==='draft');if(dr.length)L.push({t:`Запросы не отправлены: ${dr.length}`,s:dr.map(r=>r.name).join(', '),b:'Отправить все',cmd:'sendreqs',g:'Проверить',go:'tab:req'});
 const od=(E.posts||[]).filter(overdue);if(od.length)L.push({t:od.length===1?'Публикация не вышла':'Публикации не вышли',s:od.map(p=>`${p.d.getDate()} ${MON[p.d.getMonth()].slice(0,3)} · ${p.t}`).join('; '),b:'Открыть план',cmd:'tab:promo'});
 if(!(E.channels||[]).length)L.push({t:'Нет каналов продвижения',s:'Выбери, где рассказываем о событии, — у каждого канала будет свой промокод.',b:'Выбрать каналы',cmd:'goto:6'});
 if(!list('artist').length)L.push({t:'Нет лайн-апа',s:'Добавь артистов — сеты сами встанут в тайминг.',b:'Добавить артистов',cmd:'goto:2'});
 return `<section class="eb-sec"><div class="eb-sec-head"><h2>Сделать сейчас</h2><span class="caption">${Math.min(3,L.length)}</span></div>${L.slice(0,3).map(a=>`<article class="card eb-act"><h3>${a.t}</h3><p>${esc(a.s)}</p><div class="eb-act-btns"><button type="button" class="primary eb-btn" data-cmd="${a.cmd}">${a.b}</button>${a.g?`<button type="button" class="secondary-button eb-btn" data-cmd="${a.go}">${a.g}</button>`:''}</div></article>`).join('')||'<div class="card"><p class="secondary">Всё под контролем.</p></div>'}</section>`;}

function beBar(){const c=cap(),be=breakEven(true),be0=breakEven(false),unconf=E.incomes.filter(i=>!i.ok);
 if(!c||!E.price||E.ticketMode==='reg')return `<p class="secondary">Окупаемость посчитаем, когда будут площадка и цена билета.</p><button type="button" class="eb-mini" data-cmd="goto:${c?5:1}">${c?'Задать цену':'Выбрать площадку'}</button>`;
 const pos=x=>Math.min(100,x/c*100);
 return `<div class="eb-be-top"><p><b>${be}</b> ${plural(be,'билет','билета','билетов')} до нуля</p><span class="caption">из ${c} мест</span></div>
 <div class="eb-be-bar" role="img" aria-label="Безубыточность ${be} из ${c}"><i class="sold" style="width:${pos(E.sales&&E.sales.length?soldTotal():sold)}%"></i><span class="mark" style="left:${pos(be)}%"></span>${unconf.length?`<span class="mark risk" style="left:${pos(be0)}%"></span>`:''}</div>
 ${unconf.length?`<p class="eb-warn">${unconf.map(i=>esc(i.kind+' «'+i.n+'»')).join(', ')} — ${rub(unconf.reduce((a,i)=>a+i.a,0))} не подтверждено. Без этого — <b>${be0}</b> из ${c}${be0>c*.9?', почти солдаут':''}.</p>`:''}`;}

function summary(){const c=cost();return `${gate()}${actions()}
 <section class="eb-sec"><div class="eb-sec-head"><h2>Окупаемость</h2><a class="text-button" href="#money">Деньги →</a></div><div class="card eb-be">${beBar()}<dl class="eb-kv"><div><dt>Расходы</dt><dd>${rub(c.total)}</dd></div><div><dt>Оплачено</dt><dd>${rub(paidSum())}</dd></div><div><dt>Билет</dt><dd>${E.price?rub(E.price):'—'}</dd></div></dl></div></section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Договорённости</h2><a class="text-button" href="#people">Люди →</a></div><ul class="card eb-areas">${Object.entries(GROUP).map(([g,l])=>{const L=list(g),ok=L.filter(signed).length;return `<li><button type="button" data-cmd="people:${g}"><span class="eb-area-t"><b>${l}</b><small>${L.length?`${ok} из ${L.length} подписали`:'никого нет'}</small></span>${L.length?`<span class="eb-pipe" aria-hidden="true">${[-1,0,1,2,3].map(s=>{const n=L.filter(p=>stageOf(p)===s).length;return n?`<i class="s${s<0?'x':s}" style="flex:${n}"></i>`:'';}).join('')}</span>`:`<span class="eb-mini">Добавить</span>`}</button></li>`;}).join('')}</ul><p class="caption eb-legend"><i class="sx"></i>кандидат <i class="s0"></i>ждём ответ <i class="s1"></i>согласие <i class="s2"></i>договор <i class="s3"></i>оплачено</p></section>`;}

/* ---- люди: четыре независимых статуса ----
   согласие: stage −1 кандидат · 0 ждём ответ · 1 есть
   договор:  contract none · sent (на подписании) · signed
   оплата:   из paid/fee — нет суммы · не оплачено · частично · оплачено
   райдер/ТЗ: не вводится руками — считается из «Запросов» */
function norm(p){if(p.contract)return p;if(p.stage>=2){p.stage=1;p.contract='signed';}else if(/договор/i.test(p.wait||'')){p.stage=1;p.contract='sent';p.wait='';}else p.contract='none';return p;}
const signed=p=>p.contract==='signed';
function riderSt(p){if(p.group==='crew')return null;
 if(p.group==='artist'){if(!p.rider)return p.riderAsked?['wait','запрошен']:['bad','нет'];const provs=[...new Set(needs().filter(n=>n.src.includes(p.name)).map(n=>n.prov))];const R=reqs();if(provs.some(x=>!x))return ['work','есть, не всё закрыто'];const st=provs.map(n=>R.find(r=>r.name===n)?.st||'draft');return st.every(x=>x==='ok')?['ok','техника подтверждена']:st.some(x=>x==='change')?['bad','нужна замена']:['work','получен, запросы в работе'];}
 const r=reqs().find(x=>x.name===p.name);if(!r)return null;return {draft:['none','запрос не отправлен'],sent:['work','ждём ответ'],ok:['ok','подтверждено'],change:['bad','нужна замена']}[r.st];}
function statuses(p){const c=p.stage===1?['ok','есть']:p.stage===0?['wait','ждём ответ']:['none','оффер не отправлен'];
 const d=signed(p)?['ok','подписан']:p.contract==='sent'?['work','на подписании']:['none','нет'];
 const m=!p.fee?['bad','нет суммы']:p.paid>=p.fee?['ok','оплачено']:p.paid>0?['work',`${rub(p.paid)} из ${rub(p.fee)}`]:['none','не оплачено'];
 const r=riderSt(p);return [['Согласие',...c],['Договор',...d],['Оплата',...m],...(r?[[p.group==='artist'?'Райдер':'ТЗ',...r]]:[])];}
/* одно следующее действие и одна фраза — по приоритету */
function nextStep(p){const r=riderSt(p);
 if(p.stage===-1)return p.fee?['Оффер не отправлен','Оффер','offer:'+p.id,'hot']:['Задай условия — без них оффер не уйдёт','Условия','open:'+p.id,'hot'];
 if(p.stage===0)return [p.wait||'Ждём ответ на оффер','Напомнить','nudge:'+p.id,'hot'];
 if(p.contract==='none')return ['Согласие есть, договора нет','Договор','contract:'+p.id,''];
 if(p.contract==='sent')return ['Договор на подписании','Подписали','signed:'+p.id,''];
 if(r&&r[0]==='bad')return [p.group==='artist'?(p.rider?'Райдер: нужна замена':'Нет райдера'):'Подрядчик просит замену',p.group==='artist'&&!p.rider?'Райдер':'Запросы',p.group==='artist'&&!p.rider?'askrider:'+p.id:'tab:req','hot'];
 if(p.fee&&p.paid<p.fee)return [`К оплате ${rub(p.fee-p.paid)}`,'Оплатить','pay:'+p.id,''];
 if(r&&r[0]!=='ok')return [p.group==='artist'?'Райдер: '+r[1]:'ТЗ: '+r[1],'Запросы','tab:req',''];
 return ['Всё готово',null,null,''];}
const done=p=>p.stage===1&&signed(p)&&p.fee&&p.paid>=p.fee;
function segs(p){return `<span class="eb-segs" role="img" aria-label="${statuses(p).map(x=>x[0]+': '+x[2]).join(', ')}">${statuses(p).map(x=>`<i class="${x[1]}"></i>`).join('')}</span>`;}
const stageOf=p=>!signed(p)?p.stage:p.fee&&p.paid>=p.fee?3:2;
function stageText(p){return nextStep(p)[0];}
function stageTextOld(p){return p.stage===-1?(p.fee?'В шорт-листе · оффер не отправлен':'Задай условия — без них оффер не уйдёт'):p.stage===0?(p.wait||'Ждём ответ на оффер'):p.stage===1?'Согласие есть, договора нет':stageOf(p)===3?'Оплачено':'Договор подписан';}
function pipe(p){return segs(p);}
function pipeOld(p){const s=stageOf(p);return `<span class="eb-steps" aria-hidden="true">${[0,1,2,3].map(i=>`<i class="${s>=0&&i<=s?'on':''}${i===0&&s===0?' wait':''}"></i>`).join('')}</span>`;}
function prow(p){const [t,l,cmd,hot]=nextStep(p);
 return `<li class="eb-p${hot?' wait':''}${done(p)?' ok':''}"><button type="button" class="eb-p-main" data-open="${p.id}">${ava(p)}<span class="eb-p-t"><b>${esc(p.name)}</b><small>${esc(p.role)}${p.set?' · '+(E.scenes.length>1?esc(sceneOf(p.scene).n.toLowerCase())+' ':'сет ')+p.set:''}</small><span class="eb-p-s">${segs(p)}<em>${esc(t)}</em></span></span></button><span class="eb-p-r"><span class="eb-p-m">${p.fee?`${rub(p.paid)}<small>из ${rub(p.fee)}</small>`:'<small class="eb-hot">нет суммы</small>'}</span>${l?`<button type="button" class="eb-mini ${hot}" data-cmd="${cmd}">${l}</button>`:''}</span></li>`;}
const GROUP_P={artist:'Артисты',crew:'Команда',vendor:'Подрядчики'};
const crowd=()=>E.people.filter(p=>p.group!=='venue');
function people(){const all=crowd(),pay=all.reduce((a,p)=>a+p.fee,0),pd=all.reduce((a,p)=>a+p.paid,0);
 if(!all.length)return `<div class="card eb-empty"><h2>Пока никого</h2><p class="secondary">Добавь артистов — команду подберём по ролям.</p><div class="eb-choose">${Object.keys(GROUP_P).map(g=>`<button type="button" data-cmd="pick:${g}"><b>${GROUP_P[g]}</b><small>Добавить ${ONE[g]}</small></button>`).join('')}</div></div>`;
 const F=[['all','Все',all.length],['wait','Ждут ответа',all.filter(p=>p.stage<=0).length],...Object.entries(GROUP_P).map(([g,l])=>[g,l,list(g).length])];
 if(peopleFilter==='venue')peopleFilter='all';
 const L=peopleFilter==='all'?all:peopleFilter==='wait'?all.filter(p=>p.stage<=0):list(peopleFilter);
 const groups=peopleFilter==='all'?[['Шорт-лист',L.filter(p=>p.stage===-1),'hot'],['Ждут ответа',L.filter(p=>p.stage===0),'hot'],...Object.entries(GROUP_P).map(([g,l])=>[l,L.filter(p=>p.group===g&&p.stage>0),'',g])]:[[null,L,'',peopleFilter in GROUP_P?peopleFilter:null]];
 return `<div class="eb-toolbar"><div class="eb-chips">${F.map(([k,l,n])=>`<button type="button" class="chip" data-pf="${k}" aria-pressed="${peopleFilter===k}">${l} · ${n}</button>`).join('')}</div></div>
 <div class="eb-sec-head"><p class="eb-line">Оплачено ${rub(pd)} из ${rub(pay)}${deadline()?' · расчёт до '+dm(deadline()):''}</p>${addBtn('Добавить','choose')}</div>
 ${groups.filter(g=>g[1].length||g[3]).map(([t,l,h,g])=>`<section class="eb-sec">${t?`<div class="eb-gt${h?' hot':''}">${t}<span>${l.length}</span></div>`:''}${l.length?`<ul class="card eb-plist">${l.map(prow).join('')}</ul>`:''}${g?addBtn(g==='artist'?'Артист':g==='crew'?'Человек в команду':'Подрядчик','pick:'+g):''}</section>`).join('')}`;}

/* ---- место: площадка, сцены, что есть на площадке ---- */
function statusCard(p){return `<ul class="eb-stat">${statuses(p).map(([k,c,v])=>`<li class="${c}"><i></i><span>${k}</span><b>${esc(v)}</b></li>`).join('')}</ul>`;}
function place(){const v=venue(),kit=v&&VENUE_KIT[v.name]||{},LB={monitor:'Сценический монитор',sm58:'Shure SM58',micstand:'Микрофонная стойка',table:'Стол для оборудования'};
 if(!v)return `<div class="card eb-empty"><h2>Площадки нет</h2><p class="secondary">От площадки зависят вместимость, план продаж и запросы по технике.</p><button type="button" class="primary eb-btn" data-cmd="pick:venue">Выбрать площадку</button><button type="button" class="text-button" data-cmd="manual:venue">Своя площадка</button></div>`;
 const ns=nextStep(v),main=ns[1]?[ns[1]==='Договор'?'Отправить договор':ns[1]==='Подписали'?'Договор подписан':ns[1],ns[2]]:null;
 return `<section class="card eb-venue"><div class="eb-venue-h">${ava(v,'lg')}<div><h2>${esc(v.name)}</h2><p class="secondary">${esc(v.role)} · ${esc(E.city)}</p></div></div>
 <dl class="eb-kv"><div><dt>Вместимость</dt><dd>${v.cap||'—'}</dd></div><div><dt>Аренда</dt><dd>${v.fee?rub(v.fee):'—'}</dd></div><div><dt>Оплачено</dt><dd>${rub(v.paid)}</dd></div></dl>
 ${statusCard(v)}
 <p class="eb-sh-state${ns[3]?' hot':''}">${esc(ns[0])}</p>
 <div class="eb-act-btns">${main?`<button type="button" class="primary eb-btn" data-cmd="${main[1]}">${main[0]}</button>`:''}<button type="button" class="secondary-button eb-btn" data-open="${v.id}">Условия</button></div>
 <button type="button" class="text-button" data-cmd="pick:venue">Сменить площадку</button></section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Сцены</h2>${addBtn('Сцена','addscene')}</div><ul class="card eb-needs">${E.scenes.map(sc=>{const L=sets(sc.id);return `<li><button type="button" data-cmd="scene:${sc.id}"><span class="eb-need-t"><b>${esc(sc.n)}</b><small>${L.length?`${L.length} ${plural(L.length,'сет','сета','сетов')} · ${L[0].set}–${setEnd(L[L.length-1])} · ${L.map(p=>esc(p.name)).join(', ')}`:'сетов нет'}</small></span><span class="eb-mini">Изменить</span></button></li>`;}).join('')}</ul><p class="caption">У каждой сцены свой тайминг и своя техника — между сценами оборудование складывается.</p></section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Что есть на площадке</h2><span class="caption">техпаспорт</span></div>${Object.keys(kit).length?`<ul class="card eb-needs">${Object.entries(kit).map(([k,q])=>`<li><div><span class="eb-need-t"><b>${LB[k]||k} <em>× ${q}</em></b></span></div></li>`).join('')}</ul><p class="caption">Это вычитается из запросов подрядчикам. <a class="text-button" href="#req">Запросы →</a></p>`:`<div class="card eb-empty"><p class="secondary">Техпаспорта нет — всё оборудование уйдёт в запросы подрядчикам.</p><button type="button" class="secondary-button eb-btn" data-cmd="nudge:${v.id}">Запросить техпаспорт</button></div>`}</section>`;}

/* ---- запросы: райдеры → сводный список → запросы подрядчикам ---- */
function riderRow(p){const r=p.rider;return `<li class="eb-p${r?'':' wait'}"><button type="button" class="eb-p-main" data-cmd="${r?'rider:'+p.id:'parse:'+p.id}">${ava(p)}<span class="eb-p-t"><b>${esc(p.name)}</b><small>${r?`${esc(r.f||'Райдер')} · ${r.t.length} ${plural(r.t.length,'позиция','позиции','позиций')} техники · ${r.h.length} бытовых`:'Райдера нет'}</small><span class="eb-p-s"><em class="${r?'':'eb-hot'}">${r?{profile:'из профиля Digital Jazz',text:'разобран из текста',file:'загружен артистом'}[r.src]:p.riderAsked?'запрошен '+p.riderAsked+' · не прислан':'не запрошен'}</em></span></span></button>${r?'':`<span class="eb-p-r"><button type="button" class="eb-mini hot" data-cmd="askrider:${p.id}">${p.riderAsked?'Напомнить':'Запросить'}</button><button type="button" class="eb-mini" data-cmd="parse:${p.id}">Вставить текст</button></span>`}</li>`;}
function requests(){const A=list('artist'),N=needs(),H=hospNeeds(),R=reqs(),got=A.filter(p=>p.rider).length,noProv=N.filter(n=>!n.prov).length+H.filter(h=>!h.prov).length;
 const chip=n=>n.prov?`<span class="eb-prov${n.prov===venue()?.name?' v':''}">${esc(n.prov)}</span>`:'<span class="eb-prov none">нет поставщика</span>';
 return `<section class="eb-sec"><div class="eb-sec-head"><h2>Райдеры</h2><span class="caption">${got} из ${A.length}</span></div>
 ${A.length?`<ul class="card eb-plist">${A.map(riderRow).join('')}</ul><p class="caption">Райдер подтягивается из профиля артиста. Если его нет — запрос уходит вместе с оффером, или вставь текст из письма: разберём на технику и бытовое.</p>`:`<div class="card eb-empty"><p class="secondary">Добавь артистов — их райдеры подтянутся сами.</p><button type="button" class="primary eb-btn" data-cmd="goto:2">Лайн-ап</button></div>`}</section>
 ${N.length||H.length?`<section class="eb-sec"><div class="eb-sec-head"><h2>Что нужно</h2><span class="caption">${noProv?`<span class="eb-hot">${noProv} без поставщика</span>`:'всё распределено'}</span></div>
 <p class="eb-gt">Техника<span>${N.length}</span></p><ul class="card eb-needs">${N.map(n=>`<li><button type="button" data-cmd="need:${n.key}"><span class="eb-need-t"><b>${esc(n.label)} <em>× ${n.qty}</em></b><small>${Object.keys(n.by).length>1?Object.entries(n.by).map(([sc,q])=>`${esc(sc)} ${q}`).join(' + ')+' · ':''}${n.src.join(', ')}${n.fromVenue&&n.prov!==venue()?.name?` · ${n.fromVenue} есть на площадке`:''}</small></span>${chip(n)}</button></li>`).join('')}</ul>
 <p class="caption">На одной сцене сеты идут подряд — позиция считается по максимуму. Между сценами — суммой: оборудование стоит на каждой.</p>
 <p class="eb-gt">Бытовое<span>${H.length}</span></p><ul class="card eb-needs">${H.map(h=>`<li><div><span class="eb-need-t"><b>${esc(h.line)}</b><small>${esc(h.who)} · ${h.cat}</small></span>${chip(h)}</div></li>`).join('')}</ul></section>`:''}
 <section class="eb-sec"><div class="eb-sec-head"><h2>Запросы подрядчикам</h2>${R.some(r=>r.st==='draft')?`<button type="button" class="eb-add" data-cmd="sendreqs">Отправить все · ${R.filter(r=>r.st==='draft').length}</button>`:''}</div>
 ${R.length?`<ul class="card eb-plist">${R.map(r=>{const [l,c]=REQ_ST[r.st];return `<li class="eb-p"><button type="button" class="eb-p-main" data-cmd="req:${encodeURIComponent(r.name)}">${ava(r.p)}<span class="eb-p-t"><b>${esc(r.name)}</b><small>${esc(r.role)} · ${[r.tech.length?r.tech.length+' техн.':'',r.hosp.length?r.hosp.length+' быт.':'',r.base?'задание':''].filter(Boolean).join(' + ')}</small><span class="eb-p-s"><em class="eb-rq ${c}">${l}</em></span></span></button>${r.st==='draft'?`<span class="eb-p-r"><button type="button" class="eb-mini hot" data-cmd="sendreq:${encodeURIComponent(r.name)}">Отправить</button></span>`:''}</li>`;}).join('')}</ul>`:`<div class="card eb-empty"><p class="secondary">Запросы собираются, когда есть площадка и подрядчики.</p><button type="button" class="secondary-button eb-btn" data-cmd="goto:3">Команда</button></div>`}</section>`;}
function bRequests(){return `<p class="secondary">Собираем всё, что нужно для вечера: техника и бытовое из райдеров плюс базовые задания подрядчикам. Проверь и отправь.</p>${requests()}`;}

/* ---- промо ---- */
function salesBlock(){const c=cap(),be=breakEven(true),s=soldTotal(),left=E.date?Math.max(1,days(TODAY,E.date)):null;
 if(E.ticketMode==='reg')return `<div class="card eb-be"><p class="eb-warn">Вход бесплатный — продаж нет. Промо работает на регистрации.</p><button type="button" class="eb-mini" data-cmd="tickets">Включить продажу</button></div>`;
 if(!E.sales.length){const need=be&&left?Math.ceil(be/Math.max(1,days(E.announce||TODAY,E.date))):null;return `<div class="card eb-sales"><p class="caption">Продажи</p><p class="eb-sales-n">стартуют ${E.announce?dm(E.announce):'с анонсом'}</p>${be&&c?`<p class="eb-line">Чтобы окупиться: <b>${be}</b> из ${c} мест${need?` · это ${need} ${plural(need,'билет','билета','билетов')} в день`:''}</p>`:'<p class="eb-line">Нужны площадка и цена билета.</p>'}</div>`;}
 const last7=E.sales.slice(-7).reduce((a,x)=>a+x,0),pace=last7/7,fc=Math.min(c,Math.round(s+pace*left)),max=Math.max(...E.sales);
 return `<div class="card eb-sales"><p class="caption">Продано</p><p class="eb-sales-n"><b>${s}</b> из ${c}<span>${Math.round(s/c*100)}%</span></p>
 <div class="eb-be-bar" role="img" aria-label="Продано ${s} из ${c}, окупаемость ${be}"><i class="sold" style="width:${s/c*100}%"></i><span class="mark" style="left:${Math.min(100,be/c*100)}%"></span></div>
 <p class="eb-line">${s>=be?`<b class="eb-ok">Окупились</b> на ${s-be} ${plural(s-be,'билете','билетах','билетах')} раньше`:`До окупаемости <b>${be-s}</b>`} · за 7 дней <b>+${last7}</b></p>
 <div class="eb-spark" aria-hidden="true">${E.sales.map((x,i)=>`<i style="height:${Math.max(6,x/max*100)}%"${i>=E.sales.length-7?' class="w"':''}></i>`).join('')}</div>
 <p class="eb-line">Прогноз к ${dm(E.date)}: <b class="${fc>=c?'eb-ok':fc>=be?'':'eb-hot'}">${fc>=c?'солдаут':fc+' из '+c}</b> при темпе ${pace.toFixed(1).replace('.',',')} в день</p></div>`;}
function promo(){const chs=E.channels||[],posts=[...(E.posts||[])].sort((a,b)=>a.d-b.d),totalSold=chs.reduce((a,c)=>a+(c.sold||0),0);
 const st=p=>overdue(p)?['Просрочено','od']:p.st==='out'?['Вышло','out']:p.st==='ready'?['Готово','ready']:['В плане',''];
 return `${salesBlock()}
 <section class="eb-sec"><div class="eb-sec-head"><h2>Каналы</h2>${addBtn('Канал','addchan')}</div>${chs.length?`<ul class="card eb-chanlist">${chs.map(c=>`<li><button type="button" data-cmd="editchan:${c.id}"><span class="eb-chan-t"><b>${esc(c.k)}</b><small>${c.kind} · код ${c.code}${c.note?' · '+esc(c.note):''}</small></span><span class="eb-chan-r"><b>${E.sales.length?(c.sold||0)+' '+plural(c.sold||0,'билет','билета','билетов'):rub(c.budget)}</b><small>${E.sales.length?(c.budget&&c.sold?rub(c.budget/c.sold)+' за билет':c.budget?rub(c.budget)+' · продаж нет':'бесплатно'):c.budget?'бюджет':'бесплатно'}</small></span></button>${E.sales.length&&totalSold?`<i style="width:${(c.sold||0)/totalSold*100}%"></i>`:''}</li>`).join('')}</ul><p class="caption">Бюджет на продвижение ${rub(promoBudget())} входит в смету.${E.sales.length?` Без промокода куплено ${soldTotal()-totalSold}.`:''}</p>`:`<div class="card eb-empty"><p class="secondary">Каналов нет — о событии никто не узнает.</p><button type="button" class="primary eb-btn" data-cmd="goto:6">Выбрать каналы</button></div>`}</section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Контент-план</h2>${addBtn('Публикация','addpost')}</div>${posts.length?`<ol class="eb-run eb-cal">${posts.map(p=>{const [l,c]=st(p);return `<li class="${c}"><span class="eb-run-t"><b>${p.d.getDate()} ${MON[p.d.getMonth()].slice(0,3)}</b><small>${WD[p.d.getDay()]}</small></span><span class="eb-run-dot" aria-hidden="true"></span><button type="button" class="eb-run-c eb-post-row" data-cmd="editpost:${p.id}">${postMock(p,'xs')}<span class="eb-post-t"><b>${esc(p.t)}</b><small>${esc(p.ch)} · ${esc(p.who)} · <span class="eb-st ${c}">${l}</span></small></span></button></li>`;}).join('')}</ol>`:`<div class="card eb-empty"><p class="secondary">План публикаций пуст.</p>${E.date?'<button type="button" class="primary eb-btn" data-cmd="plan">Собрать план по шаблону</button>':''}</div>`}</section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Материалы</h2><span class="caption">${ASSETS.filter(([k])=>assetState(k)[0]).length} из ${ASSETS.length}</span></div>${materials()}</section>`;}

/* ---- деньги ---- */
function money(){const c=cost(),res=sold*E.price+income(false)-c.total;
 const groupsSum=Object.entries(GROUP).map(([g,l])=>[l,list(g).reduce((a,p)=>a+p.fee,0),g]).filter(x=>x[1]);
 return `${E.ticketMode==='sale'&&E.price&&cap()?`<section class="card eb-sim"><p class="caption">Если продадим</p><p class="eb-sim-n"><b data-sold-n>${sold}</b> × ${rub(E.price)}</p><input type="range" min="0" max="${cap()}" step="5" value="${sold}" data-sold aria-label="Сколько билетов продадим"><div class="eb-sim-res ${res>=0?'plus':'minus'}"><span>${res>=0?'Прибыль':'Убыток'}</span><b data-res>${res>=0?'+':'−'}${rub(Math.abs(res))}</b></div>${beBar()}</section>`:`<div class="card eb-be">${beBar()}</div>`}
 <section class="eb-sec"><div class="eb-sec-head"><h2>Вход</h2></div><div class="seg eb-seg2">${[['sale','Продажа билетов'],['reg','Бесплатно']].map(([k,l])=>`<button type="button" data-set="ticketMode:${k}" aria-pressed="${E.ticketMode===k}">${l}</button>`).join('')}</div>
 ${E.ticketMode==='sale'?`<div class="card eb-tickets"><label><span class="caption">Цена, ₽</span><input class="input" inputmode="numeric" data-bind="E.price" data-rerender value="${E.price||''}"></label><div><span class="caption">Мест</span><b>${cap()||'—'}</b></div><div><span class="caption">Старт продаж</span><b>${E.announce?dm(E.announce):'с анонсом'}</b></div></div>`:`<p class="eb-warn">Вход бесплатный: смета ${rub(c.total)} не окупится билетами.</p>`}</section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Расходы</h2><span class="caption">${rub(c.total)}</span></div><ul class="card eb-exp">${groupsSum.map(([l,v,g])=>`<li><button type="button" data-cmd="people:${g}"><span>${l}</span><b>${rub(v)}</b></button><i style="width:${v/c.total*100}%"></i></li>`).join('')}${E.costs.map(x=>`<li><button type="button" data-cmd="editcost:${x.id}"><span>${esc(x.n)}<small>${esc(x.g)}</small></span><b>${rub(x.a)}</b></button><i style="width:${x.a/c.total*100}%"></i></li>`).join('')}<li class="eb-exp-res"><span>Резерв ${Math.round(E.reserve*100)}%</span><b>${rub(c.reserve)}</b></li></ul>${addBtn('Расход','addcost')}</section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Спонсоры и партнёры</h2><span class="caption">${rub(income(false))} подтверждено</span></div>${E.incomes.length?`<ul class="card eb-exp">${E.incomes.map(i=>`<li><button type="button" data-cmd="editinc:${i.id}"><span>${esc(i.n)}<small>${esc(i.kind)} · ${i.ok?'подтверждено':'<span class="eb-hot">не подтверждено</span>'}</small></span><b>${rub(i.a)}</b></button></li>`).join('')}</ul>`:''}${addBtn('Спонсор или партнёр','addinc')}</section>
 <section class="eb-sec"><div class="eb-sec-head"><h2>Платежи</h2></div><div class="card eb-pay"><p><b>${rub(E.people.reduce((a,p)=>a+p.fee-p.paid,0))}</b> осталось заплатить ${E.people.filter(p=>p.paid<p.fee).length} ${plural(E.people.filter(p=>p.paid<p.fee).length,'получателю','получателям','получателям')}${deadline()?' до '+dm(deadline()):''}</p><button type="button" class="text-button" data-cmd="people:all">Кому и сколько →</button></div></section>`;}

/* ---- день ---- */
function day(){const rows=[...E.stages.map(s=>({...s,kind:'stage'})),...sets().map(p=>({t:p.set,e:setEnd(p),n:p.name,z:sceneOf(p.scene).n,who:'',artist:p,kind:'set'}))].sort((a,b)=>tkey(a.t).localeCompare(tkey(b.t))).filter(r=>zone==='Все'||r.z===zone);
 const byName=n=>E.people.find(p=>p.name===n);
 return `<div class="eb-toolbar"><div class="eb-chips">${['Все',...zones()].map(z=>`<button type="button" class="chip" data-zone="${z}" aria-pressed="${zone===z}">${z}</button>`).join('')}</div></div>
 <div class="eb-sec-head"><p class="eb-line">${E.date?dm(E.date):'Дата не выбрана'} · ${E.scenes.length>1?E.scenes.length+' '+plural(E.scenes.length,'сцена','сцены','сцен')+' · ':''}${sets().length} ${plural(sets().length,'сет','сета','сетов')} · сеты — из лайн-апа</p>${addBtn('Этап','addstage')}</div>
 ${rows.length?`<ol class="eb-run">${rows.map(r=>{const w=byName(r.who);return `<li class="${r.n.startsWith('Двери')?'key':''}${r.kind==='set'?' set':''}"><span class="eb-run-t"><b>${r.t}</b><small>${r.e}${r.e<r.t?' · ночь':''}</small></span><span class="eb-run-dot" aria-hidden="true"></span><button type="button" class="eb-run-c" data-cmd="${r.kind==='set'?'open:'+r.artist.id:'editstage:'+r.id}">${r.kind==='set'?`<span class="eb-run-a">${ava(r.artist,'sm')}<b>${esc(r.n)}</b>${r.artist.stage<1?'<em class="eb-hot">не подтверждён</em>':''}</span>`:`<b>${esc(r.n)}</b>`}<small>${r.z}${r.who?' · '+esc(r.who):''}${w&&w.stage<1?' <em class="eb-hot">не подтверждён</em>':''}${!r.who&&r.kind==='stage'?' · <em class="eb-hot">нет ответственного</em>':''}</small>${r.soundcheck&&sets((E.scenes.find(x=>x.n===r.z)||{}).id).length?`<small class="eb-sc">${sets((E.scenes.find(x=>x.n===r.z)||{}).id).map((p,i)=>`${addMin(r.t,i*25)} ${esc(p.name)}`).join(' · ')}</small>`:''}${r.kind==='set'&&clashes().some(c=>c[1]===r.artist)?'<small class="eb-hot">пересекается с предыдущим сетом</small>':''}</button></li>`;}).join('')}</ol>`:`<div class="card eb-empty"><p class="secondary">Тайминг пуст. Добавь монтаж, двери и демонтаж — сеты артистов встанут сами.</p></div>`}`;}

/* ---- список событий ---- */
function events(){return `<div class="eb-list-head"><h1>Мои события</h1><button type="button" class="primary eb-btn" data-cmd="create">Создать</button></div>
 ${EVENTS.map(ev=>{const prev=E;E=ev;const be=breakEven(true),w=waiting().length+shortlist().length,done=[0,1,2,3,4,5,6].filter(stepDone).length;const html=`<button type="button" class="card eb-ecard" data-cmd="openev:${ev.id}">${ev.cover?`<img src="${coverSrc(ev.cover)}" alt="">`:'<span class="eb-ecard-ph"></span>'}<span class="eb-ecard-b"><span class="eb-badge">${ev.fresh?`Черновик · готово ${done} из 7`:phase()===2?'Продажи идут':'Подготовка'+(ev.announce?' · анонс '+dm(ev.announce):'')}</span><b class="eb-ecard-n">${esc(ev.name||'Без названия')}</b>${ev.date?`<span class="eb-date sm">${dm(ev.date)}, ${WD[ev.date.getDay()]}</span>`:'<span class="eb-date sm eb-nodate">Дата не выбрана</span>'}<span class="caption">${esc(ev.city)}${venue()?' · '+esc(venue().name)+' · '+cap()+' мест':''}</span>${ev.sales&&ev.sales.length?`<span class="eb-ecard-sold">Продано <b>${soldTotal()}</b> из ${cap()}</span>`:''}${w||be?`<span class="eb-ecard-next">${[w?w+' ждут ответа':'',be?(ev.sales&&ev.sales.length&&soldTotal()>=be?'<b class="eb-ok">окупилось</b>':'окупаемость с '+be+' билетов'):''].filter(Boolean).join(' · ')}</span>`:''}</span></button>`;E=prev;return html;}).join('')}`;}

/* ================= КАРТОЧКИ (нижний лист) ================= */
const field=(l,name,val,attrs='')=>`<label class="field"><span>${l}</span><input class="input" name="${name}" value="${esc(val??'')}" ${attrs}></label>`;
const chips=(name,items,val)=>`<div class="eb-chips wrap">${items.map(x=>`<label class="chip eb-radio"><input type="radio" name="${name}" value="${esc(x)}"${x===val?' checked':''}>${esc(x)}</label>`).join('')}</div>`;
function sheetHTML(){if(!sheet)return '';const s=sheet;let h='';
 if(s.type==='person'){const p=E.people.find(x=>x.id===s.id);if(!p)return '';const st=stageOf(p);
  const ns=nextStep(p),main=ns[1]&&!/^open:/.test(ns[2])?[ns[1]==='Договор'?'Отправить договор':ns[1]==='Подписали'?'Договор подписан':ns[1]==='Оплатить'?'Оплатить '+rub(p.fee-p.paid):ns[1],ns[2]]:null;
  h=`<p class="caption eb-sh-cap">${GROUP[p.group]}</p><div class="eb-sh-head">${ava(p,'lg')}<div><h2 id="eb-sh-t">${esc(p.name)}</h2><p class="secondary">${esc(p.role)}</p></div></div>
  ${statusCard(p)}
  <p class="eb-sh-state${ns[3]?' hot':''}">${esc(ns[0])}</p>
  ${main?`<button type="button" class="primary eb-btn eb-full" data-cmd="${main[1]}">${main[0]}</button>`:''}
  <form class="eb-sh-form" data-form="person:${p.id}"><div class="eb-two">${field(FEE_LABEL[p.group]+', ₽','fee',p.fee,'inputmode="numeric"')}${field('Оплачено, ₽','paid',p.paid,'inputmode="numeric"')}</div>
  ${p.group==='artist'?`<div class="eb-two">${field('Сет','set',p.set,'type="time"')}${field('Длительность, мин','len',p.len||45,'inputmode="numeric"')}</div>${E.scenes.length>1?`<fieldset class="eb-fs"><legend>Сцена</legend>${chips('scene',E.scenes.map(x=>x.n),sceneOf(p.scene).n)}</fieldset>`:''}`:''}${p.group==='venue'?field('Вместимость','cap',p.cap,'inputmode="numeric"'):''}${p.group!=='artist'&&p.group!=='venue'?field('Роль','role',p.role):''}
  <fieldset class="eb-fs"><legend>Согласие</legend>${chips('stage',['Кандидат','Ждём ответ','Есть'],['Кандидат','Ждём ответ','Есть'][p.stage+1])}</fieldset>
  <fieldset class="eb-fs"><legend>Договор</legend>${chips('contract',['Нет','На подписании','Подписан'],{none:'Нет',sent:'На подписании',signed:'Подписан'}[p.contract])}</fieldset>
  <p class="eb-warn" data-form-err hidden></p>
  ${p.group==='artist'?`<div class="eb-sh-row"><span class="caption">Райдер</span>${p.rider?`<span>${p.rider.t.map(x=>esc(x[1])+' × '+x[2]).join(', ')}</span><button type="button" class="text-button" data-cmd="tab:req">Все запросы →</button>`:`<span class="eb-hot">не получен</span><button type="button" class="text-button" data-cmd="parse:${p.id}">Вставить текст райдера</button>`}</div>`:''}
  <div class="eb-act-btns"><button class="primary eb-btn">Сохранить</button><a class="secondary-button eb-btn" href="../digital-jazz-unified/chat/index.html">Написать</a></div></form>
  <button type="button" class="text-button eb-del" data-cmd="remove:${p.id}">Убрать из события</button>`;}
 if(s.type==='choose')h=`<h2 id="eb-sh-t">Кого добавить</h2><div class="eb-choose">${Object.keys(GROUP_P).map(g=>`<button type="button" data-cmd="pick:${g}"><b>${GROUP_P[g]}</b><small>${list(g).length?list(g).length+' в событии':'пока нет'}</small></button>`).join('')}</div>`;
 if(s.type==='pick')h=`<h2 id="eb-sh-t">${s.role?esc(s.role):'Добавить '+ONE[s.group]}</h2><input class="input eb-search" type="search" data-q placeholder="Имя или роль" value="${esc(s.q||'')}" aria-label="Поиск"><div data-pick-host>${pickList(s.group,s.role,s.q||'')}</div><p class="caption">Добавленные попадают в шорт-лист. Оффер уйдёт, когда отправишь.</p><button type="button" class="text-button" data-cmd="manual:${s.group}${s.role?':'+encodeURIComponent(s.role):''}">Нет в каталоге — добавить своего</button><button type="button" class="secondary-button eb-btn eb-full" data-close>Готово</button>`;
 if(s.type==='manual')h=`<h2 id="eb-sh-t">Свой ${s.group==='venue'?'вариант площадки':s.group==='vendor'?'подрядчик':'человек'}</h2><form data-form="manual:${s.group}">${field('Название или имя','name','','required')}${field(s.group==='venue'?'Тип':'Роль','role',s.role||'')}${field('Телефон или почта','contact','','inputmode="email"')}<div class="eb-two">${field(FEE_LABEL[s.group]+', ₽','fee','','inputmode="numeric"')}${s.group==='venue'?field('Вместимость','cap','','inputmode="numeric"'):s.group==='artist'?field('Сет','set','','type="time"'):''}</div><p class="caption">Пришлём приглашение в Digital Jazz вместе с оффером.</p><button class="primary eb-btn eb-full">Добавить в шорт-лист</button></form>`;
 if(s.type==='cost'){const c=E.costs.find(x=>x.id===s.id)||{n:'',a:'',g:'Продвижение'};h=`<h2 id="eb-sh-t">${s.id?'Расход':'Новый расход'}</h2><form data-form="cost:${s.id||''}">${field('Статья','n',c.n,'required')}${field('Сумма, ₽','a',c.a,'inputmode="numeric" required')}<fieldset class="eb-fs"><legend>Группа</legend>${chips('g',COST_G,c.g)}</fieldset><button class="primary eb-btn eb-full">Сохранить</button></form>${s.id?`<button type="button" class="text-button eb-del" data-cmd="delcost:${s.id}">Удалить расход</button>`:''}`;}
 if(s.type==='inc'){const i=E.incomes.find(x=>x.id===s.id)||{n:'',a:'',kind:'Спонсор',ok:false};h=`<h2 id="eb-sh-t">${s.id?'Спонсор или партнёр':'Новый спонсор'}</h2><form data-form="inc:${s.id||''}">${field('Название','n',i.n,'required')}<fieldset class="eb-fs"><legend>Кто</legend>${chips('kind',['Спонсор','Партнёр','Бар'],i.kind)}</fieldset>${field('Сумма, ₽','a',i.a,'inputmode="numeric"')}<label class="eb-toggle"><input type="checkbox" name="ok"${i.ok?' checked':''}> Подтверждено — учитывать в окупаемости</label><button class="primary eb-btn eb-full">Сохранить</button></form>${s.id?`<button type="button" class="text-button eb-del" data-cmd="delinc:${s.id}">Удалить</button>`:''}`;}
 if(s.type==='stage'){const st=E.stages.find(x=>x.id===s.id)||{n:'',t:'',e:'',z:zones()[0],who:''};h=`<h2 id="eb-sh-t">${s.id?'Этап':'Новый этап'}</h2><form data-form="stage:${s.id||''}">${field('Что происходит','n',st.n,'required placeholder="Двери · вход гостей"')}<div class="eb-two">${field('Начало','t',st.t,'type="time" required')}${field('Конец','e',st.e,'type="time"')}</div><fieldset class="eb-fs"><legend>Где</legend>${chips('z',zones(),st.z)}</fieldset><label class="field"><span>Ответственный</span><select class="input" name="who"><option value="">Не назначен</option>${E.people.filter(p=>p.group!=='artist').map(p=>`<option${p.name===st.who?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button class="primary eb-btn eb-full">Сохранить</button></form>${s.id?`<button type="button" class="text-button eb-del" data-cmd="delstage:${s.id}">Удалить этап</button>`:''}`;}
 if(s.type==='chan'){const c=E.channels.find(x=>x.id===s.id);if(c)h=`<p class="caption eb-sh-cap">${c.kind}</p><h2 id="eb-sh-t">${esc(c.k)}</h2><form data-form="chan:${c.id}">${field('Бюджет, ₽','budget',c.budget,'inputmode="numeric"')}${field('Промокод','code',c.code)}${field('Заметка','note',c.note||'','placeholder="Кто ведёт, ссылки, договорённости"')}<p class="caption">Ссылка для канала: digitaljazz.ru/e/${E.id}?src=${esc(c.code.toLowerCase())}</p><button class="primary eb-btn eb-full">Сохранить</button></form><button type="button" class="text-button eb-del" data-cmd="delchan:${c.id}">Убрать канал</button>`;
  else{const have=new Set(E.channels.map(x=>x.k));h=`<h2 id="eb-sh-t">Добавить канал</h2><ul class="card eb-pick">${CHANNELS.filter(x=>!have.has(x[0])).map(([k,kind,code,b])=>`<li><span class="eb-ava eb-ava-i" style="background:var(--dj-avatar-${avaColor(k)})">${code[0]}</span><span class="eb-pick-t"><b>${esc(k)}</b><small>${kind} · ${b?'от '+rub(b):'бесплатно'}</small></span><button type="button" class="eb-mini" data-cmd="chan:${encodeURIComponent(k)}">Добавить</button></li>`).join('')||'<li class="eb-pick-empty">Все каналы уже добавлены.</li>'}</ul><button type="button" class="secondary-button eb-btn eb-full" data-close>Готово</button>`;}}
 if(s.type==='post'){const p=E.posts.find(x=>x.id===s.id)||{t:'',d:E.date||TODAY,ch:'Соцсети',who:'Ты',st:'plan'};h=`<h2 id="eb-sh-t">${s.id?esc(p.t):'Новая публикация'}</h2>${s.id?`<div class="eb-mock-wrap">${postMock(p,'lg')}<div class="eb-mock-side"><p class="caption">${p.own?'Загружен свой макет':'Макет собран из данных события — обновится, если поменяешь лайн-ап, дату или обложку.'}</p><label class="secondary-button eb-btn eb-file">Свой макет<input type="file" accept="image/*,video/*" data-upload="post:${p.id}"></label>${p.own?`<button type="button" class="text-button" data-cmd="ownoff:${p.id}">Вернуть авто</button>`:''}</div></div>`:''}<form data-form="post:${s.id||''}">${field('О чём','t',p.t,'required placeholder="Лайн-ап: волна 2"')}<label class="field"><span>Подпись</span><textarea class="input eb-ta sm" name="cap" rows="3">${esc(p.cap||(s.id?captionFor(p):''))}</textarea></label><div class="eb-two">${field('Дата','d',iso(p.d),'type="date" required')}${field('Кто готовит','who',p.who)}</div>${field('Где','ch',p.ch)}<fieldset class="eb-fs"><legend>Статус</legend>${chips('st',['В плане','Готово','Вышло'],{plan:'В плане',ready:'Готово',out:'Вышло'}[p.st])}</fieldset><button class="primary eb-btn eb-full">Сохранить</button></form>${s.id?`<button type="button" class="text-button eb-del" data-cmd="delpost:${s.id}">Удалить</button>`:''}`;}
 if(s.type==='rider'){const p=E.people.find(x=>x.id===s.id),r=p.rider;h=`<p class="caption eb-sh-cap">Райдер · ${{profile:'из профиля Digital Jazz',text:'разобран из текста',file:'загружен артистом'}[r.src]}</p><div class="eb-sh-head">${ava(p,'lg')}<div><h2 id="eb-sh-t">${esc(p.name)}</h2><p class="secondary">${esc(r.f||'')}</p></div></div><p class="eb-gt">Техника</p><ul class="card eb-needs">${r.t.map(x=>`<li><div><span class="eb-need-t"><b>${esc(x[1])} <em>× ${x[2]}</em></b></span></div></li>`).join('')}</ul><p class="eb-gt">Бытовое</p><ul class="card eb-needs">${r.h.map(x=>`<li><div><span class="eb-need-t"><b>${esc(x)}</b></span></div></li>`).join('')}</ul>${r.n?`<p class="eb-sh-state">${esc(r.n)}</p>`:''}<button type="button" class="secondary-button eb-btn eb-full" data-cmd="parse:${p.id}">Заменить текстом из письма</button>`;}
 if(s.type==='parse'){const p=E.people.find(x=>x.id===s.id),res=s.res;h=`<p class="caption eb-sh-cap">Разбор райдера</p><h2 id="eb-sh-t">${esc(p.name)}</h2><p class="secondary">Вставь текст из письма или PDF — разложим по строкам: техника, бытовое, заметки.</p><textarea class="input eb-ta" data-parse-text rows="8">${esc(s.text)}</textarea><button type="button" class="${res?'secondary-button':'primary'} eb-btn eb-full" data-cmd="doparse">Разобрать</button>
  ${res?`<p class="eb-gt">Техника<span>${res.tech.length}</span></p><ul class="card eb-needs">${res.tech.map(t=>`<li><div><span class="eb-need-t"><b>${esc(t[1])} <em>× ${t[2]}</em></b><small>«${esc(t[3])}»</small></span><span class="eb-prov v">распознано</span></div></li>`).join('')}</ul>
  <p class="eb-gt">Бытовое<span>${res.hosp.length}</span></p><ul class="card eb-needs">${res.hosp.map(t=>`<li><div><span class="eb-need-t"><b>${esc(t)}</b></span></div></li>`).join('')}</ul>
  ${res.notes.length?`<p class="eb-gt">Заметки для техника<span>${res.notes.length}</span></p><p class="eb-sh-state">${res.notes.map(esc).join(' · ')}</p>`:''}
  ${res.unknown.length?`<p class="eb-gt hot">Не распознано<span>${res.unknown.length}</span></p><ul class="card eb-needs">${res.unknown.map(t=>`<li><div><span class="eb-need-t"><b>${esc(t)}</b><small>останется заметкой — проверь вручную</small></span></div></li>`).join('')}</ul>`:''}
  <button type="button" class="primary eb-btn eb-full" data-cmd="saverider:${p.id}">Сохранить райдер и обновить запросы</button>`:''}`;}
 if(s.type==='need'){const n=needs().find(x=>x.key===s.key);const opts=[...(venue()?[venue().name]:[]),...list('vendor').map(p=>p.name),'Привозит артист'];h=`<p class="caption eb-sh-cap">${esc(n.cat)}</p><h2 id="eb-sh-t">${esc(n.label)}</h2><p class="secondary">Нужно для: ${n.src.join(', ')}${n.fromVenue?` · на площадке есть ${n.fromVenue}`:''}</p><form data-form="need:${n.key}">${field('Количество','qty',n.qty,'inputmode="numeric"')}<label class="field"><span>Кто обеспечивает</span><select class="input" name="prov"><option value="">Нет поставщика</option>${opts.map(o=>`<option${o===n.prov?' selected':''}>${esc(o)}</option>`).join('')}</select></label><button class="primary eb-btn eb-full">Сохранить</button></form>`;}
 if(s.type==='req'){const r=reqs().find(x=>x.name===s.name);if(r){const [l,c]=REQ_ST[r.st];h=`<p class="caption eb-sh-cap">Запрос · <span class="eb-rq ${c}">${l}</span></p><div class="eb-sh-head">${ava(r.p,'lg')}<div><h2 id="eb-sh-t">${esc(r.name)}</h2><p class="secondary">${esc(r.role)}</p></div></div>
  <div class="card eb-letter"><p><b>${esc(E.name)}</b> · ${E.date?dm(E.date)+', '+WD[E.date.getDay()]:'дата уточняется'} · ${E.start}–${E.end}${venue()?' · '+esc(venue().name):''}</p><p>Монтаж с 09:30, саундчеки с 12:00, двери ${E.stages.find(x=>/Двери/.test(x.n))?.t||E.start}.</p>${r.base?`<p class="eb-gt">Задание</p><p>${esc(r.base)}</p>`:''}${r.tech.length?`<p class="eb-gt">Техника по райдерам</p><ul>${r.tech.map(n=>`<li>${esc(n.label)} × ${r.p===venue()&&n.prov!==r.name?n.fromVenue:n.qty} <small>${n.src.join(', ')}</small></li>`).join('')}</ul>`:''}${r.hosp.length?`<p class="eb-gt">Бытовое</p><ul>${r.hosp.map(x=>`<li>${esc(x.line)} <small>${esc(x.who)}</small></li>`).join('')}</ul>`:''}</div>
  <div class="eb-act-btns">${r.st==='draft'?`<button type="button" class="primary eb-btn" data-cmd="sendreq:${encodeURIComponent(r.name)}">Отправить</button>`:r.st==='sent'?`<button type="button" class="primary eb-btn" data-cmd="reqst:${encodeURIComponent(r.name)}:ok">Подтвердили</button><button type="button" class="secondary-button eb-btn" data-cmd="reqst:${encodeURIComponent(r.name)}:change">Нужна замена</button>`:`<button type="button" class="secondary-button eb-btn" data-cmd="sendreq:${encodeURIComponent(r.name)}">Отправить обновление</button>`}<a class="secondary-button eb-btn" href="../digital-jazz-unified/chat/index.html">Написать</a></div>`;}}
 if(s.type==='asset'){const k=s.k,a=E.assets,A=list('artist'),lineup=A.slice(0,4).map(p=>esc(p.name)).join(' · ');
  const poster=(cls)=>`<div class="eb-poster ${cls}">${E.cover?`<img src="${coverSrc(E.cover)}" alt="">`:''}<div><span>Digital Jazz</span><b>${esc(E.name||'Название')}</b><em>${E.date?dm(E.date):'дата'} · ${esc(venue()?.name||E.city)}</em><small>${lineup}</small></div></div>`;
  if(k==='poster')h=`<p class="caption eb-sh-cap">Материалы</p><h2 id="eb-sh-t">Афиша</h2><p class="secondary">Собираем из обложки, названия, даты, площадки и лайн-апа. Поменяется что-то в событии — афиша обновится.</p><div class="eb-posters">${poster('sq')}${poster('st')}</div><p class="caption">1:1 — лента и афиши · 9:16 — сторис</p><div class="eb-act-btns"><button type="button" class="primary eb-btn" data-cmd="assetset:poster:gen">${a.poster==='gen'?'Готово':'Использовать'}</button><label class="secondary-button eb-btn eb-file">Загрузить свою<input type="file" accept="image/*" data-upload="poster"></label></div>`;
  if(k==='teaser')h=`<p class="caption eb-sh-cap">Материалы</p><h2 id="eb-sh-t">Тизер-видео</h2><p class="secondary">15–30 секунд, вертикальное 9:16 — для сторис и рилс. Можно файлом или ссылкой.</p>${a.teaser?`<div class="card eb-filecard"><b>${esc(a.teaser.name||a.teaser.url)}</b><button type="button" class="eb-x" data-cmd="assetset:teaser:" aria-label="Убрать">×</button></div>`:''}<label class="eb-drop"><input type="file" accept="video/*" data-upload="teaser"><span>${plus}Выбрать видео</span><small>MP4 или MOV до 200 МБ</small></label><form data-form="teaser">${field('Или ссылка','url','','placeholder="https://"')}<button class="secondary-button eb-btn eb-full">Сохранить ссылку</button></form>`;
  if(k==='press')h=`<p class="caption eb-sh-cap">Материалы</p><h2 id="eb-sh-t">Пресс-релиз</h2><p class="secondary">Черновик собран из данных события — поправь и сохрани.</p><form data-form="press"><textarea class="input eb-ta" name="t" rows="10">${esc(a.press||pressDraft())}</textarea><button class="primary eb-btn eb-full">Сохранить</button></form>`;
  if(k==='photos')h=`<p class="caption eb-sh-cap">Материалы</p><h2 id="eb-sh-t">Фото и био артистов</h2><p class="secondary">Берём из профилей Digital Jazz. Если профиля или фото нет — запросим вместе с оффером.</p><ul class="card eb-plist">${A.map(p=>`<li class="eb-p">${ava(p)}<span class="eb-p-t"><b>${esc(p.name)}</b><small>${p.img?'фото и био из профиля':'<span class="eb-hot">нет фото в профиле</span>'}</small></span>${p.img?'<span class="eb-prov v">готово</span>':`<button type="button" class="eb-mini hot" data-cmd="nudge:${p.id}">Запросить</button>`}</li>`).join('')||'<li class="eb-pick-empty">Нет артистов.</li>'}</ul>`;
  if(k==='links')h=`<p class="caption eb-sh-cap">Материалы</p><h2 id="eb-sh-t">Ссылки и промокоды</h2><p class="secondary">Создаются сами для каждого канала: по ним видно, откуда купили билет.</p>${(E.channels||[]).length?`<ul class="card eb-needs">${E.channels.map(c=>`<li><div><span class="eb-need-t"><b>${esc(c.k)}</b><small>digitaljazz.ru/e/${E.id}?src=${esc(c.code.toLowerCase())} · код ${esc(c.code)}</small></span><button type="button" class="eb-mini" data-cmd="copy:${esc(c.code)}">Копировать</button></div></li>`).join('')}</ul>`:`<button type="button" class="primary eb-btn eb-full" data-cmd="goto:6">Выбрать каналы</button>`}`;}
 if(s.type==='terms'){const p=E.people.find(x=>x.id===s.id);h=`<p class="caption eb-sh-cap">${GROUP[p.group]} · оффер</p><div class="eb-sh-head">${ava(p,'lg')}<div><h2 id="eb-sh-t">${esc(p.name)}</h2><p class="secondary">${esc(p.role)}</p></div></div><p class="secondary">Условия уйдут в оффере вместе с ${E.date?'датой '+dm(E.date)+' и временем '+E.start+'–'+E.end:'временем '+E.start+'–'+E.end+' — дату допишем, когда выберешь'}.</p><form data-form="terms:${p.id}"><div class="eb-two">${field(FEE_LABEL[p.group]+', ₽','fee',p.fee||'','inputmode="numeric" required')}${p.group==='venue'?field('Вместимость','cap',p.cap||'','inputmode="numeric" required'):p.group==='artist'?field('Сет','set',p.set,'type="time"'):field('Роль','role',p.role)}</div>${field('Комментарий к офферу','note','','placeholder="Предоплата 30%, остальное в день события"')}<button class="primary eb-btn eb-full" name="go" value="send">Отправить оффер</button><button class="secondary-button eb-btn eb-full" name="go" value="keep">Сохранить в шорт-лист</button></form>`;}
 if(s.type==='swapvenue'){const cur=venue();h=`<h2 id="eb-sh-t">Заменить площадку?</h2><p class="secondary">Сейчас: <b>${esc(cur.name)}</b> — ${esc(stageText(cur).toLowerCase())}${cur.paid?`, оплачено ${rub(cur.paid)}`:''}. Новая: <b>${esc(s.name)}</b>.</p>${cur.paid?`<p class="eb-warn">Оплату ${rub(cur.paid)} придётся вернуть или зачесть — запиши это в договорённости.</p>`:''}<p class="caption">Вместимость, план продаж и запросы по технике пересчитаются под новую площадку.</p><div class="eb-act-btns"><button type="button" class="primary eb-btn" data-cmd="swapok:${encodeURIComponent(s.name)}">Заменить</button><button type="button" class="secondary-button eb-btn" data-close>Оставить ${esc(cur.name)}</button></div>`;}
 if(s.type==='scene'){const sc=E.scenes.find(x=>x.id===s.id);h=`<h2 id="eb-sh-t">${sc?'Сцена':'Новая сцена'}</h2><form data-form="scene:${s.id||''}">${field('Название','n',sc?.n||'','required placeholder="Малая сцена, Лаунж, Двор"')}<p class="caption">У каждой сцены свой тайминг и свой сводный райдер — оборудование между сценами складывается.</p><button class="primary eb-btn eb-full">${sc?'Сохранить':'Добавить сцену'}</button></form>${sc&&E.scenes.length>1?`<button type="button" class="text-button eb-del" data-cmd="delscene:${sc.id}">Убрать сцену · сеты перейдут на другую</button>`:''}`;}
 if(s.type==='pay'){const p=E.people.find(x=>x.id===s.id);h=`<p class="caption eb-sh-cap">Оплата</p><h2 id="eb-sh-t">${esc(p.name)}</h2><p class="secondary">Оплачено ${rub(p.paid)} из ${rub(p.fee)}${signed(p)?'':' · <span class="eb-hot">договор не подписан — это предоплата</span>'}</p><form data-form="pay:${p.id}">${field('Сумма платежа, ₽','amt',p.fee-p.paid,'inputmode="numeric" required')}<button class="primary eb-btn eb-full">Записать платёж</button></form>`;}
 if(s.type==='slot')h=`<h2 id="eb-sh-t">Своя роль</h2><form data-form="slot:${s.group}">${field('Какая роль нужна','r','','required placeholder="Фотограф"')}<button class="primary eb-btn eb-full">Добавить роль</button></form>`;
 return `<div class="eb-scrim" data-close></div><section class="eb-sheet" role="dialog" aria-modal="true" aria-labelledby="eb-sh-t"><span class="eb-grab" aria-hidden="true"></span>${h}</section>`;}

/* ================= отрисовка и события ================= */
/* вкладки листаются: затемнение и стрелка у края, где есть ещё; активная — в поле видимости; один раз показываем, что лента едет */
let tabsX=0,tabsHinted=false;
function tabsInit(){const w=document.querySelector('[data-tabs-wrap]');if(!w)return;const n=w.querySelector('.eb-tabs');
 const sync=()=>{const max=n.scrollWidth-n.clientWidth;w.classList.toggle('more-r',n.scrollLeft<max-4);w.classList.toggle('more-l',n.scrollLeft>4);tabsX=n.scrollLeft;};
 n.scrollLeft=tabsX;const a=n.querySelector('[aria-current]');if(a){const l=a.offsetLeft,r=l+a.offsetWidth;if(l<n.scrollLeft+8)n.scrollLeft=l-24;else if(r>n.scrollLeft+n.clientWidth-8)n.scrollLeft=r-n.clientWidth+24;}
 n.addEventListener('scroll',sync,{passive:true});sync();
 if(!tabsHinted&&n.scrollWidth>n.clientWidth+4&&n.scrollLeft<4&&!matchMedia('(prefers-reduced-motion: reduce)').matches){tabsHinted=true;setTimeout(()=>{n.scrollTo({left:56,behavior:'smooth'});setTimeout(()=>n.scrollTo({left:0,behavior:'smooth'}),550);},600);}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tabs-go]');if(!b)return;const n=b.parentElement.querySelector('.eb-tabs');n.scrollBy({left:+b.dataset.tabsGo*n.clientWidth*.6,behavior:'smooth'});});
function render(){const r=route();let html;
 if(r.v==='events')html=events();
 else if(r.v==='build')html=build(r.step);
 else html=header()+`<div class="eb-body">${r.v==='summary'?summary():r.v==='place'?place():r.v==='people'?people():r.v==='promo'?promo():r.v==='req'?requests():r.v==='money'?money():day()}</div>`;
 document.querySelector('#main').innerHTML=`<div class="eb${r.v==='build'?' eb-builder':''}">${html}</div>${sheetHTML()}${toast?`<div class="eb-toast" role="status">${esc(toast)}</div>`:''}`;tabsInit();}
const say=t=>{toast=t;render();clearTimeout(say.t);say.t=setTimeout(()=>{toast='';render();},2800);};
const open=s=>{sheet=s;render();setTimeout(()=>document.querySelector('.eb-sheet input:not([type=hidden])')?.focus?.(),0);};
const close=()=>{sheet=null;render();};
function addPerson(group,x,role){const o={contract:'none',id:uid(),group,name:x.name,role:role||x.role,img:x.img,city:x.city,fee:x.fee||(group==='venue'?0:group==='vendor'?25000:15000),paid:0,stage:-1,wait:''};
 if(group==='venue'){E.people=E.people.filter(p=>p.group!=='venue');o.cap=x.cap||0;o.role=x.role||'Площадка';}
 if(group==='artist'){o.rider=riderFor(o.name);o.scene=(sheet&&sheet.scene)||E.scenes[0].id;o.len=45;const s=sets(o.scene);o.set=s.length?addMin(setEnd(s[s.length-1]),5):addMin(E.start||'20:00',30);}
 E.people.push(o);return o;}
addEventListener('hashchange',()=>{sheet=null;render();scrollTo(0,0);});

/* живая правка полей: модель меняется на вводе, без перерисовки (фокус не теряется) */
function target(ref){const [scope,key]=ref.split('.');if(scope==='E')return [E,key];const [k,id]=scope.split(':');const arr={p:E.people,c:E.costs,i:E.incomes,s:E.stages,ch:E.channels,po:E.posts}[k];return [arr.find(x=>x.id===id),key];}
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.bind){const [o,k]=target(t.dataset.bind);if(!o)return;o[k]=k==='date'||(k==='d'&&t.type==='date')?(t.value?new Date(t.value+'T00:00'):null):['fee','cap','price','a','paid','budget'].includes(k)?num(t.value):t.value;
  if(k==='date')E.announce=E.date?new Date(E.date.getTime()-21*864e5):null;
  document.querySelectorAll('[data-calc=summary]').forEach(n=>n.innerHTML=calcSummary());document.querySelectorAll('[data-calc=promo]').forEach(n=>n.textContent=rub(promoBudget()));document.querySelectorAll('[data-calc=costsum]').forEach(n=>n.textContent=rub(E.costs.reduce((a,c)=>a+c.a,0)));return;}
 if(t.matches('[data-q]')){sheet.q=t.value;document.querySelector('[data-pick-host]').innerHTML=pickList(sheet.group,sheet.role,t.value);return;}
 if(t.matches('[data-sold]')){sold=+t.value;const c=cost(),res=sold*E.price+income(false)-c.total;document.querySelector('[data-sold-n]').textContent=sold;const r=document.querySelector('[data-res]');r.textContent=(res>=0?'+':'−')+rub(Math.abs(res));r.parentElement.className='eb-sim-res '+(res>=0?'plus':'minus');r.previousElementSibling.textContent=res>=0?'Прибыль':'Убыток';const b=document.querySelector('.eb-be-bar .sold');if(b)b.style.width=Math.min(100,sold/cap()*100)+'%';}});
document.addEventListener('change',e=>{if(e.target.matches('[data-rerender]'))render();const u=e.target.dataset?.upload;if(u&&u.startsWith('post:')&&e.target.files[0]){const p=E.posts.find(x=>x.id===u.slice(5));p.own=e.target.files[0].name;render();say('Макет загружен: '+p.own);return;}if(u&&e.target.files[0]){const n=e.target.files[0].name;E.assets[u]=u==='poster'?'file':{name:n};sheet=null;render();say('Загружено: '+n);}});

document.addEventListener('click',e=>{const t=e.target;
 if(t.closest('[data-close]')){close();return;}
 const op=t.closest('[data-open]');if(op){open({type:'person',id:op.dataset.open});return;}
 const pf=t.closest('[data-pf]');if(pf){peopleFilter=pf.dataset.pf;render();return;}
 const z=t.closest('[data-zone]');if(z){zone=z.dataset.zone;render();return;}
 const st=t.closest('[data-set]');if(st){const [k,v]=st.dataset.set.split(':');E[k]=v;render();return;}
 const c=t.closest('[data-cmd]');if(!c)return;const [cmd,a,b,d]=c.dataset.cmd.split(':');const A1=a&&decodeURIComponent(a),B1=b&&decodeURIComponent(b);
 const P=id=>E.people.find(p=>p.id===id);
 switch(cmd){
  case 'create':{toast='';const n=blank();EVENTS.unshift(n);E=n;location.hash='build/0';return;}
  case 'openev':E=EVENTS.find(x=>x.id===a);location.hash=E.fresh?'build/0':'summary';render();return;
  case 'next':{const s=+a;if(s===0&&!E.name.trim()){say('Назови событие — остальное можно позже');document.querySelector('[data-bind="E.name"]')?.focus();return;}location.hash='build/'+(s+1);return;}
  case 'goto':location.hash='build/'+a;return;
  case 'finish':E.fresh=false;location.hash='summary';return;
  case 'sendall':{const all=shortlist(),sl=all.filter(p=>p.fee&&(p.group!=='venue'||p.cap)),miss=all.filter(p=>!sl.includes(p));sl.forEach(p=>{p.stage=0;p.wait='';});if(miss.length){say(`Ушло ${sl.length}. Без условий не отправлены: ${miss.map(p=>p.name).join(', ')}`);if(route().v!=='build')return;}E.fresh=false;if(route().v==='build')location.hash='summary';say(`Офферы ушли: ${sl.length}. Ответы — во вкладках «Место» и «Люди»`);return;}
  case 'people':if(a==='venue'){sheet=null;location.hash='place';render();return;}peopleFilter=a||'all';sheet=null;location.hash='people';render();return;
  case 'open':open({type:'person',id:a});return;
  case 'choose':open({type:'choose'});return;
  case 'pick':if(route().v==='build'&&a==='venue'&&!venue()){render();return;}open({type:'pick',group:a,role:B1||'',q:''});return;
  case 'manual':open({type:'manual',group:a,role:B1||''});return;
  case 'take':{const x=CAT[a].find(y=>y.name===B1);const role=d&&decodeURIComponent(d);const cur=venue();if(a==='venue'&&cur&&(cur.stage>=0||cur.paid>0)){open({type:'swapvenue',name:x.name});return;}const o=addPerson(a,x,role);if(a==='venue'){open({type:'terms',id:o.id});return;}if(role){sheet=null;render();say(`${x.name} — в шорт-листе`);return;}document.querySelector('[data-pick-host]').innerHTML=pickList(sheet.group,sheet.role,sheet.q||'');return;}
  case 'remove':{const p=P(a);E.people=E.people.filter(x=>x.id!==a);sheet=null;render();say(`${p.name} убран(а) из события`);return;}
  case 'unslot':E.slots[a]=E.slots[a].filter(r=>r!==B1);render();return;
  case 'slot':open({type:'slot',group:a});return;
  case 'offer':{const p=P(a);if(!p.fee||(p.group==='venue'&&!p.cap)){open({type:'terms',id:p.id,send:true});return;}p.stage=0;sheet=null;say(`Оффер ушёл: ${p.name} · ${rub(p.fee)}`);return;}
  case 'swapok':{const old=venue(),x=CAT.venue.find(y=>y.name===A1);const o=addPerson('venue',x);open({type:'terms',id:o.id});say(`${old.name} убрана${old.paid?` · оплачено ${rub(old.paid)} — запроси возврат`:''}`);return;}
  case 'nudge':{sheet=null;say(a==='all'?`Напомнили: ${waiting().filter(p=>p.group!=='venue').map(p=>p.name).join(', ')}`:`Напомнили: ${P(a).name}`);return;}
  case 'contract':{const p=P(a);p.contract='sent';sheet=null;say(`Договор отправлен на подпись: ${p.name}`);return;}
  case 'signed':{const p=P(a);p.contract='signed';sheet=null;say(`Договор подписан: ${p.name}`);return;}
  case 'pay':open({type:'pay',id:a});return;
  case 'tickets':E.ticketMode='sale';location.hash='money';return;
  case 'announce':{const miss=document.querySelectorAll('.eb-checks .no').length;say(miss?`Не готово ${miss} из 6 — анонс поставлен, но риск отмечен`:'Анонс запланирован');return;}
  case 'addcost':if(route().v==='build'){E.costs.push({id:uid(),g:'Прочее',n:'',a:0});render();document.querySelector('.eb-edit li:last-child .eb-name')?.focus();return;}open({type:'cost'});return;
  case 'addinc':if(route().v==='build'){E.incomes.push({id:uid(),n:'',a:0,kind:'Спонсор',ok:false});render();return;}open({type:'inc'});return;
  case 'editcost':open({type:'cost',id:a});return;case 'editinc':open({type:'inc',id:a});return;
  case 'delcost':E.costs=E.costs.filter(x=>x.id!==a);sheet=null;render();return;
  case 'delinc':E.incomes=E.incomes.filter(x=>x.id!==a);sheet=null;render();return;
  case 'addstage':open({type:'stage'});return;case 'editstage':open({type:'stage',id:a});return;
  case 'delstage':E.stages=E.stages.filter(x=>x.id!==a);sheet=null;render();return;
  case 'noop':return;
  case 'rider':open({type:'rider',id:a});return;
  case 'parse':{const p=P(a);open({type:'parse',id:a,text:p.name==='Рифф'?'Технический райдер · Рифф\nГитарный комбо Fender Twin или Marshall JCM800 — 1\nShure SM57 x1\nСтойка микрофонная с журавлём 1 шт\nМонитор 1\nПитание 220V у края сцены, 2 розетки\nВода без газа 2 бут\nМесто для гитарного кейса\nСаундчек 30 минут, гитару и педалборд привозит артист':'',res:null});return;}
  case 'doparse':{sheet.text=document.querySelector('[data-parse-text]').value;sheet.res=parseRider(sheet.text);render();return;}
  case 'saverider':{const p=P(a),r=sheet.res;p.rider={src:'text',f:'Райдер из письма',t:r.tech.map(x=>[x[0],x[1],x[2]]),h:r.hosp,n:[...r.notes,...r.unknown].join(' · ')};p.riderAsked='';sheet=null;say(`Райдер ${p.name}: ${r.tech.length} техн. и ${r.hosp.length} быт. — запросы обновлены`);return;}
  case 'askrider':{const p=P(a);p.riderAsked=p.riderAsked||(TODAY.getDate()+' сен');sheet=null;say(`${p.name}: запрос райдера ушёл — артист загрузит в профиль`);return;}
  case 'need':open({type:'need',key:a});return;
  case 'req':open({type:'req',name:A1});return;
  case 'sendreq':E.reqSt=E.reqSt||{};E.reqSt[A1]='sent';sheet=null;say(`Запрос ушёл: ${A1}`);return;
  case 'sendreqs':{const d=reqs().filter(r=>r.st==='draft');E.reqSt=E.reqSt||{};d.forEach(r=>E.reqSt[r.name]='sent');sheet=null;say(`Запросы ушли: ${d.map(r=>r.name).join(', ')}`);return;}
  case 'reqst':E.reqSt[A1]=b;sheet=null;say(`${A1}: ${REQ_ST[b][0].toLowerCase()}`);return;
  case 'asset':open({type:'asset',k:a});return;
  case 'assetset':E.assets[a]=b||null;if(b)sheet=null;render();if(b)say(a==='poster'?'Афиша готова: 1:1 и 9:16':'Сохранено');return;
  case 'ownoff':{const p=E.posts.find(x=>x.id===a);p.own=null;render();return;}
  case 'copy':say('Скопировано: ссылка с кодом '+a);return;
  case 'pickscene':open({type:'pick',group:'artist',role:'',q:'',scene:a});return;
  case 'addscene':open({type:'scene'});return;case 'scene':open({type:'scene',id:a});return;
  case 'delscene':{if(E.scenes.length<2)return;const to=E.scenes.find(x=>x.id!==a);list('artist').filter(p=>p.scene===a).forEach(p=>{p.scene=to.id;});const n=E.scenes.find(x=>x.id===a).n;E.scenes=E.scenes.filter(x=>x.id!==a);sheet=null;render();say(`${n} убрана · сеты перенесены на ${to.n.toLowerCase()}`);return;}
  case 'tab':sheet=null;location.hash=a;render();return;
  case 'plan':E.posts=planPosts(E);render();say('План собран: '+E.posts.length+' публикаций');return;
  case 'chan':{const k=decodeURIComponent(a),ex=E.channels.find(c=>c.k===k);if(ex)E.channels=E.channels.filter(c=>c!==ex);else{const t=CHANNELS.find(c=>c[0]===k);E.channels.push({id:uid(),k,kind:t[1],code:t[2],budget:t[3],sold:0});}render();return;}
  case 'addchan':open({type:'chan'});return;case 'editchan':open({type:'chan',id:a});return;
  case 'delchan':E.channels=E.channels.filter(x=>x.id!==a);sheet=null;render();return;
  case 'addpost':if(route().v==='build'){E.posts.push({id:uid(),d:E.date||TODAY,t:'',ch:'Соцсети',who:'Ты',st:'plan'});render();document.querySelector('.eb-posts li:last-child .eb-name')?.focus();return;}open({type:'post'});return;
  case 'editpost':open({type:'post',id:a});return;
  case 'delpost':E.posts=E.posts.filter(x=>x.id!==a);sheet=null;render();return;
  default:say('Демо: загрузка своей обложки не подключена');}});

document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const [k,id]=f.dataset.form.split(':');const v=Object.fromEntries(new FormData(f));
 if(k==='person'){const p=E.people.find(x=>x.id===id);p.fee=num(v.fee);p.paid=Math.min(num(v.paid),p.fee||num(v.paid));if(v.set!==undefined)p.set=v.set;if(v.len)p.len=num(v.len);if(v.scene)p.scene=E.scenes.find(x=>x.n===v.scene)?.id||p.scene;if(v.cap!==undefined)p.cap=num(v.cap);if(v.role)p.role=v.role;const stg=['Кандидат','Ждём ответ','Есть'].indexOf(v.stage)-1,ct={'Нет':'none','На подписании':'sent','Подписан':'signed'}[v.contract];const err=f.querySelector('[data-form-err]');
 const bad=ct!=='none'&&stg<1?'Договор без согласия не бывает — отметь «Согласие: есть» или сними договор.':num(v.paid)>num(v.fee)&&num(v.fee)?'Оплачено больше суммы договорённости.':'';
 if(bad){err.hidden=false;err.textContent=bad;return;}
 p.stage=stg;p.contract=ct;if(p.stage>0)p.wait='';close();say('Сохранено: '+p.name);return;}
 if(k==='scene'){if(id){const sc=E.scenes.find(x=>x.id===id),old=sc.n;sc.n=v.n.trim();E.stages.forEach(x=>{if(x.z===old)x.z=sc.n;});}else E.scenes.push({id:uid(),n:v.n.trim()});close();return;}
 if(k==='pay'){const p=E.people.find(x=>x.id===id),amt=Math.min(num(v.amt),p.fee-p.paid);p.paid+=amt;close();say(`Платёж ${rub(amt)}: ${p.name}`);return;}
 if(k==='terms'){const p=E.people.find(x=>x.id===id);p.fee=num(v.fee);if(v.cap!==undefined)p.cap=num(v.cap);if(v.set)p.set=v.set;if(v.role)p.role=v.role;if(v.note)p.note=v.note;const go=e.submitter?.value;if(go==='send'){p.stage=0;close();say(`Оффер ушёл: ${p.name} · ${rub(p.fee)}`);}else{close();say(`${p.name} — в шорт-листе`);}return;}
 if(k==='need'){E.reqOver=E.reqOver||{};E.reqOver[id]={qty:num(v.qty),prov:v.prov||''};close();return;}
 if(k==='teaser'){if(v.url){E.assets.teaser={url:v.url};}close();return;}
 if(k==='press'){E.assets.press=v.t;close();say('Пресс-релиз сохранён');return;}
 if(k==='chan'){const c=E.channels.find(x=>x.id===id);Object.assign(c,{budget:num(v.budget),code:(v.code||c.code).toUpperCase(),note:v.note});close();return;}
 if(k==='post'){const p=id?E.posts.find(x=>x.id===id):(E.posts.push({id:uid()}),E.posts[E.posts.length-1]);Object.assign(p,{t:v.t,cap:v.cap,d:new Date(v.d+'T00:00'),who:v.who||'Ты',ch:v.ch||'Соцсети',st:{'В плане':'plan','Готово':'ready','Вышло':'out'}[v.st]||'plan'});close();return;}
 if(k==='slot'){E.slots[id].push(v.r.trim());close();return;}
 if(k==='manual'){const o=addPerson(id,{name:v.name.trim(),role:v.role||GROUP[id],fee:num(v.fee),cap:num(v.cap)});if(v.set)o.set=v.set;close();say(`${o.name} — в шорт-листе`);return;}
 if(k==='cost'){const c=id?E.costs.find(x=>x.id===id):(E.costs.push({id:uid()}),E.costs[E.costs.length-1]);Object.assign(c,{n:v.n,a:num(v.a),g:v.g||'Прочее'});close();return;}
 if(k==='inc'){const i=id?E.incomes.find(x=>x.id===id):(E.incomes.push({id:uid()}),E.incomes[E.incomes.length-1]);Object.assign(i,{n:v.n,a:num(v.a),kind:v.kind||'Спонсор',ok:!!v.ok});close();return;}
 if(k==='stage'){const s=id?E.stages.find(x=>x.id===id):(E.stages.push({id:uid()}),E.stages[E.stages.length-1]);Object.assign(s,{n:v.n,t:v.t,e:v.e||v.t,z:v.z||zones()[0],who:v.who});close();return;}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet)close();});
render();
})();

/* меню «Сервисы» вне прототипа турниров: ведём в соответствующие разделы, а не меняем хэш этой страницы */
addEventListener('click',e=>{const s=e.target.closest('[data-service]');if(!s)return;const U='../digital-jazz-unified/';const to={'турниры':U+'index.html#tournaments','афиша':U+'index.html#tournaments','магазин':U+'index.html#shop','туры':U+'tours/index.html'}[s.dataset.service];if(!to)return;e.preventDefault();e.stopImmediatePropagation();location.href=to;},true);
