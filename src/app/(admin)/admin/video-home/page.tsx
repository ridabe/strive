import { createClient } from '@/lib/supabase/server'
import { Youtube, AlertTriangle } from 'lucide-react'
import { HomeVideoForm } from './home-video-form'

export default async function VideoHomePage() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('home_video_config')
    .select('*')
    .eq('id', true)
    .single()

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-surface border border-surface-border rounded-xl">
          <Youtube size={20} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Vídeo da Home
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configure o vídeo do YouTube exibido na página inicial pública do site.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-status-warning/5 border border-status-warning/20 rounded-xl px-4 py-3">
        <AlertTriangle size={15} className="text-status-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Se nenhum vídeo estiver configurado, a seção <strong className="text-text-primary">não aparece</strong> na home —
          a página segue normalmente como se essa área não existisse.
        </p>
      </div>

      {config ? (
        <HomeVideoForm data={config} />
      ) : (
        <div className="bg-surface border border-surface-border rounded-2xl p-10 text-center text-text-secondary text-sm">
          Nenhuma configuração encontrada. Execute a migration do banco de dados.
        </div>
      )}
    </div>
  )
}
