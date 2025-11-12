// Simple admin authentication without Firebase dependency

// Admin credentials (في بيئة الإنتاج، يجب تخزين هذه في متغيرات البيئة)
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

// حالة المصادقة
let isAdminAuthenticated = false;

// تسجيل دخول المسؤول
export const signInAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    // التحقق من بيانات الاعتماد المحلية
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // تخزين حالة المصادقة محليًا
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminAuthTime', Date.now().toString());
      }
      isAdminAuthenticated = true;
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error signing in admin:', error);
    return false;
  }
};

// تسجيل خروج المسؤول
export const signOutAdmin = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminAuthTime');
    }
    isAdminAuthenticated = false;
  } catch (error) {
    console.error('Error signing out admin:', error);
  }
};

// التحقق من صحة جلسة المسؤول
export const isValidAdminSession = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  const authTime = localStorage.getItem('adminAuthTime');
  
  if (!isLoggedIn || !authTime) {
    return false;
  }
  
  // التحقق من انتهاء صلاحية الجلسة (24 ساعة)
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 ساعة
  const isSessionValid = Date.now() - parseInt(authTime) < sessionDuration;
  
  if (!isSessionValid) {
    // إنهاء الجلسة المنتهية الصلاحية
    signOutAdmin();
    return false;
  }
  
  return isLoggedIn;
};

// التحقق من حالة المصادقة للمسؤول
export const checkAdminAuth = (): boolean => {
  return isValidAdminSession();
};