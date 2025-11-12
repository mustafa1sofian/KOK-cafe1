'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Save,
  Upload,
  Image,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkAdminAuth } from '@/lib/auth';

// Import Firestore functions
import {
  getSiteSettings,
  updateSiteSettings,
  uploadImage,
  deleteImage,
  type SiteSettings as FirestoreSiteSettings
} from '@/lib/firestore';

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
    aboutSectionImage: ''
  });
  
  // File upload states
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>('');
  const [aboutImagePreview, setAboutImagePreview] = useState<string>('');

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
          aboutSectionImage: settings.aboutSectionImage || ''
        });
        setHeroImagePreview(settings.heroBackgroundImage || '');
        setAboutImagePreview(settings.aboutSectionImage || '');
      }
    } catch (err) {
      console.error('Error loading site settings:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل إعدادات الموقع' : 'Error loading site settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadSiteSettings();
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      let heroBackgroundImage = formData.heroBackgroundImage;
      let aboutSectionImage = formData.aboutSectionImage;

      // Upload hero background image if a new file is selected
      if (heroImageFile) {
        const imagePath = `site-settings/hero-${Date.now()}-${heroImageFile.name}`;
        heroBackgroundImage = await uploadImage(heroImageFile, imagePath);
        
        // Delete old image if it exists
        if (formData.heroBackgroundImage) {
          try {
            await deleteImage(formData.heroBackgroundImage);
          } catch (error) {
            console.warn('Error deleting old hero image:', error);
          }
        }
      }

      // Upload about section image if a new file is selected
      if (aboutImageFile) {
        const imagePath = `site-settings/about-${Date.now()}-${aboutImageFile.name}`;
        aboutSectionImage = await uploadImage(aboutImageFile, imagePath);
        
        // Delete old image if it exists
        if (formData.aboutSectionImage) {
          try {
            await deleteImage(formData.aboutSectionImage);
          } catch (error) {
            console.warn('Error deleting old about image:', error);
          }
        }
      }

      const settingsData = {
        heroBackgroundImage,
        aboutSectionImage
      };

      await updateSiteSettings(settingsData);

      // Update form data with new URLs
      setFormData(settingsData);
      setHeroImagePreview(heroBackgroundImage);
      setAboutImagePreview(aboutSectionImage);
      
      // Clear file inputs
      setHeroImageFile(null);
      setAboutImageFile(null);

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

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeroImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAboutImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setAboutImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeHeroImage = () => {
    setHeroImageFile(null);
    setHeroImagePreview(formData.heroBackgroundImage);
  };

  const removeAboutImage = () => {
    setAboutImageFile(null);
    setAboutImagePreview(formData.aboutSectionImage);
  };

  const deleteHeroImage = async () => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف صورة الخلفية؟' : 'Are you sure you want to delete the background image?')) {
      setIsSubmitting(true);
      try {
        // Delete image from storage if it exists
        if (formData.heroBackgroundImage) {
          try {
            await deleteImage(formData.heroBackgroundImage);
          } catch (error) {
            console.warn('Error deleting hero image:', error);
          }
        }

        // Update settings to remove the image
        const settingsData = {
          heroBackgroundImage: '',
          aboutSectionImage: formData.aboutSectionImage
        };

        await updateSiteSettings(settingsData);

        // Update form data
        setFormData(settingsData);
        setHeroImagePreview('');
        setHeroImageFile(null);

        setSubmitStatus('success');
        
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('Error deleting hero image:', error);
        setSubmitStatus('error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const deleteAboutImage = async () => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف صورة قسم "عنا"؟' : 'Are you sure you want to delete the about section image?')) {
      setIsSubmitting(true);
      try {
        // Delete image from storage if it exists
        if (formData.aboutSectionImage) {
          try {
            await deleteImage(formData.aboutSectionImage);
          } catch (error) {
            console.warn('Error deleting about image:', error);
          }
        }

        // Update settings to remove the image
        const settingsData = {
          heroBackgroundImage: formData.heroBackgroundImage,
          aboutSectionImage: ''
        };

        await updateSiteSettings(settingsData);

        // Update form data
        setFormData(settingsData);
        setAboutImagePreview('');
        setAboutImageFile(null);

        setSubmitStatus('success');
        
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('Error deleting about image:', error);
        setSubmitStatus('error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
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
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
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
                {language === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إدارة صور الخلفية ومظهر الموقع' : 'Manage background images and site appearance'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            )}
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className={`mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
            isRTL ? 'flex-row-reverse' : ''
          }`}>
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className={`text-green-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
              {language === 'ar' 
                ? 'تم حفظ إعدادات الموقع بنجاح!' 
                : 'Site settings saved successfully!'
              }
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
            isRTL ? 'flex-row-reverse' : ''
          }`}>
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className={`text-red-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
              {language === 'ar' 
                ? 'حدث خطأ أثناء حفظ الإعدادات' 
                : 'Error occurred while saving settings'
              }
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Background Image */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <Image className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'صورة خلفية الصفحة الرئيسية' : 'Hero Background Image'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current/Preview Image */}
              {heroImagePreview && (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border">
                  <img
                    src={heroImagePreview}
                    alt="Hero Background Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Upload Section */}
              <div className="space-y-3">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'رفع صورة جديدة' : 'Upload New Image'}
                </Label>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                    id="hero-image-upload"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="hero-image-upload"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{language === 'ar' ? 'اختر صورة' : 'Choose Image'}</span>
                    </div>
                  </Label>
                  {heroImageFile && (
                    <Button
                      onClick={removeHeroImage}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {heroImagePreview && (
                    <Button
                      onClick={deleteHeroImage}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  )}
                </div>
                {heroImageFile && (
                  <p className={`text-sm text-green-600 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                    {language === 'ar' ? 'تم اختيار صورة جديدة' : 'New image selected'}: {heroImageFile.name}
                  </p>
                )}
              </div>
              
              <p className={`text-sm text-gray-500 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                {language === 'ar' 
                  ? 'الحد الأقصى لحجم الملف: 5 ميجابايت. الأبعاد المفضلة: 1920x1080 بكسل'
                  : 'Maximum file size: 5MB. Recommended dimensions: 1920x1080 pixels'
                }
              </p>
            </CardContent>
          </Card>

          {/* About Section Image */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <Image className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'صورة قسم "عنا"' : 'About Section Image'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current/Preview Image */}
              {aboutImagePreview && (
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border">
                  <img
                    src={aboutImagePreview}
                    alt="About Section Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Upload Section */}
              <div className="space-y-3">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'رفع صورة جديدة' : 'Upload New Image'}
                </Label>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAboutImageUpload}
                    className="hidden"
                    id="about-image-upload"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="about-image-upload"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{language === 'ar' ? 'اختر صورة' : 'Choose Image'}</span>
                    </div>
                  </Label>
                  {aboutImageFile && (
                    <Button
                      onClick={removeAboutImage}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {aboutImagePreview && (
                    <Button
                      onClick={deleteAboutImage}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  )}
                </div>
                {aboutImageFile && (
                  <p className={`text-sm text-green-600 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                    {language === 'ar' ? 'تم اختيار صورة جديدة' : 'New image selected'}: {aboutImageFile.name}
                  </p>
                )}
              </div>
              
              <p className={`text-sm text-gray-500 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                {language === 'ar' 
                  ? 'الحد الأقصى لحجم الملف: 5 ميجابايت. الأبعاد المفضلة: 800x600 بكسل'
                  : 'Maximum file size: 5MB. Recommended dimensions: 800x600 pixels'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className={`${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
              {language === 'ar' ? 'تعليمات الاستخدام' : 'Usage Instructions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-3 text-sm text-gray-600 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
              <p>
                <strong>{language === 'ar' ? 'صورة خلفية الصفحة الرئيسية:' : 'Hero Background Image:'}</strong>{' '}
                {language === 'ar' 
                  ? 'هذه الصورة تظهر في الخلفية في أعلى الصفحة الرئيسية خلف النص الترحيبي.'
                  : 'This image appears as the background at the top of the homepage behind the welcome text.'
                }
              </p>
              <p>
                <strong>{language === 'ar' ? 'صورة قسم "عنا":' : 'About Section Image:'}</strong>{' '}
                {language === 'ar' 
                  ? 'هذه الصورة تظهر في قسم "عنا" في الصفحة الرئيسية بجانب النص التعريفي.'
                  : 'This image appears in the About section on the homepage next to the descriptive text.'
                }
              </p>
              <p>
                <strong>{language === 'ar' ? 'نصائح:' : 'Tips:'}</strong>{' '}
                {language === 'ar' 
                  ? 'استخدم صور عالية الجودة وتأكد من أن الصور تتناسب مع هوية المطعم. يُفضل استخدام صور بصيغة JPG أو PNG.'
                  : 'Use high-quality images and ensure they match the restaurant\'s identity. JPG or PNG formats are preferred.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettingsPage;