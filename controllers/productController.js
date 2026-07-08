import mongoose from 'mongoose';
import { Product } from '../models/productModel.js';
import cloudinary from '../config/cloudinary.js';


// PUBLIC ENDPOINTS — No Auth Required

// GET ALL PRODUCTS — with filtering, pagination, sorting
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      productType,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { status: 'active' };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand)       filter.brand       = { $regex: brand, $options: 'i' };
    if (productType) filter.productType = productType;
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const sortOptions = {
      newest:       { createdAt: -1 },
      oldest:       { createdAt: 1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email sellerProfile.storeName')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT — by ID or slug
export const getSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, status: 'active' }
      : { slug: id, status: 'active' };

    const product = await Product.findOne(query)
      .populate('seller',   'name email sellerProfile.storeName')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// SEARCH PRODUCTS — full text search with filters and sorting
export const searchProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      productType,
      sort  = 'newest',
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = { status: 'active' };

    if (q) filter.$text = { $search: q };
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand)       filter.brand       = { $regex: brand, $options: 'i' };
    if (productType) filter.productType = productType;
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const sortOptions = {
      newest:       { createdAt: -1 },
      oldest:       { createdAt: 1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
      popular:      { 'ratings.count': -1 },
    };

    let sortQuery = sortOptions[sort] || sortOptions.newest;
    if (q) sortQuery = { score: { $meta: 'textScore' }, ...sortQuery };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// SEARCH SUGGESTIONS — quick suggestions as user types
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const suggestions = await Product.find(
      {
        status: 'active',
        $or: [
          { name:  { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
        ],
      },
      { name: 1, brand: 1, slug: 1, images: 1, basePrice: 1 }
    )
      .limit(8)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

// GET PRODUCTS BY CATEGORY ID
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.params.categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };

    const filter = {
      category: new mongoose.Types.ObjectId(req.params.categoryId),
      status: 'active',
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET PRODUCTS BY CATEGORY SLUG
export const getProductsByCategorySlug = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const category = await mongoose.connection
      .collection('categories')
      .findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };

    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { category: category._id, status: 'active' };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET PRODUCTS BY BRAND
export const getProductsByBrand = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };

    const filter = {
      brand:  { $regex: req.params.brand, $options: 'i' },
      status: 'active',
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET FEATURED PRODUCTS
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ status: 'active', isFeatured: true })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET NEW ARRIVALS
export const getNewArrivals = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ status: 'active' })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET DEALS — products with a discount
export const getDeals = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      status:             'active',
      discountPercentage: { $gt: 0 },
    })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .sort({ discountPercentage: -1 })
      .limit(Number(limit));

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET RELATED PRODUCTS — same category, excluding current product
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const related = await Product.find({
      category: product.category,
      _id:      { $ne: product._id },
      status:   'active',
    })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .limit(10)
      .sort({ 'ratings.average': -1 });

    return res.status(200).json({ success: true, data: related });
  } catch (error) {
    next(error);
  }
};

// COMPARE PRODUCTS — side by side comparison of 2 to 4 products
export const compareProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Provide between 2 and 4 product IDs to compare',
      });
    }

    const invalidIds = productIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more product IDs are invalid',
      });
    }

    const products = await Product.find({
      _id:    { $in: productIds },
      status: 'active',
    })
      .populate('category', 'name slug')
      .populate('seller',   'name email');

    if (products.length !== productIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more products not found',
      });
    }

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};


// SELLER ENDPOINTS — Auth + Seller / Admin / Superadmin

// CREATE PRODUCT
export const createProduct = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    // Remove server-set fields from req.body
    // so client cannot override them
    const {
      seller:      _seller,
      images:      _images,
      status:      _status,
      productType: _productType,
      ...productData
    } = req.body;

    const product = await Product.create({
      ...productData,
      seller:      req.user._id,
      images:      req.uploadedImages || [],
      status:      isAdmin ? (req.body.status || 'active') : 'pending',
      productType: isAdmin ? (req.body.productType || 'own') : 'marketplace',
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data:    product,
    });
  } catch (error) {
    next(error);
  }
};

