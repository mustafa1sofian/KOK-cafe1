# مشروع موقع مطعم كوكيان | Koukian Restaurant Website

## 📋 نظرة عامة | Overview

**مشروع موقع إلكتروني فاخر لمطعم كوكيان** - مطعم متخصص في المأكولات الشامية والبحرية الراقية مع إطلالة بحرية ساحرة.

**Koukian Restaurant Luxury Website** - A high-end restaurant specializing in Levantine and seafood cuisine with stunning sea views.

---

## 🛠️ التقنيات المستخدمة | Tech Stack

### الإطار الأساسي | Core Framework
- **Next.js 13.5.1** - React Framework with SSR
- **TypeScript 5.2.2** - Type Safety
- **React 18.2.0** - UI Library
- **TailwindCSS 3.3.3** - Styling Framework

### قاعدة البيانات والمصادقة | Database & Authentication
- **Firebase 12.1.0** - Backend as a Service
  - **Firestore** - NoSQL Database
  - **Firebase Auth** - Authentication System
  - **Firebase Storage** - Image Storage

### مكتبات واجهة المستخدم | UI Libraries
- **Radix UI** - Headless UI Components
  - Alert Dialog, Dialog, Dropdown Menu, Select, Tabs, Toast, etc.
- **shadcn/ui** - Pre-built UI Components
- **Lucide React 0.446.0** - Icon Library
- **Embla Carousel 8.3.0** - Carousel Component
- **Recharts 2.12.7** - Charts Library

### إدارة النماذج | Form Management
- **React Hook Form 7.53.0** - Form State Management
- **Zod 3.23.8** - Schema Validation
- **@hookform/resolvers 3.9.0** - Form Validation Resolvers

### مكتبات أخرى | Other Libraries
- **date-fns 3.6.0** - Date Manipulation
- **mathjs 14.6.0** - Math Operations
- **sonner 1.5.0** - Toast Notifications
- **next-themes 0.3.0** - Theme Management
- **class-variance-authority** - CSS Variant Management
- **clsx & tailwind-merge** - Class Name Utilities

---

## 📂 هيكل المشروع | Project Structure

```
project/
├── app/                           # Next.js App Directory
│   ├── admin/                    # 🔐 لوحة التحكم | Admin Dashboard
│   │   ├── contact/              # إدارة رسائل التواصل
│   │   ├── event-reservations/   # إدارة حجوزات الفعاليات
│   │   ├── events/               # إدارة الفعاليات
│   │   ├── featured-dishes/      # إدارة الأطباق المميزة
│   │   ├── gallery/              # إدارة المعرض
│   │   ├── login/                # صفحة تسجيل الدخول
│   │   ├── menu/                 # إدارة القائمة
│   │   ├── offers/               # إدارة العروض
│   │   ├── reservations/         # إدارة الحجوزات
│   │   ├── site-settings/        # إعدادات الموقع
│   │   └── page.tsx              # الصفحة الرئيسية للوحة التحكم
│   ├── menu/                     # صفحة القائمة العامة
│   ├── globals.css               # الأنماط العامة
│   ├── layout.tsx                # Layout الرئيسي
│   └── page.tsx                  # الصفحة الرئيسية للموقع
│
├── components/                    # المكونات (58 component)
│   ├── Header.tsx                # الهيدر مع القائمة
│   ├── HeroSection.tsx           # قسم البطل الرئيسي
│   ├── AboutSection.tsx          # قسم من نحن
│   ├── MenuSection.tsx           # قسم القائمة
│   ├── OffersSection.tsx         # قسم العروض الخاصة
│   ├── EventsSection.tsx         # قسم الفعاليات
│   ├── ReservationSection.tsx    # قسم الحجز
│   ├── GallerySection.tsx        # قسم المعرض
│   ├── ContactSection.tsx        # قسم التواصل
│   ├── Footer.tsx                # الفوتر
│   └── ui/                       # مكونات UI (48 component)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       └── ... (44 more components)
│
├── contexts/                      # React Context
│   └── LanguageContext.tsx       # إدارة اللغات (عربي/إنجليزي)
│
├── lib/                          # المكتبات والوظائف المساعدة
│   ├── firebase.ts               # إعداد Firebase
│   ├── firestore.ts              # عمليات قاعدة البيانات
│   ├── auth.ts                   # وظائف المصادقة
│   ├── imgbb.ts                  # رفع الصور على ImgBB
│   ├── seedData.ts               # بيانات تجريبية
│   └── utils.ts                  # وظائف مساعدة
│
├── hooks/                        # Custom React Hooks
│
├── public/                       # الملفات الثابتة
│   ├── koukian-logo.svg          # شعار المطعم
│   ├── image.png
│   ├── manifest.json
│   └── رمز العملة السعودية.svg
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript Config
├── tailwind.config.ts            # Tailwind Config
├── next.config.js                # Next.js Config
├── components.json               # shadcn/ui Config
└── .eslintrc.json               # ESLint Config
```

