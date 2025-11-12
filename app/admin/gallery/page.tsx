'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  type GalleryImage as FirestoreGalleryImage
} from '@/lib/firestore';

// Import ImgBB functions
import {
  uploadImageToImgBB,
  validateImageFile
} from '@/lib/imgbb';

interface GalleryImage extends FirestoreGalleryImage {
  // All properties inherited from FirestoreGalleryImage
}

const GalleryManagementPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'add' | 'edit'>('add');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Form data
  const [formData, setFormData] = useState({
    imageFile: null as File | null,
    imageUrl: '',
    altEn: '',
    altAr: '',
    category: ''
  });

  // Data state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load gallery images from Firestore
  const loadGalleryImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const imagesData = await getGalleryImages();
      setGalleryImages(imagesData);
    } catch (err) {
      console.error('Error loading gallery images:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل صور المعرض' : 'Error loading gallery images');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadGalleryImages();
  }, []);

  const openDialog = (action: 'add' | 'edit', image?: GalleryImage) => {
    setDialogAction(action);
    setSelectedImage(image || null);
    
    if (action === 'edit' && image) {
      setFormData({
        imageFile: null,
        imageUrl: image.imageUrl,
        altEn: image.altEn,
        altAr: image.altAr,
        category: image.category
      });
    } else {
      setFormData({
        imageFile: null,
        imageUrl: '',
        altEn: '',
        altAr: '',
        category: ''
      });
    }
    
    setIsDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.altEn.trim() || !formData.altAr.trim() || !formData.category.trim() || (!formData.imageFile && dialogAction === 'add')) {
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

      const imageData = {
        imageUrl,
        altEn: formData.altEn.trim(),
        altAr: formData.altAr.trim(),
        category: formData.category.trim(),
        order: dialogAction === 'add' ? galleryImages.length + 1 : selectedImage?.order || 1
      };

      if (dialogAction === 'add') {
        await addGalleryImage(imageData);
      } else if (selectedImage) {
        await updateGalleryImage(selectedImage.id, imageData);
      }

      setSubmitStatus('success');
      await loadGalleryImages(); // Reload data
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving image:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        setIsSubmitting(true);
        
        // Find the image to get its URL
        const image = galleryImages.find(img => img.id === imageId);
        
        // Delete the image record
        await deleteGalleryImage(imageId);

        // Note: ImgBB images cannot be deleted via API, they expire automatically

        await loadGalleryImages(); // Reload data
      } catch (error) {
        console.error('Error deleting image:', error);
        setError(language === 'ar' ? 'حدث خطأ في حذف الصورة' : 'Error deleting image');
      } finally {
        setIsSubmitting(false);
      }
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

  const categoryOptions = [
    { value: 'interior', labelEn: 'Interior', labelAr: 'داخلي' },
    { value: 'food', labelEn: 'Food', labelAr: 'طعام' },
    { value: 'exterior', labelEn: 'Exterior', labelAr: 'خارجي' },
    { value: 'events', labelEn: 'Events', labelAr: 'فعاليات' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل صور المعرض...' : 'Loading gallery images...'}
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
          <Button onClick={loadGalleryImages} variant="outline">
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
                {language === 'ar' ? 'إدارة معرض الصور' : 'Manage Gallery'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'رفع وتنظيم صور المعرض' : 'Upload and organize gallery images'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => openDialog('add')}
            className="bg-pink-600 hover:bg-pink-700 text-white"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إضافة صورة' : 'Add Image'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {galleryImages.length === 0 ? (
          <div className="text-center py-16">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد صور في المعرض حالياً' : 'No images in gallery'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryImages.map((image) => (
              <Card key={image.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 z-10">
                  <Button
                    onClick={() => openDialog('edit', image)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-blue-600 border-blue-600"
                    disabled={isSubmitting}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(image.id)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-red-600 border-red-600"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={image.imageUrl} 
                    alt={language === 'ar' ? image.altAr : image.altEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <CardContent className="p-4">
                  <h4 className={`font-semibold mb-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar' ? image.altAr : image.altEn}
                  </h4>
                  
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm text-gray-600 capitalize ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {image.category}
                    </span>
                    <span className={`text-xs text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      #{image.order}
                    </span>
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
                ? (language === 'ar' ? 'إضافة صورة جديدة' : 'Add New Image')
                : (language === 'ar' ? 'تعديل الصورة' : 'Edit Image')
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
                    ? 'تم حفظ الصورة بنجاح!' 
                    : 'Image saved successfully!'
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
                {language === 'ar' ? 'الصورة *' : 'Image *'}
              </Label>
              <p className={`text-xs text-gray-500 mb-2 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                {language === 'ar' 
                  ? 'الحد الأقصى: 32 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP'
                  : 'Max size: 32MB. Supported formats: JPG, PNG, GIF, WebP'
                }
              </p>
              <div className="space-y-3">
                {formData.imageUrl && (
                  <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg border">
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

            {/* Alt Text English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الصورة بالإنجليزية *' : 'Image Description (English) *'}
              </Label>
              <Input
                value={formData.altEn}
                onChange={(e) => setFormData({...formData, altEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter image description in English"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Alt Text Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الصورة بالعربية *' : 'Image Description (Arabic) *'}
              </Label>
              <Input
                value={formData.altAr}
                onChange={(e) => setFormData({...formData, altAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل وصف الصورة بالعربية"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'فئة الصورة *' : 'Image Category *'}
              </Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={`w-full p-2 border rounded-md ${isRTL ? 'text-right' : 'text-left'}`}
                required
                disabled={isSubmitting}
              >
                <option value="">
                  {language === 'ar' ? 'اختر الفئة' : 'Select Category'}
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {language === 'ar' ? option.labelAr : option.labelEn}
                  </option>
                ))}
              </select>
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

export default GalleryManagementPage;