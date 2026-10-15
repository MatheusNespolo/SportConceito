export const filterByCategory = (products, cat) =>
  cat === 'todos' ? products : products.filter(p => p.categoria === cat);
