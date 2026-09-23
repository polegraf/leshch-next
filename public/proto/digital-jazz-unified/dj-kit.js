'use strict';
/* v57 — общие поведения для всех страниц турниров:
   1) тёмный аудиоплеер вместо системного белого;
   2) оценка по критериям: прочерк до касания, работу сначала слушают, кнопка активна только когда всё выставлено;
   3) тост не переезжает на следующий экран;
   4) возврат в список турниров — на ту же позицию прокрутки. */
(() => {
const fmt=s=>!isFinite(s)?'0:00':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const icon={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'};

/* ---------- 1. плеер ---------- */
function enhance(a){if(a.dataset.djPlayer)return;a.dataset.djPlayer='1';a.controls=false;a.hidden=true;
 const label=a.getAttribute('aria-label')||'Работа';
 const ui=document.createElement('div');ui.className='dj-player';
 ui.innerHTML=`<button type="button" class="dj-player-btn" aria-label="Слушать: ${label}">${icon.play}</button><div class="dj-player-track" role="slider" tabindex="0" aria-label="Позиция: ${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><span class="dj-player-time">0:00 / 0:00</span>`;
 a.after(ui);const btn=ui.firstElementChild,track=ui.querySelector('.dj-player-track'),bar=track.firstElementChild,time=ui.lastElementChild;
 const sync=()=>{const p=a.duration?a.currentTime/a.duration*100:0;bar.style.width=p+'%';track.setAttribute('aria-valuenow',Math.round(p));time.textContent=fmt(a.currentTime)+' / '+fmt(a.duration);};
 const state=()=>{const on=!a.paused;btn.innerHTML=on?icon.pause:icon.play;btn.setAttribute('aria-label',(on?'Пауза: ':'Слушать: ')+label);ui.classList.toggle('is-playing',on);};
 btn.addEventListener('click',()=>{if(a.paused){document.querySelectorAll('audio').forEach(o=>{if(o!==a)o.pause();});a.play().catch(()=>{});}else a.pause();});
 const seek=x=>{const r=track.getBoundingClientRect();if(a.duration)a.currentTime=Math.max(0,Math.min(1,(x-r.left)/r.width))*a.duration;};
 track.addEventListener('click',e=>seek(e.clientX));
 track.addEventListener('keydown',e=>{if(!a.duration)return;if(e.key==='ArrowRight'){a.currentTime=Math.min(a.duration,a.currentTime+5);e.preventDefault();}if(e.key==='ArrowLeft'){a.currentTime=Math.max(0,a.currentTime-5);e.preventDefault();}});
 ['timeupdate','loadedmetadata','durationchange'].forEach(t=>a.addEventListener(t,sync));['play','pause','ended'].forEach(t=>a.addEventListener(t,state));sync();}
const scan=root=>root.querySelectorAll?.('audio').forEach(enhance);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==='AUDIO')enhance(n);else scan(n);}))).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',()=>scan(document));

/* ---------- 2. оценка ---------- */
/* Разметка: <form data-score> … <div class="score-work" data-listened="false"> плеер + <fieldset disabled> ползунки с data-unset </fieldset></div> … <button data-score-submit disabled> */
function refresh(form){const btn=form.querySelector('[data-score-submit]');if(!btn)return;
 const unset=form.querySelectorAll('.score-slider input[data-unset]').length,unheard=form.querySelectorAll('.score-work[data-listened="false"]').length;
 btn.disabled=!!(unset||unheard);const hint=form.querySelector('[data-score-hint]');
 const msg=unheard?`Сначала ${form.querySelector('.score-work video')?'посмотри':'прослушай'} работу — после этого откроются критерии.`:unset?`Осталось выставить: ${unset}. Пока стоит прочерк — оценки нет.`:'Всё выставлено — можно подтверждать.';if(hint&&hint.textContent!==msg)hint.textContent=msg;}
function fill(i){i.style.setProperty('--score-fill',((i.value-i.min)/(i.max-i.min)*100)+'%');const o=i.closest('label')?.querySelector('output');if(o)o.textContent=i.value;}
window.djScoreRefresh=root=>(root||document).querySelectorAll('form[data-score]').forEach(refresh);
document.addEventListener('input',e=>{const i=e.target;if(!i.matches('.score-slider input[type=range]'))return;i.removeAttribute('data-unset');i.closest('.score-slider')?.classList.remove('is-unset');fill(i);const f=i.closest('form[data-score]');if(f)refresh(f);},true);
/* касание ползунка без сдвига тоже считается выбором */
document.addEventListener('pointerup',e=>{const i=e.target;if(i.matches?.('.score-slider input[data-unset]')&&!i.disabled)i.dispatchEvent(new Event('input',{bubbles:true}));},true);
document.addEventListener('change',e=>{const i=e.target;if(i.matches('.score-slider input[data-unset]'))i.dispatchEvent(new Event('input',{bubbles:true}));},true);
document.addEventListener('play',e=>{const w=e.target.closest?.('.score-work');if(!w||w.dataset.listened==='true')return;w.dataset.listened='true';const fs=w.querySelector('fieldset');if(fs)fs.disabled=false;const f=w.closest('form[data-score]');if(f)refresh(f);},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;window.djScoreRefresh();});}).observe(document.documentElement,{childList:true,subtree:true});

