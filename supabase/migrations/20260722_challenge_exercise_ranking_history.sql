-- Estende mark_challenge_item_complete para que exercícios concluídos dentro de
-- um Desafio também contem no Histórico do aluno (workout_sessions/
-- workout_session_exercises) e no ranking (monthly_points), exatamente como
-- contam quando o aluno executa um treino comum via award_workout_points.
--
-- Antes desta migration, a função só registrava o progresso em
-- challenge_item_progress e um gamification_event — mas nunca atualizava
-- monthly_points (o ranking não refletia os pontos) e nunca criava uma
-- workout_session (o item não aparecia no Histórico).

create or replace function public.mark_challenge_item_complete(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_item            record;
  v_participant_id  uuid;
  v_student_id      uuid;
  v_already         boolean;
  v_settings        record;
  v_points          integer := 0;
  v_session_id      uuid;
  v_challenge_name  text;
  v_month           smallint;
  v_year            smallint;
begin
  select cdi.id, cdi.tenant_id, cdi.item_type, cdi.title, cdi.exercise_id,
         cd.challenge_id, cd.status as day_status
  into v_item
  from challenge_day_items cdi
  join challenge_days cd on cd.id = cdi.challenge_day_id
  where cdi.id = p_item_id;

  if v_item.id is null then
    return jsonb_build_object('error', 'item_not_found');
  end if;

  if v_item.day_status <> 'published' then
    return jsonb_build_object('error', 'day_not_published');
  end if;

  select cp.id, cp.student_id into v_participant_id, v_student_id
  from challenge_participants cp
  join students s on s.id = cp.student_id
  where cp.challenge_id = v_item.challenge_id and s.user_id = auth.uid();

  if v_participant_id is null then
    return jsonb_build_object('error', 'not_a_participant');
  end if;

  select exists (
    select 1 from challenge_item_progress
    where challenge_day_item_id = p_item_id and participant_id = v_participant_id
  ) into v_already;

  if v_already then
    return jsonb_build_object('already_completed', true);
  end if;

  insert into challenge_item_progress (tenant_id, challenge_day_item_id, participant_id)
  values (v_item.tenant_id, p_item_id, v_participant_id)
  on conflict (challenge_day_item_id, participant_id) do nothing;

  if v_item.item_type = 'exercise' and v_item.exercise_id is not null then
    -- Histórico: registra uma sessão de treino sintética, igual a um treino comum executado.
    select name into v_challenge_name from challenges where id = v_item.challenge_id;

    insert into workout_sessions (
      tenant_id, student_id, workout_plan_id, workout_routine_id,
      started_at, finished_at, notes
    )
    values (
      v_item.tenant_id, v_student_id, null, null,
      now(), now(), concat('[Desafio] ', coalesce(v_challenge_name, 'Desafio'), ' — ', v_item.title)
    )
    returning id into v_session_id;

    insert into workout_session_exercises (session_id, exercise_id, sets_done)
    values (v_session_id, v_item.exercise_id, 1);

    -- Ranking: só se a gamificação estiver ativa (mesma regra de award_workout_points).
    select * into v_settings from gamification_settings limit 1;
    if v_settings is not null and v_settings.is_active then
      v_points := v_settings.pts_exercise_completed;
      v_month  := extract(month from now())::smallint;
      v_year   := extract(year from now())::smallint;

      insert into gamification_events (student_id, session_id, event_type, points, metadata, event_month, event_year)
      values (
        v_student_id, v_session_id, 'challenge_task_completed', v_points,
        jsonb_build_object('item_id', p_item_id, 'challenge_id', v_item.challenge_id),
        v_month, v_year
      );

      insert into monthly_points (
        student_id, tenant_id, month, year,
        total_points, workouts_completed, exercises_completed, active_minutes,
        last_calculated_at
      )
      values (
        v_student_id, v_item.tenant_id, v_month, v_year,
        v_points, 0, 1, 0, now()
      )
      on conflict (student_id, month, year) do update set
        tenant_id           = excluded.tenant_id,
        total_points        = monthly_points.total_points        + excluded.total_points,
        exercises_completed = monthly_points.exercises_completed + excluded.exercises_completed,
        last_calculated_at  = now();
    end if;
  end if;

  return jsonb_build_object('completed', true, 'points_awarded', v_points);
end;
$function$;
