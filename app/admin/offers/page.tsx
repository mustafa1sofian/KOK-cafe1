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
  Gift,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  getSiteSettings,
  updateSiteSettings,
  type Offer as FirestoreOffer
} from '@/lib/firestore';

// Import ImgBB functions
import {
  uploadImageToImgBB,
  validateImageFile
} from '@/lib/imgbb';

interface Offer extends FirestoreOffer {
  // All properties inherited from FirestoreOffer
}

const OffersManagementPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'add' | 'edit'>('add');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Form data
  const [formData, setFormData] = useState({
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
    validUntil: '',
    imageFile: null as File | null,
    imageUrl: '',
    badgeEn: '',
    badgeAr: '',
    isActive: true
  });

  // Data state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showInactiveOffers, setShowInactiveOffers] = useState(false);
  const [showOffersSection, setShowOffersSection] = useState(true);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load offers from Firestore
  const loadOffers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const offersData = await getOffers();
      setOffers(offersData);
      
      // Load site settings to get offers section visibility
      const siteSettings = await getSiteSettings();
      setShowOffersSection(siteSettings?.showOffersSection ?? true);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل العروض' : 'Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadOffers();
  }, []);

  const openDialog = (action: 'add' | 'edit', offer?: Offer) => {
    setDialogAction(action);
    setSelectedOffer(offer || null);
    
    if (action === 'edit' && offer) {
      setFormData({
        titleEn: offer.titleEn,
        titleAr: offer.titleAr,
        descriptionEn: offer.descriptionEn,
        descriptionAr: offer.descriptionAr,
        price: offer.price.toString(),
        validUntil: offer.validUntil.toISOString().split('T')[0],
        imageFile: null,
        imageUrl: offer.imageUrl || '',
        badgeEn: offer.badgeEn,
        badgeAr: offer.badgeAr,
        isActive: offer.isActive
      });
    } else {
      setFormData({
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        price: '',
        validUntil: '',
        imageFile: null,
        imageUrl: '',
        badgeEn: '',
        badgeAr: '',
        isActive: true
      });
    }
    
    setIsDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.titleEn.trim() || !formData.titleAr.trim() || !formData.price.trim() || !formData.validUntil) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (formData.imageFile) {
        // Validate image file
        const validation = validateImageFile(formData.imageFile);
        if (!validation.isValid) {
          setError(validation.error || 'ملف غير صالح');
          setSubmitStatus('error');
          return;
        }
        
        // Upload to ImgBB
        imageUrl = await uploadImageToImgBB(formData.imageFile);
      }

      const offerData = {
        titleEn: formData.titleEn.trim(),
        titleAr: formData.titleAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        price: parseFloat(formData.price),
        validUntil: new Date(formData.validUntil),
        imageUrl,
        badgeEn: formData.badgeEn.trim(),
        badgeAr: formData.badgeAr.trim(),
        isActive: formData.isActive,
        order: dialogAction === 'add' ? offers.length + 1 : selectedOffer?.order || 1
      };

      if (dialogAction === 'add') {
        await addOffer(offerData);
      } else if (selectedOffer) {
        await updateOffer(selectedOffer.id, offerData);
      }

      setSubmitStatus('success');
      await loadOffers(); // Reload data
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving offer:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        setIsSubmitting(true);
        
        // Delete the offer
        await deleteOffer(offerId);

        // Note: ImgBB images cannot be deleted via API, they expire automatically

        await loadOffers(); // Reload data
      } catch (error) {
        console.error('Error deleting offer:', error);
        setError(language === 'ar' ? 'حدث خطأ في حذف العرض' : 'Error deleting offer');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      setIsSubmitting(true);
      await updateOffer(offer.id, { isActive: !offer.isActive });
      await loadOffers(); // Reload data
    } catch (error) {
      console.error('Error updating offer status:', error);
      setError(language === 'ar' ? 'حدث خطأ في تحديث حالة العرض' : 'Error updating offer status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOffersSection = async () => {
    try {
      setIsSubmitting(true);
      const newVisibility = !showOffersSection;
      
      // Update site settings
      const currentSettings = await getSiteSettings();
      await updateSiteSettings({
        heroBackgroundImage: currentSettings?.heroBackgroundImage || '',
        aboutSectionImage: currentSettings?.aboutSectionImage || '',
        showEventsSection: currentSettings?.showEventsSection ?? true,
        showOffersSection: newVisibility
      });
      
      setShowOffersSection(newVisibility);
    } catch (error) {
      console.error('Error updating offers section visibility:', error);
      setError(language === 'ar' ? 'حدث خطأ في تحديث إعدادات القسم' : 'Error updating section settings');
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل العروض...' : 'Loading offers...'}
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
          <Button onClick={loadOffers} variant="outline">
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
                {language === 'ar' ? 'إدارة العروض' : 'Manage Offers'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إضافة وتعديل العروض الخاصة' : 'Add and edit special offers'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => openDialog('add')}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إضافة عرض' : 'Add Offer'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Filter Controls */}
        <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleToggleOffersSection}
              variant={showOffersSection ? "default" : "outline"}
              className={showOffersSection 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "text-red-600 border-red-600 hover:bg-red-50"
              }
              disabled={isSubmitting}
            >
              {showOffersSection 
                ? (language === 'ar' ? 'إخفاء قسم العروض' : 'Hide Offers Section')
                : (language === 'ar' ? 'إظهار قسم العروض' : 'Show Offers Section')
              }
            </Button>
            <Button
              onClick={() => setShowInactiveOffers(!showInactiveOffers)}
              variant={showInactiveOffers ? "default" : "outline"}
              className={showInactiveOffers 
                ? "bg-gray-600 hover:bg-gray-700 text-white" 
                : "text-gray-600 border-gray-600 hover:bg-gray-50"
              }
              disabled={isSubmitting}
            >
              {showInactiveOffers 
                ? (language === 'ar' ? 'إخفاء العروض المخفية' : 'Hide Inactive Offers')
                : (language === 'ar' ? 'إظهار العروض المخفية' : 'Show Inactive Offers')
              }
            </Button>
            <span className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {offers.filter(offer => showInactiveOffers || offer.isActive).length} {language === 'ar' ? 'عرض' : 'offers'}
            </span>
          </div>
          
          {/* Section Status Indicator */}
          <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-3 h-3 rounded-full ${showOffersSection ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm ${showOffersSection ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {showOffersSection 
                ? (language === 'ar' ? 'القسم ظاهر في الصفحة الرئيسية' : 'Section visible on homepage')
                : (language === 'ar' ? 'القسم مخفي من الصفحة الرئيسية' : 'Section hidden from homepage')
              }
            </span>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد عروض حالياً' : 'No offers available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.filter(offer => showInactiveOffers || offer.isActive).map((offer) => (
              <Card key={offer.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 z-10">
                  <Button
                    onClick={() => openDialog('edit', offer)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-blue-600 border-blue-600"
                    disabled={isSubmitting}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(offer.id)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-red-600 border-red-600"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden relative">
                  {offer.imageUrl ? (
                    <img 
                      src={offer.imageUrl} 
                      alt={language === 'ar' ? offer.titleAr : offer.titleEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Gift className="w-12 h-12 text-gray-400" />
                  )}
                  
                  {/* Badge */}
                  {(offer.badgeEn || offer.badgeAr) && (
                    <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                      <span className="bg-yellow-600 text-black px-2 py-1 rounded-full text-xs font-semibold">
                        {language === 'ar' ? offer.badgeAr : offer.badgeEn}
                      </span>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h4 className={`font-semibold ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                      {language === 'ar' ? offer.titleAr : offer.titleEn}
                    </h4>
                    {!offer.isActive && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {language === 'ar' ? 'غير نشط' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar' ? offer.descriptionAr : offer.descriptionEn}
                  </p>
                  
                  <div className={`flex items-center text-sm text-gray-500 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                    <span>
                      {language === 'ar' ? 'حتى' : 'Until'} {' '}
                      {offer.validUntil.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-lg text-green-600">
                      {offer.price} ر.س
                    </span>
                    <Button
                      onClick={() => handleToggleActive(offer)}
                      size="sm"
                      variant={offer.isActive ? "outline" : "default"}
                      className={offer.isActive 
                        ? "text-green-600 border-green-600 hover:bg-green-50" 
                        : "bg-red-600 hover:bg-red-700 text-white"
                      }
                      disabled={isSubmitting}
                    >
                      {offer.isActive 
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : (language === 'ar' ? 'غير نشط' : 'Inactive')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {dialogAction === 'add' 
                ? (language === 'ar' ? 'إضافة عرض جديد' : 'Add New Offer')
                : (language === 'ar' ? 'تعديل العرض' : 'Edit Offer')
              }
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
                    ? 'تم حفظ العرض بنجاح!' 
                    : 'Offer saved successfully!'
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
                {language === 'ar' ? 'صورة العرض' : 'Offer Image'}
              </Label>
              <p className={`text-xs text-gray-500 mb-2 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                {language === 'ar' 
                  ? 'الحد الأقصى: 32 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP'
                  : 'Max size: 32MB. Supported formats: JPG, PNG, GIF, WebP'
                }
              </p>
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
                      <span>{language === 'ar' ? 'رفع صورة إلى ImgBB' : 'Upload Image to ImgBB'}</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {/* Title English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'عنوان العرض بالإنجليزية *' : 'Offer Title (English) *'}
              </Label>
              <Input
                value={formData.titleEn}
                onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter offer title in English"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Title Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'عنوان العرض بالعربية *' : 'Offer Title (Arabic) *'}
              </Label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData({...formData, titleAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل عنوان العرض بالعربية"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف العرض بالإنجليزية' : 'Offer Description (English)'}
              </Label>
              <Textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter offer description in English"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف العرض بالعربية' : 'Offer Description (Arabic)'}
              </Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل وصف العرض بالعربية"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Price and Valid Until */}
            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'صالح حتى *' : 'Valid Until *'}
                </Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  min={today}
                  className={isRTL ? 'text-right' : 'text-left'}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Badge English and Arabic */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الشارة بالإنجليزية' : 'Badge (English)'}
                </Label>
                <Input
                  value={formData.badgeEn}
                  onChange={(e) => setFormData({...formData, badgeEn: e.target.value})}
                  className="text-left font-english"
                  placeholder="New, Popular, Limited..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الشارة بالعربية' : 'Badge (Arabic)'}
                </Label>
                <Input
                  value={formData.badgeAr}
                  onChange={(e) => setFormData({...formData, badgeAr: e.target.value})}
                  className="text-right font-arabic"
                  placeholder="جديد، مميز، محدود..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'حالة العرض' : 'Offer Status'}
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded"
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {language === 'ar' ? 'العرض نشط ومتاح' : 'Offer is active and available'}
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

export default OffersManagementPage;