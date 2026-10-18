# تقرير ONYX — Phase 00

تاريخ العمل: 2026-10-18. النطاق: تأسيس محلي داخل `D:\ONYX` فقط.

## نتيجة الفحص والحفاظ على العمل

المستودع كان مهيأً على `main` دون commits، مع remote صحيح إلى `https://github.com/oMZ3Go/ONYX.git`. لم يوجد تطبيق سابق. تمت قراءة ملفي المصدر وفحص الصورة المرجعية قبل التعديل. الطلب الأحدث يسمح بتهيئة التطبيق ويتقدم على قيد documentation-only في الملف القديم. بقيت الملفات الثلاثة الأصلية دون تغيير، مع التحقق من SHA-256 كما هو موثق في [الفحص](inspection.md).

البيئة الفعلية تختلف عن الوصف القديم: **Node.js v24.22.0 وnpm 11.19.1**. Node 24 LTS هو الأساس الموصى به والمستخدم بالفعل؛ لا حاجة لتبديل النظام الحالي. سياسة PowerShell تمنع `npm.ps1`، لذلك استُخدم `npm.cmd` دون تغيير Execution Policy أو تثبيت Node عالميًا.

## المنجز والقرارات

- توحيد PRD/SRS، نطاق MVP المقترح، الرحلات، المتطلبات الوظيفية وغير الوظيفية، معايير القبول والأسئلة المفتوحة، مع فصل **Confirmed / Recommended / Deferred / Unresolved**.
- تصميم modular monolith وحدود الوحدات والعلاقات، وفصل domain logic عن Next.js/Supabase. لم تُنشأ جداول أو موارد سحابية.
- اقتراح canonical design document مستقل عن Fabric/Konva وحزمة `.onyx` تحتوي الأصول، وسياسة IndexedDB لمشروعين فقط مع استبدال واضح ومعاملات تمنع فقد البيانات عند الفشل.
- توثيق server-authoritative pricing، immutable snapshots، private storage، scoped share grants، idempotency، وحالات الطلب التي تفصل المسودة وفتح WhatsApp عن التأكيد اليدوي.
- توثيق UX للموبايل وسطح المكتب، provisional tokens، دمج الهوية لاحقًا دون إعادة تصميم الشعار، وDTF export منفصل عن mockup مع أسئلة المطبعة.
- وضع تجربة مقارنة قابلة للقياس بين Fabric.js وKonva. **لم يُحسم المحرك ولم تُنفذ التجربة**.
- تهيئة Next.js App Router + React + strict TypeScript + Tailwind، صفحة عربية بسيطة، ESLint/Prettier/Vitest، واختبار render صغير. لا توجد أزرار طلب وهمية أو وظائف متجر/editor/admin.
- خريطة مراحل 00–08 مع مخرجات واعتماديات ومعايير قبول ومخاطر وDefinition of Done؛ تقديم P05A لتثبيت عقود الكتالوج والتسعير قبل P03/P04 وتأخير P05B حتى جاهزية مستند التصميم.

الإصدارات المباشرة محددة بدقة في `package.json`. اختير TypeScript 5.9.3 لأن `typescript-eslint` الحالي يدعم TypeScript أقل من 6.1. كشف التثبيت أن ESLint 9 انتهى دعمه، فاستُبدل بـESLint 10.13.0 مع قواعد JavaScript وTypeScript وReact Hooks المتوافقة مباشرة. أُزيلت إضافة Next lint بعد أن أظهر audit اعتمادًا غير مُصلح على `braces`؛ القواعد المتخصصة لـNext مؤجلة حتى إصدار متوافق وآمن، ولم تُخفَ التحذيرات أو تُفرض peer dependencies بالقوة. هذا basic linting وليس تدقيق accessibility كاملًا. لم تُضف SDKs لـSupabase أو Fabric/Konva أو Motion/Zustand/shadcn/ui أو Playwright قبل الحاجة إليها. [ADR](../architecture/decisions/0001-foundation.md) و[المراجع الرسمية](../references.md) يسجلان السبب والتفاصيل.

## بنية التطبيق

`src/app/` يحتوي layout والصفحة الأولية وglobal styles والاختبار. `src/styles/tokens.css` يجمع الألوان والخطوط المؤقتة. لا توجد مجلدات domain/server فارغة أو طبقات تجريد بلا استخدام. هيكل الوحدات المستقبلية موثق في [المعمارية](../architecture/overview.md). لغة الصفحة العربية اختيار مؤقت للمراجعة، ولا تحسم قرار اللغات النهائي.

