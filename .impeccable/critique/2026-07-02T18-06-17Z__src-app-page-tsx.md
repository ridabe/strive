---
target: home (src/app/page.tsx)
total_score: 26
p0_count: 2
p1_count: 2
timestamp: 2026-07-02T18-06-17Z
slug: src-app-page-tsx
---
Method: dual-agent (A: general-purpose sub-agent · B: general-purpose sub-agent)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Nenhum destaque de âncora ativa apesar de 5 links de nav |
| 2 | Match System / Real World | 4 | Linguagem de domínio forte e precisa (before/after WhatsApp+planilha) |
| 3 | User Control and Freedom | 4 | Nav por âncora simples, sem armadilhas |
| 4 | Consistency and Standards | 1 | Lima usado quase em toda parte (quebra a Regra da Voz Única) + violeta não documentado |
| 5 | Error Prevention | 3 | Sem formulários na página; mismatch de copy/destino no CTA do Elite |
| 6 | Recognition Rather Than Recall | 3 | Labels de nav visíveis, FAQ totalmente exposto |
| 7 | Flexibility and Efficiency | 2 | Caminho único e linear, sem atalhos (aceitável para landing) |
| 8 | Aesthetic and Minimalist Design | 1 | Dois accents, glow/blur constante, emojis, 13 seções |
| 9 | Error Recovery | 3 | Sem formulários interativos para falhar (n/a parcial) |
| 10 | Help and Documentation | 3 | FAQ genuinamente útil, responde objeções reais |
| **Total** | | **26/40** | **Acceptable** |

#### Anti-Patterns Verdict

**Start here.** Sim, isso lê como gerado por IA.

**LLM assessment**: As 5 seções de módulo (Treinos, Nutrição, Ranqueamento, Mensagens, Agenda) compartilham um template idêntico — badge de pílula → título uppercase → parágrafo → lista de 4 checkmarks → screenshot de celular, alternando lados — o clássico padrão de "vitrine de features infinita". Isso é agravado por emojis decorativos nas tags (💪🥗🏆💬📅), que contradizem diretamente o próprio anti-reference do PRODUCT.md ("ícones de chama/energia decorativos"); um bloco de 5 estrelas sem atribuição no CTA final; e efeitos de blur/glow pesados e repetidos (`blur-[120px]`, `blur-[80px]`, `blur-[140px]`, múltiplos `shadow-[...]` de glow em botões/cards) que contradizem a própria regra do DESIGN.md de "flat-por-padrão, sem sombra exceto em overlays/modais".

**Deterministic scan**: `node .agents/skills/impeccable/scripts/detect.mjs --json src/app/page.tsx` rodou com exit code 2 e encontrou **1 finding**: `bounce-easing` (severity: warning) na linha 562 — o chevron indicador de scroll usa `animate-bounce` do Tailwind. Não é falso positivo: é um hit legítimo, e reforça o ponto #8 da tabela de heurísticas — mesmo um detalhe pequeno de animação destoa do ethos "terminal disciplinado" documentado no DESIGN.md. Nenhum outro finding foi disparado; o detector não tem regra para "cor não documentada existe", então o accent violeta (ver abaixo) só foi capturado pela revisão de design, não pelo scan determinístico.

**Visual overlays**: Não disponível nesta sessão — nenhuma ferramenta de browser automation/screenshot estava exposta a nenhum dos dois sub-agentes. Ambas as avaliações trabalharam a partir do código-fonte (JSX, classes Tailwind, estilos inline) cruzado com `PRODUCT.md`/`DESIGN.md`. Nenhum overlay visível foi gerado; o sinal de fallback foi reportado honestamente por ambos os sub-agentes em vez de fabricado.

#### Overall Impression

A página tenta abrir forte (headline em negrito + apresentação do assistente Max) mas se autossabota com excesso de elementos competindo por atenção logo no primeiro viewport, e com dois accents de cor (lima + violeta) brigando por protagonismo em vez de um sinal único e raro, como o próprio DESIGN.md do projeto prescreve. A maior oportunidade aqui não é uma feature nova — é aplicar a própria "Regra da Voz Única" que o time já documentou, mas que esta landing page ignora quase inteiramente.

#### What's Working

