// Keyboard support for the existing prototype's clickable cards.
document.querySelectorAll('[data-go], [data-sheet], #s-tours > .chips .dj-chip').forEach(function(el) {
  if (el.matches('button, input')) return;
  el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.addEventListener('keydown', function(e) {
    if (e.target !== el) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
});
