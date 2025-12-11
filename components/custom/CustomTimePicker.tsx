'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CustomTimePickerProps {
    value?: string;
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomTimePicker({
    value,
    onChange,
    placeholder,
    className,
}: CustomTimePickerProps) {
    const { language, isRTL } = useLanguage();

    // Generate time slots (e.g., 12:00 PM to 11:30 PM)
    const timeSlots = React.useMemo(() => {
        const slots = [];
        const startHour = 12; // 12 PM
        const endHour = 23;   // 11 PM

        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const date = new Date();
                date.setHours(hour);
                date.setMinutes(minute);

                const timeString = date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }); // Format for value: HH:MM

                const displayString = date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                slots.push({ value: timeString, label: displayString });
            }
        }
        return slots;
    }, [language]);

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                className={cn(
                    "w-full h-11 bg-white border-gray-200 hover:bg-gray-50 focus:ring-black",
                    isRTL && "flex-row-reverse text-right",
                    className
                )}
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder={placeholder || (language === 'ar' ? 'اختر الوقت' : 'Select time')} />
                </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
                {timeSlots.map((slot) => (
                    <SelectItem
                        key={slot.value}
                        value={slot.value}
                        className={cn("cursor-pointer", isRTL && "flex-row-reverse text-right")}
                    >
                        {slot.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
