export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PortalPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const staffRoles = ['admin', 'super_admin', 'sales_agent', 'case_manager', 'medical_coordinator']
  if (profile?.role && staffRoles.includes(profile.role)) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          שלום, {profile?.full_name || 'משתמש'}
        </h1>
        <p className="text-slate-500 mb-8">ברוך הבא לאזור האישי שלך</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-700 mb-1">סטטוס תיק</h2>
            <p className="text-slate-500 text-sm">אין תיק פעיל כרגע</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-700 mb-1">מסמכים</h2>
            <p className="text-slate-500 text-sm">0 מסמכים הועלו</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-700 mb-1">הודעות</h2>
            <p className="text-slate-500 text-sm">אין הודעות חדשות</p>
          </div>
        </div>
      </div>
    </div>
  )
}
