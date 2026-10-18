export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-7">
        <span lang="en" dir="ltr" className="text-xl font-semibold">
          ONYX
        </span>
        <span lang="en" dir="ltr" className="text-sm text-muted">
          Phase 00 / Foundation
        </span>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 py-16 sm:py-24">
        <p className="mb-5 text-sm text-accent">ملابس تحمل أفكارك.</p>
        <h1 className="max-w-2xl text-4xl leading-snug font-semibold sm:text-6xl">
          ONYX يبدأ من هنا.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
          هذه صفحة التأسيس المحلية لمنصة الملابس المخصصة. نضع الأساس لتجربة تجمع بين التصميم الشخصي
          والاهتمام بالتفاصيل.
        </p>
        <a
          href="#foundation"
          className="mt-8 inline-flex min-h-12 items-center rounded-lg border border-line px-5 py-3 text-sm text-ink underline-offset-4 hover:bg-surface hover:underline"
        >
          عن هذه المرحلة
        </a>

        <section
          id="foundation"
          aria-labelledby="foundation-title"
          className="mt-16 rounded-2xl border border-line bg-surface p-6 sm:mt-20 sm:p-8"
        >
          <h2 id="foundation-title" className="text-xl font-semibold">
            بداية مدروسة
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-muted">
            المرحلة الحالية مخصصة لتأسيس المشروع وتوثيق متطلباته. المتجر واستوديو التصميم والطلبات
            ستأتي في مراحل لاحقة، بعد مراجعة هذا الأساس.
          </p>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-sm leading-7 text-muted">
        عرض محلي أولي — الألوان والخطوط مؤقتة إلى حين اعتماد الهوية الرسمية.
      </footer>
    </div>
  );
}
