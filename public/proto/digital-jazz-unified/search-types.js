// Restore focus after changing the audience; all options are visible in a grid.
document.addEventListener('click',event=>{
 if(!event.target.closest('.search-types button'))return;
 requestAnimationFrame(()=>document.querySelector('.search-types [aria-pressed="true"]')?.focus({preventScroll:true}));
},true);
