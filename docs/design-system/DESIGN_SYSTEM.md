# Strive Personal - Design System Oficial

Este documento define as diretrizes visuais e de interface para o projeto **Strive Personal**, garantindo consistência entre a plataforma Web (Administrativo) e o App Mobile (Aluno).

## 1. Identidade e Tom de Voz

A identidade do Strive Personal é baseada no conceito **Dark Premium**. O design deve transmitir:
- **Performance e Evolução:** Uso de elementos ascendentes, gráficos e indicadores de progresso.
- **Energia e Movimento:** O contraste do fundo escuro com o verde-lima vibrante cria um senso de urgência e foco.
- **Minimalismo e Clareza:** Menos ruído visual, mais foco nos dados (cargas, séries, treinos).

---

## 2. Paleta de Cores (Tokens)

A paleta de cores utiliza o fundo escuro como base, com acentos em verde-lima para guiar a atenção do usuário.

### Cores Primárias (Brand)
| Token | Hex | Uso Semântico |
|---|---|---|
| `bg-primary` | `#0E0E1A` | Fundo principal de todas as telas (Web e Mobile). |
| `surface-card` | `#1A1A2E` | Fundo de cards, modais e elementos em elevação. |
| `surface-border` | `#2A2A45` | Bordas de cards, divisores e inputs inativos. |
| `brand-lime` | `#E8FF47` | Cor principal de destaque: Botões primários, CTAs, ícones ativos e progresso. |
| `brand-lime-dark` | `#C8E600` | Estado de *hover* ou *pressed* do botão primário. |

### Cores de Suporte e Texto
| Token | Hex | Uso Semântico |
|---|---|---|
| `text-primary` | `#FFFFFF` | Títulos, valores numéricos em destaque e texto em botões escuros. |
| `text-secondary` | `#B0B0C3` | Subtítulos, labels secundárias, placeholders e descrições. |
| `text-inverse` | `#000000` | Texto sobre fundos claros (ex: texto preto no botão verde-lima). |
| `status-success` | `#22C55E` | Indicadores de sucesso secundários. |
| `status-error` | `#EF4444` | Ações destrutivas, exclusões e alertas de erro. |
| `status-warning` | `#F59E0B` | Alertas e pendências. |

---

## 3. Tipografia

O sistema tipográfico utiliza duas famílias de fontes para criar contraste entre títulos impactantes e leitura confortável.

- **Display (Títulos e Destaques):** `Syncopate` (ou alternativa geométrica como `Syne` / `Montserrat` caso não disponível).
- **Body (Corpo de Texto e UI):** `DM Sans` (ou `Inter` / `Roboto`).

### Escala Tipográfica

| Elemento | Fonte | Peso | Tamanho (Mobile) | Tamanho (Web) | Uso |
|---|---|---|---|---|---|
| **H1** | Display | Bold (700) | 40px | 56px | Títulos de página, saudação inicial. |
| **H2** | Display | Bold (700) | 32px | 40px | Títulos de seção, números de destaque (Métricas). |
| **H3** | Display | Bold (700) | 24px | 28px | Títulos de cards principais. |
| **H4** | Body | SemiBold (600) | 18px | 20px | Nomes de exercícios, subtítulos de seção. |
| **Body Large** | Body | Regular (400) | 16px | 16px | Texto corrido principal, inputs. |
| **Body Small** | Body | Regular (400) | 14px | 14px | Texto secundário, descrições longas. |
| **Label** | Body | Medium (500) | 12px | 12px | Tags, status, botões menores (UPPERCASE). |
| **Caption** | Body | Regular (400) | 11px | 11px | Dicas, validações de erro, rodapés. |

---

## 4. Espaçamento, Grid e Bordas

### Espaçamento (Padding/Margin)
Utilizar a escala base de 4px para manter ritmo vertical e horizontal.
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `base`: 16px (Padding padrão lateral no Mobile)
- `lg`: 24px (Padding padrão lateral na Web)
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px

### Border Radius
- `sm`: 4px (Checkboxes, pequenas tags)
- `md`: 8px (Inputs, botões pequenos)
- `lg`: 12px (Cards menores)
- `xl`: 16px (Cards principais, modais)
- `full`: 9999px (Botões principais, ícones circulares)

### Grid System
- **Mobile:** 4 colunas, margem de 16px, gutter de 8px.
- **Web (Desktop):** 12 colunas, margem de 24px (ou container max-width), gutter de 16px ou 24px.

---

## 5. Componentes Principais

### Botões
- **Primary:** Fundo `brand-lime`, texto `text-inverse` (preto), formato `full` (pill). Usado para a ação principal da tela (ex: "Iniciar Treino").
- **Secondary:** Fundo transparente ou `surface-card`, borda `brand-lime`, texto `brand-lime`. Usado para ações secundárias.
- **Ghost:** Fundo transparente, texto `text-primary`. Apenas texto, sem borda.
- **Destructive:** Fundo `status-error`, texto branco. Usado para deletar alunos ou treinos.

### Cards
- Fundo sempre em `surface-card` (`#1A1A2E`).
- Bordas sutis em `surface-border` (`#2A2A45`) podem ser usadas para separar elementos internos.
- **Elevação:** Como o fundo é muito escuro, não usamos sombras (drop-shadow) clássicas. A elevação é dada pela cor do fundo do card (`#1A1A2E`) sobre o fundo da tela (`#0E0E1A`).

### Inputs e Formulários
- Fundo do input: `surface-card`.
- Borda: `surface-border`.
- Texto digitado: `text-primary`.
- Placeholder: `text-secondary`.
- **Estado de Focus:** A borda muda para `brand-lime` com um leve brilho (glow) ou outline verde.

### Indicadores de Progresso
- **Barras Horizontais:** Fundo da barra em `surface-border`, preenchimento em `brand-lime`.
- **Anéis (Rings):** Utilizados para timers de descanso ou progresso de séries.

---

## 6. Diretrizes de Implementação (Tailwind CSS)

Para implementar este design system no Next.js (Web) e Expo (Mobile via NativeWind ou similar), configure o `tailwind.config.js` com a seguinte extensão de cores:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#0E0E1A',
        surface: {
          DEFAULT: '#1A1A2E',
          border: '#2A2A45',
        },
        brand: {
          lime: '#E8FF47',
          dark: '#C8E600',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0C3',
          inverse: '#000000',
        },
        status: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        display: ['Syncopate', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      }
    }
  }
}
```

## 7. Assets Gerados

Imagens de referência geradas para o Design System:
1. **Paleta de Cores:** `ds_colors.png`
2. **Tipografia:** `ds_typography.png`
3. **Componentes:** `ds_components.png`
4. **Espaçamento e Estrutura:** `ds_spacing.png`
