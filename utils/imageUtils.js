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
    
    // Fix localhost/127.0.0.1 to production URL
    if (resolvedUri.includes('localhost') || resolvedUri.includes('127.0.0.1')) {
      resolvedUri = resolvedUri.replace(/http:\/\/(localhost|127.0.0.1)(:\d+)?/, BACKEND_URL);
    }
    
    // NOTE: We do NOT strip /public/ here because the user confirmed 
    // that the URL WITH /public/ works in the web browser.
    
    return { 
      uri: resolvedUri,
      headers: {
        Accept: 'image/*',
      }
    };
  }

  // Handle relative paths
  let finalPath = imageUri.trim();
  if (!finalPath.startsWith('/')) {
    finalPath = `/${finalPath}`;
  }
  
  // For relative paths, we keep them as is since the backend seems to 
  // expect the full path including /public if it's there.
  
  return { 
    uri: `${BACKEND_URL}${finalPath}`,
    headers: {
      Accept: 'image/*',
    }
  };
};
