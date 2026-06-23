/**
 * Edge Function: close-monthly-ranking
 *
 * Fecha o ranking do mês anterior automaticamente.
 * Deve ser invocada via cron job no primeiro dia de cada mês, ou manualmente.
 *
 * Cron sugerido: "0 3 1 * *" (dia 1 de cada mês, 3h da manhã BRT)
 *
 * Pode também ser chamada via HTTP com autenticação de serviço:
 * POST /functions/v1/close-monthly-ranking
 * Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Body: { "month": 5, "year": 2026 }  (opcional — padrão: mês anterior)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Determinar mês a fechar
    let targetMonth: number
    let targetYear: number

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}

    if (body.month && body.year) {
      targetMonth = body.month
      targetYear  = body.year
    } else {
      // Padrão: mês anterior (considerando timezone BRT = UTC-3)
      const now = new Date()
      now.setHours(now.getHours() - 3) // BRT offset
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      targetMonth = prev.getMonth() + 1
      targetYear  = prev.getFullYear()
    }

    console.log(`Fechando ranking: ${targetMonth}/${targetYear}`)

    // Verificar se gamificação está ativa
    const { data: settings } = await supabase
      .from('gamification_settings')
      .select('is_active')
      .single()

    if (!settings?.is_active) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Gamificação está desativada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // Verificar se já foi fechado
    const { data: existing } = await supabase
      .from('monthly_ranking_snapshots')
      .select('id')
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Ranking ${targetMonth}/${targetYear} já foi fechado` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // Buscar ranking completo do mês
    const { data: ranking, error: rankError } = await supabase
      .from('monthly_points')
      .select(`
        total_points, workouts_completed,
        students ( id, full_name, tenants ( business_name ) )
      `)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .order('total_points', { ascending: false })
      .order('workouts_completed', { ascending: false })

    if (rankError) throw rankError

    if (!ranking || ranking.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Nenhum dado para fechar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // Construir snapshot
    const rankings = ranking.map((r: unknown, idx: number) => {
      const row = r as {
        total_points: number
        workouts_completed: number
        students: { id: string; full_name: string; tenants: { business_name: string } | null } | null
      }
      return {
        position:           idx + 1,
        student_id:         row.students?.id ?? null,
        student_name:       row.students?.full_name ?? 'Aluno',
        trainer_name:       row.students?.tenants?.business_name ?? null,
        points:             row.total_points,
        workouts_completed: row.workouts_completed,
      }
    })

    const champion = ranking[0] as {
      students: { id: string } | null
    }
    const championId = champion?.students?.id ?? null

    // Salvar snapshot
    const { error: snapError } = await supabase
      .from('monthly_ranking_snapshots')
      .insert({
        month:       targetMonth,
        year:        targetYear,
        closed_at:   new Date().toISOString(),
        rankings,
        champion_id: championId,
      })

    if (snapError) throw snapError

    // Badge de campeão ao 1º lugar
    if (championId) {
      const { count } = await supabase
        .from('student_badges')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', championId)
        .eq('badge_type', 'campeao_mes')
        .eq('month', targetMonth)
        .eq('year', targetYear)

      if ((count ?? 0) === 0) {
        await supabase.from('student_badges').insert({
          student_id: championId,
          badge_type: 'campeao_mes',
          month:      targetMonth,
          year:       targetYear,
        })
      }
    }

    // Badge Top 10 para posições 1-10
    const top10 = rankings.slice(0, 10)
    for (const entry of top10) {
      if (!entry.student_id) continue
      const { count } = await supabase
        .from('student_badges')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', entry.student_id)
        .eq('badge_type', 'top_10')
        .eq('month', targetMonth)
        .eq('year', targetYear)
      if ((count ?? 0) === 0) {
        await supabase.from('student_badges').insert({
          student_id: entry.student_id,
          badge_type: 'top_10',
          month:      targetMonth,
          year:       targetYear,
        })
      }
    }

    console.log(`Ranking ${targetMonth}/${targetYear} fechado. Posições: ${rankings.length}. Campeão: ${championId}`)

    return new Response(
      JSON.stringify({
        success:    true,
        month:      targetMonth,
        year:       targetYear,
        positions:  rankings.length,
        champion:   rankings[0]?.student_name ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    console.error('Erro ao fechar ranking:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
