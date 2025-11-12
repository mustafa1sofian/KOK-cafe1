'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Star,
  Utensils,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getMenuItems,
  updateMenuItem,
  uploadImage,
  deleteImage,
  type MenuItem as FirestoreMenuItem
} from '@/lib/firestore';

interface MenuItem extends FirestoreMenuItem {
  // All properties inherited from FirestoreMenuItem
}

const FeaturedDishesPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'edit'>('edit');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Form data
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
    imageFile: null as File | null,
    imageUrl: '',
    isAvailable: true,
    isFeatured: true
  });

  // Data state
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load featured dishes from Firestore
  const loadFeaturedDishes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get only featured menu items
      const menuItems = await getMenuItems(undefined, true); // isFeatured = true
      setFeaturedDishes(menuItems);
    } catch (err) {
      console.error('Error loading featured dishes:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل الأطباق المميزة' : 'Error loading featured dishes');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadFeaturedDishes();
  }, []);

  const openDialog = (action: 'edit', dish: MenuItem) => {
    setDialogAction(action);
    setSelectedDish(dish);
    
    setFormData({
      nameEn: dish.nameEn,
      nameAr: dish.nameAr,
      descriptionEn: dish.descriptionEn,
      descriptionAr: dish.descriptionAr,
      price: dish.price.toString(),
      imageFile: null,
      imageUrl: dish.imageUrl || '',
      isAvailable: dish.isAvailable,
      isFeatured: dish.isFeatured
    });
    
    setIsDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.nameEn.trim() || !formData.nameAr.trim() || !formData.price.trim()) {
      setSubmitStatus('error');
      return;
    }

    if (!selectedDish) return;

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (formData.imageFile) {
        const imagePath = `menu-items/${Date.now()}-${formData.imageFile.name}`;
        imageUrl = await uploadImage(formData.imageFile, imagePath);
        
        // Delete old image if it exists
        if (selectedDish.imageUrl) {
          try {
            await deleteImage(selectedDish.imageUrl);
          } catch (error) {
            console.warn('Error deleting old image:', error);
          }
        }
      }

      const updatedData = {
        nameEn: formData.nameEn.trim(),
        nameAr: formData.nameAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        price: parseFloat(formData.price),
        imageUrl,
        isAvailable: formData.isAvailable,
        isFeatured: true // Always keep as featured
      };

      await updateMenuItem(selectedDish.id, updatedData);

      setSubmitStatus('success');
      await loadFeaturedDishes(); // Reload data
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving dish:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFeatured = async (dish: MenuItem) => {
    if (confirm(language === 'ar' 
      ? 'هل تريد إزالة هذا الطبق من الأطباق المميزة؟' 
      : 'Do you want to remove this dish from featured dishes?'
    )) {
      try {
        setIsSubmitting(true);
        await updateMenuItem(dish.id, { isFeatured: false });
        await loadFeaturedDishes(); // Reload data
      } catch (error) {
        console.error('Error updating dish:', error);
        setError(language === 'ar' ? 'حدث خطأ في تحديث الطبق' : 'Error updating dish');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleAvailability = async (dish: MenuItem) => {
    try {
      setIsSubmitting(true);
      await updateMenuItem(dish.id, { isAvailable: !dish.isAvailable });
      await loadFeaturedDishes(); // Reload data
    } catch (error) {
      console.error('Error updating dish availability:', error);
      setError(language === 'ar' ? 'حدث خطأ في تحديث حالة الطبق' : 'Error updating dish availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل الأطباق المميزة...' : 'Loading featured dishes...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className={`text-red-600 mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {error}
          </p>
          <Button onClick={loadFeaturedDishes} variant="outline">
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إدارة الأطباق المميزة' : 'Manage Featured Dishes'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'تعديل الأطباق المميزة المعروضة في الصفحة الرئيسية' : 'Edit featured dishes displayed on the homepage'}
              </p>
            </div>
          </div>
          
          <div className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {featuredDishes.length} {language === 'ar' ? 'طبق مميز' : 'featured dishes'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {featuredDishes.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد أطباق مميزة حالياً' : 'No featured dishes available'}
            </p>
            <p className={`text-gray-500 text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' 
                ? 'يمكنك تحديد الأطباق كمميزة من صفحة إدارة القائمة الكاملة'
                : 'You can mark dishes as featured from the full menu management page'
              }
            </p>
            <Button
              onClick={() => router.push('/admin/menu')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {language === 'ar' ? 'إدارة القائمة الكاملة' : 'Manage Full Menu'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDishes.map((dish) => (
              <Card key={dish.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 z-10">
                  <Button
                    onClick={() => openDialog('edit', dish)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-blue-600 border-blue-600"
                    disabled={isSubmitting}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleToggleFeatured(dish)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-red-600 border-red-600"
                    disabled={isSubmitting}
                  >
                    <Star className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                  {dish.imageUrl ? (
                    <img 
                      src={dish.imageUrl} 
                      alt={language === 'ar' ? dish.nameAr : dish.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Utensils className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h4 className={`font-semibold ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                      {language === 'ar' ? dish.nameAr : dish.nameEn}
                    </h4>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      {!dish.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-1 rtl:ml-0 rtl:mr-1">
                          {language === 'ar' ? 'غير متاح' : 'Unavailable'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar' ? dish.descriptionAr : dish.descriptionEn}
                  </p>
                  
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-lg text-blue-600">
                      {dish.price} ر.س
                    </span>
                    <Button
                      onClick={() => handleToggleAvailability(dish)}
                      size="sm"
                      variant={dish.isAvailable ? "outline" : "default"}
                      className={dish.isAvailable 
                        ? "text-green-600 border-green-600 hover:bg-green-50" 
                        : "bg-red-600 hover:bg-red-700 text-white"
                      }
                      disabled={isSubmitting}
                    >
                      {dish.isAvailable 
                        ? (language === 'ar' ? 'متاح' : 'Available')
                        : (language === 'ar' ? 'غير متاح' : 'Unavailable')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'تعديل الطبق المميز' : 'Edit Featured Dish'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className={`p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
                isRTL ? 'flex-row-reverse' : ''
              }`}>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className={`text-green-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                  {language === 'ar' 
                    ? 'تم حفظ الطبق بنجاح!' 
                    : 'Dish saved successfully!'
                  }
                </p>
              </div>
            )}
            
            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className={`p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
                isRTL ? 'flex-row-reverse' : ''
              }`}>
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className={`text-red-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                  {language === 'ar' 
                    ? 'يرجى ملء جميع الحقول المطلوبة' 
                    : 'Please fill in all required fields'
                  }
                </p>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'صورة الطبق' : 'Dish Image'}
              </Label>
              <div className="space-y-3">
                {formData.imageUrl && (
                  <div className="aspect-[4/3] w-full max-w-sm mx-auto overflow-hidden rounded-lg border">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="image-upload"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{language === 'ar' ? 'رفع صورة جديدة' : 'Upload New Image'}</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {/* Name English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'اسم الطبق بالإنجليزية *' : 'Dish Name (English) *'}
              </Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter dish name in English"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Name Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'اسم الطبق بالعربية *' : 'Dish Name (Arabic) *'}
              </Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل اسم الطبق بالعربية"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الطبق بالإنجليزية' : 'Dish Description (English)'}
              </Label>
              <Textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter dish description in English"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الطبق بالعربية' : 'Dish Description (Arabic)'}
              </Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل وصف الطبق بالعربية"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'السعر (ريال سعودي) *' : 'Price (SAR) *'}
              </Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className={isRTL ? 'text-right' : 'text-left'}
                placeholder={language === 'ar' ? 'أدخل السعر بالريال' : 'Enter price in SAR'}
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Availability toggle */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'حالة التوفر' : 'Availability'}
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  className="rounded"
                  disabled={isSubmitting}
                />
                <Label htmlFor="isAvailable" className="text-sm">
                  {language === 'ar' ? 'الطبق متاح للطلب' : 'Dish is available for order'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button 
                onClick={handleSave} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
              <Button 
                onClick={() => setIsDialogOpen(false)} 
                variant="outline" 
                className="flex-1"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedDishesPage;