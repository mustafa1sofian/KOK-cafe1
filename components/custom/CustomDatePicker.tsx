'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomDatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    minDate?: Date;
    className?: string;
}

export function CustomDatePicker({
    value,
    onChange,
    placeholder,
    minDate,
    className,
}: CustomDatePickerProps) {
    const { language, isRTL } = useLanguage();
    const locale = language === 'ar' ? arSA : enUS;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className={cn(
                        'w-full justify-start text-left font-normal h-11 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors',
                        !value && 'text-muted-foreground',
                        isRTL && 'text-right flex-row-reverse',
                        className
                    )}
                >
                    <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                    {value ? (
                        format(value, 'PPP', { locale })
                    ) : (
                        <span>{placeholder || (language === 'ar' ? 'اختر التاريخ' : 'Pick a date')}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={(date) =>
                        minDate ? date < minDate : false
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto", isRTL && "font-arabic")}
                />
            </PopoverContent>
        </Popover>
    );
}