## التحقق الفعلي

| الفحص                                       | النتيجة الفعلية                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation                     | نجح؛ الشجرة النهائية تحتوي 204 packages مثبتة، مع exact pins وlockfile                                                                                |
| `npm.cmd ci --offline --no-audit --no-fund` | نجح من الكاش في 21 ثانية؛ أعاد تثبيت الشجرة من lockfile دون تعديل الإصدارات                                                                           |
| `npm.cmd run format:check`                  | نجح لجميع الملفات المشمولة، مع استثناء المصادر المحفوظة من إعادة التنسيق                                                                              |
| `npm.cmd run lint`                          | نجح دون warnings                                                                                                                                      |
| `npm.cmd run typecheck`                     | نجح `next typegen` ثم `tsc --noEmit`                                                                                                                  |
| `npm.cmd test`                              | نجح ملف واحد واختبار واحد في Vitest 5.0.5؛ render الصفحة ووجهة الرابط الداخلي والوسم المؤقت                                                           |
| `npm.cmd run build`                         | نجح Next.js 16.4.2/Turbopack؛ الصفحة `/` و`/_not-found` بُنيتا كـstatic content                                                                       |
| npm audit                                   | النتيجة النهائية **0 vulnerabilities** بعد إزالة الاعتماد المتأثر؛ audit ليس ضمانًا لغياب جميع الثغرات                                                |
| Production HTTP smoke                       | `/` أعاد 200، والمسار غير الموجود أعاد 404؛ `lang=ar` و`dir=rtl` و`noindex` موجودة، و`X-Powered-By` غير موجود                                         |
| Edge browser check                          | نجح عند 320/390/1280 CSS px: لا overflow أفقي، الروابط الداخلية صحيحة، skip link يستقبل Tab، لا JavaScript exceptions؛ روجعت صور الموبايل وسطح المكتب |
| الحفاظ على المدخلات                         | SHA-256 للملفين والصورة الأصلية مطابق للفحص الأول                                                                                                     |
| روابط التوثيق وGit ignores                  | لا روابط داخلية مفقودة؛ ملفات الأسرار والكاش والبناء والعملاء مستثناة و`.env.example` قابل للتتبع                                                     |

ملاحظات التنفيذ: أول محاولة للوصول إلى registry داخل sandbox فشلت بـ`EACCES`، ثم نجح الوصول المصرح به. `npm.ps1` فشل بسبب Execution Policy، فاستُخدم `npm.cmd`. كشف التثبيت الأول ESLint 9 EOL و5 تحذيرات high؛ الانتقال إلى ESLint 10 احتاج إعادة توليد الشجرة بسبب peer resolution في الشجرة القديمة. بعد ذلك كشف audit أربع إشارات مرتبطة بسلسلة `fast-glob → micromatch → braces` من Next lint plugin؛ إزالة هذه الإضافة غير اللازمة للـstarter خفضت النتيجة إلى صفر. لم يُستخدم `audit fix --force` أو `legacy-peer-deps`، ولم يُخفض إصدار Next.js للتخلص من التحذير. السبب والمراجعة المستقبلية موثقان في ADR 0001.

محاولة Edge الأولى داخل sandbox توقفت عند `Page.enable` timeout؛ إعادة الفحص المصرح بها خارجه باستخدام profile مؤقت داخل workspace نجحت. استُخدم Edge المثبت دون تنزيل Playwright أو browser جديد. هذه viewport emulation وفحوص بسيطة، وليست اختبارات أجهزة فعلية أو Instagram/TikTok أو screen reader أو تدقيق WCAG كامل. لم تُنفذ اختبارات canvas/DTF/Supabase لأنها خارج Phase 00. أُوقف خادم الفحص والمتصفح المخصص بعد الانتهاء؛ صور ونتيجة الفحص في `.cache/` المحلية المتجاهلة.

## الأسئلة والحدود المتبقية

