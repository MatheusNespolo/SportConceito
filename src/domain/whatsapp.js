import { formatPrice } from './format.js';
export function buildWhatsAppLink(phone, product, size) {
  const lines = [`Olá! Tenho interesse no produto: ${product.nome} (${formatPrice(product.preco)})`];
  if (size) lines.push(`Tamanho: ${size}`);
  if (product.linkInstagram) lines.push(product.linkInstagram);
  return `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}
