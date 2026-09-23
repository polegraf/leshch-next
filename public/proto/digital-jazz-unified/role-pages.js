'use strict';
/* v57: роль видна на экране. Под заголовком «Турниры» — переключатель «Смотрю · Участвую · Сужу · Организую».
   В одном турнире у человека одна роль, поэтому переключателя внутри турнира нет; на карточке — метка «Ты …».
   Переключатель ролей из меню «•••» убран. */
(()=>{
const hubs=[['index.html','Смотрю','Зритель'],['participant.html','Участвую','Участник'],['judge.html','Сужу','Судья'],['organizer.html','Организую','Организатор']];
const role=document.body.dataset.tournamentRole||'Зритель';
const file=location.pathname.split('/').pop()||'index.html';
if(!hubs.some(([f])=>f===file))return;
const hub=()=>`<nav class="seg role-hub" aria-label="Мои турниры по роли">${hubs.map(([f,label,r])=>`<a href="${f}#tournaments"${r===role?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
function insert(){const main=document.querySelector('#main');if(!main||main.querySelector('.role-hub'))return;
 const sec=location.hash.slice(1)||'tournaments';if(sec!=='tournaments')return;
 const anchor=main.querySelector(':scope>.heading')||main.querySelector('.aud-heading');if(!anchor)return;
 anchor.insertAdjacentHTML('afterend',hub());}
const prev=render;render=function(){prev();insert();};
render();
})();
