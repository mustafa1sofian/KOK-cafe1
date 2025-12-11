'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Utensils,
  Coffee,
  Wind,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Import Firestore functions
import {
  getCategories,
  getSubcategories,
  getMenuItems,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type Category as FirestoreCategory,
  type Subcategory as FirestoreSubcategory,
  type MenuItem as FirestoreMenuItem
} from '@/lib/firestore';

// Import ImgBB functions
import {
  uploadImageToImgBB,
  validateImageFile
} from '@/lib/imgbb';

// Extended interfaces for UI display (with nested data)
interface MenuItem extends FirestoreMenuItem {
  // All properties inherited from FirestoreMenuItem
}

interface Subcategory extends FirestoreSubcategory {
  items: MenuItem[];
}

interface Category extends FirestoreCategory {
  subcategories: Subcategory[];
}

const FullMenuManagePage = () => {
  const { language, isRTL } = useLanguage();
  const router = useRouter();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  // Action states
  const [categoryDialogAction, setCategoryDialogAction] = useState<'add' | 'edit'>('add');
  const [subcategoryDialogAction, setSubcategoryDialogAction] = useState<'add' | 'edit'>('add');
  const [itemDialogAction, setItemDialogAction] = useState<'add' | 'edit'>('add');

  // Selected items
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form data
  const [categoryFormData, setCategoryFormData] = useState({
    nameEn: '',
    nameAr: '',
    icon: 'utensils'
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    nameEn: '',
    nameAr: '',
    categoryId: ''
  });

  const [itemFormData, setItemFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
    subcategoryId: '',
    imageFile: null as File | null,
    imageUrl: '',
    isAvailable: true,
    isFeatured: false
  });

  // UI states
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const getFeaturedCount = () =>
    categories.reduce((count, category) => {
      const subFeatured = category.subcategories.reduce((subCount, sub) => {
        return subCount + sub.items.filter(item => item.isFeatured).length;
      }, 0);
      return count + subFeatured;
    }, 0);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

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
            const subcategoryItems = menuItemsData.filter(item => item.subcategoryId === subcategory.id);
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

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Category functions
  const openCategoryDialog = (action: 'add' | 'edit', category?: Category) => {
    setCategoryDialogAction(action);
    setSelectedCategory(category || null);

    if (action === 'edit' && category) {
      setCategoryFormData({
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        icon: category.icon
      });
    } else {
      setCategoryFormData({
        nameEn: '',
        nameAr: '',
        icon: 'utensils'
      });
    }

    setIsCategoryDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleCategorySave = async () => {
    if (!categoryFormData.nameEn.trim() || !categoryFormData.nameAr.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryDialogAction === 'add') {
        await addCategory({
          nameEn: categoryFormData.nameEn.trim(),
          nameAr: categoryFormData.nameAr.trim(),
          icon: categoryFormData.icon,
          order: categories.length + 1
        });
      } else if (selectedCategory) {
        await updateCategory(selectedCategory.id, {
          nameEn: categoryFormData.nameEn.trim(),
          nameAr: categoryFormData.nameAr.trim(),
          icon: categoryFormData.icon
        });
      }

      setSubmitStatus('success');
      await loadData(); // Reload data

      setTimeout(() => {
        setIsCategoryDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving category:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    const confirmed = confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟ سيتم حذف جميع الفئات الفرعية والعناصر.' : 'Are you sure you want to delete? All subcategories and items will be deleted.');

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      // ✅ Optimistic Update
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));

      toast.loading(language === 'ar' ? 'جاري الحذف...' : 'Deleting...', { id });

      await deleteCategory(id);

      toast.success(language === 'ar' ? 'تم حذف الفئة بنجاح!' : 'Category deleted successfully!', { id });

    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في حذف الفئة' : 'Error deleting category', { id });
      await loadData(); // Reload on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subcategory functions
  const openSubcategoryDialog = (action: 'add' | 'edit', categoryId: string, subcategory?: Subcategory) => {
    setSubcategoryDialogAction(action);
    setSelectedSubcategory(subcategory || null);

    if (action === 'edit' && subcategory) {
      setSubcategoryFormData({
        nameEn: subcategory.nameEn,
        nameAr: subcategory.nameAr,
        categoryId: subcategory.categoryId
      });
    } else {
      setSubcategoryFormData({
        nameEn: '',
        nameAr: '',
        categoryId: categoryId
      });
    }

    setIsSubcategoryDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleSubcategorySave = async () => {
    if (!subcategoryFormData.nameEn.trim() || !subcategoryFormData.nameAr.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const category = categories.find(cat => cat.id === subcategoryFormData.categoryId);
      const order = category ? category.subcategories.length + 1 : 1;

      if (subcategoryDialogAction === 'add') {
        await addSubcategory({
          nameEn: subcategoryFormData.nameEn.trim(),
          nameAr: subcategoryFormData.nameAr.trim(),
          categoryId: subcategoryFormData.categoryId,
          order
        });
      } else if (selectedSubcategory) {
        await updateSubcategory(selectedSubcategory.id, {
          nameEn: subcategoryFormData.nameEn.trim(),
          nameAr: subcategoryFormData.nameAr.trim(),
          categoryId: subcategoryFormData.categoryId
        });
      }

      setSubmitStatus('success');
      await loadData(); // Reload data

      setTimeout(() => {
        setIsSubcategoryDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error saving subcategory:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubcategoryDelete = async (subcategoryId: string) => {
    const confirmed = confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟ سيتم حذف جميع العناصر.' : 'Are you sure you want to delete? All items will be deleted.');

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      // ✅ Optimistic Update
      setCategories(prevCategories =>
        prevCategories.map(category => ({
          ...category,
          subcategories: category.subcategories.filter(sub => sub.id !== subcategoryId)
        }))
      );

      toast.loading(language === 'ar' ? 'جاري الحذف...' : 'Deleting...', { id: subcategoryId });

      await deleteSubcategory(subcategoryId);

      toast.success(language === 'ar' ? 'تم حذف الفئة الفرعية بنجاح!' : 'Subcategory deleted successfully!', { id: subcategoryId });

    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في حذف الفئة الفرعية' : 'Error deleting subcategory', { id: subcategoryId });
      await loadData(); // Reload on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Item functions
  const openItemDialog = (action: 'add' | 'edit', subcategoryId: string, item?: MenuItem) => {
    setItemDialogAction(action);
    setSelectedItem(item || null);

    if (action === 'edit' && item) {
      setItemFormData({
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEn: item.descriptionEn,
        descriptionAr: item.descriptionAr,
        price: item.price.toString(),
        subcategoryId: item.subcategoryId,
        imageFile: null,
        imageUrl: item.imageUrl || '',
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured
      });
    } else {
      setItemFormData({
        nameEn: '',
        nameAr: '',
        descriptionEn: '',
        descriptionAr: '',
        price: '',
        subcategoryId: subcategoryId,
        imageFile: null,
        imageUrl: '',
        isAvailable: true,
        isFeatured: false
      });
    }

    setIsItemDialogOpen(true);
    setSubmitStatus('idle');
  };

  const handleItemSave = async () => {
    if (!itemFormData.nameEn.trim() || !itemFormData.nameAr.trim() || !itemFormData.price.trim()) {
      setSubmitStatus('error');
      return;
    }

    // Enforce max 6 featured dishes
    const featuredCount = getFeaturedCount();
    const wasFeatured = selectedItem?.isFeatured ?? false;
    const projectingToFeatured = itemFormData.isFeatured && !wasFeatured;
    if (projectingToFeatured && featuredCount >= 6) {
      setSubmitStatus('error');
      toast.error(
        language === 'ar'
          ? 'لا يمكن إضافة أكثر من ٦ أطباق مميزة. أزل أحد الأطباق المميزة أولاً.'
          : 'You cannot have more than 6 featured dishes. Remove one first.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = itemFormData.imageUrl;

      // Upload image if a new file is selected
      if (itemFormData.imageFile) {
        // Validate image file
        const validation = validateImageFile(itemFormData.imageFile);
        if (!validation.isValid) {
          setError(validation.error || 'ملف غير صالح');
          setSubmitStatus('error');
          return;
        }

        // Upload to ImgBB
        imageUrl = await uploadImageToImgBB(itemFormData.imageFile);
      }

      const subcategory = categories
        .flatMap(cat => cat.subcategories)
        .find(sub => sub.id === itemFormData.subcategoryId);
      const order = subcategory ? subcategory.items.length + 1 : 1;

      const itemData = {
        nameEn: itemFormData.nameEn.trim(),
        nameAr: itemFormData.nameAr.trim(),
        descriptionEn: itemFormData.descriptionEn.trim(),
        descriptionAr: itemFormData.descriptionAr.trim(),
        price: parseFloat(itemFormData.price),
        subcategoryId: itemFormData.subcategoryId,
        imageUrl,
        isAvailable: itemFormData.isAvailable,
        isFeatured: itemFormData.isFeatured,
        order
      };

      const toastId = 'item-save';
      toast.loading(language === 'ar' ? 'جاري الحفظ...' : 'Saving...', { id: toastId });

      if (itemDialogAction === 'add') {
        const newItemId = await addMenuItem(itemData);

        // ✅ Optimistic Update للإضافة
        setCategories(prevCategories =>
          prevCategories.map(category => ({
            ...category,
            subcategories: category.subcategories.map(subcat =>
              subcat.id === itemFormData.subcategoryId
                ? { ...subcat, items: [...subcat.items, { ...itemData, id: newItemId } as MenuItem] }
                : subcat
            )
          }))
        );

        toast.success(language === 'ar' ? 'تم إضافة الطبق بنجاح!' : 'Item added successfully!', { id: toastId });

      } else if (selectedItem) {
        // Note: ImgBB images cannot be deleted via API, they expire automatically
        await updateMenuItem(selectedItem.id, itemData);

        // ✅ Optimistic Update للتعديل
        setCategories(prevCategories =>
          prevCategories.map(category => ({
            ...category,
            subcategories: category.subcategories.map(subcat => ({
              ...subcat,
              items: subcat.items.map(item =>
                item.id === selectedItem.id
                  ? { ...item, ...itemData }
                  : item
              )
            }))
          }))
        );

        toast.success(language === 'ar' ? 'تم تحديث الطبق بنجاح!' : 'Item updated successfully!', { id: toastId });
      }

      setSubmitStatus('success');

      setTimeout(() => {
        setIsItemDialogOpen(false);
        setSubmitStatus('idle');
      }, 1000);

    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في الحفظ' : 'Error saving item');
      setSubmitStatus('error');
      await loadData(); // Reload on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemDelete = async (itemId: string) => {
    // استخدام toast بدلاً من confirm
    const confirmed = confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?');

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      // Find the item and its subcategory
      let deletedItem: MenuItem | undefined;
      let parentSubcategoryId: string | undefined;

      for (const cat of categories) {
        for (const sub of cat.subcategories) {
          const item = sub.items.find(i => i.id === itemId);
          if (item) {
            deletedItem = item;
            parentSubcategoryId = sub.id;
            break;
          }
        }
        if (deletedItem) break;
      }

      if (!deletedItem || !parentSubcategoryId) {
        throw new Error('Item not found');
      }

      // ✅ Optimistic Update: تحديث الـ UI فوراً
      setCategories(prevCategories =>
        prevCategories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(subcat =>
            subcat.id === parentSubcategoryId
              ? { ...subcat, items: subcat.items.filter(item => item.id !== itemId) }
              : subcat
          )
        }))
      );

      // عرض toast loading
      toast.loading(language === 'ar' ? 'جاري الحذف...' : 'Deleting...', { id: itemId });

      // ثم نحذف من Firestore في الخلفية
      await deleteMenuItem(itemId);

      // Note: ImgBB images cannot be deleted via API, they expire automatically

      // عرض toast success
      toast.success(language === 'ar' ? 'تم الحذف بنجاح!' : 'Deleted successfully!', { id: itemId });

    } catch (error) {
      console.error('Error deleting item:', error);

      // في حالة الخطأ، نعيد تحميل البيانات للتأكد من التزامن
      toast.error(language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting item', { id: itemId });
      await loadData();

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemFormData(prev => ({ ...prev, imageFile: file }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setItemFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const iconOptions = [
    { value: 'utensils', label: language === 'ar' ? 'أطباق' : 'Dishes' },
    { value: 'coffee', label: language === 'ar' ? 'مشروبات' : 'Beverages' },
    { value: 'wind', label: language === 'ar' ? 'شيشة' : 'Shisha' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
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
          <Button onClick={loadData} variant="outline">
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 mb-8 -mx-8 -mt-8">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'font-arabic' : ''}`}>
              {language === 'ar' ? 'إدارة القائمة الكاملة' : 'Full Menu Management'}
            </h1>
            <p className={`text-gray-500 mt-1 ${isRTL ? 'font-arabic' : ''}`}>
              {language === 'ar' ? 'إدارة الفئات والفئات الفرعية وعناصر القائمة' : 'Manage categories, subcategories and menu items'}
            </p>
          </div>

          <Button
            onClick={() => openCategoryDialog('add')}
            className="bg-black hover:bg-gray-800 text-white"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إضافة فئة' : 'Add Category'}
          </Button>
        </div>
      </div>

      {/* Content */ }
      <div className="space-y-6">
    {categories.map((category) => (
      <Card key={category.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-white border-b border-gray-100 py-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={() => toggleCategory(category.id)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1"
              >
                {expandedCategories.has(category.id) ?
                  <ChevronDown className="w-5 h-5" /> :
                  <ChevronRight className="w-5 h-5" />
                }
              </Button>
              {category.icon === 'utensils' ? <Utensils className="w-5 h-5 text-gray-900" /> :
                category.icon === 'coffee' ? <Coffee className="w-5 h-5 text-gray-900" /> :
                  <Wind className="w-5 h-5 text-gray-900" />}
              <div>
                <h3 className={`text-lg font-bold text-gray-900 ${isRTL ? 'font-arabic' : ''}`}>
                  {language === 'ar' ? category.nameAr : category.nameEn}
                </h3>
                <p className={`text-gray-500 text-xs ${isRTL ? 'font-arabic' : ''}`}>
                  {category.subcategories.length} {language === 'ar' ? 'فئة فرعية' : 'subcategories'}
                </p>
              </div>
            </div>

            <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={() => openSubcategoryDialog('add', category.id)}
                size="sm"
                variant="ghost"
                className="text-gray-600 hover:text-black hover:bg-gray-100"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                {language === 'ar' ? 'فئة فرعية' : 'Subcategory'}
              </Button>
              <Button
                onClick={() => openCategoryDialog('edit', category)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleCategoryDelete(category.id)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {expandedCategories.has(category.id) && (
          <CardContent className="p-6">
            <div className="space-y-6">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <h4 className={`text-lg font-semibold text-gray-800 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {language === 'ar' ? subcategory.nameAr : subcategory.nameEn}
                      </h4>
                      <p className={`text-gray-600 text-sm ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {subcategory.items.length} {language === 'ar' ? 'عنصر' : 'items'}
                      </p>
                    </div>

                    <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button
                        onClick={() => openItemDialog('add', subcategory.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isSubmitting}
                      >
                        <Plus className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {language === 'ar' ? 'عنصر' : 'Item'}
                      </Button>
                      <Button
                        onClick={() => openSubcategoryDialog('edit', category.id, subcategory)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                        disabled={isSubmitting}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleSubcategoryDelete(subcategory.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subcategory.items.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border relative">
                        <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1">
                          <Button
                            onClick={() => openItemDialog('edit', subcategory.id, item)}
                            size="sm"
                            variant="outline"
                            className="w-7 h-7 p-0 text-blue-600 border-blue-600"
                            disabled={isSubmitting}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleItemDelete(item.id)}
                            size="sm"
                            variant="outline"
                            className="w-7 h-7 p-0 text-red-600 border-red-600"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="aspect-video bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={language === 'ar' ? item.nameAr : item.nameEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Utensils className="w-8 h-8 text-white/80" />
                          )}
                        </div>

                        <h5 className={`font-semibold mb-2 pr-16 rtl:pr-0 rtl:pl-16 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                          {language === 'ar' ? item.nameAr : item.nameEn}
                        </h5>
                        <p className={`text-sm text-gray-600 mb-2 ${isRTL ? 'font-arabic text-right' : 'font-english text-left'}`}>
                          {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                        </p>
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="font-bold text-lg text-green-600">
                            {item.price} ر.س
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {item.isFeatured && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {language === 'ar' ? 'مميز' : 'Featured'}
                              </span>
                            )}
                            {!item.isAvailable && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {language === 'ar' ? 'غير متاح' : 'Unavailable'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    ))}
  </div>

  {/* Category Dialog */ }
  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
    <DialogContent className={`max-w-md ${isRTL ? 'font-arabic' : 'font-english'}`}>
      <DialogHeader>
        <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
          {categoryDialogAction === 'add'
            ? (language === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category')
            : (language === 'ar' ? 'تعديل الفئة' : 'Edit Category')
          }
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {submitStatus === 'success' && (
          <div className={`p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-800 text-sm">{language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className={`p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-800 text-sm">{language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields'}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الاسم بالإنجليزية *' : 'Name (English) *'}</Label>
          <Input
            value={categoryFormData.nameEn}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, nameEn: e.target.value })}
            className="text-left font-english"
            placeholder="Enter category name in English"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الاسم بالعربية *' : 'Name (Arabic) *'}</Label>
          <Input
            value={categoryFormData.nameAr}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, nameAr: e.target.value })}
            className="text-right font-arabic"
            placeholder="أدخل اسم الفئة بالعربية"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'نوع الفئة' : 'Category Type'}</Label>
          <select
            value={categoryFormData.icon}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
            className={`w-full p-2 border rounded-md ${isRTL ? 'text-right' : 'text-left'}`}
            disabled={isSubmitting}
          >
            {iconOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={handleCategorySave}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            )}
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
          <Button
            onClick={() => setIsCategoryDialogOpen(false)}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Subcategory Dialog */ }
  <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
    <DialogContent className={`max-w-md ${isRTL ? 'font-arabic' : 'font-english'}`}>
      <DialogHeader>
        <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
          {subcategoryDialogAction === 'add'
            ? (language === 'ar' ? 'إضافة فئة فرعية جديدة' : 'Add New Subcategory')
            : (language === 'ar' ? 'تعديل الفئة الفرعية' : 'Edit Subcategory')
          }
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {submitStatus === 'success' && (
          <div className={`p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-800 text-sm">{language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className={`p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-800 text-sm">{language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields'}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الاسم بالإنجليزية *' : 'Name (English) *'}</Label>
          <Input
            value={subcategoryFormData.nameEn}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, nameEn: e.target.value })}
            className="text-left font-english"
            placeholder="Enter subcategory name in English"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الاسم بالعربية *' : 'Name (Arabic) *'}</Label>
          <Input
            value={subcategoryFormData.nameAr}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, nameAr: e.target.value })}
            className="text-right font-arabic"
            placeholder="أدخل اسم الفئة الفرعية بالعربية"
            disabled={isSubmitting}
          />
        </div>

        <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={handleSubcategorySave}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            )}
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
          <Button
            onClick={() => setIsSubcategoryDialogOpen(false)}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Item Dialog */ }
  <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
    <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : 'font-english'}`}>
      <DialogHeader>
        <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
          {itemDialogAction === 'add'
            ? (language === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item')
            : (language === 'ar' ? 'تعديل العنصر' : 'Edit Item')
          }
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {submitStatus === 'success' && (
          <div className={`p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{language === 'ar' ? 'تم حفظ العنصر بنجاح!' : 'Item saved successfully!'}</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className={`p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields'}</p>
          </div>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'صورة العنصر' : 'Item Image'}</Label>
          <div className="space-y-3">
            {itemFormData.imageUrl && (
              <div className="aspect-[4/3] w-full max-w-sm mx-auto overflow-hidden rounded-lg border">
                <img src={itemFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="item-image-upload"
                disabled={isSubmitting}
              />
              <Label htmlFor="item-image-upload" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{language === 'ar' ? 'رفع صورة إلى ImgBB' : 'Upload Image to ImgBB'}</span>
                </div>
              </Label>
            </div>
            <p className={`text-xs text-gray-500 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
              {language === 'ar'
                ? 'الحد الأقصى: 32 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP'
                : 'Max size: 32MB. Supported formats: JPG, PNG, GIF, WebP'
              }
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'اسم العنصر بالإنجليزية *' : 'Item Name (English) *'}</Label>
          <Input
            value={itemFormData.nameEn}
            onChange={(e) => setItemFormData({ ...itemFormData, nameEn: e.target.value })}
            className="text-left font-english"
            placeholder="Enter item name in English"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'اسم العنصر بالعربية *' : 'Item Name (Arabic) *'}</Label>
          <Input
            value={itemFormData.nameAr}
            onChange={(e) => setItemFormData({ ...itemFormData, nameAr: e.target.value })}
            className="text-right font-arabic"
            placeholder="أدخل اسم العنصر بالعربية"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'وصف العنصر بالإنجليزية' : 'Item Description (English)'}</Label>
          <Textarea
            value={itemFormData.descriptionEn}
            onChange={(e) => setItemFormData({ ...itemFormData, descriptionEn: e.target.value })}
            className="text-left font-english"
            placeholder="Enter item description in English"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'وصف العنصر بالعربية' : 'Item Description (Arabic)'}</Label>
          <Textarea
            value={itemFormData.descriptionAr}
            onChange={(e) => setItemFormData({ ...itemFormData, descriptionAr: e.target.value })}
            className="text-right font-arabic"
            placeholder="أدخل وصف العنصر بالعربية"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'ar' ? 'السعر (ريال سعودي) *' : 'Price (SAR) *'}</Label>
          <Input
            type="number"
            value={itemFormData.price}
            onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
            className={isRTL ? 'text-right' : 'text-left'}
            placeholder={language === 'ar' ? 'أدخل السعر بالريال' : 'Enter price in SAR'}
            min="0"
            step="0.01"
            disabled={isSubmitting}
          />
        </div>

        {/* Availability and Featured toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'متاح' : 'Available'}</Label>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="isAvailable"
                checked={itemFormData.isAvailable}
                onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                className="rounded"
                disabled={isSubmitting}
              />
              <Label htmlFor="isAvailable" className="text-sm">
                {language === 'ar' ? 'العنصر متاح للطلب' : 'Item is available for order'}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'مميز' : 'Featured'}</Label>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="isFeatured"
                checked={itemFormData.isFeatured}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (!next) {
                    setItemFormData({ ...itemFormData, isFeatured: false });
                    return;
                  }

                  const featuredCount = getFeaturedCount();
                  const alreadyFeatured = selectedItem?.isFeatured;
                  const projected = featuredCount + (alreadyFeatured ? 0 : 1);

                  if (projected > 6) {
                    toast.error(
                      language === 'ar'
                        ? 'وصلت إلى الحد الأقصى (٦) من الأطباق المميزة.'
                        : 'You reached the maximum (6) featured dishes.'
                    );
                    return;
                  }

                  setItemFormData({ ...itemFormData, isFeatured: true });
                }}
                className="rounded"
                disabled={isSubmitting}
              />
              <Label htmlFor="isFeatured" className="text-sm">
                {language === 'ar' ? 'عرض في الأطباق المميزة' : 'Show in featured dishes'}
              </Label>
            </div>
          </div>
        </div>

        <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={handleItemSave}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            )}
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
          <Button
            onClick={() => setIsItemDialogOpen(false)}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</DashboardLayout>
  );
};

export default FullMenuManagePage;