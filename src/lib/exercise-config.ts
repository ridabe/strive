export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraços',
  'Core / Abdômen',
  'Glúteos',
  'Quadríceps',
  'Posterior de Coxa',
  'Panturrilha',
  'Corpo Inteiro',
  'Cardio / Funcional',
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

export const MUSCLE_GROUP_COLOR: Record<string, string> = {
  'Peito':               'text-red-400    bg-red-400/10    border-red-400/20',
  'Costas':              'text-blue-400   bg-blue-400/10   border-blue-400/20',
  'Ombros':              'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Bíceps':              'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Tríceps':             'text-pink-400   bg-pink-400/10   border-pink-400/20',
  'Antebraços':          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Core / Abdômen':      'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Glúteos':             'text-rose-400   bg-rose-400/10   border-rose-400/20',
  'Quadríceps':          'text-cyan-400   bg-cyan-400/10   border-cyan-400/20',
  'Posterior de Coxa':   'text-teal-400   bg-teal-400/10   border-teal-400/20',
  'Panturrilha':         'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  'Corpo Inteiro':       'text-amber-400  bg-amber-400/10  border-amber-400/20',
  'Cardio / Funcional':  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

export function muscleColor(group: string) {
  return MUSCLE_GROUP_COLOR[group] ?? 'text-text-secondary bg-surface border-surface-border'
}

export const LOAD_TYPES = [
  { value: 'bodyweight', label: 'Peso Corporal',   emoji: '🤸' },
  { value: 'dumbbell',   label: 'Halteres (kg)',   emoji: '🏋️' },
  { value: 'barbell',    label: 'Barra + Placas',  emoji: '🪨' },
  { value: 'elastic',    label: 'Elástico',        emoji: '🔴' },
  { value: 'machine',    label: 'Máquina',         emoji: '⚙️' },
  { value: 'cable',      label: 'Cabo / Polia',    emoji: '🔗' },
  { value: 'mixed',      label: 'Combinado',       emoji: '🔀' },
] as const

export type LoadType = typeof LOAD_TYPES[number]['value']

export function loadLabel(value: string) {
  return LOAD_TYPES.find(l => l.value === value)?.label ?? value
}

export function loadEmoji(value: string) {
  return LOAD_TYPES.find(l => l.value === value)?.emoji ?? '🏋️'
}

export const COUNT_TYPES = [
  { value: 'reps', label: 'Repetições' },
  { value: 'time', label: 'Tempo (seg)' },
  { value: 'both', label: 'Repetições + Tempo' },
] as const

export type CountType = typeof COUNT_TYPES[number]['value']

export function countLabel(value: string) {
  return COUNT_TYPES.find(c => c.value === value)?.label ?? value
}

export const COMBO_TYPES = [
  { value: 'biset',   label: 'Bi-set'   },
  { value: 'triset',  label: 'Tri-set'  },
  { value: 'circuit', label: 'Circuito' },
] as const

export const VIDEO_MAX_BYTES  = 20 * 1024 * 1024  // 20 MB
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'image/gif']
export const VIDEO_ACCEPT     = '.mp4,.mov,.webm,.gif'
