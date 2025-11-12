'use client';

import React from 'react';
import { X, Globe, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavClick: (href: string) => void;
  showEventsSection?: boolean;
  showOffersSection?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavClick,
  showEventsSection = true,
  showOffersSection = true,
}) => {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const navItems = [
    { key: 'home', href: '#home' },
    { key: 'about', href: '#about' },
    { key: 'menu', href: '#menu' },
    ...(showOffersSection ? [{ key: 'offers', href: '#offers' }] : []),
    ...(showEventsSection ? [{ key: 'events', href: '#events' }] : []),
    { key: 'reservation', href: '#reservation' },
    { key: 'gallery', href: '#gallery' },
    { key: 'contact', href: '#contact' },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        {/* Mobile Menu Drawer */}
        <div 
          className={`mobile-menu-container absolute top-0 h-full w-80 max-w-[90vw] bg-black shadow-2xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
          } ${
            isRTL ? 'right-0 border-l border-white/10' : 'left-0 border-r border-white/10'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}>
              <h2 className={`text-lg font-bold text-white ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}>
                {language === 'ar' ? 'كوكيان' : 'KOKYAN'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-full p-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      onNavClick(item.href);
                      onClose();
                    }}
                    className={`relative block w-full text-white/90 hover:text-yellow-400 transition-all duration-300 font-medium text-base py-3 px-4 rounded-xl hover:bg-white/10 group ${
                      isRTL ? 'text-right font-arabic' : 'text-left font-english'
                    } ${
                      activeSection === item.key ? 'text-yellow-400 bg-yellow-600/20' : ''
                    }`}
                  >
                    <span className={`flex items-center justify-between ${
                      isRTL ? 'flex-row-reverse' : ''
                    }`}>
                      {t(item.key)}
                      {activeSection === item.key && (
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
                      )}
                    </span>
                    <div className={`absolute ${
                      isRTL ? 'right-0 rounded-r-none rounded-l-full' : 'left-0 rounded-l-none rounded-r-full'
                    } top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-yellow-600 transform transition-transform duration-300 ${
                      activeSection === item.key ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                    }`} />
                  </button>
                ))}
              </div>
            </nav>
            
            {/* Quick Actions */}
            <div className="px-4 py-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('tel:+966558121096', '_self');
                    onClose();
                  }}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-yellow-400 rounded-xl font-arabic text-xs"
                >
                  <Phone className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {language === 'ar' ? 'اتصل' : 'Call'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('https://wa.me/966558121096', '_blank');
                    onClose();
                  }}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-yellow-400 rounded-xl font-arabic text-xs"
                >
                  <MessageCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                </Button>
              </div>
              
              {/* Language Toggle */}
              <Button
                variant="outline"
                onClick={() => {
                  toggleLanguage();
                }}
                className={`w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300 rounded-xl ${
                  isRTL ? 'font-arabic' : 'font-english'
                }`}
              >
                <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
