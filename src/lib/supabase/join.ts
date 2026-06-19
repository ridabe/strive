/**
 * Helper para extrair dados de joins do Supabase.
 *
 * O Supabase define joins como `T[]` no tipo gerado, mas em queries de
 * foreign-key simples (1:1) o valor em runtime pode ser um objeto ou array.
 * Usar `as T` diretamente causa erro de TS ("neither type sufficiently overlaps").
 *
 * Solução: passar por `unknown` como tipo intermediário, que o TypeScript
 * permite sem restrição, e tratar array vs objeto em runtime.
 *
 * Uso:
 *   const student = joinOne<{ full_name: string }>(row.students)
 */
export function joinOne<T>(val: unknown): T | null {
  if (val === null || val === undefined) return null
  if (Array.isArray(val)) return (val[0] as T) ?? null
  return val as T
}
