import { TopNavbar } from '@/components/layout/top-navbar'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export default function DashboardPage() {
  return (
    <>
      <TopNavbar title="Dashboard" subtitle="Spice Garden — Mumbai Central" />
      <DashboardOverview />
    </>
  )
}
