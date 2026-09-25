/* Профиль → «Мои билеты»: заказы из афиши (dj-afisha), хранятся в этом браузере. Карточка встаёт после календаря. */
(()=>{
const cal=document.querySelector('[data-id="calendar"]');if(!cal)return;
let O=[];try{O=JSON.parse(localStorage.getItem('dj-afisha-orders')||'[]');if(!Array.isArray(O))O=[];}catch{O=[];}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const A='../../dj-afisha/index.html',n=O.reduce((a,o)=>a+o.count,0);
const up=O.filter(o=>!o.iso||new Date(o.iso)>=new Date(2026,8,23)).sort((a,b)=>(a.iso||'').localeCompare(b.iso||''));
const st=document.createElement('style');st.textContent='.mt-list{list-style:none;margin:0;padding:0;display:grid}.mt-list li+li{border-top:1px solid rgba(255,255,255,.07)}.mt-list a{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;min-height:68px;color:inherit;text-decoration:none}.mt-list img{width:52px;height:52px;border-radius:14px;object-fit:cover}.mt-t{display:grid;gap:2px;min-width:0}.mt-t b{font-size:17px;font-weight:500;color:#F7F6FA;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mt-t small{font-size:14px;color:#8E88A8}.mt-d{font-size:15px;font-weight:600;color:#C0FA35;white-space:nowrap}.mt-empty{display:grid;gap:10px;justify-items:start}.mt-go{color:#C0FA35;font-weight:600;text-decoration:none}';document.head.append(st);
const card=document.createElement('div');card.className='card collapsed';card.dataset.id='tickets';
card.innerHTML=`<div class="card-header" data-toggle><div class="card-header-left"><div class="card-title">МОИ БИЛЕТЫ</div><div class="card-meta" data-meta>${n?`${n} · ближайшее ${esc(up[0]?.dateText||'')}`:'пока нет'}</div></div><div class="card-header-right"><svg class="chevron" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#ADA6C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15 12 9l-6 6"/></svg></div></div>
<div class="card-body-wrap"><div class="card-body-inner"><div class="card-body">${O.length?`<ul class="mt-list">${O.map(o=>`<li><a href="${A}#o/${esc(o.id)}">${o.cover?`<img src="${esc(o.cover.replace('../','../../'))}" alt="">`:'<span></span>'}<span class="mt-t"><b>${esc(o.name)}</b><small>${esc(o.time)} · ${esc(o.venue)} · ${o.count} ${o.reg?'мест.':'бил.'}</small></span><span class="mt-d">${esc((o.dateText||'').split(',')[0])}</span></a></li>`).join('')}</ul>`:`<div class="mt-empty"><p class="secondary">Купленные в афише билеты появятся здесь.</p><a class="mt-go" href="${A}">В афишу →</a></div>`}</div></div></div>`;
cal.after(card);
card.querySelector('[data-toggle]').addEventListener('click',()=>card.classList.toggle('collapsed'));
if(location.hash==='#tickets'){card.classList.remove('collapsed');setTimeout(()=>card.scrollIntoView({block:'start'}),50);}
})();
