'use strict';
(()=>{
const roles=[['organizer.html','Организатор'],['participant.html','Участник'],['judge.html','Судья'],['viewer.html','Зритель']];
const current=document.body.dataset.tournamentRole||'Зритель';
const anchor=document.getElementById('moreBtn');if(!anchor)return;
const box=document.createElement('details');box.className='role-page-select';
box.innerHTML=`<summary aria-label="Временный выбор страницы роли">${current}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><nav aria-label="Страницы ролей турнира">${roles.map(([file,label])=>`<a href="${file}#tournaments" ${label===current?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
anchor.insertAdjacentElement('afterend',box);
document.addEventListener('click',e=>{if(!box.contains(e.target))box.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')box.open=false;});
})();