/* Один компонент оценки для всех мест, где судья ставит баллы.
   o: {attrs, name, portrait, media, criteria, scores, submitted, editable, submitLabel, note} */
window.djScoreForm=o=>{const heard=!!(o.submitted||!o.media||o.heard);
 const fields=o.criteria.map(c=>{const v=o.scores?.[c];const set=v!==undefined&&v!==null;return `<label class="score-slider${set?'':' is-unset'}"><span>${c}<output>${set?v:'—'}</output></span><input type="range" min="1" max="5" step="1" name="${c}" value="${set?v:3}" aria-label="${o.name}: ${c}" style="--score-fill:${set?(v-1)*25:0}%"${set?'':' data-unset'}><span class="score-scale">1 — слабо <span>5 — сильно</span></span></label>`;}).join('');
 return `<form data-score ${o.attrs||''} class="score-form"><div class="judge-participant"><span class="judge-avatar">${o.portrait||''}</span><div><p class="caption">Ты оцениваешь</p><h3 tabindex="-1" data-score-title>${o.name}</h3></div></div>
<div class="score-work" data-listened="${heard}">${o.media||''}${o.note?`<p class="caption">${o.note}</p>`:''}<fieldset class="score-fields"${o.submitted||!heard?' disabled':''}><legend class="visually-hidden">Оценки: ${o.name}</legend>${fields}</fieldset></div>
${o.submitted?`<p class="score-done">${tournamentStatus('Оценки подтверждены','ready')}${o.editable?'<span class="caption">Можно изменить до конца судейства</span>':''}</p>${o.editable?'<button type="button" class="secondary-button full" data-score-edit>Изменить оценку</button>':''}`:`<p class="caption" data-score-hint aria-live="polite"></p><button class="primary full" data-score-submit disabled>${o.submitLabel}</button>`}</form>`;};

/* v60: статус турнира для карточек — анонс / идёт / прошёл */
window.djStage=(phase,extra)=>phase===0?{label:'Анонс · приём заявок',tone:'pending',kind:'announce'}:phase===3?{label:'Прошёл'+(extra?' · '+extra:''),tone:'upcoming',kind:'done'}:{label:'Идёт · '+(extra||(phase===1?'приём работ':'судейство')),tone:'ready',kind:'live'};
/* v60: одна карточка турнира для всех списков — обложка, статус и главное; остальное на странице турнира */
window.djTournamentCard=o=>{const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const jury=(o.judges||[]).slice(0,3);
 return `<article class="t-card ${o.stage.kind}"${o.id!==undefined?` data-tournament-id="${o.id}"`:''}${o.urgent?' data-urgent="true"':''}${o.attrs||''}><a class="t-card-link" href="${o.href}" aria-label="${esc(o.name)} — ${esc(o.stage.label)}"><div class="t-card-cover"><img src="${o.cover}" alt="" loading="lazy"${o.coverClass?` class="${o.coverClass}"`:''}><span class="aud-badge t-card-status">${tournamentStatus(o.stage.label,o.stage.tone)}</span></div><div class="t-card-body"><p class="caption">${esc(o.category)} · ${esc(o.format)}${o.count?` · ${o.count} ${o.count%10===1&&o.count%100!==11?'участник':o.count%10>=2&&o.count%10<=4&&(o.count%100<12||o.count%100>14)?'участника':'участников'}`:''}${o.organizer?' · '+esc(o.organizer):''}</p><div class="t-card-title"><h3>${esc(o.name)}</h3><span class="aud-forward" aria-hidden="true">→</span></div>${o.dates?`<p class="t-card-date">${esc(o.dates)}</p>`:''}<dl class="t-card-facts">${jury.length?`<div class="t-card-jury"><dt>Жюри</dt><dd><span class="t-card-faces">${jury.map(j=>djPortrait(j,false)).join('')}</span><span class="t-card-names">${jury.map(j=>esc(j.replace('Судья ',''))).join(', ')}</span></dd></div>`:''}${o.prize?`<div class="t-card-prize"><dt>Приз</dt><dd>${esc(o.prize)}</dd></div>`:''}</dl>${o.role?`<p class="t-card-role">${o.role}</p>`:''}</div></a></article>`;};

/* ---------- 3. тост ---------- */
addEventListener('hashchange',()=>document.querySelector('#toast')?.classList.remove('visible'));
addEventListener('pagehide',()=>document.querySelector('#toast')?.classList.remove('visible'));

/* ---------- 4. позиция списка ---------- */
let lastY=0;const saved={};
addEventListener('scroll',()=>{lastY=scrollY;},{passive:true});
addEventListener('hashchange',e=>{const from=new URL(e.oldURL).hash||'#tournaments',to=location.hash||'#tournaments';saved[from]=lastY;
 if(to==='#tournaments'&&saved[to])requestAnimationFrame(()=>scrollTo(0,saved[to]));});
})();
