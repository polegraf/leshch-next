(function(){
const btn=document.getElementById('moreBtn'),menu=document.getElementById('moreMenu'),backdrop=document.getElementById('navBackdrop');
function close(){menu.classList.remove('open');menu.hidden=true;backdrop.classList.remove('open');btn.setAttribute('aria-expanded','false');}
btn.addEventListener('click',function(){const open=btn.getAttribute('aria-expanded')!=='true';menu.hidden=!open;menu.classList.toggle('open',open);backdrop.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));});
backdrop.addEventListener('click',close);
menu.addEventListener('click',close);
menu.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.click();}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){close();btn.focus();}});
})();