1. **Sinal de reassurance consistente** ("sem cartão", "cancele quando quiser", "não expira") aparece no hero, nos planos e no CTA final — reduz genuinamente o custo psicológico da decisão de cadastro em cada momento-chave.
2. **Seção Antes/Depois** (linhas 761-816) é concreta e precisa ao domínio (grupos de WhatsApp, planilhas, fichas perdidas) — a copy mais específica e forte da página, e o único lugar onde o anti-generic-fitness-app do brief é realmente honrado no conteúdo.
3. **Conteúdo do FAQ** (linhas 205-230) responde objeções reais de um marketplace de dois lados (custo zero para o aluno, sem app obrigatório, LGPD) em vez de perguntas genéricas de preenchimento.

#### Priority Issues

**[P0] Regra da Voz Única quebrada quase em toda a página**
- **Why it matters**: o lima é a cor dominante do CTA de nav, dos dois CTAs do hero, dos ícones da lista de benefícios, dos 3 valores de estatística, das 5 tag-pills de módulo + checkmarks, do ícone multiplataforma, dos dois acentos da seção antes/depois, dos badges de número do "como funciona" + CTA, do card de preço "Pro" inteiro em lima, e do bloco de CTA final inteiro em lima. O DESIGN.md é explícito: o poder do lima vem da raridade ("no máximo uma ação de destaque por tela"); na densidade atual, ele não tem valor de sinal algum — nada na página se lê como "a coisa importante".
- **Fix**: reservar o lima estritamente para uma ação primária por seção; recolorir tag-pills, checkmarks e números de estatística para branco/texto-secundário, deixando o botão lima existente como o único destaque.
- **Suggested command**: `$impeccable colorize` (com foco explícito em restaurar a raridade do accent lima em toda a home)

**[P0] Segunda cor de accent não documentada (violeta `#7C3AED`/`#A78BFA`) para o "Max"**
- **Why it matters**: hex hardcoded (não é um token) conduz o glow do avatar Max, badge, fundos de ícone de feature, e um CTA sólido em violeta ("Quero o Max no meu painel", linhas 650-657). Contradiz diretamente o pilar de "accent único" da marca; a página agora tem duas cores "mais altas" competindo, e o estilo nem está conectado ao sistema de tokens Tailwind usado no resto da página.
- **Fix**: ou neutralizar o tratamento visual do Max para superfície neutra + pequenos toques de lima, ou adicionar formalmente o violeta ao DESIGN.md como um accent secundário documentado e de escopo restrito (evitando ainda assim um CTA sólido nessa cor).
- **Suggested command**: `$impeccable document` (para decidir e registrar o status do violeta) seguido de `$impeccable colorize`

**[P1] Sobrecarga cognitiva no hero**
- **Why it matters**: 8 elementos empilhados competem no primeiro viewport (bolha do Max, headline de 2 linhas, subheadline, lista de 5 benefícios, 2 CTAs, link de scroll, linha de confiança) — falha em "single focus", "chunking ≤4", "minimal choices ≤4" e "one-thing-at-a-time" do checklist de carga cognitiva. A clareza do primeiro viewport determina a taxa de rejeição de qualquer landing page.
- **Fix**: cortar a lista de benefícios para 3 itens, remover o link de scroll redundante (duplica o que os CTAs já comunicam), e escolher uma mensagem única — liderada pelo Max-IA ou pela plataforma completa, não as duas ao mesmo tempo.
- **Suggested command**: `$impeccable distill` (reduzir o hero ao essencial)

**[P1] Efeitos de glow/blur contradizem o sistema flat-por-padrão documentado**
- **Why it matters**: gradiente radial de fundo do hero, dois "blobs" de blur ambiente (`blur-[120px]`, `blur-[80px]`), triplo glow do avatar Max, sombra do dashboard mockup, sombras de borda dos phone mockups, múltiplos glows de hover em botões, e o glow de 60px do card de preço — é exatamente a estética genérica de "SaaS glow" que a própria marca rejeita explicitamente ("energia com raridade", sem sombra exceto em overlays/modais). O detector confirmou um sintoma relacionado (`bounce-easing` no chevron de scroll, linha 562) que aponta na mesma direção: decoração de movimento/glow destoando do ethos de terminal disciplinado.
- **Fix**: remover os blobs de blur ambiente; manter cards flat conforme DESIGN.md (borda + cor de superfície apenas); confinar sombra a UI real de modal/overlay; trocar `animate-bounce` por algo com easing exponencial ou remover a animação.
- **Suggested command**: `$impeccable polish`

