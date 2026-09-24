# نشر المشروع على Vercel

## 1. معاينة الواجهة فقط

هذا الخيار مناسب لتجربة التصميم قبل إنشاء قاعدة البيانات.

أضف Environment Variables في Vercel:

```env
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NEXT_PUBLIC_DEMO_MODE=true
AUTH_SECRET=ضع_قيمة_عشوائية_طويلة
AUTH_TRUST_HOST=true
```

في هذا الوضع:

- الصفحة الرئيسية تعمل.
- Login/Register يعملان بوضع Preview.
- Dashboard الطالب تعمل ببيانات تجريبية.
- Admin Dashboard تعمل ببيانات تجريبية.
- تجربة الاختبار تعمل.
- APIs التي تحتاج Session أو Database لن تعمل كـProduction حتى تضيف PostgreSQL.

## 2. نشر Full-Stack حقيقي

أنشئ PostgreSQL Managed Database مثل Neon أو Supabase، ثم أضف:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/commerce_zagazig?sslmode=require
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
AUTH_SECRET=قيمة_عشوائية_قوية_جديدة
AUTH_TRUST_HOST=true
```

بعد ذلك شغّل من جهازك أو من CI:

```bash
npm ci
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

لا يتم تشغيل `prisma migrate dev` على Production.

## 3. OAuth Callback URLs

Google:

```text
https://YOUR-DOMAIN.vercel.app/api/auth/callback/google
```

Facebook:

```text
https://YOUR-DOMAIN.vercel.app/api/auth/callback/facebook
```

ضع القيم في Vercel:

```env
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
```

## 4. Email Provider

```env
EMAIL_FROM=noreply@your-domain.com
EMAIL_API_KEY=
EMAIL_PROVIDER_URL=https://api.resend.com/emails
```

## 5. Cloudflare R2

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=commerce-zagazig-private
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
```

## 6. Cloudflare Stream

```env
STREAM_ACCOUNT_ID=
STREAM_API_TOKEN=
STREAM_WEBHOOK_SECRET=
STREAM_PLAYBACK_BASE_URL=https://videodelivery.net
```

Webhook URL:

```text
https://YOUR-DOMAIN.vercel.app/api/v1/webhooks/stream
```

## 7. File Scanner

```env
CLAMAV_URL=https://YOUR-SCANNER/internal/scan
FILE_SCAN_MODE=required
```

يجب أن يعيد Scanner:

```json
{ "clean": true }
```

أو:

```json
{ "infected": true, "reason": "malware detected" }
```

## 8. النشر من GitHub

1. أنشئ Repository جديدًا على GitHub.
2. اربط المشروع المحلي بالـRepository:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

3. افتح Vercel.
4. اختر Add New Project.
5. اختر Repository.
6. اترك Framework على Next.js.
7. اترك Build Command على:

```text
npm run build
```

8. أضف Environment Variables.
9. اضغط Deploy.

المشروع يحتوي على `postinstall` لتشغيل:

```text
prisma generate
```

أثناء تثبيت الحزم على Vercel.
