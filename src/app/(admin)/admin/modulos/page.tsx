import { createClient } from '@/lib/supabase/server'
import { CreateModuleDialog } from '@/components/admin/create-module-dialog'
import { ModuleAvailabilityToggle } from '@/components/admin/module-availability-toggle'
import {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, MessageSquare, Receipt,
  FolderOpen, Bell, Palette, Salad, CalendarPlus,
  MessageCircle, Watch, Store, Puzzle,
} from 'lucide-react'

// Mapa de ícones disponíveis
const ICONS: Record<string, React.ElementType> = {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, MessageSquare, Receipt,
  FolderOpen, Bell, Palette, Salad, CalendarPlus,
  MessageCircle, Watch, Store, Puzzle,
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  treinos:        { label: 'Treinos',                color: 'text-blue-400   border-blue-400/20   bg-blue-400/5'   },
  acompanhamento: { label: 'Acompanhamento',         color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
  financeiro:     { label: 'Financeiro',             color: 'text-green-400  border-green-400/20  bg-green-400/5'  },
  comunicacao:    { label: 'Comunicação / Conteúdo', color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' },
  whitelabel:     { label: 'White-label',            color: 'text-pink-400   border-pink-400/20   bg-pink-400/5'   },
  ia:             { label: 'Inteligência Artificial', color: 'text-violet-400 border-violet-400/20 bg-violet-400/5'  },
  futuro:         { label: 'Módulos Futuros',        color: 'text-text-secondary border-surface-border bg-background' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:      { label: 'Ativo',    color: 'text-status-success bg-status-success/10 border-status-success/20' },
  beta:        { label: 'Beta',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  coming_soon: { label: 'Em breve', color: 'text-text-secondary bg-background border-surface-border' },
}

const CATEGORY_ORDER = ['ia', 'treinos', 'acompanhamento', 'financeiro', 'comunicacao', 'whitelabel', 'futuro']

export default async function ModulosPage() {
  const supabase = await createClient()

  const { data: modules } = await supabase
    .from('system_modules')
    .select('*')
    .order('sort_order')

  // agrupa por categoria
  const grouped = (CATEGORY_ORDER).reduce<Record<string, typeof modules>>((acc, cat) => {
    acc[cat] = (modules ?? []).filter((m) => m.category === cat)
    return acc
  }, {})

  const total     = modules?.length ?? 0
  const active    = modules?.filter((m) => m.available).length ?? 0
  const comingSoon = modules?.filter((m) => m.status === 'coming_soon').length ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Módulos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Catálogo de funcionalidades disponíveis para os clientes.
          </p>
        </div>
        <CreateModuleDialog />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de módulos', value: total },
          { label: 'Disponíveis',      value: active },
          { label: 'Em breve',         value: comingSoon },
        ].map((m) => (
          <div key={m.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="text-2xl font-body font-bold text-text-primary">{m.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Grupos por categoria */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const mods = grouped[cat] ?? []
          if (!mods.length) return null
          const catCfg = CATEGORY_CONFIG[cat]

          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catCfg.color}`}>
                  {catCfg.label}
                </span>
                <span className="text-xs text-text-secondary">{mods.length} módulo{mods.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mods.map((mod) => {
                  const IconComp = ICONS[mod.icon ?? ''] ?? Puzzle
                  const stCfg   = STATUS_CONFIG[mod.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active

                  return (
                    <div
                      key={mod.id}
                      className={`bg-surface border border-surface-border rounded-xl p-4 space-y-3 transition-opacity ${
                        !mod.available ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Cabeçalho do card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${catCfg.color} border`}>
                            <IconComp size={16} />
                          </div>
                          <div>
                            <p className="font-body font-semibold text-text-primary text-sm leading-tight">
                              {mod.name}
                            </p>
                            <span className={`inline-block text-xs px-1.5 py-0.5 rounded border mt-0.5 ${stCfg.color}`}>
                              {stCfg.label}
                            </span>
                          </div>
                        </div>

                        {/* Toggle disponibilidade global */}
                        <ModuleAvailabilityToggle
                          moduleId={mod.id}
                          available={mod.available}
                          disabled={mod.status === 'coming_soon'}
                        />
                      </div>

                      {/* Descrição */}
                      {mod.description && (
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {mod.description}
                        </p>
                      )}

                      {/* Slug */}
                      <p className="text-xs font-mono text-text-secondary/40">{mod.slug}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
       </div>
    </div>
  )
}
