import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'תוצאות בדיקת ההתאמה | המרכז לליווי רפואי',
}

export default function EligibilityResultPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">השאלון הושלם בהצלחה</h1>
        <p className="text-slate-500 mb-6">
          קיבלנו את פרטיך. נציג מטעמנו יחזור אליך תוך 24 שעות לבדיקה ראשונית של התיק.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 mb-6">
          הדוח האישי שלך יישלח למייל ברגע שיהיה מוכן. הדוח הוא כלי עזר בלבד ואינו ייעוץ רפואי.
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/972500000000"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            דברו איתנו עכשיו בוואטסאפ
          </a>
          <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm">
            חזרה לעמוד הבית
          </Link>
        </div>
      </div>
    </div>
  )
}
