
import mongoose            from 'mongoose';
import { Product }         from '../models/productModel.js';
import cloudinary          from '../config/cloudinary.js';
import { convertFromNGN }  from '../utils/convertCurrency.js';
import { Inventory } from '../models/inventoryModel.js';
import { escapeRegex } from '../validation/validate.js';
 
// ─── Pagination guardrails ─────────────────────────────────────
// Public/list endpoints accept a client-supplied `limit`. Without a
// ceiling, a request like ?limit=999999 would force a full collection
// scan/populate on every hit. Cap it here and reuse everywhere.
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const clampLimit = (limit) => {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
};
 
// ─── Internal: add currency display to products ───────────────
const addCurrencyToProduct = async (product, currency) => {
  if (!currency || currency === 'NGN') return product;
 
  const obj        = product.toObject ? product.toObject() : product;
  const basePrice  = obj.basePrice || 0;
 
  try {
    const converted = await convertFromNGN(basePrice, currency);
 
    return {
      ...obj,
      displayPrice: {
        NGN:      basePrice,
        amount:   converted.amount,
        currency: converted.currency,
        symbol:   converted.formatted.replace(/[\d,\.]/g, '').trim(),
        formatted: converted.formatted,
      },
    };
  } catch (err) {
    // Bad/unsupported currency code, rate-service failure, etc.
    // Don't fail the whole request — just fall back to NGN pricing.
    console.error(`Currency conversion failed for "${currency}":`, err.message);
    return obj;
  }
};
 
// PUBLIC ENDPOINTS — No Auth Required
 
