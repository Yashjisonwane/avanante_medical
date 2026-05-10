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
  
  let imageUri = '';
  if (typeof image === 'string') {
    imageUri = image;
  } else if (typeof image === 'object') {
    imageUri = image.uri || image.url || image.path || '';
  }

  if (!imageUri) return null;

  // Handle local files or already formatted data
  if (imageUri.startsWith('file') || imageUri.startsWith('content') || imageUri.startsWith('data:')) {
    return { uri: imageUri };
  }

  // Handle absolute URLs
  if (imageUri.startsWith('http')) {
    let resolvedUri = imageUri;
    
    // 1. Fix localhost/127.0.0.1 to production URL
    if (resolvedUri.includes('localhost') || resolvedUri.includes('127.0.0.1')) {
      resolvedUri = resolvedUri.replace(/http:\/\/(localhost|127.0.0.1)(:\d+)?/, BACKEND_URL);
    }
    
    // 2. Stripping '/public/' from URL (Common Laravel production issue)
    // If the server returns '.../public/uploads/...' it often means the 'public' folder 
    // is actually the root, so '/public' should not be in the URL.
    if (resolvedUri.includes('/public/uploads/')) {
      resolvedUri = resolvedUri.replace('/public/uploads/', '/uploads/');
    }
    
    return { uri: resolvedUri };
  }

  // Handle relative paths
  const cleanPath = imageUri.startsWith('/') ? imageUri : `/${imageUri}`;
  
  // If the path starts with /public, strip it
  let finalPath = cleanPath;
  if (finalPath.startsWith('/public/')) {
    finalPath = finalPath.replace('/public/', '/');
  }

  return { uri: `${BACKEND_URL}${finalPath}` };
};
