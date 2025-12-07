'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { addReservation } from '@/lib/firestore';

const ReservationSection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [phoneError, setPhoneError] = useState<string>('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsError, setTermsError] = useState<string>('');
  const sectionRef = useRef<HTMLElement>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    countryCode: '+966',
    email: '',
    date: '',
    time: '',
    adults: 1,
    children: 0,
    seatingPreference: 'indoor-non-smoking' as 'indoor-smoking' | 'indoor-non-smoking' | 'outdoor-smoking' | 'outdoor-non-smoking',
    notes: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    const fullPhoneNumber = formData.countryCode + formData.phone.replace(/\D/g, '');
    const phoneRegex = /^\+\d{10,15}$/;

    if (!phoneRegex.test(fullPhoneNumber)) {
      setPhoneError(language === 'ar' ? 'رقم هاتف غير صحيح' : 'Invalid phone number');
      setSubmitStatus('error');
      return;
    }

    // Check for common fake numbers
    const cleanPhone = formData.phone.replace(/\D/g, '');
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

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.date || !formData.time) {
      setSubmitStatus('error');
      return;
    }

    // Check if terms are agreed
    if (!termsAgreed) {
      setTermsError(t('termsError'));
      setSubmitStatus('error');
      return;
    }

    // Clear phone error if validation passes
    setPhoneError('');
    setTermsError('');

    setIsSubmitting(true);
    try {
      const totalGuests = formData.adults + formData.children;

      await addReservation({
        customerName: formData.customerName.trim(),
        phone: fullPhoneNumber,
        email: formData.email.trim(),
        date: formData.date,
        time: formData.time,
        guests: totalGuests,
        adults: formData.adults,
        children: formData.children,
        seatingPreference: formData.seatingPreference,
        type: 'table',
        status: 'new',
        notes: formData.notes.trim()
      });

      setSubmitStatus('success');

      // Reset form
      setFormData({
        customerName: '',
        phone: '',
        countryCode: '+966',
        email: '',
        date: '',
        time: '',
        adults: 1,
        children: 0,
        seatingPreference: 'indoor-non-smoking',
        notes: ''
      });
      setTermsAgreed(false);

      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error submitting reservation:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleTermsAccept = () => {
    setTermsAgreed(true);
    setTermsError('');
    setIsTermsModalOpen(false);
  };

  const openTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  return (
    <section ref={sectionRef} id="reservation" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent mb-4 md:mb-6 ${isVisible ? 'animate-slide-up-fast' : 'opacity-0'
            } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('reservationTitle')}
          </h2>
          <p className={`text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {language === 'ar'
              ? 'احجز طاولتك الآن واستمتع بتجربة طعام لا تُنسى في أجواء فاخرة'
              : 'Reserve your table now and enjoy an unforgettable dining experience in luxurious ambiance'
            }
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className={`shadow-2xl border-0 bg-white ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}>
            <CardContent className="p-5 md:p-6">
              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className={`mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''
                  }`}>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className={`text-green-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar'
                      ? 'تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً لتأكيد الحجز.'
                      : 'Reservation request submitted successfully! We will contact you soon to confirm your booking.'
                    }
                  </p>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''
                  }`}>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className={`text-red-800 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                    {language === 'ar'
                      ? 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح'
                      : 'Please fill in all required fields correctly'
                    }
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phone & Name Group */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('name')}
                    </Label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className={`h-11 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('phone')}
                    </Label>
                    <div className="grid grid-cols-[80px_1fr] gap-2" style={{ direction: 'ltr' }}>
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="h-11 px-2 border rounded-md bg-gray-50 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        disabled={isSubmitting}
                      >
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+965">🇰🇼 +965</option>
                        <option value="+973">🇧🇭 +973</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+968">🇴🇲 +968</option>
                      </select>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                          setFormData({ ...formData, phone: value });
                        }}
                        className={`h-11 font-english ${phoneError ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                        placeholder="501234567"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {phoneError && (
                      <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                        {phoneError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time Compact Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('date')}
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        min={today}
                        className={`h-11 ${isRTL ? 'text-right' : 'text-left'}`}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('time')}
                    </Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className={`h-11 ${isRTL ? 'text-right' : 'text-left'}`}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Guests Steppers Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Adults Stepper */}
                  <div className={`p-3 border rounded-xl bg-gray-50 flex flex-col items-center justify-center space-y-2`}>
                    <Label className="text-sm font-medium text-gray-600">
                      {t('adults')}
                    </Label>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse bg-white rounded-full p-1 shadow-sm border">
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(1, formData.adults - 1);
                          setFormData({ ...formData, adults: newVal });
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                        disabled={isSubmitting || formData.adults <= 1}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-lg">{formData.adults}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.min(15, formData.adults + 1);
                          setFormData({ ...formData, adults: newVal });
                        }}
                        className="w-8 h-8 rounded-full bg-black text-white hover:bg-gray-800 flex items-center justify-center transition-colors"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children Stepper */}
                  <div className={`p-3 border rounded-xl bg-gray-50 flex flex-col items-center justify-center space-y-2`}>
                    <Label className="text-sm font-medium text-gray-600">
                      {t('children')}
                    </Label>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse bg-white rounded-full p-1 shadow-sm border">
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(0, formData.children - 1);
                          setFormData({ ...formData, children: newVal });
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                        disabled={isSubmitting || formData.children <= 0}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-lg">{formData.children}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.min(10, formData.children + 1);
                          setFormData({ ...formData, children: newVal });
                        }}
                        className="w-8 h-8 rounded-full bg-black text-white hover:bg-gray-800 flex items-center justify-center transition-colors"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seating Chips */}
                <div className="border-t border-gray-100 pt-5 -mx-1"></div>
                <div className="space-y-3">
                  <Label className={`text-sm font-semibold ${isRTL ? 'text-right block' : 'text-left block'}`}>
                    {t('seatingPreference')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'indoor-non-smoking', label: t('indoorNonSmoking'), icon: '🚭' },
                      { id: 'indoor-smoking', label: t('indoorSmoking'), icon: '🚬' },
                      { id: 'outdoor-non-smoking', label: t('outdoorNonSmoking'), icon: '🌿' },
                      { id: 'outdoor-smoking', label: t('outdoorSmoking'), icon: '💨' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, seatingPreference: option.id as any })}
                        className={`
                          relative flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 border
                          ${formData.seatingPreference === option.id
                            ? 'bg-black text-white border-black shadow-md transform scale-[1.02]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        {formData.seatingPreference === option.id && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email (Less Critical, moved down) */}
                <div className="space-y-2">
                  <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('email')}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`h-10 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}
                    placeholder={language === 'ar' ? ' البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={`min-h-[80px] ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}
                    placeholder={language === 'ar' ? 'طلبات خاصة...' : 'Special requests...'}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className={`p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50`}>
                    <div className={`flex items-start space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center pt-0.5">
                        <input
                          type="checkbox"
                          id="termsAgreed"
                          checked={termsAgreed}
                          onChange={(e) => {
                            setTermsAgreed(e.target.checked);
                            if (e.target.checked) setTermsError('');
                          }}
                          className={`w-5 h-5 text-yellow-600 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-500 cursor-pointer transition-all ${termsError ? 'border-red-500 ring-2 ring-red-200' : ''
                            }`}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <Label
                          htmlFor="termsAgreed"
                          className={`text-sm text-gray-700 cursor-pointer leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'}`}
                        >
                          {language === 'ar' ? 'أوافق على ' : 'I agree to the '}
                          <button
                            type="button"
                            onClick={openTermsModal}
                            className="text-yellow-700 hover:text-yellow-800 underline font-bold transition-colors inline-flex items-center gap-1"
                          >
                            {t('termsAndConditions')}
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </Label>
                        {termsError && (
                          <p className={`text-red-600 text-xs mt-1.5 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                            {termsError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white h-13 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isRTL ? 'font-arabic' : 'font-english'
                    }`}
                  disabled={isSubmitting || !termsAgreed}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{language === 'ar' ? 'جاري الحجز...' : 'Booking...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <span>{t('submitReservation')}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>

              {/* Reservation Policy */}
              <div className={`mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-blue-800 text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar'
                    ? 'بالإمكان إلغاء الحجز واسترداد المبلغ قبل ساعتين من موعد الحجز. سيتم تأكيد الحجز خلال 24 ساعة.'
                    : 'Reservations can be cancelled with full refund up to 2 hours before the scheduled time. Confirmation will be sent within 24 hours.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className={`max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-200 shadow-xl ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader className="pb-4 border-b border-gray-200 -m-6 mb-0 p-6">
            <DialogTitle className={`text-2xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('termsAndConditions')}
            </DialogTitle>
            <p className={`text-gray-500 text-sm mt-1 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
              {language === 'ar'
                ? 'يرجى قراءة الشروط بعناية'
                : 'Please read carefully'
              }
            </p>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Terms Content */}
            <div className={`flex-1 py-6 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div
                className={`max-w-none prose prose-sm ${isRTL ? 'font-arabic' : 'font-english'}`}
                dangerouslySetInnerHTML={{
                  __html: t('termsContent')
                }}
                style={{
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-3 pt-4 border-t border-gray-200 -m-6 mt-6 p-6 bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={handleTermsAccept}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('acceptTerms')}
              </Button>
              <Button
                onClick={() => setIsTermsModalOpen(false)}
                variant="outline"
                className="flex-1 py-3 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ReservationSection;