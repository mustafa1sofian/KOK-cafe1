'use client';

import React, { useEffect, useState } from 'react';
import { getEvents, Event } from '@/lib/firestore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const HeroEventWidget = () => {
    const { t, isRTL, language } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await getEvents(true);
                // Filter only future events or all active ones
                const upcomingEvents = fetchedEvents.filter(event =>
                    new Date(event.date) >= new Date()
                );

                if (upcomingEvents.length > 0) {
                    setEvents(upcomingEvents);
                } else {
                    // DEMO MODE: If no events found, show a dummy event for testing design
                    setEvents([{
                        id: 'demo',
                        titleEn: 'Jazz Night Special',
                        titleAr: 'ليلة الجاز الخاصة',
                        descriptionEn: 'Live music and dining',
                        descriptionAr: 'موسيقى حية وعشاء فاخر',
                        date: new Date(Date.now() + 86400000), // Tomorrow
                        time: '20:00',
                        price: 150,
                        category: 'music',
                        capacity: 50,
                        isActive: true,
                        order: 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }]);
                }
                setTimeout(() => setIsVisible(true), 500);
            } catch (error) {
                console.error('Error fetching events for widget:', error);
            }
        };

        fetchEvents();
    }, []);

    // Auto-rotation
    useEffect(() => {
        if (events.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % events.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [events.length, isHovered]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    };

    if (events.length === 0) return null;

    const currentEvent = events[currentIndex];

    // Format Date
    const formattedDate = new Date(currentEvent.date).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        { day: 'numeric', month: 'short' } // e.g. "24 Oct" or "٢٤ أكتوبر"
    );

    return (
        <div
            className={`
                hidden lg:flex absolute bottom-8 ${isRTL ? 'left-8' : 'right-8'} z-20
                flex-col gap-4 transition-all duration-700
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The Glass Card */}
            <div className={`
                relative w-80 p-4 rounded-2xl
                bg-white/10 backdrop-blur-xl
                border border-white/20
                shadow-2xl hover:bg-white/15 transition-colors
                group
            `}>
                {/* Header: "Upcoming Event" Badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-wider text-blue-200 uppercase bg-blue-900/40 px-2 py-1 rounded-md border border-blue-500/30">
                        {language === 'ar' ? 'حدث قادم' : 'UPCOMING'}
                    </span>

                    {/* Navigation Dots */}
                    <div className="flex gap-1.5">
                        {events.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Event Content Row */}
                <div className="flex gap-4 items-start">
                    {/* Date Box */}
                    <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-xl border border-white/10 flex flex-col items-center justify-center text-white">
                        <span className="text-xs opacity-70 uppercase">
                            {/* Month */}
                            {new Date(currentEvent.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold leading-none mt-0.5">
                            {/* Day */}
                            {new Date(currentEvent.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric' })}
                        </span>
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-white font-bold text-lg leading-tight truncate ${isRTL ? 'font-arabic' : 'font-english'}`}>
                            {language === 'ar' ? currentEvent.titleAr : currentEvent.titleEn}
                        </h3>
                        <div className="flex items-center text-gray-300 text-sm mt-1 gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{currentEvent.time}</span>
                            {currentEvent.price > 0 && (
                                <>
                                    <span className="mx-1">•</span>
                                    <span className="text-yellow-400 font-semibold">
                                        {currentEvent.price} {t('currency')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-medium text-xs group-hover:underline"
                    >
                        {t('bookNow')}
                    </Button>

                    <div className="flex gap-1">
                        <button
                            onClick={handlePrev}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                        >
                            {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                        >
                            {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Clock Icon component if not imported from Lucide
function Clock({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

export default HeroEventWidget;
