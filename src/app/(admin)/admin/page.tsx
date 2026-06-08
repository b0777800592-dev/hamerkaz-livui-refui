export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  await requireRole(['admin', 'super_admin', 'sales_agent', 'case_manager', 'medical_coordinator'])
  const supabase = await createClient()

  const [{ count: leadsCount }, { count: casesCount }] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('cases').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">דשבורד ניהול</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'לידים', value: leadsCount ?? 0, color: 'blue' },
            { label: 'תיקים פתוחים', value: casesCount ?? 0, color: 'green' },
            { label: 'משימות פתוחות', value: 0, color: 'orange' },
            { label: 'מסמכים לבדיקה', value: 0, color: 'purple' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-6">
              <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-700 mb-4">לידים אחרונים</h2>
            <p className="text-slate-400 text-sm">אין לידים עדיין</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-700 mb-4">משימות פתוחות</h2>
            <p className="text-slate-400 text-sm">אין משימות עדיין</p>
          </div>
        </div>
      </div>
    </div>
  )
}
