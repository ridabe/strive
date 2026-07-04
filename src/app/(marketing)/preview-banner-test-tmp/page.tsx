import { AnamnesePendingBanner } from '@/components/student/AnamnesePendingBanner'

export default function PreviewBannerTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <AnamnesePendingBanner hasTemplates isCompleted={false} />
      <div className="p-6 text-text-primary">Conteúdo abaixo do banner</div>
    </div>
  )
}
