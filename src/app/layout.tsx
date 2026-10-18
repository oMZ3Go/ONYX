import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONYX — البداية",
  description: "الأساس المحلي لمنصة ONYX للملابس المخصصة. المرحلة التأسيسية فقط.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-ink focus:p-4 focus:text-canvas"
        >
          انتقل إلى المحتوى
        </a>
        {children}
      </body>
    </html>
  );
}
