# Sport Conceito — Site Vitrine (Design)

Data: 2026-10-15 · Status: aprovado em conversa, aguardando revisão da spec

## 1. Objetivo
Site vitrine para a loja Sport Conceito (Instagram @sportconceito_), intuitivo, claro e com interações agradáveis (referência visual: volcom.com.br). O dono atualiza o catálogo sem mexer em código. Este projeto é a base reutilizável para o redesign do site do filmmaker Vitor Tasca (projeto 2, spec própria).

**Critérios de sucesso**
- Dono marca/desmarca "disponível" na planilha → site reflete em ~1 min, sem deploy.
- Cliente encontra um produto e inicia contato (WhatsApp ou Instagram) em ≤ 3 toques no celular.
- Lighthouse mobile ≥ 90 em Performance e Acessibilidade.

## 2. Decisões
| Tema | Decisão | Motivo |
|---|---|---|
| Fonte de dados | Google Sheets publicada como CSV | Conta do Instagram não será Comercial; API oficial indisponível e scraping viola ToS |
| Stack | Vite + HTML/CSS/JS puro, sem framework | Página única, ≤ 30 produtos, leve e reaproveitável |
| Compra | Dois botões por produto: WhatsApp (mensagem pré-preenchida com produto e tamanho) e "Ver no Instagram" (link do post) | Cliente escolhe o canal |
| Catálogo | Até ~30 itens, filtro por categoria: camisetas, bermudas, bonés, tênis | Escopo do dono |
| Paleta | Extraída do perfil do Instagram @sportconceito_ (via navegador; se bloqueado, print enviado pelo usuário) | Pedido do usuário |
| Design | Aplicar o skill `ui-ux-pro-max` na fase de implementação | Pedido do usuário |
| Hospedagem | GitHub + Cloudflare Pages (alternativa: GitHub Pages) | Gratuito, deploy automático |
| Domínio | Subdomínio gratuito DigitalPlat (ex.: sportconceito.dpdns.org); recomendação comercial: .com.br no Registro.br | Custo zero inicial |

Evolução futura: se a conta virar Comercial, trocar apenas o módulo de dados por Instagram Graph API (interface `loadProducts()` mantida).

## 3. Estrutura da página (mobile-first)
1. **Header fixo** — logo, categorias, ícone Instagram.
2. **Hero** — foto destaque + chamada "Novidades da semana".
3. **Filtros** — chips Todos / Camisetas / Bermudas / Bonés / Tênis; troca instantânea com transição suave.
4. **Grade** — 2 colunas (mobile), 4 (desktop); card: foto, nome, preço; hover com zoom (desktop).
5. **Detalhe do produto** — bottom sheet (mobile) / drawer lateral (desktop): galeria (até 2 fotos), seletor de tamanho, botões WhatsApp e Instagram. Fecha com ESC, clique fora ou gesto.
6. **Rodapé** — endereço, horário, Instagram; botão flutuante de WhatsApp.

## 4. Unidades (módulos)
| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `config.js` | URL do CSV, número do WhatsApp, @ do Instagram, textos da loja | — |
| `data/csv.js` | Parse de CSV (aspas, vírgulas, quebras) → array de objetos | — |
| `data/products.js` | `loadProducts()`: busca CSV, valida/normaliza linhas, filtra `disponivel`, cache em localStorage | csv.js, config |
| `domain/filter.js` | `filterByCategory(products, cat)` | — |
| `domain/whatsapp.js` | `buildWhatsAppLink(phone, product, size)` | — |
| `ui/grid.js`, `ui/filters.js`, `ui/product-sheet.js` | Renderização e interações | domain, data |
| `main.js` | Composição e estados (carregando, vazio, erro) | todos |

## 5. Planilha modelo
Colunas: `id | nome | categoria | preco | tamanhos | foto_url | foto2_url | link_instagram | disponivel`
- `categoria`: validação em lista (camisetas, bermudas, bonés, tênis).
- `preco`: formato BR (89,90). `tamanhos`: separados por vírgula.
- `disponivel`: caixa de seleção (TRUE/FALSE; aceitar também sim/não).
- Publicar: Arquivo → Compartilhar → Publicar na web → CSV; URL vai em `config.js`.
- Entregar `docs/guia-planilha.md` com passo a passo para o dono.

## 6. Fluxo de dados e erros
- Ao abrir: mostra skeleton → `loadProducts()` → renderiza disponíveis.
- Linha inválida (sem nome/categoria/foto/preço) → ignorada, `console.warn`.
- Foto quebrada → imagem placeholder.
- Falha de rede → último cache do localStorage; sem cache → mensagem "Veja nosso catálogo no Instagram" com link.
- Nenhum produto na categoria → estado vazio amigável.

## 7. Testes
- Vitest: csv.js, normalização em products.js (incluindo indisponível/linha inválida), filter.js, whatsapp.js (encoding da mensagem).
- Verificação manual no navegador: 375px e desktop; teclado e foco no bottom sheet; contraste AA; alt text.

## 8. Fora de escopo
Pagamentos, login/segurança, carrinho, painel admin, site do filmmaker (projeto 2), relatórios e roteiro comercial (entregáveis separados).
