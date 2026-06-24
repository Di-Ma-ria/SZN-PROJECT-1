import {Inventory} from '../models/inventoryModel.js';

//get all inventory by admin

export const getAllInventory = async (req, res, next) => {
  try{
    const { lowStock, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;


    const filter = {};
    if(lowStock === 'true') {
      filter.$expr = {$lte: ['$quantity', '$slowStockThreshold']};
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
    record.lastRestockedAt = new date();
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
        messsage: 'Insufficent stock to deduct'
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