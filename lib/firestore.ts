import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Types
export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  id: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  subcategoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Offer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  validUntil: Date;
  imageUrl?: string;
  badgeEn: string;
  badgeAr: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  date: Date;
  time: string;
  price: number;
  imageUrl?: string;
  category: string;
  capacity: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  altEn: string;
  altAr: string;
  category: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  id: string;
  phones: string[];
  whatsapps: string[];
  emails: string[];
  addressEn: string;
  addressAr: string;
  updatedAt: Date;
}

export interface WorkingHour {
  id: string;
  dayEn: string;
  dayAr: string;
  hours: string;
  order: number;
  updatedAt: Date;
}

export interface SiteSettings {
  id: string;
  heroBackgroundImage?: string;
  aboutSectionImage?: string;
  showEventsSection?: boolean;
  showOffersSection?: boolean;
  updatedAt: Date;
}

export interface EventReservation {
  id: string;
  eventId: string;
  eventTitle: string;
  customerName: string;
  phone: string;
  email: string;
  seats: number;
  totalPrice: number;
  status: 'new' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  adults: number;
  children: number;
  seatingPreference: 'indoor-smoking' | 'indoor-non-smoking' | 'outdoor-smoking' | 'outdoor-non-smoking';
  type: 'table' | 'event';
  status: 'new' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
  // Event-specific fields
  eventId?: string;
  eventTitle?: string;
  seats?: number;
  totalPrice?: number;
}

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (data: any) => {
  if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate();
  if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate();
  if (data.date?.toDate) data.date = data.date.toDate();
  if (data.validUntil?.toDate) data.validUntil = data.validUntil.toDate();
  if (data.confirmedAt?.toDate) data.confirmedAt = data.confirmedAt.toDate();
  return data;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, 'categories'), orderBy('order'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Category[];
};

export const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const docRef = doc(db, 'categories', id);
  await updateDoc(docRef, {
    ...category,
    updatedAt: new Date()
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', id));
};

// Subcategories
export const getSubcategories = async (categoryId?: string): Promise<Subcategory[]> => {
  let q = query(collection(db, 'subcategories'), orderBy('order'));
  if (categoryId) {
    q = query(collection(db, 'subcategories'), where('categoryId', '==', categoryId), orderBy('order'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Subcategory[];
};

export const addSubcategory = async (subcategory: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'subcategories'), {
    ...subcategory,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateSubcategory = async (id: string, subcategory: Partial<Subcategory>): Promise<void> => {
  const docRef = doc(db, 'subcategories', id);
  await updateDoc(docRef, {
    ...subcategory,
    updatedAt: new Date()
  });
};

export const deleteSubcategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'subcategories', id));
};

// Menu Items
export const getMenuItems = async (subcategoryId?: string, isFeatured?: boolean): Promise<MenuItem[]> => {
  let q = query(collection(db, 'menuItems'));
  
  if (subcategoryId && isFeatured !== undefined) {
    q = query(
      collection(db, 'menuItems'), 
      where('subcategoryId', '==', subcategoryId),
      where('isFeatured', '==', isFeatured)
    );
  } else if (subcategoryId) {
    q = query(
      collection(db, 'menuItems'), 
      where('subcategoryId', '==', subcategoryId)
    );
  } else if (isFeatured !== undefined) {
    q = query(
      collection(db, 'menuItems'), 
      where('isFeatured', '==', isFeatured)
    );
  } else {
    q = query(collection(db, 'menuItems'), orderBy('order'));
  }
  
  const querySnapshot = await getDocs(q);
  const menuItems = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as MenuItem[];
  
  // Sort by order in JavaScript when using filters
  if (subcategoryId || isFeatured !== undefined) {
    return menuItems.sort((a, b) => a.order - b.order);
  }
  
  return menuItems;
};

export const addMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'menuItems'), {
    ...menuItem,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateMenuItem = async (id: string, menuItem: Partial<MenuItem>): Promise<void> => {
  const docRef = doc(db, 'menuItems', id);
  await updateDoc(docRef, {
    ...menuItem,
    updatedAt: new Date()
  });
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'menuItems', id));
};

// Offers
export const getOffers = async (isActive?: boolean): Promise<Offer[]> => {
  let q = query(collection(db, 'offers'), orderBy('order'));
  if (isActive !== undefined) {
    q = query(collection(db, 'offers'), where('isActive', '==', isActive));
  }
  const querySnapshot = await getDocs(q);
  const offers = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Offer[];
  
  // Sort by order in JavaScript when filtering by isActive
  if (isActive !== undefined) {
    return offers.sort((a, b) => a.order - b.order);
  }
  
  return offers;
};

export const addOffer = async (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'offers'), {
    ...offer,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateOffer = async (id: string, offer: Partial<Offer>): Promise<void> => {
  const docRef = doc(db, 'offers', id);
  await updateDoc(docRef, {
    ...offer,
    updatedAt: new Date()
  });
};

export const deleteOffer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'offers', id));
};

// Events
export const getEvents = async (isActive?: boolean): Promise<Event[]> => {
  let q = query(collection(db, 'events'));
  if (isActive !== undefined) {
    q = query(collection(db, 'events'), where('isActive', '==', isActive));
  } else {
    q = query(collection(db, 'events'), orderBy('date'));
  }
  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Event[];
  
  // Always sort by date in JavaScript when filtering by isActive
  // When not filtering, Firestore already sorted by date
  if (isActive !== undefined) {
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  return events;
};

export const addEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'events'), {
    ...event,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  const docRef = doc(db, 'events', id);
  await updateDoc(docRef, {
    ...event,
    updatedAt: new Date()
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'events', id));
};

// Gallery Images
export const getGalleryImages = async (category?: string): Promise<GalleryImage[]> => {
  let q = query(collection(db, 'galleryImages'), orderBy('order'));
  if (category) {
    q = query(collection(db, 'galleryImages'), where('category', '==', category), orderBy('order'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as GalleryImage[];
};

export const addGalleryImage = async (image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'galleryImages'), {
    ...image,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateGalleryImage = async (id: string, image: Partial<GalleryImage>): Promise<void> => {
  const docRef = doc(db, 'galleryImages', id);
  await updateDoc(docRef, {
    ...image,
    updatedAt: new Date()
  });
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'galleryImages', id));
};

// Contact Info
export const getContactInfo = async (): Promise<ContactInfo | null> => {
  const querySnapshot = await getDocs(collection(db, 'contactInfo'));
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...convertTimestamp(doc.data())
  } as ContactInfo;
};

export const updateContactInfo = async (contactInfo: Omit<ContactInfo, 'id' | 'updatedAt'>): Promise<void> => {
  const querySnapshot = await getDocs(collection(db, 'contactInfo'));
  const now = new Date();
  
  if (querySnapshot.empty) {
    // Create new contact info
    await addDoc(collection(db, 'contactInfo'), {
      ...contactInfo,
      updatedAt: now
    });
  } else {
    // Update existing contact info
    const docRef = doc(db, 'contactInfo', querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      ...contactInfo,
      updatedAt: now
    });
  }
};

// Working Hours
export const getWorkingHours = async (): Promise<WorkingHour[]> => {
  const q = query(collection(db, 'workingHours'), orderBy('order'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as WorkingHour[];
};

export const updateWorkingHours = async (workingHours: Omit<WorkingHour, 'id' | 'updatedAt'>[]): Promise<void> => {
  // Delete all existing working hours
  const querySnapshot = await getDocs(collection(db, 'workingHours'));
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  // Add new working hours
  const now = new Date();
  const addPromises = workingHours.map(hour => 
    addDoc(collection(db, 'workingHours'), {
      ...hour,
      updatedAt: now
    })
  );
  await Promise.all(addPromises);
};

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const querySnapshot = await getDocs(collection(db, 'siteSettings'));
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...convertTimestamp(doc.data())
  } as SiteSettings;
};

export const updateSiteSettings = async (settings: Omit<SiteSettings, 'id' | 'updatedAt'>): Promise<void> => {
  const querySnapshot = await getDocs(collection(db, 'siteSettings'));
  const now = new Date();
  
  if (querySnapshot.empty) {
    // Create new site settings
    await addDoc(collection(db, 'siteSettings'), {
      ...settings,
      updatedAt: now
    });
  } else {
    // Update existing site settings
    const docRef = doc(db, 'siteSettings', querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      ...settings,
      updatedAt: now
    });
  }
};

// Reservations
export const getReservations = async (): Promise<Reservation[]> => {
  const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Reservation[];
};

export const addReservation = async (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'confirmedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'reservations'), {
    ...reservation,
    createdAt: now
  });
  return docRef.id;
};

export const updateReservation = async (id: string, reservation: Partial<Reservation>): Promise<void> => {
  const docRef = doc(db, 'reservations', id);
  await updateDoc(docRef, {
    ...reservation,
    updatedAt: new Date()
  });
};

export const deleteReservation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'reservations', id));
};

// Event Reservations
export const getEventReservations = async (): Promise<EventReservation[]> => {
  const q = query(collection(db, 'eventReservations'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as EventReservation[];
};

export const addEventReservation = async (reservation: Omit<EventReservation, 'id' | 'createdAt' | 'updatedAt' | 'confirmedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'eventReservations'), {
    ...reservation,
    createdAt: now
  });
  return docRef.id;
};

export const updateEventReservation = async (id: string, reservation: Partial<EventReservation>): Promise<void> => {
  const docRef = doc(db, 'eventReservations', id);
  await updateDoc(docRef, {
    ...reservation,
    updatedAt: new Date()
  });
};

export const deleteEventReservation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'eventReservations', id));
};

// Image Upload/Delete Functions
export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  // Only delete if it's a Firebase Storage URL
  if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
    try {
      // Extract the path from the Firebase Storage URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.warn('Error deleting image from storage:', error);
      // Don't throw error to prevent blocking other operations
    }
  }
};