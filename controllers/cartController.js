import { Cart }    from '../models/cartModel.js';

import { Product } from '../models/productModel.js';

// GET CART 
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price salePrice images stock brand status');

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        cart: { items: [], totalPrice: 0, totalItems: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// ADD TO CART 

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product exists and is active
    const product = await Product.findOne({
      _id:    productId,
      status: 'active',
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available',
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Sellers cannot buy their own products
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot add your own product to cart',
      });
    }

    // Get effective price
    const effectivePrice = product.salePrice ?? product.basePrice;

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // Update quantity if already in cart
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more. Only ${product.stock - existingItem.quantity} more available`,
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.price    = effectivePrice;
    } else {
      // Add new item to cart
      cart.items.push({
        product:  productId,
        quantity,
        price:    effectivePrice,
        name:     product.name,
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand');

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE CART ITEM QUANTITY 

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity }  = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand');

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

//REMOVE FROM CART 

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand');

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// CLEAR CART 

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    next(error);
  }
};