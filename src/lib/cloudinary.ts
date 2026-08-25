import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadOptions {
  folder?: string;
  allowedFormats?: string[];
  maxFileSizeMB?: number;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer | string,
  options: UploadOptions = {}
): Promise<{ url: string; publicId: string }> {
  const folder = options.folder || 'alphazero_lms';

  return new Promise((resolve, reject) => {
    if (typeof fileBuffer === 'string') {
      cloudinary.uploader.upload(
        fileBuffer,
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
    } else {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload stream failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(fileBuffer);
    }
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

export default cloudinary;
