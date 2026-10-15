export const CATEGORIES = [['todos','Todos'],['camisetas','Camisetas'],['bermudas','Bermudas'],['bonés','Bonés'],['tênis','Tênis']];
export function renderFilters(container, active, onChange) {
  container.replaceChildren(...CATEGORIES.map(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = label;
    b.setAttribute('aria-pressed', String(value === active));
    b.addEventListener('click', () => onChange(value));
    return b;
  }));
}
