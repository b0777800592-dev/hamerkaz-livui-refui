'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['פרטי בסיס', 'מטרת הפנייה', 'מצב רפואי', 'מסמכים', 'סיום']

const CONDITIONS = [
  'פוסט טראומה (PTSD)', 'פיברומיאלגיה', 'כאב כרוני', 'סרטן',
  'קרוהן', 'קוליטיס', 'פרקינסון', 'טרשת נפוצה', 'אפילפסיה',
  'כאב נוירופתי', 'אחר'
]

const DOCUMENTS = [
  'סיכום רופא', 'MRI', 'CT', 'אבחנה פסיכיאטרית',
  'מרשמים קיימים', 'סיכום אשפוז', 'אין מסמכים כרגע'
]

export default function EligibilityForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', city: '', preferred_contact: 'whatsapp',
    purpose: '', medical_condition: '', condition_duration: '',
    treatments_tried: [] as string[], documents_available: [] as string[],
    previous_license: false, agree_terms: false,
  })

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleArray(field: 'treatments_tried' | 'documents_available', val: string) {
    setForm(prev => {
      const arr = prev[field]
      return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/eligibility/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.leadId) router.push(`/eligibility/result?id=${data.leadId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-100'}`} />
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 mb-1">שלב {step + 1} מתוך {STEPS.length}</p>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{STEPS[step]}</h2>
      </div>

      <div className="px-6 pb-6">
        {/* Step 0: Basic info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא *</label>
              <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">טלפון *</label>
              <input value={form.phone} onChange={e => update('phone', e.target.value)} dir="ltr"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">עיר</label>
              <input value={form.city} onChange={e => update('city', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}

        {/* Step 1: Purpose */}
        {step === 1 && (
          <div className="space-y-3">
            {[
              { val: 'new_license', label: 'בקשה חדשה' },
              { val: 'renewal', label: 'חידוש רישיון/מרשם' },
              { val: 'dosage_increase', label: 'הגדלת מינון' },
              { val: 'documents_review', label: 'בדיקת מסמכים בלבד' },
            ].map(o => (
              <button key={o.val} onClick={() => update('purpose', o.val)}
                className={`w-full text-right px-5 py-4 rounded-xl border-2 transition-colors font-medium ${form.purpose === o.val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Medical condition */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">מצב רפואי עיקרי</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => update('medical_condition', c)}
                    className={`text-right px-3 py-2.5 rounded-lg border text-sm transition-colors ${form.medical_condition === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">משך הבעיה</label>
              <div className="grid grid-cols-2 gap-2">
                {[['less_than_1_year','פחות משנה'],['1_3_years','1–3 שנים'],['3_5_years','3–5 שנים'],['more_than_5_years','מעל 5 שנים']].map(([val, label]) => (
                  <button key={val} onClick={() => update('condition_duration', val)}
                    className={`text-right px-3 py-2.5 rounded-lg border text-sm transition-colors ${form.condition_duration === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">סמן את המסמכים שיש ברשותך:</p>
            <div className="space-y-2">
              {DOCUMENTS.map(d => (
                <label key={d} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.documents_available.includes(d)}
                    onChange={() => toggleArray('documents_available', d)}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-slate-700">{d}</span>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50 cursor-pointer">
              <input type="checkbox" checked={form.previous_license}
                onChange={e => update('previous_license', e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm font-medium text-blue-700">יש לי רישיון/מרשם קיים</span>
            </label>
          </div>
        )}

        {/* Step 4: Final */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1">
              <p><strong>שם:</strong> {form.full_name}</p>
              <p><strong>טלפון:</strong> {form.phone}</p>
              <p><strong>מטרה:</strong> {form.purpose}</p>
              <p><strong>מצב רפואי:</strong> {form.medical_condition}</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agree_terms}
                onChange={e => update('agree_terms', e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-blue-600" />
              <span className="text-sm text-slate-600">
                אני מסכים/ה ל<a href="/terms" className="text-blue-600 underline">תנאי השימוש</a> ול<a href="/privacy" className="text-blue-600 underline">מדיניות הפרטיות</a>.
                הדוח הוא כלי עזר בלבד ואינו ייעוץ רפואי.
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors">
              חזרה
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && (!form.full_name || !form.phone)) ||
                (step === 1 && !form.purpose) ||
                (step === 2 && !form.medical_condition)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors">
              המשך
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!form.agree_terms || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'שולח...' : 'שלח וקבל דוח חינם'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
