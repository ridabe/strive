-- Estende challenge_day_items com o mesmo padrão de combinação (Bi-Série/
-- Tri-Série/Circuito) já usado em workout_items, permitindo que o personal
-- combine exercícios de um dia de desafio na mesma ordem/agrupamento usado
-- ao montar rotinas de treino comuns.

alter table public.challenge_day_items
  add column if not exists combo_group_id uuid,
  add column if not exists combo_type text;

alter table public.challenge_day_items
  drop constraint if exists challenge_day_items_combo_type_check;

alter table public.challenge_day_items
  add constraint challenge_day_items_combo_type_check
  check (combo_type is null or combo_type in ('biset', 'triset', 'circuit'));

create index if not exists challenge_day_items_combo_group_id_idx
  on public.challenge_day_items (combo_group_id)
  where combo_group_id is not null;
