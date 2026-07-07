'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const section = formData.get('section') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id

  // ── Atualizar dados do negócio ──────────────────────────────────────────
  if (section === 'business') {
    if (!tenantId) {
      redirect('/dashboard/ajustes?error=' + encodeURIComponent('Tenant não encontrado.'))
    }

    const businessName  = (formData.get('business_name') as string)?.trim()
    const contactEmail  = (formData.get('contact_email') as string)?.trim() || null
    const contactPhone  = (formData.get('contact_phone') as string)?.trim() || null
    const primaryColor  = (formData.get('primary_color') as string) || '#E8FF47'
    // CREF é do personal (profissional); CNPJ é da empresa (academia). Cada
    // formulário exibe só o campo pertinente — o outro chega ausente/null.
    const cref          = (formData.get('cref') as string)?.trim() || null
    const cnpj          = (formData.get('cnpj') as string)?.trim() || null

    if (!businessName) {
      redirect('/dashboard/ajustes?error=' + encodeURIComponent('Nome do negócio é obrigatório.'))
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('tenants')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ business_name: businessName, contact_email: contactEmail, contact_phone: contactPhone, primary_color: primaryColor, cref, cnpj } as any)
      .eq('id', tenantId)

    if (error) {
      redirect('/dashboard/ajustes?error=' + encodeURIComponent(error.message))
    }

    redirect('/dashboard/ajustes?success=1')
  }

  // ── Atualizar dados pessoais ─────────────────────────────────────────────
  if (section === 'personal') {
    const fullName = (formData.get('full_name') as string)?.trim()

    if (!fullName) {
      redirect('/dashboard/ajustes?error=' + encodeURIComponent('Nome é obrigatório.'))
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      redirect('/dashboard/ajustes?error=' + encodeURIComponent(error.message))
    }

    redirect('/dashboard/ajustes?success=1')
  }

  redirect('/dashboard/ajustes')
}
