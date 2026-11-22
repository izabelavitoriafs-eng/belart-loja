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
| `npm run admin:criar` | Cria o acesso ao painel ou troca a senha |

## Painel administrativo

Endereço: **/admin** (no computador: http://localhost:3000/admin). Só entram os e-mails listados em `ADMIN_EMAILS` no `.env`.

### Configuração (uma vez)

1. No Supabase, em **Project Settings → API Keys** (ou **API**), copie para o `.env`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - chave **publishable** (ou `anon public`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - chave **secret** (ou `service_role`) → `SUPABASE_SECRET_KEY` (secreta: nunca compartilhe nem envie ao GitHub)
2. No Supabase, em **Authentication → Sign In / Providers**, desative **"Allow new users to sign up"**. Assim ninguém cria conta sozinho; o acesso é criado só pelo comando abaixo.
3. Crie a sua senha do painel:
   ```bash
   npm run admin:criar
   ```
   A senha é digitada no terminal e não aparece na tela. Para **trocar a senha** (ou se esquecer), rode o mesmo comando de novo.
4. Reinicie o site (`npm run dev`) e entre em `/admin`.

### O que dá para fazer

- **Produtos:** cadastrar, editar, excluir, alterar preço e descrição, marcar como indisponível, destacar na página inicial, marcar como mais vendido e ativar a visualização 3D.
- **Fotos:** enviar várias de uma vez, reordenar (a primeira é a capa), substituir, excluir e editar a descrição. Cada foto é padronizada automaticamente, igual ao script `imagens:otimizar`. A sequência do **giro 360°** também pode ser enviada pelo painel.
- **Variações** (cor, tamanho, capacidade…) com acréscimo de preço e disponibilidade, e **campos de personalização**.
- **Categorias:** criar, renomear, reordenar o menu, esconder da loja e excluir (quando não houver produtos nela).
- **Dados da loja:** e-mail, horário, retirada e regra da entrega por Uber.

Tudo o que é salvo no painel aparece **na hora** na loja.

As fotos enviadas pelo painel ficam no **Supabase Storage** (bucket público `produtos`, criado automaticamente no primeiro envio). As fotos já cadastradas pelo VS Code (`public/produtos`) continuam funcionando, e o importador (`catalogo:importar`) continua disponível. Atenção: o importador **substitui** as fotos, variações e personalizações dos produtos que estão no `catalogo.json`. Depois de começar a usar o painel, prefira editar por lá.

## Imagens dos produtos

### Onde ficam

| Pasta | O que vai nela | Vai para o GitHub? |
|---|---|---|
| `imagens-originais/<categoria>/` | Fotos originais, do celular ou da câmera | Não (são pesadas) |
| `public/produtos/<categoria>/` | Versões otimizadas (WEBP) que o site usa | Sim |
| `public/belart-logo.png` | Logo usada no site | Sim |
| `marca/` | Logo em alta resolução, para materiais impressos e redes | Sim |

### Padrão das fotos

O otimizador **padroniza** todas as fotos da galeria automaticamente:
- todas ficam **quadradas, 1600×1600 px**, com o produto inteiro centralizado, sem corte e sem distorção;
- em **fundo liso** (branco, por exemplo), o produto é reenquadrado para ocupar sempre a mesma área do quadro, com a mesma margem;
- em **fundo de cenário** (mesa, parede), as laterais são completadas com a própria foto desfocada.

O que o programa **não** consegue fazer é deixar iguais fotos tiradas de jeitos diferentes. Para a loja ficar uniforme, fotografe sempre assim:

| Item | Padrão Belart |
|---|---|
| Fundo | **Branco liso** (cartolina ou papel paraná branco fazendo uma curva atrás e embaixo do produto) |
| Luz | Natural de janela, indireta, ou 2 luzes iguais dos lados; sem flash |
| Câmera | Celular na **mesma altura** do produto, sempre à mesma distância (de preferência num tripé) |
| Enquadramento | Produto inteiro, centralizado, com folga em volta; foto quadrada (1:1) ou horizontal |
| Resolução | **1600×1600 px ou maior** (qualquer celular atual atende) |
| Fotos por produto | 1) frente (capa), 2) lado com a alça, 3) detalhe da personalização, 4) costas ou em uso |
| Formato | JPG, PNG ou WEBP (o otimizador converte para WEBP) |

Para forçar um fundo específico: `npm run imagens:otimizar -- --fundo=#ffffff`. Para refazer fotos já otimizadas: `npm run imagens:otimizar -- --forcar`.
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

