# كلية التجارة - جامعة الزقازيق

منصة تعليمية Full-Stack لطلاب كلية التجارة بجامعة الزقازيق، مبنية باستخدام Next.js وTypeScript وPostgreSQL وPrisma.

## الحالة الحالية

هذه أول دفعة تنفيذية من المشروع وتشمل:

- Landing Page عربية RTL بهوية كلية التجارة - جامعة الزقازيق.
- Logo المرفق داخل `public/logo.png`.
- صفحة Login/Register بتحديد الفرقة والشعبة.
- Student Dashboard مخصص للفرقة الثانية / انتظام كنموذج تفاعلي.
- Admin Dashboard أولي.
- Design System responsive وحالات UI أساسية.
- Prisma 7 Schema للـUsers وRoles وPermissions والفرق والمواد والكتب والمذكرات والفيديوهات والاختبارات والنتائج والـAudit Logs.
- Seed للفرق والشعب والأدوار والصلاحيات والمواد الأولية.
- Auth.js route foundation مع Credentials وGoogle وFacebook.
- Register API مع Zod وArgon2id.
- Health API.
- Grades وSubjects وLinks APIs مع تحديد النطاق الأكاديمي.
- Books API للطالب وCRUD أساسي للأدمن.
- Presigned R2 upload foundation وcomplete file registration.
- Email Verification وForgot Password وReset Password APIs.
- User Management وRole Management APIs.
- Admin Workspace للجداول والرفع مع Progress Bar.
- إدارة الفرق والشعب والمواد وGradeSubject mappings.
- Audit Logs API.
- Cloudflare Stream direct upload وsigned playback وwebhook.
- File scanning foundation مع ClamAV-compatible HTTP scanner.
- Security headers وSEO metadata وrobots وsitemap.

> الواجهات الحالية تعمل بوضع Preview حتى يمكن مراجعتها قبل ربط بيانات Production. اضبط `NEXT_PUBLIC_DEMO_MODE=false` بعد تشغيل PostgreSQL وتهيئة OAuth حتى تنتقل صفحات الدخول والـDashboard إلى المسار الحقيقي.

## المتطلبات

- Node.js 20.20+ أو إصدار LTS أحدث.
- PostgreSQL.
- npm.

## التشغيل المحلي

```bash
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

افتح:

```text
http://localhost:3000
```

## تشغيل قاعدة البيانات

ضع `DATABASE_URL` حقيقيًا في `.env` ثم نفذ:

```bash
npm run db:validate
npm run db:migrate -- --name init
npm run db:seed
```

## Routes الحالية

- `/` — الصفحة التعريفية.
- `/login` — تسجيل الدخول وإنشاء الحساب.
- `/dashboard` — لوحة الطالب التجريبية.
- `/admin` — لوحة الأدمن التجريبية.
- `/api/v1/health` — Health Check.
- `/api/v1/auth/register` — Register API وإرسال Email Verification.
- `/api/v1/auth/verify-email` — تفعيل البريد الإلكتروني.
- `/api/v1/auth/forgot-password` — طلب إعادة تعيين كلمة المرور.
- `/api/v1/auth/reset-password` — حفظ كلمة المرور الجديدة.
- `/api/v1/grades` — نطاق الفرق للمستخدم المصادق عليه.
- `/api/v1/subjects` — المواد حسب الفرقة والشعبة.
- `/api/v1/books` — الكتب المنشورة ضمن نطاق الطالب.
- `/api/v1/links` — الروابط المهمة ضمن النطاق.
- `/api/v1/admin/books` — CRUD الكتب للأدمن.
- `/api/v1/admin/links` — CRUD الروابط للأدمن.
- `/api/v1/notes` — المذكرات المنشورة ضمن نطاق الطالب.
- `/api/v1/admin/notes` — CRUD المذكرات للأدمن.
- `/api/v1/videos` — فيديوهات الشرح ضمن نطاق الطالب.
- `/api/v1/videos/:id/playback` — Signed playback للفيديو.
- `/api/v1/admin/videos/upload-session` — Direct upload session لـCloudflare Stream.
- `/api/v1/admin/videos` — CRUD الفيديوهات للأدمن.
- `/api/v1/webhooks/stream` — تحديث حالة الفيديو من Stream.
- `/api/v1/admin/files/presign` — Presigned upload لـR2.
- `/api/v1/admin/files/complete` — تسجيل الملف بعد الرفع والفحص.
- `/api/v1/admin/files/:id/scan` — فحص الملف وعزله عند الاشتباه.
- `/api/v1/admin/users` — إدارة المستخدمين.
- `/api/v1/admin/users/:id/roles` — إدارة أدوار المستخدم.
- `/api/v1/admin/audit-logs` — قراءة سجل النشاط.
- `/api/v1/admin/grades` — إدارة الفرق.
- `/api/v1/admin/tracks` — إدارة الشعب.
- `/api/v1/admin/subjects` — إدارة المواد.
- `/api/v1/admin/grade-subjects` — ربط المواد بالفرق والشعب.
- `/api/v1/exams` — الاختبارات المتاحة ضمن نطاق الطالب.
- `/api/v1/exams/:id/attempts` — بدء محاولة اختبار.
- `/api/v1/attempts/:id` — قراءة محاولة الطالب وحالتها.
- `/api/v1/attempts/:id/answers/:questionId` — حفظ إجابة واحدة.
- `/api/v1/attempts/:id/submit` — تسليم الاختبار واحتساب النتيجة في الخادم.
- `/api/v1/attempts/:id/result` — نتيجة المحاولة.
- `/api/v1/me/results` — نتائج الطالب.
- `/api/v1/admin/exams` — CRUD الاختبارات للأدمن.
- `/api/v1/admin/questions` — إدارة بنك الأسئلة.
- `/api/v1/admin/exams/:id/questions` — ربط الأسئلة بالاختبار.
- `/api/v1/admin/exams/:id/publish` — نشر الاختبار بعد اكتمال الأسئلة.
- `/api/v1/admin/results` — نتائج الطلاب للأدمن.
- `/api/auth/*` — Auth.js OAuth/Session endpoints.

## الخط

ضع ملفات IRANSharp المرخصة داخل:

```text
public/fonts/
```

يفضل استخدام:

```text
IRANSharp-Regular.woff2
IRANSharp-Medium.woff2
IRANSharp-Bold.woff2
```

## هيكل مهم

```text
src/app          صفحات Next.js وRoute Handlers
src/components   Components الواجهة
src/data         بيانات Preview المؤقتة
src/server       Database وAuth وServices المستقبلية
prisma           Schema وSeed وMigrations
public            Logo وAssets
```

## فحص الجودة

```bash
npm run lint
npm run typecheck
npm run build
```

لا تضع أي Secrets حقيقية داخل Git. استخدم `.env` محليًا وEnvironment Variables في Staging/Production.
