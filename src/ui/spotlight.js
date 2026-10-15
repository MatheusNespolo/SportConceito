export function initSpotlight(root) {
  if (!matchMedia('(hover: hover)').matches) return;
  root.addEventListener('pointermove', e => {
    const el = e.target.closest('.spotlight'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}