**[P2] Template repetitivo de 5 módulos + tags com emoji**
- **Why it matters**: o array `MODULES` (linhas 48-124) renderiza 5 seções quase idênticas; tags usam emoji cru (💪🥗🏆💬📅) em vez do conjunto de ícones lucide já usado consistentemente em outras partes. Este é o sinal mais claro de "AI slop" da página, e os emojis violam diretamente o anti-reference documentado contra ícones decorativos de app fitness.
- **Fix**: consolidar em uma única seção com tabs/segmentos (espelhando o grid de features do Max já usado), e trocar emoji por ícones lucide existentes.
- **Suggested command**: `$impeccable distill` seguido de `$impeccable clarify` (para a copy de cada tab)

**[P3] Texto de confiança/legal com opacidade reduzida**
- **Why it matters**: a linha de confiança do hero, o disclaimer dos planos e a linha de LGPD do footer usam modificadores `/50`, `/40`, `/70` sobre uma cor já secundária. Esse é exatamente o texto pensado para reduzir a ansiedade de cadastro e comunicar conformidade legal — reduzir seu contraste abaixo do provável AA justo nesses momentos é contraproducente.
- **Fix**: manter essas strings específicas em opacidade total de texto-secundário.
- **Suggested command**: `$impeccable harden` (acessibilidade/contraste)

#### Persona Red Flags

**Jordan (First-Timer)**: O avatar do Max com balão de fala compete visualmente com o próprio headline no primeiro olhar — não fica claro se "Max" é o produto ou um chatbot com quem Jordan precisa falar. O botão visualmente mais forte na nav e no hero é "Entrar" (lima, login) — mas Jordan ainda não tem conta; a opção de cadastro ("Cadastro de Personal — Criar conta") é o botão ghost secundário, e seu equivalente na nav tem um typo de espaço duplo: "Área de  Cadastro Personal Trainer" (linha 392) — um detalhe pequeno mas real, justo no botão que um novo usuário precisa. Ao chegar na seção de módulo 3-4, todas compartilham o mesmo layout de tag-pill + título + checklist + screenshot — Jordan dificilmente lembrará qual módulo cobria ranqueamento vs. agenda se perguntado logo após rolar a página.

**Casey (Mobile User)**: O `DashboardMockup` — o asset mais convincente de "mostre, não conte" — está `hidden lg:flex` (linha 525), ou seja, visitantes mobile nunca veem o produto real no hero. O hero mobile empilha todos os 8 elementos verticalmente sem redução, produzindo um scroll longo antes de qualquer feature concreta — alto risco de abandono para quem rola distraidamente. Os links de nav desktop são `hidden md:flex` (linha 365) sem substituto de menu hambúrguer — Casey não tem navegação em página no mobile; ela não consegue pular direto para "Planos" e precisa rolar manualmente por 13 seções.

#### Minor Observations

- Typo de espaço duplo: "Área de  Cadastro Personal Trainer" (linha 392).
- O array `STATS` (linhas 126-130) mistura propostas de valor reais com uma "estatística" não numérica ("Web" como "stat" — não é realmente quantitativo).
- Os cards de FAQ parecem interativos (borda no hover) mas não são colapsáveis — nenhuma disclosure progressiva real apesar da affordance visual.
- `w-13 h-13` (linha 751) não é um valor padrão da escala de spacing do Tailwind — verificar se existe config customizada, ou essa classe silenciosamente não faz nada.
- O CTA do plano "Elite" diz "Falar com a equipe" mas linka direto para `/register?plano=elite` (cadastro self-serve) — mismatch de mensagem/destino (linhas 182-183).
- Cores hex hardcoded para o Max ignoram o sistema de tokens (`brand-lime`, `text-secondary`, etc.) usado no resto da página — um risco de manutenção independente da crítica visual.

#### Questions to Consider

- Se o lima deveria significar "isso precisa da sua atenção", o que ele está sinalizando quando tag-pills, checkmarks, números de estatística e o CTA primário brilham exatamente na mesma cor?
- O Max é uma feature do StrivePersonal ou uma segunda marca? Atualmente ele tem sua própria cor, sua própria linguagem de glow e seu próprio CTA sólido — ele deveria parecer parte do terminal, ou o design system deveria reconhecer formalmente um segundo accent?
- Com 13 seções de página inteira e 5 templates zigue-zague visualmente idênticos, um personal trainer rolando a página num intervalo entre alunos realmente chegaria à seção de preços — ou essa página está calibrada para um screenshot de portfólio, não para um funil de conversão real?
