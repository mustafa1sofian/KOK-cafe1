'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import Firestore functions
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  // uploadImage, // Removed Firebase upload
  deleteImage, // Kept for legacy firebase images
  getSiteSettings,
  updateSiteSettings,
  type Event as FirestoreEvent
} from '@/lib/firestore';

// Import ImgBB functions
import {
  uploadImageToImgBB,
  validateImageFile
} from '@/lib/imgbb';

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
    // price removed
    imageFile: null as File | null,
    imageUrl: '',
    // category removed
    capacity: '',
    isActive: true
  });

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Settings State
  const [showEventsSection, setShowEventsSection] = useState(true);
  const [showHeroTicker, setShowHeroTicker] = useState(true);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load events & settings
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [eventsData, siteSettings] = await Promise.all([
        getEvents(),
        getSiteSettings()
      ]);

      setEvents(eventsData);
      setFilteredEvents(eventsData);
      setShowEventsSection(siteSettings?.showEventsSection ?? true);
      setShowHeroTicker(siteSettings?.showHeroTicker ?? true);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(events.filter(e =>
        e.titleEn.toLowerCase().includes(query) ||
        e.titleAr.includes(query) ||
        e.descriptionEn.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, events]);

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
        // price removed
        imageFile: null,
        imageUrl: event.imageUrl || '',
        // category removed
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
        // price removed
        imageFile: null,
        imageUrl: '',
        // category removed
        capacity: '',
        isActive: true
      });
    }

    setIsDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.titleEn.trim() || !formData.titleAr.trim() || !formData.date || !formData.time || !formData.capacity.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (formData.imageFile) {
        // Validate
        const validation = validateImageFile(formData.imageFile);
        if (!validation.isValid) {
          alert(validation.error); // Simple alert or custom UI error
          setSubmitStatus('error');
          setIsSubmitting(false);
          return;
        }

        // Upload to ImgBB
        try {
          imageUrl = await uploadImageToImgBB(formData.imageFile);
        } catch (uploadErr) {
          console.error(uploadErr);
          alert(language === 'ar' ? 'فشل رفع الصورة' : 'Image upload failed');
          setSubmitStatus('error');
          setIsSubmitting(false);
          return;
        }

        // Note: We don't delete old images from ImgBB via API usually.
        // But if the old image was Firebase (legacy), we might try to delete it.
        if (dialogAction === 'edit' && selectedEvent?.imageUrl && selectedEvent.imageUrl !== imageUrl) {
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
        price: 0, // Default to 0 as field is removed
        imageUrl: imageUrl || '', // Allow empty string for no image
        category: 'general', // Default to general
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
      await loadData();

      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1000);
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
        const event = events.find(e => e.id === eventId);
        await deleteEvent(eventId);
        if (event?.imageUrl) {
          try { await deleteImage(event.imageUrl); } catch (e) { console.warn(e); }
        }
        await loadData();
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
      await updateEvent(event.id, { isActive: !event.isActive });
      await loadData(); // Optimistic update would be better but simple reload works
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handleSettingsUpdate = async (key: 'showEventsSection' | 'showHeroTicker', value: boolean) => {
    try {
      // Optimistic Update
      if (key === 'showEventsSection') setShowEventsSection(value);
      if (key === 'showHeroTicker') setShowHeroTicker(value);

      const currentSettings = await getSiteSettings();
      await updateSiteSettings({
        heroBackgroundImage: currentSettings?.heroBackgroundImage || '',
        aboutSectionImage: currentSettings?.aboutSectionImage || '',
        showEventsSection: key === 'showEventsSection' ? value : showEventsSection,
        showOffersSection: currentSettings?.showOffersSection ?? true,
        showHeroTicker: key === 'showHeroTicker' ? value : showHeroTicker
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert on error
      loadData();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const categoryOptions = [
    { value: 'music', labelEn: 'Music', labelAr: 'موسيقى' },
    { value: 'tasting', labelEn: 'Tasting', labelAr: 'تذوق' },
    { value: 'dining', labelEn: 'Dining', labelAr: 'طعام' },
    { value: 'celebration', labelEn: 'Celebration', labelAr: 'احتفال' }
  ];

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50/50 ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الفعاليات' : 'Events Management'}
            </h1>
          </div>
        </div>
        <Button onClick={() => openDialog('add')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة فعالية' : 'Add Event'}
        </Button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Controls Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input
                placeholder={language === 'ar' ? 'بحث عن فعالية...' : 'Search events...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? 'pr-9' : 'pl-9'}
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm transition-all hover:shadow-md">
                <Label htmlFor="show-section" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  {language === 'ar' ? 'عرض قسم الفعاليات' : 'Show Events Section'}
                </Label>
                <Switch
                  id="show-section"
                  checked={showEventsSection}
                  onCheckedChange={(checked) => handleSettingsUpdate('showEventsSection', checked)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm transition-all hover:shadow-md">
                <Label htmlFor="show-ticker" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2 select-none">
                  {language === 'ar' ? 'شريط الحفلات المتحرك' : 'Hero Ticker Strip'}
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">New</span>
                </Label>
                <Switch
                  id="show-ticker"
                  checked={showHeroTicker}
                  onCheckedChange={(checked) => handleSettingsUpdate('showHeroTicker', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <p className="text-xs text-gray-400 px-2">
                * {language === 'ar' ? 'تظهر الفعاليات القادمة فقط (من تاريخ اليوم فصاعداً)' : 'Only upcoming events (from today onwards) are shown'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px]">{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                <TableHead>{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                <TableHead>{language === 'ar' ? 'التفاصيل' : 'Details'}</TableHead>
                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    {language === 'ar' ? 'لا توجد فعاليات مطابقة' : 'No events found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id} className="group">
                    <TableCell>
                      <div className="h-12 w-16 overflow-hidden rounded-md bg-gray-100 border relative">
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {language === 'ar' ? event.titleAr : event.titleEn}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${event.isActive
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                        : 'bg-gray-100 text-gray-600 ring-1 ring-gray-600/20'
                        }`}>
                        {event.isActive
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'مخفي' : 'Inactive')
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => handleToggleActive(event)}
                          title={event.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {event.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => openDialog('edit', event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left font-bold text-xl'}>
              {dialogAction === 'add'
                ? (language === 'ar' ? 'إضافة فعالية جديدة' : 'Add New Event')
                : (language === 'ar' ? 'تعديل الفعالية' : 'Edit Event')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

            {/* Left Column: Image & Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'صورة الغلاف (اختياري)' : 'Cover Image (Optional)'}</Label>
                <p className={`text-xs text-gray-500 mb-2 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                  {language === 'ar'
                    ? 'الحد الأقصى: 32 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP'
                    : 'Max size: 32MB. Supported formats: JPG, PNG, GIF, WebP'
                  }
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, imageUrl: '', imageFile: null })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-400">
                      <Upload className="h-8 w-8" />
                      <span className="text-xs">{language === 'ar' ? 'رفع صورة إلى ImgBB' : 'Upload Image to ImgBB'}</span>
                      <Input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'السعة' : 'Capacity'}</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              {/* Scheduling Section */}
              <div className="col-span-2 mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Label className="text-sm font-semibold text-gray-800">
                      {language === 'ar' ? 'جدولة الإعلان' : 'Schedule Publishing'}
                    </Label>
                  </div>
                  <Switch
                    checked={formData.isScheduled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isScheduled: checked })}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                {formData.isScheduled && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-700">
                        {language === 'ar' ? 'تاريخ النشر' : 'Publish Date'}
                      </Label>
                      <Input
                        type="date"
                        value={formData.publishDate}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        className="bg-white"
                      />
                      <p className="text-[10px] text-gray-500">
                        {language === 'ar' ? 'متى يبدأ ظهور الحفلة' : 'When event starts showing'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-700">
                        {language === 'ar' ? 'تاريخ الإخفاء' : 'Unpublish Date'}
                      </Label>
                      <Input
                        type="date"
                        value={formData.unpublishDate}
                        onChange={(e) => setFormData({ ...formData, unpublishDate: e.target.value })}
                        className="bg-white"
                      />
                      <p className="text-[10px] text-gray-500">
                        {language === 'ar' ? 'متى يتوقف ظهور الحفلة' : 'When event stops showing'}
                      </p>
                    </div>
                  </div>
                )}

                {!formData.isScheduled && (
                  <p className="text-xs text-gray-600 mt-2">
                    {language === 'ar'
                      ? 'عند التفعيل، يمكنك تحديد متى تظهر وتختفي الحفلة تلقائياً'
                      : 'When enabled, you can set when the event appears and disappears automatically'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Titles & Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">English Title</Label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="font-english"
                    placeholder="Jazz Night..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان بالعربية</Label>
                  <Input
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="font-arabic text-right"
                    placeholder="ليلة الجاز..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'التوقيت' : 'Timing'}</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    className="flex-1"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    type="time"
                    className="w-32"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">English Description</Label>
                  <Textarea
                    rows={2}
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="font-english resize-none"
                    placeholder="Details about the event..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">الوصف بالعربية</Label>
                  <Textarea
                    rows={2}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="font-arabic text-right resize-none"
                    placeholder="تفاصيل الفعالية..."
                  />
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {submitStatus === 'error' && (
              <p className="text-red-500 text-sm flex items-center mr-auto">
                <AlertCircle className="w-4 h-4 mr-1" />
                Missing required fields
              </p>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EventsManagementPage;