---

## 🎯 الميزات الرئيسية | Key Features

### 1️⃣ الواجهة الأمامية | User-Facing Features

#### 🏠 الصفحة الرئيسية | Home Page
- ✅ **Hero Section** - قسم رئيسي جذاب مع صورة خلفية قابلة للتخصيص
- ✅ **About Section** - نبذة عن المطعم
- ✅ **Menu Section** - عرض الأطباق المميزة
- ✅ **Offers Section** - العروض الخاصة (قابل للتحكم في الإظهار/الإخفاء)
- ✅ **Events Section** - الفعاليات القادمة (قابل للتحكم في الإظهار/الإخفاء)
- ✅ **Reservation Section** - نظام حجز الطاولات مع شروط وأحكام
- ✅ **Gallery Section** - معرض صور المطعم
- ✅ **Contact Section** - معلومات التواصل والموقع
- ✅ **Footer** - روابط سريعة ومواقع التواصل الاجتماعي

#### 🍽️ صفحة القائمة | Menu Page
- ✅ عرض القائمة الكاملة حسب الفئات
- ✅ تصنيفات فرعية
- ✅ بحث وفلترة

#### 🌐 دعم لغتين | Bilingual Support
- ✅ **العربية** (RTL Support)
- ✅ **الإنجليزية** (LTR Support)
- ✅ تبديل سلس بين اللغتين
- ✅ حفظ تفضيل اللغة في localStorage
- ✅ جميع النصوص والمحتوى متوفر باللغتين

#### 📱 تصميم متجاوب | Responsive Design
- ✅ Mobile-First Approach
- ✅ يعمل بشكل مثالي على جميع الأجهزة
- ✅ Breakpoints: sm, md, lg, xl, 2xl

### 2️⃣ لوحة التحكم | Admin Dashboard

#### 🔐 نظام المصادقة | Authentication
- ✅ تسجيل دخول آمن
- ✅ Firebase Authentication
- ✅ حماية الصفحات الإدارية

#### 📊 إدارة المحتوى | Content Management

##### 1. إدارة القائمة | Menu Management (`/admin/menu`)
- ✅ **الفئات (Categories)**
  - إضافة/تعديل/حذف فئات رئيسية
  - ترتيب الفئات
  - أنواع الفئات بالأيقونات (أطباق، مشروبات، شيشة)
- ✅ **الفئات الفرعية (Subcategories)**
  - إضافة/تعديل/حذف فئات فرعية
  - ربط بالفئات الرئيسية
- ✅ **عناصر القائمة (Menu Items)**
  - إضافة/تعديل/حذف أطباق
  - رفع صور للأطباق
  - الاسم والوصف بالعربي والإنجليزي
  - السعر
  - حالة التوفر (Available/Unavailable)
  - تمييز الأطباق المميزة (Featured)

##### 2. إدارة الأطباق المميزة | Featured Dishes (`/admin/featured-dishes`)
- ✅ اختيار الأطباق المميزة
- ✅ ترتيب العرض
- ✅ تحديث الأطباق المعروضة في الصفحة الرئيسية

##### 3. إدارة العروض | Offers Management (`/admin/offers`)
- ✅ إضافة/تعديل/حذف عروض خاصة
- ✅ العنوان والوصف بالعربي والإنجليزي
- ✅ السعر وتاريخ الانتهاء
- ✅ Badge (مثل: New، Hot Deal)
- ✅ صورة للعرض
- ✅ تفعيل/تعطيل العروض

##### 4. إدارة الفعاليات | Events Management (`/admin/events`)
- ✅ إضافة/تعديل/حذف فعاليات
- ✅ التاريخ والوقت
- ✅ السعة القصوى (Capacity)
- ✅ السعر
- ✅ صورة للفعالية
- ✅ تصنيف الفعالية (Conference، Workshop، etc.)

