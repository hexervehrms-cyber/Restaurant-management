import { TopNavbar } from '@/components/layout/top-navbar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

// For now, use mock branchId from auth context
// TODO: Get actual branch ID from session/context
const MOCK_BRANCH_ID = '829b1e49-87b3-4cc9-a4a9-4e719bf4440c'

export default function DashboardPage() {
  return (
    <>
      <TopNavbar title="Dashboard" />
      <main className="flex flex-col gap-6 p-6">
        {/* Dashboard Header with real data */}
        <DashboardHeader branchId={MOCK_BRANCH_ID} />
        
        {/* Rest of dashboard content */}
        <DashboardOverview />
      </main>
    </>
  )
}
