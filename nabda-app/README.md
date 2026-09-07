# نبضة — منصة إدارة سوشيال ميديا

تطبيق Next.js فيه:
- صفحة هبوط (landing page)
- تسجيل / دخول (JWT في كوكيز httpOnly)
- لوحة تحكم محمية للعميل (تعرض الباقة الحالية وسجل الفواتير)
- صفحة اشتراك ودفع متكاملة مع **Authorize.Net Accept.js**

## التشغيل محليًا

```bash
npm install
cp .env.example .env.local   # واملأ القيم الحقيقية
npm run dev
```

يفتح على http://localhost:3000

## إعداد Authorize.Net

1. اعمل حساب Sandbox مجاني من https://developer.authorize.net/hello_world.html
2. من لوحة تحكم الحساب (Sandbox أو الحقيقي لاحقًا) هتلاقي:
   - **API Login ID**
   - **Transaction Key** (بتتولد مرة واحدة، احتفظ بيها في مكان آمن)
   - **Public Client Key** (خاص بـ Accept.js، آمن يظهر في الواجهة الأمامية)
3. حطهم في `.env.local`:
   ```
   AUTHORIZE_API_LOGIN_ID=...
   AUTHORIZE_TRANSACTION_KEY=...
   AUTHORIZE_ENVIRONMENT=sandbox
   NEXT_PUBLIC_AUTHORIZE_CLIENT_KEY=...
   NEXT_PUBLIC_AUTHORIZE_API_LOGIN_ID=...
   ```
4. للاختبار استخدم أرقام كروت Authorize.Net التجريبية (متاحة في توثيقهم الرسمي)، مش أرقام حقيقية.
5. لما تكون جاهز للإنتاج الفعلي، غيّر `AUTHORIZE_ENVIRONMENT=production` واستخدم بيانات الحساب الحقيقي (بعد ما توافق عليه Authorize.Net).

## طريقة عمل الدفع بالتفصيل

1. المستخدم بيكتب بيانات الكارت في صفحة `/checkout`.
2. سكريبت **Accept.js** (محمّل من سيرفرات Authorize.Net نفسها) بيشفّر البيانات في المتصفح ويحولها لـ **payment nonce** — رقم الكارت الحقيقي **مايوصلش لسيرفرك خالص**.
3. الـ nonce ده بس اللي بيتبعت لـ `/api/checkout`.
4. السيرفر (`lib/authorizeNet.js`) بياخد الـ nonce ويبعته لـ Authorize.Net API مع الـ API Login ID والـ Transaction Key (اللي فضلين على السيرفر بس، أبدًا في كود الواجهة).
5. لو العملية نجحت، بيتسجل الاشتراك في قاعدة البيانات ويظهر في لوحة تحكم العميل.

## قاعدة البيانات

المشروع ده بيستخدم ملف `data.json` كتخزين مبسط للتجربة فقط (`lib/db.js`).
**قبل ما تشتغل فعليًا بعملاء حقيقيين**، استبدل الملف ده بقاعدة بيانات حقيقية
(Postgres, MySQL, MongoDB، إلخ) — التخزين في ملف مش آمن ومش موثوق في بيئة إنتاج حقيقية.

## أمان مهم

- متحطش `AUTHORIZE_TRANSACTION_KEY` أبدًا في كود يظهر في المتصفح.
- شغّل الموقع دايمًا على HTTPS في الإنتاج (شرط أساسي من Authorize.Net نفسها).
- غيّر `JWT_SECRET` لقيمة عشوائية طويلة وحطها في متغيرات البيئة بتاعة السيرفر الحقيقي، مش في الكود.
