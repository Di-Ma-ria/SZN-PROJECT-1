import {Inventory} from '../models/inventoryModel.js';
import { Product } from '../models/productModel.js';

//get all inventory by admin

export const getAllInventory = async (req, res, next) => {
  try{
    const { lowStock, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;


    const filter = {};
    if(lowStock === 'true') {
      filter.$expr = {$lte: ['$quantity', '$lowStockThreshold']};
    }

    const inventory = await Inventory.find(filter)
      .populate('product', 'name price images')
      .skip(skip)
      .limit(Number(limit))
      .sort({quantity: 1 });

      const total = await Inventory.countDocuments(filter);

      return res.json({
        success: true,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        total,
        inventory,
      });
  } catch(error) {
    next(error);
  }
};


// get one product's Inventory

export const getProductInventory = async (req, res, next) => {
  try{
    const record = await Inventory.findOne({product: req.params.productId})
      .populate('product', 'name price');
      
    if(!record) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    return res.json({
      success: true,
      inventory: record
    });
  } catch (error) {
    next(error);
  }
};


// restock by an admin

export const restockProduct = async (req, res, next) =>{
  try{
    const {quantity, lowStockThreshold} = req.body;

    if(! quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    //find or create inventory record for this product

    let record = await Inventory.findOne({product: req.params.productId})
    if(!record) {
      record = new Inventory({product: req.params.productId, quantity: 0});
    }

    record.quantity += Number(quantity);
    record.lastRestockedAt = new Date();
    if(lowStockThreshold !== undefined) record.lowStockThreshold = lowStockThreshold;

    await record.save();

    return res.json({
      success: true,
      message: `Stock updated. New quantity: ${record.quantity}`,
      inventory: record,
    });
  } catch (error) {
    next(error);
  }
};


//deduct stock (admin manual adjustment)

export const deductStock = async (req, res, next) => {
  try{
    const {quantity} = req.body;


    const record = await Inventory.findOne({product: req.params.productId});
    if(!record){
      return res.status(404).json({
        success: false, 
        message: 'Inventory record not found'
      });
    }

    if (record.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficent stock to deduct'
      });
    }

    record.quantity -= Number(quantity);
    await record.save();

    return res.json({
      success: true,
      message: `Stock deducted. Remaining: ${record.quantity}`,
      inventory: record,
    });
  } catch (error){
    next (error);
  }
};


//get low stock alert 

export const getLowStockAlerts = async (req, res, next) => {
  try{
    const items = await Inventory.find({
      $expr: {$lte: ['$quantity', '$lowStockThreshold']},
    }).populate('product', 'name price');


    return res.json({
      success: true,
      count: items.length,
      inventory: items,
    });
  } catch (error){
    next(error);
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10, limit = 50 } = req.query;

    const products = await Product.find({
      status: 'active',
      stock: { $lte: Number(threshold) },
    })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .sort({ stock: 1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update stock for base product (no variants)
export const updateStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: req.body.stock },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update stock for a specific variant
export const updateVariantStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = product.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const variant = product.variants.find(
      (v) => v._id.toString() === req.params.variantId
    );
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    variant.stock = req.body.stock;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};