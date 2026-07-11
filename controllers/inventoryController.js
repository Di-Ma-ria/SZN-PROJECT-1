import { Inventory } from '../models/inventoryModel.js';

import { Product }   from '../models/productModel.js';

// ADMIN ENDPOINTS — Admin / Superadmin Only

// GET ALL INVENTORY
export const getAllInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, lowStock } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    const [inventory, total] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'name price images status')
        .skip(skip)
        .limit(Number(limit))
        .sort({ quantity: 1 }), // lowest stock first
      Inventory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  inventory,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT INVENTORY
export const getProductInventory = async (req, res, next) => {
  try {
    const record = await Inventory.findOne({ product: req.params.productId })
      .populate('product', 'name price images status');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found for this product',
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// RESTOCK PRODUCT — admin adds stock
export const restockProduct = async (req, res, next) => {
  try {
    const { quantity, lowStockThreshold } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }

    // Find or create inventory record for this product
    let record = await Inventory.findOne({ product: req.params.productId });
    if (!record) {
      record = new Inventory({ product: req.params.productId, quantity: 0 });
    }

    record.quantity        += Number(quantity);
    record.lastRestockedAt  = new Date();
    if (lowStockThreshold !== undefined) {
      record.lowStockThreshold = lowStockThreshold;
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Stock updated. New quantity: ${record.quantity}`,
      data:    record,
    });
  } catch (error) {
    next(error);
  }
};

// DEDUCT STOCK — admin manual adjustment
export const deductStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const record = await Inventory.findOne({ product: req.params.productId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
      });
    }

    if (record.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock to deduct',
      });
    }

    record.quantity -= Number(quantity);
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Stock deducted. Remaining: ${record.quantity}`,
      data:    record,
    });
  } catch (error) {
    next(error);
  }
};

// GET LOW STOCK ALERTS
export const getLowStockAlerts = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).populate('product', 'name price images');

    return res.status(200).json({
      success: true,
      count: items.length,
      data:  items,
    });
  } catch (error) {
    next(error);
  }
};


// GET LOW STOCK PRODUCTS — returns product details for low stock items
export const getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).populate('product', 'name price images brand category status');

    const products = lowStockItems.map((item) => ({
      inventoryId:       item._id,
      product:           item.product,
      quantity:          item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      lastRestockedAt:   item.lastRestockedAt,
    }));

    return res.status(200).json({
      success: true,
      count: products.length,
      data:  products,
    });
  } catch (error) {
    next(error); // 
  }
};


// UPDATE PRODUCT STOCK — seller or admin updates base product stock
export const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative number',
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
        message: 'Not authorized to update this product stock',
      });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
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


// UPDATE VARIANT STOCK — seller or admin updates a specific variant stock
export const updateVariantStock = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative number',
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

    variant.stock = stock;
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