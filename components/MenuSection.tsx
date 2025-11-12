'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMenuItems, type MenuItem as FirestoreMenuItem } from '@/lib/firestore';
import { Loader2, AlertCircle } from 'lucide-react';

interface MenuItem extends FirestoreMenuItem {
  // All properties inherited from FirestoreMenuItem
}

const MenuSection = () => {
  const { language, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const isRTL = language === 'ar';
  const sectionRef = useRef<HTMLElement>(null);

  // Load featured menu items from Firestore
  const loadFeaturedItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get only featured and available menu items
      const items = await getMenuItems(undefined, true); // isFeatured = true
      const availableItems = items.filter(item => item.isAvailable);
      
      // Limit to 6 items for homepage display
      setMenuItems(availableItems.slice(0, 6));
    } catch (err) {
      console.error('Error loading featured items:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل الأطباق' : 'Error loading dishes');
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadFeaturedItems();
  }, [language]);

  // Memoize category badge logic for performance
  const getCategoryInfo = useMemo(() => (subcategoryId: string) => {
    // This is a simplified categorization - in a real app you might want to 
    // fetch subcategory info or have a mapping
    return {
      color: 'bg-yellow-600 text-black',
      label: language === 'ar' ? 'مميز' : 'Featured'
    };
  }, [language]);

  return (
    <section ref={sectionRef} id="menu" className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className={`text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 ${
            isVisible ? 'animate-slide-up-fast' : 'opacity-0'
          } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('menuTitle')}
          </h2>
          <p className={`text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {language === 'ar' 
              ? 'تذوق أشهى الأطباق الشامية والبحرية المحضرة بإتقان'
              : 'Taste the finest Levantine and seafood dishes expertly prepared'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-600" />
              <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'جاري تحميل الأطباق المميزة...' : 'Loading featured dishes...'}
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
              <Button onClick={loadFeaturedItems} variant="outline">
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        {!isLoading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-10 md:mb-12">
            {menuItems.map((item, index) => (
              <Card
                key={item.id}
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl ${
                  isVisible ? 'animate-scale-in' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.imageUrl || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'}
                    alt={language === 'ar' ? item.nameAr : item.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Price Badge on Image */}
                  <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-base md:text-lg font-bold text-yellow-600">
                        {item.price} ر.س
                      </span>
                    </div>
                  </div>
                  
                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
                      <span className="bg-yellow-500 text-black px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                        {language === 'ar' ? 'مميز' : 'Featured'}
                      </span>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 md:p-5">
                  <h3 className={`text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-1 ${
                    isRTL ? 'font-arabic text-right' : 'font-english text-left'
                  }`}>
                    {language === 'ar' ? item.nameAr : item.nameEn}
                  </h3>
                  
                  <p className={`text-gray-600 text-sm leading-relaxed line-clamp-2 ${
                    isRTL ? 'font-arabic text-right' : 'font-english text-left'
                  }`}>
                    {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && menuItems.length === 0 && (
          <div className="text-center py-16">
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد أطباق مميزة حالياً' : 'No featured dishes available at the moment'}
            </p>
          </div>
        )}

        {/* View Full Menu Button */}
        {!isLoading && !error && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/menu'}
              className={`bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 md:py-4 text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl ${
                isVisible ? 'animate-fade-in' : 'opacity-0'
              } ${isRTL ? 'font-arabic' : 'font-english'}`}
            >
              {t('viewFullMenu')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;