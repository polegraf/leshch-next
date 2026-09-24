'use strict';
/* v69: поиск и дискавери показывают тех же героев, что в турнирах: 5 судей + участники A–H.
   Один портрет, одно имя, один профиль (person.html) — из поиска, дискавери, карточек и сеток. */
(()=>{
const H=[
 {name:'Судья Вектор',city:'Москва',role:'Диджей',genre:'Хип-хоп'},
 {name:'Судья Спектр',city:'Москва',role:'Диджей',genre:'Электроника'},
 {name:'Судья Контур',city:'Санкт-Петербург',role:'Композитор',genre:'Поп'},
 {name:'Судья Пульс',city:'Москва',role:'Битмейкер',genre:'Хип-хоп'},
 {name:'Судья Искра',city:'Санкт-Петербург',role:'Вокалист',genre:'Поп'},
 {name:'Участник A',city:'Москва',role:'Диджей',genre:'Хип-хоп'},
 {name:'Участник B',city:'Санкт-Петербург',role:'Диджей',genre:'Электроника'},
 {name:'Участник C',city:'Москва',role:'Битмейкер',genre:'Хип-хоп'},
 {name:'Участник D',city:'Санкт-Петербург',role:'Битмейкер',genre:'Электроника'},
 {name:'Участник E',city:'Москва',role:'Вокалист',genre:'Поп'},
 {name:'Участник F',city:'Санкт-Петербург',role:'Вокалист',genre:'Джаз'},
 {name:'Участник G',city:'Москва',role:'Битмейкер',genre:'Электроника'},
 {name:'Участник H',city:'Москва',role:'Вокалист',genre:'Поп'}];
H.forEach(h=>{h.initials=h.name.split(' ').map(w=>w[0]).join('');h.judge=h.name.startsWith('Судья ');});
people.length=0;people.push(...H);
const clean=n=>String(n).replace(' · тест','').replace(' · итоги','');
/* турниры героя — из тех же данных, что страницы турниров */
const eventsOf=h=>(window.tournamentExamples||[]).filter(x=>h.judge?x.judges?.includes(h.name):x.roster?.includes(h.name));
const tourLine=h=>{const ev=eventsOf(h);if(!ev.length)return '';const names=ev.slice(0,2).map(x=>clean(x.name)).join(', ')+(ev.length>2?` и ещё ${ev.length-2}`:'');return (h.judge?'Судит: ':'Участвует: ')+names;};
const achievement=h=>h.name==='Участник B'?'Победитель Beat Video':h.name==='Участник A'?'2-е место · Beat Video':'';
const href=h=>`person.html?name=${encodeURIComponent(h.name)}&from=search#tournaments`;
window.djHeroes=H;window.djHeroOf=name=>H.find(h=>h.name===name);

/* поиск: карточка героя — портрет, роль, город, турниры; ведёт на профиль героя */
const prevCards=peopleCards;
peopleCards=function(){if(state.type!=='Создатели')return prevCards();const rows=results();if(!rows.length)return prevCards();
 return rows.map(h=>`<a class="card person hero-row" href="${href(h)}"><span class="portrait hero-portrait">${djPortrait(h.name,false)}</span><span class="info"><h3>${h.name}</h3><span class="secondary">${h.role} · ${h.city}</span>${achievement(h)?`<span class="hero-win">${achievement(h)}</span>`:''}${tourLine(h)?`<span class="caption">${tourLine(h)}</span>`:''}</span><svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></a>`).join('');};

/* дискавери: портрет героя во всю карточку */
const prevDisc=renderDiscovery;
renderDiscovery=function(){const list=results();if(!list.length)return prevDisc();const i=state.discovery%list.length,h=list[i];const ev=eventsOf(h);
 return `<div class="heading"><h1>Дискавери</h1><a class="text-button" href="#search">Поиск</a></div>${filterCard()}${filterChips()}<article class="discovery-card hero-discovery"><img class="hero-discovery-img" src="${djPortrait(h.name,false).match(/src="([^"]+)"/)?.[1]||''}" alt="Иллюстративный портрет: ${h.name}"><div class="discovery-content"><span class="caption">${h.judge?'Судья Digital Jazz':'Участник турниров Digital Jazz'}</span><h2>${h.name}</h2><p class="secondary">${h.city} · ${h.role}</p><div class="chips"><span class="chip active">${h.genre}</span>${ev.slice(0,2).map(x=>`<span class="chip">${clean(x.name)}</span>`).join('')}</div>${achievement(h)?`<p class="hero-win">${achievement(h)}</p>`:''}<a class="primary full battle-link" href="${href(h)}">Открыть профиль →</a></div></article><div class="discovery-controls"><button class="icon" data-action="previous" aria-label="Предыдущий профиль"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><span class="caption">${i+1} из ${list.length}</span><button class="icon" data-action="next" aria-label="Следующий профиль"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div><p class="caption progress-note">Подборка по твоим фильтрам. Портреты иллюстративные.</p>`;};
if(['search','discovery'].includes(location.hash.slice(1)))render();
})();
