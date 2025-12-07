'use client';

import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import MenuSection from '@/components/MenuSection';
import OffersSection from '@/components/OffersSection';
import EventsSection from '@/components/EventsSection';
import ReservationSection from '@/components/ReservationSection';
import GallerySection from '@/components/GallerySection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/firestore';

export default function Home() {
  const [showEventsSection, setShowEventsSection] = useState(true);
  const [showOffersSection, setShowOffersSection] = useState(true);

  // Load site settings to check events section visibility
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setShowEventsSection(settings?.showEventsSection ?? true);
        setShowOffersSection(settings?.showOffersSection ?? true);
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };

    loadSiteSettings();
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <MenuSection />
      {showOffersSection && <OffersSection />}
      {showEventsSection && <EventsSection />}
      <ReservationSection />
      <GallerySection />
      <ContactSection />
      <Footer />

      {/* AI Chatbot - يظهر فقط في الصفحة الرئيسية */}
      <Chatbot />
    </main>
  );
}