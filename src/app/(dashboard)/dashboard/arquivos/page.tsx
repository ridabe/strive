import { createClient } from '@/lib/supabase/server'
import { FolderOpen, FileText, ImageIcon, Users } from 'lucide-react'
import { joinOne } from '@/lib/supabase/join'
import { ArquivosClient } from './upload-form'

export default async function ArquivosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const [{ data: files }, { data: students }] = await Promise.all([
    supabase
      .from('shared_files')
      .select('id, title, description, file_url, file_type, file_name, file_size, created_at, student_id, students ( full_name )')
      .order('created_at', { ascending: false }),
    supabase
      .from('students')
      .select('id, full_name')
      .eq('tenant_id', profile?.tenant_id ?? '')
      .eq('status', 'active')
      .order('full_name'),
  ])

  const list = (files ?? []).map(f => ({
    ...f,
    students: joinOne<{ full_name: string }>(f.students),
  }))

  const totalPdfs   = list.filter(f => f.file_type === 'pdf').length
  const totalImages = list.filter(f => f.file_type === 'image').length
  const uniqueStudents = new Set(list.filter(f => f.student_id).map(f => f.student_id)).size

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <FolderOpen size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Arquivos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            PDFs e imagens compartilhados com seus alunos.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de arquivos', value: list.length,    color: 'text-text-primary',   Icon: FolderOpen },
          { label: 'PDFs',              value: totalPdfs,      color: 'text-red-400',        Icon: FileText   },
          { label: 'Imagens',           value: totalImages,    color: 'text-blue-400',       Icon: ImageIcon  },
          { label: 'Alunos específicos',value: uniqueStudents, color: 'text-purple-400',     Icon: Users      },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-surface border border-surface-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              color === 'text-red-400'    ? 'bg-red-400/10 border border-red-400/20'       :
              color === 'text-blue-400'   ? 'bg-blue-400/10 border border-blue-400/20'     :
              color === 'text-purple-400' ? 'bg-purple-400/10 border border-purple-400/20' :
              'bg-brand-lime/10 border border-brand-lime/20'
            }`}>
              <Icon size={15} className={color} />
            </div>
            <p className={`font-display font-bold text-xl leading-tight ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <ArquivosClient
        students={students ?? []}
        files={list}
      />
    </div>
  )
}
