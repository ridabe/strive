-- Permite que uma rotina rode em mais de um dia da semana (ex: segunda E quinta),
-- em vez de um único day_of_week. Ausência de dias (NULL ou array vazio) continua
-- significando "dia livre" — aluno executa quando quiser, sem ordem fixa.
ALTER TABLE workout_routines
  ADD COLUMN days_of_week smallint[];

-- Backfill: cada day_of_week existente vira um array de 1 elemento.
UPDATE workout_routines
  SET days_of_week = ARRAY[day_of_week]
  WHERE day_of_week IS NOT NULL;

ALTER TABLE workout_routines
  DROP COLUMN day_of_week;
