'use strict';
// Retain native form values while presenting the same choice panel on every platform.
(() => {
 let serial=0;
 function closeAll(except){document.querySelectorAll('.choice.open').forEach(w=>{if(w!==except){w.classList.remove('open');w.querySelector('button').setAttribute('aria-expanded','false');w.querySelector('.choice-options').hidden=true;}});}
 function enhance(){
  document.querySelectorAll('#main select:not([data-enhanced])').forEach(select=>{
   select.dataset.enhanced='true';select.hidden=true;
   const field=select.closest('label');
   // A label must not wrap multiple interactive controls.
   const wrap=document.createElement('div');wrap.className='field';
   const caption=document.createElement('span');caption.textContent=field.querySelector('span').textContent;caption.id='choice-label-'+(++serial);
   const choice=document.createElement('div');choice.className='choice';
   const trigger=document.createElement('button');trigger.type='button';trigger.className='input choice-trigger';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-labelledby',caption.id+' choice-value-'+serial);
   const value=document.createElement('span');value.id='choice-value-'+serial;
   const svg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
   trigger.append(value);trigger.insertAdjacentHTML('beforeend',svg);
   const options=document.createElement('div');options.className='choice-options';options.id='choice-options-'+serial;options.hidden=true;options.setAttribute('role','group');options.setAttribute('aria-labelledby',caption.id);trigger.setAttribute('aria-controls',options.id);
   function sync(){value.textContent=select.options[select.selectedIndex]?.textContent||'';Array.from(options.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===select.selectedIndex)));}
   Array.from(select.options).forEach((option,i)=>{const button=document.createElement('button');button.type='button';button.className='choice-option';button.textContent=option.textContent;button.addEventListener('click',()=>{select.selectedIndex=i;sync();closeAll();select.dispatchEvent(new Event('change',{bubbles:true}));trigger.focus({preventScroll:true});});options.append(button);});
   trigger.addEventListener('click',()=>{const open=!choice.classList.contains('open');closeAll();choice.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));options.hidden=!open;});
   choice.addEventListener('keydown',e=>{const buttons=Array.from(options.children);if(e.key==='Escape'){closeAll();trigger.focus();e.stopPropagation();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(options.hidden)trigger.click();let index=buttons.indexOf(document.activeElement);index=e.key==='Home'?0:e.key==='End'?buttons.length-1:e.key==='ArrowDown'?(index+1)%buttons.length:(index-1+buttons.length)%buttons.length;buttons[index].focus();}});
   select.addEventListener('change',sync);choice.append(select,trigger,options);wrap.append(caption,choice);field.replaceWith(wrap);sync();
  });
 }
 document.addEventListener('click',e=>{if(!e.target.closest('.choice'))closeAll();if(e.target.closest('[data-action="clear-filter-form"]'))document.querySelectorAll('.choice select').forEach(s=>s.dispatchEvent(new Event('change',{bubbles:true})));});
 new MutationObserver(enhance).observe(document.querySelector('#main'),{childList:true,subtree:true});enhance();
})();
