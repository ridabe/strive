// Cálculos fisiológicos — usável no cliente e no servidor (sem imports externos)

export function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-sky-400' }
  if (bmi < 25)   return { label: 'Peso normal',    color: 'text-status-success' }
  if (bmi < 30)   return { label: 'Sobrepeso',      color: 'text-status-warning' }
  if (bmi < 35)   return { label: 'Obesidade I',    color: 'text-orange-400' }
  if (bmi < 40)   return { label: 'Obesidade II',   color: 'text-status-error' }
  return               { label: 'Obesidade III',   color: 'text-red-700' }
}

// Mifflin-St Jeor (1990) — considerada mais precisa que Harris-Benedict
export function calcBMR(
  weightKg: number,
  heightCm: number,
  birthDate: string,
  sex: 'M' | 'F',
): number {
  const ageYears = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  )
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return Math.round(sex === 'M' ? base + 5 : base - 161)
}
