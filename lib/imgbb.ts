const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

if (!IMGBB_API_KEY) {
  throw new Error('IMGBB_API_KEY is not defined in environment variables');
}

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
    
    return data.data.url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
}
