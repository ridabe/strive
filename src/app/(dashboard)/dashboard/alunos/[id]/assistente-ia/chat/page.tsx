import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireAcademiaModuleAccess } from '@/lib/supabase/module-access'
import { joinOne } from '@/lib/supabase/join'
import { MaxChatPanel } from '@/components/ai/MaxChatPanel'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ conv?: string }>
}

export default async function AssistenteIaChatPage({ params, searchParams }: Props) {
  await requireAcademiaModuleAccess('assistente-ia')
  const { id: studentId } = await params
  const { conv: conversationId = null } = await searchParams
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

  // Load chat history if a conversation is open
  let initialMessages: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }[] = []

  if (conversationId) {
    const { data: msgs } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    initialMessages = (msgs ?? []) as typeof initialMessages
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-border px-6 py-4 flex items-center gap-4">
        <Link
          href={`/dashboard/alunos/${studentId}/assistente-ia`}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-base font-bold text-text-primary uppercase tracking-widest">
            Chat com a Max
          </h1>
          <p className="text-xs text-text-secondary">{student.full_name}</p>
        </div>
      </div>

      {/* Chat — flex-1 so it fills remaining height */}
      <div className="flex-1 min-h-0">
        <MaxChatPanel
          studentId={studentId}
          initialConversationId={conversationId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
