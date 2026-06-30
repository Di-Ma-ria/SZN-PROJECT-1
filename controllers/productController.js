import mongoose from 'mongoose';
import { Product } from '../models/productModel.js';
import cloudinary from '../config/cloudinary.js';


//PUBLIC ENDPOINTS (No Auth Required)
export const searchProducts = async (req, res, next) => {
  try {
    const {
      q,
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

    if (q) {
      filter.$text = { $search: q };
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (productType) filter.productType = productType;
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating: { 'ratings.average': -1 },
      popular: { 'ratings.count': -1 },
    };

    let sortQuery = sortOptions[sort] || sortOptions.newest;
    if (q) {
      sortQuery = {
        score: { $meta: 'textScore' },
        ...sortQuery,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

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
          { name: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
        ],
      },
      { name: 1, brand: 1, slug: 1, images: 1 }
    )
      .limit(8)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};


// GET ALL PRODUCTS (PUBLIC)
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      productType,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { status: 'active' };
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand) filter.brand = brand;
    if (productType) filter.productType = productType;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== undefined) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.basePrice.$lte = Number(maxPrice);
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT (PUBLIC)
export const getSingleProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
      status: 'active',
    })
      .populate('seller', 'name email')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

//GET PRODUCTS BY CATEGORY
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.params.categoryId)) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const categoryObjectId = new mongoose.Types.ObjectId(req.params.categoryId);
    const categoryExists = await mongoose.connection
      .collection('categories')
      .findOne({ _id: categoryObjectId });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      'price-asc': { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating: { 'ratings.average': -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const filter = { category: categoryObjectId, status: 'active' };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

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
      newest: { createdAt: -1 },
      'price-asc': { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating: { 'ratings.average': -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const filter = { category: category._id, status: 'active' };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
   next(error);
  }
};



// Get featured products
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ status: 'active', isFeatured: true })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Get new arrivals
export const getNewArrivals = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ status: 'active' })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, data: products });
  } catch (error) {
   next(error)
  }
};

// Get deals — products with a discount percentage set
export const getDeals = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      status: 'active',
      discountPercentage: { $gt: 0 },
    })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .sort({ discountPercentage: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Get related products — same category, excluding current product
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },      // exclude the current product
      status: 'active',
    })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .limit(10)
      .sort({ 'ratings.average': -1 }); // show best rated first

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    next(error);
  }
};

// Get products by brand
export const getProductsByBrand = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const sortOptions = {
      newest: { createdAt: -1 },
      'price-asc': { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating: { 'ratings.average': -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const filter = {
      brand: { $regex: req.params.brand, $options: 'i' },
      status: 'active',
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const compareProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Provide 2 to 4 valid product IDs',
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active',
    })
      .populate('category', 'name slug')
      .populate('seller', 'name email');

    if (products.length !== productIds.length) {
      return res.status(404).json({ success: false, message: 'One or more products not found' });
    }

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};


// SELLER ENDPOINTS - Auth + seller/admin/superadmin role
// CREATE PRODUCT
export const createProduct = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    const product = await Product.create({
      ...req.body,
      seller: req.user._id,
      productType: isAdmin ? 'own' : 'marketplace',
      status: isAdmin ? 'active' : 'pending',
      images: req.uploadedImages || [],
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET SELLER'S OWN PRODUCTS
export const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's product status
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

    res.status(200).json({
      success: true,
      data: { total, active, pending, rejected, archived, draft },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductAnalytics = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const analytics = {
      productId: product._id,
      status: product.status,
      basePrice: product.basePrice,
      stock: product.stock,
      discountPercentage: product.discountPercentage,
      ratings: product.ratings,
      isFeatured: product.isFeatured,
    };

    res.status(200).json({ success: true, data: analytics });
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

    const updatedImages =
      req.uploadedImages && req.uploadedImages.length > 0
        ? [...product.images, ...req.uploadedImages]
        : product.images;

    const updatedData = {
      ...req.body,
      images: updatedImages,
    };

    if (!isAdmin) {
      updatedData.status = 'pending';
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Add more images to an existing product
export const addProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: req.uploadedImages } } },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Remove a specific image from a product
export const removeProductImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: 'imageUrl is required' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ 
      success: false, 
      message: 'Product not found' 
    });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if(!product.images.includes(imageUrl)) {
      return res.status(404).json({
        success:false,
        message:"Image not found on this product"
      })
    }

    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const publicIdWithExt = urlParts.slice(uploadIndex +2).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/,''); //strip extension

    await cloudinary.uploader.destroy(publicId);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
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
        message: 'Unauthorized to delete this product',
      });
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

//ADMIN ENDPOINTS - admin/superadmin only
// GET ALL PRODUCTS (ADMIN ONLY)
export const adminGetAllProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email role')        .populate('category', 'name slug')        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending products awaiting approval
export const getPendingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ status: 'pending' })
        .populate('seller', 'name email')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: 1 }),           // oldest first so nothing waits too long
      Product.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT STATUS (ADMIN ONLY)
export const updateProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
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
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Feature or unfeature a product
export const toggleFeaturedProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
   next(error);
  }
};

// Admin product stats overview
export const adminProductStats = async (req, res, next) => {
  try {
    const [total, active, pending, rejected, archived, own, marketplace] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'rejected' }),
      Product.countDocuments({ status: 'archived' }),
      Product.countDocuments({ productType: 'own' }),
      Product.countDocuments({ productType: 'marketplace' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        pending,
        rejected,
        archived,
        own,
        marketplace,
      },
    });
  } catch (error) {
   next(error);
  }
};