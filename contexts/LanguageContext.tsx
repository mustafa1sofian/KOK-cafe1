'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About Us',
    menu: 'Menu',
    offers: 'Offers',
    events: 'Events',
    reservation: 'Reservation',
    gallery: 'Gallery',
    contact: 'Contact Us',

    // Hero Section
    heroTitle: 'Koukian – Where Luxury Meets Taste',
    heroSubtitle: 'Savor the finest Levantine and seafood dishes in an elegant ambiance with a stunning sea view',
    bookNow: 'Book Now',

    // About Section
    aboutTitle: 'About Koukian',
    fullMenu: 'Full Menu',
    aboutContent: 'At Koukian, we bring together the rich flavors of Levantine cuisine with the freshest seafood, all while enjoying breathtaking sea views. Our master chefs blend traditional Middle Eastern recipes with contemporary culinary techniques, creating an unforgettable dining experience where every dish tells a story of heritage and innovation.',

    // Menu Section
    menuTitle: 'Our Signature Dishes',
    viewFullMenu: 'View Full Menu',

    // Offers Section
    offersTitle: 'Special Offers & Events',

    // Events Section
    events: 'Events',

    // Reservation Form
    reservationTitle: 'Make a Reservation',
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    date: 'Date',
    time: 'Time',
    guests: 'Number of Guests',
    adults: 'Adults',
    children: 'Children',
    seatingPreference: 'Seating Preference',
    indoorSmoking: 'Indoor (Smoking Allowed)',
    indoorNonSmoking: 'Indoor (Non-Smoking)',
    outdoorSmoking: 'Outdoor (Smoking Allowed)',
    outdoorNonSmoking: 'Outdoor (Non-Smoking)',
    submitReservation: 'Reserve Table',

    // Gallery
    galleryTitle: 'Gallery',

    // Contact
    contactTitle: 'Contact & Location',
    phoneLabel: 'Phone',
    whatsapp: 'WhatsApp',
    emailLabel: 'Email',

    // Footer
    quickLinks: 'Quick Links',
    followUs: 'Follow Us',
    copyright: '© 2026 Koukian Restaurant. All rights reserved.',

    // Menu Page
    ourMenu: 'Our Menu',
    menuDescription: 'Discover our exquisite collection of Levantine and seafood specialties with stunning sea views',

    // Admin Dashboard
    adminDashboardTitle: 'Admin Dashboard',
    manageContent: 'Manage Koukian Restaurant Content',
    logout: 'Logout',
    seedDatabase: 'Seed Database',
    seeding: 'Seeding...',
    totalDishes: 'Total Dishes',
    activeOffers: 'Active Offers',
    upcomingEvents: 'Upcoming Events',
    galleryImages: 'Gallery Images',
    manage: 'Manage',
    view: 'View',

    showAdmin: 'Show Admin',
    hideAdmin: 'Hide Admin',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    deleteCategory: 'Delete Category',
    addSubcategory: 'Add Subcategory',
    editSubcategory: 'Edit Subcategory',
    deleteSubcategory: 'Delete Subcategory',
    addItem: 'Add Item',
    editItem: 'Edit Item',
    deleteItem: 'Delete Item',
    nameEnglish: 'Name (English)',
    nameArabic: 'Name (Arabic)',
    descriptionEnglish: 'Description (English)',
    descriptionArabic: 'Description (Arabic)',
    price: 'Price',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete?',

    // Terms and Conditions
    termsAndConditions: 'Terms and Conditions',
    agreeToTerms: 'I agree to the Terms and Conditions',
    acceptTerms: 'Accept Terms and Conditions',
    termsError: 'You must agree to the Terms and Conditions to proceed',
    termsContent: `
      <div class="space-y-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Reservation Terms and Conditions</h3>
        
        <div class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 class="font-semibold text-blue-800 mb-2">1. Reservation Policy</h4>
            <ul class="text-blue-700 text-sm space-y-1">
              <li>• All reservations are subject to availability and confirmation</li>
              <li>• Reservations must be made at least 2 hours in advance</li>
              <li>• We hold tables for 15 minutes past the reservation time</li>
            </ul>
          </div>
          
          <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <h4 class="font-semibold text-red-800 mb-2">2. Cancellation Policy</h4>
            <ul class="text-red-700 text-sm space-y-1">
              <li>• Cancellations must be made at least 2 hours before the reservation time</li>
              <li>• No-shows may be charged a cancellation fee</li>
              <li>• Group reservations (8+ people) require 24-hour notice for cancellation</li>
            </ul>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 class="font-semibold text-green-800 mb-2">3. Payment and Pricing</h4>
            <ul class="text-green-700 text-sm space-y-1">
              <li>• Prices are subject to change without notice</li>
              <li>• Service charge and taxes may apply</li>
              <li>• Payment is due at the time of service</li>
            </ul>
          </div>
          
          <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 class="font-semibold text-purple-800 mb-2">4. Restaurant Policies</h4>
            <ul class="text-purple-700 text-sm space-y-1">
              <li>• Smart casual dress code is required</li>
              <li>• Children must be supervised at all times</li>
              <li>• Outside food and beverages are not permitted</li>
              <li>• Smoking is only allowed in designated areas</li>
            </ul>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h4 class="font-semibold text-yellow-800 mb-2">5. Special Dietary Requirements</h4>
            <ul class="text-yellow-700 text-sm space-y-1">
              <li>• Please inform us of any allergies or dietary restrictions</li>
              <li>• We cannot guarantee complete allergen-free preparation</li>
            </ul>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
            <h4 class="font-semibold text-gray-800 mb-2">6. Liability & Privacy</h4>
            <ul class="text-gray-700 text-sm space-y-1">
              <li>• The restaurant is not liable for personal belongings</li>
              <li>• Guests are responsible for their own safety and conduct</li>
              <li>• Your personal information will be used only for reservation purposes</li>
              <li>• We do not share your information with third parties</li>
            </ul>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-300">
          <p class="text-gray-800 font-medium text-center">
            <strong>By making a reservation, you agree to these terms and conditions.</strong>
          </p>
        </div>
      </div>
    `,
  },
  ar: {
    // Navigation
    home: 'الرئيسية',
    about: 'من نحن',
    menu: 'القائمة',
    offers: 'العروض',
    events: 'الفعاليات',
    reservation: 'الحجز',
    gallery: 'المعرض',
    contact: 'اتصل بنا',

    // Hero Section
    heroTitle: 'كوكيان – حيث تلتقي الفخامة بالمذاق',
    heroSubtitle: 'استمتع بألذ المأكولات الشامية والبحرية في أجواء راقية وإطلالة ساحرة على البحر',
    bookNow: 'احجز الآن',

    // About Section
    aboutTitle: 'عن كوكيان',
    fullMenu: 'القائمة الكاملة',
    aboutContent: 'في كوكيان، نجمع بين النكهات الغنية للمطبخ الشامي مع أطيب الأسماك والمأكولات البحرية الطازجة، كل ذلك مع الاستمتاع بإطلالات بحرية خلابة. يمزج طهاتنا المتمرسون الوصفات الشرق أوسطية التراثية مع تقنيات الطهي المعاصرة، مما يخلق تجربة طعام لا تُنسى حيث كل طبق يحكي قصة من التراث والإبداع.',

    // Menu Section
    menuTitle: 'أطباقنا المميزة',
    viewFullMenu: 'عرض القائمة كاملة',

    // Offers Section
    offersTitle: 'العروض الخاصة والفعاليات',

    // Events Section
    events: 'الفعاليات',

    // Reservation Form
    reservationTitle: 'احجز طاولتك',
    name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    date: 'التاريخ',
    time: 'الوقت',
    guests: 'عدد الضيوف',
    adults: 'البالغين',
    children: 'الأطفال',
    seatingPreference: 'تفضيل مكان الجلوس',
    indoorSmoking: 'داخلي (مسموح التدخين)',
    indoorNonSmoking: 'داخلي (غير مسموح التدخين)',
    outdoorSmoking: 'خارجي (مسموح التدخين)',
    outdoorNonSmoking: 'خارجي (غير مسموح التدخين)',
    submitReservation: 'احجز الطاولة',

    // Gallery
    galleryTitle: 'المعرض',

    // Contact
    contactTitle: 'التواصل والموقع',
    phoneLabel: 'الهاتف',
    whatsapp: 'واتساب',
    emailLabel: 'البريد الإلكتروني',

    // Footer
    quickLinks: 'روابط سريعة',
    followUs: 'تابعنا',
    copyright: '© ٢٠٢٦ مطعم كوكيان. جميع الحقوق محفوظة.',

    // Menu Page
    ourMenu: 'قائمة الطعام',
    menuDescription: 'اكتشف مجموعتنا الرائعة من المأكولات الشامية والبحرية المميزة مع إطلالات بحرية ساحرة',

    // Admin Dashboard
    adminDashboardTitle: 'لوحة التحكم',
    manageContent: 'إدارة محتوى مطعم كوكيان',
    logout: 'تسجيل الخروج',
    seedDatabase: 'تهيئة قاعدة البيانات',
    seeding: 'جاري التهيئة...',
    totalDishes: 'إجمالي الأطباق',
    activeOffers: 'العروض النشطة',
    upcomingEvents: 'الفعاليات القادمة',
    galleryImages: 'صور المعرض',
    manage: 'إدارة',
    view: 'عرض',

    showAdmin: 'إظهار الإدارة',
    hideAdmin: 'إخفاء الإدارة',
    addCategory: 'إضافة فئة',
    editCategory: 'تعديل الفئة',
    deleteCategory: 'حذف الفئة',
    addSubcategory: 'إضافة فئة فرعية',
    editSubcategory: 'تعديل الفئة الفرعية',
    deleteSubcategory: 'حذف الفئة الفرعية',
    addItem: 'إضافة عنصر',
    editItem: 'تعديل العنصر',
    deleteItem: 'حذف العنصر',
    nameEnglish: 'الاسم بالإنجليزية',
    nameArabic: 'الاسم بالعربية',
    descriptionEnglish: 'الوصف بالإنجليزية',
    descriptionArabic: 'الوصف بالعربية',
    price: 'السعر',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirmDelete: 'هل أنت متأكد من الحذف؟',

    // Terms and Conditions
    termsAndConditions: 'الشروط والأحكام',
    agreeToTerms: 'أوافق على الشروط والأحكام',
    acceptTerms: 'الموافقة',
    termsError: 'يجب الموافقة على الشروط والأحكام للمتابعة',
    termsContent: `
      <div class="space-y-6">
        <div class="text-center bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-300">
          <h3 class="text-xl font-bold text-gray-800 mb-2">شروط وأحكام الحجز</h3>
          <p class="text-gray-700 text-sm">أقر وأوافق على جميع الشروط والأحكام الخاصة بالحجز، وتشمل ما يلي:</p>
        </div>
        
        <div class="space-y-4">
          <div class="bg-blue-50 p-5 rounded-xl border-r-4 border-blue-500">
            <h4 class="font-bold text-blue-800 mb-3 flex items-center">
              <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-2">1</span>
              الالتزام بالزي
            </h4>
            <div class="text-blue-700 text-sm space-y-2 mr-8">
              <p class="font-medium">الدخول مشروط بالالتزام بالزي اللائق.</p>
              <div class="bg-blue-100 p-3 rounded-lg">
                <p class="font-medium text-blue-800 mb-2">يمنع ارتداء:</p>
                <ul class="space-y-1">
                  <li>• الشباشب أو النعال</li>
                  <li>• الشورت الرياضي أو ملابس السباحة</li>
                  <li>• القمصان بدون أكمام</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-5 rounded-xl border-r-4 border-green-500">
            <h4 class="font-bold text-green-800 mb-3 flex items-center">
              <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-2">2</span>
              شروط الحضور
            </h4>
            <ul class="text-green-700 text-sm space-y-2 mr-8">
              <li>• الالتزام بالحضور في الوقت المحدد للحجز</li>
              <li>• يتم الاحتفاظ بالطاولة لمدة (15 دقيقة) فقط بعد الموعد المحدد</li>
            </ul>
          </div>
          
          <div class="bg-red-50 p-5 rounded-xl border-r-4 border-red-500">
            <h4 class="font-bold text-red-800 mb-3 flex items-center">
              <span class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-2">3</span>
              سياسة الإلغاء والاسترجاع
            </h4>
            <ul class="text-red-700 text-sm space-y-2 mr-8">
              <li>• يمكن إلغاء الحجز واسترداد المبلغ كاملًا إذا تم الإلغاء قبل ساعتين على الأقل من موعد الحجز</li>
              <li>• في حال التأخير عن الموعد أو الإلغاء المتأخر، يحق للمطعم الاحتفاظ بكامل المبلغ المدفوع</li>
            </ul>
          </div>
          
          <div class="bg-purple-50 p-5 rounded-xl border-r-4 border-purple-500">
            <h4 class="font-bold text-purple-800 mb-3 flex items-center">
              <span class="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-2">4</span>
              عدد الأشخاص
            </h4>
            <ul class="text-purple-700 text-sm space-y-2 mr-8">
              <li>• الالتزام بعدد الأشخاص المذكور في الحجز</li>
              <li>• أي تعديل في العدد يجب إبلاغ المطعم مسبقًا</li>
            </ul>
          </div>
          
          <div class="bg-orange-50 p-5 rounded-xl border-r-4 border-orange-500">
            <h4 class="font-bold text-orange-800 mb-3 flex items-center">
              <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-2">5</span>
              الأجواء العامة
            </h4>
            <ul class="text-orange-700 text-sm space-y-2 mr-8">
              <li>• الحفاظ على الهدوء وعدم إزعاج الضيوف الآخرين</li>
              <li>• يمنع إدخال أطعمة أو مشروبات من خارج المطعم</li>
              <li>• التدخين مسموح فقط في الأماكن المخصصة لذلك</li>
            </ul>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-400 shadow-lg">
          <div class="text-center">
            <div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span class="text-white font-bold text-lg">✓</span>
            </div>
            <p class="text-gray-800 font-bold text-lg mb-2">إقرار الموافقة</p>
            <p class="text-gray-700 font-medium">
              بإتمام الحجز فأنا أوافق على الالتزام بكافة الشروط المذكورة أعلاه.
            </p>
          </div>
        </div>
      </div>
    `,
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.body.className = language === 'ar' ? 'font-arabic' : 'font-english';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      isRTL: language === 'ar'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};