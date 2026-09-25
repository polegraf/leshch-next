/* Дискавери: свайп влево — следующий, вправо — предыдущий. Работает для людей, компаний и турниров:
   карточка — это элемент прямо перед .discovery-controls, листание — нажатие на его кнопки ← / →.
   Вертикальная прокрутка страницы не блокируется (touch-action: pan-y). Стрелки клавиатуры тоже листают. */
(()=>{
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const st=document.createElement('style');
st.textContent='.dsw-card{touch-action:pan-y;user-select:none;-webkit-user-select:none;will-change:transform}.dsw-card img{-webkit-user-drag:none;pointer-events:none}.dsw-card.dsw-drag{cursor:grabbing}.dsw-hint{display:block;text-align:center;margin-top:8px}';
document.head.append(st);
const isDisc=()=>location.hash==='#discovery';
const controls=()=>document.querySelector('#main .discovery-controls');
const cardOf=c=>c&&c.previousElementSibling;
function mark(){const c=controls(),k=cardOf(c);if(!k||k.classList.contains('dsw-card'))return;k.classList.add('dsw-card');
 const cap=c.querySelector('.caption');if(cap&&!c.dataset.dsw){c.dataset.dsw='1';cap.setAttribute('aria-live','polite');}}
new MutationObserver(()=>{if(isDisc())mark();}).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('hashchange',()=>setTimeout(mark,0));setTimeout(mark,0);

function go(dir,k){const c=controls();if(!c)return;const bs=c.querySelectorAll('button');const b=dir>0?bs[bs.length-1]:bs[0];if(!b)return;
 const done=()=>{b.click();requestAnimationFrame(()=>{const n=cardOf(controls());if(!n||RM)return;n.animate([{transform:`translateX(${dir*48}px)`,opacity:0},{transform:'none',opacity:1}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});});};
 if(!k||RM){done();return;}
 const a=k.animate([{transform:k.style.transform||'none',opacity:1},{transform:`translateX(${-dir*110}%) rotate(${-dir*6}deg)`,opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'});
 a.onfinish=done;}

let s=null;
document.addEventListener('pointerdown',e=>{if(!isDisc()||e.button>0)return;const k=e.target.closest('.dsw-card');if(!k)return;
 s={k,x:e.clientX,y:e.clientY,t:performance.now(),dx:0,on:false,id:e.pointerId};});
document.addEventListener('pointermove',e=>{if(!s||e.pointerId!==s.id)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;
 if(!s.on){if(Math.abs(dx)<10)return;if(Math.abs(dy)>Math.abs(dx)){s=null;return;}s.on=true;s.k.classList.add('dsw-drag');try{s.k.setPointerCapture(e.pointerId);}catch{}}
 s.dx=dx;s.k.style.transform=`translateX(${dx}px) rotate(${dx/40}deg)`;});
function end(e){if(!s||(e&&e.pointerId!==s.id))return;const {k,dx,on,t}=s;s=null;k.classList.remove('dsw-drag');if(!on)return;
 const v=Math.abs(dx)/Math.max(1,performance.now()-t);
 if(Math.abs(dx)>Math.min(90,k.offsetWidth*.22)||(v>.45&&Math.abs(dx)>30)){k.dataset.dswSkip='1';go(dx<0?1:-1,k);}
 else{k.animate([{transform:k.style.transform},{transform:'none'}],{duration:180,easing:'ease-out'});k.style.transform='';k.dataset.dswSkip='1';setTimeout(()=>delete k.dataset.dswSkip,0);}}
document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
/* после свайпа не срабатывает нажатие на кнопку внутри карточки */
document.addEventListener('click',e=>{const k=e.target.closest('.dsw-card');if(k&&k.dataset.dswSkip){e.preventDefault();e.stopImmediatePropagation();delete k.dataset.dswSkip;}},true);
document.addEventListener('keydown',e=>{if(!isDisc()||e.altKey||e.metaKey||e.ctrlKey)return;if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;if(document.querySelector('dialog[open],.dja-sheet'))return;
 if(e.key==='ArrowRight'){e.preventDefault();go(1,cardOf(controls()));}else if(e.key==='ArrowLeft'){e.preventDefault();go(-1,cardOf(controls()));}});
})();
