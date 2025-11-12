import { 
  addCategory, 
  addSubcategory, 
  addMenuItem, 
  addOffer, 
  addEvent, 
  addGalleryImage,
  updateContactInfo,
  updateWorkingHours
} from './firestore';

// Seed data function to populate Firestore with initial data
export const seedFirestore = async () => {
  try {
    console.log('Starting Firestore seeding...');

    // Add Categories
    const foodCategoryId = await addCategory({
      nameEn: 'Food Menu',
      nameAr: 'قائمة الطعام',
      icon: 'utensils',
      order: 1
    });

    const drinksCategoryId = await addCategory({
      nameEn: 'Drinks Menu',
      nameAr: 'قائمة المشروبات',
      icon: 'coffee',
      order: 2
    });

    // Add Subcategories
    const grillsSubcategoryId = await addSubcategory({
      nameEn: 'Grills',
      nameAr: 'المشاوي',
      categoryId: foodCategoryId,
      order: 1
    });

    const seafoodSubcategoryId = await addSubcategory({
      nameEn: 'Seafood',
      nameAr: 'المأكولات البحرية',
      categoryId: foodCategoryId,
      order: 2
    });

    const hotBeveragesSubcategoryId = await addSubcategory({
      nameEn: 'Hot Beverages',
      nameAr: 'المشروبات الساخنة',
      categoryId: drinksCategoryId,
      order: 1
    });

    const coldBeveragesSubcategoryId = await addSubcategory({
      nameEn: 'Cold Beverages',
      nameAr: 'المشروبات الباردة',
      categoryId: drinksCategoryId,
      order: 2
    });

    // Add Menu Items
    await addMenuItem({
      nameEn: 'Grilled Lamb Chops',
      nameAr: 'ريش الخروف المشوية',
      descriptionEn: 'Tender lamb chops grilled to perfection with aromatic herbs',
      descriptionAr: 'ريش خروف طرية مشوية بالأعشاب العطرية',
      price: 320,
      subcategoryId: grillsSubcategoryId,
      imageUrl: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      order: 1
    });

    await addMenuItem({
      nameEn: 'Wagyu Beef Steak',
      nameAr: 'ستيك لحم الواغيو',
      descriptionEn: 'Premium Wagyu beef cooked to your preference',
      descriptionAr: 'لحم الواغيو الفاخر مطبوخ حسب رغبتك',
      price: 450,
      subcategoryId: grillsSubcategoryId,
      isAvailable: true,
      isFeatured: true,
      order: 2
    });

    await addMenuItem({
      nameEn: 'Pan-Seared Salmon',
      nameAr: 'سلمون محمر',
      descriptionEn: 'Fresh Atlantic salmon with lemon butter sauce',
      descriptionAr: 'سلمون الأطلسي الطازج بصلصة الزبدة والليمون',
      price: 260,
      subcategoryId: seafoodSubcategoryId,
      isAvailable: true,
      isFeatured: true,
      order: 1
    });

    await addMenuItem({
      nameEn: 'Seafood Risotto',
      nameAr: 'ريزوتو المأكولات البحرية',
      descriptionEn: 'Creamy risotto with fresh seafood and saffron',
      descriptionAr: 'ريزوتو كريمي بالمأكولات البحرية الطازجة والزعفران',
      price: 280,
      subcategoryId: seafoodSubcategoryId,
      imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      order: 2
    });

    await addMenuItem({
      nameEn: 'Arabic Coffee',
      nameAr: 'قهوة عربية',
      descriptionEn: 'Traditional Arabic coffee with cardamom',
      descriptionAr: 'قهوة عربية تقليدية بالهيل',
      price: 55,
      subcategoryId: hotBeveragesSubcategoryId,
      isAvailable: true,
      isFeatured: false,
      order: 1
    });

    await addMenuItem({
      nameEn: 'Fresh Orange Juice',
      nameAr: 'عصير برتقال طازج',
      descriptionEn: 'Freshly squeezed orange juice',
      descriptionAr: 'عصير برتقال طازج معصور',
      price: 45,
      subcategoryId: coldBeveragesSubcategoryId,
      isAvailable: true,
      isFeatured: false,
      order: 1
    });

    // Add Offers
    await addOffer({
      titleEn: 'Weekend Brunch Special',
      titleAr: 'عرض برانش عطلة نهاية الأسبوع',
      descriptionEn: 'Unlimited brunch buffet with live cooking stations',
      descriptionAr: 'بوفيه برانش مفتوح مع محطات طبخ مباشر',
      price: 170,
      validUntil: new Date('2024-12-31'),
      imageUrl: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      badgeEn: 'New',
      badgeAr: 'جديد',
      isActive: true,
      order: 1
    });

    await addOffer({
      titleEn: 'Couples Dinner Package',
      titleAr: 'باقة عشاء الأزواج',
      descriptionEn: 'Romantic 3-course dinner for two with complimentary wine',
      descriptionAr: 'عشاء رومانسي من 3 أطباق لشخصين مع نبيذ مجاني',
      price: 560,
      validUntil: new Date('2024-12-25'),
      imageUrl: 'https://images.pexels.com/photos/3201921/pexels-photo-3201921.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      badgeEn: 'Popular',
      badgeAr: 'مميز',
      isActive: true,
      order: 2
    });

    // Add Events
    await addEvent({
      titleEn: 'Live Jazz Night',
      titleAr: 'ليلة الجاز المباشر',
      descriptionEn: 'Enjoy an evening of smooth jazz with our resident band while savoring our signature dishes',
      descriptionAr: 'استمتع بأمسية من موسيقى الجاز الناعمة مع فرقتنا المقيمة أثناء تذوق أطباقنا المميزة',
      date: new Date('2024-12-28'),
      time: '8:00 PM',
      price: 280,
      imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      category: 'music',
      capacity: 50,
      isActive: true,
      order: 1
    });

    await addEvent({
      titleEn: 'Wine Tasting Evening',
      titleAr: 'أمسية تذوق النبيذ',
      descriptionEn: 'Discover exceptional wines paired with carefully selected appetizers by our sommelier',
      descriptionAr: 'اكتشف أنواع النبيذ الاستثنائية مع المقبلات المختارة بعناية من قبل خبير النبيذ لدينا',
      date: new Date('2024-12-30'),
      time: '7:00 PM',
      price: 355,
      imageUrl: 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      category: 'tasting',
      capacity: 30,
      isActive: true,
      order: 2
    });

    // Add Gallery Images
    await addGalleryImage({
      imageUrl: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
      altEn: 'Restaurant Interior',
      altAr: 'داخل المطعم',
      category: 'interior',
      order: 1
    });

    await addGalleryImage({
      imageUrl: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      altEn: 'Fine Dining',
      altAr: 'طعام راقي',
      category: 'food',
      order: 1
    });

    // Add Contact Info
    await updateContactInfo({
      phones: ['+1 (555) 123-4567'],
      whatsapps: ['+1 (555) 123-4567'],
      emails: ['info@koukian.com'],
      addressEn: '123 Luxury Street, Downtown',
      addressAr: '123 شارع الفخامة، وسط المدينة'
    });

    // Add Working Hours
    await updateWorkingHours([
      {
        dayEn: 'Monday - Thursday',
        dayAr: 'الإثنين - الخميس',
        hours: '12:00 PM - 11:00 PM',
        order: 1
      },
      {
        dayEn: 'Friday - Saturday',
        dayAr: 'الجمعة - السبت',
        hours: '12:00 PM - 12:00 AM',
        order: 2
      },
      {
        dayEn: 'Sunday',
        dayAr: 'الأحد',
        hours: '12:00 PM - 10:00 PM',
        order: 3
      }
    ]);

    console.log('Firestore seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    throw error;
  }
};