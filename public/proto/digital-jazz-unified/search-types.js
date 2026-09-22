// Preserve the row's position through the existing search re-render.
(()=>{
 let left=0;
 document.addEventListener('click',event=>{
  const button=event.target.closest('.search-types button');if(!button)return;
  left=button.parentElement.scrollLeft;
  requestAnimationFrame(()=>{
   const row=document.querySelector('.search-types');if(!row)return;
   row.scrollLeft=left;
   const active=row.querySelector('[aria-pressed="true"]');if(!active)return;
   const r=row.getBoundingClientRect(),a=active.getBoundingClientRect();
   if(a.right>r.right)row.scrollLeft+=a.right-r.right+2;
   if(a.left<r.left)row.scrollLeft-=r.left-a.left+2;
   active.focus({preventScroll:true});
  });
 },true);
})();
