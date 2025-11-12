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
  Trash2
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
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 md:hidden ${
        isSidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 bg-purple-600 rounded-lg"></div>
              </div>
              <h2 className={`text-xl font-bold text-white ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
          {adminSections.map((section, index) => (
            <Card
              key={index}
              className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm"
              onClick={() => {
                router.push(section.href);
                setIsSidebarOpen(false);
              }}
            >
              <CardContent className="p-4">
                <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-12 h-12 ${section.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className={`font-semibold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? section.titleAr : section.titleEn}
                    </p>
                    <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? section.descriptionAr : section.descriptionEn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white space-y-3">
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            size="sm"
          >
            <Home className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              size="sm"
            >
              <Database className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {isSeeding 
                ? (language === 'ar' ? 'جاري...' : 'Seeding...')
                : (language === 'ar' ? 'تهيئة' : 'Seed')
              }
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 shadow-lg"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {language === 'ar' ? 'خروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 md:px-6 py-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Left side - Logo and Title */}
            <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 bg-white rounded-lg"></div>
              </div>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </h1>
                <p className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'إدارة المطعم' : 'Restaurant Management'}
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Search - Hidden on mobile */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
                  className={`pl-10 rtl:pl-3 rtl:pr-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 ${
                    isRTL ? 'text-right font-arabic' : 'text-left font-english'
                  }`}
                />
              </div>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-2 hover:bg-gray-100 rounded-xl"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-medium text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'المدير' : 'Admin'}
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hidden md:flex rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 group">
              <CardContent className="p-4 md:p-6">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className={`text-xs md:text-sm text-gray-600 mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? stat.titleAr : stat.titleEn}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                    <div className={`flex items-center mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {stat.isPositive ? (
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1 rtl:mr-0 rtl:ml-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500 mr-1 rtl:mr-0 rtl:ml-1" />
                      )}
                      <span className={`text-xs md:text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Section - Mobile */}
        <div className="md:hidden mb-6">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl border-0">
            <CardContent className="p-6 text-center">
              <h2 className={`text-xl font-bold mb-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'مرحباً بك في لوحة التحكم' : 'Welcome to Dashboard'}
              </h2>
              <p className={`text-purple-100 text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' 
                  ? 'إدارة جميع أقسام المطعم من مكان واحد'
                  : 'Manage all restaurant sections from one place'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {adminSections.map((section, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className={`flex items-start space-x-4 rtl:space-x-reverse mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <section.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h3 className={`font-bold text-gray-800 text-lg mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? section.titleAr : section.titleEn}
                    </h3>
                    <p className={`text-sm text-gray-500 leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? section.descriptionAr : section.descriptionEn}
                    </p>
                  </div>
                </div>
                
                <div className={`flex space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={() => router.push(section.href)}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white shadow-lg rounded-xl"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {language === 'ar' ? 'إدارة' : 'Manage'}
                  </Button>
                  
                  <Button
                    onClick={() => window.open(section.publicLink, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 hover:bg-gray-50 shadow-lg rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {language === 'ar' ? 'عرض' : 'View'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - Mobile */}
        <div className="md:hidden mt-8 space-y-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl border-0">
            <CardContent className="p-4">
              <Button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                <Database className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {isSeeding 
                  ? (language === 'ar' ? 'جاري التهيئة...' : 'Seeding...')
                  : (language === 'ar' ? 'تهيئة قاعدة البيانات' : 'Seed Database')
                }
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Welcome Section */}
        <div className="hidden md:block mt-8">
          <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-2xl border-0">
            <CardContent className="p-8">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className={`text-2xl font-bold mb-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'مرحباً بك في لوحة التحكم' : 'Welcome to Dashboard'}
                  </h2>
                  <p className={`text-purple-100 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' 
                      ? 'استخدم البطاقات أعلاه لإدارة جميع أقسام المطعم والموقع الإلكتروني بسهولة وفعالية.'
                      : 'Use the cards above to manage all restaurant sections and website content easily and effectively.'
                    }
                  </p>
                </div>
                <div className="hidden lg:block">
                  <Button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-lg px-6 py-3"
                  >
                    <Database className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isSeeding 
                      ? (language === 'ar' ? 'جاري التهيئة...' : 'Seeding...')
                      : (language === 'ar' ? 'تهيئة قاعدة البيانات' : 'Seed Database')
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications Dialog */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className={`max-w-2xl max-h-[80vh] overflow-hidden ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Bell className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {language === 'ar' ? 'الإشعارات والحجوزات' : 'Notifications & Reservations'}
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
                  </p>
                </div>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                </p>
              </div>
            ) : (
              reservations.map((reservation) => {
                const isNew = reservation.status === 'new';
                const isRecent = new Date(Date.now() - 24 * 60 * 60 * 1000) < reservation.createdAt;
                
                return (
                  <Card key={reservation.id} className={`${isNew && isRecent ? 'border-blue-500 bg-blue-50 shadow-lg' : 'shadow-md'} border-0`}>
                    <CardContent className="p-4">
                      <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center space-x-2 rtl:space-x-reverse mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h4 className={`font-semibold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                              {reservation.customerName}
                            </h4>
                            <Badge className={`text-xs ${getStatusColor(reservation.status)}`}>
                              {language === 'ar' 
                                ? (reservation.status === 'new' ? 'جديد' : reservation.status === 'confirmed' ? 'مؤكد' : 'ملغي')
                                : (reservation.status === 'new' ? 'New' : reservation.status === 'confirmed' ? 'Confirmed' : 'Cancelled')
                              }
                            </Badge>
                            {reservation.type === 'event' && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                {language === 'ar' ? 'حفلة' : 'Event'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className={`text-sm text-gray-600 space-y-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                            <p>
                              {language === 'ar' ? 'التاريخ:' : 'Date:'} {new Date(reservation.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')} - {reservation.time}
                            </p>
                            <p>
                              {language === 'ar' ? 'الضيوف:' : 'Guests:'} {reservation.guests}
                            </p>
                            <p className="text-xs text-gray-500">
                              {language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {formatDateTime(reservation.createdAt)}
                            </p>
                            {reservation.eventTitle && (
                              <p className="text-xs text-purple-600">
                                {language === 'ar' ? 'الفعالية:' : 'Event:'} {reservation.eventTitle}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {isNew && isRecent && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                        )}
                      </div>
                      
                      {/* Action Buttons for New Reservations */}
                      {reservation.status === 'new' && (
                        <div className={`flex gap-2 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button
                            onClick={() => handleReservationAction(reservation.id, 'confirm')}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg"
                            disabled={isSubmitting}
                          >
                            <UserCheck className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                            {language === 'ar' ? 'تأكيد' : 'Confirm'}
                          </Button>
                          <Button
                            onClick={() => handleReservationAction(reservation.id, 'cancel')}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-600 hover:bg-red-50 rounded-xl shadow-lg"
                            disabled={isSubmitting}
                          >
                            <UserX className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button
                            onClick={() => handleReservationAction(reservation.id, 'delete')}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 rounded-xl shadow-lg"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
            
            {/* View All Reservations Button */}
            {reservations.length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    router.push('/admin/reservations');
                  }}
                  variant="outline"
                  className="w-full rounded-xl shadow-lg"
                >
                  {language === 'ar' ? 'عرض جميع الحجوزات' : 'View All Reservations'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;