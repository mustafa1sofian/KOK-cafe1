'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGalleryImages, type GalleryImage as FirestoreGalleryImage } from '@/lib/firestore';

interface GalleryImage extends FirestoreGalleryImage {
  // All properties inherited from FirestoreGalleryImage
}

const GallerySection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Load gallery images from Firestore
  const loadGalleryImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const imagesData = await getGalleryImages();
      setGalleryImages(imagesData);
    } catch (err) {
      console.error('Error loading gallery images:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل صور المعرض' : 'Error loading gallery images');
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

  // Load gallery images on component mount
  useEffect(() => {
    loadGalleryImages();
  }, []);

  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  return (
    <section ref={sectionRef} id="gallery" className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent mb-4 md:mb-6 ${isVisible ? 'animate-slide-up-fast' : 'opacity-0'
            } ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('galleryTitle')}
          </h2>
          <p className={`text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {language === 'ar'
              ? 'استكشف أجواء المطعم الفاخرة وأطباقنا المميزة من خلال معرض الصور'
              : 'Explore our luxurious restaurant atmosphere and signature dishes through our photo gallery'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'جاري تحميل صور المعرض...' : 'Loading gallery images...'}
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
              <button
                onClick={loadGalleryImages}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRTL ? 'font-arabic' : 'font-english'
                  }`}
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && galleryImages.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد صور في المعرض حالياً' : 'No images in gallery yet'}
            </p>
            <p className={`text-gray-500 text-sm mt-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar'
                ? 'يمكنك إضافة صور من لوحة التحكم'
                : 'You can add images from the admin dashboard'
              }
            </p>
          </div>
        )}

        {/* Gallery Content */}
        {!isLoading && !error && galleryImages.length > 0 && (
          <>
            {/* Desktop Masonry Grid */}
            <div className="hidden sm:block">
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
                {galleryImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={`break-inside-avoid cursor-pointer group ${isVisible ? 'animate-fade-in' : 'opacity-0'
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => openModal(image.imageUrl)}
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={image.imageUrl}
                        alt={language === 'ar' ? image.altAr : image.altEn}
                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <span className="text-xl font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Single Column */}
            <div className="sm:hidden -mx-4">
              <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {galleryImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={`cursor-pointer group min-w-[75%] max-w-[80%] snap-center ${isVisible ? 'animate-fade-in' : 'opacity-0'
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => openModal(image.imageUrl)}
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={image.imageUrl}
                        alt={language === 'ar' ? image.altAr : image.altEn}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <span className="text-xl font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Gallery Image"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;