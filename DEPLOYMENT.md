# 🚀 دليل نشر المشروع على Netlify

## 📋 المتطلبات

- Node.js 18+
- npm أو yarn
- حساب على Netlify
- حساب GitHub (للنشر التلقائي)

---

## 🔧 الإعداد المحلي

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد المتغيرات البيئية
انسخ `.env.example` إلى `.env.local`:
```bash
cp .env.example .env.local
```

ثم املأ القيم الحقيقية:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_domain
# ... إلخ
```

### 3. اختبار الـ Build محلياً
```bash
npm run build
```

يجب أن يتم إنشاء مجلد `out/` بنجاح.

---

## 🌐 النشر على Netlify

### الطريقة 1: عبر Git (موصى بها)

#### الخطوة 1: رفع الكود على GitHub
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

#### الخطوة 2: ربط Netlify بـ GitHub
1. اذهب إلى [netlify.com](https://netlify.com)
2. اضغط **"New site from Git"**
3. اختر **GitHub**
4. اختر الـ repository الخاص بك
5. اضغط **Deploy site**

#### الخطوة 3: إضافة Environment Variables
في لوحة تحكم Netlify:
1. اذهب إلى **Site settings** → **Environment variables**
2. أضف المتغيرات التالية:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_IMGBB_API_KEY
```

3. احفظ واضغط **Trigger deploy**

---

### الطريقة 2: Drag & Drop

#### الخطوة 1: Build محلياً
```bash
npm run build
```

#### الخطوة 2: رفع المجلد
1. اذهب إلى [netlify.com](https://netlify.com)
2. اسحب مجلد `out/` إلى المنطقة المخصصة
3. انتظر حتى يكتمل الرفع

#### الخطوة 3: إضافة Environment Variables
نفس الخطوات في الطريقة 1.

---

## 🔍 التحقق من النشر

بعد النشر، تحقق من:
- ✅ الصفحة الرئيسية تعمل
- ✅ القائمة تظهر بشكل صحيح
- ✅ لوحة التحكم تعمل
- ✅ Firebase متصل
- ✅ الصور تظهر

---

## 🐛 حل المشاكل الشائعة

### المشكلة: Build Failed
**الحل:**
```bash
# تنظيف الـ cache
npm run clean
npm install
npm run build
```

### المشكلة: 404 على الروابط
**الحل:** تأكد من وجود ملف `public/_redirects`

### المشكلة: Firebase لا يعمل
**الحل:** تحقق من Environment Variables على Netlify

### المشكلة: الصور لا تظهر
**الحل:** تأكد من `NEXT_PUBLIC_IMGBB_API_KEY`

---

## 📊 إعدادات Netlify

### Build settings
- **Build command:** `npm run build`
- **Publish directory:** `out`
- **Node version:** `18`

### Redirects
تم إعدادها في `netlify.toml` و `public/_redirects`

---

## 🔄 التحديثات التلقائية

مع الطريقة 1 (Git):
- كل push للـ `main` branch = deploy تلقائي
- يمكنك إيقاف Auto-deploy من إعدادات Netlify

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Netlify Deploy Logs
2. راجع ملف `DEPLOYMENT.md` هذا
3. تحقق من [Netlify Docs](https://docs.netlify.com)

---

**✅ تم! موقعك الآن جاهز على Netlify** 🎉
