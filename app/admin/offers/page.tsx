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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Calendar,
  MoreVertical,
  Search
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

  // Form data (badges removed)
  const [formData, setFormData] = useState({
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
    validUntil: '',
    imageFile: null as File | null,
    imageUrl: '',
    isActive: true
  });

  // Data state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

      // Load settings
      const settings = await getSiteSettings();
      if (settings) {
        setShowOffersSection(settings.showOffersSection ?? true);
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل العروض' : 'Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Handle settings update
  const handleSettingsUpdate = async (setting: string, value: boolean) => {
    try {
      if (setting === 'showOffersSection') {
        setShowOffersSection(value);
        await updateSiteSettings({ showOffersSection: value });
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Open dialog for adding/editing
  const openDialog = (action: 'add' | 'edit', offer?: Offer) => {
    setDialogAction(action);
    setSubmitStatus('idle');

    if (action === 'edit' && offer) {
      setSelectedOffer(offer);
      setFormData({
        titleEn: offer.titleEn,
        titleAr: offer.titleAr,
        descriptionEn: offer.descriptionEn,
        descriptionAr: offer.descriptionAr,
        price: offer.price.toString(),
        validUntil: offer.validUntil.toISOString().split('T')[0],
        imageFile: null,
        imageUrl: offer.imageUrl || '',
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
        isActive: true
      });
    }

    setIsDialogOpen(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData({ ...formData, imageUrl, imageFile: file });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.titleEn.trim() || !formData.titleAr.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال العنوان بكلا اللغتين' : 'Please enter title in both languages');
      return;
    }
    if (!formData.descriptionEn.trim() || !formData.descriptionAr.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال الوصف بكلا اللغتين' : 'Please enter description in both languages');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price');
      return;
    }
    if (!formData.validUntil) {
      alert(language === 'ar' ? 'يرجى تحديد تاريخ الصلاحية' : 'Please select valid until date');
      return;
    }

    try {
      setIsSubmitting(true);

      const offerData = {
        titleEn: formData.titleEn.trim(),
        titleAr: formData.titleAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        price: parseFloat(formData.price),
        validUntil: new Date(formData.validUntil),
        imageUrl: formData.imageUrl || '',
        isActive: formData.isActive,
        order: dialogAction === 'add' ? offers.length + 1 : selectedOffer?.order || 1
      };

      if (dialogAction === 'add') {
        await addOffer(offerData);
      } else if (selectedOffer) {
        await updateOffer(selectedOffer.id, offerData);
      }

      setSubmitStatus('success');
      await loadOffers();

      setTimeout(() => {
        setIsDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Error saving offer:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await deleteOffer(id);
      await loadOffers();
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert(language === 'ar' ? 'فشل حذف العرض' : 'Failed to delete offer');
    }
  };

  // Filter offers by search
  const filteredOffers = offers.filter(offer =>
    offer.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.titleAr.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Card className="mb-8 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
                    {language === 'ar' ? 'إدارة العروض' : 'Offers Management'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' ? 'إدارة العروض الخاصة والحصرية' : 'Manage special and exclusive offers'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => openDialog('add')}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'إضافة عرض' : 'Add Offer'}
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={language === 'ar' ? 'بحث عن عرض...' : 'Search for an offer...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? 'pr-9' : 'pl-9'}
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm transition-all hover:shadow-md">
              <Label htmlFor="show-section" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                {language === 'ar' ? 'عرض قسم العروض' : 'Show Offers Section'}
              </Label>
              <Switch
                id="show-section"
                checked={showOffersSection}
                onCheckedChange={(checked) => handleSettingsUpdate('showOffersSection', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Offers Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                <TableHead className="font-semibold">{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                <TableHead className="font-semibold">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                <TableHead className="font-semibold">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</TableHead>
                <TableHead className="font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
                  </TableCell>
                </TableRow>
              ) : filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">{language === 'ar' ? 'لا توجد عروض' : 'No offers found'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        {offer.imageUrl ? (
                          <img src={offer.imageUrl} alt={offer.titleEn} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{language === 'ar' ? offer.titleAr : offer.titleEn}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{language === 'ar' ? offer.descriptionAr : offer.descriptionEn}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{offer.price} ر.س</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {offer.validUntil.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {offer.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog('edit', offer)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(offer.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className={isRTL ? 'font-arabic text-right' : 'font-english'}>
                {dialogAction === 'add'
                  ? (language === 'ar' ? 'إضافة عرض جديد' : 'Add New Offer')
                  : (language === 'ar' ? 'تعديل العرض' : 'Edit Offer')}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Left Column: Image */}
              <div className="space-y-4">
                <Label className="text-xs text-gray-500">{language === 'ar' ? 'صورة العرض' : 'Offer Image'}</Label>
                <p className="text-[10px] text-gray-400">
                  {language === 'ar'
                    ? 'الحد الأقصى: 32 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP'
                    : 'Max size: 32MB. Supported formats: JPG, PNG, GIF, WebP'}
                </p>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
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

              {/* Right Column: Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">English Title</Label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="font-english"
                    placeholder="Summer Sale..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان بالعربية</Label>
                  <Input
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="font-arabic text-right"
                    placeholder="تخفيضات الصيف..."
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">English Description</Label>
                  <Textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="font-english resize-none"
                    rows={3}
                    placeholder="Special offer details..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">الوصف بالعربية</Label>
                  <Textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="font-arabic text-right resize-none"
                    rows={3}
                    placeholder="تفاصيل العرض الخاص..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{language === 'ar' ? 'السعر (ر.س)' : 'Price (SAR)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="99.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</Label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label className="text-sm">{language === 'ar' ? 'تفعيل العرض' : 'Activate Offer'}</Label>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">{language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'}</span>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{language === 'ar' ? 'حدث خطأ' : 'An error occurred'}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OffersManagementPage;