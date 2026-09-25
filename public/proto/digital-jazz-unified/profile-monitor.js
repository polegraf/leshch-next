'use strict';
/* Профиль → «Монитор»: что происходит прямо сейчас у активного профессионального профиля.
   Организатор — его события из конструктора и главные дела; артист — приглашения, сеты, райдер, оплаты, турниры;
   компания и площадка — запросы и брони от событий. Данные — из конструктора (window.djEvents) и турниров (calendar-events.js). */
(()=>{
const A=window.djAccess,D=window.djEvents;if(!A||!D||!A.signed)return;
const P=A.active();if(!P)return;
const list=document.getElementById('cardList'),first=list&&list.querySelector('[data-id="profile"]');if(!first)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],WD=['вс','пн','вт','ср','чт','пт','сб'];
const dm=d=>d.getDate()+' '+MON[d.getMonth()],sh=d=>d.getDate()+' '+MON[d.getMonth()].slice(0,3),rub=n=>Math.round(n||0).toLocaleString('ru-RU')+' ₽',plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<10||h>=20)?b:c;};
const up=p=>p?p.replace(/^\.\.\//,'../../'):null,EB='../../dj-event-builder/index.html',AF='../../dj-afisha/index.html';
const TODAY=D.today,EV=D.all().filter(e=>e.name).sort((a,b)=>(a.date||9e15)-(b.date||9e15)),mine=n=>String(n||'').trim().toLowerCase()===P.name.trim().toLowerCase();
const PORTRAIT={'Нокс':'a','Вольт':'b','Лофи':'c','Грув':'d','Рифф':'e','Эхо':'f','Хэт':'g','Сэмпл':'h'};

/* шапка профиля — от имени активного профиля */
const TN={personal:'Зритель · билеты, события, друзья',artist:'Артист · '+(P.roles||[]).join(', '),org:'Организатор событий',company:'Компания'+(P.biz?' · '+P.biz:''),venue:'Площадка'+(P.cap?' · до '+P.cap+' гостей':'')};
first.querySelector('[data-meta]')&&(first.querySelector('[data-meta]').textContent=P.name);
const nm=document.querySelector('.name');if(nm)nm.textContent=P.name;document.title=P.name+' · Digital Jazz';
const bio=document.querySelector('.bio-text');if(bio)bio.textContent=(TN[P.type]||'')+(P.city?' · '+P.city:'');
const tags=first.querySelector('[data-tags]');if(tags){const T=P.type==='personal'?['Зритель',P.city||'Москва']:P.type==='artist'?[...(P.roles||[]),...(P.genres||[])]:[{org:'Организатор',company:P.biz||'Компания',venue:'Площадка'}[P.type],P.city].filter(Boolean);tags.innerHTML=T.map((t,i)=>`<div class="tag"><div class="dot" style="background:${i?'#A375FF':'#C0FA35'};"></div><span>${esc(t)}</span></div>`).join('');}
const COVER={personal:'../assets/nav.jpg',org:'../../dj-event-builder/covers/jazz-band.jpg',venue:'../../dj-event-builder/covers/stripes-arch.jpg',company:'../../dj-event-builder/covers/vinyl-bite.jpg'};
const cov=first.querySelector('.cover img');if(cov){const src=PORTRAIT[P.name]?'../assets/portraits/participant-'+PORTRAIT[P.name]+'.png':COVER[P.type];if(src){cov.src=src;cov.style.objectPosition='center 30%';}}
/* набор карточек — по типу профиля: зрителю билеты и календарь, артисту портфолио и райдер, организатору и бизнесу — кейсы, материалы, предложения */
const SHOW={personal:['profile','tickets','calendar'],artist:['profile','monitor','pressbio','stats','genres','music','calendar','cases','pressmaterials','rider','offers','ambassador'],org:['profile','monitor','calendar','pressbio','cases','pressmaterials','offers'],company:['profile','monitor','calendar','pressbio','cases','pressmaterials','offers'],venue:['profile','monitor','calendar','pressbio','cases','pressmaterials','offers']}[P.type]||[];
const applyCards=()=>{[...list.children].forEach(c=>{const id=c.dataset.id;if(!id)return;c.hidden=!SHOW.includes(id);});document.querySelectorAll('.profile-tournament-card').forEach(n=>n.hidden=true);
 if(P.type==='personal'){const t=list.querySelector('[data-id="tickets"]');if(t){first.after(t);t.classList.remove('collapsed');}}};
applyCards();setTimeout(applyCards,0);
if(P.type==='personal')return;

const BC={0:'djs.png',1:'drum.png',2:'gerls.png',3:'gerls.png',4:'beat-video.png',5:'guinar.png',6:'dance.png',7:'rap.png',cup:'cup-hero.jpg'};
const row=(href,img,t,sub,right,cls='')=>`<li><a class="pm-row ${cls}" href="${href}">${img?`<img src="${esc(img)}" alt="">`:'<span class="pm-ph"></span>'}<span class="pm-t"><b>${t}</b><small>${sub}</small></span>${right||''}</a></li>`;
const pill=(t,c='')=>`<em class="pm-pill ${c}">${t}</em>`;
let meta='',body='';

if(P.type==='org'){const ev=EV.filter(e=>e.date?e.date>=TODAY:true),todo=ev.flatMap(e=>e.todo.slice(0,2).map(t=>[e,t])).slice(0,3),sold=ev.reduce((a,e)=>a+(e.mode==='sale'?e.sold:0),0);
 meta=`${ev.length} ${plural(ev.length,'событие','события','событий')} · ${todo.length?todo.length+' '+plural(todo.length,'дело','дела','дел')+' сейчас':'всё по плану'}`;
 body=`<div class="pm-kpi"><div><b>${ev.filter(e=>e.published).length}</b><span>в афише</span></div><div><b>${sold}</b><span>билетов продано</span></div><div><b>${ev.filter(e=>e.fresh).length}</b><span>${plural(ev.filter(e=>e.fresh).length,'черновик','черновика','черновиков')}</span></div></div>
 ${todo.length?`<p class="pm-gt">Сделать сейчас</p><ul class="pm-list">${todo.map(([e,t])=>row(EB+'#ev/'+e.id,up(e.cover),esc(t),esc(e.name)+(e.date?' · '+sh(e.date):''),pill('открыть','hot'))).join('')}</ul>`:''}
 <p class="pm-gt">Мои события</p><ul class="pm-list">${ev.map(e=>row(EB+'#ev/'+e.id,up(e.cover),esc(e.name),e.date?`${dm(e.date)}, ${WD[e.date.getDay()]} · ${esc(e.venue?.name||'площадка не выбрана')}`:'дата не выбрана',e.fresh?pill('черновик'):e.mode==='reg'?pill('регистрация'):pill(`${e.sold}/${e.cap||'?'}`,e.cap&&e.sold>=e.cap*.8?'ok':''))).join('')}</ul>
 <a class="primary pm-btn" href="${EB}#events">Все события и новое</a>`;}

if(P.type==='artist'){const G=EV.flatMap(e=>e.people.filter(p=>p.group==='artist'&&mine(p.name)).map(p=>[e,p])).filter(([e,p])=>p.stage>=0&&e.date&&e.date>=TODAY),T=(window.djCalendarEvents||[]).filter(x=>x.people.some(mine));
 const inv=G.filter(([e,p])=>p.stage===0),conf=G.filter(([e,p])=>p.stage>=1),noR=conf.filter(([e,p])=>!p.rider),due=conf.filter(([e,p])=>p.fee&&p.paid<p.fee);
 meta=G.length||T.length?[inv.length?inv.length+' '+plural(inv.length,'приглашение','приглашения','приглашений'):'',conf.length?conf.length+' '+plural(conf.length,'сет','сета','сетов'):'',T.length?T.length+' '+plural(T.length,'турнир','турнира','турниров'):''].filter(Boolean).join(' · '):'пока пусто';
 body=G.length||T.length?`${inv.length?`<p class="pm-gt">Приглашения</p><ul class="pm-list">${inv.map(([e,p])=>`<li class="pm-inv"><a class="pm-row" href="${AF}#e/${e.id}"><img src="${esc(up(e.cover))}" alt=""><span class="pm-t"><b>${esc(e.name)}</b><small>${sh(e.date)} · ${esc(e.venue?.name||'')} · ${p.set?'сет '+p.set:'время уточнят'}</small></span><b class="pm-fee">${rub(p.fee)}</b></a><span class="pm-act"><button type="button" class="primary" data-pm="yes" data-e="${esc(e.name)}">Принять</button><button type="button" class="secondary-button" data-pm="no" data-e="${esc(e.name)}">Отказаться</button></span></li>`).join('')}</ul>`:''}
 ${conf.length?`<p class="pm-gt">Мои сеты</p><ul class="pm-list">${conf.map(([e,p])=>row(AF+'#e/'+e.id,up(e.cover),`${sh(e.date)} · ${p.set||'—'}${p.end?'–'+p.end:''}`,`${esc(e.name)} · ${esc(p.scene||'')}`,p.contract!=='signed'?pill(p.contract==='sent'?'договор на подписи':'нет договора','hot'):!p.rider?pill('нет райдера','hot'):p.fee&&p.paid<p.fee?pill(p.paid?'оплачено '+rub(p.paid):'не оплачено'):pill('всё готово','ok'))).join('')}</ul>`:''}
 ${noR.length?`<p class="pm-note">Организаторы ждут райдер для ${noR.map(([e])=>esc(e.name)).join(', ')} — загрузи его в карточке «Райдер» ниже, он подтянется в события сам.</p>`:''}
 ${due.length?`<p class="pm-note">Ждёт оплаты от организаторов: ${rub(due.reduce((a,[e,p])=>a+p.fee-p.paid,0))}.</p>`:''}
 ${T.length?`<p class="pm-gt">Турниры</p><ul class="pm-list">${T.map(x=>row('../'+(x.id==='cup'?'index.html#monitor':x.id===4?'battle.html#tournaments':x.id===2?'voice.html#tournaments':'event.html?id='+x.id+'#tournaments'),'../assets/battle/'+(BC[x.id]||'djs.png'),esc(x.name),esc(x.dates),pill('участник'))).join('')}</ul>`:''}`
 :`<p class="pm-note">Когда организатор позовёт «${esc(P.name)}» в событие, приглашение появится здесь — с датой, временем сета и гонораром. Пока загрузи райдер и портфолио ниже. Пример с данными: профиль артиста с именем Нокс или Лофи.</p>`;}

if(P.type==='company'||P.type==='venue'){const B=EV.flatMap(e=>e.people.filter(p=>(p.group==='vendor'||p.group==='venue')&&mine(p.name)).map(p=>[e,p])).filter(([e,p])=>p.stage>=0),R=EV.flatMap(e=>e.reqs.filter(r=>mine(r.name)&&r.st!=='draft').map(r=>[e,r]));
 const RS={sent:['ждёт ответа','hot'],ok:['подтверждено','ok'],change:['просили замену','hot']};
 meta=B.length||R.length?[B.length?B.length+' '+plural(B.length,'бронь','брони','броней'):'',R.filter(([e,r])=>r.st==='sent').length?R.filter(([e,r])=>r.st==='sent').length+' '+plural(R.filter(([e,r])=>r.st==='sent').length,'новый запрос','новых запроса','новых запросов'):''].filter(Boolean).join(' · ')||'всё подтверждено':'пока пусто';
 body=B.length||R.length?`${R.length?`<p class="pm-gt">Запросы от событий</p><ul class="pm-list">${R.map(([e,r])=>row(AF+'#e/'+e.id,up(e.cover),esc(e.name),`${e.date?sh(e.date)+' · ':''}${r.tech.length?r.tech.length+' '+plural(r.tech.length,'позиция','позиции','позиций')+' техники':''}${r.hosp?(r.tech.length?' + ':'')+r.hosp+' быт.':''}${!r.tech.length&&!r.hosp&&r.base?esc(r.base):''}`,pill(...RS[r.st]))).join('')}</ul>`:''}
 ${B.length?`<p class="pm-gt">${P.type==='venue'?'Брони площадки':'Договоры'}</p><ul class="pm-list">${B.map(([e,p])=>row(AF+'#e/'+e.id,up(e.cover),e.date?`${dm(e.date)}, ${WD[e.date.getDay()]}`:'дата не выбрана',`${esc(e.name)} · ${rub(p.fee)}`,p.stage===0?pill('оффер ждёт ответа','hot'):p.contract!=='signed'?pill(p.contract==='sent'?'договор на подписи':'нет договора','hot'):p.paid<p.fee?pill(p.paid?'оплачено '+rub(p.paid):'не оплачено'):pill('оплачено','ok'))).join('')}</ul>`:''}`
 :`<p class="pm-note">Когда событие отправит «${esc(P.name)}» запрос или бронь, они появятся здесь. Пример с данными: ${P.type==='venue'?'площадка с именем Цех 01 или 16 Тонн':'компания с именем Звуковой склад или Периметр'}.</p>`;}

const st=document.createElement('style');st.textContent=`.pm-kpi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:6px}.pm-kpi div{display:grid;gap:2px;padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03)}.pm-kpi b{font-size:24px;font-weight:600;color:#C0FA35;line-height:1}.pm-kpi span{font-size:13px;color:#9A94B3}
.pm-gt{margin:14px 0 6px;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9A94B3}.pm-list{list-style:none;margin:0;padding:0;display:grid}.pm-list>li+li{border-top:1px solid rgba(255,255,255,.07)}
.pm-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center;min-height:64px;padding:6px 0;color:inherit;text-decoration:none}.pm-row img,.pm-ph{width:48px;height:48px;border-radius:14px;object-fit:cover;background:#221d2c;display:block}
.pm-t{display:grid;gap:2px;min-width:0}.pm-t b{font-size:16px;font-weight:500;color:#F7F6FA;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-t small{font-size:14px;color:#9A94B3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-pill{font-style:normal;font-size:13px;font-weight:600;white-space:nowrap;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);color:#E4E1EC}.pm-pill.ok{color:#C0FA35;border-color:rgba(192,250,53,.4)}.pm-pill.hot{color:#FF00E5;border-color:rgba(255,0,229,.45)}
.pm-fee{font-size:17px;font-weight:600;color:#C0FA35;white-space:nowrap}.pm-act{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 0 12px}.pm-act button{min-height:44px;font-size:16px}
.pm-note{margin:10px 0 0;font-size:15px;line-height:1.35;color:#C7C3D6}.pm-btn{display:flex;align-items:center;justify-content:center;min-height:52px;margin-top:14px;text-decoration:none;border-radius:15px;background:#C0FA35;color:#14170A;font:600 17px Jost,sans-serif}.pm-act .primary{border:0;border-radius:15px;background:#C0FA35;color:#14170A;font-weight:600}.pm-act .secondary-button{border-radius:15px;border:1px solid rgba(255,255,255,.2);background:none;color:#E4E1EC}`;document.head.append(st);
const card=document.createElement('div');card.className='card';card.dataset.id='monitor';
card.innerHTML=`<div class="card-header" data-toggle><div class="card-header-left"><div class="card-title">МОНИТОР</div><div class="card-meta" data-meta>${esc(meta)}</div></div><div class="card-header-right"><svg class="chevron" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#ADA6C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15 12 9l-6 6"/></svg></div></div><div class="card-body-wrap"><div class="card-body-inner"><div class="card-body">${body}</div></div></div>`;
first.after(card);
card.querySelector('[data-toggle]').addEventListener('click',()=>card.classList.toggle('collapsed'));
card.addEventListener('click',e=>{const b=e.target.closest('[data-pm]');if(!b)return;const li=b.closest('li');li.querySelector('.pm-act').outerHTML=`<p class="pm-note">${b.dataset.pm==='yes'?'Ты принял приглашение — организатор пришлёт договор.':'Ты отказался — организатор увидит ответ.'}</p>`;});
})();