// GET ALL PRODUCTS — with filtering, pagination, sorting and currency
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      productType,
      sort     = 'newest',
      page     = 1,
      limit,
      currency = 'NGN', 
    } = req.query;
 
    const filter = { status: 'active' };
 
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand)       filter.brand       = { $regex:escapeRegex(brand), $options: 'i' };
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
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email sellerProfile.storeName')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    // Convert prices to requested currency
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({
      success:  true,
      total,
      page:     Number(page),
      pages:    Math.ceil(total / safeLimit),
      currency,
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
// GET SINGLE PRODUCT — by ID or slug
export const getSingleProduct = async (req, res, next) => {
  try {
    const { id }             = req.params;
    const { currency = 'NGN' } = req.query;
 
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
 
    const data = await addCurrencyToProduct(product, currency);
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
// SEARCH PRODUCTS
export const searchProducts = async (req, res, next) => {
  try {
    const {
      q, category, brand, minPrice, maxPrice,
      productType, sort = 'newest', page = 1,
      limit, currency = 'NGN',
    } = req.query;
 
    const filter = { status: 'active' };
 
    if (q) filter.$text = { $search: q };
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }
    if (brand)       filter.brand       = { $regex:escapeRegex(brand), $options: 'i' };
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
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({
      success: true,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      currency,
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
// SEARCH SUGGESTIONS
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
          { name:  { $regex:escapeRegex(query), $options: 'i' } },
          { brand: { $regex:escapeRegex(query), $options: 'i' } },
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
    const { page = 1, limit, sort = 'newest', currency = 'NGN' } = req.query;
 
    if (!mongoose.Types.ObjectId.isValid(req.params.categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
 
    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };
 
    const filter = {
      category: new mongoose.Types.ObjectId(req.params.categoryId),
      status:   'active',
    };
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({
      success: true, total, currency,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
// GET PRODUCTS BY CATEGORY SLUG
export const getProductsByCategorySlug = async (req, res, next) => {
  try {
    const { page = 1, limit, sort = 'newest', currency = 'NGN' } = req.query;
 
    const category = await mongoose.connection
      .collection('categories')
      .findOne({ slug: req.params.slug });
 
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
 
    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };
 
    const safeLimit = clampLimit(limit);
    const skip   = (Number(page) - 1) * safeLimit;
    const filter = { category: category._id, status: 'active' };
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({
      success: true, total, currency,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
// GET PRODUCTS BY BRAND
export const getProductsByBrand = async (req, res, next) => {
  try {
    const { page = 1, limit, sort = 'newest', currency = 'NGN' } = req.query;
 
    const sortOptions = {
      newest:       { createdAt: -1 },
      'price-asc':  { basePrice: 1 },
      'price-desc': { basePrice: -1 },
      rating:       { 'ratings.average': -1 },
    };
 
    const filter = {
      brand:  { $regex:escapeRegex(req.params.brand), $options: 'i' },
      status: 'active',
    };
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({
      success: true, total, currency,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
// GET FEATURED PRODUCTS
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit, currency = 'NGN' } = req.query;
    const safeLimit = clampLimit(limit);
 
    const products = await Product.find({ status: 'active', isFeatured: true })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .limit(safeLimit)
      .sort({ createdAt: -1 });
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
// GET NEW ARRIVALS
export const getNewArrivals = async (req, res, next) => {
  try {
    const { limit, currency = 'NGN' } = req.query;
    const safeLimit = clampLimit(limit);
 
    const products = await Product.find({ status: 'active' })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(safeLimit);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
// GET DEALS
export const getDeals = async (req, res, next) => {
  try {
    const { limit, currency = 'NGN' } = req.query;
    const safeLimit = clampLimit(limit);
 
    const products = await Product.find({
      status:             'active',
      discountPercentage: { $gt: 0 },
    })
      .populate('seller',   'name email')
      .populate('category', 'name slug')
      .sort({ discountPercentage: -1 })
      .limit(safeLimit);
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
// GET RELATED PRODUCTS
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { currency = 'NGN' } = req.query;
 
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
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
 
    const data = currency !== 'NGN'
      ? await Promise.all(related.map(p => addCurrencyToProduct(p, currency)))
      : related;
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
// COMPARE PRODUCTS
export const compareProducts = async (req, res, next) => {
  try {
    const { productIds }       = req.body;
    const { currency = 'NGN' } = req.query;
 
    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Provide between 2 and 4 product IDs to compare',
      });
    }
 
    const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
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
 
    const data = currency !== 'NGN'
      ? await Promise.all(products.map(p => addCurrencyToProduct(p, currency)))
      : products;
 
    return res.status(200).json({ success: true, currency, data });
  } catch (error) {
    next(error);
  }
};
 
 
// SELLER ENDPOINTS
 
export const createProduct = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
 
    const {
      seller:      _seller,
      images:      _images,
      status:      _status,
      productType: _productType,
      specs,
      ...productData
    } = req.body;
 
    let parsedSpecs;
    if (specs) {
      if (typeof specs === 'string') {
        parsedSpecs = new Map(Object.entries(JSON.parse(specs)));
      } else if (typeof specs === 'object') {
        parsedSpecs = new Map(Object.entries(specs));
      }
    }
 
    const product = await Product.create({
      ...productData,
      seller:      req.user._id,
      images:      req.uploadedImages || [],
      status:      isAdmin ? (req.body.status || 'active') : 'pending',
      productType: isAdmin ? (req.body.productType || 'own') : 'marketplace',
      ...(parsedSpecs && { specs: parsedSpecs }),
    });

        //Give evry non-variant product an inventory record right away
    if(!product.variants || product.variants.length===0) {
      await Inventory.create({
    product: product._id,
    quantity:Number(req.body.stock) || 0,
    });
  }
 
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data:    product,
    });
  } catch (error) {
    next(error);
  }
};
 
export const getMyProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);
 
    return res.status(200).json({
      success: true, total,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data:    products,
    });
  } catch (error) {
    next(error);
  }
};
 
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
 
export const getProductAnalytics = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const query   = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, seller: req.user._id };
 
    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
    }
 
    return res.status(200).json({
      success: true,
      data: {
        productId:          product._id,
        name:               product.name,
        status:             product.status,
        basePrice:          product.basePrice,
      stock:              inventoryRecord ? inventoryRecord.quantity:0,
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
 
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
 
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();
 
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }
 
    if (!isAdmin && req.body.productType === 'own') {
      return res.status(403).json({ success: false, message: 'Sellers cannot set product type to own' });
    }
 
    const { specs, ...restBody } = req.body;
    let parsedSpecs;
    if (specs) {
      if(typeof specs === 'string') {
        parsedSpecs = new Map(Object.entries(JSON.parse(specs)));
      } else if(typeof specs === 'object') {
        parsedSpecs = new Map(Object.entries(specs));
      }
    }
 
    const updatedImages =
      req.uploadedImages && req.uploadedImages.length > 0
        ? [...product.images, ...req.uploadedImages]
        : product.images;
 
    const updatedData = {
      ...restBody,
      images: updatedImages,
      ...(parsedSpecs && { specs: parsedSpecs }),
    };
 
    if (!isAdmin) updatedData.status = 'pending';
 
    // runValidators: true — re-enabled so schema rules (enums, required
    // fields, min/max, etc.) are still enforced on partial updates.
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true, context: 'query' }
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
 
export const addProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
 
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();
 
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
 
    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
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
 
    return res.status(200).json({ success: true, message: 'Images added successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
 
export const removeProductImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
 
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
 
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();
 
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
 
    if (!product.images.includes(imageUrl)) {
      return res.status(404).json({ success: false, message: 'Image not found on this product' });
    }
 
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
 
    return res.status(200).json({ success: true, message: 'Image removed successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
 
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
 
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();
 
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }
 
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
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
 
// UPDATE VARIANT STOCK ← NEW FUNCTION

export const updateVariantStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }
 
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
 
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();
 
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this variant stock' });
    }
 
    const variant = product.variants.find(v => v._id.toString() === req.params.variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }
 
    variant.stock = stock;
    await product.save();
 
    return res.status(200).json({ success: true, message: 'Variant stock updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};
 
// ADMIN ENDPOINTS
 
 
export const adminGetAllProducts = async (req, res, next) => {
  try {
    const { status, productType, page = 1, limit } = req.query;
    const filter = {};
    if (status)      filter.status      = status;
    if (productType) filter.productType = productType;
 
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller',   'name email role')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(safeLimit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);
 
    return res.status(200).json({
      success: true, total,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data:    products,
    });
  } catch (error) {
    next(error);
  }
};
 
export const getPendingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit } = req.query;
    const safeLimit = clampLimit(limit);
    const skip = (Number(page) - 1) * safeLimit;
 
    const [products, total] = await Promise.all([
      Product.find({ status: 'pending' })
        .populate('seller',   'name email')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(safeLimit)
        .sort({ createdAt: 1 }),
      Product.countDocuments({ status: 'pending' }),
    ]);
 
    return res.status(200).json({
      success: true, total,
      page:    Number(page),
      pages:   Math.ceil(total / safeLimit),
      data:    products,
    });
  } catch (error) {
    next(error);
  }
};
 
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
      data: { total, active, pending, rejected, archived, draft, own, marketplace },
    });
  } catch (error) {
    next(error);
  }
};
 
export const updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const product    = await Product.findByIdAndUpdate(
      req.params.id, { status }, { new: true, runValidators: true }
    );
 
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
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
 
export const toggleFeaturedProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
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
 
