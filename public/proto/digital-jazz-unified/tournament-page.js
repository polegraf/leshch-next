'use strict';
/* v60: в списках ролей — карточка (обложка, статус, даты крупно, жюри, приз, строка роли).
   Всё остальное — на странице турнира #t/<id> той же страницы роли, устроенной как страница Cup. */
(()=>{
const covers={0:'djs',1:'drum',2:'gerls',3:'gerls',4:'beat-video'};
const roleWord={Организатор:'ты организатор',Участник:'ты участник',Судья:'ты судья'};
const clean=n=>String(n).replace(' · тест','').replace(' · итоги','');
const prize=x=>(x.prizes?.[0]?.text||'').replace(' · демо','');
/* строка роли на карточке: что важно именно тебе */
function roleLine(x){const d=demoFor(x.id);
 if(pageRole==='Участник'&&x.demoVideo&&d.phase===3)return tournamentStatus('Твой результат: 2-е место · 23 / 30','ready');
 if(pageRole==='Организатор'){if(d.phase===0)return d.accepted?tournamentStatus('Участник A принят','ready'):d.rejected?'':tournamentStatus('Новая заявка: Участник A','action');if(d.phase===3)return d.published?tournamentStatus('Итоги опубликованы','ready'):tournamentStatus('Опубликуй итоги','action');return '';}
 return tournamentCardStatus(x.id);}
function stageOf(x){const d=demoFor(x.id);return djStage(d.published?3:d.phase);}
roleTournamentCard=function(x){return djTournamentCard({id:x.id,href:'#t/'+x.id,cover:`assets/battle/${covers[x.id]||x.cover||'djs'}.png`,coverClass:x.coverClass,stage:stageOf(x),category:x.category,format:x.format,count:x.count,name:clean(x.name),judges:x.judges,prize:prize(x),dates:x.dates,role:roleLine(x),urgent:typeof isUrgent==='function'&&isUrgent(x.id)});};

function page(id){const x=tournamentExamples.find(t=>t.id===id);if(!x)return '<div class="card empty"><h1>Турнир не найден</h1><a href="#tournaments">К турнирам</a></div>';
 const st=stageOf(x);
 const jury=x.judges.map(n=>`<article class="t-page-judge">${djPortrait(n)}<h3>${djPersonName(n)}</h3></article>`).join('');
 const prizes=(x.prizes||[]).map(p=>`<div class="t-page-prize"><span class="caption">${p.place}-е место</span><strong>${p.text.replace(' · демо','')}</strong></div>`).join('');
 return `<article class="t-page" data-tournament-id="${id}"><a class="battle-back" href="#tournaments">← Все турниры</a>
<header class="battle-cover t-page-cover"><img src="assets/battle/${covers[id]||x.cover||'djs'}.png" alt=""${x.coverClass?` class="${x.coverClass}"`:''}><div class="battle-cover-copy"><span class="aud-badge">${tournamentStatus(st.label,st.tone)}</span><p class="mon-eyebrow">${x.category} · ${x.format}${roleWord[pageRole]?' · '+roleWord[pageRole]:''}</p><h1>${clean(x.name)}</h1><p class="t-page-date">${x.dates||''}</p><p>${x.count} ${x.count%10===1&&x.count%100!==11?'участник':x.count%10>=2&&x.count%10<=4&&(x.count%100<12||x.count%100>14)?'участника':'участников'}</p></div></header>
<div class="tournament-content t-page-body">${exampleContent(id)}</div>
<section class="battle-section"><h2>Жюри</h2><div class="t-page-jury">${jury}</div></section>
${prizes?`<section class="battle-section"><h2>Призы</h2><div class="t-page-prizes">${prizes}</div></section>`:''}</article>`;}

const prev=render;
render=function(){const m=location.hash.match(/^#t\/(\d+)$/);
 if(m){if(typeof parkPanel==='function')parkPanel();document.querySelector('#main').innerHTML=page(Number(m[1]));const x=tournamentExamples.find(t=>t.id===Number(m[1]));document.title='Digital Jazz · '+(x?clean(x.name):'Турнир');
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});document.querySelector('#services')?.classList.add('active');return;}
 prev();};
render();
})();