##### 5. إدارة المعرض | Gallery Management (`/admin/gallery`)
- ✅ رفع صور جديدة
- ✅ تصنيف الصور (Interior، Food، Events، etc.)
- ✅ Alt Text بالعربي والإنجليزي
- ✅ ترتيب الصور
- ✅ حذف الصور

##### 6. إدارة الحجوزات | Reservations Management (`/admin/reservations`)
- ✅ عرض جميع الحجوزات
- ✅ تأكيد/رفض الحجوزات
- ✅ تفاصيل كاملة عن كل حجز:
  - اسم العميل
  - رقم الهاتف والبريد الإلكتروني
  - التاريخ والوقت
  - عدد الضيوف (بالغين + أطفال)
  - تفضيل الجلوس (داخلي/خارجي، تدخين/غير مدخنين)

##### 7. إدارة حجوزات الفعاليات | Event Reservations (`/admin/event-reservations`)
- ✅ عرض حجوزات الفعاليات
- ✅ تأكيد/رفض الحجوزات
- ✅ تفاصيل الحضور

##### 8. إدارة رسائل التواصل | Contact Messages (`/admin/contact`)
- ✅ عرض جميع الرسائل
- ✅ قراءة/عدم قراءة
- ✅ معلومات المرسل

##### 9. إعدادات الموقع | Site Settings (`/admin/site-settings`)
- ✅ **صورة Hero Section** - تغيير الصورة الخلفية للصفحة الرئيسية
- ✅ **إظهار/إخفاء قسم العروض**
- ✅ **إظهار/إخفاء قسم الفعاليات**
- ✅ إعدادات عامة أخرى

##### 10. Dashboard الرئيسي | Main Dashboard (`/admin`)
- ✅ إحصائيات سريعة:
  - إجمالي الأطباق
  - العروض النشطة
  - الفعاليات القادمة
  - عدد صور المعرض
- ✅ روابط سريعة لجميع أقسام الإدارة
- ✅ زر تهيئة قاعدة البيانات (Seed Database)

---

## 🗄️ نماذج البيانات | Data Models