- O otimizador **nunca estica** a foto: mantém a proporção e enquadra num quadrado completando o fundo.
- Como todas as fotos saem quadradas, as vitrines e a galeria mostram o produto inteiro, sem cortes.
- O site (`next/image`) entrega automaticamente o tamanho certo para cada tela, em WEBP ou AVIF, e só carrega as fotos quando elas aparecem na tela.
- Foto menor que 1000 px no lado menor gera um aviso: ela é ampliada para 1600 px e fica sem nitidez no zoom.

### Visualização 360° (opcional por produto)

O giro 360° é uma **sequência de fotos de verdade** do produto, cada uma com ele um pouco mais girado. O cliente arrasta (mouse ou dedo) e o site troca as fotos. Não é vídeo nem animação.

**Como fotografar:**
1. Use um **prato giratório** (de bolo ou de fotografia) e marque 24 ou 36 posições iguais (a cada 15° ou 10°).
2. Câmera ou celular **fixos num tripé**, sempre na mesma altura, distância e zoom.
3. **Fundo liso e luz constante.** Desligue o flash automático e trave o foco e a exposição.
4. Gire o produto **no sentido horário (visto de cima)** e tire uma foto em cada posição, começando com a frente do produto voltada para a câmera.
5. Mínimo de **8 fotos**. O ideal é **24 a 36**: com menos, o giro fica "aos pulos".

**Como cadastrar:**
1. Coloque as fotos numa pasta terminada em `-360`, numeradas na ordem:
   `imagens-originais/canecas/caneca-floral-360/01.jpg`, `02.jpg`, … `36.jpg`
2. Rode `npm run imagens:otimizar`. As fotos vão para `public/produtos/canecas/caneca-floral-360/`.
3. No `catalogo.json`, acrescente ao produto:
   ```json
   "giro360": "canecas/caneca-floral-360"
   ```
   Se fotografou girando ao contrário (anti-horário), acrescente também `"giro360Invertido": true`.
4. Rode `npm run catalogo:importar`.

**Para remover o 360° de um produto:** apague a linha `"giro360"` e rode o importador. **Para substituir:** troque as fotos da pasta e rode o otimizador e o importador.

Quem não tiver `giro360` mostra só a galeria de fotos com zoom.

**Como o cliente vê a galeria:**
- **Foto principal:** estática. Clicar (ou tocar) abre a tela cheia.
- **Tela cheia:** zoom de até 3× pelos botões + e − (25% por clique), pela roda do mouse, por pinça no celular ou toque duplo (2×). Dá para arrastar a foto ampliada e deslizar para trocar de foto.
- **360°:** aparece como miniatura "360°" logo depois da capa, com o aviso "Arraste para girar". O primeiro quadro aparece na hora e os outros são baixados só quando o visualizador entra na tela.

**Página de teste:** com `npm run dev`, abra http://localhost:3000/dev/visualizador para testar a galeria, o zoom e o 360°. Ela usa uma sequência de demonstração gerada por computador e não existe no site publicado.

### Visualização 3D (opcional por produto)

A visualização 3D é um **modelo tridimensional** do produto, desenhado no navegador (Three.js/WebGL). O cliente gira em qualquer direção, inclusive vê de cima e de baixo, e aproxima. Não precisa de fotos.

- **Para ativar num produto:** acrescente `"modelo3d": "caneca"` no `catalogo.json` e rode `npm run catalogo:importar`.
- **Para desativar:** apague a linha e rode o importador.
- **Modelos disponíveis:** `caneca`, `xicara`, `garrafa`, `taca`, `azulejo` (20×20 com suporte) e `blusa`. No painel, escolha em "Visualização 3D". Novos modelos podem ser acrescentados em `src/components/model-3d-viewer.tsx` e `src/lib/models-3d.ts`.
- **Desempenho:** a biblioteca 3D só é baixada quando o cliente toca na miniatura "3D". A animação pausa quando o visualizador sai da tela.
- **Navegador sem suporte a 3D** (raro): aparece uma mensagem e as fotos continuam funcionando.
- **Arte do cliente aplicada no 3D:** etapa futura, separada.

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
| 1.1 Ajustes: logo, desempenho, visual com degradês, fluxo de imagens | Concluída |
| 2. Página de produto: galeria com zoom, 3D, 360°, variações, personalização, relacionados | Concluída |
| 3. Painel administrativo com login | Em teste |
| 4. Carrinho e pedido (salvo no banco + WhatsApp) | Pendente |
| 5. Contato, política de privacidade (LGPD) | Pendente |
| 6. Publicação na Vercel e revisão final | Pendente |

## Dados da loja ainda pendentes

- E-mail de contato
- Horário de atendimento
- Local de retirada
- Regra de cobrança da entrega por Uber
