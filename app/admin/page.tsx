'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Menu,
    Star,
    Calendar,
    Gift,
    Image,
    Phone,
    Clock,
    Users,
    BarChart3,
    LogOut,
    ExternalLink,
    Database,
    Search,
    Bell,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Plus,
    MoreHorizontal,
    X,
    CheckCircle,
    AlertCircle,
    UserCheck,
    UserX,
    Trash2,
    Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { seedFirestore } from '@/lib/seedData';
import { signOutAdmin, checkAdminAuth } from '@/lib/auth';
import { Home } from 'lucide-react';
import { getReservations, updateReservation, deleteReservation, type Reservation } from '@/lib/firestore';

const AdminDashboard = () => {
    const { language, isRTL } = useLanguage();
    const router = useRouter();
    const [isSeeding, setIsSeeding] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    // Check authentication
    useEffect(() => {
        if (!checkAdminAuth()) {
            router.push('/admin/login');
        }
    }, [router]);

    // Load reservations for notifications
    const loadReservations = async () => {
        try {
            setIsLoadingNotifications(true);
            const reservationsData = await getReservations();

            // Sort by creation date (newest first) and limit to recent ones
            const sortedReservations = reservationsData
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 10); // Show only last 10 reservations

            setReservations(sortedReservations);

            // Count new reservations (created in last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const newReservations = reservationsData.filter(
                reservation => reservation.createdAt > oneDayAgo && reservation.status === 'new'
            );
            setUnreadCount(newReservations.length);
        } catch (error) {
            console.error('Error loading reservations:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    // Load reservations on component mount
    useEffect(() => {
        loadReservations();

        // Refresh every 30 seconds
        const interval = setInterval(loadReservations, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleReservationAction = async (reservationId: string, action: 'confirm' | 'cancel' | 'delete') => {
        try {
            setIsSubmitting(true);

            if (action === 'delete') {
                if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الحجز؟' : 'Are you sure you want to delete this reservation?')) {
                    await deleteReservation(reservationId);
                }
            } else {
                const updateData: any = {
                    status: action === 'confirm' ? 'confirmed' : 'cancelled'
                };
                if (action === 'confirm') {
                    updateData.confirmedAt = new Date();
                }
                await updateReservation(reservationId, updateData);
            }

            // Reload reservations
            await loadReservations();
        } catch (error) {
            console.error('Error updating reservation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const handleLogout = () => {
        signOutAdmin();
        router.push('/admin/login');
    };

    const handleSeedData = async () => {
        if (confirm(language === 'ar' ? 'هل أنت متأكد من تهيئة قاعدة البيانات؟ سيتم إضافة بيانات تجريبية.' : 'Are you sure you want to seed the database? This will add sample data.')) {
            setIsSeeding(true);
            try {
                await seedFirestore();
                alert(language === 'ar' ? 'تم تهيئة قاعدة البيانات بنجاح!' : 'Database seeded successfully!');
            } catch (error) {
                console.error('Error seeding database:', error);
                alert(language === 'ar' ? 'حدث خطأ أثناء تهيئة قاعدة البيانات' : 'Error seeding database');
            } finally {
                setIsSeeding(false);
            }
        }
    };

    const adminSections = [
        {
            titleEn: 'Full Menu Management',
            titleAr: 'إدارة القائمة الكاملة',
            descriptionEn: 'Manage categories, subcategories and menu items',
            descriptionAr: 'إدارة الفئات والفئات الفرعية وعناصر القائمة',
            icon: Menu,
            href: '/admin/menu',
            color: 'bg-blue-500',
            publicLink: '/menu'
        },
        {
            titleEn: 'Featured Dishes',
            titleAr: 'الأطباق المميزة',
            descriptionEn: 'Manage featured dishes displayed on homepage',
            descriptionAr: 'إدارة الأطباق المميزة المعروضة في الصفحة الرئيسية',
            icon: Star,
            href: '/admin/featured-dishes',
            color: 'bg-yellow-500',
            publicLink: '/#menu'
        },
        {
            titleEn: 'Events Management',
            titleAr: 'إدارة الفعاليات',
            descriptionEn: 'Add and manage restaurant events',
            descriptionAr: 'إضافة وإدارة فعاليات المطعم',
            icon: Calendar,
            href: '/admin/events',
            color: 'bg-purple-500',
            publicLink: '/#events'
        },
        {
            titleEn: 'Offers Management',
            titleAr: 'إدارة العروض',
            descriptionEn: 'Create and manage special offers',
            descriptionAr: 'إنشاء وإدارة العروض الخاصة',
            icon: Gift,
            href: '/admin/offers',
            color: 'bg-green-500',
            publicLink: '/#offers'
        },
        {
            titleEn: 'Gallery Management',
            titleAr: 'إدارة المعرض',
            descriptionEn: 'Upload and organize gallery images',
            descriptionAr: 'رفع وتنظيم صور المعرض',
            icon: Image,
            href: '/admin/gallery',
            color: 'bg-pink-500',
            publicLink: '/#gallery'
        },
        {
            titleEn: 'Contact Information',
            titleAr: 'معلومات التواصل',
            descriptionEn: 'Update contact details and working hours',
            descriptionAr: 'تحديث تفاصيل التواصل وساعات العمل',
            icon: Phone,
            href: '/admin/contact',
            color: 'bg-indigo-500',
            publicLink: '/#contact'
        },
        {
            titleEn: 'Reservations',
            titleAr: 'الحجوزات',
            descriptionEn: 'View and manage all reservations',
            descriptionAr: 'عرض وإدارة جميع الحجوزات',
            icon: Users,
            href: '/admin/reservations',
            color: 'bg-orange-500',
            publicLink: '/#reservation'
        },
        {
            titleEn: 'Analytics',
            titleAr: 'التحليلات',
            descriptionEn: 'View website and business analytics',
            descriptionAr: 'عرض تحليلات الموقع والأعمال',
            icon: BarChart3,
            href: '/admin/analytics',
            color: 'bg-teal-500',
            publicLink: '/'
        },
        {
            titleEn: 'Site Settings',
            titleAr: 'إعدادات الموقع',
            descriptionEn: 'Manage background images and site appearance',
            descriptionAr: 'إدارة صور الخلفية ومظهر الموقع',
            icon: Settings,
            href: '/admin/site-settings',
            color: 'bg-gray-500',
            publicLink: '/'
        }
    ];

    const statsCards = [
        {
            titleEn: 'Total Dishes',
            titleAr: 'إجمالي الأطباق',
            value: '24',
            change: '+9.5%',
            isPositive: true,
            icon: Menu,
            color: 'bg-orange-500'
        },
        {
            titleEn: 'Active Offers',
            titleAr: 'العروض النشطة',
            value: '4',
            change: '-5.5%',
            isPositive: false,
            icon: Gift,
            color: 'bg-blue-500'
        },
        {
            titleEn: 'Upcoming Events',
            titleAr: 'الفعاليات القادمة',
            value: '3',
            change: '+8.5%',
            isPositive: true,
            icon: Calendar,
            color: 'bg-red-500'
        },
        {
            titleEn: 'Gallery Images',
            titleAr: 'صور المعرض',
            value: '12',
            change: '-8.5%',
            isPositive: false,
            icon: Image,
            color: 'bg-green-500'
        }
    ];

    return (
        <div className={`flex h-screen bg-[#f3f4f6] font-sans ${isRTL ? 'rtl' : 'ltr'}`}>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop & Mobile */}
            <aside className={`
        fixed inset-y-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-64 bg-white border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}
      `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold mr-3 rtl:mr-0 rtl:ml-3">
                        K
                    </div>
                    <span className={`text-lg font-bold text-gray-900 tracking-tight ${isRTL ? 'font-arabic' : ''}`}>
                        {language === 'ar' ? 'كوكيان' : 'KOKIYAN'}
                    </span>
                    <button
                        className="md:hidden ml-auto rtl:ml-0 rtl:mr-auto text-gray-500"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
                    <p className={`px-3 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider ${isRTL ? 'font-arabic' : ''}`}>
                        {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
                    </p>

                    {adminSections.map((section, index) => (
                        <button
                            key={index}
                            onClick={() => router.push(section.href)}
                            className={`
                w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                text-gray-600 hover:bg-gray-50 hover:text-gray-900 group
              `}
                        >
                            <section.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            <span className={isRTL ? 'font-arabic' : ''}>
                                {language === 'ar' ? section.titleAr : section.titleEn}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className={isRTL ? 'font-arabic' : ''}>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center">
                        <button
                            className="md:hidden p-2 -ml-2 mr-2 text-gray-600"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className={`text-xl font-semibold text-gray-800 hidden md:block ${isRTL ? 'font-arabic' : ''}`}>
                            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        {/* Search (Desktop) */}
                        <div className="hidden md:flex relative items-center">
                            <Search className="absolute left-3 rtl:left-auto rtl:right-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                                className={`
                  pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-gray-100 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-black/5 outline-none transition-all
                  ${isRTL ? 'font-arabic' : ''}
                `}
                            />
                        </div>

                        {/* Notifications */}
                        <button
                            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setIsNotificationsOpen(true)}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {/* Profile Menu */}
                        <div className="flex items-center gap-3 border-l rtl:border-r rtl:border-l-0 border-gray-200 pl-4 rtl:pl-0 rtl:pr-4">
                            <div className="flex flex-col text-right rtl:text-left hidden md:flex">
                                <span className={`text-sm font-medium text-gray-900 ${isRTL ? 'font-arabic' : ''}`}>{language === 'ar' ? 'المدير' : 'Admin'}</span>
                                <span className="text-xs text-gray-500">store@kokiyan.com</span>
                            </div>
                            <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Dashboard Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">

                    {/* Welcome Banner (Simplified) */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className={`text-2xl font-bold text-gray-900 mb-1 ${isRTL ? 'font-arabic' : ''}`}>
                                {language === 'ar' ? 'مرحباً بعودتك 👋' : 'Welcome back, Admin 👋'}
                            </h2>
                            <p className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : ''}`}>
                                {language === 'ar' ? 'إليك نظرة عامة على أداء مطعمك اليوم.' : "Here's what's happening with your store today."}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleSeedData} variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                                <Database className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isSeeding ? '...' : (language === 'ar' ? 'تهيئة البيانات' : 'Seed Data')}
                            </Button>
                            <Button onClick={() => window.open('/', '_blank')} size="sm" className="bg-black hover:bg-gray-800 text-white">
                                <ExternalLink className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                {language === 'ar' ? 'زيارة الموقع' : 'View Store'}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {statsCards.map((stat, index) => (
                            <Card key={index} className="border border-gray-100 shadow-sm bg-white hover:border-gray-300 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg bg-gray-50`}>
                                            <stat.icon className="w-5 h-5 text-gray-700" />
                                        </div>
                                        <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stat.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {stat.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                        <p className={`text-xs text-gray-500 mt-1 font-medium ${isRTL ? 'font-arabic' : ''}`}>
                                            {language === 'ar' ? stat.titleAr : stat.titleEn}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Quick Actions (Management) */}
                    <h3 className={`text-lg font-bold text-gray-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                        {language === 'ar' ? 'الاختصارات' : 'Quick Actions'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                        {adminSections.map((section, index) => (
                            <div
                                key={index}
                                onClick={() => router.push(section.href)}
                                className="group bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-black/10 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                        <section.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-semibold text-gray-900 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                                            {language === 'ar' ? section.titleAr : section.titleEn}
                                        </h4>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                                </div>
                                <p className={`text-xs text-gray-500 line-clamp-2 ${isRTL ? 'font-arabic' : ''}`}>
                                    {language === 'ar' ? section.descriptionAr : section.descriptionEn}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </main>

            {/* Notifications Dialog */}
            <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <DialogContent className={`max-w-2xl max-h-[80vh] overflow-hidden ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <span className="text-lg font-bold">
                                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                            </span>
                            {unreadCount > 0 && <Badge className="bg-black">{unreadCount} New</Badge>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pt-4">
                        {isLoadingNotifications ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                            </div>
                        ) : (
                            reservations.map((reservation) => (
                                <div key={reservation.id} className="flex gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className={`w-2 h-2 mt-2 rounded-full ${reservation.status === 'new' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h5 className="font-semibold text-gray-900 text-sm">{reservation.customerName}</h5>
                                            <span className="text-xs text-gray-400">{formatDateTime(reservation.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {reservation.guests} guests • {reservation.date} at {reservation.time}
                                        </p>
                                        {reservation.status === 'new' && (
                                            <div className="flex gap-2 mt-3">
                                                <Button size="sm" onClick={() => handleReservationAction(reservation.id, 'confirm')} className="h-7 text-xs bg-black text-white hover:bg-gray-800">
                                                    Confirm
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReservationAction(reservation.id, 'cancel')} className="h-7 text-xs border-gray-200">
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;