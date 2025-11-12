'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const OfficialDocuments = () => {
  const { language, isRTL } = useLanguage();
  const [activeModal, setActiveModal] = useState<'allergens' | 'commercial-ar' | 'commercial-en' | null>(null);

  const certificates = [
    {
      id: 'allergens',
      labelAr: 'قائمة مسببات الحساسية',
      labelEn: 'Allergens List',
      imageUrl: '/certificates/allergens.png',
      placeholderUrl: 'https://via.placeholder.com/300x400/ef4444/ffffff?text=Allergens+List'
    },
    {
      id: 'commercial-ar',
      labelAr: 'السجل التجاري (عربي)',
      labelEn: 'Commercial Registration (AR)',
      imageUrl: '/certificates/commercial-ar.png',
      placeholderUrl: 'https://via.placeholder.com/300x400/3b82f6/ffffff?text=Commercial+AR'
    },
    {
      id: 'commercial-en',
      labelAr: 'السجل التجاري (إنجليزي)',
      labelEn: 'Commercial Registration (EN)',
      imageUrl: '/certificates/commercial-en.png',
      placeholderUrl: 'https://via.placeholder.com/300x400/10b981/ffffff?text=Commercial+EN'
    }
  ];

  const openModal = (id: 'allergens' | 'commercial-ar' | 'commercial-en') => {
    setActiveModal(id);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = 'auto';
  };

  const activeCertificate = certificates.find(cert => cert.id === activeModal);

  return (
    <>
      {/* Official Documents Section */}
      <section className="py-4 md:py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-3 md:px-4">
          {/* Section Title - Compact */}
          <div className="text-center mb-3">
            <h3 className={`text-sm md:text-base font-semibold text-gray-700 mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'المستندات الرسمية' : 'Official Documents'}
            </h3>
            <p className={`text-gray-500 text-xs ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'اضغط لعرض التفاصيل' : 'Click to view details'}
            </p>
          </div>

          {/* Certificates Grid - Modern Compact */}
          <div className="flex gap-2 md:gap-3 justify-center overflow-x-auto pb-2 scrollbar-hide max-w-full snap-x snap-mandatory">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex-shrink-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer hover:scale-105 w-[72px] sm:w-20 md:w-24 border border-gray-100 snap-center"
                onClick={() => openModal(cert.id as any)}
              >
                {/* Image */}
                <div className={`relative overflow-hidden bg-gray-100 ${
                  cert.id === 'allergens' ? 'aspect-[4/3]' : 'aspect-[3/4]'
                }`}>
                  <Image
                    src={cert.imageUrl}
                    alt={language === 'ar' ? cert.labelAr : cert.labelEn}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500 bg-white"
                    quality={95}
                    priority={true}
                    sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = cert.placeholderUrl;
                    }}
                  />
                </div>
                
                {/* Title */}
                <div className="p-1 bg-gradient-to-t from-gray-50 to-white">
                  <p className={`text-center font-medium text-gray-700 text-[10px] leading-tight line-clamp-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? cert.labelAr : cert.labelEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Popup */}
      {activeModal && activeCertificate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeModal}
        >
          <div 
            className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl h-full max-h-[90vh] bg-white rounded-lg md:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-base md:text-lg font-bold text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? activeCertificate.labelAr : activeCertificate.labelEn}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="rounded-full hover:bg-gray-200 p-1 md:p-2"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>

            {/* Image */}
            <div className="overflow-auto h-full max-h-[calc(100vh-100px)] md:max-h-[calc(90vh-80px)] p-2 md:p-4 bg-gray-50 flex items-center justify-center">
              <div className="relative w-full" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                <Image
                  src={activeCertificate.imageUrl}
                  alt={language === 'ar' ? activeCertificate.labelAr : activeCertificate.labelEn}
                  width={1200}
                  height={1600}
                  className="w-full h-auto rounded-lg shadow-lg bg-white object-contain"
                  quality={100}
                  priority={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = activeCertificate.placeholderUrl;
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 md:p-4 border-t border-gray-200 bg-white">
              <p className={`text-xs md:text-sm text-gray-600 text-center ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' 
                  ? 'اضغط في أي مكان خارج الصورة للإغلاق' 
                  : 'Click anywhere outside the image to close'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfficialDocuments;
