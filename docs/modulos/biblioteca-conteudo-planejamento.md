# Módulo "Biblioteca de Conteúdo" — Planejamento

Documento de planejamento (pré-implementação) para o novo módulo que oferece aos personais um catálogo de artes prontas para redes sociais, materiais de apoio e conteúdo científico, com edição via Canva. Segue o mesmo modelo de outros módulos do StrivePersonal (`system_modules`/`tenant_modules`, catálogo mantido pelo admin global, consumo liberado por tenant).

---

## 1. Referências de mercado

Pesquisa feita em apps de personal trainer e no mecanismo do Canva que viabiliza esse tipo de catálogo.

- **MFIT Personal** e diversos "packs de artes" (Fitartes, Divulga Aê, Packs do Biel, Artes Editáveis) vendem/oferecem coleções de posts prontos para Instagram/TikTok, organizados por nicho (emagrecimento, hipertrofia, academia), com legenda sugerida já na aba de notas do Canva. O uso é sempre via **link de template do Canva** — o usuário abre o link, clica em "Usar modelo" e o Canva duplica o design para a própria conta dele.
- **TrueCoach** oferece um "Social Media Resource Bundle" (30+ templates + calendário de conteúdo) como material de apoio para os treinadores divulgarem o próprio trabalho.
- **Trainerize** foca mais em biblioteca de exercícios/receitas do que em artes de marketing, mas reforça o padrão de "conteúdo pronto pré-carregado, mantido centralmente pela plataforma".
- **PersonalGO / Vedius / Tecnofit** investem pesado em biblioteca de vídeos de exercícios com base científica — não é o nosso foco aqui, mas confirma que "biblioteca de material técnico validado" é um diferencial percebido pelo mercado (mapeia para a categoria "Estudos/Materiais de apoio" pedida).

**Achado técnico decisivo — como o Canva é aberto com os dados do próprio usuário:**
O mecanismo por trás de todos esses exemplos é o recurso nativo do Canva chamado **Template Link** (`Compartilhar → Link de modelo`). Quando alguém abre esse link:
1. Ele **não edita o arquivo original** — o Canva faz uma cópia do design e insere como um novo projeto na conta Canva de quem abriu o link.
2. Só é necessário estar logado no Canva (**funciona até com conta gratuita**) para gerar a cópia.
3. Criar o link de template exige Canva Pro/Teams do lado de quem publica (nosso admin global) — não do personal que consome.

Isso é fundamentalmente diferente da **Canva Connect API / Autofill API** (a via "enterprise", com OAuth e preenchimento automático de dados): essa API exige que **o usuário final também seja membro de uma organização Canva Enterprise**, o que é inviável para personais autônomos com conta gratuita/Pro pessoal. Por isso a recomendação técnica deste plano é: **MVP via Template Link (zero API, zero OAuth)**, com a Autofill API tratada como possível Fase 2 somente se fizer sentido (ex: se a Strive virar uma organização Canva Enterprise e quisermos automatizar preenchimento com dados do aluno/tenant — hoje não é o caso).

