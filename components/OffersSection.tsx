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

        {/* Desktop Grid */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {offers.map((offer, index) => (
              <Card
                key={offer.id}
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl ${isVisible ? 'animate-scale-in' : 'opacity-0'
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={offer.imageUrl || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'}
                    alt={language === 'ar' ? offer.titleAr : offer.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Badge */}
                  {(offer.badgeEn || offer.badgeAr) && (
                    <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
                      <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                        {language === 'ar' ? offer.badgeAr : offer.badgeEn}
                      </span>
                    </div>
                  )}

                  {/* Price on Image */}
                  <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-lg font-bold text-blue-700">
                        {offer.price} ر.س
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className={`text-base font-semibold text-gray-900 mb-2 line-clamp-1 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                    }`}>
                    {language === 'ar' ? offer.titleAr : offer.titleEn}
                  </h3>

                  <p className={`text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                    }`}>
                    {language === 'ar' ? offer.descriptionAr : offer.descriptionEn}
                  </p>

                  <div className={`flex items-center text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''
                    }`}>
                    <Calendar className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-gray-400" />
                    <span>{isRTL ? 'حتى' : 'Until'} {formatDate(offer.validUntil)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mobile Horizontal Scroll */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
              {offers.map((offer, index) => (
                <Card
                  key={offer.id}
                  className={`snap-center flex-none w-[280px] group overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-lg ${isVisible ? 'animate-scale-in' : 'opacity-0'
                    }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={offer.imageUrl || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'}
                      alt={language === 'ar' ? offer.titleAr : offer.titleEn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Badge */}
                    {(offer.badgeEn || offer.badgeAr) && (
                      <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
                        <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                          {language === 'ar' ? offer.badgeAr : offer.badgeEn}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                        <span className="text-lg font-bold text-blue-700">
                          {offer.price} ر.س
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className={`text-base font-semibold text-gray-900 mb-2 line-clamp-1 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? offer.titleAr : offer.titleEn}
                    </h3>

                    <p className={`text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? offer.descriptionAr : offer.descriptionEn}
                    </p>

                    <div className={`flex items-center text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''
                      }`}>
                      <Calendar className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-gray-400" />
                      <span>{isRTL ? 'حتى' : 'Until'} {formatDate(offer.validUntil)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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