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
  Plus,
  Trash2,
  Save,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getContactInfo,
  updateContactInfo,
  getWorkingHours,
  updateWorkingHours,
  type ContactInfo as FirestoreContactInfo,
  type WorkingHour as FirestoreWorkingHour
} from '@/lib/firestore';

interface ContactInfo extends Omit<FirestoreContactInfo, 'id' | 'updatedAt'> {}

interface WorkingHour extends Omit<FirestoreWorkingHour, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreWorkingHour except id and updatedAt
}

const ContactManagementPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Contact section visibility state
  const [showContactSection, setShowContactSection] = useState(true);
  
  // Individual field visibility states
  const [fieldVisibility, setFieldVisibility] = useState({
    phones: true,
    whatsapps: true,
    emails: true,
    address: true
  });
  
  // Form data
  const [contactData, setContactData] = useState<ContactInfo>({
    phones: [''],
    whatsapps: [''],
    emails: [''],
    addressEn: '',
    addressAr: '',
    contactIconLinks: {
      phone: '',
      whatsapp: '',
      email: '',
      address: ''
    },
    sidebarWhatsappLink: '',
    footerLinks: {
      phone: '',
      location: '',
      instagram: '',
      snapchat: '',
      whatsapp: ''
    },
    addressLink: ''
  });
  
  const [workingHoursData, setWorkingHoursData] = useState<WorkingHour[]>([
    { dayEn: '', dayAr: '', hours: '', order: 1 }
  ]);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load data from Firestore
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load contact info
      const contactInfo = await getContactInfo();
      if (contactInfo) {
        setContactData({
          phones: contactInfo.phones.length > 0 ? contactInfo.phones : [''],
          whatsapps: contactInfo.whatsapps.length > 0 ? contactInfo.whatsapps : [''],
          emails: contactInfo.emails.length > 0 ? contactInfo.emails : [''],
          addressEn: contactInfo.addressEn,
          addressAr: contactInfo.addressAr,
          contactIconLinks: {
            phone: contactInfo.contactIconLinks?.phone ?? '',
            whatsapp: contactInfo.contactIconLinks?.whatsapp ?? '',
            email: contactInfo.contactIconLinks?.email ?? '',
            address: contactInfo.contactIconLinks?.address ?? ''
          },
          sidebarWhatsappLink: contactInfo.sidebarWhatsappLink ?? '',
          footerLinks: {
            phone: contactInfo.footerLinks?.phone ?? '',
            location: contactInfo.footerLinks?.location ?? '',
            instagram: contactInfo.footerLinks?.instagram ?? '',
            snapchat: contactInfo.footerLinks?.snapchat ?? '',
            whatsapp: contactInfo.footerLinks?.whatsapp ?? ''
          },
          addressLink: contactInfo.addressLink ?? ''
        });
      }

      // Load working hours
      const workingHours = await getWorkingHours();
      if (workingHours.length > 0) {
        setWorkingHoursData(workingHours.map(hour => ({
          dayEn: hour.dayEn,
          dayAr: hour.dayAr,
          hours: hour.hours,
          order: hour.order
        })));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    // Validation
    const hasValidPhone = contactData.phones.some(phone => phone.trim());
    const hasValidEmail = contactData.emails.some(email => email.trim());
    const hasValidAddress = contactData.addressEn.trim() && contactData.addressAr.trim();
    const hasValidWorkingHours = workingHoursData.every(hour => 
      hour.dayEn.trim() && hour.dayAr.trim() && hour.hours.trim()
    );

    if (!hasValidPhone || !hasValidEmail || !hasValidAddress || !hasValidWorkingHours) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty values
      const cleanedContactData = {
        phones: contactData.phones.filter(phone => phone.trim()),
        whatsapps: contactData.whatsapps.filter(whatsapp => whatsapp.trim()),
        emails: contactData.emails.filter(email => email.trim()),
        addressEn: contactData.addressEn.trim(),
        addressAr: contactData.addressAr.trim(),
        contactIconLinks: {
          phone: contactData.contactIconLinks?.phone?.trim() || '',
          whatsapp: contactData.contactIconLinks?.whatsapp?.trim() || '',
          email: contactData.contactIconLinks?.email?.trim() || '',
          address: contactData.contactIconLinks?.address?.trim() || ''
        },
        sidebarWhatsappLink: contactData.sidebarWhatsappLink?.trim() || '',
        footerLinks: {
          phone: contactData.footerLinks?.phone?.trim() || '',
          location: contactData.footerLinks?.location?.trim() || '',
          instagram: contactData.footerLinks?.instagram?.trim() || '',
          snapchat: contactData.footerLinks?.snapchat?.trim() || '',
          whatsapp: contactData.footerLinks?.whatsapp?.trim() || ''
        },
        addressLink: contactData.addressLink?.trim() || ''
      };

      // Update contact info
      await updateContactInfo(cleanedContactData);

      // Update working hours
      await updateWorkingHours(workingHoursData);

      setSubmitStatus('success');
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle individual field visibility
  const toggleFieldVisibility = (field: keyof typeof fieldVisibility) => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Contact field handlers
  const addContactField = (type: 'phones' | 'whatsapps' | 'emails') => {
    setContactData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const updateContactField = (type: 'phones' | 'whatsapps' | 'emails', index: number, value: string) => {
    setContactData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const removeContactField = (type: 'phones' | 'whatsapps' | 'emails', index: number) => {
    if (contactData[type].length > 1) {
      setContactData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  // Working hours handlers
  const addWorkingHour = () => {
    setWorkingHoursData(prev => [
      ...prev,
      { dayEn: '', dayAr: '', hours: '', order: prev.length + 1 }
    ]);
  };

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: string | number) => {
    setWorkingHoursData(prev => prev.map((hour, i) => 
      i === index ? { ...hour, [field]: value } : hour
    ));
  };

  const removeWorkingHour = (index: number) => {
    if (workingHoursData.length > 1) {
      setWorkingHoursData(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل معلومات التواصل...' : 'Loading contact information...'}
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
          <Button onClick={loadData} variant="outline">
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
                {language === 'ar' ? 'إدارة معلومات التواصل' : 'Manage Contact Information'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'تحديث معلومات التواصل وساعات العمل' : 'Update contact details and working hours'}
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
                ? 'تم حفظ معلومات التواصل بنجاح!' 
                : 'Contact information saved successfully!'
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
                ? 'يرجى ملء جميع الحقول المطلوبة' 
                : 'Please fill in all required fields'
              }
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card className={`shadow-xl border border-gray-200/80 rounded-2xl ${showContactSection ? '' : 'opacity-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                </div>
                <Button
                  onClick={() => setShowContactSection(!showContactSection)}
                  variant={showContactSection ? "default" : "outline"}
                  size="sm"
                  className={showContactSection 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "text-red-600 border-red-600 hover:bg-red-50"
                  }
                  disabled={isSubmitting}
                >
                  {showContactSection 
                    ? (language === 'ar' ? 'إخفاء القسم' : 'Hide Section')
                    : (language === 'ar' ? 'إظهار القسم' : 'Show Section')
                  }
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-8 ${showContactSection ? '' : 'hidden'}`}>
              {/* Phone Numbers */}
              <div className={`space-y-3 ${fieldVisibility.phones ? '' : 'opacity-50'}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label className={`font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'أرقام الهاتف' : 'Phone Numbers'}
                    </Label>
                    <Button
                      onClick={() => toggleFieldVisibility('phones')}
                      size="sm"
                      variant={fieldVisibility.phones ? "default" : "outline"}
                      className={fieldVisibility.phones 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "text-red-600 border-red-600 hover:bg-red-50"
                      }
                      disabled={isSubmitting}
                    >
                      {fieldVisibility.phones 
                        ? (language === 'ar' ? 'إخفاء' : 'Hide')
                        : (language === 'ar' ? 'إظهار' : 'Show')
                      }
                    </Button>
                  </div>
                  {fieldVisibility.phones && (
                    <Button
                      onClick={() => addContactField('phones')}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {fieldVisibility.phones && (
                  <>
                    {contactData.phones.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => updateContactField('phones', index, e.target.value)}
                          className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                          placeholder="+1 (555) 123-4567"
                          disabled={isSubmitting}
                        />
                        {contactData.phones.length > 1 && (
                          <Button
                            onClick={() => removeContactField('phones', index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* WhatsApp Numbers */}
              <div className={`space-y-3 ${fieldVisibility.whatsapps ? '' : 'opacity-50'}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label className={`font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'أرقام الواتساب' : 'WhatsApp Numbers'}
                    </Label>
                    <Button
                      onClick={() => toggleFieldVisibility('whatsapps')}
                      size="sm"
                      variant={fieldVisibility.whatsapps ? "default" : "outline"}
                      className={fieldVisibility.whatsapps 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "text-red-600 border-red-600 hover:bg-red-50"
                      }
                      disabled={isSubmitting}
                    >
                      {fieldVisibility.whatsapps 
                        ? (language === 'ar' ? 'إخفاء' : 'Hide')
                        : (language === 'ar' ? 'إظهار' : 'Show')
                      }
                    </Button>
                  </div>
                  {fieldVisibility.whatsapps && (
                    <Button
                      onClick={() => addContactField('whatsapps')}
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {fieldVisibility.whatsapps && (
                  <>
                    {contactData.whatsapps.map((whatsapp, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={whatsapp}
                          onChange={(e) => updateContactField('whatsapps', index, e.target.value)}
                          className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                          placeholder="+1 (555) 123-4567"
                          disabled={isSubmitting}
                        />
                        {contactData.whatsapps.length > 1 && (
                          <Button
                            onClick={() => removeContactField('whatsapps', index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Email Addresses */}
              <div className={`space-y-3 ${fieldVisibility.emails ? '' : 'opacity-50'}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label className={`font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'عناوين البريد الإلكتروني' : 'Email Addresses'}
                    </Label>
                    <Button
                      onClick={() => toggleFieldVisibility('emails')}
                      size="sm"
                      variant={fieldVisibility.emails ? "default" : "outline"}
                      className={fieldVisibility.emails 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "text-red-600 border-red-600 hover:bg-red-50"
                      }
                      disabled={isSubmitting}
                    >
                      {fieldVisibility.emails 
                        ? (language === 'ar' ? 'إخفاء' : 'Hide')
                        : (language === 'ar' ? 'إظهار' : 'Show')
                      }
                    </Button>
                  </div>
                  {fieldVisibility.emails && (
                    <Button
                      onClick={() => addContactField('emails')}
                      size="sm"
                      variant="outline"
                      className="text-purple-600 border-purple-600"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {fieldVisibility.emails && (
                  <>
                    {contactData.emails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateContactField('emails', index, e.target.value)}
                          className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                          placeholder="info@koukian.com"
                          disabled={isSubmitting}
                        />
                        {contactData.emails.length > 1 && (
                          <Button
                            onClick={() => removeContactField('emails', index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Address */}
              <div className={`space-y-3 ${fieldVisibility.address ? '' : 'opacity-50'}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Label className={`font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    <MapPin className="w-4 h-4 inline mr-2 rtl:mr-0 rtl:ml-2" />
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </Label>
                  <Button
                    onClick={() => toggleFieldVisibility('address')}
                    size="sm"
                    variant={fieldVisibility.address ? "default" : "outline"}
                    className={fieldVisibility.address 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "text-red-600 border-red-600 hover:bg-red-50"
                    }
                    disabled={isSubmitting}
                  >
                    {fieldVisibility.address 
                      ? (language === 'ar' ? 'إخفاء' : 'Hide')
                      : (language === 'ar' ? 'إظهار' : 'Show')
                    }
                  </Button>
                </div>
                {fieldVisibility.address && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        value={contactData.addressEn}
                        onChange={(e) => setContactData(prev => ({ ...prev, addressEn: e.target.value }))}
                        className="text-left font-english"
                        placeholder="123 Luxury Street, Downtown"
                        disabled={isSubmitting}
                      />
                      <Input
                        value={contactData.addressAr}
                        onChange={(e) => setContactData(prev => ({ ...prev, addressAr: e.target.value }))}
                        className="text-right font-arabic"
                        placeholder="123 شارع الفخامة، وسط المدينة"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'رابط العنوان (خريطة / موقع)' : 'Address Link (Map / Location)'}
                      </Label>
                      <Input
                        value={contactData.addressLink}
                        onChange={(e) => setContactData(prev => ({ ...prev, addressLink: e.target.value }))}
                        className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                        placeholder={language === 'ar' ? 'ضع رابط الخريطة هنا' : 'Paste map/location link'}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Icon Links */}
              <div className="space-y-3 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label className="font-semibold">
                      {language === 'ar' ? 'روابط الأيقونات (الهيدر/التواصل)' : 'Icon Links (Header / Contact)'}
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={contactData.contactIconLinks?.phone ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      contactIconLinks: { ...prev.contactIconLinks, phone: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط مخصص للهاتف (tel: ... أو صفحة)' : 'Custom phone link (tel:... or page)'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.contactIconLinks?.whatsapp ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      contactIconLinks: { ...prev.contactIconLinks, whatsapp: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط مخصص للواتساب (https://wa.me/...)' : 'Custom WhatsApp link (https://wa.me/...)'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.contactIconLinks?.email ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      contactIconLinks: { ...prev.contactIconLinks, email: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط مخصص للإيميل (mailto:...)' : 'Custom email link (mailto:...)'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.contactIconLinks?.address ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      contactIconLinks: { ...prev.contactIconLinks, address: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط مخصص للعناوين (خريطة)' : 'Custom address link (map)'}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Sidebar WhatsApp Link (Mobile Menu) */}
              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'رابط واتساب في قائمة الهاتف (Sidebar)' : 'Sidebar WhatsApp Link (Mobile Menu)'}
                </Label>
                <Input
                  value={contactData.sidebarWhatsappLink}
                  onChange={(e) => setContactData(prev => ({ ...prev, sidebarWhatsappLink: e.target.value }))}
                  className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                  placeholder={language === 'ar' ? 'مثال: https://wa.me/966...' : 'e.g., https://wa.me/966...'}
                  disabled={isSubmitting}
                />
              </div>

              {/* Footer Links */}
              <div className="space-y-3 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Label className="font-semibold">
                    {language === 'ar' ? 'روابط الفوتر' : 'Footer Links'}
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={contactData.footerLinks?.phone ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      footerLinks: { ...prev.footerLinks, phone: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط الهاتف في الفوتر' : 'Footer phone link'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.footerLinks?.location ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      footerLinks: { ...prev.footerLinks, location: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط الموقع/الخريطة في الفوتر' : 'Footer location link'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.footerLinks?.instagram ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      footerLinks: { ...prev.footerLinks, instagram: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط إنستغرام في الفوتر' : 'Footer Instagram link'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.footerLinks?.snapchat ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      footerLinks: { ...prev.footerLinks, snapchat: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط سناب شات في الفوتر' : 'Footer Snapchat link'}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={contactData.footerLinks?.whatsapp ?? ''}
                    onChange={(e) => setContactData(prev => ({
                      ...prev,
                      footerLinks: { ...prev.footerLinks, whatsapp: e.target.value }
                    }))}
                    placeholder={language === 'ar' ? 'رابط واتساب في الفوتر' : 'Footer WhatsApp link'}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse font-arabic' : 'font-english'}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                </div>
                <Button
                  onClick={addWorkingHour}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workingHoursData.map((hour, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h4 className={`font-semibold ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                      {language === 'ar' ? `اليوم ${index + 1}` : `Day ${index + 1}`}
                    </h4>
                    {workingHoursData.length > 1 && (
                      <Button
                        onClick={() => removeWorkingHour(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'اليوم بالإنجليزية' : 'Day (English)'}
                    </Label>
                    <Input
                      value={hour.dayEn}
                      onChange={(e) => updateWorkingHour(index, 'dayEn', e.target.value)}
                      className="text-left font-english"
                      placeholder="Monday - Thursday"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'اليوم بالعربية' : 'Day (Arabic)'}
                    </Label>
                    <Input
                      value={hour.dayAr}
                      onChange={(e) => updateWorkingHour(index, 'dayAr', e.target.value)}
                      className="text-right font-arabic"
                      placeholder="الإثنين - الخميس"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                    </Label>
                    <Input
                      value={hour.hours}
                      onChange={(e) => updateWorkingHour(index, 'hours', e.target.value)}
                      className={isRTL ? 'text-right' : 'text-left'}
                      placeholder="12:00 PM - 11:00 PM"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactManagementPage;