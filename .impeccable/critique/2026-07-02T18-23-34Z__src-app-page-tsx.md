---
target: home (src/app/page.tsx)
total_score: 30
p0_count: 1
p1_count: 1
timestamp: 2026-07-02T18-23-34Z
slug: src-app-page-tsx
---
Method: dual-agent (A: general-purpose sub-agent · B: general-purpose sub-agent)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Nav troca para "Ir para o Dashboard" quando logado; sem sinal de progresso de scroll (aceitável para landing) |
| 2 | Match System / Real World | 4 | Copy continua precisa ao domínio |
| 3 | User Control and Freedom | 2 | Sem nav mobile nem "voltar ao topo" — visitante mobile fica sem wayfinding em 13 seções |
| 4 | Consistency and Standards | 4 | Padrão ícone+texto aplicado uniformemente nos 5 módulos; CTA copy/destino agora bate em todos os 3 planos |
| 5 | Error Prevention | 3 | Cards de FAQ prometem expansão visualmente mas não expandem — falsa affordance |
| 6 | Recognition Rather Than Recall | 3 | Nav por âncora ajuda, mas é desktop-only |
| 7 | Flexibility and Efficiency | 2 | Caminho único, sem atalhos — fora de escopo desta rodada |
| 8 | Aesthetic and Minimalist Design | 3 | Melhora real: menos elementos brilhantes competindo, sem blobs de blur, sem glows repetidos |
| 9 | Error Recovery | 3 | Sem formulários interativos (n/a parcial) |
| 10 | Help and Documentation | 3 | FAQ cobre objeções reais |
| **Total** | | **30/40** | **Good** (+4 vs. 26/40 na rodada anterior) |

#### Anti-Patterns Verdict

**Melhora real, mas parcial.** A disciplina de cor agora é genuína, não só documentada: o lima está confinado aos CTAs primários, ao plano Pro e ao CTA final; todo o resto foi rebaixado para neutro. Essa era a marca mais óbvia de "página de SaaS gerada por template" (accent no arco-íris em tudo) e ela se foi. O violeta do Max agora é um token de primeira classe (`colors.max`) em vez de hex inline espalhado, o que lê como trabalho de design system intencional.

Ainda assim, a página **continua cheirando a estrutura AI-scaffolded** independente da cor: 13 seções, hero com 7 elementos empilhados, ritual de "3 passos", trope de antes/depois em duas colunas, stat não-numérica, FAQ que parece accordion mas não é. Essas são marcas de IA/estrutura, não de cor — os ajustes desta rodada atacaram a camada certa (restrição visual) mas não tocaram o formato do template por baixo.

**Scan determinístico**: `detect.mjs` rodou (exit 0), **zero findings** — o `bounce-easing` da rodada anterior foi eliminado. `.impeccable/design.json` validado, com o `max-violet` corretamente registrado no `colorMeta`. Único `shadow-[...]` remanescente no arquivo é o callout flutuante do Max (linha 526) — exatamente a exceção documentada, não uma regressão.

**Overlays visuais**: não disponíveis nesta sessão, como na rodada anterior — ambos os sub-agentes reportaram isso honestamente.

#### Overall Impression

