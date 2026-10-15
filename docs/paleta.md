# Paleta e tipografia - Sport Conceito

**Atualizado em 2026-10-15.** Mudamos da paleta escura "neon" (preto + azul eletrico + prata, fonte Anton) para a paleta "A - Areia e azul": visual mais suave e amigavel, estilo cartoon leve. O azul continua vindo do logo, so que suavizado.

| Token | Hex | Uso |
|---|---|---|
| --sand (--bg) | #F6EFE3 | fundo da pagina |
| --paper (--surface) | #FFFDF7 | cards, cabecalho, folha de produto |
| --sky | #DCEBFA | fundo suave (area da imagem, hero) |
| --ink (--text, --line, --silver) | #1E2A3A | texto, contornos e sombras chapadas |
| --ink-soft (--muted) | #4A5568 | texto secundario |
| --accent | #7DB8F0 (rgb 125 184 240) | botoes, chip ativo, ondas |
| --on-accent | #1E2A3A | texto sobre o azul de acento |
| --accent-2 | #FFD27A | etiqueta "Destaque", botao fechar |

## Contraste WCAG (calculado)
| Par | Razao | Resultado |
|---|---|---|
| ink sobre sand | 12.69:1 | AA/AAA ok |
| ink sobre paper | 14.26:1 | AA/AAA ok |
| ink-soft sobre paper | 7.40:1 | AA/AAA ok |
| ink-soft sobre sand | 6.58:1 | AA ok |
| ink sobre accent azul | 6.90:1 | AA ok |
| ink sobre amarelo | 10.19:1 | AA/AAA ok |
| ink sobre sky | 11.96:1 | AA/AAA ok |
| ink-soft sobre sky | 6.20:1 | AA ok |

## Elementos cartoon
Contornos de 2 a 2,5px em ink com cantos arredondados levemente irregulares; sombras chapadas deslocadas (`4px 4px 0 ink`) no lugar de brilho; hover so em `@media (hover:hover)`; transicoes de 150ms desligadas com `prefers-reduced-motion`; ondas azuis (CSS) entre hero e catalogo e acima do rodape; etiqueta amarela inclinada -6deg nos produtos em destaque.

## Fontes (ui-ux-pro-max, par "Playful Creative")
- --font-display: **Fredoka** (500/600/700) - arredondada e amigavel, para titulos, precos e botoes
- --font-body: **Nunito** (400/600/700/800) - sans arredondada, boa leitura
- `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap">`