// GET MY PRODUCTS — seller views their own products
export const getMyProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET MY PRODUCT STATS — seller dashboard counts
export const getMyProductStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [total, active, pending, rejected, archived, draft] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      Product.countDocuments({ seller: sellerId, status: 'pending' }),
      Product.countDocuments({ seller: sellerId, status: 'rejected' }),
      Product.countDocuments({ seller: sellerId, status: 'archived' }),
      Product.countDocuments({ seller: sellerId, status: 'draft' }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, active, pending, rejected, archived, draft },
    });
  } catch (error) {
    next(error);
  }
};

// GET PRODUCT ANALYTICS — seller or admin views product performance
export const getProductAnalytics = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    // Admin can view any product — seller can only view their own
    const query = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, seller: req.user._id };

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not authorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        productId:          product._id,
        name:               product.name,
        status:             product.status,
        basePrice:          product.basePrice,
        stock:              product.stock,
        discountPercentage: product.discountPercentage,
        ratings:            product.ratings,
        isFeatured:         product.isFeatured,
        createdAt:          product.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    // Sellers cannot set productType to own
    if (!isAdmin && req.body.productType === 'own') {
      return res.status(403).json({
        success: false,
        message: 'Sellers cannot set product type to own',
      });
    }

    // If new images uploaded add them to existing
    const updatedImages =
      req.uploadedImages && req.uploadedImages.length > 0
        ? [...product.images, ...req.uploadedImages]
        : product.images;

    const updatedData = { ...req.body, images: updatedImages };

    // Sellers need re-approval after any edit
    if (!isAdmin) updatedData.status = 'pending';

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data:    updated,
    });
  } catch (error) {
    next(error);
  }
};

// ADD PRODUCT IMAGES
export const addProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
      });
    }

    if (product.images.length + req.uploadedImages.length > 13) {
      return res.status(400).json({
        success: false,
        message: `Cannot add ${req.uploadedImages.length} images. Maximum is 13. You currently have ${product.images.length}.`,
      });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: req.uploadedImages } } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Images added successfully',
      data:    updated,
    });
  } catch (error) {
    next(error);
  }
};

// REMOVE PRODUCT IMAGE
export const removeProductImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!product.images.includes(imageUrl)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found on this product',
      });
    }

    // Delete from Cloudinary
    try {
      const urlParts    = imageUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
        const publicId        = publicIdWithExt.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err.message);
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data:    updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    // Delete all images from Cloudinary before deleting product
    for (const imageUrl of product.images) {
      try {
        const urlParts    = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex === -1) continue;
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
        const publicId        = publicIdWithExt.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err.message);
      }
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE BASE PRODUCT STOCK ← NEW FUNCTION
export const updateProductStock = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product stock',
      });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: req.body.stock },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data:    updated,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE VARIANT STOCK ← NEW FUNCTION
export const updateVariantStock = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this variant stock',
      });
    }

    const variant = product.variants.find(
      (v) => v._id.toString() === req.params.variantId
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
      });
    }

    variant.stock = req.body.stock;
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Variant stock updated successfully',
      data:    product,
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN ENDPOINTS — Admin / Superadmin Only

// GET ALL PRODUCTS — admin sees all statuses
export const adminGetAllProducts = async (req, res, next) => {
  try {
    const { status, productType, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status)      filter.status      = status;
    if (productType) filter.productType = productType;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email role')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// GET PENDING PRODUCTS — waiting for admin approval
export const getPendingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ status: 'pending' })
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: 1 }),
      Product.countDocuments({ status: 'pending' }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  products,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN PRODUCT STATS — platform wide overview
export const adminProductStats = async (req, res, next) => {
  try {
    const [
      total, active, pending, rejected,
      archived, draft, own, marketplace,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'rejected' }),
      Product.countDocuments({ status: 'archived' }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ productType: 'own' }),
      Product.countDocuments({ productType: 'marketplace' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total, active, pending,
        rejected, archived, draft,
        own, marketplace,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT STATUS — admin approves or rejects seller product
export const updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product ${status === 'active' ? 'approved' : status} successfully`,
      data:    product,
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE FEATURED — feature or unfeature a product
export const toggleFeaturedProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product is now ${product.isFeatured ? 'featured' : 'unfeatured'}`,
      data:    product,
    });
  } catch (error) {
    next(error);
  }
};