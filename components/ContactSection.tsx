'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Mail, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getContactInfo, getWorkingHours, type ContactInfo as FirestoreContactInfo, type WorkingHour as FirestoreWorkingHour } from '@/lib/firestore';

interface ContactInfo extends Omit<FirestoreContactInfo, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreContactInfo except id and updatedAt
}

interface WorkingHour extends Omit<FirestoreWorkingHour, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreWorkingHour except id and updatedAt
}

const ContactSection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactInfo>({
    phones: [],
    whatsapps: [],
    emails: [],
    addressEn: '',
    addressAr: ''
  });
  const [workingHoursData, setWorkingHoursData] = useState<WorkingHour[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Load data from Firestore
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load contact info
      const contactInfo = await getContactInfo();
      if (contactInfo) {
        setContactData({
          phones: contactInfo.phones,
          whatsapps: contactInfo.whatsapps,
          emails: contactInfo.emails,
          addressEn: contactInfo.addressEn,
          addressAr: contactInfo.addressAr
        });
      }

      // Load working hours
      const workingHours = await getWorkingHours();
      setWorkingHoursData(workingHours.map(hour => ({
        dayEn: hour.dayEn,
        dayAr: hour.dayAr,
        hours: hour.hours,
        order: hour.order
      })));
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل معلومات التواصل' : 'Error loading contact information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Memoize contact info generation for performance
  const generateContactInfo = useMemo(() => {
    const info = [];
    
    // Add all phones
    contactData.phones.forEach((phone, index) => {
      info.push({
        icon: Phone,
        label: language === 'ar' ? `هاتف المطعم ${index + 1}` : `Restaurant Phone ${index + 1}`,
        value: phone,
        href: `tel:${phone.replace(/\D/g, '')}`,
        type: 'phone',
        index
      });
    });
    
    // Add all whatsapps
    contactData.whatsapps.forEach((whatsapp, index) => {
      info.push({
        icon: MessageCircle,
        label: language === 'ar' ? `واتساب ${index + 1}` : `WhatsApp ${index + 1}`,
        value: whatsapp,
        href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
        type: 'whatsapp',
        index
      });
    });
    
    // Add all emails
    contactData.emails.forEach((email, index) => {
      info.push({
        icon: Mail,
        label: language === 'ar' ? `البريد الإلكتروني ${index + 1}` : `Email ${index + 1}`,
        value: email,
        href: `mailto:${email}`,
        type: 'email',
        index
      });
    });
    
    // Add address
    info.push({
      icon: MapPin,
      label: language === 'ar' ? 'العنوان' : 'Address',
      value: language === 'ar' ? contactData.addressAr : contactData.addressEn,
      href: `https://maps.google.com/?q=${encodeURIComponent(contactData.addressEn)}`,
      type: 'address',
      index: 0
    });
    
    return info;
  }, [contactData, language]);

  const contactInfo = generateContactInfo;

  return (
    <section ref={sectionRef} id="contact" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent mb-4 md:mb-6 ${
            isVisible ? 'animate-slide-up-fast' : 'opacity-0'
          } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('contactTitle')}
          </h2>
          <p className={`text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {language === 'ar' 
              ? 'تواصل معنا أو قم بزيارتنا للاستمتاع بتجربة طعام لا تُنسى'
              : 'Contact us or visit us to enjoy an unforgettable dining experience'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'جاري تحميل معلومات التواصل...' : 'Loading contact information...'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-16">
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
        )}

        {/* Contact Content */}
        {!isLoading && !error && (
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Contact Information */}
            <div className={`space-y-6 md:space-y-8 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              {/* Contact Cards */}
              <div className="space-y-4 md:space-y-6">
                {contactInfo.map((info, index) => (
                  <Card
                    key={index}
                    className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white ${
                      isVisible ? 'animate-scale-in' : 'opacity-0'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''} relative`}>
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <info.icon className="w-6 h-6 text-black" />
                        </div>
                        <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className={`text-sm text-gray-600 mb-1 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                            {info.label}
                          </p>
                          <Button
                            variant="link"
                            className={`p-0 h-auto font-semibold text-black hover:text-yellow-600 text-base transition-colors duration-300 ${
                              isRTL ? 'font-arabic' : 'font-english'
                            }`}
                            onClick={() => window.open(info.href, '_blank')}
                          >
                            {info.value}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Working Hours */}
              <Card className={`border-0 shadow-lg bg-white ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                <CardContent className="p-5 md:p-6">
                  <div className={`flex items-center space-x-4 rtl:space-x-reverse mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <h3 className={`text-lg md:text-xl font-semibold text-black ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {workingHoursData.map((schedule, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300 ${
                          isRTL ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span className={`text-gray-700 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                          {language === 'ar' ? schedule.dayAr : schedule.dayEn}
                        </span>
                        <span className={`font-semibold text-yellow-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            {contactData.addressEn && (
              <div className={`mt-8 lg:mt-0 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
                <Card className="overflow-hidden border-0 shadow-xl bg-white">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3711.8234567890123!2d39.12345678901234!3d21.54321098765432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c1630c2f552b63%3A0x218cbb5e07f21275!2z2YXYt9i52YUg2Ygg2YPYp9mB2YrZhyDZg9mI2YPZitin2YY!5e0!3m2!1sar!2ssa!4v1234567890123"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 rounded-t-2xl"
                    />
                  </div>
                  <CardContent className="p-5 md:p-6">
                    <div className="text-center">
                      <h4 className={`font-bold text-lg text-black mb-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {language === 'ar' ? 'مطعم كوكيان' : 'Koukian Restaurant'}
                      </h4>
                      <p className={`text-gray-600 text-sm md:text-base mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {language === 'ar' ? '123 شارع الفخامة، وسط المدينة' : '123 Luxury Street, Downtown'}
                      </p>
                      <Button
                        variant="outline"
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black border-0 rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(contactData.addressEn)}`, '_blank')}
                      >
                        {language === 'ar' ? 'اتجاهات القيادة' : 'Get Directions'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ContactSection;