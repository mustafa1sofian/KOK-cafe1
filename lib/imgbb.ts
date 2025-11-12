// ImgBB API integration for image uploads
const IMGBB_API_KEY = 'c95d1e3b8c3f2ea9aeee8d8ef86e6931';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export const uploadImageToImgBB = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64.split(',')[1]); // Remove data:image/...;base64, prefix
    formData.append('name', file.name.split('.')[0]); // Remove extension
    
    // Upload to ImgBB
    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ImgBBResponse = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to upload image to ImgBB');
    }
    
    return result.data.display_url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw new Error('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 32MB for ImgBB)
  const maxSize = 32 * 1024 * 1024; // 32MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'حجم الصورة كبير جداً. الحد الأقصى 32 ميجابايت.'
    };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'نوع الملف غير مدعوم. يرجى استخدام JPG, PNG, GIF, أو WebP.'
    };
  }
  
  return { isValid: true };
};