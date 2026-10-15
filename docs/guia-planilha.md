# Guia da planilha — Sport Conceito

O catálogo do site é lido de uma planilha do Google. Mudou a planilha, mudou o site (pode levar alguns minutos).

## 1. Criar a planilha
No Google Planilhas, crie uma planilha nova e escreva **exatamente** este cabeçalho na linha 1 (uma coluna por item, sem espaços extras):

```
id,nome,categoria,preco,tamanhos,foto_url,foto2_url,link_instagram,disponivel
```

| Coluna | O que colocar |
|---|---|
| id | Um código único por produto (ex.: `cam-001`) |
| nome | Nome do produto |
| categoria | `camisetas`, `bermudas`, `bonés` ou `tênis` |
| preco | Preço, ex.: `89,90` |
| tamanhos | Ex.: `P, M, G` ou `38, 39, 40` |
| foto_url | Link da foto principal |
| foto2_url | Link da segunda foto (opcional) |
| link_instagram | Link do post no Instagram (opcional) |
| disponivel | Marcado = à venda; desmarcado = esgotado |

### Evitar erros de digitação
- **categoria:** selecione a coluna, menu *Dados > Validação de dados > Adicionar regra > Menu suspenso* e informe: camisetas, bermudas, bonés, tênis.
- **disponivel:** selecione a coluna e use *Inserir > Caixa de seleção*. Marcada (TRUE) = disponível. Também valem `sim`, `s`, `1` ou `x`.

## 2. Hospedar as fotos
**Google Drive:** envie a foto, clique com o botão direito > *Compartilhar* > "Qualquer pessoa com o link". Copie o link; ele tem a forma `https://drive.google.com/file/d/<ID>/view`. Copie o `<ID>` e monte:

```
https://drive.google.com/uc?export=view&id=<ID>
```

Cole esse endereço em `foto_url`.

**Alternativa — imgbb:** envie a foto em imgbb.com e copie o "link direto" (termina em .jpg ou .png).

## 3. Publicar como CSV
1. Na planilha: *Arquivo > Compartilhar > Publicar na Web*.
2. Escolha a aba do catálogo e o formato **Valores separados por vírgula (.csv)**.
3. Clique em *Publicar* e copie o link gerado.

## 4. Ligar o site à planilha
Com o link CSV em mãos, o desenvolvedor coloca no arquivo `.env` na raiz do projeto:

```
VITE_CSV_URL=https://docs.google.com/spreadsheets/d/e/....../pub?output=csv
```

(Ou, alternativamente, troca o valor de `csvUrl` em `src/config.js`.) Depois é preciso gerar o site de novo (`npm run build`) / refazer o deploy. Se usar Cloudflare Pages, cadastre `VITE_CSV_URL` também em *Settings > Environment variables*.

## 5. Exemplos do dia a dia
**Cadastrar um produto:** vá na primeira linha vazia e preencha uma célula por coluna, por exemplo:

| id | nome | categoria | preco | tamanhos | foto_url | foto2_url | link_instagram | disponivel |
|---|---|---|---|---|---|---|---|---|
| cam-014 | Camiseta Dry Fit Preta | camisetas | 89,90 | P, M, G | (link da foto) | | (link do post) | marcado |

**Esgotar um produto:** ache a linha dele e desmarque a caixa da coluna `disponivel`. Ele continua aparecendo, marcado como indisponível. Para voltar a vender, marque de novo.
