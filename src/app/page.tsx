import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-slate-800">
            המרכז לליווי רפואי
          </div>
          <div className="flex items-center gap-4">
            <Link href="/eligibility" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
              בדיקת התאמה
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              כניסה
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          ליווי מקצועי ודיסקרטי
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
          ליווי חכם בתהליכי
          <br />
          <span className="text-blue-600">קנאביס רפואי בישראל</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          בדיקת התאמה ראשונית, הכנת מסמכים, ניהול תיק והפניה לגורמים מוסמכים.
          המערכת אינה מעניקה ייעוץ רפואי ואינה מבטיחה אישור.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/eligibility"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-blue-200"
          >
            בדיקת התאמה ראשונית – חינם
          </Link>
          <a
            href="https://wa.me/972500000000"
            className="border-2 border-slate-200 hover:border-blue-300 text-slate-700 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            דברו איתנו בוואטסאפ
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">השירותים שלנו</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "בקשה חדשה", desc: "ליווי מלא בתהליך הגשת בקשה ראשונה", href: "/services/new-license" },
            { title: "חידוש רישיון", desc: "ניהול תהליך החידוש לפני תאריך התפוגה", href: "/services/renewal" },
            { title: "הגדלת מינון", desc: "ליווי בתהליך בקשת הגדלת מינון", href: "/services/dosage-increase" },
            { title: "בדיקת מסמכים", desc: "בדיקה והכנת תיק המסמכים הרפואי", href: "/services/documents-review" },
          ].map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md hover:border-blue-100 transition-all group"
            >
              <h3 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h3>
              <p className="text-slate-500 text-sm">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 text-center text-sm text-slate-400">
        <p>© 2024 המרכז לליווי רפואי בישראל | המערכת אינה מעניקה ייעוץ רפואי ואינה מחליפה רופא מוסמך.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="/privacy" className="hover:text-slate-600">מדיניות פרטיות</Link>
          <Link href="/terms" className="hover:text-slate-600">תנאי שימוש</Link>
          <Link href="/accessibility" className="hover:text-slate-600">נגישות</Link>
        </div>
      </footer>
    </main>
  );
}
