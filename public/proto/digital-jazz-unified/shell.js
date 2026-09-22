'use strict';
const shellMenus={more:document.getElementById('moreMenu'),services:document.getElementById('servicesMenu'),search:document.getElementById('searchMenu')};
const shellButtons={more:document.getElementById('moreBtn'),services:document.getElementById('services'),search:document.querySelector('[data-shell="search"]')};
function closeShell(){for(const key of Object.keys(shellMenus)){shellMenus[key].hidden=true;shellMenus[key].classList.remove('open');shellButtons[key].classList.remove('is-open');shellButtons[key].setAttribute('aria-expanded','false');}document.getElementById('servicesScrim').classList.remove('open');document.getElementById('navBackdrop').classList.remove('open');}
function markShell(){const section=location.hash.slice(1)||'tournaments';shellButtons.search.classList.toggle('active',['search','discovery'].includes(section));shellButtons.services.classList.toggle('active',['tournaments','create','shop'].includes(section));}
document.addEventListener('click',e=>{
 const trigger=e.target.closest('[data-shell]');
 if(trigger){e.preventDefault();e.stopImmediatePropagation();const key=trigger.dataset.shell,wasOpen=!shellMenus[key].hidden;closeShell();if(!wasOpen){shellMenus[key].hidden=false;shellMenus[key].classList.add('open');trigger.classList.add('is-open');trigger.setAttribute('aria-expanded','true');document.getElementById(key==='more'?'navBackdrop':'servicesScrim').classList.add('open');}return;}
 if(e.target.id==='servicesScrim'||e.target.id==='navBackdrop'){closeShell();return;}
 const service=e.target.closest('[data-service]');
 if(service){const key=service.dataset.service;closeShell();if(key==='турниры')location.hash='tournaments';else if(key==='магазин')location.hash='shop';else notify('Раздел «'+key+'» — вне этого прототипа.');return;}
 const notice=e.target.closest('.nav-item[data-notice]');if(notice){closeShell();notify(notice.dataset.notice);}
 if(e.target.closest('#searchMenu a'))closeShell();
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeShell();const el=e.target.closest('[role="button"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}});
window.addEventListener('hashchange',()=>{closeShell();markShell();});
closeShell();markShell();
