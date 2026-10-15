# Paleta e tipografia - Sport Conceito

Origem: logo do Instagram @sportconceito_ (perfil atras de login; logo visivel): fundo preto, letras "SPORT CONCEITO" cromadas/prata com coroa, brilho neon azul eletrico. Hex definidos pelo controller.

| Token | Hex | Uso |
|---|---|---|
| --bg | #07080b | fundo |
| --surface | #11141a | cards |
| --text | #f2f4f7 | texto |
| --muted | #9aa3b2 | texto secundario |
| --line | #232833 | bordas |
| --silver | #c9ced6 | destaques cromados |
| --accent | #2b8cff (rgb 43 140 255) | acento/brilho |
| --on-accent | #07080b | texto sobre botoes de acento |

## Contraste WCAG (calculado)
- text/bg 18.18:1 AA ok; muted/bg 7.87:1 ok; muted/surface 7.25:1 ok; silver/bg 12.67:1 ok
- accent/bg 6.01:1 ok (texto/links azuis)
- #f2f4f7 sobre #2b8cff = 3.03:1 FALHA AA (texto normal) -> botoes de acento usam --on-accent #07080b: 6.01:1 ok.

## Fontes (ui-ux-pro-max, par "Gen Z Brutal", streetwear)
- --font-display: Anton; --font-body: Epilogue
- Task 5 deve usar no <head>:
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Epilogue:wght@400;500;600;700&display=swap">`
