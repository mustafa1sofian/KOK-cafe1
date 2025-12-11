'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomPhoneInputProps {
    countryCode: string;
    phoneNumber: string;
    onCountryCodeChange: (code: string) => void;
    onPhoneNumberChange: (number: string) => void;
    error?: string;
    disabled?: boolean;
}

const countries = [
    { code: '+966', flag: '🇸🇦', name: 'SA' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+965', flag: '🇰🇼', name: 'KW' },
    { code: '+973', flag: '🇧🇭', name: 'BH' },
    { code: '+974', flag: '🇶🇦', name: 'QA' },
    { code: '+968', flag: '🇴🇲', name: 'OM' },
];

export function CustomPhoneInput({
    countryCode,
    phoneNumber,
    onCountryCodeChange,
    onPhoneNumberChange,
    error,
    disabled
}: CustomPhoneInputProps) {
    const { isRTL } = useLanguage();

    return (
        <div className="relative">
            <div className={cn(
                "flex rounded-md border bg-white ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                error ? "border-red-500" : "border-gray-200",
                disabled && "opacity-50 cursor-not-allowed bg-gray-100"
            )}>
                {/* Country Selector */}
                <Select value={countryCode} onValueChange={onCountryCodeChange} disabled={disabled}>
                    <SelectTrigger className="w-[100px] border-0 focus:ring-0 shadow-none bg-transparent h-11 rounded-r-none rounded-l-md px-3 gap-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code} className="cursor-pointer">
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="text-muted-foreground text-xs">{country.code}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="w-[1px] bg-gray-200 my-2" />

                {/* Phone Input */}
                <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                        onPhoneNumberChange(value);
                    }}
                    disabled={disabled}
                    placeholder="501234567"
                    className="border-0 focus-visible:ring-0 shadow-none h-11 flex-1 rounded-l-none rounded-r-md px-3 font-english"
                />
            </div>
            {error && (
                <p className={cn("text-red-500 text-xs mt-1", isRTL ? "text-right" : "text-left")}>{error}</p>
            )}
        </div>
    );
}
