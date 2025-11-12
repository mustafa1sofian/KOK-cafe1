'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import Firestore functions
import {
  getReservations,
  getEventReservations,
  updateReservation,
  updateEventReservation,
  deleteReservation,
  deleteEventReservation,
  type Reservation as FirestoreReservation,
  type EventReservation as FirestoreEventReservation
} from '@/lib/firestore';

interface Reservation extends FirestoreReservation {
  // All properties inherited from FirestoreReservation
}

interface EventReservation extends FirestoreEventReservation {
  // All properties inherited from FirestoreEventReservation
}

type CombinedReservation = (Reservation | EventReservation) & {
  reservationType: 'table' | 'event';
};

const ReservationsManagementPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<CombinedReservation | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'confirmed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'table' | 'event'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [reservations, setReservations] = useState<CombinedReservation[]>([]);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Load reservations from Firestore
  const loadReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load both table and event reservations
      const [tableReservations, eventReservations] = await Promise.all([
        getReservations(),
        getEventReservations()
      ]);

      // Combine and mark reservation types
      const combinedReservations: CombinedReservation[] = [
        ...tableReservations.map(res => ({ ...res, reservationType: 'table' as const })),
        ...eventReservations.map(res => ({ ...res, reservationType: 'event' as const }))
      ];

      // Sort by creation date (newest first)
      combinedReservations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setReservations(combinedReservations);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل الحجوزات' : 'Error loading reservations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadReservations();
  }, []);

  const handleReservationAction = async (reservation: CombinedReservation, action: 'confirm' | 'cancel' | 'delete') => {
    try {
      setIsSubmitting(true);
      
      if (action === 'delete') {
        if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الحجز؟' : 'Are you sure you want to delete this reservation?')) {
          if (reservation.reservationType === 'table') {
            await deleteReservation(reservation.id);
          } else {
            await deleteEventReservation(reservation.id);
          }
        }
      } else {
        const updateData: any = { 
          status: action === 'confirm' ? 'confirmed' : 'cancelled' 
        };
        if (action === 'confirm') {
          updateData.confirmedAt = new Date();
        }
        
        if (reservation.reservationType === 'table') {
          await updateReservation(reservation.id, updateData);
        } else {
          await updateEventReservation(reservation.id, updateData);
        }
      }
      
      // Reload reservations
      await loadReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      setError(language === 'ar' ? 'حدث خطأ في تحديث الحجز' : 'Error updating reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailDialog = (reservation: CombinedReservation) => {
    setSelectedReservation(reservation);
    setIsDetailDialogOpen(true);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
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

  const getTypeColor = (type: string) => {
    return type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    const matchesType = typeFilter === 'all' || reservation.reservationType === typeFilter;
    const matchesSearch = searchTerm === '' || 
      reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل الحجوزات...' : 'Loading reservations...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className={`text-red-600 mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {error}
          </p>
          <Button onClick={loadReservations} variant="outline">
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إدارة الحجوزات' : 'Manage Reservations'}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'عرض وإدارة جميع حجوزات الطاولات والفعاليات' : 'View and manage all table and event reservations'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={loadReservations}
            variant="outline"
            disabled={isSubmitting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${isSubmitting ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Filters */}
        <div className={`flex flex-col md:flex-row gap-4 mb-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث بالاسم، الهاتف، أو البريد الإلكتروني...' : 'Search by name, phone, or email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right font-arabic' : 'pl-10 pr-4 text-left font-english'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isRTL ? 'text-right font-arabic' : 'text-left font-english'
            }`}
          >
            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
            <option value="new">{language === 'ar' ? 'جديد' : 'New'}</option>
            <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isRTL ? 'text-right font-arabic' : 'text-left font-english'
            }`}
          >
            <option value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
            <option value="table">{language === 'ar' ? 'حجز طاولة' : 'Table Reservation'}</option>
            <option value="event">{language === 'ar' ? 'حجز فعالية' : 'Event Reservation'}</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Reservations'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{reservations.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'حجوزات جديدة' : 'New Reservations'}
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reservations.filter(r => r.status === 'new').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'حجوزات مؤكدة' : 'Confirmed'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {reservations.filter(r => r.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {language === 'ar' ? 'حجوزات ملغية' : 'Cancelled'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {reservations.filter(r => r.status === 'cancelled').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد حجوزات' : 'No reservations found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center space-x-3 rtl:space-x-reverse mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h3 className={`text-lg font-semibold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                          {reservation.customerName}
                        </h3>
                        <Badge className={`text-xs ${getStatusColor(reservation.status)}`}>
                          {language === 'ar' 
                            ? (reservation.status === 'new' ? 'جديد' : reservation.status === 'confirmed' ? 'مؤكد' : 'ملغي')
                            : (reservation.status === 'new' ? 'New' : reservation.status === 'confirmed' ? 'Confirmed' : 'Cancelled')
                          }
                        </Badge>
                        <Badge className={`text-xs ${getTypeColor(reservation.reservationType)}`}>
                          {language === 'ar' 
                            ? (reservation.reservationType === 'event' ? 'فعالية' : 'طاولة')
                            : (reservation.reservationType === 'event' ? 'Event' : 'Table')
                          }
                        </Badge>
                      </div>
                      
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-orange-600" />
                          <span>
                            {'date' in reservation 
                              ? new Date(reservation.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                              : 'N/A'
                            } - {'time' in reservation ? reservation.time : 'N/A'}
                          </span>
                        </div>
                        
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Users className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-orange-600" />
                          <span>
                            {'guests' in reservation 
                              ? `${reservation.guests} ${language === 'ar' ? 'ضيف' : 'guests'}`
                              : 'seats' in reservation 
                                ? `${reservation.seats} ${language === 'ar' ? 'مقعد' : 'seats'}`
                                : 'N/A'
                            }
                          </span>
                        </div>
                        
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-orange-600" />
                          <span>{reservation.phone}</span>
                        </div>
                        
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-orange-600" />
                          <span>{formatDateTime(reservation.createdAt)}</span>
                        </div>
                      </div>

                      {reservation.reservationType === 'event' && 'eventTitle' in reservation && (
                        <div className={`mt-2 text-sm text-purple-600 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                          {language === 'ar' ? 'الفعالية:' : 'Event:'} {reservation.eventTitle}
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button
                        onClick={() => openDetailDialog(reservation)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {reservation.status === 'new' && (
                        <>
                          <Button
                            onClick={() => handleReservationAction(reservation, 'confirm')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSubmitting}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleReservationAction(reservation, 'cancel')}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            disabled={isSubmitting}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        onClick={() => handleReservationAction(reservation, 'delete')}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`max-w-2xl ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'تفاصيل الحجز' : 'Reservation Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className={`font-semibold text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.customerName}
                    </p>
                  </div>
                  
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.phone}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="space-y-4">
                <h4 className={`font-semibold text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'تفاصيل الحجز' : 'Reservation Details'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {'date' in selectedReservation && (
                    <div>
                      <Label className={isRTL ? 'text-right' : 'text-left'}>
                        {language === 'ar' ? 'التاريخ' : 'Date'}
                      </Label>
                      <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                        {new Date(selectedReservation.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  )}
                  
                  {'time' in selectedReservation && (
                    <div>
                      <Label className={isRTL ? 'text-right' : 'text-left'}>
                        {language === 'ar' ? 'الوقت' : 'Time'}
                      </Label>
                      <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                        {selectedReservation.time}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'عدد الضيوف' : 'Guests'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {'guests' in selectedReservation 
                        ? selectedReservation.guests
                        : 'seats' in selectedReservation 
                          ? selectedReservation.seats
                          : 'N/A'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'النوع' : 'Type'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' 
                        ? (selectedReservation.reservationType === 'event' ? 'حجز فعالية' : 'حجز طاولة')
                        : (selectedReservation.reservationType === 'event' ? 'Event Reservation' : 'Table Reservation')
                      }
                    </p>
                  </div>
                </div>

                {selectedReservation.reservationType === 'event' && 'eventTitle' in selectedReservation && (
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'الفعالية' : 'Event'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.eventTitle}
                    </p>
                  </div>
                )}

                {'totalPrice' in selectedReservation && selectedReservation.totalPrice && (
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                    </Label>
                    <p className={`font-medium text-green-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.totalPrice} ر.س
                    </p>
                  </div>
                )}

                {selectedReservation.notes && (
                  <div>
                    <Label className={isRTL ? 'text-right' : 'text-left'}>
                      {language === 'ar' ? 'ملاحظات' : 'Notes'}
                    </Label>
                    <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedReservation.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedReservation.status === 'new' && (
                <div className={`flex gap-3 pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={() => {
                      handleReservationAction(selectedReservation, 'confirm');
                      setIsDetailDialogOpen(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting}
                  >
                    <UserCheck className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Reservation'}
                  </Button>
                  <Button
                    onClick={() => {
                      handleReservationAction(selectedReservation, 'cancel');
                      setIsDetailDialogOpen(false);
                    }}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    disabled={isSubmitting}
                  >
                    <UserX className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Reservation'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationsManagementPage;