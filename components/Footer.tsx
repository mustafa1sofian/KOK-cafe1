'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t, isRTL, language } = useLanguage();

  const quickLinks = [
    { key: 'home', href: '#home' },
    { key: 'menu', href: '#menu' },
    { key: 'offers', href: '#offers' },
    { key: 'events', href: '#events' },
    { key: 'reservation', href: '#reservation' },
    { key: 'gallery', href: '#gallery' },
    { key: 'contact', href: '#contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="luxury-gradient text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className={`lg:col-span-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h2 className={`text-3xl font-bold mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'كوكيان' : 'Koukian'}
            </h2>
            <p className={`text-gray-300 leading-relaxed mb-6 max-w-md ${
              isRTL ? 'font-arabic text-right' : 'font-english text-left'
            }`}>
              {language === 'ar'
                ? 'نحن نقدم تجربة طعام استثنائية تجمع بين الطعم الرائع والجو الأنيق في قلب المدينة.'
                : 'We offer an exceptional dining experience that combines exquisite taste with elegant ambiance in the heart of the city.'
              }
            </p>
            
            {/* Social Media Icons */}
            <div className={`flex space-x-4 rtl:space-x-reverse ${isRTL ? 'justify-end md:justify-start' : 'justify-start'}`}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 hover:bg-yellow-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className={`text-xl font-semibold mb-6 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {t('quickLinks')}
            </h3>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className={`block text-gray-300 hover:text-yellow-400 transition-colors duration-300 ${
                    isRTL ? 'font-arabic' : 'font-english'
                  }`}
                >
                  {t(link.key)}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className={`text-xl font-semibold mb-6 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {t('contact')}
            </h3>
            <div className="space-y-3">
              <div>
                <p className={`text-gray-300 text-sm mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t('phone')}
                </p>
                <a
                  href="tel:+966558121096"
                  className="text-white hover:text-yellow-400 transition-colors duration-300"
                >
                  +966 55 812 1096
                </a>
              </div>
              <div>
                <p className={`text-gray-300 text-sm mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t('email')}
                </p>
                <a
                  href="mailto:info@koukian.com"
                  className="text-white hover:text-yellow-400 transition-colors duration-300"
                >
                  info@koukian.com
                </a>
              </div>
              <div>
                <p className={`text-gray-300 text-sm mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'العنوان' : 'Address'}
                </p>
                <p className={`text-white ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? '123 شارع الفخامة، المدينة' : '123 Luxury Street, Downtown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border & Copyright */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className={`flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 ${
            isRTL ? 'md:flex-row-reverse' : ''
          }`}>
            <p className={`text-gray-400 text-sm ${isRTL ? 'font-arabic text-center md:text-right' : 'font-english text-center md:text-left'}`}>
              {t('copyright')}
            </p>
            <div className={`flex space-x-6 rtl:space-x-reverse text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;