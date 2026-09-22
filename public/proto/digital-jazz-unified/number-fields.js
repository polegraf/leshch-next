'use strict';
(()=>{
function enhance(){document.querySelectorAll('#main input[type="number"]:not([data-stepper])').forEach(input=>{
 input.dataset.stepper='true';const wrap=document.createElement('div');wrap.className='number-stepper';input.before(wrap);wrap.append(input);
 const field=input.closest('label');const label=field?.querySelector('span')?.textContent||'значение';input.setAttribute('aria-label',label);if(field){const group=document.createElement('div');group.className=field.className;while(field.firstChild)group.append(field.firstChild);field.replaceWith(group);}
 for(const [direction,sign] of [[-1,'−'],[1,'+']]){const b=document.createElement('button');b.type='button';b.className='number-step';b.textContent=sign;b.setAttribute('aria-label',(direction<0?'Уменьшить: ':'Увеличить: ')+label);b.addEventListener('click',e=>{e.preventDefault();const before=input.value;try{direction<0?input.stepDown():input.stepUp();}catch{return;}if(input.value!==before){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));} });direction<0?wrap.prepend(b):wrap.append(b);}
 });}
new MutationObserver(enhance).observe(document.querySelector('#main'),{childList:true,subtree:true});enhance();
})();