الهوية الرسمية، UI locale، SKU/المقاسات/الأقمشة/التوافر، العملة والتقريب والرسوم والتسعير، stock reservation، رقم WhatsApp والسياسات التشغيلية، صلاحية الروابط والاحتفاظ بالبيانات، أدوار الموظفين، حقوق القوالب والخطوط، ومواصفات المطبعة ما زالت تحتاج قرارات. 300 PPI ومقاس 300×350 mm في الوثائق **افتراض/مثال تجريبي فقط**. [سجل القرارات](../requirements/open-questions.md) يحدد المسؤول والمرحلة المتأثرة.

أهم مخاطر المراحل اللاحقة: العربية/IME على canvas، ذاكرة export في الموبايل، فقدان browser storage، تسرب bearer links، صلاحيات RLS/storage، الأسعار المعدّلة من العميل، وحالات الفشل بين Storage وPostgreSQL. الضوابط موثقة ولم تُنفذ لأن تلك الوظائف خارج Phase 00. يجب التحقق من ملاءمة وإتاحة مزود الاستضافة/الخدمات في السوق المستهدف قبل الاختيار النهائي. لا يوجد claim بأن starter اجتاز تدقيق أمان إنتاجي.

## قائمة الملفات

الملفات الأصلية المحفوظة دون تعديل:

```text
00_PROJECT_BRIEF_AR.md
01_CODEX_START_PROMPT.md
docs/brand/onyx-brand-reference.jpeg
```

أُنشئ **46 ملفًا مصدريًا/توثيقيًا جديدًا**، دون تعديل الملفات الأصلية الثلاثة. ملفات الإعداد والتطبيق الجديدة (21):

```text
.editorconfig
.env.example
.gitattributes
.gitignore
.npmrc
.nvmrc
.prettierignore
.prettierrc.json
README.md
package.json
package-lock.json
next.config.ts
postcss.config.mjs
eslint.config.mjs
tsconfig.json
vitest.config.mts
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/page.test.tsx
src/styles/tokens.css
```

ملفات التوثيق الجديدة (25):

```text
docs/README.md
docs/references.md
docs/phase-00/master-request.md
docs/phase-00/inspection.md
docs/phase-00/report.md
docs/requirements/prd.md
docs/requirements/srs.md
docs/requirements/mvp-scope.md
docs/requirements/user-journeys.md
docs/requirements/non-functional-requirements.md
docs/requirements/acceptance-criteria.md
docs/requirements/open-questions.md
docs/architecture/overview.md
docs/architecture/domain-model.md
docs/architecture/design-documents.md
docs/architecture/ordering.md
docs/architecture/security.md
docs/architecture/decisions/0001-foundation.md
docs/architecture/decisions/0002-canvas-engine.md
docs/architecture/decisions/0003-project-format.md
docs/design/ux-and-design-system.md
docs/printing/dtf-pipeline.md
docs/spikes/canvas-evaluation.md
docs/quality/verification.md
docs/roadmap/phases.md
```

`master-request.md` نسخة محفوظة من الطلب المرفق. `node_modules/` و`.next/` و`.cache/` و`next-env.d.ts` و`*.tsbuildinfo` نواتج محلية متجاهلة في Git وليست ملفات تسليم مصدرية. `.env.example` لا يحتوي أي credentials، ولا يحتاج التطبيق إلى إعداد خدمة خارجية.

## Definition of Done والخطوة التالية

**Phase 00 تستوفي Definition of Done التقني:** اكتملت مخرجات A–H، وحُفظت المدخلات، ووُثقت القرارات والمخاطر، وعمل التطبيق الأولي واجتازت فحوصه المحددة. موافقة المالك على الوثائق ونطاق MVP ما زالت منتظرة، ولا تعني هذه النتيجة جاهزية المنتج للإطلاق.

أُعدّت ملفات Phase 00 والـlockfile لإدراجها ضمن أول commit محلي على الفرع `main`. لم يحدث push أو deployment أو إنشاء موارد Supabase أو إرسال رسائل. يُتحقق من نجاح الـcommit باستخدام `git log -1 --oneline`، ومن حالة الملفات باستخدام `git status`.

الخطوة التالية: مراجعة [فهرس الوثائق](../README.md) و[الأسئلة المفتوحة](../requirements/open-questions.md)، ثم تقديم الهوية الرسمية والكتالوج وإجابات المطبعة، وتحديد UI locale والتسعير والسياسات قبل مراحلها المعتمدة. توقّف العمل عند Phase 00 بانتظار مراجعة المالك وموافقته؛ لم تبدأ Phase 01.
