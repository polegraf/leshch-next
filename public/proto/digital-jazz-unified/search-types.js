// Restore focus after changing the audience; all options are visible in a grid.
document.addEventListener('click',event=>{
 if(!event.target.closest('[data-action="type"]'))return;
 requestAnimationFrame(()=>document.querySelector('[data-action="type"][aria-pressed="true"]')?.focus({preventScroll:true}));
},true);
