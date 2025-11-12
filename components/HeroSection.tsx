'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSiteSettings } from '@/lib/firestore';

const HeroSection = () => {
  const { t, isRTL, language } = useLanguage();
  const defaultImage = 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop';
  const [backgroundImage, setBackgroundImage] = React.useState<string>(defaultImage);
  const [isImageLoaded, setIsImageLoaded] = React.useState<boolean>(false);
  const [isImageReady, setIsImageReady] = React.useState<boolean>(false);

  // Load background image from site settings
  React.useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings?.heroBackgroundImage && settings.heroBackgroundImage !== defaultImage) {
          // Preload the image before setting it
          const img = new Image();
          img.src = settings.heroBackgroundImage;
          
          img.onload = () => {
            setBackgroundImage(settings.heroBackgroundImage);
            setIsImageLoaded(true);
            // Small delay to ensure smooth transition
            setTimeout(() => setIsImageReady(true), 100);
          };
          
          img.onerror = () => {
            console.error('Error loading hero background image');
            setIsImageLoaded(true);
            setIsImageReady(true);
          };
        } else {
          // Use default image
          setIsImageLoaded(true);
          setIsImageReady(true);
        }
      } catch (error) {
        console.error('Error loading hero background image:', error);
        setIsImageLoaded(true);
        setIsImageReady(true);
      }
    };
    
    loadBackgroundImage();
  }, []);

  const scrollToReservation = () => {
    document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0 z-0">
        {/* Loading skeleton */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse" />
        )}
        
        {/* Background Image with smooth transition */}
        <div 
          className={`w-full h-full bg-cover bg-center transition-opacity duration-1000 ${
            isImageReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto animate-slide-up">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {t('heroTitle')}
          </h1>
          
          <p className={`text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-lg px-4 ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center px-4">
            <Button
              size="lg"
              onClick={scrollToReservation}
              className={`w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl rounded-full border-2 border-yellow-400/50 ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}
            >
              {t('bookNow')}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/menu'}
              className={`w-full sm:w-auto bg-transparent border-2 border-white/80 text-white hover:bg-white hover:text-black font-semibold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105 rounded-full backdrop-blur-sm ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}
            >
              {language === 'ar' ? 'القائمة' : 'Menu'}
            </Button>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-yellow-400/10 rounded-full blur-xl animate-pulse hidden lg:block" />
        <div className="absolute top-1/3 right-16 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse hidden lg:block" />
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-yellow-600/20 rounded-full blur-lg animate-pulse hidden lg:block" />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white/60 hover:text-yellow-400 transition-colors duration-300 cursor-pointer drop-shadow-lg"
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <path
            d="M12 2C13.1 2 14 2.9 14 4V12L15.5 10.5L16.9 11.9L12 16.8L7.1 11.9L8.5 10.5L10 12V4C10 2.9 10.9 2 12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;