Sources:
- [Posts para personal trainer: como criar no Canva – MFIT Personal](https://blog.mfitpersonal.com.br/como-criar-posts-para-personal-trainer-com-o-canva/)
- [Pack Canva Personal Trainer – Fitartes](https://fitartes.com.br/)
- [TrueCoach — Content Calendar for Trainers](https://truecoach.co/blog/content-calendar-for-trainers-what-to-post-and-when/)
- [Trainerize — Best Workout Builder Software](https://www.trainerize.com/blog/workout-builder-software/)
- [Share your design as a template link — Canva Help Center](https://www.canva.com/help/share-template-link/)
- [Canva Connect APIs — Autofill guide](https://www.canva.dev/docs/connect/autofill-guide/)
- [Applying Canva Brand templates with the Autofill API](https://www.canva.dev/blog/developers/applying-canva-brand-templates/)

---

## 2. Conceito do módulo

**Nome definitivo:** Biblioteca de Conteúdo (slug `biblioteca_conteudo`)

Um catálogo central, mantido **exclusivamente pelo admin global** via web (decisão confirmada: "Materiais de apoio" e "Estudos" são sempre curadoria própria da Strive — o personal nunca sobe conteúdo próprio nessa biblioteca, nem no MVP nem depois), com itens de 3 naturezas:

| Tipo | Exemplo | Ação do personal |
|---|---|---|
| **Arte para redes sociais** | Post de Instagram/TikTok/Stories sobre "5 mitos do treino de força" | Abre o Template Link do Canva → edita na própria conta → baixa/posta |
| **Material de apoio** | PDF de anamnese, planilha de acompanhamento, e-book de nutrição básica | Baixa o arquivo (PDF/imagem) ou abre o Template Link (se for editável no Canva) |
| **Estudo / conteúdo técnico** | Resumo de artigo científico, infográfico "volume x intensidade" | Visualiza/baixa; pode ter link de template se o personal quiser adaptar o infográfico |

Todo item tem **metadados de filtro** (categoria, tema, formato, tags) para busca rápida — o padrão que os "packs" de mercado sempre organizam por nicho.

---

## 3. Fluxo do Admin Global (web)

Nova área em `/admin/biblioteca-conteudo` (mesmo padrão de outras telas do painel global).

**3.1 Estrutura de dados (rascunho)**

```
content_library_categories
  id, name, slug, kind ('arte' | 'material' | 'estudo'), icon, sort_order

content_library_items
  id, category_id, title, description
  kind ('arte' | 'material' | 'estudo')
  format ('instagram_post' | 'instagram_story' | 'tiktok' | 'pdf' | 'planilha' | 'infografico' | 'outro')
  thumbnail_url          -- preview mostrado no catálogo
  canva_template_url      -- link de template do Canva (nullable — nem todo item tem)
  file_url                -- arquivo direto para download (PDF/planilha), nullable
  suggested_caption       -- legenda sugerida (para artes de post), nullable
  tags text[]             -- ex: {emagrecimento, hipertrofia, mulheres, iniciante}
  min_plan ('free' | 'pro' | 'premium')  -- plano mínimo do tenant para o item aparecer
  status ('draft' | 'published')
  created_by, created_at, updated_at

content_library_item_saves   -- opcional: favoritos/"salvos" do personal
  id, item_id, tenant_id, personal_id (profile), created_at
```

Um item sempre tem `canva_template_url` **ou** `file_url` (ou ambos — ex: uma arte que também está disponível como PNG estático para quem não usa Canva).

**3.2 Telas do admin**

- **Lista/catálogo administrativo**: filtros por categoria/tipo/status, busca por título/tag, contagem de "salvos" por item (sinal de popularidade).
- **Criar/editar item**: formulário com upload de thumbnail, campo de link de template Canva (com validação simples de formato de URL `canva.com/design/.../view`), campo de arquivo (Storage), legenda sugerida, tags (chips), seleção de plano mínimo, categoria.
- **Gerenciar categorias**: CRUD simples de `content_library_categories`, com reordenação (mesmo padrão de outros catálogos administráveis do sistema).
- **Publicar/despublicar**: like os demais módulos, item em rascunho não aparece para os personais.

**3.3 Gate por módulo + por plano**

Segue o padrão já estabelecido (`system_modules`/`tenant_modules`, slug `biblioteca_conteudo`) para o **liga/desliga por tenant**, mais uma segunda camada: **cada item da biblioteca tem seu próprio `min_plan`**, então mesmo com o módulo ativo, tenants no plano `free` só veem os itens marcados como `free`, mostrando os demais com um selo "Disponível no plano Pro" (upsell, não bloqueio silencioso — o personal vê que existe, mas precisa evoluir de plano). **Confirmado:** o campo `min_plan` reaproveita o enum `tenant_plan` (`free | pro | premium`) que já existe em `tenants.plan` — nenhum enum novo é necessário.

---

## 4. Fluxo do Personal (web + mobile)

Nova tela `/dashboard/biblioteca` (web) e `app/(admin)/biblioteca.tsx` (mobile), seguindo o padrão de módulo com `ModuleGuard`/`requireAcademiaModuleAccess`.

**4.1 Navegação e descoberta**
- Abas ou chips no topo: **Artes** · **Materiais de apoio** · **Estudos** (mapeando o `kind`).
- Dentro de cada aba: grid de cards com thumbnail, título, badge de formato (ícone de Instagram/TikTok/PDF), e badge de plano quando o item exigir upgrade.
- Filtro por tema/tag (chips multi-seleção) + busca por texto.
- Ordenação simples: mais recentes / mais salvos.

**4.2 Ação principal — "Usar"**
- Item do tipo **arte** com `canva_template_url`: botão primário **"Editar no Canva"** → abre o link em nova aba (web) / navegador externo (mobile, via `Linking.openURL`). Como é um Template Link nativo do Canva, o próprio Canva cuida do login e da cópia para a conta do personal — não passamos nenhum dado de acesso, não guardamos token nenhum.
- Item do tipo **material**/**estudo** com `file_url`: botão **"Baixar"**.
- Quando o item tem os dois (`canva_template_url` e `file_url`): mostrar as duas ações lado a lado ("Editar no Canva" / "Baixar PNG").
- Botão secundário **"Salvar"** (favoritos) em todos os itens — pequena tela "Meus salvos" dentro do módulo.
- Se `suggested_caption` existir, mostrar num card expansível com botão "Copiar legenda" (copia pro clipboard).

**4.3 Estado sem o módulo liberado**
- Se o módulo `biblioteca_conteudo` não estiver ativo pro tenant: tela com CTA de upsell explicando o benefício (mesmo padrão visual do "coming soon" já usado em outros módulos do catálogo), sem acesso a nenhum conteúdo.
- Se o módulo está ativo mas o item exige plano superior: o item aparece esmaecido/com selo, tocar nele abre um modal "Disponível no plano Pro" com CTA para upgrade (não um erro/bloqueio seco).

---

## 5. Instruções contextuais (padrão "Guia do Max")

Reaproveitar o padrão `useGuide`/`GuideModal` já usado em Faturas e Rotinas: guia `biblioteca_conteudo` explicando que os PNGs/templates abrem no Canva do próprio personal, como funciona o "Usar modelo", e onde encontrar os itens salvos.

---

## 6. Fases de desenvolvimento

1. **Fase 0 — Fundação**: migrations (`content_library_categories`, `content_library_items`, `content_library_item_saves`), registro do módulo em `system_modules` (slug `biblioteca_conteudo`), bucket de Storage para thumbnails/arquivos com policies por tenant (aprendemos essa lição recentemente com o bucket de capas de desafio — **não esquecer as policies desta vez**).
2. **Fase 1 — Admin global (web)**: CRUD de categorias e itens, upload de thumbnail/arquivo, publicar/despublicar.
3. **Fase 2 — Consumo pelo personal (web)**: tela `/dashboard/biblioteca`, filtros, ação "Editar no Canva"/"Baixar", favoritos.
4. **Fase 3 — Consumo pelo personal (mobile)**: paridade total com o web, mesmo padrão de módulo usado em Faturas/Desafios.
5. **Fase 4 — Gate por plano + upsell**: campo `min_plan` funcionando de ponta a ponta, tela de upsell.
6. **Fase 5 (opcional, avaliar depois)**: métricas de uso (itens mais salvos/usados) para o admin global priorizar produção de conteúdo; possível integração mais profunda com Canva (Autofill API) **apenas se a Strive adotar Canva Enterprise** — hoje não é recomendado pelo custo/complexidade frente ao benefício.

## 7. Critério de conteúdo mínimo para lançamento

**Confirmado:** o módulo só é liberado para os tenants depois que o catálogo tiver **pelo menos 5 itens publicados em cada categoria criada** (Artes, Materiais de apoio, Estudos — e em qualquer subcategoria nova que vier a existir). Isso vira um checklist de "prontidão de conteúdo" antes de virar o `system_modules` para ativo por padrão, e é trabalho de curadoria separado do desenvolvimento (fica a cargo do admin global preencher via as telas da Fase 1 antes da Fase 4/lançamento geral).

---

## 8. Decisões já confirmadas

- Slug definitivo: `biblioteca_conteudo`.
- `min_plan` reaproveita o enum `tenant_plan` (`free|pro|premium`) já existente — sem novo enum.
- "Materiais de apoio" e "Estudos" são sempre curadoria exclusiva da Strive — sem upload de conteúdo próprio pelo personal, hoje ou no futuro.
- Lançamento condicionado a pelo menos 5 itens publicados por categoria.

## 9. Status de desenvolvimento

Fases 0 a 5 implementadas:

- **Fase 0–1**: fundação + CRUD admin (web) concluídos.
- **Fase 2–3**: consumo pelo personal (web `/dashboard/biblioteca` e mobile `app/(admin)/biblioteca.tsx`) concluídos, com paridade total.
- **Fase 4**: gate por plano (`min_plan`) funcionando ponta a ponta em ambas plataformas, com blur + upsell por item.
- **Fase 5**: métricas de uso implementadas — contadores `canva_open_count`/`download_count` em `content_library_items` (incrementados via RPC `increment_content_library_item_usage`, chamada pelo personal ao clicar em "Usar no Canva"/"Baixar"), painel `/admin/biblioteca/metricas` com ranking por salvos + Canva + downloads. Integração Autofill API segue não recomendada/não iniciada (depende de a Strive adotar Canva Enterprise).

**Categorias iniciais criadas** (baseadas nos padrões de mercado do §1 — MFIT/Fitartes organizam artes por nicho, TrueCoach por bundle de materiais, PersonalGO/Vedius por conteúdo técnico validado):

| Kind | Categoria |
|---|---|
| Arte | Divulgação & Captação de Alunos |
| Arte | Hipertrofia & Ganho de Massa |
| Arte | Emagrecimento & Definição |
| Arte | Motivacional & Engajamento |
| Arte | Datas Comemorativas & Sazonais |
| Material | Fichas & Planilhas de Acompanhamento |
| Material | E-books & Guias para Alunos |
| Estudo | Ciência do Treino |
| Estudo | Nutrição Aplicada |

Nenhum item foi criado ainda — cada categoria precisa de 5+ itens publicados (curadoria do admin global via `/admin/biblioteca/novo`) antes do módulo sair de `coming_soon`.
