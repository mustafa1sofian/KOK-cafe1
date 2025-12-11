'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Type,
  Images
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkAdminAuth } from '@/lib/auth';

// Import Firestore and ImgBB functions
import {
  getSiteSettings,
  updateSiteSettings,
  type SiteSettings as FirestoreSiteSettings
} from '@/lib/firestore';

import {
  uploadImageToImgBB,
  validateImageFile
} from '@/lib/imgbb';

interface SiteSettings extends Omit<FirestoreSiteSettings, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreSiteSettings except id and updatedAt
}

const SiteSettingsPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form data
  const [formData, setFormData] = useState<SiteSettings>({
    heroBackgroundImage: '',
    aboutSectionImage: '',
    aboutTitleEn: '',
    aboutTitleAr: '',
    aboutContentEn: '',
    aboutContentAr: '',
    heroSliderImages: ['', '', ''],
    heroTitleEn: '',
    heroTitleAr: '',
    heroSubtitleEn: '',
    heroSubtitleAr: ''
  });

  // File upload states for slider
  const [sliderFiles, setSliderFiles] = useState<(File | null)[]>([null, null, null]);
  const [sliderPreviews, setSliderPreviews] = useState<string[]>(['', '', '']);
  const [aboutPreview, setAboutPreview] = useState<string>('');
  const [aboutFile, setAboutFile] = useState<File | null>(null);

  // Check authentication
  useEffect(() => {
    if (!checkAdminAuth()) {
      router.push('/admin/login');
    }
  }, [router]);

  // Load site settings from Firestore
  const loadSiteSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const settings = await getSiteSettings();
      if (settings) {
        setFormData({
          heroBackgroundImage: settings.heroBackgroundImage || '',
          aboutSectionImage: settings.aboutSectionImage || '',
          aboutTitleEn: settings.aboutTitleEn || '',
          aboutTitleAr: settings.aboutTitleAr || '',
          aboutContentEn: settings.aboutContentEn || '',
          aboutContentAr: settings.aboutContentAr || '',
          heroSliderImages: settings.heroSliderImages || ['', '', ''],
          heroTitleEn: settings.heroTitleEn || '',
          heroTitleAr: settings.heroTitleAr || '',
          heroSubtitleEn: settings.heroSubtitleEn || '',
          heroSubtitleAr: settings.heroSubtitleAr || ''
        });
        setSliderPreviews(settings.heroSliderImages || ['', '', '']);
        setAboutPreview(settings.aboutSectionImage || '');
      }
    } catch (err) {
      console.error('Error loading site settings:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل إعدادات الموقع' : 'Error loading site settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle about image upload
  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      setIsSubmitting(true);
      const imageUrl = await uploadImageToImgBB(file);

      setFormData({ ...formData, aboutSectionImage: imageUrl });
      setAboutPreview(imageUrl);
      setAboutFile(file);
    } catch (error) {
      console.error('Error uploading about image:', error);
      alert(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAboutImage = () => {
    setFormData({ ...formData, aboutSectionImage: '' });
    setAboutPreview('');
    setAboutFile(null);
  };

  useEffect(() => {
    loadSiteSettings();
  }, []);

  // Handle slider image upload
  const handleSliderImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      setIsSubmitting(true);
      const imageUrl = await uploadImageToImgBB(file);

      const newSliderImages = [...formData.heroSliderImages!];
      newSliderImages[index] = imageUrl;

      const newPreviews = [...sliderPreviews];
      newPreviews[index] = imageUrl;

      setFormData({ ...formData, heroSliderImages: newSliderImages });
      setSliderPreviews(newPreviews);

      const newFiles = [...sliderFiles];
      newFiles[index] = file;
      setSliderFiles(newFiles);
    } catch (error) {
      console.error('Error uploading slider image:', error);
      alert(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove slider image
  const removeSliderImage = (index: number) => {
    const newSliderImages = [...formData.heroSliderImages!];
    newSliderImages[index] = '';

    const newPreviews = [...sliderPreviews];
    newPreviews[index] = '';

    const newFiles = [...sliderFiles];
    newFiles[index] = null;

    setFormData({ ...formData, heroSliderImages: newSliderImages });
    setSliderPreviews(newPreviews);
    setSliderFiles(newFiles);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const settingsData = {
        heroBackgroundImage: formData.heroBackgroundImage,
        aboutSectionImage: formData.aboutSectionImage,
        aboutTitleEn: formData.aboutTitleEn,
        aboutTitleAr: formData.aboutTitleAr,
        aboutContentEn: formData.aboutContentEn,
        aboutContentAr: formData.aboutContentAr,
        heroSliderImages: formData.heroSliderImages,
        heroTitleEn: formData.heroTitleEn,
        heroTitleAr: formData.heroTitleAr,
        heroSubtitleEn: formData.heroSubtitleEn,
        heroSubtitleAr: formData.heroSubtitleAr
      };

      await updateSiteSettings(settingsData);

      setSubmitStatus('success');

      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving site settings:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل إعدادات الموقع...' : 'Loading site settings...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className={`text-red-600 mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {error}
          </p>
          <Button onClick={loadSiteSettings} variant="outline">
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Card className="mb-8 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/admin')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' ? 'إدارة صور وإعدادات الصفحة الرئيسية' : 'Manage homepage images and settings'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              {language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!'}
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              {language === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error occurred while saving settings'}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Hero Slider Images Section */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <Images className="w-6 h-6 text-blue-600" />
                {language === 'ar' ? 'سلايدر الصفحة الرئيسية (3 صور)' : 'Hero Slider (3 Images)'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {language === 'ar'
                  ? 'رفع 3 صور للسلايدر في أعلى الصفحة الرئيسية. سيتم التبديل بينها تلقائياً.'
                  : 'Upload 3 images for the homepage slider. They will auto-rotate.'}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-3">
                    <Label className="text-sm font-semibold">
                      {language === 'ar' ? `صورة ${index + 1}` : `Image ${index + 1}`}
                    </Label>

                    {sliderPreviews[index] ? (
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={sliderPreviews[index]}
                          alt={`Slider ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => removeSliderImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-[16/9] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSliderImageUpload(index, e)}
                          className="hidden"
                          id={`slider-${index}`}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`slider-${index}`} className="cursor-pointer flex flex-col items-center gap-2 p-4">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                          </span>
                        </Label>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {language === 'ar' ? 'الحد الأقصى: 32MB' : 'Max: 32MB'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hero Text Content Section */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <Type className="w-6 h-6 text-green-600" />
                {language === 'ar' ? 'نصوص الصفحة الرئيسية' : 'Hero Section Text'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {language === 'ar'
                  ? 'تعديل العنوان والعنوان الفرعي الذي يظهر في أعلى الصفحة الرئيسية'
                  : 'Edit the title and subtitle displayed on the homepage hero section'}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">English Title</Label>
                  <Input
                    value={formData.heroTitleEn || ''}
                    onChange={(e) => setFormData({ ...formData, heroTitleEn: e.target.value })}
                    placeholder="Welcome to Kokian"
                    className="font-english"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">العنوان بالعربية</Label>
                  <Input
                    value={formData.heroTitleAr || ''}
                    onChange={(e) => setFormData({ ...formData, heroTitleAr: e.target.value })}
                    placeholder="مرحباً بكم في كوكيان"
                    className="font-arabic text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">English Subtitle</Label>
                  <Textarea
                    value={formData.heroSubtitleEn || ''}
                    onChange={(e) => setFormData({ ...formData, heroSubtitleEn: e.target.value })}
                    placeholder="Experience luxury dining..."
                    className="font-english resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">العنوان الفرعي بالعربية</Label>
                  <Textarea
                    value={formData.heroSubtitleAr || ''}
                    onChange={(e) => setFormData({ ...formData, heroSubtitleAr: e.target.value })}
                    placeholder="استمتع بتجربة طعام فاخرة..."
                    className="font-arabic text-right resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsPage;