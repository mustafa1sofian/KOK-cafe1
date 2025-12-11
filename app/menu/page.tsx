'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Coffee, Wind, Loader2, AlertCircle, X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import OfficialDocuments from '@/components/OfficialDocuments';

// Import Firestore functions
import {
  getCategories,
  getSubcategories,
  getMenuItems,
  type Category as FirestoreCategory,
  type Subcategory as FirestoreSubcategory,
  type MenuItem as FirestoreMenuItem
} from '@/lib/firestore';

interface MenuItem extends FirestoreMenuItem {
  // All properties inherited from FirestoreMenuItem
}

interface Subcategory extends FirestoreSubcategory {
  items: MenuItem[];
}

interface Category extends FirestoreCategory {
  subcategories: Subcategory[];
}

const MenuPage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = categoryScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      categoryScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Open item details modal
  const openItemDetails = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    document.body.style.overflow = 'auto';
  };

  // Load data from Firestore
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get categories
      const categoriesData = await getCategories();

      // Get all subcategories and menu items
      const subcategoriesData = await getSubcategories();
      const menuItemsData = await getMenuItems();

      // Organize data into nested structure
      const organizedCategories: Category[] = categoriesData.map(category => {
        const categorySubcategories = subcategoriesData
          .filter(sub => sub.categoryId === category.id)
          .map(subcategory => {
            const subcategoryItems = menuItemsData
              .filter(item => item.subcategoryId === subcategory.id && item.isAvailable);
            return {
              ...subcategory,
              items: subcategoryItems
            };
          });

        return {
          ...category,
          subcategories: categorySubcategories
        };
      });

      setCategories(organizedCategories);

      // Set first category as active if none selected
      if (organizedCategories.length > 0 && !activeCategory) {
        setActiveCategory(organizedCategories[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Update active category when categories change
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const activeCategories = categories.find(cat => cat.id === activeCategory);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'جاري تحميل القائمة...' : 'Loading menu...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className={`text-red-600 mb-4 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {error}
            </p>
            <Button onClick={loadData} variant="outline">
              {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {language === 'ar' ? 'لا توجد عناصر في القائمة حالياً' : 'No menu items available at the moment'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main className="pt-20">
        {/* Hero Section - Light Glass */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(96,165,250,0.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
          <div className="container mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-10 relative z-10">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                <span className={`${isRTL ? 'font-arabic' : 'font-english'} ml-2 rtl:ml-0 rtl:mr-2`}>
                  {language === 'ar' ? 'رجوع' : 'Back'}
                </span>
              </Button>
            </div>
            <div className="text-center">
              <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-200 via-sky-300 to-blue-100 bg-clip-text text-transparent mb-3 drop-shadow-sm ${isRTL ? 'font-arabic' : 'font-english'
                }`}>
                {language === 'ar' ? 'قائمة الطعام' : 'Our Menu'}
              </h1>
              <p className={`text-gray-600 text-sm md:text-base max-w-2xl mx-auto ${isRTL ? 'font-arabic' : 'font-english'
                }`}>
                {language === 'ar'
                  ? 'اكتشف مجموعة رائعة من الأطباق المميزة'
                  : 'Discover our exquisite collection of signature dishes'
                }
              </p>
            </div>
          </div>
        </section>

        {/* Official Documents */}
        <OfficialDocuments />

        {/* Menu Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Category Tabs - Modern Horizontal Scroll with Arrows */}
            <div className="mb-6 relative group">
              <h3 className={`text-base md:text-lg font-bold text-gray-800 mb-3 px-1 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                {language === 'ar' ? 'الفئات الرئيسية' : 'Main Categories'}
              </h3>

              <div className="flex items-center gap-2">
                {/* Left Arrow */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollCategories(isRTL ? 'right' : 'left')}
                  className="hidden md:flex flex-shrink-0 rounded-full border-gray-200 hover:bg-gray-100 hover:text-blue-600"
                >
                  {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>

                <div
                  ref={categoryScrollRef}
                  className="flex gap-2 md:gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory flex-grow"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setActiveSubcategory('');
                      }}
                      variant="ghost"
                      className={`snap-center flex-shrink-0 min-w-[150px] md:min-w-[180px] h-12 md:h-14 border ${activeCategory === category.id
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200 hover:text-blue-700'
                        } ${isRTL ? 'font-arabic' : 'font-english'} transition-all duration-300 font-semibold rounded-xl backdrop-blur-md`}
                    >
                      {category.icon === 'utensils' ? <Utensils className="w-4 h-4 md:w-5 md:h-5 mr-2 rtl:mr-0 rtl:ml-2" /> :
                        category.icon === 'coffee' ? <Coffee className="w-4 h-4 md:w-5 md:h-5 mr-2 rtl:mr-0 rtl:ml-2" /> :
                          <Wind className="w-4 h-4 md:w-5 md:h-5 mr-2 rtl:mr-0 rtl:ml-2" />}
                      <span className="text-sm md:text-base">{language === 'ar' ? category.nameAr : category.nameEn}</span>
                    </Button>
                  ))}
                </div>

                {/* Right Arrow */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollCategories(isRTL ? 'left' : 'right')}
                  className="hidden md:flex flex-shrink-0 rounded-full border-gray-200 hover:bg-gray-100 hover:text-blue-600"
                >
                  {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Subcategory Tabs - Modern Chips Design */}
            {activeCategories && activeCategories.subcategories.length > 0 && (
              <div className="mb-8">
                <h3 className={`text-sm md:text-base font-semibold text-gray-700 mb-3 px-1 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                  {language === 'ar' ? 'الفئات الفرعية' : 'Subcategories'}
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                  {activeCategories.subcategories.map((subcategory) => (
                    <Button
                      key={subcategory.id}
                      onClick={() => setActiveSubcategory(subcategory.id)}
                      variant="ghost"
                      className={`snap-center flex-shrink-0 px-4 md:px-5 h-10 md:h-11 border ${activeSubcategory === subcategory.id
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200 hover:text-blue-700'
                        } ${isRTL ? 'font-arabic' : 'font-english'} transition-all duration-300 font-medium rounded-full text-sm backdrop-blur-md`}
                    >
                      {language === 'ar' ? subcategory.nameAr : subcategory.nameEn}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items - Show only selected subcategory */}
            {activeCategories && activeSubcategory && (
              <div>
                {activeCategories.subcategories
                  .filter(sub => sub.id === activeSubcategory)
                  .map((subcategory) => (
                    <div key={subcategory.id}>
                      {/* Subcategory Header */}
                      <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h2 className={`text-2xl md:text-3xl font-bold text-black ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                          }`}>
                          {language === 'ar' ? subcategory.nameAr : subcategory.nameEn}
                        </h2>
                      </div>

                      {/* Menu Items Grid - Mobile First (2 Columns) */}
                      {subcategory.items.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                          {subcategory.items.map((item) => (
                            <Card
                              key={item.id}
                              className="group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] border border-gray-200 overflow-hidden bg-white cursor-pointer rounded-2xl"
                              onClick={() => openItemDetails(item)}
                            >
                              <div className="relative">
                                {/* Item Image - Clean & Simple */}
                                <div className="aspect-square bg-gradient-to-br from-gray-50 via-white to-white flex items-center justify-center overflow-hidden">
                                  {item.imageUrl ? (
                                    <>
                                      <img
                                        src={item.imageUrl}
                                        alt={language === 'ar' ? item.nameAr : item.nameEn}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                      />
                                      {/* Subtle overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </>
                                  ) : (
                                    <Utensils className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                                  )}
                                </div>

                                {/* Featured Badge - Compact */}
                                {item.isFeatured && (
                                  <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
                                    <span className="bg-white/90 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
                                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                      {language === 'ar' ? 'مميز' : 'Hot'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <CardContent className="p-2.5 md:p-3 text-gray-900">
                                {/* Item Name - Clear & Bold */}
                                <h3 className={`text-sm md:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight min-h-[2.5rem] ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                                  }`}>
                                  {language === 'ar' ? item.nameAr : item.nameEn}
                                </h3>

                                {/* Price - Solid Dark Colors */}
                                <div className={`flex items-center gap-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-base md:text-lg font-bold text-blue-700">
                                    {item.price}
                                  </span>
                                  <span className={`text-xs text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                                    ر.س
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                            {language === 'ar' ? 'لا توجد عناصر في هذه الفئة حالياً' : 'No items available in this category'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Show all items when no subcategory selected */}
            {activeCategories && !activeSubcategory && (
              <div className="text-center py-16">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'اختر فئة فرعية لعرض العناصر' : 'Select a subcategory to view items'}
                </p>
              </div>
            )}

            {/* Empty active category */}
            {activeCategories && activeCategories.subcategories.length === 0 && (
              <div className="text-center py-16">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className={`text-gray-600 text-lg ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {language === 'ar' ? 'لا توجد فئات فرعية في هذه الفئة حالياً' : 'No subcategories available in this category'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Item Details Modal */}
      {isModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={closeModal}
        >
          <div
            className="relative w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-h-[85vh] md:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full transition-all duration-300 group"
            >
              <X className="w-5 h-5 text-gray-800 group-hover:text-black" />
            </button>

            <div className="overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
              {/* Item Image */}
              <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={language === 'ar' ? selectedItem.nameAr : selectedItem.nameEn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Featured Badge */}
                {selectedItem.isFeatured && (
                  <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                    <span className="bg-white/90 text-blue-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      {language === 'ar' ? 'طبق مميز' : 'Featured Dish'}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 md:p-6 bg-white text-gray-900">
                {/* Item Name & Price */}
                <div className={`flex items-start justify-between gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <h2 className={`text-xl md:text-2xl font-bold text-gray-900 mb-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? selectedItem.nameAr : selectedItem.nameEn}
                    </h2>
                  </div>

                  {/* Price Badge - Light Background */}
                  <div className="flex-shrink-0 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                    <div className={`text-xs text-gray-500 mb-1 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                      {language === 'ar' ? 'السعر' : 'Price'}
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {selectedItem.price}
                    </div>
                    <div className={`text-xs text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'ريال سعودي' : 'SAR'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(selectedItem.descriptionEn || selectedItem.descriptionAr) && (
                  <div className="mb-6">
                    <h3 className={`text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </h3>
                    <p className={`text-gray-600 text-sm md:text-base leading-relaxed ${isRTL ? 'font-arabic text-right' : 'font-english text-left'
                      }`}>
                      {language === 'ar' ? selectedItem.descriptionAr : selectedItem.descriptionEn}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div>
                  <Button
                    onClick={closeModal}
                    className={`w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 ${isRTL ? 'font-arabic' : 'font-english'
                      }`}
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;