# Sport Conceito — site

Vitrine estática (Vite, JavaScript puro) com catálogo lido de uma planilha Google publicada como CSV. Dono da loja: veja [docs/guia-planilha.md](docs/guia-planilha.md).

## Desenvolvimento
```
npm install
npm run dev      # servidor local
npm test         # testes (vitest)
npm run build    # gera a pasta dist/
```

Configuração em `src/config.js` (WhatsApp, Instagram, horário). A loja é só virtual, sem endereço físico. A URL da planilha vem de `VITE_CSV_URL` (arquivo `.env`); sem ela, usa a planilha publicada definida em `src/config.js`.

## Antes de publicar
- [ ] Conferir o número de WhatsApp e o horário de atendimento em `src/config.js`.
- [ ] Definir `VITE_CSV_URL` (link CSV da planilha publicada).
- [ ] Rodar o Lighthouse (mobile) no Chrome DevTools e buscar >= 90 em Performance e Acessibilidade.

## Deploy no Cloudflare Pages
1. Suba o repositório no GitHub.
2. No Cloudflare: *Workers & Pages > Create > Pages > Connect to Git* e escolha o repositório.
3. Build command: `npm run build` — Build output directory: `dist`.
4. Em *Environment variables*, adicione `VITE_CSV_URL` com o link CSV da planilha.
5. Salve e faça o deploy. O site fica em `<projeto>.pages.dev`.

## Subdomínio gratuito (DigitalPlat FreeDomain)
1. Registre o subdomínio no painel do DigitalPlat FreeDomain.
2. No DNS do painel, crie um registro **CNAME** do subdomínio apontando para `<projeto>.pages.dev`.
3. No Cloudflare Pages: projeto > *Custom domains > Set up a custom domain* e informe o subdomínio; siga as instruções de verificação.

Para uma loja comercial, recomenda-se um domínio **.com.br** no Registro.br (cerca de R$ 40/ano): mais confiança para o cliente e controle total do DNS.
