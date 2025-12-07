'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  UserX,
  MoreHorizontal
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">{language === 'ar' ? 'ملغي' : 'Cancelled'}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">{language === 'ar' ? 'جديد' : 'New'}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'event'
      ? <Badge variant="outline" className="border-purple-200 text-purple-700">{language === 'ar' ? 'فعالية' : 'Event'}</Badge>
      : <Badge variant="outline" className="border-blue-200 text-blue-700">{language === 'ar' ? 'طاولة' : 'Table'}</Badge>;
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

  // Calculate stats
  const stats = {
    total: reservations.length,
    new: reservations.filter(r => r.status === 'new').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50/50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-900" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل الحجوزات...' : 'Loading reservations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50/50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 sticky top-0 z-10">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'إدارة الحجوزات' : 'Manage Reservations'}
              </h1>
              <p className={`text-sm text-gray-500 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {language === 'ar' ? 'متابعة وإدارة جميع الحجوزات والفعاليات في مكان واحد' : 'Track and manage all table and event reservations'}
              </p>
            </div>
          </div>

          <Button
            onClick={loadReservations}
            variant="outline"
            disabled={isSubmitting}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">{language === 'ar' ? 'إجمالي الحجوزات' : 'Total Requests'}</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium mb-1">{language === 'ar' ? 'طلبات جديدة' : 'New Pending'}</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.new}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">{language === 'ar' ? 'مؤكدة' : 'Confirmed'}</p>
              <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium mb-1">{language === 'ar' ? 'ملغية' : 'Cancelled'}</p>
              <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`} />
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث باسم، رقم، أو إيميل العميل...' : 'Search by customer name, phone, or email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                  className={`text-xs h-8 ${typeFilter === 'all' ? 'bg-gray-100 text-gray-900 font-medium shadow-sm' : 'text-gray-600'}`}
                >
                  {language === 'ar' ? 'الكل' : 'All'}
                </Button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter('table')}
                  className={`text-xs h-8 ${typeFilter === 'table' ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' : 'text-gray-600'}`}
                >
                  {language === 'ar' ? 'طاولات' : 'Tables'}
                </Button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter('event')}
                  className={`text-xs h-8 ${typeFilter === 'event' ? 'bg-purple-50 text-purple-700 font-medium shadow-sm' : 'text-gray-600'}`}
                >
                  {language === 'ar' ? 'فعاليات' : 'Events'}
                </Button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                <option value="new">{language === 'ar' ? 'طلبات جديدة' : 'New Requests'}</option>
                <option value="confirmed">{language === 'ar' ? 'حجوزات مؤكدة' : 'Confirmed'}</option>
                <option value="cancelled">{language === 'ar' ? 'حجوزات ملغية' : 'Cancelled'}</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          {filteredReservations.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{language === 'ar' ? 'لا توجد نتائج' : 'No reservations found'}</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {language === 'ar' ? 'لم يتم العثور على أي حجوزات تطابق بحثك. جرب تغيير الفلاتر.' : 'We couldn\'t find any reservations matching your search. Try adjusting the filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{language === 'ar' ? 'الوقت والتاريخ' : 'Date & Time'}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{language === 'ar' ? 'العدد' : 'Guests'}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className={`w-[100px] ${isRTL ? 'text-right' : 'text-left'}`}>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="cursor-pointer hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-medium" onClick={() => openDetailDialog(reservation)}>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-semibold">{reservation.customerName}</span>
                        <span className="text-xs text-gray-500">{reservation.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => openDetailDialog(reservation)}>
                      {getTypeBadge(reservation.reservationType)}
                    </TableCell>
                    <TableCell onClick={() => openDetailDialog(reservation)}>
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-900">
                          {'date' in reservation
                            ? new Date(reservation.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                            : 'N/A'
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          {'time' in reservation ? reservation.time : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => openDetailDialog(reservation)}>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                          {'guests' in reservation
                            ? reservation.guests
                            : 'seats' in reservation
                              ? reservation.seats
                              : '-'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => openDetailDialog(reservation)}>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openDetailDialog(reservation); }}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Enhanced Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`max-w-3xl ${isRTL ? 'font-arabic' : 'font-english'}`}>
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className={`text-xl font-bold flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {language === 'ar' ? 'تفاصيل الحجز' : 'Reservation Details'}
              {selectedReservation && getStatusBadge(selectedReservation.status)}
            </DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'معلومات كاملة عن الطلب والعميل' : 'Full details about the request and customer'}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-8">
              {/* 1. Customer Details */}
              <section>
                <h4 className={`text-sm uppercase tracking-wider text-gray-500 font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'بيانات العميل' : 'Customer Details'}
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الاسم' : 'Full Name'}</p>
                    <p className="font-medium text-gray-900">{selectedReservation.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <p className="font-medium text-gray-900" dir="ltr">{selectedReservation.phone}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <p className="font-medium text-gray-900">{selectedReservation.email}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Reservation Info */}
              <section>
                <h4 className={`text-sm uppercase tracking-wider text-gray-500 font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Information'}
                </h4>
                <div className="border rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'نوع الحجز' : 'Type'}</p>
                    <p className="font-semibold text-gray-900">
                      {selectedReservation.reservationType === 'event'
                        ? (language === 'ar' ? 'حفلة / فعالية' : 'Event')
                        : (language === 'ar' ? 'عشاء / طاولة' : 'Dining Table')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-gray-900">
                        {'date' in selectedReservation
                          ? new Date(selectedReservation.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الوقت' : 'Time'}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <p className="font-semibold text-gray-900">
                        {'time' in selectedReservation ? selectedReservation.time : '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الضيوف' : 'Guests'}</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <p className="font-semibold text-gray-900">
                        {'guests' in selectedReservation ? selectedReservation.guests : selectedReservation.seats}
                      </p>
                    </div>
                  </div>
                  {/* Total Price if exists */}
                  {'totalPrice' in selectedReservation && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
                      <p className="font-bold text-green-600 text-lg">
                        {selectedReservation.totalPrice} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </p>
                    </div>
                  )}
                  {/* Event Title if exists */}
                  {selectedReservation.reservationType === 'event' && 'eventTitle' in selectedReservation && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'اسم الفعالية' : 'Event Name'}</p>
                      <Badge variant="secondary" className="text-purple-700 bg-purple-50">
                        {selectedReservation.eventTitle}
                      </Badge>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Notes */}
              {selectedReservation.notes && (
                <section>
                  <h4 className={`text-sm uppercase tracking-wider text-gray-500 font-bold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                  </h4>
                  <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-sm text-gray-700 leading-relaxed">
                    {selectedReservation.notes}
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              <DialogFooter className={`gap-3 pt-6 border-t mt-4 flex-col sm:flex-row ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                {selectedReservation.status === 'new' ? (
                  <>
                    <Button
                      onClick={() => {
                        handleReservationAction(selectedReservation, 'confirm');
                        setIsDetailDialogOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                      disabled={isSubmitting}
                    >
                      <UserCheck className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {language === 'ar' ? 'تأكيد الحجز' : 'Approve Request'}
                    </Button>
                    <Button
                      onClick={() => {
                        handleReservationAction(selectedReservation, 'cancel');
                        setIsDetailDialogOpen(false);
                      }}
                      variant="destructive"
                      className="flex-1 sm:flex-none"
                      disabled={isSubmitting}
                    >
                      <UserX className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {language === 'ar' ? 'رفض / إلغاء' : 'Reject Request'}
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 flex justify-between items-center w-full">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {selectedReservation.status === 'confirmed' ? (
                        <><CheckCircle className="w-4 h-4 text-green-500" /> {language === 'ar' ? 'تم تأكيد هذا الحجز مسبقاً' : 'This request is already confirmed'}</>
                      ) : (
                        <><XCircle className="w-4 h-4 text-red-500" /> {language === 'ar' ? 'تم إلغاء هذا الحجز مسبقاً' : 'This request is cancelled'}</>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        if (confirm(language === 'ar' ? 'حذف نهائي؟' : 'Delete permanently?')) {
                          handleReservationAction(selectedReservation, 'delete');
                          setIsDetailDialogOpen(false);
                        }
                      }}
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حذف من السجل' : 'Delete Record'}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationsManagementPage;