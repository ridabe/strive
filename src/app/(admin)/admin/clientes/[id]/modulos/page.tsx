import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Puzzle,
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, MessageSquare, Receipt,
  FolderOpen, Bell, Palette, Salad, CalendarPlus,
  MessageCircle, Watch, Store,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TenantModuleToggle } from '@/components/admin/tenant-module-toggle'
import { TenantModulesBulkActions } from '@/components/admin/tenant-modules-bulk-actions'

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

const CATEGORY_ORDER = ['ia', 'treinos', 'acompanhamento', 'financeiro', 'comunicacao', 'whitelabel', 'futuro']

export default async function ClientModulosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, logo_url, primary_color')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  // Busca todos os módulos com estado por tenant (LEFT JOIN via select separado)
  const { data: allModules } = await supabase
    .from('system_modules')
    .select('*')
    .order('sort_order')

  const { data: tenantModules } = await supabase
    .from('tenant_modules')
    .select('module_id, enabled')
    .eq('tenant_id', id)

  // Mapeia estado por module_id
  const tenantModuleMap = Object.fromEntries(
    (tenantModules ?? []).map((tm) => [tm.module_id, tm.enabled])
  )

  // Agrupa por categoria
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof allModules>>((acc, cat) => {
    acc[cat] = (allModules ?? []).filter((m) => m.category === cat)
    return acc
  }, {})

  const enabledCount = (allModules ?? []).filter(
    (m) => tenantModuleMap[m.id] === true
  ).length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Breadcrumb */}
      <div>
        <Link
          href={`/admin/clientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          {tenant.business_name}
        </Link>

        {/* Header do cliente */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl border border-surface-border flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: tenant.primary_color ? `${tenant.primary_color}15` : '#1A1A2E' }}
          >
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt="Logo" width={48} height={48} className="object-contain" />
            ) : (
              <span className="text-lg font-display font-black" style={{ color: tenant.primary_color ?? '#E8FF47' }}>
                {tenant.business_name[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
              Módulos — {tenant.business_name}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {enabledCount} módulo{enabledCount !== 1 ? 's' : ''} habilitado{enabledCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Ações em massa */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          Módulos marcados como &ldquo;Em breve&rdquo; não podem ser habilitados ainda.
        </p>
        <TenantModulesBulkActions tenantId={id} />
      </div>

      {/* Grupos */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const mods = grouped[cat] ?? []
          if (!mods.length) return null
          const catCfg = CATEGORY_CONFIG[cat]

          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catCfg.color}`}>
                  {catCfg.label}
                </span>
              </div>

              <div className="bg-surface border border-surface-border rounded-xl divide-y divide-surface-border">
                {mods.map((mod) => {
                  const IconComp  = ICONS[mod.icon ?? ''] ?? Puzzle
                  const isEnabled = tenantModuleMap[mod.id] === true
                  const isLocked  = !mod.available // globalmente desativado

                  return (
                    <div
                      key={mod.id}
                      className={`flex items-center gap-4 px-4 py-3.5 ${isLocked ? 'opacity-40' : ''}`}
                    >
                      {/* Ícone */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catCfg.color} border`}>
                        <IconComp size={14} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-body font-medium text-text-primary">
                            {mod.name}
                          </p>
                          {mod.status === 'coming_soon' && (
                            <span className="text-xs px-1.5 py-0.5 rounded border border-surface-border text-text-secondary">
                              Em breve
                            </span>
                          )}
                          {mod.status === 'beta' && (
                            <span className="text-xs px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-400">
                              Beta
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-xs text-text-secondary/60">• desativado globalmente</span>
                          )}
                        </div>
                        {mod.description && (
                          <p className="text-xs text-text-secondary mt-0.5 truncate">
                            {mod.description}
                          </p>
                        )}
                      </div>

                      {/* Toggle */}
                      <TenantModuleToggle
                        tenantId={id}
                        moduleId={mod.id}
                        enabled={isEnabled}
                        disabled={isLocked || mod.status === 'coming_soon'}
                      />
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
