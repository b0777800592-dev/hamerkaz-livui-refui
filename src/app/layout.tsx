import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "המרכז לליווי רפואי בישראל",
  description:
    "ליווי דיסקרטי, מסודר וחכם בתהליכים רפואיים מורכבים. בדיקת התאמה ראשונית לקנאביס רפואי, הכנת מסמכים, ניהול תיק והפניה לגורמים מוסמכים.",
  keywords: "קנאביס רפואי, ליווי רפואי, בדיקת זכאות, חידוש רישיון",
  openGraph: {
    title: "המרכז לליווי רפואי בישראל",
    description: "ליווי מקצועי בתחום קנאביס רפואי",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
