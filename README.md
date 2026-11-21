# Belart — Loja virtual

E-commerce da **Belart**, loja de produtos personalizados de Belo Horizonte: canecas, garrafas, azulejos, xícaras, taças, blusas e outros.

## Tecnologias

| Parte | Tecnologia | Por quê |
|---|---|---|
| Site e API | [Next.js 15](https://nextjs.org) (React, App Router) | Páginas renderizadas no servidor (bom para o Google) e backend no mesmo projeto |
| Estilo | Tailwind CSS 4 | Identidade Belart centralizada em `src/app/globals.css` |
| Banco de dados | PostgreSQL no [Supabase](https://supabase.com) | Banco gerenciado, plano gratuito, também guarda as imagens |
| Acesso ao banco | [Prisma](https://www.prisma.io) | Modelo de dados em `prisma/schema.prisma` e migrations versionadas |
| Hospedagem | [Vercel](https://vercel.com) | HTTPS automático e prévia a cada branch |

## Estrutura

```text
prisma/
  schema.prisma      # modelo de dados (categorias, produtos, variações, pedidos…)
  seed.ts            # cria as categorias (6 principais + Outros)
public/
  belart-logo.png    # logo original
src/
  app/               # páginas (cada pasta é uma rota)
    page.tsx         # página inicial
    categoria/[slug] # vitrine de cada categoria
    produto/[slug]   # página do produto
    busca/           # pesquisa
  components/        # componentes reutilizáveis (cabeçalho, rodapé, card de produto…)
  config/site.ts     # WhatsApp, Instagram e textos da loja
  lib/               # conexão com o banco, consultas e formatação
```

## Como rodar no seu computador

Requisitos: **Node.js 20.9 ou mais recente** e **Git**.

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o arquivo `.env` a partir do exemplo e preencha com os dados do Supabase (veja abaixo):
   ```bash
   copy .env.example .env      # Windows (cmd/PowerShell)
   cp .env.example .env        # macOS/Linux
   ```
3. Crie as tabelas no banco e cadastre as categorias:
   ```bash
   npm run db:migrate -- --name inicio
   npm run db:seed
   ```
4. Inicie o site:
   ```bash
   npm run dev
   ```
   Abra http://localhost:3000.

### Configurar o Supabase (uma vez)

1. Crie uma conta em https://supabase.com e um projeto novo (região **South America (São Paulo)**). Guarde a senha do banco.
2. No projeto, clique em **Connect** (topo da página) → aba **ORMs** → **Prisma**.
3. Copie os valores de `DATABASE_URL` (porta 6543) e `DIRECT_URL` (porta 5432) para o seu `.env`, trocando `[YOUR-PASSWORD]` pela senha do banco.

> O `.env` contém senhas e **nunca** deve ser enviado ao GitHub (ele já está no `.gitignore`).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Site em modo desenvolvimento (recarrega ao salvar) |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Verifica problemas no código |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run db:migrate` | Aplica mudanças do `schema.prisma` no banco |
| `npm run db:seed` | Cadastra as categorias padrão (só cria as que faltam) |
| `npm run db:studio` | Abre um visualizador do banco no navegador |
| `npm run imagens:otimizar` | Converte as fotos de `imagens-originais/` em WEBP leves em `public/produtos/` |
| `npm run catalogo:importar` | Grava no banco os produtos de `prisma/catalogo.json` |

## Imagens dos produtos

### Onde ficam

| Pasta | O que vai nela | Vai para o GitHub? |
|---|---|---|
| `imagens-originais/<categoria>/` | Fotos originais, do celular ou da câmera | Não (são pesadas) |
| `public/produtos/<categoria>/` | Versões otimizadas (WEBP) que o site usa | Sim |
| `public/belart-logo.png` | Logo usada no site | Sim |
| `marca/` | Logo em alta resolução, para materiais impressos e redes | Sim |

### Formato e tamanho recomendados

- **Formato:** JPG, PNG ou WEBP (o otimizador converte tudo para WEBP).
- **Tamanho:** **1200×1200 px ou maior**, de preferência **quadrada**. As vitrines mostram as fotos em quadrado.
- **Fundo:** claro ou neutro, com boa luz e o produto centralizado.
- **Nome do arquivo:** `nome-do-produto-1.jpg`, `nome-do-produto-2.jpg`… (a ordem dos números não importa; quem define a ordem é o `catalogo.json`).

### Passo a passo para adicionar um produto com fotos

1. Copie as fotos para `imagens-originais/canecas/` (ou a categoria certa).
2. Otimize:
   ```bash
   npm run imagens:otimizar
   ```
   As versões leves aparecem em `public/produtos/canecas/`. O script avisa se alguma foto estiver pequena ou muito fora do quadrado.
3. Abra `prisma/catalogo.json` e adicione o produto. Use `prisma/catalogo.exemplo.json` como modelo. Em `"imagens"`, coloque o caminho a partir de `produtos/`:
   ```json
   "imagens": [
     { "arquivo": "canecas/caneca-floral-1.webp", "alt": "Caneca branca com flores lilás" },
     "canecas/caneca-floral-2.webp"
   ]
   ```
   A **primeira** imagem é a capa. As outras aparecem na galeria do produto.
4. Grave no banco:
   ```bash
   npm run catalogo:importar
   ```
   O importador confere tudo antes de gravar: se faltar uma foto, se a categoria não existir ou se o preço estiver errado, ele mostra o erro e não grava nada.

### Como substituir uma foto

- **Mesmo nome:** coloque a foto nova em `imagens-originais/` com o mesmo nome da antiga e rode `npm run imagens:otimizar`. A versão WEBP é recriada e, como o caminho não muda, não é preciso mexer no `catalogo.json`. Se a foto antiga continuar aparecendo, recarregue com **Ctrl + F5**.
- **Nome novo:** otimize a foto nova, troque o nome no `catalogo.json` e rode `npm run catalogo:importar`.
- **Mudar a ordem ou remover:** edite a lista `"imagens"` no `catalogo.json` e rode o importador.

### Como as fotos não ficam distorcidas nem pixelizadas

- O otimizador **nunca estica** a foto: mantém a proporção e não amplia fotos pequenas.
- As vitrines usam `object-cover`: a foto preenche o quadrado e, se não for quadrada, as bordas são **cortadas** (nunca achatadas).
- O site (`next/image`) entrega automaticamente o tamanho certo para cada tela, em WEBP ou AVIF, e só carrega as fotos quando elas aparecem na tela.
- Foto menor que 1000 px no lado menor gera um aviso, porque pode ficar pixelizada em telas grandes.

### Renovação do cache

O catálogo fica em cache para a navegação ser rápida. Depois de importar:
- **Com `REVALIDATE_SECRET` no `.env` e o site rodando:** a mudança aparece na hora.
- **Sem a chave:** aparece em até 30 s em desenvolvimento ou 10 min em produção.

### Painel administrativo (etapa 3)

O painel vai enviar as fotos para o **Supabase Storage**, otimizadas, e gravar na mesma tabela de imagens (`ProductImage`) que o importador usa hoje. Por isso nada precisa ser refeito: as fotos de `public/produtos` continuam funcionando, e as novas passam a ser enviadas pelo navegador, sem mexer no código. O `next.config.ts` já aceita imagens vindas do Supabase.

## Desempenho

- **Catálogo em cache** (`src/lib/catalog.ts`): o banco é consultado uma vez e as páginas seguintes usam a cópia guardada. Ordenação, filtros e busca acontecem em memória.
- **Modo desenvolvimento** (`npm run dev`) é sempre mais lento que o site publicado: cada página é compilada na primeira visita e não há pré-carregamento. Para sentir a velocidade real, rode:
  ```bash
  npm run build
  npm start
  ```
  Em produção, os links são **pré-carregados** quando aparecem na tela, então a troca de categoria é praticamente instantânea.

## Fluxo de trabalho com Git

- Cada etapa é desenvolvida em uma branch (`etapa-1-base`, `etapa-2-catalogo`…).
- A `main` só recebe código por Pull Request revisado.

## Situação

| Etapa | Situação |
|---|---|
| 1. Base: projeto, banco, identidade visual, layout, página inicial, categorias, busca, 404 | Concluída |
| 1.1 Ajustes: logo, desempenho, visual com degradês, fluxo de imagens | Em teste |
| 2. Catálogo completo: galeria, variações, personalização, relacionados | Pendente |
| 3. Painel administrativo com login | Pendente |
| 4. Carrinho e pedido (salvo no banco + WhatsApp) | Pendente |
| 5. Contato, política de privacidade (LGPD) | Pendente |
| 6. Publicação na Vercel e revisão final | Pendente |

## Dados da loja ainda pendentes

- E-mail de contato
- Horário de atendimento
- Local de retirada
- Regra de cobrança da entrega por Uber
