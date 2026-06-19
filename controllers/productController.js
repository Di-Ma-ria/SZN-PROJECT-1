import { Product } from '../models/productModel.js';

// CREATE PRODUCT
export const createProduct = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    const product = await Product.create({
      ...req.body,
      seller: req.user._id,
      productType: isAdmin ? 'Own' : 'Marketplace',
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
    if (category) filter.category = category;
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
    }).populate('seller', 'name email');

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

// GET SELLER'S OWN PRODUCTS
export const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
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

    const updatedImages =
      req.uploadedImages && req.uploadedImages.length > 0
        ? [...product.images, ...req.uploadedImages]
        : product.images;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images: updatedImages },
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
        .populate('seller', 'name email role')
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