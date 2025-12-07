'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Users, Music, Utensils, Star, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEvents, addEventReservation, addReservation, type Event as FirestoreEvent } from '@/lib/firestore';

interface Event extends FirestoreEvent {
  // All properties inherited from FirestoreEvent
}

const EventsSection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [phoneError, setPhoneError] = useState<string>('');
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    phone: '',
    countryCode: '+966',
    email: '',
    adults: 1,
    children: 0
  });
  const sectionRef = useRef<HTMLElement>(null);

  const openReservationModal = (event: Event) => {
    setSelectedEvent(event);
    setReservationForm({
      customerName: '',
      phone: '',
      countryCode: '+966',
      email: '',
      adults: 1,
      children: 0
    });
    setSubmitStatus('idle');
    setPhoneError('');
    setIsReservationModalOpen(true);
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    const fullPhoneNumber = reservationForm.countryCode + reservationForm.phone.replace(/\D/g, '');
    const phoneRegex = /^\+\d{10,15}$/;

    if (!phoneRegex.test(fullPhoneNumber)) {
      setPhoneError(language === 'ar' ? 'رقم هاتف غير صحيح' : 'Invalid phone number');
      setSubmitStatus('error');
      return;
    }

    // Check for common fake numbers
    const cleanPhone = reservationForm.phone.replace(/\D/g, '');
    const fakePatterns = [
      /^0{9,}$/, // All zeros
      /^1{9,}$/, // All ones
      /^123456789$/, // Sequential
      /^987654321$/, // Reverse sequential
      /^(\d)\1{8,}$/ // Repeated digits
    ];

    if (fakePatterns.some(pattern => pattern.test(cleanPhone))) {
      setPhoneError(language === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number');
      setSubmitStatus('error');
      return;
    }

    if (!selectedEvent || !reservationForm.customerName.trim() || !reservationForm.phone.trim() || !reservationForm.email.trim()) {
      setSubmitStatus('error');
      return;
    }

    // Clear phone error if validation passes
    setPhoneError('');

    setIsSubmitting(true);
    try {
      const totalSeats = reservationForm.adults + reservationForm.children;
      const totalPrice = selectedEvent.price * totalSeats;

      await addEventReservation({
        eventId: selectedEvent.id,
        eventTitle: language === 'ar' ? selectedEvent.titleAr : selectedEvent.titleEn,
        customerName: reservationForm.customerName.trim(),
        phone: fullPhoneNumber,
        email: reservationForm.email.trim(),
        seats: totalSeats,
        totalPrice,
        status: 'new',
        notes: `${language === 'ar' ? 'حجز فعالية من الموقع الإلكتروني' : 'Event reservation from website'}`
      });

      // Also add to general reservations with type 'event'
      await addReservation({
        customerName: reservationForm.customerName.trim(),
        phone: fullPhoneNumber,
        email: reservationForm.email.trim(),
        date: selectedEvent.date.toISOString().split('T')[0],
        time: selectedEvent.time,
        guests: totalSeats,
        adults: reservationForm.adults,
        children: reservationForm.children,
        seatingPreference: 'indoor-non-smoking',
        type: 'event',
        status: 'new',
        notes: `${language === 'ar' ? 'حجز فعالية من الموقع الإلكتروني' : 'Event reservation from website'} - ${language === 'ar' ? selectedEvent.titleAr : selectedEvent.titleEn}`,
        // Event-specific fields
        eventId: selectedEvent.id,
        eventTitle: language === 'ar' ? selectedEvent.titleAr : selectedEvent.titleEn,
        seats: totalSeats,
        totalPrice
      });

      setSubmitStatus('success');

      setTimeout(() => {
        setIsReservationModalOpen(false);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting event reservation:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load active events from Firestore
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get only active events
      const eventsData = await getEvents(true); // isActive = true

      // Filter events that are in the future or today
      const upcomingEvents = eventsData.filter(event => {
        const today = new Date();
        const eventDate = new Date(event.date);
        return eventDate >= today;
      });

      // Sort by date and limit to 4 events for homepage display
      const sortedEvents = upcomingEvents
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4);

      setEvents(sortedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل الفعاليات' : 'Error loading events');
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
    loadEvents();
  }, [language]);

  // Memoize category icon logic for performance
  const getCategoryIcon = useMemo(() => (category: string) => {
    switch (category) {
      case 'music':
        return Music;
      case 'tasting':
        return Star;
      case 'dining':
        return Utensils;
      default:
        return Calendar;
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'ar'
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  };

  return (
    <section ref={sectionRef} id="events" className="py-16 md:py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-700 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-2xl ${isVisible ? 'animate-slide-up-fast' : 'opacity-0'
            } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'عروض الحفلات والفعاليات' : 'Events & Special Occasions'}
          </h2>
          <p className={`text-gray-300 text-base md:text-lg max-w-3xl mx-auto px-4 leading-relaxed drop-shadow-lg ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {language === 'ar'
              ? 'انضم إلينا في فعاليات استثنائية تجمع بين الطعام الراقي والترفيه المميز'
              : 'Join us for exceptional events that combine fine dining with premium entertainment'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
              <p className={`text-red-400 mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {error}
              </p>
              <Button onClick={loadEvents} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {events.map((event, index) => {
              const CategoryIcon = getCategoryIcon(event.category);
              return (
                <Card
                  key={event.id}
                  className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-white/95 backdrop-blur-md border-0 shadow-xl ${isVisible ? 'animate-scale-in' : 'opacity-0'
                    }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={event.imageUrl || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'}
                      alt={language === 'ar' ? event.titleAr : event.titleEn}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg backdrop-blur-sm">
                        <CategoryIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {event.price} ر.س
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <CardContent className="p-5 md:p-6">
                    <h3 className={`text-lg md:text-xl font-bold text-black mb-3 group-hover:text-blue-700 transition-colors duration-300 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? event.titleAr : event.titleEn}
                    </h3>

                    <p className={`text-gray-600 text-sm md:text-base mb-4 leading-relaxed line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? event.descriptionAr : event.descriptionEn}
                    </p>

                    <div className="space-y-2 md:space-y-3 mb-6">
                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''
                        }`}>
                        <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-blue-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {formatDate(event.date)}
                        </span>
                      </div>

                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''
                        }`}>
                        <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-blue-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {event.time}
                        </span>
                      </div>

                      <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'flex-row-reverse' : ''
                        }`}>
                        <Users className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-blue-600" />
                        <span className={isRTL ? 'font-arabic' : 'font-english'}>
                          {language === 'ar'
                            ? `${event.capacity} مقعد متاح`
                            : `${event.capacity} seats available`
                          }
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => openReservationModal(event)}
                      className={`w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl rounded-full ${isRTL ? 'font-arabic' : 'font-english'
                        }`}
                    >
                      {language === 'ar' ? 'احجز مقعدك' : 'Reserve Your Seat'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-300 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد فعاليات قادمة حالياً' : 'No upcoming events at the moment'}
            </p>
          </div>
        )}

        {/* View All Events Button */}
        {!isLoading && !error && events.length > 0 && (
          <></>
        )}
      </div>

      {/* Event Reservation Modal */}
      <Dialog open={isReservationModalOpen} onOpenChange={setIsReservationModalOpen}>
        <DialogContent className={`max-w-md ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'حجز مقعد في الفعالية' : 'Reserve Event Seat'}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Details */}
              <div className={`p-4 bg-gray-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className={`font-semibold text-lg mb-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? selectedEvent.titleAr : selectedEvent.titleEn}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span>{formatDate(selectedEvent.date.toISOString())}</span>
                  </div>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span>{selectedEvent.time}</span>
                  </div>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold text-green-600">
                      {selectedEvent.price} ر.س {language === 'ar' ? 'للشخص الواحد' : 'per person'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className={`p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''
                  }`}>
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className={`text-green-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar'
                      ? 'تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً.'
                      : 'Reservation request submitted successfully! We will contact you soon.'
                    }
                  </p>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className={`p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''
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

              {/* Cancellation Policy */}
              <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-blue-800 text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar'
                    ? 'بالإمكان إلغاء الحجز واسترداد المبلغ قبل ساعتين من موعد الحجز'
                    : 'Reservations can be cancelled with full refund up to 2 hours before the scheduled time'
                  }
                </p>
              </div>

              {/* Reservation Form */}
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </Label>
                  <Input
                    value={reservationForm.customerName}
                    onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                    className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                  </Label>
                  <div className="relative">
                    <select
                      value={reservationForm.countryCode}
                      onChange={(e) => setReservationForm({ ...reservationForm, countryCode: e.target.value })}
                      className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-20 border-r ${isRTL ? 'border-l border-r-0' : ''} rounded-l-md ${isRTL ? 'rounded-l-none rounded-r-md' : ''} bg-gray-50 text-sm z-10`}
                      disabled={isSubmitting}
                    >
                      {/* دول الخليج العربي */}
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+968">🇴🇲 +968</option>

                      {/* الدول العربية */}
                      <option value="+962">🇯🇴 +962</option>
                      <option value="+961">🇱🇧 +961</option>
                      <option value="+963">🇸🇾 +963</option>
                      <option value="+964">🇮🇶 +964</option>
                      <option value="+20">🇪🇬 +20</option>
                      <option value="+212">🇲🇦 +212</option>
                      <option value="+213">🇩🇿 +213</option>
                      <option value="+216">🇹🇳 +216</option>
                      <option value="+218">🇱🇾 +218</option>
                      <option value="+249">🇸🇩 +249</option>
                      <option value="+967">🇾🇪 +967</option>

                      {/* أوروبا */}
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+43">🇦🇹 +43</option>
                      <option value="+45">🇩🇰 +45</option>
                      <option value="+46">🇸🇪 +46</option>
                      <option value="+47">🇳🇴 +47</option>
                      <option value="+358">🇫🇮 +358</option>

                      {/* أمريكا الشمالية */}
                      <option value="+1">🇨🇦 +1</option>

                      {/* آسيا */}
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+82">🇰🇷 +82</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+92">🇵🇰 +92</option>
                      <option value="+880">🇧🇩 +880</option>
                      <option value="+60">🇲🇾 +60</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+66">🇹🇭 +66</option>
                      <option value="+84">🇻🇳 +84</option>
                      <option value="+62">🇮🇩 +62</option>
                      <option value="+63">🇵🇭 +63</option>
                      <option value="+98">🇮🇷 +98</option>
                      <option value="+90">🇹🇷 +90</option>

                      {/* أفريقيا */}
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+254">🇰🇪 +254</option>
                      <option value="+233">🇬🇭 +233</option>
                      <option value="+255">🇹🇿 +255</option>

                      {/* أوقيانوسيا */}
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+64">🇳🇿 +64</option>

                      {/* أمريكا الجنوبية */}
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+58">🇻🇪 +58</option>
                    </select>
                    <Input
                      type="tel"
                      value={reservationForm.phone}
                      onChange={(e) => {
                        // Only allow numbers, spaces, hyphens, and parentheses
                        const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                        setReservationForm({ ...reservationForm, phone: value });
                      }}
                      className={`text-left font-english pl-24 pr-3 ${phoneError ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                      placeholder={language === 'ar' ? '501234567' : '501234567'}
                      required
                      pattern="[0-9\s\-\(\)]+"
                      minLength={9}
                      maxLength={15}
                    />
                  </div>
                  {phoneError && (
                    <p className={`text-red-500 text-sm ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </Label>
                  <Input
                    type="email"
                    value={reservationForm.email}
                    onChange={(e) => setReservationForm({ ...reservationForm, email: e.target.value })}
                    className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Adults and Children */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'عدد البالغين *' : 'Adults *'}
                    </Label>
                    <Input
                      type="number"
                      value={reservationForm.adults}
                      onChange={(e) => setReservationForm({ ...reservationForm, adults: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="15"
                      className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                      placeholder={language === 'ar' ? 'عدد البالغين' : 'Number of adults'}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'عدد الأطفال' : 'Children'}
                    </Label>
                    <Input
                      type="number"
                      value={reservationForm.children}
                      onChange={(e) => setReservationForm({ ...reservationForm, children: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="10"
                      className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                      placeholder={language === 'ar' ? 'عدد الأطفال' : 'Number of children'}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Total Guests Summary */}
                <div className="space-y-2">
                  <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {language === 'ar' ? 'إجمالي الضيوف:' : 'Total Guests:'}
                      </span>
                      <span className="font-bold text-lg text-blue-700">
                        {reservationForm.adults + reservationForm.children}
                      </span>
                    </div>
                    <div className={`text-sm text-gray-600 mt-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {reservationForm.adults} {language === 'ar' ? (reservationForm.adults === 1 ? 'بالغ' : 'بالغين') : (reservationForm.adults === 1 ? 'Adult' : 'Adults')}
                      {reservationForm.children > 0 && (
                        <span>
                          {' + '}{reservationForm.children} {language === 'ar' ? (reservationForm.children === 1 ? 'طفل' : 'أطفال') : (reservationForm.children === 1 ? 'Child' : 'Children')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Price */}
                <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'}
                    </span>
                    <span className="font-bold text-lg text-green-600">
                      {(selectedEvent.price * (reservationForm.adults + reservationForm.children)).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={`w-full bg-green-600 hover:bg-green-700 text-white ${isRTL ? 'font-arabic' : 'font-english'
                    }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'ar' ? 'جاري الحجز...' : 'Booking...'}</span>
                    </div>
                  ) : (
                    language === 'ar' ? 'تأكيد الحجز' : 'Confirm Reservation'
                  )}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EventsSection;