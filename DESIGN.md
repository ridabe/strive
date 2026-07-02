---
name: StrivePersonal
description: Painel de gerenciamento para personal trainers — escuro, preciso, orientado a performance
colors:
  bg-void:
    "#0E0E1A"
  surface-deep:
    "#1A1A2E"
  surface-border:
    "#2A2A45"
  brand-lime:
    "#E8FF47"
  brand-lime-deep:
    "#C8E600"
  text-primary:
    "#FFFFFF"
  text-secondary:
    "#B0B0C3"
  text-inverse:
    "#000000"
  status-success:
    "#22C55E"
  status-error:
    "#EF4444"
  status-warning:
    "#F59E0B"
  max-violet:
    "#7C3AED"
  max-violet-light:
    "#A78BFA"
typography:
  display:
    fontFamily: "var(--font-syncopate), sans-serif"
    fontWeight: 700
    letterSpacing: "0.05em"
  body:
    fontFamily: "var(--font-dm-sans), sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-dm-sans), sans-serif"
    fontWeight: 600
    fontSize: "0.875rem"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.brand-lime}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-lime-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.brand-lime}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  input-field:
    backgroundColor: "{colors.bg-void}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface-deep}"
    rounded: "{rounded.xl}"
---

# Design System: StrivePersonal

## 1. Overview

**Creative North Star: "The Performance Terminal"**

StrivePersonal é o painel de controle de alta performance do personal trainer: um ambiente escuro, disciplinado e técnico, onde cada tela existe para servir uma tarefa — montar um plano de treino, acompanhar um aluno, revisar dados. O breu de fundo (`#0E0E1A`) não é decoração atmosférica, é o silêncio de fundo de um terminal; o lima elétrico (`#E8FF47`) é o único sinal que se acende quando algo precisa de atenção: uma ação primária, um estado ativo, um foco de input. O sistema rejeita explicitamente o clichê de app fitness genérico (gradientes motivacionais, ícones de "energia" decorativos, cores quentes de "vibe de academia") em favor de uma estética de ferramenta profissional — mais Linear ou painel de trading do que Instagram fitness.

**Key Characteristics:**
- Tema escuro fixo, sem modo claro — o contraste é a linguagem
- Um único accent (lima) usado com raridade, nunca como decoração
- Hierarquia tipográfica curta: display (Syncopate, só títulos/marca) + body (DM Sans, tudo o mais)
- Superfícies em camadas (void → surface → border), sem sombra
- Tátil e confiante: bordas nítidas, estados de hover claros, zero ambiguidade sobre o que é clicável

## 2. Colors

Paleta restrita: um fundo quase-preto, uma camada de superfície ligeiramente mais clara, e um único accent lima que carrega toda a energia visual do sistema.

