import { createClient } from '@/lib/supabase/server'
import { Smartphone, AlertTriangle } from 'lucide-react'
import { AppVersionForm } from './app-version-form'

// Ícones SVG inline para Android e iOS
function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#3DDC84]" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.523 15.341a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-11.046 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM.89 8.721l2.24 4.233A1 1 0 0 0 4 13.5h16a1 1 0 0 0 .87-.546L23.11 8.72A1 1 0 0 0 22.24 7H1.76a1 1 0 0 0-.87 1.721ZM7.5 6.5l-1.793-3.107a.5.5 0 0 1 .866-.5L8.5 6h7l1.927-3.107a.5.5 0 0 1 .866.5L16.5 6.5h-9ZM5 14.5v5a1 1 0 0 0 1 1h2v-6H5Zm5 6h4v-6h-4v6Zm6 0h2a1 1 0 0 0 1-1v-5h-3v6Z"/>
    </svg>
  )
}

function IosIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-text-secondary" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

export default async function AppVersaoPage() {
  const supabase = await createClient()

  const { data: versions } = await supabase
    .from('app_versions')
    .select('*')
    .order('platform')

  const android = versions?.find(v => v.platform === 'android')
  const ios     = versions?.find(v => v.platform === 'ios')

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-surface border border-surface-border rounded-xl">
          <Smartphone size={20} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Versão do App
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Controle qual versão do app está disponível e quando exibir alertas de atualização.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-status-warning/5 border border-status-warning/20 rounded-xl px-4 py-3">
        <AlertTriangle size={15} className="text-status-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Atualize esta página <strong className="text-text-primary">sempre que publicar uma nova versão</strong> na loja.
          O <strong className="text-text-primary">version code mínimo</strong> determina a partir de qual versão o app exibe alerta — defina com cuidado para não bloquear usuários desnecessariamente.
        </p>
      </div>

      {/* Forms por plataforma */}
      <div className="space-y-6">
        {android && (
          <AppVersionForm
            data={android}
            platformLabel="Android (Google Play)"
            platformIcon={<AndroidIcon />}
          />
        )}
        {ios && (
          <AppVersionForm
            data={ios}
            platformLabel="iOS (App Store)"
            platformIcon={<IosIcon />}
          />
        )}
        {!android && !ios && (
          <div className="bg-surface border border-surface-border rounded-2xl p-10 text-center text-text-secondary text-sm">
            Nenhum dado de versão encontrado. Execute a migration do banco de dados.
          </div>
        )}
      </div>
    </div>
  )
}
