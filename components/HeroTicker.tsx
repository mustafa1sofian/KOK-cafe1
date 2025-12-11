'use client';

import React, { useEffect, useState } from 'react';
import { getEvents, Event } from '@/lib/firestore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const HeroTicker = () => {
    const { t, isRTL, language } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await getEvents(true);
                const upcomingEvents = fetchedEvents.filter(event =>
                    new Date(event.date) >= new Date()
                );

                if (upcomingEvents.length > 0) {
                    setEvents(upcomingEvents);
                } else {
                    // DEMO MODE
                    setEvents([{
                        id: 'demo',
                        titleEn: 'Jazz Night Special',
                        titleAr: 'ليلة الجاز الخاصة',
                        descriptionEn: 'Live music',
                        descriptionAr: 'موسيقى حية',
                        date: new Date(Date.now() + 86400000),
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
                console.error('Error fetching events ticker:', error);
            }
        };

        fetchEvents();
    }, []);

    if (events.length === 0) return null;

    // Triplicate the list for smoother, faster loop with minimal gap
    const tickerItems = [...events, ...events, ...events];

    return (
        <div
            className={`
                absolute bottom-0 left-0 right-0 z-30
                h-14 bg-black/60 backdrop-blur-md border-t border-white/10
                flex items-center overflow-hidden
                transition-all duration-700
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            `}
        >
            <div className={`
                flex items-center gap-12 whitespace-nowrap pause-on-hover
                ${isRTL ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}
            `}>
                {tickerItems.map((event, index) => {
                    const uniqueKey = `${event.id}-${index}`;
                    const formattedDate = new Date(event.date).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US',
                        { weekday: 'long', day: 'numeric', month: 'short' }
                    );

                    return (
                        <div key={uniqueKey} className="flex items-center gap-3">
                            {/* Title */}
                            <h4 className={`text-white font-medium text-sm sm:text-base ${isRTL ? 'font-arabic' : 'font-english'}`}>
                                {language === 'ar' ? event.titleAr : event.titleEn}
                            </h4>

                            {/* Date/Time */}
                            <div className="flex items-center text-white/60 text-xs sm:text-sm gap-1.5 opacity-80">
                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                <span>{formattedDate}</span>
                                <span className="mx-1">-</span>
                                <span>{event.time}</span>
                            </div>

                            {/* Book Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' })}
                                className="h-7 px-3 text-[10px] sm:text-xs rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
                            >
                                {isRTL ? 'احجز' : 'Book'}
                            </Button>

                            {/* Separator between events */}
                            <div className="mx-4 text-white/20 select-none">|</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HeroTicker;
