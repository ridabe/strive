'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export type PricingPlan = {
  name: string
  desc: string
  highlight: boolean
  badge?: string
  features: string[]
  cta: string
  href: string
  // null = plano gratuito (sem valor mensal/anual)
  monthly: number | null
  // valor mensal quando cobrado anualmente (mensal - 20%)
  annual: number | null
}

type Billing = 'mensal' | 'anual'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export function PlansPricing({ plans }: { plans: PricingPlan[] }) {
  const [billing, setBilling] = useState<Billing>('anual')

  return (
    <>
      {/* Toggle mensal / anual — pílula com indicador deslizante */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="relative flex items-center rounded-full border border-surface-border bg-surface p-1">
          <span
            className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-brand-lime transition-transform duration-300 ease-out"
            style={{
              transform:
                billing === 'anual' ? 'translateX(100%)' : 'translateX(0)',
            }}
          />
          {(['mensal', 'anual'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`relative z-10 rounded-full px-6 py-2 font-body text-sm font-semibold capitalize transition-colors ${
                billing === option
                  ? 'text-text-inverse'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-lime/25 bg-brand-lime/10 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wider text-brand-lime">
          Economize 20% no anual
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isFree = plan.monthly === null
          const shownPrice =
            billing === 'anual' ? plan.annual : plan.monthly

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-brand-lime bg-brand-lime text-text-inverse hover:-translate-y-1.5'
                  : 'border-surface-border bg-surface hover:border-brand-lime/30'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-brand-lime/40 animate-badge-pulse" />
                  <span className="relative whitespace-nowrap rounded-full border border-brand-lime/30 bg-background px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-brand-lime">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3
                  className={`mb-1 font-display text-xl font-bold uppercase tracking-tight ${
                    plan.highlight ? 'text-text-inverse' : 'text-text-primary'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`font-body text-xs leading-relaxed ${
                    plan.highlight
                      ? 'text-text-inverse/70'
                      : 'text-text-secondary'
                  }`}
                >
                  {plan.desc}
                </p>
              </div>

              <div className="mb-6 min-h-[3.75rem]">
                {isFree ? (
                  <>
                    <span
                      className={`font-display text-4xl font-bold ${
                        plan.highlight
                          ? 'text-text-inverse'
                          : 'text-text-primary'
                      }`}
                    >
                      R$ 0
                    </span>
                    <span
                      className={`ml-1 font-body text-sm ${
                        plan.highlight
                          ? 'text-text-inverse/60'
                          : 'text-text-secondary'
                      }`}
                    >
                      para sempre
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-display text-4xl font-bold ${
                          plan.highlight
                            ? 'text-text-inverse'
                            : 'text-text-primary'
                        }`}
                      >
                        {formatBRL(shownPrice as number)}
                      </span>
                      <span
                        className={`font-body text-sm ${
                          plan.highlight
                            ? 'text-text-inverse/60'
                            : 'text-text-secondary'
                        }`}
                      >
                        /mês
                      </span>
                    </div>
                    <p
                      className={`mt-1 font-body text-[11px] ${
                        plan.highlight
                          ? 'text-text-inverse/60'
                          : 'text-text-secondary'
                      }`}
                    >
                      {billing === 'anual' ? (
                        <>
                          cobrado anualmente ·{' '}
                          <span className="line-through opacity-70">
                            {formatBRL(plan.monthly as number)}/mês
                          </span>
                        </>
                      ) : (
                        'cobrança mês a mês'
                      )}
                    </p>
                  </>
                )}
              </div>

              <ul className="mb-7 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 font-body text-sm ${
                      plan.highlight
                        ? 'text-text-inverse/90'
                        : 'text-text-secondary'
                    }`}
                  >
                    <CheckCircle
                      size={14}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.highlight
                          ? 'text-text-inverse'
                          : 'text-text-secondary'
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={
                  isFree ? plan.href : `${plan.href}&ciclo=${billing}`
                }
                className={`w-full rounded-full py-3.5 text-center font-body text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] ${
                  plan.highlight
                    ? 'bg-background text-brand-lime hover:bg-surface'
                    : 'border border-brand-lime/25 bg-brand-lime/10 text-brand-lime hover:bg-brand-lime/20'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
