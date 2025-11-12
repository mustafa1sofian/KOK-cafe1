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
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent mb-4 md:mb-6 ${
            isVisible ? 'animate-slide-up-fast' : 'opacity-0'
          } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('reservationTitle')}
          </h2>
          <p className={`text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {language === 'ar' 
              ? 'احجز طاولتك الآن واستمتع بتجربة طعام لا تُنسى في أجواء فاخرة'
              : 'Reserve your table now and enjoy an unforgettable dining experience in luxurious ambiance'
            }
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className={`shadow-2xl border-0 bg-white ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}>
            <CardContent className="p-6 md:p-8">
              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className={`mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
                  isRTL ? 'flex-row-reverse' : ''
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
                <div className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${
                  isRTL ? 'flex-row-reverse' : ''
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

              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {t('name')} *
                  </Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {t('phone')} *
                  </Label>
                  <div className="relative">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                      className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-20 border-r ${isRTL ? 'border-l border-r-0' : ''} rounded-l-md ${isRTL ? 'rounded-l-none rounded-r-md' : ''} bg-gray-50 text-sm z-10`}
                      disabled={isSubmitting}
                    >
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                        setFormData({...formData, phone: value});
                      }}
                      className={`text-left font-english pl-24 pr-3 ${
                        phoneError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="501234567"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  {phoneError && (
                    <p className={`text-red-500 text-sm ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Email - Full width on desktop */}
                <div className="space-y-2 md:col-span-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {t('email')} *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Date and Time */}
                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {t('date')} *
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
                      {t('time')} *
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

                {/* Adults and Children */}
                  <div className="space-y-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {t('adults')} *
                    </Label>
                    <Input
                      type="number"
                      value={formData.adults}
                      onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value) || 1})}
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
                      {t('children')}
                    </Label>
                    <Input
                      type="number"
                      value={formData.children}
                      onChange={(e) => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                      min="0"
                      max="10"
                      className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                      placeholder={language === 'ar' ? 'عدد الأطفال' : 'Number of children'}
                      disabled={isSubmitting}
                    />
                  </div>

                {/* Seating Preference - Full width on desktop */}
                <div className="space-y-2 md:col-span-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {t('seatingPreference')}
                  </Label>
                  <select
                    value={formData.seatingPreference}
                    onChange={(e) => setFormData({...formData, seatingPreference: e.target.value as any})}
                    className={`w-full p-3 border rounded-lg ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}
                    disabled={isSubmitting}
                  >
                    <option value="indoor-non-smoking">{t('indoorNonSmoking')}</option>
                    <option value="indoor-smoking">{t('indoorSmoking')}</option>
                    <option value="outdoor-non-smoking">{t('outdoorNonSmoking')}</option>
                    <option value="outdoor-smoking">{t('outdoorSmoking')}</option>
                  </select>
                </div>

                {/* Notes - Full width on desktop */}
                <div className="space-y-2 md:col-span-2">
                  <Label className={isRTL ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className={isRTL ? 'text-right font-arabic' : 'text-left font-english'}
                    placeholder={language === 'ar' ? 'أي طلبات خاصة أو ملاحظات' : 'Any special requests or notes'}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Total Guests Summary - Full width on desktop */}
                <div className="space-y-2 md:col-span-2">
                  <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {language === 'ar' ? 'إجمالي الضيوف:' : 'Total Guests:'}
                      </span>
                      <span className="font-bold text-lg text-yellow-600">
                        {formData.adults + formData.children}
                      </span>
                    </div>
                    <div className={`text-sm text-gray-600 mt-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {formData.adults} {language === 'ar' ? (formData.adults === 1 ? 'بالغ' : 'بالغين') : (formData.adults === 1 ? 'Adult' : 'Adults')}
                      {formData.children > 0 && (
                        <span>
                          {' + '}{formData.children} {language === 'ar' ? (formData.children === 1 ? 'طفل' : 'أطفال') : (formData.children === 1 ? 'Child' : 'Children')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions - Full width on desktop */}
                <div className="space-y-3 md:col-span-2">
                  <div className={`flex items-start space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="termsAgreed"
                        checked={termsAgreed}
                        onChange={(e) => {
                          setTermsAgreed(e.target.checked);
                          if (e.target.checked) {
                            setTermsError('');
                          }
                        }}
                        className={`w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 ${
                          termsError ? 'border-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {termsAgreed && (
                        <CheckCircle className="w-5 h-5 text-green-600 absolute pointer-events-none" />
                      )}
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <Label 
                        htmlFor="termsAgreed" 
                        className={`text-sm cursor-pointer ${isRTL ? 'font-arabic' : 'font-english'}`}
                      >
                        {language === 'ar' ? 'أوافق على ' : 'I agree to the '}
                        <button
                          type="button"
                          onClick={openTermsModal}
                          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                          disabled={isSubmitting}
                        >
                          {t('termsAndConditions')}
                        </button>
                        {language === 'ar' ? '' : ' *'}
                        {language === 'ar' ? ' *' : ''}
                      </Label>
                    </div>
                  </div>
                  
                  {/* Terms Error Message */}
                  {termsError && (
                    <div className={`p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${
                      isRTL ? 'flex-row-reverse' : ''
                    }`}>
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className={`text-red-800 text-sm ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                        {termsError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button - Full width on desktop */}
                <div className="md:col-span-2">
                  <Button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    isRTL ? 'font-arabic' : 'font-english'
                  }`}
                  disabled={isSubmitting || !termsAgreed}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{language === 'ar' ? 'جاري الحجز...' : 'Booking...'}</span>
                    </div>
                  ) : (
                    t('submitReservation')
                  )}
                  </Button>
                </div>
              </div>
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
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-0 ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 -m-6 mb-0 p-6 rounded-t-2xl">
            <DialogTitle className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('termsAndConditions')}
            </DialogTitle>
            <p className={`text-gray-600 text-sm mt-2 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
              {language === 'ar' 
                ? 'يرجى قراءة الشروط والأحكام بعناية قبل الموافقة'
                : 'Please read the terms and conditions carefully before agreeing'
              }
            </p>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            {/* Terms Content */}
            <div className={`flex-1 py-6 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div 
                className={`max-w-none ${isRTL ? 'font-arabic' : 'font-english'}`}
                dangerouslySetInnerHTML={{ 
                  __html: t('termsContent')
                }}
                style={{
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className={`flex gap-4 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 -m-6 mt-6 p-6 rounded-b-2xl sticky bottom-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button 
                onClick={handleTermsAccept}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <CheckCircle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('acceptTerms')}
              </Button>
              <Button 
                onClick={() => setIsTermsModalOpen(false)} 
                variant="outline" 
                className="flex-1 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
              >
                <X className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
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