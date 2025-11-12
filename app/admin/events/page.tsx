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
  Calendar,
  Clock,
  Users,
  Music,
  Utensils,
  Star,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  uploadImage,
  deleteImage,
  getSiteSettings,
  updateSiteSettings,
  type Event as FirestoreEvent
} from '@/lib/firestore';

interface Event extends FirestoreEvent {
  // All properties inherited from FirestoreEvent
}

const EventsManagementPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'add' | 'edit'>('add');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Form data
  const [formData, setFormData] = useState({
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    date: '',
    time: '',
    price: '',
    imageFile: null as File | null,
    imageUrl: '',
    category: '',
    capacity: '',
    isActive: true
  });

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [showInactiveEvents, setShowInactiveEvents] = useState(false);
  const [showEventsSection, setShowEventsSection] = useState(true);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load events from Firestore
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const eventsData = await getEvents();
      setEvents(eventsData);
      
      // Load site settings to get events section visibility
      const siteSettings = await getSiteSettings();
      setShowEventsSection(siteSettings?.showEventsSection ?? true);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل الفعاليات' : 'Error loading events');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const openDialog = (action: 'add' | 'edit', event?: Event) => {
    setDialogAction(action);
    setSelectedEvent(event || null);
    
    if (action === 'edit' && event) {
      setFormData({
        titleEn: event.titleEn,
        titleAr: event.titleAr,
        descriptionEn: event.descriptionEn,
        descriptionAr: event.descriptionAr,
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        price: event.price.toString(),
        imageFile: null,
        imageUrl: event.imageUrl || '',
        category: event.category,
        capacity: event.capacity.toString(),
        isActive: event.isActive
      });
    } else {
      setFormData({
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        date: '',
        time: '',
        price: '',
        imageFile: null,
        imageUrl: '',
        category: '',
        capacity: '',
        isActive: true
      });
    }
    
    setIsDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.titleEn.trim() || !formData.titleAr.trim() || !formData.date || !formData.time || !formData.price.trim() || !formData.category || !formData.capacity.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (formData.imageFile) {
        const imagePath = `events/${Date.now()}-${formData.imageFile.name}`;
        imageUrl = await uploadImage(formData.imageFile, imagePath);
        
        // Delete old image if editing and old image exists
        if (dialogAction === 'edit' && selectedEvent?.imageUrl) {
          try {
            await deleteImage(selectedEvent.imageUrl);
          } catch (error) {
            console.warn('Error deleting old image:', error);
          }
        }
      }

      const eventData = {
        titleEn: formData.titleEn.trim(),
        titleAr: formData.titleAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        date: new Date(formData.date),
        time: formData.time,
        price: parseFloat(formData.price),
        imageUrl,
        category: formData.category,
        capacity: parseInt(formData.capacity),
        isActive: formData.isActive,
        order: dialogAction === 'add' ? events.length + 1 : selectedEvent?.order || 1
      };

      if (dialogAction === 'add') {
        await addEvent(eventData);
      } else if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
      }

      setSubmitStatus('success');
      await loadEvents(); // Reload data
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving event:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        setIsSubmitting(true);
        
        // Find the event to get its image URL
        const event = events.find(e => e.id === eventId);
        
        // Delete the event
        await deleteEvent(eventId);

        // Delete the image if it exists
        if (event?.imageUrl) {
          try {
            await deleteImage(event.imageUrl);
          } catch (error) {
            console.warn('Error deleting image:', error);
          }
        }

        await loadEvents(); // Reload data
      } catch (error) {
        console.error('Error deleting event:', error);
        setError(language === 'ar' ? 'حدث خطأ في حذف الفعالية' : 'Error deleting event');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleActive = async (event: Event) => {
    try {
      setIsSubmitting(true);
      await updateEvent(event.id, { isActive: !event.isActive });
      await loadEvents(); // Reload data
    } catch (error) {
      console.error('Error updating event status:', error);
      setError(language === 'ar' ? 'حدث خطأ في تحديث حالة الفعالية' : 'Error updating event status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEventsSection = async () => {
    try {
      setIsSubmitting(true);
      const newVisibility = !showEventsSection;
      
      // Update site settings
      const currentSettings = await getSiteSettings();
      await updateSiteSettings({
        heroBackgroundImage: currentSettings?.heroBackgroundImage || '',
        aboutSectionImage: currentSettings?.aboutSectionImage || '',
        showEventsSection: newVisibility
      });
      
      setShowEventsSection(newVisibility);
    } catch (error) {
      console.error('Error updating events section visibility:', error);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music':
        return Music;
      case 'tasting':
        return Star;
      case 'dining':
        return Utensils;
      case 'celebration':
        return Calendar;
      default:
        return Calendar;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const categoryOptions = [
    { value: 'music', labelEn: 'Music', labelAr: 'موسيقى' },
    { value: 'tasting', labelEn: 'Tasting', labelAr: 'تذوق' },
    { value: 'dining', labelEn: 'Dining', labelAr: 'طعام' },
    { value: 'celebration', labelEn: 'Celebration', labelAr: 'احتفال' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل الفعاليات...' : 'Loading events...'}
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
          <Button onClick={loadEvents} variant="outline">
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
                {language === 'ar' ? 'إدارة الفعاليات' : 'Manage Events'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إضافة وتعديل فعاليات المطعم' : 'Add and edit restaurant events'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => openDialog('add')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إضافة فعالية' : 'Add Event'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Filter Controls */}
        <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleToggleEventsSection}
              variant={showEventsSection ? "default" : "outline"}
              className={showEventsSection 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "text-red-600 border-red-600 hover:bg-red-50"
              }
              disabled={isSubmitting}
            >
              {showEventsSection 
                ? (language === 'ar' ? 'إخفاء قسم الفعاليات' : 'Hide Events Section')
                : (language === 'ar' ? 'إظهار قسم الفعاليات' : 'Show Events Section')
              }
            </Button>
            <Button
              onClick={() => setShowInactiveEvents(!showInactiveEvents)}
              variant={showInactiveEvents ? "default" : "outline"}
              className={showInactiveEvents 
                ? "bg-gray-600 hover:bg-gray-700 text-white" 
                : "text-gray-600 border-gray-600 hover:bg-gray-50"
              }
              disabled={isSubmitting}
            >
              {showInactiveEvents 
                ? (language === 'ar' ? 'إخفاء الفعاليات المخفية' : 'Hide Inactive Events')
                : (language === 'ar' ? 'إظهار الفعاليات المخفية' : 'Show Inactive Events')
              }
            </Button>
            <span className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {events.filter(event => showInactiveEvents || event.isActive).length} {language === 'ar' ? 'فعالية' : 'events'}
            </span>
          </div>
          
          {/* Section Status Indicator */}
          <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-3 h-3 rounded-full ${showEventsSection ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm ${showEventsSection ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {showEventsSection 
                ? (language === 'ar' ? 'القسم ظاهر في الصفحة الرئيسية' : 'Section visible on homepage')
                : (language === 'ar' ? 'القسم مخفي من الصفحة الرئيسية' : 'Section hidden from homepage')
              }
            </span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد فعاليات حالياً' : 'No events available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.filter(event => showInactiveEvents || event.isActive).map((event) => {
              const CategoryIcon = getCategoryIcon(event.category);
              return (
                <Card key={event.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 z-10">
                    <Button
                      onClick={() => openDialog('edit', event)}
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-blue-600 border-blue-600"
                      disabled={isSubmitting}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(event.id)}
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-red-600 border-red-600"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={language === 'ar' ? event.titleAr : event.titleEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CategoryIcon className="w-12 h-12 text-gray-400" />
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                      <div className="bg-yellow-600 text-black px-3 py-1 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                        <CategoryIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          ${event.price}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h4 className={`font-semibold ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                        {language === 'ar' ? event.titleAr : event.titleEn}
                      </h4>
                      {!event.isActive && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {language === 'ar' ? 'غير نشط' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                      {language === 'ar' ? event.descriptionAr : event.descriptionEn}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-purple-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {formatDate(event.date.toISOString())}
                        </span>
                      </div>
                      
                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-purple-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {event.time}
                        </span>
                      </div>
                      
                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Users className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-purple-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {language === 'ar' 
                            ? `${event.capacity} مقعد متاح`
                            : `${event.capacity} seats available`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold text-lg text-purple-600">
                        ${event.price}
                      </span>
                      <Button
                        onClick={() => handleToggleActive(event)}
                        size="sm"
                        variant={event.isActive ? "outline" : "default"}
                        className={event.isActive 
                          ? "text-green-600 border-green-600 hover:bg-green-50" 
                          : "bg-red-600 hover:bg-red-700 text-white"
                        }
                        disabled={isSubmitting}
                      >
                        {event.isActive 
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'غير نشط' : 'Inactive')
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {dialogAction === 'add' 
                ? (language === 'ar' ? 'إضافة فعالية جديدة' : 'Add New Event')
                : (language === 'ar' ? 'تعديل الفعالية' : 'Edit Event')
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
                    ? 'تم حفظ الفعالية بنجاح!' 
                    : 'Event saved successfully!'
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
                {language === 'ar' ? 'صورة الفعالية' : 'Event Image'}
              </Label>
              <div className="space-y-3">
                {formData.imageUrl && (
                  <div className="aspect-[16/9] w-full max-w-sm mx-auto overflow-hidden rounded-lg border">
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
                      <span>{language === 'ar' ? 'رفع صورة' : 'Upload Image'}</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {/* Title English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'عنوان الفعالية بالإنجليزية *' : 'Event Title (English) *'}
              </Label>
              <Input
                value={formData.titleEn}
                onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter event title in English"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Title Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'عنوان الفعالية بالعربية *' : 'Event Title (Arabic) *'}
              </Label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData({...formData, titleAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل عنوان الفعالية بالعربية"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description English */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الفعالية بالإنجليزية' : 'Event Description (English)'}
              </Label>
              <Textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                className="text-left font-english"
                placeholder="Enter event description in English"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Arabic */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'وصف الفعالية بالعربية' : 'Event Description (Arabic)'}
              </Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                className="text-right font-arabic"
                placeholder="أدخل وصف الفعالية بالعربية"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'التاريخ *' : 'Date *'}
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  min={today}
                  className={isRTL ? 'text-right' : 'text-left'}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className={isRTL ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الوقت *' : 'Time *'}
                </Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className={isRTL ? 'text-right' : 'text-left'}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Price and Capacity */}
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
                  {language === 'ar' ? 'السعة *' : 'Capacity *'}
                </Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className={isRTL ? 'text-right' : 'text-left'}
                  placeholder={language === 'ar' ? 'عدد المقاعد' : 'Number of seats'}
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'فئة الفعالية *' : 'Event Category *'}
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

            {/* Active toggle */}
            <div className="space-y-2">
              <Label className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'حالة الفعالية' : 'Event Status'}
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
                  {language === 'ar' ? 'الفعالية نشطة ومتاحة' : 'Event is active and available'}
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

export default EventsManagementPage;