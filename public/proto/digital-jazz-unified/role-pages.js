'use strict';
/* v63: роль — выпадающий список в хидере рядом с «•••» («Смотрю ▾»).
   Заголовок «Турниры», подзаголовок и сегмент ролей над списком убраны, чтобы афиша поднялась к хидеру.
   Меню — тот же компонент, что «•••» (.more-menu / .nav-item, активный пункт — лайм 9%). */
(()=>{
const hubs=[['index.html','Смотрю','Зритель'],['participant.html','Участвую','Участник'],['judge.html','Сужу','Судья'],['organizer.html','Организую','Организатор']];
const role=document.body.dataset.tournamentRole||'Зритель';
const file=location.pathname.split('/').pop()||'index.html';
if(!hubs.some(([f])=>f===file))return;
const current=hubs.find(([,,r])=>r===role)||hubs[0];
const left=document.querySelector('.topbar-left');if(!left)return;
left.insertAdjacentHTML('beforeend',`<div class="more-wrap role-wrap"><button type="button" class="role-btn" id="roleBtn" aria-haspopup="true" aria-expanded="false" aria-controls="roleMenu"><span class="visually-hidden">Роль: </span>${current[1]}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
<nav class="more-menu role-menu" id="roleMenu" aria-label="Турниры по роли">${hubs.map(([f,label,r])=>`<a class="nav-item${r===role?' active':''}" href="${f}#tournaments"${r===role?' aria-current="page"':''}><span>${label}</span></a>`).join('')}</nav></div>`);
const wrap=left.querySelector('.role-wrap'),btn=wrap.querySelector('.role-btn'),menu=wrap.querySelector('.role-menu');
const set=open=>{menu.classList.toggle('open',open);btn.setAttribute('aria-expanded',open);if(open)menu.querySelector('.active')?.focus();};
btn.addEventListener('click',e=>{e.stopPropagation();set(!menu.classList.contains('open'));});
document.addEventListener('click',e=>{if(!wrap.contains(e.target))set(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){set(false);btn.focus();}});
/* роль имеет смысл только в турнирах: на остальных разделах главной кнопку прячем */
const sync=()=>{const s=location.hash.slice(1)||'tournaments';wrap.hidden=!(s==='tournaments'||s==='monitor'||s==='create'||/^t\/\d+$/.test(s));set(false);};
/* заголовок списка скрываем визуально (h1 остаётся для скринридера) */
function tidy(){const main=document.querySelector('#main');if(!main)return;const s=location.hash.slice(1)||'tournaments';if(s!=='tournaments')return;
 main.querySelectorAll(':scope>.heading,.aud-heading').forEach(h=>{const t=h.querySelector('h1');if(t)t.classList.add('visually-hidden');h.querySelectorAll(':scope>p,:scope>div>p').forEach(p=>p.remove());
  if(h.classList.contains('aud-heading')||![...h.children].some(c=>!c.classList.contains('visually-hidden')&&c.textContent.trim()))h.classList.add('visually-hidden');else h.classList.add('heading-actions');});}
const prev=render;render=function(){prev();tidy();sync();};
render();
})();
