'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSiteSettings } from '@/lib/firestore';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showEventsSection, setShowEventsSection] = useState(true);
  const [showOffersSection, setShowOffersSection] = useState(true);
  const { language, setLanguage, t, isRTL } = useLanguage();

  useEffect(() => {
    // Load site settings to check if events section should be shown
    const loadSiteSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setShowEventsSection(settings?.showEventsSection !== false);
        setShowOffersSection(settings?.showOffersSection !== false);
        setShowOffersSection(settings?.showOffersSection !== false);
      } catch (error) {
        console.error('Error loading site settings:', error);
        setShowEventsSection(true); // Default to showing events section
        setShowOffersSection(true); // Default to showing offers section
        setShowOffersSection(true); // Default to showing offers section
      }
    };

    loadSiteSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Update scroll progress
      const progress = Math.min(100, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = ['home', 'about', 'menu', 'offers', 'events', 'reservation', 'gallery', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    const sectionId = href.replace('#', '');
    setActiveSection(sectionId);

    // Check if we're on the menu page
    if (window.location.pathname === '/menu') {
      // If on menu page and clicking home, go to main page
      if (sectionId === 'home') {
        window.location.href = '/';
      } else {
        // For other sections, go to main page with hash
        window.location.href = `/${href}`;
      }
    } else {
      // On main page, smooth scroll to section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled
          ? 'bg-black/40 backdrop-blur-md border-b border-white/20'
          : 'bg-black'
        }`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between py-3 md:py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo */}
            <div className="flex items-center">
              {/* Koukian Restaurant Logo */}
              <div className="flex items-center">
                <img
                  src="/koukian-logo.svg"
                  alt={language === 'ar' ? 'شعار مطعم كوكيان' : 'Koukian Restaurant Logo'}
                  className="h-10 md:h-14 w-auto max-w-[100px] md:max-w-[140px] object-contain transition-all duration-300 hover:scale-105 filter brightness-0 invert"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.href)}
                  className={`relative text-white/90 hover:text-blue-400 transition-all duration-300 font-medium py-2 px-3 group text-sm ${activeSection === item.key ? 'text-blue-400' : ''
                    }`}
                >
                  {t(item.key)}
                  {/* Active indicator */}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transform transition-transform duration-300 ${activeSection === item.key ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                </button>
              ))}

              {/* Admin Link */}
              <button
                onClick={() => window.location.href = '/admin/login'}
                className="relative text-white/90 hover:text-yellow-400 transition-all duration-300 font-medium py-2 px-3 group text-sm"
              >
                {language === 'ar' ? 'الإدارة' : 'Admin'}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transform transition-transform duration-300 scale-x-0 group-hover:scale-x-100" />
              </button>
            </nav>

            {/* Language Toggle & Mobile Menu Button */}
            <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className={`text-white/90 hover:text-blue-400 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 rounded-full px-3 py-2 text-sm ${isRTL ? 'font-arabic' : 'font-english'
                  }`}
              >
                <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/10 rounded-full p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Component */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={activeSection}
        onNavClick={handleNavClick}
        showEventsSection={showEventsSection}
        showOffersSection={showOffersSection}
      />

      {/* Navigation Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-black/30 z-40">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-300 ease-out shadow-lg"
          style={{
            width: `${scrollProgress}%`
          }}
        />
      </div>
    </>
  );
};

export default Header;