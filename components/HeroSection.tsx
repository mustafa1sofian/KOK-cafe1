'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSiteSettings } from '@/lib/firestore';
import HeroTicker from './HeroTicker';

const HeroSection = () => {
    const { t, isRTL, language } = useLanguage();
    const defaultImages = [
        'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    ];

    const [sliderImages, setSliderImages] = useState<string[]>(defaultImages);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isImageReady, setIsImageReady] = useState(false);
    const [showTicker, setShowTicker] = useState(true);
    const [heroTitle, setHeroTitle] = useState({ en: '', ar: '' });
    const [heroSubtitle, setHeroSubtitle] = useState({ en: '', ar: '' });

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSiteSettings();

                // Load slider images
                if (settings?.heroSliderImages && settings.heroSliderImages.length > 0) {
                    const validImages = settings.heroSliderImages.filter(img => img && img.trim() !== '');
                    if (validImages.length > 0) {
                        setSliderImages(validImages);
                    }
                }

                // Load text content
                setHeroTitle({
                    en: settings?.heroTitleEn || 'Welcome to Kokian',
                    ar: settings?.heroTitleAr || 'مرحباً بكم في كوكيان'
                });
                setHeroSubtitle({
                    en: settings?.heroSubtitleEn || 'Experience luxury dining at its finest',
                    ar: settings?.heroSubtitleAr || 'استمتع بتجربة طعام فاخرة لا مثيل لها'
                });

                // Set Ticker Visibility
                setShowTicker(settings?.showHeroTicker ?? true);

                setIsImageReady(true);
            } catch (error) {
                console.error('Error loading settings:', error);
                setIsImageReady(true);
            }
        };

        loadSettings();
    }, []);

    // Auto-slide every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [sliderImages.length]);

    const scrollToReservation = () => {
        document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToMenu = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/menu';
        }
    };

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Slider Background */}
            <div className="absolute inset-0 z-0">
                {sliderImages.map((image, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide && isImageReady ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{ backgroundImage: `url('${image}')` }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 md:px-8 max-w-5xl mx-auto">
                <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl ${isRTL ? 'font-arabic' : 'font-english'
                    }`}>
                    {language === 'ar' ? heroTitle.ar : heroTitle.en}
                </h1>
                <p className={`text-lg sm:text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed drop-shadow-lg max-w-3xl mx-auto ${isRTL ? 'font-arabic' : 'font-english'
                    }`}>
                    {language === 'ar' ? heroSubtitle.ar : heroSubtitle.en}
                </p>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''
                    }`}>
                    <Button
                        onClick={scrollToReservation}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg rounded-full shadow-2xl hover:shadow-blue-900/50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        {t('bookNow')}
                    </Button>
                    <Button
                        onClick={scrollToMenu}
                        size="lg"
                        variant="outline"
                        className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        {t('viewMenu')}
                    </Button>
                </div>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
                {sliderImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'bg-white w-8'
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Hero Ticker */}
            {showTicker && <HeroTicker />}
        </section>
    );
};

export default HeroSection;
