'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, AlertCircle, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOffers, type Offer as FirestoreOffer } from '@/lib/firestore';

interface Offer extends FirestoreOffer {
  // All properties inherited from FirestoreOffer
}

const OffersSection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Load active offers from Firestore
  const loadOffers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get only active offers
      const offersData = await getOffers(true); // isActive = true

      // Filter offers that are still valid
      const validOffers = offersData.filter(offer => {
        const today = new Date();
        const validUntil = new Date(offer.validUntil);
        return validUntil >= today;
      });

      // Limit to 4 offers for homepage display
      setOffers(validOffers.slice(0, 4));
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل العروض' : 'Error loading offers');
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
    loadOffers();
  }, [language]);

  // Memoize date formatting for performance
  const formatDate = useMemo(() => (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [language]);

  return (
    <section ref={sectionRef} id="offers" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className={`text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 ${isVisible ? 'animate-slide-up-fast' : 'opacity-0'
            } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('offersTitle')}
          </h2>
          <p className={`text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {language === 'ar'
              ? 'اكتشف عروضنا الخاصة والحصرية'
              : 'Discover our special and exclusive offers'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'جاري تحميل العروض...' : 'Loading offers...'}
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
              <Button onClick={loadOffers} variant="outline">
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {/* Offers Grid - Vertical Glassmorphism Style */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {offers.map((offer, index) => (
              <div
                key={offer.id}
                className={`relative group overflow-hidden rounded-3xl h-[450px] shadow-2xl transition-all duration-500 hover:shadow-green-900/20 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Background Layer (Image or Gradient) */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  <img
                    src={offer.imageUrl || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
                    alt={language === 'ar' ? offer.titleAr : offer.titleEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                </div>

                {/* Content Layer - Glassmorphism */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end h-full z-10">

                  {/* Price Badge - Floating Top */}
                  <div className={`absolute top-6 ${isRTL ? 'right-6' : 'left-6'}`}>
                    <div className="bg-green-500/90 backdrop-blur-md border border-white/20 text-white rounded-2xl px-4 py-2 shadow-lg">
                      <span className="block text-xl font-bold font-english leading-none">
                        {offer.price}
                      </span>
                      <span className="block text-xs opacity-90 font-english mt-0.5">
                        ر.س
                      </span>
                    </div>
                  </div>

                  <div className={`transform transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>

                    <h3 className={`text-2xl md:text-2xl font-bold leading-tight drop-shadow-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? offer.titleAr : offer.titleEn}
                    </h3>

                    <p className={`text-gray-300 text-sm md:text-base line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? offer.descriptionAr : offer.descriptionEn}
                    </p>

                    {/* Valid Until */}
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-200 py-2 border-t border-white/10 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className={isRTL ? 'font-arabic' : 'font-english'}>
                        {isRTL ? 'حتى' : 'Until'} {formatDate(offer.validUntil)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && offers.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد عروض متاحة حالياً' : 'No offers available at the moment'}
            </p>
          </div>
        )}
      </div>

    </section>
  );
};

export default OffersSection;