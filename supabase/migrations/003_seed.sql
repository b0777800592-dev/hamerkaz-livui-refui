-- Demo seed data for local development

-- Demo admin user (create via Supabase auth first, then update role)
-- Run after creating user in Supabase dashboard:
-- update profiles set role = 'admin' where email = 'admin@demo.local';

-- Demo partner
insert into partners (name, type, contact_name, phone, email, referral_code, commission_type, commission_value)
values ('קליניקת בריאות תל אביב', 'clinic', 'ד"ר כהן', '050-1234567', 'clinic@demo.local', 'CLINIC001', 'fixed', 200);

-- Demo articles
insert into articles (title, slug, type, meta_title, meta_description, content_md, status, published_at)
values
  ('קנאביס רפואי בישראל – מדריך מלא', 'madrich-cannabis-refui', 'guide',
   'קנאביס רפואי בישראל – מדריך מלא 2024', 'כל מה שצריך לדעת על קבלת רישיון קנאביס רפואי בישראל.',
   '## קנאביס רפואי בישראל

קנאביס רפואי הוא אחד הנושאים החשובים ביותר בתחום הבריאות בישראל. במדריך זה נסקור את כל השלבים...

### מי זכאי?

מטופלים הסובלים ממצבים רפואיים מוכרים כגון כאב כרוני, PTSD, סרטן ועוד.

### שלבי התהליך

1. בדיקת התאמה ראשונית
2. איסוף מסמכים רפואיים
3. הגשה לוועדה המוסמכת
4. קבלת אישור ורישיון

**הערה:** המידע כאן הוא כללי בלבד ואינו תחליף לייעוץ רפואי מקצועי.',
   'published', now()),

  ('חידוש רישיון קנאביס רפואי', 'hidush-rishyon-cannabis', 'service',
   'חידוש רישיון קנאביס רפואי – כל מה שצריך לדעת', 'מדריך לחידוש רישיון קנאביס רפואי בישראל.',
   '## חידוש רישיון קנאביס רפואי

תהליך החידוש מתחיל בדרך כלל 30–60 יום לפני תאריך התפוגה...', 'published', now());
