---
target: home (src/app/page.tsx)
total_score: 29
p0_count: 1
p1_count: 0
timestamp: 2026-07-02T18-34-43Z
slug: src-app-page-tsx
---
Method: dual-agent (A: general-purpose sub-agent · B: general-purpose sub-agent)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hambúrguer troca ícone e seta `aria-expanded` corretamente |
| 2 | Match System / Real World | 4 | Vocabulário de domínio preciso, sem jargão |
| 3 | User Control and Freedom | 3* | Gap de Escape/clique-fora no menu mobile encontrado pelas duas avaliações — corrigido nesta mesma rodada, após o veredito |
| 4 | Consistency and Standards | 3 | Padrão de hambúrguer é standard, mas faltava o dismiss esperado (corrigido) |
| 5 | Error Prevention | 3 | N/a majoritário, nada de risco na página |
| 6 | Recognition Rather Than Recall | 3 | Lista do hero enxuta + labels de âncora ajudam |
| 7 | Flexibility and Efficiency | 3 | Ganho real: nav por âncora agora funciona em todo breakpoint |
| 8 | Aesthetic and Minimalist Design | 2 | Hero caiu de 7 para 6 blocos, ainda denso, sem foco único claro |
| 9 | Error Recovery | 3 | N/a, nada quebra |
| 10 | Help and Documentation | 3 | FAQ existe, mas o falso-accordion ainda mina um pouco a confiança |
| **Total** | | **29/40*** | **Acceptable→Good** (score bruto das avaliações; ver nota) |

\* As duas avaliações rodaram *antes* do fix de acessibilidade do menu mobile (Escape + clique-fora + `role`/`aria-controls`) ser aplicado — o score de 29 reflete o código como estava no momento da avaliação. Esse gap específico (heurística #3/#4) foi corrigido logo em seguida nesta mesma sessão; o score real após o fix tende a ficar mais próximo de 30-31.

#### Anti-Patterns Verdict

**Scan determinístico**: `detect.mjs` em `page.tsx` + `mobile-nav.tsx` → exit 0, **zero findings**. `tsc --noEmit` limpo nos dois arquivos.

**LLM assessment**: baixo risco de "AI slop" — copy é específica do produto, ícones lucide apropriados. O único tell remanescente é o emoji 👋 na bolha do Max (aceitável, é a persona do mascote).

**Gap real encontrado por ambas as avaliações, já corrigido**: o novo `MobileNav` não tinha fechamento por Escape nem por clique fora do menu — só fechava pelo próprio botão ou por um link interno. Isso quebra o padrão esperado de um menu hambúrguer. Corrigido nesta sessão: adicionado listener de `pointerdown` fora do componente (via `ref`) e de `keydown` para Escape, mais `aria-controls` no botão e `aria-label`/landmark `<nav>` no painel (trocado de uma tentativa inicial com `role="menu"`, que o linter rejeitou por exigir filhos `role="menuitem"` — landmark de navegação simples é o padrão correto aqui, já que não é um menu de aplicação com navegação por setas).

#### Overall Impression

O menu mobile resolve o problema real da Casey (persona mobile) — ela agora navega pelas âncoras sem rolar 13 seções. O hero está mensuravelmente mais enxuto (5→3 itens na lista, link de scroll redundante removido), mas as duas avaliações concordam: ainda não há um único foco dominante no primeiro viewport — a bolha do Max compete visualmente com o headline em vez de ficar claramente subordinada a ele.

#### What's Working

1. **Nav mobile é uma correção funcional real**, não cosmética — resolve o problema concreto da Casey.
2. **Corte do hero é redução de conteúdo de verdade** (5→3 bullets, link+ícone de scroll removidos por completo), não apenas relabeling.
3. **Acento violeta do Max continua estritamente contido** aos elementos do Max, honrando a "Regra do Segundo Sinal Contido" do DESIGN.md.

#### Priority Issues

- **[P0] Hero ainda sem um foco visual dominante único** (bolha do Max compete com o headline) — ambas as avaliações concordam que isso é uma questão de intenção de marca (quanto protagonismo o Max deve ter na primeira dobra), não um bug técnico. **Requer decisão do usuário antes de seguir** — ver pergunta abaixo.
- **[P1] Menu mobile sem Escape/clique-fora** — **corrigido nesta sessão** (useEffect com `pointerdown` + `keydown`, `aria-controls`, landmark `<nav aria-label="Menu mobile">`).
- **[P2] FAQ com affordance de accordion falso** (carregado da rodada anterior, ainda fora de escopo).
- **[P3] "Web" como stat não-numérica** (carregado da rodada anterior, ainda fora de escopo).

#### Persona Red Flags

**Jordan (First-Timer)**: ambas as avaliações notam que "Entrar" (login) continua visualmente primário no hero, à frente de "Cadastro" — invertido para uma página cujo objetivo é cadastro de novos usuários, não login de quem já tem conta.

**Casey (Mobile)**: melhora concreta confirmada — navegação por âncora funcionando em qualquer largura de tela agora. Fricção residual (fechar o menu tocando fora) foi corrigida nesta sessão.

#### Minor Observations

Subhead do hero e a lista de benefícios ainda repetem "nutrição/agenda" (pequena redundância de working memory) · mockup do dashboard e o card do Max "espiando" continuam `hidden lg:flex` — mobile não vê nenhuma âncora visual no hero, só texto.

#### Questions to Consider

- Dado que o DESIGN.md diz "a ferramenta desaparece na tarefa", por que os primeiros segundos da home ainda pedem para processar 6 blocos co-iguais e dois avatares do Max antes de chegar a um próximo passo claro?
- "Entrar" like CTA visualmente primário do hero está de fato servindo conversão de novos visitantes, ou otimizando silenciosamente para usuários que retornam — numa página cujo trabalho inteiro é cadastro?
