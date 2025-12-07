'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSiteSettings } from '@/lib/firestore';

const AboutSection = () => {
  const { t, isRTL } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [aboutImage, setAboutImage] = useState<string>('https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop');
  const sectionRef = useRef<HTMLElement>(null);

  // Load about image from site settings
  useEffect(() => {
    const loadAboutImage = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings?.aboutSectionImage) {
          setAboutImage(settings.aboutSectionImage);
        }
      } catch (error) {
        console.error('Error loading about section image:', error);
      }
    };

    loadAboutImage();
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid md:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center ${isRTL ? 'md:grid-flow-col-dense' : ''}`}>
          {/* Text Content */}
          <div className={`${isVisible ? 'animate-slide-up-fast' : 'opacity-0'} ${isRTL ? 'md:col-start-2' : ''}`}>
            <h2 className={`text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
              }`}>
              {t('aboutTitle')}
            </h2>

            <p className={`text-gray-600 text-base md:text-lg leading-relaxed mb-8 md:mb-10 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
              }`}>
              {t('aboutContent')}
            </p>

            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl md:rounded-2xl border border-gray-100 hover:border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-blue-700 mb-1">7+</div>
                <div className={`text-xs md:text-sm text-gray-600 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {isRTL ? 'سنوات خبرة' : 'Years Experience'}
                </div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl md:rounded-2xl border border-gray-100 hover:border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-blue-700 mb-1">50+</div>
                <div className={`text-xs md:text-sm text-gray-600 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {isRTL ? 'أطباق مميزة' : 'Signature Dishes'}
                </div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl md:rounded-2xl border border-gray-100 hover:border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-blue-700 mb-1">1000+</div>
                <div className={`text-xs md:text-sm text-gray-600 font-medium ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {isRTL ? 'عميل سعيد' : 'Happy Customers'}
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className={`${isVisible ? 'animate-scale-in' : 'opacity-0'} ${isRTL ? 'md:col-start-1' : ''}`}>
            <div className="relative mt-8 md:mt-0">
              <div className="aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 bg-gray-100">
                <img
                  src={aboutImage}
                  alt="Restaurant Interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Decorative Element - Minimalist */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl hidden md:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;