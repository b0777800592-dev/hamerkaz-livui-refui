import { Metadata } from 'next'
import EligibilityForm from '@/components/forms/EligibilityForm'

export const metadata: Metadata = {
  title: 'בדיקת התאמה ראשונית לקנאביס רפואי | המרכז לליווי רפואי',
  description: 'מלאו את שאלון ההתאמה ותקבלו דוח אישי חינם על הסיכוי לקבלת רישיון קנאביס רפואי.',
}

export default function EligibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">בדיקת התאמה ראשונית</h1>
          <p className="text-slate-500">
            השאלון לוקח כ-3 דקות. בסיום תקבלו דוח אישי חינם.
            <br />
            <span className="text-sm text-slate-400">
              הדוח הוא כלי עזר בלבד ואינו מהווה ייעוץ רפואי.
            </span>
          </p>
        </div>
        <EligibilityForm />
      </div>
    </div>
  )
}
