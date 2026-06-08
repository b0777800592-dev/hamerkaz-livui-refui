import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(9),
  city: z.string().optional(),
  preferred_contact: z.enum(['whatsapp', 'phone', 'email']).default('whatsapp'),
  purpose: z.enum(['new_license', 'renewal', 'dosage_increase', 'documents_review']),
  medical_condition: z.string().min(1),
  condition_duration: z.string().optional(),
  treatments_tried: z.array(z.string()).default([]),
  documents_available: z.array(z.string()).default([]),
  previous_license: z.boolean().default(false),
  agree_terms: z.boolean(),
})

function calculateScore(data: z.infer<typeof schema>): { score: number; complexity: 'low' | 'medium' | 'high'; missing: string[] } {
  let score = 0

  // Condition weight
  const highConditions = ['סרטן', 'פרקינסון', 'טרשת נפוצה', 'אפילפסיה']
  if (highConditions.some(c => data.medical_condition.includes(c))) score += 30
  else score += 15

  // Duration
  if (data.condition_duration === 'more_than_5_years') score += 25
  else if (data.condition_duration === '3_5_years') score += 20
  else if (data.condition_duration === '1_3_years') score += 15
  else score += 5

  // Previous license
  if (data.previous_license) score += 20

  // Documents
  const goodDocs = data.documents_available.filter(d => d !== 'אין מסמכים כרגע')
  score += Math.min(goodDocs.length * 5, 25)

  // Missing documents
  const allDocs = ['סיכום רופא', 'אבחנה פסיכיאטרית', 'מרשמים קיימים']
  const missing = allDocs.filter(d => !data.documents_available.includes(d))

  const complexity: 'low' | 'medium' | 'high' =
    score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high'

  return { score: Math.min(score, 100), complexity, missing }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
    }

    const data = parsed.data
    const { score, complexity, missing } = calculateScore(data)

    const supabase = createAdminClient()

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        source: 'eligibility_form',
        requested_service: data.purpose,
        medical_condition: data.medical_condition,
        eligibility_score: score,
        status: 'new',
      })
      .select('id')
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'שגיאה ביצירת ליד' }, { status: 500 })
    }

    // Create eligibility assessment
    await supabase.from('eligibility_assessments').insert({
      lead_id: lead.id,
      answers: data,
      condition: data.medical_condition,
      duration: data.condition_duration ?? '',
      treatments_tried: data.treatments_tried,
      documents_available: data.documents_available,
      previous_license: data.previous_license,
      requested_action: data.purpose,
      score,
      complexity,
      recommendation: score >= 70 ? 'יש בסיס טוב לבדיקה מקצועית' : score >= 40 ? 'נדרשת בדיקה נוספת' : 'מומלץ להתייעץ עם נציג',
      missing_documents: missing,
    })

    return NextResponse.json({ leadId: lead.id, score, complexity })
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
