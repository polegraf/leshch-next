/* Shared local routing. Loaded before page scripts to override legacy demo links. */
(() => {
 const base=new URL('.',document.currentScript.src);
 const routes={profile:'profile/index.html',public:'public-profile/index.html',chat:'chat/index.html',tours:'tours/index.html',search:'index.html#search',discovery:'index.html#discovery',tournaments:'index.html#tournaments',shop:'index.html#shop',monitor:'index.html#monitor'};
 const go=key=>{if(routes[key])location.href=new URL(routes[key],base).href;};
 document.addEventListener('click',e=>{
  const el=e.target.closest('[data-prototype-route],.nav-avatar,.nav-circle,[data-service],[data-action="profile"],[data-action="chat"],.write-btn');
  if(!el)return;
  let route=el.dataset.prototypeRoute;
  if(!route&&el.classList.contains('nav-avatar'))route='profile';
  if(!route&&el.classList.contains('nav-circle')){const label=(el.getAttribute('aria-label')||'').toLowerCase();if(label.includes('чат')||el.dataset.action==='chat')route='chat';else if(label.includes('поиск')&&!el.dataset.shell)route='search';}
  const services={'туры':'tours','турниры':'tournaments','магазин':'shop'};
  if(!route&&el.dataset.service)route=services[el.dataset.service];
  if(!route&&['profile','chat'].includes(el.dataset.action))route=el.dataset.action;
  if(el.classList.contains('write-btn'))route='chat';
  if(route){e.preventDefault();e.stopImmediatePropagation();go(route);}
 },true);
 document.addEventListener('DOMContentLoaded',()=>{
  if(document.body.dataset.tournamentRole)routes.monitor=location.pathname.split('/').pop()+'#monitor';
  const menu=document.querySelector('#moreMenu');
  if(menu){const links=document.createElement('nav');links.className='proto-menu-group';links.setAttribute('aria-label','Разделы прототипа');links.innerHTML='<p class="proto-menu-label">Разделы прототипа</p>';
   [['profile','Мой профиль'],['public','Публичный профиль'],['chat','Сообщения'],['search','Поиск'],['discovery','Дискавери'],['tours','Туры'],['tournaments','Турниры'],['shop','Магазин'],['monitor','Монитор турнира']].forEach(([key,label])=>{const a=document.createElement('a');a.className='proto-menu-link';a.href=new URL(routes[key],base).href;a.textContent=label;links.append(a);});menu.append(links);menu.style.maxHeight='75dvh';menu.style.overflowY='auto';}
  if(location.pathname.includes('/chat/')){const name=document.querySelector('#threadName');if(name){name.style.cursor='pointer';name.title='Открыть публичный профиль';name.addEventListener('click',()=>go('public'));}}
 });
})();