### Primary
- **Lima Elétrico** (#E8FF47): ação primária, estado ativo/selecionado, foco de input, indicadores de progresso. Usado com raridade — nunca em blocos grandes de cor.
- **Lima Profundo** (#C8E600): estado hover/pressed do accent primário; nunca a cor de repouso.

### Neutral
- **Vazio** (#0E0E1A): cor de fundo base de toda a aplicação — o "void" sobre o qual tudo flutua.
- **Superfície Funda** (#1A1A2E): cards, painéis, modais — a primeira camada acima do vazio.
- **Borda de Superfície** (#2A2A45): divisores, bordas de card/input, contorno sutil entre camadas.
- **Texto Primário** (#FFFFFF): texto principal sobre fundo escuro.
- **Texto Secundário** (#B0B0C3): labels, legendas, texto de apoio.
- **Texto Inverso** (#000000): texto sobre o accent lima (ex: dentro de botões primários).

### Status
- **Sucesso** (#22C55E), **Erro** (#EF4444), **Alerta** (#F59E0B): vocabulário semântico de estado, usados apenas em contexto de feedback (toasts, badges, validação), nunca como decoração.

### Secondary — Max IA (escopo restrito)
- **Violeta Max** (#7C3AED) / **Violeta Max Claro** (#A78BFA): accent secundário e intencional, exclusivo da identidade do assistente de IA "Max" (avatar, glow, badge "Assistente de IA", CTA "Quero o Max no meu painel", feature cards do Max). Nunca usado fora de menções diretas ao Max — o restante do produto permanece no accent lima único.

### Named Rules
**A Regra da Voz Única.** O lima elétrico é usado em no máximo uma ação de destaque por tela. Sua raridade é o que o torna um sinal, não ruído.

**A Regra do Segundo Sinal Contido.** O violeta do Max é a única exceção à Voz Única — mas só existe dentro do bloco/identidade do Max. Se o violeta aparecer em qualquer elemento que não seja o assistente de IA, é um bug de design, não uma variação de marca.

## 3. Typography

**Display Font:** Syncopate (com fallback sans-serif)
**Body Font:** DM Sans (com fallback sans-serif)

**Character:** Syncopate é geométrica, espaçada e técnica — reservada para títulos curtos e a marca. DM Sans carrega todo o resto: humanista o suficiente para não parecer frio, neutra o suficiente para não competir com os dados na tela.

### Hierarchy
- **Display** (700, tracking 0.05em): títulos de seção, wordmark, headers de página. Uso pontual, nunca em blocos de texto.
- **Title** (600, DM Sans): títulos de card, cabeçalhos de tabela.
- **Body** (400, DM Sans, line-height 1.5): texto corrido, descrições, conteúdo de formulário.
- **Label** (600, 0.875rem, DM Sans): rótulos de campo, botões, badges de estado.

### Named Rules
**A Regra do Display Raro.** Syncopate nunca aparece em botões, labels ou dados — apenas em títulos de marca e headers de destaque. Usá-la em UI operacional quebra a legibilidade que o produto exige.

## 4. Elevation

Sistema flat por padrão: a profundidade vem de camadas de superfície (vazio → superfície funda → borda), não de sombra. Isso mantém o painel silencioso e técnico em vez de "flutuante". A exceção é overlay modal (popups, diálogos), que recebe uma sombra pronunciada para se destacar fisicamente do conteúdo por trás.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5)` / Tailwind `shadow-2xl`): reservado para modais e popups sobre o conteúdo principal.

### Named Rules
**A Regra do Flat-Por-Padrão.** Superfícies são planas em repouso. Sombra só aparece quando um elemento precisa se destacar fisicamente do plano de fundo (modal, popup) — nunca como enfeite de card ou botão.

## 5. Components

### Buttons
- **Shape:** cantos suavemente arredondados (12px / `rounded-lg`)
- **Primary:** fundo lima elétrico, texto preto (#000000), padding 12px 16px, peso semibold
- **Hover / Focus:** fundo muda para lima profundo (#C8E600); transição de cor suave (`transition-colors`)
- **Secondary / Ghost:** fundo transparente, borda lima a 40% de opacidade, texto lima; hover preenche fundo lima a 10%

### Cards / Containers
- **Corner Style:** 16px (`rounded-xl`) para cards principais; 12px (`rounded-lg`) para blocos menores
- **Background:** superfície funda (#1A1A2E) sobre o vazio (#0E0E1A)
- **Shadow Strategy:** nenhuma — a diferenciação de camada vem da cor de fundo e da borda
- **Border:** 1px cor de borda de superfície (#2A2A45)
- **Internal Padding:** 16px (base) a 24px (lg), conforme densidade de conteúdo

### Inputs / Fields
- **Style:** fundo vazio (#0E0E1A), borda de superfície, cantos 12px (`rounded-lg`), padding 10px 12px
- **Focus:** borda muda para lima elétrico, sem glow — mudança de cor é suficiente
- **Error / Disabled:** borda vermelha de status em erro; opacidade reduzida (60%) e cursor not-allowed em disabled

### Navigation
- Sidebar com item ativo destacado por texto lima ou fundo de borda de superfície a 30% de opacidade; hover sutil sem mudança de forma.

## 6. Do's and Don'ts

### Do:
- **Do** usar o lima elétrico (#E8FF47) apenas para a ação primária de cada tela — nunca para decoração ou preenchimento de área grande.
- **Do** manter cantos entre 8px e 16px conforme a escala definida; consistência de forma entre botão, card e input.
- **Do** usar transições de cor simples (`transition-colors`, 150–250ms) em hover/focus — nada de choreografia.
- **Do** reservar Syncopate para títulos e marca; DM Sans para tudo operacional.

### Don't:
- **Don't** usar gradientes motivacionais, ícones de "chama"/"energia" decorativos ou paleta quente típica de apps de academia genéricos.
- **Don't** adicionar sombra em cards ou botões em repouso — a profundidade vem de camada de superfície, não de `box-shadow`.
- **Don't** usar Syncopate em botões, labels, tabelas ou qualquer texto operacional — quebra a legibilidade do produto.
- **Don't** usar o lima elétrico em mais de uma ação de destaque por tela — isso dilui o sinal e o transforma em ruído.
