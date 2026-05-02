const BACKEND_URL = 'https://lms-backend.netswaptech.com';

/**
 * Formats an image URL from the API.
 * If the URL is relative, prepends the backend base URL.
 * 
 * @param {string|number} image - The image source from API (URL string or require ID)
 * @returns {object|number} - The formatted image source for <Image />
 */
export const formatImageUrl = (image) => {
  if (!image) return null;
  
  if (typeof image === 'number') {
    return image; // Handled by require()
  }
  
  if (typeof image === 'string') {
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return { uri: image };
    }
    
    // Prefix with backend URL if it's a relative path
    const cleanPath = image.startsWith('/') ? image : `/${image}`;
    return { uri: `${BACKEND_URL}${cleanPath}` };
  }
  
  return image;
};