### 1. Categories
```typescript
{
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Subcategories
```typescript
{
  id: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Menu Items
```typescript
{
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  subcategoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Offers
```typescript
{
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  validUntil: Date;
  imageUrl?: string;
  badgeEn: string;
  badgeAr: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Events
```typescript
{
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  date: Date;
  time: string;
  price: number;
  imageUrl?: string;
  category: string;
  capacity: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Gallery Images
```typescript
{
  id: string;
  imageUrl: string;
  altEn: string;
  altAr: string;
  category: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Reservations
```typescript
{
  id: string;
  name: string;
  phone: string;
  email: string;
  date: Date;
  time: string;
  adults: number;
  children: number;
  seatingPreference: 'indoor-smoking' | 'indoor-non-smoking' | 'outdoor-smoking' | 'outdoor-non-smoking';
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}
```

### 8. Event Reservations
```typescript
{
  id: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  numberOfPeople: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}
```

### 9. Contact Messages
```typescript
{
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
```

### 10. Site Settings
```typescript
{
  id: string;
  heroBackgroundImage?: string;
  showEventsSection: boolean;
  showOffersSection: boolean;
  updatedAt: Date;
}
```

---

## 🔥 Firebase Configuration

### Firestore Collections
```
- categories/
- subcategories/
- menuItems/
- offers/
- events/
- galleryImages/
- reservations/
- eventReservations/
- contactMessages/
- siteSettings/
```

### Firebase Config
```typescript
{
  apiKey: "AIzaSyAsx47QMVyH3npgBmTCPBSvL6AyUT_qLfQ",
  authDomain: "kok-cafe.firebaseapp.com",
  projectId: "kok-cafe",
  storageBucket: "kok-cafe.firebasestorage.app",
  messagingSenderId: "827653851230",
  appId: "1:827653851230:web:0fd8f0e7135b6eaac00ccf",
  measurementId: "G-M1DGT4D4JJ"
}
```

---

## 🎨 التصميم | Design System

### الألوان | Colors
- **Primary**: Yellow/Gold (#EAB308) - للأزرار الرئيسية
- **Background**: Black/Dark - للخلفية
- **Text**: White/Gray - للنصوص
- **Accents**: Various (Blue, Green, Red, Purple) - للعناصر المختلفة

### الخطوط | Fonts
- **English**: Font-English (Custom)
- **Arabic**: Font-Arabic (Custom)
- Support for RTL and LTR

### المكونات | Components
جميع مكونات shadcn/ui متوفرة في `components/ui/`:
- Accordion, Alert Dialog, Avatar, Badge, Button
- Card, Checkbox, Collapsible, Command, Context Menu
- Dialog, Dropdown Menu, Form, Hover Card, Input
- Label, Menubar, Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select, Separator, Sheet
- Skeleton, Slider, Switch, Table, Tabs
- Textarea, Toast, Toggle, Tooltip, etc.

---

## 📜 Scripts

```bash
# Development
npm run dev          # تشغيل السيرفر المحلي على http://localhost:3000

# Build
npm run build        # بناء المشروع للإنتاج

# Production
npm run start        # تشغيل المشروع بعد البناء

# Linting
npm run lint         # فحص الكود
```

---

## 🚀 كيفية التشغيل | How to Run

1. **تثبيت Dependencies**
```bash
npm install
```

2. **تشغيل السيرفر المحلي**
```bash
npm run dev
```

3. **فتح المتصفح**
```
http://localhost:3000
```

4. **الدخول للوحة التحكم**
```
http://localhost:3000/admin/login
```

---

## 🔑 نقاط مهمة للـ AI | Important Notes for AI

### معلومات حيوية | Critical Information

1. **اللغة الافتراضية**: العربية (Arabic is default)
2. **الاتجاه**: RTL للعربي، LTR للإنجليزي
3. **Firebase**: قاعدة البيانات الرئيسية
4. **رفع الصور**: يستخدم ImgBB API (موجود في `lib/imgbb.ts`)
5. **المصادقة**: Firebase Auth للوحة التحكم

### ملفات مهمة | Important Files
- `contexts/LanguageContext.tsx` - جميع الترجمات موجودة هنا
- `lib/firestore.ts` - جميع عمليات قاعدة البيانات
- `lib/firebase.ts` - إعداد Firebase
- `app/page.tsx` - الصفحة الرئيسية
- `app/admin/page.tsx` - لوحة التحكم الرئيسية

### العمليات الشائعة | Common Operations

#### إضافة ترجمة جديدة
```typescript
// في contexts/LanguageContext.tsx
const translations = {
  en: {
    newKey: 'English Text'
  },
  ar: {
    newKey: 'النص العربي'
  }
};
```

#### إضافة صفحة جديدة في لوحة التحكم
```typescript
// إنشاء ملف في app/admin/new-page/page.tsx
'use client';
export default function NewPage() {
  // Your code
}
```

#### التعامل مع Firestore
```typescript
// استخدام الوظائف من lib/firestore.ts
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/firestore';
```

---

## 📝 ملاحظات إضافية | Additional Notes

1. **الأمان**: تأكد من تأمين معلومات Firebase في Production
2. **الأداء**: استخدام Next.js SSR يحسن الأداء
3. **SEO**: Metadata كامل موجود في `app/layout.tsx`
4. **الصور**: تُرفع على ImgBB ثم يُحفظ الرابط في Firestore
5. **الحجوزات**: تأتي مع شروط وأحكام يجب الموافقة عليها

---

## 🎯 الحالة الحالية | Current Status

✅ **المشروع جاهز للاستخدام** مع جميع الميزات الأساسية:
- ✅ الواجهة الأمامية كاملة
- ✅ لوحة التحكم كاملة
- ✅ دعم لغتين كامل
- ✅ Firebase Integration
- ✅ نظام الحجز
- ✅ إدارة المحتوى

---

## 📞 معلومات التواصل | Contact Information

**المطعم**: كوكيان - مطعم فاخر
**التخصص**: مأكولات شامية وبحرية
**الموقع**: إطلالة بحرية ساحرة

---

## 🔍 للمطورين والـ AI | For Developers & AI

عند العمل على هذا المشروع:
1. **اقرأ** `contexts/LanguageContext.tsx` أولاً لفهم نظام الترجمة
2. **استخدم** المكونات الموجودة في `components/ui/` بدلاً من إنشاء جديدة
3. **تابع** نفس أسلوب التسمية (camelCase للمتغيرات، PascalCase للمكونات)
4. **أضف** الترجمات للعربي والإنجليزي دائماً
5. **تأكد** من RTL Support للنصوص العربية

---

**تاريخ آخر تحديث**: 2024
**الإصدار**: 0.1.0
**Next.js Version**: 13.5.1
**React Version**: 18.2.0
