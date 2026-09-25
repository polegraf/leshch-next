'use strict';
/* Старт: один экран. Смотреть можно без входа; аккаунт спрашиваем, только когда он нужен для выбранного пути. */
(()=>{
const main=document.querySelector('#main'),A=window.djAccess;
/* вошедшему — сразу его дом: зрителю афиша, профессионалу профиль с монитором */
if(A.signed&&!location.hash.includes('stay')){location.replace(A.home());return;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC={see:'<path d="M3.5 9.2V7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v2.2a2.5 2.5 0 0 0 0 5V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-1.8a2.5 2.5 0 0 0 0-5Z"/>',me:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8"/>',org:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'};
const PATHS=[['see','Ходить на события','Афиша, билеты, любимые артисты. Без регистрации.','../dj-afisha/index.html'],['me','Показать себя и найти работу','Профиль артиста, портфолио, райдер, предложения',''],['org','Собрать событие','Площадки, лайн-ап, подрядчики, билеты','']];
function render(){const p=A.signed&&A.active();
 main.innerHTML=`<div class="st"><header class="st-hero"><img src="../dj-event-builder/covers/jazz-band.jpg" alt=""><div class="st-hero-c"><p class="st-eyebrow">Digital Jazz</p><h1>${p?`Привет, ${esc((A.profiles().find(x=>x.type==='personal')||p).name)}`:'Музыка, люди и события'}</h1><p class="st-sub">Афиша, баттлы, артисты и организаторы — в одном месте.</p></div></header>
 <a class="primary st-btn" href="../dj-afisha/index.html">Смотреть афишу</a>
 <h2>С чего начнём?</h2><div class="st-paths">${PATHS.map(([k,t,d,h])=>`<${h?`a href="${h}"`:`button type="button" data-st="${k}"`} class="card st-path"><span class="st-i"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg></span><span class="st-t"><b>${t}</b><small>${d}</small></span><svg class="st-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></${h?'a':'button'}>`).join('')}</div>
 ${p?`<button type="button" class="text-button st-link" data-st="profiles">Ты вошёл как ${esc(p.name)} · сменить профиль</button>`:`<button type="button" class="text-button st-link" data-st="login">Уже есть аккаунт? Войти</button>`}</div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;const k=b.dataset.st;
 if(k==='me')A.require('Войди, чтобы создать профиль артиста',()=>{location.href=A.home();},{need:['artist'],needTitle:'Профиль артиста или специалиста'});
 if(k==='org')A.require('Войди, чтобы собрать событие',()=>{location.href=A.home();},{need:['org','venue','company'],needTitle:'Событие собирается от имени организатора'});
 if(k==='login')A.require('Вход в Digital Jazz',()=>{location.href=A.home();});
 if(k==='profiles')A.profilesMenu();});
document.addEventListener('dj-access',render);
render();
})();
