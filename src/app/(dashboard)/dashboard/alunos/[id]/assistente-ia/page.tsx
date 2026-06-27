import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MaxPanel } from '@/components/ai/MaxPanel'

type Props = { params: Promise<{ id: string }> }

export default async function AssistenteIaPage({ params }: Props) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) notFound()

  // Guard: module must be enabled for this tenant
  const { data: modRow } = await supabase
    .from('system_modules')
    .select('id')
    .eq('slug', 'assistente-ia')
    .single()

  if (modRow) {
    const { count } = await supabase
      .from('tenant_modules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('module_id', modRow.id)
      .eq('enabled', true)

    if (!count) notFound()
  }

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('id', studentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!student) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {student.full_name}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Max Strive IA
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Assistente inteligente para {student.full_name}
        </p>
      </div>

      <MaxPanel
        studentId={student.id}
        studentName={student.full_name}
        tenantId={profile.tenant_id}
      />
    </div>
  )
}