A "pintura" da página agora é honesta — a cor conta uma história coerente de hierarquia. Mas a "planta baixa" por trás ainda é de prateleira: hero sobrecarregado, nav ausente no mobile, e FAQ com affordance falsa são os três pontos que a limpeza de cor não alcançou porque não estavam no escopo desta rodada. O ganho de 4 pontos (26→30) é real e concentrado exatamente onde se atacou (heurísticas #4 Consistency e #8 Aesthetic), enquanto os itens estruturais (#3, #6, #7) seguem travados no mesmo nível.

#### What's Working

1. **Disciplina de cor agora é real, não só documentada** — `colors.max` como token Tailwind próprio, usado via classes (`text-max-light`, `border-max/25`, `bg-max/[0.08]`) em vez de estilos inline ad hoc, com a "Regra do Segundo Sinal Contido" dando um limite checável.
2. **Tags de módulo com ícone+texto leem como design system, não como template** — remover o emoji foi a decisão certa; agora parece intencional, não um artefato de prompt.
3. **A regra "um destaque lima por seção" é visivelmente seguida** — Pro e CTA final são os únicos blocos full-lima do arquivo inteiro; todo o resto é neutro-com-acento-lima.

#### Priority Issues

- **[P0] Hero ainda é uma pilha de 7 elementos sem foco dominante único** — a limpeza de cor não tocou a *contagem* de elementos, só a *cor* deles; a sobrecarga estrutural do baseline continua. → cortar lista de benefícios de 5 para 3, rebaixar trust-line/scroll-link para camada secundária. Comando sugerido: `$impeccable distill`
- **[P1] Nav é desktop-only, sem equivalente mobile** (`hidden md:flex`, linha 369) — Casey não tem como pular pra "Planos" ou "FAQ" sem rolar as 13 seções manualmente. Este é o gap estrutural mais visível agora que o ruído de cor não o mascara mais. → adicionar menu hambúrguer reaproveitando `NAV_LINKS`. Comando sugerido: `$impeccable harden` ou implementação direta de nav mobile
- **[P2] Cards de FAQ prometem expansão que não entregam** — hover de borda sinaliza "clicável/expansível" (convenção de accordion) mas não faz nada ao clicar; primeira visita provavelmente tenta clicar e perde confiança. → implementar accordion real ou remover a affordance de hover. Comando sugerido: `$impeccable harden`
- **[P3] "Web" como valor de estatística não parece uma estatística** (linha 134) — os outros dois valores (`Grátis`, `1 lugar`) são quantificáveis, "Web" não. → trocar por um diferencial quantificado (ex: "3 plataformas"). Comando sugerido: `$impeccable clarify`

#### Persona Red Flags

**Jordan (First-Timer)**: ainda enfrenta 3 pontos de decisão sequenciais no hero antes de qualquer CTA (bolha do Max → headline/subhead → 5 bullets). Ponto positivo real: o disclaimer dos planos agora está em opacidade total, então Jordan consegue de fato ler "Sem fidelidade" ao avaliar o compromisso antes de se cadastrar.

**Casey (Mobile)**: dois problemas concretos, inalterados desde o baseline — `DashboardMockup` continua `hidden lg:flex` (nunca vê o screenshot do produto que ancora a credibilidade do hero); nav continua `hidden md:flex` (zero navegação in-page, precisa rolar as 13 seções manualmente). Ambos fora do escopo desta rodada de correções.

#### Minor Observations

`max-w-md` na descrição de módulo deixa gutter vazio perceptível em telas largas (linha 668) · borda lima do phone "featured" é um uso legítimo de sinal (linha 240-248, marca o módulo #1 como "flagship") · linha de copyright do footer permanece em opacidade reduzida (`/40`) — isso é intencional (boilerplate legal padrão), diferente da linha de LGPD ao lado, que é o sinal de confiança real e foi corrigida para opacidade total.

#### Questions to Consider

- Se o Max é "restrito à própria identidade" pela regra do DESIGN.md, por que ele abre o hero, tem uma seção dedicada e um callout flutuante — o Max virou a história principal do produto, e se sim, o headline deveria liderar com ele em vez do genérico "Seu negócio, no controle"?
- O estilo de "falso accordion" do FAQ foi uma escolha deliberada para sugerir escaneabilidade, ou um carry-over não revisado de um componente de biblioteca? Vale perguntar antes da próxima rodada tratar isso como "funcionando como esperado".
- Com o lima agora racionado a exatamente dois momentos full-color (Pro, CTA final), o destaque do Pro está realmente ganhando essa raridade, ou o CTA final sozinho já bastaria — os dois blocos full-lima competem entre si pela atenção de "a única coisa que importa"?
