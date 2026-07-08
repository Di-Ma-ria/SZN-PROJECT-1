import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      req.uploadedImages = [];
      return next();
    }

    const uploadedPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'SZN-Project/products',
            resource_type: 'image',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );

        stream.end(file.buffer);
      });
    });

    req.uploadedImages = await Promise.all(uploadedPromises);
    return next();

    } catch (error) {
    return next(new Error(`Image upload failed: ${error.message}`));
  }
};