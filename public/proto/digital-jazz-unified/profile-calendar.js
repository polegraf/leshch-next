(()=>{
const box=document.querySelector('[data-id="calendar"]');if(!box)return;
const name=new URLSearchParams(location.search).get('name')||document.querySelector('.name')?.textContent.trim();
const events=(window.djCalendarEvents||[]).filter(x=>x.people.includes(name)).map(x=>{const days=x.dates.match(/\d+/g).map(Number);return {...x,start:new Date(2026,9,days[0]),end:new Date(2026,9,days[1]||days[0])};});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=x=>x.id==='cup'?'../index.html#monitor':x.id===4?'../battle.html#tournaments':x.id===2?'../voice.html#tournaments':'../event.html?id='+x.id+'#tournaments';
let month=events.length?new Date(events[0].start.getFullYear(),events[0].start.getMonth(),1):new Date(new Date().getFullYear(),new Date().getMonth(),1),selected=null;
const grid=box.querySelector('.cal-grid'),list=box.querySelector('.cal-upcoming');
box.querySelectorAll('.cal-arrow').forEach((el,i)=>{const b=document.createElement('button');b.type='button';b.className=el.className;b.textContent=el.textContent;b.setAttribute('aria-label',i?'Следующий месяц':'Предыдущий месяц');b.onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+(i?1:-1),1);selected=null;render();};el.replaceWith(b);});
function render(){box.querySelector('.cal-month').textContent=month.toLocaleDateString('ru',{month:'long'});box.querySelector('.cal-year').textContent=month.getFullYear();const y=month.getFullYear(),m=month.getMonth(),offset=(month.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),today=new Date();
grid.innerHTML=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="cal-dow">${d}</div>`).join('')+'<span></span>'.repeat(offset)+Array.from({length:days},(_,i)=>{const d=i+1,date=new Date(y,m,d),active=events.filter(x=>date>=x.start&&date<=x.end),isToday=date.toDateString()===today.toDateString();return `<button type="button" class="cal-day${isToday?' today':''}${active.length?' has-events':''}" data-day="${d}" aria-pressed="${selected===d}" aria-label="${d} ${month.toLocaleDateString('ru',{month:'long'})}: мероприятий ${active.length}">${d}${active.length?'<i aria-hidden="true"></i>':''}</button>`;}).join('');
const shown=events.filter(x=>selected?new Date(y,m,selected)>=x.start&&new Date(y,m,selected)<=x.end:x.start<=new Date(y,m+1,0)&&x.end>=month).sort((a,b)=>a.start-b.start);
list.innerHTML=`<div class="field-label">${selected?selected+' '+month.toLocaleDateString('ru',{month:'long'}):'Мероприятия месяца'}</div>`+shown.map(x=>`<a class="calendar-event" href="${href(x)}"><strong>${esc(x.name)}</strong><span>${esc(x.dates)} · 2026 →</span></a>`).join('')+(shown.length?'':'<div class="empty-hint">На этот период мероприятий нет.</div>')+(selected?'<button class="calendar-reset" type="button">Весь месяц</button>':'');
}
grid.addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){selected=Number(b.dataset.day);render();grid.querySelector(`[data-day="${selected}"]`)?.focus({preventScroll:true});}});list.addEventListener('click',e=>{if(e.target.closest('.calendar-reset')){selected=null;render();}});render();
})();
